import { createClient } from "../../../lib/supabase/server";
import { FadeIn, HoverLift } from "../../../shared/ui/components/animations";
import Link from "next/link";

interface PageProps {
    searchParams: Promise<{
        level?: string;
        type?: string;
    }>;
}

export default async function PredictionPoliticsPage({ searchParams }: PageProps) {
    const supabase = await createClient();
    const resolvedParams = await searchParams;
    const filterValue = resolvedParams.level || resolvedParams.type;

    let query = supabase
        .schema('prediction')
        .from("prediction_games")
        .select("*")
        .eq("category", "POLITICS")
        .eq("status", "ACTIVE")
        .order("created_at", { ascending: false });

    if (filterValue) {
        query = query.contains('tags', [filterValue]);
    }

    const { data: games, error } = await query;
    if (error) {
        console.error("PredictionPoliticsPage Supabase error", error.message);
    }
    const normalizedGames = games ?? [];

    const filters = [
        { label: "전체", href: "/prediction/politics" },
        { label: "국가 선거", href: "/prediction/politics?level=national" },
        { label: "지역 선거", href: "/prediction/politics?level=local" },
        { label: "정책 변화", href: "/prediction/politics?type=policy" },
    ];

    return (
        <div className="min-h-screen bg-gradient-to-b from-[#0a0a0f] via-[#1a1a2e] to-[#0a0a0f] text-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <FadeIn>
                    <div className="mb-12">
                        <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                            🗳️ 정치/선거 예측
                        </h1>
                        <p className="text-xl text-gray-400">
                            선거 결과, 정책 변화를 예측하고 PMC를 획득하세요
                        </p>
                    </div>

                    {/* Filter Tabs */}
                    <div className="flex gap-4 mb-8">
                        {filters.map((filter) => (
                            <Link
                                key={filter.label}
                                href={filter.href}
                                className={`px-4 py-2 rounded-lg border transition-all ${(resolvedParams.level === filter.href.split('=')[1] || resolvedParams.type === filter.href.split('=')[1] || (!resolvedParams.level && !resolvedParams.type && filter.label === "전체"))
                                    ? "bg-blue-600 border-blue-500 text-white"
                                    : "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20 text-gray-400"
                                    }`}
                            >
                                {filter.label}
                            </Link>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {normalizedGames.length > 0 ? (
                            normalizedGames.map((game, index) => (
                                <FadeIn key={game.slug} delay={index * 0.1}>
                                    <HoverLift>
                                        <Link href={`/prediction/event/${game.slug}`}>
                                            <div className="p-6 bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl border border-white/10 rounded-2xl hover:border-white/20 transition-all h-full">
                                                <h3 className="text-lg font-bold mb-3">{game.title}</h3>
                                                <p className="text-sm text-gray-400 mb-4">{game.description}</p>
                                                <span className="text-blue-400 font-semibold">참여하기 →</span>
                                            </div>
                                        </Link>
                                    </HoverLift>
                                </FadeIn>
                            ))
                        ) : (
                            <div className="col-span-3 text-center py-12">
                                <p className="text-gray-400">진행 중인 정치 예측 게임이 없습니다.</p>
                            </div>
                        )}
                    </div>
                </FadeIn>
            </div>
        </div>
    );
}
