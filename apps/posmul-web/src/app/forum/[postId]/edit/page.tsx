"use client";

import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, PenSquare, Sparkles, Save } from "lucide-react";
import { getGalleryPostDetailAction, updateGalleryPostAction } from "../../actions/gallery.actions";
const TiptapForumEditor = dynamic(
  () => import("../../components/TiptapForumEditor").then((m) => m.TiptapForumEditor),
  {
    ssr: false,
    loading: () => (
      <div className="h-64 w-full animate-pulse rounded-xl bg-slate-900/60 border border-slate-800" />
    ),
  }
);

export default function ForumPostEditPage() {
  const params = useParams();
  const router = useRouter();
  const postId = params.postId as string;

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("economy");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!postId) return;
    setIsLoading(true);
    getGalleryPostDetailAction(postId).then((res) => {
      if (res.success && res.post) {
        setTitle(res.post.title);
        setContent(res.post.content);
        setCategory(res.post.categoryId || "economy");
      } else {
        alert(res.error || "게시글 정보를 불러올 수 없습니다.");
        router.push("/forum");
      }
      setIsLoading(false);
    });
  }, [postId, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert("제목을 입력해주세요.");
      return;
    }

    const stripped = content.replace(/<[^>]*>?/gm, "").trim();
    const hasImage = content.includes("<img");
    const hasIframe = content.includes("<iframe");
    if (!stripped && !hasImage && !hasIframe) {
      alert("내용을 입력해주세요.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await updateGalleryPostAction({
        postId,
        title,
        content,
        category,
      });

      if (res.success) {
        alert("게시글이 성공적으로 수정되었습니다!");
        router.push(`/forum/${postId}`);
      } else {
        alert(res.error || "게시글 수정에 실패했습니다.");
      }
    } catch (err) {
      console.error("수정 오류:", err);
      alert("게시글 수정 중 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#07090e] text-slate-100 flex items-center justify-center text-xs text-slate-500">
        게시글 정보를 불러오는 중...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 py-6 sm:py-8 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* 상단 네비게이션 헤더 */}
        <div className="flex items-center justify-between">
          <Link
            href={`/forum/${postId}`}
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white transition group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span>상세 글로 돌아가기</span>
          </Link>
        </div>

        {/* 메인 글 수정 캔버스 */}
        <div className="rounded-3xl bg-[#111520] border border-white/[0.08] shadow-2xl p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
            <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2.5">
              <PenSquare className="w-6 h-6 text-sky-400" />
              <span>게시글 수정하기</span>
            </h1>
            <span className="text-xs text-slate-400">작성자 본인 수정</span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* 카테고리 선택 */}
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

            {/* 제목 인풋 */}
            <div>
              <input
                type="text"
                placeholder="제목을 입력하세요..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={100}
                className="w-full bg-[#0c0f17] border border-white/[0.1] rounded-2xl px-5 py-3.5 text-sm sm:text-base font-bold text-white focus:outline-none focus:border-sky-500 transition placeholder:text-slate-600"
                required
              />
            </div>

            {/* 본문 리치 에디터 */}
            <div>
              <TiptapForumEditor
                content={content}
                onChange={setContent}
                placeholder="수정할 본문 내용을 작성하세요..."
              />
            </div>

            {/* 하단 액션 버튼 */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/[0.08]">
              <Link
                href={`/forum/${postId}`}
                className="px-5 py-2.5 rounded-2xl bg-slate-900 border border-slate-700 text-xs font-bold text-slate-300 hover:text-white transition"
              >
                취소
              </Link>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2 px-7 py-3 rounded-2xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white font-black text-xs sm:text-sm shadow-xl transition-all disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{isSubmitting ? "수정 내용 저장 중..." : "수정 완료"}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

