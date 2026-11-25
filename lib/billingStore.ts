/**
 * Skyline Smart Residence - Centralized Billing & Payment Store
 * Client Store backed by /api/billing & Supabase Postgres.
 * Zero LocalStorage. Zero External Mock APIs.
 * 
 * - Quản trị dữ liệu hóa đơn sinh hoạt 2 chiều thực tế giữa Ban Quản Lý và Cư Dân
 * - Sinh mã VietQR chuẩn Napas247 tự động điền số tài khoản, số tiền và nội dung chuyển khoản
 * - Đồng bộ trạng thái gạch nợ thời gian thực (Unpaid -> Paid)
 */

import { Bill, BillDetail } from './dataStore';
import { BillRecord } from './db/schema';

const billsCache: BillRecord[] = [];

export interface ExtendedBill extends Bill {
  payment_method?: 'VNPAY' | 'MOMO' | 'VIETQR' | 'BANK_TRANSFER';
  transaction_ref?: string;
  paid_at?: string;
  bank_code?: string;
}

/**
 * Bóc tách nguồn tiền thanh toán minh bạch (Quỹ vận hành, Quỹ bảo dưỡng, Tiền điện nước thu hộ nhà nước, Thuế)
 */
export interface BillFundAllocation {
  totalAmount: number;
  operationsAmount: number;
  operationsPercent: number;
  operationsItems: Array<{ name: string; amount: number }>;
  stateUtilitiesAmount: number;
  stateUtilitiesPercent: number;
  stateUtilitiesItems: Array<{ name: string; amount: number }>;
  maintenanceAmount: number;
  maintenancePercent: number;
  taxesAndTelecomAmount: number;
  taxesAndTelecomPercent: number;
}

export function calculateBillFundAllocation(bill: ExtendedBill | Bill): BillFundAllocation {
  const details = bill?.details || [];
  const total = bill?.total_amount || 0;

  let rawOperations = 0;
  const operationsItems: Array<{ name: string; amount: number }> = [];
  let stateUtilitiesAmount = 0;
  const stateUtilitiesItems: Array<{ name: string; amount: number }> = [];
  let taxesAndTelecomAmount = 0;

  details.forEach((d) => {
    const amt = d.total_line_amount || 0;
    const type = d.service_type;
    const name = d.service_name || (
      type === 'Electricity' ? 'Tiền Điện Sinh Hoạt' :
        type === 'Water' ? 'Tiền Nước Sinh Hoạt' :
          type === 'Management_Fee' ? 'Phí Quản Lý Vận Hành' :
            type === 'Parking' ? 'Phí Gửi Xe Căn Hộ' :
              type === 'Internet' ? 'Cáp Quang Internet VNPT' : 'Dịch Vụ Tiện Ích'
    );

    if (type === 'Electricity' || type === 'Water') {
      stateUtilitiesAmount += amt;
      stateUtilitiesItems.push({
        name: type === 'Electricity' ? 'Tiền Điện Sinh Hoạt (Nộp Điện Lực EVN)' : 'Tiền Nước Sinh Hoạt (Nộp Cấp Nước)',
        amount: amt,
      });
    } else if (type === 'Internet') {
      taxesAndTelecomAmount += amt;
    } else {
      rawOperations += amt;
      operationsItems.push({
        name,
        amount: amt,
      });
    }
  });

  const maintenanceAmount = Math.round(rawOperations * 0.12);
  const operationsAmount = Math.max(0, rawOperations - maintenanceAmount);
  const safeTotal = total > 0 ? total : 1;

  const opsPct = Math.round((operationsAmount / safeTotal) * 100);
  const utilPct = Math.round((stateUtilitiesAmount / safeTotal) * 100);
  const maintPct = Math.round((maintenanceAmount / safeTotal) * 100);
  const taxPct = Math.max(0, 100 - opsPct - utilPct - maintPct);

  return {
    totalAmount: total,
    operationsAmount,
    operationsPercent: opsPct,
    operationsItems,
    stateUtilitiesAmount,
    stateUtilitiesPercent: utilPct,
    stateUtilitiesItems,
    maintenanceAmount,
    maintenancePercent: maintPct,
    taxesAndTelecomAmount,
    taxesAndTelecomPercent: taxPct,
  };
}

// Cấu hình tài khoản ngân hàng Ban Quản Lý Tòa Nhà Skyline (BIDV)
export const SKYLINE_BANK_INFO = {
  bankName: 'Ngân hàng TMCP Đầu tư và Phát triển Việt Nam (BIDV)',
  bankShortName: 'BIDV',
  bankBin: 'BIDV', // BIDV Napas BIN
  accountNumber: '124000088899',
  accountHolder: 'BAN QUAN LY TOA NHA SKYLINE APARTMENT',
  branch: 'Chi nhánh TP. Hồ Chí Minh',
};

// Cấu hình ví điện tử MoMo Ban Quản Lý
export const SKYLINE_MOMO_INFO = {
  phoneNumber: '19008888',
  receiverName: 'BAN QUAN LY SKYLINE APARTMENT',
};

/**
 * Sinh URL mã VietQR chuẩn Napas247 quét được bằng mọi app ngân hàng Việt Nam
 */
export function generateVietQrUrl(params: {
  amount: number;
  transferNote: string;
  bankBin?: string;
  accountNumber?: string;
}): string {
  const bin = params.bankBin || SKYLINE_BANK_INFO.bankBin;
  const acc = params.accountNumber || SKYLINE_BANK_INFO.accountNumber;
  const amount = Math.max(0, Math.round(params.amount));
  const note = encodeURIComponent(params.transferNote.trim());
  const accountName = encodeURIComponent(SKYLINE_BANK_INFO.accountHolder);

  return `https://img.vietqr.io/image/${bin}-${acc}-compact2.png?amount=${amount}&addInfo=${note}&accountName=${accountName}`;
}

export function billRecordToExtendedBill(rec: BillRecord): ExtendedBill {
  const aptCode = String(rec.apartment_code || '').trim();
  const billingMonth = String(rec.billing_month || '').trim();
  return {
    id: rec.id,
    apartment_id: `apt-${aptCode.toLowerCase()}`,
    apt_code: aptCode,
    owner_name: rec.owner_name || '',
    billing_month: billingMonth,
    due_date: rec.due_date,
    total_amount: rec.total_amount,
    status: rec.status,
    status_color: rec.status === 'Paid' ? '#16A34A' : rec.status === 'Overdue' ? '#DC2626' : '#D97706',
    payment_qr_url: rec.payment_qr_url || generateVietQrUrl({
      amount: rec.total_amount,
      transferNote: `SKYLINE ${aptCode} ${billingMonth.replace(/\s+/g, '')}`,
    }),
    invoice_pdf_url: rec.invoice_pdf_url || '#',
    has_ai_anomaly: rec.has_ai_anomaly || false,
    created_at: '2026-08-05T08:00:00',
    details: (rec.details || []).map(d => ({
      id: d.id,
      bill_id: d.bill_id || rec.id,
      service_type: (d.service_type as any) || 'Other',
      service_name: d.service_name,
      usage: d.usage,
      unit: d.unit,
      unit_price: d.unit_price,
      total_line_amount: d.total_line_amount,
      ai_anomaly: d.ai_anomaly,
      anomaly_reason: d.anomaly_reason
    })),
    payment_method: rec.payment_method || undefined,
    transaction_ref: rec.transaction_ref || undefined,
    paid_at: rec.paid_at || undefined
  };
}

export const INITIAL_BILLS: ExtendedBill[] = [];

function notifyBillingUpdated() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('skyline_billing_updated'));
  }
}

export function getBills(aptCode?: string, overrideOwnerName?: string): ExtendedBill[] {
  let records = billsCache;

  if (aptCode) {
    const cleanApt = aptCode.trim().toUpperCase();
    records = records.filter(b => (b.apartment_code || '').trim().toUpperCase() === cleanApt);
  }

  let allBills = records.map(billRecordToExtendedBill);

  if (overrideOwnerName && overrideOwnerName.trim()) {
    allBills = allBills.map(b => ({
      ...b,
      owner_name: overrideOwnerName.trim()
    }));
  }

  return allBills;
}

export function getBillById(id: string): ExtendedBill | undefined {
  const rec = billsCache.find(b => b.id === id);
  return rec ? billRecordToExtendedBill(rec) : undefined;
}

export function saveBills(bills: ExtendedBill[]): void {
  bills.forEach(b => {
    const existingIdx = billsCache.findIndex(item => item.id === b.id);
    const rec: BillRecord = {
      id: b.id,
      apartment_code: b.apt_code,
      owner_name: b.owner_name,
      billing_month: b.billing_month,
      due_date: b.due_date,
      total_amount: b.total_amount,
      status: b.status as any,
      payment_method: b.payment_method || null,
      transaction_ref: b.transaction_ref || null,
      paid_at: b.paid_at || null,
      payment_qr_url: b.payment_qr_url,
      invoice_pdf_url: b.invoice_pdf_url,
      has_ai_anomaly: b.has_ai_anomaly,
      details: b.details.map(d => ({
        id: d.id,
        bill_id: d.bill_id,
        service_type: d.service_type,
        service_name: d.service_name || '',
        usage: d.usage || 0,
        unit: d.unit || '',
        unit_price: d.unit_price || 0,
        total_line_amount: d.total_line_amount || 0,
        ai_anomaly: !!d.ai_anomaly,
        anomaly_reason: d.anomaly_reason
      }))
    };

    if (existingIdx >= 0) {
      billsCache[existingIdx] = rec;
    } else {
      billsCache.push(rec);
    }
  });
  notifyBillingUpdated();
}

export function payBill(
  billId: string,
  method: 'VNPAY' | 'MOMO' | 'VIETQR' = 'VNPAY',
  transactionRef?: string,
  _bankCode?: string
): ExtendedBill | null {
  const existing = billsCache.find(b => b.id === billId);
  if (!existing) return null;

  const transId = transactionRef || (method === 'VNPAY'
    ? `VNP${Date.now().toString().slice(-8)}`
    : `MM${Date.now().toString().slice(-8)}`);

  existing.status = 'Paid';
  existing.payment_method = method;
  existing.transaction_ref = transId;
  existing.paid_at = new Date().toISOString();

  notifyBillingUpdated();
  return billRecordToExtendedBill(existing);
}

export function confirmPaidByAdmin(billId: string, _notes?: string): ExtendedBill | null {
  const existing = billsCache.find(b => b.id === billId);
  if (!existing) return null;

  existing.status = 'Paid';
  existing.payment_method = 'BANK_TRANSFER';
  existing.transaction_ref = `BQL-REC-${Date.now().toString().slice(-6)}`;
  existing.paid_at = new Date().toISOString();

  notifyBillingUpdated();
  return billRecordToExtendedBill(existing);
}

export function publishAllBills(): void {
  billsCache.forEach(d => {
    if (d.status === 'Draft') d.status = 'Unpaid';
  });
  notifyBillingUpdated();
}

export function addServiceChargeToBill(
  aptCode: string,
  serviceDetail: Omit<BillDetail, 'id' | 'bill_id'>
): ExtendedBill | null {
  const cleanApt = aptCode.trim().toUpperCase();

  let targetRec = billsCache.find(b => b.apartment_code.trim().toUpperCase() === cleanApt && b.status === 'Unpaid');
  if (!targetRec) {
    targetRec = billsCache.find(b => b.apartment_code.trim().toUpperCase() === cleanApt);
  }
  if (!targetRec) return null;

  const newDetailId = `bd-srv-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const newDetail = {
    id: newDetailId,
    bill_id: targetRec.id,
    service_type: serviceDetail.service_type,
    service_name: serviceDetail.service_name || '',
    usage: serviceDetail.usage || 1,
    unit: serviceDetail.unit || 'lần',
    unit_price: serviceDetail.unit_price || serviceDetail.total_line_amount || 0,
    total_line_amount: serviceDetail.total_line_amount || 0,
    ai_anomaly: false,
    anomaly_reason: undefined
  };

  const updatedDetails = [...(targetRec.details || []), newDetail];
  const newTotal = updatedDetails.reduce((sum, d) => sum + (d.total_line_amount || 0), 0);

  targetRec.total_amount = newTotal;
  targetRec.details = updatedDetails;
  targetRec.payment_qr_url = generateVietQrUrl({
    amount: newTotal,
    transferNote: `SKYLINE ${cleanApt} ${targetRec.billing_month.replace(/\s+/g, '')}`,
  });

  notifyBillingUpdated();
  return billRecordToExtendedBill(targetRec);
}
