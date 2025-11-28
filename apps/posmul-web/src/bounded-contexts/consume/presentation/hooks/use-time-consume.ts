'use client';

/**
 * TimeConsume Custom Hooks
 * 광고 시청 관련 React hooks
 */

import { useState, useCallback, useEffect } from 'react';

export interface AdCampaign {
  id: string;
  title: string;
  description: string | null;
  advertiserName: string;
  videoUrl: string | null;
  thumbnailUrl: string | null;
  durationSeconds: number;
  pmpReward: number;
  pmpRewardFull: number;
  surveyPmpBonus: number;
  dailyViewLimit: number;
  remainingBudget: number;
  status: string;
}

export interface DailyStats {
  date: string;
  totalViews: number;
  completedViews: number;
  totalWatchTime: number;
  totalPmpEarned: number;
  surveyCount: number;
  currentBalance: {
    pmp: number;
    pmc: number;
  };
}

export interface StartViewResponse {
  viewId: string;
  campaignId: string;
  campaignTitle: string;
  durationSeconds: number;
  pmpReward: number;
  pmpRewardFull: number;
  surveyPmpBonus: number;
  startedAt: string;
}

export interface CompleteViewResponse {
  viewId: string;
  watchDurationSeconds: number;
  completionRate: number;
  isCompleted: boolean;
  pmpEarned: number;
  surveyCompleted: boolean;
  message: string;
}

/**
 * 광고 캠페인 목록 조회 hook
 */
export function useAdCampaigns() {
  const [campaigns, setCampaigns] = useState<AdCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCampaigns = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/consume/time/campaigns');
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error ?? '캠페인을 불러오는 데 실패했습니다.');
      }

      setCampaigns(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  return { campaigns, loading, error, refetch: fetchCampaigns };
}

/**
 * 일일 통계 조회 hook
 */
export function useDailyStats(date?: string) {
  const [stats, setStats] = useState<DailyStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const url = date
        ? `/api/consume/time/stats?date=${date}`
        : '/api/consume/time/stats';
      
      const response = await fetch(url);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error ?? '통계를 불러오는 데 실패했습니다.');
      }

      setStats(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return { stats, loading, error, refetch: fetchStats };
}

/**
 * 광고 시청 hook
 */
export function useAdView() {
  const [currentView, setCurrentView] = useState<StartViewResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CompleteViewResponse | null>(null);

  const startView = useCallback(async (campaignId: string) => {
    setLoading(true);
    setError(null);
    setResult(null);
    
    try {
      const response = await fetch('/api/consume/time/view', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignId,
          deviceInfo: {
            userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
            timestamp: new Date().toISOString(),
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? '광고 시청을 시작하는 데 실패했습니다.');
      }

      setCurrentView(data.data);
      return data.data as StartViewResponse;
    } catch (err) {
      const message = err instanceof Error ? err.message : '오류가 발생했습니다.';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const completeView = useCallback(async (
    viewId: string,
    watchDurationSeconds: number,
    surveyCompleted: boolean = false
  ) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/consume/time/view/${viewId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          watchDurationSeconds,
          surveyCompleted,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? '광고 시청을 완료하는 데 실패했습니다.');
      }

      setResult(data.data);
      setCurrentView(null);
      return data.data as CompleteViewResponse;
    } catch (err) {
      const message = err instanceof Error ? err.message : '오류가 발생했습니다.';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setCurrentView(null);
    setResult(null);
    setError(null);
  }, []);

  return {
    currentView,
    result,
    loading,
    error,
    startView,
    completeView,
    reset,
  };
}
