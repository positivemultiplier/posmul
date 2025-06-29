import {
  BaseEntity,
  Result,
  UserId,
  failure,
  success,
} from "@posmul/shared-types";
import { AssessmentId } from "../value-objects/assessment-id.value-object";
import { QuestionId } from "../value-objects/question-id.value-object";

/**
 * @interface SubmittedAnswer
 * @description Represents a single answer submitted by a student for a question.
 */
export interface SubmittedAnswer {
  questionId: QuestionId;
  userAnswer: any; // Flexible to accommodate different answer types (string, string[], number, etc.)
  isCorrect?: boolean;
  score?: number;
}

/**
 * @type SubmissionStatus
 * @description Represents the lifecycle status of a submission.
 */
export type SubmissionStatus = "in-progress" | "submitted" | "graded";

/**
 * @interface ISubmissionProps
 * @description Defines the properties for a Submission entity.
 */
export interface ISubmissionProps {
  id: string;
  assessmentId: AssessmentId;
  studentId: UserId;
  status: SubmissionStatus;
  answers: SubmittedAnswer[];
  finalScore: number;
  startedAt: Date;
  submittedAt?: Date;
  timeSpent?: number; // in seconds
  updatedAt?: Date;
}

/**
 * @class Submission
 * @extends BaseEntity<ISubmissionProps>
 * @description The aggregate root for the submission context, representing a student's attempt at an assessment.
 */
export class Submission extends BaseEntity<ISubmissionProps> {
  private constructor(props: ISubmissionProps) {
    super(props);
  }

  public static create(props: ISubmissionProps): Result<Submission, Error> {
    const submission = new Submission(props);
    return success(submission);
  }

  public submitAnswer(answer: SubmittedAnswer): void {
    const existingAnswerIndex = this.props.answers.findIndex(
      (a) => a.questionId === answer.questionId
    );
    if (existingAnswerIndex > -1) {
      this.props.answers[existingAnswerIndex] = answer;
    } else {
      this.props.answers.push(answer);
    }
  }

  public finalize(): Result<void, Error> {
    if (this.props.status !== "in-progress") {
      return failure(new Error("Submission has already been finalized."));
    }
    this.props.status = "submitted";
    this.props.submittedAt = new Date();
    this.props.timeSpent =
      (this.props.submittedAt.getTime() - this.props.startedAt.getTime()) /
      1000;
    return success(undefined);
  }

  public grade(
    gradedAnswers: Pick<SubmittedAnswer, "questionId" | "isCorrect" | "score">[]
  ): void {
    let totalScore = 0;
    this.props.answers.forEach((answer) => {
      const gradeInfo = gradedAnswers.find(
        (g) => g.questionId === answer.questionId
      );
      if (gradeInfo) {
        answer.isCorrect = gradeInfo.isCorrect;
        answer.score = gradeInfo.score;
        totalScore += gradeInfo.score ?? 0;
      }
    });
    this.props.finalScore = totalScore;
    this.props.status = "graded";
  }
}
