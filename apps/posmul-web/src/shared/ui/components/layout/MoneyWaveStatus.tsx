"use client";
/**
 * MoneyWave Status Component (DB 연동 버전)
 *
 * 기능:
 * - EBIT 기반 9자리 고정 표시 (소수점 포함)
 * - 실시간 정각 카운트다운
 * - 동적 Wave 번호 (1-24시간)
 * - DB 연동 (useWaveCalculation 훅)
 * - 슬롯머신 애니메이션 (안정화 버전)
 */
import React, { useState, useEffect, useMemo } from "react";
import { Badge } from "../base/Badge";
import { Card } from "../base/Card";
import { useWaveCalculation } from "./MoneyWave/useWaveCalculation";

// ============================================================================
// Types
// ============================================================================
export interface MoneyWaveStatusProps {
  className?: string;
  domain?: string;
  category?: string;
}

// ============================================================================
// Utility Functions
// ============================================================================

// 시간 포맷팅
const formatTime = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${hours.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
};

// 다음 정각까지 남은 시간 계산
const getNextHourCountdown = (): number => {
  const now = new Date();
  const nextHour = new Date(now);
  nextHour.setHours(now.getHours() + 1, 0, 0, 0);
  return Math.floor((nextHour.getTime() - now.getTime()) / 1000);
};

// 현재 웨이브 번호 계산 (1-24)
const getCurrentWaveNumber = (): number => {
  return new Date().getHours() + 1;
};

/**
 * 9자리 고정 포맷팅 함수 (소수점 포함)
 * - 123 → "123.000000" (총 9자리)
 * - 12,345 → "12,345.0000" (총 9자리)
 * - 123,456,789 → "123,456,789" (9자리 이상은 그대로)
 */
const formatNineDigits = (num: number): string => {
  const totalDigits = 9;
  const intValue = Math.floor(num);
  const numStr = intValue.toString();
  const length = numStr.length;

  if (length >= totalDigits) {
    return new Intl.NumberFormat("ko-KR").format(intValue);
  }

  const decimalPlaces = totalDigits - length;
  const formattedInteger = new Intl.NumberFormat("ko-KR").format(intValue);
  const decimalStr = "0".repeat(decimalPlaces);

  return `${formattedInteger}.${decimalStr}`;
};

// ============================================================================
// Sub Components
// ============================================================================

// 슬롯머신 스타일 9자리 디스플레이
const SlotMachineDisplay: React.FC<{
  value: number;
  isSpinning: boolean;
  progressRatio: number;
}> = ({ value, isSpinning, progressRatio }) => {
  const [displayValue, setDisplayValue] = useState(value);

  // 부드러운 숫자 증가 애니메이션
  useEffect(() => {
    if (!isSpinning || value <= displayValue) {
      setDisplayValue(value);
      return;
    }

    const interval = setInterval(() => {
      setDisplayValue((prev) => {
        if (prev >= value) return value;
        const remaining = value - prev;
        // easeOut: 처음 빠르게, 나중에 느리게
        const increment = Math.max(1, Math.floor(remaining * 0.05));
        return Math.min(prev + increment, value);
      });
    }, 50);

    return () => clearInterval(interval);
  }, [value, isSpinning, displayValue]);

  const formatted = formatNineDigits(displayValue);
  const chars = formatted.split("");
  const dotIndex = chars.indexOf(".");
  const numericChars = chars.filter((c) => c !== "," && c !== ".").length;

  return (
    <div className="slot-machine-container relative">
      {/* 슬롯머신 배경 */}
      <div
        className={`
        flex items-center justify-center gap-0.5 px-4 py-3 rounded-xl
        ${isSpinning ? "bg-gradient-to-br from-green-900/40 to-emerald-900/40 border-green-500/50" : "bg-slate-800/60 border-slate-600/50"}
        border-2 transition-all duration-500
      `}
      >
        <span className="text-yellow-400 text-3xl md:text-4xl mr-3">💰</span>

        <div className="flex items-baseline">
          {chars.map((char, idx) => {
            const isComma = char === ",";
            const isDot = char === ".";
            const isDecimal = dotIndex !== -1 && idx > dotIndex;

            if (isComma) {
              return (
                <span
                  key={idx}
                  className="text-green-400 text-3xl md:text-4xl font-bold mx-0.5"
                >
                  ,
                </span>
              );
            }

            if (isDot) {
              return (
                <span
                  key={idx}
                  className="text-green-300/50 text-3xl md:text-4xl font-bold mx-1"
                >
                  .
                </span>
              );
            }

            // 자릿수별 스핀 상태 계산
            const numericIdx =
              chars.slice(0, idx + 1).filter((c) => c !== "," && c !== ".")
                .length - 1;
            const digitFromRight = numericChars - numericIdx - 1;
            const shouldAnimate =
              isSpinning && !isDecimal && progressRatio < 0.95;

            return (
              <span
                key={idx}
                className={`
                  inline-flex items-center justify-center 
                  font-bold font-mono text-3xl md:text-4xl
                  w-[0.65em] h-[1.4em] rounded
                  ${isDecimal ? "text-green-700/40 bg-transparent" : "text-green-400"}
                  ${shouldAnimate && !isDecimal ? "bg-slate-900/80" : ""}
                  transition-all duration-200
                `}
                style={{
                  textShadow:
                    shouldAnimate && !isDecimal
                      ? "0 0 10px rgba(34, 197, 94, 0.8)"
                      : "none",
                  animation:
                    shouldAnimate && !isDecimal
                      ? `digitPulse ${0.3 + digitFromRight * 0.1}s ease-in-out infinite`
                      : "none",
                }}
              >
                {char}
              </span>
            );
          })}
        </div>

        {/* PMC 단위 */}
        <span className="text-slate-500 text-sm ml-2 self-end mb-1">PMC</span>
      </div>

      {/* 글로우 효과 */}
      {isSpinning && (
        <div className="absolute inset-0 rounded-xl bg-green-500/10 blur-xl -z-10 animate-pulse" />
      )}

      <style jsx>{`
        @keyframes digitPulse {
          0%,
          100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.7;
            transform: scale(1.05);
          }
        }
      `}</style>
    </div>
  );
};

// 진행바 컴포넌트
const ProgressBar: React.FC<{ percentage: number; isSpinning: boolean }> = ({
  percentage,
  isSpinning,
}) => (
  <div>
    <div className="flex justify-between text-xs text-slate-400 mb-1">
      <span className="flex items-center gap-1">
        진행률
        {isSpinning && (
          <span className="inline-block w-1.5 h-1.5 bg-green-400 rounded-full animate-ping" />
        )}
      </span>
      <span className={isSpinning ? "text-green-400 font-semibold" : ""}>
        {percentage}%
      </span>
    </div>
    <div className="relative w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
      <div
        className={`h-2.5 rounded-full transition-all duration-300 ${
          isSpinning
            ? "bg-gradient-to-r from-green-500 via-emerald-400 to-green-500"
            : "bg-gradient-to-r from-emerald-500 to-green-500"
        }`}
        style={{ width: `${percentage}%` }}
      />
      {/* 50% 마커 */}
      <div className="absolute top-0 left-1/2 w-px h-2.5 bg-slate-600/50" />
    </div>
  </div>
);

// ============================================================================
// Main Component
// ============================================================================

const MoneyWaveStatus: React.FC<MoneyWaveStatusProps> = ({
  className = "",
  domain = "prediction",
  category = "all",
}) => {
  // DB 연동 훅 사용
  const {
    waveAmount,
    isSpinning: dbIsSpinning,
    progressRatio,
    participantCount,
    activeGames,
  } = useWaveCalculation({ domain, category });

  // 카운트다운 및 웨이브 번호 - 하이드레이션 에러 방지를 위해 초기값 고정
  const [countdown, setCountdown] = useState<number | null>(null);
  const [waveNumber, setWaveNumber] = useState<number | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  // 클라이언트 마운트 후에만 시간 계산 (하이드레이션 불일치 방지)
  useEffect(() => {
    setIsMounted(true);
    setCountdown(getNextHourCountdown());
    setWaveNumber(getCurrentWaveNumber());

    const interval = setInterval(() => {
      setCountdown(getNextHourCountdown());
      setWaveNumber(getCurrentWaveNumber());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // 진행률 계산 (DB에서 오는 progressRatio 사용)
  const progressPercentage = useMemo(() => {
    return Math.round(progressRatio * 100);
  }, [progressRatio]);

  // Wave 타입에 따른 색상
  const waveTypeColors = {
    1: "text-green-400", // Wave 1: EBIT 발행
    2: "text-blue-400", // Wave 2: 재분배
    3: "text-purple-400", // Wave 3: 기업가 투자
  };

  // waveNumber가 null이면 기본값 1 사용
  const displayWaveNumber = waveNumber ?? 1;
  const currentWaveType = ((displayWaveNumber - 1) % 3) + 1;

  return (
    <div className={`w-full ${className}`}>
      <Card className="bg-slate-900/95 border-slate-700/50 backdrop-blur-sm overflow-hidden">
        {/* 상단 그라데이션 바 */}
        <div
          className={`h-1 bg-gradient-to-r ${
            dbIsSpinning
              ? "from-green-500 via-emerald-400 to-green-500 animate-pulse"
              : "from-slate-600 to-slate-500"
          }`}
        />

        <div className="p-5">
          {/* 헤더 */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span
                className={`font-bold text-lg ${waveTypeColors[currentWaveType as 1 | 2 | 3]}`}
              >
                Wave {displayWaveNumber}
              </span>
              <span className="text-xs text-slate-500 bg-slate-800 px-2 py-0.5 rounded">
                {currentWaveType === 1 && "EBIT 발행"}
                {currentWaveType === 2 && "재분배"}
                {currentWaveType === 3 && "기업가 투자"}
              </span>
            </div>
            <div className="text-right text-sm text-slate-400">
              <span>다음 웨이브: </span>
              <span className="text-white font-mono" suppressHydrationWarning>
                {isMounted && countdown !== null ? formatTime(countdown) : "--:--:--"}
              </span>
            </div>
          </div>

          {/* 메인 금액 표시 (슬롯머신 스타일) */}
          <div className="flex justify-center items-center py-4">
            <SlotMachineDisplay
              value={waveAmount}
              isSpinning={dbIsSpinning}
              progressRatio={progressRatio}
            />
          </div>

          {/* 통계 */}
          <div className="flex justify-center gap-6 text-sm text-slate-400 my-4">
            <span className="flex items-center gap-2">
              <span
                className={`w-2 h-2 rounded-full ${dbIsSpinning ? "bg-green-400 animate-pulse" : "bg-green-500"}`}
              />
              게임 {activeGames}개
            </span>
            <span className="flex items-center gap-2">
              <span
                className={`w-2 h-2 rounded-full ${dbIsSpinning ? "bg-blue-400 animate-pulse" : "bg-blue-500"}`}
              />
              참여자 {participantCount.toLocaleString()}명
            </span>
          </div>

          {/* 실시간 적립 상태 */}
          {dbIsSpinning && (
            <div className="flex justify-center mb-4">
              <Badge variant="success" className="animate-pulse">
                <span className="mr-1">◷</span>
                실시간 적립 중...
              </Badge>
            </div>
          )}

          {/* 진행바 */}
          <ProgressBar percentage={progressPercentage} isSpinning={dbIsSpinning} />

          {/* 카테고리 정보 */}
          {category !== "all" && (
            <div className="mt-3 text-center text-xs text-slate-500">
              카테고리: <span className="text-slate-300">{category}</span>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default MoneyWaveStatus;
export { MoneyWaveStatus };
