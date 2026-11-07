"use client";

import React, { useState, useEffect } from "react";
import {
  Flame,
  TrendingUp,
  Coins,
  Landmark,
  Film,
  Coffee,
  PenSquare,
  ThumbsUp,
  MessageSquare,
  Search,
  Sparkles,
  ArrowRight,
  X,
  ImageIcon,
} from "lucide-react";
import Link from "next/link";
import {
  GalleryPostDTO,
  getGalleryPostsAction,
  createGalleryPostAction,
  voteGalleryPostAction,
  addGalleryCommentAction,
  GalleryCommentDTO,
  getGalleryPostDetailAction,
} from "../actions/gallery.actions";
import { TiptapForumEditor } from "./TiptapForumEditor";

interface GalleryPostListProps {
  initialPosts?: GalleryPostDTO[];
  gameFilterId?: string; // 특정 예측 게임 연동 시
  gameFilterTitle?: string;
  isCompactMode?: boolean; // 상세페이지 하단 컴팩트 모드
}

const CATEGORIES = [
  { key: "all", label: "전체 갤", icon: Flame },
  { key: "concept", label: "🔥 개념글/포텐", icon: Sparkles },
  { key: "economy", label: "📈 경제·주식", icon: TrendingUp },
  { key: "crypto", label: "🪙 크립토", icon: Coins },
  { key: "politics", label: "🏛️ 정치·사회", icon: Landmark },
  { key: "culture", label: "🍿 엔터·문화", icon: Film },
  { key: "free", label: "☕ 자유·뻘글", icon: Coffee },
];

export function GalleryPostList({
  initialPosts = [],
  gameFilterId,
  gameFilterTitle,
  isCompactMode = false,
}: GalleryPostListProps) {
  const [activeCategory, setActiveCategory] = useState("all");
  const [posts, setPosts] = useState<GalleryPostDTO[]>(initialPosts);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // 글쓰기 모달 상태
  const [isWriteOpen, setIsWriteOpen] = useState(false);
  const [writeTitle, setWriteTitle] = useState("");
  const [writeContent, setWriteContent] = useState("");
  const [writeCategory, setWriteCategory] = useState(gameFilterId ? "economy" : "free");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 글 상세 보기 모달 상태
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [selectedPost, setSelectedPost] = useState<GalleryPostDTO | null>(null);
  const [comments, setComments] = useState<GalleryCommentDTO[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isCommentSubmitting, setIsCommentSubmitting] = useState(false);
  const [rewardNotice, setRewardNotice] = useState<string | null>(null);

  // 1. 목록 로드
  const fetchPosts = async (cat: string) => {
    setIsLoading(true);
    try {
      const res = await getGalleryPostsAction({
        category: cat,
        gameId: gameFilterId,
      });
      if (res.success && res.posts) {
        setPosts(res.posts);
      }
    } catch (e) {
      console.error("포스트 로드 실패:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts(activeCategory);
  }, [activeCategory, gameFilterId]);

  // 2. 글 상세 보기
  const openPostDetail = async (postId: string) => {
    setSelectedPostId(postId);
    try {
      const res = await getGalleryPostDetailAction(postId);
      if (res.success && res.post) {
        setSelectedPost(res.post);
        setComments(res.comments);
      }
    } catch (e) {
      console.error("게시글 상세 로드 실패:", e);
    }
  };

  // 3. 새 글 작성
  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!writeTitle.trim()) {
      alert("제목을 입력해주세요.");
      return;
    }
    // HTML 태그 제거 후 순수 텍스트 확인 (이미지가 있으면 내용 있는 것으로 간주)
    const stripped = writeContent.replace(/<[^>]*>?/gm, "").trim();
    const hasImage = writeContent.includes("<img");
    if (!stripped && !hasImage) {
      alert("내용 또는 이미지를 입력해주세요.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await createGalleryPostAction({
        title: writeTitle,
        content: writeContent,
        category: writeCategory,
        gameId: gameFilterId,
      });

      if (res.success) {
        setIsWriteOpen(false);
        setWriteTitle("");
        setWriteContent("");
        fetchPosts(activeCategory);
        alert("게시글이 등록되었습니다! (+10 PMP 획득 🎁)");
      } else {
        alert(res.error || "게시글 작성에 실패했습니다.");
      }
    } catch (err) {
      console.error("작성 오류:", err);
      alert("게시글 작성 중 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 4. 추천(개념글) 투표
  const handleVote = async (voteType: "up" | "down") => {
    if (!selectedPostId) return;
    try {
      const res = await voteGalleryPostAction(selectedPostId, voteType);
      if (res.success && res.likeCount !== undefined) {
        setSelectedPost((prev) => (prev ? { ...prev, likeCount: res.likeCount! } : null));
        setPosts((prev) =>
          prev.map((p) => (p.id === selectedPostId ? { ...p, likeCount: res.likeCount! } : p))
        );
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

  // 5. 댓글 작성
  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !selectedPostId) return;

    setIsCommentSubmitting(true);
    try {
      const res = await addGalleryCommentAction({
        postId: selectedPostId,
        content: newComment,
        gameId: gameFilterId,
      });
      if (res.success && res.comment) {
        setComments((prev) => [...prev, res.comment!]);
        setNewComment("");
        setSelectedPost((prev) =>
          prev ? { ...prev, commentCount: prev.commentCount + 1 } : null
        );
        setPosts((prev) =>
          prev.map((p) =>
            p.id === selectedPostId ? { ...p, commentCount: p.commentCount + 1 } : p
          )
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

  const filteredPosts = posts.filter(
    (p) =>
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.authorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.tag && p.tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // 실시간 포텐(개념글) 상위 3선
  const conceptHotPosts = posts
    .filter((p) => p.isConcept || p.likeCount >= 3)
    .slice(0, 3);

  // 본문에 이미지가 포함되어 있는지 검사
  const hasPostImage = (content?: string) => Boolean(content && content.includes("<img"));

  return (
    <div className="w-full space-y-4">
      {/* 🔥 실시간 포텐/개념글 미니 전광판 (에펨코리아 포텐/디시 실베 스타일) */}
      {!isCompactMode && conceptHotPosts.length > 0 && (
        <div className="rounded-2xl bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-slate-900 border border-amber-500/25 p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
          <div className="flex items-center gap-2 shrink-0">
            <span className="px-2 py-0.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-400/40 text-[11px] font-black flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 text-orange-400" />
              <span>실시간 포텐</span>
            </span>
          </div>
          <div className="flex-1 overflow-x-auto no-scrollbar flex items-center gap-4 text-xs">
            {conceptHotPosts.map((hp, idx) => (
              <button
                key={hp.id}
                onClick={() => openPostDetail(hp.id)}
                className="flex items-center gap-1.5 text-slate-300 hover:text-amber-300 font-medium truncate shrink-0 max-w-[280px] text-left transition"
              >
                <span className="font-mono font-bold text-amber-400">#{idx + 1}</span>
                <span className="truncate">{hp.title}</span>
                <span className="text-[10px] font-bold text-amber-400">[{hp.commentCount}]</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 갤러리 탭 및 글쓰기 바 */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#111520] p-3 rounded-2xl border border-white/[0.08]">
        {/* 카테고리 칩 */}
        <div className="flex flex-wrap gap-1.5">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isActive = activeCategory === cat.key;
            return (
              <button
                key={cat.key}
                onClick={() => setActiveCategory(cat.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  isActive
                    ? "bg-sky-500 text-slate-950 shadow-md font-extrabold"
                    : "bg-slate-950/60 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800/80"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? "text-slate-950" : "text-slate-400"}`} />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* 글쓰기 버튼 */}
        <button
          onClick={() => setIsWriteOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-extrabold bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-500 hover:to-teal-500 shadow-md shadow-emerald-500/20 transition-all shrink-0"
        >
          <PenSquare className="w-4 h-4" />
          <span>글쓰기 (+10 PMP)</span>
        </button>
      </div>

      {/* 검색 바 */}
      {!isCompactMode && (
        <div className="flex items-center gap-2 bg-[#0e111a] border border-white/[0.08] rounded-xl px-3 py-2 text-xs">
          <Search className="w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="제목, 작성자, 또는 말머리 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent text-slate-200 placeholder-slate-600 focus:outline-none text-xs"
          />
        </div>
      )}

      {/* 게시글 목록 (PC 테이블 + 모바일 2열 디시/펨코 스택) */}
      <div className="bg-[#111520] border border-white/[0.08] rounded-2xl overflow-hidden shadow-xl">
        {isLoading ? (
          <div className="py-16 text-center text-slate-500 text-xs">
            갤러리 게시글을 불러오는 중...
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="py-16 text-center text-slate-500 text-xs space-y-2">
            <p>등록된 게시글이 없습니다.</p>
            <button
              onClick={() => setIsWriteOpen(true)}
              className="text-sky-400 font-bold hover:underline"
            >
              첫 번째 글을 작성해보세요! (+10 PMP)
            </button>
          </div>
        ) : (
          <>
            {/* 1. PC 뷰 (테이블 형태) */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-white/[0.06] bg-[#0c0f17] text-slate-400 font-bold">
                    <th className="py-2.5 px-3 w-16 text-center">말머리</th>
                    <th className="py-2.5 px-4">제목</th>
                    <th className="py-2.5 px-3 w-32">글쓴이</th>
                    <th className="py-2.5 px-3 w-20 text-center">시간</th>
                    <th className="py-2.5 px-2.5 w-14 text-center">조회</th>
                    <th className="py-2.5 px-2.5 w-14 text-center">추천</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {filteredPosts.map((post) => {
                    const isImg = hasPostImage(post.content);
                    return (
                      <tr
                        key={post.id}
                        onClick={() => openPostDetail(post.id)}
                        className="hover:bg-slate-800/40 cursor-pointer transition-colors group"
                      >
                        {/* 말머리 태그 */}
                        <td className="py-2.5 px-3 text-center">
                          <span
                            className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              post.isConcept
                                ? "bg-amber-950/80 text-amber-300 border border-amber-800/50"
                                : "bg-slate-800/80 text-slate-400 border border-slate-700/50"
                            }`}
                          >
                            {post.isConcept ? "🔥포텐" : post.tag || "자유"}
                          </span>
                        </td>

                        {/* 제목 + 댓글수 + 짤방 아이콘 */}
                        <td className="py-2.5 px-4">
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-slate-200 group-hover:text-sky-400 transition-colors line-clamp-1">
                              {post.title}
                            </span>
                            {isImg && (
                              <span title="사진 첨부됨">
                                <ImageIcon className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                              </span>
                            )}
                            {post.commentCount > 0 && (
                              <span className="text-[11px] font-black text-amber-400 shrink-0">
                                [{post.commentCount}]
                              </span>
                            )}
                          </div>
                        </td>

                        {/* 글쓴이 + 베팅 배지 */}
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-1.5">
                            <span className="text-slate-300 font-medium truncate max-w-[80px]">
                              {post.authorName}
                            </span>
                            {post.authorBadge && (
                              <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black bg-blue-950 text-blue-300 border border-blue-800/60 shrink-0">
                                {post.authorBadge}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* 작성시간 */}
                        <td className="py-2.5 px-3 text-center text-slate-500 text-[11px] font-mono">
                          {new Date(post.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>

                        {/* 조회수 */}
                        <td className="py-2.5 px-2.5 text-center text-slate-500 font-mono text-[11px]">
                          {post.viewCount}
                        </td>

                        {/* 추천수 (펨코 포텐 스타일 볼드) */}
                        <td className="py-2.5 px-2.5 text-center font-mono text-[11px] font-black">
                          <span
                            className={
                              post.likeCount >= 3
                                ? "text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded"
                                : post.likeCount > 0
                                ? "text-emerald-400"
                                : "text-slate-600"
                            }
                          >
                            {post.likeCount > 0 ? `+${post.likeCount}` : post.likeCount}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* 2. 모바일 전용 뷰 (디시/펨코 모바일 2열 스택) */}
            <div className="sm:hidden divide-y divide-white/[0.05]">
              {filteredPosts.map((post) => {
                const isImg = hasPostImage(post.content);
                return (
                  <div
                    key={post.id}
                    onClick={() => openPostDetail(post.id)}
                    className="p-3.5 hover:bg-slate-800/40 cursor-pointer transition flex items-start gap-3"
                  >
                    {/* 추천수 박스 */}
                    <div className="flex flex-col items-center justify-center w-10 shrink-0 pt-0.5">
                      <span
                        className={`text-xs font-black font-mono ${
                          post.likeCount >= 3
                            ? "text-amber-400"
                            : post.likeCount > 0
                            ? "text-emerald-400"
                            : "text-slate-600"
                        }`}
                      >
                        {post.likeCount > 0 ? `+${post.likeCount}` : "0"}
                      </span>
                      <span className="text-[9px] text-slate-500">추천</span>
                    </div>

                    {/* 본문 정보 */}
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-1.5 text-xs">
                        <span className="font-bold text-sky-400 shrink-0 text-[11px]">
                          [{post.tag || "자유"}]
                        </span>
                        <span className="font-semibold text-slate-100 truncate">
                          {post.title}
                        </span>
                        {isImg && <ImageIcon className="w-3 h-3 text-slate-500 shrink-0" />}
                        {post.commentCount > 0 && (
                          <span className="text-[11px] font-black text-amber-400 shrink-0">
                            [{post.commentCount}]
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-[11px] text-slate-500">
                        <span className="truncate max-w-[90px] text-slate-400 font-medium">
                          {post.authorName}
                        </span>
                        <span>·</span>
                        <span>
                          {new Date(post.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                        <span>·</span>
                        <span>조회 {post.viewCount}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* 📝 글쓰기 모달 (Tiptap 리치 에디터 탑재) */}
      {isWriteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#121621] border border-white/[0.1] rounded-3xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="flex justify-between items-center px-6 py-4 border-b border-white/[0.08] bg-[#0d1018] shrink-0">
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <PenSquare className="w-5 h-5 text-emerald-400" />
                <span>새 게시글 작성</span>
                <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-400/30">
                  +10 PMP 지급
                </span>
              </h3>
              <button
                onClick={() => setIsWriteOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePost} className="p-6 overflow-y-auto space-y-4 flex-1">
              {/* 카테고리 선택 및 예측 연동 안내 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">말머리 카테고리</label>
                  <select
                    value={writeCategory}
                    onChange={(e) => setWriteCategory(e.target.value)}
                    className="w-full bg-[#0c0f17] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                  >
                    <option value="economy">📈 경제·주식</option>
                    <option value="crypto">🪙 크립토</option>
                    <option value="politics">🏛️ 정치·사회</option>
                    <option value="culture">🍿 엔터·문화</option>
                    <option value="free">☕ 자유·잡담</option>
                  </select>
                </div>

                {gameFilterTitle && (
                  <div className="p-2.5 rounded-xl bg-sky-950/40 border border-sky-800/40 text-xs text-sky-300 flex items-center gap-2 self-end">
                    <Sparkles className="w-4 h-4 text-sky-400 shrink-0" />
                    <span className="truncate">
                      <strong>[{gameFilterTitle}]</strong> 예측과 연동
                    </span>
                  </div>
                )}
              </div>

              {/* 제목 */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">제목</label>
                <input
                  type="text"
                  placeholder="제목을 입력하세요 (어그로 금지, 건전한 토론 지향)"
                  value={writeTitle}
                  onChange={(e) => setWriteTitle(e.target.value)}
                  className="w-full bg-[#0c0f17] border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-xs text-white font-semibold focus:outline-none focus:border-sky-500"
                  required
                />
              </div>

              {/* Tiptap 리치 텍스트 에디터 (이미지 복사붙여넣기 Ctrl+V 지원) */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                  <span>내용 작성</span>
                  <span className="text-[11px] text-slate-400 font-normal">
                    클립보드 이미지 복사 후 <strong>Ctrl + V</strong> 지원
                  </span>
                </label>
                <TiptapForumEditor
                  content={writeContent}
                  onChange={setWriteContent}
                  placeholder="자유롭게 글을 작성해보세요. 캡처한 이미지(Ctrl+V)나 짤방을 바로 붙여넣을 수 있습니다..."
                />
              </div>

              {/* 하단 버튼 */}
              <div className="flex justify-end gap-2 pt-2 border-t border-white/[0.06]">
                <button
                  type="button"
                  onClick={() => setIsWriteOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white bg-slate-900 border border-slate-800"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl text-xs font-extrabold bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                >
                  {isSubmitting ? "등록 중..." : "게시하기 (+10 PMP)"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 📖 글 상세 보기 모달 */}
      {selectedPostId && selectedPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#121621] border border-white/[0.1] rounded-3xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
            {/* 상단 헤더 */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-white/[0.08] bg-[#0c0f17] shrink-0">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-sky-950 text-sky-300 border border-sky-800/40">
                  {selectedPost.tag || "자유"}
                </span>
                <span className="text-xs text-slate-400">
                  {new Date(selectedPost.createdAt).toLocaleString()}
                </span>
              </div>
              <button
                onClick={() => setSelectedPostId(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 본문 스크롤 영역 */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-200">
              {/* 글 제목 */}
              <div className="space-y-2">
                <h2 className="text-xl font-extrabold text-white leading-tight">
                  {selectedPost.title}
                </h2>
                <div className="flex items-center gap-2 text-xs text-slate-400 pb-3 border-b border-white/[0.08]">
                  <span className="font-bold text-slate-300">{selectedPost.authorName}</span>
                  {selectedPost.authorBadge && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-sky-950 text-sky-300 border border-sky-800">
                      {selectedPost.authorBadge}
                    </span>
                  )}
                  <span>•</span>
                  <span>조회 {selectedPost.viewCount}</span>
                </div>
              </div>

              {/* 연동된 예측 바로가기 카드 배너 */}
              {selectedPost.gameTitle && selectedPost.gameId && (
                <Link
                  href={`/prediction/${selectedPost.gameId}`}
                  className="block p-4 rounded-2xl bg-gradient-to-r from-sky-950/40 to-indigo-950/40 border border-sky-800/40 hover:border-sky-500 transition-all group"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="text-[10px] font-bold text-sky-400 flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        <span>연계된 예측 게임</span>
                      </div>
                      <div className="text-xs font-extrabold text-white group-hover:text-sky-300 transition-colors">
                        {selectedPost.gameTitle}
                      </div>
                    </div>
                    <span className="text-xs font-bold text-sky-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                      <span>예측 참여</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </Link>
              )}

              {/* 본문 내용 (HTML 렌더링 지원: 짤방 및 스타일 반영) */}
              <div
                className="prose prose-invert max-w-none text-sm text-slate-200 leading-relaxed py-2 overflow-hidden break-words"
                dangerouslySetInnerHTML={{ __html: selectedPost.content }}
              />

              {/* 추천 / 비추천 (개념글 가기 버튼) */}
              <div className="flex flex-col items-center gap-2 py-4 border-y border-white/[0.08]">
                <button
                  onClick={() => handleVote("up")}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-[#0c0f17] border border-amber-500/40 hover:border-amber-400 text-amber-300 hover:bg-amber-950/30 font-black text-xs transition-all shadow-lg group"
                >
                  <ThumbsUp className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
                  <span>개념 추천 (포텐) {selectedPost.likeCount}</span>
                </button>
                {rewardNotice && (
                  <p className="text-[11px] font-bold text-amber-400 animate-pulse">
                    {rewardNotice}
                  </p>
                )}
              </div>

              {/* 댓글 섹션 */}
              <div className="space-y-4">
                <h4 className="text-xs font-extrabold text-white flex items-center gap-1.5">
                  <MessageSquare className="w-4 h-4 text-sky-400" />
                  <span>댓글 ({comments.length})</span>
                </h4>

                {/* 댓글 목록 */}
                <div className="space-y-2">
                  {comments.length === 0 ? (
                    <p className="text-xs text-slate-500 py-4 text-center">
                      아직 작성된 댓글이 없습니다. 첫 번째 댓글을 남겨보세요!
                    </p>
                  ) : (
                    comments.map((c) => (
                      <div
                        key={c.id}
                        className="p-3 rounded-xl bg-[#0c0f17] border border-white/[0.06] space-y-1 text-xs"
                      >
                        <div className="flex justify-between items-center text-[11px] text-slate-400">
                          <span className="font-bold text-slate-200">{c.authorName}</span>
                          <span className="text-slate-500 font-mono text-[10px]">
                            {new Date(c.createdAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                        <p className="text-slate-200 leading-relaxed">{c.content}</p>
                      </div>
                    ))
                  )}
                </div>

                {/* 댓글 작성 폼 */}
                <form onSubmit={handleAddComment} className="flex gap-2 pt-2">
                  <input
                    type="text"
                    placeholder="건전한 댓글을 입력하세요..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="flex-1 bg-[#0c0f17] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                  />
                  <button
                    type="submit"
                    disabled={isCommentSubmitting}
                    className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold transition disabled:opacity-50 shrink-0"
                  >
                    {isCommentSubmitting ? "작성 중..." : "등록"}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
