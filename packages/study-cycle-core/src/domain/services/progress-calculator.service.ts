import { DomainError, Result, failure, success } from "@posmul/shared-types";
import { ChapterProgress, Reading } from "../entities/reading.entity";
import { StudySession } from "../entities/study-session.entity";
import { TextbookId } from "../entities/textbook.entity";

// Progress calculation types
export interface OverallProgress {
  readonly textbookId: TextbookId;
  readonly totalReadings: number;
  readonly completedReadings: number;
  readonly currentRound: number;
  readonly overallCompletionPercentage: number;
  readonly averageReadingTime: number; // minutes per reading round
  readonly totalTimeSpent: number; // total minutes across all readings
  readonly averageDifficulty: number;
  readonly averageComprehension: number;
  readonly efficiencyScore: number; // 0-100 scale
  readonly consistencyScore: number; // 0-100 scale based on regular study patterns
}

export interface StudyPatternAnalysis {
  readonly averageSessionDuration: number;
  readonly totalSessions: number;
  readonly mostProductiveTimeOfDay?: string; // e.g., "morning", "afternoon", "evening"
  readonly averagePagesPerSession: number;
  readonly studyFrequency: number; // sessions per week
  readonly longBreakCount: number; // breaks longer than 7 days
  readonly lastStudyDate?: Date;
  readonly isOnTrack: boolean;
}

export interface ProjectedCompletion {
  readonly estimatedCompletionDate: Date;
  readonly daysRemaining: number;
  readonly requiredDailyPages: number;
  readonly requiredSessionsPerWeek: number;
  readonly confidence: number; // 0-100% confidence in projection
  readonly riskFactors: string[];
}

export interface DetailedChapterAnalysis {
  readonly chapterId: string;
  readonly title: string;
  readonly difficultyTrend: number[]; // difficulty ratings across readings
  readonly comprehensionTrend: number[]; // comprehension ratings across readings
  readonly timeSpentTrend: number[]; // time spent in minutes across readings
  readonly improvementRate: number; // percentage improvement between first and last reading
  readonly needsAttention: boolean;
  readonly recommendedActions: string[];
}

/**
 * ProgressCalculator - 진도율 계산 도메인 서비스
 *
 * 학습 진도를 다양한 관점에서 계산하고 분석하는 도메인 서비스입니다.
 * 단순한 페이지 수 계산을 넘어서 학습 패턴, 효율성, 예측 등을 제공합니다.
 *
 * 핵심 기능:
 * - 회독별 진도율 계산
 * - 학습 패턴 분석
 * - 완료 예측
 * - 개선 권장사항 제공
 */
export class ProgressCalculatorService {
  /**
   * Calculate overall progress across all readings of a textbook
   */
  public calculateOverallProgress(
    readings: Reading[],
    studySessions: StudySession[]
  ): Result<OverallProgress, DomainError> {
    if (readings.length === 0) {
      return failure(
        new DomainError("No readings provided for calculation", "NO_READINGS")
      );
    }

    // Ensure all readings are for the same textbook
    const textbookId = readings[0].textbookId;
    const invalidReadings = readings.filter((r) => r.textbookId !== textbookId);
    if (invalidReadings.length > 0) {
      return failure(
        new DomainError(
          "All readings must be for the same textbook",
          "MISMATCHED_TEXTBOOKS"
        )
      );
    }

    const completedReadings = readings.filter((r) => r.status === "completed");
    const currentRound = Math.max(...readings.map((r) => r.round));

    // Calculate total time across all readings
    const totalTimeSpent = readings.reduce(
      (sum, reading) => sum + reading.totalTimeMinutes,
      0
    );

    // Calculate average reading time for completed readings
    const averageReadingTime =
      completedReadings.length > 0
        ? completedReadings.reduce(
            (sum, reading) => sum + reading.totalTimeMinutes,
            0
          ) / completedReadings.length
        : 0;

    // Calculate overall completion percentage
    const totalExpectedReadings = currentRound;
    const overallCompletionPercentage =
      totalExpectedReadings > 0
        ? (completedReadings.length / totalExpectedReadings) * 100
        : 0;

    // Calculate average difficulty and comprehension
    const { averageDifficulty, averageComprehension } =
      this.calculateAverageRatings(readings);

    // Calculate efficiency score (pages per minute)
    const efficiencyScore = this.calculateEfficiencyScore(
      readings,
      studySessions
    );

    // Calculate consistency score based on study patterns
    const consistencyScore = this.calculateConsistencyScore(studySessions);

    return success({
      textbookId,
      totalReadings: readings.length,
      completedReadings: completedReadings.length,
      currentRound,
      overallCompletionPercentage,
      averageReadingTime,
      totalTimeSpent,
      averageDifficulty,
      averageComprehension,
      efficiencyScore,
      consistencyScore,
    });
  }

  /**
   * Analyze study patterns from sessions
   */
  public analyzeStudyPatterns(
    studySessions: StudySession[]
  ): Result<StudyPatternAnalysis, DomainError> {
    if (studySessions.length === 0) {
      return failure(
        new DomainError(
          "No study sessions provided for analysis",
          "NO_SESSIONS"
        )
      );
    }

    // Calculate basic metrics
    const totalSessions = studySessions.length;
    const completedSessions = studySessions.filter(
      (s) => s.status === "completed"
    );

    const averageSessionDuration =
      completedSessions.length > 0
        ? completedSessions.reduce(
            (sum, session) => sum + session.getSessionDurationMinutes(),
            0
          ) / completedSessions.length
        : 0;

    const totalPages = completedSessions.reduce(
      (sum, session) => sum + session.pagesCompleted,
      0
    );
    const averagePagesPerSession =
      completedSessions.length > 0 ? totalPages / completedSessions.length : 0;

    // Analyze time patterns
    const mostProductiveTimeOfDay =
      this.findMostProductiveTimeOfDay(completedSessions);

    // Calculate study frequency (sessions per week)
    const studyFrequency = this.calculateStudyFrequency(studySessions);

    // Find long breaks (> 7 days)
    const longBreakCount = this.countLongBreaks(studySessions);

    // Find last study date
    const lastStudyDate =
      studySessions.length > 0
        ? new Date(Math.max(...studySessions.map((s) => s.startTime.getTime())))
        : undefined;

    // Determine if on track (simple heuristic: studied within last 3 days)
    const isOnTrack = lastStudyDate
      ? Date.now() - lastStudyDate.getTime() < 3 * 24 * 60 * 60 * 1000
      : false;

    return success({
      averageSessionDuration,
      totalSessions,
      mostProductiveTimeOfDay,
      averagePagesPerSession,
      studyFrequency,
      longBreakCount,
      lastStudyDate,
      isOnTrack,
    });
  }

  /**
   * Project completion date and requirements
   */
  public projectCompletion(
    currentReading: Reading,
    studySessions: StudySession[],
    targetCompletionDate?: Date
  ): Result<ProjectedCompletion, DomainError> {
    const metrics = currentReading.calculateMetrics();

    if (metrics.completionPercentage >= 100) {
      return success({
        estimatedCompletionDate: new Date(),
        daysRemaining: 0,
        requiredDailyPages: 0,
        requiredSessionsPerWeek: 0,
        confidence: 100,
        riskFactors: [],
      });
    }

    // Calculate reading speed from sessions
    const recentSessions = this.getRecentSessions(studySessions, 14); // last 14 days
    const averagePagesPerDay = this.calculateAveragePagesPerDay(recentSessions);

    const remainingPages = this.calculateRemainingPages(currentReading);

    // Estimate completion date based on current pace
    const daysToComplete =
      averagePagesPerDay > 0
        ? Math.ceil(remainingPages / averagePagesPerDay)
        : Infinity;
    const estimatedCompletionDate = new Date(
      Date.now() + daysToComplete * 24 * 60 * 60 * 1000
    );

    // Calculate requirements if target date is provided
    let daysRemaining = daysToComplete;
    let requiredDailyPages = averagePagesPerDay;
    let requiredSessionsPerWeek =
      recentSessions.length > 0 ? (recentSessions.length / 2) * 7 : 7; // sessions per week

    if (targetCompletionDate) {
      daysRemaining = Math.ceil(
        (targetCompletionDate.getTime() - Date.now()) / (24 * 60 * 60 * 1000)
      );
      if (daysRemaining > 0) {
        requiredDailyPages = remainingPages / daysRemaining;
        requiredSessionsPerWeek =
          Math.ceil(
            requiredDailyPages /
              (averagePagesPerDay > 0 ? averagePagesPerDay : 5)
          ) * 7;
      }
    }

    // Calculate confidence and risk factors
    const { confidence, riskFactors } = this.assessProjectionConfidence(
      currentReading,
      studySessions,
      averagePagesPerDay,
      daysRemaining
    );

    return success({
      estimatedCompletionDate,
      daysRemaining: Math.max(0, daysRemaining),
      requiredDailyPages: Math.max(0, requiredDailyPages),
      requiredSessionsPerWeek: Math.max(0, requiredSessionsPerWeek),
      confidence,
      riskFactors,
    });
  }

  /**
   * Analyze individual chapter performance across readings
   */
  public analyzeChapterDetails(
    readings: Reading[],
    chapterId: string
  ): Result<DetailedChapterAnalysis, DomainError> {
    const chapterData = readings
      .map((reading) =>
        reading.chaptersProgress.find((ch) => ch.chapterId === chapterId)
      )
      .filter((ch) => ch !== undefined) as ChapterProgress[];

    if (chapterData.length === 0) {
      return failure(
        new DomainError(
          `Chapter ${chapterId} not found in any readings`,
          "CHAPTER_NOT_FOUND"
        )
      );
    }

    const title = chapterData[0].chapterTitle;

    // Extract trends
    const difficultyTrend = chapterData
      .map((ch) => ch.difficultyRating || 0)
      .filter((rating) => rating > 0);

    const comprehensionTrend = chapterData
      .map((ch) => ch.comprehensionRating || 0)
      .filter((rating) => rating > 0);

    // For time trend, we'd need session data - simplified here
    const timeSpentTrend = readings.map((reading, index) => {
      // Rough estimate based on reading metrics
      const metrics = reading.calculateMetrics();
      const chapterProgress = reading.chaptersProgress.find(
        (ch) => ch.chapterId === chapterId
      );
      return chapterProgress
        ? metrics.averagePageTime * chapterProgress.completedPages
        : 0;
    });

    // Calculate improvement rate
    const improvementRate = this.calculateImprovementRate(
      comprehensionTrend,
      difficultyTrend
    );

    // Determine if needs attention
    const needsAttention = this.chapterNeedsAttention(
      chapterData[chapterData.length - 1]
    );

    // Generate recommendations
    const recommendedActions = this.generateChapterRecommendations(
      chapterData[chapterData.length - 1],
      improvementRate
    );

    return success({
      chapterId,
      title,
      difficultyTrend,
      comprehensionTrend,
      timeSpentTrend,
      improvementRate,
      needsAttention,
      recommendedActions,
    });
  }

  // Private helper methods

  private calculateAverageRatings(readings: Reading[]): {
    averageDifficulty: number;
    averageComprehension: number;
  } {
    const allMetrics = readings.map((r) => r.calculateMetrics());
    const validMetrics = allMetrics.filter(
      (m) => m.averageDifficulty > 0 && m.averageComprehension > 0
    );

    if (validMetrics.length === 0) {
      return { averageDifficulty: 0, averageComprehension: 0 };
    }

    const averageDifficulty =
      validMetrics.reduce((sum, m) => sum + m.averageDifficulty, 0) /
      validMetrics.length;
    const averageComprehension =
      validMetrics.reduce((sum, m) => sum + m.averageComprehension, 0) /
      validMetrics.length;

    return { averageDifficulty, averageComprehension };
  }

  private calculateEfficiencyScore(
    readings: Reading[],
    studySessions: StudySession[]
  ): number {
    if (readings.length === 0 || studySessions.length === 0) return 0;

    const totalPages = readings.reduce((sum, r) => sum + r.totalPagesRead, 0);
    const totalTime = readings.reduce((sum, r) => sum + r.totalTimeMinutes, 0);

    if (totalTime === 0) return 0;

    const pagesPerMinute = totalPages / totalTime;
    // Normalize to 0-100 scale (assuming 0.5 pages/minute is excellent)
    return Math.min(100, (pagesPerMinute / 0.5) * 100);
  }

  private calculateConsistencyScore(studySessions: StudySession[]): number {
    if (studySessions.length < 7) return 0; // Need at least a week of data

    const sortedSessions = studySessions
      .filter((s) => s.status === "completed")
      .sort((a, b) => a.startTime.getTime() - b.startTime.getTime());

    if (sortedSessions.length < 3) return 0;

    // Calculate gaps between sessions
    const gaps = [];
    for (let i = 1; i < sortedSessions.length; i++) {
      const gapDays =
        (sortedSessions[i].startTime.getTime() -
          sortedSessions[i - 1].startTime.getTime()) /
        (24 * 60 * 60 * 1000);
      gaps.push(gapDays);
    }

    // Calculate consistency based on gap variance
    const averageGap = gaps.reduce((sum, gap) => sum + gap, 0) / gaps.length;
    const variance =
      gaps.reduce((sum, gap) => sum + Math.pow(gap - averageGap, 2), 0) /
      gaps.length;
    const stdDev = Math.sqrt(variance);

    // Lower standard deviation = higher consistency
    // Normalize to 0-100 scale
    const consistency = Math.max(0, 100 - stdDev * 10);
    return Math.min(100, consistency);
  }

  private findMostProductiveTimeOfDay(
    sessions: StudySession[]
  ): string | undefined {
    if (sessions.length === 0) return undefined;

    const timeSlots = { morning: 0, afternoon: 0, evening: 0 };

    sessions.forEach((session) => {
      const hour = session.startTime.getHours();
      if (hour >= 6 && hour < 12) {
        timeSlots.morning += session.pagesCompleted;
      } else if (hour >= 12 && hour < 18) {
        timeSlots.afternoon += session.pagesCompleted;
      } else {
        timeSlots.evening += session.pagesCompleted;
      }
    });

    const maxSlot = Object.entries(timeSlots).reduce(
      (max, [slot, pages]) => (pages > max.pages ? { slot, pages } : max),
      { slot: "", pages: -1 }
    );

    return maxSlot.pages > 0 ? maxSlot.slot : undefined;
  }

  private calculateStudyFrequency(sessions: StudySession[]): number {
    if (sessions.length < 2) return 0;

    const sortedSessions = sessions.sort(
      (a, b) => a.startTime.getTime() - b.startTime.getTime()
    );
    const firstSession = sortedSessions[0];
    const lastSession = sortedSessions[sortedSessions.length - 1];

    const totalWeeks =
      (lastSession.startTime.getTime() - firstSession.startTime.getTime()) /
      (7 * 24 * 60 * 60 * 1000);

    return totalWeeks > 0 ? sessions.length / totalWeeks : 0;
  }

  private countLongBreaks(sessions: StudySession[]): number {
    if (sessions.length < 2) return 0;

    const sortedSessions = sessions.sort(
      (a, b) => a.startTime.getTime() - b.startTime.getTime()
    );
    let longBreaks = 0;

    for (let i = 1; i < sortedSessions.length; i++) {
      const gapDays =
        (sortedSessions[i].startTime.getTime() -
          sortedSessions[i - 1].startTime.getTime()) /
        (24 * 60 * 60 * 1000);
      if (gapDays > 7) {
        longBreaks++;
      }
    }

    return longBreaks;
  }

  private getRecentSessions(
    sessions: StudySession[],
    days: number
  ): StudySession[] {
    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    return sessions.filter((session) => session.startTime >= cutoffDate);
  }

  private calculateAveragePagesPerDay(sessions: StudySession[]): number {
    if (sessions.length === 0) return 0;

    const totalPages = sessions.reduce(
      (sum, session) => sum + session.pagesCompleted,
      0
    );
    const daysCovered = sessions.length; // Simplified - assuming one session per day

    return daysCovered > 0 ? totalPages / daysCovered : 0;
  }

  private calculateRemainingPages(reading: Reading): number {
    const totalPages = reading.chaptersProgress.reduce(
      (sum, ch) => sum + ch.totalPages,
      0
    );
    const completedPages = reading.chaptersProgress.reduce(
      (sum, ch) => sum + ch.completedPages,
      0
    );
    return Math.max(0, totalPages - completedPages);
  }

  private assessProjectionConfidence(
    reading: Reading,
    sessions: StudySession[],
    averagePagesPerDay: number,
    daysRemaining: number
  ): { confidence: number; riskFactors: string[] } {
    const riskFactors: string[] = [];
    let confidence = 100;

    // Check consistency of study sessions
    if (sessions.length < 7) {
      riskFactors.push("Limited study history");
      confidence -= 20;
    }

    // Check if current pace is sustainable
    if (averagePagesPerDay < 1) {
      riskFactors.push("Very slow reading pace");
      confidence -= 30;
    }

    // Check for difficult chapters ahead
    const difficultChapters = reading.getChaptersNeedingAttention();
    if (difficultChapters.length > 0) {
      riskFactors.push(
        `${difficultChapters.length} challenging chapters remaining`
      );
      confidence -= 15;
    }

    // Check if reader is on track with targets
    if (!reading.isOnTrack()) {
      riskFactors.push("Currently behind target schedule");
      confidence -= 25;
    }

    return { confidence: Math.max(0, confidence), riskFactors };
  }

  private calculateImprovementRate(
    comprehensionTrend: number[],
    difficultyTrend: number[]
  ): number {
    if (comprehensionTrend.length < 2) return 0;

    const firstComprehension = comprehensionTrend[0];
    const lastComprehension = comprehensionTrend[comprehensionTrend.length - 1];

    return lastComprehension > 0
      ? ((lastComprehension - firstComprehension) / firstComprehension) * 100
      : 0;
  }

  private chapterNeedsAttention(chapter: ChapterProgress): boolean {
    return (
      !chapter.isCompleted &&
      ((chapter.comprehensionRating !== undefined &&
        chapter.comprehensionRating < 6) ||
        (chapter.difficultyRating !== undefined &&
          chapter.difficultyRating >= 4))
    );
  }

  private generateChapterRecommendations(
    chapter: ChapterProgress,
    improvementRate: number
  ): string[] {
    const recommendations: string[] = [];

    if (!chapter.isCompleted) {
      recommendations.push("Complete this chapter to improve overall progress");
    }

    if (chapter.comprehensionRating && chapter.comprehensionRating < 6) {
      recommendations.push(
        "Review chapter content - comprehension is below target"
      );
      recommendations.push(
        "Consider taking additional notes or seeking explanations"
      );
    }

    if (chapter.difficultyRating && chapter.difficultyRating >= 4) {
      recommendations.push("Allocate extra time for this challenging chapter");
      recommendations.push("Break chapter into smaller study sessions");
    }

    if (improvementRate < 0) {
      recommendations.push(
        "Schedule review session - understanding appears to be declining"
      );
    }

    if (recommendations.length === 0) {
      recommendations.push("Good progress - continue current study approach");
    }

    return recommendations;
  }
}
