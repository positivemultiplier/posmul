"use client";

import React, { useEffect, useState } from "react";
import {
  Wallet,
  TrendingUp,
  Coins,
  ArrowUpRight,
  ArrowDownLeft,
  RefreshCw,
  Clock,
  Filter,
  ShieldCheck,
  CreditCard,
  History,
  Sparkles,
} from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Card, CardContent } from "@/shared/ui/components/base/Card";

interface Transaction {
  id: string;
  type: "prediction" | "donation" | "consume" | "reward";
  title: string;
  amount: number;
  currency: "PMP" | "PMC" | "PMG";
  status: "completed" | "pending" | "failed";
  createdAt: string;
}

export default function WalletPage() {
  const [assets, setAssets] = useState({ pmp: 0, pmc: 0, pmg: 0 });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>("all");

  const fetchWalletData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/wallet/transactions");
      const data = await res.json();
      if (data.success) {
        setAssets(data.assets);
        setTransactions(data.transactions);
      }
    } catch (err) {
      console.error("Failed to load wallet data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWalletData();
  }, []);

  const filteredTransactions = transactions.filter((tx) => {
    if (filterType === "all") return true;
    return tx.type === filterType;
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-purple-950/40 to-slate-950 text-slate-100">
      {/* Header */}
      <header className="sticky top-0 z-10 backdrop-blur-xl bg-slate-950/80 border-b border-purple-900/40">
        <div className="max-w-5xl mx-auto p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 shadow-lg text-white">
              <Wallet className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-300 via-pink-300 to-indigo-300">
                PosMul Wallet
              </h1>
              <p className="text-xs text-purple-300/70">통합 자산 및 분배 거래 원장</p>
            </div>
          </div>
          <button
            onClick={fetchWalletData}
            disabled={loading}
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-purple-600/50 text-slate-300 hover:text-white transition-all flex items-center gap-2 text-xs"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> 새로고침
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        {/* Assets Cards Grid */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* PMP Card */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
          >
            <Card className="bg-gradient-to-br from-yellow-950/30 to-slate-900 border-yellow-800/40 relative overflow-hidden group hover:border-yellow-600/60 transition-all">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Coins className="w-24 h-24 text-yellow-400" />
              </div>
              <CardContent className="p-6 space-y-4 relative z-10">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
                    활동 포인트
                  </span>
                  <Sparkles className="w-4 h-4 text-yellow-400" />
                </div>
                <div>
                  <p className="text-xs text-slate-400">PMP Balance</p>
                  <p className="text-3xl font-black text-yellow-300 mt-1">
                    {assets.pmp.toLocaleString()} <span className="text-sm font-normal text-yellow-400/80">PMP</span>
                  </p>
                </div>
                <div className="pt-2 flex items-center justify-between text-xs text-slate-400 border-t border-slate-800/80">
                  <span>예측 게임 배팅 가능</span>
                  <Link href="/prediction" className="text-yellow-400 hover:underline flex items-center gap-1 font-medium">
                    게임 참여 <ArrowUpRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* PMC Card */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="bg-gradient-to-br from-purple-950/30 to-slate-900 border-purple-800/40 relative overflow-hidden group hover:border-purple-600/60 transition-all">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <TrendingUp className="w-24 h-24 text-purple-400" />
              </div>
              <CardContent className="p-6 space-y-4 relative z-10">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">
                    가치 화폐
                  </span>
                  <CreditCard className="w-4 h-4 text-purple-400" />
                </div>
                <div>
                  <p className="text-xs text-slate-400">PMC Balance</p>
                  <p className="text-3xl font-black text-purple-300 mt-1">
                    {assets.pmc.toLocaleString()} <span className="text-sm font-normal text-purple-400/80">PMC</span>
                  </p>
                </div>
                <div className="pt-2 flex items-center justify-between text-xs text-slate-400 border-t border-slate-800/80">
                  <span>기부 & 지역 소비 환원</span>
                  <Link href="/donation" className="text-purple-400 hover:underline flex items-center gap-1 font-medium">
                    기부하기 <ArrowUpRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* PMG Card */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <Card className="bg-gradient-to-br from-indigo-950/30 to-slate-900 border-indigo-800/40 relative overflow-hidden group hover:border-indigo-600/60 transition-all">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <ShieldCheck className="w-24 h-24 text-indigo-400" />
              </div>
              <CardContent className="p-6 space-y-4 relative z-10">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    거버넌스 의결권
                  </span>
                  <ShieldCheck className="w-4 h-4 text-indigo-400" />
                </div>
                <div>
                  <p className="text-xs text-slate-400">PMG Power</p>
                  <p className="text-3xl font-black text-indigo-300 mt-1">
                    {assets.pmg.toLocaleString()} <span className="text-sm font-normal text-indigo-400/80">PMG</span>
                  </p>
                </div>
                <div className="pt-2 flex items-center justify-between text-xs text-slate-400 border-t border-slate-800/80">
                  <span>아고라 의안 표결권</span>
                  <Link href="/forum/agora" className="text-indigo-400 hover:underline flex items-center gap-1 font-medium">
                    투표 참여 <ArrowUpRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </section>

        {/* Action Quick Bar */}
        <section className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <History className="w-5 h-5 text-purple-400" />
            <div>
              <p className="text-sm font-bold text-white">원장 통합 가시화 (Ledger Trace)</p>
              <p className="text-xs text-slate-400">모든 배팅, 기부, 시청 적립 트랜잭션이 블록체인 및 Supabase DB 원장에 안전하게 산출됩니다.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/prediction"
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs transition-colors shadow"
            >
              게임 배팅
            </Link>
            <Link
              href="/donation"
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-purple-300 font-semibold text-xs transition-colors border border-purple-800/40"
            >
              기부 참여
            </Link>
          </div>
        </section>

        {/* Ledger Transactions Section */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-purple-400" />
              통합 거래 원장 내역
            </h2>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              <Filter className="w-4 h-4 text-slate-500 mr-1" />
              {[
                { key: "all", label: "전체" },
                { key: "prediction", label: "🎲 예측 배팅" },
                { key: "donation", label: "🌱 기부" },
                { key: "consume", label: "🎬 소비/광고" },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setFilterType(tab.key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                    filterType === tab.key
                      ? "bg-purple-600 text-white shadow"
                      : "bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Transactions List */}
          {loading ? (
            <div className="py-12 text-center text-slate-500 text-sm">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-purple-400" />
              거래 내역을 불러오는 중입니다...
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-sm bg-slate-900/30 rounded-2xl border border-slate-800">
              해당 유형의 거래 내역이 존재하지 않습니다.
            </div>
          ) : (
            <div className="space-y-2.5">
              {filteredTransactions.map((tx) => {
                const isPositive = tx.amount > 0;
                return (
                  <div
                    key={tx.id}
                    className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 hover:border-purple-800/40 transition-all flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3.5">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                          isPositive
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                        }`}
                      >
                        {isPositive ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                      </div>
                      <div>
                        <p className="font-semibold text-white text-sm">{tx.title}</p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {new Date(tx.createdAt).toLocaleString("ko-KR")}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p
                        className={`font-bold text-sm ${
                          isPositive ? "text-emerald-400" : "text-slate-200"
                        }`}
                      >
                        {isPositive ? `+${tx.amount.toLocaleString()}` : tx.amount.toLocaleString()}{" "}
                        <span className="text-xs text-slate-400 font-normal">{tx.currency}</span>
                      </p>
                      <span className="inline-block mt-0.5 px-2 py-0.5 text-[10px] font-medium rounded-full bg-slate-800 text-emerald-400 border border-emerald-800/30">
                        {tx.status}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
