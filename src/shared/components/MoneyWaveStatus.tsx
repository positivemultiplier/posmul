"use client";

import { Badge } from "@/shared/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import React, { useEffect, useState } from "react";

// Mock 데이터
const mockMoneyWaveData = {
  currentWave: 1,
  nextWaveCountdown: 8 * 60 * 60 + 45 * 60 + 30, // 8시간 45분 30초 (초 단위)
  dailyEbitPool: 2450000, // 일일 EBIT 기반 상금 풀
  totalAllocated: 1680000, // 현재 배정된 금액
  wave1Status: {
    dailyPool: 2450000,
    gamesActive: 12,
    participantsToday: 847,
    averageAccuracy: 0.82,
  },
  wave2Status: {
    redistributedAmount: 180000,
    idlePmcUsers: 156,
    avgIdleDays: 8.5,
    redistributionRate: 0.15,
  },
  wave3Status: {
    enterpriseRequests: 5,
    customGamesCreated: 3,
    businessDataCollected: 2,
    avgEngagement: 0.74,
  },
};

export const MoneyWaveStatus: React.FC = () => {
  const [countdown, setCountdown] = useState(
    mockMoneyWaveData.nextWaveCountdown
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const getWaveColor = (waveNumber: number) => {
    const colors = {
      1: "from-blue-50 to-cyan-50 border-blue-200",
      2: "from-green-50 to-emerald-50 border-green-200",
      3: "from-purple-50 to-indigo-50 border-purple-200",
    };
    return (
      colors[waveNumber as keyof typeof colors] ||
      "from-gray-50 to-gray-100 border-gray-200"
    );
  };

  const data = mockMoneyWaveData;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🌊 MoneyWave 시스템 현황
        </CardTitle>
        <CardDescription>
          실시간 EBIT 기반 상금 풀과 PMC 순환 경제 상태
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* 다음 웨이브 카운트다운 */}
        <div className="mb-6 p-6 bg-gradient-to-r from-orange-50 to-red-50 rounded-lg border border-orange-200 text-center">
          <h3 className="text-lg font-semibold text-orange-700 mb-2">
            ⏰ 다음 MoneyWave까지
          </h3>
          <div className="text-4xl font-bold text-orange-600 mb-2 font-mono">
            {formatTime(countdown)}
          </div>
          <div className="text-sm text-orange-600">
            매일 자정(00:00)에 새로운 상금 풀이 생성됩니다
          </div>
        </div>

        {/* 전체 풀 현황 */}
        <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 text-center">
            <div className="text-sm text-blue-600 mb-1">일일 EBIT 풀</div>
            <div className="text-xl font-bold text-blue-700">
              ₩{data.dailyEbitPool.toLocaleString()}
            </div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg border border-green-200 text-center">
            <div className="text-sm text-green-600 mb-1">배정 완료</div>
            <div className="text-xl font-bold text-green-700">
              ₩{data.totalAllocated.toLocaleString()}
            </div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg border border-purple-200 text-center">
            <div className="text-sm text-purple-600 mb-1">잔여 풀</div>
            <div className="text-xl font-bold text-purple-700">
              ₩{(data.dailyEbitPool - data.totalAllocated).toLocaleString()}
            </div>
          </div>
        </div>

        {/* MoneyWave 1: EBIT 기반 상금 풀 */}
        <div
          className={`mb-6 p-6 bg-gradient-to-r ${getWaveColor(
            1
          )} rounded-lg border`}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-blue-700">
              🏆 MoneyWave1: EBIT 기반 상금 풀
            </h3>
            <Badge className="bg-blue-100 text-blue-800 border-blue-200">
              활성
            </Badge>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                ₩{data.wave1Status.dailyPool.toLocaleString()}
              </div>
              <div className="text-sm text-blue-600">일일 상금 풀</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {data.wave1Status.gamesActive}
              </div>
              <div className="text-sm text-blue-600">활성 게임</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {data.wave1Status.participantsToday}
              </div>
              <div className="text-sm text-blue-600">오늘 참여자</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {(data.wave1Status.averageAccuracy * 100).toFixed(1)}%
              </div>
              <div className="text-sm text-blue-600">평균 정확도</div>
            </div>
          </div>
        </div>

        {/* MoneyWave 2: 미소비 PMC 재분배 */}
        <div
          className={`mb-6 p-6 bg-gradient-to-r ${getWaveColor(
            2
          )} rounded-lg border`}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-green-700">
              🔄 MoneyWave2: 미소비 PMC 재분배
            </h3>
            <Badge className="bg-green-100 text-green-800 border-green-200">
              순환중
            </Badge>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {data.wave2Status.redistributedAmount.toLocaleString()}
              </div>
              <div className="text-sm text-green-600">재분배 PMC</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {data.wave2Status.idlePmcUsers}
              </div>
              <div className="text-sm text-green-600">미사용 사용자</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {data.wave2Status.avgIdleDays.toFixed(1)}
              </div>
              <div className="text-sm text-green-600">평균 보유일</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {(data.wave2Status.redistributionRate * 100).toFixed(1)}%
              </div>
              <div className="text-sm text-green-600">재분배율</div>
            </div>
          </div>
          <div className="mt-4 text-sm text-green-600">
            💡 Loss Aversion 효과로 {data.wave2Status.idlePmcUsers}명의 사용자가
            PMC 사용을 고려 중입니다.
          </div>
        </div>

        {/* MoneyWave 3: 기업가 맞춤 예측 */}
        <div
          className={`mb-6 p-6 bg-gradient-to-r ${getWaveColor(
            3
          )} rounded-lg border`}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-purple-700">
              🏢 MoneyWave3: 기업가 맞춤 예측
            </h3>
            <Badge className="bg-purple-100 text-purple-800 border-purple-200">
              확장중
            </Badge>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {data.wave3Status.enterpriseRequests}
              </div>
              <div className="text-sm text-purple-600">기업 요청</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {data.wave3Status.customGamesCreated}
              </div>
              <div className="text-sm text-purple-600">맞춤 게임</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {data.wave3Status.businessDataCollected}
              </div>
              <div className="text-sm text-purple-600">데이터 수집</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {(data.wave3Status.avgEngagement * 100).toFixed(1)}%
              </div>
              <div className="text-sm text-purple-600">참여도</div>
            </div>
          </div>
          <div className="mt-4 text-sm text-purple-600">
            🎯 ESG 마케팅과 연계된 예측 게임으로 기업과 사용자 모두에게 가치를
            제공합니다.
          </div>
        </div>

        {/* 시스템 효율성 지표 */}
        <div className="p-4 bg-gradient-to-r from-gray-50 to-slate-50 rounded-lg border border-gray-200">
          <h4 className="font-semibold text-gray-700 mb-3">
            📊 시스템 효율성 지표
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <div className="font-medium text-gray-600 mb-1">
                💰 자본 효율성
              </div>
              <div className="text-gray-600">
                배정률:{" "}
                {((data.totalAllocated / data.dailyEbitPool) * 100).toFixed(1)}%
                <br />
                <span className="text-green-600">
                  {data.totalAllocated / data.dailyEbitPool > 0.6
                    ? "효율적"
                    : "개선 필요"}
                </span>
              </div>
            </div>
            <div>
              <div className="font-medium text-gray-600 mb-1">
                🔄 순환 효율성
              </div>
              <div className="text-gray-600">
                재분배율:{" "}
                {(data.wave2Status.redistributionRate * 100).toFixed(1)}%
                <br />
                <span className="text-blue-600">
                  {data.wave2Status.redistributionRate > 0.1
                    ? "활발한 순환"
                    : "순환 부족"}
                </span>
              </div>
            </div>
            <div>
              <div className="font-medium text-gray-600 mb-1">
                🎯 참여 효율성
              </div>
              <div className="text-gray-600">
                정확도: {(data.wave1Status.averageAccuracy * 100).toFixed(1)}%
                <br />
                <span className="text-purple-600">
                  {data.wave1Status.averageAccuracy > 0.8
                    ? "높은 품질"
                    : "품질 개선 필요"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
