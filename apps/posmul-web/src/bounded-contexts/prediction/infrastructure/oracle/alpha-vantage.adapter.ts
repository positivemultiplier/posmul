import { IOracleProvider } from "../../domain/services/oracle/oracle.interface";
import { OracleResult, SettlementSource } from "../../domain/value-objects/settlement-types";

// Alpha Vantage API 응답 타입 (TIME_SERIES_DAILY)
interface DailyTimeSeriesResponse {
    "Meta Data"?: {
        "1. Information": string;
        "2. Symbol": string;
        "3. Last Refreshed": string;
        "4. Output Size": string;
        "5. Time Zone": string;
    };
    "Time Series (Daily)"?: Record<string, {
        "1. open": string;
        "2. high": string;
        "3. low": string;
        "4. close": string;
        "5. volume": string;
    }>;
    Note?: string;
    Information?: string;
}

interface CoinGeckoMarketChartResponse {
    prices?: Array<[number, number]>;
}

interface MultiAssetEntry {
    optionId: string;
    provider: "alpha-vantage" | "coingecko";
    symbol: string;
}

interface AlphaVantageConfig {
    symbol?: string; // 단종목 코드 (QQQ, NVDA 등)
    symbols?: string[]; // 레거시 다중 종목 리스트
    market?: "multi_asset_weekly_rank1" | string;
    assets?: MultiAssetEntry[];
    comparisonType?: "price_change_direction" | string; // 당일 등락
    optionMapping?: Record<string, string>; // { "up": "A", "down": "B" }
}

interface AssetReturnMetric {
    optionId: string;
    provider: string;
    symbol: string;
    latestPrice: number;
    basePrice: number;
    weeklyReturnPct: number;
}

const DEFAULT_MULTI_ASSETS: MultiAssetEntry[] = [
    { optionId: "qqq", provider: "alpha-vantage", symbol: "QQQ" },
    { optionId: "btc", provider: "coingecko", symbol: "bitcoin" },
    { optionId: "kospi", provider: "alpha-vantage", symbol: "EWY" },
    { optionId: "gold", provider: "alpha-vantage", symbol: "GLD" },
    { optionId: "bond", provider: "alpha-vantage", symbol: "TLT" },
];

export class AlphaVantageOracleAdapter implements IOracleProvider {
    supports(sourceType: string): boolean {
        return sourceType === "alpha-vantage";
    }

    async fetchResult(source: SettlementSource): Promise<OracleResult | null> {
        const apiKey =
            process.env.ALPHA_VANTAGE_API_KEY ||
            process.env.ALPHAVANTAGE_API_KEY;
        const config = source.sourceConfig as unknown as AlphaVantageConfig;

        if (config.market === "multi_asset_weekly_rank1") {
            return this.fetchMultiAssetWeeklyRank1(config, apiKey);
        }

        if (!apiKey) {
            console.error(
                "[AlphaVantage] ALPHA_VANTAGE_API_KEY / ALPHAVANTAGE_API_KEY not set"
            );
            return null;
        }

        return this.fetchSingleSymbolDirection(config, apiKey);
    }

    private async fetchSingleSymbolDirection(
        config: AlphaVantageConfig,
        apiKey: string
    ): Promise<OracleResult | null> {
        const { symbol, optionMapping } = config;

        if (!symbol || !optionMapping) {
            console.error("[AlphaVantage] Missing symbol or optionMapping");
            return null;
        }

        try {
            const url = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${symbol}&apikey=${apiKey}`;
            const res = await fetch(url);

            if (!res.ok) {
                console.error("[AlphaVantage] API error:", res.status);
                return null;
            }

            const data = (await res.json()) as DailyTimeSeriesResponse;
            const timeSeries = data["Time Series (Daily)"];

            if (!timeSeries) {
                console.error(
                    "[AlphaVantage] Invalid API response:",
                    JSON.stringify(data).substring(0, 200)
                );
                return null;
            }

            const dates = Object.keys(timeSeries).sort(
                (a, b) => new Date(b).getTime() - new Date(a).getTime()
            );

            if (dates.length < 2) {
                console.error("[AlphaVantage] Not enough data points");
                return null;
            }

            const today = dates[0];
            const yesterday = dates[1];
            const todayClose = parseFloat(timeSeries[today]["4. close"]);
            const yesterdayClose = parseFloat(timeSeries[yesterday]["4. close"]);

            console.log(
                `[AlphaVantage] ${symbol} Price - Today(${today}): ${todayClose}, Yesterday(${yesterday}): ${yesterdayClose}`
            );

            const resultKey = this.resolveDirectionKey(todayClose, yesterdayClose);
            const winningOptionId = optionMapping[resultKey];

            if (!winningOptionId) {
                console.warn(
                    `[AlphaVantage] Unmapped result key: ${resultKey} (diff: ${todayClose - yesterdayClose})`
                );
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
                    changePercent: ((todayClose - yesterdayClose) / yesterdayClose) * 100,
                },
                confidence: 1.0,
                fetchedAt: new Date(),
            };
        } catch (err) {
            console.error("[AlphaVantage] Fetch error:", err);
            return null;
        }
    }

    private resolveDirectionKey(todayClose: number, yesterdayClose: number): string {
        if (todayClose > yesterdayClose) return "up";
        if (todayClose < yesterdayClose) return "down";
        return "flat";
    }

    private resolveMultiAssets(config: AlphaVantageConfig): MultiAssetEntry[] {
        if (Array.isArray(config.assets) && config.assets.length > 0) {
            return config.assets;
        }
        if (Array.isArray(config.symbols) && config.symbols.length > 0) {
            return config.symbols.map((sym) => ({
                optionId: sym.toLowerCase(),
                provider: "alpha-vantage" as const,
                symbol: sym,
            }));
        }
        return DEFAULT_MULTI_ASSETS;
    }

    private async fetchMultiAssetWeeklyRank1(
        config: AlphaVantageConfig,
        apiKey: string | undefined
    ): Promise<OracleResult | null> {
        const assets = this.resolveMultiAssets(config);
        const metrics: AssetReturnMetric[] = [];
        let alphaVantageCallCount = 0;

        for (const asset of assets) {
            if (asset.provider === "alpha-vantage") {
                if (!apiKey) {
                    console.warn(`[AlphaVantage] API key missing; skipping ${asset.symbol}`);
                    continue;
                }
                if (alphaVantageCallCount > 0 && process.env.NODE_ENV !== "test") {
                    await new Promise((resolve) => setTimeout(resolve, 350));
                }
                alphaVantageCallCount += 1;
                const metric = await this.fetchAlphaVantageWeeklyReturn(asset, apiKey);
                if (metric) metrics.push(metric);
                continue;
            }

            const metric = await this.fetchCoinGeckoWeeklyReturn(asset);
            if (metric) metrics.push(metric);
        }

        if (metrics.length < 2) {
            console.error(
                `[AlphaVantage] Insufficient assets evaluated for multi_asset_weekly_rank1 (${metrics.length}/${assets.length})`
            );
            return null;
        }

        const sorted = [...metrics].sort((a, b) => b.weeklyReturnPct - a.weeklyReturnPct);
        const winner = sorted[0];
        const confidence = Math.min(1.0, metrics.length / assets.length);

        console.log(
            `[AlphaVantage] multi_asset_weekly_rank1 winner=${winner.optionId} (${winner.weeklyReturnPct.toFixed(2)}%)`
        );

        return {
            winningOptionId: winner.optionId,
            sourceData: {
                market: "multi_asset_weekly_rank1",
                winnerOptionId: winner.optionId,
                winnerReturnPct: winner.weeklyReturnPct,
                evaluatedCount: metrics.length,
                configuredCount: assets.length,
                rankings: sorted,
            },
            confidence,
            fetchedAt: new Date(),
        };
    }

    private async fetchAlphaVantageWeeklyReturn(
        asset: MultiAssetEntry,
        apiKey: string
    ): Promise<AssetReturnMetric | null> {
        try {
            const url = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${encodeURIComponent(asset.symbol)}&apikey=${apiKey}`;
            const res = await fetch(url);
            if (!res.ok) {
                console.warn(`[AlphaVantage] ${asset.symbol} HTTP ${res.status}`);
                return null;
            }
            const data = (await res.json()) as DailyTimeSeriesResponse;
            const timeSeries = data["Time Series (Daily)"];
            if (!timeSeries) {
                console.warn(`[AlphaVantage] ${asset.symbol} missing Time Series (Daily)`);
                return null;
            }

            const dates = Object.keys(timeSeries).sort(
                (a, b) => new Date(b).getTime() - new Date(a).getTime()
            );
            if (dates.length < 2) return null;

            const latestClose = parseFloat(timeSeries[dates[0]]["4. close"]);
            const baseIdx = Math.min(5, dates.length - 1);
            const baseClose = parseFloat(timeSeries[dates[baseIdx]]["4. close"]);
            if (!Number.isFinite(latestClose) || !Number.isFinite(baseClose) || baseClose <= 0) {
                return null;
            }

            return {
                optionId: asset.optionId,
                provider: asset.provider,
                symbol: asset.symbol,
                latestPrice: latestClose,
                basePrice: baseClose,
                weeklyReturnPct: ((latestClose - baseClose) / baseClose) * 100,
            };
        } catch (err) {
            console.warn(`[AlphaVantage] ${asset.symbol} fetch error:`, err);
            return null;
        }
    }

    private async fetchCoinGeckoWeeklyReturn(
        asset: MultiAssetEntry
    ): Promise<AssetReturnMetric | null> {
        try {
            const url = `https://api.coingecko.com/api/v3/coins/${encodeURIComponent(asset.symbol)}/market_chart?vs_currency=usd&days=7`;
            const res = await fetch(url);
            if (!res.ok) {
                console.warn(`[CoinGecko] ${asset.symbol} HTTP ${res.status}`);
                return null;
            }
            const data = (await res.json()) as CoinGeckoMarketChartResponse;
            const prices = data.prices;
            if (!Array.isArray(prices) || prices.length < 2) return null;

            const basePrice = Number(prices[0]?.[1]);
            const latestPrice = Number(prices[prices.length - 1]?.[1]);
            if (!Number.isFinite(latestPrice) || !Number.isFinite(basePrice) || basePrice <= 0) {
                return null;
            }

            return {
                optionId: asset.optionId,
                provider: asset.provider,
                symbol: asset.symbol,
                latestPrice,
                basePrice,
                weeklyReturnPct: ((latestPrice - basePrice) / basePrice) * 100,
            };
        } catch (err) {
            console.warn(`[CoinGecko] ${asset.symbol} fetch error:`, err);
            return null;
        }
    }
}
