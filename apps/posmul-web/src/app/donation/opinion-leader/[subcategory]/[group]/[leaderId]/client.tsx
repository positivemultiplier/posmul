/**
 * 오피니언 리더 프로필 클라이언트 컴포넌트
 *
 * 리더 상세 정보, 팔로우 버튼, 후원 기관 목록, 직접 후원 기능
 *
 * @author PosMul Development Team
 * @since 2025-11
 */
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MotionDiv, fadeInVariants, staggerContainerVariants } from "@/shared/ui/components/motion/MotionComponents";
import { SpotlightCard } from "@/shared/ui/components/motion/SpotlightCard";

interface Institute {
  id: string;
  name: string;
  description: string;
  category: string;
  categoryLabel: string;
  categoryIcon: string;
  websiteUrl: string | null;
  trustScore: number;
  isVerified: boolean;
}

interface Endorsement {
  id: string;
  endorsementMessage: string;
  endorsedAt: string;
  institute: Institute;
}

interface OpinionLeader {
  id: string;
  displayName: string;
  bio: string;
  avatarUrl: string | null;
  socialLinks: Record<string, string>;
  isVerified: boolean;
  followerCount: number;
  totalDonationsInfluenced: number;
  category: string;
  categoryLabel: string;
  categoryIcon: string;
  categoryColor: string;
  createdAt: string;
}

interface OpinionLeaderProfileClientProps {
  leader: OpinionLeader;
  endorsements: Endorsement[];
  isFollowing: boolean;
  isLoggedIn: boolean;
  userId: string | null;
  userPmcBalance: number;
}

// 카테고리별 색상 클래스
const categoryColorClasses: Record<string, { gradient: string; bg: string }> = {
  environment: {
    gradient: "from-green-400 to-emerald-500",
    bg: "bg-green-500",
  },
  welfare: { gradient: "from-blue-400 to-cyan-500", bg: "bg-blue-500" },
  science: { gradient: "from-purple-400 to-violet-500", bg: "bg-purple-500" },
  human_rights: { gradient: "from-red-400 to-rose-500", bg: "bg-red-500" },
  education: { gradient: "from-yellow-400 to-amber-500", bg: "bg-yellow-500" },
  health: { gradient: "from-pink-400 to-rose-500", bg: "bg-pink-500" },
  culture: { gradient: "from-indigo-400 to-blue-500", bg: "bg-indigo-500" },
  economy: { gradient: "from-emerald-400 to-teal-500", bg: "bg-emerald-500" },
  general: { gradient: "from-gray-400 to-slate-500", bg: "bg-gray-500" },
};

export function OpinionLeaderProfileClient({
  leader,
  endorsements,
  isFollowing: initialIsFollowing,
  isLoggedIn,
  userPmcBalance,
}: OpinionLeaderProfileClientProps) {
  const router = useRouter();
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [followerCount, setFollowerCount] = useState(leader.followerCount);
  const [isFollowLoading, setIsFollowLoading] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [supportAmount, setSupportAmount] = useState<number>(1000);
  const [supportMessage, setSupportMessage] = useState("");
  const [isSupportLoading, setIsSupportLoading] = useState(false);

  const colorClasses =
    categoryColorClasses[leader.category] || categoryColorClasses.general;

  // 팔로워 수 포맷
  const formatFollowerCount = (count: number): string => {
    if (count >= 10000) {
      return `${(count / 10000).toFixed(1)}만`;
    }
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}천`;
    }
    return count.toLocaleString();
  };

  // 금액 포맷
  const formatAmount = (amount: number): string => {
    if (amount >= 100000000) {
      return `${(amount / 100000000).toFixed(1)}억`;
    }
    if (amount >= 10000) {
      return `${(amount / 10000).toFixed(0)}만`;
    }
    return amount.toLocaleString();
  };

  // 날짜 포맷
  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // 팔로우/언팔로우 핸들러
  const handleFollowToggle = async () => {
    if (!isLoggedIn) {
      alert("로그인이 필요합니다.");
      router.push("/login");
      return;
    }

    setIsFollowLoading(true);
    try {
      const res = await fetch("/api/donation/opinion-leader/follow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leaderId: leader.id,
          action: isFollowing ? "unfollow" : "follow",
        }),
      });

      if (res.ok) {
        setIsFollowing(!isFollowing);
        setFollowerCount((prev) => (isFollowing ? prev - 1 : prev + 1));
      } else {
        const data = await res.json();
        alert(data.error || "처리 중 오류가 발생했습니다.");
      }
    } catch {
      alert("네트워크 오류가 발생했습니다.");
    } finally {
      setIsFollowLoading(false);
    }
  };

  // 직접 후원 핸들러
  const handleSupport = async () => {
    if (!isLoggedIn) {
      alert("로그인이 필요합니다.");
      router.push("/login");
      return;
    }

    if (supportAmount <= 0) {
      alert("후원 금액을 입력해주세요.");
      return;
    }

    if (supportAmount > userPmcBalance) {
      alert("PMC 잔액이 부족합니다.");
      return;
    }

    setIsSupportLoading(true);
    try {
      const res = await fetch("/api/donation/opinion-leader/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leaderId: leader.id,
          amount: supportAmount,
          message: supportMessage,
        }),
      });

      if (res.ok) {
        alert(`${leader.displayName}님에게 ${supportAmount.toLocaleString()} PMC 후원 완료!`);
        setShowSupportModal(false);
        setSupportAmount(1000);
        setSupportMessage("");
        router.refresh();
      } else {
        const data = await res.json();
        alert(data.error || "후원 처리 중 오류가 발생했습니다.");
      }
    } catch {
      alert("네트워크 오류가 발생했습니다.");
    } finally {
      setIsSupportLoading(false);
    }
  };

  // 소셜 링크 아이콘 매핑
  const getSocialIcon = (platform: string): string => {
    switch (platform.toLowerCase()) {
      case "instagram":
        return "📸";
      case "youtube":
        return "📺";
      case "twitter":
        return "🐦";
      case "blog":
        return "📝";
      case "facebook":
        return "👤";
      default:
        return "🔗";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Hero Section */}
      <div
        className={`bg-gradient-to-r ${colorClasses.gradient} text-white py-12 px-4`}
      >
        <div className="max-w-4xl mx-auto">
          <Link
            href="/donation/opinion-leader"
            className="inline-flex items-center text-white/80 hover:text-white mb-6 transition-colors"
          >
            <svg
              className="w-5 h-5 mr-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            리더 목록으로
          </Link>

          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            {/* Avatar */}
            <div className="w-32 h-32 bg-white/20 rounded-full flex items-center justify-center text-6xl border-4 border-white/50 shadow-lg flex-shrink-0">
              {leader.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={leader.avatarUrl}
                  alt={leader.displayName}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <span>{leader.categoryIcon}</span>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 text-center md:text-left">
              <div className="flex flex-col md:flex-row items-center md:items-start gap-3 mb-4">
                <h1 className="text-3xl font-bold">{leader.displayName}</h1>
                {leader.isVerified && (
                  <span className="bg-white/20 text-white text-sm px-3 py-1 rounded-full flex items-center gap-1">
                    ✓ 인증된 리더
                  </span>
                )}
              </div>

              <p className="text-white/90 text-lg mb-4 max-w-2xl">
                {leader.bio}
              </p>

              <div className="flex flex-wrap justify-center md:justify-start gap-3 mb-4">
                <span className="bg-white/20 px-4 py-2 rounded-full text-sm">
                  {leader.categoryIcon} {leader.categoryLabel}
                </span>
                <span className="bg-white/20 px-4 py-2 rounded-full text-sm">
                  👥 팔로워 {formatFollowerCount(followerCount)}
                </span>
                <span className="bg-white/20 px-4 py-2 rounded-full text-sm">
                  💜 기부 영향력 ₩{formatAmount(leader.totalDonationsInfluenced)}
                </span>
              </div>

              {/* Social Links */}
              {Object.keys(leader.socialLinks).length > 0 && (
                <div className="flex flex-wrap justify-center md:justify-start gap-2">
                  {Object.entries(leader.socialLinks).map(
                    ([platform, handle]) => (
                      <span
                        key={platform}
                        className="bg-white/10 px-3 py-1 rounded-full text-sm"
                      >
                        {getSocialIcon(platform)} {handle}
                      </span>
                    )
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="max-w-4xl mx-auto px-4 -mt-6">
        <MotionDiv variants={fadeInVariants} initial="hidden" animate="visible" className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-4 flex flex-col sm:flex-row gap-4">
          <button
            onClick={handleFollowToggle}
            disabled={isFollowLoading}
            className={`flex-1 py-3 px-6 rounded-xl font-semibold transition-all ${isFollowing
              ? "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              : `${colorClasses.bg} text-white hover:opacity-90`
              } disabled:opacity-50`}
          >
            {isFollowLoading ? (
              <span className="animate-pulse">처리중...</span>
            ) : isFollowing ? (
              "✓ 팔로잉"
            ) : (
              "팔로우"
            )}
          </button>
          <button
            onClick={() => setShowSupportModal(true)}
            className="flex-1 py-3 px-6 rounded-xl font-semibold bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:opacity-90 transition-all"
          >
            💜 직접 후원하기
          </button>
        </MotionDiv>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Stats Grid */}
        <MotionDiv variants={staggerContainerVariants} initial="hidden" animate="visible" className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <MotionDiv variants={fadeInVariants} className="bg-white dark:bg-gray-800 rounded-xl p-4 text-center shadow-md">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {formatFollowerCount(followerCount)}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              팔로워
            </div>
          </MotionDiv>
          <MotionDiv variants={fadeInVariants} className="bg-white dark:bg-gray-800 rounded-xl p-4 text-center shadow-md">
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {endorsements.length}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              후원 기관
            </div>
          </MotionDiv>
          <MotionDiv variants={fadeInVariants} className="bg-white dark:bg-gray-800 rounded-xl p-4 text-center shadow-md">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              ₩{formatAmount(leader.totalDonationsInfluenced)}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              기부 영향력
            </div>
          </MotionDiv>
          <MotionDiv variants={fadeInVariants} className="bg-white dark:bg-gray-800 rounded-xl p-4 text-center shadow-md">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {formatDate(leader.createdAt).split(" ")[0]}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              활동 시작
            </div>
          </MotionDiv>
        </MotionDiv>

        {/* Endorsed Institutes */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
            <span>🏛️</span>
            {leader.displayName}님이 추천하는 기관
          </h2>

          {endorsements.length > 0 ? (
            <div className="space-y-4">
              {endorsements.map((endorsement) => (
                <Link
                  key={endorsement.id}
                  href={`/donation/institute/${endorsement.institute.category}/general/${endorsement.institute.id}`}
                  className="block group"
                >
                  <SpotlightCard className="bg-gray-50 dark:bg-gray-700 rounded-xl border-transparent hover:border-purple-500/30 transition-colors">
                    <div className="flex items-start gap-4 p-5">
                      <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center text-2xl flex-shrink-0 shadow-sm">
                        {endorsement.institute.categoryIcon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-gray-900 dark:text-white group-hover:text-purple-600 transition-colors">
                            {endorsement.institute.name}
                          </h3>
                          {endorsement.institute.isVerified && (
                            <span className="text-green-500 text-sm">✓</span>
                          )}
                          <span className="text-xs bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded">
                            {endorsement.institute.categoryLabel}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          {endorsement.institute.description}
                        </p>
                        {endorsement.endorsementMessage && (
                          <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border-l-4 border-purple-500">
                            <p className="text-sm text-gray-700 dark:text-gray-300 italic">
                              &ldquo;{endorsement.endorsementMessage}&rdquo;
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              - {leader.displayName}
                            </p>
                          </div>
                        )}
                        <div className="flex items-center gap-4 mt-3 text-sm text-gray-500 dark:text-gray-400">
                          <span className="flex items-center gap-1">
                            <span className="text-yellow-500">⭐</span>
                            {endorsement.institute.trustScore.toFixed(1)}
                          </span>
                          <span>{formatDate(endorsement.endorsedAt)} 추천</span>
                        </div>
                      </div>
                      <svg
                        className="w-5 h-5 text-gray-400 flex-shrink-0 group-hover:text-purple-500 transition-colors"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </div>
                  </SpotlightCard>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <span className="text-4xl block mb-2">🏛️</span>
              아직 추천하는 기관이 없습니다.
            </div>
          )}
        </div>

        {/* Back Link */}
        <div className="text-center">
          <Link
            href="/donation/opinion-leader"
            className="inline-flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            ← 리더 목록으로 돌아가기
          </Link>
        </div>
      </div>

      {/* Support Modal */}
      {showSupportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                💜 직접 후원하기
              </h3>
              <button
                onClick={() => setShowSupportModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                ✕
              </button>
            </div>

            <div className="text-center mb-6">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center text-4xl mx-auto mb-3">
                {leader.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={leader.avatarUrl}
                    alt={leader.displayName}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <span>{leader.categoryIcon}</span>
                )}
              </div>
              <h4 className="font-semibold text-gray-900 dark:text-white">
                {leader.displayName}
              </h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {leader.categoryLabel} 분야
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                후원 금액 (PMC)
              </label>
              <div className="grid grid-cols-4 gap-2 mb-2">
                {[1000, 5000, 10000, 50000].map((amount) => (
                  <button
                    key={amount}
                    onClick={() => setSupportAmount(amount)}
                    className={`py-2 rounded-lg text-sm font-medium transition-colors ${supportAmount === amount
                      ? "bg-purple-500 text-white"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                      }`}
                  >
                    {amount.toLocaleString()}
                  </button>
                ))}
              </div>
              <input
                type="number"
                value={supportAmount}
                onChange={(e) =>
                  setSupportAmount(Math.max(0, parseInt(e.target.value) || 0))
                }
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="직접 입력"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                내 PMC 잔액: {userPmcBalance.toLocaleString()} PMC
              </p>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                응원 메시지 (선택)
              </label>
              <textarea
                value={supportMessage}
                onChange={(e) => setSupportMessage(e.target.value)}
                rows={3}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                placeholder="리더에게 전할 메시지를 작성해주세요"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowSupportModal(false)}
                className="flex-1 py-3 rounded-xl font-semibold bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleSupport}
                disabled={isSupportLoading || supportAmount <= 0}
                className="flex-1 py-3 rounded-xl font-semibold bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:opacity-90 transition-all disabled:opacity-50"
              >
                {isSupportLoading
                  ? "처리중..."
                  : `${supportAmount.toLocaleString()} PMC 후원`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
