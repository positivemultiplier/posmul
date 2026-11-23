"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

// ===== 타입 정의 =====
interface Match {
  id: string;
  status: string;
  statusLabel: string;
  statusColor: string;
  donorConfirmed: boolean;
  recipientConfirmed: boolean;
  createdAt: string;
  matchedAt: string | null;
  completedAt: string | null;
  recipient: {
    displayName: string;
    location: string;
  } | null;
}

interface DonationItem {
  id: string;
  title: string;
  category: string;
  categoryLabel: string;
  categoryIcon: string;
  status: string;
  statusLabel: string;
  statusColor: string;
  pickupLocation: string;
  createdAt: string;
  match: Match | null;
}

interface Stats {
  total: number;
  available: number;
  matched: number;
  completed: number;
  pending: number;
}

interface MyDonationsClientProps {
  items: DonationItem[];
  stats: Stats;
}

const STATUS_COLOR_MAP: Record<string, string> = {
  green: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  yellow: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
  blue: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  gray: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
  red: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  purple: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
};

function getStatusColorClass(statusColor: string | undefined) {
  return STATUS_COLOR_MAP[statusColor ?? ""] || STATUS_COLOR_MAP.gray;
}

function formatKoDate(isoString: string) {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return isoString;
  return date.toLocaleDateString("ko-KR");
}

type MatchActionState =
  | { kind: "cancel" }
  | { kind: "complete" }
  | { kind: "completed"; label: string }
  | { kind: "none" };

function getMatchActionState(match: Match): MatchActionState {
  if (match.status === "pending") return { kind: "cancel" };
  if (match.status === "accepted" && !match.donorConfirmed) {
    return { kind: "complete" };
  }
  if (match.status === "completed" && match.completedAt) {
    return {
      kind: "completed",
      label: `✓ ${formatKoDate(match.completedAt)} 완료`,
    };
  }
  return { kind: "none" };
}

// ===== 메인 컴포넌트 =====
export function MyDonationsClient({ items, stats }: MyDonationsClientProps) {
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  // 필터링
  const filteredItems = statusFilter
    ? items.filter((i) => i.status === statusFilter)
    : items;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* 헤더 */}
      <div className="bg-gradient-to-r from-orange-500 to-amber-600 text-white py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <Link
            href="/donation/direct"
            className="inline-flex items-center text-white/80 hover:text-white mb-4"
          >
            ← 직접 기부
          </Link>
          <h1 className="text-3xl font-bold">내 기부 내역</h1>
          <p className="text-white/90 mt-2">등록한 물품과 매칭 상태를 확인하세요</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* 통계 카드 */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <StatCard label="전체" value={stats.total} color="gray" />
          <StatCard label="기부 가능" value={stats.available} color="green" />
          <StatCard label="매칭됨" value={stats.matched} color="blue" />
          <StatCard label="완료" value={stats.completed} color="purple" />
          <StatCard label="대기중" value={stats.pending} color="yellow" />
        </div>

        {/* 필터 */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            <FilterButton
              label="전체"
              isActive={statusFilter === null}
              onClick={() => setStatusFilter(null)}
            />
            <FilterButton
              label="기부 가능"
              isActive={statusFilter === "available"}
              onClick={() => setStatusFilter("available")}
            />
            <FilterButton
              label="매칭됨"
              isActive={statusFilter === "matched"}
              onClick={() => setStatusFilter("matched")}
            />
            <FilterButton
              label="완료"
              isActive={statusFilter === "completed"}
              onClick={() => setStatusFilter("completed")}
            />
          </div>
        </div>

        {/* 물품 목록 */}
        {filteredItems.length === 0 ? (
          <EmptyState statusFilter={statusFilter} />
        ) : (
          <div className="space-y-4">
            {filteredItems.map((item) => (
              <DonationItemCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ===== 통계 카드 =====
function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  const colorClasses: Record<string, string> = {
    gray: "bg-gray-100 dark:bg-gray-800",
    green: "bg-green-100 dark:bg-green-900/30",
    blue: "bg-blue-100 dark:bg-blue-900/30",
    purple: "bg-purple-100 dark:bg-purple-900/30",
    yellow: "bg-yellow-100 dark:bg-yellow-900/30",
  };

  return (
    <div
      className={`${colorClasses[color]} rounded-xl p-4 text-center`}
    >
      <div className="text-2xl font-bold text-gray-900 dark:text-white">
        {value}
      </div>
      <div className="text-sm text-gray-500 dark:text-gray-400">{label}</div>
    </div>
  );
}

// ===== 필터 버튼 =====
function FilterButton({
  label,
  isActive,
  onClick,
}: {
  label: string;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
        isActive
          ? "bg-orange-500 text-white"
          : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
      }`}
    >
      {label}
    </button>
  );
}

// ===== 빈 상태 =====
function EmptyState({ statusFilter }: { statusFilter: string | null }) {
  return (
    <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl">
      <span className="text-6xl block mb-4"></span>
      <p className="text-gray-500 dark:text-gray-400 mb-4">
        {statusFilter
          ? "해당 상태의 물품이 없습니다."
          : "등록한 기부 물품이 없습니다."}
      </p>
      <Link
        href="/donation/direct/register"
        className="inline-flex items-center gap-2 text-orange-600 hover:text-orange-700"
      >
        물품 등록하기
      </Link>
    </div>
  );
}

// ===== 기부 물품 카드 =====
function DonationItemCard({ item }: { item: DonationItem }) {
  const router = useRouter();
  const [isUpdating, setIsUpdating] = useState(false);

  // 기부 완료 처리
  const handleComplete = async () => {
    if (!item.match) return;

    setIsUpdating(true);
    try {
      const response = await fetch(`/api/donation/direct/match/${item.match.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "complete" }),
      });

      if (response.ok) {
        router.refresh();
      }
    } catch (err) {
      void err;
    } finally {
      setIsUpdating(false);
    }
  };

  // 매칭 취소
  const handleCancel = async () => {
    if (!item.match) return;

    setIsUpdating(true);
    try {
      const response = await fetch(`/api/donation/direct/match/${item.match.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancel" }),
      });

      if (response.ok) {
        router.refresh();
      }
    } catch (err) {
      void err;
    } finally {
      setIsUpdating(false);
    }
  };

  const matchSection = item.match ? (
    <DonationMatchSection
      match={item.match}
      isUpdating={isUpdating}
      onCancel={handleCancel}
      onComplete={handleComplete}
    />
  ) : null;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden">
      <div className="p-6">
        {/* 헤더 */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{item.categoryIcon}</span>
            <div>
              <Link
                href={`/donation/direct/item/${item.id}`}
                className="text-lg font-bold text-gray-900 dark:text-white hover:text-orange-600 dark:hover:text-orange-400"
              >
                {item.title}
              </Link>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {item.categoryLabel} · {item.pickupLocation}
              </div>
            </div>
          </div>
          <span
            className={`text-xs px-3 py-1 rounded-full font-semibold ${
              getStatusColorClass(item.statusColor)
            }`}
          >
            {item.statusLabel}
          </span>
        </div>

        {/* 매칭 정보 */}
        {matchSection}

        {/* 날짜 정보 */}
        <div className="text-xs text-gray-400 dark:text-gray-500">
          등록일: {formatKoDate(item.createdAt)}
        </div>
      </div>
    </div>
  );
}

function DonationMatchSection({
  match,
  isUpdating,
  onCancel,
  onComplete,
}: {
  match: Match;
  isUpdating: boolean;
  onCancel: () => Promise<void>;
  onComplete: () => Promise<void>;
}) {
  const action = getMatchActionState(match);

  let actionNode: ReactNode = null;
  if (action.kind === "cancel") {
    actionNode = (
      <button
        onClick={onCancel}
        disabled={isUpdating}
        className="mt-3 w-full py-2 px-4 rounded-lg text-sm font-semibold bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors disabled:opacity-50"
      >
        {isUpdating ? "처리 중..." : "매칭 취소"}
      </button>
    );
  } else if (action.kind === "complete") {
    actionNode = (
      <button
        onClick={onComplete}
        disabled={isUpdating}
        className="mt-3 w-full py-2 px-4 rounded-lg text-sm font-semibold bg-green-500 text-white hover:bg-green-600 transition-colors disabled:opacity-50"
      >
        {isUpdating ? "처리 중..." : "기부 완료 확인"}
      </button>
    );
  } else if (action.kind === "completed") {
    actionNode = (
      <div className="mt-3 text-center text-sm text-green-600 dark:text-green-400">
        {action.label}
      </div>
    );
  }

  return (
    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          매칭 정보
        </span>
        <span
          className={`text-xs px-2 py-1 rounded-full ${getStatusColorClass(
            match.statusColor
          )}`}
        >
          {match.statusLabel}
        </span>
      </div>

      {match.recipient ? (
        <div className="mb-3">
          <div className="text-sm text-gray-900 dark:text-white font-semibold">
            {match.recipient.displayName}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {match.recipient.location}
          </div>
        </div>
      ) : null}

      <div className="flex items-center gap-4 text-xs">
        <div className="flex items-center gap-1">
          <span
            className={match.donorConfirmed ? "text-green-500" : "text-gray-400"}
          >
            {match.donorConfirmed ? "✓" : "○"}
          </span>
          <span className="text-gray-500 dark:text-gray-400">내 확인</span>
        </div>
        <div className="flex items-center gap-1">
          <span
            className={
              match.recipientConfirmed ? "text-green-500" : "text-gray-400"
            }
          >
            {match.recipientConfirmed ? "✓" : "○"}
          </span>
          <span className="text-gray-500 dark:text-gray-400">수혜자 확인</span>
        </div>
      </div>

      {actionNode}
    </div>
  );
}
