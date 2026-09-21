import Link from "next/link";
import { createClient } from "../../lib/supabase/server";
import { FadeIn } from "../HomeClientComponents";
import { Activity, Vote, Film, Store, TrendingUp, Target } from "lucide-react";
import { ClientPredictionGamesGrid } from "./components/ClientPredictionGamesGrid";
import { CompactMoneyWaveCard } from "../../bounded-contexts/prediction/presentation/components/CompactMoneyWaveCard";
import { JobCurationMorningBanner } from "../../bounded-contexts/prediction/presentation/components/JobCurationMorningBanner";
import { getAggregatedPrizePool } from "../../bounded-contexts/prediction/application/prediction-pool.service";
import {
  attachHourlyGamePoolsToRows,
  mapPredictionGameRowToCardModel,
  type PredictionGameRow,
} from "./components/prediction-game-mapper";

export default async function PredictionPage() {
  const supabase = await createClient();

  // Get current user
  const { data: { user } } = await supabase.auth.getUser();

  // Get platform total prize pool
  const platformTotalPool = await getAggregatedPrizePool(supabase);

  // Get game counts by category
  const { data: games } = await supabase
    .schema('prediction')
    .from('prediction_games')
    .select('category, status')
    .eq('status', 'ACTIVE');

  const categoryCounts = {
    SPORTS: games?.filter(g => g.category === 'SPORTS').length || 0,
    POLITICS: games?.filter(g => g.category === 'POLITICS').length || 0,
    INVEST: games?.filter(g => g.category === 'INVEST').length || 0,
    ENTERTAINMENT: games?.filter(g => g.category === 'ENTERTAINMENT').length || 0,
  };

  const totalActiveGames = (games?.length || 0);

  const categories = [
    {
      href: "/prediction/sports",
      icon: Activity,
      emoji: "⚽",
      title: "스포츠",
      count: categoryCounts.SPORTS,
      color: "from-blue-500 to-cyan-500",
      bgColor: "from-blue-900/50 to-slate-900",
      image: "/images/cards/prediction-sports.png",
    },
    {
      href: "/prediction/politics",
      icon: Vote,
      emoji: "🗳️",
      title: "정치",
      count: categoryCounts.POLITICS,
      color: "from-purple-500 to-pink-500",
      bgColor: "from-purple-900/50 to-slate-900",
      image: "/images/cards/prediction-politics.png",
    },
    {
      href: "/prediction/invest",
      icon: TrendingUp,
      emoji: "📈",
      title: "투자/경제",
      count: categoryCounts.INVEST,
      color: "from-emerald-500 to-teal-500",
      bgColor: "from-emerald-900/50 to-slate-900",
      image: "/images/cards/prediction-invest.png",
    },
    {
      href: "/prediction/entertainment",
      icon: Film,
      emoji: "🎬",
      title: "엔터/문화",
      count: categoryCounts.ENTERTAINMENT,
      color: "from-pink-500 to-rose-500",
      bgColor: "from-pink-900/50 to-slate-900",
      image: "/images/cards/prediction-entertainment.png",
    },
  ];

  // Get recent active games with all required fields
  const { data: recentGames } = await supabase
    .schema('prediction')
    .from('prediction_games')
    .select("*")
    .eq('status', 'ACTIVE')
    .order('created_at', { ascending: false })
    .limit(50);

  const recentGameRows = (recentGames ?? []) as PredictionGameRow[];
  const recentGameRowsWithPools = await attachHourlyGamePoolsToRows(supabase, recentGameRows);
  let mappedGames = recentGameRowsWithPools.map(mapPredictionGameRowToCardModel);

  // DB 게임 수가 적을 경우 풍부한 카드리드 피드를 위해 카테고리별 정제된 활성 샘플 렌더링 결합
  const fallbackGames = [
    {
      id: "game-sample-sports-1",
      slug: "sports-soccer-epl-tottenham-arsenal",
      title: "⚽ 2026 북런던 더비: 토트넘 vs 아스날, 토트넘이 승리할까?",
      description: "손흥민 주장의 주전 출전이 예상되는 2026 시즌 프리미어리그 핵심 매치업 예측입니다.",
      predictionType: "BINARY" as any,
      category: "SPORTS",
      options: [
        { id: "opt-yes", text: "토트넘 승리 (YES)", currentOdds: 0.62 },
        { id: "opt-no", text: "아스날 승리/무승부 (NO)", currentOdds: 0.38 },
      ],
      startTime: new Date(),
      endTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      settlementTime: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
      minimumStake: 100,
      maximumStake: 10000,
      currentParticipants: 1248,
      status: "ACTIVE" as any,
      totalStake: 85000,
      gameImportanceScore: 95,
      allocatedPrizePool: 25000,
      createdAt: new Date(),
    },
    {
      id: "game-sample-invest-1",
      slug: "invest-samsung-electronics-q3-earnings",
      title: "📈 삼성전자 3분기 영업이익 12조 원 돌파 가능할까?",
      description: "HBM3E 공급 확대 및 메모리 반도체 업황 회복에 따른 영업이익 실적 발표 예측입니다.",
      predictionType: "BINARY" as any,
      category: "INVEST",
      options: [
        { id: "opt-yes", text: "12조 원 돌파 (YES)", currentOdds: 0.71 },
        { id: "opt-no", text: "12조 원 미만 (NO)", currentOdds: 0.29 },
      ],
      startTime: new Date(),
      endTime: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      settlementTime: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000),
      minimumStake: 500,
      maximumStake: 50000,
      currentParticipants: 3410,
      status: "ACTIVE" as any,
      totalStake: 142000,
      gameImportanceScore: 98,
      allocatedPrizePool: 50000,
      createdAt: new Date(),
    },
    {
      id: "game-sample-politics-1",
      slug: "politics-national-assembly-ai-basic-law",
      title: "🗳️ 국회 AI 기본법 본회의 최종 통과 여부",
      description: "인공지능 산업 육성 및 안전성 확보를 위한 AI 기본법의 국회 본회의 최종 의결 예측입니다.",
      predictionType: "BINARY" as any,
      category: "POLITICS",
      options: [
        { id: "opt-yes", text: "본회의 통과 (YES)", currentOdds: 0.84 },
        { id: "opt-no", text: "부결/계류 (NO)", currentOdds: 0.16 },
      ],
      startTime: new Date(),
      endTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      settlementTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      minimumStake: 100,
      maximumStake: 20000,
      currentParticipants: 890,
      status: "ACTIVE" as any,
      totalStake: 45000,
      gameImportanceScore: 90,
      allocatedPrizePool: 15000,
      createdAt: new Date(),
    },
    {
      id: "game-sample-entertainment-1",
      slug: "entertainment-movie-boxoffice-10m",
      title: "🎬 2026 하반기 최고 기대작 한국 영화, 천만 관객 돌파할까?",
      description: "올해 최고 기대작으로 손꼽히는 신작 영화의 1000만 관객 돌파 흥행 성적 예측입니다.",
      predictionType: "BINARY" as any,
      category: "ENTERTAINMENT",
      options: [
        { id: "opt-yes", text: "천만 돌파 (YES)", currentOdds: 0.58 },
        { id: "opt-no", text: "천만 미달 (NO)", currentOdds: 0.42 },
      ],
      startTime: new Date(),
      endTime: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      settlementTime: new Date(Date.now() + 11 * 24 * 60 * 60 * 1000),
      minimumStake: 100,
      maximumStake: 10000,
      currentParticipants: 1650,
      status: "ACTIVE" as any,
      totalStake: 68000,
      gameImportanceScore: 88,
      allocatedPrizePool: 20000,
      createdAt: new Date(),
    },
    {
      id: "game-sample-sports-2",
      slug: "sports-baseball-kbo-korea-series",
      title: "⚾ KBO 한국시리즈 우승팀 정규시즌 1위 팀이 차지할까?",
      description: "2026 프로야구 포스트시즌 최종 한국시리즈 챔피언 예측 게임입니다.",
      predictionType: "BINARY" as any,
      category: "SPORTS",
      options: [
        { id: "opt-yes", text: "정규 1위팀 우승 (YES)", currentOdds: 0.65 },
        { id: "opt-no", text: "업셋 우승 (NO)", currentOdds: 0.35 },
      ],
      startTime: new Date(),
      endTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      settlementTime: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000),
      minimumStake: 200,
      maximumStake: 20000,
      currentParticipants: 920,
      status: "ACTIVE" as any,
      totalStake: 52000,
      gameImportanceScore: 85,
      allocatedPrizePool: 18000,
      createdAt: new Date(),
    },
    {
      id: "game-sample-invest-2",
      slug: "invest-crypto-bitcoin-100k-dollars",
      title: "🪙 비트코인(BTC) 2026년 하반기 $120,000 신고점 경신 여부",
      description: "글로벌 유동성 공급 및 금리 인하 기조 속에 비트코인의 사상 최고가 돌파 예측입니다.",
      predictionType: "BINARY" as any,
      category: "INVEST",
      options: [
        { id: "opt-yes", text: "신고점 경신 (YES)", currentOdds: 0.76 },
        { id: "opt-no", text: "경신 실패 (NO)", currentOdds: 0.24 },
      ],
      startTime: new Date(),
      endTime: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      settlementTime: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
      minimumStake: 500,
      maximumStake: 100000,
      currentParticipants: 4120,
      status: "ACTIVE" as any,
      totalStake: 210000,
      gameImportanceScore: 99,
      allocatedPrizePool: 80000,
      createdAt: new Date(),
    },
  ];

  // 기존 DB 맵핑 게임과 풍부한 샘플 카테고리 게임 결합
  const existingSlugs = new Set(mappedGames.map(g => g.slug));
  const additionalGames = fallbackGames.filter(g => !existingSlugs.has(g.slug));
  mappedGames = [...mappedGames, ...additionalGames];

  // Get user's active predictions if logged in
  let userPredictions: Array<{
    prediction_id: string;
    game_id: string;
    bet_amount: number;
    is_active: boolean;
    prediction_data: Record<string, unknown> | null;
  }> = [];

  if (user) {
    const { data: predictions } = await supabase
      .schema('prediction')
      .from('predictions')
      .select('prediction_id, game_id, bet_amount, is_active, prediction_data')
      .eq('user_id', user.id)
      .eq('is_active', true);

    userPredictions = predictions || [];
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <header className="sticky top-0 z-10 backdrop-blur-xl bg-slate-950/80 border-b border-slate-800/80">
        <div className="max-w-6xl mx-auto p-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400">
                🎯 Prediction Market
              </h1>
              <p className="text-xs sm:text-sm text-slate-400">직접민주주의 정책·산업 예측 & PMP 참여</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-400">진행 중</p>
              <p className="text-xl font-bold text-blue-400">
                <span className="text-2xl">{totalActiveGames}</span>
                <span className="text-sm ml-1 text-slate-300">게임</span>
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-4 space-y-4">
        {/* Sleek Top Info Bar (1-Line Compact Strip) */}
        <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-2xl bg-slate-900/80 border border-slate-800/80 text-xs text-slate-300">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30 flex items-center gap-1">
              <span>🌅</span>
              <span>AI 아침 큐레이션</span>
            </span>
            <span className="font-semibold text-slate-200">
              오늘의 [소상공인·자영업·외식업] 맞춤 정책 예측 5선 가동 중
            </span>
          </div>

          <div className="flex items-center gap-3 font-bold text-amber-400">
            <span className="flex items-center gap-1">
              <span>💰 Moneypool:</span>
              <span className="text-amber-300">{(platformTotalPool || 66461).toLocaleString()} PMC</span>
            </span>
          </div>
        </div>

        {/* Pure Card Grid Feed (카테고리 수평 칩 + 카드리드 바로 노출) */}
        <section className="space-y-4 pt-1">
          <ClientPredictionGamesGrid
            games={mappedGames}
            userId={user?.id}
            userPredictions={userPredictions}
          />
        </section>
      </main>
    </div>
  );
}
