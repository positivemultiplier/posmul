/**
 * useRealtimeBalance Hook
 *
 * Supabase Realtime을 사용하여 사용자 잔액을 실시간으로 구독합니다.
 * 잔액 변화 시 UI를 자동으로 업데이트합니다.
 */
"use client";

import { useEffect, useState, useCallback } from "react";

import { createClient } from "@/lib/supabase/client";

import type { RealtimeChannel } from "@supabase/supabase-js";

/** 잔액 데이터 */
export interface BalanceData {
    pmpAvailable: number;
    pmpLocked: number;
    pmcAvailable: number;
    pmcLocked: number;
    lastUpdated: Date;
}

/** 잔액 변화 정보 */
export interface BalanceChange {
    field: keyof Omit<BalanceData, "lastUpdated">;
    previousValue: number;
    currentValue: number;
    diff: number;
}

/** Hook Options */
interface UseRealtimeBalanceOptions {
    userId: string;
    enabled?: boolean;
    initialBalance?: Partial<BalanceData>;
}

/** Hook Return */
interface UseRealtimeBalanceReturn {
    balance: BalanceData | null;
    isLoading: boolean;
    isConnected: boolean;
    error: string | null;
    lastChange: BalanceChange | null;
    refresh: () => Promise<void>;
}

/**
 * 실시간 잔액 구독 훅
 *
 * @example
 * ```tsx
 * const { balance, isConnected, lastChange } = useRealtimeBalance({
 *   userId: user.id,
 * });
 * ```
 */
export function useRealtimeBalance(
    options: UseRealtimeBalanceOptions
): UseRealtimeBalanceReturn {
    const { userId, enabled = true, initialBalance } = options;

    const [balance, setBalance] = useState<BalanceData | null>(
        initialBalance
            ? {
                pmpAvailable: initialBalance.pmpAvailable ?? 0,
                pmpLocked: initialBalance.pmpLocked ?? 0,
                pmcAvailable: initialBalance.pmcAvailable ?? 0,
                pmcLocked: initialBalance.pmcLocked ?? 0,
                lastUpdated: initialBalance.lastUpdated ?? new Date(),
            }
            : null
    );
    const [isLoading, setIsLoading] = useState(!initialBalance);
    const [isConnected, setIsConnected] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [lastChange, setLastChange] = useState<BalanceChange | null>(null);

    // 잔액 조회
    const fetchBalance = useCallback(async () => {
        if (!userId) return;

        try {
            setIsLoading(true);
            const supabase = createClient();

            const { data, error: fetchError } = await supabase
                .from("user_economic_balances")
                .select("pmp_available, pmp_locked, pmc_available, pmc_locked, updated_at")
                .eq("user_id", userId)
                .maybeSingle();

            if (fetchError) throw new Error(fetchError.message);

            if (data) {
                setBalance({
                    pmpAvailable: Number(data.pmp_available) || 0,
                    pmpLocked: Number(data.pmp_locked) || 0,
                    pmcAvailable: Number(data.pmc_available) || 0,
                    pmcLocked: Number(data.pmc_locked) || 0,
                    lastUpdated: new Date(data.updated_at || Date.now()),
                });
            }
            setError(null);
        } catch (err) {
            console.error("[useRealtimeBalance] Error:", err);
            setError(err instanceof Error ? err.message : "Failed to fetch balance");
        } finally {
            setIsLoading(false);
        }
    }, [userId]);

    // Realtime 구독
    useEffect(() => {
        if (!enabled || !userId) return;

        const supabase = createClient();
        let channel: RealtimeChannel | null = null;

        const setupRealtime = async () => {
            await fetchBalance();

            channel = supabase
                .channel(`user_balance_${userId}`)
                .on(
                    "postgres_changes",
                    {
                        event: "*",
                        schema: "public",
                        table: "user_economic_balances",
                        filter: `user_id=eq.${userId}`,
                    },
                    (payload) => {
                        if (payload.new && typeof payload.new === "object") {
                            const newData = payload.new as Record<string, unknown>;

                            const newBalance: BalanceData = {
                                pmpAvailable: Number(newData.pmp_available) || 0,
                                pmpLocked: Number(newData.pmp_locked) || 0,
                                pmcAvailable: Number(newData.pmc_available) || 0,
                                pmcLocked: Number(newData.pmc_locked) || 0,
                                lastUpdated: new Date(),
                            };

                            // 변화 감지
                            setBalance((prev) => {
                                if (prev) {
                                    const fields: (keyof Omit<BalanceData, "lastUpdated">)[] = [
                                        "pmpAvailable",
                                        "pmpLocked",
                                        "pmcAvailable",
                                        "pmcLocked",
                                    ];

                                    for (const field of fields) {
                                        const diff = newBalance[field] - prev[field];
                                        if (Math.abs(diff) > 0) {
                                            setLastChange({
                                                field,
                                                previousValue: prev[field],
                                                currentValue: newBalance[field],
                                                diff,
                                            });
                                            break;
                                        }
                                    }
                                }
                                return newBalance;
                            });
                        }
                    }
                )
                .subscribe((status) => {
                    setIsConnected(status === "SUBSCRIBED");
                    if (status === "CHANNEL_ERROR") {
                        setError("Realtime connection failed");
                    }
                });
        };

        setupRealtime();

        return () => {
            if (channel) {
                supabase.removeChannel(channel);
            }
        };
    }, [userId, enabled, fetchBalance]);

    return {
        balance,
        isLoading,
        isConnected,
        error,
        lastChange,
        refresh: fetchBalance,
    };
}

export default useRealtimeBalance;
