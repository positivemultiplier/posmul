/**
 * MCP-based Assessment Repository Implementation
 *
 * Implements Assessment repository using Supabase MCP for all database operations.
 * Follows PosMul's MCP-first development principles and Clean Architecture.
 */

import {
  Result,
  UserId,
  failure,
  isFailure,
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
  QuestionType,
  Submission,
  SubmissionId,
} from "../../domain/entities/assessment.entity";
import {
  AssessmentStats,
  IAssessmentRepository,
  QuestionStats,
  StudentProgress,
} from "../../domain/repositories/assessment.repository";
import { QuestionId } from "../../domain/value-objects/question-id.value-object";

/**
 * Database row interfaces for mapping
 */
interface AssessmentRow {
  id: string;
  title: string;
  description: string;
  status: string;
  creator_id: string;
  total_points: number;
  time_limit?: number;
  start_date?: string;
  end_date?: string;
  allowed_attempts: number;
  passing_score: number;
  is_randomized: boolean;
  show_results: boolean;
  settings: any;
  created_at: string;
  updated_at: string;
}

interface QuestionRow {
  id: string;
  assessment_id: string;
  template_id: string;
  type: string;
  title: string;
  content: string;
  points: number;
  options?: any;
  correct_answer?: string;
  grading_criteria?: string;
  time_limit?: number;
  difficulty: string;
  tags: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface SubmissionRow {
  id: string;
  assessment_id: string;
  student_id: string;
  answers: any;
  final_score: number;
  total_points: number;
  is_completed: boolean;
  started_at: string;
  submitted_at: string;
  time_spent?: number;
  created_at: string;
  updated_at: string;
  // Legacy fields for backward compatibility
  question_id?: string;
  answer?: any;
  grading_status?: string;
  score?: number;
  feedback?: string;
  metadata?: any;
}

// Define RepositoryError locally if not available
class RepositoryError extends Error {
  constructor(message: string, cause?: any) {
    super(message);
    this.name = "RepositoryError";
    this.cause = cause;
  }
}

export class McpAssessmentRepository implements IAssessmentRepository {
  constructor(private readonly projectId: string) {}

  private escapeSql(value: string | undefined | null): string {
    if (value === null || typeof value === "undefined") return "''";
    return value.replace(/'/g, "''");
  }

  // Assessment operations
  async save(assessment: Assessment): Promise<Result<void, RepositoryError>> {
    try {
      const assessmentData = this.mapAssessmentToRow(assessment);
      const { mcp_supabase_execute_sql } = await import("@posmul/shared-auth");

      const query = `
        INSERT INTO assessments (
          id, title, description, status, creator_id, total_points,
          time_limit, start_date, end_date, allowed_attempts, passing_score,
          is_randomized, show_results, settings, created_at, updated_at
        )
        VALUES (
          '${assessmentData.id}', 
          '${this.escapeSql(assessmentData.title)}', 
          '${this.escapeSql(assessmentData.description)}', 
          '${assessmentData.status}', 
          '${assessmentData.creator_id}', 
          ${assessmentData.total_points},
          ${assessmentData.time_limit ?? "NULL"}, 
          ${assessmentData.start_date ? `'${assessmentData.start_date}'` : "NULL"}, 
          ${assessmentData.end_date ? `'${assessmentData.end_date}'` : "NULL"}, 
          ${assessmentData.allowed_attempts}, 
          ${assessmentData.passing_score},
          ${assessmentData.is_randomized}, 
          ${assessmentData.show_results}, 
          '${this.escapeSql(JSON.stringify(assessmentData.settings))}', 
          '${assessmentData.created_at}', 
          '${assessmentData.updated_at}'
        )
        ON CONFLICT (id) DO UPDATE SET
          title = EXCLUDED.title,
          description = EXCLUDED.description,
          status = EXCLUDED.status,
          total_points = EXCLUDED.total_points,
          time_limit = EXCLUDED.time_limit,
          start_date = EXCLUDED.start_date,
          end_date = EXCLUDED.end_date,
          allowed_attempts = EXCLUDED.allowed_attempts,
          passing_score = EXCLUDED.passing_score,
          is_randomized = EXCLUDED.is_randomized,
          show_results = EXCLUDED.show_results,
          settings = EXCLUDED.settings,
          updated_at = EXCLUDED.updated_at
      `;

      await mcp_supabase_execute_sql({
        project_id: this.projectId,
        query,
      });

      for (const question of assessment.questions) {
        await this.saveQuestion(question, assessment.id);
      }

      return success(undefined);
    } catch (error) {
      return failure(new RepositoryError("Assessment 저장 실패", error));
    }
  }

  async findById(
    id: AssessmentId
  ): Promise<Result<Assessment | null, RepositoryError>> {
    try {
      const { mcp_supabase_execute_sql } = await import("@posmul/shared-auth");

      const result = await mcp_supabase_execute_sql({
        project_id: this.projectId,
        query: `SELECT * FROM assessments WHERE id = '${id}'`,
      });

      if (!result.data || result.data.length === 0) {
        return success(null);
      }

      const assessmentRow = result.data[0] as AssessmentRow;
      const questionsResult = await this.findQuestionsByAssessmentId(id);
      if (!questionsResult.success) {
        if (isFailure(questionsResult)) {
          return failure(questionsResult.error);
        } else {
          return failure(new Error("Unknown error"));
        }
      }

      const assessment = this.mapRowToAssessment(
        assessmentRow,
        questionsResult.data
      );
      return success(assessment);
    } catch (error) {
      return failure(new RepositoryError("Assessment 조회 실패", error));
    }
  }

  async findByCreatorId(
    creatorId: string
  ): Promise<Result<Assessment[], RepositoryError>> {
    try {
      const { mcp_supabase_execute_sql } = await import("@posmul/shared-auth");

      const result = await mcp_supabase_execute_sql({
        project_id: this.projectId,
        query: `SELECT * FROM assessments WHERE creator_id = '${creatorId}' ORDER BY created_at DESC`,
      });

      const assessments: Assessment[] = [];
      if (result.data) {
        for (const row of result.data as AssessmentRow[]) {
          const questionsResult = await this.findQuestionsByAssessmentId(
            row.id as AssessmentId
          );
          if (questionsResult.success) {
            assessments.push(
              this.mapRowToAssessment(row, questionsResult.data)
            );
          }
        }
      }
      return success(assessments);
    } catch (error) {
      return failure(
        new RepositoryError("Creator별 Assessment 조회 실패", error)
      );
    }
  }

  async findByStatus(
    status: AssessmentStatus
  ): Promise<Result<Assessment[], RepositoryError>> {
    try {
      const { mcp_supabase_execute_sql } = await import("@posmul/shared-auth");
      const result = await mcp_supabase_execute_sql({
        project_id: this.projectId,
        query: `SELECT * FROM assessments WHERE status = '${status}' ORDER BY created_at DESC`,
      });

      const assessments: Assessment[] = [];
      if (result.data) {
        for (const row of result.data as AssessmentRow[]) {
          const questionsResult = await this.findQuestionsByAssessmentId(
            row.id as AssessmentId
          );
          if (questionsResult.success) {
            assessments.push(
              this.mapRowToAssessment(row, questionsResult.data)
            );
          }
        }
      }
      return success(assessments);
    } catch (error) {
      return failure(
        new RepositoryError("Status별 Assessment 조회 실패", error)
      );
    }
  }

  async findAll(): Promise<Result<Assessment[], RepositoryError>> {
    try {
      const { mcp_supabase_execute_sql } = await import("@posmul/shared-auth");
      const result = await mcp_supabase_execute_sql({
        project_id: this.projectId,
        query: "SELECT * FROM assessments ORDER BY created_at DESC",
      });

      const assessments: Assessment[] = [];
      if (result.data) {
        for (const row of result.data as AssessmentRow[]) {
          const questionsResult = await this.findQuestionsByAssessmentId(
            row.id as AssessmentId
          );
          if (questionsResult.success) {
            assessments.push(
              this.mapRowToAssessment(row, questionsResult.data)
            );
          }
        }
      }
      return success(assessments);
    } catch (error) {
      return failure(new RepositoryError("전체 Assessment 조회 실패", error));
    }
  }

  async delete(id: AssessmentId): Promise<Result<void, RepositoryError>> {
    try {
      const { mcp_supabase_execute_sql } = await import("@posmul/shared-auth");
      await mcp_supabase_execute_sql({
        project_id: this.projectId,
        query: `DELETE FROM submissions WHERE question_id IN (SELECT id FROM questions WHERE assessment_id = '${id}')`,
      });
      await mcp_supabase_execute_sql({
        project_id: this.projectId,
        query: `DELETE FROM questions WHERE assessment_id = '${id}'`,
      });
      await mcp_supabase_execute_sql({
        project_id: this.projectId,
        query: `DELETE FROM assessments WHERE id = '${id}'`,
      });
      return success(undefined);
    } catch (error) {
      return failure(new RepositoryError("Assessment 삭제 실패", error));
    }
  }

  async saveQuestion(
    question: Question,
    assessmentId: AssessmentId
  ): Promise<Result<void, RepositoryError>> {
    try {
      const questionData = this.mapQuestionToRow(question, assessmentId);
      const { mcp_supabase_execute_sql } = await import("@posmul/shared-auth");

      const query = `
        INSERT INTO questions (
          id, assessment_id, template_id, type, title, content, points, options,
          correct_answer, grading_criteria, time_limit, difficulty,
          tags, is_active, created_at, updated_at
        ) VALUES (
          '${questionData.id}', '${questionData.assessment_id}', '${questionData.template_id}', '${questionData.type}',
          '${this.escapeSql(questionData.title)}', '${this.escapeSql(questionData.content)}', ${questionData.points},
          '${this.escapeSql(JSON.stringify(questionData.options))}',
          ${questionData.correct_answer ? `'${this.escapeSql(questionData.correct_answer)}'` : "NULL"},
          ${questionData.grading_criteria ? `'${this.escapeSql(questionData.grading_criteria)}'` : "NULL"},
          ${questionData.time_limit ?? "NULL"}, '${questionData.difficulty}',
          '{${questionData.tags.join(",")}}', ${questionData.is_active},
          '${questionData.created_at}', '${questionData.updated_at}'
        ) ON CONFLICT (id) DO UPDATE SET
          assessment_id = EXCLUDED.assessment_id, template_id = EXCLUDED.template_id, type = EXCLUDED.type,
          title = EXCLUDED.title, content = EXCLUDED.content, points = EXCLUDED.points,
          options = EXCLUDED.options, correct_answer = EXCLUDED.correct_answer,
          grading_criteria = EXCLUDED.grading_criteria, time_limit = EXCLUDED.time_limit,
          difficulty = EXCLUDED.difficulty, tags = EXCLUDED.tags, is_active = EXCLUDED.is_active,
          updated_at = EXCLUDED.updated_at
      `;
      await mcp_supabase_execute_sql({ project_id: this.projectId, query });
      return success(undefined);
    } catch (error) {
      return failure(new RepositoryError("Question 저장 실패", error));
    }
  }

  async findQuestionById(
    id: QuestionId
  ): Promise<Result<Question | null, RepositoryError>> {
    try {
      const { mcp_supabase_execute_sql } = await import("@posmul/shared-auth");
      const result = await mcp_supabase_execute_sql({
        project_id: this.projectId,
        query: `SELECT * FROM questions WHERE id = '${id}'`,
      });

      if (!result.data || result.data.length === 0) return success(null);
      return success(this.mapRowToQuestion(result.data[0] as QuestionRow));
    } catch (error) {
      return failure(new RepositoryError("Question 조회 실패", error));
    }
  }

  async findQuestionsByAssessmentId(
    assessmentId: AssessmentId
  ): Promise<Result<Question[], RepositoryError>> {
    try {
      const { mcp_supabase_execute_sql } = await import("@posmul/shared-auth");
      const result = await mcp_supabase_execute_sql({
        project_id: this.projectId,
        query: `SELECT * FROM questions WHERE assessment_id = '${assessmentId}' ORDER BY created_at ASC`,
      });
      const questions = (result.data || []).map((row: any) =>
        this.mapRowToQuestion(row as QuestionRow)
      );
      return success(questions);
    } catch (error) {
      return failure(
        new RepositoryError("Assessment별 Question 조회 실패", error)
      );
    }
  }

  async deleteQuestion(id: QuestionId): Promise<Result<void, RepositoryError>> {
    try {
      const { mcp_supabase_execute_sql } = await import("@posmul/shared-auth");
      await mcp_supabase_execute_sql({
        project_id: this.projectId,
        query: `DELETE FROM submissions WHERE question_id = '${id}'`,
      });
      await mcp_supabase_execute_sql({
        project_id: this.projectId,
        query: `DELETE FROM questions WHERE id = '${id}'`,
      });
      return success(undefined);
    } catch (error) {
      return failure(new RepositoryError("Question 삭제 실패", error));
    }
  }

  async saveSubmission(
    submission: Submission
  ): Promise<Result<void, RepositoryError>> {
    try {
      const submissionData = this.mapSubmissionToRow(submission);
      const { mcp_supabase_execute_sql } = await import("@posmul/shared-auth");
      const query = `
        INSERT INTO submissions (
          id, assessment_id, student_id, answers, final_score, total_points,
          is_completed, started_at, submitted_at, time_spent, created_at, updated_at
        ) VALUES (
          '${submissionData.id}', '${submissionData.assessmentId}', '${submissionData.studentId}',
          '${this.escapeSql(submissionData.answers)}', ${submissionData.finalScore}, ${submissionData.totalPoints},
          ${submissionData.isCompleted}, '${submissionData.startedAt.toISOString()}', '${submissionData.submittedAt.toISOString()}',
          ${submissionData.timeSpent ?? "NULL"}, '${submissionData.createdAt.toISOString()}', '${submissionData.updatedAt.toISOString()}'
        ) ON CONFLICT (id) DO UPDATE SET
          answers = EXCLUDED.answers, final_score = EXCLUDED.final_score,
          total_points = EXCLUDED.total_points, is_completed = EXCLUDED.is_completed,
          started_at = EXCLUDED.started_at, submitted_at = EXCLUDED.submitted_at,
          time_spent = EXCLUDED.time_spent, updated_at = EXCLUDED.updated_at
      `;
      await mcp_supabase_execute_sql({ project_id: this.projectId, query });
      return success(undefined);
    } catch (error) {
      return failure(new RepositoryError("Submission 저장 실패", error));
    }
  }

  async findSubmissionById(
    id: SubmissionId
  ): Promise<Result<Submission | null, RepositoryError>> {
    try {
      const { mcp_supabase_execute_sql } = await import("@posmul/shared-auth");
      const result = await mcp_supabase_execute_sql({
        project_id: this.projectId,
        query: `SELECT * FROM submissions WHERE id = '${id}'`,
      });
      if (!result.data || result.data.length === 0) return success(null);
      return success(this.mapRowToSubmission(result.data[0] as SubmissionRow));
    } catch (error) {
      return failure(new RepositoryError("Submission 조회 실패", error));
    }
  }

  async findSubmissionsByAssessmentId(
    assessmentId: AssessmentId
  ): Promise<Result<Submission[], RepositoryError>> {
    try {
      const { mcp_supabase_execute_sql } = await import("@posmul/shared-auth");
      const result = await mcp_supabase_execute_sql({
        project_id: this.projectId,
        query: `
          SELECT s.* FROM submissions s
          JOIN questions q ON s.question_id = q.id
          WHERE q.assessment_id = '${assessmentId}'
          ORDER BY s.submitted_at DESC
        `,
      });
      const submissions = (result.data || []).map((row: any) =>
        this.mapRowToSubmission(row as SubmissionRow)
      );
      return success(submissions);
    } catch (error) {
      return failure(
        new RepositoryError("Assessment별 Submission 조회 실패", error)
      );
    }
  }

  async findSubmissionsByStudentId(
    studentId: string
  ): Promise<Result<Submission[], RepositoryError>> {
    try {
      const { mcp_supabase_execute_sql } = await import("@posmul/shared-auth");
      const result = await mcp_supabase_execute_sql({
        project_id: this.projectId,
        query: `SELECT * FROM submissions WHERE student_id = '${studentId}' ORDER BY submitted_at DESC`,
      });

      const submissions: Submission[] = [];
      if (result.data) {
        for (const row of result.data as SubmissionRow[]) {
          submissions.push(this.mapRowToSubmission(row));
        }
      }
      return success(submissions);
    } catch (error) {
      return failure(
        new RepositoryError("Student별 Submission 조회 실패", error)
      );
    }
  }

  async findSubmissionsByQuestionId(
    questionId: QuestionId
  ): Promise<Result<Submission[], RepositoryError>> {
    try {
      const { mcp_supabase_execute_sql } = await import("@posmul/shared-auth");
      const result = await mcp_supabase_execute_sql({
        project_id: this.projectId,
        query: `SELECT * FROM submissions WHERE question_id = '${questionId}' ORDER BY submitted_at DESC`,
      });
      const submissions = (result.data || []).map((row: any) =>
        this.mapRowToSubmission(row as SubmissionRow)
      );
      return success(submissions);
    } catch (error) {
      return failure(
        new RepositoryError("Question별 Submission 조회 실패", error)
      );
    }
  }

  async getAssessmentStats(
    assessmentId: AssessmentId
  ): Promise<Result<AssessmentStats, RepositoryError>> {
    try {
      const { mcp_supabase_execute_sql } = await import("@posmul/shared-auth");
      const result = await mcp_supabase_execute_sql({
        project_id: this.projectId,
        query: `
          SELECT 
            COUNT(DISTINCT s.id) as total_submissions,
            AVG(s.score) as average_score,
            COUNT(DISTINCT CASE WHEN s.score >= a.passing_score THEN s.student_id END) * 100.0 / COUNT(DISTINCT s.student_id) as pass_rate,
            COUNT(DISTINCT CASE WHEN s.grading_status = 'completed' THEN s.student_id END) * 100.0 / COUNT(DISTINCT s.student_id) as completion_rate,
            AVG(s.time_spent) as average_time_spent
          FROM submissions s
          JOIN questions q ON s.question_id = q.id
          JOIN assessments a ON q.assessment_id = a.id
          WHERE a.id = '${assessmentId}'
        `,
      });

      const statsRow = result.data?.[0];
      if (!statsRow) {
        return success({
          totalSubmissions: 0,
          averageScore: 0,
          passRate: 0,
          completionRate: 0,
          averageTimeSpent: 0,
          questionStats: [],
        });
      }

      const questionStatsResult = await mcp_supabase_execute_sql({
        project_id: this.projectId,
        query: `
          SELECT q.id as question_id, COUNT(s.id) as total_submissions,
            COUNT(CASE WHEN s.score > 0 THEN 1 END) as correct_submissions,
            AVG(s.score) as average_score, AVG(s.time_spent) as average_time_spent
          FROM questions q
          LEFT JOIN submissions s ON q.id = s.question_id
          WHERE q.assessment_id = '${assessmentId}'
          GROUP BY q.id
        `,
      });

      const questionStats: QuestionStats[] = (
        questionStatsResult.data || []
      ).map((row: any) => ({
        questionId: row.question_id as QuestionId,
        totalAttempts: parseInt(row.total_submissions) || 0,
        correctAttempts: parseInt(row.correct_submissions) || 0,
        totalSubmissions: parseInt(row.total_submissions) || 0,
        correctSubmissions: parseInt(row.correct_submissions) || 0,
        averageScore: parseFloat(row.average_score) || 0,
        difficultyRating: parseFloat(row.difficulty_rating) || 1.0,
        averageTimeSpent: parseFloat(row.average_time_spent) || 0,
      }));

      return success({
        totalSubmissions: parseInt(statsRow.total_submissions) || 0,
        averageScore: parseFloat(statsRow.average_score) || 0,
        passRate: parseFloat(statsRow.pass_rate) || 0,
        completionRate: parseFloat(statsRow.completion_rate) || 0,
        averageTimeSpent: parseFloat(statsRow.average_time_spent) || 0,
        questionStats,
      });
    } catch (error) {
      return failure(new RepositoryError("Assessment 통계 조회 실패", error));
    }
  }

  async getStudentProgress(
    assessmentId: AssessmentId,
    studentId: UserId
  ): Promise<Result<StudentProgress | null, Error>> {
    try {
      const { mcp_supabase_execute_sql } = await import("@posmul/shared-auth");
      const result = await mcp_supabase_execute_sql({
        project_id: this.projectId,
        query: `
          SELECT 
            COUNT(DISTINCT q.id) as total_questions,
            COUNT(DISTINCT s.question_id) as answered_questions,
            COUNT(DISTINCT CASE WHEN s.score > 0 THEN s.question_id END) as correct_answers,
            SUM(COALESCE(s.score, 0)) as current_score,
            SUM(COALESCE(s.time_spent, 0)) as time_spent,
            CASE WHEN COUNT(DISTINCT s.question_id) >= COUNT(DISTINCT q.id) THEN true ELSE false END as is_completed
          FROM questions q
          LEFT JOIN submissions s ON q.id = s.question_id AND s.student_id = '${studentId}'
          WHERE q.assessment_id = '${assessmentId}'
        `,
      });

      const progressRow = result.data?.[0];
      if (!progressRow) {
        return success(null);
      }

      const submissionsResult =
        await this.findSubmissionsByAssessmentId(assessmentId);
      const studentSubmissions = submissionsResult.success
        ? submissionsResult.data.filter((s) => s.studentId === studentId)
        : [];

      const studentProgress: StudentProgress = {
        studentId,
        assessmentId,
        currentQuestionIndex: 0, // Default value
        completedQuestions: parseInt(progressRow.answered_questions) || 0,
        totalQuestions: parseInt(progressRow.total_questions) || 0,
        startedAt: new Date(), // Default to current date
        lastActivityAt: new Date(), // Default to current date
      };

      return success(studentProgress);
    } catch (error) {
      return failure(new Error(`학생 진도 조회 실패: ${error}`));
    }
  }

  async findSubmission(
    assessmentId: AssessmentId,
    studentId: UserId
  ): Promise<Result<Submission | null, RepositoryError>> {
    try {
      const { mcp_supabase_execute_sql } = await import("@posmul/shared-auth");
      const result = await mcp_supabase_execute_sql({
        project_id: this.projectId,
        query: `SELECT * FROM submissions WHERE assessment_id = '${assessmentId}' AND student_id = '${studentId}' LIMIT 1`,
      });

      if (!result.data || result.data.length === 0) {
        return success(null);
      }

      const submissionRow = result.data[0] as SubmissionRow;
      const submission = this.mapRowToSubmission(submissionRow);
      return success(submission);
    } catch (error) {
      return failure(new RepositoryError("Submission 조회 실패", error));
    }
  }

  private mapAssessmentToRow(assessment: Assessment): any {
    const now = new Date().toISOString();
    return {
      id: assessment.id,
      title: assessment.title,
      description: assessment.description,
      status: assessment.status,
      creator_id: assessment.creatorId,
      total_points: assessment.totalPoints,
      time_limit: assessment.timeLimit,
      start_date: assessment.startDate?.toISOString(),
      end_date: assessment.endDate?.toISOString(),
      allowed_attempts: assessment.allowedAttempts,
      passing_score: assessment.passingScore,
      is_randomized: assessment.isRandomized,
      show_results: assessment.showResults,
      settings: assessment.settings,
      created_at: assessment.createdAt?.toISOString() || now,
      updated_at: now,
    };
  }

  private mapRowToAssessment(
    row: AssessmentRow,
    questions: Question[]
  ): Assessment {
    const props: IAssessmentProps = {
      id: row.id as AssessmentId,
      title: row.title,
      description: row.description,
      status: row.status as AssessmentStatus,
      creatorId: row.creator_id,
      questions,
      totalPoints: row.total_points,
      timeLimit: row.time_limit,
      startDate: row.start_date ? new Date(row.start_date) : undefined,
      endDate: row.end_date ? new Date(row.end_date) : undefined,
      allowedAttempts: row.allowed_attempts,
      passingScore: row.passing_score,
      isRandomized: row.is_randomized,
      showResults: row.show_results,
      settings: row.settings || {},
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
    return Assessment.reconstitute(props, row.id as AssessmentId);
  }

  private mapQuestionToRow(
    question: Question,
    assessmentId: AssessmentId
  ): any {
    const now = new Date().toISOString();
    return {
      id: question.id,
      assessment_id: assessmentId,
      template_id: question.templateId,
      type: question.type,
      title: question.title,
      content: question.content,
      points: question.points,
      options: question.options,
      correct_answer: question.correctAnswer,
      grading_criteria: question.gradingCriteria,
      time_limit: question.timeLimit,
      difficulty: question.difficulty,
      tags: question.tags,
      is_active: question.isActive,
      created_at: question.createdAt?.toISOString() || now,
      updated_at: now,
    };
  }

  private mapRowToQuestion(row: QuestionRow): Question {
    const props: IQuestionProps = {
      templateId: row.template_id as any,
      type: row.type as QuestionType,
      title: row.title,
      content: row.content,
      points: row.points,
      options: row.options,
      correctAnswer: row.correct_answer,
      gradingCriteria: row.grading_criteria,
      timeLimit: row.time_limit,
      difficulty: row.difficulty as "easy" | "medium" | "hard",
      tags: row.tags || [],
      isActive: row.is_active,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
    return Question.reconstitute(props, row.id as QuestionId);
  }

  private mapSubmissionToRow(submission: Submission): any {
    const now = new Date().toISOString();
    return {
      id: submission.id,
      assessment_id: submission.assessmentId,
      student_id: submission.studentId,
      answers: JSON.stringify(submission.answers),
      final_score: submission.finalScore,
      total_points: submission.totalPoints,
      is_completed: submission.isCompleted,
      started_at: submission.startedAt.toISOString(),
      submitted_at: submission.submittedAt.toISOString(),
      time_spent: submission.timeSpent,
      created_at: submission.createdAt?.toISOString() || now,
      updated_at: now,
    };
  }

  private mapRowToSubmission(row: SubmissionRow): Submission {
    const submissionProps: ISubmissionProps = {
      assessmentId: row.assessment_id as AssessmentId,
      studentId: row.student_id,
      answers: Array.isArray(row.answer) ? row.answer : [],
      finalScore: row.score || 0,
      totalPoints: 0, // Default value
      isCompleted: row.grading_status === "completed",
      startedAt: new Date(row.created_at),
      submittedAt: new Date(row.submitted_at),
      timeSpent: row.time_spent,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
    return Submission.reconstitute(submissionProps, row.id as SubmissionId);
  }
}
