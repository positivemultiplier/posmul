export interface HourglassMetrics {
  /** 1시간 회차 경과 비율 (0 ~ 1) */
  rawElapsedRatio: number;
  /** 하단 황금 적층률 (최소 35% 시드부터 시작 -> 100%까지 상승) */
  goldFillRatio: number;
  /** 화면 표시용 Wave 충전율 (%) (35 ~ 100) */
  displayPercent: number;
  /** 상단 파란 PMP 잔여 비율 (0.65 -> 0.06으로 감소) */
  topWaterRatio: number;
  /** 상단 수면 Y 좌표 (viewBox 100x130, 챔버 Y: 14 ~ 63) */
  topSurfaceY: number;
  /** 하단 황금 봉우리 꼭대기 Y 좌표 (viewBox 100x130, 바닥 116) */
  pilePeakY: number;
  /** 하단 황금 양쪽 어깨 Y 좌표 */
  pileShoulderY: number;
  /** 목(y=63) -> 봉우리 꼭대기 낙하 거리 */
  dropDistance: number;
}

export const TOP_CHAMBER_TOP_Y = 14;
export const TOP_NECK_Y = 63;
export const BOTTOM_CHAMBER_HEIGHT = 49; // y=67 ~ y=116
export const BOTTOM_FLOOR_Y = 116;

/**
 * 1시간 회차 경과율(0~1)에 따라 하단 황금(최소 35% 시작)과 상단 물 높이(65% -> 6%)를 계산
 */
export function computeHourglassMetrics(rawElapsed: number): HourglassMetrics {
  const clamped = Math.max(0, Math.min(1, rawElapsed));
  // 바닥 0%가 아닌 35% 황금 기반에서 시작해 정각 직전 100%까지 차오름
  const goldFillRatio = 0.35 + clamped * 0.65;
  const displayPercent = Math.round(goldFillRatio * 100);

  // 목이 황금에 잠기지 않도록 SVG 내부 실제 높이는 35% ~ 92% 구간에 매핑
  const visualBottomFill = 0.35 + clamped * 0.57;
  const bottomHeight = BOTTOM_CHAMBER_HEIGHT * visualBottomFill;
  const pilePeakY = Number((BOTTOM_FLOOR_Y - bottomHeight).toFixed(2));
  const pileShoulderY = Number(
    (BOTTOM_FLOOR_Y - bottomHeight * 0.62).toFixed(2)
  );

  // 상단은 65%에서 시작해 6%까지 비워져 위·아래 대칭 이동을 명확히 체감
  const topWaterRatio = Math.max(0.06, 0.65 * (1 - clamped));
  const topHeight = (TOP_NECK_Y - TOP_CHAMBER_TOP_Y) * topWaterRatio;
  const topSurfaceY = Number((TOP_NECK_Y - topHeight).toFixed(2));
  const dropDistance = Math.max(6, Number((pilePeakY - TOP_NECK_Y).toFixed(2)));

  return {
    rawElapsedRatio: clamped,
    goldFillRatio,
    displayPercent,
    topWaterRatio,
    topSurfaceY,
    pilePeakY,
    pileShoulderY,
    dropDistance,
  };
}

/**
 * 현재 시 기준 정각까지 남은 초(1 ~ 3600) 반환
 */
export function getKstHourSecondsLeft(now: Date = new Date()): number {
  const elapsedInHour = now.getMinutes() * 60 + now.getSeconds();
  const left = 3600 - elapsedInHour;
  return left > 0 ? left : 3600;
}

