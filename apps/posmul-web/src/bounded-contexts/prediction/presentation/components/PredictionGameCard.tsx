"use client";

import React, { useState } from "react";

import { Badge, Button, Card } from "../../../../shared/ui/components/base";
import { PredictionBettingModal } from "./betting/PredictionBettingModal";
import ErrorDisplay from "./shared/ErrorDisplay";
import { supabase } from "../../../../lib/supabase/direct-client";

import { GameStatus, PredictionType } from "../../domain/value-objects/prediction-types";
import PredictionErrorService from "../../application/services/prediction-error.service";

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

interface UserPrediction {
  prediction_id: string;
  game_id: string;
  bet_amount: number | null;
  is_active: boolean;
  prediction_data: Record<string, unknown> | null;
}

interface PredictionGameCardProps {
  game: PredictionGame;
  userId?: string;
  myPrediction?: UserPrediction;
  onBetClick?: (game: PredictionGame) => void;
  onDetailsClick?: (game: PredictionGame) => void;
  className?: string;
}

const PredictionGameCard: React.FC<PredictionGameCardProps> = ({
  game,
  userId,
  myPrediction,
  onBetClick,
  onDetailsClick,
  className,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [stakeAmount, setStakeAmount] = useState<number>(game.minimumStake);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const getStatusBadge = (status: GameStatus) => {
    const statusConfig = {
      [GameStatus.PENDING]: { label: "시작 예정", variant: "secondary" as const },
      [GameStatus.CREATED]: { label: "생성됨", variant: "secondary" as const },
      [GameStatus.ACTIVE]: { label: "참여 가능", variant: "default" as const },
      [GameStatus.ENDED]: { label: "종료", variant: "outline" as const },
      [GameStatus.COMPLETED]: { label: "정산 완료", variant: "success" as const },
      [GameStatus.CANCELLED]: { label: "취소됨", variant: "destructive" as const },
    };

    const config = statusConfig[status];
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getImportanceIcon = (score: number) => {
    if (score >= 2.5) return "🔥"; // 높은 중요도
    if (score >= 2.0) return "⭐"; // 중간 중요도
    return "📊"; // 일반 중요도
  };

  const getPredictionTypeIcon = (type: PredictionType) => {
    switch (type) {
      case PredictionType.BINARY:
        return "⚡";
      case PredictionType.WIN_DRAW_LOSE:
        return "🥊";
      case PredictionType.RANKING:
        return "📈";
      default:
        return "🎯";
    }
  };

  const getPredictionTypeLabel = (type: PredictionType) => {
    switch (type) {
      case PredictionType.BINARY:
        return "이진 예측";
      case PredictionType.WIN_DRAW_LOSE:
        return "승무패";
      case PredictionType.RANKING:
        return "순위 예측";
      default:
        return "예측";
    }
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

  // Binary 타입용 옵션 선택 핸들러
  const handleBinaryOptionSelect = (optionId: string) => {
    setSelectedOption(optionId);
  };

  // WDL 타입용 옵션 선택 핸들러  
  const handleWDLOptionSelect = (optionId: string) => {
    setSelectedOption(optionId);
  };

  // Ranking 타입용 다중 선택 핸들러
  const handleRankingOptionToggle = (optionId: string) => {
    setSelectedOptions(prev => {
      if (prev.includes(optionId)) {
        return prev.filter(id => id !== optionId);
      } else {
        // 최대 5개까지만 선택 가능
        if (prev.length >= 5) {
          setError("최대 5개까지만 선택할 수 있습니다.");
          return prev;
        }
        return [...prev, optionId];
      }
    });
    setError(null);
  };

  const handleParticipate = async () => {
    setError(null);
    setIsLoading(true);

    try {
      // 타입별 검증
      let validation;
      if (game.predictionType === PredictionType.RANKING) {
        validation = PredictionErrorService.validateParticipation(
          game,
          userId,
          selectedOptions.length > 0 ? selectedOptions[0] : null,
          stakeAmount
        );
        if (selectedOptions.length === 0) {
          setError("최소 1개 이상의 옵션을 선택해주세요.");
          setIsLoading(false);
          return;
        }
      } else {
        validation = PredictionErrorService.validateParticipation(
          game,
          userId,
          selectedOption,
          stakeAmount
        );
      }

      if (!validation.isValid) {
        setError(validation.error || "참여할 수 없습니다.");
        setIsLoading(false);
        return;
      }

      // Prediction Data 구성
      const predictionData = game.predictionType === PredictionType.RANKING
        ? { selectedOptionIds: selectedOptions }
        : { selectedOptionId: selectedOption };

      // RPC 호출
      const { data, error: rpcError } = await supabase.rpc('participate_in_prediction_game', {
        p_game_id: game.id,
        p_prediction_data: predictionData,
        p_bet_amount: stakeAmount,
        p_confidence_level: 50 // 기본값 설정 (UI에 슬라이더 추가 가능)
      });

      if (rpcError) {
        throw new Error(rpcError.message);
      }

      // 성공 시 부모 컴포넌트에 알림
      if (onBetClick) {
        onBetClick(game);
      }

      // 성공 메시지 또는 상태 업데이트 (여기서는 간단히 alert 사용하거나 상태 초기화)
      alert("참여가 완료되었습니다!");
      setError(null);

    } catch (error) {
      console.error("Participation error:", error);
      const errorMessage = error instanceof Error ? error.message : "참여 중 오류가 발생했습니다.";
      // 사용자 친화적 에러 메시지 변환
      if (errorMessage.includes("Insufficient PMP balance")) {
        setError("PMP 잔액이 부족합니다.");
      } else {
        setError(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Binary 타입 옵션 렌더링
  const renderBinaryOptions = () => (
    <div className="grid grid-cols-2 gap-3">
      {game.options.map((option) => (
        <div
          key={option.id}
          className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${selectedOption === option.id
            ? "border-blue-500 bg-blue-50 shadow-md"
            : "border-gray-200 hover:border-gray-300 hover:shadow-sm"
            }`}
          onClick={() => handleBinaryOptionSelect(option.id)}
        >
          <div className="text-center">
            <div className="text-lg font-semibold mb-1">{option.text}</div>
            <div className="text-sm text-gray-600 mb-2">
              확률 {(option.currentOdds * 100).toFixed(1)}%
            </div>
            <div className="text-xs text-blue-600 font-medium">
              배당률 {(1 / option.currentOdds).toFixed(2)}x
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  // WDL 타입 옵션 렌더링
  const renderWDLOptions = () => (
    <div className="grid grid-cols-3 gap-2">
      {game.options.map((option) => (
        <div
          key={option.id}
          className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${selectedOption === option.id
            ? "border-green-500 bg-green-50 shadow-md"
            : "border-gray-200 hover:border-gray-300 hover:shadow-sm"
            }`}
          onClick={() => handleWDLOptionSelect(option.id)}
        >
          <div className="text-center">
            <div className="font-semibold text-sm mb-1">{option.text}</div>
            <div className="text-xs text-gray-600 mb-1">
              {(option.currentOdds * 100).toFixed(1)}%
            </div>
            <div className="text-xs text-green-600 font-medium">
              {(1 / option.currentOdds).toFixed(2)}x
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  // Ranking 타입 옵션 렌더링
  const renderRankingOptions = () => (
    <div className="space-y-2">
      <div className="text-sm text-gray-600 mb-3">
        상위 5개까지 선택 가능 (현재 {selectedOptions.length}개 선택됨)
      </div>
      {game.options.map((option, index) => (
        <div
          key={option.id}
          className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${selectedOptions.includes(option.id)
            ? "border-purple-500 bg-purple-50 shadow-sm"
            : "border-gray-200 hover:border-gray-300"
            }`}
          onClick={() => handleRankingOptionToggle(option.id)}
        >
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-6 h-6 rounded-full border-2 border-purple-500">
              {selectedOptions.includes(option.id) && (
                <div className="w-3 h-3 rounded-full bg-purple-500"></div>
              )}
            </div>
            <div className="text-sm font-medium">{option.text}</div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-600">
              {(option.currentOdds * 100).toFixed(1)}%
            </div>
            <div className="text-xs text-purple-600 font-medium">
              {(1 / option.currentOdds).toFixed(2)}x
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  // 타입별 옵션 렌더링 선택
  const renderOptions = () => {
    if (!isExpanded && game.options.length > 3) {
      // 축약된 버전
      return (
        <div className="space-y-2">
          {game.options.slice(0, 2).map((option) => (
            <div
              key={option.id}
              className="flex items-center justify-between p-2 rounded border border-gray-200"
            >
              <span className="text-sm font-medium">{option.text}</span>
              <div className="text-right">
                <div className="text-sm font-medium">
                  {(option.currentOdds * 100).toFixed(1)}%
                </div>
                <div className="text-xs text-gray-500">
                  배당률 {(1 / option.currentOdds).toFixed(2)}x
                </div>
              </div>
            </div>
          ))}
          <div className="text-center text-sm text-gray-500">
            +{game.options.length - 2}개 더...
          </div>
        </div>
      );
    }

    // 전체 버전 - 타입별 렌더링
    switch (game.predictionType) {
      case PredictionType.BINARY:
        return renderBinaryOptions();
      case PredictionType.WIN_DRAW_LOSE:
        return renderWDLOptions();
      case PredictionType.RANKING:
        return renderRankingOptions();
      default:
        return renderBinaryOptions();
    }
  };

  const isValidSelection = () => {
    if (game.predictionType === PredictionType.RANKING) {
      return selectedOptions.length > 0;
    }
    return selectedOption !== null;
  };

  return (
    <Card className={`p-6 hover:shadow-lg transition-shadow duration-200 relative ${myPrediction ? 'border-l-4 border-l-purple-500 bg-purple-50/50 dark:bg-purple-900/10' : ''}`}>
      {/* My Prediction Badge */}
      {myPrediction && (
        <div className="absolute top-3 right-3 z-10">
          <Badge variant="default" className="bg-purple-500 text-white text-xs px-2 py-1">
            🎯 참여 중
          </Badge>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="mb-4">
          <ErrorDisplay
            message={error}
            type="error"
            onDismiss={() => setError(null)}
            dismissible={true}
          />
        </div>
      )}

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
              <Badge variant="outline" className="text-xs">
                {getPredictionTypeIcon(game.predictionType)} {getPredictionTypeLabel(game.predictionType)}
              </Badge>
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
              {formatCurrency(game.allocatedPrizePool)} PMC
            </div>
          </div>
          <div>
            <span className="text-gray-500">🎯 참여 범위</span>
            <div className="font-medium text-blue-600">
              {formatCurrency(game.minimumStake)} -{" "}
              {formatCurrency(game.maximumStake)} PMP
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
              {formatCurrency(game.totalStake)} PMP
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

      {/* Options Section */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-gray-700">
            {game.predictionType === PredictionType.RANKING ? "순위 선택" : "예측 옵션"}
          </span>
          {game.options.length > 3 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? "접기" : "더보기"}
            </Button>
          )}
        </div>

        {renderOptions()}
      </div>

      {/* My Prediction Info (if participated) */}
      {myPrediction && (
        <div className="mb-4 p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg border border-purple-200 dark:border-purple-700">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm font-medium text-purple-700 dark:text-purple-300">
                💜 나의 예측
              </span>
              <div className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                베팅액: {formatCurrency(myPrediction.bet_amount || 0)} PMP
              </div>
            </div>
            <Badge variant="outline" className="border-purple-500 text-purple-600 dark:text-purple-400 text-xs">
              참여 완료
            </Badge>
          </div>
        </div>
      )}

      {/* Participation Section */}
      {game.status === GameStatus.ACTIVE && userId && !myPrediction && (
        <div className="border-t pt-4">
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <label className="block text-xs text-gray-500 mb-1">
                PMP 베팅액
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
              disabled={!isValidSelection() || isLoading}
              className="px-6"
            >
              {isLoading ? "처리 중..." : "🎯 참여하기"}
            </Button>
          </div>

          {isValidSelection() && (
            <div className="mt-2 text-xs text-gray-600">
              {game.predictionType === PredictionType.RANKING ? (
                <>
                  선택된 옵션: {selectedOptions.length}개 | 예상 PMC 수익:{" "}
                  <span className="font-medium text-green-600">
                    {formatCurrency(stakeAmount * 2.0)} PMC
                  </span>
                </>
              ) : (
                <>
                  예상 PMC 수익:{" "}
                  <span className="font-medium text-green-600">
                    {formatCurrency(stakeAmount * 1.5)} PMC
                  </span>{" "}
                  (정확도에 따라 변동)
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* Login Required */}
      {game.status === GameStatus.ACTIVE && !userId && (
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