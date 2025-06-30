import {
  BaseEntity,
  Result,
  UserId,
  failure,
  success,
} from "@posmul/shared-types";
import { AssessmentId, Question } from "../entities/assessment.entity";
import { QuestionId } from "../value-objects/question-id.value-object";

export type AssessmentStatus = "draft" | "published" | "archived";

export interface IAssessmentProps {
  id: AssessmentId;
  title: string;
  description: string;
  creatorId: UserId;
  status: AssessmentStatus;
  questions: Question[];
  totalPoints: number;
  createdAt: Date;
  updatedAt: Date;
}

export class Assessment extends BaseEntity<IAssessmentProps> {
  private constructor(props: IAssessmentProps) {
    super(props);
  }

  public static create(props: IAssessmentProps): Result<Assessment, Error> {
    // Business rule validation
    if (props.questions.length > 50) {
      return failure(
        new Error("Cannot create an assessment with more than 50 questions.")
      );
    }

    const totalPointsFromQuestions = props.questions.reduce(
      (total, question) => total + question.props.points,
      0
    );
    if (totalPointsFromQuestions !== props.totalPoints) {
      // return failure(new Error('Total points do not match sum of question points.'));
    }

    return success(new Assessment(props));
  }

  public addQuestion(question: Question): void {
    this.props.questions.push(question);
    this.props.totalPoints += question.props.points;
    this.props.updatedAt = new Date();
  }

  public removeQuestion(questionId: QuestionId): void {
    const questionToRemove = this.props.questions.find((q) =>
      (q as any).id.equals(questionId)
    );
    if (questionToRemove) {
      this.props.totalPoints -= questionToRemove.props.points;
      this.props.questions = this.props.questions.filter(
        (q) => !(q as any).id.equals(questionId)
      );
      this.props.updatedAt = new Date();
    }
  }

  public publish(): Result<void, Error> {
    if (this.props.questions.length === 0) {
      return failure(
        new Error("Cannot publish an assessment with no questions.")
      );
    }
    this.props.status = "published";
    this.props.updatedAt = new Date();
    return success(undefined);
  }

  public archive(): void {
    this.props.status = "archived";
  }
}
