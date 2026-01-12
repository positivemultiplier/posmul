/**
 * Settlement Orchestrator Service
 *
 * 외부 API에서 결과를 가져와 정산을 시작하는 오케스트레이터
 * 기존 PredictionSettlementService와 통합하여 사용
 */

import { createClient } from "@/lib/supabase/client";

// ============================================================
// Types
// ============================================================

import { IOracleProvider } from "../../domain/services/oracle/oracle.interface";
import { DartOracleAdapter } from "../../infrastructure/oracle/dart.adapter";
import { FootballDataOracleAdapter } from "../../infrastructure/oracle/football-data.adapter";
import { KosisOracleAdapter } from "../../infrastructure/oracle/kosis.adapter";
import {
    GameResult,
    SettlementMethod,
    SettlementSource,
    SettlementSourceType
} from "../../domain/value-objects/settlement-types";


// ============================================================
// Settlement Orchestrator
// ============================================================

export class SettlementOrchestratorService {
    private supabase = createClient();
    private adapters: IOracleProvider[];

    constructor(adapters?: IOracleProvider[]) {
        this.adapters = adapters ?? [
            new KosisOracleAdapter(),
            new FootballDataOracleAdapter(),
            new DartOracleAdapter(),
        ];
    }

    /**
     * 예정된 정산 소스 조회
     */
    async getScheduledSettlements(): Promise<SettlementSource[]> {
        const { data, error } = await this.supabase
            .schema("prediction")
            .from("settlement_sources")
            .select("*")
            .lte("scheduled_at", new Date().toISOString())
            .order("scheduled_at", { ascending: true });

        if (error) {
            console.error("[SettlementOrchestrator] Error fetching scheduled:", error);
            return [];
        }

        return (data ?? []).map(row => ({
            id: row.id,
            gameId: row.game_id,
            sourceType: row.source_type as SettlementSourceType,
            sourceConfig: row.source_config ?? {},
            externalId: row.external_id ?? undefined,
            scheduledAt: row.scheduled_at ? new Date(row.scheduled_at) : undefined,
        }));
    }

    /**
     * 외부 API에서 게임 결과 조회
     */
    async fetchGameResult(source: SettlementSource): Promise<GameResult | null> {
        const adapter = this.adapters.find(a => a.supports(source.sourceType));

        if (!adapter) {
            if (source.sourceType === "manual") {
                return null; // 수동 정산은 별도 처리
            }
            console.warn(`[SettlementOrchestrator] No adapter found for source type: ${source.sourceType}`);
            return null;
        }

        const result = await adapter.fetchResult(source);
        if (!result) return null;

        // OracleResult -> GameResult 변환 (타입 호환성)
        return {
            winningOptionId: result.winningOptionId,
            sourceData: result.sourceData,
            confidence: result.confidence,
            fetchedAt: result.fetchedAt
        };
    }

    /**
     * 정산 이력 기록
     */
    async recordSettlementHistory(
        gameId: string,
        winningOptionId: string,
        method: SettlementMethod,
        sourceData: Record<string, unknown>,
        settledBy?: string
    ): Promise<boolean> {
        const { error } = await this.supabase
            .schema("prediction")
            .from("settlement_history")
            .insert({
                game_id: gameId,
                winning_option_id: winningOptionId,
                settlement_method: method,
                source_data: sourceData,
                settled_by: settledBy ?? null,
            });

        if (error) {
            console.error("[SettlementOrchestrator] Error recording history:", error);
            return false;
        }

        return true;
    }

    /**
     * 게임 상태를 SETTLED로 업데이트
     */
    async updateGameStatus(gameId: string, winningOptionId: string): Promise<boolean> {
        const { error } = await this.supabase
            .schema("prediction")
            .from("prediction_games")
            .update({
                status: "SETTLED",
                winning_option_id: winningOptionId,
                settled_at: new Date().toISOString(),
            })
            .eq("game_id", gameId);

        if (error) {
            console.error("[SettlementOrchestrator] Error updating game status:", error);
            return false;
        }

        return true;
    }

    /**
     * 전체 자동 정산 프로세스 실행
     * (기존 PredictionSettlementService와 연계)
     */
    async executeAutoSettlement(source: SettlementSource): Promise<{
        success: boolean;
        error?: string;
        result?: GameResult;
    }> {
        // 1. 외부 API에서 결과 조회
        const result = await this.fetchGameResult(source);
        if (!result) {
            return { success: false, error: "결과를 가져올 수 없습니다" };
        }

        // 2. 정산 이력 기록
        const recorded = await this.recordSettlementHistory(
            source.gameId,
            result.winningOptionId,
            "auto",
            result.sourceData
        );
        if (!recorded) {
            return { success: false, error: "정산 이력 기록 실패" };
        }

        // 3. 게임 상태 업데이트
        const updated = await this.updateGameStatus(source.gameId, result.winningOptionId);
        if (!updated) {
            return { success: false, error: "게임 상태 업데이트 실패" };
        }

        return { success: true, result };
    }
}

// 싱글톤 인스턴스
export const settlementOrchestrator = new SettlementOrchestratorService();
