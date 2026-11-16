import { createServerClient } from "@supabase/ssr";
import { cookies, headers } from "next/headers";
import { resolveCrossSubdomainCookieDomain } from "./sso-cookie";

export async function createServerSupabaseClient() {
  const cookieStore = await cookies();
  const headerStore = await headers();
  const host = headerStore.get("x-forwarded-host") || headerStore.get("host");
  const ssoDomain = resolveCrossSubdomainCookieDomain(host);

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "https://mock.supabase.co",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "mock-anon-key",
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, {
                ...options,
                ...(ssoDomain ? { domain: ssoDomain } : {}),
              })
            );
          } catch {
            // Server Component에서 호출될 때 쿠키 쓰기는 미들웨어/액션에 위임
          }
        },
      },
      global: {
        headers: {
          Accept: "application/json",
        },
      },
    }
  );
}
