import { BaseEntity, Result, success } from "@posmul/shared-types";
import { AssessmentId } from "../value-objects/assessment-id.value-object";
import {
  QuestionId,
  createQuestionId,
} from "../value-objects/question-id.value-object";
import { SolutionTemplateId } from "../value-objects/solution-template-id.value-object";
import { QuestionType } from "./assessment.entity.js";

export interface QuestionOption {
  id: string;
  text: string;
  isCorrect: boolean;
  explanation?: string;
}

export interface IQuestionProps {
  id: QuestionId;
  assessmentId: AssessmentId;
  type: QuestionType;
  content: string;
  options?: any[]; // multiple-choice의 경우 사용
  answer: any;
  score: number;
  solutionTemplateId?: SolutionTemplateId;
  createdAt: Date;
  updatedAt: Date;
  title: string;
  correctAnswer: any;
  points: number;
}

export class Question extends BaseEntity<IQuestionProps> {
  private constructor(props: IQuestionProps) {
    super(props);
  }

  public static create(
    props: Omit<IQuestionProps, "id" | "createdAt" | "updatedAt">
  ): Result<Question, Error> {
    const now = new Date();
    const question = new Question({
      ...props,
      id: createQuestionId(),
      createdAt: now,
      updatedAt: now,
    });
    return success(question);
  }

  public update(
    props: Partial<Omit<IQuestionProps, "id" | "createdAt">>
  ): void {
    Object.assign(this.props, props);
    this.props.updatedAt = new Date();
  }

  public checkAnswer(submittedAnswer: any): boolean {
    // TODO: 복잡한 채점 로직은 AutoGradingService로 이동
    return this.props.answer === submittedAnswer;
  }
}
