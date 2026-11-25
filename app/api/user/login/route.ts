import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { findUserByIdentifierDb } from '@/lib/server/userDb';
import { checkRateLimit, resetRateLimit, extractClientIp } from '@/lib/server/rateLimit';

const INVALID_CREDENTIALS_MESSAGE = 'Thông tin đăng nhập không chính xác.';

function formatToDateInput(d?: string): string {
  if (!d) return '';
  const cleanD = d.replace(/[^\d\/\-\.]/g, '');
  const parts = cleanD.split(/[\/\-\.]/);
  if (parts.length === 3) {
    if (parts[2].length === 4) {
      return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
    }
    if (parts[0].length === 4) {
      return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
    }
  }
  return d;
}

async function resolveEmailForLogin(identifier: string): Promise<string | null> {
  if (identifier.includes('@')) {
    return identifier.toLowerCase();
  }

  // Đăng nhập bằng SĐT: tra email tương ứng ở server (service role), không lộ tồn tại tài khoản
  const cleanPhone = identifier.replace(/[\s.-]/g, '');
  const { data: profileMatch } = await supabaseAdmin
    .from('profiles')
    .select('email')
    .eq('phone', cleanPhone)
    .maybeSingle();

  if (profileMatch?.email) {
    return profileMatch.email.toLowerCase();
  }

  const { data: userMatch } = await supabaseAdmin
    .from('users')
    .select('email')
    .eq('phone', cleanPhone)
    .maybeSingle();

  return userMatch?.email ? userMatch.email.toLowerCase() : null;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { username, password } = body;

    if (!username || typeof username !== 'string' || username.trim() === '') {
      return NextResponse.json(
        { success: false, message: 'Vui lòng cung cấp số điện thoại hoặc email đăng nhập.' },
        { status: 400 }
      );
    }

    if (!password || typeof password !== 'string' || password.trim() === '') {
      return NextResponse.json(
        { success: false, message: 'Vui lòng nhập mật khẩu tài khoản để đăng nhập.' },
        { status: 400 }
      );
    }

    const identifier = username.trim();
    const clientIp = extractClientIp(req);
    const loginRateKey = `login:${clientIp}:${identifier.toLowerCase()}`;

    const isAllowed = await checkRateLimit(loginRateKey, 5, 300, false);
    if (!isAllowed) {
      return NextResponse.json(
        { success: false, message: 'Quá nhiều lần đăng nhập thất bại. Vui lòng thử lại sau 5 phút.' },
        { status: 429 }
      );
    }

    const email = await resolveEmailForLogin(identifier);
    if (!email) {
      await checkRateLimit(loginRateKey, 5, 300, true);
      return NextResponse.json(
        { success: false, message: INVALID_CREDENTIALS_MESSAGE },
        { status: 401 }
      );
    }

    const supabase = createSupabaseServerClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.user) {
      await checkRateLimit(loginRateKey, 5, 300, true);
      return NextResponse.json(
        { success: false, message: INVALID_CREDENTIALS_MESSAGE },
        { status: 401 }
      );
    }

    const { data: profileRow, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .maybeSingle();

    if (profileError) {
      return NextResponse.json(
        { success: false, message: 'Không thể tải hồ sơ người dùng.' },
        { status: 500 }
      );
    }

    if (!profileRow || !profileRow.role) {
      await supabase.auth.signOut().catch(() => {});
      return NextResponse.json(
        { success: false, message: 'Tài khoản chưa được cấp hồ sơ cư dân trên hệ thống.' },
        { status: 401 }
      );
    }

    await resetRateLimit(loginRateKey);

    const legacyUser =
      (profileRow.legacy_user_id && (await findUserByIdentifierDb(profileRow.legacy_user_id))) ||
      (await findUserByIdentifierDb(email)) ||
      undefined;

    const role = profileRow.role as string;
    const apartmentCode = profileRow.apartment_code ?? null;

    const formattedUser = {
      id: legacyUser?.id || data.user.id,
      username: legacyUser?.username || email,
      firstname: legacyUser?.firstname || '',
      lastname: legacyUser?.lastname || '',
      fullname: profileRow?.full_name || legacyUser?.fullname || legacyUser?.full_name || 'Cư Dân SKYLINE',
      full_name: profileRow?.full_name || legacyUser?.full_name || legacyUser?.fullname || 'Cư Dân SKYLINE',
      email: data.user.email || email,
      phone: profileRow?.phone || legacyUser?.phone || '',
      role,
      apartment_code: apartmentCode,
      relationship: profileRow?.relationship || legacyUser?.relationship || 'Tenant',
      avatar_url: profileRow?.avatar_url || legacyUser?.avatar_url,
      avatar: profileRow?.avatar_url || legacyUser?.avatar_url,
      id_number: legacyUser?.id_number || legacyUser?.id_card_no || '',
      id_card_no: legacyUser?.id_card_no || legacyUser?.id_number || '',
      id_card_number: legacyUser?.id_card_no || legacyUser?.id_number || '',
      id_date: formatToDateInput(legacyUser?.id_date || ''),
      id_place: legacyUser?.id_place || '',
      province: legacyUser?.province || 'Thành phố Hồ Chí Minh',
      gender: legacyUser?.gender ?? 1,
      dob: formatToDateInput(legacyUser?.dob || ''),
      pob: legacyUser?.pob || '',
      intro: legacyUser?.intro || '',
      license_plate: legacyUser?.license_plate || '',
    };

    return NextResponse.json({
      success: true,
      message: 'Đăng nhập thành công',
      user: formattedUser,
    });
  } catch (error: any) {
    console.error('Login route error:', error?.message || error);
    return NextResponse.json(
      { success: false, message: 'Lỗi máy chủ xử lý đăng nhập.' },
      { status: 500 }
    );
  }
}
