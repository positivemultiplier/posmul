import { createClient } from "../../../lib/supabase/server";
import { FadeIn, HoverLift } from "../../../shared/ui/components/animations";
import Link from "next/link";
import { TrendingUp, Store, DollarSign } from "lucide-react";

interface PageProps {
    searchParams: Promise<{
        league?: string;
    }>;
}

export default async function PredictionInvestPage({ searchParams }: PageProps) {
    const supabase = await createClient();
    const { league: filterValue } = await searchParams;

    let query = supabase
        .schema('prediction')
        .from("prediction_games")
        .select("*")
        .eq("category", "INVEST")
        .eq("status", "ACTIVE")
        .order("created_at", { ascending: false });

    if (filterValue) {
        query = query.contains('tags', [filterValue]);
    }

    const { data: games } = await query;

    const filters = [
        { label: "전체", href: "/prediction/invest" },
        { label: "Local League", href: "/prediction/invest?league=local" },
        { label: "Major League", href: "/prediction/invest?league=major" },
        { label: "Cloud Funding", href: "/prediction/invest?league=cloud" },
    ];

    return (
        <div className="min-h-screen bg-gradient-to-b from-[#0a0a0f] via-[#1a1a2e] to-[#0a0a0f] text-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <FadeIn>
                    {/* Header */}
                    <div className="mb-12">
                        <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                            📊 투자 예측
                        </h1>
                        <p className="text-xl text-gray-400">
                            Investment 도메인의 성과를 예측하고 PMC를 획득하세요
                        </p>
                    </div>

                    {/* Info Card */}
                    <div className="mb-8 p-6 bg-gradient-to-br from-green-500/10 to-emerald-500/10 backdrop-blur-xl border border-green-500/30 rounded-2xl">
                        <h3 className="text-lg font-bold mb-3">💡 투자 예측이란?</h3>
                        <p className="text-gray-300 mb-4">
                            PosMul의 Investment 도메인(Local League, Major League, Cloud Funding)의 <br />
                            투자 성과, 수익률, 프로젝트 성공률 등을 예측하는 게임입니다.
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                            <div className="flex items-center gap-2">
                                <Store className="w-5 h-5 text-green-400" />
                                <span>Local League 성과 예측</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <TrendingUp className="w-5 h-5 text-blue-400" />
                                <span>Major League 광고 성과</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <DollarSign className="w-5 h-5 text-purple-400" />
                                <span>Cloud Funding 성공률</span>
                            </div>
                        </div>
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

                    {/* Games Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {games && games.length > 0 ? (
                            games.map((game, index) => (
                                <FadeIn key={game.slug} delay={index * 0.1}>
                                    <HoverLift>
                                        <Link href={`/prediction/event/${game.slug}`}>
                                            <div className="p-6 bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl border border-white/10 rounded-2xl hover:border-white/20 transition-all h-full">
                                                <div className="flex items-center gap-2 mb-4">
                                                    <span className="px-3 py-1 bg-green-500/20 text-green-300 text-xs rounded-full border border-green-500/30">
                                                        투자 예측
                                                    </span>
                                                    <span className="px-3 py-1 bg-blue-500/20 text-blue-300 text-xs rounded-full border border-blue-500/30">
                                                        난이도 {game.difficulty}
                                                    </span>
                                                </div>

                                                <h3 className="text-lg font-bold mb-3 line-clamp-2">{game.title}</h3>
                                                <p className="text-sm text-gray-400 mb-4 line-clamp-2">{game.description}</p>

                                                <div className="flex items-center justify-between text-sm text-gray-400">
                                                    <span>최소 {game.min_bet_amount?.toLocaleString()} PMP</span>
                                                    <span className="text-blue-400 font-semibold">참여하기 →</span>
                                                </div>
                                            </div>
                                        </Link>
                                    </HoverLift>
                                </FadeIn>
                            ))
                        ) : (
                            <div className="col-span-3 text-center py-12">
                                <p className="text-gray-400 mb-4">진행 중인 투자 예측 게임이 없습니다.</p>
                                <p className="text-sm text-gray-500">
                                    Investment 도메인의 데이터가 축적되면 예측 게임이 생성됩니다.
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Example Games */}
                    <div className="mt-12 p-6 bg-white/5 rounded-xl border border-white/10">
                        <h3 className="text-lg font-bold mb-4">📌 예시 게임</h3>
                        <div className="space-y-3 text-sm text-gray-300">
                            <div className="flex items-start gap-2">
                                <span className="text-green-400">•</span>
                                <span>"이번 달 Local League 신규 가맹점 수가 30개를 넘을까?"</span>
                            </div>
                            <div className="flex items-start gap-2">
                                <span className="text-blue-400">•</span>
                                <span>"다음 주 Major League 광고 중 가장 높은 CTR을 기록할 광고는?"</span>
                            </div>
                            <div className="flex items-start gap-2">
                                <span className="text-purple-400">•</span>
                                <span>"Cloud Funding '로컬 디자이너 프로젝트'가 목표 금액을 달성할까?"</span>
                            </div>
                        </div>
                    </div>
                </FadeIn>
            </div>
        </div>
    );
}
