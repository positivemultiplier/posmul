"use client";

import React, { useState, useEffect } from "react";
import { MapPin, Store, Star, Award, QrCode, Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/components/base/Card";
import { Button } from "@/shared/ui/components/base";

// 임시 Mock 데이터 타입
interface MerchantData {
    id: string;
    name: string;
    category: string;
    description: string;
    address: string;
    rating: number;
    reviewCount: number;
    rewardRate: number; // % PMC 적립률
    isOpen: boolean;
    imageUrl?: string;
}

// Mock Merchant 데이터
const MOCK_MERCHANTS: MerchantData[] = [
    {
        id: "m-001",
        name: "동네 카페 '따뜻함'",
        category: "카페",
        description: "직접 로스팅한 원두로 내린 커피. 따뜻한 분위기의 동네 사랑방.",
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
        category: "서점",
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
        category: "베이커리",
        description: "유기농 밀가루와 천연 발효종으로 만드는 건강한 빵.",
        address: "서울시 강남구 대치동 55-99",
        rating: 4.6,
        reviewCount: 203,
        rewardRate: 4,
        isOpen: true,
    },
];

// 카테고리 필터
const CATEGORIES = ["전체", "카페", "음식점", "서점", "베이커리", "기타"];

export default function MinorLeaguePage() {
    const [merchants, setMerchants] = useState<MerchantData[]>(MOCK_MERCHANTS);
    const [selectedCategory, setSelectedCategory] = useState("전체");
    const [searchQuery, setSearchQuery] = useState("");
    const [totalPmcEarned] = useState(2450); // Mock 누적 적립 PMC

    // 필터링 로직
    const filteredMerchants = merchants.filter((m) => {
        const matchCategory = selectedCategory === "전체" || m.category === selectedCategory;
        const matchSearch = m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            m.description.toLowerCase().includes(searchQuery.toLowerCase());
        return matchCategory && matchSearch;
    });

    const handleQrPayment = (merchantId: string) => {
        // TODO: QR 결제 플로우 연동
        alert(`QR 결제 시작: ${merchantId}`);
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-emerald-950 to-slate-950 text-slate-200">
            {/* Header */}
            <header className="sticky top-0 z-10 backdrop-blur-xl bg-emerald-950/80 border-b border-emerald-800/50">
                <div className="max-w-4xl mx-auto p-4">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h1 className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">
                                Minor League
                            </h1>
                            <p className="text-sm text-emerald-400/70">지역 상생 · 착한 소비</p>
                        </div>
                        <div className="text-right">
                            <p className="text-xs text-slate-400">내 누적 적립</p>
                            <p className="text-xl font-bold text-emerald-400">
                                <span className="text-2xl">{totalPmcEarned.toLocaleString()}</span>
                                <span className="text-sm ml-1">PMC</span>
                            </p>
                        </div>
                    </div>

                    {/* 검색 */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                        <input
                            type="text"
                            placeholder="상점명 또는 키워드 검색..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-900/80 border border-slate-700 
                         text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500
                         focus:ring-1 focus:ring-emerald-500/50 transition-all"
                        />
                    </div>
                </div>
            </header>

            {/* Category Tabs */}
            <div className="max-w-4xl mx-auto px-4 py-4 overflow-x-auto">
                <div className="flex gap-2">
                    {CATEGORIES.map((cat) => (
                        <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all
                ${selectedCategory === cat
                                    ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/25"
                                    : "bg-slate-800/50 text-slate-400 hover:bg-slate-700/50 hover:text-slate-300"
                                }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            {/* Merchant List */}
            <main className="max-w-4xl mx-auto px-4 pb-8">
                <div className="grid gap-4 md:grid-cols-2">
                    <AnimatePresence mode="popLayout">
                        {filteredMerchants.map((merchant) => (
                            <motion.div
                                key={merchant.id}
                                layout
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ duration: 0.2 }}
                            >
                                <Card className="bg-slate-900/70 border-slate-800 hover:border-emerald-700/50 transition-all group overflow-hidden">
                                    <CardHeader className="pb-2">
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center gap-2">
                                                <span className={`w-2 h-2 rounded-full ${merchant.isOpen ? "bg-emerald-400" : "bg-slate-500"}`} />
                                                <span className="text-xs text-slate-500">{merchant.isOpen ? "영업 중" : "영업 종료"}</span>
                                            </div>
                                            <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-900/40 text-emerald-400 text-xs font-medium">
                                                <Award className="w-3 h-3" />
                                                +{merchant.rewardRate}% PMC
                                            </div>
                                        </div>
                                        <CardTitle className="text-lg text-white group-hover:text-emerald-400 transition-colors">
                                            {merchant.name}
                                        </CardTitle>
                                        <p className="text-sm text-slate-400 line-clamp-2">{merchant.description}</p>
                                    </CardHeader>
                                    <CardContent className="pt-2">
                                        <div className="flex items-center justify-between text-sm">
                                            <div className="flex items-center gap-4 text-slate-400">
                                                <span className="flex items-center gap-1">
                                                    <MapPin className="w-4 h-4" />
                                                    {merchant.category}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                                                    {merchant.rating} ({merchant.reviewCount})
                                                </span>
                                            </div>
                                            <Button
                                                onClick={() => handleQrPayment(merchant.id)}
                                                disabled={!merchant.isOpen}
                                                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 disabled:text-slate-500"
                                                size="sm"
                                            >
                                                <QrCode className="w-4 h-4" />
                                                결제
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
                        <Store className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>검색 결과가 없습니다.</p>
                    </div>
                )}
            </main>
        </div>
    );
}
