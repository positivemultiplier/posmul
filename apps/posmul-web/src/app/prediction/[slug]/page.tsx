/**
 * Universal Prediction Game Detail Page
 * 모든 예측 카드를 클릭했을 때 이동하는 범용 상세페이지 라우트 (/prediction/[slug])
 */

import { createClient } from "@/lib/supabase/server";
import {
  getPredictionGameBySlug,
  getPredictionGameStats,
  parseGameOptions,
} from "@/bounded-contexts/prediction/infrastructure/repositories/prediction-query.repository";
import {
  findLiveRoomByGame,
  findLiveRoomByKeyword,
} from "@/app/live/live-rooms.data";
import {
  attachHourlyGamePoolsToRows,
  type PredictionGameRow,
} from "../components/prediction-game-mapper";
import { UniversalPredictionDetailClient } from "./client";
import { getUserBalance, getUserBets } from "../sports/soccer/[slug]/actions";

export const revalidate = 10;

function decodeSlug(slug: string) {
  return decodeURIComponent(slug);
}

// 샘플 게임 데이터 맵 (DB에 없을 경우 폴백 처리)
const SAMPLE_GAMES_MAP: Record<string, any> = {
  "sports-soccer-epl-tottenham-arsenal": {
    id: "game-sample-sports-1",
    title: "⚽ 2026 북런던 더비: 토트넘 vs 아스날, 토트넘이 승리할까?",
    description:
      "손흥민 주장의 주전 출전이 예상되는 2026 시즌 프리미어리그 핵심 매치업 예측입니다. 양 팀의 최근 5경기 상대 전적과 팀 전력을 종합 분석해보세요.",
    predictionType: "binary",
    category: "스포츠",
    dataSource: "football_data",
    settlementType: "auto",
    options: [
      { id: "opt-yes", label: "토트넘 승리 (YES)", probability: 0.62, odds: 1.61, volume: 55000, change24h: 3.5 },
      { id: "opt-no", label: "아스날 승리/무승부 (NO)", probability: 0.38, odds: 2.63, volume: 30000, change24h: -3.5 },
    ],
    totalVolume: 85000,
    participantCount: 1248,
    minimumStake: 100,
    maximumStake: 10000,
    endTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    settlementTime: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
    status: "ACTIVE",
    creator: { name: "스포츠오라클", reputation: 4.9, avatar: "⚽" },
    prizePool: 25000,
  },
};

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

  // 1. DB에서 게임 및 사용자 잔액을 병렬 조회
  const [dbGame, balanceResult, supabase] = await Promise.all([
    getPredictionGameBySlug(decodedSlug),
    getUserBalance(),
    createClient(),
  ]);

  let gameForView = null;
  let userBets: any[] = [];

  if (dbGame) {
    // 게임 통계, 유저 베팅 내역, 3단계 MoneyWave 부스트 풀을 병렬 조회
    const [stats, fetchedBets, boostedRows] = await Promise.all([
      getPredictionGameStats(dbGame.game_id),
      getUserBets(dbGame.game_id),
      attachHourlyGamePoolsToRows(supabase, [dbGame as PredictionGameRow]),
    ]);
    userBets = fetchedBets;
    const boostedGame = boostedRows[0] || dbGame;

    const parsedOptions = parseGameOptions(boostedGame.game_options);
    const totalBetAmount =
      Number(boostedGame.total_stake_amount) ||
      Number(stats?.total_bet_amount) ||
      45000;
    const totalParticipants =
      Number(boostedGame.total_participants_count) ||
      Number(stats?.total_participants) ||
      24;

    const matchedLiveRoom =
      findLiveRoomByGame(dbGame.game_id) ||
      findLiveRoomByGame(dbGame.slug) ||
      findLiveRoomByKeyword(dbGame.title) ||
      findLiveRoomByKeyword(dbGame.slug) ||
      findLiveRoomByKeyword(dbGame.category);

    gameForView = {
      id: dbGame.game_id,
      title: dbGame.title || "제목 없음",
      description: dbGame.description || "",
      predictionType: (dbGame.prediction_type?.toLowerCase() || "binary") as any,
      options: (
        parsedOptions.length > 0
          ? parsedOptions
          : [
              { id: "yes", label: "예", currentOdds: 0.5 },
              { id: "no", label: "아니오", currentOdds: 0.5 },
            ]
      ).map((opt: any, idx: number) => {
        const prob =
          typeof opt.currentOdds === "number" && opt.currentOdds <= 1
            ? opt.currentOdds
            : idx === 0
              ? 0.62
              : 0.38;
        return {
          id: opt.id || `option-${idx}`,
          label: opt.label || opt.text || `옵션 ${idx + 1}`,
          probability: prob,
          odds: prob > 0 ? 1 / prob : 2.0,
          volume: Math.round(totalBetAmount * prob),
          change24h: idx === 0 ? 2.4 : -2.4,
        };
      }),
      totalVolume: totalBetAmount,
      participantCount: totalParticipants,
      endTime:
        dbGame.registration_end ||
        new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      settlementTime:
        dbGame.settlement_date ||
        new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toISOString(),
      status: (dbGame.status || "ACTIVE") as any,
      category: dbGame.category || "예측",
      subcategory: dbGame.subcategory || undefined,
      dataSource: dbGame.data_source || "kosis",
      externalId: dbGame.external_id || undefined,
      settlementType: dbGame.settlement_type || "auto",
      liveRoom: matchedLiveRoom
        ? {
            id: matchedLiveRoom.id,
            title: matchedLiveRoom.title,
            viewerCount: matchedLiveRoom.viewerCount,
            statusText: matchedLiveRoom.matchScore?.statusText || "LIVE 진행 중",
          }
        : undefined,
      createdAt: dbGame.created_at || new Date().toISOString(),
      creator: { name: "PosMul 공인 오라클", reputation: 4.9, avatar: "🏛️" },
      prizePool: Math.round(Number(boostedGame.allocated_prize_pool) || 25000),
      minimumStake: Number(dbGame.min_bet_amount) || 100,
      maximumStake: Number(dbGame.max_bet_amount) || 50000,
    };
  } else if (SAMPLE_GAMES_MAP[decodedSlug]) {
    gameForView = SAMPLE_GAMES_MAP[decodedSlug];
    const fallbackLive =
      findLiveRoomByGame(gameForView.id) ||
      findLiveRoomByGame(decodedSlug) ||
      findLiveRoomByKeyword(gameForView.title) ||
      findLiveRoomByKeyword(decodedSlug);
    if (fallbackLive) {
      gameForView.liveRoom = {
        id: fallbackLive.id,
        title: fallbackLive.title,
        viewerCount: fallbackLive.viewerCount,
        statusText: fallbackLive.matchScore?.statusText || "LIVE 진행 중",
      };
    }
    userBets = await getUserBets(gameForView.id);
  } else {
    const fallbackLive =
      findLiveRoomByGame(decodedSlug) ||
      findLiveRoomByKeyword(decodedSlug);
    gameForView = {
      id: `game-fallback-${decodedSlug}`,
      title: decodedSlug.replace(/-/g, " ").toUpperCase(),
      description:
        "PosMul 집단지성 시민 의사결정 예측 게임입니다. PMP를 사용하여 소신 있게 의사결정에 참여해보세요.",
      predictionType: "binary" as any,
      options: [
        { id: "yes", label: "찬성 / 성공 (YES)", probability: 0.65, odds: 1.53, volume: 45000, change24h: 1.5 },
        { id: "no", label: "반대 / 실패 (NO)", probability: 0.35, odds: 2.85, volume: 25000, change24h: -1.5 },
      ],
      totalVolume: 70000,
      participantCount: 840,
      minimumStake: 100,
      maximumStake: 20000,
      endTime: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
      settlementTime: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString(),
      status: "ACTIVE" as any,
      category: "이슈 예측",
      dataSource: "manual",
      settlementType: "auto",
      liveRoom: fallbackLive
        ? {
            id: fallbackLive.id,
            title: fallbackLive.title,
            viewerCount: fallbackLive.viewerCount,
            statusText: fallbackLive.matchScore?.statusText || "LIVE 진행 중",
          }
        : undefined,
      createdAt: new Date().toISOString(),
      creator: { name: "PosMul 오라클", reputation: 4.9, avatar: "🔮" },
      prizePool: 35000,
    };
  }

  const userBalance = balanceResult || { pmp: 1000, pmc: 500 };

  return (
    <UniversalPredictionDetailClient
      game={gameForView}
      userBalance={userBalance}
      userBets={userBets}
      slug={decodedSlug}
    />
  );
}
