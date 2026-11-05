"use client";

import React, { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { MapPin, Store, Star, Award, QrCode, Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/ui/components/base/Card";
import { Button } from "@/shared/ui/components/base";
import { DomainContextHeader } from "@/shared/ui/components/layout/DomainContextHeader";

interface MerchantData {
  id: string;
  name: string;
  category: string;
  categorySlug: string;
  description: string;
  address: string;
  rating: number;
  reviewCount: number;
  rewardRate: number;
  isOpen: boolean;
  imageUrl?: string;
}

const MOCK_MERCHANTS: MerchantData[] = [
  {
    id: "m-001",
    name: "동네 카페 '따뜻함'",
    category: "카페",
    categorySlug: "cafe",
    description:
      "직접 로스팅한 원두로 내린 커피. 따뜻한 분위기의 동네 사랑방.",
    address: "서울시 강남구 역삼동 123-45",
    rating: 4.8,
    reviewCount: 127,
    rewardRate: 5,
    isOpen: true,
  },
  {
    id: "m-002",
    name: "할머니 손칼국수",
    category: "음식점",
    categorySlug: "restaurant",
    description: "3대째 이어오는 손칼국수 비법. 푸짐한 양과 정직한 맛.",
    address: "서울시 강남구 삼성동 67-89",
    rating: 4.9,
    reviewCount: 312,
    rewardRate: 7,
    isOpen: true,
  },
  {
    id: "m-003",
    name: "청년 서점",
    category: "서점·문화",
    categorySlug: "bookstore",
    description: "독립출판물과 큐레이션된 도서들. 작은 책방의 큰 이야기.",
    address: "서울시 강남구 논현동 22-11",
    rating: 4.7,
    reviewCount: 89,
    rewardRate: 3,
    isOpen: false,
  },
  {
    id: "m-004",
    name: "건강한 빵집",
    category: "카페",
    categorySlug: "cafe",
    description: "유기농 밀가루와 천연 발효종으로 만드는 건강한 빵.",
    address: "서울시 강남구 대치동 55-99",
    rating: 4.6,
    reviewCount: 203,
    rewardRate: 4,
    isOpen: true,
  },
];

const CATEGORIES = [
  { key: "all", label: "전체 상점" },
  { key: "cafe", label: "카페" },
  { key: "restaurant", label: "음식점" },
  { key: "bookstore", label: "서점·문화" },
];

function mapCategoryToSlug(raw: string): string {
  if (raw.includes("카페") || raw.includes("베이커리") || raw === "cafe")
    return "cafe";
  if (raw.includes("음식") || raw.includes("식당") || raw === "restaurant")
    return "restaurant";
  if (raw.includes("서점") || raw.includes("문화") || raw === "bookstore")
    return "bookstore";
  return "cafe";
}

function MinorLeagueContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryCategory = searchParams?.get("category") || "all";

  const [merchants, setMerchants] = useState<MerchantData[]>(MOCK_MERCHANTS);
  const [selectedCategory, setSelectedCategory] = useState(queryCategory);
  const [searchQuery, setSearchQuery] = useState("");
  const [totalPmcEarned, setTotalPmcEarned] = useState(2450);

  useEffect(() => {
    setSelectedCategory(queryCategory);
  }, [queryCategory]);

  const handleCategoryChange = (key: string) => {
    setSelectedCategory(key);
    if (key === "all") {
      router.push("/consume/minor-league");
    } else {
      router.push(`/consume/minor-league?category=${key}`);
    }
  };

  useEffect(() => {
    async function fetchStoresAndPayments() {
      try {
        const [storesRes, paymentsRes] = await Promise.all([
          fetch("/api/consume/money/stores"),
          fetch("/api/consume/money/payment"),
        ]);

        if (storesRes.ok) {
          const data = await storesRes.json();
          const list = Array.isArray(data.stores) ? data.stores : [];
          if (list.length > 0) {
            const mapped: MerchantData[] = list.map(
              (item: Record<string, unknown>) => {
                const rawCat = String(item.category ?? "카페");
                return {
                  id: String(item.id ?? ""),
                  name: String(item.name ?? "상생 매장"),
                  category: rawCat,
                  categorySlug: mapCategoryToSlug(rawCat),
                  description: String(item.description ?? ""),
                  address: String(item.address ?? ""),
                  rating: Number(item.rating ?? 4.8),
                  reviewCount: Number(item.review_count ?? 10),
                  rewardRate: Math.round(Number(item.pmc_rate ?? 0.05) * 100),
                  isOpen: Boolean(item.is_active ?? true),
                };
              }
            );
            setMerchants(mapped);
          }
        }

        if (paymentsRes.ok) {
          const payData = await paymentsRes.json();
          if (typeof payData.totalPmcEarned === "number") {
            setTotalPmcEarned(payData.totalPmcEarned);
          }
        }
      } catch {
        // Keep fallback MOCK_MERCHANTS
      }
    }
    fetchStoresAndPayments();
  }, []);

  const filteredMerchants = merchants.filter((m) => {
    const matchCategory =
      selectedCategory === "all" || m.categorySlug === selectedCategory;
    const matchSearch =
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchSearch;
  });

  const handleQrPayment = (merchantId: string) => {
    router.push(`/consume/minor-league/${merchantId}`);
  };

  return (
    <div className="min-h-screen bg-[#090b12] text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <DomainContextHeader
          domain="consume"
          title="🏪 Minor League · 지역 상생 매장"
          subtitle="동네 소상공인 매장에서 착한 소비로 결제하고 사회적 가치 자산(PMC)을 적립하세요"
          metrics={[
            { label: "내 상생 적립", value: totalPmcEarned, unit: "PMC" },
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
                      ? "bg-indigo-500/20 text-indigo-200 border-indigo-400/40"
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
                placeholder="상점명 또는 키워드 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500/60"
              />
            </div>
          </div>
        </DomainContextHeader>

        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {filteredMerchants.map((merchant) => (
              <motion.div
                key={merchant.id}
                layout
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.2 }}
              >
                <Card
                  onClick={() => handleQrPayment(merchant.id)}
                  className="bg-slate-900/70 border-slate-800/90 hover:border-indigo-500/40 transition-all group overflow-hidden cursor-pointer h-full"
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            merchant.isOpen ? "bg-emerald-400" : "bg-slate-500"
                          }`}
                        />
                        <span className="text-xs text-slate-400">
                          {merchant.isOpen ? "영업 중" : "영업 종료"}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-xs font-bold">
                        <Award className="w-3 h-3" />+{merchant.rewardRate}% PMC
                      </div>
                    </div>
                    <CardTitle className="text-lg text-white group-hover:text-indigo-300 transition-colors mt-1">
                      {merchant.name}
                    </CardTitle>
                    <p className="text-sm text-slate-400 line-clamp-2">
                      {merchant.description}
                    </p>
                  </CardHeader>
                  <CardContent className="pt-2">
                    <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-800/80">
                      <div className="flex items-center gap-3 text-slate-400">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-indigo-400" />
                          {merchant.category}
                        </span>
                        <span className="flex items-center gap-1">
                          <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                          {merchant.rating} ({merchant.reviewCount})
                        </span>
                      </div>
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleQrPayment(merchant.id);
                        }}
                        disabled={!merchant.isOpen}
                        className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 text-white text-xs font-bold"
                        size="sm"
                      >
                        <QrCode className="w-3.5 h-3.5" />
                        결제·적립
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {filteredMerchants.length === 0 && (
          <div className="text-center py-16 text-slate-500">
            <Store className="w-12 h-12 mx-auto mb-4 opacity-40 text-indigo-400" />
            <p>조건에 맞는 상생 매장이 없습니다.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function MinorLeaguePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#090b12]" />}>
      <MinorLeagueContent />
    </Suspense>
  );
}
