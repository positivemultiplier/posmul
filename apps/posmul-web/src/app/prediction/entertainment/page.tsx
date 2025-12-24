import { CompactMoneyWaveCard } from "../../../bounded-contexts/prediction/presentation/components/CompactMoneyWaveCard";
import { createClient } from "../../../lib/supabase/server";
import { FadeIn, HoverLift } from "../../../shared/ui/components/animations";
import Link from "next/link";
import { ClientPredictionGamesGrid } from "../components/ClientPredictionGamesGrid";
import {
    mapPredictionGameRowToCardModel,
    type PredictionGameRow,
} from "../components/prediction-game-mapper";

interface PageProps {
    searchParams: Promise<{
        type?: string;
    }>;
}

export default async function PredictionEntertainmentPage({ searchParams }: PageProps) {
    const supabase = await createClient();
    const { type: filterValue } = await searchParams;

    const subcategoryFilter = (() => {
        switch (filterValue) {
            case "movie":
                return "movies";
            case "drama":
                return "dramas";
            case "music":
                return "music";
            case "awards":
                return "awards";
            default:
                return undefined;
        }
    })();

    let query = supabase
        .schema('prediction')
        .from("prediction_games")
        .select("*")
        .eq("category", "ENTERTAINMENT")
        .eq("status", "ACTIVE")
        .order("created_at", { ascending: false });

    if (subcategoryFilter) {
        query = query.eq("subcategory", subcategoryFilter);
    }

    // 유저 정보 가져오기 (내 베팅 정보 표시용)
    const { data: { user } } = await supabase.auth.getUser();

    interface UserPrediction {
        prediction_id: string;
        game_id: string;
        bet_amount: number | null;
        is_active: boolean;
        prediction_data: Record<string, unknown> | null;
    }

    let userPredictions: UserPrediction[] = [];
    if (user) {
        const { data: predictions } = await supabase
            .schema('prediction')
            .from('predictions')
            .select('prediction_id, game_id, bet_amount, is_active, prediction_data')
            .eq('user_id', user.id)
            .eq('is_active', true);
        userPredictions = (predictions || []) as UserPrediction[];
    }

    const { data: games } = await query;

    const mappedGames = ((games || []) as PredictionGameRow[]).map(mapPredictionGameRowToCardModel);

    const filters = [
        { label: "전체", href: "/prediction/entertainment" },
        { label: "영화", href: "/prediction/entertainment?type=movie" },
        { label: "드라마", href: "/prediction/entertainment?type=drama" },
        { label: "음악", href: "/prediction/entertainment?type=music" },
        { label: "시상식", href: "/prediction/entertainment?type=awards" },
    ];

    return (
        <div className="min-h-screen bg-gradient-to-b from-[#0a0a0f] via-[#1a1a2e] to-[#0a0a0f] text-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <FadeIn>
                    <div className="mb-8">
                        <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                            🎬 엔터테인먼트 예측
                        </h1>
                        <p className="text-xl text-gray-400">
                            영화, 드라마, 음악, 시상식 결과를 예측하고 PMC를 획득하세요
                        </p>
                    </div>

                    {/* MoneyWave Card (Level 1) */}
                    <div className="mb-12">
                        <CompactMoneyWaveCard depthLevel={2} category="entertainment" />
                    </div>

                    {/* Filter Tabs */}
                    <div className="flex gap-4 mb-8">
                        {filters.map((filter) => (
                            <Link
                                key={filter.label}
                                href={filter.href}
                                className={`px-4 py-2 rounded-lg border transition-all ${(filterValue === filter.href.split('=')[1] || (!filterValue && filter.label === "전체"))
                                    ? "bg-blue-600 border-blue-500 text-white"
                                    : "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20 text-gray-400"
                                    }`}
                            >
                                {filter.label}
                            </Link>
                        ))}
                    </div>

                    <ClientPredictionGamesGrid
                        games={mappedGames}
                        userId={user?.id}
                        userPredictions={userPredictions}
                    />
                </FadeIn>
            </div>
        </div>
    );
}
