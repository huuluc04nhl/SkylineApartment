import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export async function createClient(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const isPortalRoute = request.nextUrl.pathname.startsWith("/portal");

  if (!supabaseUrl || !supabaseKey) {
    if (isPortalRoute) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return supabaseResponse;
  }

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        supabaseResponse = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  // Làm mới token phiên Supabase Auth qua @supabase/ssr và chặn truy cập /portal khi chưa đăng nhập
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (isPortalRoute && !user) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return supabaseResponse;
}
