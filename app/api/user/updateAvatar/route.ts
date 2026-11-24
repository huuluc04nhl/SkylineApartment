import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { updateUserStore, extractUserIdFromToken } from '@/lib/userStore';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { avatar, access_token } = body;

    const cookieStore = cookies();
    const token = access_token || cookieStore.get('skyline_token')?.value || '';

    const userIdentifier = extractUserIdFromToken(token) || body.username || body.phone || 'user-owner-1';
    const updated = updateUserStore(userIdentifier, {
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
