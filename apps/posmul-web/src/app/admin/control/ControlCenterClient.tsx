"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import {
  Sliders,
  Lock,
  ShieldAlert,
  Sparkles,
  Bot,
  Layers,
  History,
  ExternalLink,
  Search,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";
import {
  DOMAIN_META_MAP,
  type EvaluatedSiteFeatureFlag,
  type FeatureFlagAuditLog,
  type FeatureFlagDomain,
  type FeatureFlagGroup,
} from "@/shared/lib/feature-flags/feature-flags.domain";

interface ControlCenterClientProps {
  initialFlags: EvaluatedSiteFeatureFlag[];
  initialAuditLogs: FeatureFlagAuditLog[];
  initialDomain: FeatureFlagDomain | "all";
}

const DOMAIN_ORDER: FeatureFlagDomain[] = [
  "prediction",
  "forum",
  "donation",
  "consume",
  "economy",
  "ranking",
  "users",
  "healing_room",
  "system",
];

const GROUP_FILTERS: Array<{
  key: FeatureFlagGroup | "all";
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { key: "all", label: "전체 기능", icon: Layers },
  { key: "module", label: "모듈 · Phase", icon: Sliders },
  { key: "addon", label: "애드온 · 실험", icon: Sparkles },
  { key: "automation", label: "자동화 · 비용방어", icon: Bot },
  { key: "gate", label: "게이트 · 킬스위치", icon: ShieldAlert },
  { key: "constitution", label: "헌법 고정", icon: Lock },
];

export function ControlCenterClient({
  initialFlags,
  initialAuditLogs,
  initialDomain,
}: ControlCenterClientProps) {
  const [flags, setFlags] = useState<EvaluatedSiteFeatureFlag[]>(initialFlags);
  const [auditLogs, setAuditLogs] = useState<FeatureFlagAuditLog[]>(initialAuditLogs);
  const [selectedDomain, setSelectedDomain] = useState<FeatureFlagDomain | "all">(
    initialDomain
  );
  const [selectedGroup, setSelectedGroup] = useState<FeatureFlagGroup | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [updatingKey, setUpdatingKey] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [banner, setBanner] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const refreshAll = async () => {
    setRefreshing(true);
    try {
      const res = await fetch("/api/admin/feature-flags", { cache: "no-store" });
      const json = (await res.json()) as {
        ok?: boolean;
        flags?: EvaluatedSiteFeatureFlag[];
        auditLogs?: FeatureFlagAuditLog[];
      };
      if (json.ok) {
        if (Array.isArray(json.flags)) setFlags(json.flags);
        if (Array.isArray(json.auditLogs)) setAuditLogs(json.auditLogs);
      }
    } finally {
      setRefreshing(false);
    }
  };

  const handleToggle = async (flag: EvaluatedSiteFeatureFlag) => {
    if (flag.isLocked || updatingKey) return;
    setUpdatingKey(flag.flagKey);
    setBanner(null);

    try {
      const res = await fetch("/api/admin/feature-flags", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          flagKey: flag.flagKey,
          enabled: !flag.enabled,
        }),
      });
      const json = (await res.json()) as {
        ok?: boolean;
        message?: string;
        flags?: EvaluatedSiteFeatureFlag[];
        auditLogs?: FeatureFlagAuditLog[];
      };

      if (!res.ok || !json.ok) {
        setBanner({
          type: "err",
          text: json.message ?? "스위치 변경에 실패했습니다.",
        });
        return;
      }

      if (Array.isArray(json.flags)) setFlags(json.flags);
      if (Array.isArray(json.auditLogs)) setAuditLogs(json.auditLogs);
      setBanner({
        type: "ok",
        text: `[${flag.label}] → ${!flag.enabled ? "ON (활성)" : "OFF (비활성)"} 저장 및 전 서버 캐시 무효화 완료`,
      });
    } finally {
      setUpdatingKey(null);
    }
  };

  const masterFlags = useMemo(
    () => flags.filter((f) => f.parentKey === null && f.flagKey.startsWith("domain.")),
    [flags]
  );

  const filteredFlags = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return flags.filter((f) => {
      if (selectedDomain !== "all" && f.domain !== selectedDomain) return false;
      if (selectedGroup !== "all" && f.groupName !== selectedGroup) return false;
      if (
        q &&
        !f.label.toLowerCase().includes(q) &&
        !f.description.toLowerCase().includes(q) &&
        !f.flagKey.toLowerCase().includes(q)
      ) {
        return false;
      }
      return true;
    });
  }, [flags, selectedDomain, selectedGroup, searchQuery]);

  const totalActive = flags.filter((f) => f.effectiveEnabled).length;
  const masterActive = masterFlags.filter((f) => f.enabled).length;
  const lockedCount = flags.filter((f) => f.isLocked).length;
  const killSwitchesActive = flags.filter(
    (f) => f.groupName === "gate" && f.effectiveEnabled
  ).length;

  return (
    <div className="space-y-6">
      {/* 상단 타이틀 & 새로고침 */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
              POSMUL ADMIN OS
            </span>
            <span className="text-xs text-zinc-400">
              2단 계층 제어 (전역 마스터 ↔ 도메인별 세부 기능 ON/OFF)
            </span>
          </div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <Sliders className="w-6 h-6 text-emerald-400" />
            <span>기능 ON/OFF 제어센터</span>
          </h1>
        </div>

        <button
          type="button"
          onClick={() => void refreshAll()}
          disabled={refreshing}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-bold text-zinc-200 transition cursor-pointer self-start md:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
          <span>실시간 동기화</span>
        </button>
      </div>

      {/* KPI 요약 4카드 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="rounded-2xl bg-zinc-950/90 border border-zinc-800 p-4">
          <div className="text-[11px] font-semibold text-zinc-400">전체 활성 기능</div>
          <div className="text-2xl font-black text-emerald-400 mt-1 tabular-nums">
            {totalActive} <span className="text-sm text-zinc-500">/ {flags.length}</span>
          </div>
        </div>
        <div className="rounded-2xl bg-zinc-950/90 border border-zinc-800 p-4">
          <div className="text-[11px] font-semibold text-zinc-400">도메인 마스터 ON</div>
          <div className="text-2xl font-black text-sky-400 mt-1 tabular-nums">
            {masterActive} <span className="text-sm text-zinc-500">/ {masterFlags.length}</span>
          </div>
        </div>
        <div className="rounded-2xl bg-zinc-950/90 border border-zinc-800 p-4">
          <div className="text-[11px] font-semibold text-zinc-400">게이트 · 킬스위치 ON</div>
          <div className="text-2xl font-black text-amber-400 mt-1 tabular-nums">
            {killSwitchesActive}
          </div>
        </div>
        <div className="rounded-2xl bg-zinc-950/90 border border-zinc-800 p-4">
          <div className="text-[11px] font-semibold text-zinc-400">v3.0 헌법 고정</div>
          <div className="text-2xl font-black text-zinc-100 mt-1 flex items-center gap-1.5 tabular-nums">
            <Lock className="w-4 h-4 text-amber-400" />
            <span>{lockedCount}</span>
          </div>
        </div>
      </div>

      {/* 변경 알림 배너 */}
      {banner && (
        <div
          className={`px-4 py-3 rounded-xl border text-xs font-bold ${
            banner.type === "ok"
              ? "bg-emerald-950/40 border-emerald-500/35 text-emerald-300"
              : "bg-rose-950/40 border-rose-500/35 text-rose-300"
          }`}
        >
          {banner.text}
        </div>
      )}

      {/* 도메인 마스터 퀵 바 (큰 ON/OFF 한눈에 제어) */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-950/85 p-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-black text-white">
            1단계: 도메인 마스터 스위치 (부모 OFF 시 하위 기능 일괄 정지)
          </h2>
          <span className="text-[11px] text-zinc-400">클릭 시 하위 도메인 즉시 연동</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {masterFlags.map((flag) => {
            const meta = DOMAIN_META_MAP[flag.domain];
            return (
              <div
                key={flag.flagKey}
                className={`rounded-xl border p-3 flex items-center justify-between gap-2 transition ${
                  flag.enabled
                    ? "bg-zinc-900/75 border-zinc-800"
                    : "bg-rose-950/20 border-rose-500/30"
                }`}
              >
                <button
                  type="button"
                  onClick={() => setSelectedDomain(flag.domain)}
                  className="text-left min-w-0 cursor-pointer"
                >
                  <div className="text-xs font-black text-white truncate">
                    {meta.label}
                  </div>
                  <div className="text-[10px] text-zinc-400 truncate mt-0.5">
                    세부 기능 보기 →
                  </div>
                </button>
                <button
                  type="button"
                  role="switch"
                  aria-checked={flag.enabled}
                  disabled={updatingKey === flag.flagKey}
                  onClick={() => void handleToggle(flag)}
                  className={`shrink-0 relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer disabled:opacity-50 ${
                    flag.enabled ? "bg-emerald-500" : "bg-zinc-700"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                      flag.enabled ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2단계: 도메인별 · 성격별 세부 기능 필터 & 스위치 그리드 */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-950/85 p-4 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* 도메인 탭 */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => setSelectedDomain("all")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition cursor-pointer ${
                selectedDomain === "all"
                  ? "bg-white text-zinc-950 border-white"
                  : "bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-zinc-200"
              }`}
            >
              전체 ({flags.length})
            </button>
            {DOMAIN_ORDER.map((dom) => {
              const count = flags.filter((f) => f.domain === dom).length;
              return (
                <button
                  key={dom}
                  type="button"
                  onClick={() => setSelectedDomain(dom)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border transition cursor-pointer ${
                    selectedDomain === dom
                      ? "bg-emerald-500 text-zinc-950 border-emerald-400"
                      : "bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-zinc-200"
                  }`}
                >
                  {DOMAIN_META_MAP[dom].label.split(" ")[0]} ({count})
                </button>
              );
            })}
          </div>

          {/* 검색창 */}
          <div className="relative w-full lg:w-64">
            <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="기능명 · 키 검색..."
              className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-emerald-500/60"
            />
          </div>
        </div>

        {/* 성격별 필터 칩 + 선택 도메인 바로가기 */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-zinc-800/80">
          <div className="flex items-center gap-1.5 flex-wrap">
            {GROUP_FILTERS.map((g) => {
              const Icon = g.icon;
              return (
                <button
                  key={g.key}
                  type="button"
                  onClick={() => setSelectedGroup(g.key)}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border transition cursor-pointer ${
                    selectedGroup === g.key
                      ? "bg-sky-500/20 text-sky-300 border-sky-400/50"
                      : "bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-zinc-200"
                  }`}
                >
                  <Icon className="w-3 h-3" />
                  <span>{g.label}</span>
                </button>
              );
            })}
          </div>

          {selectedDomain !== "all" &&
            !DOMAIN_META_MAP[selectedDomain].adminHref.startsWith("/admin/control") && (
              <Link
                href={DOMAIN_META_MAP[selectedDomain].adminHref}
                className="inline-flex items-center gap-1 text-xs font-bold text-emerald-400 hover:text-emerald-300"
              >
                <span>{DOMAIN_META_MAP[selectedDomain].label} 관리 페이지로 이동</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            )}
        </div>

        {/* 세부 스위치 카드 목록 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredFlags.map((flag) => {
            const blockedByParent = Boolean(flag.blockedByParentKey);
            const busy = updatingKey === flag.flagKey;
            return (
              <div
                key={flag.flagKey}
                className={`rounded-xl border p-3.5 flex items-center justify-between gap-3 transition ${
                  blockedByParent
                    ? "bg-zinc-950/60 border-zinc-800/60 opacity-65"
                    : flag.effectiveEnabled
                    ? "bg-zinc-900/70 border-zinc-800 hover:border-zinc-700"
                    : "bg-zinc-950 border-zinc-800/80"
                }`}
              >
                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs font-black text-white">{flag.label}</span>
                    {flag.badge && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-zinc-800 text-zinc-300 border border-zinc-700">
                        {flag.badge}
                      </span>
                    )}
                    {blockedByParent && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                        <AlertTriangle className="w-2.5 h-2.5" />
                        <span>상위 OFF</span>
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-zinc-400 leading-snug">
                    {flag.description}
                  </p>
                  <div className="text-[10px] font-mono text-zinc-500">{flag.flagKey}</div>
                </div>

                {flag.isLocked ? (
                  <span className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-amber-500/30 text-[11px] font-bold text-amber-300">
                    <Lock className="w-3.5 h-3.5" />
                    <span>헌법 고정</span>
                  </span>
                ) : (
                  <button
                    type="button"
                    role="switch"
                    aria-checked={flag.enabled}
                    disabled={busy}
                    onClick={() => void handleToggle(flag)}
                    className={`shrink-0 relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer disabled:opacity-50 ${
                      flag.enabled ? "bg-emerald-500" : "bg-zinc-700"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                        flag.enabled ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 변경 이력 감사 로그 */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-950/85 p-4 space-y-3">
        <h2 className="text-sm font-black text-white flex items-center gap-2">
          <History className="w-4 h-4 text-sky-400" />
          <span>최근 스위치 변경 감사 로그 (Audit Log)</span>
        </h2>
        {auditLogs.length === 0 ? (
          <p className="text-xs text-zinc-500 py-2">
            아직 변경 이력이 없습니다. 위 스위치를 전환하면 자동으로 기록됩니다.
          </p>
        ) : (
          <div className="divide-y divide-zinc-800/80 text-xs">
            {auditLogs.slice(0, 12).map((log) => (
              <div
                key={log.logId}
                className="py-2 flex flex-wrap items-center justify-between gap-2"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-mono text-[11px] text-zinc-300 font-semibold">
                    {log.flagKey}
                  </span>
                  <span className="text-zinc-500">
                    {log.prevEnabled ? "ON" : "OFF"} →{" "}
                    <strong className={log.nextEnabled ? "text-emerald-400" : "text-rose-400"}>
                      {log.nextEnabled ? "ON" : "OFF"}
                    </strong>
                  </span>
                </div>
                <div className="flex items-center gap-3 text-[11px] text-zinc-500">
                  <span>{log.changedByEmail ?? "admin"}</span>
                  <span className="tabular-nums">
                    {new Date(log.createdAt).toLocaleString("ko-KR", {
                      timeZone: "Asia/Seoul",
                    })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
