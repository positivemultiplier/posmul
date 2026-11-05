"use client";

import React, { Suspense, useState, useEffect } from "react";
import {
  PieChart,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Search,
  Eye,
  Award,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent } from "@/shared/ui/components/base/Card";
import { DomainContextHeader } from "@/shared/ui/components/layout/DomainContextHeader";

interface BudgetItem {
  id: string;
  title: string;
  description: string;
  level: "national" | "regional" | "local";
  ministry: string;
  amount: number;
  changePercent: number;
  watcherCount: number;
  issueCount: number;
  pmpReward: number;
  isHot?: boolean;
}

const MOCK_BUDGETS: BudgetItem[] = [
  {
    id: "budget-001",
    title: "교육부 2025년 예산",
    description: "초중고 교육과정 개편 및 디지털 교육 인프라 확충 예산",
    level: "national",
    ministry: "교육부",
    amount: 89500,
    changePercent: 5.2,
    watcherCount: 3420,
    issueCount: 12,
    pmpReward: 25,
    isHot: true,
  },
  {
    id: "budget-002",
    title: "국토교통부 SOC 예산",
    description: "도로·철도·항만 등 사회간접자본 투자 예산",
    level: "national",
    ministry: "국토교통부",
    amount: 156000,
    changePercent: -2.1,
    watcherCount: 2810,
    issueCount: 8,
    pmpReward: 30,
  },
  {
    id: "budget-003",
    title: "서울시 복지예산",
    description: "기초생활보장, 노인복지, 아동보육 지원 예산",
    level: "regional",
    ministry: "서울특별시",
    amount: 12500,
    changePercent: 8.5,
    watcherCount: 1560,
    issueCount: 5,
    pmpReward: 20,
    isHot: true,
  },
  {
    id: "budget-004",
    title: "환경부 탄소중립 예산",
    description: "2050 탄소중립 달성을 위한 그린뉴딜 투자 예산",
    level: "national",
    ministry: "환경부",
    amount: 23400,
    changePercent: 15.7,
    watcherCount: 890,
    issueCount: 3,
    pmpReward: 35,
  },
];

const CATEGORIES = [
  { key: "all", label: "전체 예산" },
  { key: "national", label: "국가 예산" },
  { key: "regional", label: "지역 예산" },
  { key: "issue", label: "재정 이슈" },
];

function formatAmount(amount: number): string {
  if (amount >= 10000) return `${(amount / 10000).toFixed(1)}조`;
  return `${amount.toLocaleString()}억`;
}

function ForumBudgetContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const queryLevel = searchParams?.get("level") || "all";

  const [selectedCategory, setSelectedCategory] = useState(queryLevel);
  const [searchQuery, setSearchQuery] = useState("");
  const [totalPmpEarned] = useState(320);

  useEffect(() => {
    setSelectedCategory(queryLevel);
  }, [queryLevel]);

  const handleCategoryChange = (key: string) => {
    setSelectedCategory(key);
    if (key === "all") {
      router.push("/forum/budget");
    } else {
      router.push(`/forum/budget?level=${key}`);
    }
  };

  const filteredBudgets = MOCK_BUDGETS.filter((item) => {
    const matchCategory =
      selectedCategory === "all"
        ? true
        : selectedCategory === "issue"
        ? item.issueCount >= 5
        : item.level === selectedCategory;
    const matchSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.ministry.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchSearch;
  });

  return (
    <div className="min-h-screen bg-[#090b12] text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <DomainContextHeader
          domain="forum"
          title="💰 Budget · 시민 예산 감시"
          subtitle="관료·정치인의 예산 편성을 투명하게 감시하고 재정 이슈를 발굴하여 PMP를 획득하세요"
          metrics={[{ label: "예산 감시 보상", value: totalPmpEarned, unit: "PMP" }]}
        >
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.key}
                  onClick={() => handleCategoryChange(cat.key)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
                    selectedCategory === cat.key
                      ? "bg-emerald-500/20 text-emerald-200 border-emerald-400/40"
                      : "bg-slate-900/70 text-slate-400 border-slate-800 hover:text-slate-200"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="예산 항목 또는 부처 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/60"
              />
            </div>
          </div>
        </DomainContextHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <AnimatePresence mode="popLayout">
            {filteredBudgets.map((item) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.2 }}
              >
                <Link href={`/forum/budget/${item.level}/${item.id}`}>
                  <Card className="bg-slate-900/70 border-slate-800/90 hover:border-emerald-500/40 transition-all cursor-pointer group overflow-hidden h-full">
                    <div className="relative aspect-video bg-gradient-to-br from-teal-950/60 via-slate-900 to-slate-950 flex items-center justify-center border-b border-white/[0.04]">
                      <div className="text-center">
                        <p className="text-3xl font-black text-white">
                          {formatAmount(item.amount)}원
                        </p>
                        <p
                          className={`flex items-center justify-center gap-1 mt-1 text-xs font-semibold ${
                            item.changePercent >= 0
                              ? "text-emerald-400"
                              : "text-rose-400"
                          }`}
                        >
                          {item.changePercent >= 0 ? (
                            <TrendingUp className="w-3.5 h-3.5" />
                          ) : (
                            <TrendingDown className="w-3.5 h-3.5" />
                          )}
                          전년 대비 {item.changePercent >= 0 ? "+" : ""}
                          {item.changePercent}%
                        </p>
                      </div>
                      {item.isHot && (
                        <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded bg-emerald-500 text-slate-950 text-[10px] font-extrabold">
                          집중감시
                        </span>
                      )}
                      {item.issueCount > 0 && (
                        <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded bg-rose-500/20 border border-rose-500/40 text-rose-300 text-[10px] font-bold flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          이슈 {item.issueCount}
                        </div>
                      )}
                    </div>

                    <CardContent className="p-4 space-y-2.5">
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-300 border border-emerald-500/25 font-medium">
                          {item.level === "national" ? "국가 예산" : "지역 예산"}
                        </span>
                        <span>{item.ministry}</span>
                      </div>

                      <h3 className="font-bold text-white group-hover:text-emerald-300 transition-colors line-clamp-2">
                        {item.title}
                      </h3>

                      <p className="text-sm text-slate-400 line-clamp-2">
                        {item.description}
                      </p>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <Eye className="w-3.5 h-3.5" />
                          {item.watcherCount.toLocaleString()}명 감시 중
                        </span>
                        <span className="flex items-center gap-1 text-emerald-300 font-bold">
                          <Award className="w-3.5 h-3.5" />+{item.pmpReward} PMP
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {filteredBudgets.length === 0 && (
          <div className="text-center py-16 text-slate-500">
            <PieChart className="w-12 h-12 mx-auto mb-4 opacity-40 text-emerald-400" />
            <p>검색 조건에 일치하는 예산 항목이 없습니다.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ForumBudgetPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#090b12]" />}>
      <ForumBudgetContent />
    </Suspense>
  );
}
