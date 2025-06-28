/**
 * @file get-assessment-result.use-case.ts
 * @description This use case is responsible for retrieving the detailed results of a
 * completed assessment for a specific user. It orchestrates calls to repositories
 * to fetch assessment, submission, and question data, then formats it into the
 * AssessmentResultDto for the presentation layer.
 */

import { IAssessmentRepository } from '../../domain/repositories/assessment.repository';
import {
  AssessmentResultDto,
  QuestionResultDto,
  UserAnswer,
  QuestionType,
} from '../dto/assessment-result.dto';
import {
  Result,
  success,
  failure,
  UseCaseError,
  NotFoundError,
} from '@/shared/errors';
import { Assessment } from '../../domain/aggregates/assessment.aggregate';
import { Question } from '../../domain/entities/question.entity';
import {
  Submission,
  SubmittedAnswer,
} from '@/bounded-contexts/assessment/domain/entities/submission.entity';
import { AssessmentId } from '../../domain/value-objects/assessment-id.value-object';
import { UserId } from '@/shared/types/branded-types';

export class GetAssessmentResultUseCase {
  constructor(private readonly assessmentRepository: IAssessmentRepository) {}

  async execute(
    assessmentId: AssessmentId,
    userId: UserId,
  ): Promise<Result<AssessmentResultDto, UseCaseError>> {
    try {
      const assessmentResult = await this.assessmentRepository.findById(assessmentId);
      if (!assessmentResult.success || !assessmentResult.data) {
        return failure(new UseCaseError('Assessment not found.'));
      }
      const assessment: Assessment = assessmentResult.data as Assessment;

      const submissionResult = await this.assessmentRepository.findSubmission(assessmentId, userId);
      if (!submissionResult.success || !submissionResult.data) {
        return failure(new UseCaseError('Submission not found.'));
      }
      const submission: Submission = submissionResult.data as Submission;

      const totalScore = submission.props.finalScore ?? 0;
      const maxScore = assessment.props.totalPoints;
      const percentage = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;

      const questionResults: QuestionResultDto[] =
        assessment.props.questions.map((question: Question) => {
          const submittedAnswer = submission.props.answers.find(
            (ans: SubmittedAnswer) => ans.questionId === (question as any)._id,
          );

          return {
            id: (question as any)._id,
            type: question.props.type as QuestionType,
            title: question.props.title,
            content: question.props.content,
            userAnswer: (submittedAnswer?.userAnswer as UserAnswer) ?? null,
            correctAnswer: question.props.correctAnswer as UserAnswer,
            isCorrect: submittedAnswer?.isCorrect ?? false,
            score: submittedAnswer?.score ?? 0,
            maxScore: question.props.points,
            options: question.props.options ?? [],
            explanation: question.props.options?.find((opt) => opt.isCorrect)
              ?.explanation,
          };
        });

      const resultDto: AssessmentResultDto = {
        assessmentId: (assessment as any)._id,
        userId: userId,
        title: assessment.props.title,
        description: assessment.props.description,
        totalScore: totalScore,
        maxScore: maxScore,
        percentage: percentage,
        grade: this.calculateGrade(percentage),
        startedAt: submission.props.startedAt,
        completedAt: submission.props.submittedAt,
        timeTakenInSeconds: submission.props.timeSpent ?? 0,
        questionResults: questionResults,
      };

      return success(resultDto);
    } catch (error) {
      return failure(
        new UseCaseError(
          'An unexpected error occurred while fetching the assessment result.',
          error as Error,
        ),
      );
    }
  }

  private calculateGrade(percentage: number): 'A' | 'B' | 'C' | 'D' | 'F' {
    if (percentage >= 90) return 'A';
    if (percentage >= 80) return 'B';
    if (percentage >= 70) return 'C';
    if (percentage >= 60) return 'D';
    return 'F';
  }
} 