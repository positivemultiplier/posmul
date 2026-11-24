import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminApi } from "@/shared/lib/security/admin-auth";
import type { FeatureFlagDomain } from "@/shared/lib/feature-flags/feature-flags.domain";
import {
  listFeatureFlagsForAdmin,
  updateSiteFeatureFlag,
} from "@/shared/lib/feature-flags/feature-flags.server";

const ALLOWED_DOMAINS = new Set<FeatureFlagDomain>([
  "system",
  "prediction",
  "forum",
  "donation",
  "consume",
  "economy",
  "ranking",
  "users",
  "healing_room",
]);

const UpdateFlagSchema = z.object({
  flagKey: z.string().min(2).max(120),
  enabled: z.boolean(),
  configJson: z.record(z.unknown()).optional(),
  reason: z.string().max(300).optional(),
});

export async function GET(request: NextRequest) {
  const auth = await requireAdminApi(request);
  if (!auth.ok) return auth.response;

  const domainParam = request.nextUrl.searchParams.get("domain")?.trim();
  const domain =
    domainParam && ALLOWED_DOMAINS.has(domainParam as FeatureFlagDomain)
      ? (domainParam as FeatureFlagDomain)
      : undefined;

  const data = await listFeatureFlagsForAdmin(domain);
  return NextResponse.json({
    ok: true,
    ...data,
  });
}

export async function PATCH(request: NextRequest) {
  const auth = await requireAdminApi(request);
  if (!auth.ok) return auth.response;
  if (auth.authType !== "admin") {
    return NextResponse.json(
      { ok: false, message: "관리자 계정 세션으로만 변경할 수 있습니다." },
      { status: 403 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, message: "유효한 JSON 요청 본문이 필요합니다." },
      { status: 400 }
    );
  }

  const parsed = UpdateFlagSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        message: "입력값이 올바르지 않습니다.",
        issues: parsed.error.issues,
      },
      { status: 400 }
    );
  }

  const result = await updateSiteFeatureFlag({
    flagKey: parsed.data.flagKey,
    enabled: parsed.data.enabled,
    configJson: parsed.data.configJson,
    reason: parsed.data.reason,
    actorUserId: auth.user.id,
    actorEmail: auth.user.email ?? null,
  });

  if (!result.ok) {
    const status =
      result.code === "CONSTITUTION_LOCKED"
        ? 403
        : result.code === "NOT_FOUND"
        ? 404
        : 500;
    return NextResponse.json(
      { ok: false, code: result.code, message: result.message },
      { status }
    );
  }

  const refreshed = await listFeatureFlagsForAdmin();
  return NextResponse.json({
    ok: true,
    ...refreshed,
  });
}
