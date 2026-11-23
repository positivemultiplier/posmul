/**
 * 예측 의사결정 무자각(Implicit) 텔레메트리 순수 계산 헬퍼 (외부 의존 0)
 */

export function clampDeliberationSec(elapsedMs: number): number {
  if (!Number.isFinite(elapsedMs) || elapsedMs <= 0) return 0;
  return Math.min(86400, Math.round(elapsedMs / 1000));
}

export function calculateStakeConvictionRatio(
  stakeAmount: number,
  balanceBefore: number
): number {
  if (!Number.isFinite(stakeAmount) || stakeAmount <= 0) return 0;
  const denom = Math.max(stakeAmount, Number.isFinite(balanceBefore) ? balanceBefore : 0);
  if (denom <= 0) return 0;
  return Number(Math.min(1, stakeAmount / denom).toFixed(4));
}

/**
 * 슬라이더 입력 없이 행동 시그널(베팅 비율, 숙고 시간, 브리핑 열람)로
 * 서버 기록용 추정 확신도(0.50 ~ 0.95)를 산출합니다.
 */
export function computeRevealedConfidence(params: {
  stakeConvictionRatio: number;
  deliberationSec: number;
  viewedBriefing: boolean;
  viewedAiForecasts: boolean;
}): number {
  const stakeScore = Math.min(1, Math.max(0, params.stakeConvictionRatio * 2));
  const timeScore = Math.min(1, Math.max(0, params.deliberationSec / 60));
  const infoScore =
    (params.viewedBriefing ? 0.65 : 0) + (params.viewedAiForecasts ? 0.35 : 0);

  const weighted = 0.5 + 0.45 * (0.5 * stakeScore + 0.3 * timeScore + 0.2 * infoScore);
  return Number(Math.min(0.95, Math.max(0.5, weighted)).toFixed(2));
}
