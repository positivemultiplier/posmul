'use client';

/**
 * Ranking Page
 * 통합 랭킹 페이지 - Forum 스타일 UI/UX
 */

import { useState } from 'react';
import { Trophy, Medal, Award, TrendingUp, Users, Clock, Eye } from 'lucide-react';
import { motion } from 'framer-motion';
import {
  useRanking,
  RANKING_CATEGORIES,
  RANKING_PERIODS,
  type RankingCategory,
  type RankingPeriod,
  type RankingEntry,
} from '@/bounded-contexts/ranking/presentation/hooks/use-ranking';

// 랭킹 카드 컴포넌트
function RankingCard({ entry, showDetails, rank }: { entry: RankingEntry; showDetails: boolean; rank: number }) {
  const getRankStyle = (r: number) => {
    switch (r) {
      case 1:
        return 'bg-gradient-to-r from-yellow-500 to-amber-500 text-white';
      case 2:
        return 'bg-gradient-to-r from-slate-400 to-slate-500 text-white';
      case 3:
        return 'bg-gradient-to-r from-amber-700 to-amber-800 text-white';
      default:
        return 'bg-slate-800 text-slate-300';
    }
  };

  const getRankIcon = (r: number) => {
    switch (r) {
      case 1:
        return '🥇';
      case 2:
        return '🥈';
      case 3:
        return '🥉';
      default:
        return `${r}`;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: rank * 0.05 }}
      className={`p-4 rounded-xl border ${entry.isCurrentUser
        ? 'border-amber-500/50 bg-amber-900/20'
        : 'border-slate-800 bg-slate-900/70'
        } hover:border-amber-700/50 transition-all`}
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
              <span className="font-semibold text-white">
                {entry.displayName}
                {entry.isCurrentUser && (
                  <span className="ml-2 text-xs bg-amber-500 text-white px-2 py-0.5 rounded">나</span>
                )}
              </span>
              {entry.badge && <span className="text-lg">{entry.badge}</span>}
            </div>
            {showDetails && (
              <div className="text-xs text-slate-500 mt-1 flex flex-wrap gap-2">
                {entry.details.forumPmp !== undefined && (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-900/30 text-emerald-400">Forum {entry.details.forumPmp.toLocaleString()}</span>
                )}
                {entry.details.consumePmc !== undefined && (
                  <span className="px-2 py-0.5 rounded-full bg-indigo-900/30 text-indigo-400">Consume {entry.details.consumePmc.toLocaleString()}</span>
                )}
                {entry.details.expectPmc !== undefined && (
                  <span className="px-2 py-0.5 rounded-full bg-blue-900/30 text-blue-400">Expect {entry.details.expectPmc.toLocaleString()}</span>
                )}
                {entry.details.donationPmc !== undefined && (
                  <span className="px-2 py-0.5 rounded-full bg-purple-900/30 text-purple-400">Donation {entry.details.donationPmc.toLocaleString()}</span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 점수 */}
        <div className="text-right">
          <div className="text-xl font-bold text-amber-400">{entry.score.toLocaleString()}</div>
          <div className="text-xs text-slate-500">포인트</div>
        </div>
      </div>
    </motion.div>
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
          className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${current === cat.id
            ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/25'
            : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-300'
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
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${current === p.id
            ? 'bg-slate-700 text-white'
            : 'bg-slate-800/50 text-slate-500 hover:bg-slate-700 hover:text-slate-300'
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
    <div className="bg-gradient-to-r from-amber-600 to-orange-600 text-white p-4 rounded-xl mb-6 shadow-lg shadow-amber-500/20">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm opacity-80 flex items-center gap-1">
            <Trophy className="w-4 h-4" />
            내 랭킹
          </div>
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
    <div className="min-h-screen bg-gradient-to-b from-amber-950 to-slate-950 text-slate-200">
      {/* Header - Forum 스타일 */}
      <header className="sticky top-0 z-10 backdrop-blur-xl bg-amber-950/80 border-b border-amber-800/50">
        <div className="max-w-4xl mx-auto p-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-400">
                🏆 Ranking
              </h1>
              <p className="text-sm text-amber-400/70">통합 랭킹 · 활동 점수</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-400">총 참여자</p>
              <p className="text-xl font-bold text-amber-400">
                <span className="text-2xl">{meta?.totalParticipants.toLocaleString() || 0}</span>
                <span className="text-sm ml-1">명</span>
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* 카테고리 탭 */}
        <CategoryTabs current={category} onChange={changeCategory} />

        {/* 현재 카테고리 설명 */}
        {currentCategoryInfo && (
          <div className="bg-slate-900/70 rounded-xl p-4 border border-slate-800">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{currentCategoryInfo.icon}</span>
              <div>
                <h2 className="font-semibold text-lg text-white">{currentCategoryInfo.label} 랭킹</h2>
                <p className="text-slate-400 text-sm">{currentCategoryInfo.description}</p>
              </div>
            </div>
          </div>
        )}

        {/* 필터 및 옵션 */}
        <div className="flex flex-wrap justify-between items-center gap-4">
          <PeriodFilter current={period} onChange={changePeriod} />

          <label className="flex items-center gap-2 text-sm text-slate-400">
            <input
              type="checkbox"
              checked={showDetails}
              onChange={(e) => setShowDetails(e.target.checked)}
              className="rounded bg-slate-800 border-slate-700 text-amber-500 focus:ring-amber-500"
            />
            <Eye className="w-4 h-4" />
            상세 점수
          </label>
        </div>

        {/* 현재 사용자 랭킹 */}
        {currentUser && <CurrentUserCard user={currentUser} />}

        {/* 로딩 상태 */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
          </div>
        )}

        {/* 에러 상태 */}
        {error && (
          <div className="bg-red-900/30 border border-red-800 text-red-400 px-4 py-3 rounded-xl">
            {error}
          </div>
        )}

        {/* 랭킹 목록 */}
        {!loading && !error && (
          <div className="space-y-3">
            {rankings.length === 0 ? (
              <div className="text-center py-16 text-slate-500">
                <Trophy className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>아직 랭킹 데이터가 없습니다.</p>
              </div>
            ) : (
              rankings.map((entry, index) => (
                <RankingCard key={entry.userId} entry={entry} showDetails={showDetails} rank={index} />
              ))
            )}
          </div>
        )}

        {/* 메타 정보 */}
        {meta && (
          <div className="text-center text-sm text-slate-500 flex items-center justify-center gap-2">
            <Clock className="w-4 h-4" />
            마지막 업데이트: {new Date(meta.lastUpdated).toLocaleString('ko-KR')}
          </div>
        )}
      </main>
    </div>
  );
}
