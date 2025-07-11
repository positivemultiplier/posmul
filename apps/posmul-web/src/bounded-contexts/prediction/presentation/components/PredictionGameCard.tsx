"use client";

import React, { useState } from "react";
import { Badge, Button, Card } from "../../../../shared/ui/components/base";

// Types (matching PredictionGameList)
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

interface PredictionGameCardProps {
  game: PredictionGame;
  userId?: string;
}

const PredictionGameCard: React.FC<PredictionGameCardProps> = ({
  game,
  userId,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [stakeAmount, setStakeAmount] = useState<number>(game.minimumStake);

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

  const getProgressPercentage = () => {
    if (!game.maxParticipants) return 0;
    return Math.min(
      (game.currentParticipants / game.maxParticipants) * 100,
      100
    );
  };

  const handleParticipate = () => {
    if (!selectedOption || !userId) return;

    // TODO: Implement actual participation logic with PredictionEconomicService
    console.log("Participating in game:", {
      gameId: game.id,
      selectedOption,
      stakeAmount,
      userId,
    });

    alert(
      `${game.title}에 ${formatCurrency(stakeAmount)} PmpAmount로 참여하시겠습니까?`
    );
  };

  return (
    <Card className="p-6 hover:shadow-lg transition-shadow duration-200">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-xl">
            {getImportanceIcon(game.gameImportanceScore)}
          </span>
          <div>
            <h3 className="font-semibold text-gray-900 text-lg leading-tight">
              {game.title}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              {getStatusBadge(game.status)}
              <span className="text-xs text-gray-500">
                {calculateTimeRemaining(game.endTime)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Description */}
      <p className="text-gray-600 text-sm mb-4 line-clamp-2">
        {game.description}
      </p>

      {/* Economics Info */}
      <div className="bg-gray-50 rounded-lg p-3 mb-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-500">💰 상금 풀</span>
            <div className="font-medium text-purple-600">
              {formatCurrency(game.allocatedPrizePool)} PmcAmount
            </div>
          </div>
          <div>
            <span className="text-gray-500">🎯 참여 범위</span>
            <div className="font-medium text-blue-600">
              {formatCurrency(game.minimumStake)} -{" "}
              {formatCurrency(game.maximumStake)} PmpAmount
            </div>
          </div>
          <div>
            <span className="text-gray-500">👥 참여자</span>
            <div className="font-medium">
              {game.currentParticipants}명
              {game.maxParticipants && ` / ${game.maxParticipants}명`}
            </div>
          </div>
          <div>
            <span className="text-gray-500">📈 총 베팅액</span>
            <div className="font-medium text-green-600">
              {formatCurrency(game.totalStake)} PmpAmount
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        {game.maxParticipants && (
          <div className="mt-3">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>참여율</span>
              <span>{getProgressPercentage().toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${getProgressPercentage()}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Options Preview */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">예측 옵션</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? "접기" : "더보기"}
          </Button>
        </div>

        <div className="space-y-2">
          {(isExpanded ? game.options : game.options.slice(0, 2)).map(
            (option) => (
              <div
                key={option.id}
                className={`flex items-center justify-between p-2 rounded border transition-colors cursor-pointer ${
                  selectedOption === option.id
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
                onClick={() => setSelectedOption(option.id)}
              >
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    name={`option-${game.id}`}
                    checked={selectedOption === option.id}
                    onChange={() => setSelectedOption(option.id)}
                    className="text-blue-600"
                  />
                  <span className="text-sm font-medium">{option.text}</span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium">
                    {(option.currentOdds * 100).toFixed(1)}%
                  </div>
                  <div className="text-xs text-gray-500">
                    배당률 {(1 / option.currentOdds).toFixed(2)}x
                  </div>
                </div>
              </div>
            )
          )}
        </div>
      </div>

      {/* Participation Section */}
      {game.status === "ACTIVE" && userId && (
        <div className="border-t pt-4">
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <label className="block text-xs text-gray-500 mb-1">
                PmpAmount 베팅액
              </label>
              <input
                type="number"
                min={game.minimumStake}
                max={game.maximumStake}
                value={stakeAmount}
                onChange={(e) => setStakeAmount(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={`${game.minimumStake} - ${game.maximumStake}`}
              />
            </div>
            <Button
              onClick={handleParticipate}
              disabled={!selectedOption}
              className="px-6"
            >
              🎯 참여하기
            </Button>
          </div>

          {selectedOption && (
            <div className="mt-2 text-xs text-gray-600">
              예상 PmcAmount 수익:{" "}
              <span className="font-medium text-green-600">
                {formatCurrency(stakeAmount * 1.5)} PmcAmount
              </span>{" "}
              (정확도에 따라 변동)
            </div>
          )}
        </div>
      )}

      {/* Login Required */}
      {game.status === "ACTIVE" && !userId && (
        <div className="border-t pt-4 text-center">
          <p className="text-gray-500 text-sm mb-2">
            예측 게임 참여를 위해 로그인이 필요합니다
          </p>
          <Button variant="default" size="sm">
            로그인하기
          </Button>
        </div>
      )}
    </Card>
  );
};

export { PredictionGameCard };
