import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { extractUserIdFromToken, verifyUserPassword, updateUserPassword } from '@/lib/userStore';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { 
      old_password, 
      password, 
      confirm_password, 
      access_token 
    } = body;

    if (!old_password || !old_password.trim()) {
      return NextResponse.json(
        { success: false, message: 'Vui lòng nhập mật khẩu hiện tại để xác thực tài khoản.' },
        { status: 400 }
      );
    }

    if (!password || password.trim().length < 6) {
      return NextResponse.json(
        { success: false, message: 'Mật khẩu mới phải có độ dài tối thiểu 6 ký tự.' },
        { status: 400 }
      );
    }

    if (confirm_password && password !== confirm_password) {
      return NextResponse.json(
        { success: false, message: 'Mật khẩu xác nhận không khớp với mật khẩu mới.' },
        { status: 400 }
      );
    }

    if (old_password === password) {
      return NextResponse.json(
        { success: false, message: 'Mật khẩu mới không được trùng với mật khẩu hiện tại.' },
        { status: 400 }
      );
    }

    const cookieStore = cookies();
    const token = access_token || cookieStore.get('skyline_token')?.value || '';

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại để đổi mật khẩu.' },
        { status: 401 }
      );
    }

    const userIdentifier = extractUserIdFromToken(token) || body.username || body.phone || 'user-owner-1';
    const isCurrentPasswordCorrect = verifyUserPassword(userIdentifier, old_password);

    if (!isCurrentPasswordCorrect) {
      return NextResponse.json(
        { success: false, message: 'Mật khẩu hiện tại không chính xác. Vui lòng kiểm tra lại.' },
        { status: 400 }
      );
    }

    updateUserPassword(userIdentifier, password);

    return NextResponse.json({
      success: true,
      message: 'Cập nhật mật khẩu tài khoản thành công.',
      updated_at: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error updating password:', error);
    return NextResponse.json(
      { success: false, message: 'Lỗi máy chủ khi cập nhật mật khẩu: ' + (error?.message || '') },
      { status: 500 }
    );
  }
}
