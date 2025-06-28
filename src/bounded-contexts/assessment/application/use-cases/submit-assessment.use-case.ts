/**
 * Submit Assessment Use Case
 * 
 * Handles the logic for a student submitting their answers for an assessment.
 * This includes fetching the assessment, grading the submission, creating
 * a Submission entity, and persisting it.
 */
import { IAssessmentRepository } from "../../domain/repositories/assessment.repository";
import { SubmitAssessmentDto, AnswerDto } from "../dto/submit-assessment.dto";
import { AssessmentId, Question, Submission, ISubmissionProps } from "../../domain/entities/assessment.entity";
import { Result, success, failure } from "../../../../shared/errors";
import { UseCaseError, NotFoundError, DomainError } from "../../../../shared/errors";
import { GradedAnswer, SubmissionResultDto } from "../dto/submission-result.dto";
import { createUserId } from "../../../../shared/types/branded-types";

export class SubmitAssessmentUseCase {
  constructor(private readonly assessmentRepository: IAssessmentRepository) {}

  async execute(dto: SubmitAssessmentDto): Promise<Result<SubmissionResultDto, UseCaseError | NotFoundError | DomainError>> {
    try {
      // 1. Fetch the assessment with correct answers
      const assessmentResult = await this.assessmentRepository.findById(dto.assessmentId);
      if (!assessmentResult.success || !assessmentResult.data) {
        return failure(new NotFoundError(`Assessment with id ${dto.assessmentId} not found.`));
      }
      const assessment = assessmentResult.data;

      // 2. Grade the submission
      const gradedAnswers: GradedAnswer[] = [];
      let totalScore = 0;
      let correctCount = 0;

      for (const question of assessment.questions) {
        const userAnswer = dto.answers.find(a => a.questionId === question.id);
        const isCorrect = this.gradeAnswer(question, userAnswer);
        const score = isCorrect ? question.points : 0;
        
        gradedAnswers.push({
          questionId: question.id,
          isCorrect,
          score,
          userAnswer: userAnswer?.value,
          correctAnswer: question.correctAnswer,
        });

        if (isCorrect) {
          totalScore += score;
          correctCount++;
        }
      }

      // 3. Create Submission entity
      const submissionData: Omit<ISubmissionProps, 'submittedAt' | 'createdAt' | 'updatedAt'> = {
        assessmentId: assessment.id,
        studentId: dto.userId,
        answers: gradedAnswers,
        finalScore: totalScore,
        totalPoints: assessment.totalPoints,
        isCompleted: true,
      };

      const submissionResult = Submission.create(submissionData);

      if (!submissionResult.success) {
        return failure(new DomainError("Failed to create submission entity.", submissionResult.error.message));
      }
      const submission = submissionResult.data;

      // 4. Save the submission
      const saveResult = await this.assessmentRepository.saveSubmission(submission);
      if (!saveResult.success) {
        return failure(new UseCaseError("Failed to save submission.", saveResult.error));
      }

      // 5. Return the result DTO
      const resultDto: SubmissionResultDto = {
        submissionId: submission.id,
        assessmentId: submission.assessmentId,
        studentId: createUserId(submission.studentId),
        finalScore: submission.finalScore,
        totalPoints: submission.totalPoints,
        correctCount: correctCount,
        totalQuestions: assessment.questions.length,
        gradedAnswers: gradedAnswers,
      };

      return success(resultDto);

    } catch (error: unknown) {
      return failure(new UseCaseError("An unexpected error occurred during submission.", error as Error));
    }
  }

  private gradeAnswer(question: Question, answer?: AnswerDto): boolean {
    if (!answer?.value) return false;

    switch (question.type) {
      case 'multiple-choice':
      case 'true-false':
        return question.correctAnswer === answer.value;
      case 'multiple-select':
        if (!Array.isArray(answer.value) || !Array.isArray(question.correctAnswer)) {
          return false;
        }
        const correctAnswerSet = new Set(question.correctAnswer);
        const userAnswerSet = new Set(answer.value);
        return correctAnswerSet.size === userAnswerSet.size && [...correctAnswerSet].every(item => userAnswerSet.has(item));
      case 'short-answer':
        // Case-insensitive comparison for short answers
        return typeof question.correctAnswer === 'string' &&
               typeof answer.value === 'string' &&
               question.correctAnswer.toLowerCase() === answer.value.toLowerCase();
      default:
        return false;
    }
  }
} 