import { createClient } from "../../lib/supabase/server";
import { FadeIn } from "../../shared/ui/components/animations";
import { TrendingUp, Users, Coins, ArrowRight, Clock } from "lucide-react";
import Link from "next/link";

export default async function EconomyPage() {
    const supabase = await createClient();

    // Get global economy stats
    const { data: stats } = await supabase.rpc("get_global_economy_stats");

    // Calculate Money Wave info (mock for now)
    const nextWaveHours = 12;
    const nextWaveAmount = 10000;

    return (
        <div className="min-h-screen bg-gradient-to-b from-[#0a0a0f] via-[#1a1a2e] to-[#0a0a0f] text-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <FadeIn>
                    {/* Header */}
                    <div className="mb-12">
                        <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                            💰 경제 대시보드
                        </h1>
                        <p className="text-xl text-gray-400">
                            PosMul 경제 시스템의 실시간 흐름을 확인하세요
                        </p>
                    </div>

                    {/* MoneyWave Component */}
                    <div className="mb-12 p-8 bg-gradient-to-br from-green-500/10 to-emerald-500/10 backdrop-blur-xl border border-green-500/30 rounded-2xl">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center">
                                <TrendingUp className="w-6 h-6 text-green-400" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold">Money Wave</h2>
                                <p className="text-sm text-gray-400">EBIT 기반 PMC 분배 시스템</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* PMP Flow */}
                            <div className="p-6 bg-white/5 rounded-xl border border-white/10">
                                <div className="flex items-center justify-between mb-4">
                                    <span className="text-sm text-gray-400">총 PMP 발행</span>
                                    <Coins className="w-5 h-5 text-yellow-400" />
                                </div>
                                <p className="text-3xl font-bold text-yellow-400">
                                    {stats?.total_pmp_issued?.toLocaleString() || "1,000,000"}
                                </p>
                                <p className="text-xs text-gray-500 mt-2">사용자 보유: {stats?.total_pmp_held?.toLocaleString() || "750,000"}</p>
                            </div>

                            {/* PMC Flow */}
                            <div className="p-6 bg-white/5 rounded-xl border border-white/10">
                                <div className="flex items-center justify-between mb-4">
                                    <span className="text-sm text-gray-400">총 PMC 유통</span>
                                    <Coins className="w-5 h-5 text-purple-400" />
                                </div>
                                <p className="text-3xl font-bold text-purple-400">
                                    {stats?.total_pmc_held?.toLocaleString() || "50,000"}
                                </p>
                                <p className="text-xs text-gray-500 mt-2">예측 게임 참여: {stats?.pmp_in_predictions?.toLocaleString() || "150,000"} PMP</p>
                            </div>

                            {/* Next Wave */}
                            <div className="p-6 bg-white/5 rounded-xl border border-white/10">
                                <div className="flex items-center justify-between mb-4">
                                    <span className="text-sm text-gray-400">다음 분배</span>
                                    <Clock className="w-5 h-5 text-green-400" />
                                </div>
                                <p className="text-3xl font-bold text-green-400">
                                    {nextWaveHours}시간 후
                                </p>
                                <p className="text-xs text-gray-500 mt-2">예정 금액: {nextWaveAmount.toLocaleString()} PMC</p>
                            </div>
                        </div>

                        {/* Flow Visualization */}
                        <div className="mt-6 p-4 bg-white/5 rounded-xl">
                            <div className="flex items-center justify-between text-sm">
                                <div className="text-center flex-1">
                                    <p className="text-gray-400 mb-1">PMP 획득</p>
                                    <p className="text-lg font-bold text-yellow-400">광고 시청, 포럼 활동</p>
                                </div>
                                <ArrowRight className="w-5 h-5 text-gray-400" />
                                <div className="text-center flex-1">
                                    <p className="text-gray-400 mb-1">예측 참여</p>
                                    <p className="text-lg font-bold text-blue-400">PMP 배팅</p>
                                </div>
                                <ArrowRight className="w-5 h-5 text-gray-400" />
                                <div className="text-center flex-1">
                                    <p className="text-gray-400 mb-1">예측 성공</p>
                                    <p className="text-lg font-bold text-purple-400">PMC 획득</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Link href="/economy/wallet">
                            <div className="p-6 bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl border border-white/10 rounded-2xl hover:border-white/20 transition-all">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center">
                                        <Coins className="w-6 h-6 text-blue-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold">내 지갑</h3>
                                        <p className="text-sm text-gray-400">PMP/PMC 관리</p>
                                    </div>
                                </div>
                                <p className="text-blue-400 font-semibold">관리하기 →</p>
                            </div>
                        </Link>

                        <Link href="/prediction">
                            <div className="p-6 bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl border border-white/10 rounded-2xl hover:border-white/20 transition-all">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center">
                                        <TrendingUp className="w-6 h-6 text-purple-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold">예측 게임</h3>
                                        <p className="text-sm text-gray-400">PMP로 참여하기</p>
                                    </div>
                                </div>
                                <p className="text-purple-400 font-semibold">참여하기 →</p>
                            </div>
                        </Link>
                    </div>

                    {/* Users Stats */}
                    <div className="mt-8 p-6 bg-white/5 rounded-xl border border-white/10">
                        <div className="flex items-center gap-3 mb-4">
                            <Users className="w-6 h-6 text-blue-400" />
                            <h3 className="text-xl font-bold">사용자 참여 현황</h3>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                                <p className="text-sm text-gray-400">총 사용자</p>
                                <p className="text-2xl font-bold">{stats?.total_users?.toLocaleString() || "1,234"}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-400">활성 사용자</p>
                                <p className="text-2xl font-bold text-green-400">{stats?.active_users?.toLocaleString() || "567"}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-400">진행 중인 게임</p>
                                <p className="text-2xl font-bold text-blue-400">{stats?.active_games?.toLocaleString() || "23"}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-400">오늘 참여</p>
                                <p className="text-2xl font-bold text-purple-400">{stats?.today_participations?.toLocaleString() || "89"}</p>
                            </div>
                        </div>
                    </div>
                </FadeIn>
            </div>
        </div>
    );
}
