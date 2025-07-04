"use client";

import React, { useEffect, useState } from "react";
import { View, Text, ActivityIndicator, StyleSheet } from "react-native";
import { UserId, StudySessionSummary } from "@posmul/study-cycle-core";
import { TextbookId } from "@posmul/study-cycle-core";
import { StudyTimer } from "./study-timer.component";
import { useStudyLogData } from "../hooks/use-study-log-data";

export interface StudyLogDashboardProps {
  userId: UserId;
  currentTextbookId?: TextbookId;
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
  currentTextbookId
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
      <View style={[styles.loadingContainer, { padding: 32 }]}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.errorContainer, { padding: 16 }]}> 
        <View style={styles.errorRow}>
          <View style={styles.errorIcon}><Text>⚠️</Text></View>
          <View style={styles.errorText}><Text>학습 기록을 불러오는 중 오류가 발생했습니다: {error.message}</Text></View>
        </View>
        <View style={styles.retryButton}>
          <Text onPress={refreshData} style={styles.retryText}>다시 시도</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 헤더 */}
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>학습 대시보드</Text>
        <Text onPress={refreshData} style={styles.refreshButton}>🔄 새로고침</Text>
      </View>

      {/* 학습 통계 카드 */}
      <View style={styles.statsRow}>
        <View style={styles.card}><Text style={styles.cardValue}>{Math.floor(totalStudyTime / 60)}h {totalStudyTime % 60}m</Text><Text style={styles.cardLabel}>총 학습 시간</Text></View>
        <View style={styles.card}><Text style={styles.cardValue}>{studyStreak}</Text><Text style={styles.cardLabel}>연속 학습 일수</Text></View>
        <View style={styles.card}><Text style={styles.cardValue}>{Math.round(averageSessionTime)}m</Text><Text style={styles.cardLabel}>평균 세션 시간</Text></View>
        <View style={styles.card}><Text style={styles.cardValue}>{studyHistory?.length || 0}</Text><Text style={styles.cardLabel}>완료된 세션</Text></View>
      </View>

      {/* 현재 학습 세션 타이머 */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>현재 학습 세션</Text>
        <StudyTimer
          onAutoSave={handleTimerAutoSave}
          onTimerError={handleTimerError}
          showControls={true}
          compact={false}
        />
      </View>

      {/* 진도 현황 */}
      {readingProgress && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>진도 현황</Text>
          <View style={styles.progressRow}>
            <Text>전체 진도율</Text>
            <Text style={styles.bold}>{Math.round(readingProgress.completionPercentage)}%</Text>
          </View>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${readingProgress.completionPercentage}%` }]} />
          </View>
          <View style={styles.progressStatsRow}>
            <Text>읽은 페이지: {readingProgress.totalPagesRead}페이지</Text>
            <Text>평균 이해도: {readingProgress.averageComprehension.toFixed(1)}/5.0</Text>
          </View>
          <Text>총 학습 시간: {Math.floor(readingProgress.totalTimeMinutes / 60)}시간 {readingProgress.totalTimeMinutes % 60}분</Text>
        </View>
      )}

      {/* 최근 학습 세션 */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>최근 학습 세션</Text>
        {studyHistory && studyHistory.length > 0 ? (
          studyHistory.slice(0, 5).map((session) => (
            <View key={session.sessionId} style={styles.sessionRow}>
              <View>
                <Text style={styles.sessionChapter}>{session.chapterId ? `챕터 ${session.chapterId}` : "전체 교재"}</Text>
                <Text style={styles.sessionMeta}>{new Date(session.completedAt).toLocaleDateString('ko-KR')} • {session.totalTimeMinutes}분 학습</Text>
              </View>
              <View style={styles.sessionStats}>
                <Text>페이지: {session.pagesCompleted}</Text>
                <Text>이해도: {session.averageComprehension}/5</Text>
              </View>
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>아직 완료된 학습 세션이 없습니다.\n첫 번째 학습을 시작해보세요!</Text>
        )}
      </View>

      {/* 학습 패턴 분석 */}
      {studyHistory && studyHistory.length >= 3 && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>학습 패턴 분석</Text>
          <View style={styles.patternRow}>
            <View style={styles.patternCol}>
              <Text>선호 학습 시간대</Text>
              <Text>{getMostActiveTimeRange(studyHistory)}</Text>
            </View>
            <View style={styles.patternCol}>
              <Text>평균 집중도</Text>
              <Text>이해도 평균: {getAverageComprehension(studyHistory).toFixed(1)}/5.0</Text>
            </View>
          </View>
        </View>
      )}
    </View>
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

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorContainer: { backgroundColor: '#fee2e2', borderColor: '#fecaca', borderWidth: 1, borderRadius: 8 },
  errorRow: { flexDirection: 'row', alignItems: 'center' },
  errorIcon: { marginRight: 8 },
  errorText: { flex: 1, color: '#b91c1c' },
  retryButton: { marginTop: 8 },
  retryText: { color: '#b91c1c', textDecorationLine: 'underline' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#1e293b' },
  refreshButton: { color: '#2563eb', fontWeight: 'bold' },
  statsRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 16 },
  card: { backgroundColor: '#fff', borderRadius: 8, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  cardValue: { fontSize: 28, fontWeight: 'bold', textAlign: 'center' },
  cardLabel: { fontSize: 14, color: '#64748b', textAlign: 'center', marginTop: 4 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#1e293b', marginBottom: 8 },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  bold: { fontWeight: 'bold' },
  progressBarBg: { width: '100%', height: 8, backgroundColor: '#e5e7eb', borderRadius: 4, marginBottom: 8 },
  progressBarFill: { height: 8, backgroundColor: '#2563eb', borderRadius: 4 },
  progressStatsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  sessionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f1f5f9', borderRadius: 8, padding: 12, marginBottom: 6 },
  sessionChapter: { fontWeight: 'bold', color: '#334155' },
  sessionMeta: { fontSize: 12, color: '#64748b' },
  sessionStats: { alignItems: 'flex-end' },
  emptyText: { textAlign: 'center', color: '#64748b', marginTop: 24 },
  patternRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  patternCol: { flex: 1, marginRight: 8 },
}); 