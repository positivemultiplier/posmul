import { BaseEntity } from "@/shared/domain/base-entity";
import { Result, success } from "@/shared/types/common";
import {
  SolutionTemplateId,
  createSolutionTemplateId,
} from "../value-objects/solution-template-id.value-object";
import { QuestionType } from "./question.entity";

export interface ISolutionTemplateProps {
  id: SolutionTemplateId;
  name: string;
  questionType: QuestionType;
  template: object; // JSONB에 저장될 템플릿 구조
  createdAt: Date;
  updatedAt: Date;
}

export class SolutionTemplate extends BaseEntity<ISolutionTemplateProps> {
  private constructor(props: ISolutionTemplateProps) {
    super(props);
  }

  public static create(
    props: Omit<ISolutionTemplateProps, "id" | "createdAt" | "updatedAt">
  ): Result<SolutionTemplate, Error> {
    const now = new Date();
    const solutionTemplate = new SolutionTemplate({
      ...props,
      id: createSolutionTemplateId(),
      createdAt: now,
      updatedAt: now,
    });
    return success(solutionTemplate);
  }

  public update(
    props: Partial<Omit<ISolutionTemplateProps, "id" | "createdAt">>
  ): void {
    Object.assign(this.props, props);
    this.props.updatedAt = new Date();
  }
} 