"use client";

import React, { useEffect, useState } from "react";
import { Coins, TrendingUp } from "lucide-react";
import { createClient } from "../../../../lib/supabase/client";
import { User } from "@supabase/supabase-js";

interface CompactBalanceWidgetProps {
    className?: string;
}

/**
 * CompactBalanceWidget
 *
 * Row 1에 표시되는 컴팩트한 PMP/PMC 잔액 위젯.
 * 로그인한 사용자에게만 표시됩니다.
 */
export function CompactBalanceWidget({ className = "" }: CompactBalanceWidgetProps) {
    const [user, setUser] = useState<User | null>(null);
    const [pmpBalance, setPmpBalance] = useState<number>(0);
    const [pmcBalance, setPmcBalance] = useState<number>(0);
    const [loading, setLoading] = useState(true);

    const supabase = createClient();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                const currentUser = session?.user ?? null;
                setUser(currentUser);

                if (!currentUser) {
                    setLoading(false);
                    return;
                }

                // 경제 데이터 조회 - DDD: economy.pmp_pmc_accounts (Single Source of Truth)
                const { data: balanceData, error } = await supabase
                    .schema("economy")
                    .from("pmp_pmc_accounts")
                    .select("pmp_balance, pmc_balance")
                    .eq("user_id", currentUser.id)
                    .single();

                if (error) {
                    console.log("CompactBalanceWidget: No balance data found, using defaults");
                }

                setPmpBalance(balanceData?.pmp_balance ? Number(balanceData.pmp_balance) : 0);
                setPmcBalance(balanceData?.pmc_balance ? Number(balanceData.pmc_balance) : 0);
            } catch (error) {
                console.error("CompactBalanceWidget: Failed to fetch balance", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();

        // 인증 상태 변경 감지
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (_event, session) => {
                setUser(session?.user ?? null);
                if (!session?.user) {
                    setPmpBalance(0);
                    setPmcBalance(0);
                }
            }
        );

        return () => subscription.unsubscribe();
    }, []);

    // 로딩 중이거나 로그인하지 않은 경우 표시하지 않음
    if (loading || !user) {
        return null;
    }

    const formatBalance = (value: number) => {
        if (value >= 1000) {
            return `${(value / 1000).toFixed(1)}K`;
        }
        return value.toString();
    };

    return (
        <div className={`flex items-center gap-3 ${className}`}>
            {/* PMP */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-900/30 border border-indigo-700/30">
                <Coins className="w-3.5 h-3.5 text-indigo-400" />
                <span className="text-xs font-bold text-indigo-300">{formatBalance(pmpBalance)}</span>
            </div>

            {/* PMC */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-900/30 border border-emerald-700/30">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-xs font-bold text-emerald-300">{formatBalance(pmcBalance)}</span>
            </div>
        </div>
    );
}

export default CompactBalanceWidget;
