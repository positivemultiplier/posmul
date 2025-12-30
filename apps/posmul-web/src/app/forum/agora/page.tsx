"use client";

import React, { useState } from "react";
import { MessageSquare, Lightbulb, Vote, Users, Search, Award, Clock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Card, CardContent } from "@/shared/ui/components/base/Card";

// Mock 공론장 데이터 타입
interface AgoraTopic {
    id: string;
    title: string;
    description: string;
    type: "brainstorm" | "debate" | "proposal";
    author: string;
    createdAt: string;
    endDate?: string;
    participantCount: number;
    commentCount: number;
    voteCount: number;
    status: "active" | "voting" | "concluded";
    pmpReward: number;
    isHot?: boolean;
}

// Mock 공론장 데이터
const MOCK_TOPICS: AgoraTopic[] = [
    {
        id: "agora-001",
        title: "2025년 청년 주거정책, 어떻게 개선해야 할까?",
        description: "청년 주거난 해결을 위한 정책 아이디어를 모으고 있습니다.",
        type: "debate",
        author: "정책연구소",
        createdAt: "2024-12-28",
        endDate: "2025-01-15",
        participantCount: 342,
        commentCount: 156,
        voteCount: 890,
        status: "active",
        pmpReward: 30,
        isHot: true,
    },
    {
        id: "agora-002",
        title: "지역 대중교통 개선 아이디어 브레인스토밍",
        description: "우리 동네 대중교통이 불편한가요? 개선 아이디어를 자유롭게 제안해주세요.",
        type: "brainstorm",
        author: "시민참여단",
        createdAt: "2024-12-27",
        participantCount: 128,
        commentCount: 67,
        voteCount: 245,
        status: "active",
        pmpReward: 20,
    },
    {
        id: "agora-003",
        title: "탄소중립 실천 방안에 대한 시민 제안",
        description: "일상에서 실천할 수 있는 탄소중립 아이디어를 제안해주세요.",
        type: "proposal",
        author: "환경시민연대",
        createdAt: "2024-12-25",
        participantCount: 567,
        commentCount: 234,
        voteCount: 1200,
        status: "voting",
        pmpReward: 50,
        isHot: true,
    },
    {
        id: "agora-004",
        title: "[마감] 지역 축제 예산 배분 토론",
        description: "올해 지역 축제 예산 1억원의 배분 방안에 대한 시민 토론이 종료되었습니다.",
        type: "debate",
        author: "구청 문화과",
        createdAt: "2024-12-20",
        participantCount: 89,
        commentCount: 45,
        voteCount: 320,
        status: "concluded",
        pmpReward: 25,
    },
];

// 카테고리 필터
const CATEGORIES = [
    { key: "all", label: "전체" },
    { key: "brainstorm", label: "브레인스토밍" },
    { key: "debate", label: "정책 토론" },
    { key: "proposal", label: "시민 제안" },
];

function getTypeIcon(type: string) {
    switch (type) {
        case "brainstorm": return <Lightbulb className="w-4 h-4" />;
        case "debate": return <MessageSquare className="w-4 h-4" />;
        case "proposal": return <Vote className="w-4 h-4" />;
        default: return <MessageSquare className="w-4 h-4" />;
    }
}

function getStatusStyle(status: string) {
    switch (status) {
        case "active": return { bg: "bg-green-500", text: "진행 중" };
        case "voting": return { bg: "bg-yellow-500", text: "투표 중" };
        case "concluded": return { bg: "bg-slate-600", text: "종료" };
        default: return { bg: "bg-slate-600", text: status };
    }
}

export default function ForumAgoraPage() {
    const [selectedCategory, setSelectedCategory] = useState("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [totalPmpEarned] = useState(580);

    const filteredTopics = MOCK_TOPICS.filter((topic) => {
        const matchCategory = selectedCategory === "all" || topic.type === selectedCategory;
        const matchSearch = topic.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            topic.description.toLowerCase().includes(searchQuery.toLowerCase());
        return matchCategory && matchSearch;
    });

    return (
        <div className="min-h-screen bg-gradient-to-b from-purple-950 to-slate-950 text-slate-200">
            {/* Header - Consume 스타일 */}
            <header className="sticky top-0 z-10 backdrop-blur-xl bg-purple-950/80 border-b border-purple-800/50">
                <div className="max-w-4xl mx-auto p-4">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h1 className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                                💬 Agora
                            </h1>
                            <p className="text-sm text-purple-400/70">브레인스토밍 · 토론 · 공론화</p>
                        </div>
                        <div className="text-right">
                            <p className="text-xs text-slate-400">내 누적 획득</p>
                            <p className="text-xl font-bold text-purple-400">
                                <span className="text-2xl">{totalPmpEarned}</span>
                                <span className="text-sm ml-1">PMP</span>
                            </p>
                        </div>
                    </div>

                    {/* 검색 */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                        <input
                            type="text"
                            placeholder="토론 주제 또는 키워드 검색..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-900/80 border border-slate-700 
                         text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-purple-500
                         focus:ring-1 focus:ring-purple-500/50 transition-all"
                        />
                    </div>
                </div>
            </header>

            {/* Category Tabs */}
            <div className="max-w-4xl mx-auto px-4 py-4 overflow-x-auto">
                <div className="flex gap-2">
                    {CATEGORIES.map((cat) => (
                        <button
                            key={cat.key}
                            onClick={() => setSelectedCategory(cat.key)}
                            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all
                ${selectedCategory === cat.key
                                    ? "bg-purple-500 text-white shadow-lg shadow-purple-500/25"
                                    : "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-300"
                                }`}
                        >
                            {cat.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Topic Grid - Consume 카드 스타일 */}
            <main className="max-w-4xl mx-auto px-4 pb-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <AnimatePresence mode="popLayout">
                        {filteredTopics.map((topic) => {
                            const statusInfo = getStatusStyle(topic.status);
                            return (
                                <motion.div
                                    key={topic.id}
                                    layout
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    {/* 라우팅 수정: /forum/agora/[type]/[topicId] */}
                                    <Link href={`/forum/agora/${topic.type}/${topic.id}`}>
                                        <Card className={`bg-slate-900/70 border-slate-800 hover:border-purple-700/50 transition-all cursor-pointer group overflow-hidden h-full ${topic.status === "concluded" ? "opacity-70" : ""
                                            }`}>
                                            {/* 참여 현황 히어로 영역 */}
                                            <div className="relative aspect-video bg-gradient-to-br from-purple-900/50 to-slate-900 flex items-center justify-center">
                                                <div className="text-center">
                                                    <div className="text-4xl mb-2">
                                                        {topic.type === "brainstorm" ? "💡" : topic.type === "debate" ? "💬" : "🗳️"}
                                                    </div>
                                                    <div className="flex items-center justify-center gap-4 text-sm text-slate-300">
                                                        <span className="flex items-center gap-1">
                                                            <Users className="w-4 h-4" />
                                                            {topic.participantCount}
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <MessageSquare className="w-4 h-4" />
                                                            {topic.commentCount}
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <Vote className="w-4 h-4" />
                                                            {topic.voteCount}
                                                        </span>
                                                    </div>
                                                </div>
                                                {topic.isHot && (
                                                    <span className="absolute top-2 left-2 px-2 py-0.5 rounded bg-purple-500 text-white text-xs font-bold">
                                                        HOT
                                                    </span>
                                                )}
                                                <span className={`absolute top-2 right-2 px-2 py-0.5 rounded ${statusInfo.bg} text-white text-xs font-bold`}>
                                                    {statusInfo.text}
                                                </span>
                                                {topic.endDate && topic.status !== "concluded" && (
                                                    <div className="absolute bottom-2 right-2 px-2 py-1 rounded bg-black/60 text-white text-xs flex items-center gap-1">
                                                        <Clock className="w-3 h-3" />
                                                        ~{topic.endDate}
                                                    </div>
                                                )}
                                            </div>

                                            <CardContent className="p-4 space-y-2">
                                                {/* 유형 & 작성자 */}
                                                <div className="flex items-center gap-2 text-xs text-slate-500">
                                                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-900/30 text-purple-400">
                                                        {getTypeIcon(topic.type)}
                                                        {CATEGORIES.find(c => c.key === topic.type)?.label}
                                                    </span>
                                                    <span>{topic.author}</span>
                                                </div>

                                                {/* 제목 */}
                                                <h3 className="font-bold text-white group-hover:text-purple-400 transition-colors line-clamp-2">
                                                    {topic.title}
                                                </h3>

                                                {/* 설명 */}
                                                <p className="text-sm text-slate-400 line-clamp-2">{topic.description}</p>

                                                {/* Stats */}
                                                <div className="flex items-center justify-between pt-2 text-xs text-slate-500">
                                                    <span>{topic.createdAt}</span>
                                                    <span className="flex items-center gap-1 text-purple-400 font-medium">
                                                        <Award className="w-3 h-3" />
                                                        +{topic.pmpReward} PMP
                                                    </span>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </Link>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>

                {filteredTopics.length === 0 && (
                    <div className="text-center py-16 text-slate-500">
                        <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>검색 결과가 없습니다.</p>
                    </div>
                )}
            </main>
        </div>
    );
}
