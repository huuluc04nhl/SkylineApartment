import 'server-only';
import { supabaseAdmin } from '@/lib/supabase/admin';
import type { Database } from '@/lib/supabase/database.types';
import type { StoredUser, ApartmentMember } from '@/lib/userStore';

type ProfileRow = Database['public']['Tables']['profiles']['Row'];
type UserRow = Database['public']['Tables']['users']['Row'];
type MemberRow = Database['public']['Tables']['apartment_members']['Row'];

function splitName(fullName: string): { firstname: string; lastname: string } {
  const parts = fullName.trim().split(/\s+/);
  return {
    firstname: parts.slice(-1)[0] || '',
    lastname: parts.slice(0, -1).join(' ') || '',
  };
}

function mapRowsToStoredUser(profile?: ProfileRow | null, userRow?: UserRow | null): StoredUser | null {
  if (!profile && !userRow) return null;
  const fullName = profile?.full_name || userRow?.full_name || 'Cư Dân SKYLINE';
  const { firstname, lastname } = splitName(fullName);
  const avatar = profile?.avatar_url || userRow?.avatar_url || '';
  return {
    id: profile?.legacy_user_id || userRow?.id || profile?.id || '',
    username: userRow?.username || profile?.email || profile?.phone || '',
    firstname,
    lastname,
    fullname: fullName,
    full_name: fullName,
    intro: '',
    email: profile?.email || userRow?.email || '',
    phone: profile?.phone || userRow?.phone || '',
    gender: (userRow?.gender === 0 ? 0 : 1) as 0 | 1,
    website: '',
    dob: userRow?.dob || '',
    pob: userRow?.pob || '',
    id_number: userRow?.id_card_no || '',
    id_card_no: userRow?.id_card_no || '',
    id_date: userRow?.id_date || '',
    id_place: userRow?.id_place || '',
    province: '',
    role: ((profile?.role || userRow?.role || 'TENANT') as StoredUser['role']),
    apartment_code: profile?.apartment_code || userRow?.apartment_code || '',
    relationship: ((profile?.relationship || userRow?.relationship || 'Tenant') as StoredUser['relationship']),
    avatar_url: avatar,
    license_plate: userRow?.license_plate || undefined,
  };
}

function mapMemberRow(r: MemberRow): ApartmentMember {
  return {
    id: r.id,
    username: r.phone || r.email || r.id,
    fullName: r.full_name,
    role: ((r.role as ApartmentMember['role']) || 'Family'),
    relationship: r.relationship,
    phone: r.phone,
    email: r.email ?? undefined,
    idCard: r.id_card || '',
    licensePlate: r.license_plate || '',
    avatarUrl: r.avatar_url || '',
    faceStatus: ((r.face_status as ApartmentMember['faceStatus']) || 'Chưa Thiết Lập'),
    addedDate: r.created_at ? new Date(r.created_at).toLocaleDateString('vi-VN') : '',
    apartmentCode: r.apartment_code,
    dob: r.dob ?? undefined,
    gender: (r.gender === 'Nữ' || r.gender === '0' ? 'Nữ' : 'Nam') as 'Nam' | 'Nữ',
    pob: r.pob ?? undefined,
    idDate: r.id_date ?? undefined,
    idPlace: r.id_place ?? undefined,
    vehicleType: ((r.vehicle_type as ApartmentMember['vehicleType']) || 'Không'),
  };
}

export async function findUserByIdentifierDb(identifier: string): Promise<StoredUser | null> {
  const clean = identifier.trim();
  if (!clean) return null;

  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(clean);
  let profile: ProfileRow | null = null;

  if (isUuid) {
    const { data } = await supabaseAdmin.from('profiles').select('*').eq('id', clean).maybeSingle();
    profile = data;
  }
  if (!profile) {
    const { data } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .or(`legacy_user_id.eq.${clean},email.ilike.${clean},phone.eq.${clean}`)
      .limit(1)
      .maybeSingle();
    profile = data;
  }

  let userRow: UserRow | null = null;
  const legacyId = profile?.legacy_user_id || (!isUuid ? clean : null);
  if (legacyId) {
    const { data } = await supabaseAdmin
      .from('users')
      .select('*')
      .or(`id.eq.${legacyId},username.ilike.${clean},email.ilike.${clean},phone.eq.${clean}`)
      .limit(1)
      .maybeSingle();
    userRow = data;
  } else if (profile?.email) {
    const { data } = await supabaseAdmin
      .from('users')
      .select('*')
      .ilike('email', profile.email)
      .limit(1)
      .maybeSingle();
    userRow = data;
  }

  return mapRowsToStoredUser(profile, userRow);
}

export async function updateUserProfileDb(
  identifier: string,
  updates: Partial<StoredUser>
): Promise<StoredUser | null> {
  const clean = identifier.trim();
  if (!clean) return null;

  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(clean);
  const { data: profile } = isUuid
    ? await supabaseAdmin.from('profiles').select('*').eq('id', clean).maybeSingle()
    : await supabaseAdmin
        .from('profiles')
        .select('*')
        .or(`legacy_user_id.eq.${clean},email.ilike.${clean},phone.eq.${clean}`)
        .limit(1)
        .maybeSingle();

  const resolvedFullName =
    updates.fullname ||
    updates.full_name ||
    (updates.lastname || updates.firstname
      ? `${updates.lastname || ''} ${updates.firstname || ''}`.trim()
      : undefined);

  if (profile) {
    const profPatch: Database['public']['Tables']['profiles']['Update'] = {
      updated_at: new Date().toISOString(),
    };
    if (resolvedFullName) profPatch.full_name = resolvedFullName;
    if (updates.phone !== undefined) profPatch.phone = updates.phone;
    if (updates.email !== undefined) profPatch.email = updates.email;
    if (updates.avatar_url !== undefined) {
      profPatch.avatar_url = updates.avatar_url ?? null;
    }
    if (updates.apartment_code !== undefined) profPatch.apartment_code = updates.apartment_code || null;
    if (updates.role !== undefined) profPatch.role = updates.role;
    if (updates.relationship !== undefined) profPatch.relationship = updates.relationship;

    await supabaseAdmin.from('profiles').update(profPatch).eq('id', profile.id);
  }

  const legacyId = profile?.legacy_user_id || (!isUuid ? clean : null);
  if (legacyId) {
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id')
      .or(`id.eq.${legacyId},email.ilike.${profile?.email || clean}`)
      .limit(1)
      .maybeSingle();

    if (existingUser) {
      const userPatch: Database['public']['Tables']['users']['Update'] = {};
      if (resolvedFullName) userPatch.full_name = resolvedFullName;
      if (updates.phone !== undefined) userPatch.phone = updates.phone;
      if (updates.email !== undefined) userPatch.email = updates.email;
      if (updates.gender !== undefined) userPatch.gender = updates.gender;
      if (updates.dob !== undefined) userPatch.dob = updates.dob;
      if (updates.pob !== undefined) userPatch.pob = updates.pob;
      if (updates.id_number !== undefined || updates.id_card_no !== undefined) {
        userPatch.id_card_no = updates.id_number ?? updates.id_card_no;
      }
      if (updates.id_date !== undefined) userPatch.id_date = updates.id_date;
      if (updates.id_place !== undefined) userPatch.id_place = updates.id_place;
      if (updates.license_plate !== undefined) userPatch.license_plate = updates.license_plate;
      if (updates.avatar_url !== undefined) {
        userPatch.avatar_url = updates.avatar_url ?? null;
      }
      if (Object.keys(userPatch).length > 0) {
        await supabaseAdmin.from('users').update(userPatch).eq('id', existingUser.id);
      }
    }
  }

  return findUserByIdentifierDb(profile?.id || clean);
}

export async function registerOwnerUserDb(params: {
  name: string;
  phone: string;
  email: string;
  cccd: string;
  apartmentCode: string;
  dob?: string;
  pob?: string;
  avatarUrl?: string;
}): Promise<StoredUser> {
  const cleanEmail = params.email.trim().toLowerCase();
  const cleanPhone = params.phone.trim();
  const cleanApt = params.apartmentCode.trim().toUpperCase();
  const legacyId = `user-owner-${Date.now()}`;

  // Tìm hoặc tạo user trong Supabase Auth
  const { data: existingProf } = await supabaseAdmin
    .from('profiles')
    .select('id, legacy_user_id')
    .or(`email.ilike.${cleanEmail},phone.eq.${cleanPhone}`)
    .limit(1)
    .maybeSingle();

  let authUserId = existingProf?.id;
  if (!authUserId) {
    const { data: createdAuth, error: authErr } = await supabaseAdmin.auth.admin.createUser({
      email: cleanEmail,
      email_confirm: true,
      user_metadata: { full_name: params.name.trim() },
    });
    if (authErr || !createdAuth.user) {
      throw new Error(`Không thể tạo tài khoản Supabase Auth: ${authErr?.message || 'Unknown'}`);
    }
    authUserId = createdAuth.user.id;
  }

  const resolvedLegacyId = existingProf?.legacy_user_id || legacyId;

  const { error: profErr } = await supabaseAdmin.from('profiles').upsert({
    id: authUserId,
    legacy_user_id: resolvedLegacyId,
    email: cleanEmail,
    phone: cleanPhone,
    full_name: params.name.trim(),
    role: 'OWNER',
    apartment_code: cleanApt,
    relationship: 'Owner',
    avatar_url: params.avatarUrl || null,
    updated_at: new Date().toISOString(),
  });
  if (profErr) throw new Error(`Lỗi cập nhật profiles: ${profErr.message}`);

  const { error: userErr } = await supabaseAdmin.from('users').upsert({
    id: resolvedLegacyId,
    username: cleanPhone,
    role: 'OWNER',
    full_name: params.name.trim(),
    phone: cleanPhone,
    email: cleanEmail,
    password_hash: '',
    id_card_no: params.cccd,
    dob: params.dob || '1992-06-15',
    pob: params.pob || 'TP. Hồ Chí Minh',
    apartment_code: cleanApt,
    relationship: 'Owner',
    avatar_url: params.avatarUrl || null,
  });
  if (userErr) throw new Error(`Lỗi cập nhật users: ${userErr.message}`);

  return (await findUserByIdentifierDb(authUserId))!;
}

export async function listApartmentMembersDb(aptCode: string): Promise<ApartmentMember[]> {
  const cleanCode = aptCode.trim();
  if (!cleanCode) return [];
  const { data, error } = await supabaseAdmin
    .from('apartment_members')
    .select('*')
    .ilike('apartment_code', cleanCode)
    .order('created_at', { ascending: true });
  if (error) throw new Error(`Supabase apartment_members select error: ${error.message}`);
  return (data ?? []).map(mapMemberRow);
}

export async function upsertApartmentMemberDb(
  aptCode: string,
  member: Partial<ApartmentMember> & { fullName: string; phone: string }
): Promise<ApartmentMember[]> {
  const cleanCode = aptCode.trim().toUpperCase();
  const id = member.id || `mem-${Date.now()}`;
  const { error } = await supabaseAdmin.from('apartment_members').upsert({
    id,
    apartment_code: cleanCode,
    full_name: member.fullName,
    phone: member.phone,
    email: member.email ?? null,
    role: member.role || 'Family',
    relationship: member.relationship || 'Người nhà',
    id_card: member.idCard || null,
    license_plate: member.licensePlate || null,
    avatar_url: member.avatarUrl || null,
    face_status: member.faceStatus || 'Chưa Thiết Lập',
    dob: member.dob || null,
    gender: member.gender || null,
    pob: member.pob || null,
    id_date: member.idDate || null,
    id_place: member.idPlace || null,
    vehicle_type: member.vehicleType || null,
  });
  if (error) throw new Error(`Supabase apartment_members upsert error: ${error.message}`);
  return listApartmentMembersDb(cleanCode);
}

export async function updateApartmentMemberDb(
  aptCode: string,
  userIdOrPhone: string,
  updates: Partial<ApartmentMember>
): Promise<ApartmentMember[]> {
  const cleanCode = aptCode.trim().toUpperCase();
  const cleanTarget = userIdOrPhone.trim();
  const { data: existing } = await supabaseAdmin
    .from('apartment_members')
    .select('id')
    .ilike('apartment_code', cleanCode)
    .or(`id.eq.${cleanTarget},user_id.eq.${cleanTarget},phone.eq.${cleanTarget}`)
    .limit(1)
    .maybeSingle();

  if (existing) {
    const patch: Database['public']['Tables']['apartment_members']['Update'] = {};
    if (updates.fullName !== undefined) patch.full_name = updates.fullName;
    if (updates.relationship !== undefined) patch.relationship = updates.relationship;
    if (updates.phone !== undefined) patch.phone = updates.phone;
    if (updates.email !== undefined) patch.email = updates.email;
    if (updates.idCard !== undefined) patch.id_card = updates.idCard;
    if (updates.licensePlate !== undefined) patch.license_plate = updates.licensePlate;
    if (updates.avatarUrl !== undefined) patch.avatar_url = updates.avatarUrl;
    if (updates.faceStatus !== undefined) patch.face_status = updates.faceStatus;
    if (Object.keys(patch).length > 0) {
      await supabaseAdmin.from('apartment_members').update(patch).eq('id', existing.id);
    }
  }
  return listApartmentMembersDb(cleanCode);
}

export async function removeApartmentMemberDb(
  aptCode: string,
  memberId: string
): Promise<ApartmentMember[]> {
  const cleanCode = aptCode.trim().toUpperCase();
  const { error } = await supabaseAdmin
    .from('apartment_members')
    .delete()
    .ilike('apartment_code', cleanCode)
    .eq('id', memberId);
  if (error) throw new Error(`Supabase apartment_members delete error: ${error.message}`);
  return listApartmentMembersDb(cleanCode);
}
