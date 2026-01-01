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

export type SettlementSourceType = "football_data" | "kosis" | "manual" | "thesportsdb";
export type SettlementMethod = "auto" | "semi_auto" | "manual";

export interface SettlementSource {
    id: string;
    gameId: string;
    sourceType: SettlementSourceType;
    sourceConfig: Record<string, unknown>;
    externalId?: string;
    scheduledAt?: Date;
}

export interface GameResult {
    winningOptionId: string;
    sourceData: Record<string, unknown>;
    confidence: number; // 0-1, 결과 신뢰도
    fetchedAt: Date;
}

interface FootballDataMatch {
    id: number;
    status: string;
    score: {
        fullTime: {
            home: number;
            away: number;
        };
        winner: "HOME_TEAM" | "AWAY_TEAM" | "DRAW" | null;
    };
}

interface KosisIndicator {
    indicatorCode: string;
    value: number;
    referenceDate: string;
}

// ============================================================
// Settlement Orchestrator
// ============================================================

export class SettlementOrchestratorService {
    private supabase = createClient();

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
        switch (source.sourceType) {
            case "football_data":
                return this.fetchFootballDataResult(source);
            case "kosis":
                return this.fetchKosisResult(source);
            case "thesportsdb":
                return this.fetchTheSportsDbResult(source);
            case "manual":
                return null; // 수동 정산은 별도 처리
            default:
                console.warn(`[SettlementOrchestrator] Unknown source type: ${source.sourceType}`);
                return null;
        }
    }

    /**
     * football-data.org에서 경기 결과 조회
     */
    private async fetchFootballDataResult(source: SettlementSource): Promise<GameResult | null> {
        const matchId = source.externalId;
        if (!matchId) {
            console.error("[FootballData] No externalId (matchId) provided");
            return null;
        }

        const apiKey = process.env.FOOTBALL_DATA_API_KEY;
        if (!apiKey) {
            console.error("[FootballData] FOOTBALL_DATA_API_KEY not set");
            return null;
        }

        try {
            const res = await fetch(`https://api.football-data.org/v4/matches/${matchId}`, {
                headers: { "X-Auth-Token": apiKey },
            });

            if (!res.ok) {
                console.error("[FootballData] API error:", res.status);
                return null;
            }

            const match: FootballDataMatch = await res.json();

            if (match.status !== "FINISHED") {
                console.log("[FootballData] Match not finished yet:", match.status);
                return null;
            }

            // 게임 옵션과 매칭 (sourceConfig에 매핑 정보 필요)
            const optionMapping = source.sourceConfig.optionMapping as Record<string, string> | undefined;
            if (!optionMapping) {
                console.error("[FootballData] No optionMapping in sourceConfig");
                return null;
            }

            const winnerKey = match.score.winner ?? "DRAW";
            const winningOptionId = optionMapping[winnerKey];

            if (!winningOptionId) {
                console.error("[FootballData] No option mapped for:", winnerKey);
                return null;
            }

            return {
                winningOptionId,
                sourceData: {
                    matchId: match.id,
                    score: match.score,
                    status: match.status,
                },
                confidence: 1.0, // API 결과는 확실
                fetchedAt: new Date(),
            };
        } catch (err) {
            console.error("[FootballData] Fetch error:", err);
            return null;
        }
    }

    /**
     * KOSIS에서 경제지표 조회
     */
    private async fetchKosisResult(source: SettlementSource): Promise<GameResult | null> {
        const apiKey = process.env.KOSIS_API_KEY;
        if (!apiKey) {
            console.error("[KOSIS] KOSIS_API_KEY not set");
            return null;
        }

        const { indicatorCode, comparisonType, threshold, optionMapping } = source.sourceConfig as {
            indicatorCode: string;
            comparisonType: "greater" | "less" | "equal" | "range";
            threshold?: number;
            optionMapping: Record<string, string>;
        };

        if (!indicatorCode || !optionMapping) {
            console.error("[KOSIS] Missing indicatorCode or optionMapping");
            return null;
        }

        try {
            // KOSIS API 호출 (실제 API 스펙에 맞게 수정 필요)
            const url = `https://kosis.kr/openapi/Param/statisticsParameterData.do?method=getList&apiKey=${apiKey}&itmId=${indicatorCode}&format=json`;
            const res = await fetch(url);

            if (!res.ok) {
                console.error("[KOSIS] API error:", res.status);
                return null;
            }

            const data = await res.json();
            const latestValue = data?.item?.[0]?.DT ?? null;

            if (latestValue === null) {
                console.log("[KOSIS] No data available yet");
                return null;
            }

            // 조건에 따라 승리 옵션 결정
            let resultKey = "unknown";
            const numValue = parseFloat(latestValue);

            if (comparisonType === "greater" && threshold !== undefined) {
                resultKey = numValue > threshold ? "above" : "below";
            } else if (comparisonType === "less" && threshold !== undefined) {
                resultKey = numValue < threshold ? "below" : "above";
            }

            const winningOptionId = optionMapping[resultKey];
            if (!winningOptionId) {
                console.error("[KOSIS] No option mapped for:", resultKey);
                return null;
            }

            return {
                winningOptionId,
                sourceData: {
                    indicatorCode,
                    value: numValue,
                    comparisonType,
                    threshold,
                },
                confidence: 1.0,
                fetchedAt: new Date(),
            };
        } catch (err) {
            console.error("[KOSIS] Fetch error:", err);
            return null;
        }
    }

    /**
     * TheSportsDB에서 결과 조회 (무료 대안)
     */
    private async fetchTheSportsDbResult(source: SettlementSource): Promise<GameResult | null> {
        const eventId = source.externalId;
        if (!eventId) {
            console.error("[TheSportsDB] No externalId (eventId) provided");
            return null;
        }

        try {
            const res = await fetch(
                `https://www.thesportsdb.com/api/v1/json/3/lookupevent.php?id=${eventId}`
            );

            if (!res.ok) {
                console.error("[TheSportsDB] API error:", res.status);
                return null;
            }

            const data = await res.json();
            const event = data?.events?.[0];

            if (!event || !event.strStatus || event.strStatus !== "Match Finished") {
                console.log("[TheSportsDB] Match not finished yet");
                return null;
            }

            const homeScore = parseInt(event.intHomeScore ?? "0", 10);
            const awayScore = parseInt(event.intAwayScore ?? "0", 10);

            const optionMapping = source.sourceConfig.optionMapping as Record<string, string> | undefined;
            if (!optionMapping) {
                console.error("[TheSportsDB] No optionMapping in sourceConfig");
                return null;
            }

            let winnerKey = "DRAW";
            if (homeScore > awayScore) winnerKey = "HOME_TEAM";
            else if (awayScore > homeScore) winnerKey = "AWAY_TEAM";

            const winningOptionId = optionMapping[winnerKey];
            if (!winningOptionId) {
                console.error("[TheSportsDB] No option mapped for:", winnerKey);
                return null;
            }

            return {
                winningOptionId,
                sourceData: {
                    eventId: event.idEvent,
                    eventName: event.strEvent,
                    homeScore,
                    awayScore,
                },
                confidence: 1.0,
                fetchedAt: new Date(),
            };
        } catch (err) {
            console.error("[TheSportsDB] Fetch error:", err);
            return null;
        }
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

        // 4. TODO: PredictionSettlementService.settlePrediction() 호출하여 보상 분배
        // const settlementService = new PredictionSettlementService();
        // await settlementService.settlePrediction(source.gameId, { winningOptionId: result.winningOptionId, ... }, participants);

        return { success: true, result };
    }
}

// 싱글톤 인스턴스
export const settlementOrchestrator = new SettlementOrchestratorService();
