"use client";

import { Suspense, useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Gift, Users, Search, Package } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/shared/ui/components/base/Card";
import { DomainContextHeader } from "@/shared/ui/components/layout/DomainContextHeader";

interface FundingProject {
  id: string;
  title: string;
  description: string;
  category: string;
  categoryLabel: string;
  categoryIcon: string;
  target_beneficiary: string;
  product_name: string;
  manufacturer: string;
  unit_price: number;
  target_quantity: number;
  current_quantity: number;
  achievementRate: number;
  images: string[];
}

interface DirectDonationClientProps {
  projects: FundingProject[];
  isLoggedIn: boolean;
  currentUserId: string | null;
}

const CATEGORIES = [
  { key: "all", label: "전체 물품", icon: "🎁" },
  { key: "clothing", label: "의류·잡화", icon: "👕" },
  { key: "food", label: "식품·생필품", icon: "🍚" },
  { key: "education", label: "교육·도서", icon: "📚" },
  { key: "medical", label: "의료·건강", icon: "💊" },
];

function DirectDonationContent({ projects }: DirectDonationClientProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const queryCategory = searchParams?.get("category") || "all";

  const [selectedCategory, setSelectedCategory] = useState(queryCategory);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    setSelectedCategory(queryCategory);
  }, [queryCategory]);

  const handleCategoryChange = (key: string) => {
    setSelectedCategory(key);
    if (key === "all") {
      router.push("/donation/direct");
    } else {
      router.push(`/donation/direct?category=${key}`);
    }
  };

  const filteredProjects = projects.filter((project) => {
    const matchCategory =
      selectedCategory === "all" || project.category === selectedCategory;
    const matchSearch =
      project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchSearch;
  });

  const totalDelivered = 1240;
  const totalBeneficiaries = 382;

  return (
    <div className="min-h-screen bg-[#090b12] text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <DomainContextHeader
          domain="donation"
          title="📦 K-물품 직접기부 (Tied Goods)"
          subtitle="LG·삼성 가전, CJ 영양식품 등 한국 기업 실물 물품을 직구매하여 취약계층에 전달하고 수출 승수 효과를 창출합니다"
          metrics={[
            { label: "전달된 물품", value: totalDelivered, unit: "개" },
            { label: "수혜 이웃", value: totalBeneficiaries, unit: "명" },
          ]}
        >
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.key}
                  onClick={() => handleCategoryChange(cat.key)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
                    selectedCategory === cat.key
                      ? "bg-purple-500/20 text-purple-200 border-purple-400/40"
                      : "bg-slate-900/70 text-slate-400 border-slate-800 hover:text-slate-200"
                  }`}
                >
                  {cat.icon} {cat.label}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="프로젝트명 또는 물품 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-purple-500/60"
              />
            </div>
          </div>
        </DomainContextHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <AnimatePresence mode="popLayout">
            {filteredProjects.map((project) => {
              const isUrgent =
                project.achievementRate >= 80 && project.achievementRate < 100;
              return (
                <motion.div
                  key={project.id}
                  layout
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  transition={{ duration: 0.2 }}
                >
                  <Link href={`/donation/direct/item/${project.id}`}>
                    <Card className="bg-slate-900/70 border-slate-800/90 hover:border-purple-500/40 transition-all cursor-pointer group overflow-hidden h-full">
                      <div className="relative aspect-video bg-gradient-to-br from-purple-950/60 via-slate-900 to-slate-950 flex items-center justify-center border-b border-white/[0.04]">
                        <span className="text-5xl opacity-60">
                          {project.categoryIcon}
                        </span>

                        <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded bg-slate-900/90 border border-white/10 text-slate-200 text-xs flex items-center gap-1">
                          {project.categoryIcon} {project.categoryLabel}
                        </span>

                        {isUrgent && (
                          <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded bg-rose-500 text-white text-[10px] font-bold animate-pulse">
                            마감임박
                          </span>
                        )}

                        <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-slate-800">
                          <motion.div
                            className="h-full bg-gradient-to-r from-purple-500 to-fuchsia-500"
                            initial={{ width: 0 }}
                            animate={{ width: `${project.achievementRate}%` }}
                            transition={{ duration: 0.5 }}
                          />
                        </div>
                      </div>

                      <CardContent className="p-4 space-y-3">
                        <h3 className="font-bold text-white group-hover:text-purple-300 transition-colors line-clamp-2">
                          {project.title}
                        </h3>

                        <div className="grid grid-cols-2 gap-2 text-xs text-slate-500">
                          <div className="flex items-center gap-1">
                            <Users className="w-3.5 h-3.5 text-purple-400" />
                            <span className="truncate">
                              {project.target_beneficiary}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Package className="w-3.5 h-3.5 text-fuchsia-400" />
                            <span className="truncate">
                              {project.manufacturer}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                          <div>
                            <span className="text-purple-300 font-bold text-sm">
                              {project.achievementRate}%
                            </span>
                            <span className="text-xs text-slate-500 ml-1">
                              ({project.current_quantity}/
                              {project.target_quantity})
                            </span>
                          </div>
                          <span className="text-sm font-bold text-white">
                            {project.unit_price.toLocaleString()} PMC
                            <span className="text-xs font-normal text-slate-500">
                              /개
                            </span>
                          </span>
                        </div>

                        <div className="pt-1">
                          <div className="w-full py-2 rounded-xl bg-purple-600/20 border border-purple-500/40 text-center text-purple-200 text-xs font-bold group-hover:bg-purple-600 group-hover:text-white transition-all">
                            물품 후원하기 🎁
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {filteredProjects.length === 0 && (
          <div className="text-center py-16 text-slate-500">
            <Gift className="w-12 h-12 mx-auto mb-4 opacity-40 text-purple-400" />
            <p>진행 중인 물품 후원 프로젝트가 없습니다.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export function DirectDonationClient(props: DirectDonationClientProps) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#090b12]" />}>
      <DirectDonationContent {...props} />
    </Suspense>
  );
}
