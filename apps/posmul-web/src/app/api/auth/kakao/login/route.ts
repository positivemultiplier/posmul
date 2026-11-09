import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const next = requestUrl.searchParams.get("next") || "/dashboard";

  const forwardedHost = request.headers.get("x-forwarded-host");
  const isLocalEnv = process.env.NODE_ENV === "development";
  const redirectOrigin =
    forwardedHost && !isLocalEnv ? `https://${forwardedHost}` : requestUrl.origin;

  // 카카오 개발자 콘솔에 등록된 정확한 Redirect URI 사용 (/auth/callback)
  const callbackUrl = `${redirectOrigin}/auth/callback`;
  const state = `kakao_${Math.random().toString(36).substring(2, 12)}`;

  const clientId = process.env.KAKAO_REST_API_KEY;

  if (!clientId) {
    return NextResponse.redirect(`${redirectOrigin}/auth/login?error=kakao_not_configured`);
  }

  const kakaoAuthUrl = new URL("https://kauth.kakao.com/oauth/authorize");
  kakaoAuthUrl.searchParams.set("client_id", clientId);
  kakaoAuthUrl.searchParams.set("redirect_uri", callbackUrl);
  kakaoAuthUrl.searchParams.set("response_type", "code");
  kakaoAuthUrl.searchParams.set("state", state);

  const response = NextResponse.redirect(kakaoAuthUrl.toString());
  response.cookies.set("posmul_oauth_provider", "kakao", {
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
