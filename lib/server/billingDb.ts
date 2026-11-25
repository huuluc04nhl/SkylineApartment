import 'server-only';
import { supabaseAdmin } from '@/lib/supabase/admin';
import type { BillRecord, MeterReadingRecord } from '@/lib/db/schema';

export async function listBillsWithDetailsDb(aptCode?: string): Promise<BillRecord[]> {
  let billsQuery = supabaseAdmin
    .from('bills')
    .select('*')
    .order('created_at', { ascending: false });

  if (aptCode) {
    billsQuery = billsQuery.ilike('apartment_code', aptCode.trim());
  }

  const [{ data: bills, error: billsErr }, { data: details, error: detailsErr }] = await Promise.all([
    billsQuery,
    supabaseAdmin.from('bill_details').select('*'),
  ]);

  if (billsErr) throw new Error(`Supabase bills select error: ${billsErr.message}`);
  if (detailsErr) throw new Error(`Supabase bill_details select error: ${detailsErr.message}`);

  const detailsByBill = new Map<string, BillRecord['details']>();
  for (const d of details || []) {
    const arr = detailsByBill.get(d.bill_id) || [];
    arr.push({
      id: d.id,
      bill_id: d.bill_id,
      service_type: d.service_type,
      service_name: d.service_name,
      usage: d.usage ?? undefined,
      unit: d.unit ?? undefined,
      unit_price: d.unit_price ?? undefined,
      total_line_amount: d.total_line_amount,
      ai_anomaly: d.ai_anomaly ?? false,
      anomaly_reason: d.anomaly_reason ?? undefined,
    });
    detailsByBill.set(d.bill_id, arr);
  }

  return (bills || []).map((b) => ({
    id: b.id,
    apartment_code: b.apartment_code,
    owner_name: b.owner_name,
    billing_month: b.billing_month,
    due_date: b.due_date,
    total_amount: b.total_amount,
    status: (b.status || 'Unpaid') as BillRecord['status'],
    payment_method: (b.payment_method as BillRecord['payment_method']) ?? null,
    transaction_ref: b.transaction_ref ?? null,
    payment_qr_url: b.payment_qr_url ?? undefined,
    invoice_pdf_url: b.invoice_pdf_url ?? undefined,
    has_ai_anomaly: Boolean(b.has_ai_anomaly),
    created_at: b.created_at ?? undefined,
    paid_at: b.paid_at ?? null,
    details: detailsByBill.get(b.id) || [],
  }));
}

export async function getBillWithDetailsByIdDb(billId: string): Promise<BillRecord | null> {
  const { data: b, error: billErr } = await supabaseAdmin
    .from('bills')
    .select('*')
    .eq('id', billId)
    .maybeSingle();

  if (billErr) throw new Error(`Supabase bill select error: ${billErr.message}`);
  if (!b) return null;

  const { data: details, error: detailsErr } = await supabaseAdmin
    .from('bill_details')
    .select('*')
    .eq('bill_id', b.id);

  if (detailsErr) throw new Error(`Supabase bill_details select error: ${detailsErr.message}`);

  return {
    id: b.id,
    apartment_code: b.apartment_code,
    owner_name: b.owner_name,
    billing_month: b.billing_month,
    due_date: b.due_date,
    total_amount: b.total_amount,
    status: (b.status || 'Unpaid') as BillRecord['status'],
    payment_method: (b.payment_method as BillRecord['payment_method']) ?? null,
    transaction_ref: b.transaction_ref ?? null,
    payment_qr_url: b.payment_qr_url ?? undefined,
    invoice_pdf_url: b.invoice_pdf_url ?? undefined,
    has_ai_anomaly: Boolean(b.has_ai_anomaly),
    created_at: b.created_at ?? undefined,
    paid_at: b.paid_at ?? null,
    details: (details || []).map((d) => ({
      id: d.id,
      bill_id: d.bill_id,
      service_type: d.service_type,
      service_name: d.service_name,
      usage: d.usage ?? undefined,
      unit: d.unit ?? undefined,
      unit_price: d.unit_price ?? undefined,
      total_line_amount: d.total_line_amount,
      ai_anomaly: d.ai_anomaly ?? false,
      anomaly_reason: d.anomaly_reason ?? undefined,
    })),
  };
}

export async function listMeterReadingsDb(
  aptCode: string,
  meterType: 'ELECTRIC' | 'WATER'
): Promise<MeterReadingRecord[]> {
  const { data, error } = await supabaseAdmin
    .from('meter_readings')
    .select('*')
    .eq('apartment_code', aptCode)
    .eq('meter_type', meterType)
    .order('recorded_at', { ascending: true });

  if (error) throw new Error(`Supabase meter_readings select error: ${error.message}`);

  return (data || []).map((r) => ({
    id: r.id,
    apartment_code: r.apartment_code,
    meter_type: r.meter_type as 'ELECTRIC' | 'WATER',
    reading: r.reading,
    previous_reading: r.previous_reading ?? undefined,
    consumption: r.consumption ?? undefined,
    period: r.period,
    image_url: r.image_url ?? undefined,
    confidence: r.confidence,
    source: (r.source === 'ocr' ? 'ocr' : 'manual') as 'manual' | 'ocr',
    verified_by: r.verified_by ?? undefined,
    recorded_at: r.recorded_at ?? new Date().toISOString(),
    status: r.status as MeterReadingRecord['status'],
  }));
}

export async function insertMeterReadingDb(rec: MeterReadingRecord): Promise<void> {
  const { error } = await supabaseAdmin.from('meter_readings').insert({
    id: rec.id,
    apartment_code: rec.apartment_code,
    meter_type: rec.meter_type,
    reading: rec.reading,
    previous_reading: rec.previous_reading ?? null,
    consumption: rec.consumption ?? null,
    period: rec.period,
    image_url: rec.image_url ?? null,
    confidence: rec.confidence,
    source: rec.source ?? 'manual',
    verified_by: rec.verified_by ?? null,
    recorded_at: rec.recorded_at,
    status: rec.status,
  });
  if (error) throw new Error(`Supabase meter_readings insert error: ${error.message}`);
}

export async function confirmBillPaidByAdminDb(
  billId: string,
  confirmedBy: string,
  notes?: string
): Promise<BillRecord | null> {
  const now = new Date().toISOString();
  const { data, error } = await supabaseAdmin
    .from('bills')
    .update({
      status: 'Paid',
      payment_method: 'CASH_OFFICE',
      payment_status: 'CONFIRMED_BY_ADMIN',
      confirmed_by: confirmedBy,
      confirmed_at: now,
      paid_at: now,
      last_payment_error: notes ? `Admin note: ${notes}` : null,
    })
    .eq('id', billId)
    .select('id')
    .maybeSingle();

  if (error) throw new Error(`Supabase bills confirm paid error: ${error.message}`);
  if (!data) return null;
  return getBillWithDetailsByIdDb(billId);
}

export async function publishAllDraftBillsDb(): Promise<number> {
  const { data, error } = await supabaseAdmin
    .from('bills')
    .update({ status: 'Unpaid' })
    .eq('status', 'Draft')
    .select('id');

  if (error) throw new Error(`Supabase bills publish error: ${error.message}`);
  return data?.length ?? 0;
}

export async function markBillPaidByIpnDb(
  billId: string,
  transactionRef: string,
  bankCode?: string
): Promise<{ updated: boolean; bill: BillRecord | null }> {
  const now = new Date().toISOString();
  const { data, error } = await supabaseAdmin
    .from('bills')
    .update({
      status: 'Paid',
      payment_method: 'VNPAY',
      payment_status: 'PAID',
      transaction_ref: transactionRef,
      confirmed_by: bankCode ? `VNPAY_IPN:${bankCode}` : 'VNPAY_IPN',
      confirmed_at: now,
      paid_at: now,
      last_payment_error: null,
    })
    .eq('id', billId)
    .neq('status', 'Paid')
    .select('id')
    .maybeSingle();

  if (error) {
    if (error.code === '23505') {
      return { updated: false, bill: await getBillWithDetailsByIdDb(billId) };
    }
    throw new Error(`Supabase bills IPN update error: ${error.message}`);
  }

  return {
    updated: Boolean(data),
    bill: await getBillWithDetailsByIdDb(billId),
  };
}

export async function recordFailedBillIpnDb(
  billId: string,
  responseCode: string,
  transactionRef?: string
): Promise<void> {
  const { error } = await supabaseAdmin
    .from('bills')
    .update({
      payment_status: 'FAILED',
      last_payment_error: `VNPay RspCode=${responseCode}${transactionRef ? ` TxRef=${transactionRef}` : ''}`,
    })
    .eq('id', billId)
    .neq('status', 'Paid');

  if (error) throw new Error(`Supabase bills IPN failure log error: ${error.message}`);
}
