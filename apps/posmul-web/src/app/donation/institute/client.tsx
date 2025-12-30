"use client";

import { useState } from "react";
import Link from "next/link";
import { Building2, Shield, Search, Eye, Award, ExternalLink, TrendingUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/shared/ui/components/base/Card";

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

// 카테고리 목록
const CATEGORIES = [
  { key: "all", label: "전체", icon: "🏛️" },
  { key: "children", label: "아동복지", icon: "👶" },
  { key: "elderly", label: "노인복지", icon: "👴" },
  { key: "disaster", label: "재난구호", icon: "🆘" },
  { key: "environment", label: "환경보전", icon: "🌿" },
  { key: "education", label: "교육지원", icon: "📚" },
  { key: "medical", label: "의료지원", icon: "🏥" },
  { key: "animal", label: "동물보호", icon: "🐾" },
];

export function InstituteClient({ institutes }: InstituteClientProps) {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredInstitutes = institutes.filter((inst) => {
    const matchCategory = selectedCategory === "all" || inst.category === selectedCategory;
    const matchSearch = inst.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inst.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchSearch;
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-950 to-slate-950 text-slate-200">
      {/* Header - Forum 스타일 */}
      <header className="sticky top-0 z-10 backdrop-blur-xl bg-blue-950/80 border-b border-blue-800/50">
        <div className="max-w-4xl mx-auto p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">
                🏛️ Institute
              </h1>
              <p className="text-sm text-blue-400/70">검증된 기관 · 투명한 기부</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-400">등록 기관</p>
              <p className="text-xl font-bold text-blue-400">
                <span className="text-2xl">{institutes.length}</span>
                <span className="text-sm ml-1">개</span>
              </p>
            </div>
          </div>

          {/* 검색 */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <input
              type="text"
              placeholder="기관명 또는 키워드 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-900/80 border border-slate-700 
                         text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-blue-500
                         focus:ring-1 focus:ring-blue-500/50 transition-all"
            />
          </div>
        </div>
      </header>

      {/* Category Tabs */}
      <div className="max-w-4xl mx-auto px-4 py-4 overflow-x-auto">
        <div className="flex gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setSelectedCategory(cat.key)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all
                ${selectedCategory === cat.key
                  ? "bg-blue-500 text-white shadow-lg shadow-blue-500/25"
                  : "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-300"
                }`}
            >
              {cat.icon} {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Institute Grid */}
      <main className="max-w-4xl mx-auto px-4 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AnimatePresence mode="popLayout">
            {filteredInstitutes.map((institute) => (
              <motion.div
                key={institute.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                <Link href={`/donation/institute/${institute.category}/${institute.id}`}>
                  <Card className="bg-slate-900/70 border-slate-800 hover:border-blue-700/50 transition-all cursor-pointer group overflow-hidden h-full">
                    {/* 히어로 영역 */}
                    <div className="relative aspect-video bg-gradient-to-br from-blue-900/50 to-slate-900 flex items-center justify-center">
                      <div className="text-center">
                        <span className="text-5xl">{institute.categoryIcon}</span>
                        <div className="mt-2 flex items-center justify-center gap-2">
                          {institute.isVerified && (
                            <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/80 text-white text-xs">
                              <Shield className="w-3 h-3" /> 검증됨
                            </span>
                          )}
                        </div>
                      </div>
                      {/* Trust Score */}
                      <div className="absolute top-2 right-2 px-2 py-1 rounded bg-black/60 text-white text-xs flex items-center gap-1">
                        <TrendingUp className="w-3 h-3 text-emerald-400" />
                        신뢰도 {institute.trustScore}%
                      </div>
                    </div>

                    <CardContent className="p-4 space-y-2">
                      {/* 카테고리 */}
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span className="px-2 py-0.5 rounded-full bg-blue-900/30 text-blue-400">
                          {institute.categoryLabel}
                        </span>
                      </div>

                      {/* 기관명 */}
                      <h3 className="font-bold text-white group-hover:text-blue-400 transition-colors line-clamp-1">
                        {institute.name}
                      </h3>

                      {/* 설명 */}
                      <p className="text-sm text-slate-400 line-clamp-2">{institute.description}</p>

                      {/* Footer */}
                      <div className="flex items-center justify-between pt-2 text-xs text-slate-500">
                        {institute.websiteUrl && (
                          <span className="flex items-center gap-1">
                            <ExternalLink className="w-3 h-3" />
                            공식 사이트
                          </span>
                        )}
                        <span className="flex items-center gap-1 text-blue-400 font-medium ml-auto">
                          기부하기 →
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {filteredInstitutes.length === 0 && (
          <div className="text-center py-16 text-slate-500">
            <Building2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>조건에 맞는 기관이 없습니다.</p>
          </div>
        )}
      </main>
    </div>
  );
}
