"use client";

import { useEffect, useState, useRef } from "react";
import { twMerge } from "tailwind-merge";

export interface SlotMachineProps {
    value: number;
    isSpinning: boolean;
    totalAmount?: number;
    progressRatio?: number;
    showMeta?: boolean;
    className?: string;
}

const formatNumber = (num: number) => new Intl.NumberFormat("ko-KR").format(Math.floor(num));

// KST Countdown Logic
const HOUR_MS = 60 * 60 * 1000;
function clamp01(value: number): number { return Math.max(0, Math.min(1, value)); }
function formatCountdownMs(ms: number): string {
    const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const pad2 = (n: number) => String(n).padStart(2, "0");
    return `${pad2(minutes)}:${pad2(seconds)}`;
}
function getKstCountdownAndProgress(nowMs: number): { remainingMs: number; timeProgress: number } {
    const kstNow = new Date(nowMs + 9 * 60 * 60 * 1000);
    const kstNextHour = new Date(kstNow);
    kstNextHour.setMinutes(0, 0, 0);
    kstNextHour.setHours(kstNextHour.getHours() + 1);
    const remainingMs = Math.max(0, kstNextHour.getTime() - kstNow.getTime());
    return { remainingMs, timeProgress: clamp01(1 - remainingMs / HOUR_MS) };
}

// Fintech-style CountUp Component
// No spinning animation, just rapid value updates with ease-out.
export function SlotMachine({
    value,
    isSpinning,
    totalAmount = 0,
    showMeta = false,
    className = ""
}: SlotMachineProps) {
    const [displayValue, setDisplayValue] = useState<number>(isSpinning ? 0 : value);
    const requestRef = useRef<number | null>(null);
    const startTimeRef = useRef<number | null>(null);

    // Animation Loop
    useEffect(() => {
        if (!isSpinning) {
            setDisplayValue(value);
            return;
        }

        const startValue = 0; // Start from 0% (Full count-up)
        const endValue = value;
        const duration = 2000; // 2 seconds

        // Reset
        setDisplayValue(startValue);
        startTimeRef.current = null;

        const animate = (time: number) => {
            if (!startTimeRef.current) startTimeRef.current = time;
            const progress = time - startTimeRef.current;
            const percentage = Math.min(progress / duration, 1);

            // Ease Out Expo: Starts fast, slows down gently (standard for financial counts)
            const ease = percentage === 1 ? 1 : 1 - Math.pow(2, -10 * percentage);

            // Current value calculation
            const current = startValue + (endValue - startValue) * ease;
            setDisplayValue(current);

            if (progress < duration) {
                requestRef.current = requestAnimationFrame(animate);
            } else {
                setDisplayValue(endValue);
            }
        };

        requestRef.current = requestAnimationFrame(animate);

        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
    }, [value, isSpinning]);

    // Metadata Timer
    const [remainingMs, setRemainingMs] = useState<number | null>(null);
    const [timeProgress, setTimeProgress] = useState<number>(0);
    useEffect(() => {
        if (!showMeta) return;
        const tick = () => {
            const { remainingMs: r, timeProgress: t } = getKstCountdownAndProgress(Date.now());
            setRemainingMs(r);
            setTimeProgress(t);
        };
        tick();
        const interval = setInterval(tick, 1000);
        return () => clearInterval(interval);
    }, [showMeta]);

    void totalAmount;

    return (
        <span className={twMerge(
            "slot-container font-mono transition-colors duration-300 inline-flex flex-col",
            isSpinning ? "border-emerald-500/50 bg-emerald-900/10" : "border-slate-700 bg-slate-800",
            className
        )}>
            {/* 
               tabular-nums logic: 
               Uses font-feature-settings to ensure all digits have the same width.
               This prevents the text from jittering horizontally as numbers change (e.g. 1 vs 0).
            */}
            <div className="flex items-center gap-1.5" style={{ height: "1.2em" }}>
                <span className="text-inherit translate-y-[1px]">💰</span>
                <span className="text-inherit font-bold tracking-tight" style={{ fontVariantNumeric: "tabular-nums" }}>
                    {formatNumber(displayValue)}
                </span>
            </div>

            {showMeta && (
                <div className="mt-2 w-full border-t border-white/10 pt-1">
                    <div className="flex w-full items-center justify-between text-[10px] text-white/70">
                        <span>Next Wave</span>
                        <span className="font-mono" style={{ fontVariantNumeric: "tabular-nums" }} suppressHydrationWarning>
                            {remainingMs === null ? "--:--" : formatCountdownMs(remainingMs)}
                        </span>
                    </div>
                    <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-slate-900/50">
                        <div
                            className="h-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] transition-all duration-1000 ease-linear"
                            style={{ width: `${Math.round(timeProgress * 100)}%` }}
                        />
                    </div>
                </div>
            )}

            <style jsx>{`
                .slot-container {
                    padding: 8px 12px;
                    border-radius: 8px;
                    border-width: 1px;
                    min-width: 140px;
                }
            `}</style>
        </span>
    );
}
