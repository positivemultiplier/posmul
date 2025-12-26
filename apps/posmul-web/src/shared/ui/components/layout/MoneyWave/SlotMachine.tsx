"use client";

import { useEffect, useMemo, useState } from "react";
import { twMerge } from "tailwind-merge";

// 슬롯머신 애니메이션 컴포넌트 (ImprovedMoneyWave에서 추출)
export interface SlotMachineProps {
    value: number;
    isSpinning: boolean;
    totalAmount?: number;
    progressRatio?: number;
    showMeta?: boolean;
    className?: string;
}

// 숫자 포맷팅
const formatNumber = (num: number) => {
    return new Intl.NumberFormat("ko-KR").format(Math.floor(num));
};

const HOUR_MS = 60 * 60 * 1000;

function clamp01(value: number): number {
    return Math.max(0, Math.min(1, value));
}

function formatCountdownMs(ms: number): string {
    const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const pad2 = (n: number) => String(n).padStart(2, "0");
    if (hours > 0) return `${pad2(hours)}:${pad2(minutes)}:${pad2(seconds)}`;
    return `${pad2(minutes)}:${pad2(seconds)}`;
}

function getKstCountdownAndProgress(nowMs: number): { remainingMs: number; timeProgress: number } {
    const kstNow = new Date(nowMs + 9 * 60 * 60 * 1000);
    const kstNextHour = new Date(kstNow);
    kstNextHour.setMinutes(0, 0, 0);
    kstNextHour.setHours(kstNextHour.getHours() + 1);

    const remainingMs = Math.max(0, kstNextHour.getTime() - kstNow.getTime());
    const timeProgress = clamp01(1 - remainingMs / HOUR_MS);
    return { remainingMs, timeProgress };
}

export function SlotMachine({
    value,
    isSpinning,
    totalAmount = 0,
    progressRatio = 0,
    showMeta = false,
    className = ""
}: SlotMachineProps) {
    void totalAmount;

    const [displayValue, setDisplayValue] = useState<number>(value);

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

    const progress = useMemo(() => {
        const normalized = typeof progressRatio === "number" && Number.isFinite(progressRatio) ? progressRatio : 0;
        return Math.min(1, Math.max(0, normalized));
    }, [progressRatio]);

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
                const progressToTarget = targetValue > 0 ? currentValue / targetValue : 1;
                const baseIncrement = Math.max(1, Math.floor(remaining * 0.08));
                const speedMultiplier = Math.max(0.1, 1 - progressToTarget * 0.9);
                const increment = Math.floor(baseIncrement * speedMultiplier);

                currentValue = Math.min(currentValue + Math.max(1, increment), targetValue);
                setDisplayValue(currentValue);
            }
        }, updateInterval);

        return () => clearInterval(interval);
    }, [isSpinning, value, displayValue]);

    const calculateDigitSpinState = (
        digitPosition: number,
        totalDigits: number,
        p: number
    ): { shouldSpin: boolean; spinSpeed: number } => {
        const digitFromRight = totalDigits - digitPosition - 1;
        const startSpinAt = digitFromRight * 0.1;
        const shouldSpin = p >= startSpinAt;
        const spinSpeed = shouldSpin ? 0.3 + digitFromRight * 0.2 : 0;

        return {
            shouldSpin: shouldSpin && isSpinning,
            spinSpeed,
        };
    };

    const [remainingMs, setRemainingMs] = useState<number | null>(null);
    const [timeProgress, setTimeProgress] = useState<number>(0);

    useEffect(() => {
        if (!showMeta) return;

        const tick = () => {
            const { remainingMs: nextRemainingMs, timeProgress: nextTimeProgress } = getKstCountdownAndProgress(Date.now());
            setRemainingMs(nextRemainingMs);
            setTimeProgress(nextTimeProgress);
        };

        tick();
        const interval = setInterval(tick, 1000);
        return () => clearInterval(interval);
    }, [showMeta]);

    const digits = formatAndSplit(displayValue);
    const numericDigits = digits.filter((d) => !d.isComma).length;

    if (!isSpinning && !showMeta) {
        return (
            <span className={twMerge("font-bold font-mono transition-all duration-500 text-green-400", className)}>
                💰{formatNumber(value)}
            </span>
        );
    }

    return (
        <span className={twMerge("slot-container", isSpinning ? 'spinning' : '', "text-green-400 font-bold font-mono", className)}>
            <span className="flex items-center">
                <span className="text-inherit">💰</span>
                {digits.map((digitInfo, index) => {
                    if (digitInfo.isComma) {
                        return (
                            <span key={index} className="text-inherit">,</span>
                        );
                    }

                    const numericIndex = digits.slice(0, index + 1).filter(d => !d.isComma).length - 1;
                    const spinState = calculateDigitSpinState(numericIndex, numericDigits, progress);

                    return (
                        <span
                            key={index}
                            className="slot-digit inline-block relative overflow-hidden text-inherit border-white/10"
                            style={{
                                height: '1.2em',
                                width: '0.8em',
                                verticalAlign: 'top'
                            }}
                        >
                            {isSpinning && spinState.shouldSpin ? (
                                <span
                                    className="absolute inset-0 flex flex-col text-inherit"
                                    style={{
                                        animation: `slotSpin ${spinState.spinSpeed}s linear infinite`,
                                    }}
                                >
                                    {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((num, i) => (
                                        <span key={i} className="h-[1.2em] flex items-center justify-center text-inherit font-bold font-mono">
                                            {num}
                                        </span>
                                    ))}
                                </span>
                            ) : (
                                <span className="h-[1.2em] flex items-center justify-center text-inherit font-bold font-mono">
                                    {digitInfo.digitValue}
                                </span>
                            )}
                        </span>
                    );
                })}
                <span className="text-inherit ml-2"></span>
            </span>

            {showMeta && (
                <span className="mt-1 w-full">
                    <span className="flex w-full items-center justify-between text-[10px] text-white/70">
                        <span>다음 웨이브까지</span>
                        <span className="font-mono" suppressHydrationWarning>
                            {remainingMs === null ? "--:--" : formatCountdownMs(remainingMs)}
                        </span>
                    </span>
                    <span className="mt-1 block h-1 w-full overflow-hidden rounded bg-white/10">
                        <span
                            className="block h-full bg-white/30"
                            style={{ width: `${Math.round(timeProgress * 100)}%` }}
                        />
                    </span>
                </span>
            )}

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
