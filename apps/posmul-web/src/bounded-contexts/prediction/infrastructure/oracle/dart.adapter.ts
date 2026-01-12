import { IOracleProvider } from "../../domain/services/oracle/oracle.interface";
import { OracleResult, SettlementSource } from "../../domain/value-objects/settlement-types";

interface DartConfig {
    corpCode: string; // 고유번호 (8자리)
    bsnsYear: string; // 사업연도
    reprtCode: "11013" | "11012" | "11014" | "11011"; // 1분기/반기/3분기/사업보고서
    accountName: string; // "영업이익", "매출액", "당기순이익" 등
    comparisonType: "greater" | "less";
    threshold: number; // 비교 기준 금액 (원 단위)
    optionMapping: Record<string, string>; // { "above": "opt_1", "below": "opt_2" }
}

interface DartApiResponse {
    status: string;
    message: string;
    list?: Array<{
        account_nm: string; // 계정과목명
        thstrm_amount: string; // 당기금액 (문자열, 콤마 포함 가능)
        // ... 기타 필드 생략
    }>;
}

export class DartOracleAdapter implements IOracleProvider {
    supports(sourceType: string): boolean {
        return sourceType === "dart";
    }

    async fetchResult(source: SettlementSource): Promise<OracleResult | null> {
        const apiKey = process.env.DART_API_KEY || process.env.NEXT_PUBLIC_DART_API_KEY;
        if (!apiKey) {
            console.error("[DART] DART_API_KEY not set");
            return null;
        }

        const config = source.sourceConfig as unknown as DartConfig;
        console.log("[DART DEBUG] Config Parsed:", JSON.stringify(config));
        const { corpCode, bsnsYear, reprtCode, accountName, comparisonType, threshold, optionMapping } = config;

        if (!corpCode || !bsnsYear || !reprtCode || !accountName || !optionMapping) {
            console.error("[DART] Missing required config fields");
            return null;
        }

        try {
            // 단일회사 전체 재무제표 조회 (fnlttSinglAcntAll)
            // JSON 포맷 요청을 위해 API URL 구성
            const url = `https://opendart.fss.or.kr/api/fnlttSinglAcntAll.json?crtfc_key=${apiKey}&corp_code=${corpCode}&bsns_year=${bsnsYear}&reprt_code=${reprtCode}&fs_div=CFS`; // CFS: 연결재무제표

            const res = await fetch(url);
            if (!res.ok) {
                console.error("[DART] API error:", res.status);
                return null;
            }

            const data: DartApiResponse = await res.json();

            if (data.status !== "000") {
                console.log(`[DART] API Message: ${data.message} (Status: ${data.status})`);
                return null;
            }

            if (!data.list || data.list.length === 0) {
                console.log("[DART] No financial data list found");
                return null;
            }

            // 목표 계정과목 찾기 (정확한 매칭 or 포함 검색)
            // DART 데이터는 '영업이익', '영업이익(손실)' 등으로 표기될 수 있음
            const targetAccount = data.list.find((item) =>
                item.account_nm.replace(/\s/g, "") === accountName.replace(/\s/g, "") ||
                item.account_nm.includes(accountName)
            );

            if (!targetAccount) {
                console.error(`[DART] Account '${accountName}' not found in report`);
                return null;
            }

            // 금액 파싱 (콤마 제거)
            const amountStr = targetAccount.thstrm_amount.replace(/,/g, "");
            const amount = parseFloat(amountStr);

            if (isNaN(amount)) {
                console.error(`[DART] Invalid amount value: ${targetAccount.thstrm_amount}`);
                return null;
            }

            // 결과 판정
            let resultKey = "unknown";
            if (comparisonType === "greater") {
                resultKey = amount > threshold ? "above" : "below";
            } else if (comparisonType === "less") {
                resultKey = amount < threshold ? "below" : "above";
            }

            const winningOptionId = optionMapping[resultKey];
            if (!winningOptionId) {
                console.error("[DART] No option mapped for:", resultKey);
                return null;
            }

            return {
                winningOptionId,
                sourceData: {
                    corpCode,
                    accountName: targetAccount.account_nm,
                    amount,
                    threshold,
                    raw: targetAccount
                },
                confidence: 1.0,
                fetchedAt: new Date(),
            };

        } catch (err) {
            console.error("[DART] Fetch error:", err);
            return null;
        }
    }
}
