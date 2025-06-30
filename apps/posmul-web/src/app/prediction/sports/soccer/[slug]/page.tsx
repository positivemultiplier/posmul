/**
 * Individual Soccer Prediction Game Detail Page
 *
 * 새로운 PredictionDetailView 컴포넌트를 사용한 고급 상세페이지
 * Binary, WDL, Ranking 예측 타입을 모두 지원
 *
 * @author PosMul Development Team
 * @since 2024-12
 */

import { PredictionDetailView } from "@/bounded-contexts/prediction/presentation/components/PredictionDetailView";
import { notFound } from "next/navigation";

interface PredictionDetailPageProps {
  params: Promise<{
    slug: string;
  }>;
}

// Sample prediction games data with different types
const predictionGamesData = {
  // Binary Prediction Example
  "world-cup-winner": {
    id: "world-cup-winner",
    title: "브라질이 2024 월드컵에서 우승할까요?",
    description:
      "브라질 축구 국가대표팀이 2024년 FIFA 월드컵에서 우승할지 예측해보세요. 최근 성과, 선수 구성, 감독 전술을 종합적으로 고려하여 판단하세요.",
    predictionType: "binary" as const,
    options: [
      {
        id: "yes",
        label: "예 - 브라질 우승",
        probability: 0.74,
        odds: 1.35,
        volume: 125000,
        change24h: 3.2,
      },
      {
        id: "no",
        label: "아니오 - 다른 팀 우승",
        probability: 0.26,
        odds: 3.85,
        volume: 45000,
        change24h: -2.1,
      },
    ],
    totalVolume: 170000,
    participantCount: 1247,
    endTime: new Date("2024-12-31T23:59:59Z"),
    settlementTime: new Date("2025-01-15T23:59:59Z"),
    status: "ACTIVE" as const,
    category: "스포츠",
    creator: {
      name: "축구전문가김",
      reputation: 4.8,
      avatar: "⚽",
    },
    prizePool: 85000,
    minimumStake: 1000,
    maximumStake: 50000,
  },

  // Win-Draw-Lose Prediction Example
  "manchester-vs-liverpool": {
    id: "manchester-vs-liverpool",
    title: "맨체스터 유나이티드 vs 리버풀 경기 결과",
    description:
      "프리미어리그 빅매치! 맨유와 리버풀의 경기 결과를 예측해보세요. 양팀의 최근 폼, 부상자 명단, 홈/어웨이 우세를 고려하세요.",
    predictionType: "wdl" as const,
    options: [
      {
        id: "win",
        label: "맨유 승리",
        probability: 0.35,
        odds: 2.86,
        volume: 45000,
        change24h: 1.5,
      },
      {
        id: "draw",
        label: "무승부",
        probability: 0.28,
        odds: 3.57,
        volume: 32000,
        change24h: 0.8,
      },
      {
        id: "lose",
        label: "리버풀 승리",
        probability: 0.37,
        odds: 2.7,
        volume: 48000,
        change24h: -1.2,
      },
    ],
    totalVolume: 125000,
    participantCount: 892,
    endTime: new Date("2024-12-28T15:00:00Z"),
    settlementTime: new Date("2024-12-28T18:00:00Z"),
    status: "ACTIVE" as const,
    category: "스포츠",
    creator: {
      name: "프리미어분석가",
      reputation: 4.6,
      avatar: "🏆",
    },
    prizePool: 62500,
    minimumStake: 500,
    maximumStake: 25000,
  },

  // Ranking Prediction Example
  "premier-league-top4": {
    id: "premier-league-top4",
    title: "2024-25 프리미어리그 최종 순위 TOP 4 예측",
    description:
      "프리미어리그 시즌 종료 후 최종 순위 1-4위를 차지할 팀들을 예측해보세요. 챔피언스리그 진출권을 획득할 4팀은?",
    predictionType: "ranking" as const,
    options: [
      {
        id: "manchester-city",
        label: "맨체스터 시티",
        probability: 0.28,
        odds: 3.57,
        volume: 78000,
        change24h: 2.1,
      },
      {
        id: "arsenal",
        label: "아스널",
        probability: 0.24,
        odds: 4.17,
        volume: 65000,
        change24h: 1.8,
      },
      {
        id: "liverpool",
        label: "리버풀",
        probability: 0.22,
        odds: 4.55,
        volume: 58000,
        change24h: -0.5,
      },
      {
        id: "chelsea",
        label: "첼시",
        probability: 0.15,
        odds: 6.67,
        volume: 42000,
        change24h: 3.2,
      },
      {
        id: "manchester-united",
        label: "맨체스터 유나이티드",
        probability: 0.11,
        odds: 9.09,
        volume: 28000,
        change24h: -1.8,
      },
    ],
    totalVolume: 271000,
    participantCount: 1856,
    endTime: new Date("2025-05-25T23:59:59Z"),
    settlementTime: new Date("2025-05-28T23:59:59Z"),
    status: "ACTIVE" as const,
    category: "스포츠",
    creator: {
      name: "리그전문가박",
      reputation: 4.9,
      avatar: "📊",
    },
    prizePool: 135500,
    minimumStake: 2000,
    maximumStake: 100000,
  },
};

export default async function PredictionDetailPage({
  params,
}: PredictionDetailPageProps) {
  const resolvedParams = await params;
  const game =
    predictionGamesData[
      resolvedParams.slug as keyof typeof predictionGamesData
    ];

  if (!game) {
    notFound();
  }

  // Mock user balance
  const userBalance = {
    pmp: 25000,
    pmc: 15000,
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <PredictionDetailView
          game={game}
          userBalance={userBalance}
          // onParticipate 제거하여 Server Component 오류 해결
        />
      </div>
    </div>
  );
}
