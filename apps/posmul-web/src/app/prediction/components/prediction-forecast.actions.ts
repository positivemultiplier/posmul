"use server";

import { createAiForecastService } from "@/bounded-contexts/prediction/infrastructure/adapters/ai-forecast.adapter";
import type { AiForecastDTO } from "@/bounded-contexts/prediction/domain/value-objects/ai-forecast.types";

export type { AiForecastDTO };

const forecastService = createAiForecastService();

/**
 * 게임별 실제 연동 LLM 독립 예측 스냅샷 + 분야별 최근 5경기 성적 조회
 * - 미연동 LLM은 빈 슬롯을 만들지 않고 실제 생성된 모델만 반환
 */
export async function getAiForecastsAction(gameId: string): Promise<{
  success: boolean;
  forecasts: AiForecastDTO[];
}> {
  try {
    const forecasts = await forecastService.getOrCreateForGameId(gameId, {
      timeoutMs: 12000,
    });
    return { success: true, forecasts };
  } catch {
    return { success: false, forecasts: [] };
  }
}
