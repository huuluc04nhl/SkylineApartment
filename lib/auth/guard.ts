import 'server-only';
import { NextResponse } from 'next/server';
import { getAuthenticatedUser, type AuthenticatedSessionUser } from '@/lib/server/auth';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { UserRole } from '@/lib/db/schema';

export type GuardSuccess = {
  ok: true;
  session: AuthenticatedSessionUser;
  supabase: ReturnType<typeof createSupabaseServerClient>;
};

export type GuardFailure = {
  ok: false;
  response: NextResponse;
};

/**
 * Lớp guard thứ hai ở Route Handler (bên cạnh RLS trên PostgreSQL).
 * - Trả 401 nếu chưa đăng nhập hoặc phiên không hợp lệ.
 * - Trả 403 nếu role trong bảng public.profiles không nằm trong allowedRoles.
 * - Tuyệt đối không tin userId, role, apt_code từ request body để quyết định quyền.
 */
export async function requireAuth(
  allowedRoles?: UserRole[]
): Promise<GuardSuccess | GuardFailure> {
  const session = await getAuthenticatedUser();
  if (!session) {
    return {
      ok: false,
      response: NextResponse.json(
        { success: false, message: 'Chưa đăng nhập hoặc phiên không hợp lệ.' },
        { status: 401 }
      ),
    };
  }

  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(session.role)) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          success: false,
          message: `Quyền truy cập bị từ chối. Vai trò ${session.role} không được phép thực hiện thao tác này.`,
        },
        { status: 403 }
      ),
    };
  }

  return {
    ok: true,
    session,
    supabase: createSupabaseServerClient(),
  };
}
