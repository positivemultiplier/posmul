"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, MapPin, Star, Phone, Clock, QrCode, Heart, Share2 } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Card, CardContent } from "@/shared/ui/components/base/Card";
import { Button } from "@/shared/ui/components/base";

// Mock 상점 데이터
const MOCK_MERCHANT = {
    id: "m-001",
    name: "동네 카페 '따뜻함'",
    category: "카페",
    description: `
직접 로스팅한 원두로 내린 커피를 제공하는 따뜻한 분위기의 동네 카페입니다.

☕ 시그니처 메뉴
- 따뜻함 라떼: 직접 로스팅한 원두와 유기농 우유의 조화
- 수제 당근케이크: 매일 아침 직접 굽는 건강한 디저트
- 계절 과일 에이드: 제철 과일로 만든 상큼한 음료

🌿 공간 특징
- 반려동물 동반 가능
- 노트북 작업 가능 (콘센트 완비)
- 무료 Wi-Fi

📍 영업시간
- 평일: 08:00 - 22:00
- 주말: 09:00 - 21:00
  `.trim(),
    address: "서울시 강남구 역삼동 123-45",
    phone: "02-1234-5678",
    rating: 4.8,
    reviewCount: 127,
    rewardRate: 5,
    isOpen: true,
    openHours: "08:00 - 22:00",
    images: ["/images/cafe1.jpg", "/images/cafe2.jpg"],
    tags: ["반려동물", "WiFi", "작업하기좋은"],
};

// Mock 리뷰 데이터
const MOCK_REVIEWS = [
    { id: 1, author: "커피러버", rating: 5, content: "원두가 정말 신선하고 맛있어요! 사장님도 친절하시고 ☺️", date: "2024.12.25" },
    { id: 2, author: "동네주민", rating: 5, content: "단골이에요. 분위기도 좋고 케이크가 진짜 맛있습니다.", date: "2024.12.20" },
    { id: 3, author: "라떼맛집", rating: 4, content: "라떼가 부드럽고 달지 않아서 좋아요. 자주 올게요~", date: "2024.12.15" },
];

export default function MinorLeagueDetailPage() {
    const params = useParams();
    const router = useRouter();
    const merchantId = params?.merchantId as string;

    const [isLiked, setIsLiked] = useState(false);

    const handleQrPayment = () => {
        // TODO: QR 결제 플로우 연동
        alert("QR 결제 시작");
    };

    const handleShare = () => {
        // TODO: 공유 기능
        navigator.clipboard.writeText(window.location.href);
        alert("링크가 복사되었습니다!");
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-emerald-950 to-slate-950 text-slate-200">
            {/* Header */}
            <header className="sticky top-0 z-10 backdrop-blur-xl bg-emerald-950/80 border-b border-emerald-800/50">
                <div className="max-w-4xl mx-auto p-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => router.back()}
                                className="p-2 rounded-full hover:bg-white/10 transition-colors"
                            >
                                <ArrowLeft className="w-5 h-5" />
                            </button>
                            <div>
                                <p className="text-xs text-emerald-400">{MOCK_MERCHANT.category}</p>
                                <h1 className="text-lg font-bold">{MOCK_MERCHANT.name}</h1>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setIsLiked(!isLiked)}
                                className={`p-2 rounded-full transition-colors ${isLiked ? "bg-red-500/20 text-red-400" : "hover:bg-white/10"}`}
                            >
                                <Heart className={`w-5 h-5 ${isLiked ? "fill-current" : ""}`} />
                            </button>
                            <button
                                onClick={handleShare}
                                className="p-2 rounded-full hover:bg-white/10 transition-colors"
                            >
                                <Share2 className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
                {/* Hero Image */}
                <div className="aspect-video bg-slate-800 rounded-2xl flex items-center justify-center text-4xl text-slate-600">
                    상점 이미지
                </div>

                {/* Basic Info Card */}
                <Card className="bg-slate-900/70 border-slate-800">
                    <CardContent className="p-6 space-y-4">
                        <div className="flex items-start justify-between">
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <span className={`w-2 h-2 rounded-full ${MOCK_MERCHANT.isOpen ? "bg-emerald-400" : "bg-slate-500"}`} />
                                    <span className="text-sm text-slate-400">{MOCK_MERCHANT.isOpen ? "영업 중" : "영업 종료"}</span>
                                </div>
                                <h2 className="text-2xl font-bold text-white">{MOCK_MERCHANT.name}</h2>
                            </div>
                            <div className="text-right">
                                <div className="flex items-center gap-1 text-yellow-400 mb-1">
                                    <Star className="w-5 h-5 fill-current" />
                                    <span className="font-bold text-lg">{MOCK_MERCHANT.rating}</span>
                                </div>
                                <p className="text-xs text-slate-500">리뷰 {MOCK_MERCHANT.reviewCount}개</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-900/30 text-emerald-400 w-fit">
                            <span className="text-sm font-medium">PMC +{MOCK_MERCHANT.rewardRate}% 적립</span>
                        </div>

                        <div className="space-y-2 text-sm text-slate-400">
                            <div className="flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-slate-500" />
                                {MOCK_MERCHANT.address}
                            </div>
                            <div className="flex items-center gap-2">
                                <Phone className="w-4 h-4 text-slate-500" />
                                {MOCK_MERCHANT.phone}
                            </div>
                            <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-slate-500" />
                                {MOCK_MERCHANT.openHours}
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-2 pt-2">
                            {MOCK_MERCHANT.tags.map((tag) => (
                                <span key={tag} className="px-2 py-1 text-xs bg-slate-800 text-slate-400 rounded-full">
                                    #{tag}
                                </span>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Description */}
                <Card className="bg-slate-900/70 border-slate-800">
                    <CardContent className="p-6">
                        <h3 className="font-bold text-white mb-3">상점 소개</h3>
                        <p className="text-slate-400 text-sm whitespace-pre-line leading-relaxed">
                            {MOCK_MERCHANT.description}
                        </p>
                    </CardContent>
                </Card>

                {/* Reviews */}
                <Card className="bg-slate-900/70 border-slate-800">
                    <CardContent className="p-6">
                        <h3 className="font-bold text-white mb-4">리뷰 ({MOCK_REVIEWS.length})</h3>
                        <div className="space-y-4">
                            {MOCK_REVIEWS.map((review) => (
                                <div key={review.id} className="pb-4 border-b border-slate-800 last:border-0 last:pb-0">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium text-white text-sm">{review.author}</span>
                                            <div className="flex items-center text-yellow-400">
                                                {[...Array(review.rating)].map((_, i) => (
                                                    <Star key={i} className="w-3 h-3 fill-current" />
                                                ))}
                                            </div>
                                        </div>
                                        <span className="text-xs text-slate-500">{review.date}</span>
                                    </div>
                                    <p className="text-sm text-slate-400">{review.content}</p>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* QR Payment Button */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <Button
                        onClick={handleQrPayment}
                        disabled={!MOCK_MERCHANT.isOpen}
                        className="w-full py-4 text-lg font-bold flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:bg-slate-700 disabled:text-slate-500"
                    >
                        <QrCode className="w-5 h-5" />
                        QR 결제하기
                    </Button>
                </motion.div>

                {/* Back Link */}
                <div className="text-center">
                    <Link
                        href="/consume/minor-league"
                        className="text-sm text-slate-500 hover:text-slate-300 transition-colors"
                    >
                        ← 목록으로 돌아가기
                    </Link>
                </div>
            </main>
        </div>
    );
}
