import { Result } from "@/shared/types/common";
import { Assessment } from "../aggregates/assessment.aggregate";
import { AssessmentId } from "../value-objects/assessment-id.value-object";
import { UserId } from "@/shared/types/branded-types";
import { AssessmentStatus } from "../aggregates/assessment.aggregate";
import { Submission } from '../entities/submission.entity';

/**
 * Assessment Repository Interface
 *
 * Defines the contract for Assessment aggregate persistence.
 * Follows Clean Architecture principles - domain defines interface,
 * infrastructure provides implementation.
 *
 * All data access for child entities (Question, Submission) should go through the Assessment aggregate.
 */
export abstract class IAssessmentRepository {
  abstract save(assessment: Assessment): Promise<Result<void, Error>>;
  abstract findById(id: AssessmentId): Promise<Result<Assessment | null, Error>>;
  abstract findByCreatorId(creatorId: UserId): Promise<Result<Assessment[], Error>>;
  abstract findByStatus(status: AssessmentStatus): Promise<Result<Assessment[], Error>>;
  abstract delete(id: AssessmentId): Promise<Result<void, Error>>;
  abstract findSubmissionsByStudentId(studentId: UserId): Promise<Result<Submission[], Error>>;
  abstract findSubmission(assessmentId: AssessmentId, studentId: UserId): Promise<Result<Submission | null, Error>>;
} 