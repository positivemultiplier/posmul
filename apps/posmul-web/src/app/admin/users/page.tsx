"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Users,
  Search,
  RefreshCw,
  ShieldCheck,
  UserX,
  UserCheck,
  Coins,
  MapPin,
  Calendar,
  AlertCircle,
  Lock,
  PlusCircle,
  MinusCircle,
  X,
} from "lucide-react";
import {
  AdminBadge,
  AdminButton,
  AdminCard,
  AdminCardHeader,
  AdminCardTitle,
  AdminCardDescription,
  AdminCardContent,
  AdminTable,
  AdminTableHeader,
  AdminTableBody,
  AdminTableRow,
  AdminTableHead,
  AdminTableCell,
} from "../components/shadcn-admin-ui";

interface AdminUserItem {
  id: string;
  username: string;
  displayName: string;
  email: string;
  provider: string;
  connectedProviders?: string[];
  kakaoId?: string | null;
  naverId?: string | null;
  accountStatus: "active" | "suspended" | "banned";
  emailVerified: boolean;
  createdAt: string;
  lastActiveAt: string;
  sido: string;
  jobGroup: string;
  pmpBalance: number;
  pmcBalance: number;
  contributionScore: number;
}

interface UserStats {
  totalUsers: number;
  activeUsers: number;
  suspendedUsers: number;
  todayNewUsers: number;
  kakaoUsers?: number;
  naverUsers?: number;
  googleUsers?: number;
  emailUsers?: number;
}

const SIDO_OPTIONS = [
  "all",
  "서울특별시",
  "경기도",
  "부산광역시",
  "인천광역시",
  "대전광역시",
  "대구광역시",
  "광주광역시",
  "울산광역시",
  "세종특별자치시",
  "강원특별자치도",
  "충청북도",
  "충청남도",
  "전북특별자치도",
  "전라남도",
  "경상북도",
  "경상남도",
  "제주특별자치도",
];

function renderProviderBadge(provider: string) {
  switch (provider) {
    case "kakao":
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-bold bg-[#FEE500]/20 text-[#FEE500] border border-[#FEE500]/40">
          <span className="w-1.5 h-1.5 rounded-full bg-[#FEE500]" />
          카카오 간편가입
        </span>
      );
    case "naver":
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-bold bg-[#03C75A]/20 text-[#03C75A] border border-[#03C75A]/40">
          <span className="w-1.5 h-1.5 rounded-full bg-[#03C75A]" />
          네이버 간편가입
        </span>
      );
    case "google":
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/40">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
          구글 소셜로그인
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium bg-zinc-800 text-zinc-300 border border-zinc-700/60">
          <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
          일반 이메일
        </span>
      );
  }
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUserItem[]>([]);
  const [stats, setStats] = useState<UserStats>({
    totalUsers: 0,
    activeUsers: 0,
    suspendedUsers: 0,
    todayNewUsers: 0,
    kakaoUsers: 0,
    naverUsers: 0,
    googleUsers: 0,
    emailUsers: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sidoFilter, setSidoFilter] = useState("all");
  const [providerFilter, setProviderFilter] = useState("all");

  // 포인트 지급/회수 모달 상태
  const [selectedUser, setSelectedUser] = useState<AdminUserItem | null>(null);
  const [modalType, setModalType] = useState<"grant" | "revoke">("grant");
  const [adjustPmp, setAdjustPmp] = useState(5000);
  const [adjustReason, setAdjustReason] = useState("");
  const [adjusting, setAdjusting] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (sidoFilter !== "all") params.set("sido", sidoFilter);
      if (providerFilter !== "all") params.set("provider", providerFilter);

      const res = await fetch(`/api/admin/users?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setUsers(data.users || []);
        if (data.stats) setStats(data.stats);
      }
    } catch (e: any) {
      alert(`회원 목록 조회 실패: ${e.message}`);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, sidoFilter, providerFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // 회원 상태 변경 (정상 / 정지 / 차단)
  const handleUpdateStatus = async (userId: string, nextStatus: "active" | "suspended" | "banned") => {
    const label = nextStatus === "active" ? "정상 복구" : nextStatus === "suspended" ? "활동 정지" : "영구 차단";
    if (!confirm(`이 회원을 '${label}' 상태로 변경하시겠습니까?`)) return;

    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_status",
          userId,
          status: nextStatus,
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message);
        fetchUsers();
      } else {
        alert(`변경 실패: ${data.error}`);
      }
    } catch (e: any) {
      alert(`상태 변경 오류: ${e.message}`);
    }
  };

  // 포인트 수동 조정 제출
  const handleAdjustBalance = async () => {
    if (!selectedUser) return;
    setAdjusting(true);
    try {
      const pmpChange = modalType === "grant" ? adjustPmp : -adjustPmp;
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "adjust_balance",
          userId: selectedUser.id,
          pmpChange,
          pmcChange: 0,
          reason: adjustReason.trim() || `관리자 수동 ${modalType === "grant" ? "지급" : "회수"}`,
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert(`✅ 원장 기록 완료: ${data.message}`);
        setSelectedUser(null);
        setAdjustReason("");
        fetchUsers();
      } else {
        alert(`조정 실패: ${data.error}`);
      }
    } catch (e: any) {
      alert(`조정 오류: ${e.message}`);
    } finally {
      setAdjusting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800/80 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-400" />
            <h1 className="text-xl sm:text-2xl font-black text-white">시민 회원 관리 콘솔</h1>
            <AdminBadge variant="info">User Directory</AdminBadge>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            전체 주권시민 계정 상태, 소속 지역, 닉네임, 보유 자산 및 활동 제재를 실시간 관리합니다.
          </p>
        </div>

        <AdminButton variant="secondary" size="sm" onClick={fetchUsers} disabled={loading}>
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-blue-400" : ""}`} />
          <span>새로고침</span>
        </AdminButton>
      </div>

      {/* 4대 KPI 요약 카드 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <AdminCard>
          <AdminCardHeader className="pb-2">
            <span className="text-xs font-semibold text-zinc-400">총 등록 주권시민</span>
            <div className="text-2xl font-black text-white mt-1">
              {stats.totalUsers.toLocaleString()}명
            </div>
          </AdminCardHeader>
          <AdminCardContent className="pt-0 text-[11px] text-zinc-500">
            소셜 및 이메일 가입 전체 계정
          </AdminCardContent>
        </AdminCard>

        <AdminCard>
          <AdminCardHeader className="pb-2">
            <span className="text-xs font-semibold text-emerald-400">정상 활동 시민</span>
            <div className="text-2xl font-black text-emerald-300 mt-1">
              {stats.activeUsers.toLocaleString()}명
            </div>
          </AdminCardHeader>
          <AdminCardContent className="pt-0 text-[11px] text-zinc-500">
            예측·포럼·응원톡 정상 이용 가능
          </AdminCardContent>
        </AdminCard>

        <AdminCard>
          <AdminCardHeader className="pb-2">
            <span className="text-xs font-semibold text-rose-400">제재·정지 계정</span>
            <div className="text-2xl font-black text-rose-300 mt-1">
              {stats.suspendedUsers.toLocaleString()}명
            </div>
          </AdminCardHeader>
          <AdminCardContent className="pt-0 text-[11px] text-zinc-500">
            어뷰징 및 규정 위반 정지/차단
          </AdminCardContent>
        </AdminCard>

        <AdminCard>
          <AdminCardHeader className="pb-2">
            <span className="text-xs font-semibold text-amber-400">최근 24시간 신규 가입</span>
            <div className="text-2xl font-black text-amber-300 mt-1">
              +{stats.todayNewUsers.toLocaleString()}명
            </div>
          </AdminCardHeader>
          <AdminCardContent className="pt-0 text-[11px] text-zinc-500">
            환영 스타터 자산 지급 완료
          </AdminCardContent>
        </AdminCard>
      </div>

      {/* 간편가입 소셜 채널별 현황 위젯 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          type="button"
          onClick={() => setProviderFilter(providerFilter === "kakao" ? "all" : "kakao")}
          className={`p-3 rounded-xl border text-left transition-all ${
            providerFilter === "kakao"
              ? "bg-[#FEE500]/15 border-[#FEE500] ring-1 ring-[#FEE500]"
              : "bg-zinc-900/60 border-zinc-800 hover:border-[#FEE500]/50"
          }`}
        >
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-[#FEE500] flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#FEE500]" />
              카카오 가입
            </span>
            <span className="text-[10px] text-zinc-400 font-mono">
              {stats.totalUsers > 0
                ? `${Math.round(((stats.kakaoUsers || 0) / stats.totalUsers) * 100)}%`
                : "0%"}
            </span>
          </div>
          <div className="text-lg font-black text-white mt-1">
            {(stats.kakaoUsers || 0).toLocaleString()}
            <span className="text-xs font-normal text-zinc-400 ml-1">명</span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setProviderFilter(providerFilter === "naver" ? "all" : "naver")}
          className={`p-3 rounded-xl border text-left transition-all ${
            providerFilter === "naver"
              ? "bg-[#03C75A]/15 border-[#03C75A] ring-1 ring-[#03C75A]"
              : "bg-zinc-900/60 border-zinc-800 hover:border-[#03C75A]/50"
          }`}
        >
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-[#03C75A] flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#03C75A]" />
              네이버 가입
            </span>
            <span className="text-[10px] text-zinc-400 font-mono">
              {stats.totalUsers > 0
                ? `${Math.round(((stats.naverUsers || 0) / stats.totalUsers) * 100)}%`
                : "0%"}
            </span>
          </div>
          <div className="text-lg font-black text-white mt-1">
            {(stats.naverUsers || 0).toLocaleString()}
            <span className="text-xs font-normal text-zinc-400 ml-1">명</span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setProviderFilter(providerFilter === "google" ? "all" : "google")}
          className={`p-3 rounded-xl border text-left transition-all ${
            providerFilter === "google"
              ? "bg-blue-500/15 border-blue-500 ring-1 ring-blue-500"
              : "bg-zinc-900/60 border-zinc-800 hover:border-blue-500/50"
          }`}
        >
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-blue-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-400" />
              구글 가입
            </span>
            <span className="text-[10px] text-zinc-400 font-mono">
              {stats.totalUsers > 0
                ? `${Math.round(((stats.googleUsers || 0) / stats.totalUsers) * 100)}%`
                : "0%"}
            </span>
          </div>
          <div className="text-lg font-black text-white mt-1">
            {(stats.googleUsers || 0).toLocaleString()}
            <span className="text-xs font-normal text-zinc-400 ml-1">명</span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setProviderFilter(providerFilter === "email" ? "all" : "email")}
          className={`p-3 rounded-xl border text-left transition-all ${
            providerFilter === "email"
              ? "bg-zinc-800 border-zinc-500 ring-1 ring-zinc-500"
              : "bg-zinc-900/60 border-zinc-800 hover:border-zinc-700"
          }`}
        >
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-zinc-300 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-zinc-400" />
              이메일 가입
            </span>
            <span className="text-[10px] text-zinc-400 font-mono">
              {stats.totalUsers > 0
                ? `${Math.round(((stats.emailUsers || 0) / stats.totalUsers) * 100)}%`
                : "0%"}
            </span>
          </div>
          <div className="text-lg font-black text-white mt-1">
            {(stats.emailUsers || 0).toLocaleString()}
            <span className="text-xs font-normal text-zinc-400 ml-1">명</span>
          </div>
        </button>
      </div>

      {/* 필터 및 검색 툴바 */}
      <AdminCard>
        <AdminCardContent className="p-4 space-y-3 sm:space-y-0 sm:flex sm:items-center sm:justify-between sm:gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="닉네임, 이메일, 아이디 실시간 검색..."
              className="w-full pl-10 pr-4 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* 가입 경로 (소셜 프로바이더) 필터 */}
            <select
              value={providerFilter}
              onChange={(e) => setProviderFilter(e.target.value)}
              className="px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-200 focus:outline-none focus:border-blue-500"
            >
              <option value="all">전체 가입경로</option>
              <option value="kakao">🟡 카카오 간편가입</option>
              <option value="naver">🟢 네이버 간편가입</option>
              <option value="google">🔵 구글 로그인</option>
              <option value="email">✉️ 일반 이메일</option>
            </select>

            {/* 상태 필터 */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-200 focus:outline-none focus:border-blue-500"
            >
              <option value="all">전체 상태</option>
              <option value="active">정상 (Active)</option>
              <option value="suspended">이용 정지 (Suspended)</option>
              <option value="banned">영구 차단 (Banned)</option>
            </select>

            {/* 지역 필터 */}
            <select
              value={sidoFilter}
              onChange={(e) => setSidoFilter(e.target.value)}
              className="px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-200 focus:outline-none focus:border-blue-500"
            >
              <option value="all">전체 지역 (시·도)</option>
              {SIDO_OPTIONS.filter((s) => s !== "all").map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </AdminCardContent>
      </AdminCard>

      {/* 회원 목록 테이블 */}
      <AdminCard>
        <AdminCardHeader className="border-b border-zinc-800/80">
          <div className="flex items-center justify-between">
            <div>
              <AdminCardTitle className="text-base">
                👥 시민 회원 명부 ({users.length}명 검색됨)
              </AdminCardTitle>
              <AdminCardDescription>
                닉네임, 활동 지역, 보유 자산(PMP/PMC)을 확인하고 원장 기반 포인트 지급 및 계정 제재를 수행합니다.
              </AdminCardDescription>
            </div>
          </div>
        </AdminCardHeader>

        <AdminCardContent className="pt-4">
          <AdminTable>
            <AdminTableHeader>
              <AdminTableRow>
                <AdminTableHead>시민 닉네임 / 이메일</AdminTableHead>
                <AdminTableHead>가입 경로</AdminTableHead>
                <AdminTableHead>소속 지역 / 직군</AdminTableHead>
                <AdminTableHead>보유 PMP (포인트)</AdminTableHead>
                <AdminTableHead>보유 PMC (화폐)</AdminTableHead>
                <AdminTableHead>가입일</AdminTableHead>
                <AdminTableHead>계정 상태</AdminTableHead>
                <AdminTableHead className="text-right">관리 액션</AdminTableHead>
              </AdminTableRow>
            </AdminTableHeader>
            <AdminTableBody>
              {users.length === 0 ? (
                <AdminTableRow>
                  <AdminTableCell colSpan={8} className="text-center py-12 text-zinc-500">
                    검색 조건에 일치하는 회원이 없습니다.
                  </AdminTableCell>
                </AdminTableRow>
              ) : (
                users.map((u) => {
                  const isActive = u.accountStatus === "active";
                  const isSuspended = u.accountStatus === "suspended";
                  const isBanned = u.accountStatus === "banned";

                  return (
                    <AdminTableRow key={u.id}>
                      {/* 닉네임 / 이메일 */}
                      <AdminTableCell>
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5 font-bold text-white text-sm">
                            <span>{u.displayName}</span>
                          </div>
                          <p className="text-xs text-zinc-400 font-mono">{u.email}</p>
                          {u.kakaoId && (
                            <span className="inline-block text-[10px] text-yellow-400/80 font-mono">
                              Kakao ID: {u.kakaoId}
                            </span>
                          )}
                          {u.naverId && (
                            <span className="inline-block text-[10px] text-emerald-400/80 font-mono">
                              Naver ID: {u.naverId.slice(0, 10)}...
                            </span>
                          )}
                        </div>
                      </AdminTableCell>

                      {/* 가입 경로 (소셜 프로바이더 배지) */}
                      <AdminTableCell>
                        <div className="flex flex-col gap-1 items-start">
                          {renderProviderBadge(u.provider)}
                          {u.connectedProviders && u.connectedProviders.length > 1 && (
                            <span className="text-[10px] text-zinc-500">
                              + {u.connectedProviders.filter((p) => p !== u.provider).join(", ")}
                            </span>
                          )}
                        </div>
                      </AdminTableCell>

                      {/* 소속 지역 */}
                      <AdminTableCell>
                        <div className="flex flex-wrap items-center gap-1">
                          <AdminBadge variant="default">
                            <MapPin className="w-3 h-3 text-emerald-400 mr-0.5" />
                            {u.sido}
                          </AdminBadge>
                          <span className="text-[10px] text-zinc-500">{u.jobGroup}</span>
                        </div>
                      </AdminTableCell>

                      {/* PMP Balance */}
                      <AdminTableCell className="font-mono font-bold text-amber-300">
                        {u.pmpBalance.toLocaleString()} P
                      </AdminTableCell>

                      {/* PMC Balance */}
                      <AdminTableCell className="font-mono font-bold text-emerald-300">
                        {u.pmcBalance.toLocaleString()} PMC
                      </AdminTableCell>

                      {/* 가입일 */}
                      <AdminTableCell className="text-xs text-zinc-400">
                        {new Date(u.createdAt).toLocaleDateString("ko-KR")}
                      </AdminTableCell>

                      {/* 상태 배지 */}
                      <AdminTableCell>
                        {isActive && <AdminBadge variant="success">정상</AdminBadge>}
                        {isSuspended && <AdminBadge variant="warning">이용 정지</AdminBadge>}
                        {isBanned && <AdminBadge variant="destructive">영구 차단</AdminBadge>}
                      </AdminTableCell>

                      {/* 액션 버튼 */}
                      <AdminTableCell className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* 포인트 조정 버튼 */}
                          <AdminButton
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedUser(u);
                              setModalType("grant");
                              setAdjustPmp(5000);
                            }}
                          >
                            <Coins className="w-3 h-3 text-amber-400" />
                            <span>포인트 조정</span>
                          </AdminButton>

                          {/* 상태 변경 토글 버튼 */}
                          {isActive ? (
                            <AdminButton
                              variant="danger"
                              size="sm"
                              onClick={() => handleUpdateStatus(u.id, "suspended")}
                            >
                              <UserX className="w-3 h-3" />
                              <span>정지</span>
                            </AdminButton>
                          ) : (
                            <AdminButton
                              variant="success"
                              size="sm"
                              onClick={() => handleUpdateStatus(u.id, "active")}
                            >
                              <UserCheck className="w-3 h-3" />
                              <span>복구</span>
                            </AdminButton>
                          )}
                        </div>
                      </AdminTableCell>
                    </AdminTableRow>
                  );
                })
              )}
            </AdminTableBody>
          </AdminTable>
        </AdminCardContent>
      </AdminCard>

      {/* 포인트 지급/회수 원장 모달 */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-2xl space-y-5 animate-in fade-in-50 zoom-in-95">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <Coins className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-white">
                  시민 포인트 수동 조정 (원장 기록 연동)
                </h3>
              </div>
              <button
                onClick={() => setSelectedUser(null)}
                className="text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1">
                <p className="text-zinc-400">
                  대상 회원: <strong className="text-white">{selectedUser.displayName}</strong> ({selectedUser.email})
                </p>
                <p className="text-zinc-400">
                  현재 보유 잔액:{" "}
                  <span className="text-amber-300 font-bold font-mono">
                    {selectedUser.pmpBalance.toLocaleString()} PMP
                  </span>
                </p>
              </div>

              {/* 지급 vs 회수 탭 */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setModalType("grant")}
                  className={`py-2 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-all ${
                    modalType === "grant"
                      ? "bg-emerald-600 text-white"
                      : "bg-zinc-950 border border-zinc-800 text-zinc-400 hover:text-white"
                  }`}
                >
                  <PlusCircle className="w-4 h-4" /> 포인트 지급 (+)
                </button>
                <button
                  type="button"
                  onClick={() => setModalType("revoke")}
                  className={`py-2 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-all ${
                    modalType === "revoke"
                      ? "bg-rose-600 text-white"
                      : "bg-zinc-950 border border-zinc-800 text-zinc-400 hover:text-white"
                  }`}
                >
                  <MinusCircle className="w-4 h-4" /> 포인트 회수 (-)
                </button>
              </div>

              <div>
                <label className="block text-zinc-300 font-semibold mb-1">
                  조정할 PMP 수량
                </label>
                <input
                  type="number"
                  min="100"
                  step="500"
                  value={adjustPmp}
                  onChange={(e) => setAdjustPmp(Math.max(0, Number(e.target.value)))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-sm font-mono text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-zinc-300 font-semibold mb-1">
                  사유 (원장 영구 기록)
                </label>
                <input
                  type="text"
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  placeholder="예: 공론장 우수 기여 보너스 지급, 어뷰징 환수 등"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="p-3 rounded-lg bg-blue-950/30 border border-blue-500/20 text-zinc-400 text-[11px] leading-relaxed">
                💡 이 작업은 즉시 <code>economy.pmp_pmc_transactions</code> 불변 원장에 <strong>ADMIN_GRANT / ADMIN_REVOKE</strong> 유형으로 기록되어 영구 추적됩니다.
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
              <AdminButton
                variant="outline"
                size="sm"
                onClick={() => setSelectedUser(null)}
              >
                취소
              </AdminButton>
              <AdminButton
                variant={modalType === "grant" ? "success" : "danger"}
                size="sm"
                disabled={adjusting || adjustPmp <= 0}
                onClick={handleAdjustBalance}
              >
                {adjusting ? "원장 기록 중..." : modalType === "grant" ? "지급 완료" : "회수 완료"}
              </AdminButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

