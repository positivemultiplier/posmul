/**
 * Universal Prediction Game Detail Page
 * 모든 예측 카드를 클릭했을 때 이동하는 범용 상세페이지 라우트 (/prediction/[slug])
 * 공통 데이터 빌더(fetchPredictionDetailDataBySlug)와 통합하여 모든 카테고리와 단일 소스 유지
 */

import {
  findLiveRoomByGame,
  findLiveRoomByKeyword,
} from "@/app/live/live-rooms.data";
import { fetchPredictionDetailDataBySlug } from "../components/prediction-detail-by-slug";
import {
  UniversalPredictionDetailClient,
  type PredictionGameDetail,
} from "./client";
import { getUserBalance, getUserBets } from "../sports/soccer/[slug]/actions";

export const revalidate = 10;

function decodeSlug(slug: string) {
  return decodeURIComponent(slug);
}

// 샘플 게임 데이터 맵 (DB에 없을 경우 폴백 처리)
const SAMPLE_GAMES_MAP: Record<string, PredictionGameDetail> = {
  "sports-soccer-epl-tottenham-arsenal": {
    id: "game-sample-sports-1",
    title: "⚽ 2026 북런던 더비: 토트넘 vs 아스날, 최종 경기 결과는?",
    description:
      "손흥민 주장의 주전 출전이 예상되는 2026 시즌 프리미어리그 핵심 매치업 승무패 예측입니다. 양 팀의 최근 5경기 상대 전적과 홈/원정 전력을 종합 분석해보세요.",
    predictionType: "wdl",
    category: "스포츠",
    subcategory: "soccer",
    dataSource: "football_data",
    settlementType: "auto",
    options: [
      { id: "opt-home", label: "토트넘 승리 (홈)", description: "90분 정규시간 토트넘 승", probability: 0.45, odds: 2.22, volume: 45000, change24h: 3.5 },
      { id: "opt-draw", label: "무승부 (Draw)", description: "양 팀 동점 종료", probability: 0.27, odds: 3.70, volume: 27000, change24h: -0.5 },
      { id: "opt-away", label: "아스날 승리 (원정)", description: "90분 정규시간 아스날 승", probability: 0.28, odds: 3.57, volume: 28000, change24h: -3.0 },
    ],
    totalVolume: 100000,
    participantCount: 1248,
    minimumStake: 100,
    maximumStake: 10000,
    endTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    settlementTime: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
    status: "ACTIVE",
    creator: { name: "스포츠오라클", reputation: 4.9, avatar: "⚽" },
    prizePool: 25000,
  },
  "ranking-kpop-yearly-award-2026": {
    id: "game-sample-ranking-1",
    title: "🏆 [2026 가요대전] 올해의 디지털 음원 대상 1위 수상자는?",
    description:
      "써클차트·멜론 연간 스트리밍 지수와 심사위원 점수를 합산해 선정하는 연말 최고 영예 대상 1위 아티스트를 예측해보세요.",
    predictionType: "ranking",
    category: "엔터테인먼트",
    subcategory: "music",
    dataSource: "kcontent",
    settlementType: "auto",
    options: [
      { id: "cand-rose", label: "로제 & 브루노 마스 (APT.)", description: "글로벌 메가 히트 스트리밍 1위", probability: 0.38, odds: 2.63, volume: 54000, change24h: 4.2 },
      { id: "cand-aespa", label: "에스파 (Whiplash / Supernova)", description: "연간 음원·음반 압도적 지표", probability: 0.29, odds: 3.45, volume: 41000, change24h: 1.5 },
      { id: "cand-newjeans", label: "뉴진스 (NewJeans)", description: "탄탄한 팬덤 및 음원 최상위", probability: 0.16, odds: 6.25, volume: 22000, change24h: -2.1 },
      { id: "cand-day6", label: "DAY6 (데이식스)", description: "역주행·정주행 음원 차트 강자", probability: 0.11, odds: 9.09, volume: 15000, change24h: 0.8 },
      { id: "cand-iu", label: "아이유 (IU)", description: "국민 음원 퀸 저력", probability: 0.06, odds: 16.6, volume: 8000, change24h: -1.4 },
    ],
    totalVolume: 140000,
    participantCount: 2150,
    minimumStake: 100,
    maximumStake: 20000,
    endTime: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
    settlementTime: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000).toISOString(),
    status: "ACTIVE",
    creator: { name: "K-콘텐츠 오라클", reputation: 4.9, avatar: "🎵" },
    prizePool: 42000,
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

  // 1. 통합 DB 조회 빌더 실행
  const dbDetailData = await fetchPredictionDetailDataBySlug(decodedSlug);
  if (dbDetailData) {
    return (
      <UniversalPredictionDetailClient
        game={dbDetailData.game}
        userBalance={dbDetailData.userBalance}
        userBets={dbDetailData.userBets}
        initialChartData={dbDetailData.initialChartData}
        slug={dbDetailData.slug}
      />
    );
  }

  // 2. DB에 없을 경우 샘플 또는 폴백 처리
  const balanceResult = await getUserBalance();
  const userBalance = balanceResult || { pmp: 1000, pmc: 500 };

  let gameForView: PredictionGameDetail;
  let userBets: Array<{
    betId: string;
    selectedOption: string;
    betAmount: number;
    status: string;
    createdAt: string;
  }> = [];

  if (SAMPLE_GAMES_MAP[decodedSlug]) {
    gameForView = { ...SAMPLE_GAMES_MAP[decodedSlug] };
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
      predictionType: "binary",
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
      status: "ACTIVE",
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
      creator: { name: "PosMul 오라클", reputation: 4.9, avatar: "🔮" },
      prizePool: 35000,
    };
  }

  return (
    <UniversalPredictionDetailClient
      game={gameForView}
      userBalance={userBalance}
      userBets={userBets}
      slug={decodedSlug}
    />
  );
}
