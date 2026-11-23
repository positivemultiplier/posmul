"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import {
  calculateStakeConvictionRatio,
  clampDeliberationSec,
} from "@/bounded-contexts/prediction/domain/value-objects/decision-telemetry.types";

const RecordDecisionTelemetrySchema = z.object({
  gameId: z.string().uuid(),
  predictionId: z.string().max(120).optional(),
  selectedOptionId: z.string().min(1).max(120),
  stakeAmount: z.number().int().positive(),
  balanceBefore: z.number().int().nonnegative(),
  optionProbAtTime: z.number().min(0).max(1).optional(),
  deliberationSec: z.number().int().min(0).max(86400),
  viewedBriefing: z.boolean(),
  viewedAiForecasts: z.boolean(),
  chartTabSwitches: z.number().int().min(0).max(500),
  deviceType: z.enum(["mobile", "desktop", "unknown"]).default("unknown"),
});

export type RecordDecisionTelemetryInput = z.infer<
  typeof RecordDecisionTelemetrySchema
>;

/**
 * 예측 투표 완료 시 무자각 행동 시그널을 서버 인증 기반으로 기록합니다.
 * - 실패 시에도 사용자의 투표 성공 플로우를 막지 않도록 조용히 false 반환.
 */
export async function recordDecisionTelemetryAction(
  rawInput: RecordDecisionTelemetryInput
): Promise<{ success: boolean }> {
  try {
    const parsed = RecordDecisionTelemetrySchema.safeParse(rawInput);
    if (!parsed.success) {
      return { success: false };
    }

    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return { success: false };
    }

    const d = parsed.data;
    const stakeConvictionRatio = calculateStakeConvictionRatio(
      d.stakeAmount,
      d.balanceBefore
    );

    const { error } = await supabase
      .schema("prediction")
      .from("decision_telemetry")
      .insert({
        user_id: user.id,
        game_id: d.gameId,
        prediction_id: d.predictionId ?? null,
        selected_option_id: d.selectedOptionId,
        stake_amount: d.stakeAmount,
        user_pmp_balance_before: d.balanceBefore,
        stake_conviction_ratio: stakeConvictionRatio,
        option_prob_at_time:
          typeof d.optionProbAtTime === "number"
            ? Number(d.optionProbAtTime.toFixed(4))
            : null,
        deliberation_sec: clampDeliberationSec(d.deliberationSec * 1000),
        viewed_briefing: d.viewedBriefing,
        viewed_ai_forecasts: d.viewedAiForecasts,
        chart_tab_switches: d.chartTabSwitches,
        device_type: d.deviceType,
      });

    return { success: !error };
  } catch {
    return { success: false };
  }
}
