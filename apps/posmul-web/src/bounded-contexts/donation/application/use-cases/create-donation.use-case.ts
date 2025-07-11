/**
 * Create Donation Use Case
 * 기부 생성 유스케이스
 */

import { Result, isFailure, UserId } from "@posmul/auth-economy-sdk";
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

  async execute(
    donorId: UserId,
    request: CreateDonationRequest,
    donorBalance: number
  ): Promise<Result<Donation>> {
    // 입력 데이터 검증
    const validationResult = CreateDonationRequestSchema.safeParse(request);
    if (!validationResult.success) {
      return {
        success: false,
        error: new ValidationError("Invalid donation request", {
          details: validationResult.error.errors
            .map((e) => e.message)
            .join(", "),
        }),
      };
    }

    try {
      // Value Objects 생성
      const amount = new DonationAmount(request.amount);
      const description = new DonationDescription(request.description);

      // 기부 메타데이터 구성
      const metadata: DonationMetadata = {
        isAnonymous: request.isAnonymous,
        message: request.message,
        dedicatedTo: request.dedicatedTo,
        taxDeductible: request.taxDeductible,
        receiptRequired: request.receiptRequired,
      };

      // 예약 날짜 처리
      const scheduledAt = request.scheduledAt
        ? new Date(request.scheduledAt)
        : undefined;

      // 기부 타입별 엔티티 생성
      let donation: Donation;
      let target: Institute | OpinionLeader | undefined;

      switch (request.type) {
        case DonationType.DIRECT:
          donation = await this.createDirectDonation(
            donorId,
            amount,
            request.category,
            description,
            request.frequency,
            metadata,
            request,
            scheduledAt
          );
          break;

        case DonationType.INSTITUTE:
          const instituteResult = await this.createInstituteDonation(
            donorId,
            amount,
            request.category,
            description,
            request.frequency,
            metadata,
            request.instituteId!,
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

          donation = instituteResult.data.donation;
          target = instituteResult.data.target;
          break;

        case DonationType.OPINION_LEADER:
          const leaderResult = await this.createOpinionLeaderSupport(
            donorId,
            amount,
            request.category,
            description,
            request.frequency,
            metadata,
            request.opinionLeaderId!,
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

          donation = leaderResult.data.donation;
          target = leaderResult.data.target;
          break;

        default:
          return {
            success: false,
            error: new ValidationError("Invalid donation type", {
              donationType: request.type,
            }),
          };
      }

      // 기부자 기부 내역 조회
      const donorHistoryResult =
        await this.donationRepository.findByDonorId(donorId);
      if (!donorHistoryResult.success) {
        return {
          success: false,
          error: isFailure(donorHistoryResult)
            ? donorHistoryResult.error
            : new Error("Unknown error"),
        };
      }

      const donorHistory = donorHistoryResult.data.items;

      // 기부 적격성 검증
      if (target) {
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
            success: false,
            error: new ValidationError("Donation eligibility failed", {
              reasons: eligibilityResult.reasons,
            }),
          };
        }
      }

      // 기부 저장
      const saveResult = await this.donationRepository.save(donation);
      if (!saveResult.success) {
        return {
          success: false,
          error: isFailure(saveResult)
            ? saveResult.error
            : new Error("Unknown error"),
        };
      }

      return {
        success: true,
        data: donation,
      };
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

    const beneficiaryInfo = new BeneficiaryInfo(
      request.beneficiaryName,
      request.beneficiaryDescription,
      request.beneficiaryContact
    );

    const result = Donation.createDirectDonation(
      donorId,
      amount,
      category,
      description,
      beneficiaryInfo,
      frequency,
      metadata,
      scheduledAt
    );

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
    scheduledAt?: Date
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

    const donationResult = Donation.createInstituteDonation(
      donorId,
      amount,
      category,
      description,
      new InstituteId(instituteId),
      frequency,
      metadata,
      scheduledAt
    );

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
    scheduledAt?: Date
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

    const donationResult = Donation.createOpinionLeaderSupport(
      donorId,
      amount,
      category,
      description,
      new OpinionLeaderId(opinionLeaderId),
      frequency,
      metadata,
      scheduledAt
    );

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
