/**
 * Create Donation Use Case
 * 기부 생성 유스케이스
 */
import { Result, UserId, isFailure } from "@posmul/auth-economy-sdk";
import { ValidationError } from "@posmul/auth-economy-sdk";

import { Donation } from "../../domain/entities/donation.entity";
import { Institute } from "../../domain/entities/institute.entity";
import { OpinionLeader } from "../../domain/entities/opinion-leader.entity";
import { IDonationRepository } from "../../domain/repositories/donation.repository";
import { IInstituteRepository } from "../../domain/repositories/institute.repository";
import { IOpinionLeaderRepository } from "../../domain/repositories/opinion-leader.repository";
import { DonationDomainService } from "../../domain/services/donation.domain-service";
import {
  BeneficiaryInfo,
  DonationAmount,
  DonationCategory,
  DonationDescription,
  DonationFrequency,
  DonationType,
  InstituteId,
  OpinionLeaderId,
} from "../../domain/value-objects/donation-value-objects";
import {
  CreateDonationRequest,
  CreateDonationRequestSchema,
} from "../dto/donation.dto";

export interface DonationMetadata {
  isAnonymous: boolean;
  message?: string;
  dedicatedTo?: string;
  taxDeductible: boolean;
  receiptRequired: boolean;
}

/**
 * Create Donation Use Case
 * 새로운 기부 생성 유스케이스
 */
export class CreateDonationUseCase {
  constructor(
    private readonly donationRepository: IDonationRepository,
    private readonly instituteRepository: IInstituteRepository,
    private readonly opinionLeaderRepository: IOpinionLeaderRepository,
    private readonly donationDomainService: DonationDomainService
  ) {}

  private fail(message: string, details?: Record<string, unknown>) {
    return {
      success: false as const,
      error: new ValidationError(message, details),
    };
  }

  private parseRequest(request: CreateDonationRequest) {
    const validationResult = CreateDonationRequestSchema.safeParse(request);
    if (!validationResult.success) {
      return {
        success: false as const,
        error: new ValidationError("Invalid donation request", {
          details: validationResult.error.errors
            .map((e) => e.message)
            .join(", "),
        }),
      };
    }

    return { success: true as const, data: validationResult.data };
  }

  private buildMetadata(request: CreateDonationRequest): DonationMetadata {
    return {
      isAnonymous: request.isAnonymous,
      message: request.message,
      dedicatedTo: request.dedicatedTo,
      taxDeductible: request.taxDeductible,
      receiptRequired: request.receiptRequired,
    };
  }

  private getScheduledAt(request: CreateDonationRequest) {
    return request.scheduledAt ? new Date(request.scheduledAt) : undefined;
  }

  private async createDonationByType(
    donorId: UserId,
    request: CreateDonationRequest,
    amount: DonationAmount,
    description: DonationDescription,
    metadata: DonationMetadata,
    scheduledAt: Date | undefined
  ): Promise<
    Result<
      { donation: Donation; target?: Institute | OpinionLeader },
      ValidationError | Error
    >
  > {
    if (request.type === DonationType.DIRECT) {
      const donation = await this.createDirectDonation(
        donorId,
        amount,
        request.category,
        description,
        request.frequency,
        metadata,
        request,
        scheduledAt
      );
      return { success: true, data: { donation } };
    }

    if (request.type === DonationType.INSTITUTE) {
      if (!request.instituteId) {
        return this.fail("Invalid donation request", {
          requiredFields: ["instituteId"],
        });
      }

      const instituteResult = await this.createInstituteDonation(
        donorId,
        amount,
        request.category,
        description,
        request.frequency,
        metadata,
        request.instituteId,
        scheduledAt
      );

      if (!instituteResult.success) {
        return {
          success: false,
          error: isFailure(instituteResult)
            ? instituteResult.error
            : new Error("Unknown error"),
        };
      }

      return {
        success: true,
        data: {
          donation: instituteResult.data.donation,
          target: instituteResult.data.target,
        },
      };
    }

    if (request.type === DonationType.OPINION_LEADER) {
      if (!request.opinionLeaderId) {
        return this.fail("Invalid donation request", {
          requiredFields: ["opinionLeaderId"],
        });
      }

      const leaderResult = await this.createOpinionLeaderSupport(
        donorId,
        amount,
        request.category,
        description,
        request.frequency,
        metadata,
        request.opinionLeaderId,
        scheduledAt
      );

      if (!leaderResult.success) {
        return {
          success: false,
          error: isFailure(leaderResult)
            ? leaderResult.error
            : new Error("Unknown error"),
        };
      }

      return {
        success: true,
        data: {
          donation: leaderResult.data.donation,
          target: leaderResult.data.target,
        },
      };
    }

    return {
      success: false,
      error: new ValidationError("Invalid donation type", {
        donationType: request.type,
      }),
    };
  }

  private async fetchDonorHistory(donorId: UserId) {
    const donorHistoryResult = await this.donationRepository.findByDonorId(
      donorId
    );
    if (!donorHistoryResult.success) {
      return {
        success: false as const,
        error: isFailure(donorHistoryResult)
          ? donorHistoryResult.error
          : new Error("Unknown error"),
      };
    }

    return { success: true as const, data: donorHistoryResult.data.items };
  }

  private validateEligibilityIfTargetProvided(
    donorId: UserId,
    donation: Donation,
    donorBalance: number,
    donorHistory: Donation[],
    target: Institute | OpinionLeader | undefined
  ) {
    if (!target) return { success: true as const, data: undefined };

    const eligibilityResult =
      this.donationDomainService.validateDonationEligibility(
        donorId,
        donation,
        donorBalance,
        donorHistory,
        target
      );

    if (!eligibilityResult.isEligible) {
      return {
        success: false as const,
        error: new ValidationError("Donation eligibility failed", {
          reasons: eligibilityResult.reasons,
        }),
      };
    }

    return { success: true as const, data: undefined };
  }

  private async saveDonation(donation: Donation) {
    const saveResult = await this.donationRepository.save(donation);
    if (!saveResult.success) {
      return {
        success: false as const,
        error: isFailure(saveResult) ? saveResult.error : new Error("Unknown error"),
      };
    }

    return { success: true as const, data: donation };
  }

  async execute(
    donorId: UserId,
    request: CreateDonationRequest,
    donorBalance: number
  ): Promise<Result<Donation>> {
    const parsedResult = this.parseRequest(request);
    if (!parsedResult.success) return parsedResult;

    const parsedRequest = parsedResult.data;

    try {
      const amount = new DonationAmount(parsedRequest.amount);
      const description = new DonationDescription(parsedRequest.description);
      const metadata = this.buildMetadata(parsedRequest);
      const scheduledAt = this.getScheduledAt(parsedRequest);

      if (donorBalance < amount.getValue()) {
        return this.fail("Insufficient balance", {
          donorBalance,
          requiredAmount: amount.getValue(),
        });
      }

      const createResult = await this.createDonationByType(
        donorId,
        parsedRequest,
        amount,
        description,
        metadata,
        scheduledAt
      );
      if (!createResult.success) return createResult;
      const { donation, target } = createResult.data;

      const historyResult = await this.fetchDonorHistory(donorId);
      if (!historyResult.success) return historyResult;

      const eligibilityResult = this.validateEligibilityIfTargetProvided(
        donorId,
        donation,
        donorBalance,
        historyResult.data,
        target
      );
      if (!eligibilityResult.success) {
        return { success: false, error: eligibilityResult.error };
      }

      return this.saveDonation(donation);
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error : new Error("Unknown error occurred"),
      };
    }
  }

  private async createDirectDonation(
    donorId: UserId,
    amount: DonationAmount,
    category: DonationCategory,
    description: DonationDescription,
    frequency: DonationFrequency,
    metadata: DonationMetadata,
    request: CreateDonationRequest,
    scheduledAt?: Date
  ): Promise<Donation> {
    // 수혜자 정보 검증
    if (!request.beneficiaryName || !request.beneficiaryDescription) {
      throw new ValidationError(
        "Beneficiary information is required for direct donations",
        { requiredFields: ["beneficiaryName", "beneficiaryDescription"] }
      );
    }

    const _beneficiaryInfo = new BeneficiaryInfo(
      request.beneficiaryName,
      request.beneficiaryDescription,
      request.beneficiaryContact
    );

    const result = Donation.createDirectDonation({
      donorId,
      amount: amount.getValue(),
      beneficiaryName: request.beneficiaryName,
      beneficiaryId: request.beneficiaryContact, // 또는 적절한 ID 필드
      category,
      description: description.getValue(),
      frequency,
      metadata,
      scheduledAt,
    });

    if (!result.success) {
      throw isFailure(result) ? result.error : new Error("Unknown error");
    }

    return result.data;
  }

  private async createInstituteDonation(
    donorId: UserId,
    amount: DonationAmount,
    category: DonationCategory,
    description: DonationDescription,
    frequency: DonationFrequency,
    metadata: DonationMetadata,
    instituteId: string,
    _scheduledAt?: Date
  ): Promise<Result<{ donation: Donation; target: Institute }>> {
    // 기관 존재 및 상태 확인
    const instituteResult = await this.instituteRepository.findById(
      new InstituteId(instituteId)
    );
    if (!instituteResult.success) {
      return {
        success: false,
        error: isFailure(instituteResult)
          ? instituteResult.error
          : new Error("Unknown error"),
      };
    }

    if (!instituteResult.data) {
      return {
        success: false,
        error: new ValidationError("Institute not found", { instituteId }),
      };
    }

    const institute = instituteResult.data;
    if (!institute.canReceiveDonations()) {
      return {
        success: false,
        error: new ValidationError("Institute is not accepting donations", {
          instituteId,
        }),
      };
    }

    const donationResult = Donation.createInstituteDonation({
      donorId,
      amount: amount.getValue(),
      instituteId: new InstituteId(instituteId),
      category,
      description: description.getValue(),
      frequency,
      metadata,
      scheduledAt: _scheduledAt,
    });

    if (!donationResult.success) {
      return {
        success: false,
        error: isFailure(donationResult)
          ? donationResult.error
          : new Error("Unknown error"),
      };
    }

    return {
      success: true,
      data: {
        donation: donationResult.data,
        target: institute,
      },
    };
  }

  private async createOpinionLeaderSupport(
    donorId: UserId,
    amount: DonationAmount,
    category: DonationCategory,
    description: DonationDescription,
    frequency: DonationFrequency,
    metadata: DonationMetadata,
    opinionLeaderId: string,
    _scheduledAt?: Date
  ): Promise<Result<{ donation: Donation; target: OpinionLeader }>> {
    // 오피니언 리더 존재 및 상태 확인
    const leaderResult = await this.opinionLeaderRepository.findById(
      new OpinionLeaderId(opinionLeaderId)
    );
    if (!leaderResult.success) {
      return {
        success: false,
        error: isFailure(leaderResult)
          ? leaderResult.error
          : new Error("Unknown error"),
      };
    }

    if (!leaderResult.data) {
      return {
        success: false,
        error: new ValidationError("Opinion leader not found", {
          opinionLeaderId,
        }),
      };
    }

    const leader = leaderResult.data;
    if (!leader.canReceiveSupport()) {
      return {
        success: false,
        error: new ValidationError("Opinion leader is not accepting support", {
          opinionLeaderId,
        }),
      };
    }

    const donationResult = Donation.createOpinionLeaderSupport({
      donorId,
      amount: amount.getValue(),
      opinionLeaderId: new OpinionLeaderId(opinionLeaderId),
      category,
      description: description.getValue(),
      frequency,
      metadata,
      scheduledAt: _scheduledAt,
    });

    if (!donationResult.success) {
      return {
        success: false,
        error: isFailure(donationResult)
          ? donationResult.error
          : new Error("Unknown error"),
      };
    }

    return {
      success: true,
      data: {
        donation: donationResult.data,
        target: leader,
      },
    };
  }
}
