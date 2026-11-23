/**
 * Individual Basketball Prediction Game Detail Page
 *
 * 농구 예측 게임 상세 페이지
 * NBA, KBL 등 다양한 농구 리그 지원
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

// Basketball prediction games data
const basketballPredictionGamesData = {
  // NBA MVP 2025
  "nba-mvp-2025": {
    id: "nba-mvp-2025",
    title: "NBA 2024-25 시즌 MVP 예측",
    description:
      "새 시즌 NBA의 가장 가치 있는 선수는 누가 될까요? 치열한 경쟁이 예상되는 MVP 레이스를 예측해보세요!",
    predictionType: "ranking" as const,
    options: [
      {
        id: "luka",
        label: "루카 돈치치 (댈러스)",
        probability: 0.28,
        odds: 3.57,
        volume: 145000,
        change24h: 2.1,
      },
      {
        id: "giannis",
        label: "야니스 아데토쿤보 (밀워키)",
        probability: 0.25,
        odds: 4.0,
        volume: 130000,
        change24h: 1.5,
      },
      {
        id: "jokic",
        label: "니콜라 요키치 (덴버)",
        probability: 0.22,
        odds: 4.55,
        volume: 115000,
        change24h: -0.8,
      },
      {
        id: "tatum",
        label: "제이슨 테이텀 (보스턴)",
        probability: 0.15,
        odds: 6.67,
        volume: 78000,
        change24h: 0.3,
      },
      {
        id: "sga",
        label: "샤이 길저스-알렉산더 (OKC)",
        probability: 0.1,
        odds: 10.0,
        volume: 52000,
        change24h: 3.2,
      },
    ],
    totalVolume: 520000,
    participantCount: 2100,
    endTime: new Date("2025-04-15T23:59:00Z"),
    settlementTime: new Date("2025-04-20T23:59:00Z"),
    status: "ACTIVE" as const,
    category: "농구",
    creator: {
      name: "NBA분석가김",
      reputation: 4.8,
      avatar: "",
    },
    prizePool: 260000,
    minimumStake: 2000,
    maximumStake: 80000,
  },

  // KBL Championship
  "kbl-championship-2024": {
    id: "kbl-championship-2024",
    title: "2024 KBL 챔피언십 우승팀 예측",
    description:
      "한국농구리그 KBL 챔피언십에서 우승할 팀을 예측해보세요. 정규시즌 성과와 플레이오프 경험이 중요한 변수입니다.",
    predictionType: "wdl" as const,
    options: [
      {
        id: "favorite",
        label: "정규시즌 1-2위팀 우승",
        probability: 0.55,
        odds: 1.82,
        volume: 165000,
        change24h: 1.8,
      },
      {
        id: "upset",
        label: "정규시즌 3-4위팀 우승",
        probability: 0.35,
        odds: 2.86,
        volume: 105000,
        change24h: 2.5,
      },
      {
        id: "dark_horse",
        label: "정규시즌 5위 이하 팀 우승",
        probability: 0.1,
        odds: 10.0,
        volume: 30000,
        change24h: -1.2,
      },
    ],
    totalVolume: 300000,
    participantCount: 1450,
    endTime: new Date("2024-12-20T23:59:00Z"),
    settlementTime: new Date("2024-12-25T23:59:00Z"),
    status: "ACTIVE" as const,
    category: "농구",
    creator: {
      name: "KBL전문가박",
      reputation: 4.6,
      avatar: "",
    },
    prizePool: 150000,
    minimumStake: 1000,
    maximumStake: 30000,
  },

  // WNBA Finals
  "wnba-finals-2024": {
    id: "wnba-finals-2024",
    title: "2024 WNBA 파이널 - 한국 선수 활약도",
    description:
      "WNBA 파이널에서 한국 선수들(박지수 등)의 활약도를 예측해보세요. 여자농구의 위상이 높아지고 있습니다.",
    predictionType: "binary" as const,
    options: [
      {
        id: "active",
        label: "주요 기여 (15분 이상 출전)",
        probability: 0.35,
        odds: 2.86,
        volume: 45000,
        change24h: 3.1,
      },
      {
        id: "limited",
        label: "제한적 출전 (15분 미만)",
        probability: 0.65,
        odds: 1.54,
        volume: 85000,
        change24h: -1.5,
      },
    ],
    totalVolume: 130000,
    participantCount: 890,
    endTime: new Date("2024-10-15T23:59:00Z"),
    settlementTime: new Date("2024-10-25T23:59:00Z"),
    status: "ENDED" as const,
    category: "농구",
    creator: {
      name: "WNBA분석가이",
      reputation: 4.4,
      avatar: "",
    },
    prizePool: 65000,
    minimumStake: 500,
    maximumStake: 15000,
  },

  // College Basketball March Madness
  "march-madness-2025": {
    id: "march-madness-2025",
    title: "2025 NCAA 마치 매드니스 - 한국인 선수 성과",
    description:
      "NCAA 토너먼트에서 한국인 선수들이 얼마나 깊이 진출할지 예측해보세요. 대학농구의 꽃 마치 매드니스!",
    predictionType: "ranking" as const,
    options: [
      {
        id: "final_four",
        label: "파이널 포 진출",
        probability: 0.1,
        odds: 10.0,
        volume: 25000,
        change24h: 4.2,
      },
      {
        id: "elite_eight",
        label: "엘리트 에이트 진출",
        probability: 0.2,
        odds: 5.0,
        volume: 50000,
        change24h: 2.8,
      },
      {
        id: "sweet_sixteen",
        label: "스위트 식스틴 진출",
        probability: 0.3,
        odds: 3.33,
        volume: 75000,
        change24h: 1.2,
      },
      {
        id: "first_round",
        label: "1라운드 진출",
        probability: 0.25,
        odds: 4.0,
        volume: 62500,
        change24h: -0.5,
      },
      {
        id: "no_tournament",
        label: "토너먼트 진출 실패",
        probability: 0.15,
        odds: 6.67,
        volume: 37500,
        change24h: -2.1,
      },
    ],
    totalVolume: 250000,
    participantCount: 1200,
    endTime: new Date("2025-03-01T23:59:00Z"),
    settlementTime: new Date("2025-04-10T23:59:00Z"),
    status: "ACTIVE" as const,
    category: "농구",
    creator: {
      name: "대학농구전문가",
      reputation: 4.5,
      avatar: "",
    },
    prizePool: 125000,
    minimumStake: 800,
    maximumStake: 25000,
  },
};

export default async function BasketballPredictionDetailPage({
  params,
}: PredictionDetailPageProps) {
  const resolvedParams = await params;
  const game =
    basketballPredictionGamesData[
      resolvedParams.slug as keyof typeof basketballPredictionGamesData
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
