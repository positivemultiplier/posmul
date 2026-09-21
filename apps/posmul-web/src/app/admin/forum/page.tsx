"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { MessageSquare, ArrowLeft, Plus, RefreshCw, Eye, EyeOff, Trash2, Send } from "lucide-react";

interface ForumPostItem {
  post_id: string;
  id?: string;
  title: string;
  content: string;
  status: string;
  created_at: string;
}

export default function AdminForumPage() {
  const [posts, setPosts] = useState<ForumPostItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // 작성 폼 상태
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/forum");
      const data = await res.json();
      if (data.success) {
        setPosts(data.posts || []);
      } else {
        alert(`Failed to fetch posts: ${data.error}`);
      }
    } catch (e: any) {
      alert(`Error fetching posts: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  // 토론글 생성
  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) {
      alert("제목과 내용을 입력해 주세요.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/forum", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create",
          title: newTitle,
          content: newContent,
        }),
      });

      const data = await res.json();
      if (data.success) {
        alert("🎉 토론 게시글이 작성되었습니다!");
        setNewTitle("");
        setNewContent("");
        fetchPosts();
      } else {
        alert(`작성 실패: ${data.error}`);
      }
    } catch (e: any) {
      alert(`Error creating post: ${e.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  // 상태 변경
  const handleToggleStatus = async (postId: string, currentStatus: string) => {
    const nextStatus = currentStatus === "published" ? "hidden" : "published";
    try {
      const res = await fetch("/api/admin/forum", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update-status",
          postId,
          status: nextStatus,
        }),
      });
      const data = await res.json();
      if (data.success) {
        fetchPosts();
      } else {
        alert(`상태 변경 실패: ${data.error}`);
      }
    } catch (e: any) {
      alert(`Error toggling status: ${e.message}`);
    }
  };

  // 게시글 삭제
  const handleDeletePost = async (postId: string) => {
    if (!confirm("이 게시글을 삭제하시겠습니까?")) return;

    try {
      const res = await fetch("/api/admin/forum", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "delete",
          postId,
        }),
      });
      const data = await res.json();
      if (data.success) {
        fetchPosts();
      } else {
        alert(`삭제 실패: ${data.error}`);
      }
    } catch (e: any) {
      alert(`Error deleting post: ${e.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Navigation Top */}
        <div className="flex justify-between items-center border-b border-slate-800 pb-4">
          <Link
            href="/admin"
            className="text-xs font-semibold text-slate-400 hover:text-slate-100 transition flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> /admin 메인 포털로 돌아가기
          </Link>
          <span className="text-xs text-slate-500 font-mono">FORUM & DISCUSSION ADMIN</span>
        </div>

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-300 to-rose-400 flex items-center gap-2">
              <MessageSquare className="w-8 h-8 text-purple-400" />
              포럼 & 시민 토론 관리자
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              시민 정책 토론 게시글 모니터링, 신규 이슈 등록 및 게시글 공개/비공개 상태를 관리합니다.
            </p>
          </div>

          <button
            onClick={fetchPosts}
            disabled={loading}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-200 rounded-xl text-xs font-semibold transition border border-slate-800 flex items-center gap-1.5 shadow-md"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-purple-400" : ""}`} />
            {loading ? "불러오는 중..." : "새로고침"}
          </button>
        </div>

        {/* Create Post Form */}
        <form onSubmit={handleCreatePost} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <h2 className="text-lg font-bold text-slate-200 flex items-center gap-2">
            <Plus className="w-5 h-5 text-purple-400" /> 신규 토론 게시글 작성
          </h2>

          <div className="space-y-3">
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="토론 주제 제목을 입력하세요."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-slate-100 focus:outline-none focus:border-purple-500 transition"
              required
            />
            <textarea
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              rows={3}
              placeholder="시민들과 토론할 핵심 논점 및 배경 내용을 작성하세요."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 focus:outline-none focus:border-purple-500 transition"
              required
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-purple-900/30 flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              {submitting ? "작성 중..." : "토론글 개설"}
            </button>
          </div>
        </form>

        {/* Posts List */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-slate-200 flex items-center gap-2">
            💬 게시된 포럼 토론 목록 ({posts.length}개)
          </h2>

          {posts.length === 0 ? (
            <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-12 text-center text-slate-400">
              게시된 토론글이 없습니다. 상단에서 첫 토론글을 개설해 보세요!
            </div>
          ) : (
            <div className="space-y-4">
              {posts.map((post, idx) => {
                const pId = post.post_id || post.id || `post-${idx}`;
                const isPublished = post.status === "published";

                return (
                  <div
                    key={pId}
                    className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between hover:border-purple-500/40 transition shadow-md"
                  >
                    <div>
                      <div className="flex justify-between items-start gap-2 mb-2">
                        <span
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                            isPublished
                              ? "bg-purple-950 text-purple-400 border border-purple-800/60"
                              : "bg-slate-800 text-slate-500 border border-slate-700"
                          }`}
                        >
                          {isPublished ? "공개 게시됨" : "숨김 (비공개)"}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          {new Date(post.created_at).toLocaleString("ko-KR")}
                        </span>
                      </div>

                      <h3 className="text-lg font-bold text-slate-100 mb-2">{post.title}</h3>
                      <p className="text-xs text-slate-400 line-clamp-3 whitespace-pre-line bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                        {post.content}
                      </p>
                    </div>

                    <div className="mt-4 pt-4 border-t border-slate-800/80 flex justify-end gap-2">
                      <button
                        onClick={() => handleToggleStatus(pId, post.status)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition flex items-center gap-1 ${
                          isPublished
                            ? "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"
                            : "bg-purple-950 border-purple-800 text-purple-300 hover:bg-purple-900"
                        }`}
                      >
                        {isPublished ? (
                          <>
                            <EyeOff className="w-3.5 h-3.5" /> 숨기기
                          </>
                        ) : (
                          <>
                            <Eye className="w-3.5 h-3.5" /> 공개하기
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => handleDeletePost(pId)}
                        className="px-3 py-1.5 bg-rose-950 hover:bg-rose-900 border border-rose-800 text-rose-300 rounded-lg text-xs font-semibold transition flex items-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> 삭제
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
