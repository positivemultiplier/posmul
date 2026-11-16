import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { ensurePosmulUserLinked } from "@/lib/auth-provision";
import {
  resolveCrossSubdomainCookieDomain,
  resolveSafeNextPath,
} from "@/lib/supabase/sso-cookie";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const nextPath = resolveSafeNextPath(requestUrl.searchParams.get("next"));
  const forwardedHost = request.headers.get("x-forwarded-host");
  const isLocalEnv = process.env.NODE_ENV === "development";
  const redirectOrigin =
    forwardedHost && !isLocalEnv ? `https://${forwardedHost}` : requestUrl.origin;

  if (!code) {
    return NextResponse.redirect(`${redirectOrigin}/auth/login?error=no_code`);
  }

  const getCookiesWithPkceBackup = () => {
    const reqCookies = request.cookies.getAll();
    const hasCodeVerifier = reqCookies.some(
      (c) => c.name.includes("code-verifier") && Boolean(c.value)
    );
    if (!hasCodeVerifier) {
      const backupRaw = request.cookies.get("posmul_pkce_cv")?.value;
      if (backupRaw) {
        try {
          const parsed = JSON.parse(backupRaw) as Array<{ name: string; value: string }>;
          if (Array.isArray(parsed)) {
            return [...reqCookies, ...parsed];
          }
        } catch {
          // ignore malformed backup cookie
        }
      }
    }
    return reqCookies;
  };

  const capturedCookies: Array<{ name: string; value: string; options?: Record<string, unknown> }> = [];
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return getCookiesWithPkceBackup();
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

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(
      `${redirectOrigin}/auth/login?error=${encodeURIComponent(error.message || "auth_error")}`
    );
  }

  try {
    const { data } = await supabase.auth.getUser();
    if (data.user) {
      await ensurePosmulUserLinked(data.user);
    }
  } catch (err) {
    console.warn("[housing-pro callback] provision warning:", err);
  }

  const ssoDomain = resolveCrossSubdomainCookieDomain(new URL(redirectOrigin).hostname);
  const response = NextResponse.redirect(`${redirectOrigin}${nextPath}`);
  capturedCookies.forEach(({ name, value, options }) => {
    response.cookies.set(name, value, {
      ...options,
      ...(ssoDomain ? { domain: ssoDomain } : {}),
    });
    if (ssoDomain && name.includes("-auth-token") && value) {
      response.cookies.set(name, "", { path: "/", maxAge: 0, sameSite: "lax" });
    }
  });
  response.cookies.set("posmul_pkce_cv", "", {
    path: "/",
    maxAge: 0,
    ...(ssoDomain ? { domain: ssoDomain } : {}),
  });
  response.cookies.set("posmul_pkce_cv", "", { path: "/", maxAge: 0 });

  return response;
}
