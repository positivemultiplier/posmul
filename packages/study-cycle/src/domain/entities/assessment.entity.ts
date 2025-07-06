/**
 * Assessment Domain Entity
 *
 * Assessment aggregate root that manages the complete lifecycle of assessments
 * including question management, submission handling, and grading.
 *
 * Implements Domain-Driven Design patterns and integrates with PosMul shared kernel.
 */

import {
  BaseEntity,
  DomainError,
  Result,
  ValidationError,
  failure,
  success,
} from "@posmul/shared-types";
import { v4 as uuid } from "uuid";
import { QuestionId } from "../value-objects/question-id.value-object";
import { SolutionTemplateId } from "../value-objects/solution-template-id.value-object";

// Branded types for type safety
export type AssessmentId = string & { readonly brand: unique symbol };
export type SubmissionId = string & { readonly brand: unique symbol };

// Factory functions for creating IDs
export const createAssessmentId = (): AssessmentId => uuid() as AssessmentId;
export const createSubmissionId = (): SubmissionId => uuid() as SubmissionId;

// Enums
export enum AssessmentStatus {
  Draft = "draft",
  Published = "published",
  Active = "active",
  Completed = "completed",
  Archived = "archived",
}

export enum QuestionType {
  MultipleChoice = "multiple-choice",
  MultipleSelect = "multiple-select",
  TrueFalse = "true-false",
  ShortAnswer = "short-answer",
  Essay = "essay",
  Coding = "coding",
}

export enum GradingStatus {
  Pending = "pending",
  InProgress = "in-progress",
  Completed = "completed",
  Failed = "failed",
}

// Value Objects
export interface QuestionOption {
  id: string;
  text: string;
  isCorrect: boolean;
  explanation?: string;
}

export interface AssessmentSettings {
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  allowBackNavigation: boolean;
  showProgressBar: boolean;
  requireFullscreen: boolean;
  preventCopyPaste: boolean;
  recordingEnabled: boolean;
}

export interface AssessmentResult {
  totalQuestions: number;
  totalPoints: number;
  earnedPoints: number;
  percentage: number;
  passed: boolean;
  timeSpent: number;
  submissionSummary: SubmissionSummary[];
}

export interface SubmissionSummary {
  questionId: QuestionId;
  isCorrect: boolean;
  points: number;
  timeSpent: number;
}

// Entity Props Interfaces
export interface IQuestionProps {
  templateId: SolutionTemplateId;
  type: QuestionType;
  title: string;
  content: string;
  points: number;
  options?: QuestionOption[];
  correctAnswer?: string;
  gradingCriteria?: string;
  timeLimit?: number;
  difficulty: "easy" | "medium" | "hard";
  tags: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IGradedAnswer {
  questionId: QuestionId;
  isCorrect: boolean;
  score: number;
  userAnswer?: string | string[];
  correctAnswer?: string | string[];
}

export interface ISubmissionProps {
  assessmentId: AssessmentId;
  studentId: string;
  answers: IGradedAnswer[];
  finalScore: number;
  totalPoints: number;
  isCompleted: boolean;
  startedAt: Date;
  submittedAt: Date;
  timeSpent?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IAssessmentProps {
  id: AssessmentId;
  title: string;
  description: string;
  status: AssessmentStatus;
  creatorId: string;
  questions: Question[];
  totalPoints: number;
  timeLimit?: number;
  startDate?: Date;
  endDate?: Date;
  allowedAttempts: number;
  passingScore: number;
  isRandomized: boolean;
  showResults: boolean;
  settings: AssessmentSettings;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Question Entity
 */
export class Question extends BaseEntity<IQuestionProps> {
  private readonly _id: QuestionId;

  private constructor(props: IQuestionProps, id?: QuestionId) {
    super(props);
    this._id = id ?? (uuid() as QuestionId);
  }

  public static create(
    data: Omit<IQuestionProps, "createdAt" | "updatedAt" | "isActive"> & {
      isActive?: boolean;
    }
  ): Result<Question, ValidationError> {
    if (!data.title?.trim()) {
      return failure(new ValidationError("제목은 필수입니다.", "title"));
    }
    if (!data.content?.trim()) {
      return failure(new ValidationError("문제 내용은 필수입니다.", "content"));
    }
    if (data.points <= 0) {
      return failure(
        new ValidationError("점수는 0보다 커야 합니다.", "points")
      );
    }

    if (data.type === QuestionType.MultipleChoice) {
      if (!data.options || data.options.length < 2) {
        return failure(
          new ValidationError(
            "객관식 문제는 최소 2개의 선택지가 필요합니다.",
            "options"
          )
        );
      }
      const correctOptions = data.options.filter((opt) => opt.isCorrect);
      if (correctOptions.length === 0) {
        return failure(
          new ValidationError("정답이 설정되지 않았습니다.", "options")
        );
      }
    }

    const now = new Date();
    const question = new Question({
      ...data,
      isActive: data.isActive ?? true,
      createdAt: now,
      updatedAt: now,
    });

    return success(question);
  }

  public static reconstitute(props: IQuestionProps, id: QuestionId): Question {
    return new Question(props, id);
  }

  get id(): QuestionId {
    return this._id;
  }
  get templateId(): SolutionTemplateId {
    return this.props.templateId;
  }
  get type(): QuestionType {
    return this.props.type;
  }
  get title(): string {
    return this.props.title;
  }
  get content(): string {
    return this.props.content;
  }
  get points(): number {
    return this.props.points;
  }
  get options(): QuestionOption[] {
    return this.props.options ? [...this.props.options] : [];
  }
  get correctAnswer(): string | undefined {
    return this.props.correctAnswer;
  }
  get difficulty(): string {
    return this.props.difficulty;
  }
  get tags(): string[] {
    return [...this.props.tags];
  }
  get isActive(): boolean {
    return this.props.isActive;
  }
  get gradingCriteria(): string | undefined {
    return this.props.gradingCriteria;
  }
  get timeLimit(): number | undefined {
    return this.props.timeLimit;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }

  /**
   * 도메인 외부(예: Repository)에서 전체 속성이 필요할 때 사용
   */
  public getProps(): Readonly<IQuestionProps> {
    return { ...this.props };
  }

  public gradeSubmission(
    answer: string | string[]
  ): Result<number, DomainError> {
    if (!this.props.isActive) {
      return failure(
        new DomainError(
          "비활성화된 문제는 채점할 수 없습니다.",
          "QUESTION_INACTIVE"
        )
      );
    }

    switch (this.props.type) {
      case QuestionType.MultipleChoice:
        return this.gradeMultipleChoice(answer as string);
      case QuestionType.ShortAnswer:
        return this.gradeShortAnswer(answer as string);
      default:
        return failure(
          new DomainError(
            "자동 채점이 지원되지 않는 문제 유형입니다.",
            "UNSUPPORTED_QUESTION_TYPE"
          )
        );
    }
  }

  private gradeMultipleChoice(answer: string): Result<number, DomainError> {
    if (!this.props.options) {
      return failure(
        new DomainError("선택지가 설정되지 않았습니다.", "NO_OPTIONS")
      );
    }

    const selectedOption = this.props.options.find((opt) => opt.id === answer);
    if (!selectedOption) {
      return failure(
        new DomainError("유효하지 않은 선택지입니다.", "INVALID_OPTION")
      );
    }

    return success(selectedOption.isCorrect ? this.props.points : 0);
  }

  private gradeShortAnswer(answer: string): Result<number, DomainError> {
    if (!this.props.correctAnswer) {
      return failure(
        new DomainError("정답이 설정되지 않았습니다.", "NO_CORRECT_ANSWER")
      );
    }

    const normalizedAnswer = answer.trim().toLowerCase();
    const normalizedCorrect = this.props.correctAnswer.trim().toLowerCase();

    return success(
      normalizedAnswer === normalizedCorrect ? this.props.points : 0
    );
  }
}

/**
 * Submission Entity
 */
export class Submission extends BaseEntity<ISubmissionProps> {
  private readonly _id: SubmissionId;

  private constructor(props: ISubmissionProps, id?: SubmissionId) {
    super(props);
    this._id = id ?? (uuid() as SubmissionId);
  }

  public static create(
    data: Omit<
      ISubmissionProps,
      "startedAt" | "submittedAt" | "createdAt" | "updatedAt"
    >
  ): Result<Submission, ValidationError> {
    if (data.finalScore < 0) {
      return failure(
        new ValidationError("최종 점수는 0보다 작을 수 없습니다.", "finalScore")
      );
    }

    const now = new Date();
    const submission = new Submission({
      ...data,
      startedAt: now,
      submittedAt: now,
      createdAt: now,
      updatedAt: now,
    });
    return success(submission);
  }

  public static reconstitute(
    props: ISubmissionProps,
    id: SubmissionId
  ): Submission {
    return new Submission(props, id);
  }

  get id(): SubmissionId {
    return this._id;
  }
  get assessmentId(): AssessmentId {
    return this.props.assessmentId;
  }
  get studentId(): string {
    return this.props.studentId;
  }
  get answers(): IGradedAnswer[] {
    return this.props.answers;
  }
  get finalScore(): number {
    return this.props.finalScore;
  }
  get totalPoints(): number {
    return this.props.totalPoints;
  }
  get isCompleted(): boolean {
    return this.props.isCompleted;
  }
  get startedAt(): Date {
    return this.props.startedAt;
  }
  get submittedAt(): Date {
    return this.props.submittedAt;
  }
  get timeSpent(): number | undefined {
    return this.props.timeSpent;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  /**
   * 도메인 외부(예: Repository)에서 전체 속성이 필요할 때 사용
   */
  public getProps(): Readonly<ISubmissionProps> {
    return { ...this.props };
  }
}

/**
 * Assessment Aggregate Root
 */
export class Assessment extends BaseEntity<IAssessmentProps> {
  private readonly _id: AssessmentId;

  private constructor(props: IAssessmentProps, id?: AssessmentId) {
    super(props);
    this._id = id ?? (uuid() as AssessmentId);
  }

  public static create(
    data: Omit<
      IAssessmentProps,
      "id" | "questions" | "totalPoints" | "status" | "createdAt" | "updatedAt"
    > & {
      status?: AssessmentStatus;
    }
  ): Result<Assessment, ValidationError> {
    if (!data.title?.trim()) {
      return failure(new ValidationError("제목은 필수입니다.", "title"));
    }
    if (!data.description?.trim()) {
      return failure(new ValidationError("설명은 필수입니다.", "description"));
    }
    if (data.allowedAttempts <= 0) {
      return failure(
        new ValidationError(
          "허용 시도 횟수는 0보다 커야 합니다.",
          "allowedAttempts"
        )
      );
    }
    if (data.passingScore < 0 || data.passingScore > 100) {
      return failure(
        new ValidationError(
          "통과 점수는 0-100 사이여야 합니다.",
          "passingScore"
        )
      );
    }

    const now = new Date();
    const assessment = new Assessment({
      ...data,
      id: createAssessmentId(),
      questions: [],
      totalPoints: 0,
      status: data.status ?? AssessmentStatus.Draft,
      createdAt: now,
      updatedAt: now,
    });

    return success(assessment);
  }

  public static reconstitute(
    props: IAssessmentProps,
    id: AssessmentId
  ): Assessment {
    return new Assessment(props, id);
  }

  get id(): AssessmentId {
    return this._id;
  }
  get title(): string {
    return this.props.title;
  }
  get description(): string {
    return this.props.description;
  }
  get status(): AssessmentStatus {
    return this.props.status;
  }
  get creatorId(): string {
    return this.props.creatorId;
  }
  get questions(): Question[] {
    return [...this.props.questions];
  }
  get totalPoints(): number {
    return this.props.totalPoints;
  }
  get allowedAttempts(): number {
    return this.props.allowedAttempts;
  }
  get passingScore(): number {
    return this.props.passingScore;
  }
  get timeLimit(): number | undefined {
    return this.props.timeLimit;
  }
  get startDate(): Date | undefined {
    return this.props.startDate;
  }
  get endDate(): Date | undefined {
    return this.props.endDate;
  }
  get isRandomized(): boolean {
    return this.props.isRandomized;
  }
  get showResults(): boolean {
    return this.props.showResults;
  }
  get settings(): AssessmentSettings {
    return this.props.settings;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }

  public addQuestion(question: Question): Result<void, DomainError> {
    if (this.props.status !== AssessmentStatus.Draft) {
      return failure(
        new DomainError(
          "초안 상태에서만 문제를 추가할 수 있습니다.",
          "ASSESSMENT_NOT_DRAFT"
        )
      );
    }

    this.props.questions.push(question);
    this.recalculateTotalPoints();
    super.touch();

    return success(undefined);
  }

  public publish(): Result<void, DomainError> {
    if (this.props.status !== AssessmentStatus.Draft) {
      return failure(
        new DomainError("초안 상태에서만 발행할 수 있습니다.", "INVALID_STATUS")
      );
    }

    if (this.props.questions.length === 0) {
      return failure(
        new DomainError("최소 1개의 문제가 필요합니다.", "NO_QUESTIONS")
      );
    }

    this.props.status = AssessmentStatus.Published;
    super.touch();

    return success(undefined);
  }

  public gradeSubmissions(
    submissions: Submission[]
  ): Result<AssessmentResult, DomainError> {
    // TODO: This logic has been moved to SubmitAssessmentUseCase for now.
    // Refactor later to support grading directly within the domain.
    /*
    if (this.props.status !== AssessmentStatus.Completed) {
      return failure(new DomainError("완료된 평가만 채점할 수 있습니다."));
    }

    let totalEarnedPoints = 0;
    const submissionSummaries: SubmissionSummary[] = [];

    for (const sub of submissions) {
      const question = this.props.questions.find(q => q.id === sub.questionId);
      if (question) {
        // Assuming submission score is pre-calculated or needs grading here
        const score = sub.score ?? 0;
        totalEarnedPoints += score;
        submissionSummaries.push({
          questionId: sub.questionId,
          isCorrect: score > 0,
          points: score,
          timeSpent: sub.timeSpent ?? 0,
        });
      }
    }

    const result: AssessmentResult = {
      totalQuestions: this.props.questions.length,
      totalPoints: this.props.totalPoints,
      earnedPoints: totalEarnedPoints,
      percentage: (totalEarnedPoints / this.props.totalPoints) * 100,
      passed: totalEarnedPoints >= this.props.passingScore,
      timeSpent: 0, // This should be calculated based on submissions
      submissionSummary: submissionSummaries,
    };

    return success(result);
    */
    return failure(
      new DomainError("Not implemented", "GRADE_SUBMISSIONS_NOT_IMPLEMENTED")
    );
  }

  private recalculateTotalPoints(): void {
    this.props.totalPoints = this.props.questions.reduce(
      (sum, q) => sum + q.points,
      0
    );
  }

  /**
   * Repository 및 외부 계층에서 전체 속성을 필요로 할 때 사용
   */
  public getProps(): Readonly<IAssessmentProps> {
    return { ...this.props };
  }

  /**
   * 질문 배열을 반환 (질문 엔티티 불변성 유지)
   */
  public getQuestions(): Question[] {
    return [...this.props.questions];
  }
}
