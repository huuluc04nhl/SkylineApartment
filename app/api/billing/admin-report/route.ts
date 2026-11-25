import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getAuthenticatedUser } from '@/lib/server/auth';
import { skylineDb } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function authenticateAdmin() {
  const session = await getAuthenticatedUser();
  if (!session || session.role !== 'ADMIN') return null;
  return session.profile;
}

const QuerySchema = z.object({
  query: z.string().min(2, 'Câu hỏi quá ngắn')
});

// Tool implementations (Deterministic, pure code calculations)
function queryTowerDebtSummary(towerCode?: string) {
  const allBills = skylineDb.bills.find();
  const targetTower = towerCode ? towerCode.toUpperCase().trim() : null;

  const towers = ['BS-07', 'BS-08', 'BS-09', 'BS-10'];
  const relevantTowers = targetTower && towers.includes(targetTower) ? [targetTower] : towers;

  const result = relevantTowers.map(tower => {
    const towerBills = allBills.filter(b => b.apartment_code.startsWith(tower) || (tower === 'BS-08' && b.apartment_code === 'CH-06'));
    const totalBilled = towerBills.reduce((s, b) => s + b.total_amount, 0);
    const paidBills = towerBills.filter(b => b.status === 'Paid');
    const totalCollected = paidBills.reduce((s, b) => s + b.total_amount, 0);
    const totalDebt = totalBilled - totalCollected;
    const rate = totalBilled > 0 ? ((totalCollected / totalBilled) * 100).toFixed(1) + '%' : '0%';

    return {
      tower,
      total_units: towerBills.length,
      total_billed: totalBilled,
      total_collected: totalCollected,
      total_debt: totalDebt,
      collection_rate: rate,
      unpaid_count: towerBills.length - paidBills.length
    };
  });

  return {
    towers: result,
    summary: {
      total_billed: result.reduce((s, r) => s + r.total_billed, 0),
      total_collected: result.reduce((s, r) => s + r.total_collected, 0),
      total_debt: result.reduce((s, r) => s + r.total_debt, 0),
    }
  };
}

function queryTopDebtors(limit: number = 5) {
  const allBills = skylineDb.bills.find();
  const unpaid = allBills.filter(b => b.status === 'Unpaid');

  // Aggregate by apartment
  const aptMap = new Map<string, { apt_code: string; owner_name: string; total_debt: number; bill_count: number; oldest_due_date: string }>();

  for (const b of unpaid) {
    const existing = aptMap.get(b.apartment_code) || {
      apt_code: b.apartment_code,
      owner_name: maskName(b.owner_name),
      total_debt: 0,
      bill_count: 0,
      oldest_due_date: b.due_date
    };
    existing.total_debt += b.total_amount;
    existing.bill_count += 1;
    if (new Date(b.due_date) < new Date(existing.oldest_due_date)) {
      existing.oldest_due_date = b.due_date;
    }
    aptMap.set(b.apartment_code, existing);
  }

  const sorted = Array.from(aptMap.values())
    .sort((a, b) => b.total_debt - a.total_debt)
    .slice(0, limit);

  return sorted.map((d, index) => {
    const daysOverdue = Math.max(0, Math.floor((Date.now() - new Date(d.oldest_due_date).getTime()) / (1000 * 60 * 60 * 24)));
    return {
      rank: index + 1,
      apt_code: d.apt_code,
      owner_masked: d.owner_name,
      total_debt: d.total_debt,
      unpaid_periods: d.bill_count,
      days_overdue: daysOverdue,
      urgency: daysOverdue > 15 ? 'CAO (Cần cắt dịch vụ)' : daysOverdue > 5 ? 'TRUNG BÌNH' : 'NHẸ'
    };
  });
}

function maskName(name: string): string {
  if (!name) return 'Cư Dân';
  const parts = name.trim().split(' ');
  if (parts.length <= 1) return name;
  return parts[0] + ' *** ' + parts[parts.length - 1];
}

export async function POST(req: Request) {
  try {
    const admin = await authenticateAdmin();
    if (!admin) {
      return NextResponse.json(
        { success: false, message: 'Quyền truy cập bị từ chối. Tính năng chỉ dành riêng cho Ban Quản Lý (Admin).' },
        { status: 403 }
      );
    }

    const json = await req.json();
    const parsed = QuerySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ success: false, message: 'Câu hỏi không hợp lệ' }, { status: 400 });
    }

    const { query } = parsed.data;
    const lowerQuery = query.toLowerCase();

    // Natural Language Tool Routing
    if (lowerQuery.includes('top') || lowerQuery.includes('nợ lâu') || lowerQuery.includes('nợ nhiều') || lowerQuery.includes('con nợ') || lowerQuery.includes('chưa nộp')) {
      const matchNum = lowerQuery.match(/\b([1-9]|10)\b/);
      const limit = matchNum ? parseInt(matchNum[1], 10) : 5;
      const debtors = queryTopDebtors(limit);

      const headers = ['Hạng', 'Căn Hộ', 'Chủ Hộ', 'Tổng Nợ (VNĐ)', 'Số Kỳ', 'Quá Hạn (Ngày)', 'Mức Độ'];
      const rows = debtors.map(d => [
        `#${d.rank}`,
        d.apt_code,
        d.owner_masked,
        d.total_debt.toLocaleString('vi-VN') + ' đ',
        `${d.unpaid_periods} kỳ`,
        `${d.days_overdue} ngày`,
        d.urgency
      ]);

      const totalDebtTop = debtors.reduce((s, d) => s + d.total_debt, 0);

      const text = `Dưới đây là danh sách **Top ${debtors.length} căn hộ còn công nợ lớn nhất** tại Skyline Smart Residence (Dữ liệu chốt sổ thời gian thực):\n\n` +
        `- Tổng số tiền công nợ nhóm này: **${totalDebtTop.toLocaleString('vi-VN')} đ**.\n` +
        `- Đã che thông tin cá nhân nhạy cảm theo tiêu chuẩn bảo mật dữ liệu cư dân.\n` +
        `- Khuyến nghị: Ban Quản lý nên phát lệnh nhắc nợ cấp độ tương ứng theo số ngày quá hạn.`;

      return NextResponse.json({
        success: true,
        tool_called: 'getTopDebtors',
        answer: text,
        table: { headers, rows },
        ai_disclaimer: 'Nội dung do AI hỗ trợ tổng hợp từ cơ sở dữ liệu hệ thống, vui lòng đối chiếu sổ kế toán gốc.'
      });
    }

    // Default: Tower Debt Summary / Specific Tower
    let towerHint: string | undefined = undefined;
    if (lowerQuery.includes('bs-07') || lowerQuery.includes('bs07')) towerHint = 'BS-07';
    else if (lowerQuery.includes('bs-08') || lowerQuery.includes('bs08')) towerHint = 'BS-08';
    else if (lowerQuery.includes('bs-09') || lowerQuery.includes('bs09')) towerHint = 'BS-09';
    else if (lowerQuery.includes('bs-10') || lowerQuery.includes('bs10')) towerHint = 'BS-10';

    const debtData = queryTowerDebtSummary(towerHint);

    const headers = ['Tòa Tháp', 'Số Căn', 'Tổng Phải Thu', 'Đã Thu Được', 'Còn Nợ', 'Tỷ Lệ Thu Hồi', 'Số Căn Chưa Nộp'];
    const rows = debtData.towers.map(t => [
      t.tower,
      `${t.total_units} căn`,
      t.total_billed.toLocaleString('vi-VN') + ' đ',
      t.total_collected.toLocaleString('vi-VN') + ' đ',
      t.total_debt.toLocaleString('vi-VN') + ' đ',
      t.collection_rate,
      `${t.unpaid_count} căn`
    ]);

    const targetDesc = towerHint ? `tòa **${towerHint}**` : `toàn bộ các tòa tháp **BS-07, BS-08, BS-09, BS-10**`;
    const rateOverall = debtData.summary.total_billed > 0 
      ? ((debtData.summary.total_collected / debtData.summary.total_billed) * 100).toFixed(1) + '%'
      : '0%';

    const text = `Báo cáo công nợ & tiến độ thu phí ${targetDesc}:\n\n` +
      `- Tổng số tiền đã phát hành: **${debtData.summary.total_billed.toLocaleString('vi-VN')} đ**\n` +
      `- Tổng số tiền đã thu hồi: **${debtData.summary.total_collected.toLocaleString('vi-VN')} đ** (${rateOverall})\n` +
      `- Tổng công nợ còn tồn đọng: **${debtData.summary.total_debt.toLocaleString('vi-VN')} đ**\n\n` +
      `Bảng thống kê chi tiết theo từng block căn hộ hiển thị bên dưới:`;

    return NextResponse.json({
      success: true,
      tool_called: 'getTowerDebtSummary',
      answer: text,
      table: { headers, rows },
      ai_disclaimer: 'Nội dung do AI hỗ trợ tổng hợp từ cơ sở dữ liệu hệ thống, vui lòng đối chiếu sổ kế toán gốc.'
    });

  } catch (err: any) {
    console.error('Admin Report API error:', err);
    return NextResponse.json(
      { success: false, message: 'Lỗi truy vấn báo cáo: ' + (err.message || 'Lỗi không xác định') },
      { status: 500 }
    );
  }
}
