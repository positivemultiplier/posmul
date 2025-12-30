"use client";

import { useState } from "react";
import Link from "next/link";
import { MotionDiv, fadeInVariants } from "@/shared/ui/components/motion/MotionComponents";
import { SpotlightCard } from "@/shared/ui/components/motion/SpotlightCard";

interface FundingProject {
    id: string;
    title: string;
    description: string;
    category: string;
    target_beneficiary: string;
    product_name: string;
    manufacturer: string;
    unit_price: number;
    target_quantity: number;
    current_quantity: number;
    achievementRate: number;
    images: string[];
}

interface DirectDonationDetailClientProps {
    project: FundingProject;
    isLoggedIn: boolean;
    currentUserId: string | null;
}

export function DirectDonationDetailClient({
    project,
    isLoggedIn,
    currentUserId,
}: DirectDonationDetailClientProps) {
    const [donateQuantity, setDonateQuantity] = useState(1);

    const handleQuantityChange = (delta: number) => {
        setDonateQuantity(prev => Math.max(1, prev + delta));
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
            {/* Short Hero / Header */}
            <div className="bg-purple-900 text-white py-8 px-4">
                <div className="max-w-6xl mx-auto">
                    <Link href="/donation/direct" className="text-purple-200 hover:text-white text-sm flex items-center gap-1 mb-4">
                        ← 목록으로 돌아가기
                    </Link>
                    <div className="flex items-center gap-3">
                        <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-bold backdrop-blur-sm">
                            {project.manufacturer}
                        </span>
                        <span className="text-purple-200 text-sm">Global Top Tier 🏆</span>
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-4 -mt-8">
                <SpotlightCard className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 lg:gap-8">
                        {/* Left: Image & Story */}
                        <div className="p-8 lg:p-12 bg-gray-50 dark:bg-gray-800/50">
                            {/* Image Placeholder */}
                            <div className="aspect-video bg-gray-200 dark:bg-gray-700 rounded-2xl mb-8 flex items-center justify-center text-4xl text-gray-400">
                                Image
                            </div>

                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">프로젝트 이야기</h2>
                            <p className="text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                                {project.description}
                            </p>

                            <div className="mt-8 p-6 bg-purple-50 dark:bg-purple-900/10 rounded-2xl border border-purple-100 dark:border-purple-800/50">
                                <h3 className="font-bold text-purple-900 dark:text-purple-100 mb-2">물품 정보</h3>
                                <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                                    <li className="flex justify-between">
                                        <span className="text-gray-500">품명</span>
                                        <span className="font-medium">{project.product_name}</span>
                                    </li>
                                    <li className="flex justify-between">
                                        <span className="text-gray-500">제조사</span>
                                        <span className="font-medium">{project.manufacturer}</span>
                                    </li>
                                    <li className="flex justify-between">
                                        <span className="text-gray-500">단가</span>
                                        <span className="font-medium w-fit bg-purple-100 dark:bg-purple-800 px-2 rounded">
                                            {project.unit_price.toLocaleString()}원
                                        </span>
                                    </li>
                                </ul>
                            </div>
                        </div>

                        {/* Right: Funding Status & Action */}
                        <div className="p-8 lg:p-12 flex flex-col justify-center">
                            <h1 className="text-3xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4 leading-tight">
                                {project.title}
                            </h1>
                            <p className="text-xl text-gray-500 mb-8">
                                {project.target_beneficiary}에게 전달됩니다.
                            </p>

                            {/* Progress */}
                            <div className="mb-10">
                                <div className="flex justify-between items-end mb-2">
                                    <div className="text-4xl font-bold text-purple-600 dark:text-purple-400">
                                        {project.achievementRate}%
                                    </div>
                                    <div className="text-gray-500 font-medium">
                                        <strong className="text-gray-900 dark:text-white">{project.current_quantity}</strong>
                                        <span className="mx-1">/</span>
                                        {project.target_quantity}개 달성
                                    </div>
                                </div>
                                <div className="h-4 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full"
                                        style={{ width: `${project.achievementRate}%` }}
                                    />
                                </div>
                            </div>

                            {/* Action Area */}
                            <div className="bg-gray-50 dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-700">
                                <div className="mb-4 text-center text-sm text-gray-500">
                                    얼마나 선물하시겠습니까?
                                </div>

                                <div className="flex items-center justify-center gap-6 mb-8">
                                    <button
                                        onClick={() => handleQuantityChange(-1)}
                                        className="w-12 h-12 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 flex items-center justify-center text-xl font-bold hover:bg-gray-50 active:scale-95 transition-all"
                                    >
                                        -
                                    </button>
                                    <div className="text-3xl font-bold tabular-nums w-16 text-center">
                                        {donateQuantity}
                                    </div>
                                    <button
                                        onClick={() => handleQuantityChange(1)}
                                        className="w-12 h-12 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 flex items-center justify-center text-xl font-bold hover:bg-gray-50 active:scale-95 transition-all"
                                    >
                                        +
                                    </button>
                                </div>

                                <div className="flex justify-between items-center mb-6 px-4 py-3 bg-white dark:bg-gray-800 rounded-xl">
                                    <span className="text-gray-500">총 후원 금액</span>
                                    <span className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                                        {(donateQuantity * project.unit_price).toLocaleString()}원
                                    </span>
                                </div>

                                <button
                                    className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xl font-bold py-4 rounded-xl hover:shadow-lg hover:shadow-purple-500/30 transform hover:-translate-y-0.5 transition-all active:scale-95"
                                >
                                    선물하기
                                </button>
                            </div>
                        </div>
                    </div>
                </SpotlightCard>
            </div>
        </div>
    );
}
