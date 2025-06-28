import { Assessment, IAssessmentProps } from '../../domain/aggregates/assessment.aggregate';
import { IAssessmentRepository } from '../../domain/repositories/assessment.repository';
import { Submission, ISubmissionProps } from '@/bounded-contexts/assessment/domain/entities/submission.entity';
import { AssessmentId, createAssessmentId } from '../../domain/value-objects/assessment-id.value-object';
import { Result, success, failure } from '@/shared/errors';
import {
  mcp_supabase_execute_sql,
} from '@/shared/mcp/supabase-client';
import { UserId, createUserId } from '@/shared/types/branded-types';
import { RepositoryError } from '@/shared/errors/repository.error';
import { SupabaseProjectId } from '@/shared/types/branded-types';
import { IQuestionProps, Question } from '../../domain/entities/question.entity';
import { cuid } from '@/shared/utils/cuid';

export class McpSupabaseAssessmentRepository extends IAssessmentRepository {
  constructor(private readonly projectId: SupabaseProjectId) {
    super();
  }

  async save(
    assessment: Assessment,
  ): Promise<Result<void, RepositoryError>> {
    try {
      // 1. Save Assessment Aggregate Root
      const assessmentProps = assessment.getProps();
      const assessmentQuery = `
        INSERT INTO assessment.assessments (id, title, description, created_by)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (id) DO UPDATE SET
          title = EXCLUDED.title,
          description = EXCLUDED.description;
      `;
      // NOTE: Parameters are placeholders. The MCP tool should handle parameter binding.
      await mcp_supabase_execute_sql({
        query: assessmentQuery,
        // params: [assessmentProps.id, assessmentProps.title, assessmentProps.description, assessmentProps.createdBy],
      });

      // 2. Save Questions
      const questions = assessment.getQuestions();
      if (questions && questions.length > 0) {
        const questionValues = questions.map(q => {
          const props = q.getProps();
          // Assuming cuid() generates the ID if not present
          const id = props.id || cuid(); 
          return `('${id}', '${assessment.id}', '${props.text.replace(/'/g, "''")}', '${JSON.stringify(props.options).replace(/'/g, "''")}', '${props.correct_option}')`;
        }).join(',');

        const questionQuery = `
          INSERT INTO assessment.questions (id, assessment_id, text, options, correct_option)
          VALUES ${questionValues}
          ON CONFLICT (id) DO UPDATE SET
            text = EXCLUDED.text,
            options = EXCLUDED.options,
            correct_option = EXCLUDED.correct_option;
        `;
        await mcp_supabase_execute_sql({ query: questionQuery });
      }

      return success(undefined);
    } catch (error: any) {
      return failure(
        new RepositoryError("Failed to save assessment", error),
      );
    }
  }

  async findById(
    id: AssessmentId,
  ): Promise<Result<Assessment | null, RepositoryError>> {
    try {
      const { data, error } = await mcp_supabase_execute_sql({
        // TEMPORARY: using template literal for now. Should be refactored to use a client that supports parameterized queries.
        query: `
          SELECT a.*, q.questions
          FROM assessment.assessments a
          LEFT JOIN (
            SELECT assessment_id, json_agg(questions.*) as questions
            FROM assessment.questions
            GROUP BY assessment_id
          ) q ON a.id = q.assessment_id
          WHERE a.id = '${id}'
        `,
        project_id: this.projectId,
      });

      if (error) {
        return failure(new RepositoryError('Failed to fetch assessment by ID', error));
      }

      if (!data || data.length === 0) {
        return success(null);
      }

      const row = data[0];
      const questionProps = (row.questions || []).map((q: any) => ({
          ...q,
          options: q.options || [],
      })) as IQuestionProps[];
      
      const questionsResults = questionProps.map(q => Question.create(q));
      const successfulQuestions = questionsResults
        .filter((r): r is { success: true; data: Question } => r.success)
        .map(r => r.data);
      
      if (successfulQuestions.length !== questionsResults.length) {
        return failure(new RepositoryError('Failed to create some question entities'));
      }

      const assessmentProps: IAssessmentProps = {
        id: createAssessmentId(row.id),
        creatorId: createUserId(row.creator_id),
        title: row.title,
        description: row.description,
        status: row.status,
        totalPoints: row.total_points,
        questions: successfulQuestions,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
      };

      const assessmentCreateResult = Assessment.create({ ...assessmentProps });
      if(!assessmentCreateResult.success) {
        return failure(new RepositoryError('Failed to create assessment aggregate', assessmentCreateResult.error));
      }

      return success(assessmentCreateResult.data);

    } catch (err) {
      return failure(new RepositoryError('An unexpected error occurred', err as Error));
    }
  }

  async findByCreatorId(creatorId: UserId): Promise<Result<Assessment[], RepositoryError>> {
    return failure(new RepositoryError('Not implemented'));
  }
  
  async findByStatus(status: "draft" | "published" | "archived"): Promise<Result<Assessment[], RepositoryError>> {
    return failure(new RepositoryError('Not implemented'));
  }

  async delete(id: AssessmentId): Promise<Result<void, RepositoryError>> {
    return failure(new RepositoryError('Not implemented'));
  }

  async findSubmissionsByStudentId(
    studentId: UserId,
  ): Promise<Result<Submission[], RepositoryError>> {
    return failure(new RepositoryError('Not implemented'));
  }

  async findSubmission(
    assessmentId: AssessmentId,
    studentId: UserId,
  ): Promise<Result<Submission | null, RepositoryError>> {
     try {
      const { data, error } = await mcp_supabase_execute_sql({
        // TEMPORARY: using template literal for now.
        query: `SELECT * FROM assessment.submissions WHERE assessment_id = '${assessmentId}' AND student_id = '${studentId}'`,
        project_id: this.projectId,
      });

      if (error) {
        return failure(new RepositoryError('Failed to fetch submission', error));
      }

      if (!data || data.length === 0) {
        return success(null);
      }
      
      const row = data[0];
      const submissionProps: ISubmissionProps = {
        id: row.id,
        assessmentId: createAssessmentId(row.assessment_id),
        studentId: createUserId(row.student_id),
        status: row.status,
        answers: row.answers || [],
        finalScore: row.final_score,
        startedAt: new Date(row.started_at),
        submittedAt: row.submitted_at ? new Date(row.submitted_at) : undefined,
        timeSpent: row.time_spent,
        updatedAt: new Date(row.updated_at),
      };
      
      const submissionCreateResult = Submission.create({ ...submissionProps });
      if(!submissionCreateResult.success) {
        return failure(new RepositoryError('Failed to create submission entity', submissionCreateResult.error));
      }
      
      return success(submissionCreateResult.data);
    } catch (err) {
      return failure(new RepositoryError('An unexpected error occurred', err as Error));
    }
  }
}