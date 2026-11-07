"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  MessageSquare,
  ArrowLeft,
  Plus,
  RefreshCw,
  Eye,
  EyeOff,
  Trash2,
  Send,
  ShieldAlert,
  ShieldCheck,
  Ban,
  Clock,
  Unlock,
  AlertTriangle,
  Bot,
  Activity,
} from "lucide-react";

interface ForumPostItem {
  id?: string;
  post_id?: string;
  title: string;
  content: string;
  status: string;
  author_ip?: string;
  created_at: string;
}

interface BannedIpItem {
  id: string;
  ip_address: string;
  reason: string;
  banned_by: string;
  is_active: boolean;
  expires_at?: string | null;
  created_at: string;
}

export default function AdminForumPage() {
  const [activeTab, setActiveTab] = useState<"posts" | "ip-defense">("posts");
  const [posts, setPosts] = useState<ForumPostItem[]>([]);
  const [bannedIps, setBannedIps] = useState<BannedIpItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // 토론글 작성 폼 상태
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");

  // 수동 IP 차단 폼 상태
  const [manualIp, setManualIp] = useState("");
  const [manualReason, setManualReason] = useState("");
  const [manualExpiresHours, setManualExpiresHours] = useState("0"); // 0이면 영구

  // 데이터 로드
  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/forum");
      const data = await res.json();
      if (data.success) {
        setPosts(data.posts || []);
        setBannedIps(data.bannedIps || []);
      } else {
        alert(`데이터 불러오기 실패: ${data.error}`);
      }
    } catch (e: any) {
      alert(`데이터 로드 중 에러: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
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
        fetchData();
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
        fetchData();
      } else {
        alert(`상태 변경 실패: ${data.error}`);
      }
    } catch (e: any) {
      alert(`Error toggling status: ${e.message}`);
    }
  };

  // 일반 삭제
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
        fetchData();
      } else {
        alert(`삭제 실패: ${data.error}`);
      }
    } catch (e: any) {
      alert(`Error deleting post: ${e.message}`);
    }
  };

  // 스팸 삭제 + 작성자 IP 영구 차단
  const handlePurgeAndBan = async (postId: string, ip?: string) => {
    const confirmMsg = ip
      ? `🚨 [스팸 글 삭제 + IP 영구 차단]\n게시글을 삭제하고 해당 IP (${ip})를 즉시 영구 차단하시겠습니까?`
      : "🚨 [스팸 글 삭제]\n게시글을 삭제하시겠습니까?";

    if (!confirm(confirmMsg)) return;

    try {
      const res = await fetch("/api/admin/forum", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "purge-post-and-ban-ip",
          postId,
          reason: "스팸 봇 및 부적절한 도배 게시물 작성으로 차단",
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert(
          data.ipBanned
            ? `✅ 글 삭제 및 IP (${data.bannedIp})가 차단 목록에 등록되었습니다!`
            : "✅ 글이 삭제되었습니다."
        );
        fetchData();
      } else {
        alert(`차단 처리 실패: ${data.error}`);
      }
    } catch (e: any) {
      alert(`Error purging post and banning IP: ${e.message}`);
    }
  };

  // 수동 IP 차단 등록
  const handleManualBanIp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualIp.trim()) {
      alert("차단할 IP 주소를 입력해주세요.");
      return;
    }

    try {
      const res = await fetch("/api/admin/forum", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "ban-ip",
          ip: manualIp.trim(),
          reason: manualReason.trim() || "관리자 수동 차단",
          expiresHours: Number(manualExpiresHours) > 0 ? Number(manualExpiresHours) : null,
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert(`🛡️ IP (${manualIp}) 차단이 등록되었습니다!`);
        setManualIp("");
        setManualReason("");
        setManualExpiresHours("0");
        fetchData();
      } else {
        alert(`차단 실패: ${data.error}`);
      }
    } catch (e: any) {
      alert(`Error banning IP: ${e.message}`);
    }
  };

  // IP 차단 해제
  const handleUnbanIp = async (ip: string) => {
    if (!confirm(`IP (${ip})의 차단을 해제하시겠습니까?`)) return;

    try {
      const res = await fetch("/api/admin/forum", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "unban-ip",
          ip,
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert(`✅ IP (${ip}) 차단이 해제되었습니다.`);
        fetchData();
      } else {
        alert(`차단 해제 실패: ${data.error}`);
      }
    } catch (e: any) {
      alert(`Error unbanning IP: ${e.message}`);
    }
  };

  const activeBannedCount = bannedIps.filter((b) => b.is_active).length;
  const honeypotBannedCount = bannedIps.filter((b) => b.banned_by?.includes("HONEYPOT")).length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Navigation Top */}
        <div className="flex justify-between items-center border-b border-slate-800 pb-4">
          <Link
            href="/admin"
            className="text-xs font-semibold text-slate-400 hover:text-slate-100 transition flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> /admin 메인 포털로 돌아가기
          </Link>
          <span className="text-xs text-slate-500 font-mono">FORUM & BOT DEFENSE CONSOLE</span>
        </div>

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-300 to-rose-400 flex items-center gap-2.5">
              <MessageSquare className="w-8 h-8 text-purple-400" />
              포럼 & 봇 방어 관리 콘솔
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              시민 정책 토론 게시글 모니터링, 외부 봇 자동 차단(허니팟) 및 불량 IP 차단 센터를 총괄합니다.
            </p>
          </div>

          <button
            onClick={fetchData}
            disabled={loading}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-200 rounded-xl text-xs font-semibold transition border border-slate-800 flex items-center gap-1.5 shadow-md"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-purple-400" : ""}`} />
            {loading ? "불러오는 중..." : "새로고침"}
          </button>
        </div>

        {/* 4 KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>총 게시글</span>
              <MessageSquare className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-2xl font-black text-slate-100">{posts.length}건</div>
            <div className="text-[11px] text-slate-500 mt-1">등록된 전체 토론</div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>공개 중 토론</span>
              <Eye className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-black text-emerald-400">
              {posts.filter((p) => p.status === "published").length}건
            </div>
            <div className="text-[11px] text-slate-500 mt-1">시민 참여 가능</div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>활성 차단 IP</span>
              <ShieldAlert className="w-4 h-4 text-rose-400" />
            </div>
            <div className="text-2xl font-black text-rose-400">{activeBannedCount}개</div>
            <div className="text-[11px] text-slate-500 mt-1">접근 차단 중</div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>허니팟 봇 포획</span>
              <Bot className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-black text-amber-400">{honeypotBannedCount}건</div>
            <div className="text-[11px] text-slate-500 mt-1">자동 격리 완료</div>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex border-b border-slate-800 gap-2">
          <button
            onClick={() => setActiveTab("posts")}
            className={`px-5 py-3 text-sm font-bold flex items-center gap-2 border-b-2 transition ${
              activeTab === "posts"
                ? "border-purple-500 text-purple-400 bg-purple-500/10 rounded-t-xl"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            💬 포럼 토론글 관리 ({posts.length})
          </button>
          <button
            onClick={() => setActiveTab("ip-defense")}
            className={`px-5 py-3 text-sm font-bold flex items-center gap-2 border-b-2 transition ${
              activeTab === "ip-defense"
                ? "border-rose-500 text-rose-400 bg-rose-500/10 rounded-t-xl"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            🚨 봇 방어 & 차단 IP 관리 ({activeBannedCount})
          </button>
        </div>

        {/* Tab 1: 포럼 토론글 관리 */}
        {activeTab === "posts" && (
          <div className="space-y-6">
            {/* Create Post Form */}
            <form onSubmit={handleCreatePost} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
              <h2 className="text-lg font-bold text-slate-200 flex items-center gap-2">
                <Plus className="w-5 h-5 text-purple-400" /> 신규 공식 토론 게시글 작성
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
                💬 모니터링 대상 게시글 ({posts.length}개)
              </h2>

              {posts.length === 0 ? (
                <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-12 text-center text-slate-400">
                  게시된 토론글이 없습니다. 상단에서 첫 토론글을 개설해 보세요!
                </div>
              ) : (
                <div className="space-y-4">
                  {posts.map((post, idx) => {
                    const pId = post.id || post.post_id || `post-${idx}`;
                    const isPublished = post.status === "published";
                    const ip = post.author_ip || "기록 없음";

                    return (
                      <div
                        key={pId}
                        className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between hover:border-purple-500/40 transition shadow-md"
                      >
                        <div>
                          <div className="flex flex-wrap justify-between items-start gap-2 mb-2">
                            <div className="flex items-center gap-2">
                              <span
                                className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                                  isPublished
                                    ? "bg-purple-950 text-purple-400 border border-purple-800/60"
                                    : "bg-slate-800 text-slate-500 border border-slate-700"
                                }`}
                              >
                                {isPublished ? "공개 게시됨" : "숨김 (비공개)"}
                              </span>
                              <span className="px-2 py-0.5 rounded-md bg-slate-950 border border-slate-800 text-[11px] font-mono text-cyan-400">
                                IP: {ip}
                              </span>
                            </div>
                            <span className="text-[11px] text-slate-500">
                              {new Date(post.created_at).toLocaleString("ko-KR")}
                            </span>
                          </div>

                          <h3 className="text-lg font-bold text-slate-100 mb-2">{post.title}</h3>
                          <p className="text-xs text-slate-400 line-clamp-3 whitespace-pre-line bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                            {post.content}
                          </p>
                        </div>

                        <div className="mt-4 pt-4 border-t border-slate-800/80 flex flex-wrap justify-end gap-2">
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
                            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded-lg text-xs font-semibold transition flex items-center gap-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> 단순 삭제
                          </button>

                          {/* 스팸 글 삭제 + 작성자 IP 영구 차단 원클릭 버튼 */}
                          <button
                            onClick={() => handlePurgeAndBan(pId, post.author_ip)}
                            className="px-3 py-1.5 bg-rose-950 hover:bg-rose-900 border border-rose-800 text-rose-200 rounded-lg text-xs font-bold transition flex items-center gap-1 shadow-sm"
                            title="게시글 삭제와 동시에 작성자 IP를 즉시 차단합니다"
                          >
                            <Ban className="w-3.5 h-3.5 text-rose-400" /> 스팸 삭제 + IP 차단
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: 봇 방어 & 차단 IP 관리센터 */}
        {activeTab === "ip-defense" && (
          <div className="space-y-6">
            {/* Manual IP Ban Form */}
            <form onSubmit={handleManualBanIp} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
              <h2 className="text-lg font-bold text-slate-200 flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-rose-400" /> 수동 IP 차단 등록
              </h2>
              <p className="text-xs text-slate-400">
                악의적인 도배, 외부 스크래핑 봇, 해킹 시도 IP를 수동으로 등록하여 포럼 및 API 접근을 차단합니다.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1">차단할 IP 주소</label>
                  <input
                    type="text"
                    value={manualIp}
                    onChange={(e) => setManualIp(e.target.value)}
                    placeholder="예: 211.234.55.12"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-100 font-mono focus:outline-none focus:border-rose-500 transition"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1">차단 사유</label>
                  <input
                    type="text"
                    value={manualReason}
                    onChange={(e) => setManualReason(e.target.value)}
                    placeholder="예: 도배 광고 봇, 악성 크롤러"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-rose-500 transition"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1">차단 기간</label>
                  <select
                    value={manualExpiresHours}
                    onChange={(e) => setManualExpiresHours(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-rose-500 transition"
                  >
                    <option value="0">영구 차단 (Permanent)</option>
                    <option value="24">1일 (24시간)</option>
                    <option value="168">7일 (1주일)</option>
                    <option value="720">30일 (1개월)</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-rose-900/30 flex items-center gap-1.5"
                >
                  <Ban className="w-3.5 h-3.5" />
                  IP 즉시 차단 등록
                </button>
              </div>
            </form>

            {/* Banned IP List Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-bold text-slate-200 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" /> 차단된 IP 목록 ({bannedIps.length}개)
                </h2>
                <span className="text-xs text-slate-500">
                  허니팟 자동 트랩 및 관리자 수동 차단 기록
                </span>
              </div>

              {bannedIps.length === 0 ? (
                <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-8 text-center text-slate-400 text-xs">
                  현재 등록된 차단 IP가 없습니다. 포럼이 청정하게 유지되고 있습니다.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 font-semibold">
                        <th className="pb-3 px-3">IP 주소</th>
                        <th className="pb-3 px-3">차단 사유</th>
                        <th className="pb-3 px-3">등록 경로</th>
                        <th className="pb-3 px-3">상태</th>
                        <th className="pb-3 px-3">등록일시</th>
                        <th className="pb-3 px-3 text-right">관리</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {bannedIps.map((b) => (
                        <tr key={b.id} className="hover:bg-slate-800/30 transition">
                          <td className="py-3 px-3 font-mono font-bold text-slate-100 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-rose-500 inline-block"></span>
                            {b.ip_address}
                          </td>
                          <td className="py-3 px-3 text-slate-300 max-w-xs truncate" title={b.reason}>
                            {b.reason}
                          </td>
                          <td className="py-3 px-3">
                            <span
                              className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                                b.banned_by?.includes("HONEYPOT")
                                  ? "bg-amber-950 text-amber-400 border border-amber-800/50"
                                  : b.banned_by?.includes("SPAM_PURGE")
                                  ? "bg-rose-950 text-rose-400 border border-rose-800/50"
                                  : "bg-blue-950 text-blue-400 border border-blue-800/50"
                              }`}
                            >
                              {b.banned_by || "SYSTEM"}
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            {b.is_active ? (
                              <span className="text-rose-400 font-bold flex items-center gap-1">
                                <Ban className="w-3 h-3" /> 차단 활성
                              </span>
                            ) : (
                              <span className="text-slate-500 flex items-center gap-1">
                                <Unlock className="w-3 h-3" /> 해제됨
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-slate-500">
                            {new Date(b.created_at).toLocaleString("ko-KR")}
                          </td>
                          <td className="py-3 px-3 text-right">
                            {b.is_active ? (
                              <button
                                onClick={() => handleUnbanIp(b.ip_address)}
                                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-lg text-[11px] font-semibold transition inline-flex items-center gap-1"
                              >
                                <Unlock className="w-3 h-3 text-emerald-400" /> 차단 해제
                              </button>
                            ) : (
                              <span className="text-[11px] text-slate-600">-</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
