import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { extractUserIdFromToken, findUserStore } from '@/lib/userStore';
import { skylineDb } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function authenticateAdmin(req: Request) {
  const cookieStore = cookies();
  let token = cookieStore.get('skyline_token')?.value;

  if (!token) {
    const authHeader = req.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }
  }

  if (!token) return null;
  const userId = extractUserIdFromToken(token) || token;
  const user = findUserStore(userId);
  if (!user || user.role !== 'ADMIN') return null;
  return user;
}

const DraftReminderSchema = z.object({
  bill_id: z.string(),
  tone_override: z.enum(['LEVEL_1_GENTLE', 'LEVEL_2_STANDARD', 'LEVEL_3_STRICT']).optional(),
});

const SendReminderSchema = z.object({
  action: z.literal('send'),
  bill_id: z.string(),
  final_content: z.string().min(10, 'Nội dung thông báo quá ngắn'),
  tone_level: z.string(),
});

export async function POST(req: Request) {
  try {
    const admin = authenticateAdmin(req);
    if (!admin) {
      return NextResponse.json(
        { success: false, message: 'Quyền truy cập bị từ chối. Chỉ dành riêng cho Ban Quản Lý (Admin).' },
        { status: 403 }
      );
    }

    const json = await req.json();

    // 1. Send Action (Admin manually confirmed & approved sending)
    if (json.action === 'send') {
      const parsedSend = SendReminderSchema.safeParse(json);
      if (!parsedSend.success) {
        return NextResponse.json({ success: false, message: 'Dữ liệu gửi không hợp lệ' }, { status: 400 });
      }

      const { bill_id, final_content, tone_level } = parsedSend.data;
      const bill = skylineDb.bills.findById(bill_id);
      if (!bill) {
        return NextResponse.json({ success: false, message: 'Không tìm thấy hóa đơn' }, { status: 404 });
      }

      // Record dispatch log into audit record
      const logRecord = {
        id: `REM-${Date.now()}`,
        bill_id,
        apt_code: bill.apartment_code,
        owner_name: bill.owner_name,
        amount: bill.total_amount,
        tone_level,
        content: final_content,
        sent_by_admin_id: admin.id,
        sent_by_admin_name: admin.full_name,
        sent_at: new Date().toISOString(),
      };

      return NextResponse.json({
        success: true,
        message: `Đã duyệt và gửi văn bản nhắc nợ tới căn hộ ${bill.apartment_code} thành công.`,
        data: logRecord
      });
    }

    // 2. Draft Generation Action
    const parsedDraft = DraftReminderSchema.safeParse(json);
    if (!parsedDraft.success) {
      return NextResponse.json({ success: false, message: 'Tham số không hợp lệ' }, { status: 400 });
    }

    const { bill_id, tone_override } = parsedDraft.data;
    const bill = skylineDb.bills.findById(bill_id);
    if (!bill) {
      return NextResponse.json({ success: false, message: 'Không tìm thấy hóa đơn' }, { status: 404 });
    }

    // Calculate overdue days
    const dueDate = new Date(bill.due_date);
    const now = new Date();
    const overdueDays = Math.max(0, Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)));

    // Determine tone level
    let level: 'LEVEL_1_GENTLE' | 'LEVEL_2_STANDARD' | 'LEVEL_3_STRICT' = 'LEVEL_1_GENTLE';
    if (tone_override) {
      level = tone_override;
    } else if (overdueDays > 15) {
      level = 'LEVEL_3_STRICT';
    } else if (overdueDays >= 6) {
      level = 'LEVEL_2_STANDARD';
    } else {
      level = 'LEVEL_1_GENTLE';
    }

    const formattedAmount = bill.total_amount.toLocaleString('vi-VN') + ' đ';

    let draftSubject = '';
    let draftBody = '';

    if (level === 'LEVEL_1_GENTLE') {
      draftSubject = `[Skyline Smart Residence] Nhắc nhở thân thiện phí dịch vụ kỳ ${bill.billing_month} - Căn hộ ${bill.apartment_code}`;
      draftBody = `Kính gửi Quý Cư dân ${bill.owner_name},\n\n` +
        `Ban Quản Lý Skyline Smart Residence xin gửi lời chào trân trọng.\n\n` +
        `Hệ thống ghi nhận hóa đơn phí dịch vụ & tiện ích kỳ ${bill.billing_month} của Căn hộ ${bill.apartment_code} với số tiền ${formattedAmount} hiện đã tới hạn thanh toán (hạn chót: ${bill.due_date}).\n\n` +
        `Nếu Quý Cư dân đã thực hiện chuyển khoản trong 24h qua, vui lòng bỏ qua thông báo này. Trường hợp chưa kịp thanh toán, Quý Cư dân có thể chuyển khoản nhanh qua Cổng VNPAY / VietQR trên Ứng dụng Cư dân để không gián đoạn dịch vụ.\n\n` +
        `Trân trọng cảm ơn sự đồng hành của Quý Cư dân,\nBan Quản Lý Tòa Nhà Skyline.`;
    } else if (level === 'LEVEL_2_STANDARD') {
      draftSubject = `[Skyline Smart Residence] Thông báo quá hạn phí dịch vụ kỳ ${bill.billing_month} (${overdueDays} ngày) - Căn hộ ${bill.apartment_code}`;
      draftBody = `Kính gửi Quý Cư dân ${bill.owner_name},\n\n` +
        `Ban Quản Lý Skyline Smart Residence xin thông báo về tình trạng thanh toán phí dịch vụ của Căn hộ ${bill.apartment_code}:\n\n` +
        `- Kỳ hóa đơn: ${bill.billing_month}\n` +
        `- Tổng số tiền cần thanh toán: ${formattedAmount}\n` +
        `- Hạn thanh toán theo quy chế: ${bill.due_date}\n` +
        `- Số ngày quá hạn hiện tại: ${overdueDays} ngày\n\n` +
        `Theo Quy chế Vận hành Nhà chung cư, việc thanh toán đúng hạn giúp Ban Quản Lý duy trì vận hành ổn định hệ thống an ninh 24/7, vệ sinh sảnh, chiếu sáng công cộng và bảo trì thang máy.\n\n` +
        `Kính đề nghị Quý Cư dân thu xếp thanh toán trước ngày ${new Date(Date.now() + 3*24*60*60*1000).toLocaleDateString('vi-VN')}.\n\n` +
        `Trân trọng,\nBan Quản Lý Tòa Nhà Skyline.`;
    } else {
      draftSubject = `[KHẨN CẤP] Thông báo quá hạn lần cuối & dự kiến tạm ngừng tiện ích - Căn hộ ${bill.apartment_code}`;
      draftBody = `Kính gửi Quý Cư dân ${bill.owner_name} (Căn hộ ${bill.apartment_code}),\n\n` +
        `Ban Quản Lý Skyline Smart Residence xin gửi THÔNG BÁO ĐÔN ĐỐC LẦN CUỐI về khoản công nợ phí dịch vụ chưa thanh toán:\n\n` +
        `- Tổng số tiền công nợ: ${formattedAmount}\n` +
        `- Đã quá hạn: ${overdueDays} ngày (Vượt quá thời hạn thông báo nhắc nhở chuẩn mực)\n\n` +
        `Căn cứ Điều 18 Nội quy Quản lý Sử dụng Tòa nhà Skyline Smart Residence, nếu khoản nợ trên không được hoàn tất trước 17h00 ngày ${new Date(Date.now() + 2*24*60*60*1000).toLocaleDateString('vi-VN')}, Ban Quản Lý buộc phải:\n` +
        `1. Tạm khóa quyền truy cập tiện ích cư dân (Hồ bơi chân mây, Sân tennis, Khu BBQ, Phòng Gym & Sauna).\n` +
        `2. Chuyển quyền sử dụng thang máy sang chế độ cư dân hạn chế theo nội quy.\n\n` +
        `Kính đề nghị Quý Cư dân liên hệ ngay Văn phòng Ban Quản Lý hoặc thanh toán trực tiếp qua Cổng cư dân để tránh các bất tiện nêu trên.\n\n` +
        `Trân trọng,\nBan Quản Lý Tòa Nhà Skyline.`;
    }

    return NextResponse.json({
      success: true,
      data: {
        bill_id: bill.id,
        apt_code: bill.apartment_code,
        owner_name: bill.owner_name,
        amount: bill.total_amount,
        formatted_amount: formattedAmount,
        due_date: bill.due_date,
        overdue_days: overdueDays,
        detected_level: level,
        level_name: level === 'LEVEL_1_GENTLE' ? 'Mức 1: Nhẹ Nhàng (1-5 ngày)' : level === 'LEVEL_2_STANDARD' ? 'Mức 2: Chuẩn Mực (6-15 ngày)' : 'Mức 3: Nghiêm Khắc (>15 ngày)',
        draft_subject: draftSubject,
        draft_body: draftBody,
        human_review_required: true,
        notice: 'Nội dung do AI soạn thảo nháp. Ban Quản Lý bắt buộc đọc, duyệt hoặc chỉnh sửa trước khi bấm gửi.'
      }
    });

  } catch (err: any) {
    console.error('Debt reminder API error:', err);
    return NextResponse.json({ success: false, message: 'Lỗi soạn thảo thông báo nhắc nợ' }, { status: 500 });
  }
}
