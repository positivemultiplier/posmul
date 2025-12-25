"use client";

import { useState, useEffect } from "react";
import { Card } from "../../../../shared/ui";
import { withdrawPrediction } from "./actions";

import type { GameOption } from "../../domain/value-objects/prediction-types";

interface Prediction {
  prediction_id: string;
  game_id: string;
  user_id: string;
  prediction_data: { selectedOptionId: string };
  bet_amount: number;
  confidence_level: number;
  is_active: boolean;
  created_at: string;
  game?: {
    game_id: string;
    title: string;
    status: string;
    game_options: unknown;
    settlement_date: string;
  };
}

interface MyPredictionsProps {
  userId: string;
}

export function MyPredictions({ userId }: MyPredictionsProps) {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [withdrawing, setWithdrawing] = useState<string | null>(null);

  useEffect(() => {
    fetchMyPredictions();
  }, [userId]);

  const fetchMyPredictions = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/predictions/my?userId=${userId}`, {
        credentials: "include",
      });
      const data = await response.json();

      if (data.success) {
        setPredictions(data.data.predictions || []);
      } else {
        setError(data.error?.message || "예측 내역을 불러오는데 실패했습니다.");
      }
    } catch (err) {
      setError("예측 내역을 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async (predictionId: string) => {
    if (!confirm("예측을 철회하시겠습니까? 배팅한 PMP가 반환됩니다.")) {
      return;
    }

    try {
      setWithdrawing(predictionId);
      
      // Server Action 사용 (인증 문제 해결)
      const result = await withdrawPrediction(predictionId);

      if (result.success) {
        // 목록 새로고침
        fetchMyPredictions();
        alert(result.message || "예측이 철회되었습니다. PMP가 반환되었습니다.");
      } else {
        alert(result.error || "철회에 실패했습니다.");
      }
    } catch (err) {
      alert("철회 중 오류가 발생했습니다.");
    } finally {
      setWithdrawing(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; color: string }> = {
      PENDING: { label: "대기중", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200" },
      ACTIVE: { label: "진행중", color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" },
      SETTLED: { label: "정산완료", color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" },
      CANCELLED: { label: "취소됨", color: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200" },
    };
    const info = statusMap[status] || { label: status, color: "bg-gray-100 text-gray-800" };
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${info.color}`}>
        {info.label}
      </span>
    );
  };

  const getSelectedOptionLabel = (prediction: Prediction) => {
    const selectedOptionId = prediction.prediction_data?.selectedOptionId;
    if (!selectedOptionId) return "-";

    const rawOptions = prediction.game?.game_options;
    const parsedOptions = parseGameOptions(rawOptions);
    if (!parsedOptions) return selectedOptionId;

    const selectedOption = parsedOptions.find((opt) => opt.id === selectedOptionId);
    return selectedOption?.label || selectedOptionId;
  };

  const canWithdraw = (prediction: Prediction) => {
    // ACTIVE 상태이고 is_active가 true인 경우만 철회 가능
    return prediction.game?.status === "ACTIVE" && prediction.is_active;
  };

  if (loading) {
    return (
      <Card className="p-8 text-center bg-white dark:bg-gray-800">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mx-auto mb-4"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mx-auto"></div>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-8 text-center bg-white dark:bg-gray-800">
        <p className="text-red-500">{error}</p>
        <button 
          onClick={fetchMyPredictions}
          className="mt-4 text-blue-500 hover:underline"
        >
          다시 시도
        </button>
      </Card>
    );
  }

  if (predictions.length === 0) {
    return (
      <Card className="p-8 text-center text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800">
        <p>아직 예측 내역이 없습니다.</p>
        <p className="text-sm mt-2">
          예측 게임에 참여하거나 투자를 시작해보세요!
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {predictions.map((prediction) => (
        <Card 
          key={prediction.prediction_id} 
          className={`p-4 bg-white dark:bg-gray-800 border-l-4 ${
            prediction.is_active 
              ? "border-l-blue-500" 
              : "border-l-gray-300 opacity-75"
          }`}
        >
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  {prediction.game?.title || "알 수 없는 게임"}
                </h3>
                {getStatusBadge(prediction.game?.status || "UNKNOWN")}
                {prediction.is_active && (
                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                    내 예측
                  </span>
                )}
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-500 dark:text-gray-400">선택:</span>
                  <span className="ml-2 font-medium text-gray-900 dark:text-white">
                    {getSelectedOptionLabel(prediction)}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">배팅:</span>
                  <span className="ml-2 font-medium text-blue-600 dark:text-blue-400">
                    {Number(prediction.bet_amount).toLocaleString()} PMP
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">확신도:</span>
                  <span className="ml-2 font-medium text-gray-900 dark:text-white">
                    {prediction.confidence_level}%
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">참여일:</span>
                  <span className="ml-2 font-medium text-gray-900 dark:text-white">
                    {new Date(prediction.created_at).toLocaleDateString("ko-KR")}
                  </span>
                </div>
              </div>
            </div>

            {/* 철회 버튼 */}
            {canWithdraw(prediction) && (
              <button
                onClick={() => handleWithdraw(prediction.prediction_id)}
                disabled={withdrawing === prediction.prediction_id}
                className="ml-4 px-3 py-1.5 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-900/30 dark:hover:bg-red-900/50 dark:text-red-400 rounded-lg transition-colors disabled:opacity-50"
              >
                {withdrawing === prediction.prediction_id ? "처리중..." : "철회"}
              </button>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
}

const isGameOption = (value: unknown): value is GameOption => {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Record<string, unknown>;
  return typeof record.id === "string" && typeof record.label === "string";
};

const parseGameOptions = (raw: unknown): GameOption[] | null => {
  if (raw === null || raw === undefined) return null;

  const value: unknown = typeof raw === "string" ? safeJsonParse(raw) : raw;

  if (Array.isArray(value)) {
    const options = value.filter(isGameOption);
    return options.length > 0 ? options : null;
  }

  if (typeof value === "object" && value !== null) {
    const record = value as Record<string, unknown>;
    const nested = record.options;
    if (Array.isArray(nested)) {
      const options = nested.filter(isGameOption);
      return options.length > 0 ? options : null;
    }
  }

  return null;
};

const safeJsonParse = (raw: string): unknown => {
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return null;
  }
};

export default MyPredictions;
