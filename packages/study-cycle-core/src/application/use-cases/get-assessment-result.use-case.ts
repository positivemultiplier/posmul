/**
 * @file get-assessment-result.use-case.ts
 * @description This use case is responsible for retrieving the detailed results of a
 * completed assessment for a specific user. It orchestrates calls to repositories
 * to fetch assessment, submission, and question data, then formats it into the
 * AssessmentResultDto for the presentation layer.
 */

import {
  Result,
  UseCaseError,
  UserId,
  failure,
  success,
} from "@posmul/shared-types";
import {
  Assessment,
  AssessmentId,
  IGradedAnswer,
  Question,
  Submission,
} from "../../domain/entities/assessment.entity";
import { IAssessmentRepository } from "../../domain/repositories/assessment.repository";
import {
  AssessmentResultDto,
  QuestionResultDto,
  QuestionType,
  UserAnswer,
} from "../dto/assessment-result.dto";

export class GetAssessmentResultUseCase {
  constructor(private readonly assessmentRepository: IAssessmentRepository) {}

  async execute(
    assessmentId: AssessmentId,
    userId: UserId
  ): Promise<Result<AssessmentResultDto, UseCaseError>> {
    try {
      const assessmentResult =
        await this.assessmentRepository.findById(assessmentId);
      if (!assessmentResult.success || !assessmentResult.data) {
        return failure(new UseCaseError("Assessment not found."));
      }
      const assessment: Assessment = assessmentResult.data as Assessment;

      const submissionResult = await this.assessmentRepository.findSubmission(
        assessmentId,
        userId
      );
      if (!submissionResult.success || !submissionResult.data) {
        return failure(new UseCaseError("Submission not found."));
      }
      const submission: Submission = submissionResult.data as Submission;

      const totalScore = submission.finalScore ?? 0;
      const maxScore = assessment.totalPoints;
      const percentage = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;

      const questionResults: QuestionResultDto[] = assessment.questions.map(
        (question: Question) => {
          const submittedAnswer = submission.answers.find(
            (ans: IGradedAnswer) => ans.questionId === question.id
          );

          return {
            id: question.id,
            type: question.type as QuestionType,
            title: question.title,
            content: question.content,
            userAnswer: (submittedAnswer?.userAnswer as UserAnswer) ?? null,
            correctAnswer: question.correctAnswer as UserAnswer,
            isCorrect: submittedAnswer?.isCorrect ?? false,
            score: submittedAnswer?.score ?? 0,
            maxScore: question.points,
            options: question.options ?? [],
            explanation: question.options?.find((opt) => opt.isCorrect)
              ?.explanation,
          };
        }
      );

      const resultDto: AssessmentResultDto = {
        assessmentId: assessment.id,
        userId: userId,
        title: assessment.title,
        description: assessment.description,
        totalScore: totalScore,
        maxScore: maxScore,
        percentage: percentage,
        grade: this.calculateGrade(percentage),
        startedAt: submission.startedAt,
        completedAt: submission.submittedAt,
        timeTakenInSeconds: submission.timeSpent ?? 0,
        questionResults: questionResults,
      };

      return success(resultDto);
    } catch (error) {
      return failure(
        new UseCaseError(
          "An unexpected error occurred while fetching the assessment result.",
          error as Error
        )
      );
    }
  }

  private calculateGrade(percentage: number): "A" | "B" | "C" | "D" | "F" {
    if (percentage >= 90) return "A";
    if (percentage >= 80) return "B";
    if (percentage >= 70) return "C";
    if (percentage >= 60) return "D";
    return "F";
  }
}
