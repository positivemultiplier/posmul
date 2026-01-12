import { IOracleProvider } from "../../domain/services/oracle/oracle.interface";
import { OracleResult, SettlementSource } from "../../domain/value-objects/settlement-types";

// FMP 기업 실적 응답 타입
// https://site.financialmodelingprep.com/developer/docs/dashboard?tab=apiDetails
interface FmpFinancialStatement {
    date: string;
    symbol: string;
    reportedCurrency: string;
    cik: string;
    fillingDate: string;
    acceptedDate: string;
    calendarYear: string;
    period: string; // Q1, Q2, Q3, Q4, FY
    revenue: number;
    costOfRevenue: number;
    grossProfit: number;
    grossProfitRatio: number;
    researchAndDevelopmentExpenses: number;
    generalAndAdministrativeExpenses: number;
    sellingAndMarketingExpenses: number;
    sellingGeneralAndAdministrativeExpenses: number;
    otherExpenses: number;
    operatingExpenses: number;
    costAndExpenses: number;
    interestIncome: number;
    interestExpense: number;
    depreciationAndAmortization: number;
    ebitda: number;
    ebitdaratio: number;
    operatingIncome: number;
    operatingIncomeRatio: number;
    totalOtherIncomeExpensesNet: number;
    incomeBeforeTax: number;
    incomeBeforeTaxRatio: number;
    incomeTaxExpense: number;
    netIncome: number;
    netIncomeRatio: number;
    eps: number;
    epsdiluted: number;
    weightedAverageShsOut: number;
    weightedAverageShsOutDil: number;
    link: string;
    finalLink: string;
}

interface FmpConfig {
    symbol: string; // AAPL, TSLA
    period?: "quarter" | "annual"; // 기본 quarter
    accountName: keyof FmpFinancialStatement; // revenue, operatingIncome, netIncome 등
    comparisonType: "greater" | "less";
    threshold: number;
    optionMapping: Record<string, string>;
}

export class FmpOracleAdapter implements IOracleProvider {
    supports(sourceType: string): boolean {
        return sourceType === "fmp";
    }

    async fetchResult(source: SettlementSource): Promise<OracleResult | null> {
        const apiKey = process.env.FMP_API_KEY;
        if (!apiKey) {
            console.error("[FMP] FMP_API_KEY not set");
            return null;
        }

        const config = source.sourceConfig as unknown as FmpConfig;
        const { symbol, period = "quarter", accountName, comparisonType, threshold, optionMapping } = config;

        if (!symbol || !accountName || !optionMapping) {
            console.error("[FMP] Missing required config:", { symbol, accountName, optionMapping });
            return null;
        }

        try {
            // FMP Income Statement API 호출
            // https://financialmodelingprep.com/api/v3/income-statement/AAPL?period=quarter&apikey=YOUR_API_KEY
            const periodParam = period === "quarter" ? "period=quarter" : "";
            const url = `https://financialmodelingprep.com/api/v3/income-statement/${symbol}?${periodParam}&limit=1&apikey=${apiKey}`;

            const res = await fetch(url);
            if (!res.ok) {
                console.error("[FMP] API error:", res.status);
                return null;
            }

            const data = (await res.json()) as FmpFinancialStatement[];

            if (!Array.isArray(data) || data.length === 0) {
                console.log("[FMP] No financial data found for", symbol);
                return null;
            }

            const statement = data[0]; // 가장 최신 데이터
            const value = statement[accountName];

            if (typeof value !== "number") {
                console.error(`[FMP] Invalid value for ${accountName}:`, value);
                return null;
            }

            console.log(`[FMP] ${symbol} ${period} ${accountName}: ${value} (Threshold: ${threshold})`);

            let resultKey = "unknown";
            if (comparisonType === "greater") {
                resultKey = value > threshold ? "above" : "below";
            } else if (comparisonType === "less") {
                resultKey = value < threshold ? "below" : "above";
            }

            const winningOptionId = optionMapping[resultKey];

            if (!winningOptionId) {
                console.error("[FMP] No option mapped for result:", resultKey);
                return null;
            }

            return {
                winningOptionId,
                sourceData: {
                    symbol,
                    period,
                    date: statement.date,
                    fillingDate: statement.fillingDate,
                    accountName,
                    value,
                    threshold,
                    link: statement.link
                },
                confidence: 1.0,
                fetchedAt: new Date(),
            };

        } catch (err) {
            console.error("[FMP] Fetch error:", err);
            return null;
        }
    }
}
