import { useState, useEffect } from "react";
import { createClient } from "../../../../../lib/supabase/client";
import {
    computeRevealRatio,
    clamp01,
} from "./wave-math";
import { getKstHourStartIso } from "@/shared/utils/time/getKstHourStartIso";

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
    gameId?: string;
}

export function useWaveCalculation({
    domain = 'prediction',
    category = 'all',
    gameId
}: UseWaveCalculationProps): WaveCalculationResult {
    const supabase = createClient();

    const [waveAmount, setWaveAmount] = useState(0);
    const [slotState, setSlotState] = useState({
        isSpinning: false,
        spinSpeed: 0,
        progressRatio: 0
    });
    const [participantCount, setParticipantCount] = useState(0);
    const [activeGames, setActiveGames] = useState(0);

    useEffect(() => {
        let isMounted = true;

        const fetchWaveData = async () => {
            try {
                // 1. Calculate current KST Hour Start
                const now = new Date();
                const hourStartIso = getKstHourStartIso(now);
                const hourStartMs = new Date(hourStartIso).getTime();
                const HOUR_MS = 60 * 60 * 1000;

                // 2. Fetch Truth Pool
                let truthWave = 0;

                if (gameId) {
                    // Case A: Specific Game (Depth 5)
                    const { data: gamePool, error: gameError } = await supabase
                        .schema('economy')
                        .from('money_wave_hourly_game_pools')
                        .select('pool_pmc')
                        .eq('hour_start', hourStartIso)
                        .eq('game_id', gameId)
                        .maybeSingle();

                    if (!gameError && gamePool) {
                        truthWave = gamePool.pool_pmc || 0;
                    }
                } else {
                    // Case B: Category/Domain Level (Depth 1~4)
                    let query = supabase
                        .schema('economy')
                        .from('money_wave_hourly_category_allocations')
                        .select('pool_pmc')
                        .eq('hour_start', hourStartIso)
                        .eq('domain', domain);

                    if (category !== 'all') {
                        // Normalize category if needed (e.g. user_proposed handling) but usually DB matches UI strings
                        // If category is 'user_proposed', it might be mapped from 'USER_PROPOSED' or similar
                        // For now assuming exact match or simple uppercase mapping if needed. 
                        // The existing code used resolveSelectedDbCategory, let's keep it simple for now.
                        query = query.eq('category', category.toUpperCase());
                        // Note: 'all' is not a DB category. 'SPORTS', etc. are.
                    }

                    const { data: allocations, error: allocationError } = await query;

                    if (!allocationError && allocations && allocations.length > 0) {
                        truthWave = allocations.reduce((sum, row) => sum + (row.pool_pmc || 0), 0);
                    } else {
                        // Fallback: If no allocation rows found for this hour (e.g. cron hasn't run or empty),
                        // maybe show 0 or fetch previous hour?
                        // For now, defaulting to 0 as per "Reveal from Truth" philosophy.
                        console.log("No allocations found for", hourStartIso);
                    }
                }

                if (!isMounted) return;

                // 3. Fetch Participants (Global or Scoped? Usually global for MoneyWave vibe)
                const { count: participants } = await supabase
                    .schema('prediction')
                    .from("predictions")
                    .select("user_id", { count: "exact" }); // This is total accumulation, might want hourly active?
                // Plan says "participants" is for progress boost.

                // 4. Fetch Active Games Count
                const { count: activeGameCount } = await supabase
                    .schema('prediction')
                    .from("prediction_games")
                    .select("game_id", { count: "exact" })
                    .eq("status", "ACTIVE");
                // Note: If we want active games *in this category*, we should add filter.

                // 5. Compute Reveal
                const progressRaw = clamp01((now.getTime() - hourStartMs) / HOUR_MS);
                const { progressAdjusted, revealRatio } = computeRevealRatio(
                    progressRaw,
                    participants || 0,
                    activeGameCount || 0
                );

                const displayWave = truthWave * revealRatio;

                setWaveAmount(Math.round(displayWave));
                setParticipantCount(participants || 0);
                setActiveGames(activeGameCount || 0);
                setSlotState({
                    isSpinning: progressRaw < 1,
                    spinSpeed: Math.max(0.1, 0.3 + progressAdjusted * 1.2),
                    progressRatio: progressAdjusted
                });

            } catch (error) {
                console.error("useWaveCalculation error:", error);
            }
        };

        fetchWaveData();
        // Sync every 10s is better than 60s for reveal feel
        const interval = setInterval(fetchWaveData, 10000);
        return () => {
            isMounted = false;
            clearInterval(interval);
        };
    }, [domain, category, gameId]);

    return {
        waveAmount,
        isSpinning: slotState.isSpinning,
        spinSpeed: slotState.spinSpeed,
        progressRatio: slotState.progressRatio,
        participantCount,
        activeGames
    };
}

