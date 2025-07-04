"use client";

import { useState, useEffect, useCallback } from "react";
import { DomainError } from "@posmul/shared-types";
import { UserId, StudySessionSummary } from "../../domain/entities/study-session.entity";
import { TextbookId } from "../../domain/entities/textbook.entity";
import { ReadingMetrics } from "../../domain/entities/reading.entity";

export interface UseStudyLogDataOptions {
  userId: UserId;
  textbookId?: TextbookId;
  limit?: number;
  refreshInterval?: number; // milliseconds
}

export interface UseStudyLogDataReturn {
  // 데이터
  studyHistory: StudySessionSummary[] | null;
  readingProgress: ReadingMetrics | null;
  
  // 상태
  isLoading: boolean;
  error: DomainError | null;
  
  // 액션
  refreshData: () => Promise<void>;
  refreshHistory: () => Promise<void>;
  refreshProgress: () => Promise<void>;
}

/**
 * StudyLog 데이터를 관리하는 React 훅
 * 
 * 기능:
 * - 학습 기록 조회 및 캐싱
 * - 진도 현황 조회 및 캐싱
 * - 자동 새로고침 (옵션)
 * - 에러 상태 관리
 * - 로딩 상태 관리
 */
export function useStudyLogData(options: UseStudyLogDataOptions): UseStudyLogDataReturn {
  const { userId, textbookId, limit = 20, refreshInterval } = options;

  // 상태 관리
  const [studyHistory, setStudyHistory] = useState<StudySessionSummary[] | null>(null);
  const [readingProgress, setReadingProgress] = useState<ReadingMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<DomainError | null>(null);

  // 학습 기록 조회
  const refreshHistory = useCallback(async () => {
    try {
      // Mock 데이터 (실제 구현에서는 Use Case 사용)
      const mockHistory: StudySessionSummary[] = [
        {
          sessionId: "session-1" as UserId,
          textbookId: textbookId || ("textbook-1" as TextbookId),
          chapterId: "chapter-1" as TextbookId,
          totalTimeMinutes: 45,
          pagesCompleted: 12,
          averageDifficulty: 3.5,
          averageComprehension: 4.2,
          startedAt: new Date(Date.now() - 86400000), // 1일 전
          completedAt: new Date(Date.now() - 86400000 + 2700000), // 45분 후
        },
        {
          sessionId: "session-2" as UserId,
          textbookId: textbookId || ("textbook-1" as TextbookId),
          chapterId: "chapter-2" as TextbookId,
          totalTimeMinutes: 60,
          pagesCompleted: 15,
          averageDifficulty: 4.0,
          averageComprehension: 3.8,
          startedAt: new Date(Date.now() - 172800000), // 2일 전
          completedAt: new Date(Date.now() - 172800000 + 3600000), // 60분 후
        },
      ];
      setStudyHistory(mockHistory);
      setError(null);
    } catch (err) {
      setError(new DomainError(
        err instanceof Error ? err.message : "Unknown error occurred",
        "FETCH_HISTORY_ERROR"
      ));
    }
  }, [userId, limit, textbookId]);

  // 진도 현황 조회
  const refreshProgress = useCallback(async () => {
    try {
      if (!textbookId) {
        setReadingProgress(null);
        return;
      }

      // Mock 데이터 (실제 구현에서는 Use Case 사용)
      const mockProgress: ReadingMetrics = {
        totalTimeMinutes: 720, // 12시간
        averagePageTime: 3.5, // 3.5분/페이지
        totalPagesRead: 205,
        averageDifficulty: 3.2,
        averageComprehension: 4.1,
        studySessionsCount: 8,
        completionPercentage: 40.5,
      };
      setReadingProgress(mockProgress);
      setError(null);
    } catch (err) {
      setError(new DomainError(
        err instanceof Error ? err.message : "Unknown error occurred",
        "FETCH_PROGRESS_ERROR"
      ));
    }
  }, [userId, textbookId]);

  // 전체 데이터 새로고침
  const refreshData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      await Promise.all([
        refreshHistory(),
        refreshProgress(),
      ]);
    } catch (err) {
      setError(new DomainError(
        err instanceof Error ? err.message : "Failed to refresh data",
        "REFRESH_ERROR"
      ));
    } finally {
      setIsLoading(false);
    }
  }, [refreshHistory, refreshProgress]);

  // 초기 데이터 로드
  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // 자동 새로고침 설정
  useEffect(() => {
    if (!refreshInterval || refreshInterval <= 0) {
      return;
    }

    const interval = setInterval(() => {
      refreshData();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [refreshInterval, refreshData]);

  return {
    // 데이터
    studyHistory,
    readingProgress,
    
    // 상태
    isLoading,
    error,
    
    // 액션
    refreshData,
    refreshHistory,
    refreshProgress,
  };
} 