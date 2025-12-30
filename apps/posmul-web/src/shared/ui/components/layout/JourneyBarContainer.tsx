"use client";

import React, { useEffect, useState } from "react";
import { JourneyBar } from "./JourneyBar";
import { createClient } from "../../../../lib/supabase/client";
import { User } from "@supabase/supabase-js";

interface UserEconomicData {
    pmpBalance: number;
    pmcBalance: number;
    hasActivePredictions: boolean;
}

/**
 * JourneyBarContainer
 *
 * JourneyBar에 실제 사용자 데이터를 연결하는 컨테이너 컴포넌트.
 * 인증된 사용자의 PMP/PMC 잔액과 예측 상태를 가져옵니다.
 */
export function JourneyBarContainer() {
    const [user, setUser] = useState<User | null>(null);
    const [economicData, setEconomicData] = useState<UserEconomicData>({
        pmpBalance: 0,
        pmcBalance: 0,
        hasActivePredictions: false,
    });
    const [loading, setLoading] = useState(true);

    const supabase = createClient();

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                // 1. 사용자 인증 확인
                const { data: { session } } = await supabase.auth.getSession();
                const currentUser = session?.user ?? null;
                setUser(currentUser);

                if (!currentUser) {
                    setLoading(false);
                    return;
                }

                // 2. 경제 데이터 조회 - DDD: economy.pmp_pmc_accounts
                const { data: balanceData } = await supabase
                    .schema("economy")
                    .from("pmp_pmc_accounts")
                    .select("pmp_balance, pmc_balance")
                    .eq("user_id", currentUser.id)
                    .single();

                // 3. 활성 예측 확인
                const { data: predictions } = await supabase
                    .schema("prediction")
                    .from("predictions")
                    .select("prediction_id")
                    .eq("user_id", currentUser.id)
                    .eq("is_active", true)
                    .limit(1);

                setEconomicData({
                    pmpBalance: balanceData?.pmp_balance ? Number(balanceData.pmp_balance) : 0,
                    pmcBalance: balanceData?.pmc_balance ? Number(balanceData.pmc_balance) : 0,
                    hasActivePredictions: (predictions?.length ?? 0) > 0,
                });
            } catch (error) {
                console.error("JourneyBarContainer: Failed to fetch user data", error);
            } finally {
                setLoading(false);
            }
        };

        fetchUserData();

        // 인증 상태 변경 감지
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (_event, session) => {
                setUser(session?.user ?? null);
                if (!session?.user) {
                    setEconomicData({
                        pmpBalance: 0,
                        pmcBalance: 0,
                        hasActivePredictions: false,
                    });
                }
            }
        );

        return () => subscription.unsubscribe();
    }, []);

    // 로딩 중이거나 로그인하지 않은 경우 표시하지 않음
    if (loading || !user) {
        return null;
    }

    return (
        <JourneyBar
            pmpBalance={economicData.pmpBalance}
            pmcBalance={economicData.pmcBalance}
            hasActivePredictions={economicData.hasActivePredictions}
        />
    );
}

export default JourneyBarContainer;
