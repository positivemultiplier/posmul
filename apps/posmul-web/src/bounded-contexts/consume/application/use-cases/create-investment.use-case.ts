import type { Result, UserId } from "@posmul/auth-economy-sdk";
import { isFailure, ValidationError } from "@posmul/auth-economy-sdk";

// TODO: SDK로 마이그레이션 필요 // TODO: SDK로 마이그레이션 필요
import { Investment } from "../../domain/entities/investment.entity";
import { Advertisement } from "../../domain/entities/advertisement.entity";
import { CrowdFunding } from "../../domain/entities/crowdfunding.entity";
import { Merchant } from "../../domain/entities/merchant.entity";
import {
  IAdvertisementRepository,
  ICrowdFundingRepository,
  IInvestmentRepository,
  IMerchantRepository,
} from "../../domain/repositories";
import { InvestmentDomainService } from "../../domain/services/investment.domain-service";
import {
  AdvertisementId,
  CrowdFundingId,
  InvestmentType,
  MerchantId,
} from "../../domain/value-objects/investment-value-objects";
import {
  CreateInvestmentRequest,
  CreateInvestmentRequestSchema,
} from "../dto/investment.dto";

/**
 * Create Investment Use Case
 * 새로운 투자 생성 유스케이스
 */
export class CreateInvestmentUseCase {
  constructor(
    private readonly investmentRepository: IInvestmentRepository,
    private readonly merchantRepository: IMerchantRepository,
    private readonly advertisementRepository: IAdvertisementRepository,
    private readonly crowdFundingRepository: ICrowdFundingRepository
  ) {}

  private static readonly GENERIC_FAILURE_MESSAGE = "처리에 실패했습니다.";

  async execute(
    userId: UserId,
    request: CreateInvestmentRequest
  ): Promise<Result<{ investmentId: string; estimatedReturn: number }>> {
    try {
      const validDataResult = this.validateRequest(request);
      if (isFailure(validDataResult)) return validDataResult;
      const validData = validDataResult.data;

      const targetResult = await this.fetchInvestmentTarget(
        validData.type,
        validData.targetId
      );
      if (isFailure(targetResult)) return targetResult;

      const investmentResult = this.createInvestmentEntity(userId, validData);
      if (isFailure(investmentResult)) return investmentResult;

      const eligibilityResult = this.validateEligibility(
        investmentResult.data,
        targetResult.data
      );
      if (isFailure(eligibilityResult)) return eligibilityResult;

      const estimatedReturnResult = this.calculateEstimatedReturn(
        validData.type,
        targetResult.data,
        validData.amount,
        investmentResult.data
      );
      if (isFailure(estimatedReturnResult)) return estimatedReturnResult;

      const saveResult = await this.investmentRepository.save(
        investmentResult.data
      );
      if (!saveResult.success) {
        return this.fail(CreateInvestmentUseCase.GENERIC_FAILURE_MESSAGE);
      }

      return {
        success: true,
        data: {
          investmentId: investmentResult.data.getId().getValue(),
          estimatedReturn: estimatedReturnResult.data,
        },
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error
            : new Error("투자 생성 중 오류가 발생했습니다."),
      };
    }
  }

  private validateRequest(
    request: CreateInvestmentRequest
  ): Result<CreateInvestmentRequest> {
    const validationResult = CreateInvestmentRequestSchema.safeParse(request);
    if (!validationResult.success) {
      return {
        success: false,
        error: new ValidationError("입력 데이터가 유효하지 않습니다.", {
          validationErrors: validationResult.error?.flatten()?.fieldErrors || {},
        }),
      };
    }
    return { success: true, data: validationResult.data };
  }

  private createInvestmentEntity(
    userId: UserId,
    validData: CreateInvestmentRequest
  ): Result<Investment> {
    const investmentResult = Investment.create(
      userId,
      validData.type,
      validData.targetId,
      validData.amount,
      { message: validData.message || "Investment creation failed" }
    );

    if (!investmentResult.success) {
      return this.fail(CreateInvestmentUseCase.GENERIC_FAILURE_MESSAGE);
    }

    return investmentResult;
  }

  private validateEligibility(
    investment: Investment,
    target: Merchant | Advertisement | CrowdFunding
  ): Result<void> {
    const validationResult =
      InvestmentDomainService.validateInvestmentEligibility(investment, target);
    if (!validationResult.success) {
      return this.fail(CreateInvestmentUseCase.GENERIC_FAILURE_MESSAGE);
    }
    return { success: true, data: undefined };
  }

  private calculateEstimatedReturn(
    type: InvestmentType,
    target: Merchant | Advertisement | CrowdFunding,
    amount: number,
    investment: Investment
  ): Result<number> {
    const rewardRateResult = InvestmentDomainService.calculateRewardRate(
      type,
      target,
      amount
    );
    if (!rewardRateResult.success) {
      return this.fail(CreateInvestmentUseCase.GENERIC_FAILURE_MESSAGE);
    }

    const estimatedReturnResult =
      InvestmentDomainService.calculateInvestmentReward(
        investment,
        rewardRateResult.data
      );
    if (!estimatedReturnResult.success) {
      return this.fail(CreateInvestmentUseCase.GENERIC_FAILURE_MESSAGE);
    }

    return estimatedReturnResult;
  }

  private async fetchInvestmentTarget(
    type: InvestmentType,
    targetId: string
  ): Promise<Result<Merchant | Advertisement | CrowdFunding>> {
    switch (type) {
      case InvestmentType.LOCAL_LEAGUE:
        return this.fetchMerchantTarget(targetId);
      case InvestmentType.MAJOR_LEAGUE:
        return this.fetchAdvertisementTarget(targetId);
      case InvestmentType.CLOUD_FUNDING:
        return this.fetchCrowdFundingTarget(targetId);
      default:
        return this.fail("지원하지 않는 투자 타입입니다.");
    }
  }

  private async fetchMerchantTarget(targetId: string): Promise<Result<Merchant>> {
    const merchantIdResult = MerchantId.create(targetId);
    if (!merchantIdResult.success) {
      return this.fail(CreateInvestmentUseCase.GENERIC_FAILURE_MESSAGE);
    }

    const merchantResult = await this.merchantRepository.findById(
      merchantIdResult.data
    );
    if (!merchantResult.success || !merchantResult.data) {
      return this.fail("투자 대상 상점을 찾을 수 없습니다.");
    }

    return { success: true, data: merchantResult.data };
  }

  private async fetchAdvertisementTarget(
    targetId: string
  ): Promise<Result<Advertisement>> {
    const advertisementIdResult = AdvertisementId.create(targetId);
    if (!advertisementIdResult.success) {
      return this.fail(CreateInvestmentUseCase.GENERIC_FAILURE_MESSAGE);
    }

    const advertisementResult = await this.advertisementRepository.findById(
      advertisementIdResult.data
    );
    if (!advertisementResult.success || !advertisementResult.data) {
      return this.fail("투자 대상 광고를 찾을 수 없습니다.");
    }

    return { success: true, data: advertisementResult.data };
  }

  private async fetchCrowdFundingTarget(
    targetId: string
  ): Promise<Result<CrowdFunding>> {
    const crowdFundingIdResult = CrowdFundingId.create(targetId);
    if (!crowdFundingIdResult.success) {
      return this.fail(CreateInvestmentUseCase.GENERIC_FAILURE_MESSAGE);
    }

    const crowdFundingResult = await this.crowdFundingRepository.findById(
      crowdFundingIdResult.data
    );
    if (!crowdFundingResult.success || !crowdFundingResult.data) {
      return this.fail("투자 대상 크라우드 펀딩을 찾을 수 없습니다.");
    }

    return { success: true, data: crowdFundingResult.data };
  }

  private fail<T>(message: string): Result<T> {
    return {
      success: false,
      error: new Error(message),
    };
  }
}
