"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Sparkles,
  PenSquare,
  X,
  TrendingUp,
  Flame,
  Award,
} from "lucide-react";
import {
  createGalleryPostAction,
  getActivePredictionGamesForForumAction,
} from "../actions/gallery.actions";
import { TiptapForumEditor } from "../components/TiptapForumEditor";

interface AttachedGame {
  id: string;
  title: string;
  category: string;
  options: Array<{ id: string; text: string }>;
  allocatedPrizePool: number;
}

export default function ForumWritePage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialGameId = searchParams.get("gameId") || undefined;
  const initialGameTitle = searchParams.get("gameTitle") || undefined;

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("economy");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 예측 게임 연동 상태
  const [availableGames, setAvailableGames] = useState<AttachedGame[]>([]);
  const [selectedGame, setSelectedGame] = useState<AttachedGame | null>(null);
  const [isGameSelectModalOpen, setIsGameSelectModalOpen] = useState(false);

  // 1. 활성 예측 게임 목록 조회
  useEffect(() => {
    getActivePredictionGamesForForumAction().then((res) => {
      if (res.success && res.games) {
        setAvailableGames(res.games);
        if (initialGameId) {
          const match = res.games.find((g) => g.id === initialGameId);
          if (match) {
            setSelectedGame(match);
          } else if (initialGameTitle) {
            setSelectedGame({
              id: initialGameId,
              title: initialGameTitle,
              category: "ECONOMY",
              options: [
                { id: "yes", text: "상승 (Yes)" },
                { id: "no", text: "하락 (No)" },
              ],
              allocatedPrizePool: 2200,
            });
          }
        }
      }
    });
  }, [initialGameId, initialGameTitle]);

  // 2. 글 등록 처리
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert("제목을 입력해주세요.");
      return;
    }

    const stripped = content.replace(/<[^>]*>?/gm, "").trim();
    const hasImage = content.includes("<img");
    if (!stripped && !hasImage) {
      alert("내용 또는 짤방 이미지를 입력해주세요.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await createGalleryPostAction({
        title,
        content,
        category,
        gameId: selectedGame?.id,
        gameTitle: selectedGame?.title,
      });

      if (res.success && res.post) {
        alert("게시글이 성공적으로 등록되었습니다! (+10 PMP 획득 🎁)");
        router.push(`/forum/${res.post.id}`);
      } else {
        alert(res.error || "게시글 작성에 실패했습니다.");
      }
    } catch (err) {
      console.error("작성 오류:", err);
      alert("게시글 등록 중 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 py-6 sm:py-8 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* 상단 네비게이션 헤더 */}
        <div className="flex items-center justify-between">
          <Link
            href="/forum"
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white transition group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span>포럼 목록으로 돌아가기</span>
          </Link>

          <div className="flex items-center gap-2">
            <span className="text-xs text-amber-400 font-bold flex items-center gap-1 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-400/20">
              <Sparkles className="w-3.5 h-3.5" />
              <span>작성 완료 시 +10 PMP 지급</span>
            </span>
          </div>
        </div>

        {/* 메인 글쓰기 캔버스 (전체화면 카드) */}
        <div className="rounded-3xl bg-[#111520] border border-white/[0.08] shadow-2xl p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
            <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2.5">
              <PenSquare className="w-6 h-6 text-emerald-400" />
              <span>새 게시글 작성</span>
            </h1>
            <span className="text-xs text-slate-400">
              디시·에펨코리아형 리치 에디터
            </span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* 1. 카테고리 선택 및 예측 연동 버튼 바 */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-slate-400">말머리</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="bg-[#0c0f17] border border-white/[0.1] rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-sky-500"
                >
                  <option value="economy">📈 경제·주식</option>
                  <option value="crypto">🪙 크립토</option>
                  <option value="politics">🏛️ 정치·사회</option>
                  <option value="culture">🍿 엔터·문화</option>
                  <option value="free">☕ 자유·뻘글</option>
                </select>
              </div>

              {/* 예측 마켓 연동 버튼 */}
              <button
                type="button"
                onClick={() => setIsGameSelectModalOpen(true)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition ${
                  selectedGame
                    ? "bg-sky-500/15 border-sky-400/40 text-sky-300"
                    : "bg-[#0c0f17] border-white/[0.08] text-slate-300 hover:text-white hover:border-sky-500/40"
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-sky-400" />
                <span>
                  {selectedGame ? "연동된 예측 변경" : "토론할 예측 게임 연동 (선택)"}
                </span>
              </button>
            </div>

            {/* 2. 연동된 예측 마켓 미니 미리보기 카드 (사용자가 연동했을 때 노출) */}
            {selectedGame && (
              <div className="p-4 rounded-2xl bg-gradient-to-r from-sky-950/30 via-indigo-950/20 to-[#0c0f17] border border-sky-500/30 flex items-center justify-between gap-4 animate-in fade-in duration-200">
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 text-[11px] font-bold text-sky-400">
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>본문에 첨부된 예측 게임 박스</span>
                  </div>
                  <h4 className="text-sm font-extrabold text-white truncate">
                    {selectedGame.title}
                  </h4>
                  <div className="flex items-center gap-3 text-xs text-slate-400">
                    <span className="text-amber-300 font-bold">
                      💰 {selectedGame.allocatedPrizePool.toLocaleString()} PMC 상금풀
                    </span>
                    <span>·</span>
                    <span className="text-slate-400">
                      선택지: {selectedGame.options.map((o) => o.text).join(" vs ")}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedGame(null)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-slate-800 transition shrink-0"
                  title="연동 취소"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* 3. 제목 입력 */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">제목</label>
              <input
                type="text"
                placeholder="제목을 입력하세요 (예: 오늘 나스닥 지표 발표 때문에 상승에 올인함)"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-[#0c0f17] border border-white/[0.08] rounded-2xl px-4 py-3 text-sm font-bold text-white focus:outline-none focus:border-sky-500 placeholder:text-slate-600 transition"
                required
              />
            </div>

            {/* 4. Tiptap 전체화면 리치 텍스트 에디터 */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                <span>본문</span>
                <span className="text-[11px] text-slate-400 font-normal">
                  짤방·캡처 복사 후 <strong>Ctrl + V</strong>로 바로 붙여넣기 가능
                </span>
              </label>

              <TiptapForumEditor
                content={content}
                onChange={setContent}
                placeholder="자유롭게 글을 작성하세요. 캡처 이미지(Ctrl+V)나 짤방을 본문에 자유롭게 붙여넣을 수 있습니다..."
                onAttachPredictionClick={() => setIsGameSelectModalOpen(true)}
              />
            </div>

            {/* 5. 하단 등록 및 취소 버튼 바 */}
            <div className="flex items-center justify-between pt-4 border-t border-white/[0.08]">
              <Link
                href="/forum"
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white bg-slate-900 border border-slate-800 transition"
              >
                취소
              </Link>

              <button
                type="submit"
                disabled={isSubmitting}
                className="px-8 py-3 rounded-xl text-xs font-black bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-xl shadow-emerald-500/20 disabled:opacity-50 transition"
              >
                {isSubmitting ? "게시글 등록 중..." : "게시글 등록 (+10 PMP 🎁)"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* 🔍 연동할 예측 마켓 선택 모달 */}
      {isGameSelectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#121621] border border-white/[0.1] rounded-3xl w-full max-w-xl max-h-[80vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="flex justify-between items-center px-6 py-4 border-b border-white/[0.08] bg-[#0c0f17]">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-sky-400" />
                <h3 className="text-base font-extrabold text-white">
                  연동할 예측 마켓 선택
                </h3>
              </div>
              <button
                onClick={() => setIsGameSelectModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-2 divide-y divide-white/[0.04]">
              {availableGames.map((game) => (
                <div
                  key={game.id}
                  onClick={() => {
                    setSelectedGame(game);
                    setIsGameSelectModalOpen(false);
                  }}
                  className="pt-2 pb-2 px-3 rounded-xl hover:bg-slate-800/60 cursor-pointer transition flex items-center justify-between gap-3 group"
                >
                  <div className="min-w-0">
                    <span className="text-[10px] font-bold text-sky-400">
                      [{game.category}]
                    </span>
                    <h5 className="text-xs font-bold text-slate-100 group-hover:text-sky-300 truncate">
                      {game.title}
                    </h5>
                    <span className="text-[11px] text-amber-300 font-semibold">
                      💰 {game.allocatedPrizePool.toLocaleString()} PMC
                    </span>
                  </div>
                  <span className="text-xs font-bold text-sky-400 px-3 py-1 rounded-lg bg-sky-500/15 border border-sky-500/30 shrink-0">
                    선택
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

