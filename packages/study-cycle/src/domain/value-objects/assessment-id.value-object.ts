/**
 * AssessmentId: 평가(Assessment)의 고유 식별자
 *
 * 이 파일은 entities/assessment.entity.ts에서 정의된 AssessmentId와 관련 함수들을 re-export합니다.
 * DDD 아키텍처의 일관성을 위해 entities가 메인 소스가 되고, value-objects에서는 참조만 제공합니다.
 */

// DEPRECATED: Use types/functions from '../entities/assessment.entity.ts' directly.
// This file is kept for migration reference only and will be removed soon.

// entities/assessment.entity.ts에서 re-export
export type {
  Assessment,
  AssessmentId,
  AssessmentStatus,
  Question,
  Submission,
  SubmissionId,
} from "../entities/assessment.entity";

export {
  createAssessmentId,
  createSubmissionId,
} from "../entities/assessment.entity";
