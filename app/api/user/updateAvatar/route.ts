import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/server/auth';
import { updateUserProfileDb } from '@/lib/server/userDb';

export async function POST(req: Request) {
  try {
    const session = await getAuthenticatedUser();
    if (!session) {
      return NextResponse.json({ success: false, message: 'Chưa đăng nhập' }, { status: 401 });
    }
    const body = await req.json();
    const { avatar } = body;

    const updated = await updateUserProfileDb(session.authUserId, {
      avatar_url: avatar
    });

    return NextResponse.json({
      success: true,
      message: 'Cập nhật ảnh đại diện thành công',
      avatar_url: avatar,
      user: {
        ...updated,
        avatar_url: avatar,
        avatar: avatar,
      }
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Lỗi cập nhật ảnh đại diện' }, { status: 500 });
  }
}
