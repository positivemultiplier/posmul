/**
 * Universal Prediction Game Detail Page
 * 모든 예측 카드를 클릭했을 때 이동하는 범용 상세페이지 라우트 (/prediction/[slug])
 */

import { getPredictionGameBySlug, getPredictionGameStats, parseGameOptions } from "@/bounded-contexts/prediction/infrastructure/repositories/prediction-query.repository";
import { UniversalPredictionDetailClient } from "./client";
import { getUserBalance, getUserBets } from "../sports/soccer/[slug]/actions";

function decodeSlug(slug: string) {
  return decodeURIComponent(slug);
}

// 샘플 게임 데이터 맵 (DB에 없을 경우 폴백 처리)
const SAMPLE_GAMES_MAP: Record<string, any> = {
  "sports-soccer-epl-tottenham-arsenal": {
    id: "game-sample-sports-1",
    title: "⚽ 2026 북런던 더비: 토트넘 vs 아스날, 토트넘이 승리할까?",
    description: "손흥민 주장의 주전 출전이 예상되는 2026 시즌 프리미어리그 핵심 매치업 예측입니다. 양 팀의 최근 5경기 상대 전적과 팀 전력을 종합 분석해보세요.",
    predictionType: "binary",
    category: "스포츠",
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
  "invest-samsung-electronics-q3-earnings": {
    id: "game-sample-invest-1",
    title: "📈 삼성전자 3분기 영업이익 12조 원 돌파 가능할까?",
    description: "HBM3E 공급 확대 및 메모리 반도체 업황 회복에 따른 영업이익 실적 발표 예측입니다.",
    predictionType: "binary",
    category: "투자/경제",
    options: [
      { id: "opt-yes", label: "12조 원 돌파 (YES)", probability: 0.71, odds: 1.41, volume: 98000, change24h: 5.2 },
      { id: "opt-no", label: "12조 원 미만 (NO)", probability: 0.29, odds: 3.44, volume: 44000, change24h: -5.2 },
    ],
    totalVolume: 142000,
    participantCount: 3410,
    minimumStake: 500,
    maximumStake: 50000,
    endTime: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    settlementTime: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString(),
    status: "ACTIVE",
    creator: { name: "반도체애널리스트", reputation: 4.8, avatar: "📈" },
    prizePool: 50000,
  },
  "politics-national-assembly-ai-basic-law": {
    id: "game-sample-politics-1",
    title: "🗳️ 국회 AI 기본법 본회의 최종 통과 여부",
    description: "인공지능 산업 육성 및 안전성 확보를 위한 AI 기본법의 국회 본회의 최종 의결 예측입니다.",
    predictionType: "binary",
    category: "정치/선거",
    options: [
      { id: "opt-yes", label: "본회의 통과 (YES)", probability: 0.84, odds: 1.19, volume: 38000, change24h: 1.2 },
      { id: "opt-no", label: "부결/계류 (NO)", probability: 0.16, odds: 6.25, volume: 7000, change24h: -1.2 },
    ],
    totalVolume: 45000,
    participantCount: 890,
    minimumStake: 100,
    maximumStake: 20000,
    endTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    settlementTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    status: "ACTIVE",
    creator: { name: "입법이슈분석가", reputation: 4.7, avatar: "🗳️" },
    prizePool: 15000,
  },
  "entertainment-movie-boxoffice-10m": {
    id: "game-sample-entertainment-1",
    title: "🎬 2026 하반기 최고 기대작 한국 영화, 천만 관객 돌파할까?",
    description: "올해 최고 기대작으로 손꼽히는 신작 영화의 1000만 관객 돌파 흥행 성적 예측입니다.",
    predictionType: "binary",
    category: "엔터테인먼트",
    options: [
      { id: "opt-yes", label: "천만 돌파 (YES)", probability: 0.58, odds: 1.72, volume: 42000, change24h: 2.1 },
      { id: "opt-no", label: "천만 미달 (NO)", probability: 0.42, odds: 2.38, volume: 26000, change24h: -2.1 },
    ],
    totalVolume: 68000,
    participantCount: 1650,
    minimumStake: 100,
    maximumStake: 10000,
    endTime: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
    settlementTime: new Date(Date.now() + 11 * 24 * 60 * 60 * 1000).toISOString(),
    status: "ACTIVE",
    creator: { name: "영화비평가", reputation: 4.6, avatar: "🎬" },
    prizePool: 20000,
  }
};

interface PredictionDetailPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function PredictionDetailPage({ params }: PredictionDetailPageProps) {
  const { slug } = await params;
  const decodedSlug = decodeSlug(slug);

  // 1. DB에서 게임 조회
  const dbGame = await getPredictionGameBySlug(decodedSlug);
  let gameForView = null;

  if (dbGame) {
    const stats = await getPredictionGameStats(dbGame.game_id);
    const parsedOptions = parseGameOptions(dbGame.game_options);
    const totalBetAmount = stats?.total_bet_amount ?? 0;

    gameForView = {
      id: dbGame.game_id,
      title: dbGame.title || "제목 없음",
      description: dbGame.description || "",
      predictionType: (dbGame.prediction_type?.toLowerCase() || "binary") as any,
      options: (parsedOptions.length > 0 ? parsedOptions : [{ id: "yes", label: "예", currentOdds: 0.5 }, { id: "no", label: "아니오", currentOdds: 0.5 }]).map((opt: any, idx: number) => ({
        id: opt.id || `option-${idx}`,
        label: opt.label || `옵션 ${idx + 1}`,
        probability: opt.currentOdds || 0.5,
        odds: opt.currentOdds && opt.currentOdds > 0 ? 1 / opt.currentOdds : 2.0,
        volume: totalBetAmount ? Math.floor(totalBetAmount / 2) : 10000,
        change24h: 2.0,
      })),
      totalVolume: totalBetAmount || 50000,
      participantCount: stats?.total_participants || 10,
      endTime: dbGame.registration_end || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      settlementTime: dbGame.settlement_date || new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toISOString(),
      status: (dbGame.status || "ACTIVE") as any,
      category: dbGame.category || "예측",
      createdAt: dbGame.created_at || new Date().toISOString(),
      creator: { name: "PosMul AI 분석가", reputation: 4.9, avatar: "🎯" },
      prizePool: dbGame.allocated_prize_pool || 30000,
      minimumStake: dbGame.min_bet_amount || 100,
      maximumStake: dbGame.max_bet_amount || 50000,
    };
  } else if (SAMPLE_GAMES_MAP[decodedSlug]) {
    gameForView = SAMPLE_GAMES_MAP[decodedSlug];
  } else {
    // 일반 fallback 게임 동적 생성
    gameForView = {
      id: `game-fallback-${decodedSlug}`,
      title: decodedSlug.replace(/-/g, " ").toUpperCase(),
      description: "PosMul 집단지성 시민 의사결정 예측 게임입니다. PMP를 사용하여 소신 있게 의사결정에 참여해보세요.",
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
      createdAt: new Date().toISOString(),
      creator: { name: "PosMul 오라클", reputation: 4.9, avatar: "🔮" },
      prizePool: 35000,
    };
  }

  // 사용자 잔액 및 기존 베팅 조회
  const balanceResult = await getUserBalance();
  const userBalance = balanceResult || { pmp: 1000, pmc: 500 };
  const userBets = gameForView ? await getUserBets(gameForView.id) : [];

  return (
    <UniversalPredictionDetailClient
      game={gameForView}
      userBalance={userBalance}
      userBets={userBets}
      slug={decodedSlug}
    />
  );
}
