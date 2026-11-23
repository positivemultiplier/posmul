"use client";

import React, { useEffect, useState } from "react";
import { CheckCircle2, Clock, Cpu, XCircle } from "lucide-react";

import { getAiForecastsAction } from "../../../../app/prediction/components/prediction-forecast.actions";
import type {
  AiForecastDTO,
  AiProviderKey,
} from "../../domain/value-objects/ai-forecast.types";

interface AiForecastSectionProps {
  gameId: string;
  /** SSR에서 이미 캐시된 AI 예측이 있으면 즉시 렌더 (클라이언트 Server Action 왕복 생략) */
  initialForecasts?: AiForecastDTO[] | null;
}

const PROVIDER_ACCENT: Record<
  AiProviderKey,
  { badge: string; border: string; bar: string }
> = {
  gemini: {
    badge: "bg-sky-500/15 text-sky-300 border-sky-500/35",
    border: "border-sky-500/25",
    bar: "bg-sky-400",
  },
  exaone: {
    badge: "bg-rose-500/15 text-rose-300 border-rose-500/35",
    border: "border-rose-500/25",
    bar: "bg-rose-400",
  },
  openrouter: {
    badge: "bg-violet-500/15 text-violet-300 border-violet-500/35",
    border: "border-violet-500/25",
    bar: "bg-violet-400",
  },
  openai: {
    badge: "bg-emerald-500/15 text-emerald-300 border-emerald-500/35",
    border: "border-emerald-500/25",
    bar: "bg-emerald-400",
  },
  anthropic: {
    badge: "bg-amber-500/15 text-amber-300 border-amber-500/35",
    border: "border-amber-500/25",
    bar: "bg-amber-400",
  },
};

function RecentFormStrip({ forecast }: { forecast: AiForecastDTO }) {
  const { stats } = forecast;
  if (stats.scope === "none" || stats.recentForm.length === 0) {
    return (
      <div className="flex items-center justify-between text-xs text-slate-500 pt-3 border-t border-white/[0.06]">
        <span>{stats.categoryLabel} 최근 5경기</span>
        <span className="inline-flex items-center gap-1 text-slate-400">
          <Clock className="w-3.5 h-3.5" />
          <span>첫 정산 집계 대기</span>
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between gap-2 pt-3 border-t border-white/[0.06]">
      <span className="text-xs font-semibold text-slate-400">
        {stats.categoryLabel} 최근 {stats.recentForm.length}경기
      </span>
      <div className="flex items-center gap-1">
        {stats.recentForm.map((item, idx) => (
          <span
            key={`${item.gameId}-${idx}`}
            title={item.isHit ? "적중" : "미적중"}
            className={`w-6 h-6 rounded-md text-[11px] font-black flex items-center justify-center border ${
              item.isHit
                ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/35"
                : "bg-rose-500/15 text-rose-300 border-rose-500/35"
            }`}
          >
            {item.isHit ? "승" : "패"}
          </span>
        ))}
      </div>
    </div>
  );
}

export function AiForecastSection({
  gameId,
  initialForecasts,
}: AiForecastSectionProps) {
  const hasInitial = Boolean(initialForecasts && initialForecasts.length > 0);
  const [forecasts, setForecasts] = useState<AiForecastDTO[]>(
    initialForecasts ?? []
  );
  const [loading, setLoading] = useState(!hasInitial);

  useEffect(() => {
    // SSR에서 이미 연동 AI 예측을 내려받았다면 추가 POST 왕복 생략
    if (initialForecasts && initialForecasts.length > 0) {
      setForecasts(initialForecasts);
      setLoading(false);
      return;
    }

    let mounted = true;
    setLoading(true);

    getAiForecastsAction(gameId)
      .then((res) => {
        if (mounted && res.success) {
          setForecasts(res.forecasts);
        }
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [gameId, initialForecasts]);

  if (loading) {
    return (
      <div className="p-5 rounded-3xl bg-slate-900/50 border border-white/[0.07] text-center text-sm text-slate-400">
        연동된 AI 모델 예측 현황을 불러오는 중입니다...
      </div>
    );
  }

  // 미연동·미생성 상태면 억지 빈 UI를 노출하지 않음
  if (forecasts.length === 0) {
    return null;
  }

  const gridClass =
    forecasts.length === 1 ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2";

  return (
    <section className="space-y-4 p-5 sm:p-6 rounded-3xl bg-[#0d1321] border border-white/[0.09] shadow-2xl">
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-white/[0.07]">
        <h3 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
          <Cpu className="w-5 h-5 text-sky-400" />
          <span>주요 AI 모델 예측 현황</span>
        </h3>
        <span className="text-xs font-bold text-slate-400">
          오픈 시점 독립 예측 · 판단 참고용
        </span>
      </div>

      <div className={`grid gap-4 ${gridClass}`}>
        {forecasts.map((item) => {
          const accent =
            PROVIDER_ACCENT[item.providerKey] ?? PROVIDER_ACCENT.openrouter;

          return (
            <article
              key={item.providerKey}
              className={`flex flex-col justify-between p-5 rounded-2xl bg-slate-950/70 border space-y-4 ${accent.border}`}
            >
              <div className="space-y-3">
                {/* 1행: 모델명 + 적중률(있을 때만) */}
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-base font-black text-white truncate">
                      {item.providerLabel}
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono truncate">
                      {item.modelName}
                    </div>
                  </div>

                  {item.stats.hitRatePct !== null ? (
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-extrabold border shrink-0 ${accent.badge}`}
                    >
                      {item.stats.categoryLabel} 적중률 {item.stats.hitRatePct}%
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-900 text-slate-400 border border-slate-800 shrink-0">
                      신규 집계 중
                    </span>
                  )}
                </div>

                {/* 2행: AI 선택지 + 확신도 + 정산 결과(완료 시) */}
                <div className="p-3.5 rounded-xl bg-slate-900/90 border border-white/[0.07] space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-sm sm:text-[15px] font-black text-white">
                      {item.selectedOptionLabel}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-extrabold text-sky-300">
                        확신 {item.confidencePct}%
                      </span>
                      {item.isHit === true && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/35">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>적중</span>
                        </span>
                      )}
                      {item.isHit === false && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-rose-500/15 text-rose-300 border border-rose-500/35">
                          <XCircle className="w-3.5 h-3.5" />
                          <span>미적중</span>
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${accent.bar}`}
                      style={{ width: `${item.confidencePct}%` }}
                    />
                  </div>
                </div>

                {/* 3행: 한 줄 근거 (14px) */}
                <p className="text-sm text-slate-200 leading-relaxed">
                  {item.reasoning}
                </p>
              </div>

              {/* 4행: 분야별 최근 5경기 승/패 폼 */}
              <RecentFormStrip forecast={item} />
            </article>
          );
        })}
      </div>
    </section>
  );
}
