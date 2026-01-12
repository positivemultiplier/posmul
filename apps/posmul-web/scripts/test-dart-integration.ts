import { DartOracleAdapter } from "../src/bounded-contexts/prediction/infrastructure/oracle/dart.adapter";
import { SettlementSource } from "../src/bounded-contexts/prediction/domain/value-objects/settlement-types";
import dotenv from "dotenv";

// .env.local 로드
dotenv.config({ path: ".env.local" });

async function testDartApi() {
    console.log("=== DART API Integration Test ===");
    console.log("DART_API_KEY:", process.env.DART_API_KEY ? "SET" : "NOT SET");

    const adapter = new DartOracleAdapter();

    // 삼성전자 (corpCode: 00126380) 테스트
    const testSource: SettlementSource = {
        id: "test-dart-integration",
        gameId: "game-001",
        sourceType: "dart",
        sourceConfig: {
            corpCode: "00126380", // 삼성전자
            bsnsYear: "2024",
            reprtCode: "11011", // 사업보고서
            accountName: "영업이익",
            comparisonType: "greater" as const,
            threshold: 1000000000000, // 1조원
            optionMapping: {
                above: "opt_above_1trillion",
                below: "opt_below_1trillion",
            },
        },
    };

    console.log("\nTest Config:", JSON.stringify(testSource.sourceConfig, null, 2));
    console.log("\nFetching DART data...");

    const result = await adapter.fetchResult(testSource);

    if (result) {
        console.log("\n✅ SUCCESS!");
        console.log("Winning Option:", result.winningOptionId);
        console.log("Confidence:", result.confidence);
        console.log("Source Data:", JSON.stringify(result.sourceData, null, 2));
        console.log("Fetched At:", result.fetchedAt);
    } else {
        console.log("\n❌ FAILED - Result is null");
        console.log("Check the DART API key and corpCode.");
    }
}

testDartApi().catch(console.error);
