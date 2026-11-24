import { NextResponse } from 'next/server';
import { findUserStore, verifyUserPassword } from '@/lib/userStore';

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

    const u = username.trim();
    const user = findUserStore(u);

    if (!user || !user.id) {
      return NextResponse.json(
        { success: false, message: 'Tài khoản không tồn tại trên hệ thống Skyline Smart Residence.' },
        { status: 401 }
      );
    }

    // Xác thực mật khẩu nội bộ trực tiếp
    const isPasswordValid = verifyUserPassword(u, password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { success: false, message: 'Mật khẩu đăng nhập không chính xác. Vui lòng kiểm tra lại.' },
        { status: 401 }
      );
    }

    // Tạo token phiên làm việc nội bộ
    const accessToken = `skyline_session_${user.id}_${Date.now()}`;

    const formattedUser = {
      id: user.id,
      username: user.username || u,
      firstname: user.firstname || '',
      lastname: user.lastname || '',
      fullname: user.fullname || user.full_name || 'Cư Dân SKYLINE',
      full_name: user.fullname || user.full_name || 'Cư Dân SKYLINE',
      email: user.email || u,
      phone: user.phone || '',
      role: user.role,
      apartment_code: user.apartment_code || (user.role === 'ADMIN' ? 'BQL_OFFICE' : user.role === 'TECHNICIAN' ? 'TECH_ROOM' : 'CH-06'),
      relationship: user.relationship || (user.role === 'ADMIN' || user.role === 'TECHNICIAN' ? 'Staff' : user.role === 'OWNER' ? 'Owner' : 'Family'),
      avatar_url: user.avatar_url,
      avatar: user.avatar_url,
      id_number: user.id_number || user.id_card_no || '',
      id_card_no: user.id_card_no || user.id_number || '',
      id_card_number: user.id_card_no || user.id_number || '',
      id_date: formatToDateInput(user.id_date || ''),
      id_place: user.id_place || '',
      province: user.province || 'Thành phố Hồ Chí Minh',
      gender: user.gender ?? 1,
      dob: formatToDateInput(user.dob || ''),
      pob: user.pob || '',
      intro: user.intro || '',
      license_plate: user.license_plate || '',
    };

    const response = NextResponse.json({
      success: true,
      message: 'Đăng nhập thành công',
      access_token: accessToken,
      user: formattedUser,
    });

    response.cookies.set('skyline_token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error: any) {
    console.error('Login route error:', error?.message || error);
    return NextResponse.json(
      { success: false, message: 'Lỗi máy chủ xử lý đăng nhập: ' + (error?.message || '') },
      { status: 500 }
    );
  }
}
