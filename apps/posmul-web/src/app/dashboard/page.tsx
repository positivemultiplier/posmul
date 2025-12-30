import { redirect } from "next/navigation";
import { createClient } from "../../lib/supabase/server";
import EconomicBalance from "../../bounded-contexts/economy/presentation/components/EconomicBalance";
import TransactionHistory from "../../bounded-contexts/economy/presentation/components/TransactionHistory";
import { MoneyWaveDashboard } from "../../bounded-contexts/economy/presentation/components/MoneyWaveDashboard";
import MyPredictions from "../../bounded-contexts/prediction/presentation/components/MyPredictions";
import { DonationActivityPanel } from "../../bounded-contexts/donation/presentation/components/DonationActivityPanel";

export default async function DashboardPage() {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/auth/login");
    }

    const displayName = user.user_metadata?.display_name || user.email?.split('@')[0] || '사용자';

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-950 text-slate-200">
            {/* Header - Forum 스타일 */}
            <header className="sticky top-0 z-10 backdrop-blur-xl bg-slate-900/80 border-b border-slate-800/50">
                <div className="max-w-7xl mx-auto p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
                                📊 내 대시보드
                            </h1>
                            <p className="text-sm text-slate-400">
                                안녕하세요, <span className="text-white font-medium">{displayName}</span>님!
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-xs text-slate-500">오늘의 활동</p>
                            <p className="text-xl font-bold text-blue-400">
                                확인하기
                            </p>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 py-6 space-y-8">
                {/* Top Section: Balance */}
                <section>
                    <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        💰 자산 현황
                    </h2>
                    <EconomicBalance userId={user.id} />
                </section>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Left Column (8/12): MoneyWave & Predictions */}
                    <div className="lg:col-span-8 space-y-8">
                        <section>
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                    🌊 MoneyWave
                                </h2>
                            </div>
                            <MoneyWaveDashboard />
                        </section>

                        <section>
                            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                🎯 나의 예측 내역
                            </h2>
                            <MyPredictions userId={user.id} />
                        </section>
                    </div>

                    {/* Right Column (4/12): Donation & Side Widgets */}
                    <div className="lg:col-span-4 space-y-8">
                        <section>
                            <DonationActivityPanel userId={user.id} />
                        </section>
                    </div>
                </div>

                {/* Bottom Section: History */}
                <section>
                    <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        📜 거래 내역
                    </h2>
                    <TransactionHistory userId={user.id} />
                </section>
            </main>
        </div>
    );
}
