import { redirect } from "next/navigation";
import { createClient } from "../../lib/supabase/server";
import EconomicBalance from "../../bounded-contexts/economy/presentation/components/EconomicBalance";
import TransactionHistory from "../../bounded-contexts/economy/presentation/components/TransactionHistory";
import { MoneyWaveDashboard } from "../../bounded-contexts/economy/presentation/components/MoneyWaveDashboard";
import MyPredictions from "../../bounded-contexts/prediction/presentation/components/MyPredictions";

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

                {/* Economic Balance Section */}
                <section className="mb-12">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                        💰 자산 현황
                    </h2>
                    <EconomicBalance userId={user.id} />
                </section>

                {/* MoneyWave Section */}
                <section className="mb-12">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                        🌊 MoneyWave
                    </h2>
                    <MoneyWaveDashboard />
                </section>

                {/* Transaction History Section */}
                <section className="mb-12">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                        📊 거래 내역
                    </h2>
                    <TransactionHistory userId={user.id} />
                </section>

                {/* My Predictions Section */}
                <section>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                        🎯 나의 예측 내역
                    </h2>
                    <MyPredictions userId={user.id} />
                </section>
            </div>
        </div>
    );
}
