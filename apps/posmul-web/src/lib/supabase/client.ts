"use client";

import { createBrowserClient } from "@supabase/ssr";
import { resolveCrossSubdomainCookieDomain } from "./sso-cookie";

let browserClient: ReturnType<typeof createBrowserClient> | null = null;

export function createClient() {
  if (typeof window !== "undefined" && browserClient) {
    return browserClient;
  }

  const cookieDomain =
    typeof window !== "undefined"
      ? resolveCrossSubdomainCookieDomain(window.location.hostname)
      : undefined;

  const client = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      ...(cookieDomain
        ? {
            cookieOptions: {
              domain: cookieDomain,
              path: "/",
              sameSite: "lax" as const,
              secure: true,
            },
          }
        : {}),
      global: {
        headers: {
          Accept: "application/json",
        },
      },
    }
  );

  if (typeof window !== "undefined") {
    browserClient = client;
  }

  return client;
}
