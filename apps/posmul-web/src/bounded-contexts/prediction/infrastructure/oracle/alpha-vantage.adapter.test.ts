import { AlphaVantageOracleAdapter } from "./alpha-vantage.adapter";

global.fetch = jest.fn();

describe("AlphaVantageOracleAdapter", () => {
    let adapter: AlphaVantageOracleAdapter;
    const originalEnv = process.env;

    beforeEach(() => {
        adapter = new AlphaVantageOracleAdapter();
        process.env = {
            ...originalEnv,
            NODE_ENV: "test",
            ALPHA_VANTAGE_API_KEY: "test-av-key",
        };
        delete process.env.ALPHAVANTAGE_API_KEY;
        (global.fetch as jest.Mock).mockReset();
    });

    afterAll(() => {
        process.env = originalEnv;
    });

    it("supports 'alpha-vantage' source type", () => {
        expect(adapter.supports("alpha-vantage")).toBe(true);
        expect(adapter.supports("kosis")).toBe(false);
    });

    it("resolves single stock daily direction using ALPHAVANTAGE_API_KEY fallback", async () => {
        delete process.env.ALPHA_VANTAGE_API_KEY;
        process.env.ALPHAVANTAGE_API_KEY = "fallback-av-key";

        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                "Time Series (Daily)": {
                    "2026-11-12": { "4. close": "510.00" },
                    "2026-11-11": { "4. close": "500.00" },
                },
            }),
        });

        const source: any = {
            id: "src-single",
            sourceType: "alpha-vantage",
            sourceConfig: {
                symbol: "QQQ",
                comparisonType: "price_change_direction",
                optionMapping: { up: "opt-up", down: "opt-down" },
            },
        };

        const result = await adapter.fetchResult(source);
        expect(result).not.toBeNull();
        expect(result?.winningOptionId).toBe("opt-up");
        expect(result?.sourceData.changePercent).toBeCloseTo(2.0, 4);
    });

    it("evaluates multi_asset_weekly_rank1 across Alpha Vantage and CoinGecko assets", async () => {
        (global.fetch as jest.Mock).mockImplementation(async (url: string) => {
            if (url.includes("symbol=QQQ")) {
                return {
                    ok: true,
                    json: async () => ({
                        "Time Series (Daily)": {
                            "2026-11-12": { "4. close": "515.0" },
                            "2026-11-05": { "4. close": "500.0" }, // +3.0%
                        },
                    }),
                };
            }
            if (url.includes("coins/bitcoin/market_chart")) {
                return {
                    ok: true,
                    json: async () => ({
                        prices: [
                            [1700000000000, 80000],
                            [1700500000000, 88000], // +10.0% (1등)
                        ],
                    }),
                };
            }
            if (url.includes("symbol=EWY")) {
                return {
                    ok: true,
                    json: async () => ({
                        "Time Series (Daily)": {
                            "2026-11-12": { "4. close": "61.0" },
                            "2026-11-05": { "4. close": "60.0" }, // +1.67%
                        },
                    }),
                };
            }
            if (url.includes("symbol=GLD")) {
                return {
                    ok: true,
                    json: async () => ({
                        "Time Series (Daily)": {
                            "2026-11-12": { "4. close": "245.0" },
                            "2026-11-05": { "4. close": "250.0" }, // -2.0%
                        },
                    }),
                };
            }
            if (url.includes("symbol=TLT")) {
                return {
                    ok: true,
                    json: async () => ({
                        "Time Series (Daily)": {
                            "2026-11-12": { "4. close": "90.0" },
                            "2026-11-05": { "4. close": "92.0" }, // -2.17%
                        },
                    }),
                };
            }
            return { ok: false, status: 404 };
        });

        const source: any = {
            id: "3d6a7a45-2239-4926-8105-914d75cd770f",
            sourceType: "alpha-vantage",
            sourceConfig: {
                market: "multi_asset_weekly_rank1",
                assets: [
                    { optionId: "qqq", provider: "alpha-vantage", symbol: "QQQ" },
                    { optionId: "btc", provider: "coingecko", symbol: "bitcoin" },
                    { optionId: "kospi", provider: "alpha-vantage", symbol: "EWY" },
                    { optionId: "gold", provider: "alpha-vantage", symbol: "GLD" },
                    { optionId: "bond", provider: "alpha-vantage", symbol: "TLT" },
                ],
            },
        };

        const result = await adapter.fetchResult(source);
        expect(result).not.toBeNull();
        expect(result?.winningOptionId).toBe("btc");
        expect(result?.confidence).toBe(1.0);
        expect((result?.sourceData.rankings as Array<{ optionId: string }>)[0].optionId).toBe("btc");
    });

    it("tolerates partial asset failures if at least 2 assets succeed", async () => {
        delete process.env.ALPHA_VANTAGE_API_KEY;
        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                prices: [
                    [1700000000000, 100],
                    [1700500000000, 105],
                ],
            }),
        });

        const source: any = {
            id: "partial",
            sourceType: "alpha-vantage",
            sourceConfig: {
                market: "multi_asset_weekly_rank1",
                assets: [
                    { optionId: "qqq", provider: "alpha-vantage", symbol: "QQQ" },
                    { optionId: "btc", provider: "coingecko", symbol: "bitcoin" },
                ],
            },
        };

        // 1개(btc)만 성공하고 qqq는 API 키 미설정으로 스킵되면 < 2이므로 null
        const insufficient = await adapter.fetchResult(source);
        expect(insufficient).toBeNull();
    });
});

