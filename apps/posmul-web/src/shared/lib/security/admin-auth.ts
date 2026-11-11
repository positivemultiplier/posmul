import type { User } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

import { supabaseAdmin } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type AdminRole = "admin" | "super_admin";

export const ADMIN_ROLES: ReadonlySet<string> = new Set(["admin", "super_admin"]);

/**
 * 문자열이 유효한 관리자 역할('admin' | 'super_admin')인지 확인한다.
 */
export function isAdminRoleValue(role: unknown): role is AdminRole {
  return typeof role === "string" && ADMIN_ROLES.has(role);
}

/**
 * 선택적 ADMIN_EMAILS 환경변수 허용 목록을 소문자 Set으로 파싱한다.
 */
export function getConfiguredAdminEmails(): Set<string> {
  const raw = process.env.ADMIN_EMAILS ?? "";
  return new Set(
    raw
      .split(",")
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean)
  );
}

export interface ResolvedAdminInfo {
  isAdmin: boolean;
  role: AdminRole | null;
  source: "app_metadata" | "profile" | "env_email" | null;
}

/**
 * 서버 측 신뢰 출처(app_metadata, DB "user".profiles.role, ADMIN_EMAILS)로만
 * 관리자 권한을 판별한다.
 * 사용자가 임의로 수정 가능한 user_metadata는 절대 신뢰하지 않는다.
 */
export async function resolveAdminUser(
  user: User | null | undefined
): Promise<ResolvedAdminInfo> {
  if (!user) {
    return { isAdmin: false, role: null, source: null };
  }

  // 1. Supabase auth.users.raw_app_meta_data (service_role / DB 관리자만 변경 가능)
  const appMetaRole = user.app_metadata?.role;
  if (isAdminRoleValue(appMetaRole)) {
    return { isAdmin: true, role: appMetaRole, source: "app_metadata" };
  }

  // 2. DB "user".profiles.role (자가 승격 방지 트리거로 일반 사용자 변경 차단)
  const { data: profile, error } = await supabaseAdmin
    .schema("user")
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (!error && isAdminRoleValue(profile?.role)) {
    return { isAdmin: true, role: profile.role, source: "profile" };
  }

  // 3. 선택적 서버 환경변수 ADMIN_EMAILS (이메일 확인 완료된 계정만)
  const normalizedEmail = user.email?.trim().toLowerCase();
  const isEmailConfirmed = Boolean(user.email_confirmed_at || user.confirmed_at);
  if (
    normalizedEmail &&
    isEmailConfirmed &&
    getConfiguredAdminEmails().has(normalizedEmail)
  ) {
    return { isAdmin: true, role: "admin", source: "env_email" };
  }

  return { isAdmin: false, role: null, source: null };
}

export type AdminSessionResult =
  | { ok: true; user: User; role: AdminRole; reason?: "UNAUTHORIZED" | "FORBIDDEN" }
  | { ok: false; reason: "UNAUTHORIZED" | "FORBIDDEN"; user: User | null };

/**
 * Server Component / Server Action용 관리자 세션 검증
 */
export async function requireAdminSession(): Promise<AdminSessionResult> {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return { ok: false, reason: "UNAUTHORIZED", user: null };
  }

  const resolved = await resolveAdminUser(user);
  if (!resolved.isAdmin || !resolved.role) {
    return { ok: false, reason: "FORBIDDEN", user };
  }

  return { ok: true, user, role: resolved.role };
}

/**
 * Server Action 최상단에서 관리자 권한을 강제한다.
 * 미인증 또는 일반 사용자인 경우 즉시 예외를 던진다.
 */
export async function assertAdminSession(): Promise<{
  user: User;
  role: AdminRole;
}> {
  const session = await requireAdminSession();
  if (!session.ok) {
    throw new Error(
      session.reason === "UNAUTHORIZED"
        ? "UNAUTHORIZED: 관리자 로그인이 필요합니다."
        : "FORBIDDEN: 관리자 권한이 필요합니다."
    );
  }
  return { user: session.user, role: session.role };
}

export interface RequireAdminApiOptions {
  /** true이면 유효한 CRON_SECRET Bearer 또는 ?secret= 인증도 허용 */
  allowCronSecret?: boolean;
  /** query string의 ?secret= 허용 여부 (기본 true) */
  allowSecretQueryParam?: boolean;
}

export type AdminApiAuthResult =
  | {
      ok: true;
      authType: "admin";
      user: User;
      role: AdminRole;
      response?: NextResponse;
    }
  | {
      ok: true;
      authType: "cron";
      user: null;
      role: null;
      response?: NextResponse;
    }
  | {
      ok: false;
      authType?: undefined;
      user: null;
      role: null;
      response: NextResponse;
    };

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

/**
 * Fail-closed 방식의 CRON_SECRET 검증.
 * CRON_SECRET이 설정되지 않은 경우 무조건 false를 반환한다.
 */
export function hasValidCronSecret(
  request: Request,
  allowSecretQueryParam = true
): boolean {
  const expectedSecret = process.env.CRON_SECRET?.trim();
  if (!expectedSecret) {
    return false;
  }

  const authHeader = request.headers.get("authorization") ?? "";
  if (authHeader.startsWith("Bearer ")) {
    const token = authHeader.slice("Bearer ".length).trim();
    if (safeEqual(token, expectedSecret)) {
      return true;
    }
  }

  if (allowSecretQueryParam) {
    try {
      const url = new URL(request.url);
      const secretParam = url.searchParams.get("secret")?.trim();
      if (secretParam && safeEqual(secretParam, expectedSecret)) {
        return true;
      }
    } catch {
      // 잘못된 URL 형식은 무시
    }
  }

  return false;
}

/**
 * API Route Handler용 관리자(및 선택적 Cron) 접근 통제 가드.
 */
export async function requireAdminApi(
  request: Request,
  options: RequireAdminApiOptions = {}
): Promise<AdminApiAuthResult> {
  const { allowCronSecret = false, allowSecretQueryParam = true } = options;

  if (allowCronSecret && hasValidCronSecret(request, allowSecretQueryParam)) {
    return { ok: true, authType: "cron", user: null, role: null };
  }

  const session = await requireAdminSession();
  if (!session.ok) {
    const reason = session.reason ?? "FORBIDDEN";
    const status = reason === "UNAUTHORIZED" ? 401 : 403;
    return {
      ok: false,
      user: null,
      role: null,
      response: NextResponse.json(
        {
          success: false,
          error: {
            code: reason,
            message:
              reason === "UNAUTHORIZED"
                ? "Authentication required"
                : "Admin privileges required",
          },
        },
        { status }
      ),
    };
  }

  return {
    ok: true,
    authType: "admin",
    user: session.user,
    role: session.role,
  };
}

/**
 * 프로덕션(또는 Vercel production) 런타임 여부 확인
 */
export function isProductionEnvironment(): boolean {
  return (
    process.env.NODE_ENV === "production" ||
    process.env.VERCEL_ENV === "production"
  );
}

/**
 * Dev/Test 전용 API를 프로덕션 환경에서 404로 즉시 차단한다.
 */
export function blockInProduction(): NextResponse | null {
  if (isProductionEnvironment()) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "NOT_FOUND",
          message: "Not found",
        },
      },
      { status: 404 }
    );
  }
  return null;
}

