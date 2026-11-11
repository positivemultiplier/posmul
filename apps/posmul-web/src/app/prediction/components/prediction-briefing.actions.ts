"use server";

import { balancedBriefingService } from "@/bounded-contexts/prediction/application/services/balanced-briefing.service";
import type { BalancedBriefingDTO } from "@/bounded-contexts/prediction/domain/value-objects/briefing.types";

export type { BalancedBriefingDTO };

/**
 * 게임 유형(BINARY / WIN_DRAW_LOSE / RANKING) 맞춤형 AI 균형 의사결정 브리핑 조회
 * - DB metadata.briefing 캐시 히트 시 즉시 반환
 * - 미존재·구버전 시 LG EXAONE + Gemini 듀얼 LLM으로 1회 생성 후 DB에 영구 캐싱
 */
export async function getBalancedBriefingAction(gameId: string): Promise<{
  success: boolean;
  briefing: BalancedBriefingDTO | null;
  error?: string;
}> {
  try {
    const briefing = await balancedBriefingService.getOrCreateForGameId(gameId, {
      timeoutMs: 18000,
    });

    if (!briefing) {
      return {
        success: false,
        briefing: null,
        error: "게임을 찾을 수 없습니다.",
      };
    }

    return { success: true, briefing };
  } catch (err) {
    return {
      success: false,
      briefing: null,
      error: err instanceof Error ? err.message : "브리핑 조회 중 오류",
    };
  }
}
