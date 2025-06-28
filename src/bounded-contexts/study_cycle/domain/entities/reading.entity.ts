import { Result, success, failure } from "../../../../shared/types";
import { DomainError } from "../../../../shared/errors";
import { BaseEntity } from "../../../../shared/domain/base-entity";
import { TextbookId } from "./textbook.entity";
import { StudySessionId, UserId } from "./study-session.entity";
import { Tables, TablesInsert, TablesUpdate } from "../../types/supabase-study_cycle";

// Branded types for type safety
export type ReadingId = string & { readonly __brand: 'ReadingId' };
export type ReadingRound = number & { readonly __brand: 'ReadingRound' };

// Reading status enum
export enum ReadingStatus {
  NOT_STARTED = 'not_started',
  IN_PROGRESS = 'in_progress', 
  COMPLETED = 'completed',
  PAUSED = 'paused',
  ABANDONED = 'abandoned'
}

// Reading difficulty level
export enum ReadingDifficulty {
  EASY = 1,
  MEDIUM = 2,
  HARD = 3,
  VERY_HARD = 4,
  EXPERT = 5
}

// Chapter progress value object
export interface ChapterProgress {
  readonly chapterId: string;
  readonly chapterTitle: string;
  readonly totalPages: number;
  readonly completedPages: number;
  readonly lastReadAt?: Date;
  readonly isCompleted: boolean;
  readonly difficultyRating?: ReadingDifficulty;
  readonly comprehensionRating?: number; // 1-10 scale
  readonly notes?: string;
}

// Reading metrics value object
export interface ReadingMetrics {
  readonly totalTimeMinutes: number;
  readonly averagePageTime: number; // minutes per page
  readonly totalPagesRead: number;
  readonly averageDifficulty: number;
  readonly averageComprehension: number;
  readonly studySessionsCount: number;
  readonly completionPercentage: number;
}

// Reading targets configuration
export interface ReadingTargets {
  readonly dailyPagesTarget?: number;
  readonly weeklyHoursTarget?: number;
  readonly completionDeadline?: Date;
  readonly rounds: ReadingRound; // How many times to read this textbook
}

// Create functions for branded types  
export const createReadingId = (id: string): ReadingId => id as ReadingId;
export const createReadingRound = (round: number): ReadingRound => {
  if (round < 1 || round > 10) {
    throw new DomainError("Reading round must be between 1 and 10", "INVALID_READING_ROUND");
  }
  return round as ReadingRound;
};

// Map Supabase table type to domain properties
type ReadingRow = Tables<{ schema: "study_cycle" }, "sc_readings">;
type ReadingInsert = TablesInsert<{ schema: "study_cycle" }, "sc_readings">;
type ReadingUpdate = TablesUpdate<{ schema: "study_cycle" }, "sc_readings">;

export interface IReadingProps {
  id: ReadingId;
  userId: UserId;
  textbookId: TextbookId;
  round: ReadingRound;
  status: ReadingStatus;
  startedAt?: Date;
  completedAt?: Date;
  lastAccessedAt?: Date;
  targets: ReadingTargets;
  chaptersProgress: ChapterProgress[];
  studySessionIds: StudySessionId[];
  totalTimeMinutes: number;
  totalPagesRead: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Reading Aggregate - 회독 관리 집계근
 * 
 * 교재의 회독(Reading Round) 관리를 담당하는 집계근입니다.
 * 여러번 읽는 것을 추적하고, 각 회독별 진도와 성과를 관리합니다.
 * 
 * 비즈니스 규칙:
 * - 한 교재에 대해 여러 회독을 가질 수 있음 (1회차, 2회차 등)
 * - 회독은 순차적으로 완료되어야 함 (1회차 완료 후 2회차 시작)
 * - 각 회독별로 독립적인 진도와 목표를 가짐
 * - 회독간 성과 비교 및 개선도 추적 가능
 */
export class Reading extends BaseEntity<IReadingProps> {
  private constructor(props: IReadingProps) {
    super(props);
  }

  /**
   * Factory method to create a new reading round
   */
  public static create(
    props: {
      userId: UserId;
      textbookId: TextbookId;
      round: ReadingRound;
      targets?: Partial<ReadingTargets>;
      initialChapters?: Omit<ChapterProgress, 'completedPages' | 'isCompleted' | 'lastReadAt'>[];
    },
    id?: ReadingId
  ): Result<Reading, DomainError> {
    const now = new Date();
    
    // Initialize chapter progress
    const chaptersProgress: ChapterProgress[] = (props.initialChapters || []).map(chapter => ({
      ...chapter,
      completedPages: 0,
      isCompleted: false,
      lastReadAt: undefined
    }));

    const readingProps: IReadingProps = {
      id: id || createReadingId(crypto.randomUUID()),
      userId: props.userId,
      textbookId: props.textbookId,
      round: props.round,
      status: ReadingStatus.NOT_STARTED,
      targets: {
        rounds: props.round,
        ...props.targets
      },
      chaptersProgress,
      studySessionIds: [],
      totalTimeMinutes: 0,
      totalPagesRead: 0,
      createdAt: now,
      updatedAt: now,
    };

    return success(new Reading(readingProps));
  }

  /**
   * Factory method to reconstruct from persistence
   */
  public static fromPersistence(row: ReadingRow, extendedProps?: {
    chaptersProgress?: ChapterProgress[];
    studySessionIds?: StudySessionId[];
  }): Reading {
    const props: IReadingProps = {
      id: createReadingId(row.id),
      userId: row.user_id as UserId,
      textbookId: row.textbook_id as TextbookId,
      round: createReadingRound(row.round),
      status: row.status as ReadingStatus,
      startedAt: row.started_at ? new Date(row.started_at) : undefined,
      completedAt: row.completed_at ? new Date(row.completed_at) : undefined,  
      lastAccessedAt: row.last_accessed_at ? new Date(row.last_accessed_at) : undefined,
      targets: {
        rounds: createReadingRound(row.round),
        dailyPagesTarget: row.daily_pages_target || undefined,
        weeklyHoursTarget: row.weekly_hours_target || undefined,
        completionDeadline: row.completion_deadline ? new Date(row.completion_deadline) : undefined,
      },
      chaptersProgress: extendedProps?.chaptersProgress || [],
      studySessionIds: extendedProps?.studySessionIds || [],
      totalTimeMinutes: row.total_time_minutes || 0,
      totalPagesRead: row.total_pages_read || 0,
      notes: row.notes || undefined,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at || row.created_at),
    };

    return new Reading(props);
  }

  /**
   * Convert to database insert format
   */
  public toInsert(): ReadingInsert {
    return {
      id: this.props.id,
      user_id: this.props.userId,
      textbook_id: this.props.textbookId,
      round: this.props.round,
      status: this.props.status,
      started_at: this.props.startedAt?.toISOString() || null,
      completed_at: this.props.completedAt?.toISOString() || null,
      last_accessed_at: this.props.lastAccessedAt?.toISOString() || null,
      daily_pages_target: this.props.targets.dailyPagesTarget || null,
      weekly_hours_target: this.props.targets.weeklyHoursTarget || null,
      completion_deadline: this.props.targets.completionDeadline?.toISOString() || null,
      total_time_minutes: this.props.totalTimeMinutes,
      total_pages_read: this.props.totalPagesRead,
      notes: this.props.notes || null,
      created_at: this.props.createdAt.toISOString(),
      updated_at: this.props.updatedAt.toISOString(),
    };
  }

  /**
   * Convert to database update format
   */
  public toUpdate(): ReadingUpdate {
    return {
      status: this.props.status,
      started_at: this.props.startedAt?.toISOString() || null,
      completed_at: this.props.completedAt?.toISOString() || null,
      last_accessed_at: this.props.lastAccessedAt?.toISOString() || null,
      daily_pages_target: this.props.targets.dailyPagesTarget || null,
      weekly_hours_target: this.props.targets.weeklyHoursTarget || null,
      completion_deadline: this.props.targets.completionDeadline?.toISOString() || null,
      total_time_minutes: this.props.totalTimeMinutes,
      total_pages_read: this.props.totalPagesRead,
      notes: this.props.notes || null,
      updated_at: new Date().toISOString(),
    };
  }

  /**
   * Start this reading round
   */
  public startReading(): Result<void, DomainError> {
    if (this.props.status !== ReadingStatus.NOT_STARTED && this.props.status !== ReadingStatus.PAUSED) {
      return failure(new DomainError(
        `Cannot start reading in ${this.props.status} status`, 
        "INVALID_READING_STATUS"
      ));
    }

    this.props.status = ReadingStatus.IN_PROGRESS;
    this.props.startedAt = new Date();
    this.props.lastAccessedAt = new Date();
    this.touch();

    return success(undefined);
  }

  /**
   * Complete this reading round
   */
  public completeReading(): Result<void, DomainError> {
    if (this.props.status !== ReadingStatus.IN_PROGRESS) {
      return failure(new DomainError(
        "Can only complete reading that is in progress", 
        "READING_NOT_IN_PROGRESS"
      ));
    }

    // Check if all chapters are completed
    const incompleteChapters = this.props.chaptersProgress.filter(ch => !ch.isCompleted);
    if (incompleteChapters.length > 0) {
      return failure(new DomainError(
        `Cannot complete reading: ${incompleteChapters.length} chapters remain incomplete`,
        "CHAPTERS_INCOMPLETE"
      ));
    }

    this.props.status = ReadingStatus.COMPLETED;
    this.props.completedAt = new Date();
    this.props.lastAccessedAt = new Date();
    this.touch();

    return success(undefined);
  }

  /**
   * Pause reading round
   */
  public pauseReading(): Result<void, DomainError> {
    if (this.props.status !== ReadingStatus.IN_PROGRESS) {
      return failure(new DomainError(
        "Can only pause reading that is in progress", 
        "READING_NOT_IN_PROGRESS"
      ));
    }

    this.props.status = ReadingStatus.PAUSED;
    this.props.lastAccessedAt = new Date();
    this.touch();

    return success(undefined);
  }

  /**
   * Resume paused reading
   */
  public resumeReading(): Result<void, DomainError> {
    if (this.props.status !== ReadingStatus.PAUSED) {
      return failure(new DomainError(
        "Can only resume paused reading", 
        "READING_NOT_PAUSED"
      ));
    }

    this.props.status = ReadingStatus.IN_PROGRESS;
    this.props.lastAccessedAt = new Date();
    this.touch();

    return success(undefined);
  }

  /**
   * Add study session to this reading
   */
  public addStudySession(sessionId: StudySessionId, timeMinutes: number, pagesRead: number): Result<void, DomainError> {
    if (this.props.status !== ReadingStatus.IN_PROGRESS) {
      return failure(new DomainError(
        "Cannot add study session to non-active reading", 
        "READING_NOT_ACTIVE"
      ));
    }

    this.props.studySessionIds.push(sessionId);
    this.props.totalTimeMinutes += timeMinutes;
    this.props.totalPagesRead += pagesRead;
    this.props.lastAccessedAt = new Date();
    this.touch();

    return success(undefined);
  }

  /**
   * Update chapter progress
   */
  public updateChapterProgress(
    chapterId: string, 
    completedPages: number, 
    difficultyRating?: ReadingDifficulty,
    comprehensionRating?: number,
    notes?: string
  ): Result<void, DomainError> {
    const chapterIndex = this.props.chaptersProgress.findIndex(ch => ch.chapterId === chapterId);
    if (chapterIndex === -1) {
      return failure(new DomainError(
        `Chapter ${chapterId} not found in this reading`, 
        "CHAPTER_NOT_FOUND"
      ));
    }

    const chapter = this.props.chaptersProgress[chapterIndex];
    
    // Validate completed pages
    if (completedPages < 0 || completedPages > chapter.totalPages) {
      return failure(new DomainError(
        `Completed pages (${completedPages}) must be between 0 and ${chapter.totalPages}`,
        "INVALID_COMPLETED_PAGES"
      ));
    }

    // Update chapter progress
    this.props.chaptersProgress[chapterIndex] = {
      ...chapter,
      completedPages,
      isCompleted: completedPages === chapter.totalPages,
      lastReadAt: new Date(),
      difficultyRating,
      comprehensionRating,
      notes
    };

    this.props.lastAccessedAt = new Date();
    this.touch();

    return success(undefined);
  }

  /**
   * Calculate current reading metrics
   */
  public calculateMetrics(): ReadingMetrics {
    const totalPages = this.props.chaptersProgress.reduce((sum, ch) => sum + ch.totalPages, 0);
    const completedPages = this.props.chaptersProgress.reduce((sum, ch) => sum + ch.completedPages, 0);
    
    const avgPageTime = this.props.totalPagesRead > 0 
      ? this.props.totalTimeMinutes / this.props.totalPagesRead 
      : 0;

    const avgDifficulty = this.calculateAverageDifficulty();
    const avgComprehension = this.calculateAverageComprehension();
    
    return {
      totalTimeMinutes: this.props.totalTimeMinutes,
      averagePageTime: avgPageTime,
      totalPagesRead: this.props.totalPagesRead,
      averageDifficulty: avgDifficulty,
      averageComprehension: avgComprehension,
      studySessionsCount: this.props.studySessionIds.length,
      completionPercentage: totalPages > 0 ? (completedPages / totalPages) * 100 : 0
    };
  }

  /**
   * Check if reading targets are being met
   */
  public isOnTrack(): boolean {
    const metrics = this.calculateMetrics();
    const now = new Date();
    
    // Check daily pages target
    if (this.props.targets.dailyPagesTarget && this.props.startedAt) {
      const daysSinceStart = Math.ceil((now.getTime() - this.props.startedAt.getTime()) / (1000 * 60 * 60 * 24));
      const expectedPages = this.props.targets.dailyPagesTarget * daysSinceStart;
      if (this.props.totalPagesRead < expectedPages * 0.8) { // 80% tolerance
        return false;
      }
    }

    // Check completion deadline
    if (this.props.targets.completionDeadline) {
      const timeRemaining = this.props.targets.completionDeadline.getTime() - now.getTime();
      const progressNeeded = 100 - metrics.completionPercentage;
      
      if (timeRemaining <= 0 && metrics.completionPercentage < 100) {
        return false;
      }
      
      // Simple projection: if less than 50% done with less than 30% time remaining
      const totalTimespan = this.props.targets.completionDeadline.getTime() - (this.props.startedAt?.getTime() || now.getTime());
      const timeElapsed = now.getTime() - (this.props.startedAt?.getTime() || now.getTime());
      const timeElapsedRatio = timeElapsed / totalTimespan;
      
      if (metrics.completionPercentage < 50 && timeElapsedRatio > 0.7) {
        return false;
      }
    }

    return true;
  }

  /**
   * Get chapters that need attention (behind schedule or difficult)
   */
  public getChaptersNeedingAttention(): ChapterProgress[] {
    return this.props.chaptersProgress.filter(chapter => {
      // Chapter is incomplete and has low comprehension or high difficulty
      return !chapter.isCompleted && (
        (chapter.comprehensionRating && chapter.comprehensionRating < 6) ||
        (chapter.difficultyRating && chapter.difficultyRating >= ReadingDifficulty.HARD)
      );
    });
  }

  private calculateAverageDifficulty(): number {
    const ratingsWithDifficulty = this.props.chaptersProgress.filter(ch => ch.difficultyRating);
    if (ratingsWithDifficulty.length === 0) return 0;
    
    const sum = ratingsWithDifficulty.reduce((acc, ch) => acc + (ch.difficultyRating || 0), 0);
    return sum / ratingsWithDifficulty.length;
  }

  private calculateAverageComprehension(): number {
    const ratingsWithComprehension = this.props.chaptersProgress.filter(ch => ch.comprehensionRating);
    if (ratingsWithComprehension.length === 0) return 0;
    
    const sum = ratingsWithComprehension.reduce((acc, ch) => acc + (ch.comprehensionRating || 0), 0);
    return sum / ratingsWithComprehension.length;
  }

  // Getters
  public get id(): ReadingId { return this.props.id; }
  public get userId(): UserId { return this.props.userId; }
  public get textbookId(): TextbookId { return this.props.textbookId; }
  public get round(): ReadingRound { return this.props.round; }
  public get status(): ReadingStatus { return this.props.status; }
  public get startedAt(): Date | undefined { return this.props.startedAt; }
  public get completedAt(): Date | undefined { return this.props.completedAt; }
  public get lastAccessedAt(): Date | undefined { return this.props.lastAccessedAt; }
  public get targets(): ReadingTargets { return this.props.targets; }
  public get chaptersProgress(): ChapterProgress[] { return [...this.props.chaptersProgress]; }
  public get studySessionIds(): StudySessionId[] { return [...this.props.studySessionIds]; }
  public get totalTimeMinutes(): number { return this.props.totalTimeMinutes; }
  public get totalPagesRead(): number { return this.props.totalPagesRead; }
  public get notes(): string | undefined { return this.props.notes; }
  public get createdAt(): Date { return this.props.createdAt; }
  public get updatedAt(): Date { return this.props.updatedAt; }
} 
