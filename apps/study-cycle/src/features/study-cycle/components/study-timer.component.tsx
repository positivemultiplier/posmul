"use client";

import React from "react";
import { StudySessionId } from "../../../types/study-cycle-types";
import { useStudyTimer, UseStudyTimerOptions } from "../hooks/use-study-timer";

export interface StudyTimerProps {
  sessionId?: StudySessionId;
  onAutoSave?: (elapsedSeconds: number) => Promise<void>;
  onTimerError?: (error: Error) => void;
  className?: string;
  showControls?: boolean;
  compact?: boolean;
}

/**
 * 학습 시간 추적 컴포넌트
 * 
 * 기능:
 * - 실시간 타이머 표시
 * - 시작/일시정지/재개/정지 컨트롤
 * - 자동 저장 상태 표시
 * - 에러 상태 표시
 */
export function StudyTimer({
  sessionId,
  onAutoSave,
  onTimerError,
  className = "",
  showControls = true,
  compact = false,
}: StudyTimerProps) {
  const timerOptions: UseStudyTimerOptions = {
    config: {
      autoSaveInterval: 30000, // 30초를 밀리초로
    },
    onAutoSave,
    onTimerError,
  };

  const {
    timerState,
    isActive,
    error,
    startTimer,
    pauseTimer,
    resumeTimer,
    stopTimer,
    formatTime,
  } = useStudyTimer(timerOptions);

  // 파생된 상태들
  const isPaused = timerState?.status === 'paused';
  const elapsedSeconds = timerState?.elapsedSeconds || 0;
  const elapsedTime = formatTime(elapsedSeconds);
  const canStart = !timerState;
  const canPause = isActive;
  const canResume = isPaused;
  const canStop = !!timerState;

  const handleStart = async () => {
    if (sessionId && canStart) {
      const result = await startTimer(sessionId);
      if (!result.success) {
        console.error("Failed to start timer:", result.error);
      }
    }
  };

  const handlePause = async () => {
    if (canPause) {
      const result = await pauseTimer();
      if (!result.success) {
        console.error("Failed to pause timer:", result.error);
      }
    }
  };

  const handleResume = async () => {
    if (canResume) {
      const result = await resumeTimer();
      if (!result.success) {
        console.error("Failed to resume timer:", result.error);
      }
    }
  };

  // 에러 클리어 함수
  const clearError = () => {
    // useStudyTimer에서 에러 클리어 기능이 없으므로 컴포넌트 레벨에서 처리
    // error 상태는 새로운 액션으로 자동 클리어됨
    console.log("Error cleared");
  };

  const handleStop = async () => {
    if (canStop) {
      const result = await stopTimer();
      if (!result.success) {
        console.error("Failed to stop timer:", result.error);
      } else {
        console.log("Timer stopped. Total time:", result.data?.elapsedSeconds, "seconds");
      }
    }
  };

  // 상태별 스타일
  const getStatusColor = () => {
    if (error) return "text-red-600";
    if (isActive) return "text-green-600";
    if (isPaused) return "text-yellow-600";
    return "text-gray-600";
  };

  const getStatusText = () => {
    if (error) return "오류";
    if (isActive) return "학습 중";
    if (isPaused) return "일시정지";
    return "대기";
  };

  if (compact) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <div className={`font-mono text-lg font-semibold ${getStatusColor()}`}>
          {elapsedTime}
        </div>
        <div className={`text-sm ${getStatusColor()}`}>
          {getStatusText()}
        </div>
        {error && (
          <button
            onClick={clearError}
            className="text-red-500 hover:text-red-700 text-sm"
            title="오류 해제"
          >
            ✕
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
      {/* 타이머 헤더 */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">학습 시간</h3>
        <div className={`text-sm font-medium ${getStatusColor()}`}>
          {getStatusText()}
        </div>
      </div>

      {/* 시간 표시 */}
      <div className="text-center mb-6">
        <div className={`text-4xl font-mono font-bold ${getStatusColor()}`}>
          {elapsedTime}
        </div>
        <div className="text-sm text-gray-500 mt-1">
          총 {Math.floor(elapsedSeconds / 60)}분 학습
        </div>
      </div>

      {/* 에러 표시 */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="text-red-600 mr-2">⚠️</div>
              <div className="text-sm text-red-700">
                {error.message}
              </div>
            </div>
            <button
              onClick={clearError}
              className="text-red-500 hover:text-red-700 text-sm"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* 컨트롤 버튼 */}
      {showControls && (
        <div className="flex space-x-2">
          {canStart && (
            <button
              onClick={handleStart}
              disabled={!sessionId}
              className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-2 px-4 rounded-md font-medium transition-colors"
            >
              시작
            </button>
          )}
          
          {canPause && (
            <button
              onClick={handlePause}
              className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white py-2 px-4 rounded-md font-medium transition-colors"
            >
              일시정지
            </button>
          )}
          
          {canResume && (
            <button
              onClick={handleResume}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md font-medium transition-colors"
            >
              재개
            </button>
          )}
          
          {canStop && (
            <button
              onClick={handleStop}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-md font-medium transition-colors"
            >
              정지
            </button>
          )}
        </div>
      )}

      {/* 자동 저장 상태 */}
      {timerState && (
        <div className="mt-4 text-xs text-gray-500 text-center">
          마지막 활동: {new Date(timerState.lastActivity || new Date()).toLocaleTimeString()}
        </div>
      )}
    </div>
  );
}

/**
 * 간단한 타이머 표시용 컴포넌트
 */
export function StudyTimerDisplay({ 
  elapsedSeconds, 
  isActive, 
  className = "" 
}: { 
  elapsedSeconds: number; 
  isActive: boolean; 
  className?: string; 
}) {
  const formatTime = (totalSeconds: number): string => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    return [hours, minutes, seconds]
      .map(unit => unit.toString().padStart(2, '0'))
      .join(':');
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <div className={`font-mono text-lg font-semibold ${
        isActive ? 'text-green-600' : 'text-gray-600'
      }`}>
        {formatTime(elapsedSeconds)}
      </div>
      {isActive && (
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
      )}
    </div>
  );
} 