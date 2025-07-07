/**
 * Study-Cycle 도메인 타입 정의
 * 모노레포 의존성 없이 독립 실행을 위한 타입들
 */

// User 타입
export type UserId = string;

// Study Session 타입
export type StudySessionId = string;

export type StudySessionStatus = 'active' | 'paused' | 'completed' | 'cancelled';

export interface StudySessionSummary {
  sessionId: StudySessionId;
  userId: UserId;
  textbookId: TextbookId;
  chapterId?: ChapterId;
  startedAt: Date;
  completedAt?: Date;
  totalTimeMinutes: number;
  pagesCompleted: number;
  averageComprehension: number;
  averageDifficulty?: number;
  status: StudySessionStatus;
}

// Textbook 타입
export type TextbookId = string;
export type ChapterId = string;

// Reading 타입
export interface ReadingMetrics {
  totalPagesRead: number;
  totalTimeMinutes: number;
  averageComprehension: number;
  completionPercentage: number;
  averagePageTime?: number;
  averageDifficulty?: number;
  studySessionsCount?: number;
}

export interface ChapterProgress {
  chapterId: ChapterId;
  chapterTitle: string;
  title: string;
  totalPages: number;
  completedPages: number;
  averageComprehension: number;
  timeSpentMinutes: number;
  isCompleted: boolean;
  lastReadAt?: Date;
  difficultyRating?: number;
  comprehensionRating?: number;
  notes?: string;
}

// Assessment 타입
export type QuestionId = string;

export enum QuestionType {
  MultipleChoice = 'multiple-choice',
  TrueFalse = 'true-false',
  Essay = 'essay',
  ShortAnswer = 'short-answer'
}

export interface QuestionOption {
  id: string;
  text: string;
}

export interface QuestionForSolvingDto {
  id: QuestionId;
  type: QuestionType;
  title?: string;
  content?: string;
  question: string;
  difficulty?: string;
  options?: QuestionOption[] | string[];
  correctAnswer?: string;
}

export interface AssessmentForSolvingDto {
  id: string;
  title: string;
  description: string;
  questions: QuestionForSolvingDto[];
  timeLimit?: number;
}

export interface QuestionResult {
  questionId: QuestionId;
  id?: string;
  title?: string;
  content?: string;
  explanation?: string;
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  timeSpent: number;
}

export interface AssessmentResultDto {
  id: string;
  assessmentId: string;
  userId: UserId;
  title?: string;
  description?: string;
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  grade?: string;
  totalScore?: number;
  maxScore?: number;
  percentage?: number;
  timeTakenInSeconds?: number;
  questionResults: QuestionResult[];
  completedAt: Date;
  timeSpent: number;
}
