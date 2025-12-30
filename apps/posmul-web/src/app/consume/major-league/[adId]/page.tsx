"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Play, Clock, Gift, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Card, CardContent } from "@/shared/ui/components/base/Card";
import { Button } from "@/shared/ui/components/base";

// Mock 광고 데이터
const MOCK_AD = {
    id: "ad-001",
    title: "친환경 라이프스타일 브랜드 'GreenLife'",
    description: `
GreenLife는 지속 가능한 미래를 위해 만들어진 친환경 라이프스타일 브랜드입니다.

우리는 일회용 플라스틱을 줄이고, 재활용 소재를 활용하여 일상용품을 만듭니다.
이번 캠페인에서는 새로 출시된 '에코 텀블러' 시리즈를 소개합니다.

💚 100% 재활용 가능한 스테인리스 스틸
💚 BPA-FREE 안전한 소재
💚 24시간 보온/12시간 보냉

당신의 작은 선택이 지구를 바꿉니다.
  `.trim(),
    videoUrl: "https://example.com/video.mp4",
    thumbnailUrl: "/images/eco-tumbler.jpg",
    durationSeconds: 30,
    rewardPmpAmount: 50,
    advertiserName: "GreenLife Korea",
    campaignTitle: "2024 에코 라이프 캠페인",
    category: "라이프스타일",
};

export default function MajorLeagueDetailPage() {
    const params = useParams();
    const router = useRouter();
    const adId = params?.adId as string;

    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [isCompleted, setIsCompleted] = useState(false);
    const [rewardClaimed, setRewardClaimed] = useState(false);

    // 광고 재생 시뮬레이션
    useEffect(() => {
        if (!isPlaying) return;

        const interval = setInterval(() => {
            setProgress((prev) => {
                if (prev >= 100) {
                    clearInterval(interval);
                    setIsCompleted(true);
                    setIsPlaying(false);
                    return 100;
                }
                return prev + (100 / MOCK_AD.durationSeconds);
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [isPlaying]);

    const handlePlay = () => {
        if (isCompleted) return;
        setIsPlaying(true);
    };

    const handleClaimReward = () => {
        if (!isCompleted || rewardClaimed) return;
        setRewardClaimed(true);
        // TODO: 실제 보상 지급 API 호출
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-indigo-950 to-slate-950 text-slate-200">
            {/* Header */}
            <header className="sticky top-0 z-10 backdrop-blur-xl bg-indigo-950/80 border-b border-indigo-800/50">
                <div className="max-w-4xl mx-auto p-4">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => router.back()}
                            className="p-2 rounded-full hover:bg-white/10 transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div>
                            <p className="text-xs text-indigo-400">{MOCK_AD.category}</p>
                            <h1 className="text-lg font-bold">{MOCK_AD.campaignTitle}</h1>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
                {/* Video Player Area */}
                <Card className="bg-slate-900/70 border-slate-800 overflow-hidden">
                    <div className="aspect-video bg-slate-800 relative flex items-center justify-center">
                        {!isPlaying && !isCompleted && (
                            <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={handlePlay}
                                className="w-20 h-20 rounded-full bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/30"
                            >
                                <Play className="w-8 h-8 text-white ml-1" />
                            </motion.button>
                        )}
                        {isPlaying && (
                            <div className="text-center">
                                <div className="text-6xl font-bold text-indigo-400 mb-2">
                                    {Math.ceil(MOCK_AD.durationSeconds - (progress / 100) * MOCK_AD.durationSeconds)}s
                                </div>
                                <p className="text-slate-400">시청 중...</p>
                            </div>
                        )}
                        {isCompleted && (
                            <div className="text-center">
                                <CheckCircle className="w-16 h-16 text-emerald-400 mx-auto mb-2" />
                                <p className="text-emerald-400 font-bold">시청 완료!</p>
                            </div>
                        )}
                        {/* Progress Bar */}
                        {(isPlaying || isCompleted) && (
                            <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-700">
                                <motion.div
                                    className="h-full bg-indigo-500"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${progress}%` }}
                                />
                            </div>
                        )}
                    </div>
                </Card>

                {/* Ad Info */}
                <Card className="bg-slate-900/70 border-slate-800">
                    <CardContent className="p-6 space-y-4">
                        <div className="flex items-start justify-between">
                            <div>
                                <h2 className="text-xl font-bold text-white">{MOCK_AD.title}</h2>
                                <p className="text-sm text-slate-400">{MOCK_AD.advertiserName}</p>
                            </div>
                            <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-indigo-900/40 text-indigo-400 text-sm font-medium">
                                <Gift className="w-4 h-4" />
                                +{MOCK_AD.rewardPmpAmount} PMP
                            </div>
                        </div>

                        <div className="flex items-center gap-4 text-sm text-slate-400">
                            <span className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                {MOCK_AD.durationSeconds}초
                            </span>
                        </div>

                        <div className="pt-4 border-t border-slate-800">
                            <h3 className="text-sm font-medium text-slate-300 mb-2">캠페인 소개</h3>
                            <p className="text-slate-400 text-sm whitespace-pre-line leading-relaxed">
                                {MOCK_AD.description}
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Reward Action */}
                {isCompleted && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <Button
                            onClick={handleClaimReward}
                            disabled={rewardClaimed}
                            className={`w-full py-4 text-lg font-bold ${rewardClaimed
                                    ? "bg-slate-700 text-slate-400"
                                    : "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500"
                                }`}
                        >
                            {rewardClaimed ? (
                                <span className="flex items-center justify-center gap-2">
                                    <CheckCircle className="w-5 h-5" />
                                    {MOCK_AD.rewardPmpAmount} PMP 획득 완료
                                </span>
                            ) : (
                                `${MOCK_AD.rewardPmpAmount} PMP 받기`
                            )}
                        </Button>
                    </motion.div>
                )}

                {/* Back Link */}
                <div className="text-center">
                    <Link
                        href="/consume/major-league"
                        className="text-sm text-slate-500 hover:text-slate-300 transition-colors"
                    >
                        ← 목록으로 돌아가기
                    </Link>
                </div>
            </main>
        </div>
    );
}
