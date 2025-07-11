/**
 * 타입 호환성 브리지
 * 
 * SDK 타입과 shared-types 간 호환성을 위한 유틸리티
 * 단계적 마이그레이션 중에만 사용되며, 완료 후 제거될 예정입니다.
 */

import type { UserId as SDKUserId, PredictionGameId as SDKPredictionGameId } from "@posmul/auth-economy-sdk";
import type { UserId as LegacyUserId, PredictionGameId as LegacyPredictionGameId } from "@posmul/auth-economy-sdk"; // 마이그레이션 완료 - 이제 SDK 사용

/**
 * SDK UserId를 Legacy UserId로 변환
 */
export function toLegacyUserId(sdkUserId: SDKUserId): LegacyUserId {
  return sdkUserId as unknown as LegacyUserId;
}

/**
 * Legacy UserId를 SDK UserId로 변환
 */
export function toSDKUserId(legacyUserId: LegacyUserId): SDKUserId {
  return legacyUserId as unknown as SDKUserId;
}

/**
 * SDK PredictionGameId를 Legacy PredictionGameId로 변환
 */
export function toLegacyPredictionGameId(sdkGameId: SDKPredictionGameId): LegacyPredictionGameId {
  return sdkGameId as unknown as LegacyPredictionGameId;
}

/**
 * Legacy PredictionGameId를 SDK PredictionGameId로 변환
 */
export function toSDKPredictionGameId(legacyGameId: LegacyPredictionGameId): SDKPredictionGameId {
  return legacyGameId as unknown as SDKPredictionGameId;
}

/**
 * 문자열을 SDK UserId로 변환
 */
export function createSDKUserId(id: string): SDKUserId {
  return id as SDKUserId;
}

/**
 * 문자열을 SDK PredictionGameId로 변환
 */
export function createSDKPredictionGameId(id: string): SDKPredictionGameId {
  return id as SDKPredictionGameId;
}
