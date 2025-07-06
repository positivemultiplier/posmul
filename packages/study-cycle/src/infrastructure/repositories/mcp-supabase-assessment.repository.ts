/**
 * @file mcp-supabase-assessment.repository.ts
 * @description MCP-based Supabase implementation of the assessment repository.
 * This class uses mcp_supabase_execute_sql to interact with the database,
 * fulfilling the contract defined by IAssessmentRepository in the domain layer.
 */
import {
  SupabaseProjectService,
  mcp_supabase_execute_sql,
} from "@posmul/shared-auth";
import {
  RepositoryError,
  Result,
  UserId,
  failure,
  success,
} from "@posmul/shared-types";
import {
  Assessment,
  AssessmentId,
  AssessmentStatus,
  Question,
  Submission,
  SubmissionId,
} from "../../domain/entities/assessment.entity";
import {
  AssessmentStats,
  IAssessmentRepository,
  StudentProgress,
} from "../../domain/repositories/assessment.repository";
import { QuestionId } from "../../domain/value-objects/question-id.value-object";

// A simple type guard to check if an object has the basic shape of assessment data
function isRawAssessment(data: any): data is any {
  return data && typeof data.id === "string" && typeof data.title === "string";
}

export class McpSupabaseAssessmentRepository implements IAssessmentRepository {
  private readonly projectId: string;

  constructor() {
    this.projectId = SupabaseProjectService.getInstance().getProjectId();
  }

  async findById(
    id: AssessmentId
  ): Promise<Result<Assessment | null, RepositoryError>> {
    try {
      const { data, error } = await mcp_supabase_execute_sql({
        project_id: this.projectId,
        query: `SELECT * FROM "assessment".assessments WHERE id = '${id}' LIMIT 1`,
      });

      if (error) {
        return failure(
          new RepositoryError(
            "Failed to fetch assessment by ID.",
            error as Error
          )
        );
      }

      if (!data || data.length === 0) {
        return success(null);
      }

      const rawData = data[0];
      if (!isRawAssessment(rawData)) {
        return failure(
          new RepositoryError("Fetched data is not a valid Assessment.")
        );
      }

      const assessmentResult = Assessment.create(rawData);
      if (!assessmentResult.success) {
        return failure(
          new RepositoryError(
            "Failed to create Assessment entity from raw data.",
            assessmentResult.error
          )
        );
      }
      return success(assessmentResult.data);
    } catch (e) {
      return failure(
        new RepositoryError(
          "Unexpected error fetching assessment by ID.",
          e as Error
        )
      );
    }
  }

  async findSubmissionsByStudentId(
    studentId: string
  ): Promise<Result<Submission[], RepositoryError>> {
    try {
      const { data, error } = await mcp_supabase_execute_sql({
        project_id: this.projectId,
        query: `SELECT * FROM "assessment".submissions WHERE student_id = '${studentId}'`,
      });

      if (error) {
        return failure(
          new RepositoryError(
            "Failed to fetch submissions by student ID.",
            error as Error
          )
        );
      }

      if (!data) {
        return success([]);
      }

      const submissions = data
        .map((row: any) => Submission.create(row))
        .filter((result: any) => result.success)
        .map((result: any) => result.data as Submission);

      return success(submissions);
    } catch (e) {
      return failure(
        new RepositoryError(
          "Unexpected error fetching submissions.",
          e as Error
        )
      );
    }
  }

  // NOTE: Other IAssessmentRepository methods need to be implemented here.
  async findSubmissionsByQuestionId(
    questionId: QuestionId
  ): Promise<Result<Submission[], RepositoryError>> {
    throw new Error("Not implemented");
  }
  async save(assessment: Assessment): Promise<Result<void, RepositoryError>> {
    throw new Error("Not implemented");
  }
  async findByCreatorId(
    creatorId: string
  ): Promise<Result<Assessment[], RepositoryError>> {
    throw new Error("Not implemented");
  }
  async findByStatus(
    status: AssessmentStatus
  ): Promise<Result<Assessment[], RepositoryError>> {
    throw new Error("Not implemented");
  }
  async findAll(): Promise<Result<Assessment[], RepositoryError>> {
    throw new Error("Not implemented");
  }
  async delete(id: AssessmentId): Promise<Result<void, RepositoryError>> {
    throw new Error("Not implemented");
  }
  async saveQuestion(
    question: Question,
    assessmentId: AssessmentId
  ): Promise<Result<void, RepositoryError>> {
    throw new Error("Not implemented");
  }
  async findQuestionById(
    id: QuestionId
  ): Promise<Result<Question | null, RepositoryError>> {
    throw new Error("Not implemented");
  }
  async findQuestionsByAssessmentId(
    assessmentId: AssessmentId
  ): Promise<Result<Question[], RepositoryError>> {
    throw new Error("Not implemented");
  }
  async deleteQuestion(id: QuestionId): Promise<Result<void, RepositoryError>> {
    throw new Error("Not implemented");
  }
  async saveSubmission(
    submission: Submission
  ): Promise<Result<void, RepositoryError>> {
    try {
      const { mcp_supabase_execute_sql } = await import("@posmul/shared-auth");

      await mcp_supabase_execute_sql({
        project_id: this.projectId,
        query: `INSERT INTO "assessment".submissions (assessment_id, student_id, answers, final_score, total_points, is_completed, started_at, submitted_at, created_at, updated_at) 
                VALUES ('${submission.assessmentId}', '${submission.studentId}', '${JSON.stringify(submission.answers)}', ${submission.finalScore}, ${submission.totalPoints}, ${submission.isCompleted}, '${submission.startedAt.toISOString()}', '${submission.submittedAt.toISOString()}', '${submission.createdAt.toISOString()}', '${submission.updatedAt.toISOString()}')`,
      });

      return success(undefined);
    } catch (error) {
      return failure(new RepositoryError("Submission 저장 실패", error));
    }
  }
  async findSubmissionById(
    id: SubmissionId
  ): Promise<Result<Submission | null, RepositoryError>> {
    throw new Error("Not implemented");
  }
  async findSubmissionsByAssessmentId(
    assessmentId: AssessmentId
  ): Promise<Result<Submission[], RepositoryError>> {
    throw new Error("Not implemented");
  }
  async getAssessmentStats(
    assessmentId: AssessmentId
  ): Promise<Result<AssessmentStats, RepositoryError>> {
    throw new Error("Not implemented");
  }
  async getStudentProgress(
    assessmentId: AssessmentId,
    studentId: UserId
  ): Promise<Result<StudentProgress | null, Error>> {
    throw new Error("Not implemented");
  }

  async findSubmission(
    assessmentId: AssessmentId,
    studentId: UserId
  ): Promise<Result<Submission | null, RepositoryError>> {
    // TODO: Implement proper submission finding logic
    return success(null);
  }
}
