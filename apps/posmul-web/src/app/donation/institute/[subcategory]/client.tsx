"use client";

import { useState } from "react";
import Link from "next/link";
import { MotionDiv, staggerContainerVariants, fadeInVariants } from "@/shared/ui/components/motion/MotionComponents";
import { InstituteCard, Institute } from "../../../../bounded-contexts/donation/presentation/components/InstituteCard";

interface CategoryClientProps {
    categorySlug: string;
    categoryLabel: string;
    categoryIcon: string;
    institutes: Institute[];
}

export function CategoryClient({
    categorySlug,
    categoryLabel,
    categoryIcon,
    institutes,
}: CategoryClientProps) {

    // Advanced Filters (Mock)
    const [filterRegion, setFilterRegion] = useState("all");
    const [sortBy, setSortBy] = useState("trust");

    return (
        <div className="space-y-12 pb-20">

            {/* Category Header */}
            <div className={`relative py-16 px-4 rounded-3xl overflow-hidden shadow-2xl bg-gradient-to-br from-gray-900 to-gray-800`}>
                {/* Background Pattern */}
                <div className="absolute top-0 right-0 p-12 opacity-10 text-9xl transform rotate-12 select-none pointer-events-none">
                    {categoryIcon}
                </div>

                <div className="relative z-10 max-w-4xl mx-auto">
                    <div className="flex items-center gap-3 mb-4">
                        <Link href="/donation/institute" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">
                            ← 돌아가기
                        </Link>
                        <span className="text-gray-600">/</span>
                        <span className="text-sm font-medium text-emerald-400">{categoryLabel}</span>
                    </div>

                    <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 flex items-center gap-4">
                        <span>{categoryIcon}</span>
                        <span>{categoryLabel}</span>
                    </h1>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
                        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                            <div className="text-sm text-gray-400 mb-1">총 등록 기관</div>
                            <div className="text-2xl font-bold text-white">{institutes.length}개</div>
                        </div>
                        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                            <div className="text-sm text-gray-400 mb-1">총 누적 기부</div>
                            <div className="text-2xl font-bold text-emerald-400">12.5M PMC</div>
                        </div>
                        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                            <div className="text-sm text-gray-400 mb-1">평균 신뢰도</div>
                            <div className="text-2xl font-bold text-yellow-400">9.2/10</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Advanced Filter Bar */}
            <div className="sticky top-20 z-30 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
                        <span className="text-sm font-bold text-gray-700 dark:text-gray-300 whitespace-nowrap">지역 필터:</span>
                        {["전체", "서울", "경기", "부산", "제주"].map(region => (
                            <button
                                key={region}
                                onClick={() => setFilterRegion(region)}
                                className={`px-3 py-1.5 rounded-lg text-sm transition-colors whitespace-nowrap ${filterRegion === region
                                        ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-medium"
                                        : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400"
                                    }`}
                            >
                                {region}
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="bg-transparent border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 text-sm focus:ring-emerald-500 focus:border-emerald-500"
                        >
                            <option value="trust">신뢰도순</option>
                            <option value="latest">최신순</option>
                            <option value="popular">인기순</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Filtered Grid */}
            <MotionDiv
                variants={staggerContainerVariants}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
                {institutes.map((institute) => (
                    <MotionDiv key={institute.id} variants={fadeInVariants}>
                        <InstituteCard institute={institute} />
                    </MotionDiv>
                ))}
            </MotionDiv>

            {institutes.length === 0 && (
                <div className="py-20 text-center text-gray-500">
                    해당 카테고리에 등록된 기관이 없습니다.
                </div>
            )}

        </div>
    );
}
