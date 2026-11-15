"use client";

import { useState } from "react";
import {
  MessageSquare,
  ThumbsUp,
  Coins,
  Plus,
  Send,
  Scale,
  X,
  ExternalLink,
  CheckCircle2,
} from "lucide-react";
import { MobileAppShell } from "@/components/mobile/mobile-app-shell";
import { useProWorkspace } from "@/lib/pro-workspace-store";
import type { ProCommunityPost } from "@/data/mock-pro-community";

const CATEGORIES: Array<{ id: "ALL" | ProCommunityPost["category"]; label: string }> = [
  { id: "ALL", label: "전체" },
  { id: "REPAIR", label: "장충금·수선비" },
  { id: "LABOR", label: "노무·경비원" },
  { id: "TENDER", label: "사업자선정" },
];

export default function ProCommunityForumPage() {
  const {
    complexProfile,
    userPmpBalance,
    communityPosts,
    votedPostOptions,
    likedPostIds,
    voteCommunityPoll,
    addCommunityComment,
    createCommunityPost,
    toggleLikePost,
  } = useProWorkspace();

  const [selectedCategory, setSelectedCategory] = useState<
    "ALL" | ProCommunityPost["category"]
  >("ALL");
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [lawRefInputs, setLawRefInputs] = useState<Record<string, string>>({});
  const [isWriteModalOpen, setIsWriteModalOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // 새 글 작성 상태
  const [newCategory, setNewCategory] = useState<ProCommunityPost["category"]>("REPAIR");
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newPollQuestion, setNewPollQuestion] = useState("");

  const showToast = (msg: string) => {
    setToastMsg(msg);
    globalThis.setTimeout(() => setToastMsg(null), 3000);
  };

  const filteredPosts =
    selectedCategory === "ALL"
      ? communityPosts
      : communityPosts.filter((p) => p.category === selectedCategory);

  const handleSubmitComment = (postId: string) => {
    const text = commentInputs[postId] || "";
    if (!text.trim()) return;
    addCommunityComment(postId, text, lawRefInputs[postId]);
    setCommentInputs((prev) => ({ ...prev, [postId]: "" }));
    setLawRefInputs((prev) => ({ ...prev, [postId]: "" }));
    showToast("조문 근거 댓글이 등록되었습니다! (+15 PMP 적립)");
  };

  const handleCreatePost = () => {
    if (!newTitle.trim() || !newContent.trim()) return;
    const catLabel =
      CATEGORIES.find((c) => c.id === newCategory)?.label || "실무질문";
    createCommunityPost({
      category: newCategory,
      categoryLabel: catLabel,
      title: newTitle,
      content: newContent,
      pollQuestion: newPollQuestion,
    });
    setNewTitle("");
    setNewContent("");
    setNewPollQuestion("");
    setIsWriteModalOpen(false);
    showToast("현장 실무 질문이 등록되었습니다! (+20 PMP 적립)");
  };

  return (
    <MobileAppShell isProMode>
      <header className="px-4 py-3 bg-[#0D1322] border-b border-white/[0.06] space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <MessageSquare className="w-4 h-4 text-sky-400 shrink-0" />
            <h1 className="text-sm font-black text-white truncate">
              소장 집단지성 커뮤니티
            </h1>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="px-2 py-0.5 rounded-full bg-indigo-950 text-sky-300 border border-sky-500/30 font-mono text-[10px] font-black">
              {userPmpBalance.toLocaleString()} PMP
            </span>
            <button
              type="button"
              onClick={() => setIsWriteModalOpen(true)}
              className="px-2.5 py-1 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 text-[10.5px] font-black flex items-center gap-1 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>질문</span>
            </button>
          </div>
        </div>

        {/* 카테고리 필터 */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-2.5 py-1 rounded-xl text-[10.5px] font-black border shrink-0 transition ${
                selectedCategory === cat.id
                  ? "bg-indigo-600 text-white border-indigo-400"
                  : "bg-[#080D1A] text-slate-400 border-white/[0.08] hover:text-white"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </header>

      {toastMsg && (
        <div className="mx-4 mt-3 p-3 rounded-xl bg-emerald-950/90 border border-emerald-500/40 text-emerald-200 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      <div className="px-4 py-4 space-y-4">
        {/* PosMul 포럼 연동 배너 */}
        <div className="p-3 rounded-2xl bg-[#121A2B] border border-indigo-500/30 flex items-center justify-between gap-2 text-[11px]">
          <div className="text-slate-300 font-bold">
            <span className="text-sky-300 font-black">PosMul Forum</span> 연동 · 실무 투표/근거 답변 시 PMP 보상
          </div>
          <a
            href="https://posmul.com/forum"
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-300 font-black flex items-center gap-1 shrink-0 hover:underline"
          >
            <span>전체포럼</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        {/* 게시글 목록 */}
        {filteredPosts.map((post) => {
          const votedOptionId = votedPostOptions[post.id];
          const isLiked = likedPostIds.includes(post.id);
          const totalPollVotes = post.poll
            ? post.poll.options.reduce((acc, o) => acc + o.votes, 0)
            : 0;

          return (
            <article
              key={post.id}
              className="p-4 rounded-2xl bg-[#121A2B] border border-white/[0.08] space-y-3 shadow-lg"
            >
              {/* 작성자 & 배지 */}
              <div className="flex items-center justify-between gap-2 text-[10px]">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="px-2 py-0.5 rounded-md bg-sky-500/15 text-sky-300 border border-sky-500/30 font-black">
                    {post.categoryLabel}
                  </span>
                  <span className="font-bold text-white">{post.authorName}</span>
                  <span className="text-slate-400">{post.complexBadge}</span>
                </div>
                <span className="text-slate-500 shrink-0">{post.createdAt}</span>
              </div>

              <div className="space-y-1.5">
                <h2 className="text-sm font-black text-white leading-snug">{post.title}</h2>
                <p className="text-[11.5px] text-slate-300 leading-relaxed">{post.content}</p>
              </div>

              {/* 집단지성 실무 투표 */}
              {post.poll && (
                <div className="p-3 rounded-xl bg-slate-950/90 border border-indigo-500/30 space-y-2">
                  <div className="flex items-center justify-between gap-2 text-[11px]">
                    <span className="font-black text-indigo-200">{post.poll.question}</span>
                    <span className="text-[9.5px] font-black text-amber-300 flex items-center gap-0.5 shrink-0">
                      <Coins className="w-3 h-3" />
                      +{post.pmpReward} PMP
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    {post.poll.options.map((opt) => {
                      const pct =
                        totalPollVotes > 0
                          ? Math.round((opt.votes / totalPollVotes) * 100)
                          : 0;
                      const isMyChoice = votedOptionId === opt.id;

                      return (
                        <button
                          key={opt.id}
                          type="button"
                          disabled={Boolean(votedOptionId)}
                          onClick={() => {
                            voteCommunityPoll(post.id, opt.id);
                            showToast(`집단지성 투표 완료! (+${post.pmpReward} PMP 적립)`);
                          }}
                          className={`w-full relative overflow-hidden rounded-lg border p-2 text-left transition ${
                            isMyChoice
                              ? "border-sky-400 bg-sky-950/40"
                              : "border-white/[0.08] bg-[#101726] hover:border-sky-500/40"
                          }`}
                        >
                          {votedOptionId && (
                            <div
                              className="absolute inset-y-0 left-0 bg-sky-500/20 transition-all duration-500"
                              style={{ width: `${pct}%` }}
                            />
                          )}
                          <div className="relative flex items-center justify-between gap-2 text-[11px]">
                            <span className="font-bold text-slate-200">{opt.label}</span>
                            {votedOptionId && (
                              <span className="font-mono font-black text-sky-300 shrink-0">
                                {pct}% ({opt.votes})
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 좋아요 & 댓글 수 */}
              <div className="flex items-center justify-between pt-1 border-t border-white/[0.06] text-[11px]">
                <button
                  type="button"
                  onClick={() => toggleLikePost(post.id)}
                  className={`flex items-center gap-1 font-bold transition ${
                    isLiked ? "text-sky-400" : "text-slate-400 hover:text-white"
                  }`}
                >
                  <ThumbsUp className="w-3.5 h-3.5" />
                  <span>공감 {post.likes}</span>
                </button>
                <span className="text-slate-400 font-bold">
                  소장 의견 {post.comments.length}건
                </span>
              </div>

              {/* 근거 조문 댓글 목록 */}
              {post.comments.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  {post.comments.map((c) => (
                    <div
                      key={c.id}
                      className="p-2.5 rounded-xl bg-slate-950/70 border border-white/[0.05] space-y-1"
                    >
                      <div className="flex items-center justify-between gap-2 text-[10px]">
                        <div className="flex items-center gap-1.5">
                          <span className="font-black text-white">{c.author}</span>
                          <span className="px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 font-bold">
                            {c.badge}
                          </span>
                        </div>
                        {c.lawRef && (
                          <span className="text-amber-300 font-bold flex items-center gap-0.5">
                            <Scale className="w-2.5 h-2.5" />
                            {c.lawRef}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-300 leading-snug">{c.text}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* 댓글 입력 */}
              <div className="space-y-1.5 pt-1">
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    value={commentInputs[post.id] || ""}
                    onChange={(e) =>
                      setCommentInputs((prev) => ({ ...prev, [post.id]: e.target.value }))
                    }
                    placeholder={`${complexProfile.name} 소장 의견 남기기 (+15 PMP)...`}
                    className="flex-1 px-2.5 py-2 rounded-xl bg-slate-950 border border-white/[0.1] text-[11px] text-white focus:outline-none focus:border-sky-400"
                  />
                  <button
                    type="button"
                    onClick={() => handleSubmitComment(post.id)}
                    className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-black flex items-center gap-1 shrink-0"
                  >
                    <Send className="w-3 h-3" />
                    <span>등록</span>
                  </button>
                </div>
                <input
                  type="text"
                  value={lawRefInputs[post.id] || ""}
                  onChange={(e) =>
                    setLawRefInputs((prev) => ({ ...prev, [post.id]: e.target.value }))
                  }
                  placeholder="(선택) 근거 조문 예: 공동주택관리법 제30조"
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950/70 border border-white/[0.06] text-[10px] text-slate-300 focus:outline-none focus:border-amber-400"
                />
              </div>
            </article>
          );
        })}
      </div>

      {/* 새 실무 질문 작성 모달 */}
      {isWriteModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-3">
          <div className="w-full max-w-[420px] rounded-3xl bg-[#121A2B] border border-white/[0.12] p-5 space-y-3.5 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-white">소장 집단지성 질문 올리기</h3>
              <button
                type="button"
                onClick={() => setIsWriteModalOpen(false)}
                className="p-1.5 rounded-full bg-white/[0.06] text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex gap-1.5">
              {CATEGORIES.filter((c) => c.id !== "ALL").map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() =>
                    setNewCategory(cat.id as ProCommunityPost["category"])
                  }
                  className={`px-2.5 py-1.5 rounded-xl text-[10.5px] font-black border ${
                    newCategory === cat.id
                      ? "bg-indigo-600 text-white border-indigo-400"
                      : "bg-slate-950 text-slate-400 border-white/[0.08]"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="질문 제목 (예: 옥상 방수 보수공사 입찰 방법)"
              className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-white/[0.1] text-xs font-bold text-white"
            />

            <textarea
              rows={3}
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              placeholder="현장 상황과 궁금한 법령/감사 포인트를 적어주세요..."
              className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-white/[0.1] text-xs text-white"
            />

            <input
              type="text"
              value={newPollQuestion}
              onChange={(e) => setNewPollQuestion(e.target.value)}
              placeholder="(선택) 소장님 투표 질문 예: 장충금 vs 수선유지비?"
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/[0.08] text-[11px] text-slate-200"
            />

            <button
              type="button"
              onClick={handleCreatePost}
              className="w-full py-3 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-black text-xs transition"
            >
              커뮤니티에 등록하고 +20 PMP 받기
            </button>
          </div>
        </div>
      )}
    </MobileAppShell>
  );
}
