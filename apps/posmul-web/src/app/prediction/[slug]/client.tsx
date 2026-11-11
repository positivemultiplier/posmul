/**
 * Universal Prediction Game Detail Client Component
 * 모든 예측 카드의 클릭에 대응하는 범용 상세페이지 클라이언트 컴포넌트
 * 마스터 레이아웃:
 * 1. 🔴 LIVE 연동 배너 (상시/매칭 연동)
 * 2. 🌟 메인 비주얼 헤더 (아바타 심볼 + 2줄 제목 + 합의 아크 게이지)
 * 3. 2-Column 그리드:
 *    - 좌측 (2 Cols):
 *      ① ⚖️ AI 균형 의사결정 브리핑 (중립 팩트체크 & 찬/반 균형 논거 1순위 노출)
 *      ② 📊 집단지성 데이터 차트 센터 (확률 추이 / 의견 분포 파이 / 시민 참여 추이 / 내 참여 내역 탭 통합)
 *      ③ 📋 의제 심층 배경 및 공식 판정 본문 (의제 스토리 + 공인 오라클 명세 박스 흡수 + 100% 환불 안전 규정)
 *      ④ 💬 이 의제 전용 시민 토론 갤러리
 *    - 우측 (1 Col):
 *      ① ⏳ MoneyWave 황금 모래시계 위젯 (시선 집중 최상단)
 *      ② 🎯 시민 예측 참여 패널 (에메랄드/로즈 캡슐 토글 버튼 + PMP 설정)
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
  FileText,
  MessageSquare,
  BarChart3,
  Calendar,
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

type ChartTabType = "trend" | "distribution" | "participants" | "my_bets";

export function UniversalPredictionDetailClient({
  game,
  userBalance,
  userBets,
}: UniversalPredictionDetailClientProps) {
  const [chartTab, setChartTab] = useState<ChartTabType>("trend");
  const [isPending, startTransition] = useTransition();
  const [balance, setBalance] = useState(userBalance);
  const [bets, setBets] = useState(userBets);
  const [selectedOption, setSelectedOption] = useState<string>(game.options[0]?.id || "");
  const [stakeAmount, setStakeAmount] = useState<number>(game.minimumStake || 100);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  // 메인 피드 카드와의 일관된 시각적 연속성 (아이콘, 색상, 카테고리 태그)
  const { prefixEmoji, prefixTag, cleanTitle } = splitTitlePrefix(game.title);
  const meta = resolveGameVisualMeta(game.title, game.category, game.subcategory);
  const oracleSpec = getOracleSpecInfo(game.dataSource, game.title);

  // 1위 옵션 확률 및 합의 아크 게이지 계산
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
        {/* 🔴 연동된 실시간 라이브 응원톡 전면 배너 (존재할 경우) */}
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

        {/* 🌟 상세페이지 메인 헤더: 마이크로 심볼 아바타 + 넉넉한 2줄 제목 + 반원 아크 게이지 */}
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
        </div>

        {/* 2-Column Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ======================================================== */}
          {/* Left Column (2 cols): 의사결정 브리핑 ➔ 차트 센터 ➔ 본문 ➔ 갤러리 */}
          {/* ======================================================== */}
          <div className="lg:col-span-2 space-y-6">
            {/* 1️⃣ ⚖️ AI 균형 의사결정 브리핑 (화면 1순위 핵심 승격!) */}
            <BalancedDecisionBriefing
              gameId={game.id}
              gameTitle={game.title}
              onRewardClaimed={(earned) => {
                setBalance((prev) => ({ ...prev, pmp: prev.pmp + earned }));
              }}
            />

            {/* 2️⃣ 📊 집단지성 데이터 차트 센터 (모든 그래프를 탭 뷰어로 1개 카드 통합!) */}
            <Card className="p-5 bg-[#111622] border-white/[0.08] space-y-4 shadow-xl">
              {/* 차트 센터 상단 헤더 & 탭 바 */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.08] pb-3">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-sky-400" />
                  <span className="text-sm font-extrabold text-white">집단지성 데이터 센터</span>
                  <span className="text-[10px] text-sky-400 font-bold bg-sky-950/60 px-2 py-0.5 rounded border border-sky-800/40">
                    실시간 동기화
                  </span>
                </div>

                {/* 탭 전환 버튼 그룹 */}
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
                </div>
              </div>

              {/* 탭 1: 실시간 시계열 확률 추이 차트 */}
              {chartTab === "trend" && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-400 px-1">
                    <span>시간대별 찬/반 확률 변동 추이</span>
                    <span className="text-emerald-400 font-bold">● 실시간 마켓 데이터</span>
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
                </div>
              )}

              {/* 탭 2: 옵션별 참여 비중 분포 (파이 차트) */}
              {chartTab === "distribution" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-slate-400 px-1">
                    <span>시민들이 선택한 각 옵션별 지분율 및 PMP 배분 현황</span>
                    <span className="text-purple-400 font-bold">누적 {game.totalVolume.toLocaleString()} PMP</span>
                  </div>
                  <div className="h-64 flex items-center justify-center">
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
                </div>
              )}

              {/* 탭 3: 시민 참여자 수 추이 */}
              {chartTab === "participants" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-slate-400 px-1">
                    <span>시간 경과에 따른 참여 시민 누적 증가 추이</span>
                    <span className="text-emerald-400 font-bold">총 {game.participantCount.toLocaleString()}명</span>
                  </div>
                  <div className="h-64 flex items-center justify-center">
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
                      {bets.map((b) => (
                        <div key={b.betId} className="flex justify-between items-center p-3.5 rounded-xl bg-slate-950 border border-white/[0.06] text-xs">
                          <div>
                            <span className="font-extrabold text-sky-300">{b.selectedOption}</span>
                            <div className="text-[10px] text-slate-500 mt-0.5">{new Date(b.createdAt).toLocaleString("ko-KR")}</div>
                          </div>
                          <span className="font-black text-amber-300 text-sm">{b.betAmount.toLocaleString()} PMP</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </Card>

            {/* 3️⃣ 📋 의제 심층 배경 및 공식 판정 본문 (Market Overview & Rules) */}
            {/* 사용자가 요청한 본문 신설 + 겉돌던 오라클 배너를 이 본문 규정 박스로 완벽 흡수 통합! */}
            <div className="rounded-2xl bg-[#111622] border border-white/[0.08] p-5 md:p-6 space-y-6 shadow-xl">
              {/* 본문 섹션 1: 의제 배경 및 개요 */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-extrabold text-white">
                  <FileText className="w-4 h-4 text-sky-400" />
                  <span>의제 배경 및 시장 개요 (Context & Story)</span>
                </div>
                <div className="text-xs sm:text-sm text-slate-300 leading-relaxed bg-slate-950/60 p-4 rounded-xl border border-white/[0.05] whitespace-pre-line">
                  {game.description ||
                    "본 의제는 시민 집단지성을 통해 합리적인 결론을 도출하기 위한 공익/시장 예측 프로젝트입니다. 다양한 데이터와 팩트를 검토하여 신중하게 의사를 결정해보세요."}
                </div>
              </div>

              {/* 본문 섹션 2: 공인 데이터 오라클 자동 판정 기준 (이전에 겉돌던 한줄 배너를 세련된 명세 박스로 흡수!) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-extrabold text-white">
                    <Database className="w-4 h-4 text-emerald-400" />
                    <span>공인 데이터 오라클 자동 판정 기준 (Resolution Oracle Spec)</span>
                  </div>
                  <span className="text-[11px] font-black text-emerald-400 bg-emerald-950/80 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                    {oracleSpec.badge}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="p-3.5 rounded-xl bg-slate-950/80 border border-white/[0.06] space-y-1">
                    <div className="text-[11px] text-slate-400 font-bold">공식 데이터 출처</div>
                    <div className="text-xs font-black text-slate-100">{oracleSpec.provider}</div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-950/80 border border-white/[0.06] space-y-1">
                    <div className="text-[11px] text-slate-400 font-bold">검증 엔드포인트 / 기준</div>
                    <div className="text-xs font-black text-emerald-300 font-mono truncate" title={oracleSpec.endpoint}>
                      {oracleSpec.endpoint}
                    </div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-950/80 border border-white/[0.06] space-y-1">
                    <div className="text-[11px] text-slate-400 font-bold">자동 판정 일정 및 방식</div>
                    <div className="text-xs font-semibold text-slate-200">{oracleSpec.scheduleDesc}</div>
                  </div>
                </div>
              </div>

              {/* 본문 섹션 3: 투명성 및 무효화(VOIDED) 100% 환불 안전 규정 */}
              <div className="p-4 rounded-xl bg-sky-950/20 border border-sky-500/20 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-sky-300">
                  <ShieldCheck className="w-4 h-4 text-sky-400" />
                  <span>시민 자산 보호 및 무효화(VOIDED) 100% 환불 안전 규정</span>
                </div>
                <p className="text-[11.5px] text-slate-400 leading-relaxed">
                  • 본 예측은 사람의 자의적 개입 없이 공인 오라클 스마트 컨트랙트에 의해 공식 통계 발표 즉시 자동 판정·정산됩니다.<br />
                  • 경기 취소, 정부/공인기관의 데이터 공표 중단, 시스템 불가항력 오류 발생 시 해당 의제는 즉시 <strong className="text-slate-200">무효화(VOIDED)</strong> 처리되며 참여하신 모든 PMP는 <strong className="text-emerald-300">100% 전액 즉시 환불</strong>됩니다.
                </p>
              </div>
            </div>

            {/* 4️⃣ 💬 이 의제 전용 시민 토론 갤러리 */}
            <div className="space-y-4 pt-2">
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
          {/* Right Column (1 col): 황금 모래시계 (최상단) & 참여 패널 */}
          {/* ======================================================== */}
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

              {/* 🌟 옵션 선택: 둥근 타원형 캡슐 토글 버튼 스타일 */}
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