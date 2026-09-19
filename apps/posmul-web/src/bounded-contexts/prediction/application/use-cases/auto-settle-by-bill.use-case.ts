import { Result, UseCaseError, failure, success, PredictionGameId, UserId } from "@posmul/auth-economy-sdk";
import { SettlePredictionGameUseCase } from "./settle-prediction-game.use-case";
import { supabaseAdmin } from "@/lib/supabase/admin";

export interface BillSettlementCandidate {
    gameId: string;
    gameTitle: string;
    billId: string;
    billNo: string;
    billName: string;
    procResult: string | null;
    rgsConfRslt: string | null;
    determinedWinningOptionId: string;
    winningLabel: string;
}

export interface AutoSettleBillsResult {
    totalCheckedBills: number;
    settledGamesCount: number;
    details: Array<{
        gameId: string;
        gameTitle: string;
        winningOptionId: string;
        totalRewardDistributed: number;
        winnersCount: number;
    }>;
    logs: string[];
}

const SYSTEM_ADMIN_ID = "00000000-0000-0000-0000-000000000001";

/**
 * 국회 의안 심의/처리 결과에 따른 예측 게임 자동 정산 유스케이스
 */
export class AutoSettleByBillUseCase {
    constructor(
        private readonly settlePredictionGameUseCase: SettlePredictionGameUseCase
    ) {}

    /**
     * 가결/부결 판정 함수
     * @returns 'PASS' (가결) | 'REJECT' (부결/폐기) | 'PENDING' (심의 중)
     */
    static evaluateBillResult(rgsConfRslt: string | null, procResult: string | null): "PASS" | "REJECT" | "PENDING" {
        const text = `${rgsConfRslt || ""} ${procResult || ""}`.trim();
        if (!text) return "PENDING";

        // 1. 가결/통과 키워드
        const passKeywords = ["원안가결", "수정가결", "가결", "통과"];
        if (passKeywords.some(kw => text.includes(kw))) {
            return "PASS";
        }

        // 2. 부결/폐기/철회 키워드
        const rejectKeywords = ["부결", "폐기", "철회", "반려", "임기만료폐기", "대안반영폐기"];
        if (rejectKeywords.some(kw => text.includes(kw))) {
            return "REJECT";
        }

        return "PENDING";
    }

    async execute(): Promise<Result<AutoSettleBillsResult, UseCaseError>> {
        const logs: string[] = [];
        logs.push("Starting Auto-Settlement by Assembly Bills...");

        try {
            // 1. 처리 결과가 나온 의안들 조회 (proc_result 또는 rgs_conf_rslt가 존재하는 것)
            const { data: bills, error: billError } = await supabaseAdmin
                .schema("feed")
                .from("bills")
                .select("*");

            if (billError || !bills) {
                return failure(new UseCaseError(`Failed to fetch bills: ${billError?.message}`));
            }

            logs.push(`Found ${bills.length} bills in feed.bills table.`);

            // 2. 현재 활성(ACTIVE) 상태인 게임들 중 의안과 연계된 게임 조회
            const { data: activeGames, error: gameError } = await supabaseAdmin
                .schema("prediction")
                .from("prediction_games")
                .select("game_id, title, game_options, status, metadata, external_id")
                .eq("status", "ACTIVE");

            if (gameError || !activeGames) {
                return failure(new UseCaseError(`Failed to fetch active prediction games: ${gameError?.message}`));
            }

            logs.push(`Found ${activeGames.length} ACTIVE prediction games.`);

            const details: AutoSettleBillsResult["details"] = [];
            let settledGamesCount = 0;

            for (const bill of bills) {
                const verdict = AutoSettleByBillUseCase.evaluateBillResult(bill.rgs_conf_rslt, bill.proc_result);
                if (verdict === "PENDING") {
                    continue;
                }

                // 이 의안과 매칭되는 게임 찾기 (metadata.bill_id, metadata.bill_no, 또는 제목에 의안번호 포함)
                const matchingGames = activeGames.filter(g => {
                    const meta = (g.metadata as any) || {};
                    const metaBillId = meta.bill_id || g.external_id;
                    const metaBillNo = meta.bill_no;
                    return (
                        (metaBillId && metaBillId === bill.bill_id) ||
                        (metaBillNo && metaBillNo === bill.bill_no) ||
                        (bill.bill_no && g.title.includes(bill.bill_no))
                    );
                });

                for (const game of matchingGames) {
                    const options = (game.game_options as any)?.options || [];
                    if (options.length < 2) continue;

                    // 승리 옵션 판정:
                    // PASS(가결) -> opt_1 또는 'yes' 또는 '가결'/'찬성' 라벨 옵션
                    // REJECT(부결) -> opt_2 또는 'no' 또는 '부결'/'반대' 라벨 옵션
                    let winningOption = options[0]; // 기본 1번
                    if (verdict === "PASS") {
                        winningOption = options.find((o: any) =>
                            o.id === "opt_1" ||
                            o.id === "yes" ||
                            (o.label && (o.label.includes("가결") || o.label.includes("찬성") || o.label.includes("통과")))
                        ) || options[0];
                    } else if (verdict === "REJECT") {
                        winningOption = options.find((o: any) =>
                            o.id === "opt_2" ||
                            o.id === "no" ||
                            (o.label && (o.label.includes("부결") || o.label.includes("반대") || o.label.includes("폐기")))
                        ) || options[1] || options[0];
                    }

                    logs.push(
                        `Settling game '${game.title}' (Verdict: ${verdict}, WinningOption: ${winningOption.id} - ${winningOption.label})`
                    );

                    // SettlePredictionGameUseCase 실행
                    const settleResult = await this.settlePredictionGameUseCase.execute({
                        gameId: game.game_id as PredictionGameId,
                        correctOptionId: winningOption.id,
                        adminUserId: SYSTEM_ADMIN_ID as UserId,
                    });

                    if (settleResult.success) {
                        settledGamesCount++;
                        details.push({
                            gameId: game.game_id,
                            gameTitle: game.title,
                            winningOptionId: winningOption.id,
                            totalRewardDistributed: settleResult.data.totalRewardDistributed,
                            winnersCount: settleResult.data.winnersCount,
                        });
                        logs.push(
                            `✅ Game ${game.game_id} settled successfully! Reward distributed: ${settleResult.data.totalRewardDistributed} PMC`
                        );
                    } else {
                        const errMsg = (settleResult as any).error?.message || "Unknown error";
                        logs.push(
                            `❌ Settlement failed for game ${game.game_id}: ${errMsg}`
                        );
                    }
                }
            }

            return success({
                totalCheckedBills: bills.length,
                settledGamesCount,
                details,
                logs,
            });
        } catch (e: any) {
            console.error("[AutoSettleByBillUseCase] Exception:", e);
            return failure(new UseCaseError(e?.message || "Unexpected error in AutoSettleByBillUseCase"));
        }
    }
}
