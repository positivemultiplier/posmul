"use client";

import React, { useState, useEffect } from "react";
import { Rocket, Target, Clock, Users, Heart, TrendingUp, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/components/base/Card";
import { Button } from "@/shared/ui/components/base";

// 임시 Mock 데이터 타입
interface FundingProject {
    id: string;
    title: string;
    creatorName: string;
    category: string;
    description: string;
    targetAmount: number;
    currentAmount: number;
    investorCount: number;
    daysRemaining: number;
    imageUrl?: string;
    status: "active" | "success" | "failed";
}

// Mock 펀딩 프로젝트 데이터
const MOCK_PROJECTS: FundingProject[] = [
    {
        id: "cf-001",
        title: "신인 작가의 첫 에세이집 출간",
        creatorName: "김지은 작가",
        category: "출판",
        description: "일상의 소소한 행복을 담은 에세이. 디지털 시대에 종이책의 가치를 전합니다.",
        targetAmount: 5000000,
        currentAmount: 3750000,
        investorCount: 127,
        daysRemaining: 12,
        status: "active",
    },
    {
        id: "cf-002",
        title: "동네 반려동물 카페 오픈 프로젝트",
        creatorName: "박민수",
        category: "창업",
        description: "유기견 입양 연계와 함께하는 따뜻한 반려동물 카페를 열고 싶습니다.",
        targetAmount: 15000000,
        currentAmount: 12500000,
        investorCount: 312,
        daysRemaining: 5,
        status: "active",
    },
    {
        id: "cf-003",
        title: "청년 농부의 로컬 채소 구독 서비스",
        creatorName: "이하늘 농부",
        category: "농업",
        description: "친환경 농법으로 재배한 신선한 채소를 매주 집 앞까지 배송합니다.",
        targetAmount: 8000000,
        currentAmount: 8200000,
        investorCount: 89,
        daysRemaining: 0,
        status: "success",
    },
    {
        id: "cf-004",
        title: "독립 게임 개발: 별빛 여행자",
        creatorName: "스튜디오 문라이트",
        category: "게임",
        description: "한국적 감성을 담은 힐링 어드벤처 게임. 당신의 우주 여행을 시작하세요.",
        targetAmount: 20000000,
        currentAmount: 4500000,
        investorCount: 156,
        daysRemaining: 28,
        status: "active",
    },
];

// 카테고리 필터
const CATEGORIES = ["전체", "창업", "출판", "농업", "게임", "예술", "기타"];

// 진행률 계산
function getProgressPercent(current: number, target: number): number {
    return Math.min(Math.round((current / target) * 100), 100);
}

// 금액 포맷팅
function formatAmount(amount: number): string {
    if (amount >= 100000000) {
        return `${(amount / 100000000).toFixed(1)}억`;
    }
    if (amount >= 10000) {
        return `${Math.floor(amount / 10000)}만`;
    }
    return amount.toLocaleString();
}

export default function CloudFundingPage() {
    const [projects, setProjects] = useState<FundingProject[]>(MOCK_PROJECTS);
    const [selectedCategory, setSelectedCategory] = useState("전체");
    const [totalInvested] = useState(150000); // Mock 누적 투자 금액

    // 필터링 로직
    const filteredProjects = projects.filter((p) => {
        return selectedCategory === "전체" || p.category === selectedCategory;
    });

    const handleInvest = (projectId: string) => {
        // TODO: 투자 플로우 연동
        alert(`투자하기: ${projectId}`);
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-violet-950 to-slate-950 text-slate-200">
            {/* Header */}
            <header className="sticky top-0 z-10 backdrop-blur-xl bg-violet-950/80 border-b border-violet-800/50">
                <div className="max-w-4xl mx-auto p-4">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h1 className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-purple-400">
                                Cloud Funding
                            </h1>
                            <p className="text-sm text-violet-400/70">이웃의 꿈에 투자하세요</p>
                        </div>
                        <div className="text-right">
                            <p className="text-xs text-slate-400">내 누적 투자</p>
                            <p className="text-xl font-bold text-violet-400">
                                <span className="text-2xl">{formatAmount(totalInvested)}</span>
                                <span className="text-sm ml-1">원</span>
                            </p>
                        </div>
                    </div>

                    {/* 통계 카드 */}
                    <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-800">
                            <p className="text-xs text-slate-500">진행 중</p>
                            <p className="text-lg font-bold text-white">
                                {projects.filter(p => p.status === "active").length}
                            </p>
                        </div>
                        <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-800">
                            <p className="text-xs text-slate-500">성공</p>
                            <p className="text-lg font-bold text-emerald-400">
                                {projects.filter(p => p.status === "success").length}
                            </p>
                        </div>
                        <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-800">
                            <p className="text-xs text-slate-500">총 참여자</p>
                            <p className="text-lg font-bold text-violet-400">
                                {projects.reduce((sum, p) => sum + p.investorCount, 0)}
                            </p>
                        </div>
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
                                    ? "bg-violet-500 text-white shadow-lg shadow-violet-500/25"
                                    : "bg-slate-800/50 text-slate-400 hover:bg-slate-700/50 hover:text-slate-300"
                                }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            {/* Project List */}
            <main className="max-w-4xl mx-auto px-4 pb-8">
                <div className="space-y-4">
                    <AnimatePresence mode="popLayout">
                        {filteredProjects.map((project) => {
                            const progress = getProgressPercent(project.currentAmount, project.targetAmount);
                            const isSuccess = project.status === "success";

                            return (
                                <motion.div
                                    key={project.id}
                                    layout
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <Card className={`bg-slate-900/70 border-slate-800 hover:border-violet-700/50 transition-all overflow-hidden
                    ${isSuccess ? "border-emerald-700/50" : ""}`}>
                                        <CardHeader className="pb-2">
                                            <div className="flex items-start justify-between">
                                                <div className="flex items-center gap-2 text-xs text-slate-500">
                                                    <span className={`px-2 py-0.5 rounded-full ${isSuccess ? "bg-emerald-900/50 text-emerald-400" : "bg-violet-900/50 text-violet-400"
                                                        }`}>
                                                        {isSuccess ? "✓ 성공" : project.category}
                                                    </span>
                                                    <span>{project.creatorName}</span>
                                                </div>
                                                {!isSuccess && (
                                                    <div className="flex items-center gap-1 text-xs text-slate-400">
                                                        <Clock className="w-3 h-3" />
                                                        D-{project.daysRemaining}
                                                    </div>
                                                )}
                                            </div>
                                            <CardTitle className="text-lg text-white group-hover:text-violet-400 transition-colors">
                                                {project.title}
                                            </CardTitle>
                                            <p className="text-sm text-slate-400 line-clamp-2">{project.description}</p>
                                        </CardHeader>
                                        <CardContent className="pt-2 space-y-3">
                                            {/* Progress Bar */}
                                            <div>
                                                <div className="flex justify-between text-sm mb-1">
                                                    <span className="font-bold text-white">
                                                        {formatAmount(project.currentAmount)}원
                                                    </span>
                                                    <span className="text-slate-500">
                                                        목표 {formatAmount(project.targetAmount)}원
                                                    </span>
                                                </div>
                                                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                                                    <motion.div
                                                        className={`h-full ${isSuccess ? "bg-emerald-500" : "bg-violet-500"}`}
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${progress}%` }}
                                                        transition={{ duration: 0.5, ease: "easeOut" }}
                                                    />
                                                </div>
                                            </div>

                                            {/* Stats & Action */}
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-4 text-sm text-slate-400">
                                                    <span className="flex items-center gap-1">
                                                        <TrendingUp className="w-4 h-4" />
                                                        {progress}%
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <Users className="w-4 h-4" />
                                                        {project.investorCount}명
                                                    </span>
                                                </div>
                                                <Button
                                                    onClick={() => handleInvest(project.id)}
                                                    disabled={isSuccess}
                                                    className={`flex items-center gap-2 ${isSuccess
                                                            ? "bg-slate-700 text-slate-500"
                                                            : "bg-violet-600 hover:bg-violet-500"
                                                        }`}
                                                    size="sm"
                                                >
                                                    {isSuccess ? (
                                                        <>성공</>
                                                    ) : (
                                                        <>
                                                            <Heart className="w-4 h-4" />
                                                            투자하기
                                                        </>
                                                    )}
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>

                {filteredProjects.length === 0 && (
                    <div className="text-center py-16 text-slate-500">
                        <Rocket className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>해당 카테고리의 프로젝트가 없습니다.</p>
                    </div>
                )}
            </main>
        </div>
    );
}
