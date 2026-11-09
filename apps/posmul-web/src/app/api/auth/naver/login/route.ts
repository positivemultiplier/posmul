import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const next = requestUrl.searchParams.get("next") || "/dashboard";

  const forwardedHost = request.headers.get("x-forwarded-host");
  const isLocalEnv = process.env.NODE_ENV === "development";
  const redirectOrigin =
    forwardedHost && !isLocalEnv ? `https://${forwardedHost}` : requestUrl.origin;

  // 네이버 개발자 센터에 등록된 정확한 Callback URL 사용 (/auth/callback)
  const callbackUrl = `${redirectOrigin}/auth/callback`;
  const state = `naver_${Math.random().toString(36).substring(2, 12)}`;

  const clientId = process.env.NAVER_CLIENT_ID?.trim();

  if (!clientId) {
    return NextResponse.redirect(`${redirectOrigin}/auth/login?error=naver_not_configured`);
  }

  const naverAuthUrl = new URL("https://nid.naver.com/oauth2.0/authorize");
  naverAuthUrl.searchParams.set("response_type", "code");
  naverAuthUrl.searchParams.set("client_id", clientId);
  naverAuthUrl.searchParams.set("redirect_uri", callbackUrl);
  naverAuthUrl.searchParams.set("state", state);

  const response = NextResponse.redirect(naverAuthUrl.toString());
  response.cookies.set("posmul_oauth_provider", "naver", {
    path: "/",
    maxAge: 600,
    sameSite: "lax",
  });
  response.cookies.set("posmul_oauth_next", next, {
    path: "/",
    maxAge: 600,
    sameSite: "lax",
  });

  return response;
}
