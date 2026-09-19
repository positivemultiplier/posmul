"use client";

import { useState, useEffect, useTransition } from "react";
import { Button, Card } from "../../../../shared/ui/components/base";
import { MessageSquare, ThumbsUp, TrendingUp, Sparkles, Coins, Send, CheckCircle2 } from "lucide-react";
import {
  getPredictionCommentsAction,
  addPredictionCommentAction,
  likePredictionCommentAction,
  PredictionCommentDTO,
} from "../../../../app/prediction/components/prediction-comment.actions";

interface PredictionCommentsProps {
  gameId: string;
  predictionType: "binary" | "wdl" | "ranking";
  options: Array<{ id: string; label: string }>;
}

function formatRelativeTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffSec < 60) return "방금 전";
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}분 전`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours}시간 전`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}일 전`;
    return date.toLocaleDateString();
  } catch {
    return "최근";
  }
}

export function PredictionComments({ gameId, predictionType, options }: PredictionCommentsProps) {
  const [comments, setComments] = useState<PredictionCommentDTO[]>([]);
  const [newComment, setNewComment] = useState("");
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(options[0]?.id || null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rewardNotice, setRewardNotice] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // 1. 초기 댓글 로드
  const loadComments = async () => {
    try {
      const res = await getPredictionCommentsAction(gameId);
      if (res.success) {
        setComments(res.comments);
      }
    } catch (e) {
      console.error("Failed to load comments:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadComments();
  }, [gameId]);

  // 2. 댓글 등록 및 +10 PMP 리워드 획득
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || isSubmitting) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    const selectedOption = options.find((o) => o.id === selectedOptionId);

    try {
      const res = await addPredictionCommentAction({
        gameId,
        content: newComment,
        optionId: selectedOptionId || undefined,
        optionLabel: selectedOption?.label,
      });

      if (res.success && res.comment) {
        setComments([res.comment, ...comments]);
        setNewComment("");
        setRewardNotice(`🎉 소중한 의견이 등록되었습니다! 활동 보상으로 +${res.earnedPmp ?? 10} PMP가 적립되었습니다.`);
        setTimeout(() => setRewardNotice(null), 5000);
      } else {
        setErrorMessage(res.error || "댓글 등록에 실패했습니다.");
      }
    } catch (e: any) {
      setErrorMessage(e?.message || "네트워크 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 3. 좋아요 클릭
  const handleLike = async (commentId: string) => {
    try {
      const res = await likePredictionCommentAction(commentId);
      if (res.success && typeof res.newLikes === "number") {
        setComments(
          comments.map((c) => (c.id === commentId ? { ...c, likeCount: res.newLikes! } : c))
        );
      }
    } catch (e) {
      console.error("Failed to like comment:", e);
    }
  };

  const renderSentimentSelector = () => {
    return (
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <span className="text-xs text-slate-400 font-semibold mr-1">나의 예측 관점:</span>
        {options.map((option, idx) => {
          const isSelected = selectedOptionId === option.id;
          const colors = [
            "text-blue-400 border-blue-500/60 bg-blue-500/20 shadow-sm shadow-blue-500/30",
            "text-pink-400 border-pink-500/60 bg-pink-500/20 shadow-sm shadow-pink-500/30",
            "text-emerald-400 border-emerald-500/60 bg-emerald-500/20 shadow-sm shadow-emerald-500/30",
          ];
          const activeClass = colors[idx % 3];
          const inactiveClass =
            "bg-slate-800/80 text-slate-400 border-slate-700/60 hover:bg-slate-700 hover:text-white";

          return (
            <button
              key={option.id}
              type="button"
              onClick={() => setSelectedOptionId(option.id)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all border ${
                isSelected ? activeClass : inactiveClass
              }`}
            >
              {isSelected && <TrendingUp className="w-3 h-3 mr-1 inline" />}
              {option.label}
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <Card className="bg-slate-900/90 border-slate-800 p-6 rounded-2xl shadow-xl space-y-6">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-blue-400" />
          <h3 className="text-lg font-bold text-white">
            시민 공론장 & 예측 토론 ({comments.length})
          </h3>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-amber-300 font-semibold px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30">
          <Coins className="w-3.5 h-3.5 text-amber-400" />
          <span>토론 참여 시 +10 PMP 지급</span>
        </div>
      </div>

      {/* 보상 획득 축하 알림 배너 */}
      {rewardNotice && (
        <div className="p-3.5 rounded-xl bg-emerald-950/50 border border-emerald-500/40 text-emerald-200 text-xs font-semibold flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{rewardNotice}</span>
        </div>
      )}

      {/* 에러 알림 배너 */}
      {errorMessage && (
        <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/40 text-red-300 text-xs font-medium">
          {errorMessage}
        </div>
      )}

      {/* 의견 작성 폼 */}
      <form onSubmit={handleSubmit} className="space-y-3">
        {renderSentimentSelector()}

        <div className="relative">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="이 예측에 대해 어떤 데이터를 바탕으로 생각하시나요? 시민들과 합리적인 토론 근거를 나눠주세요... (작성 시 +10 PMP 지급)"
            rows={3}
            className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl p-4 text-sm text-white focus:outline-none focus:border-blue-500 resize-none transition-all placeholder:text-slate-500"
          />
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-slate-500">
              💡 건전한 정책·사회 담론 형성을 위해 팩트에 기반한 의견 작성을 권장합니다.
            </span>
            <Button
              type="submit"
              disabled={!newComment.trim() || isSubmitting}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold px-5 py-2.5 h-auto rounded-xl shadow-md shadow-blue-500/25 flex items-center gap-1.5 disabled:opacity-50 transition-all"
            >
              <Send className="w-3.5 h-3.5" />
              {isSubmitting ? "적립 중..." : "의견 등록 (+10 PMP)"}
            </Button>
          </div>
        </div>
      </form>

      {/* 댓글 목록 */}
      <div className="space-y-4 pt-2">
        {isLoading ? (
          <div className="py-10 text-center text-slate-500 text-xs">
            공론장 토론을 불러오는 중입니다...
          </div>
        ) : comments.length === 0 ? (
          <div className="py-12 text-center text-slate-500 space-y-2 border border-dashed border-slate-800 rounded-xl">
            <Sparkles className="w-8 h-8 mx-auto text-blue-400 opacity-60" />
            <p className="text-sm font-semibold text-slate-400">아직 등록된 토론 의견이 없습니다.</p>
            <p className="text-xs text-slate-500">첫 번째로 분석 의견을 남기고 +10 PMP를 받아보세요!</p>
          </div>
        ) : (
          comments.map((comment) => (
            <div
              key={comment.id}
              className="p-4 rounded-xl bg-slate-950/50 border border-slate-800/80 hover:border-slate-700/80 transition-all space-y-2.5"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-inner ${comment.authorAvatar}`}
                  >
                    {comment.authorName.substring(0, 1).toUpperCase()}
                  </div>
                  <span className="font-bold text-slate-200 text-sm">
                    {comment.authorName}
                  </span>
                  {comment.optionLabel && (
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/30">
                      지지: {comment.optionLabel}
                    </span>
                  )}
                  <span className="text-[11px] font-semibold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    +{comment.pmpEarned} PMP
                  </span>
                </div>
                <span className="text-xs text-slate-500">
                  {formatRelativeTime(comment.createdAt)}
                </span>
              </div>

              <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap pl-9">
                {comment.content}
              </p>

              <div className="flex items-center gap-4 pl-9 pt-1">
                <button
                  type="button"
                  onClick={() => handleLike(comment.id)}
                  className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-blue-400 transition-colors"
                >
                  <ThumbsUp className="w-3.5 h-3.5" />
                  <span className="font-semibold">{comment.likeCount}</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}
