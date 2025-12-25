import { CompactMoneyWaveCard } from "../../../bounded-contexts/prediction/presentation/components/CompactMoneyWaveCard";
import { createClient } from "../../../lib/supabase/server";
import { FadeIn, HoverLift } from "../../../shared/ui/components/animations";
import Link from "next/link";
import { ClientPredictionGamesGrid } from "../components/ClientPredictionGamesGrid";
import {
    mapPredictionGameRowToCardModel,
    type PredictionGameRow,
} from "../components/prediction-game-mapper";

export default async function PredictionPoliticsPage() {
    const supabase = await createClient();

    const query = supabase
        .schema('prediction')
        .from("prediction_games")
        .select("*")
        .eq("category", "POLITICS")
        .eq("status", "ACTIVE")
        .order("created_at", { ascending: false });

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

    const { data: games, error } = await query;
    if (error) {
        console.error("PredictionPoliticsPage Supabase error", error.message);
    }

    const mappedGames = ((games || []) as PredictionGameRow[]).map(mapPredictionGameRowToCardModel);

    const subcategories = [
        { label: "국가 선거", href: "/prediction/politics/national-elections" },
        { label: "지역 선거", href: "/prediction/politics/local-elections" },
        { label: "정책 변화", href: "/prediction/politics/policy-changes" },
    ];

    return (
        <div className="min-h-screen bg-gradient-to-b from-[#0a0a0f] via-[#1a1a2e] to-[#0a0a0f] text-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <FadeIn>
                    <div className="mb-8">
                        <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                            🗳️ 정치/선거 예측
                        </h1>
                        <p className="text-xl text-gray-400">
                            선거 결과, 정책 변화를 예측하고 PMC를 획득하세요
                        </p>
                    </div>

                    {/* MoneyWave Card (Level 1) */}
                    <div className="mb-12">
                        <CompactMoneyWaveCard depthLevel={2} category="politics" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
                        {subcategories.map((item) => (
                            <HoverLift key={item.label}>
                                <Link
                                    href={item.href}
                                    className="block rounded-2xl border border-white/10 bg-white/5 p-6 hover:bg-white/10 transition-colors"
                                >
                                    <div className="text-lg font-semibold mb-1">{item.label}</div>
                                    <div className="text-sm text-gray-300">카테고리로 이동</div>
                                </Link>
                            </HoverLift>
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
