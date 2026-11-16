"use client";

import { createBrowserClient } from "@supabase/ssr";
import { resolveCrossSubdomainCookieDomain } from "./sso-cookie";

let browserClient: ReturnType<typeof createBrowserClient> | null = null;

function parseDocumentCookies(): Array<{ name: string; value: string }> {
  if (typeof document === "undefined" || !document.cookie) return [];
  return document.cookie
    .split("; ")
    .filter(Boolean)
    .map((entry) => {
      const eqIdx = entry.indexOf("=");
      if (eqIdx === -1) return { name: entry, value: "" };
      const rawName = entry.slice(0, eqIdx);
      const rawValue = entry.slice(eqIdx + 1);
      try {
        return {
          name: decodeURIComponent(rawName),
          value: decodeURIComponent(rawValue),
        };
      } catch {
        return { name: rawName, value: rawValue };
      }
    });
}

function serializeDocumentCookie(
  name: string,
  value: string,
  options?: {
    domain?: string;
    path?: string;
    maxAge?: number;
    sameSite?: "lax" | "strict" | "none" | boolean;
    secure?: boolean;
  }
): string {
  const parts = [`${encodeURIComponent(name)}=${encodeURIComponent(value)}`];
  parts.push(`Path=${options?.path || "/"}`);
  if (options?.domain) {
    parts.push(`Domain=${options.domain}`);
  }
  if (typeof options?.maxAge === "number") {
    parts.push(`Max-Age=${Math.floor(options.maxAge)}`);
  }
  const sameSite =
    typeof options?.sameSite === "string"
      ? options.sameSite.charAt(0).toUpperCase() + options.sameSite.slice(1)
      : "Lax";
  parts.push(`SameSite=${sameSite}`);
  if (options?.secure) {
    parts.push("Secure");
  }
  return parts.join("; ");
}

export function createClient() {
  if (typeof window !== "undefined" && browserClient) {
    return browserClient;
  }

  const cookieDomain =
    typeof window !== "undefined"
      ? resolveCrossSubdomainCookieDomain(window.location.hostname)
      : undefined;
  const isHttps =
    typeof window !== "undefined" && window.location.protocol === "https:";

  const client = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return parseDocumentCookies();
        },
        setAll(cookiesToSet) {
          if (typeof document === "undefined") return;
          for (const { name, value, options } of cookiesToSet) {
            const isRemoval = !value || options?.maxAge === 0;
            const resolvedOptions = {
              path: options?.path ?? "/",
              maxAge: options?.maxAge,
              sameSite: (options?.sameSite as "lax" | "strict" | "none" | undefined) ?? "lax",
              secure: options?.secure ?? isHttps,
              ...(cookieDomain ? { domain: cookieDomain } : {}),
            };
            document.cookie = serializeDocumentCookie(name, value, resolvedOptions);
            // 기존에 domain 없이(Host-Only) 구워졌던 구형 쿠키가 남아 무한 refresh_token 루프를
            // 일으키는 현상을 막기 위해, 쿠키 갱신/삭제 시 Host-Only 버전도 함께 정리
            if (cookieDomain && (isRemoval || name.includes("-auth-token"))) {
              document.cookie = serializeDocumentCookie(name, "", {
                path: "/",
                maxAge: 0,
                sameSite: "lax",
                secure: isHttps,
              });
            }
          }
        },
      },
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
