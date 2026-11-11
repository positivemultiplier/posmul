"use client";

import React from "react";
import { Bookmark, Flame, GraduationCap, Users, CheckCircle2 } from "lucide-react";
import {
  PredictionType,
  GameStatus,
} from "../../domain/value-objects/prediction-types";

interface UserPrediction {
  prediction_id: string;
  game_id: string;
  bet_amount: number | null;
  is_active: boolean;
  prediction_data: Record<string, unknown> | null;
}

export interface PredictionGameCardProps {
  game: {
    id: string;
    slug?: string;
    title: string;
    description: string;
    category?: string;
    subcategory?: string;
    dataSource?: string;
    predictionType: PredictionType;
    options: Array<{
      id: string;
      text: string;
      currentOdds: number;
    }>;
    startTime: Date;
    endTime: Date;
    settlementTime: Date;
    minimumStake: number;
    maximumStake: number;
    maxParticipants?: number;
    currentParticipants: number;
    status: GameStatus;
    totalStake: number;
    gameImportanceScore: number;
    allocatedPrizePool: number;
  };
  userId?: string;
  myPrediction?: UserPrediction;
  onParticipate?: (gameId: string) => void;
  onViewDetails?: (gameId: string) => void;
  onBetClick?: (game: unknown) => void;
  onDetailsClick?: (game: unknown) => void;
  className?: string;
}

type VisualMode = "gauge" | "sparkline" | "list";

interface SymbolAvatarMeta {
  symbol: string;
  subLabel?: string;
  bgClass: string;
  textClass: string;
  borderClass: string;
  categoryLabel: string;
  sourceLabel: string;
  visualMode: VisualMode;
  accentHex: string;
}

/**
 * 저작권 100% 안전: 게임 제목·카테고리에서 티커/심볼 아바타 및 마이크로 시각화 타입 자동 매핑
 */
export function resolveGameVisualMeta(
  title: string,
  category?: string,
  subcategory?: string
): SymbolAvatarMeta {
  const t = title.toUpperCase();
  const cat = (category || "").toUpperCase();
  const sub = (subcategory || "").toLowerCase();

  if (t.includes("비트코인") || t.includes("BTC") || sub === "crypto") {
    return {
      symbol: "₿",
      subLabel: "BTC",
      bgClass: "bg-gradient-to-br from-amber-500 to-orange-600",
      textClass: "text-white font-black text-xl",
      borderClass: "border-amber-400/40",
      categoryLabel: "암호화폐",
      sourceLabel: "CoinGecko",
      visualMode: "gauge",
      accentHex: "#f59e0b",
    };
  }

  if (t.includes("나스닥") || t.includes("QQQ") || t.includes("미국증시")) {
    return {
      symbol: "QQQ",
      subLabel: "US",
      bgClass: "bg-gradient-to-br from-blue-600 to-indigo-700",
      textClass: "text-white font-black text-xs tracking-tighter",
      borderClass: "border-blue-400/40",
      categoryLabel: "미국증시",
      sourceLabel: "Alpha Vantage",
      visualMode: "gauge",
      accentHex: "#38bdf8",
    };
  }

  if (t.includes("코스피") || t.includes("KOSPI") || t.includes("한국증시")) {
    return {
      symbol: "KRX",
      subLabel: "200",
      bgClass: "bg-gradient-to-br from-sky-500 to-blue-700",
      textClass: "text-white font-black text-xs tracking-tight",
      borderClass: "border-sky-400/40",
      categoryLabel: "한국증시",
      sourceLabel: "KRX · 실시간",
      visualMode: "gauge",
      accentHex: "#0ea5e9",
    };
  }

  if (t.includes("삼성전자")) {
    return {
      symbol: "SEC",
      subLabel: "005930",
      bgClass: "bg-gradient-to-br from-blue-700 to-blue-900",
      textClass: "text-white font-black text-xs",
      borderClass: "border-blue-400/40",
      categoryLabel: "실적공시",
      sourceLabel: "DART 전자공시",
      visualMode: "list",
      accentHex: "#3b82f6",
    };
  }

  if (t.includes("하이닉스")) {
    return {
      symbol: "SK",
      subLabel: "HBM",
      bgClass: "bg-gradient-to-br from-rose-600 to-orange-600",
      textClass: "text-white font-black text-sm",
      borderClass: "border-rose-400/40",
      categoryLabel: "실적공시",
      sourceLabel: "DART 전자공시",
      visualMode: "list",
      accentHex: "#f43f5e",
    };
  }

  if (t.includes("NAVER") || t.includes("네이버")) {
    return {
      symbol: "N",
      subLabel: "035420",
      bgClass: "bg-gradient-to-br from-emerald-500 to-green-700",
      textClass: "text-white font-black text-lg",
      borderClass: "border-emerald-400/40",
      categoryLabel: "실적공시",
      sourceLabel: "DART 전자공시",
      visualMode: "list",
      accentHex: "#10b981",
    };
  }

  if (t.includes("카카오")) {
    return {
      symbol: "K",
      subLabel: "035720",
      bgClass: "bg-gradient-to-br from-amber-400 to-yellow-500",
      textClass: "text-slate-950 font-black text-lg",
      borderClass: "border-amber-300/50",
      categoryLabel: "실적공시",
      sourceLabel: "DART 전자공시",
      visualMode: "list",
      accentHex: "#eab308",
    };
  }

  if (t.includes("현대자동차") || t.includes("현대차")) {
    return {
      symbol: "HMC",
      subLabel: "005380",
      bgClass: "bg-gradient-to-br from-slate-700 to-blue-950",
      textClass: "text-sky-200 font-black text-xs",
      borderClass: "border-sky-400/30",
      categoryLabel: "실적공시",
      sourceLabel: "DART 전자공시",
      visualMode: "list",
      accentHex: "#38bdf8",
    };
  }

  if (t.includes("한국은행") || t.includes("금통위") || t.includes("기준금리")) {
    return {
      symbol: "BOK",
      subLabel: "금리",
      bgClass: "bg-gradient-to-br from-cyan-600 to-slate-800",
      textClass: "text-cyan-100 font-black text-xs",
      borderClass: "border-cyan-400/40",
      categoryLabel: "통화정책",
      sourceLabel: "한국은행 ECOS",
      visualMode: "sparkline",
      accentHex: "#06b6d4",
    };
  }

  if (t.includes("GDP") || t.includes("경상수지") || t.includes("물가") || t.includes("실업률") || sub === "indicators") {
    return {
      symbol: "MACRO",
      subLabel: "KOSIS",
      bgClass: "bg-gradient-to-br from-teal-600 to-slate-800",
      textClass: "text-teal-100 font-extrabold text-[10px]",
      borderClass: "border-teal-400/40",
      categoryLabel: "거시지표",
      sourceLabel: "통계청 KOSIS",
      visualMode: "sparkline",
      accentHex: "#14b8a6",
    };
  }

  if (t.includes("AI") || cat === "POLITICS") {
    return {
      symbol: t.includes("AI") ? "AI" : "LAW",
      subLabel: "국회",
      bgClass: "bg-gradient-to-br from-slate-100 to-slate-300",
      textClass: "text-slate-950 font-black text-sm",
      borderClass: "border-white/40",
      categoryLabel: "정책·입법",
      sourceLabel: "국회 의안시스템",
      visualMode: "sparkline",
      accentHex: "#a855f7",
    };
  }

  if (t.includes("KBO") || t.includes("프로야구") || t.includes("한국시리즈") || sub === "baseball") {
    return {
      symbol: "KBO",
      subLabel: "FINAL",
      bgClass: "bg-gradient-to-br from-red-600 to-rose-800",
      textClass: "text-white font-black text-xs",
      borderClass: "border-red-400/40",
      categoryLabel: "프로야구",
      sourceLabel: "KBO 공식기록",
      visualMode: "gauge",
      accentHex: "#ef4444",
    };
  }

  if (cat === "SPORTS" || t.includes("EPL") || t.includes("손흥민")) {
    return {
      symbol: "EPL",
      subLabel: "LIVE",
      bgClass: "bg-gradient-to-br from-emerald-600 to-teal-800",
      textClass: "text-white font-black text-xs",
      borderClass: "border-emerald-400/40",
      categoryLabel: "해외축구",
      sourceLabel: "EPL 공식기록",
      visualMode: "gauge",
      accentHex: "#10b981",
    };
  }

  if (t.includes("OTT") || t.includes("넷플릭스")) {
    return {
      symbol: "OTT",
      subLabel: "TOP1",
      bgClass: "bg-gradient-to-br from-rose-600 to-purple-900",
      textClass: "text-white font-black text-xs",
      borderClass: "border-rose-400/40",
      categoryLabel: "OTT·드라마",
      sourceLabel: "Netflix Tudum",
      visualMode: "gauge",
      accentHex: "#f43f5e",
    };
  }

  if (cat === "ENTERTAINMENT" || t.includes("K-POP") || t.includes("박스오피스") || t.includes("시청률")) {
    const isMusic = t.includes("K-POP") || t.includes("음원");
    const isMovie = t.includes("박스오피스") || t.includes("영화");
    return {
      symbol: isMusic ? "TOP" : isMovie ? "BOX" : "TV",
      subLabel: isMusic ? "10" : isMovie ? "1M" : "RATE",
      bgClass: "bg-gradient-to-br from-fuchsia-600 to-purple-800",
      textClass: "text-white font-black text-xs",
      borderClass: "border-fuchsia-400/40",
      categoryLabel: isMusic ? "K-POP 차트" : isMovie ? "박스오피스" : "드라마·예능 시청률",
      sourceLabel: isMovie ? "KOBIS 영화진흥위" : isMusic ? "써클·멜론차트" : "닐슨코리아 시청률",
      visualMode: "list",
      accentHex: "#d946ef",
    };
  }

  return {
    symbol: "PM",
    subLabel: "MARKET",
    bgClass: "bg-gradient-to-br from-sky-600 to-indigo-800",
    textClass: "text-white font-black text-xs",
    borderClass: "border-sky-400/40",
    categoryLabel: "소비·트렌드",
    sourceLabel: "KOSIS 통계",
    visualMode: "sparkline",
    accentHex: "#38bdf8",
  };
}

/**
 * 제목 앞의 [미국증시] 같은 말머리를 분리하여 깔끔한 본문 질문만 반환
 */
export function splitTitlePrefix(rawTitle: string): {
  prefixTag: string | null;
  cleanTitle: string;
} {
  const match = rawTitle.match(/^\[([^\]]+)\]\s*(.+)$/);
  if (match) {
    return {
      prefixTag: match[1].trim(),
      cleanTitle: match[2].trim(),
    };
  }
  return {
    prefixTag: null,
    cleanTitle: rawTitle.trim(),
  };
}

/**
 * 선택지 텍스트에서 괄호 설명 등을 다듬어 깔끔한 버튼 라벨 생성
 */
function shortenOptionLabel(text: string, fallback: string): string {
  const cleaned = text.replace(/\s*\([^)]*\)\s*/g, "").trim();
  return cleaned || text || fallback;
}

export const PredictionGameCard: React.FC<PredictionGameCardProps> = ({
  game,
  myPrediction,
  onParticipate,
  onViewDetails,
}) => {
  const hasParticipated = Boolean(myPrediction && myPrediction.is_active);
  const { prefixTag, cleanTitle } = splitTitlePrefix(game.title);
  const meta = resolveGameVisualMeta(game.title, game.category, game.subcategory);

  const firstOption = game.options[0] ?? { id: "yes", text: "예 (Yes)", currentOdds: 0.58 };
  const secondOption = game.options[1] ?? { id: "no", text: "아니오 (No)", currentOdds: 0.42 };
  const leadPct = Math.round((firstOption.currentOdds || 0.5) * 100);
  const secondPct = Math.max(1, 100 - leadPct);

  // 남은 기간 포맷 (간결하게 D-day 또는 시간 표시)
  const getCompactTimeRemaining = () => {
    const now = new Date();
    const diff = game.endTime.getTime() - now.getTime();
    if (diff <= 0) return "마감됨";
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    if (days > 0) return `${days}일 남음`;
    return `${ Math.max(1, hours) }시간 남음`;
  };

  // 학습 가중치 배수 (1.5x ~ 2.3x)
  const learningMultiplier = Math.max(
    1.2,
    Math.min(2.5, Number((0.9 + (game.gameImportanceScore || 2.5) * 0.3).toFixed(1)))
  );

  // 1. 양자택일용 반원형 아크 게이지 (3번째 사진 스타일: 45% 하락 우세 / 67% 상승 우세)
  const renderArcGauge = (percentage: number) => {
    const radius = 26;
    const circumference = Math.PI * radius;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;
    const isUp = percentage >= 50;

    return (
      <div className="relative flex flex-col items-center justify-center shrink-0 w-[74px] h-[46px]">
        <svg className="w-[72px] h-[42px] overflow-visible" viewBox="0 0 70 40">
          <path
            d="M 7 35 A 28 28 0 0 1 63 35"
            fill="none"
            stroke="rgba(255,255,255,0.1)"
            strokeWidth="6"
            strokeLinecap="round"
          />
          <path
            d="M 7 35 A 28 28 0 0 1 63 35"
            fill="none"
            stroke={isUp ? "#10b981" : "#f43f5e"}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-500"
          />
        </svg>
        <div className="absolute bottom-0 flex flex-col items-center leading-none">
          <span className="text-[14px] font-black text-white tracking-tight">
            {percentage}%
          </span>
          <span className={`text-[9px] font-bold ${isUp ? "text-emerald-400" : "text-rose-400"}`}>
            {isUp ? "상승 우세" : "하락 우세"}
          </span>
        </div>
      </div>
    );
  };

  // 2. 승무패(3지선다) 전용 3색 도넛 세그먼트 아크 게이지 (승: 에메랄드 / 무: 슬레이트 / 패: 로즈)
  const renderWdlGauge = (p1: number, p2: number, p3: number) => {
    const maxVal = Math.max(p1, p2, p3);
    const maxLabel = maxVal === p1 ? "승 우세" : maxVal === p3 ? "패 우세" : "무승부";
    const maxColor = maxVal === p1 ? "text-emerald-400" : maxVal === p3 ? "text-rose-400" : "text-amber-300";

    const radius = 17;
    const circ = 2 * Math.PI * radius;
    const offset1 = circ - (p1 / 100) * circ;
    const offset2 = circ - ((p1 + p2) / 100) * circ;

    return (
      <div className="relative flex flex-col items-center justify-center shrink-0 w-[74px] h-[46px]">
        <svg className="w-[42px] h-[42px] -rotate-90 overflow-visible" viewBox="0 0 44 44">
          <circle cx="22" cy="22" r={radius} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="4.5" />
          {/* 패(원정) */}
          <circle cx="22" cy="22" r={radius} fill="none" stroke="#f43f5e" strokeWidth="4.5" strokeDasharray={circ} strokeDashoffset={0} />
          {/* 무승부 */}
          <circle cx="22" cy="22" r={radius} fill="none" stroke="#94a3b8" strokeWidth="4.5" strokeDasharray={circ} strokeDashoffset={offset2} />
          {/* 승(홈) */}
          <circle cx="22" cy="22" r={radius} fill="none" stroke="#10b981" strokeWidth="4.5" strokeDasharray={circ} strokeDashoffset={offset1} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center leading-none">
          <span className="text-[12px] font-black text-white">{maxVal}%</span>
          <span className={`text-[8px] font-extrabold ${maxColor} mt-0.5`}>{maxLabel}</span>
        </div>
      </div>
    );
  };

  // 3. 다자선택(Ranking/Multi) 전용 1위 독주 링 게이지
  const renderMultiGauge = (topPct: number) => {
    const radius = 17;
    const circ = 2 * Math.PI * radius;
    const offset = circ - (topPct / 100) * circ;

    return (
      <div className="relative flex flex-col items-center justify-center shrink-0 w-[74px] h-[46px]">
        <svg className="w-[42px] h-[42px] -rotate-90 overflow-visible" viewBox="0 0 44 44">
          <circle cx="22" cy="22" r={radius} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="4.5" />
          <circle
            cx="22"
            cy="22"
            r={radius}
            fill="none"
            stroke="#38bdf8"
            strokeWidth="4.5"
            strokeDasharray={circ}
            strokeDashoffset={offset}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center leading-none">
          <span className="text-[12px] font-black text-white">{topPct}%</span>
          <span className="text-[8px] font-extrabold text-sky-400 mt-0.5">1위 독주</span>
        </div>
      </div>
    );
  };

  return (
    <div
      className={`group relative rounded-2xl bg-[#121621] p-4 transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#161b28] flex flex-col justify-between h-[238px] cursor-pointer ${
        hasParticipated
          ? "border border-emerald-500/40 shadow-[0_0_20px_rgba(16,185,129,0.08)]"
          : "border border-white/[0.08] hover:border-sky-400/40 hover:shadow-[0_8px_30px_rgba(0,0,0,0.45)]"
      }`}
      onClick={() => {
        if (onViewDetails) onViewDetails(game.id);
      }}
    >
      {/* 참여 완료 배지 (참여한 경우에만 우측 상단에 깔끔하게 표시) */}
      {hasParticipated && (
        <div className="absolute -top-2.5 right-3 z-20 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-bold shadow-md">
          <CheckCircle2 className="w-3 h-3" />
          <span>
            참여 완료
            {myPrediction?.bet_amount ? ` · ${myPrediction.bet_amount.toLocaleString()} PMP` : ""}
          </span>
        </div>
      )}

      {/* 1. 상단 헤더: 44x44 심볼 아바타 + 카테고리/출처 + 굵은 핵심 제목 (+ 게이지 모드 시 우측 아크 게이지) */}
      <div className="flex items-start gap-3">
        {/* 저작권 안전 44x44 마이크로 심볼 아바타 */}
        <div
          className={`w-11 h-11 rounded-xl ${meta.bgClass} border ${meta.borderClass} flex flex-col items-center justify-center shrink-0 shadow-inner`}
        >
          <span className={meta.textClass}>{meta.symbol}</span>
          {meta.subLabel && (
            <span className="text-[8px] font-bold opacity-80 text-white leading-none mt-0.5">
              {meta.subLabel}
            </span>
          )}
        </div>

        {/* 제목 및 메타 라벨 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mb-0.5">
            <span className="font-bold text-sky-400">
              {prefixTag || meta.categoryLabel}
            </span>
            <span className="text-slate-600">·</span>
            <span className="truncate text-slate-400">{meta.sourceLabel}</span>
            <span className="text-slate-600">·</span>
            <span className="text-slate-500 shrink-0">{getCompactTimeRemaining()}</span>
          </div>
          <h3 className="text-[14px] font-bold text-slate-100 group-hover:text-white leading-snug line-clamp-2">
            {cleanTitle}
          </h3>
        </div>

        {/* 우측 상단 게이지: 양자택일은 아크 게이지로 일원화, 승무패는 3색 세그먼트, 다자선택은 1위 링 게이지 */}
        {game.predictionType === PredictionType.BINARY ? (
          renderArcGauge(leadPct)
        ) : game.predictionType === PredictionType.WIN_DRAW_LOSE ? (
          renderWdlGauge(
            Math.round((game.options[0]?.currentOdds || 0.45) * 100),
            Math.round((game.options[1]?.currentOdds || 0.25) * 100),
            Math.round((game.options[2]?.currentOdds || 0.3) * 100)
          )
        ) : (
          renderMultiGauge(leadPct)
        )}
      </div>

      {/* 2. 중단 인터랙티브 선택 영역: 3번째 사진의 '타원형 둥근 캡슐 버튼' 스타일로 전면 일원화 */}
      <div className="my-auto pt-2">
        {game.predictionType === PredictionType.BINARY ? (
          /* 양자택일: 3번째 사진 완벽 재현 (좌측 녹색 캡슐 vs 우측 자주/자색 캡슐) */
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={(e) => {
                if (onParticipate) {
                  e.stopPropagation();
                  onParticipate(game.id);
                }
              }}
              className="group/btn flex items-center justify-between px-3.5 py-2 rounded-full border border-emerald-500/35 bg-emerald-950/30 hover:bg-emerald-900/50 hover:border-emerald-400 transition-all duration-150 text-left shadow-sm"
            >
              <span className="text-[12px] font-extrabold text-emerald-300 truncate mr-1 group-hover/btn:text-emerald-200">
                {shortenOptionLabel(firstOption.text, "Yes")}
              </span>
              <span className="text-[12px] font-black text-white shrink-0">
                {leadPct}%
              </span>
            </button>

            <button
              type="button"
              onClick={(e) => {
                if (onParticipate) {
                  e.stopPropagation();
                  onParticipate(game.id);
                }
              }}
              className="group/btn flex items-center justify-between px-3.5 py-2 rounded-full border border-rose-500/35 bg-rose-950/30 hover:bg-rose-900/50 hover:border-rose-400 transition-all duration-150 text-left shadow-sm"
            >
              <span className="text-[12px] font-extrabold text-rose-300 truncate mr-1 group-hover/btn:text-rose-200">
                {shortenOptionLabel(secondOption.text, "No")}
              </span>
              <span className="text-[12px] font-black text-white shrink-0">
                {secondPct}%
              </span>
            </button>
          </div>
        ) : game.predictionType === PredictionType.WIN_DRAW_LOSE ? (
          /* 승무패 (3지선다): 3분할 둥근 캡슐 버튼 (승 | 무 | 패) */
          <div className="grid grid-cols-3 gap-1.5">
            {game.options.slice(0, 3).map((opt, idx) => {
              const pct = Math.round((opt.currentOdds || 0.33) * 100);
              const colorTheme =
                idx === 0
                  ? "border-emerald-500/35 bg-emerald-950/30 text-emerald-300 hover:border-emerald-400"
                  : idx === 1
                  ? "border-slate-500/35 bg-slate-900/40 text-slate-300 hover:border-slate-400"
                  : "border-rose-500/35 bg-rose-950/30 text-rose-300 hover:border-rose-400";
              return (
                <button
                  key={opt.id || idx}
                  type="button"
                  onClick={(e) => {
                    if (onParticipate) {
                      e.stopPropagation();
                      onParticipate(game.id);
                    }
                  }}
                  className={`flex items-center justify-between px-2.5 py-2 rounded-full border ${colorTheme} transition-all duration-150 text-left`}
                >
                  <span className="text-[11px] font-extrabold truncate mr-1">
                    {shortenOptionLabel(opt.text, idx === 0 ? "승" : idx === 1 ? "무" : "패")}
                  </span>
                  <span className="text-[11px] font-black text-white shrink-0">{pct}%</span>
                </button>
              );
            })}
          </div>
        ) : (
          /* 다자선택 (Ranking / Multi): Top 2개 캡슐 + 외 N개 뱃지 */
          <div className="grid grid-cols-2 gap-2">
            {game.options.slice(0, 2).map((opt, idx) => {
              const pct = Math.round((opt.currentOdds || 0.25) * 100);
              return (
                <button
                  key={opt.id || idx}
                  type="button"
                  onClick={(e) => {
                    if (onParticipate) {
                      e.stopPropagation();
                      onParticipate(game.id);
                    }
                  }}
                  className="flex items-center justify-between px-3 py-2 rounded-full border border-sky-500/35 bg-sky-950/30 hover:bg-sky-900/50 hover:border-sky-400 transition-all duration-150 text-left"
                >
                  <span className="text-[11px] font-extrabold text-sky-300 truncate mr-1">
                    {opt.text}
                  </span>
                  <span className="text-[11px] font-black text-white shrink-0">{pct}%</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* 3. 하단 푸터: 상금풀(PMC) + 학습/참여 부스트 배지 + 참여자 수 */}
      <div className="pt-2.5 border-t border-white/[0.06] flex items-center justify-between text-[11px]">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="inline-flex items-center gap-1 font-extrabold text-amber-300">
            <span>💰</span>
            <span>{Math.round(game.allocatedPrizePool || 1200).toLocaleString()} PMC</span>
          </span>
          <span
            className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-sky-500/10 border border-sky-500/20 text-sky-300 text-[10px] font-bold"
            title="공적 학습 가치 및 시민 참여 열기에 따른 MoneyWave 상금 부스트 배율"
          >
            <GraduationCap className="w-3 h-3 text-sky-400" />
            <span>{learningMultiplier}x</span>
          </span>
          {game.currentParticipants >= 8 && (
            <span className="inline-flex items-center text-orange-400" title="참여 급상승 마켓">
              <Flame className="w-3.5 h-3.5 fill-orange-500/30" />
            </span>
          )}
        </div>

        <div className="flex items-center gap-2.5 text-slate-400 shrink-0">
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400">
            <Users className="w-3 h-3 text-slate-500" />
            <span>{game.currentParticipants.toLocaleString()}명</span>
          </span>
          <Bookmark className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-300 transition-colors" />
        </div>
      </div>
    </div>
  );
};
