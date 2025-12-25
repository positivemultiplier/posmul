import { createClient } from "@supabase/supabase-js";
import { Card } from "../../../../shared/ui";

export default async function EconomicBalance({ userId }: { userId: string }) {
    // Service Role 클라이언트 생성 (RLS 우회 - 서버 컴포넌트에서만 사용)
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { persistSession: false } }
    );
    
    // DDD: economy.pmp_pmc_accounts에서 잔액 조회 (Single Source of Truth)
    const { data: account, error } = await supabase
        .schema('economy')
        .from('pmp_pmc_accounts')
        .select('pmp_balance, pmc_balance')
        .eq('user_id', userId)
        .single();
    
    if (error) {
        void error;
    }

    const pmpBalance = account?.pmp_balance ? Number(account.pmp_balance) : 0;
    const pmcBalance = account?.pmc_balance ? Number(account.pmc_balance) : 0;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* PMP Wallet */}
            <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 dark:from-blue-900/20 dark:to-blue-800/20 dark:border-blue-800">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100">
                        PMP 지갑
                    </h3>
                    <span className="px-3 py-1 text-xs font-medium text-blue-700 bg-blue-200 rounded-full dark:bg-blue-800 dark:text-blue-200">
                        위험 프리 자산
                    </span>
                </div>
                <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold text-blue-700 dark:text-blue-300">
                        {pmpBalance.toLocaleString()}
                    </span>
                    <span className="text-sm text-blue-600 dark:text-blue-400">PMP</span>
                </div>
                <p className="mt-4 text-sm text-blue-600/80 dark:text-blue-400/80">
                    예측 게임 참여와 커뮤니티 활동으로 획득할 수 있습니다.
                </p>
            </Card>

            {/* PMC Wallet */}
            <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100 border-green-200 dark:from-green-900/20 dark:to-green-800/20 dark:border-green-800">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-green-900 dark:text-green-100">
                        PMC 지갑
                    </h3>
                    <span className="px-3 py-1 text-xs font-medium text-green-700 bg-green-200 rounded-full dark:bg-green-800 dark:text-green-200">
                        위험 자산
                    </span>
                </div>
                <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold text-green-700 dark:text-green-300">
                        {pmcBalance.toLocaleString()}
                    </span>
                    <span className="text-sm text-green-600 dark:text-green-400">PMC</span>
                </div>
                <p className="mt-4 text-sm text-green-600/80 dark:text-green-400/80">
                    투자 수익과 예측 성공 보상으로 획득할 수 있습니다.
                </p>
            </Card>
        </div>
    );
}
