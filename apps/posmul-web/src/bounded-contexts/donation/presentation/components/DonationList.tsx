"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { listDonationsAction } from "../actions";
import { DonationSearchRequest } from "../../application/dto/donation.dto";
import { DonationStatus, DonationType } from "../../domain/value-objects/donation-value-objects";
import { Badge, Button } from "../../../../shared/ui/components/base";
import {
    MotionDiv,
    MotionCard,
    staggerContainerVariants,
    fadeInVariants,
    slideUpVariants
} from "../../../../shared/ui/components/motion/MotionComponents";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Filter, ArrowRight, Heart, TrendingUp, Users } from "lucide-react";

export const DonationList: React.FC = () => {
    const router = useRouter();
    const [donations, setDonations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [status, setStatus] = useState<DonationStatus | "">("");
    const [type, setType] = useState<DonationType | "">("");

    // Stats for Hero Section (Mock data for UI demo, should be real in prod)
    const stats = [
        { label: "총 기부액", value: "12,450,000", unit: "PMC", icon: TrendingUp, color: "text-blue-500" },
        { label: "참여수", value: "1,204", unit: "명", icon: Users, color: "text-green-500" },
        { label: "진행중 캠페인", value: "42", unit: "건", icon: Heart, color: "text-red-500" },
    ];

    useEffect(() => {
        const fetchDonations = async () => {
            setLoading(true);
            try {
                const request: DonationSearchRequest = {
                    page,
                    limit: 12, // Increased limit for grid
                    status: status || undefined,
                    type: type || undefined,
                };
                const result = await listDonationsAction(request);
                if (result.success) {
                    setDonations(result.data.items);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchDonations();
    }, [page, status, type]);

    const handleCardClick = (id: string, type: string, category: string) => {
        // Depth 5 Routing: /donation/[domain]/[category]/[group]/[id]
        let domainPath = "direct";
        if (type === "INSTITUTE") domainPath = "institute";
        if (type === "OPINION_LEADER") domainPath = "opinion-leader";

        // Use lowercase category as subcategory slug, fallback to 'general'
        const categorySlug = category ? category.toLowerCase() : "general";
        const groupSlug = "default"; // Placeholder for group until data is available

        router.push(`/donation/${domainPath}/${categorySlug}/${groupSlug}/${id}`);
    };

    return (
        <MotionDiv
            initial="hidden"
            animate="visible"
            className="w-full space-y-8 pb-20"
        >
            {/* Hero Section */}
            <motion.div
                variants={fadeInVariants}
                className="relative w-full h-[300px] rounded-3xl overflow-hidden shadow-2xl"
            >
                <Image
                    src="/images/donation/hero.png"
                    alt="Donation Hero"
                    fill
                    className="object-cover"
                    priority
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-transparent flex items-center p-10">
                    <div className="text-white max-w-2xl">
                        <motion.h1
                            initial={{ opacity: 0, x: -30 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 }}
                            className="text-4xl md:text-5xl font-bold mb-4 leading-tight"
                        >
                            세상을 바꾸는 힘,<br />
                            <span className="text-orange-400">작은 기부</span>로부터 시작됩니다.
                        </motion.h1>
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.4 }}
                            className="text-lg text-gray-200 mb-8"
                        >
                            여러분의 PMC가 만드는 놀라운 변화에 동참하세요.
                        </motion.p>
                    </div>
                </div>
            </motion.div>

            {/* Stats Bar */}
            <motion.div
                variants={slideUpVariants}
                className="grid grid-cols-1 md:grid-cols-3 gap-4 -mt-16 relative z-10 px-4"
            >
                {stats.map((stat, i) => (
                    <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-100 dark:border-gray-700 flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{stat.label}</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                                {stat.value}
                                <span className="text-sm font-normal ml-1 text-gray-500">{stat.unit}</span>
                            </p>
                        </div>
                        <div className={`p-3 rounded-full bg-opacity-10 ${stat.color.replace('text', 'bg')}`}>
                            <stat.icon className={`w-6 h-6 ${stat.color}`} />
                        </div>
                    </div>
                ))}
            </motion.div>

            {/* Filters */}
            <motion.div
                variants={slideUpVariants}
                className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-100 dark:border-gray-800"
            >
                <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
                    {["ALL", ...Object.values(DonationType)].map((t) => (
                        <button
                            key={t}
                            onClick={() => setType(t === "ALL" ? "" : t as DonationType)}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${(t === "ALL" && !type) || type === t
                                ? "bg-orange-500 text-white shadow-md"
                                : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200"
                                }`}
                        >
                            {t === "ALL" ? "전체 보기" : t}
                        </button>
                    ))}
                </div>

                <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="기부 캠페인 검색..."
                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none bg-transparent"
                    />
                </div>
            </motion.div>

            {/* Content Grid */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3, 4, 5, 6].map((k) => (
                        <div key={k} className="bg-gray-100 dark:bg-gray-800 h-80 rounded-2xl animate-pulse" />
                    ))}
                </div>
            ) : (
                <MotionDiv
                    variants={staggerContainerVariants}
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                >
                    <AnimatePresence mode="popLayout">
                        {donations.map((donation) => (
                            <MotionCard
                                key={donation.id}
                                variants={fadeInVariants}
                                layout
                                onClick={() => handleCardClick(donation.id, donation.donationType, donation.category)}
                                className="cursor-pointer group flex flex-col h-full"
                            >
                                <div className="relative h-48 bg-gray-200 overflow-hidden">
                                    <Image
                                        src="/images/donation/card_placeholder.png"
                                        alt={donation.category}
                                        fill
                                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                                    />
                                    <div className="absolute top-4 left-4">
                                        <Badge className="bg-white/90 text-black backdrop-blur-sm shadow-sm">
                                            {donation.donationType}
                                        </Badge>
                                    </div>
                                </div>

                                <div className="p-6 flex-1 flex flex-col">
                                    <div className="mb-4">
                                        <p className="text-xs text-orange-500 font-semibold mb-1 uppercase tracking-wider">
                                            {donation.category}
                                        </p>
                                        <h3 className="text-xl font-bold text-gray-900 dark:text-white line-clamp-2 mb-2">
                                            {donation.title || "희망을 나누는 따뜻한 기부"}
                                            {/* Note: Title wasn't in original DTO, using fallback or would need update */}
                                        </h3>
                                        <p className="text-gray-500 dark:text-gray-400 text-sm line-clamp-2">
                                            여러분의 소중한 참여가 더 나은 세상을 만듭니다. 상세 내용을 확인해보세요.
                                        </p>
                                    </div>

                                    <div className="mt-auto">
                                        <div className="w-full bg-gray-100 dark:bg-gray-700 h-2 rounded-full overflow-hidden mb-3">
                                            <div
                                                className="bg-orange-500 h-full rounded-full"
                                                style={{ width: `${Math.min(100, (donation.amount / 100000) * 100)}%` }} // Mock progress
                                            />
                                        </div>
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="font-bold text-gray-900 dark:text-white">
                                                {donation.amount.toLocaleString()} PMC
                                            </span>
                                            <span className="text-gray-500">
                                                모금중
                                            </span>
                                        </div>

                                        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center text-orange-500 font-medium group-hover:text-orange-600 transition-colors">
                                            <span>자세히 보기</span>
                                            <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                                        </div>
                                    </div>
                                </div>
                            </MotionCard>
                        ))}
                    </AnimatePresence>
                </MotionDiv>
            )}

            {!loading && donations.length === 0 && (
                <div className="text-center py-20 text-gray-500">
                    <p className="text-lg">조건에 맞는 기부 캠페인이 없습니다.</p>
                </div>
            )}
        </MotionDiv>
    );
};

