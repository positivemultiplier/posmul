/**
 * Advanced Prediction Detail View Component
 *
 * Polymarket 스타일의 고급 예측 상세페이지
 * Binary, WDL, Ranking 예측 타입을 모두 지원
 *
 * @author PosMul Development Team
 * @since 2024-12
 */

"use client";

import { Badge, Button, Card, CardContent, CardHeader, CardTitle } from '../../../../shared/ui/components/base';
import { useEffect, useState } from "react";

// Types
interface PredictionOption {
  id: string;
  label: string;
  probability: number;
  odds: number;
  volume: number;
  change24h: number;
}

interface PredictionGameDetail {
  id: string;
  title: string;
  description: string;
  predictionType: "binary" | "wdl" | "ranking";
  options: PredictionOption[];
  totalVolume: number;
  participantCount: number;
  endTime: Date;
  settlementTime: Date;
  status: "ACTIVE" | "ENDED" | "SETTLED";
  category: string;
  creator: {
    name: string;
    reputation: number;
    avatar: string;
  };
  prizePool: number;
  minimumStake: number;
  maximumStake: number;
}

interface PredictionDetailViewProps {
  game: PredictionGameDetail;
  userBalance: {
    pmp: number;
    pmc: number;
  };
  onParticipate?: (optionId: string, amount: number) => void;
}

export function PredictionDetailView({
  game,
  userBalance,
  onParticipate,
}: PredictionDetailViewProps) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [stakeAmount, setStakeAmount] = useState<number>(game.minimumStake);
  const [expectedReturn, setExpectedReturn] = useState<number>(0);

  // Calculate expected return
  useEffect(() => {
    if (selectedOption && stakeAmount > 0) {
      const option = game.options.find((opt) => opt.id === selectedOption);
      if (option) {
        setExpectedReturn(stakeAmount * option.odds);
      }
    }
  }, [selectedOption, stakeAmount, game.options]);

  const formatTimeRemaining = (endTime: Date) => {
    const now = new Date();
    const diff = endTime.getTime() - now.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) return `${days}일 ${hours}시간`;
    if (hours > 0) return `${hours}시간 ${minutes}분`;
    return `${minutes}분`;
  };

  const renderPredictionChart = () => {
    if (game.predictionType === "binary") {
      return (
        <div className="space-y-3">
          {game.options.map((option) => (
            <div
              key={option.id}
              className={`relative p-4 border-2 rounded-lg cursor-pointer transition-all ${
                selectedOption === option.id
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 hover:border-blue-300"
              }`}
              onClick={() => setSelectedOption(option.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <span className="text-lg font-semibold">
                      {option.label}
                    </span>
                    <Badge
                      variant={
                        option.change24h >= 0 ? "default" : "destructive"
                      }
                      className="text-xs"
                    >
                      {option.change24h >= 0 ? "+" : ""}
                      {option.change24h.toFixed(1)}%
                    </Badge>
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    {option.volume.toLocaleString()} PmpAmount 거래량
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-green-600">
                    {(option.probability * 100).toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-500">
                    {option.odds.toFixed(2)}x 배당
                  </div>
                </div>
              </div>

              {/* Probability Bar */}
              <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${option.probability * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (game.predictionType === "wdl") {
      return (
        <div className="grid grid-cols-3 gap-3">
          {game.options.map((option) => (
            <div
              key={option.id}
              className={`p-4 border-2 rounded-lg cursor-pointer transition-all text-center ${
                selectedOption === option.id
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 hover:border-blue-300"
              }`}
              onClick={() => setSelectedOption(option.id)}
            >
              <div className="text-lg font-semibold mb-2">{option.label}</div>
              <div className="text-2xl font-bold text-green-600 mb-1">
                {(option.probability * 100).toFixed(1)}%
              </div>
              <div className="text-sm text-gray-500">
                {option.odds.toFixed(2)}x
              </div>
              <div className="mt-2 w-full bg-gray-200 rounded-full h-1">
                <div
                  className="bg-blue-500 h-1 rounded-full"
                  style={{ width: `${option.probability * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (game.predictionType === "ranking") {
      return (
        <div className="space-y-2">
          {game.options
            .sort((a, b) => b.probability - a.probability)
            .map((option, index) => (
              <div
                key={option.id}
                className={`flex items-center justify-between p-3 border-2 rounded-lg cursor-pointer transition-all ${
                  selectedOption === option.id
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-blue-300"
                }`}
                onClick={() => setSelectedOption(option.id)}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center font-bold">
                    {index + 1}
                  </div>
                  <span className="font-medium">{option.label}</span>
                </div>
                <div className="flex items-center space-x-4">
                  <Badge variant="outline">
                    {(option.probability * 100).toFixed(1)}%
                  </Badge>
                  <span className="font-bold text-green-600">
                    {option.odds.toFixed(2)}x
                  </span>
                </div>
              </div>
            ))}
        </div>
      );
    }

    return null;
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg p-6 shadow-sm border">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <h1 className="text-2xl font-bold">{game.title}</h1>
              <Badge className="bg-green-100 text-green-800">
                {game.status === "ACTIVE" ? "진행중" : game.status}
              </Badge>
              <Badge variant="outline">{game.category}</Badge>
            </div>
            <p className="text-gray-600 mb-4">{game.description}</p>

            <div className="flex items-center space-x-6 text-sm text-gray-500">
              <div className="flex items-center space-x-2">
                <span>{game.creator.avatar}</span>
                <span>{game.creator.name}</span>
                <span>⭐ {game.creator.reputation}</span>
              </div>
              <div>마감: {formatTimeRemaining(game.endTime)}</div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-sm text-blue-600 font-medium">총 거래량</div>
            <div className="text-2xl font-bold text-blue-900">
              ${game.totalVolume.toLocaleString()}
            </div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-sm text-green-600 font-medium">참여자</div>
            <div className="text-2xl font-bold text-green-900">
              {game.participantCount.toLocaleString()}
            </div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="text-sm text-purple-600 font-medium">상금 풀</div>
            <div className="text-2xl font-bold text-purple-900">
              {game.prizePool.toLocaleString()} PMC
            </div>
          </div>
          <div className="bg-orange-50 p-4 rounded-lg">
            <div className="text-sm text-orange-600 font-medium">남은 시간</div>
            <div className="text-2xl font-bold text-orange-900">
              {formatTimeRemaining(game.endTime)}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Prediction Interface */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <span>🎯</span>
                <span>예측 참여</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {renderPredictionChart()}

              {/* Stake Input */}
              {selectedOption && (
                <div className="mt-6 space-y-4 border-t pt-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      투자 금액 (PmpAmount)
                    </label>
                    <input
                      type="number"
                      value={stakeAmount}
                      onChange={(e) => setStakeAmount(Number(e.target.value))}
                      min={game.minimumStake}
                      max={Math.min(game.maximumStake, userBalance.pmp)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <div className="text-xs text-gray-500 mt-1">
                      보유: {userBalance.pmp.toLocaleString()} PmpAmount • 최소:{" "}
                      {game.minimumStake.toLocaleString()} • 최대:{" "}
                      {game.maximumStake.toLocaleString()}
                    </div>
                  </div>

                  {/* Expected Return */}
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="text-sm text-green-600 font-medium mb-1">
                      예상 수익
                    </div>
                    <div className="text-xl font-bold text-green-900">
                      {expectedReturn.toLocaleString()} PmpAmount
                    </div>
                    <div className="text-xs text-green-600">
                      수익률: +
                      {(
                        ((expectedReturn - stakeAmount) / stakeAmount) *
                        100
                      ).toFixed(1)}
                      %
                    </div>
                  </div>

                  <Button
                    className="w-full"
                    size="lg"
                    onClick={() => {
                      if (onParticipate) {
                        onParticipate(selectedOption, stakeAmount);
                      } else {
                        // Default behavior: show alert or handle locally
                        alert(
                          `${selectedOption} 옵션에 ${stakeAmount} PmpAmount로 참여하였습니다!`
                        );
                      }
                    }}
                    disabled={
                      stakeAmount < game.minimumStake ||
                      stakeAmount > userBalance.pmp
                    }
                  >
                    {stakeAmount.toLocaleString()} PmpAmount로 예측 참여
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Additional Info */}
        <div className="space-y-6">
          {/* User Balance */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">내 잔고</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">PmpAmount (Risk-free)</span>
                <span className="font-bold">
                  {userBalance.pmp.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">PMC (Risky)</span>
                <span className="font-bold">
                  {userBalance.pmc.toLocaleString()}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Market Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">시장 정보</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">예측 타입</span>
                <span className="font-medium">
                  {game.predictionType === "binary" && "이진 예측"}
                  {game.predictionType === "wdl" && "승무패 예측"}
                  {game.predictionType === "ranking" && "순위 예측"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">총 거래량</span>
                <span className="font-medium">
                  ${game.totalVolume.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">24시간 변동</span>
                <span className="font-medium text-green-600">+12.3%</span>
              </div>
            </CardContent>
          </Card>

          {/* Agency Theory Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Agency Theory 적용</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-gray-600 space-y-2">
              <div>• 정보 비대칭 해결을 통한 민주적 의사결정</div>
              <div>• 전문가와 일반 사용자의 예측 비교</div>
              <div>• 집단 지성 활용한 정확도 향상</div>
              <div>• 투명한 보상 시스템</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default PredictionDetailView;
