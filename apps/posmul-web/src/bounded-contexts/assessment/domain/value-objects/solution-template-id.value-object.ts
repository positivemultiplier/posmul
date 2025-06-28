import { createId as cuid } from "@paralleldrive/cuid2";

/**
 * SolutionTemplateId: 풀이 템플릿(SolutionTemplate)의 고유 식별자
 */
export type SolutionTemplateId = string & { readonly brand: "SolutionTemplateId" };

/**
 * createSolutionTemplateId: 새로운 SolutionTemplateId를 생성합니다.
 */
export const createSolutionTemplateId = (): SolutionTemplateId => {
  return cuid() as SolutionTemplateId;
}; 