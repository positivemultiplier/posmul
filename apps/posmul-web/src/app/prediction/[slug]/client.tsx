/**
 * Universal Prediction Game Detail Client Component
 * 모든 예측 카드(Binary / 승무패 WDL / 랭킹 Ranking)의 특성에 완벽 대응하는 통합 상세페이지 컴포넌트
 */
"use client";

import { useState, useTransition, useMemo } from "react";
import { ProbabilityLineChart } from "@/bounded-contexts/prediction/presentation/components/charts/ProbabilityLineChart";
import { BettingDistributionChart } from "@/bounded-contexts/prediction/presentation/components/charts/BettingDistributionChart";
import { ParticipantTimelineChart } from "@/bounded-contexts/prediction/presentation/components/charts/ParticipantTimelineChart";
import { MoneyWaveWaterfallCard } from "@/bounded-contexts/prediction/presentation/components/MoneyWaveWaterfallCard";
import {
  resolveGameVisualMeta,
  splitTitlePrefix,
} from "@/bounded-contexts/prediction/presentation/components/PredictionGameCard";
import { GalleryPostList } from "@/app/forum/components/GalleryPostList";
import { BalancedDecisionBriefing } from "@/bounded-contexts/prediction/presentation/components/BalancedDecisionBriefing";
import {
  evaluateExperienceBias,
  type UserLearningProfileSummary,
} from "@/bounded-contexts/prediction/domain/services/collective-intelligence-engine";
import {
  analyzePredictionCapmAndEconomy,
  evaluateOptionParticipationEconomics,
  type PredictionMarketEconomySummary,
} from "@/bounded-contexts/prediction/domain/services/prediction-economic-model";
import { placeBet } from "../sports/soccer/[slug]/actions";
import {
  Users,
  ArrowLeft,
  ArrowRight,
  Clock,
  TrendingUp,
  PieChart,
  ShieldCheck,
  Radio,
  Database,
  Coins,
  Sparkles,
  CheckCircle2,
  FileText,
  MessageSquare,
  BarChart3,
  Trophy,
  Scale,
  Layers,
  Brain,
  SlidersHorizontal,
} from "lucide-react";
import Link from "next/link";
import { Card } from "@/shared/ui/components/base";

export interface PredictionOption {
  id: string;
  label: string;
  description?: string;
  probability: number;
  rawVolumeProbability?: number;
  priorProbability?: number;
  credibleInterval?: readonly [number, number];
  capmBeta?: number;
  capmRequiredReturn?: number;
  jensenAlpha?: number;
  agencyExclusivityBonus?: number;
  odds: number;
  volume: number;
  change24h: number;
}

export interface PredictionCollectiveIntelligence {
  effectiveEvidenceStrength: number;
  totalPriorStrength: number;
  normalizedEntropy: number;
  isLowSampleStabilized: boolean;
  recentOptionShares: Record<string, number>;
  gameImportance?: number;
  marketEconomy?: PredictionMarketEconomySummary;
}

export interface PredictionGameDetail {
  id: string;
  title: string;
  description: string;
  predictionType: "binary" | "wdl" | "ranking";
  options: PredictionOption[];
  totalVolume: number;
  participantCount: number;
  minimumStake: number;
  maximumStake: number;
  endTime: string;
  settlementTime: string;
  status: "ACTIVE" | "ENDED" | "SETTLED";
  category: string;
  subcategory?: string;
  dataSource?: string;
  externalId?: string;
  settlementType?: string;
  liveRoom?: {
    id: string;
    title: string;
    viewerCount: number;
    statusText: string;
  };
  creator: {
    name: string;
    reputation: number;
    avatar: string;
  };
  prizePool: number;
  collectiveIntelligence?: PredictionCollectiveIntelligence;
}

interface UniversalPredictionDetailClientProps {
  game: PredictionGameDetail;
  userBalance: {
    pmp: number;
    pmc: number;
  };
  userBets: Array<{
    betId: string;
    selectedOption: string;
    betAmount: number;
    status: string;
    createdAt: string;
  }>;
  slug: string;
  initialChartData?: Array<{ time: string; [key: string]: string | number }>;
  userLearningProfile?: UserLearningProfileSummary;
}

type ChartTabType = "trend" | "distribution" | "participants" | "my_bets" | "economics";

interface OptionColorTheme {
  hex: string;
  activeCard: string;
  inactiveCard: string;
  badgeBg: string;
  text: string;
  barBg: string;
  chipBorder: string;
}

const BINARY_THEMES: OptionColorTheme[] = [
  {
    hex: "#10B981",
    activeCard:
      "border-emerald-400 bg-emerald-950/70 text-white ring-2 ring-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.25)]",
    inactiveCard:
      "border-emerald-500/30 bg-emerald-950/20 text-slate-300 hover:border-emerald-500/60",
    badgeBg: "bg-emerald-500 text-slate-950",
    text: "text-emerald-400",
    barBg: "bg-emerald-500",
    chipBorder: "border-emerald-500/40 bg-emerald-950/30 text-emerald-300",
  },
  {
    hex: "#F43F5E",
    activeCard:
      "border-rose-400 bg-rose-950/70 text-white ring-2 ring-rose-500/50 shadow-[0_0_15px_rgba(244,63,94,0.25)]",
    inactiveCard:
      "border-rose-500/30 bg-rose-950/20 text-slate-300 hover:border-rose-500/60",
    badgeBg: "bg-rose-500 text-white",
    text: "text-rose-400",
    barBg: "bg-rose-500",
    chipBorder: "border-rose-500/40 bg-rose-950/30 text-rose-300",
  },
];

const WDL_THEMES: OptionColorTheme[] = [
  BINARY_THEMES[0], // 1안 (승/첫번째): 에메랄드
  {
    hex: "#F59E0B",
    activeCard:
      "border-amber-400 bg-amber-950/65 text-white ring-2 ring-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.25)]",
    inactiveCard:
      "border-amber-500/30 bg-amber-950/20 text-slate-300 hover:border-amber-500/60",
    badgeBg: "bg-amber-400 text-slate-950",
    text: "text-amber-400",
    barBg: "bg-amber-400",
    chipBorder: "border-amber-500/40 bg-amber-950/30 text-amber-300",
  },
  BINARY_THEMES[1], // 3안 (패/세번째): 로즈
];

const RANKING_THEMES: OptionColorTheme[] = [
  {
    hex: "#38BDF8",
    activeCard:
      "border-sky-400 bg-sky-950/70 text-white ring-2 ring-sky-500/50 shadow-[0_0_15px_rgba(56,189,248,0.25)]",
    inactiveCard:
      "border-sky-500/25 bg-slate-950/60 text-slate-300 hover:border-sky-400/60",
    badgeBg: "bg-sky-400 text-slate-950",
    text: "text-sky-400",
    barBg: "bg-sky-500",
    chipBorder: "border-sky-500/40 bg-sky-950/30 text-sky-300",
  },
  {
    hex: "#A855F7",
    activeCard:
      "border-purple-400 bg-purple-950/70 text-white ring-2 ring-purple-500/50 shadow-[0_0_15px_rgba(168,85,247,0.25)]",
    inactiveCard:
      "border-purple-500/25 bg-slate-950/60 text-slate-300 hover:border-purple-400/60",
    badgeBg: "bg-purple-500 text-white",
    text: "text-purple-400",
    barBg: "bg-purple-500",
    chipBorder: "border-purple-500/40 bg-purple-950/30 text-purple-300",
  },
  BINARY_THEMES[0],
  WDL_THEMES[1],
  BINARY_THEMES[1],
  {
    hex: "#06B6D4",
    activeCard:
      "border-cyan-400 bg-cyan-950/70 text-white ring-2 ring-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.25)]",
    inactiveCard:
      "border-cyan-500/25 bg-slate-950/60 text-slate-300 hover:border-cyan-400/60",
    badgeBg: "bg-cyan-400 text-slate-950",
    text: "text-cyan-400",
    barBg: "bg-cyan-500",
    chipBorder: "border-cyan-500/40 bg-cyan-950/30 text-cyan-300",
  },
  {
    hex: "#EC4899",
    activeCard:
      "border-pink-400 bg-pink-950/70 text-white ring-2 ring-pink-500/50 shadow-[0_0_15px_rgba(236,72,153,0.25)]",
    inactiveCard:
      "border-pink-500/25 bg-slate-950/60 text-slate-300 hover:border-pink-400/60",
    badgeBg: "bg-pink-500 text-white",
    text: "text-pink-400",
    barBg: "bg-pink-500",
    chipBorder: "border-pink-500/40 bg-pink-950/30 text-pink-300",
  },
];

function getOracleSpecInfo(dataSource?: string, title?: string) {
  const ds = (dataSource || "").toLowerCase();
  const t = (title || "").toUpperCase();

  if (ds === "kobis" || t.includes("박스오피스")) {
    return {
      provider: "영화진흥위원회 통합전산망 (KOBIS Open API)",
      endpoint: "searchDailyBoxOfficeList / searchWeeklyBoxOfficeList",
      badge: "🎬 KOBIS 공인 박스오피스 오라클",
      scheduleDesc: "주말 마감 후 월요일 09:00 공식 누적 관객수 자동 판정",
    };
  }
  if (ds === "kcontent" || t.includes("시청률") || t.includes("드라마") || t.includes("OTT") || t.includes("예능") || t.includes("K-POP") || t.includes("멜론")) {
    if (t.includes("OTT") || t.includes("넷플릭스")) {
      return {
        provider: "Netflix Tudum / FlixPatrol 공식 TOP 10 집계",
        endpoint: "KContentOracleAdapter (ott_top1)",
        badge: "📺 글로벌 OTT 공식 순위 오라클",
        scheduleDesc: "집계 발표 직후 대한민국 시리즈 TOP 10 1위 여부 판정",
      };
    }
    if (t.includes("K-POP") || t.includes("음원") || t.includes("멜론")) {
      return {
        provider: "써클차트(Circle Chart) · 멜론 주간 디지털 차트",
        endpoint: "KContentOracleAdapter (music_chart_top10)",
        badge: "🎵 공인 음원차트 오라클",
        scheduleDesc: "주간 차트 발표 시점 순위 자동 대조 판정",
      };
    }
    return {
      provider: "닐슨코리아(Nielsen Korea) 전국 가구 시청률 공시",
      endpoint: "KContentOracleAdapter (nielsen_national_household)",
      badge: "📺 닐슨코리아 공인 시청률 오라클",
      scheduleDesc: "본방송 익일 오전 07:00~09:00 공식 시청률 발표 즉시 판정",
    };
  }
  if (ds === "coingecko" || t.includes("비트코인") || t.includes("BTC")) {
    return {
      provider: "CoinGecko 글로벌 암호화폐 인덱스 · 업비트 시세",
      endpoint: "api.coingecko.com/api/v3/simple/price",
      badge: "₿ CoinGecko 실시간 시세 오라클",
      scheduleDesc: "마감 시각 기준 공식 종가/고가 인덱스 자동 대조 판정",
    };
  }
  if (ds === "alpha-vantage" || t.includes("나스닥") || t.includes("코스피") || t.includes("삼성전자")) {
    return {
      provider: "KRX 한국거래소 종가 / Alpha Vantage Global Market",
      endpoint: "TIME_SERIES_DAILY (Official Close Price)",
      badge: "📈 증시 공식 종가 오라클",
      scheduleDesc: "정규장 마감 후 공식 확정 종가 자동 대조 판정",
    };
  }
  if (ds === "dart" || t.includes("실적공시") || t.includes("영업이익")) {
    return {
      provider: "금융감독원 전자공시시스템 (OpenDART API)",
      endpoint: "opendart.fss.or.kr/api/fnlttSinglAcntAll.json",
      badge: "📑 금감원 OpenDART 전자공시 오라클",
      scheduleDesc: "분기·사업보고서 연결재무제표 영업이익 확정치 자동 판정",
    };
  }
  if (ds === "ecos" || t.includes("한국은행") || t.includes("금통위") || t.includes("경상수지") || t.includes("GDP")) {
    return {
      provider: "한국은행 경제통계시스템 (BOK ECOS Open API)",
      endpoint: "ecos.bok.or.kr/api/StatisticSearch (722Y001 / 200Y101)",
      badge: "🏦 한국은행 ECOS 공식 통계 오라클",
      scheduleDesc: "금통위/속보치 공식 발표 직후 ECOS 통계표 자동 판정",
    };
  }
  if (ds === "football_data" || ds === "thesportsdb" || t.includes("EPL") || t.includes("KBO") || t.includes("프로야구") || t.includes("손흥민") || t.includes("LCK") || t.includes("T1")) {
    if (t.includes("LCK") || t.includes("T1") || t.includes("젠지")) {
      return {
        provider: "LCK 공식 경기 기록실 & Riot Esports API",
        endpoint: "lolesports / Match Official Series Result",
        badge: "⚔️ LCK 공식 매치 오라클",
        scheduleDesc: "공식 매치 세트 스코어 종료 즉시 자동 판정",
      };
    }
    return {
      provider: t.includes("KBO") || t.includes("프로야구")
        ? "KBO 공식 기록실 & TheSportsDB 매치 스코어"
        : "Football-Data.org / EPL 공식 경기 기록",
      endpoint: "Match Official FullTime Score & Player Stats",
      badge: "⚽ 공식 스포츠 매치 기록 오라클",
      scheduleDesc: "경기 종료(Full-Time) 공식 기록 확정 직후 자동 판정",
    };
  }
  return {
    provider: "통계청 국가통계포털 (KOSIS) · 국회 열린국회정보 API",
    endpoint: "kosis.kr/openapi / open.assembly.go.kr",
    badge: "🏛️ 국가 공인 오픈데이터 오라클",
    scheduleDesc: "공식 통계 및 본회의 표결 공표 직후 자동 판정",
  };
}

function getShortOptionTag(label: string, fallback: string) {
  const clean = label.replace(/\([^)]*\)/g, "").trim();
  if (!clean) return fallback;
  return clean.length > 9 ? `${clean.slice(0, 9)}…` : clean;
}

export function UniversalPredictionDetailClient({
  game,
  userBalance,
  userBets,
  initialChartData,
  userLearningProfile,
}: UniversalPredictionDetailClientProps) {
  const [chartTab, setChartTab] = useState<ChartTabType>("trend");
  const [isPending, startTransition] = useTransition();
  const [balance, setBalance] = useState(userBalance);
  const [bets, setBets] = useState(userBets);

  // 옵션 개수와 선언된 predictionType을 결합해 실제 3대 분류 결정
  const effectiveType: "binary" | "wdl" | "ranking" = useMemo(() => {
    if (game.predictionType === "ranking" || game.options.length >= 4) return "ranking";
    if (game.predictionType === "wdl" || game.options.length === 3) return "wdl";
    return "binary";
  }, [game.predictionType, game.options.length]);

  const [selectedOption, setSelectedOption] = useState<string>(game.options[0]?.id || "");
  const [confidencePct, setConfidencePct] = useState<number>(() => {
    const initialProb = game.options[0]?.probability ?? 0.65;
    return Math.min(95, Math.max(50, Math.round(initialProb * 100)));
  });
  const [stakeAmount, setStakeAmount] = useState<number>(game.minimumStake || 100);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  // CAPM · Agency Theory · Prospect Theory 시장 전체 분석 (사용자 확신도 변화 반영)
  const marketEconomy = useMemo(() => {
    return analyzePredictionCapmAndEconomy({
      options: game.options.map((opt) => ({
        id: opt.id,
        label: opt.label,
        probability: opt.probability,
        volume: opt.volume,
      })),
      totalVolume: game.totalVolume,
      participantCount: game.participantCount,
      prizePool: game.prizePool,
      gameImportance: game.collectiveIntelligence?.gameImportance,
      normalizedEntropy: game.collectiveIntelligence?.normalizedEntropy,
      userConfidence: confidencePct / 100,
    });
  }, [
    game.options,
    game.totalVolume,
    game.participantCount,
    game.prizePool,
    game.collectiveIntelligence,
    confidencePct,
  ]);

  // 현재 선택한 옵션 & 입력 PMP/확신도 기준 실시간 경제학 시뮬레이션
  const participationEconomy = useMemo(() => {
    return evaluateOptionParticipationEconomics({
      selectedOptionId: selectedOption,
      stakeAmount,
      confidence: confidencePct / 100,
      userPmpBalance: balance.pmp,
      totalVolume: game.totalVolume,
      prizePool: game.prizePool,
      participantCount: game.participantCount,
      gameImportance: game.collectiveIntelligence?.gameImportance,
      marketEconomy,
    });
  }, [
    selectedOption,
    stakeAmount,
    confidencePct,
    balance.pmp,
    game.totalVolume,
    game.prizePool,
    game.participantCount,
    game.collectiveIntelligence,
    marketEconomy,
  ]);

  // 선택된 옵션에 대한 실시간 경험 편향(Experience Bias) 디바이어싱 진단
  const biasReport = useMemo(() => {
    const opt = game.options.find((o) => o.id === selectedOption);
    if (!opt) return null;
    const recentShare =
      game.collectiveIntelligence?.recentOptionShares?.[opt.id] ?? opt.probability;
    return evaluateExperienceBias({
      selectedOptionId: opt.id,
      confidence: confidencePct / 100,
      stakeAmount,
      marketBayesianProbability: opt.probability,
      optionPriorProbability: opt.priorProbability ?? 1 / Math.max(2, game.options.length),
      totalParticipants: game.participantCount,
      recentOptionShare: recentShare,
      userCalibrationGap: userLearningProfile?.calibrationGap,
      userPastSettledCount: userLearningProfile?.settledCount,
    });
  }, [
    game.options,
    game.participantCount,
    game.collectiveIntelligence,
    selectedOption,
    confidencePct,
    stakeAmount,
    userLearningProfile,
  ]);

  // 메인 피드 카드와의 일관된 시각적 연속성
  const { prefixEmoji, prefixTag, cleanTitle } = splitTitlePrefix(game.title);
  const meta = resolveGameVisualMeta(game.title, game.category, game.subcategory);
  const oracleSpec = getOracleSpecInfo(game.dataSource, game.title);

  // 옵션별 고유 테마 컬러 맵 (모든 차트/게이지/선택버튼에서 1:1 색 일관성 보장)
  const optionThemeMap = useMemo(() => {
    const palette =
      effectiveType === "binary"
        ? BINARY_THEMES
        : effectiveType === "wdl"
        ? WDL_THEMES
        : RANKING_THEMES;

    const map: Record<string, OptionColorTheme> = {};
    game.options.forEach((opt, idx) => {
      map[opt.id] = palette[idx % palette.length];
    });
    return map;
  }, [game.options, effectiveType]);

  // 랭킹 분류용: 확률 내림차순 정렬 (원래 인덱스와 매칭 유지)
  const sortedOptionsByProb = useMemo(() => {
    return [...game.options].sort((a, b) => b.probability - a.probability);
  }, [game.options]);

  const topOption = sortedOptionsByProb[0] ?? game.options[0] ?? { id: "opt-1", label: "선택 1", probability: 0.5 };
  const firstOpt = game.options[0] ?? { id: "opt-1", label: "찬성", probability: 0.5 };
  const leadPct = Math.round((firstOpt.probability || 0.5) * 100);
  const isUp = leadPct >= 50;

  // 시계열 차트 데이터 조립 (실제 히스토리 우선 -> 없으면 합계 100% 보존 보간 추이 생성)
  const lineChartData = useMemo(() => {
    if (initialChartData && initialChartData.length >= 2) {
      // 값 정규화 (0~1 소수 범위면 100 곱하기)
      let maxVal = 0;
      initialChartData.forEach((pt) => {
        game.options.forEach((opt) => {
          const v = Number(pt[opt.id]);
          if (Number.isFinite(v) && v > maxVal) maxVal = v;
        });
      });
      const scale = maxVal > 0 && maxVal <= 1.05 ? 100 : 1;

      return initialChartData.map((pt) => {
        const formatted: { time: string; [key: string]: string | number } = {
          time: pt.time,
        };
        game.options.forEach((opt) => {
          const v = Number(pt[opt.id]);
          formatted[opt.id] = Number.isFinite(v)
            ? Math.round(v * scale)
            : Math.round((opt.probability || 0) * 100);
        });
        return formatted;
      });
    }

    // 다중 옵션에서도 합계 100%가 정확히 유지되는 시계열 추이 생성
    const currentPcts = game.options.map((o) => Math.max(1, Math.round((o.probability || 0) * 100)));
    const curSum = currentPcts.reduce((a, b) => a + b, 0) || 100;
    const normalizedCurrent = currentPcts.map((p) => Math.round((p / curSum) * 100));

    const buildPoint = (timeLabel: string, shifts: number[]) => {
      const shifted = normalizedCurrent.map((p, idx) => Math.max(2, p + (shifts[idx] ?? 0)));
      const sum = shifted.reduce((a, b) => a + b, 0);
      const res: { time: string; [key: string]: string | number } = { time: timeLabel };
      let runningSum = 0;
      game.options.forEach((opt, idx) => {
        if (idx === game.options.length - 1) {
          res[opt.id] = Math.max(1, 100 - runningSum);
        } else {
          const val = Math.max(1, Math.round((shifted[idx] / sum) * 100));
          res[opt.id] = val;
          runningSum += val;
        }
      });
      return res;
    };

    const shifts00 = game.options.map((_, i) => (i === 0 ? -6 : i === 1 ? 4 : 2));
    const shifts06 = game.options.map((_, i) => (i === 0 ? -2 : i === 1 ? 3 : -1));
    const shifts12 = game.options.map((_, i) => (i === 0 ? 4 : i === 1 ? -3 : -1));
    const shiftsNow = game.options.map(() => 0);

    return [
      buildPoint("00:00", shifts00),
      buildPoint("06:00", shifts06),
      buildPoint("12:00", shifts12),
      buildPoint("현재", shiftsNow),
    ];
  }, [initialChartData, game.options]);

  const handlePlaceBet = async () => {
    if (!selectedOption) return;
    setFeedbackMsg(null);
    startTransition(async () => {
      try {
        const result = await placeBet({
          gameId: game.id,
          optionId: selectedOption,
          stakeAmount,
          confidence: confidencePct / 100,
        });
        if (result.success && result.newBalance !== undefined) {
          setBalance({ ...balance, pmp: result.newBalance });
          setFeedbackMsg("🎉 예측 투표에 성공적으로 참여하였습니다!");
          setBets([
            {
              betId: `bet-${Date.now()}`,
              selectedOption,
              betAmount: stakeAmount,
              status: "ACTIVE",
              createdAt: new Date().toISOString(),
            },
            ...bets,
          ]);
        } else {
          setFeedbackMsg(result.message || result.error || "예측 참여에 실패하였습니다.");
        }
      } catch (err: any) {
        setFeedbackMsg(err.message || "오류가 발생했습니다.");
      }
    });
  };

  // ==========================================================
  // 헤더 우측 게이지 3종 렌더링 (Binary / WDL / Ranking)
  // ==========================================================
  const renderHeaderGauge = () => {
    if (effectiveType === "wdl") {
      // 3색 도넛 세그먼트 게이지
      const p1 = Math.round((game.options[0]?.probability || 0.4) * 100);
      const p2 = Math.round((game.options[1]?.probability || 0.3) * 100);
      const p3 = Math.max(1, 100 - p1 - p2);
      const maxOpt = topOption;
      const maxPct = Math.round((maxOpt.probability || 0.4) * 100);
      const maxColorClass = optionThemeMap[maxOpt.id]?.text || "text-emerald-400";

      const radius = 22;
      const circ = 2 * Math.PI * radius;
      const offset1 = circ - (p1 / 100) * circ;
      const offset2 = circ - ((p1 + p2) / 100) * circ;

      return (
        <div className="flex items-center gap-3 shrink-0 self-end md:self-center pl-2">
          <div className="hidden sm:flex flex-col items-end text-[10.5px] font-bold space-y-0.5">
            <div className="flex items-center gap-1.5 text-emerald-400">
              <span>{getShortOptionTag(game.options[0]?.label || "1안", "1안")}</span>
              <span className="font-black">{p1}%</span>
            </div>
            <div className="flex items-center gap-1.5 text-amber-400">
              <span>{getShortOptionTag(game.options[1]?.label || "2안", "2안")}</span>
              <span className="font-black">{p2}%</span>
            </div>
            <div className="flex items-center gap-1.5 text-rose-400">
              <span>{getShortOptionTag(game.options[2]?.label || "3안", "3안")}</span>
              <span className="font-black">{p3}%</span>
            </div>
          </div>

          <div className="relative flex flex-col items-center justify-center w-[62px] h-[62px]">
            <svg className="w-[62px] h-[62px] -rotate-90 overflow-visible" viewBox="0 0 56 56">
              <circle cx="28" cy="28" r={radius} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="5.5" />
              <circle cx="28" cy="28" r={radius} fill="none" stroke="#F43F5E" strokeWidth="5.5" strokeDasharray={circ} strokeDashoffset={0} />
              <circle cx="28" cy="28" r={radius} fill="none" stroke="#F59E0B" strokeWidth="5.5" strokeDasharray={circ} strokeDashoffset={offset2} />
              <circle cx="28" cy="28" r={radius} fill="none" stroke="#10B981" strokeWidth="5.5" strokeDasharray={circ} strokeDashoffset={offset1} />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center leading-none">
              <span className="text-[14px] font-black text-white">{maxPct}%</span>
              <span className={`text-[9px] font-extrabold ${maxColorClass} mt-0.5`}>선두</span>
            </div>
          </div>
        </div>
      );
    }

    if (effectiveType === "ranking") {
      // 1위 독주 스카이 블루 링 게이지
      const topPct = Math.round((topOption.probability || 0.35) * 100);
      const radius = 22;
      const circ = 2 * Math.PI * radius;
      const offset = circ - (topPct / 100) * circ;

      return (
        <div className="flex items-center gap-3 shrink-0 self-end md:self-center pl-2">
          <div className="hidden sm:flex flex-col items-end">
            <span className="text-[10px] font-bold text-sky-400">🥇 현재 1위 후보</span>
            <span className="text-xs font-black text-white max-w-[120px] truncate">
              {topOption.label}
            </span>
          </div>

          <div className="relative flex flex-col items-center justify-center w-[62px] h-[62px]">
            <svg className="w-[62px] h-[62px] -rotate-90 overflow-visible" viewBox="0 0 56 56">
              <circle cx="28" cy="28" r={radius} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="5.5" />
              <circle
                cx="28"
                cy="28"
                r={radius}
                fill="none"
                stroke="#38BDF8"
                strokeWidth="5.5"
                strokeDasharray={circ}
                strokeDashoffset={offset}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center leading-none">
              <span className="text-[14px] font-black text-white">{topPct}%</span>
              <span className="text-[9px] font-extrabold text-sky-400 mt-0.5">1위 독주</span>
            </div>
          </div>
        </div>
      );
    }

    // Binary: 반원 아크 게이지
    return (
      <div className="flex items-center gap-3 shrink-0 self-end md:self-center pl-2">
        <div className="relative flex flex-col items-center justify-center w-[88px] h-[54px]">
          <svg className="w-[84px] h-[48px] overflow-visible" viewBox="0 0 70 38">
            <path
              d="M 8 34 A 27 27 0 0 1 62 34"
              fill="none"
              stroke="rgba(255,255,255,0.1)"
              strokeWidth="5.5"
              strokeLinecap="round"
            />
            <path
              d="M 8 34 A 27 27 0 0 1 62 34"
              fill="none"
              stroke={isUp ? "#10b981" : "#f43f5e"}
              strokeWidth="5.5"
              strokeLinecap="round"
              strokeDasharray={Math.PI * 27}
              strokeDashoffset={Math.PI * 27 * (1 - leadPct / 100)}
              className="transition-all duration-700"
            />
          </svg>
          <div className="absolute bottom-0 flex flex-col items-center leading-none">
            <span className="text-[15px] font-black text-white tracking-tight">
              {leadPct}%
            </span>
            <span className={`text-[9.5px] font-bold ${isUp ? "text-emerald-400" : "text-rose-400"}`}>
              {isUp ? `${getShortOptionTag(firstOpt.label, "상승/찬성")} 우세` : `${getShortOptionTag(game.options[1]?.label || "반대", "반대")} 우세`}
            </span>
          </div>
        </div>
      </div>
    );
  };

  // ==========================================================
  // 우측 참여 패널 옵션 선택 UI (3종 분류별 차별화 렌더링)
  // ==========================================================
  const renderParticipationOptions = () => {
    // 1️⃣ Binary (양자택일): 대립 점유율 바 + 2분할 에메랄드 vs 로즈 캡슐
    if (effectiveType === "binary") {
      const opt1 = game.options[0];
      const opt2 = game.options[1];
      const p1 = Math.round((opt1?.probability || 0.5) * 100);
      const p2 = Math.max(1, 100 - p1);

      return (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-slate-300">
            <span className="flex items-center gap-1.5">
              <Scale className="w-3.5 h-3.5 text-emerald-400" />
              <span>양자택일 예측 선택</span>
            </span>
            <span className="text-[10.5px] text-slate-400">
              {p1}% vs {p2}%
            </span>
          </div>

          {/* 2분할 점유율 배틀 게이지 바 */}
          <div className="w-full h-2 rounded-full bg-slate-900 overflow-hidden flex border border-white/[0.06]">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500"
              style={{ width: `${p1}%` }}
            />
            <div
              className="h-full bg-gradient-to-r from-rose-500 to-pink-500 transition-all duration-500"
              style={{ width: `${p2}%` }}
            />
          </div>

          <div className="grid grid-cols-1 gap-2.5">
            {game.options.map((opt, idx) => {
              const isSelected = selectedOption === opt.id;
              const theme = optionThemeMap[opt.id] || BINARY_THEMES[idx % 2];

              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setSelectedOption(opt.id)}
                  className={`p-3.5 rounded-2xl border text-left flex justify-between items-center transition-all ${
                    isSelected ? theme.activeCard : theme.inactiveCard
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 pr-2">
                    <span
                      className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold ${
                        isSelected ? theme.badgeBg : "bg-slate-800 text-slate-400"
                      }`}
                    >
                      {isSelected ? <CheckCircle2 className="w-3.5 h-3.5" /> : idx + 1}
                    </span>
                    <div className="min-w-0">
                      <div className="font-extrabold text-xs truncate">{opt.label}</div>
                      <div className="text-[10.5px] text-slate-400 mt-0.5 truncate">
                        {opt.description ? `${opt.description} · ` : ""}예상 리워드 {(opt.odds || 2.0).toFixed(2)}x
                      </div>
                    </div>
                  </div>
                  <span className={`text-sm font-black shrink-0 ${theme.text}`}>
                    {((opt.probability || 0.5) * 100).toFixed(0)}%
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      );
    }

    // 2️⃣ WDL (승무패 · 3지선다): 3색 스코어 요약칩 + 3색 밸런스 바 + 3색 캡슐 카드
    if (effectiveType === "wdl") {
      const p0 = Math.round((game.options[0]?.probability || 0.34) * 100);
      const p1 = Math.round((game.options[1]?.probability || 0.33) * 100);
      const p2 = Math.max(1, 100 - p0 - p1);
      const wdlPcts = [p0, p1, p2];

      return (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-slate-300">
            <span className="flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-amber-400" />
              <span>승무패 · 3지선다 선택</span>
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-amber-950/60 text-amber-300 border border-amber-500/30">
              3파전 균형
            </span>
          </div>

          {/* 3열 콤팩트 스코어보드 퀵 셀렉트 칩 */}
          <div className="grid grid-cols-3 gap-1.5">
            {game.options.slice(0, 3).map((opt, idx) => {
              const isSelected = selectedOption === opt.id;
              const theme = optionThemeMap[opt.id] || WDL_THEMES[idx];
              return (
                <button
                  key={`chip-${opt.id}`}
                  type="button"
                  onClick={() => setSelectedOption(opt.id)}
                  className={`p-2 rounded-xl border text-center transition-all ${
                    isSelected
                      ? `${theme.chipBorder} ring-1 ring-white/40`
                      : "border-white/[0.07] bg-slate-950/60 text-slate-400 hover:border-white/20"
                  }`}
                >
                  <div className="text-[10px] font-bold truncate">
                    {getShortOptionTag(opt.label, `선택 ${idx + 1}`)}
                  </div>
                  <div className={`text-sm font-black mt-0.5 ${theme.text}`}>
                    {wdlPcts[idx]}%
                  </div>
                </button>
              );
            })}
          </div>

          {/* 3색 밸런스 점유율 바 */}
          <div className="w-full h-2 rounded-full bg-slate-900 overflow-hidden flex border border-white/[0.06]">
            <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${p0}%` }} />
            <div className="h-full bg-amber-400 transition-all duration-500" style={{ width: `${p1}%` }} />
            <div className="h-full bg-rose-500 transition-all duration-500" style={{ width: `${p2}%` }} />
          </div>

          {/* 3색 개별 선택 카드 (긴 옵션 라벨도 깨지지 않게 온전히 표시) */}
          <div className="grid grid-cols-1 gap-2">
            {game.options.map((opt, idx) => {
              const isSelected = selectedOption === opt.id;
              const theme = optionThemeMap[opt.id] || WDL_THEMES[idx % 3];

              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setSelectedOption(opt.id)}
                  className={`p-3 rounded-2xl border text-left flex justify-between items-center transition-all ${
                    isSelected ? theme.activeCard : theme.inactiveCard
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 pr-2">
                    <span
                      className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[10px] font-black ${
                        isSelected ? theme.badgeBg : "bg-slate-800 text-slate-300"
                      }`}
                    >
                      {isSelected ? <CheckCircle2 className="w-3.5 h-3.5" /> : idx + 1}
                    </span>
                    <div className="min-w-0">
                      <div className="font-extrabold text-xs truncate">{opt.label}</div>
                      <div className="text-[10.5px] text-slate-400 mt-0.5 truncate">
                        {opt.description ? `${opt.description} · ` : ""}예상 리워드 {(opt.odds || 3.0).toFixed(2)}x
                      </div>
                    </div>
                  </div>
                  <span className={`text-sm font-black shrink-0 ${theme.text}`}>
                    {((opt.probability || 0.33) * 100).toFixed(0)}%
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      );
    }

    // 3️⃣ Ranking (랭킹 · 다지선다 순위 예측): 🥇🥈🥉 실시간 순위 경쟁 프로그레스 리스트
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs font-bold text-slate-300">
          <span className="flex items-center gap-1.5">
            <Trophy className="w-3.5 h-3.5 text-sky-400" />
            <span>순위 경쟁 후보 선택 ({game.options.length}개)</span>
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded bg-sky-950/70 text-sky-300 border border-sky-500/30">
            실시간 지지율 순
          </span>
        </div>

        <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
          {sortedOptionsByProb.map((opt, rankIdx) => {
            const isSelected = selectedOption === opt.id;
            const theme = optionThemeMap[opt.id] || RANKING_THEMES[rankIdx % RANKING_THEMES.length];
            const pct = Math.round((opt.probability || 0.2) * 100);
            const rankBadge =
              rankIdx === 0
                ? "bg-amber-400 text-slate-950"
                : rankIdx === 1
                ? "bg-slate-300 text-slate-950"
                : rankIdx === 2
                ? "bg-amber-700 text-white"
                : "bg-slate-800 text-slate-400";

            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => setSelectedOption(opt.id)}
                className={`relative overflow-hidden w-full p-3 rounded-2xl border text-left transition-all ${
                  isSelected ? theme.activeCard : theme.inactiveCard
                }`}
              >
                {/* 배경 지분율 프로그레스 바 (미세한 실시간 게이지 효과) */}
                <div
                  className={`absolute left-0 top-0 bottom-0 opacity-15 transition-all duration-500 ${theme.barBg}`}
                  style={{ width: `${pct}%` }}
                />

                <div className="relative z-10 flex justify-between items-center">
                  <div className="flex items-center gap-2.5 min-w-0 pr-2">
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-[10px] font-black ${
                        isSelected ? theme.badgeBg : rankBadge
                      }`}
                    >
                      {isSelected ? <CheckCircle2 className="w-3.5 h-3.5" /> : `${rankIdx + 1}위`}
                    </span>
                    <div className="min-w-0">
                      <div className="font-extrabold text-xs truncate flex items-center gap-1.5">
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: theme.hex }}
                        />
                        <span className="truncate">{opt.label}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5 truncate">
                        {opt.description ? `${opt.description} · ` : ""}예상 리워드 {(opt.odds || 4.0).toFixed(2)}x
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className={`text-sm font-black ${theme.text}`}>{pct}%</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  const typeBadgeMeta =
    effectiveType === "wdl"
      ? { label: "승무패 · 3지선다", className: "bg-amber-950/70 text-amber-300 border-amber-700/50" }
      : effectiveType === "ranking"
      ? { label: "랭킹 · 순위예측", className: "bg-purple-950/70 text-purple-300 border-purple-700/50" }
      : { label: "양자택일 · Binary", className: "bg-cyan-950/70 text-cyan-300 border-cyan-700/50" };

  return (
    <div className="min-h-screen bg-[#090b12] text-slate-100 selection:bg-cyan-500 selection:text-white">
      {/* 🧭 상단 서브 헤더 네비게이션 */}
      <header className="sticky top-[60px] md:top-[142px] z-20 backdrop-blur-xl bg-[#090b12]/85 border-b border-white/[0.08]">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link
            href="/prediction"
            className="flex items-center gap-2 text-slate-400 hover:text-white text-xs font-bold transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            <span>전체 예측 피드로 돌아가기</span>
          </Link>
          <div className="flex items-center gap-2.5 text-xs">
            <span className={`hidden sm:inline-flex px-2.5 py-0.5 rounded-full border font-bold ${typeBadgeMeta.className}`}>
              {typeBadgeMeta.label}
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-sky-950/80 text-sky-300 border border-sky-800/50 font-bold">
              {prefixTag || meta.categoryLabel}
            </span>
            <span className="text-amber-300 font-bold flex items-center gap-1">
              <Coins className="w-3.5 h-3.5 text-amber-400" />
              <span>보유: {balance.pmp.toLocaleString()} PMP</span>
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* 🔴 연동된 실시간 라이브 응원톡 전면 배너 */}
        {game.liveRoom ? (
          <Link
            href={`/live/${game.liveRoom.id}`}
            className="block rounded-2xl bg-gradient-to-r from-red-950/70 via-rose-900/40 to-slate-900 border border-red-500/40 hover:border-red-400 p-4 shadow-xl transition group"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-600 text-white text-[11px] font-black shrink-0 shadow-md">
                  <Radio className="w-3.5 h-3.5 animate-pulse" />
                  <span>LIVE 시민 응원톡</span>
                </span>
                <div>
                  <div className="text-sm font-black text-white group-hover:text-red-300 transition">
                    {game.liveRoom.title} ({game.liveRoom.viewerCount.toLocaleString()}명 실시간 접속 중)
                  </div>
                  <div className="text-xs text-slate-300">
                    현재 상태: <span className="text-red-300 font-bold">{game.liveRoom.statusText}</span> · 실시간 토론 및 번개 예측에 참여해보세요!
                  </div>
                </div>
              </div>
              <span className="px-4 py-2 rounded-xl bg-red-600 group-hover:bg-red-500 text-white font-black text-xs shrink-0 flex items-center gap-1 self-end sm:self-center shadow-md">
                <span>라이브 응원톡 입장</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </Link>
        ) : (
          <div className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-slate-900/60 border border-white/[0.06] text-xs">
            <div className="flex items-center gap-2 text-slate-400">
              <Radio className="w-3.5 h-3.5 text-rose-500/70" />
              <span>실시간 LIVE 응원톡 라운지가 열려있는 의제들을 확인해보세요.</span>
            </div>
            <Link
              href="/live"
              className="text-rose-400 hover:text-rose-300 font-bold flex items-center gap-1 transition"
            >
              <span>전체 LIVE 라운지 보기</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        )}

        {/* 🌟 상세페이지 메인 헤더: 마이크로 심볼 아바타 + 제목 + 분류별 전용 게이지 */}
        <div className="rounded-2xl bg-[#111622] border border-white/[0.08] p-5 md:p-6 shadow-xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              {/* 메인 피드 카드와 일치하는 마이크로 심볼 아바타 */}
              <div
                className={`w-14 h-14 rounded-2xl ${meta.bgClass} border ${meta.borderClass} flex flex-col items-center justify-center shrink-0 shadow-lg`}
              >
                <span className={`${meta.textClass} text-2xl`}>{meta.symbol}</span>
                {meta.subLabel && (
                  <span className="text-[9px] font-black opacity-85 text-white leading-none mt-0.5">
                    {meta.subLabel}
                  </span>
                )}
              </div>

              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 font-semibold">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-950/70 text-emerald-300 border border-emerald-700/50 font-bold">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{oracleSpec.badge}</span>
                  </span>
                  <span>•</span>
                  <span className="text-amber-400 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    마감: {new Date(game.endTime).toLocaleDateString("ko-KR")}
                  </span>
                  <span>•</span>
                  <span className="text-sky-400 font-bold">
                    참여 시민 {game.participantCount.toLocaleString()}명 · 누적 {game.totalVolume.toLocaleString()} PMP
                  </span>
                </div>

                <h1 className="text-xl md:text-2xl font-black text-white leading-snug">
                  {prefixEmoji && <span className="mr-1.5">{prefixEmoji}</span>}
                  {cleanTitle}
                </h1>
              </div>
            </div>

            {/* 우측 헤더: Binary / WDL / Ranking 전용 게이지 */}
            {renderHeaderGauge()}
          </div>
        </div>

        {/* 2-Column Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ======================================================== */}
          {/* Left Column (2 cols): 그래프 ➔ 의사결정 브리핑 ➔ 의제 정보 ➔ 소셜 갤러리 */}
          {/* ======================================================== */}
          <div className="lg:col-span-2 space-y-6">
            {/* 1️⃣ 📊 집단지성 데이터 차트 센터 */}
            <Card className="p-5 bg-[#111622] border-white/[0.08] space-y-4 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.08] pb-3">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-sky-400" />
                  <span className="text-sm font-extrabold text-white">집단지성 데이터 센터</span>
                  <span className="text-[10px] text-sky-400 font-bold bg-sky-950/60 px-2 py-0.5 rounded border border-sky-800/40">
                    실시간 동기화
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 text-xs font-bold bg-slate-950/80 p-1 rounded-xl border border-white/[0.06]">
                  <button
                    type="button"
                    onClick={() => setChartTab("trend")}
                    className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                      chartTab === "trend"
                        ? "bg-sky-500 text-white shadow-md font-extrabold"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>실시간 확률 추이</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setChartTab("distribution")}
                    className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                      chartTab === "distribution"
                        ? "bg-sky-500 text-white shadow-md font-extrabold"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    <PieChart className="w-3.5 h-3.5" />
                    <span>참여 비중 분포</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setChartTab("participants")}
                    className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                      chartTab === "participants"
                        ? "bg-sky-500 text-white shadow-md font-extrabold"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>시민 참여 추이</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setChartTab("my_bets")}
                    className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                      chartTab === "my_bets"
                        ? "bg-purple-600 text-white shadow-md font-extrabold"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    <span>💜 내 참여 ({bets.length})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setChartTab("economics")}
                    className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                      chartTab === "economics"
                        ? "bg-indigo-600 text-white shadow-md font-extrabold"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    <Brain className="w-3.5 h-3.5" />
                    <span>CAPM · 경제학 모델</span>
                  </button>
                </div>
              </div>

              {/* 탭 1: 실시간 시계열 확률 추이 차트 (안전한 opt.id dataKey 사용) */}
              {chartTab === "trend" && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-400 px-1">
                    <span>
                      {effectiveType === "ranking"
                        ? "후보별 실시간 지지율 순위 경쟁 추이"
                        : effectiveType === "wdl"
                        ? "3대 선택지 실시간 여론 밸런스 추이"
                        : "시간대별 찬/반 확률 변동 추이"}
                    </span>
                    <span className="text-emerald-400 font-bold">● 실시간 마켓 데이터</span>
                  </div>
                  <div className="min-h-[260px] w-full flex flex-col justify-end">
                    <ProbabilityLineChart
                      data={lineChartData}
                      lines={game.options.map((opt, idx) => ({
                        dataKey: opt.id,
                        name: opt.label,
                        color: optionThemeMap[opt.id]?.hex || RANKING_THEMES[idx % RANKING_THEMES.length].hex,
                        strokeWidth: 2.5,
                      }))}
                      isDarkMode={true}
                    />
                  </div>
                </div>
              )}

              {/* 탭 2: 옵션별 참여 비중 분포 (도넛 차트 + 옵션 컬러 범례 매트릭스) */}
              {chartTab === "distribution" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-slate-400 px-1">
                    <span>시민들이 선택한 각 옵션별 지분율 및 PMP 배분 현황</span>
                    <span className="text-purple-400 font-bold">누적 {game.totalVolume.toLocaleString()} PMP</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center py-2">
                    <div className="flex items-center justify-center">
                      <BettingDistributionChart
                        data={game.options.map((opt, i) => ({
                          option: opt.label,
                          amount: opt.volume || Math.max(1000, Math.round((game.totalVolume || 35000) * (opt.probability || 0.3))),
                          percentage: Math.round((opt.probability || 0.3) * 100),
                          color: optionThemeMap[opt.id]?.hex || RANKING_THEMES[i % RANKING_THEMES.length].hex,
                        }))}
                        isDarkMode={true}
                      />
                    </div>
                    <div className="space-y-2">
                      {sortedOptionsByProb.map((opt, idx) => {
                        const hex = optionThemeMap[opt.id]?.hex || RANKING_THEMES[idx % RANKING_THEMES.length].hex;
                        const pct = Math.round((opt.probability || 0.3) * 100);
                        const vol = opt.volume || Math.round((game.totalVolume || 35000) * (opt.probability || 0.3));
                        return (
                          <div
                            key={`legend-${opt.id}`}
                            className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/70 border border-white/[0.06] text-xs"
                          >
                            <div className="flex items-center gap-2 min-w-0 pr-2">
                              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: hex }} />
                              <span className="font-bold text-slate-200 truncate">{opt.label}</span>
                            </div>
                            <div className="flex items-center gap-2.5 shrink-0">
                              <span className="text-[11px] text-slate-400">{vol.toLocaleString()} PMP</span>
                              <span className="font-black text-white w-9 text-right">{pct}%</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* 탭 3: 시민 참여자 수 추이 */}
              {chartTab === "participants" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-slate-400 px-1">
                    <span>시간 경과에 따른 참여 시민 누적 증가 추이</span>
                    <span className="text-emerald-400 font-bold">총 {game.participantCount.toLocaleString()}명</span>
                  </div>
                  <div className="min-h-[220px] flex items-center justify-center">
                    <ParticipantTimelineChart
                      data={[
                        { time: "월", count: Math.round(game.participantCount * 0.15) || 120 },
                        { time: "화", count: Math.round(game.participantCount * 0.35) || 280 },
                        { time: "수", count: Math.round(game.participantCount * 0.55) || 450 },
                        { time: "목", count: Math.round(game.participantCount * 0.8) || 710 },
                        { time: "금", count: game.participantCount || 1248 },
                      ]}
                      isDarkMode={true}
                    />
                  </div>
                </div>
              )}

              {/* 탭 4: 내 참여 내역 */}
              {chartTab === "my_bets" && (
                <div className="space-y-3">
                  <div className="text-xs text-slate-400 px-1">
                    본인이 이 의제에 참여한 예측 투표 내역입니다.
                  </div>
                  {bets.length === 0 ? (
                    <div className="text-xs text-slate-400 text-center py-12 bg-slate-950/40 rounded-xl border border-white/[0.04]">
                      아직 이 의제에 참여한 투표 내역이 없습니다. 우측 패널에서 첫 예측에 참여해보세요!
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {bets.map((b) => {
                        const matchedOpt = game.options.find((o) => o.id === b.selectedOption);
                        return (
                          <div key={b.betId} className="flex justify-between items-center p-3.5 rounded-xl bg-slate-950 border border-white/[0.06] text-xs">
                            <div>
                              <span className="font-extrabold text-sky-300">
                                {matchedOpt?.label || b.selectedOption}
                              </span>
                              <div className="text-[10px] text-slate-500 mt-0.5">
                                {new Date(b.createdAt).toLocaleString("ko-KR")}
                              </div>
                            </div>
                            <span className="font-black text-amber-300 text-sm">
                              {b.betAmount.toLocaleString()} PMP
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* 탭 5: CAPM · Agency Theory · Prospect Theory · 베이지안 & Brier 지속학습 */}
              {chartTab === "economics" && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
                    <span className="text-xs text-slate-300 font-bold flex items-center gap-1.5">
                      <Scale className="w-3.5 h-3.5 text-indigo-400" />
                      <span>CAPM 위험-수익 · Agency · Prospect · 베이지안 사후확률</span>
                    </span>
                    <span className="text-[10.5px] font-bold text-indigo-300 bg-indigo-950/70 px-2.5 py-0.5 rounded-full border border-indigo-500/30">
                      엔트로피 불확실성{" "}
                      {Math.round((game.collectiveIntelligence?.normalizedEntropy ?? 0.6) * 100)}% ·{" "}
                      {game.collectiveIntelligence?.isLowSampleStabilized
                        ? "Prior 안정화 활성"
                        : "증거 기반 수렴"}
                    </span>
                  </div>

                  {/* 4대 PosMul 핵심 경제학 요약 KPI */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div className="p-3 rounded-xl bg-slate-950/80 border border-white/[0.06]">
                      <div className="text-[10px] text-slate-400 font-bold">시장 CAPM 베타 (β)</div>
                      <div className="text-sm font-black text-sky-300 mt-1">
                        {marketEconomy.marketBeta.toFixed(2)}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        요구수익률 E[R] +{(marketEconomy.averageRequiredReturn * 100).toFixed(1)}%
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-950/80 border border-white/[0.06]">
                      <div className="text-[10px] text-slate-400 font-bold">Agency 비대칭 해소</div>
                      <div className="text-sm font-black text-emerald-300 mt-1">
                        {marketEconomy.agencyCostReductionPct}%
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        Jensen-Meckling 정렬 지수
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-950/80 border border-white/[0.06]">
                      <div className="text-[10px] text-slate-400 font-bold">Prospect 손실회피</div>
                      <div className="text-sm font-black text-amber-300 mt-1">
                        λ 2.25 → 1.0
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        무위험 PMP 자본 보호
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-950/80 border border-white/[0.06]">
                      <div className="text-[10px] text-slate-400 font-bold">내 포트폴리오 리스크</div>
                      <div
                        className={`text-sm font-black mt-1 ${
                          participationEconomy.portfolioRisk.riskLevel === "HIGH"
                            ? "text-rose-400"
                            : participationEconomy.portfolioRisk.riskLevel === "MEDIUM"
                            ? "text-amber-300"
                            : "text-emerald-300"
                        }`}
                      >
                        {participationEconomy.portfolioRisk.riskLevel} (
                        {Math.round(participationEconomy.portfolioRisk.riskRatio * 100)}%)
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        보유 PMP 대비 비중
                      </div>
                    </div>
                  </div>

                  {/* 1) 옵션별 CAPM 베타 · Jensen's Alpha · 베이지안 사후확률 비교 */}
                  <div className="space-y-2">
                    <div className="text-[11px] font-bold text-slate-400 px-1">
                      옵션별 CAPM (E[R] = Rf + β(Rm - Rf)) · Jensen&apos;s Alpha · 베이지안 사후확률
                    </div>
                    <div className="space-y-2">
                      {game.options.map((opt, idx) => {
                        const hex = optionThemeMap[opt.id]?.hex || RANKING_THEMES[idx % RANKING_THEMES.length].hex;
                        const bayesPct = Math.round(opt.probability * 100);
                        const rawPct = Math.round((opt.rawVolumeProbability ?? opt.probability) * 100);
                        const ci = opt.credibleInterval;
                        const econOpt = marketEconomy.options.find((o) => o.optionId === opt.id);
                        const beta = econOpt?.capmBeta ?? opt.capmBeta ?? 1.0;
                        const alphaPct = Math.round((econOpt?.jensenAlpha ?? opt.jensenAlpha ?? 0) * 100);
                        const reqReturnPct = ((econOpt?.capmRequiredReturn ?? opt.capmRequiredReturn ?? 0.09) * 100).toFixed(1);
                        const agencyBonusPct = ((econOpt?.agencyExclusivityBonus ?? opt.agencyExclusivityBonus ?? 0) * 100).toFixed(1);

                        return (
                          <div
                            key={`econ-${opt.id}`}
                            className="p-3 rounded-xl bg-slate-950/80 border border-white/[0.06] space-y-1.5"
                          >
                            <div className="flex items-center justify-between gap-2 text-xs">
                              <div className="flex items-center gap-2 min-w-0">
                                <span
                                  className="w-2.5 h-2.5 rounded-full shrink-0"
                                  style={{ backgroundColor: hex }}
                                />
                                <span className="font-extrabold text-white truncate">
                                  {opt.label}
                                </span>
                                <span className="px-2 py-0.5 rounded-full text-[9.5px] font-bold bg-slate-900 text-slate-300 border border-white/[0.08] shrink-0">
                                  β {beta.toFixed(2)}
                                </span>
                              </div>
                              <div className="flex items-center gap-3 shrink-0 text-[11px]">
                                <span className="text-slate-400">
                                  단순볼륨 {rawPct}%
                                </span>
                                <span className="font-black text-sky-300">
                                  베이지안 {bayesPct}%
                                </span>
                              </div>
                            </div>
                            <div className="flex flex-wrap items-center justify-between gap-2 text-[10.5px] text-slate-400">
                              <span>
                                95% 신뢰구간:{" "}
                                {ci
                                  ? `${Math.round(ci[0] * 100)}% ~ ${Math.round(ci[1] * 100)}%`
                                  : `${Math.max(1, bayesPct - 8)}% ~ ${Math.min(99, bayesPct + 8)}%`}
                              </span>
                              <div className="flex flex-wrap items-center gap-3">
                                <span>
                                  CAPM E[R] <strong className="text-slate-200">+{reqReturnPct}%</strong>
                                </span>
                                <span>
                                  Alpha{" "}
                                  <strong className={alphaPct >= 0 ? "text-emerald-300" : "text-rose-300"}>
                                    {alphaPct >= 0 ? `+${alphaPct}%` : `${alphaPct}%`}
                                  </strong>
                                </span>
                                <span>
                                  Agency 독점가치 <strong className="text-amber-300">+{agencyBonusPct}%</strong>
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* 2) 나의 Brier Score · 경험 편향 교정(Calibration) 지속 학습 현황 */}
                  <div className="p-3.5 rounded-xl bg-gradient-to-r from-indigo-950/40 via-slate-950 to-slate-950 border border-indigo-500/25 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-extrabold text-indigo-300 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                        <span>나의 지속적 확률 학습 & Brier 교정 프로필</span>
                      </span>
                      <span className="text-[10.5px] font-bold text-emerald-300">
                        베이지안 스킬 가중치{" "}
                        {(userLearningProfile?.skillWeight ?? 1.0).toFixed(2)}x
                      </span>
                    </div>
                    {userLearningProfile && userLearningProfile.settledCount > 0 ? (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                        <div className="p-2 rounded-lg bg-slate-900/80 border border-white/[0.05]">
                          <div className="text-[10px] text-slate-400">정산 완료</div>
                          <div className="text-xs font-black text-white mt-0.5">
                            {userLearningProfile.settledCount}건
                          </div>
                        </div>
                        <div className="p-2 rounded-lg bg-slate-900/80 border border-white/[0.05]">
                          <div className="text-[10px] text-slate-400">Brier 오차</div>
                          <div className="text-xs font-black text-sky-300 mt-0.5">
                            {userLearningProfile.averageBrierScore.toFixed(3)}
                          </div>
                        </div>
                        <div className="p-2 rounded-lg bg-slate-900/80 border border-white/[0.05]">
                          <div className="text-[10px] text-slate-400">실제 적중률</div>
                          <div className="text-xs font-black text-emerald-300 mt-0.5">
                            {Math.round(userLearningProfile.winRate * 100)}%
                          </div>
                        </div>
                        <div className="p-2 rounded-lg bg-slate-900/80 border border-white/[0.05]">
                          <div className="text-[10px] text-slate-400">편향 진단</div>
                          <div className="text-xs font-black text-amber-300 mt-0.5">
                            {userLearningProfile.calibrationStatus === "OVERCONFIDENT"
                              ? "과신 주의"
                              : userLearningProfile.calibrationStatus === "UNDERCONFIDENT"
                              ? "과소 신뢰"
                              : userLearningProfile.calibrationStatus === "WELL_CALIBRATED"
                              ? "균형 교정"
                              : "표본 축적"}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        첫 정산 결과가 쌓이면 Brier Score(확률 예측 정밀도)와 확신도 편향(과신·과소신뢰)을 자동 측정해, 다음 마켓의 집단지성 베이지안 반영 가중치가 성장합니다.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </Card>

            {/* 2️⃣ ⚖️ AI 균형 의사결정 브리핑 */}
            <BalancedDecisionBriefing
              gameId={game.id}
              gameTitle={game.title}
            />

            {/* 3️⃣ 📋 의제 정보 & 공식 판정 기준 (심플 콤팩트 카드) */}
            <div className="rounded-2xl bg-[#111622] border border-white/[0.08] p-4 sm:p-5 space-y-3.5 shadow-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs sm:text-sm font-extrabold text-white">
                  <FileText className="w-4 h-4 text-sky-400" />
                  <span>의제 정보 & 공식 판정 기준</span>
                </div>
                <span className="text-[10.5px] font-bold text-emerald-400 bg-emerald-950/80 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                  {oracleSpec.badge}
                </span>
              </div>

              {game.description && (
                <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/50 p-3 rounded-xl border border-white/[0.04] whitespace-pre-line">
                  {game.description}
                </p>
              )}

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-xl bg-slate-950/80 border border-white/[0.06] text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <Database className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="text-slate-200 font-bold truncate">{oracleSpec.provider}</span>
                  <span className="text-slate-600 hidden sm:inline">·</span>
                  <span className="text-slate-400 text-[11px] truncate hidden sm:inline">{oracleSpec.scheduleDesc}</span>
                </div>
                <span className="text-[10.5px] text-sky-400 font-bold shrink-0 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />
                  <span>취소·무효 시 100% PMP 전액 환불</span>
                </span>
              </div>
            </div>

            {/* 4️⃣ 💬 이 의제 전용 시민 토론 갤러리 (소셜) */}
            <div className="space-y-4 pt-1">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-sky-400" />
                  <span>이 의제 전용 시민 토론 갤러리</span>
                  <span className="text-xs text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40">
                    건전 의견 작성 시 +10 PMP
                  </span>
                </h3>
                <Link
                  href="/forum"
                  className="text-xs text-sky-400 hover:text-sky-300 font-bold transition-colors"
                >
                  포럼 전체 갤러리 가기 →
                </Link>
              </div>

              <GalleryPostList
                gameFilterId={game.id}
                gameFilterTitle={game.title}
                isCompactMode={true}
              />
            </div>
          </div>

          {/* ======================================================== */}
          {/* Right Column (1 col): 황금 모래시계 (최상단) & 3종 맞춤형 참여 패널 */}
          {/* ======================================================== */}
          <div className="space-y-5">
            {/* ⏳ 상세페이지 황금 모래시계 위젯 (시선 집중 최상단 배치) */}
            <MoneyWaveWaterfallCard totalPrizePool={Math.round(game.prizePool || 22817)} />

            {/* 🎯 시민 예측 참여 패널 (Binary / WDL / Ranking 맞춤형 렌더링) */}
            <Card className="p-5 bg-gradient-to-b from-[#131b2e] via-[#0f172a] to-[#090b12] border-white/[0.1] space-y-5 shadow-2xl">
              <div className="flex justify-between items-center pb-3 border-b border-white/[0.08]">
                <span className="text-sm font-extrabold text-white flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>시민 예측 참여 패널</span>
                </span>
                <span className="text-xs font-bold text-amber-300">
                  💎 상금풀: {Math.round(game.prizePool || 0).toLocaleString()} PMC
                </span>
              </div>

              {/* 3대 분류 맞춤형 옵션 선택기 */}
              {renderParticipationOptions()}

              {/* 확률적 판단: 내 확신도(Confidence - Agency 정보품질 · Prospect 보정) */}
              <div className="p-3.5 rounded-2xl bg-slate-950/75 border border-white/[0.07] space-y-2.5">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-300 flex items-center gap-1.5">
                    <SlidersHorizontal className="w-3.5 h-3.5 text-sky-400" />
                    <span>내 예측 확신도 (Agency · Prospect)</span>
                  </span>
                  <span className="text-sky-300 font-black">{confidencePct}%</span>
                </div>
                <input
                  type="range"
                  min={50}
                  max={95}
                  step={5}
                  value={confidencePct}
                  onChange={(e) => setConfidencePct(Number(e.target.value))}
                  className="w-full accent-sky-400 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-500">
                  <span>50% (탐색적 참여)</span>
                  <span>75% (데이터 기반 확신)</span>
                  <span>95% (고신뢰 정보)</span>
                </div>
              </div>

              {/* 실시간 CAPM · Agency · MoneyWave 위험/보상 시뮬레이터 */}
              <div className="p-3.5 rounded-2xl bg-gradient-to-br from-slate-950 via-[#0d1526] to-indigo-950/30 border border-indigo-500/25 space-y-2 text-[11px]">
                <div className="flex items-center justify-between font-extrabold">
                  <span className="text-indigo-300 flex items-center gap-1.5">
                    <Scale className="w-3.5 h-3.5 text-indigo-400" />
                    <span>CAPM · MoneyWave 예상 리워드</span>
                  </span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full border ${
                      participationEconomy.portfolioRisk.riskLevel === "HIGH"
                        ? "bg-rose-950/70 text-rose-300 border-rose-500/40"
                        : participationEconomy.portfolioRisk.riskLevel === "MEDIUM"
                        ? "bg-amber-950/70 text-amber-300 border-amber-500/40"
                        : "bg-emerald-950/70 text-emerald-300 border-emerald-500/40"
                    }`}
                  >
                    포트폴리오 {participationEconomy.portfolioRisk.riskLevel} (
                    {Math.round(participationEconomy.portfolioRisk.riskRatio * 100)}%)
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-0.5">
                  <div className="p-2 rounded-xl bg-black/30 border border-white/[0.05]">
                    <div className="text-[10px] text-slate-400">기본 예상 수령 PMC</div>
                    <div className="text-sm font-black text-emerald-300 mt-0.5">
                      ~{participationEconomy.baseEstimatedPmc.toLocaleString()} PMC
                    </div>
                    <div className="text-[9.5px] text-slate-500">
                      적정확신·Agency 최대 ~{participationEconomy.maxPotentialPmc.toLocaleString()}
                    </div>
                  </div>
                  <div className="p-2 rounded-xl bg-black/30 border border-white/[0.05]">
                    <div className="text-[10px] text-slate-400">옵션 CAPM β / Alpha</div>
                    <div className="text-sm font-black text-sky-300 mt-0.5">
                      β {participationEconomy.optionMetrics.capmBeta.toFixed(2)} · α{" "}
                      {participationEconomy.optionMetrics.jensenAlpha >= 0
                        ? `+${Math.round(participationEconomy.optionMetrics.jensenAlpha * 100)}%`
                        : `${Math.round(participationEconomy.optionMetrics.jensenAlpha * 100)}%`}
                    </div>
                    <div className="text-[9.5px] text-slate-500">
                      적중 Calibration 보너스 +
                      {Math.round(participationEconomy.prospectAdjustment.confidenceBonus * 100)}%
                    </div>
                  </div>
                </div>
                <p className="text-[10px] text-slate-400 leading-relaxed">
                  {participationEconomy.portfolioRisk.recommendation}
                </p>
              </div>

              {/* 실시간 경험 편향(Experience Bias) 디바이어싱 코치 */}
              {biasReport && (
                <div
                  className={`p-3 rounded-2xl border text-[11px] space-y-1 ${
                    biasReport.riskLevel === "HIGH"
                      ? "bg-amber-950/45 border-amber-500/40 text-amber-200"
                      : biasReport.riskLevel === "MEDIUM"
                      ? "bg-sky-950/35 border-sky-500/30 text-sky-200"
                      : "bg-emerald-950/30 border-emerald-500/25 text-emerald-200"
                  }`}
                >
                  <div className="flex items-center justify-between font-extrabold">
                    <span className="flex items-center gap-1.5">
                      <Brain className="w-3.5 h-3.5" />
                      <span>경험 편향 & 과신 진단</span>
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-black/30">
                      {biasReport.riskLevel === "HIGH"
                        ? "⚠️ 편향 주의"
                        : biasReport.riskLevel === "MEDIUM"
                        ? "🔎 교정 권장"
                        : "✅ 균형 판단"}
                    </span>
                  </div>
                  <p className="leading-relaxed opacity-90">{biasReport.nudges[0]}</p>
                </div>
              )}

              {/* 참여 PMP 설정 */}
              <div className="space-y-2 pt-1">
                <div className="flex justify-between text-xs font-bold">
                  <label className="text-slate-300">참여 PMP 설정</label>
                  <span className="text-amber-300">보유: {balance.pmp.toLocaleString()} PMP</span>
                </div>
                <input
                  type="number"
                  value={stakeAmount}
                  onChange={(e) => setStakeAmount(Number(e.target.value))}
                  min={game.minimumStake}
                  max={game.maximumStake}
                  className="w-full bg-slate-950 border border-white/[0.12] rounded-xl px-3.5 py-2.5 text-sm text-white font-bold focus:outline-none focus:border-cyan-400"
                />
              </div>

              {/* 퀵 추가 버튼 */}
              <div className="flex gap-2">
                {[100, 500, 1000, 5000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setStakeAmount(amt)}
                    className="flex-1 py-1.5 rounded-lg bg-slate-950 border border-white/[0.08] text-[10.5px] font-bold text-slate-300 hover:text-white hover:border-cyan-500/50 transition-colors"
                  >
                    +{amt.toLocaleString()}
                  </button>
                ))}
              </div>

              {/* 피드백 메시지 */}
              {feedbackMsg && (
                <div
                  className={`p-3 rounded-xl text-xs font-bold ${
                    feedbackMsg.includes("성공")
                      ? "bg-emerald-950/60 border border-emerald-800 text-emerald-300"
                      : "bg-rose-950/60 border border-rose-800 text-rose-300"
                  }`}
                >
                  {feedbackMsg}
                </div>
              )}

              {/* 예측 제출 버튼 */}
              <button
                type="button"
                onClick={handlePlaceBet}
                disabled={
                  game.status !== "ACTIVE" ||
                  stakeAmount > balance.pmp ||
                  stakeAmount < (game.minimumStake || 100) ||
                  isPending
                }
                className={`w-full py-3.5 rounded-xl text-white font-extrabold text-sm shadow-xl transition-all ${
                  game.status !== "ACTIVE" ||
                  stakeAmount > balance.pmp ||
                  stakeAmount < (game.minimumStake || 100) ||
                  isPending
                    ? "bg-slate-800 text-slate-500 cursor-not-allowed opacity-60"
                    : "bg-gradient-to-r from-sky-500 via-cyan-500 to-emerald-500 shadow-cyan-500/20 hover:from-sky-400 hover:to-emerald-400"
                }`}
              >
                {game.status === "SETTLED"
                  ? "🏆 결과 정산 완료된 의제"
                  : game.status !== "ACTIVE"
                  ? "🛑 예측 참여 마감된 의제"
                  : isPending
                  ? "참여 처리 중..."
                  : stakeAmount > balance.pmp
                  ? "⚠️ PMP 잔액 부족"
                  : stakeAmount < (game.minimumStake || 100)
                  ? `최소 ${(game.minimumStake || 100).toLocaleString()} PMP 이상 필요`
                  : "🎯 예측 투표 참여하기"}
              </button>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
