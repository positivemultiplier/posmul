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

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                        내 대시보드
                    </h1>
                    <p className="mt-2 text-gray-600 dark:text-gray-400">
                        안녕하세요, {user.user_metadata?.display_name || user.email}님!
                        오늘의 경제 활동을 확인하세요.
                    </p>
                </div>

                {/* Top Section: Balance */}
                <section className="mb-8">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        💰 자산 현황
                    </h2>
                    <EconomicBalance userId={user.id} />
                </section>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-8">
                    {/* Left Column (8/12): MoneyWave & Predictions */}
                    <div className="lg:col-span-8 space-y-8">
                        <section>
                            {/* MoneyWave has its own header style, so we remove the outer header or keep it minimal */}
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                                    🌊 MoneyWave
                                </h2>
                            </div>
                            <MoneyWaveDashboard />
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                                🎯 나의 예측 내역
                            </h2>
                            <MyPredictions userId={user.id} />
                        </section>
                    </div>

                    {/* Right Column (4/12): Donation & Side Widgets */}
                    <div className="lg:col-span-4 space-y-8">
                        <section>
                            {/* Donation Panel handles its own header visual, but we can add a section title if needed. 
                                Since it has a banner, let's omit the text header to avoid duplication/clutter. */}
                            <DonationActivityPanel userId={user.id} />
                        </section>
                    </div>
                </div>

                {/* Bottom Section: History */}
                <section className="mb-12">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                        📊 거래 내역
                    </h2>
                    <TransactionHistory userId={user.id} />
                </section>
            </div>
        </div>
    );
}
