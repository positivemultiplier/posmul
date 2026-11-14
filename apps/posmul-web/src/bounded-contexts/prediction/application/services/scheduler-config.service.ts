import { supabaseAdmin } from "@/lib/supabase/admin";

export interface TemplateOverrideConfig {
  isActive?: boolean;
  recurrence?: "once" | "daily" | "weekly" | "monthly";
  durationHours?: number;
  settlementDelayHours?: number;
  minimumStake?: number;
  maximumStake?: number;
}

export interface PgCronJobInfo {
  jobid: number;
  jobname: string;
  schedule: string;
  active: boolean;
}

export type DuplicateCheckStrictness = "strict" | "normal" | "relaxed";

export interface PredictionSchedulerConfig {
  id: string;
  // 자동화 ON/OFF 마스터 & 단계별 스위치
  master_auto_enabled: boolean;
  auto_template_sync_enabled: boolean;
  auto_rss_draft_enabled: boolean;
  auto_close_expired_enabled: boolean;
  auto_oracle_settle_enabled: boolean;
  auto_rss_ai_settle_enabled: boolean;
  auto_briefing_enabled: boolean;
  auto_void_stale_enabled: boolean;
  // 발행주기 & 크론 스케줄
  template_sync_cron: string;
  rss_pipeline_cron: string;
  settle_cron: string;
  close_expired_cron: string;
  // 카테고리 & 외부 데이터소스 필터
  enabled_categories: string[];
  enable_football_source: boolean;
  enable_earnings_source: boolean;
  enable_dynamic_games: boolean;
  // 게임 생성 상세 옵션
  enabled_prediction_types: string[];
  max_drafts_per_run: number;
  rss_classify_batch_size: number;
  max_active_games_cap: number;
  default_min_bet: number;
  default_max_bet: number;
  default_closing_hours: number;
  default_settlement_delay_hours: number;
  // 정산 및 품질 고급 옵션
  settle_immediately_on_close: boolean;
  rss_ai_min_confidence: number;
  duplicate_check_strictness: DuplicateCheckStrictness;
  stale_void_days: number;
  // RSS 피드 큐 수명주기(TTL) 옵션
  auto_feed_cleanup_enabled: boolean;
  feed_pending_ttl_hours: number;
  feed_ignored_retention_days: number;
  feed_draft_retention_days: number;
  template_overrides: Record<string, TemplateOverrideConfig>;
  // 실행 이력
  last_manual_run_at: string | null;
  last_cron_run_at: string | null;
  last_run_summary: Record<string, unknown>;
  updated_at: string;
}

export const ALL_PREDICTION_CATEGORIES = [
  "ECONOMY",
  "INVEST",
  "SPORTS",
  "ENTERTAINMENT",
  "POLITICS",
  "USER_PROPOSED",
] as const;

export const ALL_PREDICTION_TYPES = [
  "BINARY",
  "WIN_DRAW_LOSE",
  "RANKING",
] as const;

export const DEFAULT_SCHEDULER_CONFIG: PredictionSchedulerConfig = {
  id: "default",
  master_auto_enabled: true,
  auto_template_sync_enabled: true,
  auto_rss_draft_enabled: true,
  auto_close_expired_enabled: true,
  auto_oracle_settle_enabled: true,
  auto_rss_ai_settle_enabled: false,
  auto_briefing_enabled: true,
  auto_void_stale_enabled: true,
  template_sync_cron: "0 */3 * * *",
  rss_pipeline_cron: "15 */3 * * *",
  settle_cron: "*/15 * * * *",
  close_expired_cron: "*/5 * * * *",
  enabled_categories: [...ALL_PREDICTION_CATEGORIES],
  enable_football_source: true,
  enable_earnings_source: true,
  enable_dynamic_games: true,
  enabled_prediction_types: [...ALL_PREDICTION_TYPES],
  max_drafts_per_run: 5,
  rss_classify_batch_size: 10,
  max_active_games_cap: 50,
  default_min_bet: 500,
  default_max_bet: 50000,
  default_closing_hours: 48,
  default_settlement_delay_hours: 2,
  settle_immediately_on_close: true,
  rss_ai_min_confidence: 0.85,
  duplicate_check_strictness: "normal",
  stale_void_days: 7,
  auto_feed_cleanup_enabled: true,
  feed_pending_ttl_hours: 48,
  feed_ignored_retention_days: 7,
  feed_draft_retention_days: 14,
  template_overrides: {},
  last_manual_run_at: null,
  last_cron_run_at: null,
  last_run_summary: {},
  updated_at: new Date().toISOString(),
};

function clampInt(value: unknown, min: number, max: number, fallback: number): number {
  const num = Number(value);
  if (!Number.isFinite(num)) return fallback;
  return Math.min(max, Math.max(min, Math.round(num)));
}

function clampFloat(value: unknown, min: number, max: number, fallback: number): number {
  const num = Number(value);
  if (!Number.isFinite(num)) return fallback;
  return Math.min(max, Math.max(min, Number(num.toFixed(2))));
}

function normalizeCronExpr(value: unknown, fallback: string): string {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim().replace(/\s+/g, " ");
  const parts = trimmed.split(" ");
  if (parts.length !== 5) return fallback;
  return trimmed;
}

function normalizeStringArray(
  value: unknown,
  allowed: readonly string[],
  fallback: string[]
): string[] {
  if (!Array.isArray(value)) return fallback;
  const allowedSet = new Set(allowed);
  const filtered = value
    .map((v) => String(v).trim().toUpperCase())
    .filter((v) => allowedSet.has(v));
  return Array.from(new Set(filtered));
}

function normalizeStrictness(
  value: unknown,
  fallback: DuplicateCheckStrictness
): DuplicateCheckStrictness {
  if (value === "strict" || value === "normal" || value === "relaxed") {
    return value;
  }
  return fallback;
}

function mapDbRowToConfig(row: Record<string, unknown> | null): PredictionSchedulerConfig {
  if (!row) return { ...DEFAULT_SCHEDULER_CONFIG };

  return {
    id: String(row.id ?? "default"),
    master_auto_enabled: Boolean(row.master_auto_enabled ?? DEFAULT_SCHEDULER_CONFIG.master_auto_enabled),
    auto_template_sync_enabled: Boolean(row.auto_template_sync_enabled ?? DEFAULT_SCHEDULER_CONFIG.auto_template_sync_enabled),
    auto_rss_draft_enabled: Boolean(row.auto_rss_draft_enabled ?? DEFAULT_SCHEDULER_CONFIG.auto_rss_draft_enabled),
    auto_close_expired_enabled: Boolean(row.auto_close_expired_enabled ?? DEFAULT_SCHEDULER_CONFIG.auto_close_expired_enabled),
    auto_oracle_settle_enabled: Boolean(row.auto_oracle_settle_enabled ?? DEFAULT_SCHEDULER_CONFIG.auto_oracle_settle_enabled),
    auto_rss_ai_settle_enabled: Boolean(row.auto_rss_ai_settle_enabled ?? DEFAULT_SCHEDULER_CONFIG.auto_rss_ai_settle_enabled),
    auto_briefing_enabled: Boolean(row.auto_briefing_enabled ?? DEFAULT_SCHEDULER_CONFIG.auto_briefing_enabled),
    auto_void_stale_enabled: Boolean(row.auto_void_stale_enabled ?? DEFAULT_SCHEDULER_CONFIG.auto_void_stale_enabled),
    template_sync_cron: normalizeCronExpr(row.template_sync_cron, DEFAULT_SCHEDULER_CONFIG.template_sync_cron),
    rss_pipeline_cron: normalizeCronExpr(row.rss_pipeline_cron, DEFAULT_SCHEDULER_CONFIG.rss_pipeline_cron),
    settle_cron: normalizeCronExpr(row.settle_cron, DEFAULT_SCHEDULER_CONFIG.settle_cron),
    close_expired_cron: normalizeCronExpr(row.close_expired_cron, DEFAULT_SCHEDULER_CONFIG.close_expired_cron),
    enabled_categories: Array.isArray(row.enabled_categories)
      ? (row.enabled_categories as string[])
      : [...DEFAULT_SCHEDULER_CONFIG.enabled_categories],
    enable_football_source: Boolean(row.enable_football_source ?? DEFAULT_SCHEDULER_CONFIG.enable_football_source),
    enable_earnings_source: Boolean(row.enable_earnings_source ?? DEFAULT_SCHEDULER_CONFIG.enable_earnings_source),
    enable_dynamic_games: Boolean(row.enable_dynamic_games ?? DEFAULT_SCHEDULER_CONFIG.enable_dynamic_games),
    enabled_prediction_types: Array.isArray(row.enabled_prediction_types)
      ? (row.enabled_prediction_types as string[])
      : [...DEFAULT_SCHEDULER_CONFIG.enabled_prediction_types],
    max_drafts_per_run: clampInt(row.max_drafts_per_run, 1, 30, DEFAULT_SCHEDULER_CONFIG.max_drafts_per_run),
    rss_classify_batch_size: clampInt(row.rss_classify_batch_size, 1, 50, DEFAULT_SCHEDULER_CONFIG.rss_classify_batch_size),
    max_active_games_cap: clampInt(row.max_active_games_cap, 5, 300, DEFAULT_SCHEDULER_CONFIG.max_active_games_cap),
    default_min_bet: clampInt(row.default_min_bet, 10, 100000, DEFAULT_SCHEDULER_CONFIG.default_min_bet),
    default_max_bet: clampInt(row.default_max_bet, 100, 10000000, DEFAULT_SCHEDULER_CONFIG.default_max_bet),
    default_closing_hours: clampInt(row.default_closing_hours, 1, 720, DEFAULT_SCHEDULER_CONFIG.default_closing_hours),
    default_settlement_delay_hours: clampInt(row.default_settlement_delay_hours, 0, 168, DEFAULT_SCHEDULER_CONFIG.default_settlement_delay_hours),
    settle_immediately_on_close: Boolean(row.settle_immediately_on_close ?? DEFAULT_SCHEDULER_CONFIG.settle_immediately_on_close),
    rss_ai_min_confidence: clampFloat(row.rss_ai_min_confidence, 0.5, 0.99, DEFAULT_SCHEDULER_CONFIG.rss_ai_min_confidence),
    duplicate_check_strictness: normalizeStrictness(row.duplicate_check_strictness, DEFAULT_SCHEDULER_CONFIG.duplicate_check_strictness),
    stale_void_days: clampInt(row.stale_void_days, 1, 30, DEFAULT_SCHEDULER_CONFIG.stale_void_days),
    auto_feed_cleanup_enabled: Boolean(row.auto_feed_cleanup_enabled ?? DEFAULT_SCHEDULER_CONFIG.auto_feed_cleanup_enabled),
    feed_pending_ttl_hours: clampInt(row.feed_pending_ttl_hours, 1, 336, DEFAULT_SCHEDULER_CONFIG.feed_pending_ttl_hours),
    feed_ignored_retention_days: clampInt(row.feed_ignored_retention_days, 1, 90, DEFAULT_SCHEDULER_CONFIG.feed_ignored_retention_days),
    feed_draft_retention_days: clampInt(row.feed_draft_retention_days, 1, 180, DEFAULT_SCHEDULER_CONFIG.feed_draft_retention_days),
    template_overrides:
      row.template_overrides && typeof row.template_overrides === "object" && !Array.isArray(row.template_overrides)
        ? (row.template_overrides as Record<string, TemplateOverrideConfig>)
        : {},
    last_manual_run_at: row.last_manual_run_at ? String(row.last_manual_run_at) : null,
    last_cron_run_at: row.last_cron_run_at ? String(row.last_cron_run_at) : null,
    last_run_summary:
      row.last_run_summary && typeof row.last_run_summary === "object" && !Array.isArray(row.last_run_summary)
        ? (row.last_run_summary as Record<string, unknown>)
        : {},
    updated_at: row.updated_at ? String(row.updated_at) : new Date().toISOString(),
  };
}

/**
 * 예측게임 스케줄러 통합 설정을 Supabase DB와 pg_cron에서 조회·갱신하는 서비스
 */
export class SchedulerConfigService {
  async getSchedulerConfig(): Promise<PredictionSchedulerConfig> {
    try {
      const { data, error } = await supabaseAdmin
        .schema("prediction")
        .from("scheduler_config")
        .select("*")
        .eq("id", "default")
        .maybeSingle();

      if (error || !data) {
        return { ...DEFAULT_SCHEDULER_CONFIG };
      }

      return mapDbRowToConfig(data as Record<string, unknown>);
    } catch {
      return { ...DEFAULT_SCHEDULER_CONFIG };
    }
  }

  async updateSchedulerConfig(
    patch: Partial<PredictionSchedulerConfig>
  ): Promise<{
    config: PredictionSchedulerConfig;
    cronJobs: PgCronJobInfo[];
    cronSynced: boolean;
    cronError?: string;
  }> {
    const current = await this.getSchedulerConfig();

    const nextMinBet = clampInt(patch.default_min_bet, 10, 100000, current.default_min_bet);
    const rawMaxBet = clampInt(patch.default_max_bet, 100, 10000000, current.default_max_bet);
    const nextMaxBet = Math.max(nextMinBet, rawMaxBet);

    const payload: Partial<PredictionSchedulerConfig> = {
      master_auto_enabled:
        typeof patch.master_auto_enabled === "boolean"
          ? patch.master_auto_enabled
          : current.master_auto_enabled,
      auto_template_sync_enabled:
        typeof patch.auto_template_sync_enabled === "boolean"
          ? patch.auto_template_sync_enabled
          : current.auto_template_sync_enabled,
      auto_rss_draft_enabled:
        typeof patch.auto_rss_draft_enabled === "boolean"
          ? patch.auto_rss_draft_enabled
          : current.auto_rss_draft_enabled,
      auto_close_expired_enabled:
        typeof patch.auto_close_expired_enabled === "boolean"
          ? patch.auto_close_expired_enabled
          : current.auto_close_expired_enabled,
      auto_oracle_settle_enabled:
        typeof patch.auto_oracle_settle_enabled === "boolean"
          ? patch.auto_oracle_settle_enabled
          : current.auto_oracle_settle_enabled,
      auto_rss_ai_settle_enabled:
        typeof patch.auto_rss_ai_settle_enabled === "boolean"
          ? patch.auto_rss_ai_settle_enabled
          : current.auto_rss_ai_settle_enabled,
      auto_briefing_enabled:
        typeof patch.auto_briefing_enabled === "boolean"
          ? patch.auto_briefing_enabled
          : current.auto_briefing_enabled,
      auto_void_stale_enabled:
        typeof patch.auto_void_stale_enabled === "boolean"
          ? patch.auto_void_stale_enabled
          : current.auto_void_stale_enabled,
      template_sync_cron: normalizeCronExpr(patch.template_sync_cron, current.template_sync_cron),
      rss_pipeline_cron: normalizeCronExpr(patch.rss_pipeline_cron, current.rss_pipeline_cron),
      settle_cron: normalizeCronExpr(patch.settle_cron, current.settle_cron),
      close_expired_cron: normalizeCronExpr(patch.close_expired_cron, current.close_expired_cron),
      enabled_categories:
        patch.enabled_categories !== undefined
          ? normalizeStringArray(patch.enabled_categories, ALL_PREDICTION_CATEGORIES, current.enabled_categories)
          : current.enabled_categories,
      enable_football_source:
        typeof patch.enable_football_source === "boolean"
          ? patch.enable_football_source
          : current.enable_football_source,
      enable_earnings_source:
        typeof patch.enable_earnings_source === "boolean"
          ? patch.enable_earnings_source
          : current.enable_earnings_source,
      enable_dynamic_games:
        typeof patch.enable_dynamic_games === "boolean"
          ? patch.enable_dynamic_games
          : current.enable_dynamic_games,
      enabled_prediction_types:
        patch.enabled_prediction_types !== undefined
          ? normalizeStringArray(patch.enabled_prediction_types, ALL_PREDICTION_TYPES, current.enabled_prediction_types)
          : current.enabled_prediction_types,
      max_drafts_per_run: clampInt(patch.max_drafts_per_run, 1, 30, current.max_drafts_per_run),
      rss_classify_batch_size: clampInt(patch.rss_classify_batch_size, 1, 50, current.rss_classify_batch_size),
      max_active_games_cap: clampInt(patch.max_active_games_cap, 5, 300, current.max_active_games_cap),
      default_min_bet: nextMinBet,
      default_max_bet: nextMaxBet,
      default_closing_hours: clampInt(patch.default_closing_hours, 1, 720, current.default_closing_hours),
      default_settlement_delay_hours: clampInt(patch.default_settlement_delay_hours, 0, 168, current.default_settlement_delay_hours),
      settle_immediately_on_close:
        typeof patch.settle_immediately_on_close === "boolean"
          ? patch.settle_immediately_on_close
          : current.settle_immediately_on_close,
      rss_ai_min_confidence: clampFloat(patch.rss_ai_min_confidence, 0.5, 0.99, current.rss_ai_min_confidence),
      duplicate_check_strictness: normalizeStrictness(
        patch.duplicate_check_strictness,
        current.duplicate_check_strictness
      ),
      stale_void_days: clampInt(patch.stale_void_days, 1, 30, current.stale_void_days),
      auto_feed_cleanup_enabled:
        typeof patch.auto_feed_cleanup_enabled === "boolean"
          ? patch.auto_feed_cleanup_enabled
          : current.auto_feed_cleanup_enabled,
      feed_pending_ttl_hours: clampInt(patch.feed_pending_ttl_hours, 1, 336, current.feed_pending_ttl_hours),
      feed_ignored_retention_days: clampInt(patch.feed_ignored_retention_days, 1, 90, current.feed_ignored_retention_days),
      feed_draft_retention_days: clampInt(patch.feed_draft_retention_days, 1, 180, current.feed_draft_retention_days),
      template_overrides:
        patch.template_overrides && typeof patch.template_overrides === "object"
          ? patch.template_overrides
          : current.template_overrides,
      updated_at: new Date().toISOString(),
    };

    // 최소 1개의 예측 유형은 유지
    if ((payload.enabled_prediction_types ?? []).length === 0) {
      payload.enabled_prediction_types = ["BINARY"];
    }

    const { data, error } = await supabaseAdmin
      .schema("prediction")
      .from("scheduler_config")
      .upsert({ id: "default", ...payload }, { onConflict: "id" })
      .select("*")
      .single();

    if (error) {
      throw new Error(`스케줄러 설정 저장 실패: ${error.message}`);
    }

    const syncRes = await this.getPgCronStatus();

    return {
      config: mapDbRowToConfig(data as Record<string, unknown>),
      cronJobs: syncRes.jobs,
      cronSynced: syncRes.synced,
      cronError: syncRes.error,
    };
  }

  async updateTemplateOverride(
    templateId: string,
    override: TemplateOverrideConfig
  ): Promise<PredictionSchedulerConfig> {
    const current = await this.getSchedulerConfig();
    const existing = current.template_overrides[templateId] ?? {};
    const nextOverrides: Record<string, TemplateOverrideConfig> = {
      ...current.template_overrides,
      [templateId]: {
        ...existing,
        ...override,
      },
    };
    const res = await this.updateSchedulerConfig({
      template_overrides: nextOverrides,
    });
    return res.config;
  }

  async getPgCronStatus(): Promise<{
    synced: boolean;
    jobs: PgCronJobInfo[];
    error?: string;
  }> {
    try {
      const { data, error } = await supabaseAdmin
        .schema("prediction")
        .rpc("sync_pg_cron_with_config");

      if (error || !data) {
        return {
          synced: false,
          jobs: [],
          error: error?.message ?? "pg_cron 동기화 응답 없음",
        };
      }

      const payload = data as { synced?: boolean; jobs?: PgCronJobInfo[] };
      return {
        synced: Boolean(payload.synced ?? true),
        jobs: Array.isArray(payload.jobs) ? payload.jobs : [],
      };
    } catch (err: unknown) {
      return {
        synced: false,
        jobs: [],
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }

  async recordSchedulerRun(
    runType: string,
    summary: Record<string, unknown>,
    isManual = false
  ): Promise<void> {
    try {
      const nowIso = new Date().toISOString();
      const updatePayload: Record<string, unknown> = {
        last_run_summary: {
          runType,
          at: nowIso,
          isManual,
          ...summary,
        },
        updated_at: nowIso,
      };
      if (isManual) {
        updatePayload.last_manual_run_at = nowIso;
      } else {
        updatePayload.last_cron_run_at = nowIso;
      }

      await supabaseAdmin
        .schema("prediction")
        .from("scheduler_config")
        .update(updatePayload)
        .eq("id", "default");
    } catch {
      // 실행 이력 기록 실패가 파이프라인 성공을 막지 않도록 무시
    }
  }
}

export const schedulerConfigService = new SchedulerConfigService();
