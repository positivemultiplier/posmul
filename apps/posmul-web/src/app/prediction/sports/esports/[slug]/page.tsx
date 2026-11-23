/**
 * Individual Esports Prediction Game Detail Page
 *
 * e스포츠 예측 게임 상세 페이지
 * LOL, 발로란트, 오버워치 등 다양한 e스포츠 게임 지원
 *
 * @author PosMul Development Team
 * @since 2024-12
 */
import { notFound } from "next/navigation";

interface PredictionDetailPageProps {
  params: Promise<{
    slug: string;
  }>;
}

// Esports prediction games data
const esportsPredictionGamesData = {
  // LOL Worlds 2024
  "lol-worlds-2024": {
    id: "lol-worlds-2024",
    title: "LOL 월드 챔피언십 2024 - T1 vs JDG 결승전",
    description:
      "리그 오브 레전드 월드 챔피언십 2024 결승전에서 T1과 JDG 중 누가 우승할지 예측해보세요. 페이커의 전설이 계속될까요?",
    predictionType: "binary" as const,
    options: [
      {
        id: "t1",
        label: "T1 우승",
        probability: 0.55,
        odds: 1.82,
        volume: 185000,
        change24h: 2.3,
      },
      {
        id: "jdg",
        label: "JDG 우승",
        probability: 0.45,
        odds: 2.22,
        volume: 145000,
        change24h: -1.8,
      },
    ],
    totalVolume: 330000,
    participantCount: 2890,
    endTime: new Date("2024-12-18T14:00:00Z"),
    settlementTime: new Date("2024-12-18T18:00:00Z"),
    status: "ACTIVE" as const,
    category: "e스포츠",
    creator: {
      name: "LOL전문가이",
      reputation: 4.9,
      avatar: "",
    },
    prizePool: 165000,
    minimumStake: 500,
    maximumStake: 25000,
  },

  // Valorant Champions 2024
  "valorant-champions-2024": {
    id: "valorant-champions-2024",
    title: "발로란트 챔피언스 2024 - 한국팀 4강 진출 여부",
    description:
      "발로란트 챔피언스 2024에서 한국팀(DRX, T1 등)이 4강에 진출할 수 있을지 예측해보세요. 한국 발로란트의 자존심을 건 대회입니다!",
    predictionType: "binary" as const,
    options: [
      {
        id: "yes",
        label: "4강 진출 성공",
        probability: 0.35,
        odds: 2.86,
        volume: 65000,
        change24h: 1.5,
      },
      {
        id: "no",
        label: "4강 진출 실패",
        probability: 0.65,
        odds: 1.54,
        volume: 120000,
        change24h: -0.8,
      },
    ],
    totalVolume: 185000,
    participantCount: 1245,
    endTime: new Date("2024-12-22T10:00:00Z"),
    settlementTime: new Date("2024-12-25T10:00:00Z"),
    status: "ACTIVE" as const,
    category: "e스포츠",
    creator: {
      name: "발로란트분석가",
      reputation: 4.7,
      avatar: "",
    },
    prizePool: 92500,
    minimumStake: 200,
    maximumStake: 15000,
  },

  // Overwatch Champions Series
  "overwatch-champions-2024": {
    id: "overwatch-champions-2024",
    title: "오버워치 챔피언스 시리즈 2024 - 서울 다이너스티 성적",
    description:
      "오버워치 챔피언스 시리즈에서 서울 다이너스티가 어떤 성적을 거둘지 예측해보세요. 한국 오버워치의 전통적 강팀의 부활을 기대합니다!",
    predictionType: "ranking" as const,
    options: [
      {
        id: "champion",
        label: "우승 (1위)",
        probability: 0.15,
        odds: 6.67,
        volume: 25000,
        change24h: 3.2,
      },
      {
        id: "finals",
        label: "준우승 (2위)",
        probability: 0.22,
        odds: 4.55,
        volume: 35000,
        change24h: 1.8,
      },
      {
        id: "top4",
        label: "4강 (3-4위)",
        probability: 0.28,
        odds: 3.57,
        volume: 45000,
        change24h: 0.5,
      },
      {
        id: "top8",
        label: "8강 (5-8위)",
        probability: 0.25,
        odds: 4.0,
        volume: 40000,
        change24h: -1.2,
      },
      {
        id: "elimination",
        label: "조별리그 탈락",
        probability: 0.1,
        odds: 10.0,
        volume: 15000,
        change24h: -2.5,
      },
    ],
    totalVolume: 160000,
    participantCount: 987,
    endTime: new Date("2024-12-30T23:59:59Z"),
    settlementTime: new Date("2025-01-05T23:59:59Z"),
    status: "ACTIVE" as const,
    category: "e스포츠",
    creator: {
      name: "오버워치코치김",
      reputation: 4.6,
      avatar: "",
    },
    prizePool: 80000,
    minimumStake: 300,
    maximumStake: 20000,
  },

  // Mobile Game Championship
  "mobile-game-championship": {
    id: "mobile-game-championship",
    title: "모바일 게임 월드 챔피언십 - 한국 대표팀 성과",
    description:
      "모바일 게임(클래시 로얄, 브롤스타즈 등) 월드 챔피언십에서 한국 대표팀들의 종합 성과를 예측해보세요.",
    predictionType: "wdl" as const,
    options: [
      {
        id: "excellent",
        label: "우수 (금메달 2개 이상)",
        probability: 0.3,
        odds: 3.33,
        volume: 35000,
        change24h: 2.1,
      },
      {
        id: "good",
        label: "양호 (금메달 1개)",
        probability: 0.45,
        odds: 2.22,
        volume: 52000,
        change24h: 0.8,
      },
      {
        id: "poor",
        label: "부진 (금메달 없음)",
        probability: 0.25,
        odds: 4.0,
        volume: 28000,
        change24h: -1.5,
      },
    ],
    totalVolume: 115000,
    participantCount: 756,
    endTime: new Date("2025-01-15T23:59:59Z"),
    settlementTime: new Date("2025-01-20T23:59:59Z"),
    status: "ACTIVE" as const,
    category: "e스포츠",
    creator: {
      name: "모바일게임전문가",
      reputation: 4.4,
      avatar: "",
    },
    prizePool: 57500,
    minimumStake: 100,
    maximumStake: 10000,
  },
};

export default async function EsportsPredictionDetailPage({
  params,
}: PredictionDetailPageProps) {
  const resolvedParams = await params;
  const game =
    esportsPredictionGamesData[
      resolvedParams.slug as keyof typeof esportsPredictionGamesData
    ];

  if (!game) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
      </div>
    </div>
  );
}
