import { createId as cuid } from "@paralleldrive/cuid2";

/**
 * QuestionId: 질문(Question)의 고유 식별자
 * - Brand<string, "QuestionId"> 타입을 사용하여 다른 ID와 구별
 */
export type QuestionId = string & { readonly brand: "QuestionId" };

/**
 * createQuestionId: 새로운 QuestionId를 생성합니다.
 * @returns {QuestionId}
 */
export const createQuestionId = (): QuestionId => {
  return cuid() as QuestionId;
}; 