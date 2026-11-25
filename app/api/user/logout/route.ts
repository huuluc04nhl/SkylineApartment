import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

async function handleLogout() {
  const supabase = createSupabaseServerClient();
  const { error } = await supabase.auth.signOut();
  if (error) {
    return NextResponse.json(
      { success: false, message: `Lỗi đăng xuất: ${error.message}` },
      { status: 500 }
    );
  }
  return NextResponse.json({
    success: true,
    message: 'Đăng xuất thành công',
  });
}

export async function POST() {
  return handleLogout();
}

export async function GET() {
  return handleLogout();
}
