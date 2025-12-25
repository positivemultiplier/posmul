import React from "react";

import { Button } from "../../../../shared/ui/components/base";
import { PredictionGameCard } from "./PredictionGameCard";
import { GameStatus, PredictionType } from "../../domain/value-objects/prediction-types";

// Types (aligned with domain model)
interface PredictionGame {
  id: string;
  title: string;
  description: string;
  predictionType: PredictionType;
  options: Array<{
    id: string;
    text: string;
    currentOdds: number;
  }>;
  startTime: Date;
  endTime: Date;
  settlementTime: Date;
  minimumStake: number;
  maximumStake: number;
  maxParticipants?: number;
  currentParticipants: number;
  status: GameStatus;
  totalStake: number;
  gameImportanceScore: number;
  allocatedPrizePool: number;
  createdAt: Date;
}

interface PredictionGameListProps {
  userId?: string;
}

// Mock data - will be replaced with actual data fetching
const mockGames: PredictionGame[] = [
  {
    id: "1",
    title: "2024년 한국 GDP 성장률 예측",
    description:
      "올해 한국의 실질 GDP 성장률이 몇 %가 될지 예측해보세요. 정확한 예측으로 PmcAmount를 획득하고 경제 전문성을 키워보세요!",
    predictionType: PredictionType.RANKING,
    options: [
      { id: "1", text: "2.0% 미만", currentOdds: 0.25 },
      { id: "2", text: "2.0% - 2.5%", currentOdds: 0.45 },
      { id: "3", text: "2.5% - 3.0%", currentOdds: 0.25 },
      { id: "4", text: "3.0% 초과", currentOdds: 0.05 },
    ],
    startTime: new Date("2024-01-01"),
    endTime: new Date("2024-12-20"),
    settlementTime: new Date("2024-12-31"),
    minimumStake: 100,
    maximumStake: 5000,
    maxParticipants: 1000,
    currentParticipants: 342,
    status: GameStatus.ACTIVE,
    totalStake: 1250000,
    gameImportanceScore: 2.8,
    allocatedPrizePool: 850000,
    createdAt: new Date("2024-01-01"),
  },
  {
    id: "2",
    title: "다음 대선 투표율 예측",
    description:
      "2027년 대통령 선거의 투표율을 예측해보세요. 민주주의 참여도를 예측하며 시민 의식을 키워보세요!",
    predictionType: PredictionType.BINARY,
    options: [
      { id: "1", text: "70% 이상", currentOdds: 0.6 },
      { id: "2", text: "70% 미만", currentOdds: 0.4 },
    ],
    startTime: new Date("2024-01-15"),
    endTime: new Date("2027-03-01"),
    settlementTime: new Date("2027-03-10"),
    minimumStake: 50,
    maximumStake: 2000,
    currentParticipants: 156,
    status: GameStatus.ACTIVE,
    totalStake: 450000,
    gameImportanceScore: 2.5,
    allocatedPrizePool: 320000,
    createdAt: new Date("2024-01-15"),
  },
  {
    id: "3",
    title: "부산 엑스포 2030 개최 여부",
    description:
      "BIE가 부산을 2030 엑스포 개최지로 선정할지 예측해보세요. 국가적 이슈에 대한 통찰력을 발휘해보세요!",
    predictionType: PredictionType.BINARY,
    options: [
      { id: "1", text: "부산 선정", currentOdds: 0.35 },
      { id: "2", text: "다른 도시 선정", currentOdds: 0.65 },
    ],
    startTime: new Date("2024-01-01"),
    endTime: new Date("2023-11-25"),
    settlementTime: new Date("2023-11-30"),
    minimumStake: 100,
    maximumStake: 3000,
    currentParticipants: 89,
    status: GameStatus.ENDED,
    totalStake: 267000,
    gameImportanceScore: 2.2,
    allocatedPrizePool: 190000,
    createdAt: new Date("2024-01-01"),
  },
  {
    id: "4",
    title: "2024 파리 올림픽 한국 축구 성과",
    description:
      "파리 올림픽에서 한국 축구 대표팀의 최종 성과를 예측해보세요. 스포츠 전문가가 되어보세요!",
    predictionType: PredictionType.WIN_DRAW_LOSE,
    options: [
      { id: "1", text: "메달 획득", currentOdds: 0.2 },
      { id: "2", text: "4강 진출", currentOdds: 0.3 },
      { id: "3", text: "조별리그 탈락", currentOdds: 0.5 },
    ],
    startTime: new Date("2024-06-01"),
    endTime: new Date("2024-07-25"),
    settlementTime: new Date("2024-08-10"),
    minimumStake: 200,
    maximumStake: 4000,
    maxParticipants: 500,
    currentParticipants: 278,
    status: GameStatus.ACTIVE,
    totalStake: 892000,
    gameImportanceScore: 2.6,
    allocatedPrizePool: 625000,
    createdAt: new Date("2024-06-01"),
  },
  {
    id: "5",
    title: "K-POP 그룹 글로벌 차트 순위 예측",
    description:
      "다음 분기 빌보드 HOT 100에서 K-POP 그룹들의 순위를 예측해보세요. 한류의 글로벌 영향력을 예측해보세요!",
    predictionType: PredictionType.RANKING,
    options: [
      { id: "1", text: "BTS", currentOdds: 0.3 },
      { id: "2", text: "BLACKPINK", currentOdds: 0.25 },
      { id: "3", text: "NewJeans", currentOdds: 0.2 },
      { id: "4", text: "SEVENTEEN", currentOdds: 0.15 },
      { id: "5", text: "aespa", currentOdds: 0.1 },
    ],
    startTime: new Date("2024-07-01"),
    endTime: new Date("2024-09-30"),
    settlementTime: new Date("2024-10-15"),
    minimumStake: 150,
    maximumStake: 3500,
    maxParticipants: 800,
    currentParticipants: 456,
    status: GameStatus.ACTIVE,
    totalStake: 1120000,
    gameImportanceScore: 2.4,
    allocatedPrizePool: 784000,
    createdAt: new Date("2024-07-01"),
  },
];

const PredictionGameList: React.FC<PredictionGameListProps> = async ({
  userId,
}) => {
  // TODO: Replace with actual data fetching
  // const games = await fetchPredictionGames({ status: 'ACTIVE', limit: 20 });
  const games = mockGames;

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">🔮 예측 게임</h2>
          <p className="text-gray-600 mt-1">
            사회적 이슈를 예측하며 PmcAmount를 획득하고 집단지성에 기여하세요
          </p>
        </div>

        <div className="flex gap-2">
          <Button variant="default" size="sm">
            📊 내 예측 이력
          </Button>
          <Button size="sm">➕ 새 게임 제안</Button>
        </div>
      </div>

      {/* Active Games Count */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center gap-2">
          <span className="text-blue-600 font-medium">
            현재 활성 게임: {games.filter((g) => g.status === GameStatus.ACTIVE).length}
            개
          </span>
          <span className="text-blue-500">•</span>
          <span className="text-blue-600">
            총 참여자:{" "}
            {games.reduce((sum, game) => sum + game.currentParticipants, 0)}명
          </span>
        </div>
      </div>

      {/* Games Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {games.map((game) => (
          <PredictionGameCard key={game.id} game={game} userId={userId} />
        ))}
      </div>

      {/* Load More */}
      <div className="text-center pt-6">
        <Button variant="default" size="lg">
          더 많은 게임 보기
        </Button>
      </div>
    </div>
  );
};

export default PredictionGameList;
