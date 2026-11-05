import { createClient } from "../../lib/supabase/server";
import { ClientPredictionGamesGrid } from "./components/ClientPredictionGamesGrid";
import { getAggregatedPrizePool } from "../../bounded-contexts/prediction/application/prediction-pool.service";
import {
  attachHourlyGamePoolsToRows,
  mapPredictionGameRowToCardModel,
  type PredictionGameRow,
} from "./components/prediction-game-mapper";
import { DomainContextHeader } from "../../shared/ui/components/layout/DomainContextHeader";

export default async function PredictionPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const platformTotalPool = await getAggregatedPrizePool(supabase);

  const { data: games } = await supabase
    .schema("prediction")
    .from("prediction_games")
    .select("category, status")
    .eq("status", "ACTIVE");

  const totalActiveGames = games?.length || 0;

  const { data: recentGames } = await supabase
    .schema("prediction")
    .from("prediction_games")
    .select("*")
    .eq("status", "ACTIVE")
    .order("created_at", { ascending: false })
    .limit(50);

  const recentGameRows = (recentGames ?? []) as PredictionGameRow[];
  const recentGameRowsWithPools = await attachHourlyGamePoolsToRows(
    supabase,
    recentGameRows
  );
  let mappedGames = recentGameRowsWithPools.map(mapPredictionGameRowToCardModel);

  const fallbackGames = [
    {
      id: "game-sample-crypto-1",
      slug: "crypto-bitcoin-100k-usd",
      title: "🪙 비트코인, 이번 주 $120,000 신고점 경신할까?",
      description:
        "글로벌 가상자산 현물 ETF 자금 유입 기조 속 $120,000 사상 최고가 도달 여부 예측입니다.",
      predictionType: "BINARY" as any,
      category: "INVEST",
      options: [
        { id: "opt-yes", text: "돌파 (YES)", currentOdds: 0.74 },
        { id: "opt-no", text: "미달 (NO)", currentOdds: 0.26 },
      ],
      startTime: new Date(),
      endTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      settlementTime: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
      minimumStake: 100,
      maximumStake: 50000,
      currentParticipants: 4120,
      status: "ACTIVE" as any,
      totalStake: 210000,
      gameImportanceScore: 99,
      allocatedPrizePool: 80000,
      createdAt: new Date(),
    },
    {
      id: "game-sample-sports-1",
      slug: "sports-son-goal-score",
      title: "⚽ 손흥민, 이번 주말 리그 경기에서 득점할까?",
      description:
        "주전 공격수 출전이 확정된 주말 프리미어리그 핵심 라운드 손흥민 선수 득점 여부 예측입니다.",
      predictionType: "BINARY" as any,
      category: "SPORTS",
      options: [
        { id: "opt-yes", text: "득점 성공 (YES)", currentOdds: 0.65 },
        { id: "opt-no", text: "무득점 (NO)", currentOdds: 0.35 },
      ],
      startTime: new Date(),
      endTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      settlementTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      minimumStake: 100,
      maximumStake: 10000,
      currentParticipants: 2890,
      status: "ACTIVE" as any,
      totalStake: 95000,
      gameImportanceScore: 96,
      allocatedPrizePool: 30000,
      createdAt: new Date(),
    },
    {
      id: "game-sample-tech-1",
      slug: "tech-openai-new-model-release",
      title: "🤖 오픈AI, 차세대 AI 모델 이번 달 전격 발표할까?",
      description:
        "글로벌 인공지능 시장을 뒤흔들 신규 멀티모달 AI 모델의 이달 발표 여부 예측입니다.",
      predictionType: "BINARY" as any,
      category: "ENTERTAINMENT",
      options: [
        { id: "opt-yes", text: "전격 발표 (YES)", currentOdds: 0.81 },
        { id: "opt-no", text: "발표 미뤄짐 (NO)", currentOdds: 0.19 },
      ],
      startTime: new Date(),
      endTime: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      settlementTime: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000),
      minimumStake: 200,
      maximumStake: 30000,
      currentParticipants: 3540,
      status: "ACTIVE" as any,
      totalStake: 158000,
      gameImportanceScore: 98,
      allocatedPrizePool: 55000,
      createdAt: new Date(),
    },
    {
      id: "game-sample-invest-1",
      slug: "invest-samsung-electronics-q3-earnings",
      title: "📈 삼성전자, 이번 분기 영업이익 12조 원 돌파할까?",
      description: "HBM3E 공급 확대 및 메모리 반도체 실적 발표 결과 예측입니다.",
      predictionType: "BINARY" as any,
      category: "INVEST",
      options: [
        { id: "opt-yes", text: "12조 돌파 (YES)", currentOdds: 0.71 },
        { id: "opt-no", text: "12조 미만 (NO)", currentOdds: 0.29 },
      ],
      startTime: new Date(),
      endTime: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000),
      settlementTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      minimumStake: 500,
      maximumStake: 50000,
      currentParticipants: 3410,
      status: "ACTIVE" as any,
      totalStake: 142000,
      gameImportanceScore: 94,
      allocatedPrizePool: 45000,
      createdAt: new Date(),
    },
    {
      id: "game-sample-entertainment-1",
      slug: "entertainment-movie-boxoffice-10m",
      title: "🎬 올가을 블록버스터 신작, 개봉 첫주 100만 관객 돌파할까?",
      description:
        "사전 예매율 1위를 기록 중인 극장가 흥행 기대작의 첫 주말 관객 수 기록 예측입니다.",
      predictionType: "BINARY" as any,
      category: "ENTERTAINMENT",
      options: [
        { id: "opt-yes", text: "100만 돌파 (YES)", currentOdds: 0.58 },
        { id: "opt-no", text: "100만 미달 (NO)", currentOdds: 0.42 },
      ],
      startTime: new Date(),
      endTime: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
      settlementTime: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
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
      id: "game-sample-politics-1",
      slug: "politics-national-assembly-ai-basic-law",
      title: "🗳️ AI 산업 육성 기본법, 이번 국회 본회의 통과될까?",
      description:
        "국내 인공지능 생태계 지원법안의 이번 회기 국회 본회의 통과 여부 예측입니다.",
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
  ];

  const existingSlugs = new Set(mappedGames.map((g) => g.slug));
  const additionalGames = fallbackGames.filter((g) => !existingSlugs.has(g.slug));
  mappedGames = [...mappedGames, ...additionalGames];

  let userPredictions: Array<{
    prediction_id: string;
    game_id: string;
    bet_amount: number;
    is_active: boolean;
    prediction_data: Record<string, unknown> | null;
  }> = [];

  if (user) {
    const { data: predictions } = await supabase
      .schema("prediction")
      .from("predictions")
      .select("prediction_id, game_id, bet_amount, is_active, prediction_data")
      .eq("user_id", user.id)
      .eq("is_active", true);

    userPredictions = predictions || [];
  }

  return (
    <div className="min-h-screen bg-[#090b12] text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <DomainContextHeader
          domain="prediction"
          title="🎯 Prediction Market · 시민 집단지성 예측"
          subtitle="무위험 참여 자산(PMP)으로 미래 이슈를 예측하고, 적중 시 MoneyWave 상금풀에서 PMC를 획득하세요"
          metrics={[
            {
              label: "MoneyWave 상금풀",
              value: platformTotalPool || 66461,
              unit: "PMC",
            },
            { label: "진행 중 마켓", value: totalActiveGames, unit: "개" },
          ]}
        />

        <section>
          <ClientPredictionGamesGrid
            games={mappedGames}
            userId={user?.id}
            userPredictions={userPredictions}
          />
        </section>
      </div>
    </div>
  );
}
