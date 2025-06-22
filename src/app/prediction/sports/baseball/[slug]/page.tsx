/**
 * Individual Baseball Prediction Game Detail Page
 *
 * 야구 예측 게임 상세 페이지
 * KBO, MLB 등 다양한 야구 리그 지원
 *
 * @author PosMul Development Team
 * @since 2024-12
 */

import { PredictionDetailView } from "@/bounded-contexts/prediction/presentation/components/PredictionDetailView";
import { notFound } from "next/navigation";

interface PredictionDetailPageProps {
  params: {
    slug: string;
  };
}

// Baseball prediction games data
const baseballPredictionGamesData = {
  // KBO Season Winner
  "kbo-season-winner": {
    id: "kbo-season-winner",
    title: "2024 KBO 정규시즌 우승팀 예측",
    description:
      "치열한 KBO 리그 2024 시즌! 정규시즌 1위를 차지할 팀을 예측해보세요. 각 팀의 전력 분석과 시즌 중 부상자 현황을 고려하여 판단하세요.",
    predictionType: "ranking" as const,
    options: [
      {
        id: "kia",
        label: "KIA 타이거즈",
        probability: 0.25,
        odds: 4.0,
        volume: 85000,
        change24h: 2.1,
      },
      {
        id: "lg",
        label: "LG 트윈스",
        probability: 0.22,
        odds: 4.55,
        volume: 78000,
        change24h: 1.5,
      },
      {
        id: "doosan",
        label: "두산 베어스",
        probability: 0.2,
        odds: 5.0,
        volume: 72000,
        change24h: -0.8,
      },
      {
        id: "samsung",
        label: "삼성 라이온즈",
        probability: 0.18,
        odds: 5.56,
        volume: 65000,
        change24h: 0.3,
      },
      {
        id: "lotte",
        label: "롯데 자이언츠",
        probability: 0.15,
        odds: 6.67,
        volume: 55000,
        change24h: -1.2,
      },
    ],
    totalVolume: 355000,
    participantCount: 1560,
    endTime: new Date("2024-12-25T23:59:00Z"),
    settlementTime: new Date("2024-12-30T23:59:00Z"),
    status: "ACTIVE" as const,
    category: "야구",
    creator: {
      name: "야구분석가박",
      reputation: 4.7,
      avatar: "⚾",
    },
    prizePool: 177500,
    minimumStake: 1000,
    maximumStake: 30000,
  },

  // MLB World Series
  "mlb-world-series-2024": {
    id: "mlb-world-series-2024",
    title: "2024 MLB 월드시리즈 우승팀 예측",
    description:
      "메이저리그 최고의 무대 월드시리즈! 아메리칸리그와 내셔널리그 챔피언 중 누가 최종 우승할지 예측해보세요.",
    predictionType: "binary" as const,
    options: [
      {
        id: "al",
        label: "아메리칸리그 챔피언 우승",
        probability: 0.48,
        odds: 2.08,
        volume: 125000,
        change24h: 1.8,
      },
      {
        id: "nl",
        label: "내셔널리그 챔피언 우승",
        probability: 0.52,
        odds: 1.92,
        volume: 135000,
        change24h: -1.3,
      },
    ],
    totalVolume: 260000,
    participantCount: 2340,
    endTime: new Date("2024-10-20T23:59:00Z"),
    settlementTime: new Date("2024-11-01T23:59:00Z"),
    status: "ENDED" as const,
    category: "야구",
    creator: {
      name: "MLB전문가김",
      reputation: 4.8,
      avatar: "🏆",
    },
    prizePool: 130000,
    minimumStake: 2000,
    maximumStake: 50000,
  },

  // WBC 2025 Korea Performance
  "wbc-2025-korea": {
    id: "wbc-2025-korea",
    title: "2025 WBC 한국 대표팀 성적 예측",
    description:
      "월드 베이스볼 클래식 2025에서 한국 대표팀이 어떤 성적을 거둘지 예측해보세요. 메이저리거들의 참여 여부가 중요한 변수입니다.",
    predictionType: "wdl" as const,
    options: [
      {
        id: "champion",
        label: "우승 또는 준우승",
        probability: 0.3,
        odds: 3.33,
        volume: 95000,
        change24h: 2.5,
      },
      {
        id: "semifinal",
        label: "4강 진출",
        probability: 0.4,
        odds: 2.5,
        volume: 125000,
        change24h: 0.8,
      },
      {
        id: "early",
        label: "조별리그 또는 1라운드 탈락",
        probability: 0.3,
        odds: 3.33,
        volume: 95000,
        change24h: -1.8,
      },
    ],
    totalVolume: 315000,
    participantCount: 1890,
    endTime: new Date("2025-03-01T23:59:00Z"),
    settlementTime: new Date("2025-03-25T23:59:00Z"),
    status: "ACTIVE" as const,
    category: "야구",
    creator: {
      name: "국대야구전문가",
      reputation: 4.9,
      avatar: "🇰🇷",
    },
    prizePool: 157500,
    minimumStake: 1500,
    maximumStake: 40000,
  },

  // NPB Japan Series
  "npb-japan-series-2024": {
    id: "npb-japan-series-2024",
    title: "2024 NPB 일본시리즈 - 한국인 선수 활약도",
    description:
      "일본프로야구 일본시리즈에서 한국인 선수들(이정후, 김하성 등)의 종합 활약도를 예측해보세요.",
    predictionType: "ranking" as const,
    options: [
      {
        id: "mvp",
        label: "MVP급 활약 (시리즈 MVP 또는 준MVP)",
        probability: 0.15,
        odds: 6.67,
        volume: 35000,
        change24h: 3.1,
      },
      {
        id: "excellent",
        label: "우수한 활약 (팀 승리 기여)",
        probability: 0.35,
        odds: 2.86,
        volume: 82000,
        change24h: 1.5,
      },
      {
        id: "average",
        label: "평균적 활약",
        probability: 0.35,
        odds: 2.86,
        volume: 82000,
        change24h: -0.3,
      },
      {
        id: "poor",
        label: "부진한 활약",
        probability: 0.15,
        odds: 6.67,
        volume: 35000,
        change24h: -2.2,
      },
    ],
    totalVolume: 234000,
    participantCount: 1245,
    endTime: new Date("2024-11-01T23:59:00Z"),
    settlementTime: new Date("2024-11-10T23:59:00Z"),
    status: "ENDED" as const,
    category: "야구",
    creator: {
      name: "NPB분석가이",
      reputation: 4.5,
      avatar: "🗾",
    },
    prizePool: 117000,
    minimumStake: 800,
    maximumStake: 25000,
  },
};

export default async function BaseballPredictionDetailPage({
  params,
}: PredictionDetailPageProps) {
  const resolvedParams = await params;
  const game =
    baseballPredictionGamesData[
      resolvedParams.slug as keyof typeof baseballPredictionGamesData
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
        <PredictionDetailView game={game} userBalance={userBalance} />
      </div>
    </div>
  );
}
