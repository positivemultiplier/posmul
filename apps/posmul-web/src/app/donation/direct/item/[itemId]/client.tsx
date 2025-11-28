"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

// ===== 타입 정의 =====
interface DonationItem {
  id: string;
  donorUserId: string;
  title: string;
  description: string;
  category: string;
  categoryLabel: string;
  categoryIcon: string;
  condition: string;
  conditionLabel: string;
  quantity: number;
  estimatedValue: number;
  images: string[];
  pickupLocation: string;
  pickupAvailableTimes: string;
  status: string;
  statusLabel: string;
  statusColor: string;
  createdAt: string;
}

interface Recommendation {
  id: string;
  displayName: string;
  bio: string;
  locationCity: string;
  locationDistrict: string;
  isVerified: boolean;
  neededCategories: Array<{ category: string; label: string; icon: string }>;
  matchScore: number;
  matchReasons: string[];
}

interface ExistingMatch {
  id: string;
  status: string;
  donorConfirmed: boolean;
  recipientConfirmed: boolean;
  createdAt: string;
  recipient: {
    id: string;
    displayName: string;
    location: string;
  } | null;
}

interface ItemDetailClientProps {
  item: DonationItem;
  recommendations: Recommendation[];
  existingMatch: ExistingMatch | null;
  isOwner: boolean;
  isLoggedIn: boolean;
}

// ===== 메인 컴포넌트 =====
export function ItemDetailClient({
  item,
  recommendations,
  existingMatch,
  isOwner,
}: ItemDetailClientProps) {
  const router = useRouter();
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [selectedRecipient, setSelectedRecipient] = useState<Recommendation | null>(null);
  const [isMatching, setIsMatching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 매칭 요청
  const handleMatch = async () => {
    if (!selectedRecipient) return;

    setIsMatching(true);
    setError(null);

    try {
      const response = await fetch("/api/donation/direct/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemId: item.id,
          recipientId: selectedRecipient.id,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "매칭 요청에 실패했습니다.");
      }

      setShowMatchModal(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.");
    } finally {
      setIsMatching(false);
    }
  };

  const statusColorMap: Record<string, string> = {
    green: "bg-green-100 text-green-800",
    yellow: "bg-yellow-100 text-yellow-800",
    blue: "bg-blue-100 text-blue-800",
    gray: "bg-gray-100 text-gray-800",
    red: "bg-red-100 text-red-800",
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* 헤더 */}
      <div className="bg-gradient-to-r from-orange-500 to-amber-600 text-white py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <Link
            href="/donation/direct"
            className="inline-flex items-center text-white/80 hover:text-white mb-4"
          >
            ← 목록으로
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-5xl">{item.categoryIcon}</span>
            <div>
              <h1 className="text-3xl font-bold">{item.title}</h1>
              <div className="flex items-center gap-2 mt-2">
                <span
                  className={`text-sm px-3 py-1 rounded-full ${
                    statusColorMap[item.statusColor] || statusColorMap.gray
                  }`}
                >
                  {item.statusLabel}
                </span>
                <span className="text-white/80">{item.categoryLabel}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 메인 정보 */}
          <div className="lg:col-span-2 space-y-6">
            <ItemInfoCard item={item} />
            
            {/* 매칭 상태 */}
            {existingMatch && (
              <MatchStatusCard match={existingMatch} />
            )}

            {/* 추천 수혜자 (소유자이고 available 상태일 때만) */}
            {isOwner && item.status === "available" && recommendations.length > 0 && (
              <RecommendationsCard
                recommendations={recommendations}
                onSelectRecipient={(r) => {
                  setSelectedRecipient(r);
                  setShowMatchModal(true);
                }}
              />
            )}
          </div>

          {/* 사이드바 */}
          <div className="space-y-6">
            <PickupInfoCard item={item} />
            
            {isOwner && item.status === "available" && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                  관리
                </h3>
                <div className="space-y-3">
                  <button
                    onClick={() => setShowMatchModal(true)}
                    className="w-full py-3 px-4 rounded-xl font-semibold bg-orange-500 text-white hover:bg-orange-600 transition-colors"
                  >
                    🤝 수혜자 매칭하기
                  </button>
                  <Link
                    href={`/donation/direct/item/${item.id}/edit`}
                    className="block w-full py-3 px-4 rounded-xl font-semibold bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 text-center transition-colors"
                  >
                    ✏️ 수정하기
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 매칭 모달 */}
      {showMatchModal && (
        <MatchModal
          recommendations={recommendations}
          selectedRecipient={selectedRecipient}
          setSelectedRecipient={setSelectedRecipient}
          onClose={() => {
            setShowMatchModal(false);
            setSelectedRecipient(null);
            setError(null);
          }}
          onMatch={handleMatch}
          isMatching={isMatching}
          error={error}
        />
      )}
    </div>
  );
}

// ===== 물품 정보 카드 =====
function ItemInfoCard({ item }: { item: DonationItem }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
        물품 정보
      </h2>

      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-1">
            상세 설명
          </h3>
          <p className="text-gray-900 dark:text-white whitespace-pre-wrap">
            {item.description}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-1">
              상태
            </h3>
            <p className="text-gray-900 dark:text-white">{item.conditionLabel}</p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-1">
              수량
            </h3>
            <p className="text-gray-900 dark:text-white">{item.quantity}개</p>
          </div>
        </div>

        {item.estimatedValue > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-1">
              예상 가치
            </h3>
            <p className="text-orange-600 dark:text-orange-400 font-semibold">
              약 {item.estimatedValue.toLocaleString()}원
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ===== 수령 정보 카드 =====
function PickupInfoCard({ item }: { item: DonationItem }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
        📍 수령 정보
      </h3>
      <div className="space-y-3">
        <div>
          <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-1">
            위치
          </h4>
          <p className="text-gray-900 dark:text-white">{item.pickupLocation}</p>
        </div>
        {item.pickupAvailableTimes && (
          <div>
            <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-1">
              가능 시간
            </h4>
            <p className="text-gray-900 dark:text-white">{item.pickupAvailableTimes}</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ===== 매칭 상태 카드 =====
function MatchStatusCard({ match }: { match: ExistingMatch }) {
  const statusLabels: Record<string, { label: string; color: string }> = {
    pending: { label: "수락 대기중", color: "yellow" },
    accepted: { label: "수락됨", color: "green" },
    rejected: { label: "거절됨", color: "red" },
    completed: { label: "기부 완료", color: "blue" },
  };

  const status = statusLabels[match.status] || statusLabels.pending;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
        🤝 매칭 상태
      </h2>

      <div className="flex items-center justify-between mb-4">
        <span
          className={`px-3 py-1 rounded-full text-sm font-semibold ${
            status.color === "yellow"
              ? "bg-yellow-100 text-yellow-800"
              : status.color === "green"
              ? "bg-green-100 text-green-800"
              : status.color === "red"
              ? "bg-red-100 text-red-800"
              : "bg-blue-100 text-blue-800"
          }`}
        >
          {status.label}
        </span>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {new Date(match.createdAt).toLocaleDateString("ko-KR")}
        </span>
      </div>

      {match.recipient && (
        <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
          <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2">
            수혜자
          </h4>
          <p className="text-gray-900 dark:text-white font-semibold">
            {match.recipient.displayName}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {match.recipient.location}
          </p>
        </div>
      )}

      <div className="mt-4 flex items-center gap-4 text-sm">
        <div className="flex items-center gap-1">
          <span className={match.donorConfirmed ? "text-green-500" : "text-gray-400"}>
            {match.donorConfirmed ? "✓" : "○"}
          </span>
          <span className="text-gray-600 dark:text-gray-400">기부자 확인</span>
        </div>
        <div className="flex items-center gap-1">
          <span className={match.recipientConfirmed ? "text-green-500" : "text-gray-400"}>
            {match.recipientConfirmed ? "✓" : "○"}
          </span>
          <span className="text-gray-600 dark:text-gray-400">수혜자 확인</span>
        </div>
      </div>
    </div>
  );
}

// ===== 추천 수혜자 카드 =====
function RecommendationsCard({
  recommendations,
  onSelectRecipient,
}: {
  recommendations: Recommendation[];
  onSelectRecipient: (r: Recommendation) => void;
}) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
        🎯 추천 수혜자
      </h2>

      <div className="space-y-4">
        {recommendations.slice(0, 3).map((r) => (
          <div
            key={r.id}
            className="border border-gray-200 dark:border-gray-700 rounded-xl p-4"
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {r.displayName}
                  </span>
                  {r.isVerified && (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                      인증
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {r.locationCity} {r.locationDistrict}
                </p>
              </div>
              <div className="text-right">
                <span className="text-2xl font-bold text-orange-500">
                  {r.matchScore}
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400 block">점</span>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-1">
              {r.matchReasons.map((reason, idx) => (
                <span
                  key={idx}
                  className="text-xs bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 px-2 py-0.5 rounded-full"
                >
                  {reason}
                </span>
              ))}
            </div>

            <button
              onClick={() => onSelectRecipient(r)}
              className="mt-3 w-full py-2 px-4 rounded-lg text-sm font-semibold bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 hover:bg-orange-200 dark:hover:bg-orange-900/50 transition-colors"
            >
              이 분께 기부하기
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ===== 매칭 모달 =====
function MatchModal({
  recommendations,
  selectedRecipient,
  setSelectedRecipient,
  onClose,
  onMatch,
  isMatching,
  error,
}: {
  recommendations: Recommendation[];
  selectedRecipient: Recommendation | null;
  setSelectedRecipient: (r: Recommendation | null) => void;
  onClose: () => void;
  onMatch: () => void;
  isMatching: boolean;
  error: string | null;
}) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-lg max-h-[80vh] overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              🤝 수혜자 선택
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[50vh]">
          {error && (
            <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-xl text-sm">
              {error}
            </div>
          )}

          <div className="space-y-3">
            {recommendations.map((r) => (
              <button
                key={r.id}
                onClick={() => setSelectedRecipient(r)}
                className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                  selectedRecipient?.id === r.id
                    ? "border-orange-500 bg-orange-50 dark:bg-orange-900/20"
                    : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {r.displayName}
                    </span>
                    {r.isVerified && (
                      <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                        인증
                      </span>
                    )}
                  </div>
                  <span className="text-orange-500 font-bold">{r.matchScore}점</span>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  📍 {r.locationCity} {r.locationDistrict}
                </p>
              </button>
            ))}
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onMatch}
            disabled={!selectedRecipient || isMatching}
            className={`w-full py-3 px-4 rounded-xl font-semibold transition-colors ${
              selectedRecipient && !isMatching
                ? "bg-orange-500 text-white hover:bg-orange-600"
                : "bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed"
            }`}
          >
            {isMatching ? "매칭 중..." : "매칭 요청하기"}
          </button>
        </div>
      </div>
    </div>
  );
}
