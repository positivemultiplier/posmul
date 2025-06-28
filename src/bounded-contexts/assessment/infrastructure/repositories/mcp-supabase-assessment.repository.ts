/**
 * @file mcp-supabase-assessment.repository.ts
 * @description MCP-based Supabase implementation of the assessment repository.
 * This class uses mcp_supabase_execute_sql to interact with the database,
 * fulfilling the contract defined by IAssessmentRepository in the domain layer.
 */
import { IAssessmentRepository, AssessmentStats, StudentProgress } from '../../domain/repositories/assessment.repository';
import { Assessment, AssessmentId, AssessmentStatus, Question, QuestionId, Submission, SubmissionId } from '../../domain/entities/assessment.entity';
import { mcp_supabase_execute_sql } from '@/shared/mcp/supabase-client';
import { Result, success, failure, RepositoryError } from '@/shared/errors';
import { SupabaseProjectService } from '@/shared/mcp/supabase-project.service';

// A simple type guard to check if an object has the basic shape of assessment data
function isRawAssessment(data: any): data is any {
    return data && typeof data.id === 'string' && typeof data.title === 'string';
}

export class McpSupabaseAssessmentRepository implements IAssessmentRepository {
  private readonly projectId: string;

  constructor() {
    this.projectId = SupabaseProjectService.getInstance().getProjectId();
  }
  
  async findById(id: AssessmentId): Promise<Result<Assessment | null, RepositoryError>> {
    try {
      const { data, error } = await mcp_supabase_execute_sql({
        project_id: this.projectId,
        query: `SELECT * FROM "assessment".assessments WHERE id = '${id}' LIMIT 1`,
      });

      if (error) {
        return failure(new RepositoryError('Failed to fetch assessment by ID.', error as Error));
      }
      
      if (!data || data.length === 0) {
        return success(null);
      }
      
      const rawData = data[0];
      if (!isRawAssessment(rawData)) {
        return failure(new RepositoryError('Fetched data is not a valid Assessment.'));
      }

      const assessmentResult = Assessment.create(rawData);
      if (!assessmentResult.success) {
        return failure(new RepositoryError('Failed to create Assessment entity from raw data.', assessmentResult.error));
      }
      return success(assessmentResult.data);

    } catch (e) {
      return failure(new RepositoryError('Unexpected error fetching assessment by ID.', e as Error));
    }
  }

  async findSubmissionsByStudentId(studentId: string): Promise<Result<Submission[], RepositoryError>> {
    try {
        const { data, error } = await mcp_supabase_execute_sql({
            project_id: this.projectId,
            query: `SELECT * FROM "assessment".submissions WHERE student_id = '${studentId}'`,
        });

        if (error) {
            return failure(new RepositoryError('Failed to fetch submissions by student ID.', error as Error));
        }

        if (!data) {
          return success([]);
        }
        
        const submissions = data
            .map((row: any) => Submission.create(row))
            .filter(result => result.success)
            .map(result => result.data as Submission);

        return success(submissions);

    } catch (e) {
        return failure(new RepositoryError('Unexpected error fetching submissions.', e as Error));
    }
  }

  // NOTE: Other IAssessmentRepository methods need to be implemented here.
  async findSubmissionsByQuestionId(questionId: QuestionId): Promise<Result<Submission[], RepositoryError>> { throw new Error('Not implemented'); }
  async save(assessment: Assessment): Promise<Result<void, RepositoryError>> { throw new Error('Not implemented'); }
  async findByCreatorId(creatorId: string): Promise<Result<Assessment[], RepositoryError>> { throw new Error('Not implemented'); }
  async findByStatus(status: AssessmentStatus): Promise<Result<Assessment[], RepositoryError>> { throw new Error('Not implemented'); }
  async findAll(): Promise<Result<Assessment[], RepositoryError>> { throw new Error('Not implemented'); }
  async delete(id: AssessmentId): Promise<Result<void, RepositoryError>> { throw new Error('Not implemented'); }
  async saveQuestion(question: Question, assessmentId: AssessmentId): Promise<Result<void, RepositoryError>> { throw new Error('Not implemented'); }
  async findQuestionById(id: QuestionId): Promise<Result<Question | null, RepositoryError>> { throw new Error('Not implemented'); }
  async findQuestionsByAssessmentId(assessmentId: AssessmentId): Promise<Result<Question[], RepositoryError>> { throw new Error('Not implemented'); }
  async deleteQuestion(id: QuestionId): Promise<Result<void, RepositoryError>> { throw new Error('Not implemented'); }
  async saveSubmission(submission: Submission): Promise<Result<void, RepositoryError>> { throw new Error('Not implemented'); }
  async findSubmissionById(id: SubmissionId): Promise<Result<Submission | null, RepositoryError>> { throw new Error('Not implemented'); }
  async findSubmissionsByAssessmentId(assessmentId: AssessmentId): Promise<Result<Submission[], RepositoryError>> { throw new Error('Not implemented'); }
  async getAssessmentStats(assessmentId: AssessmentId): Promise<Result<AssessmentStats, RepositoryError>> { throw new Error('Not implemented'); }
  async getStudentProgress(studentId: string, assessmentId: AssessmentId): Promise<Result<StudentProgress, RepositoryError>> { throw new Error('Not implemented'); }
} 