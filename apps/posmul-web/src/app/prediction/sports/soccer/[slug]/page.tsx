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

interface PredictionDetailPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function PredictionDetailPage({
  params,
}: PredictionDetailPageProps) {
  const { slug } = await params;
  // URL 인코딩된 한글 slug 디코딩
  const decodedSlug = decodeURIComponent(slug);
  const game = await getPredictionGameBySlug(decodedSlug);

  if (!game) {
    notFound();
  }

  const stats = await getPredictionGameStats(game.game_id);
  const options = parseGameOptions(game.game_options);

  // 실제 사용자 잔액 조회 (로그인하지 않은 경우 기본값)
  const balanceResult = await getUserBalance();
  const userBalance = balanceResult || { pmp: 0, pmc: 0 };

  // 사용자의 기존 베팅 내역 조회
  const userBets = await getUserBets(game.game_id);

  // 옵션이 없는 경우 기본 옵션 생성 (Binary 타입 기준)
  const defaultOptions = [
    { id: "yes", label: "예", currentOdds: 0.55 },
    { id: "no", label: "아니오", currentOdds: 0.45 },
  ];

  const gameOptions = options.length > 0 ? options : defaultOptions;

  // DB 데이터를 PredictionDetailView 컴포넌트가 필요로 하는 형식으로 변환
  // Date 객체는 ISO 문자열로 직렬화하여 클라이언트에서 다시 파싱
  const gameForView = {
    id: game.game_id,
    title: game.title || "제목 없음",
    description: game.description || "",
    predictionType: (game.prediction_type?.toLowerCase() === "binary"
      ? "binary"
      : game.prediction_type?.toLowerCase() === "wdl"
        ? "wdl"
        : "ranking") as "binary" | "wdl" | "ranking",
    options: gameOptions.map((opt: { id: string; label: string; currentOdds?: number }, idx: number) => ({
      id: opt.id || `option-${idx}`,
      label: opt.label || `옵션 ${idx + 1}`,
      probability: opt.currentOdds || 0.5,
      odds: opt.currentOdds && opt.currentOdds > 0 ? 1 / opt.currentOdds : 2.0,
      volume: stats?.total_bet_amount ? Math.floor(stats.total_bet_amount / gameOptions.length) : 10000,
      change24h: (idx % 2 === 0 ? 2.5 : -1.3), // 일관된 Mock 데이터
    })),
    totalVolume: stats?.total_bet_amount || 0,
    participantCount: stats?.total_participants || 0,
    // ISO 문자열로 전달하여 클라이언트에서 Date로 파싱
    endTime: game.registration_end
      ? new Date(game.registration_end).toISOString()
      : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    settlementTime: game.settlement_date
      ? new Date(game.settlement_date).toISOString()
      : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    status: (game.status === "ACTIVE" ? "ACTIVE" : game.status === "ENDED" ? "ENDED" : "SETTLED") as "ACTIVE" | "ENDED" | "SETTLED",
    category: game.category || "스포츠",
    creator: {
      name: "축구분석가",
      reputation: 4.7,
      avatar: "⚽",
    },
    prizePool: game.allocated_prize_pool || (stats?.total_bet_amount ? Math.floor(stats.total_bet_amount * 0.5) : 50000),
    minimumStake: game.min_bet_amount || 1000,
    maximumStake: game.max_bet_amount || 50000,
  };

  return (
    <SoccerPredictionDetailClient
      game={gameForView}
      userBalance={userBalance}
      userBets={userBets}
      slug={decodedSlug}
    />
  );
}
