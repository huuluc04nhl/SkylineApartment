import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/server/auth';

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

async function resolveCurrentUserResponse() {
  const sessionUser = await getAuthenticatedUser();
  if (!sessionUser) {
    return NextResponse.json(
      { success: false, user: null, message: 'Chưa đăng nhập hoặc phiên không hợp lệ.' },
      { status: 401 }
    );
  }

  const storedUser = sessionUser.profile;
  const formatted = {
    id: storedUser.id,
    username: storedUser.username || sessionUser.email,
    firstname: storedUser.firstname || '',
    lastname: storedUser.lastname || '',
    fullname: storedUser.fullname || storedUser.full_name || 'Cư Dân SKYLINE',
    full_name: storedUser.fullname || storedUser.full_name || 'Cư Dân SKYLINE',
    email: sessionUser.email || storedUser.email || '',
    phone: storedUser.phone || '',
    role: sessionUser.role,
    apartment_code: sessionUser.apartment_code,
    relationship: storedUser.relationship || 'Tenant',
    avatar_url: storedUser.avatar_url,
    avatar: storedUser.avatar_url,
    id_number: storedUser.id_number || storedUser.id_card_no || '',
    id_card_no: storedUser.id_card_no || storedUser.id_number || '',
    id_card_number: storedUser.id_card_no || storedUser.id_number || '',
    id_date: formatToDateInput(storedUser.id_date || ''),
    id_place: storedUser.id_place || '',
    province: storedUser.province || 'Thành phố Hồ Chí Minh',
    gender: storedUser.gender ?? 1,
    dob: formatToDateInput(storedUser.dob || ''),
    pob: storedUser.pob || '',
    intro: storedUser.intro || '',
    license_plate: storedUser.license_plate || '',
    cccd_front_url: storedUser.cccd_front_url || '',
    cccd_back_url: storedUser.cccd_back_url || '',
  };

  return NextResponse.json({ success: true, user: formatted });
}

export async function POST() {
  try {
    return await resolveCurrentUserResponse();
  } catch (error: unknown) {
    return NextResponse.json(
      { success: false, message: (error instanceof Error ? error.message : String(error)) || 'Lỗi xác thực người dùng.' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    return await resolveCurrentUserResponse();
  } catch (error: unknown) {
    return NextResponse.json(
      { success: false, message: (error instanceof Error ? error.message : String(error)) || 'Lỗi xác thực người dùng.' },
      { status: 500 }
    );
  }
}
