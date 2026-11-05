"use client";

import { Suspense, useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Building2,
  Shield,
  Search,
  ChevronRight,
  Receipt,
  Globe,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { DomainContextHeader } from "@/shared/ui/components/layout/DomainContextHeader";

export interface Institute {
  id: string;
  name: string;
  description: string;
  category: string;
  categoryLabel: string;
  categoryIcon: string;
  websiteUrl: string | null;
  trustScore: number;
  isVerified: boolean;
}

interface InstituteClientProps {
  institutes: Institute[];
  isLoggedIn: boolean;
}

const CATEGORIES = [
  { key: "all", label: "전체 기관", icon: "🏛️" },
  { key: "emergency", label: "긴급구호", icon: "🆘" },
  { key: "children", label: "아동복지", icon: "👶" },
  { key: "environment", label: "환경보호", icon: "🌿" },
  { key: "education", label: "교육지원", icon: "📚" },
];

function getInstituteBrandInfo(name: string) {
  if (name.includes("유니세프")) {
    return {
      icon: "🇺🇳",
      tag: "UN 산하 아동구호기구",
    };
  }
  if (name.includes("세이브더칠드런")) {
    return {
      icon: "🛡️",
      tag: "국제 아동권리 전문 NGO",
    };
  }
  if (name.includes("초록우산")) {
    return {
      icon: "☂️",
      tag: "어린이 복지 76년",
    };
  }
  if (name.includes("월드비전")) {
    return {
      icon: "🌍",
      tag: "글로벌 긴급구호 NGO",
    };
  }
  if (name.includes("굿네이버스")) {
    return {
      icon: "🌱",
      tag: "대한민국 토종 국제 NGO",
    };
  }
  if (name.includes("적십자")) {
    return {
      icon: "⛑️",
      tag: "인도주의 재난대응",
    };
  }
  if (name.includes("환경재단")) {
    return {
      icon: "🌳",
      tag: "아시아 기후위기 대응",
    };
  }
  if (name.includes("밀알")) {
    return {
      icon: "🤝",
      tag: "장애인 복지 전문",
    };
  }
  return {
    icon: "🏛️",
    tag: "공익 인증 기관",
  };
}

function formatTrustScore(score: number) {
  if (score <= 0)
    return { label: "심사 진행 중", grade: "A-", scoreText: "8.0" };
  const val = Number(score.toFixed(1));
  if (val >= 9.3)
    return { label: "최우수 투명성", grade: "AAA", scoreText: val.toFixed(1) };
  if (val >= 8.8)
    return { label: "우수 공익인증", grade: "AA+", scoreText: val.toFixed(1) };
  if (val >= 8.0)
    return { label: "신뢰 인증", grade: "AA", scoreText: val.toFixed(1) };
  return { label: "기본 인증", grade: "A", scoreText: val.toFixed(1) };
}

function InstituteContent({ institutes }: InstituteClientProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const queryType = searchParams?.get("type") || "all";

  const [selectedCategory, setSelectedCategory] = useState(queryType);
  const [searchQuery, setSearchQuery] = useState("");
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [sortBy, setSortBy] = useState<"trust" | "name">("trust");

  useEffect(() => {
    setSelectedCategory(queryType);
  }, [queryType]);

  const handleCategoryChange = (key: string) => {
    setSelectedCategory(key);
    if (key === "all") {
      router.push("/donation/institute");
    } else {
      router.push(`/donation/institute?type=${key}`);
    }
  };

  const filteredInstitutes = useMemo(() => {
    const list = institutes.filter((inst) => {
      const normalizedInstCat =
        inst.category === "disaster" ? "emergency" : inst.category;
      const matchCategory =
        selectedCategory === "all" || normalizedInstCat === selectedCategory;
      const matchSearch =
        inst.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inst.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchVerified = !verifiedOnly || inst.isVerified;
      return matchCategory && matchSearch && !inst.name.startsWith("Test ");
    });

    if (sortBy === "trust") {
      list.sort((a, b) => b.trustScore - a.trustScore);
    } else {
      list.sort((a, b) => a.name.localeCompare(b.name, "ko"));
    }

    return list;
  }, [institutes, selectedCategory, searchQuery, verifiedOnly, sortBy]);

  return (
    <div className="min-h-screen bg-[#090b12] text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <DomainContextHeader
          domain="donation"
          title="🏛️ Institute · 검증된 공익 기관 기부"
          subtitle="투명성 등급(AAA~A)이 검증된 공익 파트너에 PMC를 후원하고 세액공제(Gift Aid) 혜택을 받으세요"
          metrics={[
            {
              label: "검증 파트너 기관",
              value: filteredInstitutes.length,
              unit: "곳",
            },
          ]}
        >
          <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-3">
            <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.key}
                  onClick={() => handleCategoryChange(cat.key)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border flex items-center gap-1.5 ${
                    selectedCategory === cat.key
                      ? "bg-purple-500/20 text-purple-200 border-purple-400/40"
                      : "bg-slate-900/70 text-slate-400 border-slate-800 hover:text-slate-200"
                  }`}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.label}</span>
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <label className="flex items-center gap-1.5 text-xs text-slate-400 cursor-pointer select-none hover:text-slate-200">
                <input
                  type="checkbox"
                  checked={verifiedOnly}
                  onChange={(e) => setVerifiedOnly(e.target.checked)}
                  className="rounded bg-slate-800 border-slate-700 text-purple-500 focus:ring-purple-500"
                />
                <span>영수증 발급 기관만</span>
              </label>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as "trust" | "name")}
                className="bg-slate-900 border border-slate-800 text-slate-300 rounded-xl px-2.5 py-1.5 text-xs focus:outline-none"
              >
                <option value="trust">신뢰도순 정렬</option>
                <option value="name">가나다순 정렬</option>
              </select>

              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="기관명, 복지 분야 검색..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-purple-500/60"
                />
              </div>
            </div>
          </div>
        </DomainContextHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <AnimatePresence mode="popLayout">
            {filteredInstitutes.map((inst, idx) => {
              const brand = getInstituteBrandInfo(inst.name);
              const trust = formatTrustScore(inst.trustScore);

              return (
                <motion.div
                  key={inst.id}
                  layout
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{
                    duration: 0.25,
                    delay: Math.min(idx * 0.03, 0.3),
                  }}
                >
                  <Link
                    href={`/donation/institute/${inst.category}/general/${inst.id}`}
                    className="block group h-full"
                  >
                    <div className="h-full rounded-2xl bg-slate-900/70 border border-slate-800/90 hover:border-purple-500/40 transition-all duration-300 flex flex-col overflow-hidden relative">
                      <div className="p-5 pb-3 relative z-10">
                        <div className="flex justify-between items-start gap-2 mb-3">
                          <div className="w-12 h-12 rounded-2xl bg-purple-950/50 border border-purple-500/30 shadow-lg flex items-center justify-center text-2xl shrink-0 group-hover:scale-105 transition-transform">
                            {brand.icon}
                          </div>

                          <div className="flex flex-col items-end gap-1">
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-950/80 border border-purple-500/40 text-purple-200 text-xs font-bold">
                              <Shield className="w-3 h-3 text-purple-400" />
                              <span>{trust.grade}</span>
                              <span className="text-[10px] text-purple-300/80">
                                ({trust.scoreText}/10)
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-500">
                              {trust.label}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 flex-wrap mb-2">
                          <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-800 text-slate-300 border border-slate-700/60">
                            {inst.categoryLabel}
                          </span>
                          <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-purple-500/15 text-purple-300 border border-purple-500/30">
                            {brand.tag}
                          </span>
                        </div>

                        <h3 className="text-lg font-bold text-white group-hover:text-purple-300 transition-colors line-clamp-1">
                          {inst.name}
                        </h3>

                        <p className="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed min-h-[36px]">
                          {inst.description ||
                            "투명한 운영과 사회적 책임을 다하는 PosMul 공식 검증 공익 기관입니다."}
                        </p>
                      </div>

                      <div className="mt-auto p-5 pt-3 border-t border-slate-800/80 bg-slate-950/40 relative z-10 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs text-slate-400">
                          {inst.isVerified && (
                            <span className="flex items-center gap-1 text-[11px] text-purple-300 font-medium">
                              <Receipt className="w-3 h-3" />
                              영수증 발급
                            </span>
                          )}
                          {inst.websiteUrl && (
                            <span className="flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-300">
                              <Globe className="w-3 h-3" />
                              공식웹
                            </span>
                          )}
                        </div>

                        <div className="inline-flex items-center gap-1 text-xs font-bold text-purple-300 group-hover:translate-x-1 transition-all">
                          <span>PMC 후원하기</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {filteredInstitutes.length === 0 && (
          <div className="text-center py-20 text-slate-500 bg-slate-900/30 rounded-2xl border border-slate-800/60 max-w-md mx-auto">
            <Building2 className="w-12 h-12 mx-auto mb-3 opacity-30 text-purple-400" />
            <p className="text-sm font-semibold text-slate-300">
              검색 조건에 일치하는 기관이 없습니다.
            </p>
            <p className="text-xs text-slate-500 mt-1">
              다른 검색어나 카테고리 필터를 선택해보세요.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export function InstituteClient(props: InstituteClientProps) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#090b12]" />}>
      <InstituteContent {...props} />
    </Suspense>
  );
}
