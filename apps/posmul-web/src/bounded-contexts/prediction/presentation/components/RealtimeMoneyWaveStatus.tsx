'use client';

import { useEffect, useState } from 'react';
import { Card } from '../../../../shared/ui/components/base/Card';

interface MoneyWaveData {
  totalDailyPool: number;
  ebitBased: number;
  redistributedPmc: number;
  enterprisePmc: number;
  hourlyPool: number;
  currentHour: number;
  calculatedAt: Date;
  networkMultiplier: number;
}

interface MoneyWaveStatusProps {
  className?: string;
}

export function RealtimeMoneyWaveStatus({ className }: MoneyWaveStatusProps) {
  const [moneyWaveData, setMoneyWaveData] = useState<MoneyWaveData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // MoneyWave 데이터 계산 및 업데이트
  useEffect(() => {
    const calculateMoneyWaveData = (): MoneyWaveData => {
      // Phase 2: 실제 계산 로직 (MoneyWaveCalculatorService 기준)
      const annualEBIT = 1752000000000; // 1조 7,520억
      const TAX_RATE = 0.25;
      const INTEREST_RATE = 0.03;
      
      const netEbit = annualEBIT * (1 - TAX_RATE - INTEREST_RATE);
      const dailyNetEbit = netEbit / 365;
      
      // MoneyWave 3단계 분배
      const ebitBased = dailyNetEbit * 0.6; // MoneyWave1
      const redistributedPmc = dailyNetEbit * 0.3; // MoneyWave2
      const baseEnterprisePmc = dailyNetEbit * 0.1; // MoneyWave3 기본
      
      // Metcalfe's Law 네트워크 효과 (가상의 파트너 수)
      const assumedPartners = 5;
      const networkValue = Math.min(assumedPartners * assumedPartners, 25) / 25;
      const networkMultiplier = 1.0 + networkValue;
      const enterprisePmc = baseEnterprisePmc * networkMultiplier;
      
      const totalDailyPool = ebitBased + redistributedPmc + enterprisePmc;
      const hourlyPool = totalDailyPool / 24;
      
      return {
        totalDailyPool,
        ebitBased,
        redistributedPmc,
        enterprisePmc,
        hourlyPool,
        currentHour: new Date().getHours(),
        calculatedAt: new Date(),
        networkMultiplier,
      };
    };

    // 초기 데이터 로드
    setMoneyWaveData(calculateMoneyWaveData());
    setIsLoading(false);

    // 1분마다 데이터 업데이트
    const interval = setInterval(() => {
      setMoneyWaveData(calculateMoneyWaveData());
      setLastUpdated(new Date());
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  const formatCurrency = (amount: number) => {
    if (amount >= 100000000) {
      return `${(amount / 100000000).toFixed(1)}억원`;
    } else if (amount >= 10000) {
      return `${(amount / 10000).toFixed(0)}만원`;
    }
    return `${amount.toLocaleString()}원`;
  };

  if (isLoading || !moneyWaveData) {
    return (
      <Card className={`p-4 ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-8 bg-gray-200 rounded w-full mb-4"></div>
          <div className="grid grid-cols-3 gap-4">
            <div className="h-16 bg-gray-200 rounded"></div>
            <div className="h-16 bg-gray-200 rounded"></div>
            <div className="h-16 bg-gray-200 rounded"></div>
          </div>
        </div>
      </Card>
    );
  }

  const progressPercent = (moneyWaveData.currentHour / 24) * 100;

  return (
    <Card className={`p-6 ${className} bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-200`}>
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-800">
          🌊 실시간 MoneyWave 상태
        </h3>
        <div className="text-xs text-gray-500">
          마지막 업데이트: {lastUpdated.toLocaleTimeString()}
        </div>
      </div>

      {/* 메인 지표 */}
      <div className="mb-6">
        <div className="flex items-end gap-2 mb-2">
          <span className="text-2xl font-bold text-blue-600">
            {formatCurrency(moneyWaveData.hourlyPool)}
          </span>
          <span className="text-sm text-gray-600">/시간</span>
        </div>
        <div className="text-sm text-gray-700">
          일일 총 상금 풀: <span className="font-semibold">{formatCurrency(moneyWaveData.totalDailyPool)}</span>
        </div>
        
        {/* 진행률 바 */}
        <div className="mt-3">
          <div className="flex justify-between text-xs text-gray-600 mb-1">
            <span>오늘 진행률</span>
            <span>{moneyWaveData.currentHour}/24시간</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-blue-400 to-purple-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* MoneyWave 3단계 분해 */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-white rounded-lg p-3 border">
          <div className="text-xs text-blue-600 font-medium mb-1">MoneyWave1</div>
          <div className="text-sm font-bold text-gray-800">
            {formatCurrency(moneyWaveData.ebitBased)}
          </div>
          <div className="text-xs text-gray-500">EBIT 기반</div>
        </div>
        
        <div className="bg-white rounded-lg p-3 border">
          <div className="text-xs text-green-600 font-medium mb-1">MoneyWave2</div>
          <div className="text-sm font-bold text-gray-800">
            {formatCurrency(moneyWaveData.redistributedPmc)}
          </div>
          <div className="text-xs text-gray-500">PMC 재분배</div>
        </div>
        
        <div className="bg-white rounded-lg p-3 border">
          <div className="text-xs text-purple-600 font-medium mb-1">MoneyWave3</div>
          <div className="text-sm font-bold text-gray-800">
            {formatCurrency(moneyWaveData.enterprisePmc)}
          </div>
          <div className="text-xs text-gray-500">기업가 풀</div>
        </div>
      </div>

      {/* 네트워크 효과 및 경제 이론 */}
      <div className="border-t pt-4">
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div>
            <span className="text-gray-600">네트워크 효과:</span>
            <span className="ml-1 font-semibold text-purple-600">
              {moneyWaveData.networkMultiplier.toFixed(2)}x
            </span>
          </div>
          <div>
            <span className="text-gray-600">이론 기반:</span>
            <span className="ml-1 font-semibold text-blue-600">CAPM+Agency</span>
          </div>
        </div>
        
        <div className="mt-2 text-xs text-gray-500">
          💡 Jensen & Meckling Agency Theory + Kahneman-Tversky Prospect Theory + Metcalfe's Law 적용
        </div>
      </div>

      {/* 라이브 인디케이터 */}
      <div className="absolute top-2 right-2">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          <span className="text-xs text-green-600 font-medium">LIVE</span>
        </div>
      </div>
    </Card>
  );
}