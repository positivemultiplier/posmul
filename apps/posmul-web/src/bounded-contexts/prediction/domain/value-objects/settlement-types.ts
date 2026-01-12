/**
 * 정산 관련 공통 타입 정의
 */

export type SettlementSourceType = "football_data" | "kosis" | "manual" | "dart" | "thesportsdb";
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
