/**
 * Individual Other Sports Prediction Game Detail Page
 *
 * 기타 스포츠 예측 게임 상세 페이지
 * 피겨스케이팅, 골프, 테니스, 수영 등 다양한 종목 지원
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

// Other sports prediction games data
const otherSportsPredictionGamesData = {
  // Figure Skating Yuna Kim Commentary
  "figure-skating-yuna-kim": {
    id: "figure-skating-yuna-kim",
    title: "2024 피겨 스케이팅 그랑프리 파이널 - 김연아 해설 등장 여부",
    description:
      "피겨 여왕 김연아가 그랑프리 파이널 해설진으로 등장할까요? 팬들의 관심이 집중되고 있습니다!",
    predictionType: "binary" as const,
    options: [
      {
        id: "yes",
        label: "해설진으로 등장",
        probability: 0.6,
        odds: 1.67,
        volume: 85000,
        change24h: 2.3,
      },
      {
        id: "no",
        label: "해설진 불참",
        probability: 0.4,
        odds: 2.5,
        volume: 55000,
        change24h: -1.8,
      },
    ],
    totalVolume: 140000,
    participantCount: 1200,
    endTime: new Date("2024-12-19T18:00:00Z"),
    settlementTime: new Date("2024-12-20T18:00:00Z"),
    status: "ACTIVE" as const,
    category: "기타스포츠",
    creator: {
      name: "피겨스케이팅팬",
      reputation: 4.5,
      avatar: "⛸️",
    },
    prizePool: 70000,
    minimumStake: 100,
    maximumStake: 10000,
  },

  // Golf Masters Tournament
  "golf-masters-2025": {
    id: "golf-masters-2025",
    title: "2025 마스터스 토너먼트 - 한국 선수 성적",
    description:
      "골프의 메이저 대회 마스터스에서 한국 선수들(김시우, 임성재 등)의 최고 성적을 예측해보세요.",
    predictionType: "ranking" as const,
    options: [
      {
        id: "top5",
        label: "TOP 5 진입",
        probability: 0.15,
        odds: 6.67,
        volume: 45000,
        change24h: 3.2,
      },
      {
        id: "top10",
        label: "TOP 10 진입",
        probability: 0.25,
        odds: 4.0,
        volume: 75000,
        change24h: 1.8,
      },
      {
        id: "top20",
        label: "TOP 20 진입",
        probability: 0.35,
        odds: 2.86,
        volume: 105000,
        change24h: 0.5,
      },
      {
        id: "cut",
        label: "컷 통과",
        probability: 0.2,
        odds: 5.0,
        volume: 60000,
        change24h: -1.2,
      },
      {
        id: "missed_cut",
        label: "컷 탈락",
        probability: 0.05,
        odds: 20.0,
        volume: 15000,
        change24h: -2.5,
      },
    ],
    totalVolume: 300000,
    participantCount: 1800,
    endTime: new Date("2025-04-10T23:59:00Z"),
    settlementTime: new Date("2025-04-15T23:59:00Z"),
    status: "ACTIVE" as const,
    category: "기타스포츠",
    creator: {
      name: "골프전문가이",
      reputation: 4.7,
      avatar: "⛳",
    },
    prizePool: 150000,
    minimumStake: 1000,
    maximumStake: 25000,
  },

  // Tennis Wimbledon
  "tennis-wimbledon-2025": {
    id: "tennis-wimbledon-2025",
    title: "2025 윔블던 - 권순우 성적 예측",
    description:
      "테니스 그랜드슬램 윔블던에서 권순우가 어떤 성적을 거둘지 예측해보세요. 잔디코트에서의 활약을 기대합니다!",
    predictionType: "wdl" as const,
    options: [
      {
        id: "deep_run",
        label: "4라운드 이상 진출",
        probability: 0.2,
        odds: 5.0,
        volume: 40000,
        change24h: 2.8,
      },
      {
        id: "early_rounds",
        label: "1-3라운드 진출",
        probability: 0.6,
        odds: 1.67,
        volume: 120000,
        change24h: 0.5,
      },
      {
        id: "first_round",
        label: "1라운드 탈락",
        probability: 0.2,
        odds: 5.0,
        volume: 40000,
        change24h: -1.8,
      },
    ],
    totalVolume: 200000,
    participantCount: 1350,
    endTime: new Date("2025-06-25T23:59:00Z"),
    settlementTime: new Date("2025-07-15T23:59:00Z"),
    status: "ACTIVE" as const,
    category: "기타스포츠",
    creator: {
      name: "테니스분석가박",
      reputation: 4.6,
      avatar: "🎾",
    },
    prizePool: 100000,
    minimumStake: 500,
    maximumStake: 20000,
  },

  // Swimming World Championships
  "swimming-world-championships": {
    id: "swimming-world-championships",
    title: "2025 세계수영선수권 - 한국 수영 메달 개수",
    description:
      "세계수영선수권에서 한국이 획득할 메달 개수를 예측해보세요. 황선우, 김우민 등의 활약이 기대됩니다!",
    predictionType: "ranking" as const,
    options: [
      {
        id: "five_plus",
        label: "5개 이상",
        probability: 0.1,
        odds: 10.0,
        volume: 25000,
        change24h: 4.1,
      },
      {
        id: "three_to_four",
        label: "3-4개",
        probability: 0.25,
        odds: 4.0,
        volume: 62500,
        change24h: 2.3,
      },
      {
        id: "one_to_two",
        label: "1-2개",
        probability: 0.45,
        odds: 2.22,
        volume: 112500,
        change24h: 1.2,
      },
      {
        id: "zero",
        label: "0개 (노메달)",
        probability: 0.2,
        odds: 5.0,
        volume: 50000,
        change24h: -2.8,
      },
    ],
    totalVolume: 250000,
    participantCount: 1600,
    endTime: new Date("2025-07-15T23:59:00Z"),
    settlementTime: new Date("2025-08-01T23:59:00Z"),
    status: "ACTIVE" as const,
    category: "기타스포츠",
    creator: {
      name: "수영전문가김",
      reputation: 4.8,
      avatar: "🏊‍♂️",
    },
    prizePool: 125000,
    minimumStake: 800,
    maximumStake: 30000,
  },

  // Archery Olympics Preview
  "archery-olympics-preview": {
    id: "archery-olympics-preview",
    title: "2024 파리올림픽 양궁 - 한국 금메달 개수",
    description:
      "양궁 강국 한국이 파리올림픽에서 몇 개의 금메달을 획득할지 예측해보세요. 전통적인 강세를 이어갈까요?",
    predictionType: "binary" as const,
    options: [
      {
        id: "three_plus",
        label: "3개 이상 (전통적 강세 유지)",
        probability: 0.7,
        odds: 1.43,
        volume: 175000,
        change24h: 1.5,
      },
      {
        id: "under_three",
        label: "2개 이하 (예상보다 부진)",
        probability: 0.3,
        odds: 3.33,
        volume: 75000,
        change24h: -1.2,
      },
    ],
    totalVolume: 250000,
    participantCount: 2100,
    endTime: new Date("2024-07-25T23:59:00Z"),
    settlementTime: new Date("2024-08-15T23:59:00Z"),
    status: "ENDED" as const,
    category: "기타스포츠",
    creator: {
      name: "양궁전문가이",
      reputation: 4.9,
      avatar: "🏹",
    },
    prizePool: 125000,
    minimumStake: 1000,
    maximumStake: 40000,
  },
};

export default async function OtherSportsPredictionDetailPage({
  params,
}: PredictionDetailPageProps) {
  const resolvedParams = await params;
  const game =
    otherSportsPredictionGamesData[
      resolvedParams.slug as keyof typeof otherSportsPredictionGamesData
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
