/**
 * Universal Prediction Game Detail Client Component
 * 모든 예측 카드의 클릭에 대응하는 범용 상세페이지 클라이언트 컴포넌트
 */
"use client";

import { useState, useTransition } from "react";
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
} from "lucide-react";
import Link from "next/link";
import { Card } from "@/shared/ui/components/base";

interface PredictionOption {
  id: string;
  label: string;
  probability: number;
  odds: number;
  volume: number;
  change24h: number;
}

interface PredictionGameDetail {
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
}

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
  if (ds === "kcontent" || t.includes("시청률") || t.includes("드라마") || t.includes("OTT") || t.includes("예능") || t.includes("K-POP")) {
    if (t.includes("OTT") || t.includes("넷플릭스")) {
      return {
        provider: "Netflix Tudum / FlixPatrol 공식 TOP 10 집계",
        endpoint: "KContentOracleAdapter (ott_top1)",
        badge: "📺 글로벌 OTT 공식 순위 오라클",
        scheduleDesc: "집계 발표 직후 대한민국 시리즈 TOP 10 1위 여부 판정",
      };
    }
    if (t.includes("K-POP") || t.includes("음원")) {
      return {
        provider: "써클차트(Circle Chart) · 멜론 주간 디지털 차트",
        endpoint: "KContentOracleAdapter (music_chart_top10)",
        badge: "🎵 공인 음원차트 오라클",
        scheduleDesc: "주간 차트 발표 시점 TOP 10 진입 여부 판정",
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
      provider: "CoinGecko 글로벌 암호화폐 인덱스 Public API v3",
      endpoint: "api.coingecko.com/api/v3/simple/price",
      badge: "₿ CoinGecko 실시간 시세 오라클",
      scheduleDesc: "마감 시각 기준 글로벌 USD/KRW 인덱스가격 자동 대조 판정",
    };
  }
  if (ds === "alpha-vantage" || t.includes("나스닥") || t.includes("코스피") || t.includes("삼성전자")) {
    return {
      provider: "Alpha Vantage Global Market Data / KRX 종가",
      endpoint: "TIME_SERIES_DAILY (Official Close Price)",
      badge: "📈 글로벌 증시 공식 종가 오라클",
      scheduleDesc: "정규장 마감 후 전일 종가 대비 상승/하락 자동 판정",
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
  if (ds === "ecos" || t.includes("한국은행") || t.includes("금통위") || t.includes("경상수지")) {
    return {
      provider: "한국은행 경제통계시스템 (BOK ECOS Open API)",
      endpoint: "ecos.bok.or.kr/api/StatisticSearch (722Y001 / 200Y101)",
      badge: "🏦 한국은행 ECOS 공식 통계 오라클",
      scheduleDesc: "금통위/속보치 공식 발표 1~2시간 후 ECOS 통계표 자동 판정",
    };
  }
  if (ds === "football_data" || ds === "thesportsdb" || t.includes("EPL") || t.includes("KBO") || t.includes("프로야구")) {
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
}

type TabType = "analysis" | "my_bets";

export function UniversalPredictionDetailClient({
  game,
  userBalance,
  userBets,
}: UniversalPredictionDetailClientProps) {
  const [activeTab, setActiveTab] = useState<TabType>("analysis");
  const [isPending, startTransition] = useTransition();
  const [balance, setBalance] = useState(userBalance);
  const [bets, setBets] = useState(userBets);
  const [selectedOption, setSelectedOption] = useState<string>(game.options[0]?.id || "");
  const [stakeAmount, setStakeAmount] = useState<number>(game.minimumStake || 100);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  // 메인 카드와의 비주얼 연속성 연동
  const { prefixEmoji, prefixTag, cleanTitle } = splitTitlePrefix(game.title);
  const meta = resolveGameVisualMeta(game.title, game.category, game.subcategory);
  const oracleSpec = getOracleSpecInfo(game.dataSource, game.title);

  // 1위 옵션 확률 및 게이지 퍼센티지 계산
  const firstOpt = game.options[0] ?? { probability: 0.5 };
  const leadPct = Math.round((firstOpt.probability || 0.5) * 100);
  const isUp = leadPct >= 50;

  const handlePlaceBet = async () => {
    if (!selectedOption) return;
    setFeedbackMsg(null);
    startTransition(async () => {
      try {
        const result = await placeBet({ gameId: game.id, optionId: selectedOption, stakeAmount });
        if (result.success && result.newBalance !== undefined) {
          setBalance({ ...balance, pmp: result.newBalance });
          setFeedbackMsg("🎉 예측 투표에 성공적으로 참여하였습니다!");
          setBets([
            ...bets,
            {
              betId: `bet-${Date.now()}`,
              selectedOption,
              betAmount: stakeAmount,
              status: "ACTIVE",
              createdAt: new Date().toISOString(),
            },
          ]);
        } else {
          setFeedbackMsg(result.message || result.error || "예측 참여에 실패하였습니다.");
        }
      } catch (err: any) {
        setFeedbackMsg(err.message || "오류가 발생했습니다.");
      }
    });
  };

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
          <div className="flex items-center gap-3 text-xs">
            <span className="px-2.5 py-0.5 rounded-full bg-sky-950/80 text-sky-300 border border-sky-800/50 font-bold">
              {prefixTag || meta.categoryLabel}
            </span>
            <span className="text-amber-300 font-bold flex items-center gap-1">
              <Coins className="w-3.5 h-3.5 text-amber-400" />
              <span>보유 참여자산: {balance.pmp.toLocaleString()} PMP</span>
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* 🔴 연동된 실시간 라이브 응원톡 배너 (존재할 경우) */}
        {game.liveRoom && (
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
        )}

        {/* 🌟 상세페이지 헤더: 메인 카드의 마이크로 심볼 아바타 + 넉넉한 2줄 제목 + 반원 아크 게이지 결합 */}
        <div className="rounded-2xl bg-[#111622] border border-white/[0.08] p-5 md:p-6 shadow-xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              {/* 메인 카드와 일치하는 마이크로 심볼 아바타 */}
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
                    참여 시민 {game.participantCount.toLocaleString()}명 · 누적 참여량 {game.totalVolume.toLocaleString()} PMP
                  </span>
                </div>

                <h1 className="text-xl md:text-2xl font-black text-white leading-snug">
                  {prefixEmoji && <span className="mr-1.5">{prefixEmoji}</span>}
                  {cleanTitle}
                </h1>
              </div>
            </div>

            {/* 우측 헤더: 실시간 합의 아크 게이지 */}
            <div className="flex items-center gap-3 shrink-0 self-end md:self-center pl-2">
              <div className="relative flex flex-col items-center justify-center w-[84px] h-[52px]">
                <svg className="w-[82px] h-[48px] overflow-visible" viewBox="0 0 70 38">
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
                    {isUp ? "상승/찬성 우세" : "하락/반대 우세"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed mt-4 pt-4 border-t border-white/[0.06] whitespace-pre-line">
            {game.description}
          </p>
        </div>

        {/* 2-Column Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: 시계열 차트 & 분석 & 오라클 명세 (2 cols) */}
          <div className="lg:col-span-2 space-y-6">
            {/* 실시간 시계열 집단지성 확률 차트 */}
            <Card className="p-5 bg-[#111622] border-white/[0.08] space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-sky-400" />
                  <span>실시간 집단지성 예측 확률 추이 (Polymarket Chart)</span>
                </h3>
                <span className="text-xs text-sky-400 font-bold bg-sky-950/60 px-2 py-0.5 rounded border border-sky-800/40">
                  LIVE
                </span>
              </div>
              <div className="h-64 w-full overflow-hidden flex flex-col justify-end">
                <ProbabilityLineChart
                  data={[
                    {
                      time: "00:00",
                      ...(game.options.reduce((acc, opt) => ({ ...acc, [opt.label]: Math.round((opt.probability || 0.5) * 100) }), {})),
                    },
                    {
                      time: "06:00",
                      ...(game.options.reduce((acc, opt, idx) => ({ ...acc, [opt.label]: Math.min(95, Math.max(5, Math.round((opt.probability || 0.5) * 100) + (idx === 0 ? 4 : -4))) }), {})),
                    },
                    {
                      time: "12:00",
                      ...(game.options.reduce((acc, opt, idx) => ({ ...acc, [opt.label]: Math.min(95, Math.max(5, Math.round((opt.probability || 0.5) * 100) + (idx === 0 ? 8 : -8))) }), {})),
                    },
                    {
                      time: "현재",
                      ...(game.options.reduce((acc, opt) => ({ ...acc, [opt.label]: Math.round((opt.probability || 0.5) * 100) }), {})),
                    },
                  ]}
                  lines={game.options.map((opt, i) => ({
                    dataKey: opt.label,
                    name: opt.label,
                    color: i === 0 ? "#10B981" : i === 1 ? "#F43F5E" : "#F59E0B",
                    strokeWidth: 2.5,
                  }))}
                  isDarkMode={true}
                />
              </div>
            </Card>

            {/* 🏛️ 공인 검증 오라클 정보 (초슬림 1줄 배너로 콤팩트 축소) */}
            <div className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-[#111622] border border-white/[0.08] text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <Database className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="text-slate-300 font-bold truncate">{oracleSpec.provider}</span>
                <span className="text-slate-600 hidden sm:inline">·</span>
                <span className="text-slate-400 text-[11px] truncate hidden sm:inline">{oracleSpec.scheduleDesc}</span>
              </div>
              <span className="text-[10px] font-extrabold text-emerald-400 bg-emerald-950/70 px-2 py-0.5 rounded border border-emerald-500/30 shrink-0">
                공인 오라클 자동판정
              </span>
            </div>

            {/* ⚖️ AI 균형 의사결정 브리핑 (중립 팩트체크 + 찬성 논거 + 반대 논거) */}
            <BalancedDecisionBriefing
              gameId={game.id}
              gameTitle={game.title}
              onRewardClaimed={(earned) => {
                setBalance((prev) => ({ ...prev, pmp: prev.pmp + earned }));
              }}
            />

            {/* 탭 네비게이션: 데이터 분석 vs 내 참여 내역 */}
            <div className="border-b border-white/[0.08] flex gap-4 text-sm font-bold">
              <button
                onClick={() => setActiveTab("analysis")}
                className={`pb-2 border-b-2 transition-colors ${
                  activeTab === "analysis" ? "border-sky-400 text-sky-300" : "border-transparent text-slate-400 hover:text-slate-200"
                }`}
              >
                📊 집단지성 의견 분포
              </button>
              <button
                onClick={() => setActiveTab("my_bets")}
                className={`pb-2 border-b-2 transition-colors ${
                  activeTab === "my_bets" ? "border-sky-400 text-sky-300" : "border-transparent text-slate-400 hover:text-slate-200"
                }`}
              >
                💜 내 참여 내역 ({bets.length})
              </button>
            </div>

            {/* 탭 본문 */}
            {activeTab === "analysis" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="p-4 bg-[#111622] border-white/[0.08] space-y-2">
                  <h4 className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <PieChart className="w-3.5 h-3.5 text-purple-400" />
                    <span>옵션별 참여 비중 분포</span>
                  </h4>
                  <div className="h-44">
                    <BettingDistributionChart
                      data={game.options.map((opt, i) => ({
                        option: opt.label,
                        amount: opt.volume || 10000,
                        percentage: Math.round((opt.probability || 0.5) * 100),
                        color: ["#10B981", "#F43F5E", "#F59E0B", "#38BDF8"][i % 4],
                      }))}
                      isDarkMode={true}
                    />
                  </div>
                </Card>
                <Card className="p-4 bg-[#111622] border-white/[0.08] space-y-2">
                  <h4 className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-emerald-400" />
                    <span>시민 참여 추이</span>
                  </h4>
                  <div className="h-44">
                    <ParticipantTimelineChart
                      data={[
                        { time: "월", count: 120 },
                        { time: "화", count: 280 },
                        { time: "수", count: 450 },
                        { time: "목", count: 710 },
                        { time: "금", count: game.participantCount || 1248 },
                      ]}
                      isDarkMode={true}
                    />
                  </div>
                </Card>
              </div>
            )}

            {activeTab === "my_bets" && (
              <Card className="p-4 bg-[#111622] border-white/[0.08]">
                {bets.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-8">아직 이 의제에 참여한 내역이 없습니다.</p>
                ) : (
                  <div className="space-y-2">
                    {bets.map((b) => (
                      <div key={b.betId} className="flex justify-between items-center p-3 rounded-xl bg-slate-950 border border-white/[0.06] text-xs">
                        <div>
                          <span className="font-bold text-sky-300">{b.selectedOption}</span>
                          <div className="text-[10px] text-slate-500">{new Date(b.createdAt).toLocaleString("ko-KR")}</div>
                        </div>
                        <span className="font-extrabold text-amber-300">{b.betAmount.toLocaleString()} PMP</span>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            )}

            {/* 댓글 및 시민 토론 갤러리 */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                  <span>💬 이 게임 전용 시민 토론 갤러리</span>
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

          {/* Right Column: 황금 모래시계 위젯 (최상단) & 시민 예측 참여 패널 (1 col) */}
          <div className="space-y-5">
            {/* ⏳ 상세페이지 황금 모래시계 위젯 (시선 집중 최상단 배치) */}
            <MoneyWaveWaterfallCard totalPrizePool={Math.round(game.prizePool || 22817)} />

            {/* 🎯 시민 예측 참여 패널 */}
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

              {/* 🌟 옵션 선택: 3번째 사진의 둥근 타원형 캡슐 토글 버튼 스타일 일원화 */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 block">예측 옵션 선택</label>
                <div className="grid grid-cols-1 gap-2.5">
                  {game.options.map((opt, idx) => {
                    const isSelected = selectedOption === opt.id;
                    const isFirst = idx === 0;
                    // 첫 번째 옵션은 에메랄드 테마, 두 번째 옵션은 로즈 테마
                    const activeStyle = isFirst
                      ? "border-emerald-400 bg-emerald-950/70 text-white ring-2 ring-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.25)]"
                      : "border-rose-400 bg-rose-950/70 text-white ring-2 ring-rose-500/50 shadow-[0_0_15px_rgba(244,63,94,0.25)]";
                    const inactiveStyle = isFirst
                      ? "border-emerald-500/30 bg-emerald-950/20 text-slate-300 hover:border-emerald-500/60"
                      : "border-rose-500/30 bg-rose-950/20 text-slate-300 hover:border-rose-500/60";

                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setSelectedOption(opt.id)}
                        className={`p-3.5 rounded-2xl border text-left flex justify-between items-center transition-all ${
                          isSelected ? activeStyle : inactiveStyle
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span
                            className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold ${
                              isSelected
                                ? isFirst ? "bg-emerald-500 text-slate-950" : "bg-rose-500 text-white"
                                : "bg-slate-800 text-slate-400"
                            }`}
                          >
                            {isSelected ? <CheckCircle2 className="w-3.5 h-3.5" /> : idx + 1}
                          </span>
                          <div>
                            <div className="font-extrabold text-xs truncate">{opt.label}</div>
                            <div className="text-[10.5px] text-slate-400 mt-0.5">
                              예상 리워드 배율 {(opt.odds || 2.0).toFixed(2)}x
                            </div>
                          </div>
                        </div>
                        <span
                          className={`text-sm font-black shrink-0 ${
                            isFirst ? "text-emerald-400" : "text-rose-400"
                          }`}
                        >
                          {((opt.probability || 0.5) * 100).toFixed(0)}%
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 참여 PMP 설정 */}
              <div className="space-y-2">
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
                {game.status !== "ACTIVE"
                  ? "🛑 예측 마감된 의제"
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
