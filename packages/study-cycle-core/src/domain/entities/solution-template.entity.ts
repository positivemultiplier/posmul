import { BaseEntity, Result, success } from "@posmul/shared-types";
import {
  SolutionTemplateId,
  createSolutionTemplateId,
} from "../value-objects/solution-template-id.value-object";
import { QuestionType } from "./assessment.entity";

// Re-export for convenience
export { createSolutionTemplateId };
export type { SolutionTemplateId };

export interface ISolutionTemplateProps {
  id: SolutionTemplateId;
  name: string; // Repository에서는 title로 매핑됨
  questionType: QuestionType;
  templateType: TemplateType;
  template: object; // JSONB에 저장될 템플릿 구조
  content?: string; // 템플릿 문자열 내용
  variables?: Record<string, unknown>; // 템플릿에서 사용하는 변수들
  isActive?: boolean; // 활성화 상태
  version?: number; // 버전 정보
  createdAt: Date;
  updatedAt: Date;
}

// Template 종류를 명확히 구분하기 위한 Enum (필요 시 확장 가능)
export enum TemplateType {
  BASIC = "BASIC", // 기본형 템플릿
  ADVANCED = "ADVANCED", // 고급형 템플릿 (조건/루프 등 포함)
  CUSTOM = "CUSTOM", // 사용자 정의 템플릿
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

  public static reconstitute(
    props: ISolutionTemplateProps,
    id: SolutionTemplateId
  ): SolutionTemplate {
    return new SolutionTemplate({ ...props, id });
  }

  public update(
    props: Partial<Omit<ISolutionTemplateProps, "id" | "createdAt">>
  ): void {
    Object.assign(this.props, props);
    this.props.updatedAt = new Date();
  }

  // —— Getter 및 헬퍼 ——
  get id(): SolutionTemplateId {
    return this.props.id;
  }

  get name(): string {
    return this.props.name;
  }

  // Repository 호환성을 위한 title getter (name의 alias)
  get title(): string {
    return this.props.name;
  }

  get questionType(): QuestionType {
    return this.props.questionType;
  }

  get templateType(): TemplateType {
    return this.props.templateType;
  }

  /**
   * 템플릿 JSON 오브젝트 (render 시 문자열 변환 필요)
   */
  get template(): object {
    return this.props.template;
  }

  /**
   * 템플릿 문자열 내용
   */
  get content(): string {
    // template 프로퍼티가 문자열이면 그대로 반환, 객체면 JSON 문자열로 변환
    if (typeof this.props.template === "string") {
      return this.props.template;
    }
    return this.props.content || JSON.stringify(this.props.template);
  }

  /**
   * 템플릿 변수들
   */
  get variables(): Record<string, unknown> {
    return this.props.variables || {};
  }

  /**
   * 활성화 상태
   */
  get isActive(): boolean {
    return this.props.isActive ?? true;
  }

  /**
   * 버전 정보
   */
  get version(): number {
    return this.props.version || 1;
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
  public getProps(): Readonly<ISolutionTemplateProps> {
    return { ...this.props };
  }
}
