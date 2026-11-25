import 'server-only';
import { supabaseAdmin } from '@/lib/supabase/admin';
import type { Database } from '@/lib/supabase/database.types';
import type { EkycRequest, EkycStatus } from '@/lib/ekycStore';

type EkycRow = Database['public']['Tables']['ekyc_submissions']['Row'];

function rowToEkycRequest(r: EkycRow): EkycRequest {
  return {
    id: r.id,
    userId: r.user_id,
    fullName: r.full_name,
    roleLabel: r.role_label,
    apartmentCode: r.apartment_code,
    phone: r.phone,
    email: r.email ?? undefined,
    idCardNo: r.id_card_no,
    idDate: r.id_date || '',
    idPlace: r.id_place || '',
    dob: r.dob ?? undefined,
    pob: r.pob ?? undefined,
    faceScore: r.face_score ?? 0,
    avatarUrl: r.avatar_url,
    idCardFrontUrl: r.id_card_front_url || '',
    idCardBackUrl: r.id_card_back_url || '',
    faceSamples: (r.face_samples as EkycRequest['faceSamples']) ?? undefined,
    submittedAt: r.submitted_at ?? new Date().toISOString(),
    status: (r.status as EkycStatus) || 'PENDING',
    reviewedAt: r.reviewed_at ?? undefined,
    reviewedBy: r.reviewed_by ?? undefined,
    rejectionReason: r.rejection_reason ?? undefined,
    isSimulation: r.is_simulation ?? false,
    algorithm: r.algorithm ?? undefined,
  };
}

export async function listEkycSubmissionsDb(): Promise<EkycRequest[]> {
  const { data, error } = await supabaseAdmin
    .from('ekyc_submissions')
    .select('*')
    .order('submitted_at', { ascending: false });
  if (error) throw new Error(`Supabase ekyc_submissions select error: ${error.message}`);
  return (data ?? []).map(rowToEkycRequest);
}

export async function getEkycForUserDb(userIdOrPhone: string): Promise<EkycRequest | null> {
  const clean = userIdOrPhone.trim();
  if (!clean) return null;
  const { data, error } = await supabaseAdmin
    .from('ekyc_submissions')
    .select('*')
    .or(`user_id.eq.${clean},phone.eq.${clean},email.ilike.${clean}`)
    .order('submitted_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(`Supabase ekyc_submissions getForUser error: ${error.message}`);
  return data ? rowToEkycRequest(data) : null;
}

export async function submitEkycRequestDb(data: {
  userId: string;
  fullName: string;
  roleLabel: string;
  apartmentCode: string;
  phone: string;
  email?: string;
  idCardNo: string;
  idDate?: string;
  idPlace?: string;
  dob?: string;
  pob?: string;
  avatarUrl: string;
  idCardFrontUrl?: string;
  idCardBackUrl?: string;
  faceSamples?: { front: string; left?: string; right?: string; smile?: string };
  faceScore?: number;
  status?: EkycStatus;
  isSimulation?: boolean;
  algorithm?: string;
}): Promise<EkycRequest> {
  const existing = await getEkycForUserDb(data.userId || data.phone);
  const id = existing?.id || `EKYC-${Date.now()}`;

  const { data: saved, error } = await supabaseAdmin
    .from('ekyc_submissions')
    .upsert({
      id,
      user_id: data.userId,
      full_name: data.fullName,
      role_label: data.roleLabel,
      apartment_code: data.apartmentCode,
      phone: data.phone,
      email: data.email ?? null,
      id_card_no: data.idCardNo,
      id_date: data.idDate ?? null,
      id_place: data.idPlace ?? null,
      dob: data.dob ?? null,
      pob: data.pob ?? null,
      face_score: data.faceScore ?? 0,
      avatar_url: data.avatarUrl,
      id_card_front_url: data.idCardFrontUrl ?? null,
      id_card_back_url: data.idCardBackUrl ?? null,
      face_samples: data.faceSamples ?? null,
      submitted_at: new Date().toISOString(),
      status: data.status || 'PENDING',
      is_simulation: Boolean(data.isSimulation),
      algorithm: data.algorithm ?? null,
    })
    .select('*')
    .single();

  if (error) throw new Error(`Supabase ekyc_submissions upsert error: ${error.message}`);
  return rowToEkycRequest(saved);
}

export class EkycRpcError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export async function transitionEkycAndFaceRpcDb(params: {
  action: 'CONFIRM_BY_OWNER' | 'APPROVE' | 'REJECT' | 'REVOKE';
  ekycId?: string;
  targetUser?: string;
  actorApt?: string | null;
  approverName?: string;
  reason?: string;
}): Promise<EkycRequest> {
  const { data, error } = await supabaseAdmin.rpc('transition_ekyc_and_face_tx', {
    p_action: params.action,
    p_ekyc_id: params.ekycId ?? undefined,
    p_target_user: params.targetUser ?? undefined,
    p_actor_apt: params.actorApt ?? undefined,
    p_approver_name: params.approverName ?? 'VinHomes Manager',
    p_reason: params.reason ?? undefined,
  });

  if (error) {
    const msg = error.message || 'eKYC RPC error';
    if (msg.includes('FORBIDDEN_APARTMENT:')) {
      throw new EkycRpcError(403, msg.replace(/^FORBIDDEN_APARTMENT:\s*/, ''));
    }
    if (msg.includes('EKYC_NOT_FOUND:')) {
      throw new EkycRpcError(404, msg.replace(/^EKYC_NOT_FOUND:\s*/, ''));
    }
    if (msg.includes('INVALID_EKYC_')) {
      throw new EkycRpcError(409, msg.replace(/^INVALID_EKYC_[A-Z_]+:\s*/, ''));
    }
    throw new Error(`Supabase eKYC RPC error: ${msg}`);
  }

  return rowToEkycRequest(data as unknown as EkycRow);
}

export async function confirmEkycByOwnerDb(
  userIdOrPhone: string,
  actorApt?: string | null
): Promise<EkycRequest | null> {
  return transitionEkycAndFaceRpcDb({
    action: 'CONFIRM_BY_OWNER',
    targetUser: userIdOrPhone,
    actorApt,
  });
}

export async function approveEkycRequestDb(
  id: string,
  approverName: string = 'VinHomes Manager'
): Promise<EkycRequest | null> {
  return transitionEkycAndFaceRpcDb({
    action: 'APPROVE',
    ekycId: id,
    approverName,
  });
}

export async function rejectEkycRequestDb(
  id: string,
  reason: string,
  approverName: string = 'VinHomes Manager'
): Promise<EkycRequest | null> {
  return transitionEkycAndFaceRpcDb({
    action: 'REJECT',
    ekycId: id,
    reason,
    approverName,
  });
}

export async function revokeEkycRequestDb(
  id: string,
  reason: string,
  approverName: string = 'VinHomes Manager'
): Promise<EkycRequest | null> {
  return transitionEkycAndFaceRpcDb({
    action: 'REVOKE',
    ekycId: id,
    reason,
    approverName,
  });
}

export async function updateEnrolledFaceStatusDb(
  userIdOrPhone: string,
  status: 'ACTIVE' | 'APPROVED' | 'PENDING' | 'PENDING_OWNER' | 'REVOKED'
): Promise<void> {
  const clean = userIdOrPhone.trim();
  if (!clean) return;
  const dbStatus = status === 'ACTIVE' ? 'APPROVED' : status;
  await supabaseAdmin
    .from('face_enrollments')
    .update({ status: dbStatus })
    .or(`user_id.eq.${clean},phone.eq.${clean}`);
}
