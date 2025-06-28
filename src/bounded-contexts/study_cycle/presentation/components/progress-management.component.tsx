"use client";

import React, { useState, useEffect } from "react";
import { UserId } from "../../domain/entities/study-session.entity";
import { TextbookId } from "../../domain/entities/textbook.entity";
import { ReadingMetrics, ChapterProgress } from "../../domain/entities/reading.entity";
import { Card } from "@/shared/components";
import { LoadingSpinner } from "@/shared/components";

export interface ProgressManagementProps {
  userId: UserId;
  textbookId?: TextbookId;
  className?: string;
}

interface TextbookProgress {
  textbookId: TextbookId;
  title: string;
  metrics: ReadingMetrics;
  chaptersProgress: ChapterProgress[];
}

/**
 * Progress Management 컴포넌트
 * 
 * 기능:
 * - 교재별 진도 현황 표시
 * - 챕터별 상세 진도 관리
 * - 학습 목표 설정 및 추적
 * - 진도 시각화 차트
 * - 성과 분석 및 피드백
 */
export function ProgressManagement({
  userId,
  textbookId,
  className = "",
}: ProgressManagementProps) {
  const [textbookProgress, setTextbookProgress] = useState<TextbookProgress[]>([]);
  const [selectedTextbook, setSelectedTextbook] = useState<TextbookId | null>(textbookId || null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Mock 데이터 로드
  useEffect(() => {
    const loadProgressData = async () => {
      setIsLoading(true);
      try {
        // Mock 데이터 (실제 구현에서는 Use Case 사용)
        const mockProgress: TextbookProgress[] = [
          {
            textbookId: "textbook-1" as TextbookId,
            title: "알고리즘 문제해결 전략",
            metrics: {
              totalTimeMinutes: 1200, // 20시간
              averagePageTime: 4.2,
              totalPagesRead: 285,
              averageDifficulty: 3.8,
              averageComprehension: 4.1,
              studySessionsCount: 15,
              completionPercentage: 47.5,
            },
            chaptersProgress: [
              {
                chapterId: "ch1",
                chapterTitle: "문제 해결과 프로그래밍",
                totalPages: 25,
                completedPages: 25,
                isCompleted: true,
                lastReadAt: new Date(Date.now() - 86400000 * 3),
                difficultyRating: 2,
                comprehensionRating: 4.5,
                notes: "기본 개념 정리 완료",
              },
              {
                chapterId: "ch2",
                chapterTitle: "알고리즘 분석",
                totalPages: 35,
                completedPages: 28,
                isCompleted: false,
                lastReadAt: new Date(Date.now() - 86400000),
                difficultyRating: 4,
                comprehensionRating: 3.8,
                notes: "시간복잡도 부분 복습 필요",
              },
              {
                chapterId: "ch3",
                chapterTitle: "동적 계획법",
                totalPages: 45,
                completedPages: 12,
                isCompleted: false,
                lastReadAt: new Date(Date.now() - 86400000 * 2),
                difficultyRating: 5,
                comprehensionRating: 3.2,
                notes: "어려운 부분, 천천히 진행 중",
              },
            ],
          },
          {
            textbookId: "textbook-2" as TextbookId,
            title: "Clean Code",
            metrics: {
              totalTimeMinutes: 800, // 13.3시간
              averagePageTime: 3.1,
              totalPagesRead: 258,
              averageDifficulty: 2.9,
              averageComprehension: 4.4,
              studySessionsCount: 12,
              completionPercentage: 64.5,
            },
            chaptersProgress: [
              {
                chapterId: "ch1",
                chapterTitle: "깨끗한 코드",
                totalPages: 20,
                completedPages: 20,
                isCompleted: true,
                lastReadAt: new Date(Date.now() - 86400000 * 7),
                difficultyRating: 2,
                comprehensionRating: 4.8,
              },
              {
                chapterId: "ch2",
                chapterTitle: "의미 있는 이름",
                totalPages: 18,
                completedPages: 18,
                isCompleted: true,
                lastReadAt: new Date(Date.now() - 86400000 * 5),
                difficultyRating: 2,
                comprehensionRating: 4.5,
              },
            ],
          },
        ];

        setTextbookProgress(mockProgress);
        if (!selectedTextbook && mockProgress.length > 0) {
          setSelectedTextbook(mockProgress[0].textbookId);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load progress data");
      } finally {
        setIsLoading(false);
      }
    };

    loadProgressData();
  }, [userId, selectedTextbook]);

  const currentTextbook = textbookProgress.find(tp => tp.textbookId === selectedTextbook);

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
        <div className="text-red-700">진도 데이터를 불러오는 중 오류가 발생했습니다: {error}</div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 헤더 */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">진도 관리</h2>
        <div className="flex space-x-2">
          <select
            value={selectedTextbook || ""}
            onChange={(e) => setSelectedTextbook(e.target.value as TextbookId)}
            className="border border-gray-300 rounded-md px-3 py-2 bg-white"
          >
            <option value="">교재 선택</option>
            {textbookProgress.map((tp) => (
              <option key={tp.textbookId} value={tp.textbookId}>
                {tp.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 교재별 진도 요약 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {textbookProgress.map((tp) => (
          <Card
            key={tp.textbookId}
            className={`cursor-pointer transition-all ${
              selectedTextbook === tp.textbookId
                ? "ring-2 ring-blue-500 shadow-lg"
                : "hover:shadow-md"
            }`}
            onClick={() => setSelectedTextbook(tp.textbookId)}
          >
            <h3 className="font-semibold text-gray-800 mb-2">{tp.title}</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">진도율</span>
                <span className="font-medium">
                  {Math.round(tp.metrics.completionPercentage)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{ width: `${tp.metrics.completionPercentage}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span>{tp.metrics.totalPagesRead}페이지</span>
                <span>{Math.floor(tp.metrics.totalTimeMinutes / 60)}시간</span>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* 선택된 교재의 상세 진도 */}
      {currentTextbook && (
        <>
          {/* 전체 통계 */}
          <Card>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              {currentTextbook.title} - 학습 통계
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {Math.round(currentTextbook.metrics.completionPercentage)}%
                </div>
                <div className="text-sm text-gray-600">완료율</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {currentTextbook.metrics.totalPagesRead}
                </div>
                <div className="text-sm text-gray-600">읽은 페이지</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {Math.floor(currentTextbook.metrics.totalTimeMinutes / 60)}h
                </div>
                <div className="text-sm text-gray-600">총 학습 시간</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {currentTextbook.metrics.averageComprehension.toFixed(1)}
                </div>
                <div className="text-sm text-gray-600">평균 이해도</div>
              </div>
            </div>
          </Card>

          {/* 챕터별 진도 */}
          <Card>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">챕터별 진도</h3>
            <div className="space-y-4">
              {currentTextbook.chaptersProgress.map((chapter) => (
                <div
                  key={chapter.chapterId}
                  className="border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-medium text-gray-800">
                        {chapter.chapterTitle}
                      </h4>
                      <div className="text-sm text-gray-600">
                        {chapter.completedPages} / {chapter.totalPages} 페이지
                        {chapter.lastReadAt && (
                          <span className="ml-2">
                            • 마지막 학습: {chapter.lastReadAt.toLocaleDateString('ko-KR')}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      {chapter.isCompleted ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          완료
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          진행중
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 진도바 */}
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        chapter.isCompleted ? "bg-green-600" : "bg-blue-600"
                      }`}
                      style={{
                        width: `${(chapter.completedPages / chapter.totalPages) * 100}%`,
                      }}
                    />
                  </div>

                  {/* 상세 정보 */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                    {chapter.difficultyRating && (
                      <div>
                        <span className="text-gray-600">난이도:</span>
                        <span className="ml-1 font-medium">
                          {chapter.difficultyRating}/5
                        </span>
                      </div>
                    )}
                    {chapter.comprehensionRating && (
                      <div>
                        <span className="text-gray-600">이해도:</span>
                        <span className="ml-1 font-medium">
                          {chapter.comprehensionRating}/5
                        </span>
                      </div>
                    )}
                    <div>
                      <span className="text-gray-600">진행률:</span>
                      <span className="ml-1 font-medium">
                        {Math.round((chapter.completedPages / chapter.totalPages) * 100)}%
                      </span>
                    </div>
                  </div>

                  {/* 노트 */}
                  {chapter.notes && (
                    <div className="mt-3 p-2 bg-gray-50 rounded text-sm">
                      <span className="text-gray-600">메모:</span>
                      <span className="ml-1">{chapter.notes}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>

          {/* 학습 패턴 분석 */}
          <Card>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">학습 패턴 분석</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-700 mb-2">페이지당 평균 시간</h4>
                <div className="text-2xl font-bold text-blue-600">
                  {currentTextbook.metrics.averagePageTime.toFixed(1)}분
                </div>
                <div className="text-sm text-gray-600">
                  총 {currentTextbook.metrics.studySessionsCount}회 세션
                </div>
              </div>
              <div>
                <h4 className="font-medium text-gray-700 mb-2">평균 난이도</h4>
                <div className="text-2xl font-bold text-orange-600">
                  {currentTextbook.metrics.averageDifficulty.toFixed(1)}/5.0
                </div>
                <div className="text-sm text-gray-600">
                  전체 챕터 기준
                </div>
              </div>
            </div>
          </Card>
        </>
      )}

      {/* 빈 상태 */}
      {textbookProgress.length === 0 && (
        <Card>
          <div className="text-center py-8 text-gray-500">
            아직 학습 중인 교재가 없습니다.
            <br />
            새로운 교재를 추가하고 학습을 시작해보세요!
          </div>
        </Card>
      )}
    </div>
  );
} 