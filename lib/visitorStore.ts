/**
 * Visitor QR Management System - Pure Types & Formatting Helpers
 *
 * Tất cả dữ liệu thẻ khách & nhật ký cổng (passes, gateLogs) được lưu trữ
 * và xác thực hoàn toàn trên Supabase PostgreSQL qua `/api/visitor`.
 */

export type PassEntryType = 'SINGLE' | 'MULTI';
export type VisitorPassStatus = 'ACTIVE' | 'CHECKED_IN' | 'COMPLETED' | 'EXPIRED';

export interface GeneratedVisitorPass {
  id: string;
  apartmentCode: string;
  hostName: string;
  hostPhone: string;
  towerName?: string;
  visitorName: string;
  phoneNumber?: string;
  licensePlate?: string;
  entryType: PassEntryType;
  purpose?: string;
  purposeLabel: string;
  validHours: number;
  createdAt: string;
  validUntil: string;
  qrData: string;
  pinCode: string;
  note?: string;
  status: VisitorPassStatus;
  checkedInAt?: string;
  checkedOutAt?: string;
}

export interface VerificationScanResult {
  scanResult: 'VALID' | 'INVALID' | 'EXPIRED';
  title: string;
  message: string;
  canEnter: boolean;
  scannedAt: string;
  checkpoint?: string;
  host?: {
    apartmentCode: string;
    hostName: string;
    hostPhone: string;
    towerName: string;
  };
  visitor?: {
    passId: string;
    visitorName: string;
    phoneNumber?: string;
    licensePlate?: string;
    validHours: number;
    createdAt: string;
    validUntil: string;
    status: VisitorPassStatus;
    checkedInAt?: string;
    checkedOutAt?: string;
    pinCode: string;
  };
}

export interface GateAuditLog {
  id: string;
  passId?: string;
  timestamp: string;
  apartmentCode: string;
  hostName?: string;
  visitorName?: string;
  licensePlate?: string;
  action: 'SCAN' | 'CHECK_IN' | 'CHECK_OUT';
  result: 'VALID' | 'INVALID' | 'EXPIRED';
  note: string;
  checkpoint?: string;
  notes?: string;
}

/**
 * Định dạng nội dung hiển thị sang trọng, lịch sự, dễ đọc khi khách hoặc lễ tân quét mã QR
 */
export function formatVisitorPassQrText(params: {
  id: string;
  apartmentCode: string;
  towerName?: string;
  hostName?: string;
  hostPhone?: string;
  visitorName: string;
  phoneNumber?: string;
  licensePlate?: string;
  validHours?: number;
  validUntil?: string;
  pinCode: string;
}): string {
  const exp = params.validUntil ? new Date(params.validUntil) : new Date(Date.now() + 4 * 3600 * 1000);
  const expTime = exp.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  const expDate = exp.toLocaleDateString('vi-VN');
  const tower = params.towerName || 'Tropical BS-07';
  const hours = params.validHours || 4;

  const lines = [
    '✨ SKYLINE SMART RESIDENCE ✨',
    '📋 THƯ MỜI ĐÓN KHÁCH ĐIỆN TỬ',
    '━━━━━━━━━━━━━━━━━━━━',
    `👤 Khách thăm: ${params.visitorName || 'Quý Khách'}`,
  ];

  if (params.phoneNumber) {
    lines.push(`📞 Số điện thoại: ${params.phoneNumber}`);
  }
  if (params.licensePlate) {
    lines.push(`🚗 Biển số xe: ${params.licensePlate}`);
  }

  lines.push(`🏢 Điểm đến: Căn hộ ${params.apartmentCode} • ${tower}`);
  lines.push(`🏠 Chủ hộ bảo lãnh: ${params.hostName || 'Chủ hộ'}${params.hostPhone ? ` (${params.hostPhone})` : ''}`);
  lines.push('━━━━━━━━━━━━━━━━━━━━');
  lines.push(`🔑 MÃ PIN LỄ TÂN: ${params.pinCode}`);
  lines.push(`⏳ Hiệu lực đến: ${expTime} ngày ${expDate} (${hours} giờ)`);
  lines.push(`Mã thẻ vé: ${params.id}`);
  lines.push('━━━━━━━━━━━━━━━━━━━━');
  lines.push('👉 Quý khách vui lòng xuất trình nội dung này hoặc đọc mã PIN tại Sảnh Lễ Tân / Bốt An Ninh tòa nhà để được hướng dẫn lên căn hộ.');

  return lines.join('\n');
}

/**
 * Trích xuất mã thẻ (SKY-PASS-...) hoặc mã PIN 6 chữ số từ chuỗi QR thô, JSON hoặc văn bản mời.
 */
export function extractPassLookupKey(rawInput: string): string {
  const clean = (rawInput || '').trim();
  if (!clean) return '';

  if (clean.startsWith('{')) {
    try {
      const parsed = JSON.parse(clean) as { passId?: string; id?: string; pin?: string };
      if (parsed.passId) return String(parsed.passId).trim();
      if (parsed.id) return String(parsed.id).trim();
      if (parsed.pin) return String(parsed.pin).trim();
    } catch {
      // Fallback sang regex bên dưới
    }
  }

  const passMatch = clean.match(/SKY-PASS-[A-Za-z0-9-]+/i);
  if (passMatch) return passMatch[0].toUpperCase();

  const pinMatch = clean.match(/MÃ PIN LỄ TÂN:\s*(\d{6})/i) || clean.match(/\b(\d{6})\b/);
  if (pinMatch) return pinMatch[1];

  return clean;
}
