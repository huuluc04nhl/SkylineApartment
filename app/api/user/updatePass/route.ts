import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getAuthenticatedUser } from '@/lib/server/auth';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { old_password, password, confirm_password } = body;

    if (!old_password || typeof old_password !== 'string' || !old_password.trim()) {
      return NextResponse.json(
        { success: false, message: 'Vui lòng nhập mật khẩu hiện tại để xác thực tài khoản.' },
        { status: 400 }
      );
    }

    if (!password || typeof password !== 'string' || password.trim().length < 8) {
      return NextResponse.json(
        { success: false, message: 'Mật khẩu mới phải có độ dài tối thiểu 8 ký tự.' },
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

    const sessionUser = await getAuthenticatedUser();
    if (!sessionUser || !sessionUser.email) {
      return NextResponse.json(
        { success: false, message: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại để đổi mật khẩu.' },
        { status: 401 }
      );
    }

    const supabase = createSupabaseServerClient();

    // Xác thực lại mật khẩu cũ trước khi cho phép đổi mật khẩu
    const { error: reauthError } = await supabase.auth.signInWithPassword({
      email: sessionUser.email,
      password: old_password,
    });

    if (reauthError) {
      return NextResponse.json(
        { success: false, message: 'Mật khẩu hiện tại không chính xác. Vui lòng kiểm tra lại.' },
        { status: 401 }
      );
    }

    const { error: updateError } = await supabase.auth.updateUser({
      password,
    });

    if (updateError) {
      return NextResponse.json(
        { success: false, message: `Không thể cập nhật mật khẩu: ${updateError.message}` },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Cập nhật mật khẩu tài khoản thành công.',
      updated_at: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error updating password:', error);
    return NextResponse.json(
      { success: false, message: 'Lỗi máy chủ khi cập nhật mật khẩu.' },
      { status: 500 }
    );
  }
}
