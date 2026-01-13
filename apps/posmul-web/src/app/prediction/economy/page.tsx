import { createClient } from "../../../lib/supabase/server";
import { FadeIn } from "../../../shared/ui/components/animations";
import Link from "next/link";
import { CompactMoneyWaveCard } from "../../../bounded-contexts/prediction/presentation/components/CompactMoneyWaveCard";
import { ClientPredictionGamesGrid } from "../components/ClientPredictionGamesGrid";
import { getAggregatedPrizePool } from "../../../bounded-contexts/prediction/application/prediction-pool.service";
import {
    attachHourlyGamePoolsToRows,
    mapPredictionGameRowToCardModel,
    type PredictionGameRow,
} from "../components/prediction-game-mapper";

interface PageProps {
    searchParams: Promise<{
        subcategory?: string;
    }>;
}

interface UserPrediction {
    prediction_id: string;
    game_id: string;
    bet_amount: number | null;
    is_active: boolean;
    prediction_data: Record<string, unknown> | null;
}

const SUBCATEGORY_WHITELIST = [
    "stocks",
    "earnings",
    "indicators",
    "crypto",
] as const;

const normalizeSubcategory = (subcategory?: string) => {
    if (!subcategory) return undefined;
    return SUBCATEGORY_WHITELIST.includes(subcategory as (typeof SUBCATEGORY_WHITELIST)[number])
        ? subcategory
        : undefined;
};

export default async function PredictionEconomyPage({
    searchParams,
}: PageProps) {
    const supabase = await createClient();
    const resolvedSearchParams = await searchParams;
    const safeSubcategory = normalizeSubcategory(resolvedSearchParams?.subcategory);

    // 현재 사용자 확인
    const { data: { user } } = await supabase.auth.getUser();

    // Get active economy pool
    const economyPool = await getAggregatedPrizePool(supabase, 'ECONOMY', safeSubcategory || undefined);

    let query = supabase
        .schema("prediction")
        .from("prediction_games")
        .select("*")
        .eq("category", "ECONOMY")
        .in("status", ["ACTIVE", "DRAFT"])
        .order("created_at", { ascending: false })
        .limit(12);

    if (safeSubcategory) {
        query = query.eq("subcategory", safeSubcategory);
    }

    const { data, error } = await query;
    if (error) {
        // eslint-disable-next-line no-console
        console.error("PredictionEconomyPage Supabase error", error.message);
    }
    const games = (data ?? []) as PredictionGameRow[];

    const gamesWithPools = await attachHourlyGamePoolsToRows(supabase, games);

    // 사용자의 예측 목록 조회
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

    const visibleGames = gamesWithPools;

    const filters = [
        { label: "전체", value: undefined, icon: "📋" },
        { label: "주식", value: "stocks", icon: "📈" },
        { label: "기업 실적", value: "earnings", icon: "💰" },
        { label: "경제 지표", value: "indicators", icon: "📊" },
        { label: "암호화폐", value: "crypto", icon: "₿" },
    ];

    return (
        <div className="min-h-screen bg-gradient-to-b from-[#0a0a0f] via-[#1a1a2e] to-[#0a0a0f] text-white">
            <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
                <FadeIn>
                    <div className="mb-12">
                        <h1 className="mb-4 text-5xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                            📈 경제 예측
                        </h1>
                        <p className="text-xl text-gray-400">
                            주식, 기업 실적, 경제 지표, 암호화폐를 예측하고 PMC를 획득하세요
                        </p>
                    </div>

                    {/* MoneyWave 상금풀 현황 (Depth 2: 경제 카테고리) */}
                    <div className="mb-8">
                        <CompactMoneyWaveCard
                            depthLevel={2}
                            category="economy"
                            initialPool={economyPool}
                        />
                    </div>

                    {/* 필터 버튼 */}
                    <div className="mb-8 flex flex-wrap gap-3">
                        {filters.map((filter) => (
                            <Link
                                key={filter.label}
                                href={
                                    filter.value
                                        ? `/prediction/economy/${filter.value}`
                                        : "/prediction/economy"
                                }
                                className={`px-4 py-2 rounded-lg border transition-all flex items-center gap-2 ${safeSubcategory === filter.value
                                    ? "bg-green-600 border-green-500 text-white"
                                    : "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20 text-gray-400"
                                    }`}
                            >
                                <span>{filter.icon}</span>
                                <span>{filter.label}</span>
                            </Link>
                        ))}
                    </div>

                    {/* 데이터 소스 안내 */}
                    <div className="mb-8 p-4 bg-white/5 rounded-xl border border-white/10">
                        <div className="flex items-center gap-4 text-sm text-gray-400">
                            <span className="font-medium text-white">📡 데이터 소스:</span>
                            <span className="flex items-center gap-1">
                                <span className="w-2 h-2 bg-green-500 rounded-full" /> Alpha Vantage
                            </span>
                            <span className="flex items-center gap-1">
                                <span className="w-2 h-2 bg-green-500 rounded-full" /> FMP
                            </span>
                            <span className="flex items-center gap-1">
                                <span className="w-2 h-2 bg-green-500 rounded-full" /> KOSIS
                            </span>
                            <span className="flex items-center gap-1">
                                <span className="w-2 h-2 bg-green-500 rounded-full" /> DART
                            </span>
                        </div>
                    </div>

                    {/* 게임 그리드 */}
                    {visibleGames.length > 0 ? (
                        <ClientPredictionGamesGrid
                            games={visibleGames.map(mapPredictionGameRowToCardModel)}
                            userId={user?.id}
                            userPredictions={userPredictions}
                            basePath={safeSubcategory ? `/prediction/economy/${safeSubcategory}` : '/prediction/economy/stocks'}
                        />
                    ) : (
                        <div className="text-center py-16">
                            <div className="text-6xl mb-4">📈</div>
                            <h3 className="text-2xl font-bold text-white mb-2">경제 예측 게임 준비 중</h3>
                            <p className="text-gray-400 mb-6">
                                곧 주식, 기업 실적, 경제 지표 예측 게임이 추가됩니다.
                            </p>
                            <Link
                                href="/prediction/sports"
                                className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                            >
                                스포츠 예측 보러가기 →
                            </Link>
                        </div>
                    )}
                </FadeIn>
            </div>
        </div>
    );
}
