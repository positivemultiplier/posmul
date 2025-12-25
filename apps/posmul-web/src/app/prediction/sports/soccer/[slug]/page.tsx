/**
 * Individual Soccer Prediction Game Detail Page
 *
 * PredictionDetailView + PredictionChartView 컴포넌트를 사용한 고급 상세페이지
 * Binary, WDL, Ranking 예측 타입을 모두 지원하며 실시간 차트 분석 기능 포함
 *
 * @author PosMul Development Team
 * @since 2024-12
 */
import { notFound } from "next/navigation";
import { getPredictionGameBySlug, getPredictionGameStats, parseGameOptions } from "../../../../../bounded-contexts/public/infrastructure/repositories/prediction.repository";
import { SoccerPredictionDetailClient } from "./client";
import { getUserBalance, getUserBets } from "./actions";

type PredictionTypeView = "binary" | "wdl" | "ranking";
type GameStatusView = "ACTIVE" | "ENDED" | "SETTLED";

type GameRow = NonNullable<Awaited<ReturnType<typeof getPredictionGameBySlug>>>;
type GameStats = Awaited<ReturnType<typeof getPredictionGameStats>>;
type ParsedOption = ReturnType<typeof parseGameOptions>[number];

const DEFAULT_OPTIONS: ParsedOption[] = [
  { id: "yes", label: "예", currentOdds: 0.55 },
  { id: "no", label: "아니오", currentOdds: 0.45 },
];

function decodeSlug(slug: string) {
  return decodeURIComponent(slug);
}

function toPredictionTypeView(raw: string | null | undefined): PredictionTypeView {
  const normalized = raw?.toLowerCase();
  if (normalized === "binary") return "binary";
  if (normalized === "wdl") return "wdl";
  return "ranking";
}

function toGameStatusView(raw: string | null | undefined): GameStatusView {
  if (raw === "ACTIVE") return "ACTIVE";
  if (raw === "ENDED") return "ENDED";
  return "SETTLED";
}

function toIsoOrFuture(raw: string | null | undefined, futureDays: number) {
  if (raw) return new Date(raw).toISOString();
  return new Date(Date.now() + futureDays * 24 * 60 * 60 * 1000).toISOString();
}

function getGameOptions(options: ParsedOption[]) {
  return options.length > 0 ? options : DEFAULT_OPTIONS;
}

function getUserBalanceOrDefault(balanceResult: Awaited<ReturnType<typeof getUserBalance>>) {
  return balanceResult || { pmp: 0, pmc: 0 };
}

function buildGameForView(game: GameRow, stats: GameStats, gameOptions: ParsedOption[]) {
  const totalBetAmount = stats?.total_bet_amount ?? 0;
  const volumePerOption = gameOptions.length > 0 ? Math.floor(totalBetAmount / gameOptions.length) : 10000;

  return {
    id: game.game_id,
    title: game.title || "제목 없음",
    description: game.description || "",
    predictionType: toPredictionTypeView(game.prediction_type),
    options: gameOptions.map(
      (opt: { id: string; label: string; currentOdds?: number }, idx: number) => ({
        id: opt.id || `option-${idx}`,
        label: opt.label || `옵션 ${idx + 1}`,
        probability: opt.currentOdds || 0.5,
        odds: opt.currentOdds && opt.currentOdds > 0 ? 1 / opt.currentOdds : 2.0,
        volume: totalBetAmount ? volumePerOption : 10000,
        change24h: idx % 2 === 0 ? 2.5 : -1.3, // 일관된 Mock 데이터
      })
    ),
    totalVolume: totalBetAmount,
    participantCount: stats?.total_participants || 0,
    endTime: toIsoOrFuture(game.registration_end, 7),
    settlementTime: toIsoOrFuture(game.settlement_date, 14),
    status: toGameStatusView(game.status),
    category: game.category || "스포츠",
    creator: {
      name: "축구분석가",
      reputation: 4.7,
      avatar: "⚽",
    },
    prizePool:
      game.allocated_prize_pool ||
      (totalBetAmount ? Math.floor(totalBetAmount * 0.5) : 50000),
    minimumStake: game.min_bet_amount || 1000,
    maximumStake: game.max_bet_amount || 50000,
  } as const;
}

interface PredictionDetailPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function PredictionDetailPage({
  params,
}: PredictionDetailPageProps) {
  const { slug } = await params;
  const decodedSlug = decodeSlug(slug);
  const game = await getPredictionGameBySlug(decodedSlug);

  if (!game) {
    notFound();
  }

  const stats = await getPredictionGameStats(game.game_id);
  const parsedOptions = parseGameOptions(game.game_options);

  // 실제 사용자 잔액 조회 (로그인하지 않은 경우 기본값)
  const balanceResult = await getUserBalance();
  const userBalance = getUserBalanceOrDefault(balanceResult);

  // 사용자의 기존 베팅 내역 조회
  const userBets = await getUserBets(game.game_id);

  const gameOptions = getGameOptions(parsedOptions);
  const gameForView = buildGameForView(game, stats, gameOptions);

  return (
    <SoccerPredictionDetailClient
      game={gameForView}
      userBalance={userBalance}
      userBets={userBets}
      slug={decodedSlug}
    />
  );
}
