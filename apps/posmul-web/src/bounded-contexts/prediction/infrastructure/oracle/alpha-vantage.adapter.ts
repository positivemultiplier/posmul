import { IOracleProvider } from "../../domain/services/oracle/oracle.interface";
import { OracleResult, SettlementSource } from "../../domain/value-objects/settlement-types";

// Alpha Vantage API 응답 타입 (TIME_SERIES_DAILY)
interface DailyTimeSeriesResponse {
    "Meta Data": {
        "1. Information": string;
        "2. Symbol": string;
        "3. Last Refreshed": string;
        "4. Output Size": string;
        "5. Time Zone": string;
    };
    "Time Series (Daily)": Record<string, {
        "1. open": string;
        "2. high": string;
        "3. low": string;
        "4. close": string;
        "5. volume": string;
    }>;
}

interface AlphaVantageConfig {
    symbol: string; // 종목 코드 (QQQ, NVDA 등)
    comparisonType: "price_change_direction"; // 당일 등락
    optionMapping: Record<string, string>; // { "up": "A", "down": "B" }
}

export class AlphaVantageOracleAdapter implements IOracleProvider {
    supports(sourceType: string): boolean {
        return sourceType === "alpha-vantage";
    }

    async fetchResult(source: SettlementSource): Promise<OracleResult | null> {
        const apiKey = process.env.ALPHA_VANTAGE_API_KEY;
        if (!apiKey) {
            console.error("[AlphaVantage] ALPHA_VANTAGE_API_KEY not set");
            return null;
        }

        const config = source.sourceConfig as unknown as AlphaVantageConfig;
        const { symbol, comparisonType, optionMapping } = config;

        if (!symbol || !optionMapping) {
            console.error("[AlphaVantage] Missing symbol or optionMapping");
            return null;
        }

        try {
            // 주가 데이터 조회 (Daily)
            // https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=IBM&apikey=demo
            const url = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${symbol}&apikey=${apiKey}`;
            const res = await fetch(url);

            if (!res.ok) {
                console.error("[AlphaVantage] API error:", res.status);
                return null;
            }

            const data = (await res.json()) as DailyTimeSeriesResponse;
            const timeSeries = data["Time Series (Daily)"];

            if (!timeSeries) {
                console.error("[AlphaVantage] Invalid API response:", JSON.stringify(data).substring(0, 200));
                // API 한도 초과 등 에러 처리
                return null;
            }

            // 날짜별 정렬 (최신순)
            const dates = Object.keys(timeSeries).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

            if (dates.length < 2) {
                // 비교할 전일 데이터 부족
                console.error("[AlphaVantage] Not enough data points");
                return null;
            }

            const today = dates[0];
            const yesterday = dates[1];

            const todayClose = parseFloat(timeSeries[today]["4. close"]);
            const yesterdayClose = parseFloat(timeSeries[yesterday]["4. close"]);

            console.log(`[AlphaVantage] ${symbol} Price - Today(${today}): ${todayClose}, Yesterday(${yesterday}): ${yesterdayClose}`);

            // 결과 판단 (전일 대비 상승/하락/보합)
            let resultKey = "flat";
            if (todayClose > yesterdayClose) {
                resultKey = "up";
            } else if (todayClose < yesterdayClose) {
                resultKey = "down";
            }

            // 무승부가 없는 게임의 경우 보합 처리는 비즈니스 로직에 따름 (여기서는 flat 매핑이 없으면 null 반환)
            const winningOptionId = optionMapping[resultKey];

            if (!winningOptionId) {
                console.warn(`[AlphaVantage] Unmapped result key: ${resultKey} (diff: ${todayClose - yesterdayClose})`);
                return null;
            }

            return {
                winningOptionId,
                sourceData: {
                    symbol,
                    date: today,
                    close: todayClose,
                    prevDate: yesterday,
                    prevClose: yesterdayClose,
                    change: todayClose - yesterdayClose,
                    changePercent: ((todayClose - yesterdayClose) / yesterdayClose) * 100
                },
                confidence: 1.0,
                fetchedAt: new Date(),
            };

        } catch (err) {
            console.error("[AlphaVantage] Fetch error:", err);
            return null;
        }
    }
}
