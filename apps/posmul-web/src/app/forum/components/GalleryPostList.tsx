"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Flame,
  TrendingUp,
  Coins,
  Landmark,
  Film,
  Coffee,
  PenSquare,
  Search,
  Sparkles,
  ImageIcon,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Layers,
  FileText,
} from "lucide-react";
import Link from "next/link";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import {
  GalleryPostDTO,
  getGalleryPostsAction,
} from "../actions/gallery.actions";

interface GalleryPostListProps {
  initialPosts?: GalleryPostDTO[];
  gameFilterId?: string;
  gameFilterTitle?: string;
  isCompactMode?: boolean;
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

const PAGE_SIZE = 15; // 페이지당 표시 글 개수

export function GalleryPostList({
  initialPosts = [],
  gameFilterId,
  gameFilterTitle,
  isCompactMode = false,
}: GalleryPostListProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const boardRef = useRef<HTMLDivElement>(null);

  // URL searchParams 기반 초기 상태 설정
  const paramCategory = searchParams.get("category") || "all";
  const paramPage = parseInt(searchParams.get("page") || "1", 10) || 1;

  const [activeCategory, setActiveCategory] = useState(paramCategory);
  const [currentPage, setCurrentPage] = useState(paramPage);
  const [totalPosts, setTotalPosts] = useState(0);
  const [posts, setPosts] = useState<GalleryPostDTO[]>(initialPosts);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchPosts = async (cat: string, pageNum: number) => {
    setIsLoading(true);
    try {
      const res = await getGalleryPostsAction({
        category: cat,
        gameId: gameFilterId,
        page: pageNum,
        limit: PAGE_SIZE,
      });
      if (res.success && res.posts) {
        setPosts(res.posts);
        setTotalPosts(res.total || 0);
      }
    } catch (e) {
      console.error("포스트 로드 실패:", e);
    } finally {
      setIsLoading(false);
    }
  };

  // 카테고리 또는 페이지 변경 시 데이터 호출 및 URL 동기화
  useEffect(() => {
    fetchPosts(activeCategory, currentPage);

    // URL 쿼리 파라미터 업데이트 (히스토리 스택 유지)
    if (!isCompactMode) {
      const params = new URLSearchParams(searchParams.toString());
      if (activeCategory !== "all") {
        params.set("category", activeCategory);
      } else {
        params.delete("category");
      }
      if (currentPage > 1) {
        params.set("page", currentPage.toString());
      } else {
        params.delete("page");
      }
      const newQuery = params.toString();
      const targetUrl = newQuery ? `${pathname}?${newQuery}` : pathname;
      window.history.replaceState(null, "", targetUrl);
    }
  }, [activeCategory, currentPage, gameFilterId]);

  // 카테고리 탭 클릭 처리
  const handleCategoryChange = (newCat: string) => {
    if (newCat === activeCategory) return;
    setActiveCategory(newCat);
    setCurrentPage(1); // 카테고리 변경 시 1페이지로 리셋
  };

  // 페이지 변경 처리
  const handlePageChange = (newPage: number) => {
    if (newPage === currentPage || newPage < 1 || newPage > totalPages) return;
    setCurrentPage(newPage);
    if (boardRef.current) {
      boardRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const filteredPosts = posts.filter(
    (p) =>
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.authorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.tag && p.tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const totalPages = Math.max(1, Math.ceil(totalPosts / PAGE_SIZE));

  // 페이지네이션 숫자 범위 계산 (현재 페이지 기준 앞뒤 2개씩 최대 5개 노출)
  const getPageNumbers = () => {
    const pageGroupSize = 5;
    let startPage = Math.max(1, currentPage - Math.floor(pageGroupSize / 2));
    let endPage = startPage + pageGroupSize - 1;

    if (endPage > totalPages) {
      endPage = totalPages;
      startPage = Math.max(1, endPage - pageGroupSize + 1);
    }

    const pages = [];
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  };

  const conceptHotPosts = posts
    .filter((p) => p.isConcept || p.likeCount >= 3)
    .slice(0, 3);

  const hasPostImage = (content?: string) => Boolean(content && content.includes("<img"));

  return (
    <div ref={boardRef} className="w-full space-y-4">
      {/* 🔥 실시간 포텐/개념글 미니 전광판 */}
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
              <Link
                key={hp.id}
                href={`/forum/${hp.id}`}
                className="flex items-center gap-1.5 text-slate-300 hover:text-amber-300 font-medium truncate shrink-0 max-w-[280px] text-left transition"
              >
                <span className="font-mono font-bold text-amber-400">#{idx + 1}</span>
                <span className="truncate">{hp.title}</span>
                <span className="text-[10px] font-bold text-amber-400">[{hp.commentCount}]</span>
              </Link>
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
                onClick={() => handleCategoryChange(cat.key)}
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

        {/* 글쓰기 버튼 -> /forum/write 전체화면 페이지로 이동 */}
        <Link
          href={
            gameFilterId
              ? `/forum/write?gameId=${gameFilterId}&gameTitle=${encodeURIComponent(gameFilterTitle || "")}`
              : "/forum/write"
          }
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-extrabold bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-500 hover:to-teal-500 shadow-md shadow-emerald-500/20 transition-all shrink-0"
        >
          <PenSquare className="w-4 h-4" />
          <span>글쓰기 (+10 PMP)</span>
        </Link>
      </div>

      {/* 게시판 현황 요약 (총 게시글 수 & 현재 페이지) 및 검색 바 */}
      {!isCompactMode && (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* 총 게시글 카운터 */}
          <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-slate-900/80 border border-slate-800 text-xs">
            <span className="flex items-center gap-1.5 text-slate-300 font-bold">
              <FileText className="w-3.5 h-3.5 text-sky-400" />
              <span>총</span>
              <span className="text-sky-400 font-mono font-black">{totalPosts.toLocaleString()}</span>
              <span>개의 토론글</span>
            </span>
            <span className="text-slate-600">|</span>
            <span className="text-slate-400 text-[11px] font-mono">
              <span className="text-white font-bold">{currentPage}</span> / {totalPages} 페이지
            </span>
            {searchQuery && (
              <span className="text-amber-400 text-[11px] font-bold">
                (검색 일치 {filteredPosts.length}건)
              </span>
            )}
          </div>

          {/* 검색 바 */}
          <div className="flex-1 max-w-sm flex items-center gap-2 bg-[#0e111a] border border-white/[0.08] rounded-xl px-3 py-2 text-xs">
            <Search className="w-4 h-4 text-slate-500 shrink-0" />
            <input
              type="text"
              placeholder="제목, 작성자, 또는 말머리 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent text-slate-200 placeholder-slate-600 focus:outline-none text-xs"
            />
          </div>
        </div>
      )}

      {/* 게시글 목록 (PC 테이블 + 모바일 2열 디시/펨코 스택) */}
      <div className="bg-[#111520] border border-white/[0.08] rounded-2xl overflow-hidden shadow-xl">
        {isLoading ? (
          <div className="py-20 text-center text-slate-500 text-xs flex flex-col items-center justify-center gap-2">
            <div className="w-6 h-6 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
            <span>갤러리 게시글을 불러오는 중...</span>
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="py-16 text-center text-slate-500 text-xs space-y-2">
            <p>등록된 게시글이 없습니다.</p>
            <Link
              href="/forum/write"
              className="inline-block text-sky-400 font-bold hover:underline"
            >
              첫 번째 글을 작성해보세요! (+10 PMP)
            </Link>
          </div>
        ) : (
          <>
            {/* 1. PC 뷰 (테이블 형태 -> 클릭 시 /forum/[id] 전체화면 페이지 이동) */}
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
                        className="hover:bg-slate-800/40 cursor-pointer transition-colors group"
                      >
                        {/* 말머리 태그 */}
                        <td className="py-2.5 px-3 text-center">
                          <Link href={`/forum/${post.id}`} className="block">
                            <span
                              className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                post.isConcept
                                  ? "bg-amber-950/80 text-amber-300 border border-amber-800/50"
                                  : "bg-slate-800/80 text-slate-400 border border-slate-700/50"
                              }`}
                            >
                              {post.isConcept ? "🔥포텐" : post.tag || "자유"}
                            </span>
                          </Link>
                        </td>

                        {/* 제목 + 댓글수 + 짤방 아이콘 */}
                        <td className="py-2.5 px-4">
                          <Link href={`/forum/${post.id}`} className="flex items-center gap-1.5">
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
                          </Link>
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

                        {/* 추천수 */}
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

            {/* 2. 모바일 전용 뷰 (클릭 시 /forum/[id] 전체화면 이동) */}
            <div className="sm:hidden divide-y divide-white/[0.05]">
              {filteredPosts.map((post) => {
                const isImg = hasPostImage(post.content);
                return (
                  <Link
                    key={post.id}
                    href={`/forum/${post.id}`}
                    className="p-3.5 hover:bg-slate-800/40 transition flex items-start gap-3 block"
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
                  </Link>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* 🌟 3. 하단 페이지네이션 컨트롤러 (이전 / 1 2 3 ... / 다음) */}
      {!isCompactMode && totalPages > 1 && (
        <div className="flex items-center justify-center gap-1 sm:gap-2 py-4">
          {/* 맨 처음으로 버튼 */}
          <button
            onClick={() => handlePageChange(1)}
            disabled={currentPage === 1}
            title="첫 페이지"
            className="p-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white bg-slate-900/80 hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none border border-slate-800 transition"
          >
            <ChevronsLeft className="w-4 h-4" />
          </button>

          {/* 이전 페이지 버튼 */}
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            title="이전 페이지"
            className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold text-slate-300 hover:text-white bg-slate-900/80 hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none border border-slate-800 transition"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden sm:inline">이전</span>
          </button>

          {/* 숫자 버튼들 */}
          <div className="flex items-center gap-1">
            {getPageNumbers().map((num) => {
              const isCurrent = num === currentPage;
              return (
                <button
                  key={num}
                  onClick={() => handlePageChange(num)}
                  className={`w-9 h-9 rounded-xl text-xs font-mono font-bold transition-all ${
                    isCurrent
                      ? "bg-sky-500 text-slate-950 shadow-lg shadow-sky-500/25 font-black scale-105"
                      : "text-slate-400 hover:text-white bg-slate-900/60 hover:bg-slate-800 border border-slate-800/80"
                  }`}
                >
                  {num}
                </button>
              );
            })}
          </div>

          {/* 다음 페이지 버튼 */}
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            title="다음 페이지"
            className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold text-slate-300 hover:text-white bg-slate-900/80 hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none border border-slate-800 transition"
          >
            <span className="hidden sm:inline">다음</span>
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* 맨 끝으로 버튼 */}
          <button
            onClick={() => handlePageChange(totalPages)}
            disabled={currentPage === totalPages}
            title="마지막 페이지"
            className="p-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white bg-slate-900/80 hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none border border-slate-800 transition"
          >
            <ChevronsRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
