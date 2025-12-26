"use client";

import Link from "next/link";
import { MotionDiv, staggerContainerVariants, fadeInVariants } from "@/shared/ui/components/motion/MotionComponents";
import { InstituteCard, Institute } from "../../../../../bounded-contexts/donation/presentation/components/InstituteCard";

interface GroupClientProps {
    groupSlug: string;
    subcategorySlug: string;
    themeTitle: string;
    themeDescription: string;
    institutes: Institute[];
}

export function GroupClient({
    groupSlug,
    subcategorySlug,
    themeTitle,
    themeDescription,
    institutes,
}: GroupClientProps) {

    // Mock Bundle Donation Logic
    const handleBundleDonate = () => {
        alert(`'${themeTitle}' 그룹의 모든 기관에 기부합니다! (기능 준비중)`);
    };

    return (
        <div className="space-y-12 pb-20">

            {/* Theme Hero Section */}
            <div className="relative py-20 px-6 rounded-3xl overflow-hidden shadow-2xl bg-gray-900">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-900/60 to-blue-900/60" />

                {/* Content */}
                <div className="relative z-10 max-w-4xl mx-auto text-center">
                    <div className="flex items-center justify-center gap-3 mb-6">
                        <Link href={`/donation/institute/${subcategorySlug}`} className="text-sm font-medium text-gray-400 hover:text-white transition-colors">
                            ← {subcategorySlug}
                        </Link>
                        <span className="text-gray-600">/</span>
                        <span className="text-sm font-medium text-purple-400">{groupSlug}</span>
                    </div>

                    <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
                        {themeTitle}
                    </h1>
                    <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto">
                        {themeDescription}
                    </p>

                    {/* Campaign Progress (Mock) */}
                    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 max-w-xl mx-auto mb-10 border border-white/10">
                        <div className="flex justify-between text-sm text-gray-300 mb-2">
                            <span>공동 목표 달성률</span>
                            <span className="font-bold text-white">78%</span>
                        </div>
                        <div className="w-full bg-gray-700/50 rounded-full h-3 mb-4">
                            <div className="bg-gradient-to-r from-purple-500 to-blue-500 h-3 rounded-full" style={{ width: '78%' }} />
                        </div>
                        <div className="flex justify-between items-center">
                            <div className="text-left">
                                <div className="text-xs text-gray-400">참여 인원</div>
                                <div className="font-bold text-white">1,240명</div>
                            </div>
                            <div className="text-right">
                                <div className="text-xs text-gray-400">모금액</div>
                                <div className="font-bold text-purple-400">45.2M PMC</div>
                            </div>
                        </div>
                    </div>

                    {/* Bundle Action */}
                    <button
                        onClick={handleBundleDonate}
                        className="px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white rounded-xl font-bold text-lg shadow-lg shadow-purple-500/30 transition-all transform hover:scale-105"
                    >
                        🎁 이 그룹에 한 번에 기부하기
                    </button>
                </div>
            </div>

            {/* Institute Grid */}
            <div className="max-w-7xl mx-auto">
                <div className="flex items-center gap-2 mb-8 px-2">
                    <span className="text-2xl">🤝</span>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">참여 기관 ({institutes.length})</h2>
                </div>

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
            </div>

        </div>
    );
}
