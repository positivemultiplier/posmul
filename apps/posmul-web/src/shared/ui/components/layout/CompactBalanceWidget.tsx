"use client";

import React, { useEffect, useState } from "react";
import { Coins, TrendingUp } from "lucide-react";
import { createClient } from "../../../../lib/supabase/client";
import { User } from "@supabase/supabase-js";
import { CoreAssetType } from "../../tokens/domain-tones";

interface CompactBalanceWidgetProps {
  className?: string;
  activeAssetType?: CoreAssetType;
  /** 상위 레이아웃/네비게이션에서 이미 인증 확인된 사용자 (중복 getSession 방지) */
  user?: User | null;
  /** 상위 컴포넌트가 인증 상태 조회를 완료했는지 여부 */
  authResolved?: boolean;
}

/**
 * CompactBalanceWidget
 *
 * Row 1에 표시되는 컴팩트한 PMP/PMC 잔액 위젯.
 * 현재 활성 도메인의 핵심 자산(PMP vs PMC)을 톤온톤으로 강조하여
 * 시민 경제 선순환 흐름을 직관적으로 인지하게 합니다.
 */
export function CompactBalanceWidget({
  className = "",
  activeAssetType = "PMP_TO_PMC",
  user: propUser,
  authResolved = false,
}: CompactBalanceWidgetProps) {
  const [internalUser, setInternalUser] = useState<User | null>(null);
  const [pmpBalance, setPmpBalance] = useState<number>(0);
  const [pmcBalance, setPmcBalance] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();
  const resolvedUser = authResolved ? (propUser ?? null) : internalUser;

  useEffect(() => {
    const fetchAccountBalance = async (targetUser: User | null) => {
      try {
        if (!targetUser) {
          setPmpBalance(0);
          setPmcBalance(0);
          setLoading(false);
          return;
        }

        // 경제 데이터 조회 - DDD: economy.pmp_pmc_accounts (Single Source of Truth)
        const { data: balanceData } = await supabase
          .schema("economy")
          .from("pmp_pmc_accounts")
          .select("pmp_balance, pmc_balance")
          .eq("user_id", targetUser.id)
          .single();

        setPmpBalance(
          balanceData?.pmp_balance ? Number(balanceData.pmp_balance) : 0
        );
        setPmcBalance(
          balanceData?.pmc_balance ? Number(balanceData.pmc_balance) : 0
        );
      } catch (error) {
        console.error("CompactBalanceWidget: Failed to fetch balance", error);
      } finally {
        setLoading(false);
      }
    };

    if (authResolved) {
      void fetchAccountBalance(propUser ?? null);
      const handleBalanceUpdate = () => {
        void fetchAccountBalance(propUser ?? null);
      };
      window.addEventListener("balanceUpdate", handleBalanceUpdate);
      return () => {
        window.removeEventListener("balanceUpdate", handleBalanceUpdate);
      };
    }

    const fetchSessionAndBalance = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        const currentUser = session?.user ?? null;
        setInternalUser(currentUser);
        await fetchAccountBalance(currentUser);
      } catch (error) {
        console.error("CompactBalanceWidget: Failed to fetch balance", error);
        setLoading(false);
      }
    };

    void fetchSessionAndBalance();

    const handleBalanceUpdate = () => {
      void fetchSessionAndBalance();
    };

    window.addEventListener("balanceUpdate", handleBalanceUpdate);

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const nextUser = session?.user ?? null;
      setInternalUser(nextUser);
      void fetchAccountBalance(nextUser);
    });

    return () => {
      subscription.unsubscribe();
      window.removeEventListener("balanceUpdate", handleBalanceUpdate);
    };
  }, [authResolved, propUser?.id, supabase]);

  if (loading || !resolvedUser) {
    return null;
  }

  const formatBalance = (value: number) => {
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`;
    }
    return value.toString();
  };

  const highlightPmp =
    activeAssetType === "PMP" || activeAssetType === "PMP_TO_PMC";
  const highlightPmc =
    activeAssetType === "PMC" || activeAssetType === "PMP_TO_PMC";

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* PMP (무위험 참여 자산) */}
      <div
        title="PMP (무위험 시민 참여 자산 · 포럼/소비에서 획득하여 예측에 사용)"
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-all duration-300 ${
          highlightPmp
            ? "bg-emerald-950/60 border-emerald-500/40 shadow-[0_0_10px_rgba(16,185,129,0.15)]"
            : "bg-slate-900/60 border-slate-800 opacity-75"
        }`}
      >
        <Coins className="w-3.5 h-3.5 text-emerald-400" />
        <span className="text-[10px] font-medium text-emerald-400/80">PMP</span>
        <span className="text-xs font-bold text-emerald-200">
          {formatBalance(pmpBalance)}
        </span>
      </div>

      {/* PMC (사회적 가치·기부 자산) */}
      <div
        title="PMC (사회적 가치 자산 · 예측 적중/지역소비로 획득하여 기부에 직접 집행)"
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-all duration-300 ${
          highlightPmc
            ? "bg-purple-950/60 border-purple-500/40 shadow-[0_0_10px_rgba(168,85,247,0.15)]"
            : "bg-slate-900/60 border-slate-800 opacity-75"
        }`}
      >
        <TrendingUp className="w-3.5 h-3.5 text-purple-400" />
        <span className="text-[10px] font-medium text-purple-400/80">PMC</span>
        <span className="text-xs font-bold text-purple-200">
          {formatBalance(pmcBalance)}
        </span>
      </div>
    </div>
  );
}

export default CompactBalanceWidget;
