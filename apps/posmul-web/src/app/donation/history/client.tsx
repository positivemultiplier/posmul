"use client";

import { useState } from "react";
import Link from "next/link";

interface DonationRecord {
  id: string;
  donationType: string;
  amount: number;
  pmcAmount: number;
  title: string;
  category: string;
  status: string;
  isAnonymous: boolean;
  createdAt: string;
  completedAt: string | null;
  instituteName?: string;
}

interface HistoryClientProps {
  donations: DonationRecord[];
  stats: {
    totalCount: number;
    totalAmount: number;
    instituteCount: number;
  };
}

// 카테고리 정보
const categoryInfo: Record<string, { label: string; icon: string; color: string }> = {
  children: { label: "아동/청소년", icon: "", color: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200" },
  elderly: { label: "노인", icon: "", color: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200" },
  disabled: { label: "장애인", icon: "", color: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200" },
  disaster: { label: "재난구호", icon: "", color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200" },
  environment: { label: "환경", icon: "", color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" },
  education: { label: "교육", icon: "", color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" },
  medical: { label: "의료", icon: "", color: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200" },
  animal: { label: "동물", icon: "", color: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200" },
  other: { label: "기타", icon: "", color: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200" },
};

// 상태 정보
const statusInfo: Record<string, { label: string; color: string }> = {
  completed: { label: "완료", color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" },
  pending: { label: "처리중", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200" },
  cancelled: { label: "취소됨", color: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200" },
};

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function HistoryClient({ donations, stats }: HistoryClientProps) {
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);

  // 필터링
  const filteredDonations = donations.filter((d) => {
    if (filterCategory && d.category !== filterCategory) return false;
    if (filterStatus && d.status !== filterStatus) return false;
    return true;
  });

  // 카테고리 목록 (실제 사용된 것만)
  const usedCategories = [...new Set(donations.map((d) => d.category))];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <nav className="mb-6 text-white/80 text-sm">
            <Link href="/donation" className="hover:text-white">
              기부
            </Link>
            <span className="mx-2">›</span>
            <span className="text-white">내 기부 내역</span>
          </nav>

          <h1 className="text-4xl font-bold mb-4">내 기부 내역</h1>
          <p className="text-lg text-white/90 mb-8">
            지금까지의 따뜻한 나눔을 확인하세요
          </p>

          {/* 통계 카드 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center">
              <div className="text-3xl font-bold">{stats.totalCount}</div>
              <div className="text-sm text-white/80">총 기부 횟수</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center">
              <div className="text-3xl font-bold">
                {stats.totalAmount.toLocaleString()}
                <span className="text-lg ml-1">PMC</span>
              </div>
              <div className="text-sm text-white/80">총 기부 금액</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center">
              <div className="text-3xl font-bold">{stats.instituteCount}</div>
              <div className="text-sm text-white/80">후원 기관 수</div>
            </div>
          </div>
        </div>
      </div>

      {/* 필터 및 내역 */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* 필터 */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 mb-6">
          <div className="flex flex-wrap gap-4">
            {/* 카테고리 필터 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                카테고리
              </label>
              <select
                value={filterCategory || ""}
                onChange={(e) => setFilterCategory(e.target.value || null)}
                className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">전체</option>
                {usedCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {categoryInfo[cat]?.icon} {categoryInfo[cat]?.label || cat}
                  </option>
                ))}
              </select>
            </div>

            {/* 상태 필터 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                상태
              </label>
              <select
                value={filterStatus || ""}
                onChange={(e) => setFilterStatus(e.target.value || null)}
                className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">전체</option>
                <option value="completed">완료</option>
                <option value="pending">처리중</option>
                <option value="cancelled">취소됨</option>
              </select>
            </div>

            {/* 필터 초기화 */}
            {(filterCategory || filterStatus) && (
              <button
                onClick={() => {
                  setFilterCategory(null);
                  setFilterStatus(null);
                }}
                className="self-end px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              >
                필터 초기화
              </button>
            )}
          </div>
        </div>

        {/* 기부 내역 리스트 */}
        {filteredDonations.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-12 text-center">
            <span className="text-6xl block mb-4"></span>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              기부 내역이 없습니다
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {filterCategory || filterStatus
                ? "선택한 조건에 맞는 기부 내역이 없습니다."
                : "아직 기부 내역이 없습니다. 첫 기부를 시작해보세요!"}
            </p>
            <Link
              href="/donation/institute"
              className="inline-block px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
            >
              기부하러 가기
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredDonations.map((donation) => {
              const category = categoryInfo[donation.category] || categoryInfo.other;
              const status = statusInfo[donation.status] || statusInfo.pending;

              return (
                <div
                  key={donation.id}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex flex-col md:flex-row md:items-center gap-4">
                    {/* 아이콘 */}
                    <div className="flex-shrink-0">
                      <div
                        className={`w-14 h-14 rounded-xl flex items-center justify-center text-2xl ${category.color}`}
                      >
                        {category.icon}
                      </div>
                    </div>

                    {/* 정보 */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-gray-900 dark:text-white truncate">
                          {donation.title}
                        </h3>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${status.color}`}
                        >
                          {status.label}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-600 dark:text-gray-400">
                        {donation.instituteName && (
                          <span className="flex items-center gap-1">
                            {donation.instituteName}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          {category.label}
                        </span>
                        <span className="flex items-center gap-1">
                          {formatDate(donation.createdAt)}
                        </span>
                        {donation.isAnonymous && (
                          <span className="flex items-center gap-1 text-gray-500">
                            익명 기부
                          </span>
                        )}
                      </div>
                    </div>

                    {/* 금액 */}
                    <div className="flex-shrink-0 text-right">
                      <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {donation.pmcAmount.toLocaleString()}
                        <span className="text-sm ml-1 font-medium">PMC</span>
                      </div>
                      {donation.status === "completed" && (
                        <button className="mt-2 text-sm text-blue-500 hover:text-blue-600 dark:text-blue-400">
                          증명서 발급
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* 페이지 하단 */}
        <div className="mt-8 text-center">
          <Link
            href="/donation"
            className="inline-flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            ← 기부 메인으로 돌아가기
          </Link>
        </div>
      </div>
    </div>
  );
}
