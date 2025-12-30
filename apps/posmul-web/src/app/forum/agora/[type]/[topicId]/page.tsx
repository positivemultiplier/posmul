"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Users, MessageSquare, Vote, ThumbsUp, ThumbsDown, Send, Award, Share2, Clock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/components/base/Card";
import { Button } from "@/shared/ui/components/base";

// Mock 토론 상세 데이터
const MOCK_TOPIC = {
    id: "agora-d001",
    title: "청년 주거정책, 어떻게 개선해야 할까?",
    type: "debate",
    typeLabel: "정책 토론",
    author: "정책연구소",
    authorAvatar: "🏛️",
    createdAt: "2024-12-28",
    endDate: "2025-01-15",
    status: "active",
    pmpReward: 30,
    participantCount: 342,
    description: `
청년 주거난이 심각한 사회 문제로 대두되고 있습니다.

높은 주거비용, 부족한 공공임대주택, 청약 당첨 어려움 등 
다양한 문제를 해결하기 위한 정책 아이디어를 논의합니다.

**토론 주제**
1. 전월세 지원 확대 vs 공급 확대
2. 청약 제도 개편 방향
3. 청년 주거 관련 세제 혜택
  `.trim(),
    voting: {
        agree: 534,
        disagree: 186,
        neutral: 170,
    },
    comments: [
        {
            id: 1,
            author: "청년A",
            avatar: "👨‍💻",
            content: "전월세 지원도 중요하지만, 결국 공급을 늘려야 근본적인 해결이 됩니다. 수요만 늘고 공급이 그대로면 가격은 계속 오를 수밖에 없어요.",
            createdAt: "2시간 전",
            likes: 45,
            replies: 3,
            stance: "neutral",
        },
        {
            id: 2,
            author: "부동산전문가",
            avatar: "🏠",
            content: "공공임대를 30% 이상 늘려야 합니다. OECD 평균에도 못 미치는 수준이에요. 서울 기준 공공임대 비율이 5%도 안 됩니다.",
            createdAt: "4시간 전",
            likes: 89,
            replies: 12,
            stance: "agree",
        },
        {
            id: 3,
            author: "경제학도",
            avatar: "📊",
            content: "무조건 공급만 늘리는 건 비효율적입니다. 주거 수요가 집중된 지역에 선별적으로 공급하고, 동시에 지방 균형발전으로 수요를 분산해야죠.",
            createdAt: "어제",
            likes: 67,
            replies: 8,
            stance: "neutral",
        },
    ],
    relatedTopics: [
        { id: "agora-p002", title: "청년 주거비 지원 확대 제안" },
        { id: "agora-b003", title: "새로운 주거 형태 아이디어" },
    ],
};

function getStanceStyle(stance: string) {
    switch (stance) {
        case "agree": return "border-l-4 border-green-500 bg-green-900/10";
        case "disagree": return "border-l-4 border-red-500 bg-red-900/10";
        default: return "border-l-4 border-slate-500 bg-slate-800/50";
    }
}

export default function AgoraTopicDetailPage() {
    const params = useParams();
    const router = useRouter();
    const type = params?.type as string;
    const topicId = params?.topicId as string;

    const [userVote, setUserVote] = useState<"agree" | "disagree" | "neutral" | null>(null);
    const [newComment, setNewComment] = useState("");
    const [commentStance, setCommentStance] = useState<"agree" | "disagree" | "neutral">("neutral");

    const totalVotes = MOCK_TOPIC.voting.agree + MOCK_TOPIC.voting.disagree + MOCK_TOPIC.voting.neutral;
    const agreePercent = Math.round((MOCK_TOPIC.voting.agree / totalVotes) * 100);
    const disagreePercent = Math.round((MOCK_TOPIC.voting.disagree / totalVotes) * 100);

    const handleVote = (vote: "agree" | "disagree" | "neutral") => {
        setUserVote(vote);
        // TODO: API 호출
    };

    const handleSubmitComment = () => {
        if (!newComment.trim()) return;
        // TODO: API 호출
        setNewComment("");
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-purple-950 to-slate-950 text-slate-200">
            {/* Header */}
            <header className="sticky top-0 z-10 backdrop-blur-xl bg-purple-950/80 border-b border-purple-800/50">
                <div className="max-w-4xl mx-auto p-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button onClick={() => router.back()} className="p-2 rounded-full hover:bg-white/10 transition-colors">
                                <ArrowLeft className="w-5 h-5" />
                            </button>
                            <div className="text-sm text-slate-500">
                                <Link href="/forum/agora" className="hover:text-slate-300">Agora</Link>
                                <span className="mx-2">/</span>
                                <Link href={`/forum/agora/${type}`} className="hover:text-slate-300">{MOCK_TOPIC.typeLabel}</Link>
                            </div>
                        </div>
                        <button className="p-2 rounded-full hover:bg-white/10 transition-colors">
                            <Share2 className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
                {/* Hero Image */}
                <div className="aspect-[21/9] bg-gradient-to-br from-purple-900/50 to-slate-900 rounded-2xl flex items-center justify-center">
                    <div className="text-center">
                        <div className="text-6xl mb-4">💬</div>
                        <p className="text-purple-400 text-sm">정책 토론</p>
                    </div>
                </div>

                {/* Topic Header */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <span className="px-3 py-1 rounded-full bg-purple-900/30 text-purple-400 text-sm">{MOCK_TOPIC.typeLabel}</span>
                        <span className="px-3 py-1 rounded-full bg-green-900/30 text-green-400 text-sm">진행 중</span>
                    </div>
                    <h1 className="text-3xl font-bold text-white">{MOCK_TOPIC.title}</h1>
                    <div className="flex items-center gap-3">
                        <span className="text-2xl">{MOCK_TOPIC.authorAvatar}</span>
                        <div>
                            <p className="text-white font-medium">{MOCK_TOPIC.author}</p>
                            <p className="text-sm text-slate-500">{MOCK_TOPIC.createdAt}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-slate-500">
                        <span className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            {MOCK_TOPIC.participantCount}명 참여
                        </span>
                        <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            마감: {MOCK_TOPIC.endDate}
                        </span>
                        <span className="flex items-center gap-1 text-purple-400">
                            <Award className="w-4 h-4" />
                            참여 시 +{MOCK_TOPIC.pmpReward} PMP
                        </span>
                    </div>
                </div>

                {/* Description */}
                <Card className="bg-slate-800/50 border-slate-700">
                    <CardContent className="p-6">
                        <div className="prose prose-invert max-w-none">
                            {MOCK_TOPIC.description.split('\n').map((line, idx) => {
                                if (line.startsWith('**') && line.endsWith('**')) {
                                    return <h3 key={idx} className="text-lg font-bold text-white mt-4 mb-2">{line.replace(/\*\*/g, '')}</h3>;
                                }
                                if (line.match(/^\d+\./)) {
                                    return <li key={idx} className="text-slate-300 ml-4">{line}</li>;
                                }
                                if (line.trim()) {
                                    return <p key={idx} className="text-slate-300 mb-2">{line}</p>;
                                }
                                return null;
                            })}
                        </div>
                    </CardContent>
                </Card>

                {/* Voting Section */}
                <Card className="bg-gradient-to-br from-purple-900/30 to-slate-900 border-purple-700/50">
                    <CardHeader>
                        <CardTitle className="text-white flex items-center gap-2">
                            <Vote className="w-5 h-5" />
                            투표 현황
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Vote Bar */}
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-green-400">찬성 {agreePercent}%</span>
                                <span className="text-red-400">반대 {disagreePercent}%</span>
                            </div>
                            <div className="flex h-4 rounded-full overflow-hidden">
                                <div className="bg-green-500" style={{ width: `${agreePercent}%` }} />
                                <div className="bg-slate-600 flex-1" />
                                <div className="bg-red-500" style={{ width: `${disagreePercent}%` }} />
                            </div>
                            <div className="flex justify-between text-xs text-slate-500">
                                <span>{MOCK_TOPIC.voting.agree}표</span>
                                <span>중립 {MOCK_TOPIC.voting.neutral}표</span>
                                <span>{MOCK_TOPIC.voting.disagree}표</span>
                            </div>
                        </div>

                        {/* Vote Buttons */}
                        {!userVote ? (
                            <div className="flex gap-2">
                                <Button onClick={() => handleVote("agree")} className="flex-1 bg-green-900/50 hover:bg-green-900/70 border border-green-700">
                                    <ThumbsUp className="w-4 h-4 mr-2" /> 찬성
                                </Button>
                                <Button onClick={() => handleVote("neutral")} className="flex-1 bg-slate-700/50 hover:bg-slate-700/70 border border-slate-600">
                                    중립
                                </Button>
                                <Button onClick={() => handleVote("disagree")} className="flex-1 bg-red-900/50 hover:bg-red-900/70 border border-red-700">
                                    <ThumbsDown className="w-4 h-4 mr-2" /> 반대
                                </Button>
                            </div>
                        ) : (
                            <div className="text-center text-purple-400">
                                ✓ 투표 완료! (+5 PMP)
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Comments Section */}
                <Card className="bg-slate-900/70 border-slate-800">
                    <CardHeader>
                        <CardTitle className="text-white flex items-center gap-2">
                            <MessageSquare className="w-5 h-5" />
                            토론 ({MOCK_TOPIC.comments.length})
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Comment Input */}
                        <div className="space-y-2">
                            <div className="flex gap-2">
                                {(["agree", "neutral", "disagree"] as const).map((stance) => (
                                    <button
                                        key={stance}
                                        onClick={() => setCommentStance(stance)}
                                        className={`px-3 py-1 rounded-full text-xs ${commentStance === stance
                                                ? stance === "agree" ? "bg-green-500 text-white" : stance === "disagree" ? "bg-red-500 text-white" : "bg-slate-500 text-white"
                                                : "bg-slate-800 text-slate-400"
                                            }`}
                                    >
                                        {stance === "agree" ? "찬성" : stance === "disagree" ? "반대" : "중립"}
                                    </button>
                                ))}
                            </div>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={newComment}
                                    onChange={(e) => setNewComment(e.target.value)}
                                    placeholder="의견을 남겨주세요..."
                                    className="flex-1 px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-500"
                                />
                                <Button onClick={handleSubmitComment} className="bg-purple-600 hover:bg-purple-500">
                                    <Send className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>

                        {/* Comment List */}
                        <div className="space-y-4 pt-4">
                            {MOCK_TOPIC.comments.map((comment) => (
                                <motion.div
                                    key={comment.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={`p-4 rounded-lg ${getStanceStyle(comment.stance)}`}
                                >
                                    <div className="flex items-start gap-3">
                                        <span className="text-2xl">{comment.avatar}</span>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="font-medium text-white">{comment.author}</span>
                                                <span className="text-xs text-slate-500">{comment.createdAt}</span>
                                            </div>
                                            <p className="text-slate-300 text-sm">{comment.content}</p>
                                            <div className="flex items-center gap-4 mt-2 text-sm text-slate-500">
                                                <button className="flex items-center gap-1 hover:text-purple-400">
                                                    <ThumbsUp className="w-4 h-4" /> {comment.likes}
                                                </button>
                                                <button className="hover:text-purple-400">
                                                    답글 {comment.replies}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Related Topics */}
                <div className="space-y-4">
                    <h3 className="text-lg font-bold text-white">관련 토론</h3>
                    <div className="grid gap-4 md:grid-cols-2">
                        {MOCK_TOPIC.relatedTopics.map((related) => (
                            <Link key={related.id} href={`/forum/agora/${type}/${related.id}`}>
                                <Card className="bg-slate-800/50 border-slate-700 hover:border-purple-700/50 transition-all cursor-pointer">
                                    <CardContent className="p-4">
                                        <p className="text-white font-medium">{related.title}</p>
                                    </CardContent>
                                </Card>
                            </Link>
                        ))}
                    </div>
                </div>

                {/* Back Link */}
                <div className="text-center pt-4">
                    <Link href={`/forum/agora/${type}`} className="text-sm text-slate-500 hover:text-slate-300">
                        ← 목록으로 돌아가기
                    </Link>
                </div>
            </main>
        </div>
    );
}
