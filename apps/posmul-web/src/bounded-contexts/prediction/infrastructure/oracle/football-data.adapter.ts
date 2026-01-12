import { IOracleProvider } from "../../domain/services/oracle/oracle.interface";
import { OracleResult, SettlementSource } from "../../domain/value-objects/settlement-types";

interface FootballDataMatch {
    id: number;
    status: string;
    score: {
        fullTime: {
            home: number;
            away: number;
        };
        winner: "HOME_TEAM" | "AWAY_TEAM" | "DRAW" | null;
    };
}

export class FootballDataOracleAdapter implements IOracleProvider {
    supports(sourceType: string): boolean {
        return sourceType === "football_data";
    }

    async fetchResult(source: SettlementSource): Promise<OracleResult | null> {
        const matchId = source.externalId;
        if (!matchId) {
            console.error("[FootballData] No externalId (matchId) provided");
            return null;
        }

        const apiKey = process.env.FOOTBALL_DATA_API_KEY;
        if (!apiKey) {
            console.error("[FootballData] FOOTBALL_DATA_API_KEY not set");
            return null;
        }

        try {
            const res = await fetch(`https://api.football-data.org/v4/matches/${matchId}`, {
                headers: { "X-Auth-Token": apiKey },
            });

            if (!res.ok) {
                console.error("[FootballData] API error:", res.status);
                return null;
            }

            const match: FootballDataMatch = await res.json();

            if (match.status !== "FINISHED") {
                console.log("[FootballData] Match not finished yet:", match.status);
                return null;
            }

            const optionMapping = source.sourceConfig.optionMapping as Record<string, string> | undefined;
            if (!optionMapping) {
                console.error("[FootballData] No optionMapping in sourceConfig");
                return null;
            }

            const winnerKey = match.score.winner ?? "DRAW";
            const winningOptionId = optionMapping[winnerKey];

            if (!winningOptionId) {
                console.error("[FootballData] No option mapped for:", winnerKey);
                return null;
            }

            return {
                winningOptionId,
                sourceData: {
                    matchId: match.id,
                    score: match.score,
                    status: match.status,
                },
                confidence: 1.0,
                fetchedAt: new Date(),
            };
        } catch (err) {
            console.error("[FootballData] Fetch error:", err);
            return null;
        }
    }
}
