"use client";

import React, { useMemo, useState } from "react";
import type { LineConfig } from "../../../../../shared/ui/components/charts/line-chart";

// Polymarket 스타일 컬러 팔레트
const POLY_COLORS = [
  "#87BFFF",
  "#2797FF",
  "#FDC503",
  "#FF7F0E",
  "#10B981",
  "#EF4444",
  "#8B5CF6",
  "#EC4899",
];

interface ProbabilityLineChartProps {
  data: Array<{
    time: string;
    [key: string]: number | string;
  }>;
  lines?: LineConfig[];
  isDarkMode?: boolean;
}

const PolyLegend = ({
  lines,
  data,
  activeIndex,
}: {
  lines: LineConfig[];
  data: Array<Record<string, string | number>>;
  activeIndex: number | null;
}) => {
  const point =
    activeIndex !== null && data[activeIndex]
      ? data[activeIndex]
      : data.length > 0
      ? data[data.length - 1]
      : null;

  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mb-3">
      {lines.map((line) => {
        const rawValue = point ? point[line.dataKey] : 0;
        const numVal = typeof rawValue === "number" ? rawValue : Number(rawValue);
        const display = Number.isFinite(numVal) ? `${Math.round(numVal)}%` : `${rawValue ?? 0}%`;
        return (
          <div key={line.dataKey} className="flex items-center gap-2">
            <div
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: line.color }}
            />
            <span className="text-xs sm:text-sm text-slate-400 truncate max-w-[160px]">
              {line.name}
            </span>
            <span className="text-xs sm:text-sm font-bold text-white tabular-nums">
              {display}
            </span>
          </div>
        );
      })}
      {activeIndex !== null && point?.time && (
        <span className="ml-auto text-[11px] font-medium text-sky-400 tabular-nums">
          {String(point.time)}
        </span>
      )}
    </div>
  );
};

/**
 * 초경량 순수 SSR 인라인 SVG 확률 추이 차트 (외부 차트 라이브러리 0KB)
 * - 서버 HTML에 즉시 그려져 로딩 스켈레톤 깜빡임 0ms
 * - 마우스 호버 시 세로 크로스헤어 및 옵션별 정밀 % 툴팁 제공
 */
export const ProbabilityLineChart = ({
  data,
  lines,
  isDarkMode = true,
}: ProbabilityLineChartProps) => {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  const chartLines: LineConfig[] = useMemo(() => {
    if (lines && lines.length > 0) {
      return lines.map((line, index) => ({
        ...line,
        color: line.color || POLY_COLORS[index % POLY_COLORS.length],
        strokeWidth: line.strokeWidth || 2.2,
      }));
    }
    return [
      {
        dataKey: "probability",
        name: "예측 확률",
        color: POLY_COLORS[0],
        strokeWidth: 2.2,
      },
    ];
  }, [lines]);

  // SVG 내부 좌표계 (반응형 viewBox)
  const W = 680;
  const H = 204;
  const PAD_L = 12;
  const PAD_R = 40;
  const PAD_T = 14;
  const PAD_B = 26;
  const plotW = W - PAD_L - PAD_R;
  const plotH = H - PAD_T - PAD_B;

  const normalizedPoints = useMemo(() => {
    if (!data || data.length === 0) return [];
    // 포인트가 1개뿐이면 좌우 끝으로 2점 확장해 수평선 표시
    return data.length === 1 ? [data[0], data[0]] : data;
  }, [data]);

  const seriesPaths = useMemo(() => {
    if (normalizedPoints.length === 0) return [];
    const n = normalizedPoints.length;

    return chartLines.map((line) => {
      const coords = normalizedPoints.map((pt, i) => {
        const raw = Number(pt[line.dataKey]);
        const pct = Number.isFinite(raw) ? Math.max(0, Math.min(100, raw)) : 0;
        const x = PAD_L + (n > 1 ? (i / (n - 1)) * plotW : plotW / 2);
        const y = PAD_T + ((100 - pct) / 100) * plotH;
        return { x, y, pct };
      });

      const d = coords
        .map((c, idx) => `${idx === 0 ? "M" : "L"}${c.x.toFixed(1)},${c.y.toFixed(1)}`)
        .join(" ");

      return {
        line,
        coords,
        d,
        last: coords[coords.length - 1],
      };
    });
  }, [normalizedPoints, chartLines, plotW, plotH]);

  if (!data || data.length === 0) {
    return (
      <div className="w-full h-[220px] flex items-center justify-center rounded-xl bg-gray-900/50 border border-gray-800/50">
        <div className="text-center">
          <div className="text-gray-500 text-sm">아직 참여 데이터가 없습니다</div>
          <div className="text-gray-600 text-xs mt-1">
            첫 번째 예측 투표를 시작해보세요!
          </div>
        </div>
      </div>
    );
  }

  const yTicks = [0, 25, 50, 75, 100];
  const xLabelIndices =
    normalizedPoints.length <= 4
      ? normalizedPoints.map((_, i) => i)
      : [
          0,
          Math.floor((normalizedPoints.length - 1) * 0.33),
          Math.floor((normalizedPoints.length - 1) * 0.66),
          normalizedPoints.length - 1,
        ];

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    if (rect.width <= 0) return;
    const relX = ((e.clientX - rect.left) / rect.width) * W;
    const ratio = Math.max(0, Math.min(1, (relX - PAD_L) / plotW));
    const idx = Math.round(ratio * (normalizedPoints.length - 1));
    setHoverIdx(idx);
  };

  const activePoint = hoverIdx !== null ? normalizedPoints[hoverIdx] : null;
  const activeX =
    hoverIdx !== null && normalizedPoints.length > 1
      ? PAD_L + (hoverIdx / (normalizedPoints.length - 1)) * plotW
      : null;

  return (
    <div className="w-full flex flex-col justify-between">
      <PolyLegend
        lines={chartLines}
        data={normalizedPoints}
        activeIndex={hoverIdx}
      />

      <div className="relative w-full h-48 md:h-52 select-none">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="none"
          className="w-full h-full overflow-visible"
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoverIdx(null)}
          role="img"
          aria-label="예측 확률 추이 차트"
        >
          {/* 수평 격자 및 우측 Y축 % 눈금 */}
          {yTicks.map((tick) => {
            const y = PAD_T + ((100 - tick) / 100) * plotH;
            return (
              <g key={tick}>
                <line
                  x1={PAD_L}
                  y1={y}
                  x2={W - PAD_R}
                  y2={y}
                  stroke={isDarkMode ? "#334155" : "#E5E7EB"}
                  strokeOpacity={0.35}
                  strokeDasharray="2 4"
                />
                <text
                  x={W - PAD_R + 6}
                  y={y + 3.5}
                  fill={isDarkMode ? "#64748B" : "#9CA3AF"}
                  fontSize="10"
                  fontFamily="ui-monospace, SFMono-Regular, monospace"
                >
                  {tick}%
                </text>
              </g>
            );
          })}

          {/* X축 시간 라벨 */}
          {xLabelIndices.map((idx, i) => {
            const x =
              PAD_L +
              (normalizedPoints.length > 1
                ? (idx / (normalizedPoints.length - 1)) * plotW
                : plotW / 2);
            const anchor =
              i === 0
                ? "start"
                : i === xLabelIndices.length - 1
                ? "end"
                : "middle";
            return (
              <text
                key={`${idx}-${i}`}
                x={x}
                y={H - 6}
                textAnchor={anchor}
                fill={isDarkMode ? "#64748B" : "#9CA3AF"}
                fontSize="10"
              >
                {String(normalizedPoints[idx]?.time ?? "")}
              </text>
            );
          })}

          {/* 호버 세로 가이드라인 */}
          {activeX !== null && (
            <line
              x1={activeX}
              y1={PAD_T}
              x2={activeX}
              y2={PAD_T + plotH}
              stroke="#94A3B8"
              strokeOpacity={0.45}
              strokeDasharray="3 3"
            />
          )}

          {/* 옵션별 확률 추이 곡선 + 끝점/호버 포인트 */}
          {seriesPaths.map(({ line, coords, d, last }) => {
            const dot = hoverIdx !== null ? coords[hoverIdx] : last;
            return (
              <g key={line.dataKey}>
                <path
                  d={d}
                  fill="none"
                  stroke={line.color}
                  strokeWidth={line.strokeWidth || 2.2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  vectorEffect="non-scaling-stroke"
                />
                {dot && (
                  <circle
                    cx={dot.x}
                    cy={dot.y}
                    r={hoverIdx !== null ? 4.5 : 3.5}
                    fill={line.color}
                    stroke="#090b12"
                    strokeWidth={1.5}
                  />
                )}
              </g>
            );
          })}
        </svg>

        {/* 마우스 호버 인터랙티브 툴팁 */}
        {hoverIdx !== null && activePoint && activeX !== null && (
          <div
            className="pointer-events-none absolute top-2 z-20 backdrop-blur-md bg-slate-900/95 border border-slate-700/70 rounded-xl px-3 py-2 shadow-2xl min-w-[140px]"
            style={{
              left: activeX > W * 0.62 ? undefined : `${(activeX / W) * 100}%`,
              right: activeX > W * 0.62 ? `${((W - activeX) / W) * 100}%` : undefined,
              transform: activeX > W * 0.62 ? "translateX(-10px)" : "translateX(10px)",
            }}
          >
            <p className="text-[11px] text-slate-400 mb-1 font-medium tabular-nums">
              {String(activePoint.time ?? "")}
            </p>
            <div className="space-y-1">
              {chartLines.map((line) => {
                const raw = Number(activePoint[line.dataKey]);
                const val = Number.isFinite(raw) ? `${Math.round(raw)}%` : "-";
                return (
                  <div
                    key={line.dataKey}
                    className="flex items-center justify-between gap-4 text-xs"
                  >
                    <span className="flex items-center gap-1.5 text-slate-300 truncate max-w-[110px]">
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: line.color }}
                      />
                      <span className="truncate">{line.name}</span>
                    </span>
                    <span className="font-bold text-white tabular-nums">{val}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
