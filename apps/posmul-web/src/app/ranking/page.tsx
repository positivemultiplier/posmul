'use client';

/**
 * Ranking Page
 * 통합 랭킹 페이지 - 모든 활동 점수 종합 랭킹
 */

import { useState } from 'react';
import {
  useRanking,
  RANKING_CATEGORIES,
  RANKING_PERIODS,
  type RankingCategory,
  type RankingPeriod,
  type RankingEntry,
} from '@/bounded-contexts/ranking/presentation/hooks/use-ranking';

// 랭킹 카드 컴포넌트
function RankingCard({ entry, showDetails }: { entry: RankingEntry; showDetails: boolean }) {
  const getRankStyle = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-r from-yellow-400 to-amber-500 text-white';
      case 2:
        return 'bg-gradient-to-r from-gray-300 to-gray-400 text-gray-800';
      case 3:
        return 'bg-gradient-to-r from-amber-600 to-amber-700 text-white';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return '🥇';
      case 2:
        return '🥈';
      case 3:
        return '🥉';
      default:
        return `#${rank}`;
    }
  };

  return (
    <div
      className={`p-4 rounded-lg border ${entry.isCurrentUser ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'} shadow-sm hover:shadow-md transition-shadow`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* 순위 배지 */}
          <div
            className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${getRankStyle(entry.rank)}`}
          >
            {entry.rank <= 3 ? getRankIcon(entry.rank) : entry.rank}
          </div>

          {/* 사용자 정보 */}
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-900">
                {entry.displayName}
                {entry.isCurrentUser && (
                  <span className="ml-2 text-xs bg-blue-500 text-white px-2 py-0.5 rounded">나</span>
                )}
              </span>
              {entry.badge && <span className="text-lg">{entry.badge}</span>}
            </div>
            {showDetails && (
              <div className="text-sm text-gray-500 mt-1 flex flex-wrap gap-2">
                {entry.details.forumPmp !== undefined && (
                  <span>Forum: {entry.details.forumPmp.toLocaleString()} PMP</span>
                )}
                {entry.details.consumePmc !== undefined && (
                  <span>Consume: {entry.details.consumePmc.toLocaleString()} PMC</span>
                )}
                {entry.details.expectPmc !== undefined && (
                  <span>Expect: {entry.details.expectPmc.toLocaleString()} PMC</span>
                )}
                {entry.details.donationPmc !== undefined && (
                  <span>Donation: {entry.details.donationPmc.toLocaleString()} PMC</span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 점수 */}
        <div className="text-right">
          <div className="text-xl font-bold text-blue-600">{entry.score.toLocaleString()}</div>
          <div className="text-sm text-gray-500">포인트</div>
        </div>
      </div>
    </div>
  );
}

// 카테고리 탭 컴포넌트
function CategoryTabs({
  current,
  onChange,
}: {
  current: RankingCategory;
  onChange: (cat: RankingCategory) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {RANKING_CATEGORIES.map((cat) => (
        <button
          key={cat.id}
          onClick={() => onChange(cat.id)}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            current === cat.id
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <span className="mr-1">{cat.icon}</span>
          {cat.label}
        </button>
      ))}
    </div>
  );
}

// 기간 필터 컴포넌트
function PeriodFilter({
  current,
  onChange,
}: {
  current: RankingPeriod;
  onChange: (period: RankingPeriod) => void;
}) {
  return (
    <div className="flex gap-2">
      {RANKING_PERIODS.map((p) => (
        <button
          key={p.id}
          onClick={() => onChange(p.id)}
          className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
            current === p.id
              ? 'bg-gray-800 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <span className="mr-1">{p.icon}</span>
          {p.label}
        </button>
      ))}
    </div>
  );
}

// 현재 사용자 랭킹 카드
function CurrentUserCard({ user }: { user: RankingEntry }) {
  return (
    <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 rounded-lg mb-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm opacity-80">내 랭킹</div>
          <div className="text-3xl font-bold">#{user.rank}</div>
        </div>
        <div className="text-right">
          <div className="text-sm opacity-80">내 점수</div>
          <div className="text-2xl font-bold">{user.score.toLocaleString()}</div>
        </div>
      </div>
    </div>
  );
}

export default function RankingPage() {
  const {
    rankings,
    currentUser,
    meta,
    loading,
    error,
    category,
    period,
    changeCategory,
    changePeriod,
  } = useRanking('overall');

  const [showDetails, setShowDetails] = useState(true);

  const currentCategoryInfo = RANKING_CATEGORIES.find((c) => c.id === category);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-2">🏆 통합 랭킹</h1>
          <p className="text-blue-100">모든 활동 점수를 합산한 종합 랭킹입니다.</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* 카테고리 탭 */}
        <CategoryTabs current={category} onChange={changeCategory} />

        {/* 현재 카테고리 설명 */}
        {currentCategoryInfo && (
          <div className="bg-white rounded-lg p-4 mb-4 border border-gray-200">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{currentCategoryInfo.icon}</span>
              <div>
                <h2 className="font-semibold text-lg">{currentCategoryInfo.label} 랭킹</h2>
                <p className="text-gray-600 text-sm">{currentCategoryInfo.description}</p>
              </div>
            </div>
          </div>
        )}

        {/* 필터 및 옵션 */}
        <div className="flex flex-wrap justify-between items-center mb-4 gap-4">
          <PeriodFilter current={period} onChange={changePeriod} />

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm text-gray-600">
              <input
                type="checkbox"
                checked={showDetails}
                onChange={(e) => setShowDetails(e.target.checked)}
                className="rounded text-blue-600"
              />
              상세 점수 표시
            </label>
            {meta && (
              <span className="text-sm text-gray-500">
                총 {meta.totalParticipants.toLocaleString()}명 참여
              </span>
            )}
          </div>
        </div>

        {/* 현재 사용자 랭킹 */}
        {currentUser && <CurrentUserCard user={currentUser} />}

        {/* 로딩 상태 */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        )}

        {/* 에러 상태 */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {/* 랭킹 목록 */}
        {!loading && !error && (
          <div className="space-y-3">
            {rankings.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <p className="text-5xl mb-4">📊</p>
                <p>아직 랭킹 데이터가 없습니다.</p>
              </div>
            ) : (
              rankings.map((entry) => (
                <RankingCard key={entry.userId} entry={entry} showDetails={showDetails} />
              ))
            )}
          </div>
        )}

        {/* 메타 정보 */}
        {meta && (
          <div className="mt-6 text-center text-sm text-gray-500">
            마지막 업데이트: {new Date(meta.lastUpdated).toLocaleString('ko-KR')}
          </div>
        )}
      </div>
    </div>
  );
}
