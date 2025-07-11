"use client";

import React from "react";
import { Badge } from "../base/Badge";
import { Card } from "../base/Card";

// Mock 데이터
const mockMoneyWaveData = {
  currentWave: 1,
  nextWaveCountdown: 8 * 60 * 60 + 45 * 60 + 30, // 8시간 45분 30초 (초 단위)
  dailyEbitPool: 2450000, // 일일 EBIT 기반 상금 풀
  totalAllocated: 1680000, // 현재 배정된 금액
};

// 시간 포맷팅 함수
const formatTime = (seconds: number) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

// 숫자 포맷팅 함수
const formatNumber = (num: number) => {
  return new Intl.NumberFormat('ko-KR').format(num);
};

export interface MoneyWaveStatusProps {
  className?: string;
}

const MoneyWaveStatus: React.FC<MoneyWaveStatusProps> = ({ className = "" }) => {
  const { currentWave, nextWaveCountdown, dailyEbitPool, totalAllocated } = mockMoneyWaveData;
  
  const allocatedPercentage = Math.round((totalAllocated / dailyEbitPool) * 100);

  return (
    <div className={`w-full ${className}`}>
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <div className="p-4">
          {/* 헤더 */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
              <h3 className="text-lg font-bold text-gray-800">
                Money Wave {currentWave}
              </h3>
              <Badge variant="success" className="text-xs">
                활성
              </Badge>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-600">다음 웨이브까지</div>
              <div className="text-lg font-mono font-bold text-blue-600">
                {formatTime(nextWaveCountdown)}
              </div>
            </div>
          </div>

          {/* 상금 풀 정보 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="text-center">
              <div className="text-sm text-gray-600 mb-1">일일 상금 풀</div>
              <div className="text-xl font-bold text-green-600">
                ₩{formatNumber(dailyEbitPool)}
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-600 mb-1">배정 완료</div>
              <div className="text-xl font-bold text-blue-600">
                ₩{formatNumber(totalAllocated)}
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-600 mb-1">배정률</div>
              <div className="text-xl font-bold text-purple-600">
                {allocatedPercentage}%
              </div>
            </div>
          </div>

          {/* 진행 바 */}
          <div className="mb-4">
            <div className="flex justify-between text-xs text-gray-600 mb-1">
              <span>진행률</span>
              <span>{allocatedPercentage}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${allocatedPercentage}%` }}
              ></div>
            </div>
          </div>

          {/* 간단한 통계 */}
          <div className="flex justify-between text-sm text-gray-600">
            <span>활성 게임: 12개</span>
            <span>참여자: 847명</span>
            <span>평균 정확도: 82%</span>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default MoneyWaveStatus;
export { MoneyWaveStatus };
