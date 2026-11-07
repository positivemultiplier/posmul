/**
 * 정산 관련 공통 타입 및 표준 예측 스펙 정의
 */

export type SettlementSourceType =
  | "football_data"
  | "kosis"
  | "manual"
  | "dart"
  | "thesportsdb"
  | "alpha-vantage"
  | "fmp"
  | "ecos"
  | "kobis"
  | "kcontent"
  | "coingecko";

export type SettlementMethod = "auto" | "semi_auto" | "manual";

export interface SettlementSource {
  id: string;
  gameId: string;
  sourceType: SettlementSourceType;
  sourceConfig: Record<string, unknown>;
  externalId?: string;
  scheduledAt?: Date;
}

export interface OracleResult {
  winningOptionId: string;
  sourceData: Record<string, unknown>;
  confidence: number; // 0.0 ~ 1.0
  fetchedAt: Date;
}

export interface GameResult {
  winningOptionId: string;
  sourceData: Record<string, unknown>;
  confidence: number; // 0-1, 결과 신뢰도
  fetchedAt: Date;
}

/**
 * 모든 정기/자동 예측 게임이 준수하는 표준 타임라인 & 오라클 규격
 */
export interface StandardPredictionTimelineRule {
  /** 게임 오픈 시각 */
  openAt: Date;
  /** 베팅 마감 시각 (원칙: 결과 발표/방영/경기 시작 최소 1시간 전) */
  closeAt: Date;
  /** 정산 실행 시각 (공식 데이터 공표 후 1~24시간 버퍼) */
  settleAt: Date;
}
