import { DartOracleAdapter } from "./dart.adapter";

// Mock fetch
global.fetch = jest.fn();

describe("DartOracleAdapter", () => {
    let adapter: DartOracleAdapter;

    beforeEach(() => {
        adapter = new DartOracleAdapter();
        process.env.DART_API_KEY = "test-api-key";
        (global.fetch as jest.Mock).mockClear();
    });

    it("supports 'dart' source type", () => {
        expect(adapter.supports("dart")).toBe(true);
        expect(adapter.supports("kosis")).toBe(false);
    });

    it("fetches and parses DART financial data correctly", async () => {
        const mockResponse = {
            status: "000",
            message: "정상",
            list: [
                {
                    account_nm: "매출액",
                    thstrm_amount: "10,000,000",
                },
                {
                    account_nm: "영업이익",
                    thstrm_amount: "5,000,000",
                },
            ],
        };

        (global.fetch as jest.Mock).mockResolvedValue({
            ok: true,
            json: async () => mockResponse,
        });

        const source: any = {
            id: "test-source",
            sourceType: "dart",
            sourceConfig: {
                corpCode: "00123456",
                bsnsYear: "2023",
                reprtCode: "11011",
                accountName: "영업이익",
                comparisonType: "greater",
                threshold: 4000000,
                optionMapping: {
                    above: "opt_above",
                    below: "opt_below",
                },
            },
        };

        const result = await adapter.fetchResult(source);

        if (!result) {
            throw new Error("Result is null!");
        }

        if (result.winningOptionId !== "opt_above") {
            throw new Error(`WinningOptionId mismatch! Expected: opt_above, Got: ${result.winningOptionId}, SourceData: ${JSON.stringify(result.sourceData)}`);
        }
    });

    it("handles API errors gracefully", async () => {
        (global.fetch as jest.Mock).mockResolvedValue({
            ok: false,
            status: 500,
        });

        const source: any = {
            id: "test-fail",
            sourceType: "dart",
            sourceConfig: {
                corpCode: "00123456",
                bsnsYear: "2023",
                reprtCode: "11011",
                accountName: "영업이익",
                comparisonType: "greater",
                threshold: 4000000,
                optionMapping: { above: "opt_a", below: "opt_b" },
            },
        };

        const result = await adapter.fetchResult(source);
        expect(result).toBeNull();
    });

    it("returns null if account name is not found", async () => {
        const mockResponse = {
            status: "000",
            message: "정상",
            list: [
                { account_nm: "매출액", thstrm_amount: "100" }
            ],
        };

        (global.fetch as jest.Mock).mockResolvedValue({
            ok: true,
            json: async () => mockResponse,
        });

        const source: any = {
            id: "test-not-found",
            sourceType: "dart",
            sourceConfig: {
                corpCode: "00123456",
                bsnsYear: "2023",
                reprtCode: "11011",
                accountName: "없는계정", // Not in mock response
                comparisonType: "greater",
                threshold: 10,
                optionMapping: { above: "opt_a", below: "opt_b" },
            },
        };

        const result = await adapter.fetchResult(source);
        expect(result).toBeNull();
    });
});
