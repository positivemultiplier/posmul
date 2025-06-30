import {
  BaseEntity,
  BusinessRuleError,
  Result,
  ValidationError,
  failure,
  success,
} from "@posmul/shared-types";

export type TextbookId = string & { readonly __brand: "TextbookId" };

// Chapter 타입이 아직 없으므로 임시로 unknown 사용하고, 외부에서 참조할 수 있도록 export 합니다.
export type Chapter = unknown;

export interface ITextbookProps {
  id: TextbookId;
  creatorId: string;
  title: string;
  chapters: Chapter[];
  createdAt: Date;
  updatedAt: Date;
}

export class Textbook extends BaseEntity<ITextbookProps> {
  private constructor(props: ITextbookProps) {
    super(props);
  }

  public static create(
    props: Omit<ITextbookProps, "id" | "createdAt" | "updatedAt" | "chapters">,
    id?: TextbookId
  ): Result<Textbook, ValidationError> {
    const textbookProps: ITextbookProps = {
      id: (id || crypto.randomUUID()) as TextbookId,
      ...props,
      chapters: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    return success(new Textbook(textbookProps));
  }

  public static fromPersistence(props: ITextbookProps): Textbook {
    return new Textbook(props);
  }

  public addChapter(chapter: Chapter): Result<void, BusinessRuleError> {
    this.props.chapters.push(chapter);
    this.touch();
    return success(undefined);
  }

  public removeChapter(): Result<void, BusinessRuleError> {
    // FIXME: Implement proper removal logic based on a chapter identifier
    return failure(new BusinessRuleError("Remove chapter is not implemented."));
  }

  // —— Getter ——
  get id(): TextbookId {
    return this.props.id;
  }

  get creatorId(): string {
    return this.props.creatorId;
  }

  get title(): string {
    return this.props.title;
  }

  get chapters(): Chapter[] {
    // 불변성 보장을 위해 복사본 반환
    return [...this.props.chapters];
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }
}
