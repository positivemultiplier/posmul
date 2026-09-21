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
  sido?: string;
  sigungu?: string;
  dong?: string;
  jobGroup?: string;
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
export function useRanking(initialCategory: RankingCategory = 'expect') {
  const [rankings, setRankings] = useState<RankingEntry[]>([]);
  const [currentUser, setCurrentUser] = useState<RankingEntry | null>(null);
  const [meta, setMeta] = useState<RankingMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState<RankingCategory>(initialCategory);
  const [period, setPeriod] = useState<RankingPeriod>('all');

  // 지역 및 직업군 필터 상태
  const [sido, setSido] = useState<string>('전국');
  const [sigungu, setSigungu] = useState<string>('전체');
  const [dong, setDong] = useState<string>('전체');
  const [jobGroup, setJobGroup] = useState<string>('전체');

  const fetchRankings = useCallback(
    async (
      cat?: RankingCategory,
      per?: RankingPeriod,
      s?: string,
      sgg?: string,
      d?: string,
      jg?: string
    ) => {
      setLoading(true);
      setError(null);

      const currentCategory = cat ?? category;
      const currentPeriod = per ?? period;
      const currentSido = s ?? sido;
      const currentSigungu = sgg ?? sigungu;
      const currentDong = d ?? dong;
      const currentJobGroup = jg ?? jobGroup;

      try {
        const params = new URLSearchParams({
          category: currentCategory,
          period: currentPeriod,
          sido: currentSido,
          sigungu: currentSigungu,
          dong: currentDong,
          jobGroup: currentJobGroup,
          limit: '30',
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
    },
    [category, period, sido, sigungu, dong, jobGroup]
  );

  useEffect(() => {
    fetchRankings();
  }, [fetchRankings]);

  const changeCategory = useCallback(
    (newCategory: RankingCategory) => {
      setCategory(newCategory);
      fetchRankings(newCategory, period, sido, sigungu, dong, jobGroup);
    },
    [period, sido, sigungu, dong, jobGroup, fetchRankings]
  );

  const changePeriod = useCallback(
    (newPeriod: RankingPeriod) => {
      setPeriod(newPeriod);
      fetchRankings(category, newPeriod, sido, sigungu, dong, jobGroup);
    },
    [category, sido, sigungu, dong, jobGroup, fetchRankings]
  );

  const changeRegion = useCallback(
    (newSido: string, newSigungu: string = '전체', newDong: string = '전체') => {
      setSido(newSido);
      setSigungu(newSigungu);
      setDong(newDong);
      fetchRankings(category, period, newSido, newSigungu, newDong, jobGroup);
    },
    [category, period, jobGroup, fetchRankings]
  );

  const changeJobGroup = useCallback(
    (newJobGroup: string) => {
      setJobGroup(newJobGroup);
      fetchRankings(category, period, sido, sigungu, dong, newJobGroup);
    },
    [category, period, sido, sigungu, dong, fetchRankings]
  );

  return {
    rankings,
    currentUser,
    meta,
    loading,
    error,
    category,
    period,
    sido,
    sigungu,
    dong,
    jobGroup,
    changeCategory,
    changePeriod,
    changeRegion,
    changeJobGroup,
    refetch: fetchRankings,
  };
}

// 카테고리 정보
export const RANKING_CATEGORIES: { id: RankingCategory; label: string; icon: string; description: string }[] = [
  { id: 'expect', label: '🔮 예측의 신 ("내가 그랬제!")', icon: '🔮', description: '미래 예측 적중 및 통찰력 랭킹' },
  { id: 'overall', label: '🏆 종합', icon: '🏆', description: '모든 활동 점수 합산' },
  { id: 'donation', label: '❤️ 기부 엔젤', icon: '❤️', description: '공익 기부 PMC 랭킹' },
  { id: 'forum', label: '💬 공론장', icon: '💬', description: '토론 및 이슈 리포트 PMP' },
  { id: 'consume', label: '💳 소비', icon: '💳', description: '소비 활동 PMC' },
];

export const RANKING_PERIODS: { id: RankingPeriod; label: string; icon: string }[] = [
  { id: 'all', label: '전체', icon: '🏆' },
  { id: 'monthly', label: '이번 달', icon: '📅' },
  { id: 'weekly', label: '이번 주', icon: '📆' },
];
