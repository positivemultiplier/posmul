import { createId as cuid } from "@paralleldrive/cuid2";

/**
 * AssessmentId: 평가(Assessment)의 고유 식별자
 * - Brand<string, "AssessmentId"> 타입을 사용하여 다른 ID와 구별
 */
export type AssessmentId = string & { readonly brand: "AssessmentId" };

/**
 * createAssessmentId: 새로운 AssessmentId를 생성합니다.
 * @returns {AssessmentId}
 */
export const createAssessmentId = (): AssessmentId => {
  return cuid() as AssessmentId;
}; 