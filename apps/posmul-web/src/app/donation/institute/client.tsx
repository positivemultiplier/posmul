"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Building2,
  Shield,
  Search,
  Award,
  ExternalLink,
  TrendingUp,
  Heart,
  CheckCircle2,
  Filter,
  Sparkles,
  ChevronRight,
  Receipt,
  Globe,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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

// 카테고리 필터 목록
const CATEGORIES = [
  { key: "all", label: "전체 기관", icon: "🏛️" },
  { key: "children", label: "아동·청소년", icon: "👶" },
  { key: "disaster", label: "긴급·재난구호", icon: "🆘" },
  { key: "environment", label: "환경·기후", icon: "🌿" },
  { key: "elderly", label: "노인·장애인", icon: "👴" },
  { key: "medical", label: "보건·의료", icon: "🏥" },
  { key: "education", label: "교육지원", icon: "📚" },
  { key: "animal", label: "동물보호", icon: "🐾" },
];

// 기관 브랜드별 테마 및 아이콘 매핑
function getInstituteBrandInfo(name: string, category: string) {
  if (name.includes("유니세프")) {
    return {
      gradient: "from-cyan-500/20 via-blue-600/10 to-transparent",
      badgeColor: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
      accent: "#06b6d4",
      icon: "🇺🇳",
      tag: "UN 산하 아동구호기구",
    };
  }
  if (name.includes("세이브더칠드런")) {
    return {
      gradient: "from-rose-500/20 via-red-600/10 to-transparent",
      badgeColor: "bg-rose-500/20 text-rose-300 border-rose-500/30",
      accent: "#f43f5e",
      icon: "🛡️",
      tag: "국제 아동권리 전문 NGO",
    };
  }
  if (name.includes("초록우산")) {
    return {
      gradient: "from-emerald-500/20 via-green-600/10 to-transparent",
      badgeColor: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
      accent: "#10b981",
      icon: "☂️",
      tag: "어린이 복지 76년",
    };
  }
  if (name.includes("월드비전")) {
    return {
      gradient: "from-amber-500/20 via-orange-600/10 to-transparent",
      badgeColor: "bg-amber-500/20 text-amber-300 border-amber-500/30",
      accent: "#f59e0b",
      icon: "🌍",
      tag: "글로벌 긴급구호 NGO",
    };
  }
  if (name.includes("굿네이버스")) {
    return {
      gradient: "from-teal-500/20 via-emerald-600/10 to-transparent",
      badgeColor: "bg-teal-500/20 text-teal-300 border-teal-500/30",
      accent: "#14b8a6",
      icon: "🌱",
      tag: "대한민국 토종 국제 NGO",
    };
  }
  if (name.includes("적십자")) {
    return {
      gradient: "from-red-600/20 via-rose-700/10 to-transparent",
      badgeColor: "bg-red-500/20 text-red-300 border-red-500/30",
      accent: "#ef4444",
      icon: "⛑️",
      tag: "인도주의 재난대응",
    };
  }
  if (name.includes("환경재단")) {
    return {
      gradient: "from-green-500/20 via-emerald-700/10 to-transparent",
      badgeColor: "bg-green-500/20 text-green-300 border-green-500/30",
      accent: "#22c55e",
      icon: "🌳",
      tag: "아시아 기후위기 대응",
    };
  }
  if (name.includes("밀알")) {
    return {
      gradient: "from-indigo-500/20 via-purple-600/10 to-transparent",
      badgeColor: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
      accent: "#6366f1",
      icon: "🤝",
      tag: "장애인 복지 전문",
    };
  }
  return {
    gradient: "from-blue-500/15 via-slate-800/10 to-transparent",
    badgeColor: "bg-blue-500/20 text-blue-300 border-blue-500/30",
    accent: "#3b82f6",
    icon: "🏛️",
    tag: "공익 인증 기관",
  };
}

// 신뢰도 포맷팅 (10점 만점)
function formatTrustScore(score: number) {
  if (score <= 0) return { label: "심사 진행 중", grade: "A-", scoreText: "8.0" };
  const val = Number(score.toFixed(1));
  if (val >= 9.3) return { label: "최우수 투명성", grade: "AAA", scoreText: val.toFixed(1) };
  if (val >= 8.8) return { label: "우수 공익인증", grade: "AA+", scoreText: val.toFixed(1) };
  if (val >= 8.0) return { label: "신뢰 인증", grade: "AA", scoreText: val.toFixed(1) };
  return { label: "기본 인증", grade: "A", scoreText: val.toFixed(1) };
}

export function InstituteClient({ institutes }: InstituteClientProps) {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [sortBy, setSortBy] = useState<"trust" | "name">("trust");

  // 필터링 및 정렬
  const filteredInstitutes = useMemo(() => {
    let list = institutes.filter((inst) => {
      const matchCategory = selectedCategory === "all" || inst.category === selectedCategory;
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
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-rose-500 selection:text-white">
      {/* 상단 앰비언트 글로우 */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-b from-rose-600/10 via-purple-900/5 to-transparent rounded-full blur-3xl opacity-60" />
      </div>

      {/* 헤더 배너 & 선순환 플라이휠 안내 */}
      <header className="border-b border-slate-800/60 bg-slate-900/40 backdrop-blur-xl sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 py-4 sm:py-5">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-semibold mb-2">
                <Heart className="w-3.5 h-3.5 text-rose-400 fill-rose-500/30" />
                <span>PosMul 선한 승수 ➔ 공익 파트너스 기부 포털</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2">
                <span>검증된 공익 기부 기관</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-medium">
                  {filteredInstitutes.length}개 기관
                </span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                예측 참여로 획득한 <strong className="text-rose-400 font-bold">PMC</strong>를 투명성이 검증된 공익 파트너에 후원하고, <strong>시민 기부 랭킹 점수</strong>를 획득하세요.
              </p>
            </div>

            {/* 검색창 */}
            <div className="w-full md:w-80 relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="기관명, 복지 분야, 키워드 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700/80 
                           text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-rose-500
                           focus:ring-2 focus:ring-rose-500/20 transition-all shadow-inner"
              />
            </div>
          </div>

          {/* 카테고리 탭 & 필터 옵션 */}
          <div className="mt-4 pt-3 border-t border-slate-800/40 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div className="flex gap-1.5 overflow-x-auto pb-1 max-w-full no-scrollbar">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.key}
                  onClick={() => setSelectedCategory(cat.key)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-200 flex items-center gap-1.5 ${
                    selectedCategory === cat.key
                      ? "bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-md shadow-rose-500/20"
                      : "bg-slate-900/70 text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-slate-800"
                  }`}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.label}</span>
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3 self-end sm:self-auto text-xs text-slate-400">
              <label className="flex items-center gap-1.5 cursor-pointer select-none hover:text-slate-200">
                <input
                  type="checkbox"
                  checked={verifiedOnly}
                  onChange={(e) => setVerifiedOnly(e.target.checked)}
                  className="rounded bg-slate-800 border-slate-700 text-rose-500 focus:ring-rose-500"
                />
                <span>검증 기관만 보기</span>
              </label>

              <div className="h-3 w-[1px] bg-slate-800" />

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-slate-900 border border-slate-700 text-slate-300 rounded-lg px-2 py-1 text-xs focus:outline-none"
              >
                <option value="trust">신뢰도순 정렬</option>
                <option value="name">가나다순 정렬</option>
              </select>
            </div>
          </div>
        </div>
      </header>

      {/* 기관 카드 그리드 */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <AnimatePresence mode="popLayout">
            {filteredInstitutes.map((inst, idx) => {
              const brand = getInstituteBrandInfo(inst.name, inst.category);
              const trust = formatTrustScore(inst.trustScore);

              return (
                <motion.div
                  key={inst.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.25, delay: Math.min(idx * 0.03, 0.3) }}
                >
                  <Link
                    href={`/donation/institute/${inst.category}/general/${inst.id}`}
                    className="block group h-full"
                  >
                    <div className="h-full rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-950/90 border border-slate-800/80 hover:border-rose-500/50 hover:shadow-xl hover:shadow-rose-950/30 transition-all duration-300 flex flex-col overflow-hidden relative">
                      {/* 상단 앰비언트 백그라운드 */}
                      <div className={`absolute top-0 inset-x-0 h-32 bg-gradient-to-b ${brand.gradient} pointer-events-none opacity-50 group-hover:opacity-100 transition-opacity`} />

                      {/* 카드 헤더 */}
                      <div className="p-5 pb-3 relative z-10">
                        <div className="flex justify-between items-start gap-2 mb-3">
                          <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-700/60 shadow-lg flex items-center justify-center text-2xl shrink-0 group-hover:scale-105 transition-transform">
                            {brand.icon}
                          </div>

                          <div className="flex flex-col items-end gap-1">
                            {/* 신뢰도 점수 배지 */}
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900/90 border border-emerald-500/40 text-emerald-300 text-xs font-bold shadow-sm">
                              <Shield className="w-3 h-3 text-emerald-400" />
                              <span>{trust.grade}</span>
                              <span className="text-[10px] text-emerald-400/80">({trust.scoreText}/10)</span>
                            </div>
                            <span className="text-[10px] text-slate-500">{trust.label}</span>
                          </div>
                        </div>

                        {/* 분야 배지 & 태그 */}
                        <div className="flex items-center gap-1.5 flex-wrap mb-2">
                          <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-800 text-slate-300 border border-slate-700/60">
                            {inst.categoryLabel}
                          </span>
                          <span className={`px-2 py-0.5 rounded-md text-[11px] font-semibold border ${brand.badgeColor}`}>
                            {brand.tag}
                          </span>
                        </div>

                        {/* 기관명 */}
                        <h3 className="text-lg font-black text-white group-hover:text-rose-300 transition-colors line-clamp-1">
                          {inst.name}
                        </h3>

                        {/* 설명 */}
                        <p className="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed min-h-[36px]">
                          {inst.description || "투명한 운영과 사회적 책임을 다하는 PosMul 공식 검증 공익 기관입니다."}
                        </p>
                      </div>

                      {/* 카드 푸터 */}
                      <div className="mt-auto p-5 pt-3 border-t border-slate-800/60 bg-slate-900/40 relative z-10 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs text-slate-400">
                          {inst.isVerified && (
                            <span className="flex items-center gap-1 text-[11px] text-cyan-400 font-medium">
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

                        <div className="inline-flex items-center gap-1 text-xs font-bold text-rose-400 group-hover:text-rose-300 group-hover:translate-x-1 transition-all">
                          <span>후원하기</span>
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
            <Building2 className="w-12 h-12 mx-auto mb-3 opacity-30 text-rose-400" />
            <p className="text-sm font-semibold text-slate-300">검색 조건에 일치하는 기관이 없습니다.</p>
            <p className="text-xs text-slate-500 mt-1">다른 검색어나 카테고리 필터를 선택해보세요.</p>
          </div>
        )}
      </main>
    </div>
  );
}
