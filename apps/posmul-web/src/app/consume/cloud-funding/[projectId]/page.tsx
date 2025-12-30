"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Target, Users, Clock, Heart, Share2, TrendingUp, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Card, CardContent } from "@/shared/ui/components/base/Card";
import { Button } from "@/shared/ui/components/base";

// Mock 펀딩 프로젝트 데이터
const MOCK_PROJECT = {
    id: "cf-001",
    title: "신인 작가의 첫 에세이집 출간",
    creatorName: "김지은 작가",
    creatorBio: "10년간 광고 카피라이터로 활동하다, 일상의 순간들을 글로 담고 싶어 작가로 전향했습니다.",
    category: "출판",
    description: `
# 프로젝트 소개

안녕하세요, 김지은 작가입니다.

저는 지난 10년간 광고 카피라이터로 일하며 수많은 브랜드의 이야기를 만들어왔습니다.
그러다 문득 깨달았어요. 정작 제 이야기는 쓰지 못하고 있었다는 것을.

## 📖 이 책에 담긴 이야기

- 출퇴근길 지하철에서 마주친 따뜻한 순간들
- 동네 카페 사장님과의 소소한 대화
- 비 오는 날 창가에서 바라본 풍경
- 오래된 LP판에서 흘러나오는 음악과 추억

## 🎁 후원자 특전

1등 (10만원 이상): 친필 사인본 + 작가와의 북토크 초대
2등 (5만원 이상): 친필 사인본 + 독점 굿즈 세트
3등 (3만원 이상): 친필 사인본

## 📅 일정

- 펀딩 마감: 2025년 1월 31일
- 초판 발행: 2025년 3월 예정
- 리워드 발송: 2025년 3월 중순
  `.trim(),
    targetAmount: 5000000,
    currentAmount: 3750000,
    investorCount: 127,
    daysRemaining: 12,
    status: "active" as const,
    updates: [
        { id: 1, date: "2024.12.28", title: "표지 디자인 공개!", content: "드디어 표지 디자인이 확정되었습니다. 따뜻한 느낌을 살리기 위해..." },
        { id: 2, date: "2024.12.20", title: "목차 구성 완료", content: "총 4개의 챕터로 구성하였습니다. 각 챕터는..." },
    ],
};

// 금액 포맷팅
function formatAmount(amount: number): string {
    if (amount >= 10000) {
        return `${Math.floor(amount / 10000)}만`;
    }
    return amount.toLocaleString();
}

// 투자 금액 옵션
const INVEST_OPTIONS = [10000, 30000, 50000, 100000];

export default function CloudFundingDetailPage() {
    const params = useParams();
    const router = useRouter();
    const projectId = params?.projectId as string;

    const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
    const [customAmount, setCustomAmount] = useState("");
    const [isInvested, setIsInvested] = useState(false);
    const [isLiked, setIsLiked] = useState(false);

    const progress = Math.min(Math.round((MOCK_PROJECT.currentAmount / MOCK_PROJECT.targetAmount) * 100), 100);

    const handleInvest = () => {
        const amount = selectedAmount || parseInt(customAmount) || 0;
        if (amount < 1000) {
            alert("최소 1,000원 이상 투자해주세요.");
            return;
        }
        // TODO: 투자 API 호출
        setIsInvested(true);
    };

    const handleShare = () => {
        navigator.clipboard.writeText(window.location.href);
        alert("링크가 복사되었습니다!");
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-violet-950 to-slate-950 text-slate-200">
            {/* Header */}
            <header className="sticky top-0 z-10 backdrop-blur-xl bg-violet-950/80 border-b border-violet-800/50">
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
                                <p className="text-xs text-violet-400">{MOCK_PROJECT.category}</p>
                                <h1 className="text-lg font-bold line-clamp-1">{MOCK_PROJECT.title}</h1>
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
                {/* Hero */}
                <div className="aspect-video bg-slate-800 rounded-2xl flex items-center justify-center text-4xl text-slate-600">
                    프로젝트 이미지
                </div>

                {/* Progress Card */}
                <Card className="bg-slate-900/70 border-slate-800">
                    <CardContent className="p-6 space-y-4">
                        <h2 className="text-xl font-bold text-white">{MOCK_PROJECT.title}</h2>
                        <p className="text-sm text-slate-400">{MOCK_PROJECT.creatorName}</p>

                        {/* Progress Bar */}
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="font-bold text-violet-400 text-2xl">{progress}%</span>
                                <span className="text-slate-400">D-{MOCK_PROJECT.daysRemaining}</span>
                            </div>
                            <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden">
                                <motion.div
                                    className="h-full bg-gradient-to-r from-violet-500 to-purple-500"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${progress}%` }}
                                    transition={{ duration: 0.5, ease: "easeOut" }}
                                />
                            </div>
                            <div className="flex justify-between text-sm text-slate-400">
                                <span>
                                    <strong className="text-white">{formatAmount(MOCK_PROJECT.currentAmount)}원</strong> 달성
                                </span>
                                <span>목표 {formatAmount(MOCK_PROJECT.targetAmount)}원</span>
                            </div>
                        </div>

                        {/* Stats */}
                        <div className="flex items-center gap-6 text-sm pt-2">
                            <div className="flex items-center gap-2 text-slate-400">
                                <Users className="w-4 h-4" />
                                <span><strong className="text-white">{MOCK_PROJECT.investorCount}</strong>명 참여</span>
                            </div>
                            <div className="flex items-center gap-2 text-slate-400">
                                <Clock className="w-4 h-4" />
                                <span><strong className="text-white">{MOCK_PROJECT.daysRemaining}</strong>일 남음</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Invest Section */}
                {!isInvested ? (
                    <Card className="bg-slate-900/70 border-violet-700/50">
                        <CardContent className="p-6 space-y-4">
                            <h3 className="font-bold text-white">투자 금액 선택</h3>
                            <div className="grid grid-cols-4 gap-2">
                                {INVEST_OPTIONS.map((option) => (
                                    <button
                                        key={option}
                                        onClick={() => { setSelectedAmount(option); setCustomAmount(""); }}
                                        className={`py-3 rounded-lg text-sm font-medium transition-all ${selectedAmount === option
                                                ? "bg-violet-600 text-white"
                                                : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                                            }`}
                                    >
                                        {formatAmount(option)}원
                                    </button>
                                ))}
                            </div>
                            <div className="relative">
                                <input
                                    type="number"
                                    placeholder="직접 입력 (최소 1,000원)"
                                    value={customAmount}
                                    onChange={(e) => { setCustomAmount(e.target.value); setSelectedAmount(null); }}
                                    className="w-full px-4 py-3 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder:text-slate-500 focus:outline-none focus:border-violet-500"
                                />
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500">원</span>
                            </div>
                            <Button
                                onClick={handleInvest}
                                disabled={!selectedAmount && !customAmount}
                                className="w-full py-4 text-lg font-bold bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 disabled:bg-slate-700 disabled:text-slate-500"
                            >
                                <Heart className="w-5 h-5 mr-2" />
                                투자하기
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                        <Card className="bg-emerald-900/30 border-emerald-700/50">
                            <CardContent className="p-6 text-center">
                                <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-2" />
                                <p className="text-emerald-400 font-bold text-lg">투자 완료!</p>
                                <p className="text-slate-400 text-sm mt-1">프로젝트 성공을 함께 응원해주세요 💚</p>
                            </CardContent>
                        </Card>
                    </motion.div>
                )}

                {/* Description */}
                <Card className="bg-slate-900/70 border-slate-800">
                    <CardContent className="p-6">
                        <h3 className="font-bold text-white mb-4">프로젝트 소개</h3>
                        <div className="prose prose-invert prose-sm max-w-none">
                            <p className="text-slate-400 whitespace-pre-line leading-relaxed">
                                {MOCK_PROJECT.description}
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Updates */}
                <Card className="bg-slate-900/70 border-slate-800">
                    <CardContent className="p-6">
                        <h3 className="font-bold text-white mb-4">업데이트 ({MOCK_PROJECT.updates.length})</h3>
                        <div className="space-y-4">
                            {MOCK_PROJECT.updates.map((update) => (
                                <div key={update.id} className="pb-4 border-b border-slate-800 last:border-0 last:pb-0">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="font-medium text-white">{update.title}</span>
                                        <span className="text-xs text-slate-500">{update.date}</span>
                                    </div>
                                    <p className="text-sm text-slate-400 line-clamp-2">{update.content}</p>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Back Link */}
                <div className="text-center">
                    <Link
                        href="/consume/cloud-funding"
                        className="text-sm text-slate-500 hover:text-slate-300 transition-colors"
                    >
                        ← 목록으로 돌아가기
                    </Link>
                </div>
            </main>
        </div>
    );
}
