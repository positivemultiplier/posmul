import { Result } from "@posmul/auth-economy-sdk";
import { UserId } from "@posmul/auth-economy-sdk";

import { IMerchantRepository } from "../../domain/repositories/merchant.repository";
import {
  CreateMerchantRequest,
  MerchantListRequest,
  MerchantListResponse,
  MerchantResponse,
} from "../dto/merchant.dto";
import { CreateMerchantUseCase } from "../use-cases/create-merchant.use-case";

/**
 * Merchant Application Service
 * 상점 관련 애플리케이션 서비스
 */
export class MerchantApplicationService {
  private readonly createMerchantUseCase: CreateMerchantUseCase;

  constructor(private readonly merchantRepository: IMerchantRepository) {
    this.createMerchantUseCase = new CreateMerchantUseCase(merchantRepository);
  }

  /**
   * 새 상점 생성
   */
  async createMerchant(
    ownerId: UserId,
    request: CreateMerchantRequest
  ): Promise<Result<{ merchantId: string }>> {
    return this.createMerchantUseCase.execute(ownerId, request);
  }
  /**
   * 상점 목록 조회
   */
  async getMerchants(
    request: MerchantListRequest
  ): Promise<Result<MerchantListResponse>> {
    try {
      const result = await this.merchantRepository.findByCategory(
        request.category?.toString() || "",
        request.limit,
        request.offset
      );

      if (!result.success) {
        return {
          success: false,
          error: new Error("처리에 실패했습니다."),
        };
      }

      const merchants: MerchantResponse[] = result.data.merchants.map(
        (merchant) => ({
          id: merchant.getId().getValue(),
          name: merchant.getName(),
          description: merchant.getDescription(),
          category: merchant.getCategory(),
          status: merchant.getStatus().toString(),
          location: {
            region: merchant.getLocation().getRegion(),
            city: "", // Location 구조에 맞게 수정 필요
            address: merchant.getLocation().getAddress(),
            district: merchant.getLocation().getDistrict(),
          },
          contactInfo: {
            phone: merchant.getContactInfo().phone || "",
            email: merchant.getContactInfo().email,
            website: merchant.getContactInfo().website,
          },
          businessHours: {
            open: "09:00",
            close: "18:00",
          },
          rewardRate: {
            rate: merchant.getRewardRate().getRate(),
            type: merchant.getRewardRate().getType(),
          },
          qrCode: merchant.getCurrentQRCode()?.getCode() || "",
          createdAt: merchant.getCreatedAt(),
          updatedAt: merchant.getUpdatedAt(),
        })
      );

      return {
        success: true,
        data: {
          merchants,
          total: result.data.total,
          limit: request.limit,
          offset: request.offset,
        },
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error
            : new Error("상점 목록 조회 중 오류가 발생했습니다."),
      };
    }
  }

  /**
   * 상점 상세 조회
   */
  async getMerchantById(
    merchantId: string
  ): Promise<Result<MerchantResponse | null>> {
    try {
      const merchantIdResult = await import(
        "../../domain/value-objects/investment-value-objects"
      ).then((module) => module.MerchantId.create(merchantId));

      if (!merchantIdResult.success) {
        return {
          success: false,
          error: new Error("처리에 실패했습니다."),
        };
      }

      const result = await this.merchantRepository.findById(
        merchantIdResult.data
      );

      if (!result.success) {
        return {
          success: false,
          error: new Error("처리에 실패했습니다."),
        };
      }

      if (!result.data) {
        return { success: true, data: null };
      }

      const merchant = result.data;
      return {
        success: true,
        data: {
          id: merchant.getId().getValue(),
          name: merchant.getName(),
          description: merchant.getDescription(),
          category: merchant.getCategory(),
          status: merchant.getStatus().toString(),
          location: {
            region: merchant.getLocation().getRegion(),
            city: "",
            address: merchant.getLocation().getAddress(),
            district: merchant.getLocation().getDistrict(),
          },
          contactInfo: {
            phone: merchant.getContactInfo().phone || "",
            email: merchant.getContactInfo().email,
            website: merchant.getContactInfo().website,
          },
          businessHours: {
            open: "09:00",
            close: "18:00",
          },
          rewardRate: {
            rate: merchant.getRewardRate().getRate(),
            type: merchant.getRewardRate().getType(),
          },
          qrCode: merchant.getCurrentQRCode()?.getCode() || "",
          createdAt: merchant.getCreatedAt(),
          updatedAt: merchant.getUpdatedAt(),
        },
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error
            : new Error("상점 조회 중 오류가 발생했습니다."),
      };
    }
  }

  /**
   * 상점 검색
   */
  async searchMerchants(
    query: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<Result<MerchantListResponse>> {
    try {
      const result = await this.merchantRepository.search(query, limit, offset);

      if (!result.success) {
        return {
          success: false,
          error: new Error("처리에 실패했습니다."),
        };
      }

      const merchants: MerchantResponse[] = result.data.merchants.map(
        (merchant) => ({
          id: merchant.getId().getValue(),
          name: merchant.getName(),
          description: merchant.getDescription(),
          category: merchant.getCategory(),
          status: merchant.getStatus(),
          location: {
            region: merchant.getLocation().getRegion(),
            city: "",
            address: merchant.getLocation().getAddress(),
            district: merchant.getLocation().getDistrict(),
          },
          contactInfo: {
            phone: merchant.getContactInfo().phone || "",
            email: merchant.getContactInfo().email,
            website: merchant.getContactInfo().website,
          },
          businessHours: {
            open: "09:00",
            close: "18:00",
          },
          rewardRate: {
            rate: merchant.getRewardRate().getRate(),
            type: merchant.getRewardRate().getType(),
          },
          qrCode: merchant.getCurrentQRCode()?.getCode() || "",
          createdAt: merchant.getCreatedAt(),
          updatedAt: merchant.getUpdatedAt(),
        })
      );

      return {
        success: true,
        data: {
          merchants,
          total: result.data.total,
          limit,
          offset,
        },
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error
            : new Error("상점 검색 중 오류가 발생했습니다."),
      };
    }
  }
}
