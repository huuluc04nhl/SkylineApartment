/**
 * Skyline Smart Residence - Billing Anomaly Detection Engine
 * Pure Deterministic Statistical & Rule-Based Anomaly Detection
 * 
 * Rules:
 * 1. METER_DECREASE: Chỉ số giảm so với kỳ trước (Severity: HIGH)
 * 2. SPIKE_SURGE: Tiêu thụ tăng đột biến (% tăng > 50% hoặc |Z-Score| > 2.0) (Severity: HIGH / MEDIUM)
 * 3. DUPLICATE_BILL: Trùng hóa đơn cùng căn hộ trong cùng kỳ thu (Severity: HIGH)
 * 4. INCORRECT_UNIT_PRICE: Sai đơn giá định mức chuẩn tòa nhà (Severity: MEDIUM)
 * 5. MISSING_MANDATORY_FEE: Thiếu khoản phí quản lý bắt buộc (Severity: MEDIUM)
 */

import { BillRecord } from './db/schema';

export type AnomalySeverity = 'LOW' | 'MEDIUM' | 'HIGH';
export type AnomalyCategory = 
  | 'METER_DECREASE' 
  | 'SPIKE_SURGE' 
  | 'DUPLICATE_BILL' 
  | 'INCORRECT_UNIT_PRICE' 
  | 'MISSING_MANDATORY_FEE';

export interface BillingAnomaly {
  id: string;
  billId: string;
  apartmentCode: string;
  billingMonth: string;
  severity: AnomalySeverity;
  category: AnomalyCategory;
  field: string;
  detectedValue: number | string;
  expectedValue?: number | string;
  reason: string;
  suggestedAction: string;
  aiExplanation?: string;
}

// Chuẩn biểu phí tòa nhà The Tropical Beverly Solari
export const STANDARD_FEE_RATES = {
  MANAGEMENT_FEE_PER_M2: 18000,
  WATER_RATE_PER_M3: 17700,
  ELECTRIC_RATE_ESTIMATE: 2650,
  PARKING_CAR: 1200000,
  PARKING_MOTO: 120000,
  INTERNET: 220000,
};

/**
 * Tính Z-Score thống kê cho một tập giá trị
 */
export function calculateZScores(values: number[]): number[] {
  if (values.length <= 1) return values.map(() => 0);
  const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
  const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
  const stdDev = Math.sqrt(variance);

  if (stdDev === 0) return values.map(() => 0);
  return values.map(v => (v - mean) / stdDev);
}

/**
 * Quét toàn diện danh sách hóa đơn và phát hiện bất thường theo quy tắc chuẩn
 */
function getBillAptCode(b: any): string {
  return String(b?.apartment_code || b?.apt_code || '').trim();
}

function getBillMonth(b: any): string {
  return String(b?.billing_month || '').trim();
}

export function detectBillingAnomalies(
  targetBills: any[],
  allHistoricalBills: any[] = targetBills
): BillingAnomaly[] {
  const anomalies: BillingAnomaly[] = [];
  const seenBillsMap = new Map<string, any[]>();

  // 1. Kiểm tra TRÙNG HÓA ĐƠN (Duplicate Bills)
  targetBills.forEach(b => {
    const aptCode = getBillAptCode(b);
    const month = getBillMonth(b);
    if (!aptCode || !month) return;

    const key = `${aptCode.toUpperCase()}_${month}`;
    const list = seenBillsMap.get(key) || [];
    list.push(b);
    seenBillsMap.set(key, list);
  });

  seenBillsMap.forEach((billsInPeriod) => {
    if (billsInPeriod.length > 1) {
      billsInPeriod.slice(1).forEach(dup => {
        const dupApt = getBillAptCode(dup);
        const dupMonth = getBillMonth(dup);
        anomalies.push({
          id: `anom-dup-${dup.id}`,
          billId: dup.id,
          apartmentCode: dupApt,
          billingMonth: dupMonth,
          severity: 'HIGH',
          category: 'DUPLICATE_BILL',
          field: 'apartment_code',
          detectedValue: dup.id,
          expectedValue: '1 hóa đơn duy nhất/kỳ',
          reason: `Phát hiện ${billsInPeriod.length} hóa đơn cùng lập cho căn ${dupApt} trong kỳ ${dupMonth}.`,
          suggestedAction: 'Kiểm tra và hủy bỏ bản ghi hóa đơn bị lập trùng trước khi phát hành ra cư dân.',
        });
      });
    }
  });

  // Gom lịch sử tiêu thụ điện nước theo từng căn để tính toán chuỗi thời gian
  const aptHistoryMap = new Map<string, any[]>();
  allHistoricalBills.forEach(b => {
    const code = getBillAptCode(b).toUpperCase();
    if (!code) return;
    const list = aptHistoryMap.get(code) || [];
    list.push(b);
    aptHistoryMap.set(code, list);
  });

  // 2. Kiểm tra từng hóa đơn
  targetBills.forEach(bill => {
    const aptCode = getBillAptCode(bill);
    const month = getBillMonth(bill);
    if (!aptCode) return;

    const details: any[] = bill.details || bill.bill_details || [];
    const aptHistory = (aptHistoryMap.get(aptCode.toUpperCase()) || [])
      .filter(h => h.id !== bill.id); // loại trừ kỳ hiện tại

    // A. Kiểm tra THIẾU KHOẢN PHÍ BẮT BUỘC (Missing Management Fee)
    const hasMgmtFee = details.some(d => d.service_type === 'Management_Fee');
    if (!hasMgmtFee) {
      anomalies.push({
        id: `anom-missing-mgmt-${bill.id}`,
        billId: bill.id,
        apartmentCode: aptCode,
        billingMonth: month,
        severity: 'MEDIUM',
        category: 'MISSING_MANDATORY_FEE',
        field: 'Management_Fee',
        detectedValue: 0,
        expectedValue: 'Định mức diện tích × 18.000 đ',
        reason: `Hóa đơn căn ${aptCode} kỳ ${month} không có khoản mục Phí Quản Lý Vận Hành.`,
        suggestedAction: 'Bổ sung dòng phí quản lý vận hành theo diện tích thông thủy của căn hộ.',
      });
    }

    // B. Kiểm tra SAI ĐƠN GIÁ (Incorrect Unit Price)
    details.forEach(d => {
      if (d.service_type === 'Management_Fee' && d.unit_price && d.unit_price !== STANDARD_FEE_RATES.MANAGEMENT_FEE_PER_M2) {
        anomalies.push({
          id: `anom-rate-mgmt-${d.id}`,
          billId: bill.id,
          apartmentCode: aptCode,
          billingMonth: month,
          severity: 'MEDIUM',
          category: 'INCORRECT_UNIT_PRICE',
          field: 'unit_price',
          detectedValue: `${d.unit_price.toLocaleString('vi-VN')} đ/m²`,
          expectedValue: `${STANDARD_FEE_RATES.MANAGEMENT_FEE_PER_M2.toLocaleString('vi-VN')} đ/m²`,
          reason: `Đơn giá Phí Quản Lý (${d.unit_price} đ/m²) sai khác so với định mức quy chuẩn của tòa nhà (18.000 đ/m²).`,
          suggestedAction: 'Hiệu chỉnh đơn giá dòng phí về đúng chuẩn 18.000 đ/m².',
        });
      }

      if (d.service_type === 'Water' && d.unit_price && Math.abs(d.unit_price - STANDARD_FEE_RATES.WATER_RATE_PER_M3) > 1000) {
        anomalies.push({
          id: `anom-rate-water-${d.id}`,
          billId: bill.id,
          apartmentCode: aptCode,
          billingMonth: month,
          severity: 'LOW',
          category: 'INCORRECT_UNIT_PRICE',
          field: 'unit_price',
          detectedValue: `${d.unit_price.toLocaleString('vi-VN')} đ/m³`,
          expectedValue: `${STANDARD_FEE_RATES.WATER_RATE_PER_M3.toLocaleString('vi-VN')} đ/m³`,
          reason: `Đơn giá nước sinh hoạt (${d.unit_price} đ/m³) chênh lệch bất thường so với định mức cơ bản 17.700 đ/m³.`,
          suggestedAction: 'Kiểm tra biểu giá cấp nước áp dụng cho căn hộ.',
        });
      }
    });

    // C. Kiểm tra CHỈ SỐ GIẢM & TĂNG ĐỘT BIẾN TIÊU THỤ (Điện & Nước)
    const currentElec = details.find(d => d.service_type === 'Electricity')?.usage || 0;
    const currentWater = details.find(d => d.service_type === 'Water')?.usage || 0;

    // Lấy chuỗi lịch sử kỳ trước của cùng căn hộ
    const pastElecUsages = aptHistory
      .map(h => (h.details || h.bill_details || []).find((d: any) => d.service_type === 'Electricity')?.usage)
      .filter((u): u is number => typeof u === 'number' && u > 0);

    const pastWaterUsages = aptHistory
      .map(h => (h.details || h.bill_details || []).find((d: any) => d.service_type === 'Water')?.usage)
      .filter((u): u is number => typeof u === 'number' && u > 0);

    // 1) ĐIỆN
    if (pastElecUsages.length > 0 && currentElec > 0) {
      const avgElec = pastElecUsages.reduce((s, v) => s + v, 0) / pastElecUsages.length;
      const pctChange = ((currentElec - avgElec) / avgElec) * 100;

      // Giảm sâu > 75%
      if (pctChange <= -75) {
        anomalies.push({
          id: `anom-elec-drop-${bill.id}`,
          billId: bill.id,
          apartmentCode: aptCode,
          billingMonth: month,
          severity: 'HIGH',
          category: 'METER_DECREASE',
          field: 'Electricity',
          detectedValue: `${currentElec} kWh (Giảm ${Math.abs(Math.round(pctChange))}%)`,
          expectedValue: `Trung bình ~ ${Math.round(avgElec)} kWh`,
          reason: `Chỉ số điện tiêu thụ (${currentElec} kWh) giảm đột ngột ${Math.abs(Math.round(pctChange))}% so với lịch sử (${Math.round(avgElec)} kWh).`,
          suggestedAction: 'Kiểm tra công tơ điện tử xem có hiện tượng kẹt số, đứt dây tín hiệu hoặc căn hộ để trống dài ngày.',
        });
      }

      // Tăng vọt > 50%
      if (pctChange >= 50) {
        anomalies.push({
          id: `anom-elec-surge-${bill.id}`,
          billId: bill.id,
          apartmentCode: aptCode,
          billingMonth: month,
          severity: pctChange >= 100 ? 'HIGH' : 'MEDIUM',
          category: 'SPIKE_SURGE',
          field: 'Electricity',
          detectedValue: `${currentElec} kWh (+${Math.round(pctChange)}%)`,
          expectedValue: `Trung bình ~ ${Math.round(avgElec)} kWh`,
          reason: `Tiêu thụ điện tăng vọt ${Math.round(pctChange)}% so với trung bình các kỳ trước.`,
          suggestedAction: 'Kiểm tra thiết bị tiêu thụ công suất lớn hoặc thông báo gia đình kiểm tra phụ tải.',
        });
      }
    }

    // 2) NƯỚC
    if (pastWaterUsages.length > 0 && currentWater > 0) {
      const avgWater = pastWaterUsages.reduce((s, v) => s + v, 0) / pastWaterUsages.length;
      const pctWaterChange = ((currentWater - avgWater) / avgWater) * 100;

      if (pctWaterChange >= 50) {
        anomalies.push({
          id: `anom-water-surge-${bill.id}`,
          billId: bill.id,
          apartmentCode: aptCode,
          billingMonth: month,
          severity: pctWaterChange >= 100 ? 'HIGH' : 'MEDIUM',
          category: 'SPIKE_SURGE',
          field: 'Water',
          detectedValue: `${currentWater} m³ (+${Math.round(pctWaterChange)}%)`,
          expectedValue: `Trung bình ~ ${Math.round(avgWater)} m³`,
          reason: `Lưu lượng nước tăng vọt ${Math.round(pctWaterChange)}% so với mức tiêu thụ bình quân (${Math.round(avgWater)} m³). AI IoT nghi vấn rò rỉ van cấp.`,
          suggestedAction: 'Kỹ thuật viên cần đến căn hộ kiểm tra van phao bồn cầu và van vòi xả trước khi gửi thông báo phí.',
        });
      }
    }
  });

  return anomalies;
}

