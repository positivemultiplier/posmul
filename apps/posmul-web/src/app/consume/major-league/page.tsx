"use client";

import React, { Suspense, useState, useEffect } from "react";
import { Play, Clock, Gift, Eye, Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent } from "@/shared/ui/components/base/Card";
import { Button } from "@/shared/ui/components/base";
import { DomainContextHeader } from "@/shared/ui/components/layout/DomainContextHeader";

interface AdData {
  id: string;
  title: string;
  advertiserName: string;
  category: string;
  description: string;
  thumbnailUrl?: string;
  durationSeconds: number;
  rewardPmpAmount: number;
  viewCount: number;
  isNew?: boolean;
}

const MOCK_ADS: AdData[] = [
  {
    id: "ad-001",
    title: "친환경 라이프스타일 브랜드 'GreenLife'",
    advertiserName: "GreenLife Korea",
    category: "라이프스타일",
    description:
      "지속 가능한 미래를 위한 친환경 텀블러. 당신의 작은 선택이 지구를 바꿉니다.",
    durationSeconds: 30,
    rewardPmpAmount: 50,
    viewCount: 12500,
    isNew: true,
  },
  {
    id: "ad-002",
    title: "AI 기반 영어 학습 앱 'SpeakEasy'",
    advertiserName: "EdTech Labs",
    category: "교육",
    description:
      "1:1 AI 튜터와 함께하는 맞춤형 영어 회화. 하루 10분으로 네이티브처럼!",
    durationSeconds: 45,
    rewardPmpAmount: 75,
    viewCount: 8900,
    isNew: true,
  },
  {
    id: "ad-003",
    title: "프리미엄 구독 서비스 'BookBox'",
    advertiserName: "BookBox Inc.",
    category: "문화",
    description:
      "매달 큐레이터가 선정한 도서 2권과 독서 굿즈를 집으로 배송해드립니다.",
    durationSeconds: 30,
    rewardPmpAmount: 40,
    viewCount: 5600,
  },
  {
    id: "ad-004",
    title: "건강한 하루, 비타민 정기배송",
    advertiserName: "HealthPill",
    category: "문화",
    description:
      "개인 맞춤 영양제를 매달 자동 배송. 건강 관리의 새로운 시작.",
    durationSeconds: 25,
    rewardPmpAmount: 35,
    viewCount: 15200,
  },
];

const CATEGORIES = ["전체", "라이프스타일", "교육", "문화"];

function MajorLeagueContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const queryCategory = searchParams?.get("category") || "전체";

  const [ads, setAds] = useState<AdData[]>(MOCK_ADS);
  const [selectedCategory, setSelectedCategory] = useState(queryCategory);
  const [searchQuery, setSearchQuery] = useState("");
  const [totalPmpEarned, setTotalPmpEarned] = useState(350);

  useEffect(() => {
    setSelectedCategory(queryCategory);
  }, [queryCategory]);

  const handleCategoryChange = (cat: string) => {
    setSelectedCategory(cat);
    if (cat === "전체") {
      router.push("/consume/major-league");
    } else {
      router.push(`/consume/major-league?category=${encodeURIComponent(cat)}`);
    }
  };

  useEffect(() => {
    async function fetchCampaignsAndStats() {
      try {
        const [campaignsRes, statsRes] = await Promise.all([
          fetch("/api/consume/time/campaigns"),
          fetch("/api/consume/time/stats"),
        ]);

        if (campaignsRes.ok) {
          const data = await campaignsRes.json();
          const list = Array.isArray(data.campaigns) ? data.campaigns : [];
          if (list.length > 0) {
            const mapped: AdData[] = list.map(
              (item: Record<string, unknown>) => ({
                id: String(item.id ?? ""),
                title: String(item.title ?? "캠페인"),
                advertiserName: String(
                  item.advertiser_name ?? "파트너 브랜드"
                ),
                category: String(item.category ?? "라이프스타일"),
                description: String(item.description ?? ""),
                thumbnailUrl:
                  typeof item.thumbnail_url === "string"
                    ? item.thumbnail_url
                    : undefined,
                durationSeconds: Number(item.duration_seconds ?? 30),
                rewardPmpAmount: Number(
                  item.pmp_reward_full ?? item.pmp_reward ?? 50
                ),
                viewCount: Number(item.view_count ?? 0),
                isNew: Boolean(item.canWatch ?? true),
              })
            );
            setAds(mapped);
          }
        }

        if (statsRes.ok) {
          const statsData = await statsRes.json();
          if (typeof statsData.totalPmpEarned === "number") {
            setTotalPmpEarned(statsData.totalPmpEarned);
          }
        }
      } catch {
        // Fallback to MOCK_ADS when offline or unauthenticated
      }
    }
    fetchCampaignsAndStats();
  }, []);

  const filteredAds = ads.filter((ad) => {
    const matchCategory =
      selectedCategory === "전체" || ad.category === selectedCategory;
    const matchSearch =
      ad.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ad.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchSearch;
  });

  return (
    <div className="min-h-screen bg-[#090b12] text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <DomainContextHeader
          domain="consume"
          title="🎬 Major League · 시간 가치화 캠페인"
          subtitle="브랜드의 비전과 공익 메시지를 시청하고 무위험 예측 자산(PMP)을 획득하세요"
          metrics={[
            { label: "내 누적 획득", value: totalPmpEarned, unit: "PMP" },
          ]}
        >
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => handleCategoryChange(cat)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
                    selectedCategory === cat
                      ? "bg-indigo-500/20 text-indigo-200 border-indigo-400/40"
                      : "bg-slate-900/70 text-slate-400 border-slate-800 hover:text-slate-200"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="광고 제목 또는 키워드 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500/60"
              />
            </div>
          </div>
        </DomainContextHeader>

        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {filteredAds.map((ad, index) => (
              <motion.div
                key={ad.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="bg-slate-900/70 border-slate-800/90 hover:border-indigo-500/40 transition-all group overflow-hidden h-full">
                  <div className="aspect-video bg-gradient-to-br from-indigo-950/60 via-slate-900 to-slate-950 relative flex items-center justify-center border-b border-white/[0.04]">
                    <div className="text-4xl opacity-80">🎬</div>
                    {ad.isNew && (
                      <span className="absolute top-2.5 left-2.5 px-2 py-0.5 bg-indigo-500 text-white text-[10px] font-extrabold rounded">
                        NEW
                      </span>
                    )}
                    <div className="absolute bottom-2.5 right-2.5 px-2 py-0.5 bg-black/70 text-slate-200 text-xs rounded flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {ad.durationSeconds}초
                    </div>
                    <div className="absolute inset-0 bg-indigo-600/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-indigo-500 flex items-center justify-center shadow-lg">
                        <Play className="w-5 h-5 text-white ml-0.5" />
                      </div>
                    </div>
                  </div>
                  <CardContent className="p-4 space-y-3">
                    <div>
                      <p className="text-xs text-indigo-400 font-medium mb-1">
                        {ad.advertiserName}
                      </p>
                      <h3 className="font-bold text-white group-hover:text-indigo-300 transition-colors line-clamp-1">
                        {ad.title}
                      </h3>
                      <p className="text-sm text-slate-400 line-clamp-2 mt-1">
                        {ad.description}
                      </p>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                      <div className="flex items-center gap-3 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <Eye className="w-3.5 h-3.5" />
                          {ad.viewCount.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-indigo-300 font-bold text-xs">
                        <Gift className="w-3.5 h-3.5" />+{ad.rewardPmpAmount} PMP
                      </div>
                    </div>
                    <Link
                      href={`/consume/major-league/${ad.id}`}
                      className="block"
                    >
                      <Button className="w-full bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold">
                        시청하고 PMP 받기
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {filteredAds.length === 0 && (
          <div className="text-center py-16 text-slate-500">
            <Play className="w-12 h-12 mx-auto mb-3 opacity-40 text-indigo-400" />
            <p>해당 조건의 캠페인이 없습니다.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function MajorLeaguePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#090b12]" />}>
      <MajorLeagueContent />
    </Suspense>
  );
}
