"use client";

import React, { useState, useEffect } from "react";
import { MessageSquare, Lightbulb, Vote, Users, Search, Award, Clock, ShieldCheck, CheckCircle2, UserCheck } from "lucide-react";
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
    agreeVotes?: number;
    disagreeVotes?: number;
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
        agreeVotes: 620,
        disagreeVotes: 270,
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
        agreeVotes: 180,
        disagreeVotes: 65,
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
        agreeVotes: 950,
        disagreeVotes: 250,
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
        agreeVotes: 200,
        disagreeVotes: 120,
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
    const [userPmgPower, setUserPmgPower] = useState(320);
    const [realTopics, setRealTopics] = useState<AgoraTopic[]>([]);

    // Delegation Modal State
    const [isDelegateModalOpen, setIsDelegateModalOpen] = useState(false);
    const [delegateTarget, setDelegateTarget] = useState("김OO 정책전문가");
    const [isDelegating, setIsDelegating] = useState(false);
    const [delegatedLeader, setDelegatedLeader] = useState<string | null>(null);

    useEffect(() => {
        const fetchRealForumPosts = async () => {
            try {
                const res = await fetch("/api/admin/forum");
                const data = await res.json();
                if (data.success && data.posts) {
                    const mapped: AgoraTopic[] = data.posts.map((p: any) => ({
                        id: p.post_id || p.id,
                        title: p.title,
                        description: p.content,
                        type: "debate",
                        author: "시민참여단",
                        createdAt: new Date(p.created_at).toISOString().slice(0, 10),
                        participantCount: 150,
                        commentCount: 42,
                        voteCount: 300,
                        agreeVotes: 210,
                        disagreeVotes: 90,
                        status: "active",
                        pmpReward: 30,
                        isHot: true,
                    }));
                    setRealTopics(mapped);
                }
            } catch (e) {
                console.error("Failed to fetch real forum posts:", e);
            }
        };

        fetchRealForumPosts();
    }, []);

    const handleVote = async (e: React.MouseEvent, topicId: string, voteType: "AGREE" | "DISAGREE") => {
        e.preventDefault();
        e.stopPropagation();

        try {
            const res = await fetch("/api/forum/vote", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    topicId,
                    voteType,
                    pmgWeight: userPmgPower,
                }),
            });

            const data = await res.json();
            if (data.success) {
                alert(`🗳️ 표결 완료! (${voteType === "AGREE" ? "찬성" : "반대"} 표결, 의결권 ${userPmgPower} PMG 반영 완료)`);
            } else {
                alert(`투표 실패: ${data.error}`);
            }
        } catch (err: any) {
            alert(`오류 발생: ${err.message}`);
        }
    };

    const handleDelegateSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsDelegating(true);

        try {
            const res = await fetch("/api/forum/delegate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    delegateToName: delegateTarget,
                    pmgAmount: userPmgPower,
                }),
            });

            const data = await res.json();
            if (data.success) {
                setDelegatedLeader(delegateTarget);
                alert(data.message);
                setIsDelegateModalOpen(false);
            } else {
                alert(data.error || "위임 실패");
            }
        } catch (err: any) {
            alert("위임 도중 오류 발생");
        } finally {
            setIsDelegating(false);
        }
    };

    const allTopics = [...realTopics, ...MOCK_TOPICS];

    const filteredTopics = allTopics.filter((topic) => {
        const matchCategory = selectedCategory === "all" || topic.type === selectedCategory;
        const matchSearch = topic.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            topic.description.toLowerCase().includes(searchQuery.toLowerCase());
        return matchCategory && matchSearch;
    });

    return (
        <div className="min-h-screen bg-gradient-to-b from-purple-950 to-slate-950 text-slate-200">
            {/* Header */}
            <header className="sticky top-0 z-10 backdrop-blur-xl bg-purple-950/80 border-b border-purple-800/50">
                <div className="max-w-4xl mx-auto p-4">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h1 className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                                💬 Agora
                            </h1>
                            <p className="text-sm text-purple-400/70">직접민주주의 · 의결권 표결 & 위임 (Liquid Democracy)</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setIsDelegateModalOpen(true)}
                                className="px-3.5 py-1.5 rounded-xl bg-indigo-900/60 hover:bg-indigo-800/80 border border-indigo-500/40 text-xs font-semibold text-indigo-300 transition flex items-center gap-1.5 shadow"
                            >
                                <UserCheck className="w-4 h-4 text-indigo-400" />
                                {delegatedLeader ? `위임 중: ${delegatedLeader}` : "의결권 위임하기"}
                            </button>
                            <div className="text-right hidden sm:block">
                                <p className="text-xs text-slate-400">내 PMG 의결권</p>
                                <p className="text-xl font-bold text-indigo-400">
                                    <span className="text-2xl">{userPmgPower}</span>
                                    <span className="text-sm ml-1">PMG</span>
                                </p>
                            </div>
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

            {/* Topic Grid */}
            <main className="max-w-4xl mx-auto px-4 pb-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <AnimatePresence mode="popLayout">
                        {filteredTopics.map((topic) => {
                            const statusInfo = getStatusStyle(topic.status);
                            const agree = topic.agreeVotes || 100;
                            const disagree = topic.disagreeVotes || 50;
                            const totalV = agree + disagree;
                            const agreeRatio = Math.round((agree / totalV) * 100);

                            return (
                                <motion.div
                                    key={topic.id}
                                    layout
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ duration: 0.2 }}
                                >
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
                                            </div>

                                            <CardContent className="p-4 space-y-3">
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

                                                {/* 찬반 게이지 프로그레스 바 */}
                                                <div className="space-y-1 pt-1">
                                                    <div className="flex justify-between text-[11px] font-semibold">
                                                        <span className="text-emerald-400">찬성 {agreeRatio}%</span>
                                                        <span className="text-pink-400">반대 {100 - agreeRatio}%</span>
                                                    </div>
                                                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden flex">
                                                        <div className="bg-emerald-500 h-full transition-all" style={{ width: `${agreeRatio}%` }} />
                                                        <div className="bg-pink-500 h-full transition-all" style={{ width: `${100 - agreeRatio}%` }} />
                                                    </div>
                                                </div>

                                                {/* 찬반 바로 투표 버튼 */}
                                                <div className="grid grid-cols-2 gap-2 pt-2">
                                                    <button
                                                        onClick={(e) => handleVote(e, topic.id, "AGREE")}
                                                        className="py-1.5 rounded-lg bg-emerald-950/60 hover:bg-emerald-900 border border-emerald-800/60 text-emerald-300 text-xs font-bold transition flex items-center justify-center gap-1"
                                                    >
                                                        👍 찬성 투표
                                                    </button>
                                                    <button
                                                        onClick={(e) => handleVote(e, topic.id, "DISAGREE")}
                                                        className="py-1.5 rounded-lg bg-pink-950/60 hover:bg-pink-900 border border-pink-800/60 text-pink-300 text-xs font-bold transition flex items-center justify-center gap-1"
                                                    >
                                                        👎 반대 투표
                                                    </button>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </Link>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>
            </main>

            {/* Delegation Modal */}
            <AnimatePresence>
                {isDelegateModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-slate-900 border border-indigo-800/60 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4"
                        >
                            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                    <ShieldCheck className="w-5 h-5 text-indigo-400" /> Liquid Democracy 의결권 위임
                                </h3>
                                <button
                                    onClick={() => setIsDelegateModalOpen(false)}
                                    className="text-slate-400 hover:text-white text-sm"
                                >
                                    ✕
                                </button>
                            </div>

                            <form onSubmit={handleDelegateSubmit} className="space-y-4">
                                <p className="text-xs text-slate-300">
                                    보유하신 <strong className="text-indigo-400">{userPmgPower} PMG</strong> 의결권을 신뢰하는 정책 전문가나 대표 리더에게 일임하여 안건 표결 시 대리권을 부여합니다. (언제든지 철회 가능)
                                </p>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-400 mb-1">위임 대상 리더 선택</label>
                                    <select
                                        value={delegateTarget}
                                        onChange={(e) => setDelegateTarget(e.target.value)}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                                    >
                                        <option value="김OO 정책전문가">🏛️ 김OO 정책전문가 (청년주거 전문)</option>
                                        <option value="환경시민연대 대표">🌱 환경시민연대 대표 (기후위기 전문)</option>
                                        <option value="박OO 경제학 박사">📊 박OO 경제학 박사 (지역경제 전문)</option>
                                    </select>
                                </div>

                                <div className="pt-2 flex items-center justify-end gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setIsDelegateModalOpen(false)}
                                        className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300"
                                    >
                                        취소
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isDelegating}
                                        className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white shadow disabled:opacity-50"
                                    >
                                        {isDelegating ? "위임 처리 중..." : "의결권 위임 완료"}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

