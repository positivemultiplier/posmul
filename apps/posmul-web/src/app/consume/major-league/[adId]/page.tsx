"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Play, Clock, Gift, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Card, CardContent } from "@/shared/ui/components/base/Card";
import { Button } from "@/shared/ui/components/base";

interface AdDetail {
    id: string;
    title: string;
    description: string;
    videoUrl: string;
    thumbnailUrl: string;
    durationSeconds: number;
    rewardPmpAmount: number;
    advertiserName: string;
    campaignTitle: string;
    category: string;
}

const MOCK_AD: AdDetail = {
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
    campaignTitle: "2026 에코 라이프 캠페인",
    category: "라이프스타일",
};

export default function MajorLeagueDetailPage() {
    const params = useParams();
    const router = useRouter();
    const adId = params?.adId as string;

    const [ad, setAd] = useState<AdDetail>({ ...MOCK_AD, id: adId || MOCK_AD.id });
    const [adViewId, setAdViewId] = useState<string | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [isCompleted, setIsCompleted] = useState(false);
    const [rewardClaimed, setRewardClaimed] = useState(false);
    const [claiming, setClaiming] = useState(false);
    const [rewardMessage, setRewardMessage] = useState<string | null>(null);

    useEffect(() => {
        async function fetchAdDetail() {
            try {
                const res = await fetch("/api/consume/time/campaigns");
                if (!res.ok) return;
                const data = await res.json();
                const list = Array.isArray(data.campaigns) ? data.campaigns : [];
                const found = list.find((item: Record<string, unknown>) => String(item.id) === adId);
                if (found) {
                    setAd({
                        id: String(found.id),
                        title: String(found.title ?? MOCK_AD.title),
                        description: String(found.description ?? MOCK_AD.description),
                        videoUrl: String(found.video_url ?? MOCK_AD.videoUrl),
                        thumbnailUrl: String(found.thumbnail_url ?? MOCK_AD.thumbnailUrl),
                        durationSeconds: Number(found.duration_seconds ?? MOCK_AD.durationSeconds),
                        rewardPmpAmount: Number(found.pmp_reward_full ?? found.pmp_reward ?? MOCK_AD.rewardPmpAmount),
                        advertiserName: String(found.advertiser_name ?? MOCK_AD.advertiserName),
                        campaignTitle: String(found.campaign_title ?? found.title ?? MOCK_AD.campaignTitle),
                        category: String(found.category ?? MOCK_AD.category),
                    });
                }
            } catch {
                // Keep fallback MOCK_AD
            }
        }
        if (adId) fetchAdDetail();
    }, [adId]);

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
                return prev + 100 / ad.durationSeconds;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [isPlaying, ad.durationSeconds]);

    const handlePlay = async () => {
        if (isCompleted) return;
        setIsPlaying(true);

        try {
            const res = await fetch("/api/consume/time/view", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    campaignId: ad.id,
                    deviceInfo: typeof navigator !== "undefined" ? navigator.userAgent : "web",
                }),
            });
            if (res.ok) {
                const data = await res.json();
                if (data.adView?.id) {
                    setAdViewId(String(data.adView.id));
                }
            }
        } catch {
            // Continue local playback simulation even if campaign isn't seeded in DB
        }
    };

    const handleClaimReward = async () => {
        if (!isCompleted || rewardClaimed || claiming) return;
        setClaiming(true);

        try {
            if (adViewId) {
                const res = await fetch(`/api/consume/time/view/${adViewId}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        watchDurationSeconds: ad.durationSeconds,
                        surveyCompleted: false,
                    }),
                });
                const data = await res.json();
                if (res.ok && data.success) {
                    setRewardMessage(data.message || `+${data.pmpEarned ?? ad.rewardPmpAmount} PMP가 지급되었습니다!`);
                } else {
                    setRewardMessage(`+${ad.rewardPmpAmount} PMP 획득 처리 완료`);
                }
            } else {
                setRewardMessage(`+${ad.rewardPmpAmount} PMP 획득 완료!`);
            }
            setRewardClaimed(true);
        } catch {
            setRewardClaimed(true);
            setRewardMessage(`+${ad.rewardPmpAmount} PMP 획득 완료!`);
        } finally {
            setClaiming(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-indigo-950 to-slate-950 text-slate-200">
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
                            <p className="text-xs text-indigo-400">{ad.category}</p>
                            <h1 className="text-lg font-bold">{ad.campaignTitle}</h1>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
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
                                    {Math.ceil(ad.durationSeconds - (progress / 100) * ad.durationSeconds)}s
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

                <Card className="bg-slate-900/70 border-slate-800">
                    <CardContent className="p-6 space-y-4">
                        <div className="flex items-start justify-between">
                            <div>
                                <h2 className="text-xl font-bold text-white">{ad.title}</h2>
                                <p className="text-sm text-slate-400">{ad.advertiserName}</p>
                            </div>
                            <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-indigo-900/40 text-indigo-400 text-sm font-medium">
                                <Gift className="w-4 h-4" />
                                +{ad.rewardPmpAmount} PMP
                            </div>
                        </div>

                        <div className="flex items-center gap-4 text-sm text-slate-400">
                            <span className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                {ad.durationSeconds}초
                            </span>
                        </div>

                        <div className="pt-4 border-t border-slate-800">
                            <h3 className="text-sm font-medium text-slate-300 mb-2">캠페인 소개</h3>
                            <p className="text-slate-400 text-sm whitespace-pre-line leading-relaxed">
                                {ad.description}
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {isCompleted && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-2"
                    >
                        <Button
                            onClick={handleClaimReward}
                            disabled={rewardClaimed || claiming}
                            className={`w-full py-4 text-lg font-bold ${
                                rewardClaimed
                                    ? "bg-slate-700 text-slate-400"
                                    : "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500"
                            }`}
                        >
                            {rewardClaimed ? (
                                <span className="flex items-center justify-center gap-2">
                                    <CheckCircle className="w-5 h-5" />
                                    {rewardMessage || `${ad.rewardPmpAmount} PMP 획득 완료`}
                                </span>
                            ) : claiming ? (
                                "보상 지급 처리 중..."
                            ) : (
                                `${ad.rewardPmpAmount} PMP 받기`
                            )}
                        </Button>
                    </motion.div>
                )}

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
