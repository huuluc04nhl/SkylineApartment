import 'server-only';
import { supabaseAdmin } from '@/lib/supabase/admin';
import type { Database } from '@/lib/supabase/database.types';
import {
  type GeneratedVisitorPass,
  type VerificationScanResult,
  verifyVisitorQr as verifyQrHelper,
} from '@/lib/visitorStore';

type VisitorPassRow = Database['public']['Tables']['visitor_passes']['Row'];

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

export async function findVisitorPassByIdOrPinDb(idOrPin: string): Promise<GeneratedVisitorPass | null> {
  const clean = idOrPin.trim();
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

export async function verifyVisitorQrDb(qrCode: string): Promise<VerificationScanResult> {
  const clean = (qrCode || '').trim();
  const dbPass = await findVisitorPassByIdOrPinDb(clean);
  if (dbPass) {
    const expired = new Date(dbPass.validUntil).getTime() < Date.now();
    if (expired || dbPass.status === 'EXPIRED') {
      return {
        scanResult: 'EXPIRED',
        title: 'Thẻ khách đã hết hạn',
        message: 'Thẻ khách đã hết hạn hiệu lực.',
        canEnter: false,
        scannedAt: new Date().toISOString(),
      };
    }
    return {
      scanResult: 'VALID',
      title: 'Thẻ khách hợp lệ',
      message: `Hợp lệ: Khách ${dbPass.visitorName} lên căn ${dbPass.apartmentCode}.`,
      canEnter: true,
      scannedAt: new Date().toISOString(),
      host: {
        apartmentCode: dbPass.apartmentCode,
        hostName: dbPass.hostName,
        hostPhone: dbPass.hostPhone,
        towerName: dbPass.towerName || 'Tropical BS-07',
      },
    };
  }
  return verifyQrHelper(clean);
}

export async function checkInVisitorPassDb(passId: string): Promise<GeneratedVisitorPass | null> {
  const pass = await findVisitorPassByIdOrPinDb(passId);
  if (!pass) return null;
  const now = new Date().toISOString();

  const { data, error } = await supabaseAdmin
    .from('visitor_passes')
    .update({ status: 'CHECKED_IN', checked_in_at: now })
    .eq('id', pass.id)
    .select('*')
    .single();
  if (error) throw new Error(`Supabase visitor_passes check-in error: ${error.message}`);

  await supabaseAdmin.from('visitor_gate_logs').insert({
    id: `LOG-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    pass_id: pass.id,
    apartment_code: pass.apartmentCode,
    host_name: pass.hostName,
    visitor_name: pass.visitorName,
    license_plate: pass.licensePlate ?? null,
    checkpoint: 'Sảnh Chính Lobby BS-07',
    action: 'CHECK_IN',
    result: 'VALID',
    scanned_at: now,
  });

  return rowToVisitorPass(data);
}

export async function checkOutVisitorPassDb(passId: string): Promise<GeneratedVisitorPass | null> {
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

  await supabaseAdmin.from('visitor_gate_logs').insert({
    id: `LOG-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    pass_id: pass.id,
    apartment_code: pass.apartmentCode,
    host_name: pass.hostName,
    visitor_name: pass.visitorName,
    license_plate: pass.licensePlate ?? null,
    checkpoint: 'Sảnh Chính Lobby BS-07',
    action: 'CHECK_OUT',
    result: 'VALID',
    scanned_at: now,
  });

  return rowToVisitorPass(data);
}
