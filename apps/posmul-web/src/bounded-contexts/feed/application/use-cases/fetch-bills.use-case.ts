import axios from "axios";
import { Result, UseCaseError, failure, success } from "@posmul/auth-economy-sdk";
import { Bill } from "../../domain/entities/bill.entity";
import { IBillRepository } from "../../domain/repositories/feed.repository";

// Open Assembly API Response Types
interface OpenApiRow {
    BILL_ID: string;
    BILL_NO: string;
    BILL_NAME: string;
    PROPOSER: string;
    COMMITTEE: string;
    PROC_RESULT: string;
    RGS_CONF_RSLT: string;
    // ... others
}

interface OpenApiResponse {
    nzmimeepazxkubdpn?: Array<{
        head?: Array<{ list_total_count: number; RESULT: { CODE: string; MESSAGE: string } }>;
        row?: OpenApiRow[];
    }>;
}

export class FetchBillsUseCase {
    private readonly API_URL = "https://open.assembly.go.kr/portal/openapi/nzmimeepazxkubdpn";
    // nzmimeepazxkubdpn code means "의안정보(처리와결과)"

    constructor(
        private billRepository: IBillRepository,
        private apiKey?: string // Optional, but better to enforce
    ) { }

    async execute(targetAge: number = 21): Promise<Result<void, UseCaseError>> {
        try {
            // 1. API 호출 (최신 의안부터 조회 - AGE 파라미터 활용 가능)
            // pIndex: 페이지 위치, pSize: 페이지 당 요청 숫자
            const response = await axios.get<OpenApiResponse>(this.API_URL, {
                params: {
                    KEY: this.apiKey,
                    Type: "json",
                    pIndex: 1,
                    pSize: 100, // 한 번에 100개
                    AGE: targetAge, // 21대 or 22대 국회
                },
            });

            const data = response.data.nzmimeepazxkubdpn;
            if (!data || !data[1] || !data[1].row) {
                // API 에러 또는 데이터 없음
                return failure(new UseCaseError("No data received from Open Assembly API"));
            }

            const rows = data[1].row;
            console.log(`[FetchBills] Fetched ${rows.length} bills (Age: ${targetAge})`);

            // 2. 파싱 및 저장
            for (const row of rows) {
                // 기존 의안 조회
                const existingResult = await this.billRepository.findByBillId(row.BILL_ID);

                if (existingResult.success && existingResult.data) {
                    const existingBill = existingResult.data;
                    // 상태 업데이트 체크
                    const changed = existingBill.updateStatus(row.PROC_RESULT, row.RGS_CONF_RSLT);
                    if (changed) {
                        await this.billRepository.save(existingBill);
                        console.log(`[FetchBills] Updated status for bill ${row.BILL_NO} (${row.BILL_NAME})`);
                        // TODO: Publish Domain Event 'BillStatusChanged'
                    }
                } else {
                    // 신규 생성
                    const newBill = Bill.create({
                        billId: row.BILL_ID,
                        billNo: row.BILL_NO,
                        billName: row.BILL_NAME,
                        proposer: row.PROPOSER,
                        committee: row.COMMITTEE,
                        procResult: row.PROC_RESULT,
                        rgsConfRslt: row.RGS_CONF_RSLT,
                    });
                    await this.billRepository.save(newBill);
                }
            }

            return success(undefined);
        } catch (error) {
            console.error("[FetchBills] Error:", error);
            return failure(new UseCaseError("Failed to fetch bills from Open API"));
        }
    }
}
