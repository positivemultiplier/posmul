import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const next = requestUrl.searchParams.get("next") || "/dashboard";

  const forwardedHost = request.headers.get("x-forwarded-host");
  const isLocalEnv = process.env.NODE_ENV === "development";
  const redirectOrigin = forwardedHost && !isLocalEnv ? `https://${forwardedHost}` : requestUrl.origin;

  const callbackUrl = `${redirectOrigin}/api/auth/kakao/callback`;
  const state = JSON.stringify({ next, nonce: Math.random().toString(36).substring(7) });

  const clientId = process.env.KAKAO_REST_API_KEY;

  if (!clientId) {
    return NextResponse.redirect(`${redirectOrigin}/auth/login?error=kakao_not_configured`);
  }

  const kakaoAuthUrl = new URL("https://kauth.kakao.com/oauth/authorize");
  kakaoAuthUrl.searchParams.set("client_id", clientId);
  kakaoAuthUrl.searchParams.set("redirect_uri", callbackUrl);
  kakaoAuthUrl.searchParams.set("response_type", "code");
  kakaoAuthUrl.searchParams.set("state", state);

  return NextResponse.redirect(kakaoAuthUrl.toString());
}

