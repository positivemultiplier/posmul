import {
  BaseEntity,
  DomainError,
  Result,
  failure,
  success,
} from "@posmul/shared-types";
import { TextbookId } from "./textbook.entity";

// Branded types for type safety
export type StudySessionId = string & { readonly __brand: "StudySessionId" };
export type ChapterId = string & { readonly __brand: "ChapterId" };
export type UserId = string & { readonly __brand: "UserId" };

// Study session status enum (derived from database behavior)
export enum StudySessionStatus {
  ACTIVE = "active",
  COMPLETED = "completed",
  PAUSED = "paused",
  CANCELLED = "cancelled",
}

// Progress data value object
export interface ProgressData {
  readonly pagesRead: number;
  readonly timeSpentMinutes: number;
  readonly notesCount: number;
  readonly difficultyRating: number; // 1-5 scale
  readonly comprehensionRating: number; // 1-5 scale
}

// Study session summary value object
export interface StudySessionSummary {
  readonly sessionId: StudySessionId;
  readonly textbookId: TextbookId;
  readonly chapterId?: ChapterId;
  readonly totalTimeMinutes: number;
  readonly pagesCompleted: number;
  readonly averageDifficulty: number;
  readonly averageComprehension: number;
  readonly startedAt: Date;
  readonly completedAt: Date;
}

// Study session configuration
export interface StudySessionConfig {
  readonly targetTimeMinutes?: number;
  readonly targetPages?: number;
  readonly reminderIntervalMinutes?: number;
  readonly autoSaveIntervalMinutes?: number;
}

// Create functions for branded types
export const createStudySessionId = (id: string): StudySessionId =>
  id as StudySessionId;
export const createChapterId = (id: string): ChapterId => id as ChapterId;
export const createUserId = (id: string): UserId => id as UserId;

// Map Supabase table type to domain properties (임시 타입 정의)
type StudySessionRow = {
  id: string;
  user_id: string;
  textbook_id: string;
  chapter_id?: string | null;
  start_time: string;
  end_time?: string | null;
  duration_seconds?: number | null;
  created_at: string;
};

type StudySessionInsert = Partial<StudySessionRow>;
type StudySessionUpdate = Partial<StudySessionRow>;

export interface IStudySessionProps {
  id: StudySessionId;
  userId: UserId;
  textbookId: TextbookId;
  chapterId?: ChapterId;
  startTime: Date;
  endTime?: Date;
  durationSeconds?: number;
  // Extended domain properties not in database
  status: StudySessionStatus;
  pagesCompleted: number;
  notesCount: number;
  difficultyRatings: number[];
  comprehensionRatings: number[];
  config?: StudySessionConfig;
  createdAt: Date;
  updatedAt: Date;
}

let getUUID: () => string;

if (typeof globalThis.crypto !== 'undefined' && typeof globalThis.crypto.randomUUID === 'function') {
  getUUID = () => globalThis.crypto.randomUUID();
} else if (typeof globalThis.process !== 'undefined' && globalThis.process.versions && globalThis.process.versions.node) {
  // Node.js 환경
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let nodeCrypto: any;
    nodeCrypto = eval('require("crypto")');
    if (nodeCrypto && typeof nodeCrypto.randomUUID === 'function') {
      getUUID = () => nodeCrypto.randomUUID();
    } else {
      getUUID = () => Math.random().toString(36).substring(2, 10) + Date.now();
    }
  } catch {
    getUUID = () => Math.random().toString(36).substring(2, 10) + Date.now();
  }
} else {
  getUUID = () => Math.random().toString(36).substring(2, 10) + Date.now();
}

export class StudySession extends BaseEntity<IStudySessionProps> {
  private constructor(props: IStudySessionProps) {
    super(props);
  }

  /**
   * Factory method to create a new study session
   */
  public static create(
    props: {
      userId: UserId;
      textbookId: TextbookId;
      chapterId?: ChapterId;
      config?: StudySessionConfig;
    },
    id?: StudySessionId
  ): Result<StudySession, DomainError> {
    const now = new Date();

    const studySessionProps: IStudySessionProps = {
      id: id || createStudySessionId(getUUID()),
      userId: props.userId,
      textbookId: props.textbookId,
      chapterId: props.chapterId,
      startTime: now,
      status: StudySessionStatus.ACTIVE,
      pagesCompleted: 0,
      notesCount: 0,
      difficultyRatings: [],
      comprehensionRatings: [],
      config: props.config,
      createdAt: now,
      updatedAt: now,
    };

    return success(new StudySession(studySessionProps));
  }

  /**
   * Factory method to reconstruct from persistence
   */
  public static fromPersistence(
    row: StudySessionRow,
    extendedProps?: {
      status?: StudySessionStatus;
      pagesCompleted?: number;
      notesCount?: number;
      difficultyRatings?: number[];
      comprehensionRatings?: number[];
      config?: StudySessionConfig;
    }
  ): StudySession {
    const props: IStudySessionProps = {
      id: createStudySessionId(row.id),
      userId: createUserId(row.user_id),
      textbookId: row.textbook_id as TextbookId,
      chapterId: row.chapter_id ? createChapterId(row.chapter_id) : undefined,
      startTime: new Date(row.start_time),
      endTime: row.end_time ? new Date(row.end_time) : undefined,
      durationSeconds: row.duration_seconds || undefined,
      status:
        extendedProps?.status ||
        (row.end_time
          ? StudySessionStatus.COMPLETED
          : StudySessionStatus.ACTIVE),
      pagesCompleted: extendedProps?.pagesCompleted || 0,
      notesCount: extendedProps?.notesCount || 0,
      difficultyRatings: extendedProps?.difficultyRatings || [],
      comprehensionRatings: extendedProps?.comprehensionRatings || [],
      config: extendedProps?.config,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.created_at), // Use created_at as fallback
    };

    return new StudySession(props);
  }

  /**
   * Convert to database insert format
   */
  public toInsert(): StudySessionInsert {
    return {
      id: this.props.id,
      user_id: this.props.userId,
      textbook_id: this.props.textbookId,
      chapter_id: this.props.chapterId || null,
      start_time: this.props.startTime.toISOString(),
      end_time: this.props.endTime?.toISOString() || null,
      duration_seconds: this.props.durationSeconds || null,
      created_at: this.props.createdAt.toISOString(),
    };
  }

  /**
   * Convert to database update format
   */
  public toUpdate(): StudySessionUpdate {
    return {
      end_time: this.props.endTime?.toISOString() || null,
      duration_seconds: this.props.durationSeconds || null,
    };
  }

  /**
   * Start a study session (if paused or cancelled)
   */
  public startSession(
    textbookId: TextbookId,
    chapterId?: ChapterId
  ): Result<void, DomainError> {
    if (this.props.status === StudySessionStatus.ACTIVE) {
      return failure(
        new DomainError(
          "Study session is already active",
          "SESSION_ALREADY_ACTIVE"
        )
      );
    }

    if (this.props.status === StudySessionStatus.COMPLETED) {
      return failure(
        new DomainError(
          "Cannot restart a completed study session",
          "SESSION_COMPLETED"
        )
      );
    }

    // Update session properties
    this.props.textbookId = textbookId;
    this.props.chapterId = chapterId;
    this.props.status = StudySessionStatus.ACTIVE;
    this.props.startTime = new Date();
    this.touch();

    return success(undefined);
  }

  /**
   * End the study session and generate summary
   */
  public endSession(): Result<StudySessionSummary, DomainError> {
    if (this.props.status !== StudySessionStatus.ACTIVE) {
      return failure(
        new DomainError(
          "Can only end an active study session",
          "SESSION_NOT_ACTIVE"
        )
      );
    }

    const now = new Date();
    const sessionDurationSeconds = Math.floor(
      (now.getTime() - this.props.startTime.getTime()) / 1000
    );

    // Update session properties
    this.props.status = StudySessionStatus.COMPLETED;
    this.props.endTime = now;
    this.props.durationSeconds =
      (this.props.durationSeconds || 0) + sessionDurationSeconds;
    this.touch();

    // Generate session summary
    const summary: StudySessionSummary = {
      sessionId: this.props.id,
      textbookId: this.props.textbookId,
      chapterId: this.props.chapterId,
      totalTimeMinutes: Math.floor((this.props.durationSeconds || 0) / 60),
      pagesCompleted: this.props.pagesCompleted,
      averageDifficulty: this.calculateAverageRating(
        this.props.difficultyRatings
      ),
      averageComprehension: this.calculateAverageRating(
        this.props.comprehensionRatings
      ),
      startedAt: this.props.startTime,
      completedAt: now,
    };

    return success(summary);
  }

  /**
   * Pause the current study session
   */
  public pauseSession(): Result<void, DomainError> {
    if (this.props.status !== StudySessionStatus.ACTIVE) {
      return failure(
        new DomainError(
          "Can only pause an active study session",
          "SESSION_NOT_ACTIVE"
        )
      );
    }

    const now = new Date();
    const sessionDurationSeconds = Math.floor(
      (now.getTime() - this.props.startTime.getTime()) / 1000
    );

    this.props.status = StudySessionStatus.PAUSED;
    this.props.durationSeconds =
      (this.props.durationSeconds || 0) + sessionDurationSeconds;
    this.touch();

    return success(undefined);
  }

  /**
   * Resume a paused study session
   */
  public resumeSession(): Result<void, DomainError> {
    if (this.props.status !== StudySessionStatus.PAUSED) {
      return failure(
        new DomainError(
          "Can only resume a paused study session",
          "SESSION_NOT_PAUSED"
        )
      );
    }

    this.props.status = StudySessionStatus.ACTIVE;
    this.props.startTime = new Date();
    this.touch();

    return success(undefined);
  }

  /**
   * Cancel the study session
   */
  public cancelSession(): Result<void, DomainError> {
    if (this.props.status === StudySessionStatus.COMPLETED) {
      return failure(
        new DomainError(
          "Cannot cancel a completed study session",
          "SESSION_COMPLETED"
        )
      );
    }

    this.props.status = StudySessionStatus.CANCELLED;
    this.props.endTime = new Date();
    this.touch();

    return success(undefined);
  }

  /**
   * Record progress during the study session
   */
  public recordProgress(progressData: ProgressData): Result<void, DomainError> {
    if (this.props.status !== StudySessionStatus.ACTIVE) {
      return failure(
        new DomainError(
          "Can only record progress during an active study session",
          "SESSION_NOT_ACTIVE"
        )
      );
    }

    try {
      // Validate progress data
      if (
        progressData.difficultyRating < 1 ||
        progressData.difficultyRating > 5
      ) {
        return failure(
          new DomainError(
            "Difficulty rating must be between 1 and 5",
            "INVALID_DIFFICULTY_RATING"
          )
        );
      }
      if (
        progressData.comprehensionRating < 1 ||
        progressData.comprehensionRating > 5
      ) {
        return failure(
          new DomainError(
            "Comprehension rating must be between 1 and 5",
            "INVALID_COMPREHENSION_RATING"
          )
        );
      }
      if (
        progressData.pagesRead < 0 ||
        progressData.timeSpentMinutes < 0 ||
        progressData.notesCount < 0
      ) {
        return failure(
          new DomainError(
            "Progress values cannot be negative",
            "INVALID_PROGRESS_VALUES"
          )
        );
      }

      // Update session progress
      this.props.pagesCompleted += progressData.pagesRead;
      this.props.notesCount += progressData.notesCount;
      this.props.difficultyRatings.push(progressData.difficultyRating);
      this.props.comprehensionRatings.push(progressData.comprehensionRating);

      this.touch();

      return success(undefined);
    } catch (error) {
      return failure(
        new DomainError(
          error instanceof Error ? error.message : "Invalid progress data",
          "PROGRESS_VALIDATION_ERROR"
        )
      );
    }
  }

  /**
   * Check if session targets are met
   */
  public areTargetsMet(): boolean {
    const currentMinutes = this.getCurrentSessionMinutes();
    
    const timeTargetMet =
      !this.props.config?.targetTimeMinutes ||
      currentMinutes >= this.props.config.targetTimeMinutes;
    const pageTargetMet =
      !this.props.config?.targetPages ||
      this.props.pagesCompleted >= this.props.config.targetPages;

    return timeTargetMet && pageTargetMet;
  }

  /**
   * Get current session progress percentage
   */
  public getProgressPercentage(): number {
    if (
      !this.props.config?.targetPages &&
      !this.props.config?.targetTimeMinutes
    ) {
      return 0;
    }

    let progressSum = 0;
    let targetCount = 0;

    if (this.props.config?.targetPages) {
      progressSum +=
        Math.min(this.props.pagesCompleted / this.props.config.targetPages, 1) *
        100;
      targetCount++;
    }

    if (this.props.config?.targetTimeMinutes) {
      const currentMinutes = this.getCurrentSessionMinutes();
      progressSum +=
        Math.min(currentMinutes / this.props.config.targetTimeMinutes, 1) * 100;
      targetCount++;
    }

    return targetCount > 0 ? progressSum / targetCount : 0;
  }

  /**
   * Get current session total minutes including active time
   */
  private getCurrentSessionMinutes(): number {
    if (this.props.status === StudySessionStatus.ACTIVE) {
      const now = new Date();
      const currentSessionSeconds = Math.floor(
        (now.getTime() - this.props.startTime.getTime()) / 1000
      );
      return Math.floor(
        ((this.props.durationSeconds || 0) + currentSessionSeconds) / 60
      );
    }

    return Math.floor((this.props.durationSeconds || 0) / 60);
  }

  /**
   * Get session duration in minutes
   */
  public getSessionDurationMinutes(): number {
    return this.getCurrentSessionMinutes();
  }

  public calculateAverageRating(ratings: number[]): number {
    if (ratings.length === 0) return 0;
    const sum = ratings.reduce((acc, rating) => acc + rating, 0);
    return sum / ratings.length;
  }

  // Getters for accessing properties
  public get id(): StudySessionId {
    return this.props.id;
  }
  public get userId(): UserId {
    return this.props.userId;
  }
  public get textbookId(): TextbookId {
    return this.props.textbookId;
  }
  public get chapterId(): ChapterId | undefined {
    return this.props.chapterId;
  }
  public get status(): StudySessionStatus {
    return this.props.status;
  }
  public get startTime(): Date {
    return this.props.startTime;
  }
  public get endTime(): Date | undefined {
    return this.props.endTime;
  }
  public get durationSeconds(): number | undefined {
    return this.props.durationSeconds;
  }
  public get pagesCompleted(): number {
    return this.props.pagesCompleted;
  }
  public get notesCount(): number {
    return this.props.notesCount;
  }
  public get difficultyRatings(): number[] {
    return [...this.props.difficultyRatings];
  }
  public get comprehensionRatings(): number[] {
    return [...this.props.comprehensionRatings];
  }
  public get createdAt(): Date {
    return this.props.createdAt;
  }
  public get updatedAt(): Date {
    return this.props.updatedAt;
  }
}
