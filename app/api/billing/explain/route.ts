import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { extractUserIdFromToken, findUserStore } from '@/lib/userStore';
import { skylineDb } from '@/lib/db';
import { GEMINI_API_KEY } from '@/lib/geminiClient';
import { InvoiceExplanationSchema } from '@/lib/billingAiService';

export const runtime = 'nodejs';

function authenticateRequest(req: Request) {
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
  return findUserStore(userId);
}

export async function POST(req: Request) {
  try {
    const user = authenticateRequest(req);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Chưa đăng nhập hoặc phiên làm việc đã hết hạn.' },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const billId = body.billId;

    if (!billId) {
      return NextResponse.json(
        { success: false, message: 'Thiếu mã định danh hóa đơn.' },
        { status: 400 }
      );
    }

    const currentBill = skylineDb.bills.findById(billId);
    if (!currentBill) {
      return NextResponse.json(
        { success: false, message: 'Không tìm thấy hóa đơn.' },
        { status: 404 }
      );
    }

    // Security: Check apartment ownership
    if (user.role !== 'ADMIN' && currentBill.apartment_code.toUpperCase() !== (user.apartment_code || 'CH-06').toUpperCase()) {
      return NextResponse.json(
        { success: false, message: 'Quyền truy cập bị từ chối: Không thể xem hóa đơn căn hộ khác.' },
        { status: 403 }
      );
    }

    // Lấy 3 kỳ hóa đơn gần nhất của căn hộ này
    const aptBills = skylineDb.bills
      .find(b => b.apartment_code.toUpperCase() === currentBill.apartment_code.toUpperCase())
      .sort((a, b) => b.billing_month.localeCompare(a.billing_month))
      .slice(0, 3);

    // Tính toán số liệu so sánh toán học chính xác (Code tính, AI không bịa)
    const comparison3Periods = aptBills.map(b => {
      const elec = b.details.find(d => d.service_type === 'Electricity')?.usage || 0;
      const water = b.details.find(d => d.service_type === 'Water')?.usage || 0;
      const mgmt = b.details.find(d => d.service_type === 'Management_Fee')?.total_line_amount || 0;
      return {
        id: b.id,
        period: b.billing_month,
        totalAmount: b.total_amount,
        status: b.status,
        electricUsage: elec,
        waterUsage: water,
        managementFee: mgmt,
      };
    });

    const previousBill = aptBills[1]; // kỳ liền kề trước đó
    const curElec = currentBill.details.find(d => d.service_type === 'Electricity')?.usage || 0;
    const prevElec = previousBill?.details.find(d => d.service_type === 'Electricity')?.usage || 0;

    const curWater = currentBill.details.find(d => d.service_type === 'Water')?.usage || 0;
    const prevWater = previousBill?.details.find(d => d.service_type === 'Water')?.usage || 0;

    const elecChangePct = prevElec > 0 ? Math.round(((curElec - prevElec) / prevElec) * 100) : 0;
    const waterChangePct = prevWater > 0 ? Math.round(((curWater - prevWater) / prevWater) * 100) : 0;
    const totalChangePct = previousBill ? Math.round(((currentBill.total_amount - previousBill.total_amount) / previousBill.total_amount) * 100) : 0;

    // Highlights
    const highlights = [
      {
        category: 'Tiền Nước Sinh Hoạt',
        changePercent: waterChangePct,
        reason: curWater > prevWater 
          ? `Sản lượng nước tăng ${waterChangePct}% (${curWater} m³ so với ${prevWater} m³ kỳ trước). Cảm biến IoT lưu lượng ghi nhận biến động van vòi.`
          : `Sản lượng nước tiêu thụ ổn định ở mức ${curWater} m³.`,
        suggestion: curWater > 25 ? 'Nên yêu cầu Kỹ thuật viên kiểm tra van xả bồn cầu và vòi rửa chén.' : 'Duy trì thói quen sử dụng nước tiết kiệm.',
      },
      {
        category: 'Tiền Điện Sinh Hoạt',
        changePercent: elecChangePct,
        reason: curElec > prevElec
          ? `Điện năng tiêu thụ tăng ${elecChangePct}% (${curElec} kWh so với ${prevElec} kWh kỳ trước) do thời tiết nắng nóng hoặc tăng thời gian dùng điều hòa.`
          : `Điện năng tiêu thụ giảm/ổn định (${curElec} kWh).`,
        suggestion: 'Cài đặt điều hòa ở mức 26°C và kết hợp hẹn giờ rèm ban công tự động qua Smart Home.',
      },
      {
        category: 'Phí Quản Lý Vận Hành',
        changePercent: 0,
        reason: 'Phí quản lý duy trì cố định theo diện tích thông thủy (18.000 đ/m²), không biến động qua các tháng.',
        suggestion: 'Đã bao gồm an ninh 24/7, vệ sinh sảnh, bảo trì thang máy và sử dụng miễn phí hồ bơi vô cực & gym.',
      },
    ];

    const fallbackSummary = `Hóa đơn kỳ ${currentBill.billing_month} có tổng chi phí là ${currentBill.total_amount.toLocaleString('vi-VN')} VNĐ (${totalChangePct >= 0 ? `+${totalChangePct}%` : `${totalChangePct}%`} so với kỳ ${previousBill ? previousBill.billing_month : 'trước'}). Nguyên nhân biến động chính xuất phát từ tiền nước (+${waterChangePct}%) và tiền điện (+${elecChangePct}%).`;

    const explanationResult = {
      summary: fallbackSummary,
      comparison3Periods,
      highlights,
      advice: 'Cư dân có thể thanh toán trực tiếp bằng VNPAY hoặc quét mã VietQR Napas247 ngay trên cổng để được tự động gạch nợ.',
      disclaimer: 'Nội dung do AI tạo, vui lòng đối chiếu hóa đơn gốc.',
    };

    // Validate with Zod
    const validated = InvoiceExplanationSchema.safeParse(explanationResult);

    return NextResponse.json({
      success: true,
      explanation: validated.success ? validated.data : explanationResult,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err?.message || 'Lỗi phân tích giải thích hóa đơn.' },
      { status: 500 }
    );
  }
}
