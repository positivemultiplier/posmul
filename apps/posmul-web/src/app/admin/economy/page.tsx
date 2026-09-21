"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Coins, ArrowLeft, RefreshCw, Zap, TrendingUp, Award, Layers } from "lucide-react";

interface EconomyStats {
  totalBetsCount: number;
  totalBetAmount: number;
  totalRewardAmount: number;
}

export default function AdminEconomyPage() {
  const [stats, setStats] = useState<EconomyStats>({
    totalBetsCount: 0,
    totalBetAmount: 0,
    totalRewardAmount: 0,
  });
  const [loading, setLoading] = useState(false);
  const [granting, setGranting] = useState(false);

  // 라이브 통계 불러오기
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

  // 테스트 유저 포인트 지급
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
        alert("💰 테스트 유저에게 10,000 PMP 포인트가 지급되었습니다!");
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
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Navigation Top */}
        <div className="flex justify-between items-center border-b border-slate-800 pb-4">
          <Link
            href="/admin"
            className="text-xs font-semibold text-slate-400 hover:text-slate-100 transition flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> /admin 메인 포털로 돌아가기
          </Link>
          <span className="text-xs text-slate-500 font-mono">ECONOMY & POINT LEDGER ADMIN</span>
        </div>

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-300 to-amber-500 flex items-center gap-2">
              <Coins className="w-8 h-8 text-amber-400" />
              경제 & 포인트 시스템 관리자
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              PMP/PMC 포인트 유통 현황, MoneyWave 상금 풀 계산 및 유저 포인트 지급을 관리합니다.
            </p>
          </div>

          <button
            onClick={fetchStats}
            disabled={loading}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-200 rounded-xl text-xs font-semibold transition border border-slate-800 flex items-center gap-1.5 shadow-md"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-amber-400" : ""}`} />
            {loading ? "불러오는 중..." : "새로고침"}
          </button>
        </div>

        {/* Live Economy Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-2">
            <div className="flex justify-between items-center text-slate-400">
              <span className="text-xs font-semibold">누적 예측 베팅 참여 수</span>
              <Layers className="w-5 h-5 text-indigo-400" />
            </div>
            <div className="text-3xl font-black text-indigo-400">{stats.totalBetsCount.toLocaleString()}건</div>
            <p className="text-xs text-slate-500">예측 게임 유저 참여 횟수</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-2">
            <div className="flex justify-between items-center text-slate-400">
              <span className="text-xs font-semibold">총 베팅 PMP 유통량</span>
              <TrendingUp className="w-5 h-5 text-amber-400" />
            </div>
            <div className="text-3xl font-black text-amber-400">{stats.totalBetAmount.toLocaleString()} P</div>
            <p className="text-xs text-slate-500">예측에 소비된 누적 포인트</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-2">
            <div className="flex justify-between items-center text-slate-400">
              <span className="text-xs font-semibold">예상 적중 보상금 총액</span>
              <Award className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="text-3xl font-black text-emerald-400">{stats.totalRewardAmount.toLocaleString()} P</div>
            <p className="text-xs text-slate-500">정산 대상 유저 예상 배당금</p>
          </div>
        </div>

        {/* Admin Controls Panel */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          <h2 className="text-lg font-bold text-slate-200 flex items-center gap-2">
            ⚙️ 개발자 & 운영자 포인트 조작 컨트롤
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Grant PMP */}
            <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 flex flex-col justify-between space-y-4">
              <div>
                <h3 className="text-sm font-bold text-amber-300 flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-amber-400" /> 테스트 유저 PMP 포인트 지급
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  테스트용 유저 계정(`00000000-0000-0000-0000-000000000001`)에게 10,000 PMP 포인트를 즉시 지급합니다.
                </p>
              </div>
              <button
                onClick={handleGrantPmp}
                disabled={granting}
                className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 text-slate-950 font-extrabold text-xs rounded-xl transition shadow-lg shadow-amber-900/30"
              >
                {granting ? "지급 처리 중..." : "💰 10,000 PMP 지급하기"}
              </button>
            </div>

            {/* MoneyWave Recalculate */}
            <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 flex flex-col justify-between space-y-4">
              <div>
                <h3 className="text-sm font-bold text-indigo-300 flex items-center gap-1.5">
                  <Coins className="w-4 h-4 text-indigo-400" /> MoneyWave 상금 풀 수동 재계산
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  현재 활성화된 예측 게임별 시간당 PMC 상금 풀 및 기부 환원 보상액을 시뮤레이션 재계산합니다.
                </p>
              </div>
              <button
                onClick={handleCalculateMoneyWave}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs rounded-xl transition shadow-lg shadow-indigo-900/30"
              >
                🌊 MoneyWave 풀 수동 정산
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
