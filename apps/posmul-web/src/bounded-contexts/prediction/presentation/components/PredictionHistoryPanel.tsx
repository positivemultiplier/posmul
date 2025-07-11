"use client";

import { Badge, Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../../shared/ui/components/base';
import React from "react";

interface PredictionHistoryPanelProps {
  userId: string;
}

// Mock 데이터
const mockPredictionHistory = [
  {
    id: "pred-1",
    gameTitle: "2024년 3분기 GDP 성장률",
    prediction: "2.8%",
    actualResult: "2.9%",
    accuracy: 0.95,
    pmpStaked: 150,
    pmcEarned: 320,
    status: "settled" as const,
    gameDate: "2024-01-15",
    settlementDate: "2024-01-22",
  },
  {
    id: "pred-2",
    gameTitle: "지방선거 투표율 예측",
    prediction: "65%",
    actualResult: "62%",
    accuracy: 0.88,
    pmpStaked: 200,
    pmcEarned: 280,
    status: "settled" as const,
    gameDate: "2024-01-10",
    settlementDate: "2024-01-17",
  },
  {
    id: "pred-3",
    gameTitle: "부산 엑스포 유치 성공 여부",
    prediction: "성공",
    actualResult: "실패",
    accuracy: 0.0,
    pmpStaked: 100,
    pmcEarned: 0,
    status: "settled" as const,
    gameDate: "2024-01-05",
    settlementDate: "2024-01-12",
  },
  {
    id: "pred-4",
    gameTitle: "서울시 따릉이 일일 이용량",
    prediction: "45,000건",
    actualResult: null,
    accuracy: null,
    pmpStaked: 80,
    pmcEarned: 0,
    status: "active" as const,
    gameDate: "2024-01-20",
    settlementDate: null,
  },
  {
    id: "pred-5",
    gameTitle: "코스피 월말 지수",
    prediction: "2,650",
    actualResult: null,
    accuracy: null,
    pmpStaked: 120,
    pmcEarned: 0,
    status: "pending" as const,
    gameDate: "2024-01-25",
    settlementDate: null,
  },
];

export const PredictionHistoryPanel: React.FC<PredictionHistoryPanelProps> = ({
  userId,
}) => {
  const history = mockPredictionHistory;

  const totalPmpStaked = history.reduce((sum, pred) => sum + pred.pmpStaked, 0);
  const totalPmcEarned = history.reduce((sum, pred) => sum + pred.pmcEarned, 0);
  const settledPredictions = history.filter(
    (pred) => pred.status === "settled"
  );
  const averageAccuracy =
    settledPredictions.length > 0
      ? settledPredictions.reduce(
          (sum, pred) => sum + (pred.accuracy || 0),
          0
        ) / settledPredictions.length
      : 0;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "settled":
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200">
            정산완료
          </Badge>
        );
      case "active":
        return (
          <Badge className="bg-blue-100 text-blue-800 border-blue-200">
            진행중
          </Badge>
        );
      case "pending":
        return (
          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
            대기중
          </Badge>
        );
      default:
        return (
          <Badge className="bg-gray-100 text-gray-800 border-gray-200">
            알 수 없음
          </Badge>
        );
    }
  };

  const getAccuracyColor = (accuracy: number | null) => {
    if (accuracy === null) return "text-gray-400";
    if (accuracy >= 0.9) return "text-green-600";
    if (accuracy >= 0.7) return "text-blue-600";
    if (accuracy >= 0.5) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          📊 예측 히스토리
        </CardTitle>
        <CardDescription>과거 예측 게임 참여 내역과 성과 분석</CardDescription>
      </CardHeader>
      <CardContent>
        {/* 요약 통계 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 text-center">
            <div className="text-sm text-blue-600 mb-1">총 투입 PmpAmount</div>
            <div className="text-xl font-bold text-blue-700">
              {totalPmpStaked.toLocaleString()}
            </div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg border border-purple-200 text-center">
            <div className="text-sm text-purple-600 mb-1">총 획득 PmcAmount</div>
            <div className="text-xl font-bold text-purple-700">
              {totalPmcEarned.toLocaleString()}
            </div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg border border-green-200 text-center">
            <div className="text-sm text-green-600 mb-1">평균 정확도</div>
            <div className="text-xl font-bold text-green-700">
              {(averageAccuracy * 100).toFixed(1)}%
            </div>
          </div>
        </div>

        {/* 예측 히스토리 목록 */}
        <div className="space-y-4">
          <h4 className="font-semibold text-gray-700 mb-3">최근 예측 내역</h4>
          {history.map((prediction) => (
            <div
              key={prediction.id}
              className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <h5 className="font-medium text-gray-800 mb-1">
                    {prediction.gameTitle}
                  </h5>
                  <div className="text-sm text-gray-600">
                    게임 일자: {prediction.gameDate}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(prediction.status)}
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <div className="text-gray-500 mb-1">내 예측</div>
                  <div className="font-medium text-blue-600">
                    {prediction.prediction}
                  </div>
                </div>
                <div>
                  <div className="text-gray-500 mb-1">실제 결과</div>
                  <div className="font-medium text-gray-700">
                    {prediction.actualResult || "미정"}
                  </div>
                </div>
                <div>
                  <div className="text-gray-500 mb-1">정확도</div>
                  <div
                    className={`font-medium ${getAccuracyColor(
                      prediction.accuracy
                    )}`}
                  >
                    {prediction.accuracy !== null
                      ? `${(prediction.accuracy * 100).toFixed(1)}%`
                      : "-"}
                  </div>
                </div>
                <div>
                  <div className="text-gray-500 mb-1">수익/손실</div>
                  <div className="font-medium">
                    <span className="text-red-600">
                      -{prediction.pmpStaked} PmpAmount
                    </span>
                    {prediction.pmcEarned > 0 && (
                      <>
                        <br />
                        <span className="text-green-600">
                          +{prediction.pmcEarned} PmcAmount
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {prediction.status === "settled" && prediction.settlementDate && (
                <div className="mt-3 pt-3 border-t text-xs text-gray-500">
                  정산 일자: {prediction.settlementDate}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* 성과 분석 */}
        <div className="mt-6 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg border border-indigo-200">
          <h4 className="font-semibold text-indigo-700 mb-3">📈 성과 분석</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <div className="font-medium text-indigo-600 mb-1">
                🎯 예측 패턴 분석
              </div>
              <div className="text-indigo-600">
                경제 지표 예측에서 높은 정확도(
                {averageAccuracy > 0.8 ? "우수" : "보통"})를 보입니다. 정치/사회
                이슈 예측 능력 향상이 필요합니다.
              </div>
            </div>
            <div>
              <div className="font-medium text-indigo-600 mb-1">
                💰 수익성 분석
              </div>
              <div className="text-indigo-600">
                PmpAmount 대비 PmcAmount 수익률:{" "}
                {((totalPmcEarned / totalPmpStaked) * 100).toFixed(1)}%
                {totalPmcEarned > totalPmpStaked ? " (수익)" : " (손실)"}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
