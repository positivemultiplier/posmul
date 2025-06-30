import { Result, UserId, ValidationError } from "@posmul/shared-types";
import { Investment } from "../../domain/entities/investment.entity";
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

  async execute(
    userId: UserId,
    request: CreateInvestmentRequest
  ): Promise<Result<{ investmentId: string; estimatedReturn: number }>> {
    try {
      // 요청 데이터 검증
      const validationResult = CreateInvestmentRequestSchema.safeParse(request);
      if (!validationResult.success) {
        return {
          success: false,
          error: new ValidationError(
            "입력 데이터가 유효하지 않습니다.",
            undefined,
            validationResult.error.flatten().fieldErrors
          ),
        };
      }

      const validData = validationResult.data; // 투자 대상 조회
      let target = null;
      switch (validData.type) {
        case InvestmentType.LOCAL_LEAGUE:
          const merchantIdResult = MerchantId.create(validData.targetId);
          if (!merchantIdResult.success) {
            return merchantIdResult;
          }
          const merchantResult = await this.merchantRepository.findById(
            merchantIdResult.data
          );
          if (!merchantResult.success || !merchantResult.data) {
            return {
              success: false,
              error: new Error("투자 대상 상점을 찾을 수 없습니다."),
            };
          }
          target = merchantResult.data;
          break;

        case InvestmentType.MAJOR_LEAGUE:
          const advertisementIdResult = AdvertisementId.create(
            validData.targetId
          );
          if (!advertisementIdResult.success) {
            return advertisementIdResult;
          }
          const advertisementResult =
            await this.advertisementRepository.findById(
              advertisementIdResult.data
            );
          if (!advertisementResult.success || !advertisementResult.data) {
            return {
              success: false,
              error: new Error("투자 대상 광고를 찾을 수 없습니다."),
            };
          }
          target = advertisementResult.data;
          break;

        case InvestmentType.CLOUD_FUNDING:
          const crowdFundingIdResult = CrowdFundingId.create(
            validData.targetId
          );
          if (!crowdFundingIdResult.success) {
            return crowdFundingIdResult;
          }
          const crowdFundingResult = await this.crowdFundingRepository.findById(
            crowdFundingIdResult.data
          );
          if (!crowdFundingResult.success || !crowdFundingResult.data) {
            return {
              success: false,
              error: new Error("투자 대상 크라우드 펀딩을 찾을 수 없습니다."),
            };
          }
          target = crowdFundingResult.data;
          break;

        default:
          return {
            success: false,
            error: new Error("지원하지 않는 투자 타입입니다."),
          };
      }

      // Investment 엔티티 생성
      const investmentResult = Investment.create(
        userId,
        validData.type,
        validData.targetId,
        validData.amount,
        { message: validData.message || "" }
      );

      if (!investmentResult.success) {
        return investmentResult;
      }

      // 도메인 서비스를 통한 투자 검증
      const validationResult2 =
        InvestmentDomainService.validateInvestmentEligibility(
          investmentResult.data,
          target
        );

      if (!validationResult2.success) {
        return validationResult2;
      }

      // 보상률 계산
      const rewardRateResult = InvestmentDomainService.calculateRewardRate(
        validData.type,
        target,
        validData.amount
      );

      if (!rewardRateResult.success) {
        return rewardRateResult;
      }

      // 예상 수익 계산
      const estimatedReturnResult =
        InvestmentDomainService.calculateInvestmentReward(
          investmentResult.data,
          rewardRateResult.data
        );

      if (!estimatedReturnResult.success) {
        return estimatedReturnResult;
      }

      // 데이터베이스에 저장
      const saveResult = await this.investmentRepository.save(
        investmentResult.data
      );
      if (!saveResult.success) {
        return saveResult;
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
}
