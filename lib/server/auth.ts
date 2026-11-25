import 'server-only';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { findUserStore, type StoredUser } from '@/lib/userStore';

export interface AuthenticatedSessionUser {
  authUserId: string;
  email: string;
  role: StoredUser['role'];
  apartment_code: string | null;
  profile: StoredUser;
}

/**
 * Xác thực người dùng từ cookie phiên Supabase (luôn gọi getUser(), không dùng getSession()).
 * Lấy role & apartment_code từ bảng public.profiles trên server.
 */
export async function getAuthenticatedUser(): Promise<AuthenticatedSessionUser | null> {
  const supabase = createSupabaseServerClient();
  const {
    data: { user: authUser },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !authUser) {
    return null;
  }

  const { data: profileRow, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('id', authUser.id)
    .maybeSingle();

  if (profileError) {
    throw new Error(`Không thể đọc profile người dùng: ${profileError.message}`);
  }

  const legacyMatch =
    (profileRow?.legacy_user_id && findUserStore(profileRow.legacy_user_id)) ||
    (authUser.email && findUserStore(authUser.email)) ||
    (profileRow?.phone && findUserStore(profileRow.phone)) ||
    undefined;

  const role = (profileRow?.role || legacyMatch?.role || 'TENANT') as StoredUser['role'];
  const apartmentCode = profileRow?.apartment_code ?? legacyMatch?.apartment_code ?? null;

  const mergedUser: StoredUser = {
    ...(legacyMatch || {
      id: authUser.id,
      username: authUser.email || authUser.id,
      fullname: profileRow?.full_name || 'Cư Dân SKYLINE',
      full_name: profileRow?.full_name || 'Cư Dân SKYLINE',
      phone: profileRow?.phone || authUser.phone || '',
      email: authUser.email || '',
      role,
      gender: 1,
    }),
    id: legacyMatch?.id || authUser.id,
    email: authUser.email || legacyMatch?.email || '',
    phone: profileRow?.phone || legacyMatch?.phone || authUser.phone || '',
    fullname: profileRow?.full_name || legacyMatch?.fullname || 'Cư Dân SKYLINE',
    full_name: profileRow?.full_name || legacyMatch?.full_name || 'Cư Dân SKYLINE',
    role,
    apartment_code: apartmentCode || '',
    relationship: (profileRow?.relationship as StoredUser['relationship']) || legacyMatch?.relationship,
    avatar_url: profileRow?.avatar_url || legacyMatch?.avatar_url,
  };

  return {
    authUserId: authUser.id,
    email: authUser.email || '',
    role,
    apartment_code: apartmentCode,
    profile: mergedUser,
  };
}
