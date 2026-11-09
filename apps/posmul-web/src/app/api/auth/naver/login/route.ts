import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const next = requestUrl.searchParams.get("next") || "/dashboard";

  const forwardedHost = request.headers.get("x-forwarded-host");
  const isLocalEnv = process.env.NODE_ENV === "development";
  const redirectOrigin = forwardedHost && !isLocalEnv ? `https://${forwardedHost}` : requestUrl.origin;

  const callbackUrl = `${redirectOrigin}/api/auth/naver/callback`;
  const state = JSON.stringify({ next, nonce: Math.random().toString(36).substring(7) });

  const clientId = process.env.NAVER_CLIENT_ID;

  if (!clientId) {
    return NextResponse.redirect(`${redirectOrigin}/auth/login?error=naver_not_configured`);
  }

  const naverAuthUrl = new URL("https://nid.naver.com/oauth2.0/authorize");
  naverAuthUrl.searchParams.set("response_type", "code");
  naverAuthUrl.searchParams.set("client_id", clientId);
  naverAuthUrl.searchParams.set("redirect_uri", callbackUrl);
  naverAuthUrl.searchParams.set("state", state);

  return NextResponse.redirect(naverAuthUrl.toString());
}

