import React from "react";
import { Badge, Button } from "../../../../shared/ui/components/base";
import { PredictionGameCard } from "./PredictionGameCard";

// Types
interface PredictionGame {
  id: string;
  title: string;
  description: string;
  predictionType: "binary" | "wdl" | "ranking";
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
  status: "PENDING" | "ACTIVE" | "ENDED" | "SETTLED" | "CANCELLED";
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
    predictionType: "ranking",
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
    status: "ACTIVE",
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
    predictionType: "binary",
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
    status: "ACTIVE",
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
    predictionType: "binary",
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
    status: "ENDED",
    totalStake: 267000,
    gameImportanceScore: 2.2,
    allocatedPrizePool: 190000,
    createdAt: new Date("2024-01-01"),
  },
];

const PredictionGameList: React.FC<PredictionGameListProps> = async ({
  userId,
}) => {
  // TODO: Replace with actual data fetching
  // const games = await fetchPredictionGames({ status: 'ACTIVE', limit: 20 });
  const games = mockGames;

  const getStatusBadge = (status: PredictionGame["status"]) => {
    const statusConfig = {
      PENDING: { label: "시작 예정", variant: "secondary" as const },
      ACTIVE: { label: "참여 가능", variant: "default" as const },
      ENDED: { label: "종료", variant: "outline" as const },
      SETTLED: { label: "정산 완료", variant: "success" as const },
      CANCELLED: { label: "취소됨", variant: "destructive" as const },
    };

    const config = statusConfig[status];
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getImportanceIcon = (score: number) => {
    if (score >= 2.5) return "🔥"; // 높은 중요도
    if (score >= 2.0) return "⭐"; // 중간 중요도
    return "📊"; // 일반 중요도
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("ko-KR").format(amount);
  };

  const calculateTimeRemaining = (endTime: Date) => {
    const now = new Date();
    const diff = endTime.getTime() - now.getTime();

    if (diff <= 0) return "종료됨";

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) return `${days}일 ${hours}시간 남음`;
    return `${hours}시간 남음`;
  };

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
            현재 활성 게임: {games.filter((g) => g.status === "ACTIVE").length}
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
