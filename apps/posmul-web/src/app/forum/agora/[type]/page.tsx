"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
import { MessageSquare, Lightbulb, Vote, Users, Search, ArrowLeft, Award } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/components/base/Card";

// 유형 정보
const TYPE_INFO: Record<string, { title: string; description: string; icon: React.ReactNode; color: string }> = {
    brainstorm: {
        title: "브레인스토밍",
        description: "자유로운 아이디어 제안 및 발전",
        icon: <Lightbulb className="w-5 h-5" />,
        color: "from-yellow-500 to-orange-500"
    },
    debate: {
        title: "정책 토론",
        description: "찬반 토론 및 다양한 관점 논의",
        icon: <MessageSquare className="w-5 h-5" />,
        color: "from-blue-500 to-indigo-500"
    },
    proposal: {
        title: "시민 제안",
        description: "정책 제안 및 투표",
        icon: <Vote className="w-5 h-5" />,
        color: "from-green-500 to-emerald-500"
    },
};

// Mock 주제 데이터
const MOCK_TOPICS = [
    {
        id: "agora-b001",
        title: "지역 대중교통 개선 아이디어",
        description: "버스 노선, 배차 간격, 요금 정책 등 대중교통 개선 아이디어를 자유롭게 제안해주세요.",
        type: "brainstorm",
        author: "시민참여단",
        createdAt: "2024-12-28",
        participantCount: 128,
        commentCount: 67,
        voteCount: 245,
        status: "active",
        pmpReward: 20,
    },
    {
        id: "agora-b002",
        title: "공원 활성화 방안",
        description: "우리 동네 공원을 더 활기차게 만들 아이디어를 모집합니다.",
        type: "brainstorm",
        author: "구청 공원과",
        createdAt: "2024-12-25",
        participantCount: 89,
        commentCount: 45,
        voteCount: 156,
        status: "active",
        pmpReward: 20,
    },
    {
        id: "agora-d001",
        title: "청년 주거정책 토론",
        description: "전월세 지원, 공공임대, 청약 제도 등 청년 주거난 해결 방안을 논의합니다.",
        type: "debate",
        author: "정책연구소",
        createdAt: "2024-12-28",
        participantCount: 342,
        commentCount: 156,
        voteCount: 890,
        status: "active",
        pmpReward: 30,
    },
    {
        id: "agora-p001",
        title: "탄소중립 실천 시민 제안",
        description: "일상에서 실천할 수 있는 탄소중립 아이디어를 제안해주세요.",
        type: "proposal",
        author: "환경시민연대",
        createdAt: "2024-12-25",
        participantCount: 567,
        commentCount: 234,
        voteCount: 1200,
        status: "voting",
        pmpReward: 50,
    },
];

function getStatusStyle(status: string) {
    switch (status) {
        case "active": return "bg-green-900/30 text-green-400";
        case "voting": return "bg-yellow-900/30 text-yellow-400";
        case "concluded": return "bg-slate-700/30 text-slate-400";
        default: return "bg-slate-700/30 text-slate-400";
    }
}

function getStatusLabel(status: string) {
    switch (status) {
        case "active": return "진행 중";
        case "voting": return "투표 중";
        case "concluded": return "종료";
        default: return status;
    }
}

export default function AgoraTypePage() {
    const params = useParams();
    const type = params?.type as string;
    const typeInfo = TYPE_INFO[type] || { title: type, description: "", icon: null, color: "from-slate-500 to-slate-600" };

    const [searchQuery, setSearchQuery] = useState("");

    const filteredTopics = MOCK_TOPICS.filter((topic) => {
        const matchType = topic.type === type;
        const matchSearch = topic.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            topic.description.toLowerCase().includes(searchQuery.toLowerCase());
        return matchType && matchSearch;
    });

    return (
        <div className="min-h-screen bg-gradient-to-b from-purple-950 to-slate-950 text-slate-200">
            {/* Header */}
            <header className="border-b border-purple-800/50">
                <div className="max-w-4xl mx-auto p-4">
                    {/* Breadcrumb */}
                    <div className="flex items-center gap-2 text-sm text-slate-500 mb-4">
                        <Link href="/forum" className="hover:text-slate-300">Forum</Link>
                        <span>/</span>
                        <Link href="/forum/agora" className="hover:text-slate-300">Agora</Link>
                        <span>/</span>
                        <span className="text-slate-300">{typeInfo.title}</span>
                    </div>

                    <div className="flex items-center gap-4 mb-4">
                        <Link href="/forum/agora" className="p-2 rounded-full hover:bg-white/10 transition-colors">
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                        <div className="flex items-center gap-3">
                            <span className={`p-2 rounded-lg bg-gradient-to-r ${typeInfo.color}`}>
                                {typeInfo.icon}
                            </span>
                            <div>
                                <h1 className={`text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r ${typeInfo.color}`}>
                                    {typeInfo.title}
                                </h1>
                                <p className="text-sm text-slate-400">{typeInfo.description}</p>
                            </div>
                        </div>
                    </div>

                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                        <input
                            type="text"
                            placeholder="주제 검색..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-900/80 border border-slate-700 
                         text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-purple-500 transition-all"
                        />
                    </div>
                </div>
            </header>

            {/* Topic List */}
            <main className="max-w-4xl mx-auto px-4 py-6">
                <div className="space-y-4">
                    <AnimatePresence mode="popLayout">
                        {filteredTopics.map((topic) => (
                            <motion.div
                                key={topic.id}
                                layout
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                            >
                                <Link href={`/forum/agora/${type}/${topic.id}`}>
                                    <Card className="bg-slate-900/70 border-slate-800 hover:border-purple-700/50 transition-all cursor-pointer group">
                                        <CardHeader className="pb-2">
                                            <div className="flex items-start justify-between">
                                                <span className={`px-2 py-0.5 rounded-full text-xs ${getStatusStyle(topic.status)}`}>
                                                    {getStatusLabel(topic.status)}
                                                </span>
                                                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-900/30 text-purple-400 text-xs">
                                                    <Award className="w-3 h-3" />
                                                    +{topic.pmpReward} PMP
                                                </span>
                                            </div>
                                            <CardTitle className="text-lg text-white group-hover:text-purple-400 transition-colors">
                                                {topic.title}
                                            </CardTitle>
                                            <p className="text-sm text-slate-400 line-clamp-2">{topic.description}</p>
                                        </CardHeader>
                                        <CardContent className="pt-2">
                                            <div className="flex items-center justify-between text-sm text-slate-500">
                                                <div className="flex items-center gap-4">
                                                    <span className="flex items-center gap-1">
                                                        <Users className="w-4 h-4" />
                                                        {topic.participantCount}명
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
                                                <span className="text-xs">{topic.createdAt}</span>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </Link>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>

                {filteredTopics.length === 0 && (
                    <div className="text-center py-16 text-slate-500">
                        <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>해당 유형의 주제가 없습니다.</p>
                    </div>
                )}
            </main>
        </div>
    );
}
