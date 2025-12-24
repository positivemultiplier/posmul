import { CompactMoneyWaveCard } from "../../../bounded-contexts/prediction/presentation/components/CompactMoneyWaveCard";
import { createClient } from "../../../lib/supabase/server";
import { FadeIn, HoverLift } from "../../../shared/ui/components/animations";
import Link from "next/link";
import { ClientPredictionGamesGrid } from "../components/ClientPredictionGamesGrid";
import { PredictionType, GameStatus } from "../../../bounded-contexts/prediction/domain/value-objects/prediction-types";

interface PageProps {
    searchParams: Promise<{
        type?: string;
    }>;
}

export default async function PredictionEntertainmentPage({ searchParams }: PageProps) {
    const supabase = await createClient();
    const { type: filterValue } = await searchParams;

    let query = supabase
        .schema('prediction')
        .from("prediction_games")
        .select("*")
        .eq("category", "ENTERTAINMENT")
        .eq("status", "ACTIVE")
        .order("created_at", { ascending: false });

    if (filterValue) {
        query = query.contains('tags', [filterValue]);
    }

    // 유저 정보 가져오기 (내 베팅 정보 표시용)
    const { data: { user } } = await supabase.auth.getUser();

    let userPredictions: any[] = [];
    if (user) {
        const { data: predictions } = await supabase
            .schema('prediction')
            .from('predictions')
            .select('prediction_id, game_id, bet_amount, is_active, prediction_data')
            .eq('user_id', user.id)
            .eq('is_active', true);
        userPredictions = predictions || [];
    }

    const { data: games } = await query;

    // DB 데이터를 도메인 모델(PredictionGame)로 매핑
    const mappedGames = games?.map((game: any) => {
        const gameOptions = game.metadata?.options || [
            { id: '1', text: '예', currentOdds: 0.5 },
            { id: '2', text: '아니오', currentOdds: 0.5 }
        ];

        return {
            id: game.id,
            slug: game.slug || game.id,
            title: game.title,
            description: game.description,
            predictionType: game.prediction_type?.toUpperCase() || PredictionType.BINARY,
            options: gameOptions,
            startTime: game.start_time,
            endTime: game.end_time,
            settlementTime: game.settlement_time,
            minimumStake: game.minimum_stake || 100,
            maximumStake: game.maximum_stake || 10000,
            maxParticipants: game.max_participants,
            currentParticipants: game.total_participants_count || 0,
            status: game.status || GameStatus.ACTIVE,
            totalStake: game.total_stake_amount || 0,
            gameImportanceScore: game.game_importance_score || 1.0,
            allocatedPrizePool: game.allocated_prize_pool || 0,
            createdAt: game.created_at,
        };
    }) || [];

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
