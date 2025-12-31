"use client";

import { useMemo, useState } from "react";
import { Button, Card } from "../../../../shared/ui/components/base";
import { MessageSquare, ThumbsUp, ThumbsDown, TrendingUp, TrendingDown } from "lucide-react";
import { useRouter } from "next/navigation";

interface PredictionCommentsProps {
    gameId: string;
    predictionType: "binary" | "wdl" | "ranking";
    options: Array<{ id: string; label: string }>;
}

interface Comment {
    id: string;
    user: string;
    avatar: string;
    text: string;
    sentiment?: string; // Option ID or Label
    sentimentLabel?: string;
    timestamp: string;
    likes: number;
}

export function PredictionComments({ gameId, predictionType, options }: PredictionCommentsProps) {
    const router = useRouter();
    const [newComment, setNewComment] = useState("");
    const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);

    // Simulated Comments Data with dynamic sentiments
    const [comments, setComments] = useState<Comment[]>([
        {
            id: "1",
            user: "CryptoKing",
            avatar: "bg-blue-500",
            text: "이번엔 확실히 이쪽임. 차트가 말해주고 있다. 🚀",
            sentiment: options[0]?.id,
            sentimentLabel: options[0]?.label || "Bullish",
            timestamp: "방금 전",
            likes: 12
        },
        {
            id: "2",
            user: "BearMarket",
            avatar: "bg-red-500",
            text: "반대쪽이 무조건 이득이지.",
            sentiment: options[1]?.id,
            sentimentLabel: options[1]?.label || "Bearish",
            timestamp: "5분 전",
            likes: 8
        }
    ]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim()) return;

        const selectedOption = options.find(o => o.id === selectedOptionId);

        const comment: Comment = {
            id: Math.random().toString(36).substr(2, 9),
            user: "Me",
            avatar: "bg-purple-500",
            text: newComment,
            sentiment: selectedOptionId || undefined,
            sentimentLabel: selectedOption?.label,
            timestamp: "방금 전",
            likes: 0
        };

        setComments([comment, ...comments]);
        setNewComment("");
        // setSelectedOptionId(null); // Keep selection or clear? Keeping it might be better for multiple comments.
    };

    const renderSentimentSelector = () => {
        if (predictionType === 'binary' || predictionType === 'wdl') {
            return (
                <div className="flex flex-wrap gap-2 mb-3">
                    {options.map((option, idx) => {
                        const isSelected = selectedOptionId === option.id;
                        // Color logic: Binary (Blue/Red), WDL (Blue/Gray/Red?) or just variable colors
                        const colors = [
                            'text-blue-400 border-blue-500/50 bg-blue-500/20',
                            'text-red-400 border-red-500/50 bg-red-500/20',
                            'text-green-400 border-green-500/50 bg-green-500/20'
                        ];
                        const activeClass = colors[idx % 3];
                        const inactiveClass = 'bg-slate-800 text-slate-400 border-transparent hover:bg-slate-700';

                        return (
                            <button
                                key={option.id}
                                type="button"
                                onClick={() => setSelectedOptionId(isSelected ? null : option.id)}
                                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors border ${isSelected ? activeClass : inactiveClass}`}
                            >
                                {isSelected && <TrendingUp className="w-3 h-3 mr-1 inline" />}
                                {option.label}
                            </button>
                        );
                    })}
                </div>
            );
        }

        // For Ranking (many options), use a horizontal scroll or select
        return (
            <div className="mb-3">
                <select
                    className="bg-slate-800 text-white text-xs rounded-lg px-3 py-2 border border-white/10 focus:outline-none focus:border-blue-500"
                    value={selectedOptionId || ""}
                    onChange={(e) => setSelectedOptionId(e.target.value || null)}
                >
                    <option value="">관점 선택 (선택 안함)</option>
                    {options.map(opt => (
                        <option key={opt.id} value={opt.id}>{opt.label} 지지</option>
                    ))}
                </select>
            </div>
        );
    };

    return (
        <Card className="bg-slate-900 border-white/5 p-6">
            <div className="flex items-center gap-2 mb-6">
                <MessageSquare className="w-5 h-5 text-slate-400" />
                <h3 className="text-lg font-bold text-white">실시간 토론 ({comments.length})</h3>
            </div>

            {/* Input Area */}
            <form onSubmit={handleSubmit} className="mb-8">
                {renderSentimentSelector()}

                <div className="relative">
                    <textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="이 예측에 대한 의견을 남겨주세요..."
                        className="w-full bg-slate-950 border border-white/10 rounded-xl p-4 min-h-[100px] text-sm text-white focus:outline-none focus:border-white/20 resize-none"
                    />
                    <div className="absolute bottom-3 right-3">
                        <Button
                            type="submit"
                            disabled={!newComment.trim()}
                            className="bg-blue-600 hover:bg-blue-500 text-white text-xs px-4 py-2 h-auto"
                        >
                            등록
                        </Button>
                    </div>
                </div>
            </form>

            {/* Comment List */}
            <div className="space-y-6">
                {comments.map((comment) => (
                    <div key={comment.id} className="flex gap-4 group">
                        <div className={`w-8 h-8 rounded-full flex-shrink-0 mt-1 ${comment.avatar}`} />
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="font-bold text-slate-200 text-sm">{comment.user}</span>
                                {comment.sentimentLabel && (
                                    <span className="text-[10px] px-1.5 py-0.5 bg-white/5 text-slate-300 rounded border border-white/10">
                                        {comment.sentimentLabel}
                                    </span>
                                )}
                                <span className="text-xs text-slate-500 ml-auto">{comment.timestamp}</span>
                            </div>
                            <p className="text-slate-300 text-sm leading-relaxed mb-2">
                                {comment.text}
                            </p>
                            <div className="flex items-center gap-4">
                                <button className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors">
                                    <ThumbsUp className="w-3.5 h-3.5" />
                                    <span>{comment.likes}</span>
                                </button>
                                <button className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors">
                                    <ThumbsDown className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </Card>
    );
}
