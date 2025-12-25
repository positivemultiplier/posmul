import { useState, useEffect } from "react";
import { createClient } from "../../../../../lib/supabase/client";
import {
    buildMultiplierByCategory,
    clamp01,
    computeRevealRatio,
    countCategories,
    parseNumeric,
    resolveSelectedDbCategory,
} from "./wave-math";

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

    const [_hourlyWaveTotal, setHourlyWaveTotal] = useState<number | null>(null);

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
                const selectedDbCategory = resolveSelectedDbCategory(domain, category);

                const { data: snapshot } = await supabase
                    .schema('economy')
                    .from('money_wave_daily_snapshots')
                    .select('hourly_pool_total_pmc')
                    .order('snapshot_date', { ascending: false })
                    .limit(1)
                    .maybeSingle();

                const hourlyTotal = parseNumeric(snapshot?.hourly_pool_total_pmc);
                setHourlyWaveTotal(Number.isFinite(hourlyTotal ?? NaN) ? hourlyTotal : null);

                const { count: participants } = await supabase
                    .schema('prediction')
                    .from("predictions")
                    .select("user_id", { count: "exact" });
                const participantTotal = participants || 0;
                setParticipantCount(participantTotal);

                const { data: activeGameRows } = await supabase
                    .schema('prediction')
                    .from("prediction_games")
                    .select("category")
                    .eq("status", "ACTIVE");
                const { counts, total: totalActiveGames } = countCategories(activeGameRows as unknown[] | null);

                let multiplierByCategory: Record<string, number> = {};
                try {
                    const { data: multipliers } = await supabase
                        .schema('economy')
                        .from('prediction_category_multipliers')
                        .select('category,reward_multiplier');
                    multiplierByCategory = buildMultiplierByCategory(multipliers as unknown[] | null);
                } catch (_error) {
                }

                const totalWeighted = Object.entries(counts).reduce((sum, [cat, count]) => {
                    const multiplier = multiplierByCategory[cat] ?? 1;
                    return sum + count * multiplier;
                }, 0);

                const selectedCount = selectedDbCategory ? (counts[selectedDbCategory] ?? 0) : totalActiveGames;
                const selectedWeighted = selectedDbCategory
                    ? selectedCount * (multiplierByCategory[selectedDbCategory] ?? 1)
                    : totalWeighted;

                const weight = totalWeighted > 0 ? selectedWeighted / totalWeighted : 0;
                const truthWave = (hourlyTotal ?? 0) * weight;

                const startOfHour = new Date();
                startOfHour.setMinutes(0, 0, 0);
                const progress = clamp01((Date.now() - startOfHour.getTime()) / (60 * 60 * 1000));

                const { progressAdjusted, revealRatio } = computeRevealRatio(progress, participantTotal, totalActiveGames);
                const displayWave = truthWave * revealRatio;

                setWaveAmount(Math.round(displayWave));
                setActiveGames(selectedCount);
                setSlotState({
                    isSpinning: progress < 1,
                    spinSpeed: Math.max(0.1, 0.3 + progressAdjusted * 1.2),
                    progressRatio: progressAdjusted
                });
            } catch (_error) {
            }
        };

        fetchWaveData();
        const interval = setInterval(fetchWaveData, 60000);
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
