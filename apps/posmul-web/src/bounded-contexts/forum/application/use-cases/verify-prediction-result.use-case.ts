/**
 * Verify Prediction Result Use Case
 * KOSIS 실제 데이터로 예측 결과를 검증하고 정산하는 유스케이스
 */
import { Result } from "@posmul/auth-economy-sdk";
import { KOSISClient } from "../../../demographic-data/infrastructure/api-clients/kosis.client";
import {
  IForumPredictionLinkRepository,
  IPredictionRepository,
  ForumPredictionLink,
} from "./create-prediction-from-forum.use-case";

/**
 * 검증 요청 DTO
 */
export interface VerifyPredictionRequest {
  predictionId: string;
}

/**
 * 검증 결과 DTO
 */
export interface VerifyPredictionResult {
  predictionId: string;
  status: "VERIFIED" | "PENDING" | "ERROR";
  actualValue?: number;
  unit?: string;
  source?: string;
  verifiedAt?: Date;
  message: string;
  settlementTriggered: boolean;
}

/**
 * 일괄 검증 결과
 */
export interface BatchVerifyResult {
  total: number;
  verified: number;
  pending: number;
  errors: number;
  results: VerifyPredictionResult[];
}

/**
 * VerifyPredictionResultUseCase
 * KOSIS API에서 실제 데이터를 조회하여 예측 결과 검증
 */
export class VerifyPredictionResultUseCase {
  constructor(
    private readonly forumPredictionLinkRepository: IForumPredictionLinkRepository,
    private readonly predictionRepository: IPredictionRepository,
    private readonly kosisClient: KOSISClient,
    private readonly settlementService?: ISettlementService
  ) {}

  /**
   * 단일 예측 검증
   */
  async execute(request: VerifyPredictionRequest): Promise<Result<VerifyPredictionResult>> {
    try {
      // 1. Forum-Prediction Link 조회
      const linkResult = await this.forumPredictionLinkRepository.findByPredictionId(
        request.predictionId
      );

      if (!linkResult.success) {
        const failedResult = linkResult as { success: false; error: Error };
        return { success: false, error: failedResult.error };
      }

      if (!linkResult.data) {
        return {
          success: true,
          data: {
            predictionId: request.predictionId,
            status: "ERROR",
            message: "연계된 인구통계 정보를 찾을 수 없습니다.",
            settlementTriggered: false,
          },
        };
      }

      const link = linkResult.data;

      // 2. KOSIS에서 실제 데이터 조회
      const kosisResult = await this.kosisClient.fetchMonthlyData(
        link.statCategory,
        link.regionCode,
        link.targetYear,
        link.targetMonth ?? 1
      );

      if (!kosisResult.success || !kosisResult.data || kosisResult.data.length === 0) {
        return {
          success: true,
          data: {
            predictionId: request.predictionId,
            status: "PENDING",
            message: `${link.targetYear}년 ${link.targetMonth}월 데이터가 아직 공개되지 않았습니다.`,
            settlementTriggered: false,
          },
        };
      }

      // 3. 데이터 파싱
      const parsedData = KOSISClient.parseStatItem(kosisResult.data[0], link.statCategory);

      if (!parsedData) {
        return {
          success: true,
          data: {
            predictionId: request.predictionId,
            status: "ERROR",
            message: "KOSIS 데이터 파싱에 실패했습니다.",
            settlementTriggered: false,
          },
        };
      }

      const actualValue = parsedData.value;
      const unit = parsedData.unit;
      const now = new Date();

      // 4. 예측 정산 실행
      let settlementTriggered = false;
      if (this.settlementService) {
        const settleResult = await this.settlementService.settlePrediction(
          request.predictionId,
          actualValue
        );
        settlementTriggered = settleResult.success;
      }

      // 5. 예측 상태 업데이트
      await this.predictionRepository.settle(request.predictionId, actualValue);

      return {
        success: true,
        data: {
          predictionId: request.predictionId,
          status: "VERIFIED",
          actualValue,
          unit,
          source: "KOSIS",
          verifiedAt: now,
          message: `실제 값: ${actualValue.toLocaleString()}${unit} (KOSIS 확인)`,
          settlementTriggered,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error("Unknown error"),
      };
    }
  }

  /**
   * 마감된 모든 예측 일괄 검증
   */
  async verifyAllExpired(): Promise<Result<BatchVerifyResult>> {
    try {
      // 마감된 예측 목록 조회 (구현 필요)
      // 현재는 빈 결과 반환
      return {
        success: true,
        data: {
          total: 0,
          verified: 0,
          pending: 0,
          errors: 0,
          results: [],
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error("Unknown error"),
      };
    }
  }

  /**
   * 특정 월의 모든 예측 검증
   */
  async verifyByTargetPeriod(
    _year: number,
    _month: number
  ): Promise<Result<BatchVerifyResult>> {
    try {
      // 해당 기간 예측 목록 조회 및 일괄 검증 (구현 필요)
      return {
        success: true,
        data: {
          total: 0,
          verified: 0,
          pending: 0,
          errors: 0,
          results: [],
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error("Unknown error"),
      };
    }
  }
}

/**
 * Settlement Service Interface
 */
export interface ISettlementService {
  settlePrediction(predictionId: string, actualValue: number): Promise<Result<SettlementResult>>;
}

export interface SettlementResult {
  predictionId: string;
  totalParticipants: number;
  winners: number;
  losers: number;
  totalPmpDistributed: number;
  totalPmcConverted: number;
}

/**
 * GetPredictionStatusUseCase
 * 예측 게임 상태 조회
 */
export class GetPredictionStatusUseCase {
  constructor(
    private readonly forumPredictionLinkRepository: IForumPredictionLinkRepository,
    private readonly predictionRepository: IPredictionRepository
  ) {}

  async execute(predictionId: string): Promise<Result<PredictionStatusResult>> {
    try {
      // 1. 예측 게임 조회
      const predictionResult = await this.predictionRepository.findById(predictionId);

      if (!predictionResult.success) {
        const failedResult = predictionResult as { success: false; error: Error };
        return { success: false, error: failedResult.error };
      }

      if (!predictionResult.data) {
        return {
          success: false,
          error: new Error("예측 게임을 찾을 수 없습니다."),
        };
      }

      // 2. 연계 정보 조회
      const linkResult = await this.forumPredictionLinkRepository.findByPredictionId(predictionId);

      return {
        success: true,
        data: {
          predictionId,
          title: predictionResult.data.title,
          status: predictionResult.data.status,
          actualValue: predictionResult.data.actualValue,
          settledAt: predictionResult.data.settledAt,
          link: linkResult.success ? linkResult.data : null,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error("Unknown error"),
      };
    }
  }
}

export interface PredictionStatusResult {
  predictionId: string;
  title: string;
  status: string;
  actualValue?: number;
  settledAt?: Date;
  link: ForumPredictionLink | null;
}
