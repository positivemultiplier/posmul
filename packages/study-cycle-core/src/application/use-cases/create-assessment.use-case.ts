import {
  IUseCase,
  Result,
  UserId,
  failure,
  isFailure,
  success,
} from "@posmul/shared-types";
import {
  Assessment,
  AssessmentId,
} from "../../domain/entities/assessment.entity";
import { IAssessmentRepository } from "../../domain/repositories/assessment.repository";

export interface CreateAssessmentRequest {
  title: string;
  description: string;
  creatorId: UserId;
  allowedAttempts?: number;
  passingScore?: number;
  isRandomized?: boolean;
  showResults?: boolean;
  timeLimit?: number;
}

export interface CreateAssessmentResponse {
  assessmentId: AssessmentId;
}

export class CreateAssessmentUseCase
  implements IUseCase<CreateAssessmentRequest, CreateAssessmentResponse>
{
  constructor(private readonly assessmentRepository: IAssessmentRepository) {}

  async execute(
    request: CreateAssessmentRequest
  ): Promise<Result<CreateAssessmentResponse, Error>> {
    const assessmentResult = Assessment.create({
      title: request.title,
      description: request.description,
      creatorId: request.creatorId,
      allowedAttempts: request.allowedAttempts ?? 3,
      passingScore: request.passingScore ?? 60,
      isRandomized: request.isRandomized ?? false,
      showResults: request.showResults ?? true,
      timeLimit: request.timeLimit,
      settings: {
        shuffleQuestions: false,
        shuffleOptions: false,
        allowBackNavigation: true,
        showProgressBar: true,
        requireFullscreen: false,
        preventCopyPaste: false,
        recordingEnabled: false,
      },
    });

    if (!assessmentResult.success) {
      if (isFailure(assessmentResult)) {
        if (isFailure(assessmentResult)) {
          return failure(assessmentResult.error);
        } else {
          return failure(new Error("Unknown error"));
        }
      } else {
        return failure(new Error("Unknown error"));
      }
    }

    const assessment = assessmentResult.data;
    const saveResult = await this.assessmentRepository.save(assessment);

    if (!saveResult.success) {
      if (isFailure(saveResult)) {
        if (isFailure(saveResult)) {
          return failure(saveResult.error);
        } else {
          return failure(new Error("Unknown error"));
        }
      } else {
        return failure(new Error("Unknown error"));
      }
    }

    return success({
      assessmentId: assessment.id,
    });
  }
}
