import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { resolveCrossSubdomainCookieDomain } from "@/lib/supabase/sso-cookie";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const next = requestUrl.searchParams.get("next") || "/dashboard";

  const forwardedHost = request.headers.get("x-forwarded-host");
  const isLocalEnv = process.env.NODE_ENV === "development";
  const redirectOrigin =
    forwardedHost && !isLocalEnv ? `https://${forwardedHost}` : requestUrl.origin;

  const callbackUrl = `${redirectOrigin}/auth/callback?next=${encodeURIComponent(next)}`;
  const ssoDomain = resolveCrossSubdomainCookieDomain(new URL(redirectOrigin).hostname);
  const isHttps = redirectOrigin.startsWith("https://");

  const capturedCookies: Array<{ name: string; value: string; options?: Record<string, unknown> }> = [];
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            capturedCookies.push({ name, value, options: options as Record<string, unknown> });
          });
        },
      },
    }
  );

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: callbackUrl,
      skipBrowserRedirect: true,
      queryParams: {
        access_type: "offline",
        prompt: "consent",
      },
    },
  });

  if (error || !data?.url) {
    console.error("[posmul-web] Google OAuth init failed:", error);
    return NextResponse.redirect(
      `${redirectOrigin}/auth/login?error=${encodeURIComponent(error?.message || "google_oauth_init_failed")}`
    );
  }

  const response = NextResponse.redirect(data.url);

  // 1) 표준 Supabase code-verifier 쿠키 저장
  const verifierBackup: Array<{ name: string; value: string }> = [];
  capturedCookies.forEach(({ name, value, options }) => {
    response.cookies.set(name, value, {
      ...options,
      ...(ssoDomain ? { domain: ssoDomain } : {}),
      path: "/",
      sameSite: "lax",
      secure: isHttps,
    });
    if (name.includes("code-verifier") && value) {
      verifierBackup.push({ name, value });
    }
  });

  // 2) 클라이언트 JS(_removeSession 등)가 절대 건드릴 수 없는 HttpOnly 백업 쿠키 병행 저장
  if (verifierBackup.length > 0) {
    response.cookies.set("posmul_pkce_cv", JSON.stringify(verifierBackup), {
      httpOnly: true,
      path: "/",
      maxAge: 600,
      sameSite: "lax",
      secure: isHttps,
      ...(ssoDomain ? { domain: ssoDomain } : {}),
    });
  }

  return response;
}
