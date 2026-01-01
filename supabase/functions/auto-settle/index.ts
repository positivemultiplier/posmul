import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

/**
 * Auto-Settle Scheduler Edge Function
 *
 * 예정된 자동 정산을 실행하는 스케줄러
 * Cron Job으로 매 5분마다 실행 권장
 */

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SettlementSource {
    id: string;
    game_id: string;
    source_type: string;
    source_config: Record<string, unknown>;
    external_id: string | null;
    scheduled_at: string;
}

interface FootballMatch {
    id: number;
    status: string;
    score: {
        fullTime: {
            home: number;
            away: number;
        };
        winner: string | null;
    };
}

Deno.serve(async (req: Request) => {
    // CORS preflight
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const supabase = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
        );

        // 1. 예정된 정산 소스 조회
        const now = new Date().toISOString();
        const { data: sources, error: fetchError } = await supabase
            .schema("prediction")
            .from("settlement_sources")
            .select("*")
            .lte("scheduled_at", now)
            .in("source_type", ["football_data", "thesportsdb", "kosis"]);

        if (fetchError) {
            console.error("Error fetching sources:", fetchError);
            return new Response(JSON.stringify({ error: fetchError.message }), {
                status: 500,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        if (!sources || sources.length === 0) {
            console.log("No scheduled settlements found");
            return new Response(JSON.stringify({ message: "No pending settlements", processed: 0 }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        console.log(`Found ${sources.length} pending settlements`);

        const results: Array<{ gameId: string; success: boolean; error?: string }> = [];

        for (const source of sources as SettlementSource[]) {
            try {
                let result: { winningOptionId: string; sourceData: Record<string, unknown> } | null = null;

                switch (source.source_type) {
                    case "football_data":
                        result = await fetchFootballDataResult(source);
                        break;
                    case "thesportsdb":
                        result = await fetchTheSportsDbResult(source);
                        break;
                    case "kosis":
                        result = await fetchKosisResult(source);
                        break;
                }

                if (!result) {
                    console.log(`No result yet for game ${source.game_id}`);
                    results.push({ gameId: source.game_id, success: false, error: "Result not available yet" });
                    continue;
                }

                // 정산 이력 기록
                await supabase.schema("prediction").from("settlement_history").insert({
                    game_id: source.game_id,
                    winning_option_id: result.winningOptionId,
                    settlement_method: "auto",
                    source_data: result.sourceData,
                });

                // 게임 상태 업데이트
                await supabase
                    .schema("prediction")
                    .from("prediction_games")
                    .update({
                        status: "SETTLED",
                        winning_option_id: result.winningOptionId,
                        settled_at: new Date().toISOString(),
                    })
                    .eq("game_id", source.game_id);

                // 정산 소스 삭제 (처리 완료)
                await supabase.schema("prediction").from("settlement_sources").delete().eq("id", source.id);

                console.log(`Settled game ${source.game_id} with winner: ${result.winningOptionId}`);
                results.push({ gameId: source.game_id, success: true });
            } catch (err) {
                console.error(`Error processing game ${source.game_id}:`, err);
                results.push({ gameId: source.game_id, success: false, error: String(err) });
            }
        }

        return new Response(
            JSON.stringify({
                message: "Settlement processing complete",
                processed: results.filter((r) => r.success).length,
                failed: results.filter((r) => !r.success).length,
                results,
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    } catch (err) {
        console.error("Unexpected error:", err);
        return new Response(JSON.stringify({ error: String(err) }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
});

// ============================================================
// API Fetchers
// ============================================================

async function fetchFootballDataResult(
    source: SettlementSource
): Promise<{ winningOptionId: string; sourceData: Record<string, unknown> } | null> {
    const matchId = source.external_id;
    if (!matchId) return null;

    const apiKey = Deno.env.get("FOOTBALL_DATA_API_KEY");
    if (!apiKey) {
        console.error("FOOTBALL_DATA_API_KEY not set");
        return null;
    }

    const res = await fetch(`https://api.football-data.org/v4/matches/${matchId}`, {
        headers: { "X-Auth-Token": apiKey },
    });

    if (!res.ok) return null;

    const match: FootballMatch = await res.json();
    if (match.status !== "FINISHED") return null;

    const optionMapping = source.source_config.optionMapping as Record<string, string> | undefined;
    if (!optionMapping) return null;

    const winnerKey = match.score.winner ?? "DRAW";
    const winningOptionId = optionMapping[winnerKey];
    if (!winningOptionId) return null;

    return { winningOptionId, sourceData: { matchId: match.id, score: match.score } };
}

async function fetchTheSportsDbResult(
    source: SettlementSource
): Promise<{ winningOptionId: string; sourceData: Record<string, unknown> } | null> {
    const eventId = source.external_id;
    if (!eventId) return null;

    const res = await fetch(`https://www.thesportsdb.com/api/v1/json/3/lookupevent.php?id=${eventId}`);
    if (!res.ok) return null;

    const data = await res.json();
    const event = data?.events?.[0];
    if (!event || event.strStatus !== "Match Finished") return null;

    const homeScore = parseInt(event.intHomeScore ?? "0", 10);
    const awayScore = parseInt(event.intAwayScore ?? "0", 10);

    const optionMapping = source.source_config.optionMapping as Record<string, string> | undefined;
    if (!optionMapping) return null;

    let winnerKey = "DRAW";
    if (homeScore > awayScore) winnerKey = "HOME_TEAM";
    else if (awayScore > homeScore) winnerKey = "AWAY_TEAM";

    const winningOptionId = optionMapping[winnerKey];
    if (!winningOptionId) return null;

    return { winningOptionId, sourceData: { eventId, homeScore, awayScore } };
}

async function fetchKosisResult(
    source: SettlementSource
): Promise<{ winningOptionId: string; sourceData: Record<string, unknown> } | null> {
    const apiKey = Deno.env.get("KOSIS_API_KEY");
    if (!apiKey) return null;

    const config = source.source_config as {
        indicatorCode?: string;
        comparisonType?: "greater" | "less";
        threshold?: number;
        optionMapping?: Record<string, string>;
    };

    if (!config.indicatorCode || !config.optionMapping) return null;

    // KOSIS API 호출 (실제 스펙에 맞게 수정 필요)
    const url = `https://kosis.kr/openapi/Param/statisticsParameterData.do?method=getList&apiKey=${apiKey}&itmId=${config.indicatorCode}&format=json`;
    const res = await fetch(url);
    if (!res.ok) return null;

    const data = await res.json();
    const latestValue = parseFloat(data?.item?.[0]?.DT ?? "0");

    let resultKey = "unknown";
    if (config.comparisonType === "greater" && config.threshold !== undefined) {
        resultKey = latestValue > config.threshold ? "above" : "below";
    } else if (config.comparisonType === "less" && config.threshold !== undefined) {
        resultKey = latestValue < config.threshold ? "below" : "above";
    }

    const winningOptionId = config.optionMapping[resultKey];
    if (!winningOptionId) return null;

    return { winningOptionId, sourceData: { indicatorCode: config.indicatorCode, value: latestValue } };
}
