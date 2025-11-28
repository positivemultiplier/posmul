'use client';

/**
 * Ranking Custom Hooks
 * 통합 랭킹 관련 React hooks
 */

import { useState, useCallback, useEffect } from 'react';

export type RankingCategory = 'overall' | 'forum' | 'consume' | 'expect' | 'donation';
export type RankingPeriod = 'all' | 'monthly' | 'weekly';

export interface RankingEntry {
  rank: number;
  userId: string;
  displayName: string;
  score: number;
  details: {
    forumPmp?: number;
    consumePmc?: number;
    expectPmc?: number;
    donationPmc?: number;
    postsCount?: number;
    donationCount?: number;
  };
  badge: string | null;
  isCurrentUser: boolean;
}

export interface RankingMeta {
  category: RankingCategory;
  period: RankingPeriod;
  totalParticipants: number;
  lastUpdated: string;
}

/**
 * 통합 랭킹 조회 hook
 */
export function useRanking(initialCategory: RankingCategory = 'overall') {
  const [rankings, setRankings] = useState<RankingEntry[]>([]);
  const [currentUser, setCurrentUser] = useState<RankingEntry | null>(null);
  const [meta, setMeta] = useState<RankingMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState<RankingCategory>(initialCategory);
  const [period, setPeriod] = useState<RankingPeriod>('all');

  const fetchRankings = useCallback(async (cat?: RankingCategory, per?: RankingPeriod) => {
    setLoading(true);
    setError(null);
    
    const currentCategory = cat ?? category;
    const currentPeriod = per ?? period;
    
    try {
      const params = new URLSearchParams({
        category: currentCategory,
        period: currentPeriod,
        limit: '20',
      });

      const response = await fetch(`/api/ranking?${params.toString()}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error ?? '랭킹을 불러오는 데 실패했습니다.');
      }

      setRankings(result.data.rankings);
      setCurrentUser(result.data.currentUser);
      setMeta(result.data.meta);
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }, [category, period]);

  useEffect(() => {
    fetchRankings();
  }, [fetchRankings]);

  const changeCategory = useCallback((newCategory: RankingCategory) => {
    setCategory(newCategory);
    fetchRankings(newCategory, period);
  }, [period, fetchRankings]);

  const changePeriod = useCallback((newPeriod: RankingPeriod) => {
    setPeriod(newPeriod);
    fetchRankings(category, newPeriod);
  }, [category, fetchRankings]);

  return {
    rankings,
    currentUser,
    meta,
    loading,
    error,
    category,
    period,
    changeCategory,
    changePeriod,
    refetch: fetchRankings,
  };
}

// 카테고리 정보
export const RANKING_CATEGORIES: { id: RankingCategory; label: string; icon: string; description: string }[] = [
  { id: 'overall', label: '종합', icon: '🏆', description: '모든 활동 점수 합산' },
  { id: 'forum', label: 'Forum', icon: '💬', description: '토론 및 글 작성 PMP' },
  { id: 'consume', label: 'Consume', icon: '💳', description: '소비 활동 PMC' },
  { id: 'expect', label: 'Expect', icon: '🎯', description: '예측 게임 PMC' },
  { id: 'donation', label: 'Donation', icon: '❤️', description: '기부 PMC' },
];

export const RANKING_PERIODS: { id: RankingPeriod; label: string; icon: string }[] = [
  { id: 'all', label: '전체', icon: '🏆' },
  { id: 'monthly', label: '이번 달', icon: '📅' },
  { id: 'weekly', label: '이번 주', icon: '📆' },
];
