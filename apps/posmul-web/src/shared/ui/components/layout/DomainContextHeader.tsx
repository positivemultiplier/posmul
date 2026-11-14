import React from "react";
import { Info } from "lucide-react";
import {
  DOMAIN_PHILOSOPHY_MAP,
  type PosMulDomainKey,
} from "../../tokens/domain-tones";

export interface DomainMetricItem {
  label: string;
  value: string | number;
  unit?: string;
}

export interface DomainContextHeaderProps {
  domain: PosMulDomainKey;
  title: string;
  subtitle?: string;
  metrics?: DomainMetricItem[];
  actionSlot?: React.ReactNode;
  children?: React.ReactNode;
}

/**
 * DomainContextHeader
 *
 * 3-Row 네비게이션 하단에서 모든 도메인 페이지의 시작점을 통일하는
 * 핵심 지표 중심 컨텍스트 헤더입니다 (부가 설명은 ⓘ 말풍선으로 최소화).
 */
export function DomainContextHeader({
  domain,
  title,
  subtitle,
  metrics = [],
  actionSlot,
  children,
}: DomainContextHeaderProps) {
  const meta = DOMAIN_PHILOSOPHY_MAP[domain];
  const tooltipText = subtitle || meta.philosophyMicroCopy;

  return (
    <div className="relative mb-6">
      {/* 도메인 고유 톤온톤 상단 앰비언트 글로우 */}
      <div
        className={`pointer-events-none absolute -top-16 left-1/2 -translate-x-1/2 w-full max-w-4xl h-36 bg-gradient-to-b ${meta.tones.ambientGlow} blur-3xl -z-10`}
      />

      <div
        className={`rounded-2xl border p-4 sm:p-5 backdrop-blur-xl shadow-lg ${meta.tones.headerSurface}`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* 좌측: 간결한 페이지 타이틀 + ⓘ 말풍선 안내 */}
          <div className="flex flex-wrap items-center gap-2.5">
            <h1
              className={`text-xl sm:text-2xl font-black tracking-tight bg-gradient-to-r ${meta.tones.accentGradientText} bg-clip-text text-transparent`}
            >
              {title}
            </h1>

            <span className="text-[11px] font-bold text-slate-300 px-2 py-0.5 rounded-full bg-white/[0.04] border border-white/[0.08]">
              {meta.assetBadge}
            </span>

            {tooltipText && (
              <div className="relative group/info inline-flex items-center">
                <button
                  type="button"
                  aria-label="페이지 안내 보기"
                  className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors focus:outline-none"
                >
                  <Info className="w-4 h-4" />
                </button>
                <div className="pointer-events-none opacity-0 translate-y-1 group-hover/info:opacity-100 group-hover/info:translate-y-0 group-focus-within/info:opacity-100 group-focus-within/info:translate-y-0 transition-all duration-150 absolute left-0 top-full mt-2 z-40 w-64 sm:w-72 p-3 rounded-xl bg-slate-900/95 backdrop-blur-md border border-white/15 shadow-2xl text-xs text-slate-200 leading-relaxed">
                  {tooltipText}
                </div>
              </div>
            )}
          </div>

          {/* 우측: 도메인 핵심 지표 및 주요 액션 */}
          {(metrics.length > 0 || actionSlot) && (
            <div className="flex flex-wrap items-center gap-4 self-start md:self-center shrink-0">
              {metrics.map((metric, idx) => (
                <div
                  key={idx}
                  className="px-3.5 py-1.5 rounded-xl bg-[#090b12]/70 border border-white/[0.07] text-right"
                >
                  <p className="text-[10px] text-slate-400 font-medium">
                    {metric.label}
                  </p>
                  <p className={`text-base sm:text-lg font-extrabold ${meta.tones.accentText}`}>
                    <span>
                      {typeof metric.value === "number"
                        ? metric.value.toLocaleString()
                        : metric.value}
                    </span>
                    {metric.unit && (
                      <span className="text-xs font-semibold text-slate-300 ml-1">
                        {metric.unit}
                      </span>
                    )}
                  </p>
                </div>
              ))}
              {actionSlot}
            </div>
          )}
        </div>

        {/* 하단 슬롯: 검색바 또는 보조 필터 */}
        {children && (
          <div className="mt-4 pt-3.5 border-t border-white/[0.06]">
            {children}
          </div>
        )}
      </div>
    </div>
  );
}

export default DomainContextHeader;

