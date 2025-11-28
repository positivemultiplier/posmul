import { useState, useEffect } from "react";
import { createClient } from "../../../../../lib/supabase/client";

const ANNUAL_EBITDA = 1000000000; // 10억

interface WaveCalculationResult {
    waveAmount: number;
    isSpinning: boolean;
    spinSpeed: number;
    progressRatio: number;
    participantCount: number;
    activeGames: number;
}

interface UseWaveCalculationProps {
    domain?: string;
    category?: string;
}

export function useWaveCalculation({
    domain = 'prediction',
    category = 'all'
}: UseWaveCalculationProps): WaveCalculationResult {
    const supabase = createClient();
    const hourlyWave = ANNUAL_EBITDA / 365 / 24;

    const [waveAmount, setWaveAmount] = useState(0);
    const [slotState, setSlotState] = useState({
        isSpinning: false,
        spinSpeed: 0,
        progressRatio: 0
    });
    const [participantCount, setParticipantCount] = useState(0);
    const [activeGames, setActiveGames] = useState(0);

    useEffect(() => {
        const fetchWaveData = async () => {
            try {
                // 현재 카테고리의 활성 게임 수 조회
                let query = supabase
                    .schema('prediction')
                    .from("prediction_games")
                    .select("game_id", { count: "exact" })
                    .eq("status", "ACTIVE");

                // 카테고리 필터
                if (domain === 'prediction' && category !== 'all') {
                    const categoryMap: Record<string, string> = {
                        'invest': 'INVEST',
                        'sports': 'SPORTS',
                        'politics': 'POLITICS',
                        'entertainment': 'ENTERTAINMENT',
                        'user': 'USER_PROPOSED'
                    };
                    const dbCategory = categoryMap[category];
                    if (dbCategory) {
                        query = query.eq("category", dbCategory);
                    }
                }

                const { count: categoryGames } = await query;

                // 전체 활성 게임 수
                const { count: totalGames } = await supabase
                    .schema('prediction')
                    .from("prediction_games")
                    .select("game_id", { count: "exact" })
                    .eq("status", "ACTIVE");

                // 가중치 계산
                const weight = totalGames && totalGames > 0 ? (categoryGames || 0) / totalGames : 0;
                const categoryWave = hourlyWave * weight;

                setWaveAmount(Math.round(categoryWave));
                setActiveGames(categoryGames || 0);

                // 참여자 수
                const { count: participants } = await supabase
                    .schema('prediction')
                    .from("predictions")
                    .select("user_id", { count: "exact" });

                setParticipantCount(participants || 0);

                // 슬롯머신 상태 (간단한 버전)
                const now = Date.now();
                const startOfHour = new Date();
                startOfHour.setMinutes(0, 0, 0);
                const elapsed = now - startOfHour.getTime();
                const duration = 60 * 60 * 1000; // 1시간
                const progress = Math.min(elapsed / duration, 1);

                setSlotState({
                    isSpinning: progress < 1,
                    spinSpeed: Math.max(0.1, 0.3 + progress * 1.2),
                    progressRatio: progress
                });
            } catch (error) {
                console.error("Wave calculation error:", error);
            }
        };

        fetchWaveData();
        const interval = setInterval(fetchWaveData, 60000); // 1분마다 업데이트

        return () => clearInterval(interval);
    }, [domain, category]);

    return {
        waveAmount,
        isSpinning: slotState.isSpinning,
        spinSpeed: slotState.spinSpeed,
        progressRatio: slotState.progressRatio,
        participantCount,
        activeGames
    };
}
