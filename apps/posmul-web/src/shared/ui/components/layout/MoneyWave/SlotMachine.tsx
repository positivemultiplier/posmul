"use client";

import { useState, useEffect } from "react";

// 슬롯머신 애니메이션 컴포넌트 (ImprovedMoneyWave에서 추출)
interface SlotMachineProps {
    value: number;
    isSpinning: boolean;
    totalAmount?: number;
    progressRatio?: number;
    className?: string;
}

// 숫자 포맷팅
const formatNumber = (num: number) => {
    return new Intl.NumberFormat("ko-KR").format(Math.floor(num));
};

export function SlotMachine({
    value,
    isSpinning,
    totalAmount = 0,
    progressRatio = 0,
    className = ""
}: SlotMachineProps) {
    const [displayValue, setDisplayValue] = useState(value);

    // 숫자를 자릿수별로 분리
    const formatAndSplit = (num: number) => {
        const formatted = formatNumber(num);
        return formatted.split('').map((char, index) => ({
            char,
            isComma: char === ',',
            digitValue: isNaN(parseInt(char)) ? 0 : parseInt(char),
            position: index
        }));
    };

    // 각 자릿수별 스핀 상태 계산 (뒷자리부터 채워짐)
    const calculateDigitSpinState = (digitPosition: number, totalDigits: number, progress: number) => {
        const digitFromRight = totalDigits - digitPosition - 1;
        const startSpinAt = digitFromRight * 0.1;
        const shouldSpin = progress >= startSpinAt;
        const spinSpeed = shouldSpin ? 0.3 + (digitFromRight * 0.2) : 0;

        return {
            shouldSpin: shouldSpin && isSpinning,
            spinSpeed: spinSpeed
        };
    };

    // 롤링 로직
    useEffect(() => {
        if (!isSpinning) {
            setDisplayValue(value);
            return;
        }

        const updateInterval = 30;
        let currentValue = displayValue;
        const targetValue = value;

        const interval = setInterval(() => {
            if (currentValue < targetValue) {
                const remaining = targetValue - currentValue;
                const progressToTarget = currentValue / targetValue;
                const baseIncrement = Math.max(1, Math.floor(remaining * 0.08));
                const speedMultiplier = Math.max(0.1, 1 - progressToTarget * 0.9);
                const increment = Math.floor(baseIncrement * speedMultiplier);

                currentValue = Math.min(currentValue + Math.max(1, increment), targetValue);
                setDisplayValue(currentValue);
            }
        }, updateInterval);

        return () => clearInterval(interval);
    }, [isSpinning, value, displayValue]);

    const digits = formatAndSplit(displayValue);
    const numericDigits = digits.filter(d => !d.isComma).length;

    if (!isSpinning) {
        return (
            <span className={`font-bold font-mono transition-all duration-500 ${className}`}>
                💰{formatNumber(value)}
            </span>
        );
    }

    return (
        <span className={`slot-container ${isSpinning ? 'spinning' : ''} ${className}`}>
            <span className="text-green-400 font-bold">💰</span>
            {digits.map((digitInfo, index) => {
                if (digitInfo.isComma) {
                    return (
                        <span key={index} className="text-green-400">,</span>
                    );
                }

                const numericIndex = digits.slice(0, index + 1).filter(d => !d.isComma).length - 1;
                const spinState = calculateDigitSpinState(numericIndex, numericDigits, progressRatio);

                return (
                    <span
                        key={index}
                        className="slot-digit inline-block relative overflow-hidden text-green-400"
                        style={{
                            height: '1.2em',
                            width: '0.8em',
                            verticalAlign: 'top'
                        }}
                    >
                        {spinState.shouldSpin ? (
                            <span
                                className="absolute inset-0 flex flex-col"
                                style={{
                                    animation: `slotSpin ${spinState.spinSpeed}s linear infinite`,
                                }}
                            >
                                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((num, i) => (
                                    <span key={i} className="h-[1.2em] flex items-center justify-center text-green-400 font-bold font-mono">
                                        {num}
                                    </span>
                                ))}
                            </span>
                        ) : (
                            <span className="h-[1.2em] flex items-center justify-center text-green-400 font-bold font-mono">
                                {digitInfo.digitValue}
                            </span>
                        )}
                    </span>
                );
            })}
            <span className="text-green-400 font-bold ml-2"></span>

            {/* CSS for slot machine animation */}
            <style jsx>{`
        @keyframes slotSpin {
          0% { transform: translateY(0%); }
          100% { transform: translateY(-200%); }
        }

        .slot-container {
          position: relative;
          display: inline-block;
          padding: 4px 8px;
          border-radius: 8px;
          background: linear-gradient(135deg, #1e293b, #334155);
          border: 2px solid #475569;
          box-shadow: inset 0 2px 4px rgba(0,0,0,0.3), 0 4px 8px rgba(0,0,0,0.1);
        }

        .slot-container.spinning {
          border-color: #10b981;
          background: linear-gradient(135deg, #065f46, #047857);
        }

        .slot-digit {
          background: #0f172a;
          border-radius: 4px;
          margin: 0 1px;
          box-shadow:
            inset 0 2px 4px rgba(0,0,0,0.4),
            inset 0 -1px 2px rgba(255,255,255,0.1);
          border: 1px solid #1e293b;
        }
      `}</style>
        </span>
    );
}
