"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { getDonationAction } from "../actions";
import { DonationStatus } from "../../domain/value-objects/donation-value-objects";
import { Badge, Button } from "../../../../shared/ui/components/base";
import {
    MotionDiv,
    fadeInVariants,
    slideUpVariants
} from "../../../../shared/ui/components/motion/MotionComponents";
import { ArrowLeft, Share2, Calendar, Tag, CheckCircle, Info } from "lucide-react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

interface DonationDetailProps {
    donationId: string;
}

export const DonationDetail: React.FC<DonationDetailProps> = ({ donationId }) => {
    const router = useRouter();
    const [donation, setDonation] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchDonation = async () => {
            setLoading(true);
            setError(null);
            try {
                const result = await getDonationAction(donationId);
                if (result.success) {
                    setDonation(result.data);
                } else {
                    setError("Donation not found");
                }
            } catch (err) {
                setError("An error occurred while fetching donation details");
            } finally {
                setLoading(false);
            }
        };

        if (donationId) {
            fetchDonation();
        }
    }, [donationId]);

    if (loading) return (
        <div className="flex justify-center items-center min-h-[50vh]">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
        </div>
    );

    if (error) return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">오류 발생</h2>
            <p className="text-gray-500 mb-4">{error}</p>
            <Button onClick={() => router.back()} variant="outline">돌아가기</Button>
        </div>
    );

    if (!donation) return null;

    return (
        <MotionDiv
            initial="hidden"
            animate="visible"
            className="w-full pb-20 relative"
        >
            {/* Navigation & Header */}
            <motion.div variants={fadeInVariants} className="sticky top-0 z-30 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 px-4 py-3 flex justify-between items-center">
                <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
                    <ArrowLeft className="w-6 h-6 text-gray-700 dark:text-gray-300" />
                </button>
                <div className="flex items-center gap-2">
                    <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
                        <Share2 className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                    </button>
                </div>
            </motion.div>

            <div className="max-w-4xl mx-auto px-4 py-8">
                {/* Hero Banner Area */}
                <motion.div
                    variants={slideUpVariants}
                    className="relative w-full h-[300px] md:h-[400px] rounded-3xl overflow-hidden shadow-xl mb-8 group"
                >
                    <Image
                        src="/images/donation/hero.png" // Ideally specific campaign image
                        alt="Campaign Hero"
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-700"
                        priority
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-8">
                        <Badge className="bg-orange-500 text-white border-0 mb-4 self-start">
                            {donation.category}
                        </Badge>
                        <h1 className="text-3xl md:text-5xl font-bold text-white mb-2 leading-tight">
                            {donation.title || "희망을 나누는 따뜻한 기부"}
                        </h1>
                        <p className="text-white/80 text-lg line-clamp-2 max-w-2xl">
                            함께 만드는 변화의 시작, 여러분의 작은 관심이 큰 기적을 만듭니다.
                        </p>
                    </div>
                </motion.div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <motion.div variants={slideUpVariants} className="lg:col-span-2 space-y-8">
                        {/* Status/Progress Section */}
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <p className="text-sm text-gray-500 font-medium mb-1">모금 현황</p>
                                    <p className="text-3xl font-bold text-orange-500 tabular-nums">
                                        {donation.amount.toLocaleString()} <span className="text-lg text-gray-400 font-normal">PMC</span>
                                    </p>
                                </div>
                                <Badge className={
                                    donation.status === DonationStatus.COMPLETED ? "bg-green-100 text-green-800 hover:bg-green-200" :
                                        donation.status === DonationStatus.PENDING ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-200" :
                                            "bg-gray-100 text-gray-800"
                                }>
                                    {donation.status === "COMPLETED" ? "모금 완료" : "모금 진행중"}
                                </Badge>
                            </div>

                            <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden mb-2">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${Math.min(100, (donation.amount / 100000) * 100)}%` }} // Mock target
                                    transition={{ duration: 1, delay: 0.5 }}
                                    className="h-full bg-orange-500 rounded-full"
                                />
                            </div>
                            <div className="flex justify-between text-xs text-gray-400">
                                <span>현재 모금액</span>
                                <span>목표 10,000,000 PMC</span>
                            </div>
                        </div>

                        {/* Description */}
                        <div className="prose dark:prose-invert max-w-none">
                            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                                <Info className="w-5 h-5 text-orange-500" />
                                캠페인 소개
                            </h3>
                            <div className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-2xl text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                                {donation.description}
                            </div>
                        </div>

                        {/* Details Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-100 dark:border-gray-700 flex items-start gap-3">
                                <Calendar className="w-5 h-5 text-gray-400 mt-1" />
                                <div>
                                    <p className="text-xs text-gray-500 mb-1">기부 일시</p>
                                    <p className="font-medium">{new Date(donation.createdAt).toLocaleDateString()}</p>
                                </div>
                            </div>
                            <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-100 dark:border-gray-700 flex items-start gap-3">
                                <Tag className="w-5 h-5 text-gray-400 mt-1" />
                                <div>
                                    <p className="text-xs text-gray-500 mb-1">기부 유형</p>
                                    <p className="font-medium">{donation.donationType}</p>
                                </div>
                            </div>
                        </div>

                        {/* Beneficiary Info */}
                        {donation.beneficiaryInfo && (
                            <div className="bg-orange-50 dark:bg-orange-950/20 p-6 rounded-2xl border border-orange-100 dark:border-orange-900/30">
                                <h4 className="font-bold text-orange-800 dark:text-orange-200 mb-2">수혜자 정보</h4>
                                <div className="space-y-4">
                                    <div>
                                        <p className="text-sm text-orange-600/70 dark:text-orange-400/70">이름/대상</p>
                                        <p className="font-medium text-orange-900 dark:text-orange-100">{donation.beneficiaryInfo.name}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-orange-600/70 dark:text-orange-400/70">설명</p>
                                        <p className="text-orange-900 dark:text-orange-100">{donation.beneficiaryInfo.description}</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </motion.div>

                    {/* Sidebar / CTA */}
                    <motion.div variants={slideUpVariants} className="lg:col-span-1">
                        <div className="sticky top-24 space-y-4">
                            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-lg">
                                <h3 className="font-bold mb-4">참여 정보</h3>
                                <div className="space-y-3 mb-6">
                                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                                        <CheckCircle className="w-4 h-4 text-green-500" />
                                        <span>{donation.metadata?.taxDeductible ? "세액공제 가능" : "세액공제 불가"}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                                        <CheckCircle className="w-4 h-4 text-green-500" />
                                        <span>{donation.metadata?.receiptRequired ? "영수증 발급 가능" : "영수증 미발급"}</span>
                                    </div>
                                </div>

                                <Button className="w-full h-12 text-lg font-bold bg-orange-500 hover:bg-orange-600 text-white rounded-xl shadow-lg shadow-orange-500/20 transform hover:-translate-y-1 transition-all duration-200">
                                    지금 기부하기
                                </Button>
                                <p className="text-center text-xs text-gray-400 mt-4">
                                    안전하고 투명하게 전달됩니다.
                                </p>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </MotionDiv>
    );
};

