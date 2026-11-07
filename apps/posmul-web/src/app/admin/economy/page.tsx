"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Coins,
  ArrowLeft,
  RefreshCw,
  Zap,
  TrendingUp,
  Award,
  Layers,
  ShieldCheck,
  AlertTriangle,
  Lock,
  History,
} from "lucide-react";
import {
  AdminBadge,
  AdminButton,
  AdminCard,
  AdminCardHeader,
  AdminCardTitle,
  AdminCardDescription,
  AdminCardContent,
  AdminTable,
  AdminTableHeader,
  AdminTableBody,
  AdminTableRow,
  AdminTableHead,
  AdminTableCell,
} from "../components/shadcn-admin-ui";

interface AuditAccountItem {
  user_id: string;
  username: string | null;
  display_name: string | null;
  pmp_balance: number;
  pmc_balance: number;
  ledger_pmp_sum: number;
  ledger_pmc_sum: number;
  transaction_count: number;
  anomaly_suspected: boolean;
  last_tx_at: string | null;
}

interface RecentTxItem {
  transaction_id: string;
  user_id: string;
  transaction_type: string;
  pmp_amount: number | null;
  pmc_amount: number | null;
  description: string;
  created_at: string;
}

interface EconomyStats {
  totalBetsCount: number;
  totalBetAmount: number;
  totalRewardAmount: number;
  accountsAudited?: number;
  anomaliesCount?: number;
  anomalies?: AuditAccountItem[];
  totalCirculatingPmp?: number;
  totalCirculatingPmc?: number;
  recentTxs?: RecentTxItem[];
}

export default function AdminEconomyPage() {
  const [stats, setStats] = useState<EconomyStats>({
    totalBetsCount: 0,
    totalBetAmount: 0,
    totalRewardAmount: 0,
    accountsAudited: 0,
    anomaliesCount: 0,
    anomalies: [],
    totalCirculatingPmp: 0,
    totalCirculatingPmc: 0,
    recentTxs: [],
  });
  const [loading, setLoading] = useState(false);
  const [granting, setGranting] = useState(false);

  // 라이브 통계 및 원장 감사 데이터 불러오기
  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/economy");
      const data = await res.json();
      if (data.success && data.stats) {
        setStats(data.stats);
      }
    } catch (e: any) {
      alert(`Error fetching stats: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  // 테스트 유저 포인트 지급 (원장 트랜잭션 기록)
  const handleGrantPmp = async () => {
    setGranting(true);
    try {
      const res = await fetch("/api/admin/economy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "grant-pmp",
          amount: 10000,
        }),
      });

      const data = await res.json();
      if (data.success) {
        alert("💰 원장(Ledger)에 공식 기록 후 10,000 PMP가 안전하게 지급되었습니다!");
        fetchStats();
      } else {
        alert(`지급 실패: ${data.error}`);
      }
    } catch (e: any) {
      alert(`Error granting PMP: ${e.message}`);
    } finally {
      setGranting(false);
    }
  };

  // MoneyWave 계산 트리거
  const handleCalculateMoneyWave = async () => {
    try {
      const res = await fetch("/api/admin/economy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "calculate-moneywave",
        }),
      });

      const data = await res.json();
      if (data.success) {
        alert(`🌊 MoneyWave 풀 계산 수행: ${data.message}`);
        fetchStats();
      }
    } catch (e: any) {
      alert(`Error calculating MoneyWave: ${e.message}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800/80 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Coins className="w-6 h-6 text-amber-400" />
            <h1 className="text-xl sm:text-2xl font-black text-white">
              경제 & 포인트 원장 감사 콘솔
            </h1>
            <AdminBadge variant="success">
              <Lock className="w-3 h-3 mr-1" /> RLS 위조 원천 차단
            </AdminBadge>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            PMP/PMC 유통 통계, 복식부기 원장 감사(Audit Trail), 이상 계정 조작 탐지 및 MoneyWave 풀을 관리합니다.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/admin">
            <AdminButton variant="outline" size="sm">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>메인 포털</span>
            </AdminButton>
          </Link>
          <AdminButton variant="secondary" size="sm" onClick={fetchStats} disabled={loading}>
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-amber-400" : ""}`} />
            <span>새로고침</span>
          </AdminButton>
        </div>
      </div>

      {/* 🛡️ 1. 원장 무결성 및 해킹 탐지 감사 카드 (Security & Audit Card) */}
      <AdminCard className="border-emerald-500/30 bg-gradient-to-br from-emerald-950/20 via-zinc-950 to-zinc-900">
        <AdminCardHeader className="border-b border-zinc-800/80">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <AdminCardTitle className="text-base text-white">
                  🛡️ PMP/PMC 원장 무결성 및 불법 조작 탐지 시스템 (Live Ledger Audit)
                </AdminCardTitle>
                <AdminCardDescription>
                  일반 유저의 DB 직접 수정 권한(RLS)을 전면 차단하고, 모든 거래를 `economy.pmp_pmc_transactions` 불변 원장에 원자적으로 기록합니다.
                </AdminCardDescription>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {(stats.anomaliesCount || 0) === 0 ? (
                <AdminBadge variant="success">
                  <ShieldCheck className="w-3.5 h-3.5 mr-1" />
                  해킹/위조 의심 0건 (무결성 100%)
                </AdminBadge>
              ) : (
                <AdminBadge variant="destructive">
                  <AlertTriangle className="w-3.5 h-3.5 mr-1" />
                  비정상 계정 {stats.anomaliesCount}건 감지
                </AdminBadge>
              )}
            </div>
          </div>
        </AdminCardHeader>

        <AdminCardContent className="pt-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800/80">
              <span className="text-xs text-zinc-400">감사 대상 주권시민 계정</span>
              <p className="text-2xl font-black text-white mt-1">
                {(stats.accountsAudited || 0).toLocaleString()}개
              </p>
              <span className="text-[11px] text-emerald-400">전수 검증 완료</span>
            </div>

            <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800/80">
              <span className="text-xs text-zinc-400">현재 총 유통 PMP (포인트)</span>
              <p className="text-2xl font-black text-amber-300 mt-1">
                {(stats.totalCirculatingPmp || 0).toLocaleString()} P
              </p>
              <span className="text-[11px] text-zinc-400">예측 마켓 배팅 가능 자산</span>
            </div>

            <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800/80">
              <span className="text-xs text-zinc-400">현재 총 유통 PMC (가치 화폐)</span>
              <p className="text-2xl font-black text-emerald-300 mt-1">
                {(stats.totalCirculatingPmc || 0).toLocaleString()} PMC
              </p>
              <span className="text-[11px] text-zinc-400">기부 및 실물 환원 자산</span>
            </div>

            <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800/80">
              <span className="text-xs text-zinc-400">해킹·어뷰징 방어 보안 상태</span>
              <p className="text-xl font-bold text-emerald-400 mt-1 flex items-center gap-1.5">
                <Lock className="w-4 h-4" /> SECURE
              </p>
              <span className="text-[11px] text-zinc-400">클라이언트 직접 UPDATE 봉쇄</span>
            </div>
          </div>
        </AdminCardContent>
      </AdminCard>

      {/* 2. 기존 예측 마켓 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <AdminCard>
          <AdminCardHeader className="pb-2">
            <div className="flex justify-between items-center text-zinc-400">
              <span className="text-xs font-semibold">누적 예측 베팅 참여 수</span>
              <Layers className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-2xl font-black text-white mt-1">
              {stats.totalBetsCount.toLocaleString()}건
            </div>
          </AdminCardHeader>
          <AdminCardContent className="pt-0">
            <p className="text-xs text-zinc-500">예측 게임 시민 참여 횟수</p>
          </AdminCardContent>
        </AdminCard>

        <AdminCard>
          <AdminCardHeader className="pb-2">
            <div className="flex justify-between items-center text-zinc-400">
              <span className="text-xs font-semibold">총 베팅 PMP 유통량</span>
              <TrendingUp className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-black text-amber-300 mt-1">
              {stats.totalBetAmount.toLocaleString()} P
            </div>
          </AdminCardHeader>
          <AdminCardContent className="pt-0">
            <p className="text-xs text-zinc-500">예측에 소비된 누적 포인트</p>
          </AdminCardContent>
        </AdminCard>

        <AdminCard>
          <AdminCardHeader className="pb-2">
            <div className="flex justify-between items-center text-zinc-400">
              <span className="text-xs font-semibold">예상 적중 보상금 총액</span>
              <Award className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-black text-emerald-300 mt-1">
              {stats.totalRewardAmount.toLocaleString()} PMC
            </div>
          </AdminCardHeader>
          <AdminCardContent className="pt-0">
            <p className="text-xs text-zinc-500">오라클 검증 정산 대상 예상 배당금</p>
          </AdminCardContent>
        </AdminCard>
      </div>

      {/* 3. 최근 실시간 원장 트랜잭션 (Live Immutable Ledger) */}
      <AdminCard>
        <AdminCardHeader className="border-b border-zinc-800/80">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-purple-400" />
            <AdminCardTitle className="text-base">
              📜 최근 불변 원장 기록 (Live Immutable Ledger Trace)
            </AdminCardTitle>
          </div>
          <AdminCardDescription>
            모든 획득, 배팅, 환불, 기부 내역이 타임스탬프 및 메타데이터와 함께 영구 보존됩니다.
          </AdminCardDescription>
        </AdminCardHeader>

        <AdminCardContent className="pt-4">
          <AdminTable>
            <AdminTableHeader>
              <AdminTableRow>
                <AdminTableHead>트랜잭션 ID</AdminTableHead>
                <AdminTableHead>유형</AdminTableHead>
                <AdminTableHead>내용</AdminTableHead>
                <AdminTableHead>PMP 변동</AdminTableHead>
                <AdminTableHead>PMC 변동</AdminTableHead>
                <AdminTableHead>기록 시각</AdminTableHead>
              </AdminTableRow>
            </AdminTableHeader>
            <AdminTableBody>
              {(stats.recentTxs || []).map((tx) => (
                <AdminTableRow key={tx.transaction_id}>
                  <AdminTableCell className="font-mono text-zinc-400">
                    {tx.transaction_id.substring(0, 8)}...
                  </AdminTableCell>
                  <AdminTableCell>
                    <AdminBadge
                      variant={
                        tx.transaction_type.includes("EARN") || tx.transaction_type.includes("GRANT")
                          ? "success"
                          : tx.transaction_type.includes("REFUND")
                          ? "info"
                          : "warning"
                      }
                    >
                      {tx.transaction_type}
                    </AdminBadge>
                  </AdminTableCell>
                  <AdminTableCell className="font-semibold text-zinc-200">
                    {tx.description}
                  </AdminTableCell>
                  <AdminTableCell className="font-mono font-bold">
                    {tx.pmp_amount !== null ? (
                      <span className={tx.pmp_amount > 0 ? "text-emerald-400" : "text-amber-400"}>
                        {tx.pmp_amount > 0 ? `+${tx.pmp_amount.toLocaleString()}` : tx.pmp_amount.toLocaleString()} P
                      </span>
                    ) : (
                      "-"
                    )}
                  </AdminTableCell>
                  <AdminTableCell className="font-mono font-bold">
                    {tx.pmc_amount !== null ? (
                      <span className={tx.pmc_amount > 0 ? "text-emerald-400" : "text-rose-400"}>
                        {tx.pmc_amount > 0 ? `+${tx.pmc_amount.toLocaleString()}` : tx.pmc_amount.toLocaleString()} PMC
                      </span>
                    ) : (
                      "-"
                    )}
                  </AdminTableCell>
                  <AdminTableCell className="text-xs text-zinc-400">
                    {new Date(tx.created_at).toLocaleString("ko-KR")}
                  </AdminTableCell>
                </AdminTableRow>
              ))}
            </AdminTableBody>
          </AdminTable>
        </AdminCardContent>
      </AdminCard>

      {/* 4. 관리자 컨트롤 패널 */}
      <AdminCard>
        <AdminCardHeader className="border-b border-zinc-800/80">
          <AdminCardTitle className="text-base">
            ⚙️ 안전한 관리자 테스트 & MoneyWave 풀 트리거
          </AdminCardTitle>
          <AdminCardDescription>
            관리자 지급 시에도 `execute_ledger_transaction`을 호출하여 원장에 `ADMIN_PMP_GRANT` 기록이 정확히 남습니다.
          </AdminCardDescription>
        </AdminCardHeader>

        <AdminCardContent className="pt-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-zinc-950 p-5 rounded-xl border border-zinc-800/80 flex flex-col justify-between space-y-4">
              <div>
                <h3 className="text-sm font-bold text-amber-300 flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-amber-400" /> 테스트 유저 PMP 포인트 지급 (원장 연동)
                </h3>
                <p className="text-xs text-zinc-400 mt-1">
                  테스트용 유저 계정(`00000000-0000-0000-0000-000000000001`)에게 10,000 PMP를 원장에 공식 기록하고 지급합니다.
                </p>
              </div>
              <AdminButton
                variant="amber"
                size="default"
                disabled={granting}
                onClick={handleGrantPmp}
                className="w-full"
              >
                {granting ? "원장 기록 및 지급 중..." : "💰 10,000 PMP 원장 지급하기"}
              </AdminButton>
            </div>

            <div className="bg-zinc-950 p-5 rounded-xl border border-zinc-800/80 flex flex-col justify-between space-y-4">
              <div>
                <h3 className="text-sm font-bold text-indigo-300 flex items-center gap-1.5">
                  <Coins className="w-4 h-4 text-indigo-400" /> MoneyWave 상금 풀 수동 재계산
                </h3>
                <p className="text-xs text-zinc-400 mt-1">
                  현재 활성화된 예측 게임별 시간당 PMC 상금 풀 및 기부 환원 보상액을 시뮬레이션 재계산합니다.
                </p>
              </div>
              <AdminButton
                variant="primary"
                size="default"
                onClick={handleCalculateMoneyWave}
                className="w-full"
              >
                🌊 MoneyWave 풀 수동 정산
              </AdminButton>
            </div>
          </div>
        </AdminCardContent>
      </AdminCard>
    </div>
  );
}
