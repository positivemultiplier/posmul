"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  ThumbsUp,
  MessageSquare,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Share2,
  Bookmark,
  Award,
  Eye,
  Clock,
} from "lucide-react";
import {
  GalleryPostDTO,
  GalleryCommentDTO,
  getGalleryPostDetailAction,
  voteGalleryPostAction,
  addGalleryCommentAction,
} from "../actions/gallery.actions";

export default function ForumPostDetailPage() {
  const params = useParams();
  const router = useRouter();
  const postId = params.postId as string;

  const [post, setPost] = useState<GalleryPostDTO | null>(null);
  const [comments, setComments] = useState<GalleryCommentDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [isCommentSubmitting, setIsCommentSubmitting] = useState(false);
  const [rewardNotice, setRewardNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!postId) return;
    setIsLoading(true);
    getGalleryPostDetailAction(postId).then((res) => {
      if (res.success && res.post) {
        setPost(res.post);
        setComments(res.comments);
      } else {
        alert(res.error || "게시글을 불러올 수 없습니다.");
        router.push("/forum");
      }
      setIsLoading(false);
    });
  }, [postId, router]);

  // 추천(개념글) 투표
  const handleVote = async (voteType: "up" | "down") => {
    if (!post) return;
    try {
      const res = await voteGalleryPostAction(post.id, voteType);
      if (res.success && res.likeCount !== undefined) {
        setPost((prev) => (prev ? { ...prev, likeCount: res.likeCount! } : null));
        if (res.likeCount >= 3) {
          setRewardNotice("🔥 이 글이 개념글(포텐)로 등록되었습니다!");
        }
      } else {
        alert(res.error || "추천 처리에 실패했습니다.");
      }
    } catch (e) {
      console.error("추천 오류:", e);
    }
  };

  // 댓글 작성
  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !post) return;

    setIsCommentSubmitting(true);
    try {
      const res = await addGalleryCommentAction({
        postId: post.id,
        content: newComment,
        gameId: post.gameId,
      });

      if (res.success && res.comment) {
        setComments((prev) => [...prev, res.comment!]);
        setNewComment("");
        setPost((prev) =>
          prev ? { ...prev, commentCount: prev.commentCount + 1 } : null
        );
      } else {
        alert(res.error || "댓글 등록 실패");
      }
    } catch (err) {
      console.error("댓글 오류:", err);
    } finally {
      setIsCommentSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#07090e] text-slate-100 flex items-center justify-center text-xs text-slate-500">
        게시글을 불러오는 중...
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col items-center justify-center space-y-3">
        <p className="text-sm text-slate-400">존재하지 않거나 삭제된 게시글입니다.</p>
        <Link
          href="/forum"
          className="px-4 py-2 bg-sky-600 text-white text-xs font-bold rounded-xl"
        >
          포럼 목록으로 가기
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 py-6 sm:py-8 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* 상단 네비게이션 */}
        <div className="flex items-center justify-between">
          <Link
            href="/forum"
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white transition group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span>포럼 목록으로</span>
          </Link>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                alert("게시글 링크가 클립보드에 복사되었습니다!");
              }}
              className="p-2 rounded-xl bg-[#111520] border border-white/[0.08] text-slate-400 hover:text-white transition flex items-center gap-1.5 text-xs font-semibold"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>공유</span>
            </button>
            <Link
              href="/forum/write"
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs transition shadow-md"
            >
              글쓰기 (+10 PMP)
            </Link>
          </div>
        </div>

        {/* 📖 단독 전체화면 게시글 카드 */}
        <article className="rounded-3xl bg-[#111520] border border-white/[0.08] shadow-2xl p-6 sm:p-8 space-y-6">
          {/* 글 헤더 */}
          <div className="space-y-3 pb-5 border-b border-white/[0.08]">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-sky-500/15 text-sky-300 border border-sky-400/30">
                {post.tag || post.categoryName || "자유"}
              </span>
              {post.isConcept && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-500/20 text-amber-300 border border-amber-400/40">
                  🔥 개념글 (포텐)
                </span>
              )}
            </div>

            <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-white leading-snug">
              {post.title}
            </h1>

            <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400 pt-1">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-slate-200">{post.authorName}</span>
                {post.authorBadge && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-sky-950 text-sky-300 border border-sky-800">
                    {post.authorBadge}
                  </span>
                )}
                <span>·</span>
                <span className="flex items-center gap-1 text-slate-500 font-mono text-[11px]">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{new Date(post.createdAt).toLocaleString()}</span>
                </span>
              </div>

              <div className="flex items-center gap-3 text-[11px] font-mono text-slate-400">
                <span className="flex items-center gap-1">
                  <Eye className="w-3.5 h-3.5 text-slate-500" />
                  <span>조회 {post.viewCount}</span>
                </span>
                <span>·</span>
                <span className="flex items-center gap-1">
                  <MessageSquare className="w-3.5 h-3.5 text-slate-500" />
                  <span>댓글 {post.commentCount}</span>
                </span>
                <span>·</span>
                <span className="flex items-center gap-1 font-bold text-amber-400">
                  <ThumbsUp className="w-3.5 h-3.5 text-amber-400" />
                  <span>추천 {post.likeCount}</span>
                </span>
              </div>
            </div>
          </div>

          {/* 📊 연동된 예측 마켓 인터랙티브 카드 (설정된 미리보기 블록) */}
          {post.gameTitle && post.gameId && (
            <Link
              href={`/prediction/${post.gameId}`}
              className="block p-5 rounded-2xl bg-gradient-to-r from-sky-950/40 via-indigo-950/30 to-[#0c0f17] border border-sky-500/30 hover:border-sky-400 transition-all group shadow-lg"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-[11px] font-extrabold text-sky-400">
                    <TrendingUp className="w-4 h-4" />
                    <span>본문 연계 실시간 예측 의제</span>
                  </div>
                  <h3 className="text-base font-extrabold text-white group-hover:text-sky-300 transition-colors">
                    {post.gameTitle}
                  </h3>
                  <div className="flex items-center gap-3 text-xs text-slate-300">
                    <span className="text-amber-300 font-bold">
                      💰 MoneyWave 상금풀 연동 중
                    </span>
                    <span>·</span>
                    <span className="text-slate-400">
                      글 읽고 바로 예측에 참여할 수 있습니다
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  <span className="px-4 py-2 rounded-xl bg-sky-500 group-hover:bg-sky-400 text-slate-950 font-black text-xs transition flex items-center gap-1 shadow-md">
                    <span>예측 참여하러 가기</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            </Link>
          )}

          {/* 📝 본문 내용 (HTML 짤방 및 에디터 서식 반영) */}
          <div
            className="prose prose-invert max-w-none text-slate-100 text-sm sm:text-base leading-relaxed py-4 overflow-hidden break-words"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

          {/* 🌟 추천 (개념글 가기) 중앙 액션 바 */}
          <div className="flex flex-col items-center justify-center py-6 border-y border-white/[0.08] gap-2">
            <button
              onClick={() => handleVote("up")}
              className="flex items-center gap-2.5 px-8 py-3 rounded-2xl bg-[#0c0f17] border border-amber-500/40 hover:border-amber-400 text-amber-300 hover:bg-amber-950/30 font-black text-sm transition-all shadow-xl group"
            >
              <ThumbsUp className="w-5 h-5 text-amber-400 group-hover:scale-110 transition-transform" />
              <span>개념 추천 (포텐) {post.likeCount}</span>
            </button>
            {rewardNotice && (
              <p className="text-xs font-bold text-amber-400 animate-pulse mt-1">
                {rewardNotice}
              </p>
            )}
            <p className="text-[11px] text-slate-500">
              추천 3개 이상 획득 시 전체 갤러리 메인 포텐으로 승격됩니다
            </p>
          </div>

          {/* 💬 댓글 섹션 */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-sky-400" />
                <span>댓글 ({comments.length})</span>
              </h3>
              <span className="text-[11px] text-amber-400 font-bold">
                댓글 작성 시 +10 PMP 지급
              </span>
            </div>

            {/* 댓글 작성 폼 */}
            <form onSubmit={handleAddComment} className="flex gap-2.5">
              <input
                type="text"
                placeholder="건전하고 소신 있는 의견을 댓글로 남겨보세요..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="flex-1 bg-[#0c0f17] border border-white/[0.08] rounded-2xl px-4 py-3 text-xs sm:text-sm text-white focus:outline-none focus:border-sky-500 placeholder:text-slate-600 transition"
              />
              <button
                type="submit"
                disabled={isCommentSubmitting}
                className="px-6 py-3 bg-sky-600 hover:bg-sky-500 text-white rounded-2xl text-xs sm:text-sm font-bold transition disabled:opacity-50 shrink-0"
              >
                {isCommentSubmitting ? "작성 중..." : "등록"}
              </button>
            </form>

            {/* 댓글 목록 */}
            <div className="space-y-2.5 pt-2">
              {comments.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-500 bg-[#0c0f17] rounded-2xl border border-white/[0.04]">
                  아직 작성된 댓글이 없습니다. 첫 번째 댓글을 남겨보세요!
                </div>
              ) : (
                comments.map((c) => (
                  <div
                    key={c.id}
                    className="p-4 rounded-2xl bg-[#0c0f17] border border-white/[0.06] space-y-1.5 text-xs sm:text-sm"
                  >
                    <div className="flex justify-between items-center text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-slate-200">
                          {c.authorName}
                        </span>
                        {c.authorBadge && (
                          <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black bg-sky-950 text-sky-300 border border-sky-800">
                            {c.authorBadge}
                          </span>
                        )}
                      </div>
                      <span className="text-slate-500 font-mono text-[11px]">
                        {new Date(c.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <p className="text-slate-300 leading-relaxed">{c.content}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </article>
      </div>
    </div>
  );
}

