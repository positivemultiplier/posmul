"use client";

import { Suspense, useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Star, Users, Heart, Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/shared/ui/components/base/Card";
import { DomainContextHeader } from "@/shared/ui/components/layout/DomainContextHeader";

export interface OpinionLeader {
  id: string;
  displayName: string;
  bio: string;
  category: string;
  categoryLabel: string;
  categoryIcon: string;
  avatarUrl: string | null;
  followerCount: number;
  totalDonationsInfluenced: number;
  isVerified: boolean;
}

interface OpinionLeaderClientProps {
  leaders: OpinionLeader[];
  userPmcBalance: number;
  isLoggedIn: boolean;
  userId: string | null;
}

const CATEGORIES = [
  { key: "all", label: "전체 리더", icon: "🌟" },
  { key: "environment", label: "환경", icon: "🌿" },
  { key: "welfare", label: "복지", icon: "🤝" },
  { key: "science", label: "과학·교육", icon: "🔬" },
  { key: "human-rights", label: "인권·동물", icon: "🕊️" },
];

function OpinionLeaderContent({ leaders }: OpinionLeaderClientProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const queryField = searchParams?.get("field") || "all";

  const [selectedCategory, setSelectedCategory] = useState(queryField);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    setSelectedCategory(queryField);
  }, [queryField]);

  const handleCategoryChange = (key: string) => {
    setSelectedCategory(key);
    if (key === "all") {
      router.push("/donation/opinion-leader");
    } else {
      router.push(`/donation/opinion-leader?field=${key}`);
    }
  };

  const filteredLeaders = useMemo(() => {
    return leaders.filter((leader) => {
      const normalizedCat =
        leader.category === "education"
          ? "science"
          : leader.category === "animal" || leader.category === "culture"
          ? "human-rights"
          : leader.category;
      const matchCategory =
        selectedCategory === "all" ||
        leader.category === selectedCategory ||
        normalizedCat === selectedCategory;
      const matchSearch =
        leader.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        leader.bio.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCategory && matchSearch;
    });
  }, [leaders, selectedCategory, searchQuery]);

  const totalFollowers = leaders.reduce((sum, l) => sum + l.followerCount, 0);
  const totalImpact = leaders.reduce(
    (sum, l) => sum + l.totalDonationsInfluenced,
    0
  );

  const formatCount = (num: number) => {
    if (num >= 10000) return `${(num / 10000).toFixed(1)}만`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}천`;
    return num.toLocaleString();
  };

  const formatAmount = (num: number) => {
    if (num >= 100000000) return `${(num / 100000000).toFixed(1)}억`;
    if (num >= 10000) return `${(num / 10000).toFixed(0)}만`;
    return num.toLocaleString();
  };

  return (
    <div className="min-h-screen bg-[#090b12] text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <DomainContextHeader
          domain="donation"
          title="🌟 Opinion Leader · 오피니언 리더 연대 후원"
          subtitle="신뢰하는 전문가·인플루언서가 보증하는 공익 캠페인에 동참하여 선한 영향력을 확산하세요"
          metrics={[
            { label: "연대 팔로워", value: formatCount(totalFollowers), unit: "명" },
            { label: "영향력 기부금", value: formatAmount(totalImpact), unit: "PMC" },
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
                placeholder="리더 이름 또는 소개 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-purple-500/60"
              />
            </div>
          </div>
        </DomainContextHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <AnimatePresence mode="popLayout">
            {filteredLeaders.map((leader) => (
              <motion.div
                key={leader.id}
                layout
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.2 }}
              >
                <Link
                  href={`/donation/opinion-leader/${leader.category}/${leader.id}`}
                >
                  <Card className="bg-slate-900/70 border-slate-800/90 hover:border-purple-500/40 transition-all cursor-pointer group overflow-hidden h-full">
                    <div className="relative aspect-video bg-gradient-to-br from-purple-950/60 via-slate-900 to-slate-950 flex items-center justify-center border-b border-white/[0.04]">
                      <div className="text-center">
                        <div className="w-20 h-20 mx-auto rounded-full bg-slate-900 flex items-center justify-center text-4xl border-2 border-purple-500/40">
                          {leader.avatarUrl ? (
                            <img
                              src={leader.avatarUrl}
                              alt={leader.displayName}
                              className="w-full h-full rounded-full object-cover"
                            />
                          ) : (
                            leader.categoryIcon
                          )}
                        </div>
                        {leader.isVerified && (
                          <span className="inline-flex items-center gap-1 mt-2 px-2 py-0.5 rounded bg-purple-500/20 border border-purple-400/40 text-purple-200 text-[10px] font-bold">
                            ✓ 공식 인증 리더
                          </span>
                        )}
                      </div>
                      <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded bg-black/60 text-slate-200 text-xs flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {formatCount(leader.followerCount)}
                      </div>
                    </div>

                    <CardContent className="p-4 space-y-2.5">
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span className="px-2 py-0.5 rounded-md bg-purple-500/15 text-purple-300 border border-purple-500/25 font-medium">
                          {leader.categoryIcon} {leader.categoryLabel}
                        </span>
                      </div>

                      <h3 className="font-bold text-white group-hover:text-purple-300 transition-colors">
                        {leader.displayName}
                      </h3>

                      <p className="text-sm text-slate-400 line-clamp-2">
                        {leader.bio}
                      </p>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs text-slate-500">
                        <span className="flex items-center gap-1 text-purple-300 font-semibold">
                          <Heart className="w-3.5 h-3.5 text-fuchsia-400" />
                          영향력 {formatAmount(leader.totalDonationsInfluenced)}{" "}
                          PMC
                        </span>
                        <span className="flex items-center gap-1 text-purple-300 font-bold">
                          연대 후원 →
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {filteredLeaders.length === 0 && (
          <div className="text-center py-16 text-slate-500">
            <Star className="w-12 h-12 mx-auto mb-4 opacity-40 text-purple-400" />
            <p>조건에 맞는 오피니언 리더가 없습니다.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export function OpinionLeaderClient(props: OpinionLeaderClientProps) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#090b12]" />}>
      <OpinionLeaderContent {...props} />
    </Suspense>
  );
}
