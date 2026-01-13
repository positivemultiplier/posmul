
import { supabaseAdmin as supabase } from "../../../../lib/supabase/admin";

interface PredictionRow {
    game_id: string;
    prediction_data: { selectedOptionId: string };
    bet_amount: number;
}

export class PredictionTrendService {
    /**
     * 모든 활성 게임의 현재 베팅 분포를 스냅샷으로 저장합니다.
     * 주기적으로 실행되는 스케줄러(Cron)에서 호출합니다.
     */
    async snapshotActiveGames(): Promise<{ processed: number; errors: number }> {
        try {
            // 1. 활성 게임 조회
            const { data: games, error: gameError } = await supabase
                .schema("prediction")
                .from("prediction_games")
                .select("game_id, prediction_type")
                .eq("status", "ACTIVE"); // ACTIVE 상태인 게임만

            if (gameError) throw new Error(`Failed to fetch active games: ${gameError.message}`);
            if (!games || games.length === 0) return { processed: 0, errors: 0 };

            const gameIds = games.map((g) => g.game_id);

            // 2. 해당 게임들의 베팅 데이터 조회 (Active 베팅만)
            // Note: 대규모 데이터의 경우 RPC나 View로 최적화 필요
            const { data: predictions, error: predError } = await supabase
                .schema("prediction")
                .from("predictions")
                .select("game_id, prediction_data, bet_amount")
                .in("game_id", gameIds)
                .eq("is_active", true);

            if (predError) throw new Error(`Failed to fetch predictions: ${predError.message}`);

            // 3. 메모리 내 집계 (Aggregation)
            const aggregation = new Map<string, Record<string, number>>(); // gameId -> { optionId: totalStake }

            (predictions as unknown as PredictionRow[]).forEach((p) => {
                const gameId = p.game_id;
                const optionId = p.prediction_data?.selectedOptionId;
                const stake = p.bet_amount || 0;

                if (!gameId || !optionId) return;

                if (!aggregation.has(gameId)) {
                    aggregation.set(gameId, {});
                }

                const gameStats = aggregation.get(gameId)!;
                gameStats[optionId] = (gameStats[optionId] || 0) + stake;
            });

            // 4. 스냅샷 데이터 생성 및 저장
            let processed = 0;
            let errors = 0;

            const snapshots = [];
            const timestamp = new Date().toISOString();

            for (const game of games) {
                const gameId = game.game_id;
                const stats = aggregation.get(gameId) || {};

                // 총 베팅액 계산
                const totalStake = Object.values(stats).reduce((sum, val) => sum + val, 0);

                // 분포 계산 (백분율)
                // Binary/WDL/Ranking 모두 옵션별 점유율(%)로 저장하면 프론트에서 활용 가능
                // 만약 베팅이 하나도 없으면? -> 빈 객체 또는 초기값

                const distribution: Record<string, number> = {};
                if (totalStake > 0) {
                    Object.keys(stats).forEach(optionId => {
                        distribution[optionId] = (stats[optionId] / totalStake) * 100;
                    });
                }

                snapshots.push({
                    game_id: gameId,
                    snapshot_data: distribution,
                    timestamp: timestamp
                });
                processed++;
            }

            if (snapshots.length > 0) {
                const { error: insertError } = await supabase
                    .schema("prediction")
                    .from("prediction_trends")
                    .insert(snapshots);

                if (insertError) {
                    console.error("Bulk insert failed", insertError);
                    throw insertError;
                }
            }

            return { processed, errors };

        } catch (error) {
            console.error("Error in snapshotActiveGames:", error);
            throw error;
        }
    }

    /**
     * 단일 게임 스냅샷 (베팅 발생 시 트리거용 - 선택적 사용)
     */
    async snapshotTrend(gameId: string, distribution: Record<string, any>): Promise<void> {
        try {
            const { error } = await supabase.from("prediction.prediction_trends").insert({
                game_id: gameId,
                snapshot_data: distribution,
                timestamp: new Date().toISOString(),
            });

            if (error) {
                // Log but don't throw to avoid blocking main flow
                console.error("Failed to snapshot prediction trend:", error);
            }
        } catch (error) {
            console.error("Error in snapshotTrend:", error);
        }
    }

    async getTrends(gameId: string) {
        const { data, error } = await supabase
            .schema("prediction")
            .from("prediction_trends")
            .select("*")
            .eq("game_id", gameId)
            .order("timestamp", { ascending: true });

        if (error) {
            throw new Error(error.message);
        }

        return data;
    }
}

export const predictionTrendService = new PredictionTrendService();
