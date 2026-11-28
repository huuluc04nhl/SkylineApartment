import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/guard';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { verifyResidentCardToken } from '@/lib/server/cardToken';

export async function POST(request: Request) {
  const guard = await requireAuth(['ADMIN', 'RECEPTIONIST']);
  if (!guard.ok) return guard.response;

  const body = await request.json().catch(() => ({}));
  const token = typeof body.token === 'string' ? body.token.trim() : '';
  if (!token) {
    return NextResponse.json({ success: false, status: 'INVALID_FORMAT', message: 'Thiếu mã QR thẻ cư dân.' }, { status: 400 });
  }

  const verified = verifyResidentCardToken(token);
  if (!verified.valid) {
    const message =
      verified.reason === 'EXPIRED'
        ? 'Mã QR thẻ cư dân đã hết hạn (60 giây). Vui lòng làm mới thẻ.'
        : 'Chữ ký thẻ cư dân không hợp lệ hoặc bị giả mạo.';
    return NextResponse.json({ success: false, status: verified.reason, message }, { status: 401 });
  }

  const { payload } = verified;
  const { data: profile, error } = await supabaseAdmin
    .from('profiles')
    .select('id, role, apartment_code, full_name, phone')
    .eq('id', payload.sub)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ success: false, message: `Lỗi kiểm tra hồ sơ cư dân: ${error.message}` }, { status: 500 });
  }

  const staffActor =
    (typeof guard.session.profile?.full_name === 'string' && guard.session.profile.full_name.trim()) ||
    guard.session.email ||
    guard.session.authUserId;

  const aptCode = profile?.apartment_code || payload.apt;

  if (!profile) {
    if (aptCode) {
      await supabaseAdmin.from('smart_door_access_logs').insert({
        id: `CARD-LOG-${Date.now()}-${crypto.randomUUID().slice(0, 6)}`,
        apartment_code: aptCode,
        user_name: payload.sub,
        role: payload.role,
        method: 'QR_CODE',
        status: 'DENIED',
        detail: `Tài khoản không tồn tại hoặc đã bị thu hồi (Staff: ${staffActor})`,
        timestamp: new Date().toISOString(),
      });
    }
    return NextResponse.json({ success: false, status: 'ACCOUNT_NOT_FOUND', message: 'Tài khoản cư dân không còn hoạt động.' }, { status: 404 });
  }

  if (aptCode) {
    await supabaseAdmin.from('smart_door_access_logs').insert({
      id: `CARD-LOG-${Date.now()}-${crypto.randomUUID().slice(0, 6)}`,
      apartment_code: aptCode,
      user_name: profile.full_name || payload.sub,
      role: profile.role || payload.role,
      method: 'QR_CODE',
      status: 'SUCCESS',
      detail: `Xác thực thẻ cư dân động tại sảnh (Staff: ${staffActor})`,
      timestamp: new Date().toISOString(),
    });
  }

  return NextResponse.json({
    success: true,
    status: 'VALID',
    message: `Thẻ cư dân hợp lệ: ${profile.full_name || 'Cư dân'} (${aptCode || profile.role}).`,
    resident: {
      userId: profile.id,
      fullName: profile.full_name || 'Cư dân Skyline',
      apartmentCode: aptCode || '',
      role: profile.role || payload.role,
    },
  });
}
