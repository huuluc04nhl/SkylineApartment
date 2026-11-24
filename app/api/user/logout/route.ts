import { NextResponse } from 'next/server';

export async function POST() {
  const res = NextResponse.json({
    success: true,
    message: 'Đăng xuất thành công',
  });

  // Clear HTTP cookie
  res.cookies.delete('skyline_token');
  res.cookies.delete('skyline_user_role');
  return res;
}

export async function GET() {
  const res = NextResponse.json({
    success: true,
    message: 'Đăng xuất thành công',
  });

  res.cookies.delete('skyline_token');
  res.cookies.delete('skyline_user_role');
  return res;
}
