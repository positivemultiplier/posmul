"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ChevronDown,
  ChevronUp,
  Lock,
  RefreshCw,
  Sliders,
  ExternalLink,
  AlertTriangle,
} from "lucide-react";
import {
  DOMAIN_META_MAP,
  type EvaluatedSiteFeatureFlag,
  type FeatureFlagDomain,
} from "@/shared/lib/feature-flags/feature-flags.domain";

interface DomainFeatureControlPanelProps {
  domain: FeatureFlagDomain;
  defaultExpanded?: boolean;
}

export function DomainFeatureControlPanel({
  domain,
  defaultExpanded = true,
}: DomainFeatureControlPanelProps) {
  const [flags, setFlags] = useState<EvaluatedSiteFeatureFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [updatingKey, setUpdatingKey] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const meta = DOMAIN_META_MAP[domain];

  const loadFlags = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/feature-flags?domain=${domain}`, {
        cache: "no-store",
      });
      const json = (await res.json()) as {
        ok?: boolean;
        flags?: EvaluatedSiteFeatureFlag[];
      };
      if (json.ok && Array.isArray(json.flags)) {
        setFlags(json.flags);
      }
    } finally {
      setLoading(false);
    }
  }, [domain]);

  useEffect(() => {
    void loadFlags();
  }, [loadFlags]);

  const handleToggle = async (flag: EvaluatedSiteFeatureFlag) => {
    if (flag.isLocked || updatingKey) return;
    setUpdatingKey(flag.flagKey);
    setNotice(null);
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
      };

      if (!res.ok || !json.ok) {
        setNotice({
          type: "err",
          text: json.message ?? "스위치 변경에 실패했습니다.",
        });
        return;
      }

      if (Array.isArray(json.flags)) {
        setFlags(json.flags.filter((f) => f.domain === domain));
      } else {
        await loadFlags();
      }
      setNotice({
        type: "ok",
        text: `[${flag.label}] → ${!flag.enabled ? "ON (활성)" : "OFF (비활성)"} 즉시 반영 완료`,
      });
    } finally {
      setUpdatingKey(null);
    }
  };

  const masterFlag = flags.find((f) => f.parentKey === null && f.flagKey.startsWith("domain."));
  const detailFlags = flags.filter((f) => f.flagKey !== masterFlag?.flagKey);
  const activeCount = detailFlags.filter((f) => f.effectiveEnabled).length;

  return (
    <section className="rounded-2xl border border-zinc-800/90 bg-zinc-950/85 shadow-xl overflow-hidden">
      {/* 상단 요약 헤더 바 */}
      <div className="px-4 py-3.5 flex flex-wrap items-center justify-between gap-3 bg-gradient-to-r from-zinc-900/90 via-zinc-950 to-zinc-950 border-b border-zinc-800/70">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shrink-0">
            <Sliders className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-sm font-black text-white">
                {meta.label} 세부 기능 ON/OFF
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-zinc-800 text-zinc-300 border border-zinc-700">
                활성 {activeCount} / {detailFlags.length}
              </span>
              {masterFlag && !masterFlag.enabled && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                  <AlertTriangle className="w-3 h-3" />
                  <span>도메인 마스터 OFF</span>
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-400 truncate">{meta.description}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {masterFlag && (
            <button
              type="button"
              onClick={() => void handleToggle(masterFlag)}
              disabled={updatingKey === masterFlag.flagKey}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition cursor-pointer ${
                masterFlag.enabled
                  ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/25"
                  : "bg-rose-500/15 text-rose-300 border-rose-500/40 hover:bg-rose-500/25"
              }`}
            >
              마스터 {masterFlag.enabled ? "ON" : "OFF"}
            </button>
          )}
          <button
            type="button"
            onClick={() => void loadFlags()}
            className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-zinc-200 transition cursor-pointer"
            title="새로고침"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
          <Link
            href={`/admin/control?domain=${domain}`}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-semibold text-zinc-300 transition"
          >
            <span>전체 제어판</span>
            <ExternalLink className="w-3 h-3" />
          </Link>
          <button
            type="button"
            onClick={() => setExpanded((prev) => !prev)}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-semibold text-zinc-200 transition cursor-pointer"
          >
            <span>{expanded ? "접기" : "세부 펼치기"}</span>
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* 변경 결과 알림 */}
      {notice && (
        <div
          className={`px-4 py-2 text-xs font-semibold border-b ${
            notice.type === "ok"
              ? "bg-emerald-950/40 text-emerald-300 border-emerald-500/25"
              : "bg-rose-950/40 text-rose-300 border-rose-500/25"
          }`}
        >
          {notice.text}
        </div>
      )}

      {/* 세부 스위치 그리드 */}
      {expanded && (
        <div className="p-4">
          {loading && flags.length === 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2.5">
              {[1, 2, 3].map((n) => (
                <div key={n} className="h-16 rounded-xl bg-zinc-900/70 animate-pulse" />
              ))}
            </div>
          ) : detailFlags.length === 0 ? (
            <p className="text-xs text-zinc-500 py-2">등록된 세부 기능 스위치가 없습니다.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2.5">
              {detailFlags.map((flag) => {
                const blockedByParent = Boolean(flag.blockedByParentKey);
                const busy = updatingKey === flag.flagKey;
                return (
                  <div
                    key={flag.flagKey}
                    className={`rounded-xl border p-3 flex items-center justify-between gap-3 transition ${
                      blockedByParent
                        ? "bg-zinc-950/60 border-zinc-800/60 opacity-65"
                        : flag.effectiveEnabled
                        ? "bg-zinc-900/70 border-zinc-800 hover:border-zinc-700"
                        : "bg-zinc-950/90 border-zinc-800/80"
                    }`}
                  >
                    <div className="min-w-0 space-y-0.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-bold text-zinc-100 truncate">
                          {flag.label}
                        </span>
                        {flag.badge && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-zinc-800 text-zinc-300 border border-zinc-700/70">
                            {flag.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-zinc-400 line-clamp-1">
                        {blockedByParent
                          ? "상위 도메인 마스터가 OFF되어 일시 비활성 상태입니다."
                          : flag.description}
                      </p>
                    </div>

                    {flag.isLocked ? (
                      <span
                        title="v3.0 경제 헌법 불변 항목"
                        className="shrink-0 inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-zinc-900 border border-zinc-700 text-[11px] font-bold text-amber-300"
                      >
                        <Lock className="w-3 h-3" />
                        <span>고정</span>
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
          )}
        </div>
      )}
    </section>
  );
}
