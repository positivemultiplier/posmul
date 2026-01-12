import { IOracleProvider } from "../../domain/services/oracle/oracle.interface";
import { OracleResult, SettlementSource } from "../../domain/value-objects/settlement-types";

interface KosisConfig {
    indicatorCode: string;
    comparisonType: "greater" | "less" | "equal" | "range";
    threshold?: number;
    optionMapping: Record<string, string>;
}

export class KosisOracleAdapter implements IOracleProvider {
    supports(sourceType: string): boolean {
        return sourceType === "kosis";
    }

    async fetchResult(source: SettlementSource): Promise<OracleResult | null> {
        const apiKey = process.env.KOSIS_API_KEY;
        if (!apiKey) {
            console.error("[KOSIS] KOSIS_API_KEY not set");
            return null;
        }

        const config = source.sourceConfig as unknown as KosisConfig;
        const { indicatorCode, comparisonType, threshold, optionMapping } = config;

        if (!indicatorCode || !optionMapping) {
            console.error("[KOSIS] Missing indicatorCode or optionMapping");
            return null;
        }

        try {
            // KOSIS API 호출
            const url = `https://kosis.kr/openapi/Param/statisticsParameterData.do?method=getList&apiKey=${apiKey}&itmId=${indicatorCode}&format=json`;
            const res = await fetch(url);

            if (!res.ok) {
                console.error("[KOSIS] API error:", res.status);
                return null;
            }

            const data = await res.json();
            const item = Array.isArray(data) ? data[0] : (data?.item?.[0]); // 응답 구조 유연하게 처리
            const latestValue = item?.DT ?? null;

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
                    raw: item
                },
                confidence: 1.0,
                fetchedAt: new Date(),
            };
        } catch (err) {
            console.error("[KOSIS] Fetch error:", err);
            return null;
        }
    }
}
