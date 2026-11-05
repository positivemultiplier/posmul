import { useState, useEffect } from "react";
import { createClient } from "../../../../../lib/supabase/client";
import {
  computeRevealRatio,
  clamp01,
  resolveSelectedDbCategory,
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

const MAX_GAME_ACCUMULATED_POOL = 20000;

export function useWaveCalculation({
  domain = "prediction",
  category = "all",
  gameId,
}: UseWaveCalculationProps): WaveCalculationResult {
  const supabase = createClient();

  const [waveAmount, setWaveAmount] = useState(0);
  const [slotState, setSlotState] = useState({
    isSpinning: false,
    spinSpeed: 0,
    progressRatio: 0,
  });
  const [participantCount, setParticipantCount] = useState(0);
  const [activeGames, setActiveGames] = useState(0);

  useEffect(() => {
    let isMounted = true;

    const fetchWaveData = async () => {
      try {
        // 1. 현재 KST 정각(hour_start) 계산
        const now = new Date();
        const hourStartIso = getKstHourStartIso(now);
        const hourStartMs = new Date(hourStartIso).getTime();
        const HOUR_MS = 60 * 60 * 1000;

        // 2. 참여자 수 및 활성 게임 수 조회 (head: true로 네트워크 부하 최소화)
        const [{ count: participants }, { count: activeGameCount }] =
          await Promise.all([
            supabase
              .schema("prediction")
              .from("predictions")
              .select("prediction_id", { count: "exact", head: true })
              .eq("is_active", true),
            supabase
              .schema("prediction")
              .from("prediction_games")
              .select("game_id", { count: "exact", head: true })
              .eq("status", "ACTIVE"),
          ]);

        if (!isMounted) return;

        // 3. 진행률 및 Reveal 비율 계산
        const progressRaw = clamp01((now.getTime() - hourStartMs) / HOUR_MS);
        const { progressAdjusted, revealRatio } = computeRevealRatio(
          progressRaw,
          participants || 0,
          activeGameCount || 0
        );

        // 4. Truth Pool 조회 및 누적/Reveal 적용
        let displayWave = 0;

        if (gameId) {
          // Case A: 개별 게임(Depth 5) -> 이전 시간까지의 누적 적립금 + 이번 시간 적립금 * revealRatio
          const { data: gamePools, error: gameError } = await supabase
            .schema("economy")
            .from("money_wave_hourly_game_pools")
            .select("hour_start, pool_pmc")
            .eq("game_id", gameId);

          if (!gameError && gamePools && gamePools.length > 0) {
            let pastAccumulated = 0;
            let currentHourPool = 0;

            for (const row of gamePools) {
              const rowMs = new Date(row.hour_start).getTime();
              const val = Number(row.pool_pmc) || 0;
              if (rowMs < hourStartMs) {
                pastAccumulated += val;
              } else if (rowMs === hourStartMs) {
                currentHourPool += val;
              }
            }

            displayWave = Math.min(
              MAX_GAME_ACCUMULATED_POOL,
              pastAccumulated + currentHourPool * revealRatio
            );
          }
        } else {
          // Case B: 도메인/카테고리(Depth 1~4) -> 현재 시간의 카테고리 배정 풀 * revealRatio
          let query = supabase
            .schema("economy")
            .from("money_wave_hourly_category_allocations")
            .select("pool_pmc")
            .eq("hour_start", hourStartIso)
            .eq("domain", domain);

          const resolvedCategory = resolveSelectedDbCategory(domain, category);
          if (resolvedCategory) {
            query = query.eq("category", resolvedCategory);
          }

          const { data: allocations, error: allocationError } = await query;

          if (!allocationError && allocations && allocations.length > 0) {
            const truthWave = allocations.reduce(
              (sum, row) => sum + (Number(row.pool_pmc) || 0),
              0
            );
            displayWave = truthWave * revealRatio;
          }
        }

        if (!isMounted) return;

        setWaveAmount(Math.round(displayWave));
        setParticipantCount(participants || 0);
        setActiveGames(activeGameCount || 0);
        setSlotState({
          isSpinning: progressRaw < 1,
          spinSpeed: Math.max(0.1, 0.3 + progressAdjusted * 1.2),
          progressRatio: progressAdjusted,
        });
      } catch (error) {
        console.error("useWaveCalculation error:", error);
      }
    };

    fetchWaveData();
    const interval = setInterval(fetchWaveData, 15000);
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
    activeGames,
  };
}
