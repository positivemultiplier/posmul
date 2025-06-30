"use client";

import React, { useEffect, useState } from "react";
import { UserId, StudySessionSummary } from "../../domain/entities/study-session.entity";
import { TextbookId } from "../../domain/entities/textbook.entity";
import { ReadingMetrics } from "../../domain/entities/reading.entity";
import { Card } from "@posmul/shared-ui/components";
import { LoadingSpinner } from "@posmul/shared-ui/components";
import { StudyTimer } from "./study-timer.component";
import { useStudyLogData } from "../hooks/use-study-log-data";

export interface StudyLogDashboardProps {
  userId: UserId;
  currentTextbookId?: TextbookId;
  className?: string;
}

/**
 * StudyLog Dashboard 컴포넌트
 * 
 * 기능:
 * - 학습 통계 요약 표시
 * - 최근 학습 세션 목록
 * - 현재 진도 상황
 * - 실시간 타이머 통합
 * - 학습 패턴 분석
 */
export function StudyLogDashboard({
  userId,
  currentTextbookId,
  className = "",
}: StudyLogDashboardProps) {
  const {
    studyHistory,
    readingProgress,
    isLoading,
    error,
    refreshData,
  } = useStudyLogData({ userId, textbookId: currentTextbookId });

  const [totalStudyTime, setTotalStudyTime] = useState(0);
  const [studyStreak, setStudyStreak] = useState(0);
  const [averageSessionTime, setAverageSessionTime] = useState(0);

  // 학습 통계 계산
  useEffect(() => {
    if (studyHistory && studyHistory.length > 0) {
      // 총 학습 시간 계산
      const total = studyHistory.reduce((sum: number, session: StudySessionSummary) => sum + session.totalTimeMinutes, 0);
      setTotalStudyTime(total);

      // 평균 세션 시간 계산
      const average = total / studyHistory.length;
      setAverageSessionTime(average);

      // 연속 학습 일수 계산 (간단한 구현)
      const today = new Date();
      let streak = 0;
      for (let i = 0; i < studyHistory.length; i++) {
        const sessionDate = new Date(studyHistory[i].completedAt);
        const diffDays = Math.floor((today.getTime() - sessionDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (diffDays === i) {
          streak++;
        } else {
          break;
        }
      }
      setStudyStreak(streak);
    }
  }, [studyHistory]);

  const handleTimerAutoSave = async (elapsedSeconds: number) => {
    // 타이머 자동 저장 로직
    console.log("Auto saving timer data:", elapsedSeconds);
  };

  const handleTimerError = (error: Error) => {
    console.error("Timer error:", error);
  };

  if (isLoading) {
    return (
      <div className={`flex justify-center items-center p-8 ${className}`}>
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-center">
          <div className="text-red-600 mr-2">⚠️</div>
          <div className="text-red-700">
            학습 기록을 불러오는 중 오류가 발생했습니다: {error.message}
          </div>
        </div>
        <button
          onClick={refreshData}
          className="mt-2 text-red-600 hover:text-red-800 underline"
        >
          다시 시도
        </button>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 헤더 */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">학습 대시보드</h2>
        <button
          onClick={refreshData}
          className="text-blue-600 hover:text-blue-800 flex items-center space-x-1"
        >
          <span>🔄</span>
          <span>새로고침</span>
        </button>
      </div>

      {/* 학습 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600">
              {Math.floor(totalStudyTime / 60)}h {totalStudyTime % 60}m
            </div>
            <div className="text-sm text-gray-600 mt-1">총 학습 시간</div>
          </div>
        </Card>

        <Card>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">{studyStreak}</div>
            <div className="text-sm text-gray-600 mt-1">연속 학습 일수</div>
          </div>
        </Card>

        <Card>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600">
              {Math.round(averageSessionTime)}m
            </div>
            <div className="text-sm text-gray-600 mt-1">평균 세션 시간</div>
          </div>
        </Card>

        <Card>
          <div className="text-center">
            <div className="text-3xl font-bold text-orange-600">
              {studyHistory?.length || 0}
            </div>
            <div className="text-sm text-gray-600 mt-1">완료된 세션</div>
          </div>
        </Card>
      </div>

      {/* 현재 학습 세션 타이머 */}
      <Card>
        <h3 className="text-lg font-semibold text-gray-800 mb-4">현재 학습 세션</h3>
        <StudyTimer
          onAutoSave={handleTimerAutoSave}
          onTimerError={handleTimerError}
          showControls={true}
          compact={false}
        />
      </Card>

      {/* 진도 현황 */}
      {readingProgress && (
        <Card>
          <h3 className="text-lg font-semibold text-gray-800 mb-4">진도 현황</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">전체 진도율</span>
              <span className="font-semibold">
                {Math.round(readingProgress.completionPercentage)}%
              </span>
            </div>
            
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${readingProgress.completionPercentage}%` }}
              />
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">읽은 페이지:</span>
                <span className="ml-1 font-medium">
                  {readingProgress.totalPagesRead}페이지
                </span>
              </div>
              <div>
                <span className="text-gray-600">평균 이해도:</span>
                <span className="ml-1 font-medium">{readingProgress.averageComprehension.toFixed(1)}/5.0</span>
              </div>
            </div>

            <div className="text-sm text-gray-600">
              총 학습 시간: {Math.floor(readingProgress.totalTimeMinutes / 60)}시간 {readingProgress.totalTimeMinutes % 60}분
            </div>
          </div>
        </Card>
      )}

      {/* 최근 학습 세션 */}
      <Card>
        <h3 className="text-lg font-semibold text-gray-800 mb-4">최근 학습 세션</h3>
        {studyHistory && studyHistory.length > 0 ? (
          <div className="space-y-3">
            {studyHistory.slice(0, 5).map((session) => (
              <div
                key={session.sessionId}
                className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
              >
                <div>
                  <div className="font-medium text-gray-800">
                    {session.chapterId ? `챕터 ${session.chapterId}` : "전체 교재"}
                  </div>
                  <div className="text-sm text-gray-600">
                    {new Date(session.completedAt).toLocaleDateString('ko-KR')} • 
                    {session.totalTimeMinutes}분 학습
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-600">
                    페이지: {session.pagesCompleted}
                  </div>
                  <div className="text-sm text-gray-600">
                    이해도: {session.averageComprehension}/5
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            아직 완료된 학습 세션이 없습니다.
            <br />
            첫 번째 학습을 시작해보세요!
          </div>
        )}
      </Card>

      {/* 학습 패턴 분석 */}
      {studyHistory && studyHistory.length >= 3 && (
        <Card>
          <h3 className="text-lg font-semibold text-gray-800 mb-4">학습 패턴 분석</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-gray-700 mb-2">선호 학습 시간대</h4>
              <div className="text-sm text-gray-600">
                {getMostActiveTimeRange(studyHistory)}
              </div>
            </div>
            <div>
              <h4 className="font-medium text-gray-700 mb-2">평균 집중도</h4>
              <div className="text-sm text-gray-600">
                이해도 평균: {getAverageComprehension(studyHistory).toFixed(1)}/5.0
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

// 유틸리티 함수들
function getMostActiveTimeRange(sessions: StudySessionSummary[]): string {
  const timeRanges = sessions.map((session: StudySessionSummary) => {
    const hour = new Date(session.startedAt).getHours();
    if (hour >= 6 && hour < 12) return "오전";
    if (hour >= 12 && hour < 18) return "오후";
    if (hour >= 18 && hour < 22) return "저녁";
    return "야간";
  });

  const counts = timeRanges.reduce((acc, range) => {
    acc[range] = (acc[range] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const mostActive = Object.entries(counts).sort(([,a], [,b]) => b - a)[0];
  return mostActive ? `${mostActive[0]} (${mostActive[1]}회)` : "데이터 부족";
}

function getAverageComprehension(sessions: StudySessionSummary[]): number {
  const total = sessions.reduce((sum: number, session: StudySessionSummary) => sum + session.averageComprehension, 0);
  return total / sessions.length;
} 