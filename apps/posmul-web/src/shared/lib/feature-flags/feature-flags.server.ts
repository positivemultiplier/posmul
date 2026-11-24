import { revalidateTag, unstable_cache } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  DEFAULT_FEATURE_FLAG_STATES,
  evaluateAllFeatureFlags,
  type EvaluatedSiteFeatureFlag,
  type FeatureFlagAuditLog,
  type FeatureFlagDomain,
  type FeatureFlagGroup,
  type SiteFeatureFlag,
} from "./feature-flags.domain";

interface DbFeatureFlagRow {
  flag_key: string;
  domain: FeatureFlagDomain;
  parent_key: string | null;
  group_name: FeatureFlagGroup;
  label: string;
  description: string;
  enabled: boolean;
  is_locked: boolean;
  badge: string | null;
  config_json: Record<string, unknown> | null;
  sort_order: number;
  updated_at: string;
}

interface DbAuditLogRow {
  log_id: string;
  flag_key: string;
  domain: string;
  prev_enabled: boolean;
  next_enabled: boolean;
  changed_by_email: string | null;
  reason: string | null;
  created_at: string;
}

function mapRow(row: DbFeatureFlagRow): SiteFeatureFlag {
  return {
    flagKey: row.flag_key,
    domain: row.domain,
    parentKey: row.parent_key,
    groupName: row.group_name,
    label: row.label,
    description: row.description,
    enabled: Boolean(row.enabled),
    isLocked: Boolean(row.is_locked),
    badge: row.badge,
    configJson: row.config_json ?? {},
    sortOrder: Number(row.sort_order ?? 100),
    updatedAt: row.updated_at,
  };
}

/**
 * 런타임 앱용 60초 서버 캐시 Feature Flag 맵 조회 (캐시 히트 시 0ms)
 * - DB 장애 시 DEFAULT_FEATURE_FLAG_STATES로 안전 폴백
 */
export const getCachedEffectiveFeatureFlags = unstable_cache(
  async (): Promise<{
    effectiveMap: Record<string, boolean>;
    configMap: Record<string, Record<string, unknown>>;
  }> => {
    try {
      const { data, error } = await supabaseAdmin
        .schema("economy")
        .from("site_feature_flags")
        .select(
          "flag_key, domain, parent_key, group_name, label, description, enabled, is_locked, badge, config_json, sort_order, updated_at"
        )
        .order("sort_order", { ascending: true });

      if (error || !data) {
        return {
          effectiveMap: { ...DEFAULT_FEATURE_FLAG_STATES },
          configMap: {},
        };
      }

      const mapped = (data as DbFeatureFlagRow[]).map(mapRow);
      const { effectiveMap } = evaluateAllFeatureFlags(mapped);
      const configMap: Record<string, Record<string, unknown>> = {};
      for (const item of mapped) {
        configMap[item.flagKey] = item.configJson;
      }

      return { effectiveMap, configMap };
    } catch {
      return {
        effectiveMap: { ...DEFAULT_FEATURE_FLAG_STATES },
        configMap: {},
      };
    }
  },
  ["posmul-site-feature-flags-v1"],
  { revalidate: 60, tags: ["site-feature-flags"] }
);

/**
 * 단일 기능 활성화 여부 빠른 조회 (부모 OFF 시 자동 false)
 */
export async function isFeatureEnabled(flagKey: string): Promise<boolean> {
  const { effectiveMap } = await getCachedEffectiveFeatureFlags();
  return effectiveMap[flagKey] ?? DEFAULT_FEATURE_FLAG_STATES[flagKey] ?? true;
}

/**
 * Admin 콘솔 실시간 조회용 (캐시 우회, 최신 DB 상태 + 최근 감사 로그 반환)
 */
export async function listFeatureFlagsForAdmin(domain?: FeatureFlagDomain): Promise<{
  flags: EvaluatedSiteFeatureFlag[];
  auditLogs: FeatureFlagAuditLog[];
}> {
  const [flagsRes, logsRes] = await Promise.all([
    supabaseAdmin
      .schema("economy")
      .from("site_feature_flags")
      .select(
        "flag_key, domain, parent_key, group_name, label, description, enabled, is_locked, badge, config_json, sort_order, updated_at"
      )
      .order("sort_order", { ascending: true }),
    supabaseAdmin
      .schema("economy")
      .from("feature_flag_audit_logs")
      .select(
        "log_id, flag_key, domain, prev_enabled, next_enabled, changed_by_email, reason, created_at"
      )
      .order("created_at", { ascending: false })
      .limit(30),
  ]);

  const rawFlags = ((flagsRes.data ?? []) as DbFeatureFlagRow[]).map(mapRow);
  const { evaluated } = evaluateAllFeatureFlags(rawFlags);
  const filteredFlags = domain
    ? evaluated.filter((f) => f.domain === domain)
    : evaluated;

  const auditLogs: FeatureFlagAuditLog[] = (
    (logsRes.data ?? []) as DbAuditLogRow[]
  )
    .filter((l) => !domain || l.domain === domain)
    .map((l) => ({
      logId: l.log_id,
      flagKey: l.flag_key,
      domain: l.domain,
      prevEnabled: Boolean(l.prev_enabled),
      nextEnabled: Boolean(l.next_enabled),
      changedByEmail: l.changed_by_email,
      reason: l.reason,
      createdAt: l.created_at,
    }));

  return { flags: filteredFlags, auditLogs };
}

export interface UpdateFeatureFlagResult {
  ok: boolean;
  code?: "NOT_FOUND" | "CONSTITUTION_LOCKED" | "DB_ERROR";
  message?: string;
}

/**
 * Admin 기능 ON/OFF 스위치 및 configJson 변경 + 감사 로그 기록 + 전 서버 캐시 즉시 무효화
 */
export async function updateSiteFeatureFlag(params: {
  flagKey: string;
  enabled: boolean;
  configJson?: Record<string, unknown>;
  reason?: string;
  actorUserId: string;
  actorEmail: string | null;
}): Promise<UpdateFeatureFlagResult> {
  const { data: existing, error: findErr } = await supabaseAdmin
    .schema("economy")
    .from("site_feature_flags")
    .select("flag_key, domain, enabled, is_locked, config_json")
    .eq("flag_key", params.flagKey)
    .maybeSingle();

  if (findErr || !existing) {
    return {
      ok: false,
      code: "NOT_FOUND",
      message: "존재하지 않는 기능 플래그입니다.",
    };
  }

  if (existing.is_locked) {
    return {
      ok: false,
      code: "CONSTITUTION_LOCKED",
      message: "v3.0 경제 헌법 불변 항목은 관리자 화면에서 해제할 수 없습니다.",
    };
  }

  const nextConfig = params.configJson ?? existing.config_json ?? {};

  const { error: updateErr } = await supabaseAdmin
    .schema("economy")
    .from("site_feature_flags")
    .update({
      enabled: params.enabled,
      config_json: nextConfig,
      updated_by: params.actorUserId,
      updated_at: new Date().toISOString(),
    })
    .eq("flag_key", params.flagKey);

  if (updateErr) {
    return {
      ok: false,
      code: "DB_ERROR",
      message: "플래그 업데이트 중 오류가 발생했습니다.",
    };
  }

  await supabaseAdmin
    .schema("economy")
    .from("feature_flag_audit_logs")
    .insert({
      flag_key: existing.flag_key,
      domain: existing.domain,
      prev_enabled: Boolean(existing.enabled),
      next_enabled: params.enabled,
      prev_config: existing.config_json ?? {},
      next_config: nextConfig,
      changed_by: params.actorUserId,
      changed_by_email: params.actorEmail,
      reason: params.reason?.trim() || null,
    });

  // 변경 즉시 전 서버 캐시 무효화
  revalidateTag("site-feature-flags");
  revalidateTag("prediction-feed");
  revalidateTag("prediction-detail");

  return { ok: true };
}
