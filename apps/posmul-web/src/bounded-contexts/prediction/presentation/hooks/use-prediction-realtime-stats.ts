"use client";

/**
 * usePredictionRealtimeStats Hook
 * 
 * Supabase Realtime을 사용하여 prediction_statistics 테이블의 변경을 실시간으로 구독합니다.
 * 초기 데이터는 Server Component에서 props로 전달받아 사용하고,
 * Realtime 이벤트를 통해 최신 데이터를 차트에 추가합니다.
 */

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";

export interface ChartDataPoint {
    time: string;
    [key: string]: string | number;
}

export interface PredictionStats {
    gameId: string;
    totalParticipants: number;
    totalBetAmount: number;
    optionDistributions: Record<string, number>;
    lastUpdated: Date;
}

interface UsePredictionRealtimeStatsOptions {
    gameId: string;
    options: Array<{ id: string; label: string }>;
    enabled?: boolean;
    initialData?: ChartDataPoint[];
}

interface UsePredictionRealtimeStatsReturn {
    stats: PredictionStats | null;
    chartData: ChartDataPoint[];
    isLoading: boolean;
    isConnected: boolean;
    error: string | null;
    refresh: () => Promise<void>;
}

export function usePredictionRealtimeStats(
    options: UsePredictionRealtimeStatsOptions
): UsePredictionRealtimeStatsReturn {
    const { gameId, options: gameOptions, enabled = true, initialData = [] } = options;

    const [stats, setStats] = useState<PredictionStats | null>(null);
    // 초기 데이터를 Server Component에서 받아서 바로 사용
    const [chartData, setChartData] = useState<ChartDataPoint[]>(initialData);
    const [isLoading, setIsLoading] = useState(false);
    const [isConnected, setIsConnected] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // 현재 통계를 차트 포인트 하나로 변환 (Realtime Update용)
    const createCurrentPoint = useCallback(
        (statsData: PredictionStats): ChartDataPoint => {
            const now = new Date();
            const timeLabel = now.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });

            const distributions = statsData.optionDistributions;
            const totalBets = Object.values(distributions).reduce((sum, count) => sum + count, 0);

            const dataPoint: ChartDataPoint = { time: timeLabel };

            if (totalBets === 0) {
                gameOptions.forEach((opt) => {
                    dataPoint[opt.id] = Math.round(100 / gameOptions.length);
                });
            } else {
                gameOptions.forEach((opt) => {
                    const count = distributions[opt.id] || 0;
                    const pct = Math.round((count / totalBets) * 100);
                    dataPoint[opt.id] = pct;
                });
            }

            return dataPoint;
        },
        [gameOptions]
    );

    // 현재 통계만 가져오기 (히스토리는 SSR에서 처리)
    const fetchCurrentStats = useCallback(async () => {
        try {
            const supabase = createClient();

            const { data: statsRow, error: fetchError } = await supabase
                .schema("prediction")
                .from("prediction_statistics")
                .select("*")
                .eq("game_id", gameId)
                .maybeSingle();

            if (fetchError) throw new Error(fetchError.message);

            if (statsRow) {
                const newStats: PredictionStats = {
                    gameId: statsRow.game_id,
                    totalParticipants: statsRow.total_participants || 0,
                    totalBetAmount: Number(statsRow.total_bet_amount) || 0,
                    optionDistributions: statsRow.option_distributions || {},
                    lastUpdated: new Date(statsRow.last_updated || Date.now()),
                };
                setStats(newStats);
            }
            setError(null);
        } catch (err) {
            console.error("[usePredictionRealtimeStats] Error:", err);
            setError(err instanceof Error ? err.message : "Failed to fetch stats");
        }
    }, [gameId]);

    // Realtime 구독 설정
    useEffect(() => {
        if (!enabled || !gameId) return;

        const supabase = createClient();
        let channel: RealtimeChannel | null = null;

        const setupRealtime = async () => {
            // 현재 통계만 가져오기 (차트 데이터는 이미 initialData로 설정됨)
            await fetchCurrentStats();

            // Realtime 채널 구독
            channel = supabase
                .channel(`prediction_stats_${gameId}`)
                .on(
                    "postgres_changes",
                    {
                        event: "*",
                        schema: "prediction",
                        table: "prediction_statistics",
                        filter: `game_id=eq.${gameId}`,
                    },
                    (payload) => {
                        if (payload.new && typeof payload.new === "object") {
                            const newData = payload.new as any;
                            const newStats: PredictionStats = {
                                gameId: newData.game_id,
                                totalParticipants: newData.total_participants || 0,
                                totalBetAmount: Number(newData.total_bet_amount) || 0,
                                optionDistributions: newData.option_distributions || {},
                                lastUpdated: new Date(newData.last_updated || Date.now()),
                            };

                            setStats(newStats);

                            // 차트에 새 포인트 추가
                            const newPoint = createCurrentPoint(newStats);
                            console.log("[usePredictionRealtimeStats] New Point:", newPoint);

                            setChartData((prev) => {
                                const nextData = [...prev, newPoint];
                                return nextData.slice(-50); // 최근 50개만 유지
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
    }, [gameId, enabled, fetchCurrentStats, createCurrentPoint]);

    return {
        stats,
        chartData,
        isLoading,
        isConnected,
        error,
        refresh: fetchCurrentStats,
    };
}


