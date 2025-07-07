import { UserId } from "@posmul/auth-economy-sdk";

import { Result } from "@posmul/auth-economy-sdk";
import { ValidationError } from "@posmul/auth-economy-sdk";
 // TODO: SDK로 마이그레이션 필요 // TODO: SDK로 마이그레이션 필요
import { Advertisement } from "../../domain/entities/advertisement.entity";
import { IAdvertisementRepository } from "../../domain/repositories/advertisement.repository";
import {
  AdvertisementId,
  RewardRate,
  ViewingDuration,
} from "../../domain/value-objects/investment-value-objects";
import {
  CreateAdvertisementRequest,
  CreateAdvertisementRequestSchema,
} from "../dto/advertisement.dto";

/**
 * Create Advertisement Use Case
 * 새로운 광고 생성 유스케이스
 */
export class CreateAdvertisementUseCase {
  constructor(
    private readonly advertisementRepository: IAdvertisementRepository
  ) {}

  async execute(
    advertiserId: UserId,
    request: CreateAdvertisementRequest
  ): Promise<Result<{ advertisementId: string }>> {
    try {
      // 요청 데이터 검증
      const validationResult =
        CreateAdvertisementRequestSchema.safeParse(request);
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
      const advertisementIdResult = AdvertisementId.create(crypto.randomUUID());
      if (!advertisementIdResult.success) {
        return advertisementIdResult;
      }

      const viewingDurationResult = ViewingDuration.create(
        validData.viewingDuration,
        80
      ); // 80% 완료율 기본값
      if (!viewingDurationResult.success) {
        return viewingDurationResult;
      }

      const rewardRateResult = RewardRate.createPercentage(
        validData.rewardRate
      );
      if (!rewardRateResult.success) {
        return rewardRateResult;
      } // Advertisement 엔티티 생성 (기존 create 메서드 시그니처에 맞춤)
      const advertisementResult = Advertisement.create(
        validData.title,
        validData.description,
        validData.category,
        validData.content.videoUrl || validData.content.imageUrl || "",
        validData.content.imageUrl || "", // thumbnail
        viewingDurationResult.data,
        validData.targetAudience?.regions || [],
        rewardRateResult.data,
        advertiserId,
        { budget: validData.budget, maxViews: validData.maxViews }
      );

      if (!advertisementResult.success) {
        return advertisementResult;
      }

      // 데이터베이스에 저장
      const saveResult = await this.advertisementRepository.save(
        advertisementResult.data
      );
      if (!saveResult.success) {
        return saveResult;
      }

      return {
        success: true,
        data: { advertisementId: advertisementResult.data.getId().getValue() },
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error
            : new Error("광고 생성 중 오류가 발생했습니다."),
      };
    }
  }
}
