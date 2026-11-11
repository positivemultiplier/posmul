import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const VALID_PASSWORDS = [
  "modoo3gi",
  "posmul2026",
  (process.env.SITE_SECRET_PASS || "").trim().toLowerCase(),
].filter(Boolean);

export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  // 1. 게이트 화면, 게이트 검증 API, OAuth 인증 콜백, M2M 크론/헬스체크 API, 정적 파일 등은 미들웨어 통과
  // (각 보호 API 라우트는 자체적으로 requireAdminApi(..., { allowCronSecret: true })로 인증 검증)
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
    /\.(.*)$/.test(pathname) // 정적 파일 확장자 (.png, .jpg, .svg, .webp 등)
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
    // 쿼리 파라미터를 제거한 깔끔한 URL로 리다이렉트
    const cleanUrl = new URL(pathname, request.url);
    searchParams.forEach((val, key) => {
      if (key !== "pass" && key !== "secret") {
        cleanUrl.searchParams.set(key, val);
      }
    });

    const redirectResponse = NextResponse.redirect(cleanUrl);
    redirectResponse.cookies.set("posmul_access_pass", "granted", {
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30일
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
    const response = NextResponse.next();
    response.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
    return response;
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

  // 5. 일반 방문자: /gate 로 리다이렉트 (직전 접근하려던 경로 보존)
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
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};

