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

// 슬롯머신 스타일 숫자 컴포넌트 - 매초 스핀
const SlotDigit: React.FC<{
  digit: number;
  shouldSpin: boolean;
}> = ({ digit, shouldSpin }) => {
  const [displayDigit, setDisplayDigit] = useState(digit);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (shouldSpin) {
      setIsAnimating(true);

      // 빠르게 몇 번 스핀한 후 목표 숫자로 설정
      let spinCount = 0;
      const maxSpins = 4;

      const spinInterval = setInterval(() => {
        if (spinCount < maxSpins) {
          setDisplayDigit(Math.floor(Math.random() * 10));
          spinCount++;
        } else {
          setDisplayDigit(digit);
          setIsAnimating(false);
          clearInterval(spinInterval);
        }
      }, 80);

      return () => clearInterval(spinInterval);
    } else {
      setDisplayDigit(digit);
      setIsAnimating(false);
    }
  }, [digit, shouldSpin]);

  return (
    <span
      className={`inline-block w-16 text-center transition-all duration-200 ${
        isAnimating ? "text-orange-500 animate-pulse" : "text-orange-600"
      }`}
      style={{
        textShadow: isAnimating ? "0 0 8px rgba(255,165,0,0.6)" : "none",
      }}
    >
      {displayDigit}
    </span>
  );
};

// 슬롯머신 스타일 금액 표시 컴포넌트 - 매초 스핀
const SlotMachineAmount: React.FC<{
  amount: number;
  triggerSpin: number; // 매초마다 변경되는 트리거
}> = ({ amount, triggerSpin }) => {
  // 금액을 천 단위 콤마로 포맷팅
  const formattedAmount = amount.toLocaleString("ko-KR");

  return (
    <div className="flex items-center justify-center">
      <span className="text-8xl font-bold text-orange-600 mr-2">₩</span>
      <div className="text-8xl font-bold text-orange-600 font-mono flex items-center">
        {formattedAmount.split("").map((char, index) =>
          char === "," ? (
            <span key={index} className="text-orange-600 mx-1">
              ,
            </span>
          ) : (
            <SlotDigit
              key={index}
              digit={parseInt(char)}
              shouldSpin={triggerSpin > 0 && !isNaN(parseInt(char))} // 숫자일 때만 스핀
            />
          )
        )}
      </div>
    </div>
  );
};

// 컨텍스트 인식을 위한 인터페이스 추가
interface RouteContext {
  domain?: "prediction" | "investment" | "forum" | "donation";
  category?: "sports" | "entertainment" | "politics" | "invest";
  subcategory?: "soccer" | "baseball" | "basketball" | "esports";
  gameId?: string;
}

interface MoneyWaveStatusProps {
  context?: RouteContext;
  displayMode?: "full" | "compact" | "mini";
  showDetails?: boolean;
}

// 컨텍스트별 데이터 계산 함수
const getContextualData = (context?: RouteContext) => {
  const baseData = mockMoneyWaveData;

  if (!context) return baseData;

  // 카테고리별 필터링 로직 (기존 Money Wave 계산 로직 활용)
  let filteredData = { ...baseData };

  if (context.category === "sports") {
    // 스포츠 카테고리 필터링
    filteredData = {
      ...baseData,
      wave1Status: {
        ...baseData.wave1Status,
        gamesActive: context.subcategory === "soccer" ? 6 : 12, // 축구만 6개
        participantsToday: context.subcategory === "soccer" ? 4862 : 847, // 축구 참여자
      },
      dailyEbitPool:
        context.subcategory === "soccer"
          ? Math.floor(baseData.dailyEbitPool * 0.3) // 축구는 30% 할당
          : baseData.dailyEbitPool,
    };
  }

  if (context.category === "entertainment") {
    filteredData = {
      ...baseData,
      wave1Status: {
        ...baseData.wave1Status,
        gamesActive: 8,
        participantsToday: 623,
      },
      dailyEbitPool: Math.floor(baseData.dailyEbitPool * 0.2), // 엔터테인먼트는 20%
    };
  }

  return filteredData;
};

// 컨텍스트별 제목 생성
const getContextualTitle = (context?: RouteContext) => {
  if (context?.subcategory) {
    const subcategoryNames = {
      soccer: "축구",
      baseball: "야구",
      basketball: "농구",
      esports: "e스포츠",
    };
    return `${
      subcategoryNames[context.subcategory as keyof typeof subcategoryNames]
    } MoneyWave`;
  }

  if (context?.category) {
    const categoryNames = {
      sports: "스포츠",
      entertainment: "엔터테인먼트",
      politics: "정치",
      invest: "투자",
    };
    return `${
      categoryNames[context.category as keyof typeof categoryNames]
    } MoneyWave`;
  }

  return "Global MoneyWave 시스템";
};

export const MoneyWaveStatus: React.FC<MoneyWaveStatusProps> = ({
  context,
  displayMode = "full",
  showDetails = false,
}) => {
  const [countdown, setCountdown] = useState(
    mockMoneyWaveData.nextWaveCountdown
  );
  const [isDetailsExpanded, setIsDetailsExpanded] = useState(false);
  const [spinTrigger, setSpinTrigger] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
      // 매초마다 스핀 트리거 증가
      setSpinTrigger((prev) => prev + 1);
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

  const data = getContextualData(context);

  // 절반에서 시작해서 매초 증가
  const baseAmount = data.dailyEbitPool / 2; // 1,225,000에서 시작
  const totalElapsed = mockMoneyWaveData.nextWaveCountdown - countdown; // 경과 시간
  const currentAmount = Math.floor(baseAmount + totalElapsed * 25); // 매초 25원씩 증가

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {getContextualTitle(context)}
        </CardTitle>
        <CardDescription>
          {context?.subcategory
            ? `${getContextualTitle(context)} 실시간 상금 풀과 참여 현황`
            : context?.category
            ? `${getContextualTitle(context)} 카테고리별 MoneyWave 현황`
            : "실시간 EBIT 기반 상금 풀과 PMC 순환 경제 상태"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {displayMode === "compact" ? (
          // 컴팩트 모드: 핵심 정보만 표시
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-orange-50 p-3 rounded-lg text-center">
              <div className="text-sm text-orange-600 mb-1">상금 풀</div>
              <div className="text-lg font-bold text-orange-700">
                ₩{currentAmount.toLocaleString()}
              </div>
            </div>
            <div className="bg-blue-50 p-3 rounded-lg text-center">
              <div className="text-sm text-blue-600 mb-1">활성 게임</div>
              <div className="text-lg font-bold text-blue-700">
                {data.wave1Status.gamesActive}개
              </div>
            </div>
            <div className="bg-green-50 p-3 rounded-lg text-center">
              <div className="text-sm text-green-600 mb-1">참여자</div>
              <div className="text-lg font-bold text-green-700">
                {data.wave1Status.participantsToday}명
              </div>
            </div>
            <div className="bg-purple-50 p-3 rounded-lg text-center">
              <div className="text-sm text-purple-600 mb-1">다음 Wave</div>
              <div className="text-lg font-bold text-purple-700">
                {formatTime(countdown)}
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* 메인 카운트다운 - 크게 표시 */}
            <div className="mb-6 p-8 bg-gradient-to-r from-orange-50 to-red-50 rounded-lg border border-orange-200 text-center">
              {/* 슬롯머신 스타일 금액 표시 */}
              <div className="mb-6">
                <h3 className="text-lg font-medium text-orange-700 mb-4">
                  💰{" "}
                  {context?.subcategory
                    ? `${getContextualTitle(context)} `
                    : ""}
                  실시간 상금 풀
                </h3>
                <div className="mb-4 min-h-[120px] flex items-center justify-center">
                  <SlotMachineAmount
                    amount={currentAmount}
                    triggerSpin={spinTrigger}
                  />
                </div>
                <div className="text-sm text-orange-600">
                  🎰 매초 스핀하며 증가하는 상금 풀 (EBIT 기반)
                  {context?.category && (
                    <span className="block mt-1">
                      📊 {getContextualTitle(context)} 카테고리 할당분
                    </span>
                  )}
                </div>
              </div>

              {/* 시간 카운트다운 */}
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-orange-700 mb-3">
                  ⏰ 다음 MoneyWave까지
                </h3>
                <div className="text-4xl font-bold text-orange-600 mb-3 font-mono">
                  {formatTime(countdown)}
                </div>
                <div className="text-base text-orange-600">
                  매일 자정(00:00)에 새로운 상금 풀이 생성됩니다
                </div>
              </div>

              {/* 간단한 요약 정보 - 컨텍스트별 맞춤 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                <div className="bg-white/50 p-3 rounded-lg">
                  <div className="text-sm text-orange-600 mb-1">
                    {context?.subcategory
                      ? `${getContextualTitle(context)} `
                      : ""}
                    참여자
                  </div>
                  <div className="text-xl font-bold text-orange-700">
                    {data.wave1Status.participantsToday}명
                  </div>
                </div>
                <div className="bg-white/50 p-3 rounded-lg">
                  <div className="text-sm text-orange-600 mb-1">
                    {context?.subcategory
                      ? `${getContextualTitle(context)} `
                      : ""}
                    활성 게임
                  </div>
                  <div className="text-xl font-bold text-orange-700">
                    {data.wave1Status.gamesActive}개
                  </div>
                </div>
              </div>
            </div>

            {/* 세부 정보 토글 (풀 모드에서만 표시) */}
            {displayMode === "full" && (
              <div className="mt-6">
                <button
                  onClick={() => setIsDetailsExpanded(!isDetailsExpanded)}
                  className="w-full flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <span className="text-sm font-medium text-gray-700">
                    📊 MoneyWave 상세 분석 보기
                  </span>
                  <span className="text-gray-500">
                    {isDetailsExpanded ? "▲" : "▼"}
                  </span>
                </button>

                {isDetailsExpanded && (
                  <div className="mt-4 space-y-6">
                    {/* Wave 1: EBIT 기반 상금 풀 */}
                    <div className={`p-6 rounded-lg border ${getWaveColor(1)}`}>
                      <h3 className="text-lg font-semibold text-blue-800 mb-4 flex items-center gap-2">
                        🌊 MoneyWave 1: EBIT 기반 일일 상금 풀
                        <Badge className="bg-blue-100 text-blue-800">
                          {data.wave1Status.gamesActive}개 게임 진행중
                        </Badge>
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <div className="text-sm text-blue-600 mb-1">
                            일일 상금풀
                          </div>
                          <div className="text-lg font-bold text-blue-800">
                            ₩{data.wave1Status.dailyPool.toLocaleString()}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-blue-600 mb-1">
                            오늘 참여자
                          </div>
                          <div className="text-lg font-bold text-blue-800">
                            {data.wave1Status.participantsToday}명
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-blue-600 mb-1">
                            평균 정확도
                          </div>
                          <div className="text-lg font-bold text-blue-800">
                            {(data.wave1Status.averageAccuracy * 100).toFixed(
                              1
                            )}
                            %
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-blue-600 mb-1">
                            활성 게임
                          </div>
                          <div className="text-lg font-bold text-blue-800">
                            {data.wave1Status.gamesActive}개
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Wave 2: PMC 재분배 */}
                    <div className={`p-6 rounded-lg border ${getWaveColor(2)}`}>
                      <h3 className="text-lg font-semibold text-green-800 mb-4 flex items-center gap-2">
                        🔄 MoneyWave 2: 미소비 PMC 재분배
                        <Badge className="bg-green-100 text-green-800">
                          {data.wave2Status.idlePmcUsers}명 대상
                        </Badge>
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <div className="text-sm text-green-600 mb-1">
                            재분배 금액
                          </div>
                          <div className="text-lg font-bold text-green-800">
                            ₩
                            {data.wave2Status.redistributedAmount.toLocaleString()}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-green-600 mb-1">
                            미사용 사용자
                          </div>
                          <div className="text-lg font-bold text-green-800">
                            {data.wave2Status.idlePmcUsers}명
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-green-600 mb-1">
                            평균 미사용 일수
                          </div>
                          <div className="text-lg font-bold text-green-800">
                            {data.wave2Status.avgIdleDays}일
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-green-600 mb-1">
                            재분배율
                          </div>
                          <div className="text-lg font-bold text-green-800">
                            {(
                              data.wave2Status.redistributionRate * 100
                            ).toFixed(1)}
                            %
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Wave 3: 기업가 생태계 */}
                    <div className={`p-6 rounded-lg border ${getWaveColor(3)}`}>
                      <h3 className="text-lg font-semibold text-purple-800 mb-4 flex items-center gap-2">
                        🚀 MoneyWave 3: 기업가 생태계
                        <Badge className="bg-purple-100 text-purple-800">
                          {data.wave3Status.enterpriseRequests}건 요청
                        </Badge>
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <div className="text-sm text-purple-600 mb-1">
                            기업 요청
                          </div>
                          <div className="text-lg font-bold text-purple-800">
                            {data.wave3Status.enterpriseRequests}건
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-purple-600 mb-1">
                            생성된 게임
                          </div>
                          <div className="text-lg font-bold text-purple-800">
                            {data.wave3Status.customGamesCreated}개
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-purple-600 mb-1">
                            데이터 수집
                          </div>
                          <div className="text-lg font-bold text-purple-800">
                            {data.wave3Status.businessDataCollected}건
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-purple-600 mb-1">
                            평균 참여도
                          </div>
                          <div className="text-lg font-bold text-purple-800">
                            {(data.wave3Status.avgEngagement * 100).toFixed(1)}%
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};
