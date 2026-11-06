"use client";

import React, { useState, useEffect, useTransition } from "react";
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
  Eye,
  Search,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  X,
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

interface GalleryPostListProps {
  initialPosts?: GalleryPostDTO[];
  gameFilterId?: string; // 특정 예측 게임 연동 시
  gameFilterTitle?: string;
  isCompactMode?: boolean; // 상세페이지 하단 컴팩트 모드
}

const CATEGORIES = [
  { key: "all", label: "전체 갤", icon: Flame },
  { key: "concept", label: "🔥 개념글", icon: Sparkles },
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
      if (res.success) {
        setPosts(res.posts);
      }
    } catch (e) {
      console.error("fetchPosts error:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts(activeCategory);
  }, [activeCategory, gameFilterId]);

  // 2. 글 상세 조회
  const openPostDetail = async (postId: string) => {
    setSelectedPostId(postId);
    try {
      const res = await getGalleryPostDetailAction(postId);
      if (res.success && res.post) {
        setSelectedPost(res.post);
        setComments(res.comments);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // 3. 글 작성 제출
  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!writeTitle.trim() || !writeContent.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const res = await createGalleryPostAction({
        title: writeTitle,
        content: writeContent,
        category: writeCategory,
        gameId: gameFilterId,
        gameTitle: gameFilterTitle,
      });

      if (res.success && res.post) {
        setPosts([res.post, ...posts]);
        setWriteTitle("");
        setWriteContent("");
        setIsWriteOpen(false);
      } else {
        alert(res.error || "작성에 실패했습니다.");
      }
    } catch (err: any) {
      alert(err?.message || "오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 4. 추천 / 비추천
  const handleVote = async (type: "up" | "down") => {
    if (!selectedPost) return;
    try {
      const res = await voteGalleryPostAction(selectedPost.id, type);
      if (res.success) {
        setSelectedPost({
          ...selectedPost,
          likeCount: res.likeCount ?? selectedPost.likeCount,
          dislikeCount: res.dislikeCount ?? selectedPost.dislikeCount,
          isConcept: (res.likeCount ?? selectedPost.likeCount) >= 3,
        });
        // 목록도 갱신
        setPosts((prev) =>
          prev.map((p) =>
            p.id === selectedPost.id
              ? {
                  ...p,
                  likeCount: res.likeCount ?? p.likeCount,
                  dislikeCount: res.dislikeCount ?? p.dislikeCount,
                  isConcept: (res.likeCount ?? p.likeCount) >= 3,
                }
              : p
          )
        );
      }
    } catch (e) {
      console.error(e);
    }
  };

  // 5. 댓글 작성
  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !selectedPost || isCommentSubmitting) return;

    setIsCommentSubmitting(true);
    try {
      const res = await addGalleryCommentAction({
        postId: selectedPost.id,
        content: newComment,
        gameId: selectedPost.gameId,
      });

      if (res.success && res.comment) {
        setComments([...comments, res.comment]);
        setNewComment("");
        setRewardNotice("🎉 댓글 등록 완료! +10 PMP 지급");
        setTimeout(() => setRewardNotice(null), 4000);

        // 댓글수 +1 반영
        setSelectedPost({ ...selectedPost, commentCount: selectedPost.commentCount + 1 });
        setPosts((prev) =>
          prev.map((p) => (p.id === selectedPost.id ? { ...p, commentCount: p.commentCount + 1 } : p))
        );
      } else {
        alert(res.error || "댓글 등록 실패");
      }
    } catch (err: any) {
      alert(err?.message || "댓글 등록 오류");
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

  return (
    <div className="w-full space-y-4">
      {/* 갤러리 탭 및 글쓰기 바 */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/80 p-3 rounded-2xl border border-slate-800">
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
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20"
                    : "bg-slate-950/60 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800/80"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? "text-white" : "text-slate-400"}`} />
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
          <span>글쓰기</span>
        </button>
      </div>

      {/* 검색 바 */}
      {!isCompactMode && (
        <div className="flex items-center gap-2 bg-slate-950 border border-slate-800/80 rounded-xl px-3 py-2 text-xs">
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

      {/* 게시글 테이블 (DC갤 / 모던 보드 스타일) */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800/80 bg-slate-950/70 text-slate-400 font-bold">
                <th className="py-2.5 px-3 w-16 text-center">말머리</th>
                <th className="py-2.5 px-4">제목</th>
                <th className="py-2.5 px-3 w-32">글쓴이</th>
                <th className="py-2.5 px-3 w-20 text-center">시간</th>
                <th className="py-2.5 px-2.5 w-14 text-center">조회</th>
                <th className="py-2.5 px-2.5 w-14 text-center">추천</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    갤러리 게시글을 불러오는 중...
                  </td>
                </tr>
              ) : filteredPosts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500 space-y-2">
                    <p>등록된 게시글이 없습니다.</p>
                    <button
                      onClick={() => setIsWriteOpen(true)}
                      className="text-blue-400 font-bold hover:underline"
                    >
                      첫 번째 글을 작성해보세요!
                    </button>
                  </td>
                </tr>
              ) : (
                filteredPosts.map((post) => (
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
                        {post.isConcept ? "🔥개념" : post.tag || "자유"}
                      </span>
                    </td>

                    {/* 제목 + 댓글수 */}
                    <td className="py-2.5 px-4">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-slate-200 group-hover:text-blue-400 transition-colors line-clamp-1">
                          {post.title}
                        </span>
                        {post.commentCount > 0 && (
                          <span className="text-[11px] font-extrabold text-blue-400 shrink-0">
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
                      {new Date(post.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </td>

                    {/* 조회수 */}
                    <td className="py-2.5 px-2.5 text-center text-slate-500 font-mono text-[11px]">
                      {post.viewCount}
                    </td>

                    {/* 추천수 */}
                    <td className="py-2.5 px-2.5 text-center font-mono text-[11px] font-bold">
                      <span className={post.likeCount > 0 ? "text-amber-400" : "text-slate-600"}>
                        {post.likeCount}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 📝 글쓰기 모달 */}
      {isWriteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <PenSquare className="w-5 h-5 text-emerald-400" />
                <span>새 게시글 작성</span>
              </h3>
              <button
                onClick={() => setIsWriteOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePost} className="space-y-4">
              {/* 카테고리 선택 */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">카테고리</label>
                <select
                  value={writeCategory}
                  onChange={(e) => setWriteCategory(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="economy">📈 경제·주식</option>
                  <option value="crypto">🪙 크립토</option>
                  <option value="politics">🏛️ 정치·사회</option>
                  <option value="culture">🍿 엔터·문화</option>
                  <option value="free">☕ 자유·잡담</option>
                </select>
              </div>

              {/* 연동 게임 안내 */}
              {gameFilterTitle && (
                <div className="p-2.5 rounded-xl bg-blue-950/40 border border-blue-800/40 text-xs text-blue-300 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-blue-400 shrink-0" />
                  <span>
                    <strong>[{gameFilterTitle}]</strong> 예측과 자동 연동됩니다.
                  </span>
                </div>
              )}

              {/* 제목 */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">제목</label>
                <input
                  type="text"
                  placeholder="제목을 입력하세요"
                  value={writeTitle}
                  onChange={(e) => setWriteTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-semibold focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              {/* 내용 */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">내용</label>
                <textarea
                  placeholder="소신 있는 의견과 예측 근거를 작성해주세요. (건전한 토론 문화 지향)"
                  value={writeContent}
                  onChange={(e) => setWriteContent(e.target.value)}
                  rows={6}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white leading-relaxed focus:outline-none focus:border-blue-500 resize-none"
                  required
                />
              </div>

              {/* 버튼 */}
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsWriteOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white bg-slate-950 border border-slate-800"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl text-xs font-extrabold bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20 disabled:opacity-50"
                >
                  {isSubmitting ? "등록 중..." : "게시하기"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 📖 글 상세 보기 모달 */}
      {selectedPostId && selectedPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            {/* 상단 헤더 */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-800 bg-slate-950/60 shrink-0">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-950 text-blue-300 border border-blue-800/40">
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
                <div className="flex items-center gap-2 text-xs text-slate-400 pb-3 border-b border-slate-800">
                  <span className="font-bold text-slate-300">{selectedPost.authorName}</span>
                  {selectedPost.authorBadge && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-950 text-blue-300 border border-blue-800">
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
                  className="block p-4 rounded-2xl bg-gradient-to-r from-blue-950/60 to-indigo-950/60 border border-blue-800/50 hover:border-blue-500 transition-all group"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="text-[10px] font-bold text-blue-400 flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        <span>연계된 예측 게임</span>
                      </div>
                      <div className="text-xs font-extrabold text-white group-hover:text-blue-300 transition-colors">
                        {selectedPost.gameTitle}
                      </div>
                    </div>
                    <span className="text-xs font-bold text-blue-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                      <span>예측 참여</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </Link>
              )}

              {/* 본문 내용 */}
              <div className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap py-2">
                {selectedPost.content}
              </div>

              {/* 추천 / 비추천 (개념글 가기 버튼) */}
              <div className="flex justify-center gap-4 py-4 border-y border-slate-800">
                <button
                  onClick={() => handleVote("up")}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-slate-950 border border-amber-500/30 hover:border-amber-400 text-amber-300 hover:bg-amber-950/30 font-extrabold text-xs transition-all shadow-lg"
                >
                  <ThumbsUp className="w-4 h-4 text-amber-400" />
                  <span>개념 추천 {selectedPost.likeCount}</span>
                </button>
              </div>

              {/* 댓글 섹션 */}
              <div className="space-y-4">
                <h4 className="text-xs font-extrabold text-white flex items-center gap-1.5">
                  <MessageSquare className="w-4 h-4 text-blue-400" />
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
                        className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1 text-xs"
                      >
                        <div className="flex justify-between items-center text-[11px] text-slate-400">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-300">{c.authorName}</span>
                            {c.authorBadge && (
                              <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black bg-blue-950 text-blue-300 border border-blue-800/60">
                                {c.authorBadge}
                              </span>
                            )}
                          </div>
                          <span>
                            {new Date(c.createdAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                        <p className="text-slate-200">{c.content}</p>
                      </div>
                    ))
                  )}
                </div>

                {/* 알림 메시지 */}
                {rewardNotice && (
                  <div className="p-2.5 rounded-xl bg-emerald-950/60 border border-emerald-800/60 text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>{rewardNotice}</span>
                  </div>
                )}

                {/* 댓글 작성 폼 */}
                <form onSubmit={handleAddComment} className="flex gap-2 pt-2">
                  <input
                    type="text"
                    placeholder="댓글을 입력하세요 (+10 PMP 지급)..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                  <button
                    type="submit"
                    disabled={isCommentSubmitting || !newComment.trim()}
                    className="px-4 py-2 rounded-xl text-xs font-extrabold bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-50"
                  >
                    등록
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

