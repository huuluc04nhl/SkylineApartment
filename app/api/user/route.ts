import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { findUserStore, extractUserIdFromToken } from '@/lib/userStore';

function formatToDateInput(d?: string): string {
  if (!d) return '';
  const cleanD = d.replace(/[^\d\/\-\.]/g, '');
  const parts = cleanD.split(/[\/\-\.]/);
  if (parts.length === 3) {
    if (parts[2].length === 4) {
      const day = parts[0].padStart(2, '0');
      const month = parts[1].padStart(2, '0');
      const year = parts[2];
      return `${year}-${month}-${day}`;
    }
    if (parts[0].length === 4) {
      const year = parts[0];
      const month = parts[1].padStart(2, '0');
      const day = parts[2].padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
  }
  return d;
}

function resolveUserFromToken(token?: string) {
  if (!token) return null;
  const userId = extractUserIdFromToken(token);
  if (userId) {
    return findUserStore(userId);
  }
  return findUserStore(token);
}

export async function POST(req: Request) {
  try {
    let access_token: string | undefined;

    try {
      const body = await req.json();
      access_token = body.access_token;
    } catch (e) {
      // Body empty
    }

    if (!access_token) {
      const cookieStore = cookies();
      access_token = cookieStore.get('skyline_token')?.value;
    }

    if (!access_token) {
      return NextResponse.json({ success: false, message: 'Chưa đăng nhập (No Token)' }, { status: 401 });
    }

    const storedUser = resolveUserFromToken(access_token);
    if (!storedUser || !storedUser.id) {
      return NextResponse.json(
        { success: false, user: null, message: 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn.' },
        { status: 401 }
      );
    }

    const formatted = {
      id: storedUser.id,
      username: storedUser.username || '',
      firstname: storedUser.firstname || '',
      lastname: storedUser.lastname || '',
      fullname: storedUser.fullname || storedUser.full_name || 'Cư Dân SKYLINE',
      full_name: storedUser.fullname || storedUser.full_name || 'Cư Dân SKYLINE',
      email: storedUser.email || '',
      phone: storedUser.phone || '',
      role: storedUser.role,
      apartment_code: storedUser.apartment_code || (storedUser.role === 'ADMIN' ? 'BQL_OFFICE' : storedUser.role === 'TECHNICIAN' ? 'TECH_ROOM' : 'CH-06'),
      relationship: storedUser.relationship || (storedUser.role === 'ADMIN' || storedUser.role === 'TECHNICIAN' ? 'Staff' : storedUser.role === 'OWNER' ? 'Owner' : 'Family'),
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
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Lỗi xác thực người dùng nội bộ' }, { status: 500 });
  }
}

export async function GET() {
  const cookieStore = cookies();
  const token = cookieStore.get('skyline_token')?.value;

  if (!token) {
    return NextResponse.json({ success: false, user: null, message: 'Chưa đăng nhập' }, { status: 200 });
  }

  const storedUser = resolveUserFromToken(token);
  if (!storedUser || !storedUser.id) {
    return NextResponse.json({ success: false, user: null, message: 'Phiên làm việc hết hạn' }, { status: 200 });
  }

  const formatted = {
    id: storedUser.id,
    username: storedUser.username || '',
    firstname: storedUser.firstname || '',
    lastname: storedUser.lastname || '',
    fullname: storedUser.fullname || storedUser.full_name || 'Cư Dân SKYLINE',
    full_name: storedUser.fullname || storedUser.full_name || 'Cư Dân SKYLINE',
    email: storedUser.email || '',
    phone: storedUser.phone || '',
    role: storedUser.role,
    apartment_code: storedUser.apartment_code || (storedUser.role === 'ADMIN' ? 'BQL_OFFICE' : storedUser.role === 'TECHNICIAN' ? 'TECH_ROOM' : 'CH-06'),
    relationship: storedUser.relationship || (storedUser.role === 'ADMIN' || storedUser.role === 'TECHNICIAN' ? 'Staff' : storedUser.role === 'OWNER' ? 'Owner' : 'Family'),
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
