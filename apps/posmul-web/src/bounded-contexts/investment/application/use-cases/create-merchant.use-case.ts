import { Result, UserId, ValidationError } from "@posmul/shared-types";
import {
  BusinessHours,
  ContactInfo,
  Merchant,
} from "../../domain/entities/merchant.entity";
import { IMerchantRepository } from "../../domain/repositories/merchant.repository";
import {
  Location,
  MerchantId,
  RewardRate,
} from "../../domain/value-objects/investment-value-objects";
import {
  CreateMerchantRequest,
  CreateMerchantRequestSchema,
} from "../dto/merchant.dto";

/**
 * Create Merchant Use Case
 * 새로운 상점 등록 유스케이스
 */
export class CreateMerchantUseCase {
  constructor(private readonly merchantRepository: IMerchantRepository) {}

  async execute(
    ownerId: UserId,
    request: CreateMerchantRequest
  ): Promise<Result<{ merchantId: string }>> {
    try {
      // 요청 데이터 검증
      const validationResult = CreateMerchantRequestSchema.safeParse(request);
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

      const validData = validationResult.data;

      // Value Objects 생성
      const merchantIdResult = MerchantId.create(crypto.randomUUID());
      if (!merchantIdResult.success) {
        return merchantIdResult;
      }

      // 임시로 위도/경도는 0으로 설정 (실제로는 주소 기반 지오코딩 필요)
      const locationResult = Location.create(
        validData.location.address,
        0, // latitude
        0, // longitude
        validData.location.region,
        validData.location.district
      );
      if (!locationResult.success) {
        return locationResult;
      }

      const rewardRateResult = RewardRate.createPercentage(
        validData.rewardRate
      );
      if (!rewardRateResult.success) {
        return rewardRateResult;
      }

      // 임시 BusinessHours와 ContactInfo (실제로는 DTO에서 변환 필요)
      const businessHours = {
        monday: {
          open: validData.businessHours.open,
          close: validData.businessHours.close,
        },
        tuesday: {
          open: validData.businessHours.open,
          close: validData.businessHours.close,
        },
        wednesday: {
          open: validData.businessHours.open,
          close: validData.businessHours.close,
        },
        thursday: {
          open: validData.businessHours.open,
          close: validData.businessHours.close,
        },
        friday: {
          open: validData.businessHours.open,
          close: validData.businessHours.close,
        },
        saturday: {
          open: validData.businessHours.open,
          close: validData.businessHours.close,
        },
        sunday: {
          open: validData.businessHours.open,
          close: validData.businessHours.close,
        },
      };

      const contactInfo = {
        phone: validData.contactInfo.phone,
        email: validData.contactInfo.email,
        website: validData.contactInfo.website,
      }; // Merchant 엔티티 생성 (ID는 엔티티 내부에서 생성됨)
      const merchantResult = Merchant.create(
        validData.name,
        validData.category,
        validData.description,
        locationResult.data,
        ownerId,
        rewardRateResult.data,
        businessHours as BusinessHours,
        contactInfo as ContactInfo
      );

      if (!merchantResult.success) {
        return merchantResult;
      }

      // 데이터베이스에 저장
      const saveResult = await this.merchantRepository.save(
        merchantResult.data
      );
      if (!saveResult.success) {
        return saveResult;
      }

      return {
        success: true,
        data: { merchantId: merchantResult.data.getId().getValue() },
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error
            : new Error("상점 생성 중 오류가 발생했습니다."),
      };
    }
  }
}
