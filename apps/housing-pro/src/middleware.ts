import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { resolveCrossSubdomainCookieDomain } from "./lib/supabase/sso-cookie";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/auth/callback") ||
    pathname.startsWith("/api/auth/") ||
    pathname.startsWith("/_next") ||
    pathname === "/favicon.ico" ||
    /\.(.*)$/.test(pathname)
  ) {
    return NextResponse.next();
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.next();
  }

  const hasSbCookie = request.cookies
    .getAll()
    .some((c) => c.name.startsWith("sb-") && Boolean(c.value));
  if (!hasSbCookie) {
    return NextResponse.next();
  }

  const host = request.headers.get("x-forwarded-host") || request.headers.get("host");
  const ssoDomain = resolveCrossSubdomainCookieDomain(host);
  const isHttps = request.nextUrl.protocol === "https:" || Boolean(ssoDomain);

  let response = NextResponse.next({ request });

  try {
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, {
              ...options,
              path: "/",
              sameSite: "lax",
              secure: isHttps,
              ...(ssoDomain ? { domain: ssoDomain } : {}),
            });
          });
        },
      },
    });

    await supabase.auth.getUser();
  } catch {
    // 일시적인 인증 조회 오류 시 요청 흐름 유지
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
