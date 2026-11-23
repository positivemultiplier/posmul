import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { resolveCrossSubdomainCookieDomain } from "./lib/supabase/sso-cookie";

const VALID_PASSWORDS = [
  "modoo3gi",
  "posmul2026",
  (process.env.SITE_SECRET_PASS || "").trim().toLowerCase(),
].filter(Boolean);

/**
 * Supabase 인증 쿠키의 JWT 만료 임박 여부만 가볍게 판별 (미들웨어 중복 원격 RTT 회피용)
 * - 실제 권한/금융 검증은 모든 서버 페이지·API·Server Action의 supabase.auth.getUser()에서 엄격 수행
 * - 미들웨어는 토큰 만료가 5분 이내이거나 파싱이 불가할 때만 세션 쿠키를 원격 리프레시함
 */
function shouldRefreshSupabaseSession(request: NextRequest): boolean {
  const sbCookies = request.cookies
    .getAll()
    .filter((c) => c.name.startsWith("sb-") && c.name.includes("-auth-token") && Boolean(c.value));

  if (sbCookies.length === 0) {
    return false;
  }

  try {
    const baseKey = sbCookies[0].name.replace(/\.\d+$/, "");
    const rawValue = sbCookies
      .filter((c) => c.name === baseKey || c.name.startsWith(`${baseKey}.`))
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((c) => c.value)
      .join("");

    const jsonStr = rawValue.startsWith("base64-")
      ? atob(rawValue.slice(7).replace(/-/g, "+").replace(/_/g, "/"))
      : decodeURIComponent(rawValue);
    const parsed = JSON.parse(jsonStr) as { expires_at?: number; access_token?: string };

    let expiresAtSec = typeof parsed.expires_at === "number" ? parsed.expires_at : 0;
    if (!expiresAtSec && typeof parsed.access_token === "string") {
      const payloadPart = parsed.access_token.split(".")[1];
      if (payloadPart) {
        const padded = payloadPart.replace(/-/g, "+").replace(/_/g, "/");
        const payload = JSON.parse(atob(padded)) as { exp?: number };
        expiresAtSec = typeof payload.exp === "number" ? payload.exp : 0;
      }
    }

    if (!expiresAtSec) return true;
    const nowSec = Math.floor(Date.now() / 1000);
    // 만료 5분 전 이내일 때만 원격 리프레시 수행
    return expiresAtSec - nowSec <= 300;
  } catch {
    return true;
  }
}

async function refreshPosmulSessionCookie(
  request: NextRequest,
  baseResponse: NextResponse
): Promise<NextResponse> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    return baseResponse;
  }

  if (!shouldRefreshSupabaseSession(request)) {
    return baseResponse;
  }

  const host = request.headers.get("x-forwarded-host") || request.headers.get("host");
  const ssoDomain = resolveCrossSubdomainCookieDomain(host);
  const isHttps = request.nextUrl.protocol === "https:" || Boolean(ssoDomain);

  let response = baseResponse;
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
          response.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
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
    // 미들웨어 세션 갱신 중 일시 오류 시 페이지 응답 유지
  }

  return response;
}

export async function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  // 1. 게이트 화면, 게이트 검증 API, OAuth 인증 콜백, M2M 크론/헬스체크 API, 정적 파일 등은 미들웨어 통과
  if (
    pathname.startsWith("/gate") ||
    pathname.startsWith("/api/gate") ||
    pathname.startsWith("/auth/callback") ||
    pathname.startsWith("/api/auth/") ||
    pathname.startsWith("/api/cron/") ||
    pathname.startsWith("/api/admin/scheduler/sync") ||
    pathname.startsWith("/api/ingest") ||
    pathname === "/api/health" ||
    pathname.startsWith("/_next") ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml" ||
    pathname === "/favicon.ico" ||
    /\.(.*)$/.test(pathname)
  ) {
    const response = NextResponse.next();
    response.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
    return response;
  }

  // 2. URL 파라미터로 시크릿 패스 전달 시 자동 잠금 해제 (?pass=modoo3gi 또는 ?secret=modoo3gi)
  const queryPass = (searchParams.get("pass") || searchParams.get("secret") || "")
    .trim()
    .toLowerCase();

  if (queryPass && VALID_PASSWORDS.includes(queryPass)) {
    const cleanUrl = new URL(pathname, request.url);
    searchParams.forEach((val, key) => {
      if (key !== "pass" && key !== "secret") {
        cleanUrl.searchParams.set(key, val);
      }
    });

    const redirectResponse = NextResponse.redirect(cleanUrl);
    redirectResponse.cookies.set("posmul_access_pass", "granted", {
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
      httpOnly: false,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
    redirectResponse.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
    return redirectResponse;
  }

  // 3. 브라우저 쿠키 검증
  const hasAccess = request.cookies.get("posmul_access_pass")?.value === "granted";

  if (hasAccess) {
    const response = NextResponse.next({ request });
    response.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
    // API 요청 및 Next.js 라우터 프리페치 요청에서는 원격 Auth RTT 생략 (상세 페이지 전환 속도 향상)
    const isPrefetch =
      request.headers.get("next-router-prefetch") === "1" ||
      request.headers.get("purpose") === "prefetch" ||
      (request.headers.get("sec-purpose") || "").includes("prefetch");
    if (pathname.startsWith("/api/") || isPrefetch) {
      return response;
    }
    return refreshPosmulSessionCookie(request, response);
  }

  // 4. API 요청인데 쿠키가 없는 경우 401 Unauthorized 반환
  if (pathname.startsWith("/api/")) {
    return NextResponse.json(
      { ok: false, message: "접근 권한이 없습니다. (Private Gate Restricted)" },
      {
        status: 401,
        headers: { "X-Robots-Tag": "noindex, nofollow, noarchive" },
      }
    );
  }

  // 5. 일반 방문자: /gate 로 리다이렉트
  const gateUrl = new URL("/gate", request.url);
  const currentFullUrl = pathname + (request.nextUrl.search || "");
  if (pathname !== "/" || request.nextUrl.search) {
    gateUrl.searchParams.set("redirect", currentFullUrl);
  }

  const response = NextResponse.redirect(gateUrl);
  response.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
