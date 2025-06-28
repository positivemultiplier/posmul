import { Result, success, failure } from "@/shared/types/common";
import { IAssessmentRepository } from "../../domain/repositories/assessment.repository";
import { Assessment } from "../../domain/aggregates/assessment.aggregate";
import { UserId } from "@/shared/types/branded-types";
import { IUseCase } from "@/shared/types/use-case.interface";
import { AssessmentId } from "../../domain/value-objects/assessment-id.value-object";

export interface CreateAssessmentRequest {
  title: string;
  creatorId: UserId;
}

export interface CreateAssessmentResponse {
  assessmentId: AssessmentId;
}

export class CreateAssessmentUseCase
  implements
    IUseCase<
      CreateAssessmentRequest,
      CreateAssessmentResponse
    >
{
  constructor(private readonly assessmentRepository: IAssessmentRepository) {}

  async execute(
    request: CreateAssessmentRequest
  ): Promise<Result<CreateAssessmentResponse, Error>> {
    const assessmentResult = Assessment.create({
      title: request.title,
      creatorId: request.creatorId,
    });

    if (!assessmentResult.success) {
      return failure(assessmentResult.error);
    }

    const assessment = assessmentResult.data;
    const saveResult = await this.assessmentRepository.save(assessment);

    if (!saveResult.success) {
      return failure(saveResult.error);
    }

    return success({
      assessmentId: assessment.props.id,
    });
  }
} 