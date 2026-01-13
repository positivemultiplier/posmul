import { createClient } from "../../../../lib/supabase/server";
import { FadeIn, HoverLift } from "../../../../shared/ui/components/animations";
import { CompactMoneyWaveCard } from "../../../../bounded-contexts/prediction/presentation/components/CompactMoneyWaveCard";
import { ClientPredictionGamesGrid } from "../../components/ClientPredictionGamesGrid";
import Link from "next/link";
import { getAggregatedPrizePool } from "../../../../bounded-contexts/prediction/application/prediction-pool.service";
import {
    attachHourlyGamePoolsToRows,
    mapPredictionGameRowToCardModel,
    type PredictionGameRow,
} from "../../components/prediction-game-mapper";

interface PageProps {
    searchParams: Promise<{
        sort?: string;
        source?: string;
    }>;
}

interface UserPrediction {
    prediction_id: string;
    game_id: string;
    bet_amount: number | null;
    is_active: boolean;
    prediction_data: Record<string, unknown> | null;
}

type CardModel = ReturnType<typeof mapPredictionGameRowToCardModel>;

const applySort = <Q extends { order: (column: string, options: { ascending: boolean }) => Q }>(
    query: Q,
    sort: string
): Q => {
    if (sort === "closing_soon") {
        return query.order("registration_end", { ascending: true });
    }
    return query.order("created_at", { ascending: false });
};

const sortMappedGamesIfNeeded = (
    sort: string,
    mappedGames: CardModel[]
) => {
    if (sort !== "prize_pool") return mappedGames;
    return [...mappedGames].sort(
        (a, b) => b.allocatedPrizePool - a.allocatedPrizePool
    );
};

export default async function StocksPage({ searchParams }: PageProps) {
    const supabase = await createClient();
    const resolvedSearchParams = await searchParams;
    const sort = resolvedSearchParams?.sort || "latest";
    const source = resolvedSearchParams?.source;

    const { data: { user } } = await supabase.auth.getUser();

    const stocksPool = await getAggregatedPrizePool(supabase, "ECONOMY", "stocks");

    let query = supabase
        .schema("prediction")
        .from("prediction_games")
        .select("*")
        .eq("category", "ECONOMY")
        .eq("subcategory", "stocks")
        .in("status", ["ACTIVE", "DRAFT"]);

    query = applySort(query, sort);
    query = query.limit(20);

    const { data, error } = await query;
    if (error) {
        console.error("StocksPage Supabase error", error.message);
    }
    const games = (data ?? []) as PredictionGameRow[];

    let userPredictions: UserPrediction[] = [];
    if (user && games.length > 0) {
        const gameIds = games.map(g => g.game_id);
        const { data: predictions } = await supabase
            .schema("prediction")
            .from("predictions")
            .select("prediction_id, game_id, bet_amount, is_active, prediction_data")
            .eq("user_id", user.id)
            .eq("is_active", true)
            .in("game_id", gameIds);

        userPredictions = predictions || [];
    }

    const gamesWithPools = await attachHourlyGamePoolsToRows(supabase, games);

    const mappedGames = sortMappedGamesIfNeeded(
        sort,
        gamesWithPools.map(mapPredictionGameRowToCardModel)
    );

    const sources = [
        { label: "전체", value: undefined },
        { label: "🇺🇸 나스닥", value: "nasdaq" },
        { label: "🇰🇷 코스피", value: "kospi" },
        { label: "🌐 글로벌", value: "global" },
    ];

    return (
        <div className="min-h-screen bg-slate-950 text-white pb-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {/* Header */}
                <div className="text-center mb-12">
                    <FadeIn>
                        <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent mb-6">
                            📈 주식 예측
                        </h1>
                        <p className="text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
                            코스피, 나스닥, 개별 종목의 일일 등락을 예측하세요.
                            <br />
                            Alpha Vantage 실시간 데이터로 자동 정산됩니다.
                        </p>
                    </FadeIn>
                </div>

                {/* MoneyWave Card */}
                <div className="mb-12">
                    <HoverLift>
                        <CompactMoneyWaveCard
                            depthLevel={3}
                            category="economy"
                            subcategory="stocks"
                            initialPool={stocksPool}
                        />
                    </HoverLift>
                </div>

                {/* 데이터 소스 배지 */}
                <div className="mb-8 flex items-center gap-4">
                    <span className="text-sm text-gray-400">데이터 소스:</span>
                    <span className="px-3 py-1 bg-blue-500/20 text-blue-300 text-sm rounded-full border border-blue-500/30">
                        Alpha Vantage
                    </span>
                    <span className="px-3 py-1 bg-green-500/20 text-green-300 text-sm rounded-full border border-green-500/30">
                        실시간
                    </span>
                </div>

                {/* Filter & Sort */}
                <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
                    <div className="flex gap-2">
                        {sources.map((s) => (
                            <Link
                                key={s.label}
                                href={s.value ? `?source=${s.value}` : "/prediction/economy/stocks"}
                                className={`px-3 py-1 rounded-full text-sm border transition-all ${source === s.value
                                        ? "bg-green-500/20 text-green-300 border-green-500/30"
                                        : "bg-slate-800/50 text-slate-400 border-slate-700 hover:border-slate-600"
                                    }`}
                            >
                                {s.label}
                            </Link>
                        ))}
                    </div>

                    <div className="flex bg-slate-900/50 p-1 rounded-lg border border-slate-800">
                        <Link
                            href="?sort=latest"
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${sort === 'latest'
                                ? 'bg-slate-800 text-white shadow-sm'
                                : 'text-slate-400 hover:text-slate-200'
                                }`}
                        >
                            최신순
                        </Link>
                        <Link
                            href="?sort=prize_pool"
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${sort === 'prize_pool'
                                ? 'bg-slate-800 text-white shadow-sm'
                                : 'text-slate-400 hover:text-slate-200'
                                }`}
                        >
                            상금 높은순 💰
                        </Link>
                        <Link
                            href="?sort=closing_soon"
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${sort === 'closing_soon'
                                ? 'bg-slate-800 text-white shadow-sm'
                                : 'text-slate-400 hover:text-slate-200'
                                }`}
                        >
                            마감 임박 ⏰
                        </Link>
                    </div>
                </div>

                {/* Games Grid */}
                {mappedGames.length > 0 ? (
                    <ClientPredictionGamesGrid
                        games={mappedGames}
                        userId={user?.id}
                        userPredictions={userPredictions}
                        basePath="/prediction/economy/stocks"
                    />
                ) : (
                    <div className="text-center py-16 bg-slate-900/50 rounded-2xl border border-slate-800">
                        <div className="text-6xl mb-4">📈</div>
                        <h3 className="text-2xl font-bold text-white mb-2">주식 예측 게임 준비 중</h3>
                        <p className="text-gray-400 mb-6">
                            곧 코스피, 나스닥, 개별 종목 예측 게임이 추가됩니다.
                        </p>
                        <Link
                            href="/prediction/sports/soccer"
                            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                        >
                            축구 예측 보러가기 →
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
