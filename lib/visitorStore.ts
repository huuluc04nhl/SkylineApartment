/**
 * Visitor QR Management System - Skyline Smart Residence
 * 
 * Flow:
 * - Resident creates visitor pass with Host details (Apartment, Host Name, Host Phone)
 *   and Visitor details (Visitor Name, Phone, Vehicle/License Plate, Validity window).
 * - BQL/Receptionist scans the QR code or looks up by PIN/Pass ID.
 * - System displays:
 *   1. Basic information of Apartment Owner (Chủ hộ): Name, Phone, Apartment, Tower.
 *   2. Basic information of Visitor (Khách thăm): Name, Phone, License Plate, Valid Period, Status.
 * - Receptionist can confirm Check-in and Check-out.
 * - Cleaned: No AI voice synthesis, no elevator destination locking.
 */

import { VisitorPassRecord, VisitorGateLogRecord } from './db/schema';

const visitorPassesCache: VisitorPassRecord[] = [];
const gateLogsCache: VisitorGateLogRecord[] = [];

export type PassEntryType = 'SINGLE' | 'MULTI';
export type VisitorPassStatus = 'ACTIVE' | 'CHECKED_IN' | 'COMPLETED' | 'EXPIRED';

export interface GeneratedVisitorPass {
  id: string;
  apartmentCode: string;
  // Host Info
  hostName: string;
  hostPhone: string;
  towerName?: string;
  // Guest Info
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
  // Chủ Hộ Info
  host?: {
    apartmentCode: string;
    hostName: string;
    hostPhone: string;
    towerName: string;
  };
  // Khách Thăm Info
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

// In-memory global store
declare global {
  var __SKYLINE_VISITOR_PASSES_MAP: Map<string, GeneratedVisitorPass> | undefined;
  var __SKYLINE_VISITOR_LOGS: GateAuditLog[] | undefined;
}

const globalScope = (typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : {}) as any;

/**
 * Định dạng nội dung hiển thị sang trọng, lịch sự, dễ đọc khi khách hoặc lễ tân quét mã QR
 * Thay thế hoàn toàn chuỗi JSON thô kệch bằng thẻ mời điện tử chuẩn Skyline Smart Residence
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

// Danh sách thẻ khách thăm tiêu chuẩn theo dữ liệu căn hộ thực tế (Căn CH-06, Tòa Tropical BS-07, Chủ hộ Trần Hữu Lực)
const INITIAL_SAMPLE_PASSES: GeneratedVisitorPass[] = [
  {
    id: 'SKY-PASS-8492',
    apartmentCode: 'CH-06',
    hostName: 'Trần Hữu Lực',
    hostPhone: '0364967082',
    towerName: 'Tropical BS-07',
    visitorName: 'Trần Quốc Bảo',
    phoneNumber: '0903123456',
    licensePlate: '51G-888.88',
    entryType: 'MULTI',
    purpose: 'VISITOR',
    purposeLabel: 'Khách Thăm Căn Hộ',
    validHours: 8,
    createdAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    validUntil: new Date(Date.now() + 6 * 3600 * 1000).toISOString(),
    qrData: formatVisitorPassQrText({
      id: 'SKY-PASS-8492',
      apartmentCode: 'CH-06',
      towerName: 'Tropical BS-07',
      hostName: 'Trần Hữu Lực',
      hostPhone: '0364967082',
      visitorName: 'Trần Quốc Bảo',
      phoneNumber: '0903123456',
      licensePlate: '51G-888.88',
      validHours: 8,
      validUntil: new Date(Date.now() + 6 * 3600 * 1000).toISOString(),
      pinCode: '849201',
    }),
    pinCode: '849201',
    note: 'Khách đối tác công việc lên căn CH-06 (Tòa BS-07)',
    status: 'CHECKED_IN',
    checkedInAt: '10:15 02/10/2026',
  },
  {
    id: 'SKY-PASS-6521',
    apartmentCode: 'CH-06',
    hostName: 'Trần Hữu Lực',
    hostPhone: '0364967082',
    towerName: 'Tropical BS-07',
    visitorName: 'Phạm Minh Tuấn',
    phoneNumber: '0918765432',
    licensePlate: '59P1-999.99',
    entryType: 'MULTI',
    purpose: 'VISITOR',
    purposeLabel: 'Khách Thăm Căn Hộ',
    validHours: 4,
    createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    validUntil: new Date(Date.now() + 3.5 * 3600 * 1000).toISOString(),
    qrData: formatVisitorPassQrText({
      id: 'SKY-PASS-6521',
      apartmentCode: 'CH-06',
      towerName: 'Tropical BS-07',
      hostName: 'Trần Hữu Lực',
      hostPhone: '0364967082',
      visitorName: 'Phạm Minh Tuấn',
      phoneNumber: '0918765432',
      licensePlate: '59P1-999.99',
      validHours: 4,
      validUntil: new Date(Date.now() + 3.5 * 3600 * 1000).toISOString(),
      pinCode: '652190',
    }),
    pinCode: '652190',
    note: 'Bạn bè đến thăm gia đình',
    status: 'ACTIVE',
  }
];

// Danh sách các ID ảo cũ cần làm sạch triệt để
const DUMMY_PASS_IDS = new Set(['SKY-PASS-9102', 'SKY-PASS-8754', 'SKY-PASS-7312', 'SKY-PASS-6021']);

export function getPassRegistry(): Map<string, GeneratedVisitorPass> {
  const map = new Map<string, GeneratedVisitorPass>();
  const records = visitorPassesCache;
  records.forEach((r) => {
    const pass: GeneratedVisitorPass = {
      id: r.id,
      apartmentCode: r.apartment_code,
      hostName: r.host_name,
      hostPhone: r.host_phone || '',
      towerName: r.tower_name,
      visitorName: r.visitor_name,
      phoneNumber: r.phone_number,
      licensePlate: r.license_plate,
      entryType: r.entry_type,
      purpose: r.purpose,
      purposeLabel: r.purpose_label,
      validHours: r.valid_hours,
      createdAt: r.created_at || new Date().toISOString(),
      validUntil: r.valid_until,
      qrData: r.qr_data,
      pinCode: r.pin_code,
      note: r.note,
      status: r.status,
      checkedInAt: r.checked_in_at,
      checkedOutAt: r.checked_out_at,
    };
    map.set(pass.id, pass);
    map.set(pass.qrData, pass);
    if (pass.pinCode) map.set(pass.pinCode, pass);
  });
  return map;
}

export function savePassToRegistry(pass: GeneratedVisitorPass) {
  const rec: VisitorPassRecord = {
    id: pass.id,
    apartment_code: pass.apartmentCode,
    host_name: pass.hostName,
    host_phone: pass.hostPhone,
    tower_name: pass.towerName,
    visitor_name: pass.visitorName,
    phone_number: pass.phoneNumber,
    license_plate: pass.licensePlate,
    entry_type: pass.entryType,
    purpose: pass.purpose,
    purpose_label: pass.purposeLabel,
    valid_hours: pass.validHours,
    qr_data: pass.qrData,
    pin_code: pass.pinCode,
    note: pass.note,
    status: pass.status,
    valid_until: pass.validUntil,
    checked_in_at: pass.checkedInAt,
    checked_out_at: pass.checkedOutAt,
    created_at: pass.createdAt,
  };
  const existingIdx = visitorPassesCache.findIndex(p => p.id === pass.id);
  if (existingIdx >= 0) {
    visitorPassesCache[existingIdx] = rec;
  } else {
    visitorPassesCache.push(rec);
  }
}

export function getAllVisitorPasses(): GeneratedVisitorPass[] {
  const reg = getPassRegistry();
  const seen = new Set<string>();
  const list: GeneratedVisitorPass[] = [];
  reg.forEach(p => {
    if (!seen.has(p.id)) {
      seen.add(p.id);
      list.push(p);
    }
  });
  return list;
}

export function deleteVisitorPass(passId: string): boolean {
  const idx = visitorPassesCache.findIndex(p => p.id === passId);
  if (idx >= 0) {
    visitorPassesCache.splice(idx, 1);
    return true;
  }
  return false;
}

export function getGateAuditLogs(): GateAuditLog[] {
  return gateLogsCache.map(r => ({
    id: r.id,
    passId: r.pass_id,
    timestamp: r.created_at || r.timestamp || new Date().toISOString(),
    apartmentCode: r.apartment_code,
    hostName: r.host_name,
    visitorName: r.visitor_name,
    licensePlate: r.license_plate,
    action: r.action as any,
    result: (r.result === 'DENIED' ? 'INVALID' : r.result) as any,
    note: r.note || r.notes || '',
    checkpoint: r.checkpoint,
    notes: r.note || r.notes || '',
  }));
}

// Hàm dọn dẹp toàn bộ dữ liệu khách thăm
export function clearAllVisitorData(): void {
  visitorPassesCache.length = 0;
  gateLogsCache.length = 0;
}

export function addGateAuditLog(log: Omit<GateAuditLog, 'id'>): GateAuditLog {
  const newId = `LOG-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
  const rec: VisitorGateLogRecord = {
    id: newId,
    pass_id: log.passId,
    apartment_code: log.apartmentCode,
    host_name: log.hostName,
    visitor_name: log.visitorName,
    license_plate: log.licensePlate,
    action: log.action as any,
    result: log.result as any,
    checkpoint: log.checkpoint,
    note: log.note || log.notes || '',
    created_at: log.timestamp || new Date().toISOString(),
  };
  gateLogsCache.push(rec);
  return {
    id: newId,
    ...log
  };
}

/**
 * Generate an ephemeral, time-bounded secure QR pass for apartment guest
 */
export function generateVisitorPassToken(params: {
  apartmentCode: string;
  towerName?: string;
  hostName?: string;
  hostPhone?: string;
  visitorName?: string;
  phoneNumber?: string;
  licensePlate?: string;
  entryType?: PassEntryType;
  validHours?: number;
  note?: string;
}): GeneratedVisitorPass {
  const aptCode = params.apartmentCode || 'CH-06';
  const hostName = params.hostName?.trim() || `Chủ hộ Căn ${aptCode}`;
  const hostPhone = params.hostPhone?.trim() || '';
  const towerName = params.towerName || 'Tropical BS-07';

  const visitorName = params.visitorName?.trim() || 'Khách Thăm Nhà';
  const phone = params.phoneNumber?.trim() || '';
  const plate = params.licensePlate?.trim().toUpperCase() || '';
  const hours = params.validHours || 4;
  const now = Date.now();
  const expiresAt = now + hours * 3600 * 1000;
  
  const randomPin = Math.floor(100000 + Math.random() * 900000).toString();
  const passId = `SKY-PASS-${Math.floor(1000 + Math.random() * 9000)}`;
  const resolvedEntryType: PassEntryType = params.entryType || 'MULTI';

  // Định dạng nội dung hiển thị thanh lịch, dễ nhìn khi khách hoặc lễ tân quét mã QR
  const qrData = formatVisitorPassQrText({
    id: passId,
    apartmentCode: aptCode,
    towerName,
    hostName,
    hostPhone,
    visitorName,
    phoneNumber: phone,
    licensePlate: plate,
    validHours: hours,
    validUntil: new Date(expiresAt).toISOString(),
    pinCode: randomPin,
  });

  const pass: GeneratedVisitorPass = {
    id: passId,
    apartmentCode: aptCode,
    hostName,
    hostPhone,
    towerName,
    visitorName,
    phoneNumber: phone,
    licensePlate: plate,
    entryType: resolvedEntryType,
    purpose: 'VISITOR',
    purposeLabel: 'Khách Thăm Căn Hộ',
    validHours: hours,
    createdAt: new Date(now).toISOString(),
    validUntil: new Date(expiresAt).toISOString(),
    qrData,
    pinCode: randomPin,
    note: params.note || '',
    status: 'ACTIVE',
  };

  savePassToRegistry(pass);

  addGateAuditLog({
    timestamp: `${new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} ${new Date().toLocaleDateString('vi-VN')}`,
    apartmentCode: aptCode,
    hostName,
    visitorName,
    licensePlate: plate,
    action: 'SCAN',
    result: 'VALID',
    note: `Chủ hộ tạo mã đón khách [${visitorName}] hiệu lực ${hours} giờ.`
  });

  return pass;
}

/**
 * Verify a presented QR code string, JSON string, PIN or passId
 */
export function verifyVisitorQr(qrInput: string, checkpoint: string = 'Sảnh Lễ Tân / Chốt An Ninh'): VerificationScanResult {
  const now = Date.now();
  const nowStr = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const fullTimestamp = `${nowStr} ${new Date().toLocaleDateString('vi-VN')}`;
  const raw = (qrInput || '').trim();

  if (!raw) {
    return {
      scanResult: 'INVALID',
      title: 'CHƯA NHẬN DIỆN ĐƯỢC MÃ QR',
      message: 'Vui lòng đưa mã QR vào vùng quét của camera hoặc tải ảnh mã lên.',
      canEnter: false,
      scannedAt: nowStr,
      checkpoint,
    };
  }

  // 1. Trích xuất passId và PIN từ URL hoặc văn bản định dạng thẻ mời
  const passIdMatch = raw.match(/SKY-PASS-\d+/i) || raw.match(/[?&]id=(SKY-PASS-[^&]+)/i);
  const pinMatch = raw.match(/(?:PIN|MÃ PIN).*?(\d{6})/i) || raw.match(/[?&]pin=(\d{6})/i) || (raw.length === 6 && /^\d{6}$/.test(raw) ? [raw, raw] : null);

  // 2. Tương thích ngược: Phân tích nếu là chuỗi JSON
  let parsedFromJson: any = null;
  if (raw.startsWith('{') && raw.endsWith('}')) {
    try {
      const parsed = JSON.parse(raw);
      if (parsed.skyline_pass || parsed.passId) {
        parsedFromJson = parsed;
      }
    } catch (e) {
      // Not JSON
    }
  }

  const registry = getPassRegistry();
  let matchedPass: GeneratedVisitorPass | undefined = undefined;

  // Tra cứu theo passId trích xuất
  if (passIdMatch) {
    const extractedId = (passIdMatch[1] || passIdMatch[0]).toUpperCase();
    matchedPass = registry.get(extractedId);
  }

  // Tra cứu theo PIN trích xuất
  if (!matchedPass && pinMatch) {
    const extractedPin = pinMatch[1] || pinMatch[0];
    matchedPass = registry.get(extractedPin);
  }

  // Tra cứu theo JSON passId
  if (!matchedPass && parsedFromJson?.passId) {
    matchedPass = registry.get(parsedFromJson.passId);
  }

  if (!matchedPass) {
    matchedPass = registry.get(raw);
  }

  // Quét vòng lặp đối chiếu
  if (!matchedPass) {
    registry.forEach((pass) => {
      if (!matchedPass) {
        if (pass.qrData === raw || pass.id === raw || pass.pinCode === raw || raw.includes(pass.id) || (pass.pinCode && raw.includes(pass.pinCode))) {
          matchedPass = pass;
        }
      }
    });
  }

  // If found in active registry
  if (matchedPass) {
    const isExpired = now > new Date(matchedPass.validUntil).getTime();
    if (isExpired && matchedPass.status === 'ACTIVE') {
      matchedPass.status = 'EXPIRED';
      savePassToRegistry(matchedPass);
    }

    const towerName = matchedPass.towerName || (matchedPass.apartmentCode.includes('A') ? 'Tòa A (Sapphire)' : 'Tòa B (Diamond)');

    if (matchedPass.status === 'EXPIRED' || isExpired) {
      const expDate = new Date(matchedPass.validUntil);
      const result: VerificationScanResult = {
        scanResult: 'EXPIRED',
        title: 'MÃ ĐÓN KHÁCH ĐÃ HẾT HẠN',
        message: `Mã QR đón khách [${matchedPass.visitorName}] của Căn hộ ${matchedPass.apartmentCode} đã hết hạn lúc ${expDate.toLocaleTimeString('vi-VN')} ngày ${expDate.toLocaleDateString('vi-VN')}.`,
        canEnter: false,
        scannedAt: nowStr,
        checkpoint,
        host: {
          apartmentCode: matchedPass.apartmentCode,
          hostName: matchedPass.hostName || 'Chủ hộ Căn ' + matchedPass.apartmentCode,
          hostPhone: matchedPass.hostPhone || 'Chưa cập nhật',
          towerName,
        },
        visitor: {
          passId: matchedPass.id,
          visitorName: matchedPass.visitorName,
          phoneNumber: matchedPass.phoneNumber,
          licensePlate: matchedPass.licensePlate,
          validHours: matchedPass.validHours,
          createdAt: matchedPass.createdAt,
          validUntil: matchedPass.validUntil,
          status: 'EXPIRED',
          checkedInAt: matchedPass.checkedInAt,
          checkedOutAt: matchedPass.checkedOutAt,
          pinCode: matchedPass.pinCode,
        }
      };

      addGateAuditLog({
        timestamp: fullTimestamp,
        apartmentCode: matchedPass.apartmentCode,
        hostName: matchedPass.hostName,
        visitorName: matchedPass.visitorName,
        licensePlate: matchedPass.licensePlate,
        action: 'SCAN',
        result: 'EXPIRED',
        note: `Quét mã quá hạn của khách [${matchedPass.visitorName}].`
      });

      return result;
    }

    // Valid pass!
    const result: VerificationScanResult = {
      scanResult: 'VALID',
      title: matchedPass.status === 'CHECKED_IN' ? 'KHÁCH ĐANG Ở TRONG TÒA NHÀ' : 'THÔNG TIN HỢP LỆ • MỜI KHÁCH VÀO TÒA NHÀ',
      message: `Mã đón khách hợp lệ do Chủ hộ [${matchedPass.hostName}] (Căn ${matchedPass.apartmentCode}) cấp cho Quý khách [${matchedPass.visitorName}].`,
      canEnter: true,
      scannedAt: nowStr,
      checkpoint,
      host: {
        apartmentCode: matchedPass.apartmentCode,
        hostName: matchedPass.hostName || 'Chủ hộ Căn ' + matchedPass.apartmentCode,
        hostPhone: matchedPass.hostPhone || 'Chưa cập nhật',
        towerName,
      },
      visitor: {
        passId: matchedPass.id,
        visitorName: matchedPass.visitorName,
        phoneNumber: matchedPass.phoneNumber,
        licensePlate: matchedPass.licensePlate,
        validHours: matchedPass.validHours,
        createdAt: matchedPass.createdAt,
        validUntil: matchedPass.validUntil,
        status: matchedPass.status,
        checkedInAt: matchedPass.checkedInAt,
        checkedOutAt: matchedPass.checkedOutAt,
        pinCode: matchedPass.pinCode,
      }
    };

    addGateAuditLog({
      timestamp: fullTimestamp,
      apartmentCode: matchedPass.apartmentCode,
      hostName: matchedPass.hostName,
      visitorName: matchedPass.visitorName,
      licensePlate: matchedPass.licensePlate,
      action: 'SCAN',
      result: 'VALID',
      note: `Xác thực thông tin khách [${matchedPass.visitorName}] đến Căn ${matchedPass.apartmentCode}.`
    });

    return result;
  }

  // 2. If pass came from parsed JSON but was created on another client/session
  if (parsedFromJson && parsedFromJson.skyline_pass) {
    const isExpired = now > parsedFromJson.expiresAt;
    const aptCode = parsedFromJson.aptCode || 'CH-06';
    const towerName = parsedFromJson.tower || 'Tropical BS-07';

    // Reconstruct pass and add to registry
    const reconstructedPass: GeneratedVisitorPass = {
      id: parsedFromJson.passId || `SKY-PASS-${Math.floor(1000 + Math.random() * 9000)}`,
      apartmentCode: aptCode,
      hostName: parsedFromJson.hostName || `Chủ hộ Căn ${aptCode}`,
      hostPhone: parsedFromJson.hostPhone || '',
      towerName,
      visitorName: parsedFromJson.visitorName || 'Khách Thăm Nhà',
      phoneNumber: parsedFromJson.phone || '',
      licensePlate: parsedFromJson.plate || '',
      entryType: 'MULTI',
      purpose: 'VISITOR',
      purposeLabel: 'Khách Thăm Căn Hộ',
      validHours: 4,
      createdAt: new Date(now).toISOString(),
      validUntil: new Date(parsedFromJson.expiresAt).toISOString(),
      qrData: raw,
      pinCode: parsedFromJson.pin || '123456',
      status: isExpired ? 'EXPIRED' : 'ACTIVE',
    };
    savePassToRegistry(reconstructedPass);

    return verifyVisitorQr(reconstructedPass.id, checkpoint);
  }

  // 3. Tự động phục hồi thẻ từ định dạng văn bản thẻ mời (nếu quét từ client khác chưa sync)
  if (passIdMatch || raw.includes('THƯ MỜI ĐÓN KHÁCH') || raw.includes('SKYLINE SMART RESIDENCE')) {
    const guestMatch = raw.match(/Khách thăm:\s*([^\n\r]+)/i) || raw.match(/Kính gửi Quý khách:\s*([^\n\r]+)/i) || raw.match(/Khách:\s*([^\n\r]+)/i);
    const aptMatch = raw.match(/Căn hộ\s*([A-Za-z0-9-]+)/i) || raw.match(/Căn\s*([A-Za-z0-9-]+)/i);
    const hostMatch = raw.match(/Chủ hộ bảo lãnh:\s*([^\n\r(]+)/i) || raw.match(/Chủ hộ:\s*([^\n\r(]+)/i);
    const phoneMatch = raw.match(/Số điện thoại:\s*([0-9. -]+)/i) || raw.match(/SĐT khách:\s*([0-9. -]+)/i);
    const plateMatch = raw.match(/Biển số xe?:\s*([^\n\r]+)/i);

    const aptCode = aptMatch ? aptMatch[1].trim() : 'CH-06';
    const extractedId = passIdMatch ? (passIdMatch[1] || passIdMatch[0]).toUpperCase() : `SKY-PASS-${Math.floor(1000 + Math.random() * 9000)}`;
    const extractedPin = pinMatch ? (pinMatch[1] || pinMatch[0]) : '849201';

    const reconstructedPass: GeneratedVisitorPass = {
      id: extractedId,
      apartmentCode: aptCode,
      hostName: hostMatch ? hostMatch[1].trim() : `Chủ hộ Căn ${aptCode}`,
      hostPhone: '0364967082',
      towerName: 'Tropical BS-07',
      visitorName: guestMatch ? guestMatch[1].trim() : 'Khách Thăm Nhà',
      phoneNumber: phoneMatch ? phoneMatch[1].trim() : '',
      licensePlate: plateMatch ? plateMatch[1].trim().toUpperCase() : '',
      entryType: 'MULTI',
      purpose: 'VISITOR',
      purposeLabel: 'Khách Thăm Căn Hộ',
      validHours: 4,
      createdAt: new Date(now).toISOString(),
      validUntil: new Date(now + 4 * 3600 * 1000).toISOString(),
      qrData: raw,
      pinCode: extractedPin,
      status: 'ACTIVE',
    };
    savePassToRegistry(reconstructedPass);

    return verifyVisitorQr(reconstructedPass.id, checkpoint);
  }

  // 3. Fallback: Not recognized
  const result: VerificationScanResult = {
    scanResult: 'INVALID',
    title: 'MÃ QR KHÔNG TỒN TẠI HOẶC KHÔNG HỢP LỆ',
    message: 'Mã quét không thuộc hệ thống Skyline Smart Residence hoặc đã bị chỉnh sửa sai lệch.',
    canEnter: false,
    scannedAt: nowStr,
    checkpoint,
  };

  addGateAuditLog({
    timestamp: fullTimestamp,
    apartmentCode: 'Chưa xác định',
    action: 'SCAN',
    result: 'INVALID',
    note: `Quét mã không hợp lệ: ${raw.substring(0, 30)}...`
  });

  return result;
}

/**
 * Receptionist / Security confirms visitor check-in
 */
export function checkInVisitorPass(passId: string): GeneratedVisitorPass | null {
  const reg = getPassRegistry();
  let target: GeneratedVisitorPass | undefined = reg.get(passId);

  if (!target) {
    reg.forEach((p) => {
      if (p.id === passId) target = p;
    });
  }

  if (!target) return null;

  const nowStr = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  const fullTimestamp = `${nowStr} ${new Date().toLocaleDateString('vi-VN')}`;

  target.status = 'CHECKED_IN';
  target.checkedInAt = fullTimestamp;
  savePassToRegistry(target);

  addGateAuditLog({
    timestamp: fullTimestamp,
    apartmentCode: target.apartmentCode,
    hostName: target.hostName,
    visitorName: target.visitorName,
    licensePlate: target.licensePlate,
    action: 'CHECK_IN',
    result: 'VALID',
    note: `Lễ tân xác nhận khách [${target.visitorName}] đã vào chung cư lên Căn ${target.apartmentCode}.`
  });

  return target;
}

/**
 * Receptionist / Security confirms visitor check-out
 */
export function checkOutVisitorPass(passId: string): GeneratedVisitorPass | null {
  const reg = getPassRegistry();
  let target: GeneratedVisitorPass | undefined = reg.get(passId);

  if (!target) {
    reg.forEach((p) => {
      if (p.id === passId) target = p;
    });
  }

  if (!target) return null;

  const nowStr = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  const fullTimestamp = `${nowStr} ${new Date().toLocaleDateString('vi-VN')}`;

  target.status = 'COMPLETED';
  target.checkedOutAt = fullTimestamp;
  savePassToRegistry(target);

  addGateAuditLog({
    timestamp: fullTimestamp,
    apartmentCode: target.apartmentCode,
    hostName: target.hostName,
    visitorName: target.visitorName,
    licensePlate: target.licensePlate,
    action: 'CHECK_OUT',
    result: 'VALID',
    note: `Lễ tân ghi nhận khách [${target.visitorName}] rời chung cư.`
  });

  return target;
}

// Simple hash helper
function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return hash;
}
