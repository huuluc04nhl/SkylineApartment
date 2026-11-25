import 'server-only';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import type { StoredUser } from '@/lib/userStore';

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

  if (!profileRow || !profileRow.role) {
    return null;
  }

  const role = profileRow.role as StoredUser['role'];
  const apartmentCode = profileRow.apartment_code ?? null;

  const mergedUser: StoredUser = {
    id: profileRow.legacy_user_id || authUser.id,
    username: authUser.email || authUser.id,
    fullname: profileRow.full_name || 'Cư Dân SKYLINE',
    full_name: profileRow.full_name || 'Cư Dân SKYLINE',
    phone: profileRow.phone || authUser.phone || '',
    email: authUser.email || profileRow.email || '',
    role,
    apartment_code: apartmentCode || '',
    relationship: (profileRow.relationship as StoredUser['relationship']) || undefined,
    avatar_url: profileRow.avatar_url || undefined,
    gender: 1,
  };

  return {
    authUserId: authUser.id,
    email: authUser.email || '',
    role,
    apartment_code: apartmentCode,
    profile: mergedUser,
  };
}
