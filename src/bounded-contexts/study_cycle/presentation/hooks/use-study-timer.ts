"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Result } from "@/shared/types";
import { DomainError } from "@/shared/errors";
import { StudySessionId, StudySessionStatus } from "../../domain/entities/study-session.entity";
import { 
  StudyTimeTrackerService, 
  TimerState, 
  TimerConfig, 
  TimerCallbacks 
} from "../../infrastructure/services/study-time-tracker.service";

export interface UseStudyTimerOptions {
  config?: TimerConfig;
  onAutoSave?: (elapsedSeconds: number) => Promise<void>;
  onTimerError?: (error: Error) => void;
}

export interface UseStudyTimerReturn {
  // 상태
  timerState: TimerState | null;
  isActive: boolean;
  isPaused: boolean;
  elapsedTime: string; // "HH:MM:SS" 형식
  elapsedSeconds: number;
  
  // 액션
  startTimer: (sessionId: StudySessionId) => Result<void, DomainError>;
  pauseTimer: () => Result<void, DomainError>;
  resumeTimer: () => Result<void, DomainError>;
  stopTimer: () => Result<number, DomainError>;
  
  // 상태 확인
  canStart: boolean;
  canPause: boolean;
  canResume: boolean;
  canStop: boolean;
  
  // 에러 상태
  error: DomainError | null;
  clearError: () => void;
}

/**
 * 학습 시간 추적을 위한 React 훅
 * 
 * 기능:
 * - 실시간 타이머 UI 업데이트
 * - 자동 저장 콜백 처리
 * - 에러 상태 관리
 * - 타이머 상태 복구
 * - 컴포넌트 언마운트 시 정리
 */
export function useStudyTimer(options: UseStudyTimerOptions = {}): UseStudyTimerReturn {
  const [timerState, setTimerState] = useState<TimerState | null>(null);
  const [error, setError] = useState<DomainError | null>(null);
  const timerServiceRef = useRef<StudyTimeTrackerService | null>(null);

  // 타이머 콜백 설정
  const callbacks: TimerCallbacks = {
    onTick: useCallback((state: TimerState) => {
      setTimerState(state);
    }, []),
    
    onAutoSave: useCallback(async (elapsedSeconds: number) => {
      if (options.onAutoSave) {
        try {
          await options.onAutoSave(elapsedSeconds);
        } catch (error) {
          const domainError = new DomainError(
            error instanceof Error ? error.message : "Auto save failed",
            "AUTO_SAVE_ERROR"
          );
          setError(domainError);
          options.onTimerError?.(error instanceof Error ? error : new Error("Auto save failed"));
        }
      }
    }, [options]),
    
    onPause: useCallback((reason: 'manual' | 'visibility' | 'beforeunload') => {
      // 일시정지 시 상태 업데이트는 onTick에서 처리됨
    }, []),
    
    onResume: useCallback((reason: 'manual' | 'visibility') => {
      // 재개 시 상태 업데이트는 onTick에서 처리됨
    }, []),
    
    onError: useCallback((error: Error) => {
      const domainError = new DomainError(error.message, "TIMER_SERVICE_ERROR");
      setError(domainError);
      options.onTimerError?.(error);
    }, [options]),
  };

  // 타이머 서비스 초기화
  useEffect(() => {
    timerServiceRef.current = new StudyTimeTrackerService(options.config, callbacks);
    
    // 저장된 상태에서 복구 시도
    const restoreResult = timerServiceRef.current.restoreFromStorage();
    if (restoreResult.success && restoreResult.data) {
      setTimerState(restoreResult.data);
    } else if (!restoreResult.success) {
      setError(restoreResult.error);
    }

    // 컴포넌트 언마운트 시 정리
    return () => {
      if (timerServiceRef.current) {
        timerServiceRef.current.destroy();
        timerServiceRef.current = null;
      }
    };
  }, []);

  // 타이머 액션들
  const startTimer = useCallback((sessionId: StudySessionId): Result<void, DomainError> => {
    if (!timerServiceRef.current) {
      return { success: false, error: new DomainError("Timer service not initialized", "SERVICE_NOT_INITIALIZED") };
    }

    const result = timerServiceRef.current.startTimer(sessionId);
    if (!result.success) {
      setError(result.error);
    } else {
      setError(null);
    }
    
    return result;
  }, []);

  const pauseTimer = useCallback((): Result<void, DomainError> => {
    if (!timerServiceRef.current) {
      return { success: false, error: new DomainError("Timer service not initialized", "SERVICE_NOT_INITIALIZED") };
    }

    const result = timerServiceRef.current.pauseTimer('manual');
    if (!result.success) {
      setError(result.error);
    } else {
      setError(null);
    }
    
    return result;
  }, []);

  const resumeTimer = useCallback((): Result<void, DomainError> => {
    if (!timerServiceRef.current) {
      return { success: false, error: new DomainError("Timer service not initialized", "SERVICE_NOT_INITIALIZED") };
    }

    const result = timerServiceRef.current.resumeTimer('manual');
    if (!result.success) {
      setError(result.error);
    } else {
      setError(null);
    }
    
    return result;
  }, []);

  const stopTimer = useCallback((): Result<number, DomainError> => {
    if (!timerServiceRef.current) {
      return { success: false, error: new DomainError("Timer service not initialized", "SERVICE_NOT_INITIALIZED") };
    }

    const result = timerServiceRef.current.stopTimer();
    if (!result.success) {
      setError(result.error);
    } else {
      setError(null);
      setTimerState(null);
    }
    
    return result;
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // 파생 상태들
  const isActive = timerState?.status === StudySessionStatus.ACTIVE;
  const isPaused = timerState?.status === StudySessionStatus.PAUSED;
  const elapsedSeconds = timerState?.elapsedSeconds || 0;
  
  // 시간을 HH:MM:SS 형식으로 포맷
  const elapsedTime = formatElapsedTime(elapsedSeconds);
  
  // 액션 가능 여부
  const canStart = !timerState || timerState.status === StudySessionStatus.COMPLETED;
  const canPause = isActive;
  const canResume = isPaused;
  const canStop = timerState !== null;

  return {
    // 상태
    timerState,
    isActive,
    isPaused,
    elapsedTime,
    elapsedSeconds,
    
    // 액션
    startTimer,
    pauseTimer,
    resumeTimer,
    stopTimer,
    
    // 상태 확인
    canStart,
    canPause,
    canResume,
    canStop,
    
    // 에러 상태
    error,
    clearError,
  };
}

/**
 * 초 단위 시간을 HH:MM:SS 형식으로 변환
 */
function formatElapsedTime(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  
  return [hours, minutes, seconds]
    .map(unit => unit.toString().padStart(2, '0'))
    .join(':');
} 