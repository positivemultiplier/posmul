"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Result } from "@posmul/auth-economy-sdk";
import { StudySessionId, StudySessionStatus } from "../../../types/study-cycle-types";

// React Native 환경에서 글로벌 timer 함수들 선언
declare const setInterval: (callback: () => void, ms: number) => number;
declare const clearInterval: (id: number) => void;

// DomainError를 임시로 정의 (이후 SDK에서 제공될 예정)
class DomainError extends Error {
  constructor(message: string, public code: string = 'DOMAIN_ERROR') {
    super(message);
    this.name = 'DomainError';
  }
}

// TimerState, TimerConfig, TimerCallbacks를 임시로 정의
export interface TimerState {
  sessionId: StudySessionId;
  status: StudySessionStatus;
  elapsedSeconds: number;
  breakDurationSeconds?: number;
  lastActivity?: Date;
}

export interface TimerConfig {
  autoSaveInterval?: number;
  maxInactivityMinutes?: number;
  enableBreakReminder?: boolean;
  breakReminderInterval?: number;
}

export interface TimerCallbacks {
  onSessionStart?: (sessionId: StudySessionId) => Promise<void>;
  onSessionPause?: (sessionId: StudySessionId, elapsedSeconds: number) => Promise<void>;
  onSessionResume?: (sessionId: StudySessionId) => Promise<void>;
  onSessionComplete?: (sessionId: StudySessionId, elapsedSeconds: number) => Promise<void>;
  onAutoSave?: (sessionId: StudySessionId, elapsedSeconds: number) => Promise<void>;
  onError?: (error: Error) => void;
}

// StudyTimeTrackerService를 임시로 구현
class StudyTimeTrackerService {
  private timerState: TimerState | null = null;
  private intervalId: number | null = null;
  private config: TimerConfig;
  private callbacks: TimerCallbacks;

  constructor(config: TimerConfig = {}, callbacks: TimerCallbacks = {}) {
    this.config = {
      autoSaveInterval: 30000, // 30초
      maxInactivityMinutes: 10,
      enableBreakReminder: true,
      breakReminderInterval: 25 * 60 * 1000, // 25분
      ...config
    };
    this.callbacks = callbacks;
  }

  async startSession(sessionId: StudySessionId): Promise<Result<TimerState, DomainError>> {
    try {
      this.timerState = {
        sessionId,
        status: 'active',
        elapsedSeconds: 0,
        lastActivity: new Date()
      };

      this.startTimer();
      await this.callbacks.onSessionStart?.(sessionId);

      return { success: true, data: this.timerState };
    } catch (error) {
      const domainError = new DomainError('Failed to start session');
      this.callbacks.onError?.(domainError);
      return { success: false, error: domainError };
    }
  }

  async pauseSession(): Promise<Result<TimerState, DomainError>> {
    try {
      if (!this.timerState) {
        throw new DomainError('No active session to pause');
      }

      this.timerState.status = 'paused';
      this.stopTimer();
      await this.callbacks.onSessionPause?.(this.timerState.sessionId, this.timerState.elapsedSeconds);

      return { success: true, data: this.timerState };
    } catch (error) {
      const domainError = new DomainError('Failed to pause session');
      this.callbacks.onError?.(domainError);
      return { success: false, error: domainError };
    }
  }

  async resumeSession(): Promise<Result<TimerState, DomainError>> {
    try {
      if (!this.timerState) {
        throw new DomainError('No session to resume');
      }

      this.timerState.status = 'active';
      this.timerState.lastActivity = new Date();
      this.startTimer();
      await this.callbacks.onSessionResume?.(this.timerState.sessionId);

      return { success: true, data: this.timerState };
    } catch (error) {
      const domainError = new DomainError('Failed to resume session');
      this.callbacks.onError?.(domainError);
      return { success: false, error: domainError };
    }
  }

  async completeSession(): Promise<Result<TimerState, DomainError>> {
    try {
      if (!this.timerState) {
        throw new DomainError('No active session to complete');
      }

      this.timerState.status = 'completed';
      this.stopTimer();
      await this.callbacks.onSessionComplete?.(this.timerState.sessionId, this.timerState.elapsedSeconds);

      const completedState = { ...this.timerState };
      this.timerState = null;

      return { success: true, data: completedState };
    } catch (error) {
      const domainError = new DomainError('Failed to complete session');
      this.callbacks.onError?.(domainError);
      return { success: false, error: domainError };
    }
  }

  getCurrentState(): TimerState | null {
    return this.timerState;
  }

  isActive(): boolean {
    return this.timerState?.status === 'active';
  }

  destroy(): void {
    this.stopTimer();
    this.timerState = null;
  }

  restoreFromStorage(): Result<TimerState | null, DomainError> {
    // React Native에서는 AsyncStorage를 사용해야 하지만, 임시로 null 반환
    return { success: true, data: null };
  }

  private startTimer(): void {
    this.stopTimer();
    this.intervalId = setInterval(() => {
      if (this.timerState && this.timerState.status === 'active') {
        this.timerState.elapsedSeconds += 1;
        this.timerState.lastActivity = new Date();
      }
    }, 1000);
  }

  private stopTimer(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
}

export interface UseStudyTimerOptions {
  config?: TimerConfig;
  onAutoSave?: (elapsedSeconds: number) => Promise<void>;
  onTimerError?: (error: Error) => void;
}

export interface UseStudyTimerReturn {
  // 상태
  timerState: TimerState | null;
  isActive: boolean;
  error: DomainError | null;

  // 타이머 제어
  startTimer: (sessionId: StudySessionId) => Promise<Result<TimerState, DomainError>>;
  pauseTimer: () => Promise<Result<TimerState, DomainError>>;
  resumeTimer: () => Promise<Result<TimerState, DomainError>>;
  stopTimer: () => Promise<Result<TimerState, DomainError>>;

  // 시간 포맷팅
  formatTime: (seconds: number) => string;
}

export function useStudyTimer(options: UseStudyTimerOptions = {}): UseStudyTimerReturn {
  const [timerState, setTimerState] = useState<TimerState | null>(null);
  const [error, setError] = useState<DomainError | null>(null);
  const timerServiceRef = useRef<StudyTimeTrackerService | null>(null);

  const formatTime = useCallback((seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  // Timer callbacks
  const callbacks: TimerCallbacks = {
    onAutoSave: useCallback(async (sessionId: StudySessionId, elapsedSeconds: number) => {
      await options.onAutoSave?.(elapsedSeconds);
    }, [options.onAutoSave]),
    
    onError: useCallback((error: Error) => {
      setError(error as DomainError);
      options.onTimerError?.(error);
    }, [options.onTimerError])
  };

  // Initialize timer service
  useEffect(() => {
    timerServiceRef.current = new StudyTimeTrackerService(options.config, callbacks);

    // Try to restore previous state
    const restoreResult = timerServiceRef.current.restoreFromStorage();
    if (restoreResult.success && restoreResult.data) {
      setTimerState(restoreResult.data);
    }

    return () => {
      if (timerServiceRef.current) {
        timerServiceRef.current.destroy();
        timerServiceRef.current = null;
      }
    };
  }, []);

  // Update state when timer changes
  useEffect(() => {
    const interval = setInterval(() => {
      if (timerServiceRef.current) {
        const currentState = timerServiceRef.current.getCurrentState();
        setTimerState(currentState);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const startTimer = useCallback(async (sessionId: StudySessionId): Promise<Result<TimerState, DomainError>> => {
    if (!timerServiceRef.current) {
      const error = new DomainError('Timer service not initialized');
      setError(error);
      return { success: false, error };
    }

    setError(null);
    const result = await timerServiceRef.current.startSession(sessionId);
    if (!result.success) {
      setError(result.error);
    } else {
      setTimerState(result.data);
    }
    
    return result;
  }, []);

  const pauseTimer = useCallback(async (): Promise<Result<TimerState, DomainError>> => {
    if (!timerServiceRef.current) {
      const error = new DomainError('Timer service not initialized');
      setError(error);
      return { success: false, error };
    }

    setError(null);
    const result = await timerServiceRef.current.pauseSession();
    if (!result.success) {
      setError(result.error);
    } else {
      setTimerState(result.data);
    }
    
    return result;
  }, []);

  const resumeTimer = useCallback(async (): Promise<Result<TimerState, DomainError>> => {
    if (!timerServiceRef.current) {
      const error = new DomainError('Timer service not initialized');
      setError(error);
      return { success: false, error };
    }

    setError(null);
    const result = await timerServiceRef.current.resumeSession();
    if (!result.success) {
      setError(result.error);
    } else {
      setTimerState(result.data);
    }
    
    return result;
  }, []);

  const stopTimer = useCallback(async (): Promise<Result<TimerState, DomainError>> => {
    if (!timerServiceRef.current) {
      const error = new DomainError('Timer service not initialized');
      setError(error);
      return { success: false, error };
    }

    setError(null);
    const result = await timerServiceRef.current.completeSession();
    if (!result.success) {
      setError(result.error);
    } else {
      setTimerState(null);
    }
    
    return result;
  }, []);

  return {
    timerState,
    isActive: timerServiceRef.current?.isActive() ?? false,
    error,
    startTimer,
    pauseTimer,
    resumeTimer,
    stopTimer,
    formatTime
  };
}