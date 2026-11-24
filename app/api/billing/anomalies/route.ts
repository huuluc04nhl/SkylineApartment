import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { extractUserIdFromToken, findUserStore } from '@/lib/userStore';
import { skylineDb } from '@/lib/db';
import { detectBillingAnomalies } from '@/lib/billingAnomalyEngine';

export const runtime = 'nodejs';

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

export async function GET(req: Request) {
  try {
    const admin = authenticateAdmin(req);
    if (!admin) {
      return NextResponse.json(
        { success: false, message: 'Quyền truy cập bị từ chối. Tính năng chỉ dành riêng cho Ban Quản Lý (Admin).' },
        { status: 403 }
      );
    }

    const bills = skylineDb.bills.find();
    const anomalies = detectBillingAnomalies(bills, bills);

    return NextResponse.json({
      success: true,
      total_scanned_bills: bills.length,
      anomaly_count: anomalies.length,
      high_severity_count: anomalies.filter(a => a.severity === 'HIGH').length,
      medium_severity_count: anomalies.filter(a => a.severity === 'MEDIUM').length,
      low_severity_count: anomalies.filter(a => a.severity === 'LOW').length,
      anomalies,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err?.message || 'Lỗi quét kiểm tra bất thường.' },
      { status: 500 }
    );
  }
}

