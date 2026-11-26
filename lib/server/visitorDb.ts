import 'server-only';
import { supabaseAdmin } from '@/lib/supabase/admin';
import type { Database } from '@/lib/supabase/database.types';
import {
  type GeneratedVisitorPass,
  type VerificationScanResult,
  type GateAuditLog,
  extractPassLookupKey,
} from '@/lib/visitorStore';

type VisitorPassRow = Database['public']['Tables']['visitor_passes']['Row'];

const DEFAULT_CHECKPOINT = 'Sảnh Chính Lobby BS-07';

function rowToVisitorPass(r: VisitorPassRow): GeneratedVisitorPass {
  return {
    id: r.id,
    apartmentCode: r.apartment_code,
    hostName: r.host_name,
    hostPhone: r.host_phone,
    towerName: r.tower_name ?? undefined,
    visitorName: r.visitor_name,
    phoneNumber: r.visitor_phone ?? undefined,
    licensePlate: r.license_plate ?? undefined,
    entryType: (r.entry_type === 'SINGLE' ? 'SINGLE' : 'MULTI') as 'SINGLE' | 'MULTI',
    purpose: r.purpose ?? undefined,
    purposeLabel: r.purpose_label || 'Khách Thăm Căn Hộ',
    validHours: r.valid_hours ?? 4,
    createdAt: r.created_at ?? new Date().toISOString(),
    validUntil: r.valid_until,
    qrData: r.qr_data,
    pinCode: r.pin_code,
    note: r.note ?? undefined,
    status: (r.status as GeneratedVisitorPass['status']) || 'ACTIVE',
    checkedInAt: r.checked_in_at ?? undefined,
    checkedOutAt: r.checked_out_at ?? undefined,
  };
}

async function insertGateLogDb(params: {
  pass: GeneratedVisitorPass;
  action: 'SCAN' | 'CHECK_IN' | 'CHECK_OUT';
  result: 'VALID' | 'EXPIRED' | 'INVALID';
  checkpoint?: string;
  actorName?: string;
  scannedAt: string;
}) {
  const { error } = await supabaseAdmin.from('visitor_gate_logs').insert({
    id: `LOG-${Date.now()}-${crypto.randomUUID().slice(0, 6)}`,
    pass_id: params.pass.id,
    apartment_code: params.pass.apartmentCode,
    host_name: params.pass.hostName,
    visitor_name: params.pass.visitorName,
    license_plate: params.pass.licensePlate ?? null,
    checkpoint: params.checkpoint?.trim() || DEFAULT_CHECKPOINT,
    action: params.action,
    result: params.result,
    scanned_at: params.scannedAt,
    notes: params.actorName ? `Actor: ${params.actorName}` : null,
  });
  if (error) {
    console.warn('Không thể ghi visitor_gate_logs:', error.message);
  }
}

export async function findVisitorPassByIdOrPinDb(idOrPin: string): Promise<GeneratedVisitorPass | null> {
  const clean = extractPassLookupKey(idOrPin);
  if (!clean) return null;
  const { data, error } = await supabaseAdmin
    .from('visitor_passes')
    .select('*')
    .or(`id.eq.${clean},pin_code.eq.${clean}`)
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(`Supabase visitor_passes select error: ${error.message}`);
  return data ? rowToVisitorPass(data) : null;
}

export async function createVisitorPassDb(params: {
  apartmentCode: string;
  hostName?: string;
  hostPhone?: string;
  towerName?: string;
  visitorName: string;
  phoneNumber?: string;
  licensePlate?: string;
  entryType: 'SINGLE' | 'MULTI';
  validHours: number;
  note?: string;
}): Promise<GeneratedVisitorPass> {
  const now = new Date();
  const validHours = params.validHours || 4;
  const validUntil = new Date(now.getTime() + validHours * 3600 * 1000);
  const randBytes = new Uint32Array(2);
  crypto.getRandomValues(randBytes);
  const pinCode = String(100000 + (randBytes[0] % 900000));
  const id = `SKY-PASS-${1000 + (randBytes[1] % 9000)}`;
  const qrData = JSON.stringify({
    passId: id,
    aptCode: params.apartmentCode,
    visitor: params.visitorName,
    pin: pinCode,
    exp: validUntil.toISOString(),
  });

  const { data, error } = await supabaseAdmin
    .from('visitor_passes')
    .insert({
      id,
      apartment_code: params.apartmentCode,
      host_name: params.hostName || 'Chủ Hộ',
      host_phone: params.hostPhone || '',
      tower_name: params.towerName ?? null,
      visitor_name: params.visitorName,
      visitor_phone: params.phoneNumber ?? null,
      license_plate: params.licensePlate ?? null,
      entry_type: params.entryType,
      valid_hours: validHours,
      qr_data: qrData,
      pin_code: pinCode,
      status: 'ACTIVE',
      valid_until: validUntil.toISOString(),
      created_at: now.toISOString(),
      note: params.note ?? null,
    })
    .select('*')
    .single();

  if (error) throw new Error(`Supabase visitor_passes insert error: ${error.message}`);
  return rowToVisitorPass(data);
}

export async function verifyVisitorQrDb(
  qrCode: string,
  checkpoint: string = DEFAULT_CHECKPOINT,
  actorName?: string
): Promise<VerificationScanResult> {
  const scannedAt = new Date().toISOString();
  const dbPass = await findVisitorPassByIdOrPinDb(qrCode);

  if (!dbPass) {
    return {
      scanResult: 'INVALID',
      title: 'Mã thẻ không hợp lệ',
      message: 'Không tìm thấy thẻ khách thăm hoặc mã PIN tương ứng trong hệ thống.',
      canEnter: false,
      scannedAt,
      checkpoint,
    };
  }

  const expired = new Date(dbPass.validUntil).getTime() < Date.now() || dbPass.status === 'EXPIRED';
  await insertGateLogDb({
    pass: dbPass,
    action: 'SCAN',
    result: expired ? 'EXPIRED' : 'VALID',
    checkpoint,
    actorName,
    scannedAt,
  });

  const visitorInfo: VerificationScanResult['visitor'] = {
    passId: dbPass.id,
    visitorName: dbPass.visitorName,
    phoneNumber: dbPass.phoneNumber,
    licensePlate: dbPass.licensePlate,
    validHours: dbPass.validHours,
    createdAt: dbPass.createdAt,
    validUntil: dbPass.validUntil,
    status: expired ? 'EXPIRED' : dbPass.status,
    checkedInAt: dbPass.checkedInAt,
    checkedOutAt: dbPass.checkedOutAt,
    pinCode: dbPass.pinCode,
  };

  const hostInfo: VerificationScanResult['host'] = {
    apartmentCode: dbPass.apartmentCode,
    hostName: dbPass.hostName,
    hostPhone: dbPass.hostPhone,
    towerName: dbPass.towerName || 'Tropical BS-07',
  };

  if (expired) {
    return {
      scanResult: 'EXPIRED',
      title: 'Thẻ khách đã hết hạn',
      message: `Thẻ ${dbPass.id} của khách ${dbPass.visitorName} đã hết hạn hiệu lực.`,
      canEnter: false,
      scannedAt,
      checkpoint,
      host: hostInfo,
      visitor: visitorInfo,
    };
  }

  return {
    scanResult: 'VALID',
    title: 'Thẻ khách hợp lệ',
    message: `Hợp lệ: Khách ${dbPass.visitorName} lên căn ${dbPass.apartmentCode}.`,
    canEnter: true,
    scannedAt,
    checkpoint,
    host: hostInfo,
    visitor: visitorInfo,
  };
}

export async function checkInVisitorPassDb(
  passId: string,
  checkpoint: string = DEFAULT_CHECKPOINT,
  actorName?: string
): Promise<GeneratedVisitorPass | null> {
  const pass = await findVisitorPassByIdOrPinDb(passId);
  if (!pass) return null;

  const now = new Date().toISOString();
  const expired = new Date(pass.validUntil).getTime() < Date.now() || pass.status === 'EXPIRED';
  if (expired) {
    await insertGateLogDb({
      pass,
      action: 'CHECK_IN',
      result: 'EXPIRED',
      checkpoint,
      actorName,
      scannedAt: now,
    });
    throw new Error('Thẻ khách đã hết hạn hiệu lực, không thể check-in.');
  }

  const { data, error } = await supabaseAdmin
    .from('visitor_passes')
    .update({ status: 'CHECKED_IN', checked_in_at: now })
    .eq('id', pass.id)
    .select('*')
    .single();
  if (error) throw new Error(`Supabase visitor_passes check-in error: ${error.message}`);

  const updated = rowToVisitorPass(data);
  await insertGateLogDb({
    pass: updated,
    action: 'CHECK_IN',
    result: 'VALID',
    checkpoint,
    actorName,
    scannedAt: now,
  });

  return updated;
}

export async function checkOutVisitorPassDb(
  passId: string,
  checkpoint: string = DEFAULT_CHECKPOINT,
  actorName?: string
): Promise<GeneratedVisitorPass | null> {
  const pass = await findVisitorPassByIdOrPinDb(passId);
  if (!pass) return null;
  const now = new Date().toISOString();

  const { data, error } = await supabaseAdmin
    .from('visitor_passes')
    .update({ status: 'COMPLETED', checked_out_at: now })
    .eq('id', pass.id)
    .select('*')
    .single();
  if (error) throw new Error(`Supabase visitor_passes check-out error: ${error.message}`);

  const updated = rowToVisitorPass(data);
  await insertGateLogDb({
    pass: updated,
    action: 'CHECK_OUT',
    result: 'VALID',
    checkpoint,
    actorName,
    scannedAt: now,
  });

  return updated;
}

export async function deleteVisitorPassDb(passId: string): Promise<boolean> {
  const clean = passId.trim();
  if (!clean) return false;
  await supabaseAdmin.from('visitor_gate_logs').delete().eq('pass_id', clean);
  const { data, error } = await supabaseAdmin
    .from('visitor_passes')
    .delete()
    .eq('id', clean)
    .select('id');
  if (error) throw new Error(`Supabase visitor_passes delete error: ${error.message}`);
  return Array.isArray(data) && data.length > 0;
}

export async function purgeExpiredVisitorPassesDb(): Promise<number> {
  const now = new Date().toISOString();
  const { data: expiredRows, error: selectErr } = await supabaseAdmin
    .from('visitor_passes')
    .select('id')
    .or(`status.eq.EXPIRED,valid_until.lt.${now}`);
  if (selectErr) throw new Error(`Supabase visitor_passes expired query error: ${selectErr.message}`);

  const ids = (expiredRows ?? []).map((r) => r.id);
  if (ids.length === 0) return 0;

  await supabaseAdmin.from('visitor_gate_logs').delete().in('pass_id', ids);
  const { error: delErr } = await supabaseAdmin.from('visitor_passes').delete().in('id', ids);
  if (delErr) throw new Error(`Supabase visitor_passes purge error: ${delErr.message}`);
  return ids.length;
}

export async function listVisitorPassesDb(filter?: {
  apartmentCode?: string;
  limit?: number;
  offset?: number;
}): Promise<GeneratedVisitorPass[]> {
  const limit = filter?.limit ?? 100;
  const offset = filter?.offset ?? 0;
  let query = supabaseAdmin
    .from('visitor_passes')
    .select('*')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (filter?.apartmentCode) {
    query = query.ilike('apartment_code', filter.apartmentCode.trim());
  }

  const { data, error } = await query;
  if (error) throw new Error(`Supabase visitor_passes list error: ${error.message}`);
  return (data ?? []).map(rowToVisitorPass);
}

export async function listGateLogsDb(filter?: {
  apartmentCode?: string;
  limit?: number;
  offset?: number;
}): Promise<GateAuditLog[]> {
  const limit = filter?.limit ?? 100;
  const offset = filter?.offset ?? 0;
  let query = supabaseAdmin
    .from('visitor_gate_logs')
    .select('*')
    .order('scanned_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (filter?.apartmentCode) {
    query = query.ilike('apartment_code', filter.apartmentCode.trim());
  }

  const { data, error } = await query;
  if (error) throw new Error(`Supabase visitor_gate_logs list error: ${error.message}`);
  return (data ?? []).map((r) => {
    const scannedAt = r.scanned_at ?? new Date().toISOString();
    return {
      id: r.id,
      passId: r.pass_id || '',
      apartmentCode: r.apartment_code,
      hostName: r.host_name || '',
      visitorName: r.visitor_name || '',
      licensePlate: r.license_plate ?? undefined,
      checkpoint: r.checkpoint || DEFAULT_CHECKPOINT,
      action: (r.action as GateAuditLog['action']) || 'CHECK_IN',
      result: (r.result as GateAuditLog['result']) || 'VALID',
      scannedAt,
      timestamp: scannedAt,
      note: r.notes || '',
      notes: r.notes || undefined,
    };
  });
}
