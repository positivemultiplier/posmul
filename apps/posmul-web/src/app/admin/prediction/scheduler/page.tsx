"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  Bot,
  CalendarClock,
  CheckCircle2,
  Clock,
  Cpu,
  Database,
  Layers,
  Play,
  Power,
  RefreshCw,
  Save,
  Scale,
  Settings2,
  ShieldCheck,
  Sliders,
  Sparkles,
  Terminal,
  Trash2,
  Zap,
} from "lucide-react";
import {
  AdminBadge,
  AdminButton,
  AdminCard,
  AdminCardContent,
  AdminCardDescription,
  AdminCardHeader,
  AdminCardTitle,
  AdminTable,
  AdminTableBody,
  AdminTableCell,
  AdminTableHead,
  AdminTableHeader,
  AdminTableRow,
} from "../../components/shadcn-admin-ui";

interface TemplateOverrideConfig {
  isActive?: boolean;
  recurrence?: "once" | "daily" | "weekly" | "monthly";
  durationHours?: number;
  settlementDelayHours?: number;
  minimumStake?: number;
  maximumStake?: number;
}

interface PgCronJobInfo {
  jobid: number;
  jobname: string;
  schedule: string;
  active: boolean;
}

type DuplicateCheckStrictness = "strict" | "normal" | "relaxed";

interface PredictionSchedulerConfig {
  id: string;
  master_auto_enabled: boolean;
  auto_template_sync_enabled: boolean;
  auto_rss_draft_enabled: boolean;
  auto_close_expired_enabled: boolean;
  auto_oracle_settle_enabled: boolean;
  auto_rss_ai_settle_enabled: boolean;
  auto_briefing_enabled: boolean;
  auto_void_stale_enabled: boolean;
  template_sync_cron: string;
  rss_pipeline_cron: string;
  settle_cron: string;
  close_expired_cron: string;
  enabled_categories: string[];
  enable_football_source: boolean;
  enable_earnings_source: boolean;
  enable_dynamic_games: boolean;
  enabled_prediction_types: string[];
  max_drafts_per_run: number;
  rss_classify_batch_size: number;
  max_active_games_cap: number;
  default_min_bet: number;
  default_max_bet: number;
  default_closing_hours: number;
  default_settlement_delay_hours: number;
  settle_immediately_on_close: boolean;
  rss_ai_min_confidence: number;
  duplicate_check_strictness: DuplicateCheckStrictness;
  stale_void_days: number;
  auto_feed_cleanup_enabled: boolean;
  feed_pending_ttl_hours: number;
  feed_ignored_retention_days: number;
  feed_draft_retention_days: number;
  template_overrides: Record<string, TemplateOverrideConfig>;
  last_manual_run_at: string | null;
  last_cron_run_at: string | null;
  last_run_summary: Record<string, unknown>;
  updated_at: string;
}

interface PipelineStats {
  activeGamesCount: number;
  closedGamesCount: number;
  settledGamesCount: number;
  pendingRssCount: number;
  classifiedRssCount: number;
  draftedRssCount: number;
}

interface OracleStatusItem {
  id?: string;
  name?: string;
  provider?: string;
  configured?: boolean;
  status?: string;
  description?: string;
}

interface OracleStatusPayload {
  oracles?: OracleStatusItem[];
  adapters?: OracleStatusItem[];
  liveMarketSnapshot?: Record<string, unknown>;
  updatedAt?: string;
}

type ManualStepName =
  | "rss-draft"
  | "template-sync"
  | "close-expired"
  | "oracle-settle"
  | "full-cycle"
  | "cleanup-lifecycle"
  | "cleanup-pending"
  | "cleanup-ignored"
  | "cleanup-drafted"
  | "cleanup-all-stale";

const CATEGORY_OPTIONS = [
  { key: "ECONOMY", label: "경제/거시 (ECONOMY)", desc: "금리, 물가, GDP, 환율" },
  { key: "INVEST", label: "금융/투자 (INVEST)", desc: "증시, 실적, 암호화폐" },
  { key: "SPORTS", label: "스포츠 (SPORTS)", desc: "EPL, KBO, e스포츠" },
  { key: "ENTERTAINMENT", label: "엔터/문화 (ENTERTAINMENT)", desc: "박스오피스, 차트, OTT" },
  { key: "POLITICS", label: "정치/입법 (POLITICS)", desc: "국회 의안, 여론, 정책" },
  { key: "USER_PROPOSED", label: "시민/사회 (USER_PROPOSED)", desc: "뉴스 AI, 시민 제안" },
] as const;

const PREDICTION_TYPE_OPTIONS = [
  { key: "BINARY", label: "양자택일 (BINARY)", desc: "Yes / No 승패" },
  { key: "WIN_DRAW_LOSE", label: "3지선다 (WIN_DRAW_LOSE)", desc: "승/무/패 또는 상/보합/하" },
  { key: "RANKING", label: "다자 순위경쟁 (RANKING)", desc: "복수 후보 1위/구간 예측" },
] as const;

const CRON_PRESETS = [
  { label: "5분마다", expr: "*/5 * * * *" },
  { label: "15분마다", expr: "*/15 * * * *" },
  { label: "30분마다", expr: "*/30 * * * *" },
  { label: "1시간마다", expr: "0 * * * *" },
  { label: "3시간마다 (정각)", expr: "0 */3 * * *" },
  { label: "3시간마다 (15분)", expr: "15 */3 * * *" },
  { label: "6시간마다", expr: "0 */6 * * *" },
  { label: "매일 오전 9시 KST", expr: "0 0 * * *" },
] as const;

const AUTOMATION_SWITCHES: Array<{
  key: keyof Pick<
    PredictionSchedulerConfig,
    | "auto_template_sync_enabled"
    | "auto_rss_draft_enabled"
    | "auto_close_expired_enabled"
    | "auto_oracle_settle_enabled"
    | "auto_rss_ai_settle_enabled"
    | "auto_briefing_enabled"
    | "auto_void_stale_enabled"
  >;
  title: string;
  desc: string;
  badge?: string;
}> = [
  {
    key: "auto_template_sync_enabled",
    title: "정기 템플릿 · 외부데이터 자동 발행",
    desc: "한국은행/통계청/DART/EPL/FMP 등 정기 예측 템플릿을 주기에 맞춰 자동 생성합니다.",
  },
  {
    key: "auto_rss_draft_enabled",
    title: "RSS 뉴스 수집 → AI 분류 → 초안 자동 생성",
    desc: "수집된 PENDING 기사를 Gemini로 분류한 뒤 자동으로 예측 게임을 발행합니다.",
  },
  {
    key: "auto_close_expired_enabled",
    title: "만료 게임 자동 마감 (ACTIVE → CLOSED)",
    desc: "registration_end가 지난 진행 중 게임을 정산 대기(CLOSED) 상태로 전환합니다.",
  },
  {
    key: "auto_oracle_settle_enabled",
    title: "공식 오라클 · 의안 자동 정산 및 배당 집행",
    desc: "CoinGecko, AlphaVantage, DART, KOSIS, 열린국회정보 등으로 결과를 검증해 정산합니다.",
  },
  {
    key: "auto_rss_ai_settle_enabled",
    title: "RSS 뉴스 기반 AI 자동 판정 정산 (실험적)",
    desc: "공식 수치 오라클이 없는 뉴스형 게임의 최신 기사를 AI로 분석해 신뢰도 기준 이상 시 정산합니다.",
    badge: "AI 판정",
  },
  {
    key: "auto_briefing_enabled",
    title: "신규 게임 AI 균형 브리핑 자동 생성",
    desc: "새로 발행된 예측 게임마다 참여자 의사결정을 돕는 중립 브리핑을 자동 부착합니다.",
  },
  {
    key: "auto_void_stale_enabled",
    title: "장기 미정산 게임 점검 및 정리",
    desc: "유예 기간이 과도하게 경과한 미정산 마켓을 점검 대상에 포함합니다.",
  },
];

function formatKstDateTime(value: string | null | undefined): string {
  if (!value) return "기록 없음";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString("ko-KR", { timeZone: "Asia/Seoul" });
}

export default function AdminPredictionSchedulerPage() {
  const [config, setConfig] = useState<PredictionSchedulerConfig | null>(null);
  const [draftConfig, setDraftConfig] = useState<PredictionSchedulerConfig | null>(null);
  const [cronJobs, setCronJobs] = useState<PgCronJobInfo[]>([]);
  const [cronSynced, setCronSynced] = useState<boolean>(false);
  const [cronError, setCronError] = useState<string | undefined>(undefined);
  const [stats, setStats] = useState<PipelineStats | null>(null);
  const [oracleStatus, setOracleStatus] = useState<OracleStatusPayload | null>(null);

  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [runningStep, setRunningStep] = useState<ManualStepName | null>(null);
  const [pingingOracles, setPingingOracles] = useState<boolean>(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [bannerMsg, setBannerMsg] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [cfgRes, oracleRes] = await Promise.all([
        fetch("/api/admin/scheduler/config", { cache: "no-store" }),
        fetch("/api/prediction/oracle-status", { cache: "no-store" }),
      ]);

      const cfgData = await cfgRes.json();
      if (!cfgRes.ok || !cfgData.success) {
        throw new Error(cfgData.error || "스케줄러 설정을 불러오지 못했습니다.");
      }

      setConfig(cfgData.config);
      setDraftConfig(cfgData.config);
      setCronJobs(cfgData.cronJobs ?? []);
      setCronSynced(Boolean(cfgData.cronSynced));
      setCronError(cfgData.cronError);
      setStats(cfgData.pipelineStats ?? null);

      if (oracleRes.ok) {
        const oData = (await oracleRes.json()) as OracleStatusPayload;
        setOracleStatus(oData);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setBannerMsg({ type: "error", text: message });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchAll();
  }, [fetchAll]);

  const hasUnsavedChanges = useMemo(() => {
    if (!config || !draftConfig) return false;
    return JSON.stringify(config) !== JSON.stringify(draftConfig);
  }, [config, draftConfig]);

  const saveConfigPatch = async (
    patch: Partial<PredictionSchedulerConfig>,
    successLabel = "설정이 저장되고 Supabase pg_cron에 동기화되었습니다."
  ) => {
    setSaving(true);
    setBannerMsg(null);
    try {
      const res = await fetch("/api/admin/scheduler/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "update-config", patch }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "설정 저장 실패");
      }
      setConfig(data.config);
      setDraftConfig(data.config);
      setCronJobs(data.cronJobs ?? []);
      setCronSynced(Boolean(data.cronSynced));
      setCronError(data.cronError);
      setBannerMsg({
        type: "success",
        text: data.cronError
          ? `${successLabel} (pg_cron 참고: ${data.cronError})`
          : successLabel,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setBannerMsg({ type: "error", text: message });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAll = async () => {
    if (!draftConfig) return;
    await saveConfigPatch({
      auto_feed_cleanup_enabled: draftConfig.auto_feed_cleanup_enabled,
      feed_pending_ttl_hours: draftConfig.feed_pending_ttl_hours,
      feed_ignored_retention_days: draftConfig.feed_ignored_retention_days,
      feed_draft_retention_days: draftConfig.feed_draft_retention_days,
      master_auto_enabled: draftConfig.master_auto_enabled,
      auto_template_sync_enabled: draftConfig.auto_template_sync_enabled,
      auto_rss_draft_enabled: draftConfig.auto_rss_draft_enabled,
      auto_close_expired_enabled: draftConfig.auto_close_expired_enabled,
      auto_oracle_settle_enabled: draftConfig.auto_oracle_settle_enabled,
      auto_rss_ai_settle_enabled: draftConfig.auto_rss_ai_settle_enabled,
      auto_briefing_enabled: draftConfig.auto_briefing_enabled,
      auto_void_stale_enabled: draftConfig.auto_void_stale_enabled,
      template_sync_cron: draftConfig.template_sync_cron,
      rss_pipeline_cron: draftConfig.rss_pipeline_cron,
      settle_cron: draftConfig.settle_cron,
      close_expired_cron: draftConfig.close_expired_cron,
      enabled_categories: draftConfig.enabled_categories,
      enable_football_source: draftConfig.enable_football_source,
      enable_earnings_source: draftConfig.enable_earnings_source,
      enable_dynamic_games: draftConfig.enable_dynamic_games,
      enabled_prediction_types: draftConfig.enabled_prediction_types,
      max_drafts_per_run: draftConfig.max_drafts_per_run,
      rss_classify_batch_size: draftConfig.rss_classify_batch_size,
      max_active_games_cap: draftConfig.max_active_games_cap,
      default_min_bet: draftConfig.default_min_bet,
      default_max_bet: draftConfig.default_max_bet,
      default_closing_hours: draftConfig.default_closing_hours,
      default_settlement_delay_hours: draftConfig.default_settlement_delay_hours,
      settle_immediately_on_close: draftConfig.settle_immediately_on_close,
      rss_ai_min_confidence: draftConfig.rss_ai_min_confidence,
      duplicate_check_strictness: draftConfig.duplicate_check_strictness,
      stale_void_days: draftConfig.stale_void_days,
    });
  };

  const handleMasterToggle = async () => {
    if (!draftConfig) return;
    const nextVal = !draftConfig.master_auto_enabled;
    setDraftConfig({ ...draftConfig, master_auto_enabled: nextVal });
    await saveConfigPatch(
      { master_auto_enabled: nextVal },
      nextVal
        ? "마스터 자동화가 켜졌습니다 (pg_cron 활성화 완료)."
        : "마스터 자동화가 일시중지되었습니다 (pg_cron 비활성화 완료)."
    );
  };

  const handleRunManualStep = async (step: ManualStepName, label: string) => {
    setRunningStep(step);
    setBannerMsg(null);
    setLogs((prev) => [
      `▶ [${new Date().toLocaleTimeString("ko-KR")}] '${label}' 수동 실행 시작...`,
      ...prev,
    ]);
    try {
      const res = await fetch("/api/admin/scheduler/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "run-manual-step",
          step,
          materializeTemplates: true,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || `${label} 실행 실패`);
      }

      const returnedLogs: string[] = Array.isArray(data.logs) ? data.logs : [];
      setLogs((prev) => [
        `✅ [${new Date().toLocaleTimeString("ko-KR")}] '${label}' 완료`,
        ...returnedLogs,
        ...prev.slice(0, 60),
      ]);
      setBannerMsg({
        type: "success",
        text: `'${label}' 실행이 완료되었습니다.`,
      });
      await fetchAll();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setLogs((prev) => [`❌ 오류: ${message}`, ...prev]);
      setBannerMsg({ type: "error", text: message });
    } finally {
      setRunningStep(null);
    }
  };

  const handleResetGames = async () => {
    if (
      !window.confirm(
        "현재 등록된 모든 예측게임(ACTIVE / CLOSED / SETTLED)과 정산 소스를 삭제하시겠습니까?\n(유저 베팅 내역이 존재할 경우 안전을 위해 차단됩니다)"
      )
    ) {
      return;
    }
    setSaving(true);
    setBannerMsg(null);
    try {
      const res = await fetch("/api/admin/scheduler/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reset-games", includeSettled: true }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "예측게임 초기화 실패");
      }
      const returnedLogs: string[] = Array.isArray(data.logs) ? data.logs : [];
      setLogs((prev) => [...returnedLogs, ...prev.slice(0, 60)]);
      setBannerMsg({
        type: "success",
        text: `예측게임 ${data.deletedCount ?? 0}건이 모두 삭제되었습니다.`,
      });
      await fetchAll();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setBannerMsg({ type: "error", text: message });
    } finally {
      setSaving(false);
    }
  };

  const handleSamplePublish = async () => {
    setSaving(true);
    setBannerMsg(null);
    setLogs((prev) => [
      `▶ [${new Date().toLocaleTimeString("ko-KR")}] 테스트용 소수 샘플 발행(대표 템플릿 3종 + RSS AI 2건) 시작...`,
      ...prev,
    ]);
    try {
      const res = await fetch("/api/admin/scheduler/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "sample-publish",
          rssDraftCount: 2,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "소수 샘플 발행 실패");
      }
      const returnedLogs: string[] = Array.isArray(data.logs) ? data.logs : [];
      setLogs((prev) => [
        `✅ [${new Date().toLocaleTimeString("ko-KR")}] 소수 샘플 발행 완료`,
        ...returnedLogs,
        ...prev.slice(0, 60),
      ]);
      setBannerMsg({
        type: "success",
        text: "소수 테스트 예측게임 발행이 완료되었습니다.",
      });
      await fetchAll();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setBannerMsg({ type: "error", text: message });
    } finally {
      setSaving(false);
    }
  };

  const handleCleanupFeed = async (
    cleanupMode: "lifecycle" | "pending" | "ignored" | "drafted" | "all-stale",
    label: string
  ) => {
    if (
      cleanupMode === "pending" &&
      !window.confirm(
        "현재 PENDING 상태의 미분류 기사들을 모두 IGNORED로 정리하시겠습니까? (신규 수집은 정상 유지됩니다)"
      )
    ) {
      return;
    }
    setRunningStep(`cleanup-${cleanupMode}`);
    setBannerMsg(null);
    try {
      const res = await fetch("/api/admin/scheduler/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cleanup-feed", cleanupMode }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || `${label} 실패`);
      }
      const msg =
        data.message || `${label} 완료 (${data.affectedCount ?? 0}건 처리)`;
      setLogs((prev) => [
        `🧹 [${new Date().toLocaleTimeString("ko-KR")}] ${msg}`,
        ...prev.slice(0, 60),
      ]);
      setBannerMsg({ type: "success", text: msg });
      await fetchAll();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setBannerMsg({ type: "error", text: message });
    } finally {
      setRunningStep(null);
    }
  };

  const handlePingOracles = async () => {
    setPingingOracles(true);
    try {
      const res = await fetch("/api/admin/prediction/oracle-assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "ping-adapters" }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        const list = Array.isArray(data.results) ? data.results : [];
        const pingLogs = list.map(
          (r: { name?: string; status?: string; latencyMs?: number }) =>
            `[Oracle Ping] ${r.name ?? "Unknown"}: ${r.status ?? "ok"} (${r.latencyMs ?? 0}ms)`
        );
        setLogs((prev) => [...pingLogs, ...prev.slice(0, 60)]);
        setBannerMsg({
          type: "success",
          text: `오라클 어댑터 ${list.length}종 연결 점검 완료`,
        });
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setBannerMsg({ type: "error", text: message });
    } finally {
      setPingingOracles(false);
    }
  };

  const toggleCategory = (key: string) => {
    if (!draftConfig) return;
    const exists = draftConfig.enabled_categories.includes(key);
    const next = exists
      ? draftConfig.enabled_categories.filter((c) => c !== key)
      : [...draftConfig.enabled_categories, key];
    if (next.length === 0) return;
    setDraftConfig({ ...draftConfig, enabled_categories: next });
  };

  const togglePredictionType = (key: string) => {
    if (!draftConfig) return;
    const exists = draftConfig.enabled_prediction_types.includes(key);
    const next = exists
      ? draftConfig.enabled_prediction_types.filter((t) => t !== key)
      : [...draftConfig.enabled_prediction_types, key];
    if (next.length === 0) return;
    setDraftConfig({ ...draftConfig, enabled_prediction_types: next });
  };

  const updateCronField = (
    field:
      | "template_sync_cron"
      | "rss_pipeline_cron"
      | "close_expired_cron"
      | "settle_cron",
    value: string
  ) => {
    if (!draftConfig) return;
    setDraftConfig({ ...draftConfig, [field]: value });
  };

  const oracleItems: OracleStatusItem[] = useMemo(() => {
    if (!oracleStatus) return [];
    return oracleStatus.oracles ?? oracleStatus.adapters ?? [];
  }, [oracleStatus]);

  return (
    <div className="space-y-6">
      {/* 상단 헤더 */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-zinc-800/80 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <AdminBadge variant="info">SCHEDULER CONTROL CENTER</AdminBadge>
            <AdminBadge
              variant={draftConfig?.master_auto_enabled ? "success" : "danger"}
            >
              {draftConfig?.master_auto_enabled
                ? "마스터 자동화 ON"
                : "마스터 자동화 OFF"}
            </AdminBadge>
            {hasUnsavedChanges && (
              <AdminBadge variant="warning">저장되지 않은 변경 있음</AdminBadge>
            )}
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <CalendarClock className="w-6 h-6 text-sky-400" />
            예측게임 마스터 스케줄러 & 자동화 제어실
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            게임 발행 주기(Cron), 카테고리·데이터소스 필터, 생성 옵션, 오라클 자동 정산 및 자동 ON/OFF를 실시간 제어합니다.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link href="/admin/prediction/templates">
            <AdminButton variant="secondary" size="sm">
              <Layers className="w-3.5 h-3.5" />
              정기 템플릿 ({Object.keys(draftConfig?.template_overrides ?? {}).length}개 커스텀)
            </AdminButton>
          </Link>
          <Link href="/admin/prediction/settlement">
            <AdminButton variant="secondary" size="sm">
              <Scale className="w-3.5 h-3.5 text-amber-400" />
              정산 센터
            </AdminButton>
          </Link>
          <Link href="/admin/prediction/games">
            <AdminButton variant="secondary" size="sm">
              게임 마스터
            </AdminButton>
          </Link>
          <AdminButton
            variant="outline"
            size="sm"
            onClick={() => void fetchAll()}
            disabled={loading}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            새로고침
          </AdminButton>
          <AdminButton
            variant={hasUnsavedChanges ? "amber" : "primary"}
            size="sm"
            onClick={() => void handleSaveAll()}
            disabled={saving || !draftConfig}
          >
            <Save className="w-3.5 h-3.5" />
            {saving ? "저장 및 동기화 중..." : "설정 저장 & Cron 동기화"}
          </AdminButton>
        </div>
      </div>

      {/* 알림 배너 */}
      {bannerMsg && (
        <div
          className={`rounded-xl border px-4 py-3 text-xs font-semibold flex items-center justify-between ${
            bannerMsg.type === "success"
              ? "bg-emerald-950/50 border-emerald-500/40 text-emerald-300"
              : "bg-rose-950/50 border-rose-500/40 text-rose-300"
          }`}
        >
          <span className="flex items-center gap-2">
            {bannerMsg.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 shrink-0" />
            )}
            {bannerMsg.text}
          </span>
          <button
            onClick={() => setBannerMsg(null)}
            className="text-zinc-400 hover:text-white ml-4"
          >
            닫기
          </button>
        </div>
      )}

      {/* 1. 마스터 자동화 ON/OFF 배너 + 최근 실행 시간 */}
      {draftConfig && (
        <AdminCard
          className={
            draftConfig.master_auto_enabled
              ? "border-emerald-500/30 bg-gradient-to-r from-emerald-950/30 via-[#0c0d12] to-[#0c0d12]"
              : "border-rose-500/40 bg-gradient-to-r from-rose-950/30 via-[#0c0d12] to-[#0c0d12]"
          }
        >
          <AdminCardContent className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div
                className={`p-3 rounded-xl border ${
                  draftConfig.master_auto_enabled
                    ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-400"
                    : "bg-rose-500/15 border-rose-500/40 text-rose-400"
                }`}
              >
                <Power className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-extrabold text-white">
                    마스터 자동 스케줄러 전원
                  </h2>
                  <AdminBadge
                    variant={draftConfig.master_auto_enabled ? "success" : "danger"}
                  >
                    {draftConfig.master_auto_enabled ? "자동 실행 활성" : "전체 정지됨"}
                  </AdminBadge>
                </div>
                <p className="text-xs text-zinc-400 mt-1">
                  끄면 Supabase pg_cron 및 Vercel Cron의 모든 자동 발행·마감·정산 잡이 즉시 중지됩니다. (수동 실행은 계속 가능)
                </p>
                <div className="flex flex-wrap gap-4 text-[11px] text-zinc-500 mt-2">
                  <span>마지막 크론 실행: {formatKstDateTime(draftConfig.last_cron_run_at)}</span>
                  <span>마지막 수동 실행: {formatKstDateTime(draftConfig.last_manual_run_at)}</span>
                  <span>마지막 설정 저장: {formatKstDateTime(draftConfig.updated_at)}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <AdminButton
                variant={draftConfig.master_auto_enabled ? "danger" : "emerald"}
                size="lg"
                onClick={() => void handleMasterToggle()}
                disabled={saving}
              >
                <Power className="w-4 h-4" />
                {draftConfig.master_auto_enabled
                  ? "전체 자동화 OFF (긴급 정지)"
                  : "전체 자동화 ON (즉시 가동)"}
              </AdminButton>
            </div>
          </AdminCardContent>
        </AdminCard>
      )}

      {/* 2. 실시간 파이프라인 KPI 6종 */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <AdminCard>
          <AdminCardContent className="p-4">
            <div className="text-[11px] text-zinc-400 font-semibold">진행 중 (ACTIVE)</div>
            <div className="text-2xl font-black text-emerald-400 mt-1">
              {stats?.activeGamesCount ?? "-"}
            </div>
            <div className="text-[10px] text-zinc-500 mt-0.5">
              상한 {draftConfig?.max_active_games_cap ?? "-"}개
            </div>
          </AdminCardContent>
        </AdminCard>
        <AdminCard className={(stats?.closedGamesCount ?? 0) > 0 ? "border-amber-500/40" : ""}>
          <AdminCardContent className="p-4">
            <div className="text-[11px] text-amber-300 font-semibold">
              정산 대기 (CLOSED)
            </div>
            <div className="text-2xl font-black text-amber-400 mt-1">
              {stats?.closedGamesCount ?? "-"}
            </div>
            <div className="text-[10px] text-zinc-500 mt-0.5">마감 후 판정 대기</div>
          </AdminCardContent>
        </AdminCard>
        <AdminCard>
          <AdminCardContent className="p-4">
            <div className="text-[11px] text-zinc-400 font-semibold">정산 완료 (SETTLED)</div>
            <div className="text-2xl font-black text-sky-400 mt-1">
              {stats?.settledGamesCount ?? "-"}
            </div>
            <div className="text-[10px] text-zinc-500 mt-0.5">누적 배당 완료</div>
          </AdminCardContent>
        </AdminCard>
        <AdminCard>
          <AdminCardContent className="p-4">
            <div className="text-[11px] text-zinc-400 font-semibold">RSS 미분류 (PENDING)</div>
            <div className="text-2xl font-black text-purple-400 mt-1">
              {stats?.pendingRssCount ?? "-"}
            </div>
            <div className="text-[10px] text-zinc-500 mt-0.5">AI 분류 대기 기사</div>
          </AdminCardContent>
        </AdminCard>
        <AdminCard>
          <AdminCardContent className="p-4">
            <div className="text-[11px] text-zinc-400 font-semibold">AI 분류됨 (CLASSIFIED)</div>
            <div className="text-2xl font-black text-indigo-400 mt-1">
              {stats?.classifiedRssCount ?? "-"}
            </div>
            <div className="text-[10px] text-zinc-500 mt-0.5">게임 초안 변환 대기</div>
          </AdminCardContent>
        </AdminCard>
        <AdminCard>
          <AdminCardContent className="p-4">
            <div className="text-[11px] text-zinc-400 font-semibold">초안 생성 완료</div>
            <div className="text-2xl font-black text-zinc-200 mt-1">
              {stats?.draftedRssCount ?? "-"}
            </div>
            <div className="text-[10px] text-zinc-500 mt-0.5">DRAFT_CREATED</div>
          </AdminCardContent>
        </AdminCard>
      </div>

      {/* 3. 수동 즉시 실행 콘솔 + 로그 뷰어 */}
      <AdminCard>
        <AdminCardHeader>
          <AdminCardTitle className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400" />
            수동 파이프라인 즉시 실행 콘솔
          </AdminCardTitle>
          <AdminCardDescription>
            자동 ON/OFF 설정과 무관하게 각 단계를 지금 즉시 1회 테스트·실행하고 상세 로그를 확인합니다.
          </AdminCardDescription>
        </AdminCardHeader>
        <AdminCardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <AdminButton
              variant="amber"
              onClick={() => void handleRunManualStep("full-cycle", "전체 사이클 완주")}
              disabled={runningStep !== null}
            >
              <Play className="w-3.5 h-3.5" />
              {runningStep === "full-cycle"
                ? "전체 사이클 실행 중..."
                : "전체 사이클 1회 완주"}
            </AdminButton>
            <AdminButton
              variant="primary"
              onClick={() =>
                void handleRunManualStep("rss-draft", "RSS 수집·AI 분류·게임 초안 생성")
              }
              disabled={runningStep !== null}
            >
              <Sparkles className="w-3.5 h-3.5" />
              {runningStep === "rss-draft"
                ? "RSS 파이프라인 실행 중..."
                : "RSS 수집·분류·초안 생성"}
            </AdminButton>
            <AdminButton
              variant="secondary"
              onClick={() =>
                void handleRunManualStep("template-sync", "정기 템플릿 & 스포츠·실적 발행")
              }
              disabled={runningStep !== null}
            >
              <Layers className="w-3.5 h-3.5" />
              {runningStep === "template-sync"
                ? "템플릿 동기화 중..."
                : "정기 템플릿 & 외부데이터 발행"}
            </AdminButton>
            <AdminButton
              variant="outline"
              onClick={() =>
                void handleRunManualStep("close-expired", "만료 게임 즉시 마감")
              }
              disabled={runningStep !== null}
            >
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              {runningStep === "close-expired"
                ? "마감 처리 중..."
                : "만료 게임 마감 (CLOSED)"}
            </AdminButton>
            <AdminButton
              variant="emerald"
              onClick={() =>
                void handleRunManualStep("oracle-settle", "오라클 즉시 자동 정산")
              }
              disabled={runningStep !== null}
            >
              <Scale className="w-3.5 h-3.5" />
              {runningStep === "oracle-settle"
                ? "오라클 정산 중..."
                : "오라클 즉시 정산 (SETTLED)"}
            </AdminButton>
            <AdminButton
              variant="secondary"
              onClick={() => void handleSamplePublish()}
              disabled={runningStep !== null || saving}
            >
              <Sparkles className="w-3.5 h-3.5 text-sky-400" />
              테스트용 소수(5개)만 발행
            </AdminButton>
            <AdminButton
              variant="secondary"
              onClick={() => void handleCleanupFeed("lifecycle", "RSS TTL 라이프사이클 정리")}
              disabled={runningStep !== null || saving}
            >
              <RefreshCw
                className={`w-3.5 h-3.5 text-emerald-400 ${runningStep === "cleanup-lifecycle" ? "animate-spin" : ""}`}
              />
              {runningStep === "cleanup-lifecycle"
                ? "피드 큐 정리 중..."
                : "RSS 큐 TTL 정리"}
            </AdminButton>
            <AdminButton
              variant="danger"
              onClick={() => void handleResetGames()}
              disabled={runningStep !== null || saving}
            >
              <Trash2 className="w-3.5 h-3.5" />
              기존 예측게임 전체 초기화
            </AdminButton>
          </div>

          <div className="rounded-lg border border-zinc-800 bg-black/70 p-3 font-mono text-[11px] text-zinc-300 max-h-56 overflow-y-auto space-y-1">
            <div className="flex items-center justify-between text-zinc-500 border-b border-zinc-800/80 pb-1.5 mb-2">
              <span className="flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5" /> 실행 로그 콘솔
              </span>
              {logs.length > 0 && (
                <button
                  onClick={() => setLogs([])}
                  className="text-[10px] hover:text-zinc-200"
                >
                  로그 비우기
                </button>
              )}
            </div>
            {logs.length === 0 ? (
              <div className="text-zinc-500">
                아직 이번 세션에서 수동 실행한 로그가 없습니다. 마지막 기록:{" "}
                {JSON.stringify(draftConfig?.last_run_summary ?? {})}
              </div>
            ) : (
              logs.map((line, idx) => (
                <div key={`${idx}-${line.slice(0, 16)}`} className="leading-relaxed">
                  {line}
                </div>
              ))
            )}
          </div>
        </AdminCardContent>
      </AdminCard>

      {draftConfig && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* 4. 세부 자동화 ON/OFF 7대 스위치 */}
          <AdminCard>
            <AdminCardHeader>
              <AdminCardTitle className="flex items-center gap-2">
                <Settings2 className="w-4 h-4 text-emerald-400" />
                단계별 자동화 ON / OFF 세부 제어
              </AdminCardTitle>
              <AdminCardDescription>
                각 단계를 개별적으로 켜고 끌 수 있습니다. 변경 후 상단 [설정 저장 & Cron 동기화]를 눌러 확정하세요.
              </AdminCardDescription>
            </AdminCardHeader>
            <AdminCardContent className="space-y-3">
              {AUTOMATION_SWITCHES.map((sw) => {
                const enabled = Boolean(draftConfig[sw.key]);
                return (
                  <div
                    key={sw.key}
                    className="flex items-center justify-between gap-4 rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-3.5"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-zinc-100">
                          {sw.title}
                        </span>
                        {sw.badge && (
                          <AdminBadge variant="purple">{sw.badge}</AdminBadge>
                        )}
                      </div>
                      <p className="text-[11px] text-zinc-400">{sw.desc}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setDraftConfig({
                          ...draftConfig,
                          [sw.key]: !enabled,
                        })
                      }
                      className={`shrink-0 px-3.5 py-1.5 rounded-lg text-xs font-extrabold border transition cursor-pointer ${
                        enabled
                          ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30"
                          : "bg-zinc-800 text-zinc-400 border-zinc-700 hover:bg-zinc-700"
                      }`}
                    >
                      {enabled ? "ON" : "OFF"}
                    </button>
                  </div>
                );
              })}
            </AdminCardContent>
          </AdminCard>

          {/* 5. 발행 주기(Cron) 설정 & pg_cron 동기화 상태 */}
          <AdminCard>
            <AdminCardHeader>
              <AdminCardTitle className="flex items-center gap-2">
                <CalendarClock className="w-4 h-4 text-sky-400" />
                발행 · 마감 · 정산 주기 (Cron 스케줄)
              </AdminCardTitle>
              <AdminCardDescription>
                저장 시 PostgreSQL pg_cron 잡 스케줄에 실시간 반영됩니다. (UTC 기준 Cron 표현식)
              </AdminCardDescription>
            </AdminCardHeader>
            <AdminCardContent className="space-y-4">
              {(
                [
                  {
                    field: "template_sync_cron",
                    title: "정기 템플릿 · 스포츠/실적 동기화 주기",
                    hint: "권장: 0 */3 * * * (3시간마다)",
                  },
                  {
                    field: "rss_pipeline_cron",
                    title: "RSS 수집 · AI 분류 · 게임 초안 생성 주기",
                    hint: "권장: 15 */3 * * * (3시간마다 15분)",
                  },
                  {
                    field: "close_expired_cron",
                    title: "만료 게임 자동 마감(ACTIVE → CLOSED) 주기",
                    hint: "권장: */5 * * * * (5분마다)",
                  },
                  {
                    field: "settle_cron",
                    title: "오라클 자동 정산(CLOSED → SETTLED) 주기",
                    hint: "권장: */15 * * * * (15분마다)",
                  },
                ] as const
              ).map((item) => (
                <div
                  key={item.field}
                  className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-3.5 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-zinc-100">
                      {item.title}
                    </span>
                    <span className="text-[10px] text-zinc-500">{item.hint}</span>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      value={draftConfig[item.field]}
                      onChange={(e) => updateCronField(item.field, e.target.value)}
                      className="flex-1 rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-1.5 text-xs font-mono text-sky-300 focus:outline-none focus:border-sky-500"
                      placeholder="*/15 * * * *"
                    />
                    <select
                      value={
                        CRON_PRESETS.some((p) => p.expr === draftConfig[item.field])
                          ? draftConfig[item.field]
                          : ""
                      }
                      onChange={(e) => {
                        if (e.target.value) updateCronField(item.field, e.target.value);
                      }}
                      className="rounded-lg border border-zinc-700 bg-zinc-950 px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none"
                    >
                      <option value="">프리셋 선택...</option>
                      {CRON_PRESETS.map((p) => (
                        <option key={p.expr} value={p.expr}>
                          {p.label} ({p.expr})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              ))}

              {/* 실제 pg_cron 잡 상태 테이블 */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                    <Database className="w-3.5 h-3.5 text-emerald-400" />
                    Supabase pg_cron 실등록 잡 현황
                  </span>
                  <AdminBadge variant={cronSynced ? "success" : "warning"}>
                    {cronSynced ? "동기화 정상" : cronError || "미확인"}
                  </AdminBadge>
                </div>
                <AdminTable>
                  <AdminTableHeader>
                    <AdminTableRow>
                      <AdminTableHead>Job ID</AdminTableHead>
                      <AdminTableHead>작업명</AdminTableHead>
                      <AdminTableHead>주기</AdminTableHead>
                      <AdminTableHead>상태</AdminTableHead>
                    </AdminTableRow>
                  </AdminTableHeader>
                  <AdminTableBody>
                    {cronJobs.length === 0 ? (
                      <AdminTableRow>
                        <AdminTableCell colSpan={4} className="text-center text-zinc-500">
                          등록된 pg_cron 잡 정보를 불러오지 못했습니다.
                        </AdminTableCell>
                      </AdminTableRow>
                    ) : (
                      cronJobs.map((job) => (
                        <AdminTableRow key={job.jobid}>
                          <AdminTableCell className="font-mono text-zinc-400">
                            #{job.jobid}
                          </AdminTableCell>
                          <AdminTableCell className="font-semibold">
                            {job.jobname}
                          </AdminTableCell>
                          <AdminTableCell className="font-mono text-sky-300">
                            {job.schedule}
                          </AdminTableCell>
                          <AdminTableCell>
                            <AdminBadge variant={job.active ? "success" : "danger"}>
                              {job.active ? "ACTIVE" : "PAUSED"}
                            </AdminBadge>
                          </AdminTableCell>
                        </AdminTableRow>
                      ))
                    )}
                  </AdminTableBody>
                </AdminTable>
              </div>
            </AdminCardContent>
          </AdminCard>
        </div>
      )}

      {/* 6. 카테고리 & 데이터소스 & 예측유형 제어 */}
      {draftConfig && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <AdminCard>
            <AdminCardHeader>
              <AdminCardTitle className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-purple-400" />
                허용 예측게임 카테고리 · 외부 소스 · 예측 유형
              </AdminCardTitle>
              <AdminCardDescription>
                체크 해제된 카테고리와 예측 유형은 자동 파이프라인(RSS/템플릿) 생성 대상에서 제외됩니다.
              </AdminCardDescription>
            </AdminCardHeader>
            <AdminCardContent className="space-y-5">
              <div>
                <div className="text-xs font-bold text-zinc-300 mb-2">
                  자동 발행 허용 카테고리 ({draftConfig.enabled_categories.length}/
                  {CATEGORY_OPTIONS.length})
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {CATEGORY_OPTIONS.map((cat) => {
                    const active = draftConfig.enabled_categories.includes(cat.key);
                    return (
                      <button
                        key={cat.key}
                        type="button"
                        onClick={() => toggleCategory(cat.key)}
                        className={`text-left rounded-xl border p-3 transition cursor-pointer ${
                          active
                            ? "bg-purple-500/15 border-purple-500/40 text-zinc-100"
                            : "bg-zinc-900/40 border-zinc-800 text-zinc-500"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold">{cat.label}</span>
                          <AdminBadge variant={active ? "purple" : "outline"}>
                            {active ? "허용" : "제외"}
                          </AdminBadge>
                        </div>
                        <div className="text-[11px] text-zinc-400 mt-1">{cat.desc}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <div className="text-xs font-bold text-zinc-300 mb-2">
                  외부 피드/데이터소스 연동 토글
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {(
                    [
                      {
                        key: "enable_football_source",
                        label: "축구 경기 (Football-Data)",
                      },
                      {
                        key: "enable_earnings_source",
                        label: "글로벌 실적 (FMP)",
                      },
                      {
                        key: "enable_dynamic_games",
                        label: "동적 지표 게임",
                      },
                    ] as const
                  ).map((src) => {
                    const on = draftConfig[src.key];
                    return (
                      <button
                        key={src.key}
                        type="button"
                        onClick={() =>
                          setDraftConfig({ ...draftConfig, [src.key]: !on })
                        }
                        className={`rounded-xl border p-3 text-left transition cursor-pointer ${
                          on
                            ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-200"
                            : "bg-zinc-900/40 border-zinc-800 text-zinc-500"
                        }`}
                      >
                        <div className="text-xs font-bold">{src.label}</div>
                        <div className="text-[11px] mt-1">
                          {on ? "활성 (ON)" : "비활성 (OFF)"}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <div className="text-xs font-bold text-zinc-300 mb-2">
                  허용 예측 유형 (RSS AI 초안 생성)
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {PREDICTION_TYPE_OPTIONS.map((pt) => {
                    const active = draftConfig.enabled_prediction_types.includes(pt.key);
                    return (
                      <button
                        key={pt.key}
                        type="button"
                        onClick={() => togglePredictionType(pt.key)}
                        className={`rounded-xl border p-3 text-left transition cursor-pointer ${
                          active
                            ? "bg-sky-500/15 border-sky-500/40 text-sky-100"
                            : "bg-zinc-900/40 border-zinc-800 text-zinc-500"
                        }`}
                      >
                        <div className="text-xs font-bold">{pt.label}</div>
                        <div className="text-[11px] text-zinc-400 mt-1">{pt.desc}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </AdminCardContent>
          </AdminCard>

          {/* 7. 게임 생성 · 정산 · 품질 상세 옵션 */}
          <AdminCard>
            <AdminCardHeader>
              <AdminCardTitle className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-amber-400" />
                게임 생성 · 베팅 한도 · 정산 정밀 옵션
              </AdminCardTitle>
              <AdminCardDescription>
                발행량 상한, 기본 베팅 PMP 범위, 마감/정산 지연 정책, 중복 방지 강도를 미세 조정합니다.
              </AdminCardDescription>
            </AdminCardHeader>
            <AdminCardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <label className="space-y-1">
                  <span className="text-[11px] font-semibold text-zinc-400">
                    회당 RSS AI 분류 건수 (1~50)
                  </span>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={draftConfig.rss_classify_batch_size}
                    onChange={(e) =>
                      setDraftConfig({
                        ...draftConfig,
                        rss_classify_batch_size: Number(e.target.value) || 1,
                      })
                    }
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs text-white"
                  />
                </label>

                <label className="space-y-1">
                  <span className="text-[11px] font-semibold text-zinc-400">
                    회당 초안 최대 생성 (1~30)
                  </span>
                  <input
                    type="number"
                    min={1}
                    max={30}
                    value={draftConfig.max_drafts_per_run}
                    onChange={(e) =>
                      setDraftConfig({
                        ...draftConfig,
                        max_drafts_per_run: Number(e.target.value) || 1,
                      })
                    }
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs text-white"
                  />
                </label>

                <label className="space-y-1">
                  <span className="text-[11px] font-semibold text-zinc-400">
                    동시 활성 게임 상한 (5~300)
                  </span>
                  <input
                    type="number"
                    min={5}
                    max={300}
                    value={draftConfig.max_active_games_cap}
                    onChange={(e) =>
                      setDraftConfig({
                        ...draftConfig,
                        max_active_games_cap: Number(e.target.value) || 5,
                      })
                    }
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs text-white"
                  />
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="space-y-1">
                  <span className="text-[11px] font-semibold text-zinc-400">
                    기본 최소 베팅 (PMP)
                  </span>
                  <input
                    type="number"
                    min={10}
                    step={100}
                    value={draftConfig.default_min_bet}
                    onChange={(e) =>
                      setDraftConfig({
                        ...draftConfig,
                        default_min_bet: Number(e.target.value) || 100,
                      })
                    }
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs text-white"
                  />
                </label>

                <label className="space-y-1">
                  <span className="text-[11px] font-semibold text-zinc-400">
                    기본 최대 베팅 (PMP)
                  </span>
                  <input
                    type="number"
                    min={100}
                    step={1000}
                    value={draftConfig.default_max_bet}
                    onChange={(e) =>
                      setDraftConfig({
                        ...draftConfig,
                        default_max_bet: Number(e.target.value) || 10000,
                      })
                    }
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs text-white"
                  />
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="space-y-1">
                  <span className="text-[11px] font-semibold text-zinc-400">
                    기본 베팅 마감 기간 (시간, 1~720)
                  </span>
                  <input
                    type="number"
                    min={1}
                    max={720}
                    value={draftConfig.default_closing_hours}
                    onChange={(e) =>
                      setDraftConfig({
                        ...draftConfig,
                        default_closing_hours: Number(e.target.value) || 24,
                      })
                    }
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs text-white"
                  />
                </label>

                <label className="space-y-1">
                  <span className="text-[11px] font-semibold text-zinc-400">
                    기본 정산 대기 지연 (시간, 0~168)
                  </span>
                  <input
                    type="number"
                    min={0}
                    max={168}
                    value={draftConfig.default_settlement_delay_hours}
                    onChange={(e) =>
                      setDraftConfig({
                        ...draftConfig,
                        default_settlement_delay_hours: Number(e.target.value) || 0,
                      })
                    }
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs text-white"
                  />
                </label>
              </div>

              <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-3.5 flex items-center justify-between gap-4">
                <div>
                  <div className="text-xs font-bold text-zinc-100">
                    마감 즉시 오라클 정산 시도 (settle_immediately_on_close)
                  </div>
                  <div className="text-[11px] text-zinc-400">
                    체크 시 마감된 CLOSED 게임은 scheduled_at 유예 시간이 남았더라도 즉시 결과 판정·정산을 시도합니다.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setDraftConfig({
                      ...draftConfig,
                      settle_immediately_on_close:
                        !draftConfig.settle_immediately_on_close,
                    })
                  }
                  className={`shrink-0 px-3.5 py-1.5 rounded-lg text-xs font-extrabold border transition cursor-pointer ${
                    draftConfig.settle_immediately_on_close
                      ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                      : "bg-zinc-800 text-zinc-400 border-zinc-700"
                  }`}
                >
                  {draftConfig.settle_immediately_on_close ? "즉시 정산 ON" : "유예 준수 OFF"}
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <label className="space-y-1">
                  <span className="text-[11px] font-semibold text-zinc-400">
                    AI 정산 최소 신뢰도 ({draftConfig.rss_ai_min_confidence.toFixed(2)})
                  </span>
                  <input
                    type="range"
                    min={0.5}
                    max={0.99}
                    step={0.01}
                    value={draftConfig.rss_ai_min_confidence}
                    onChange={(e) =>
                      setDraftConfig({
                        ...draftConfig,
                        rss_ai_min_confidence: Number(e.target.value),
                      })
                    }
                    className="w-full accent-purple-500"
                  />
                </label>

                <label className="space-y-1">
                  <span className="text-[11px] font-semibold text-zinc-400">
                    중복 방지 엄격도
                  </span>
                  <select
                    value={draftConfig.duplicate_check_strictness}
                    onChange={(e) =>
                      setDraftConfig({
                        ...draftConfig,
                        duplicate_check_strictness: e.target
                          .value as DuplicateCheckStrictness,
                      })
                    }
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs text-white"
                  >
                    <option value="strict">strict (키워드+제목 엄격)</option>
                    <option value="normal">normal (표준 비교)</option>
                    <option value="relaxed">relaxed (유사 주제 허용)</option>
                  </select>
                </label>

                <label className="space-y-1">
                  <span className="text-[11px] font-semibold text-zinc-400">
                    미정산 정리 기준일 (일)
                  </span>
                  <input
                    type="number"
                    min={1}
                    max={90}
                    value={draftConfig.stale_void_days}
                    onChange={(e) =>
                      setDraftConfig({
                        ...draftConfig,
                        stale_void_days: Number(e.target.value) || 7,
                      })
                    }
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs text-white"
                  />
                </label>
              </div>
            </AdminCardContent>
          </AdminCard>
        </div>
      )}

      {/* 7.5 RSS 피드 큐 슬라이딩 TTL 라이프사이클 정책 */}
      {draftConfig && (
        <AdminCard>
          <AdminCardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <AdminCardTitle className="flex items-center gap-2">
                <Database className="w-4 h-4 text-sky-400" />
                RSS 피드 큐 슬라이딩 TTL 라이프사이클 관리
              </AdminCardTitle>
              <AdminCardDescription>
                미분류(PENDING)·폐기(IGNORED)·초안(DRAFT_CREATED) 레코드가 무한정 누적되지 않도록 신선도 TTL과 상한(최대 120건)을 자동 유지합니다.
              </AdminCardDescription>
            </div>
            <button
              type="button"
              onClick={() =>
                setDraftConfig({
                  ...draftConfig,
                  auto_feed_cleanup_enabled: !draftConfig.auto_feed_cleanup_enabled,
                })
              }
              className={`shrink-0 px-3.5 py-1.5 rounded-lg text-xs font-extrabold border transition cursor-pointer ${
                draftConfig.auto_feed_cleanup_enabled
                  ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                  : "bg-zinc-800 text-zinc-400 border-zinc-700"
              }`}
            >
              {draftConfig.auto_feed_cleanup_enabled
                ? "자동 TTL 정리 ON"
                : "자동 정리 OFF"}
            </button>
          </AdminCardHeader>
          <AdminCardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <label className="space-y-1">
                <span className="text-[11px] font-semibold text-zinc-400">
                  PENDING 신선도 TTL (시간, 12~168)
                </span>
                <input
                  type="number"
                  min={12}
                  max={168}
                  value={draftConfig.feed_pending_ttl_hours}
                  onChange={(e) =>
                    setDraftConfig({
                      ...draftConfig,
                      feed_pending_ttl_hours: Number(e.target.value) || 48,
                    })
                  }
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs text-white"
                />
              </label>

              <label className="space-y-1">
                <span className="text-[11px] font-semibold text-zinc-400">
                  IGNORED 중복방지 보존 (일, 1~30)
                </span>
                <input
                  type="number"
                  min={1}
                  max={30}
                  value={draftConfig.feed_ignored_retention_days}
                  onChange={(e) =>
                    setDraftConfig({
                      ...draftConfig,
                      feed_ignored_retention_days: Number(e.target.value) || 7,
                    })
                  }
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs text-white"
                />
              </label>

              <label className="space-y-1">
                <span className="text-[11px] font-semibold text-zinc-400">
                  DRAFT_CREATED 이력 보존 (일, 3~90)
                </span>
                <input
                  type="number"
                  min={3}
                  max={90}
                  value={draftConfig.feed_draft_retention_days}
                  onChange={(e) =>
                    setDraftConfig({
                      ...draftConfig,
                      feed_draft_retention_days: Number(e.target.value) || 14,
                    })
                  }
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs text-white"
                />
              </label>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <AdminButton
                variant="primary"
                size="sm"
                onClick={() =>
                  void handleCleanupFeed("lifecycle", "TTL 라이프사이클 정리")
                }
                disabled={runningStep !== null}
              >
                <Sparkles className="w-3.5 h-3.5" />
                TTL 라이프사이클 지금 정리
              </AdminButton>
              <AdminButton
                variant="outline"
                size="sm"
                onClick={() =>
                  void handleCleanupFeed("pending", "PENDING 대기열 비우기")
                }
                disabled={runningStep !== null}
              >
                <Trash2 className="w-3.5 h-3.5 text-amber-400" />
                PENDING 대기열 비우기
              </AdminButton>
              <AdminButton
                variant="secondary"
                size="sm"
                onClick={() =>
                  void handleCleanupFeed("all-stale", "오래된 초안·폐기 기록 삭제")
                }
                disabled={runningStep !== null}
              >
                <Trash2 className="w-3.5 h-3.5 text-zinc-400" />
                초안/폐기 기록 정리
              </AdminButton>
            </div>
          </AdminCardContent>
        </AdminCard>
      )}

      {/* 8. 오라클 어댑터 & 실시간 시세 모니터링 */}
      <AdminCard>
        <AdminCardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <AdminCardTitle className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-emerald-400" />
              오라클 어댑터 헬스 & 실시간 시세 스냅샷
            </AdminCardTitle>
            <AdminCardDescription>
              자동 정산 엔진이 참조하는 외부 데이터 API 연결 상태를 점검합니다.
            </AdminCardDescription>
          </div>
          <AdminButton
            variant="secondary"
            size="sm"
            onClick={() => void handlePingOracles()}
            disabled={pingingOracles}
          >
            <Activity className={`w-3.5 h-3.5 ${pingingOracles ? "animate-pulse" : ""}`} />
            {pingingOracles ? "어댑터 점검 중..." : "전체 어댑터 연결 점검 (Ping)"}
          </AdminButton>
        </AdminCardHeader>
        <AdminCardContent className="space-y-4">
          {oracleItems.length === 0 ? (
            <div className="text-xs text-zinc-500">
              오라클 상태 데이터를 불러오지 못했습니다.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
              {oracleItems.map((item, idx) => {
                const label = item.name ?? item.provider ?? item.id ?? `Oracle-${idx + 1}`;
                const healthy =
                  item.configured === true ||
                  item.status === "connected" ||
                  item.status === "active";
                return (
                  <div
                    key={label}
                    className="rounded-lg border border-zinc-800/80 bg-zinc-900/40 p-3 flex flex-col justify-between gap-1.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-zinc-200 truncate">
                        {label}
                      </span>
                      <AdminBadge variant={healthy ? "success" : "warning"}>
                        {healthy ? "OK" : item.status ?? "CHECK"}
                      </AdminBadge>
                    </div>
                    {item.description && (
                      <p className="text-[10px] text-zinc-500 line-clamp-2">
                        {item.description}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {oracleStatus?.liveMarketSnapshot && (
            <div className="rounded-lg border border-zinc-800/80 bg-zinc-950/70 p-3 flex flex-wrap items-center gap-3 text-[11px]">
              <span className="font-bold text-zinc-400 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                실시간 오라클 시세:
              </span>
              {Object.entries(oracleStatus.liveMarketSnapshot).map(([k, v]) => (
                <span
                  key={k}
                  className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 font-mono text-zinc-300"
                >
                  {k}: {typeof v === "object" ? JSON.stringify(v) : String(v)}
                </span>
              ))}
            </div>
          )}
        </AdminCardContent>
      </AdminCard>

      {/* 하단 고정/보조 저장 바 */}
      {hasUnsavedChanges && (
        <div className="sticky bottom-4 z-20 rounded-xl border border-amber-500/40 bg-zinc-950/95 backdrop-blur px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xl">
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-300">
            <Bot className="w-4 h-4" />
            변경된 스케줄러 옵션이 있습니다. 저장하면 DB와 Supabase pg_cron에 즉시 적용됩니다.
          </div>
          <div className="flex items-center gap-2">
            <AdminButton
              variant="outline"
              size="sm"
              onClick={() => config && setDraftConfig(config)}
            >
              변경 취소
            </AdminButton>
            <AdminButton
              variant="amber"
              size="sm"
              onClick={() => void handleSaveAll()}
              disabled={saving}
            >
              <Save className="w-3.5 h-3.5" />
              {saving ? "저장 중..." : "지금 저장 및 반영"}
            </AdminButton>
          </div>
        </div>
      )}
    </div>
  );
}
