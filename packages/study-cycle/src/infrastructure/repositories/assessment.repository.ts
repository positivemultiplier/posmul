import { mcp_supabase_execute_sql } from "@posmul/shared-auth";
import {
  RepositoryError,
  Result,
  SupabaseProjectId,
  UserId,
  createUserId,
  failure,
  success,
} from "@posmul/shared-types";
import {
  Assessment,
  AssessmentId,
  AssessmentStatus,
  IAssessmentProps,
  IQuestionProps,
  ISubmissionProps,
  Question,
  Submission,
  SubmissionId,
  createAssessmentId,
} from "../../domain/entities/assessment.entity";
import {
  AssessmentStats,
  IAssessmentRepository,
  QuestionStats,
  StudentProgress,
} from "../../domain/repositories/assessment.repository";

export class McpSupabaseAssessmentRepository extends IAssessmentRepository {
  constructor(private readonly projectId: SupabaseProjectId) {
    super();
  }

  async save(assessment: Assessment): Promise<Result<void, RepositoryError>> {
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
        project_id: "fabyagohqqnusmnwekuc",
        // params: [assessmentProps.id, assessmentProps.title, assessmentProps.description, assessmentProps.createdBy],
      });

      // 2. Save Questions
      const questions = assessment.getQuestions();
      if (questions && questions.length > 0) {
        const questionValues = questions
          .map((q) => {
            const props = q.getProps();
            // Question은 _id getter를 통해 ID에 접근
            const id = q.id;
            return `('${id}', '${assessment.id}', '${props.content.replace(/'/g, "''")}', '${JSON.stringify(props.options).replace(/'/g, "''")}', '${props.correctAnswer || ""}')`;
          })
          .join(",");

        const questionQuery = `
          INSERT INTO assessment.questions (id, assessment_id, content, options, correct_answer)
          VALUES ${questionValues}
          ON CONFLICT (id) DO UPDATE SET
            content = EXCLUDED.content,
            options = EXCLUDED.options,
            correct_answer = EXCLUDED.correct_answer;
        `;
        await mcp_supabase_execute_sql({
          query: questionQuery,
          project_id: "fabyagohqqnusmnwekuc",
        });
      }

      return success(undefined);
    } catch (error: any) {
      return failure(new RepositoryError("Failed to save assessment", error));
    }
  }

  async findById(
    id: AssessmentId
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
        return failure(
          new RepositoryError("Failed to fetch assessment by ID", error)
        );
      }

      if (!data || data.length === 0) {
        return success(null);
      }

      const row = data[0];
      const questionProps = (row.questions || []).map((q: any) => ({
        ...q,
        options: q.options || [],
      })) as IQuestionProps[];

      const questionsResults = questionProps.map((q) => Question.create(q));
      const successfulQuestions = questionsResults
        .filter((r): r is { success: true; data: Question } => r.success)
        .map((r) => r.data);

      if (successfulQuestions.length !== questionsResults.length) {
        return failure(
          new RepositoryError("Failed to create some question entities")
        );
      }

      const assessmentProps: IAssessmentProps = {
        id: createAssessmentId(),
        creatorId: createUserId(row.creator_id),
        title: row.title,
        description: row.description,
        status: row.status,
        totalPoints: row.total_points,
        questions: successfulQuestions,
        allowedAttempts: row.allowed_attempts || 3,
        passingScore: row.passing_score || 60,
        isRandomized: row.is_randomized || false,
        showResults: row.show_results !== false,
        timeLimit: row.time_limit,
        startDate: row.start_date ? new Date(row.start_date) : undefined,
        endDate: row.end_date ? new Date(row.end_date) : undefined,
        settings: {
          shuffleQuestions: row.shuffle_questions || false,
          shuffleOptions: row.shuffle_options || false,
          allowBackNavigation: row.allow_back_navigation !== false,
          showProgressBar: row.show_progress_bar !== false,
          requireFullscreen: row.require_fullscreen || false,
          preventCopyPaste: row.prevent_copy_paste || false,
          recordingEnabled: row.recording_enabled || false,
        },
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
      };

      const assessmentCreateResult = Assessment.create({ ...assessmentProps });
      if (!assessmentCreateResult.success) {
        return failure(
          new RepositoryError(
            "Failed to create assessment aggregate",
            assessmentCreateResult.error
          )
        );
      }

      return success(assessmentCreateResult.data);
    } catch (err) {
      return failure(
        new RepositoryError("An unexpected error occurred", err as Error)
      );
    }
  }

  async findByCreatorId(
    creatorId: UserId
  ): Promise<Result<Assessment[], RepositoryError>> {
    return failure(new RepositoryError("Not implemented"));
  }

  async findByStatus(
    status: AssessmentStatus
  ): Promise<Result<Assessment[], RepositoryError>> {
    return failure(new RepositoryError("Not implemented"));
  }

  async delete(id: AssessmentId): Promise<Result<void, RepositoryError>> {
    return failure(new RepositoryError("Not implemented"));
  }

  async findSubmissionsByStudentId(
    studentId: UserId
  ): Promise<Result<Submission[], RepositoryError>> {
    return failure(new RepositoryError("Not implemented"));
  }

  async findSubmission(
    assessmentId: AssessmentId,
    studentId: UserId
  ): Promise<Result<Submission | null, RepositoryError>> {
    try {
      const { data, error } = await mcp_supabase_execute_sql({
        // TEMPORARY: using template literal for now.
        query: `SELECT * FROM assessment.submissions WHERE assessment_id = '${assessmentId}' AND student_id = '${studentId}'`,
        project_id: this.projectId,
      });

      if (error) {
        return failure(
          new RepositoryError("Failed to fetch submission", error)
        );
      }

      if (!data || data.length === 0) {
        return success(null);
      }

      const row = data[0];
      const submissionProps: ISubmissionProps = {
        assessmentId: createAssessmentId(),
        studentId: createUserId(row.student_id),
        answers: row.answers || [],
        finalScore: row.final_score,
        totalPoints: row.total_points || 0,
        isCompleted: row.is_completed || false,
        startedAt: new Date(row.started_at),
        submittedAt: row.submitted_at ? new Date(row.submitted_at) : new Date(),
        timeSpent: row.time_spent,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
      };

      const submissionCreateResult = Submission.reconstitute(
        submissionProps,
        row.id as SubmissionId
      );
      return success(submissionCreateResult);
    } catch (err) {
      return failure(
        new RepositoryError("An unexpected error occurred", err as Error)
      );
    }
  }

  async saveSubmission(
    submission: Submission
  ): Promise<Result<void, RepositoryError>> {
    try {
      const props = submission.getProps();
      const query = `
        INSERT INTO assessment.submissions (
          id, assessment_id, student_id, answers, final_score, total_points,
          is_completed, started_at, submitted_at, time_spent, created_at, updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        ON CONFLICT (id) DO UPDATE SET
          answers = EXCLUDED.answers,
          final_score = EXCLUDED.final_score,
          is_completed = EXCLUDED.is_completed,
          submitted_at = EXCLUDED.submitted_at,
          time_spent = EXCLUDED.time_spent,
          updated_at = EXCLUDED.updated_at;
      `;

      await mcp_supabase_execute_sql({
        query: query,
        project_id: this.projectId,
      });

      return success(undefined);
    } catch (error: any) {
      return failure(new RepositoryError("Failed to save submission", error));
    }
  }

  // Optional methods implementation
  async getAssessmentStats(
    assessmentId: AssessmentId
  ): Promise<Result<AssessmentStats, Error>> {
    return failure(new Error("getAssessmentStats not implemented"));
  }

  async getQuestionStats(
    assessmentId: AssessmentId
  ): Promise<Result<QuestionStats[], Error>> {
    return failure(new Error("getQuestionStats not implemented"));
  }

  async getStudentProgress(
    assessmentId: AssessmentId,
    studentId: UserId
  ): Promise<Result<StudentProgress | null, Error>> {
    return failure(new Error("getStudentProgress not implemented"));
  }
}
