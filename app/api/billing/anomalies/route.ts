import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/guard';
import { listBillsWithDetailsDb } from '@/lib/server/billingDb';
import { detectBillingAnomalies } from '@/lib/billingAnomalyEngine';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const guard = await requireAuth(['ADMIN']);
    if (!guard.ok) return guard.response;

    const bills = await listBillsWithDetailsDb();
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

