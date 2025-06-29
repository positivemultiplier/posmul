/**
 * Distribute Money Wave Use Case
 *
 * Money Wave 분배 시스템의 핵심 비즈니스 로직을 처리합니다.
 * - Money Wave 1: 일일 EBIT 기반 상금 풀 분배
 * - Money Wave 2: 미소비 PMC 재분배
 * - Money Wave 3: 기업가 맞춤형 예측 게임 요청 처리
 *
 * @author PosMul Development Team
 * @since 2024-12
 */

import { EconomyKernel } from "../../../../shared/economy-kernel/services/economy-kernel.service";
import { MoneyWaveCalculatorService } from "../../../../shared/economy-kernel/services/money-wave-calculator.service";
import { UseCaseError } from "../../../../shared/errors";
import {
  BaseDomainEvent,
  publishEvent,
} from "../../../../shared/events/domain-events";
import { UserId } from "@posmul/shared-types";
import { Result } from "@posmul/shared-types";
import { IPredictionGameRepository } from "../../domain/repositories/prediction-game.repository";
import {
  DistributeMoneyWaveRequest,
  DistributeMoneyWaveResponse,
  MoneyWaveDistributionType,
} from "../dto/prediction-use-case.dto";

/**
 * Money Wave 분배 완료 이벤트
 */
class MoneyWaveDistributedEvent extends BaseDomainEvent {
  constructor(
    waveId: string,
    waveType: MoneyWaveDistributionType,
    totalAmount: number,
    recipientCount: number,
    distributions: Array<{
      userId: UserId;
      amount: number;
      reason: string;
    }>
  ) {
    super("MONEY_WAVE_DISTRIBUTED", waveId, {
      waveType,
      totalAmount,
      recipientCount,
      distributions,
    });
  }
}

/**
 * PMC 분배 이벤트
 */
class PmcDistributedEvent extends BaseDomainEvent {
  constructor(
    userId: UserId,
    amount: number,
    source: string,
    sourceId: string,
    details: string
  ) {
    super("PMC_DISTRIBUTED", userId, {
      amount,
      source,
      sourceId,
      details,
    });
  }
}

/**
 * Money Wave 분배 Use Case
 */
export class DistributeMoneyWaveUseCase {
  constructor(
    private readonly predictionGameRepository: IPredictionGameRepository,
    private readonly economyKernel: EconomyKernel,
    private readonly moneyWaveCalculator: MoneyWaveCalculatorService
  ) {}

  async execute(
    request: DistributeMoneyWaveRequest
  ): Promise<Result<DistributeMoneyWaveResponse, UseCaseError>> {
    try {
      // 1. 입력 검증
      const validationResult = this.validateRequest(request);
      if (!validationResult.success) {
        return {
          success: false,
          error: new UseCaseError(
            "Invalid distribution request",
            validationResult.error
          ),
        };
      }

      // 2. Wave 타입에 따른 분배 처리
      let distributionResult: Result<DistributeMoneyWaveResponse, UseCaseError>;

      switch (request.waveType) {
        case MoneyWaveDistributionType.DAILY_PRIZE_POOL:
          distributionResult = await this.distributeDailyPrizePool(request);
          break;

        case MoneyWaveDistributionType.UNUSED_PMC_REDISTRIBUTION:
          distributionResult = await this.redistributeUnusedPmc(request);
          break;

        case MoneyWaveDistributionType.ENTREPRENEUR_REQUEST:
          distributionResult = await this.handleEntrepreneurRequest(request);
          break;

        default:
          return {
            success: false,
            error: new UseCaseError("Unsupported wave type"),
          };
      }

      if (!distributionResult.success) {
        return distributionResult;
      }

      // 3. Money Wave 분배 완료 이벤트 발행
      const waveDistributedEvent = new MoneyWaveDistributedEvent(
        distributionResult.data.waveId,
        request.waveType,
        distributionResult.data.totalAmountDistributed,
        distributionResult.data.recipientCount,
        distributionResult.data.distributionResults.map((r) => ({
          userId: r.userId,
          amount: r.amount,
          reason: r.reason,
        }))
      );

      await publishEvent(waveDistributedEvent);

      return distributionResult;
    } catch (error) {
      return {
        success: false,
        error: new UseCaseError(
          "Unexpected error in DistributeMoneyWaveUseCase",
          error as Error
        ),
      };
    }
  }

  /**
   * Money Wave 1: 일일 상금 풀 분배
   */
  private async distributeDailyPrizePool(
    request: DistributeMoneyWaveRequest
  ): Promise<Result<DistributeMoneyWaveResponse, UseCaseError>> {
    try {
      // 1. 일일 상금 풀 계산
      const prizePoolResult =
        await this.moneyWaveCalculator.calculateDailyPrizePool();
      if (!prizePoolResult.success) {
        return {
          success: false,
          error: new UseCaseError(
            "Failed to calculate daily prize pool",
            prizePoolResult.error
          ),
        };
      }

      const dailyPool = prizePoolResult.data.totalDailyPool;
      const waveId = `wave1-${new Date().toISOString().split("T")[0]}`;

      // 2. 활성 예측 게임들 조회
      const activeGamesResult =
        await this.predictionGameRepository.findByStatus("ACTIVE" as any);
      if (!activeGamesResult.success) {
        return {
          success: false,
          error: new UseCaseError(
            "Failed to retrieve active games",
            activeGamesResult.error
          ),
        };
      }

      const paginatedResult = activeGamesResult.data;
      const activeGames = paginatedResult.items || [];
      const distributionResults = [];

      // 3. 각 게임에 상금 배정 및 분배
      let totalDistributed = 0;
      let recipientCount = 0;

      for (const game of activeGames) {
        const participants = Array.from(game.predictions.values());

        if (participants.length > 0) {
          // 게임 중요도 기반 상금 배정
          const gameImportance = this.calculateGameImportance(game);
          const allocatedAmount = dailyPool * gameImportance;

          // 각 참여자에게 분배
          const perParticipantAmount = allocatedAmount / participants.length;

          for (const prediction of participants) {
            // PMC 분배 이벤트 발행
            const pmcDistributedEvent = new PmcDistributedEvent(
              (prediction as any).userId,
              perParticipantAmount,
              "daily-prize-pool",
              game.id,
              `Daily Money Wave 1 distribution for game "${game.configuration.title}"`
            );

            await publishEvent(pmcDistributedEvent);

            distributionResults.push({
              userId: (prediction as any).userId,
              amount: perParticipantAmount,
              reason: `Daily prize pool distribution - Game: ${game.configuration.title}`,
              success: true,
            });

            totalDistributed += perParticipantAmount;
            recipientCount++;
          }
        }
      }

      // 4. 분배 효율성 계산
      const efficiency = totalDistributed / dailyPool;
      const agencyCostReduction = this.calculateAgencyCostReduction(
        distributionResults.length,
        totalDistributed
      );

      return {
        success: true,
        data: {
          waveId,
          waveType: MoneyWaveDistributionType.DAILY_PRIZE_POOL,
          totalAmountDistributed: totalDistributed,
          recipientCount,
          distributionResults,
          efficiency,
          agencyCostReduction,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: new UseCaseError(
          "Failed to distribute daily prize pool",
          error as Error
        ),
      };
    }
  }

  /**
   * Money Wave 2: 미소비 PMC 재분배
   */
  private async redistributeUnusedPmc(
    request: DistributeMoneyWaveRequest
  ): Promise<Result<DistributeMoneyWaveResponse, UseCaseError>> {
    try {
      const waveId = `wave2-${crypto.randomUUID()}`;
      const distributionResults = [];

      // 1. 미소비 PMC 계산 및 재분배 로직 (간소화된 버전)
      const redistributionAmount = 1000; // 임시 고정값
      const targetUsers = request.targetUserIds || [];

      let totalDistributed = 0;
      let recipientCount = 0;

      // 2. 대상 사용자들에게 균등 분배
      if (targetUsers.length > 0) {
        const perUserAmount = redistributionAmount / targetUsers.length;

        for (const userId of targetUsers) {
          // PMC 분배 이벤트 발행
          const pmcDistributedEvent = new PmcDistributedEvent(
            userId,
            perUserAmount,
            "unused-pmc-redistribution",
            waveId,
            "Money Wave 2: Unused PMC redistribution"
          );

          await publishEvent(pmcDistributedEvent);

          distributionResults.push({
            userId,
            amount: perUserAmount,
            reason: "Unused PMC redistribution",
            success: true,
          });

          totalDistributed += perUserAmount;
          recipientCount++;
        }
      }

      const efficiency = targetUsers.length > 0 ? 1.0 : 0.0;
      const agencyCostReduction = this.calculateAgencyCostReduction(
        recipientCount,
        totalDistributed
      );

      return {
        success: true,
        data: {
          waveId,
          waveType: MoneyWaveDistributionType.UNUSED_PMC_REDISTRIBUTION,
          totalAmountDistributed: totalDistributed,
          recipientCount,
          distributionResults,
          efficiency,
          agencyCostReduction,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: new UseCaseError(
          "Failed to redistribute unused PMC",
          error as Error
        ),
      };
    }
  }

  /**
   * Money Wave 3: 기업가 요청 처리
   */
  private async handleEntrepreneurRequest(
    request: DistributeMoneyWaveRequest
  ): Promise<Result<DistributeMoneyWaveResponse, UseCaseError>> {
    try {
      const waveId = `wave3-${crypto.randomUUID()}`;
      const distributionResults = [];

      // 1. 기업가 요청 처리 로직 (간소화된 버전)
      const incentiveAmount = 500; // 임시 고정값
      const entrepreneurId = request.triggerUserId;

      // 2. 기업가에게 인센티브 지급
      const pmcDistributedEvent = new PmcDistributedEvent(
        entrepreneurId,
        incentiveAmount,
        "entrepreneur-incentive",
        waveId,
        "Money Wave 3: Entrepreneur request incentive"
      );

      await publishEvent(pmcDistributedEvent);

      distributionResults.push({
        userId: entrepreneurId,
        amount: incentiveAmount,
        reason: "Entrepreneur request incentive",
        success: true,
      });

      const efficiency = 1.0;
      const agencyCostReduction = this.calculateAgencyCostReduction(
        1,
        incentiveAmount
      );

      return {
        success: true,
        data: {
          waveId,
          waveType: MoneyWaveDistributionType.ENTREPRENEUR_REQUEST,
          totalAmountDistributed: incentiveAmount,
          recipientCount: 1,
          distributionResults,
          efficiency,
          agencyCostReduction,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: new UseCaseError(
          "Failed to handle entrepreneur request",
          error as Error
        ),
      };
    }
  }

  /**
   * 게임 중요도 계산
   */
  private calculateGameImportance(game: any): number {
    // 게임 중요도 계산 로직 (간소화된 버전)
    const baseImportance = 0.1; // 10% 기본 배정
    const participantBonus = Math.min(game.predictions.size * 0.01, 0.05); // 참여자 수 보너스
    return Math.min(baseImportance + participantBonus, 0.25); // 최대 25%
  }

  /**
   * Agency Cost 감소량 계산
   */
  private calculateAgencyCostReduction(
    recipientCount: number,
    totalAmount: number
  ): number {
    // Agency Theory 기반 비용 감소량 계산
    const networkEffect = Math.log(1 + recipientCount) / 10;
    const incentiveEffect = Math.log(1 + totalAmount) / 1000;
    return Math.min(networkEffect + incentiveEffect, 1.0);
  }

  /**
   * 요청 검증
   */
  private validateRequest(
    request: DistributeMoneyWaveRequest
  ): Result<void, Error> {
    if (!request.waveType) {
      return {
        success: false,
        error: new Error("Wave type is required"),
      };
    }

    if (!request.triggerUserId) {
      return {
        success: false,
        error: new Error("Trigger user ID is required"),
      };
    }

    // Wave 타입별 추가 검증
    switch (request.waveType) {
      case MoneyWaveDistributionType.UNUSED_PMC_REDISTRIBUTION:
        if (!request.targetUserIds || request.targetUserIds.length === 0) {
          return {
            success: false,
            error: new Error(
              "Target user IDs are required for PMC redistribution"
            ),
          };
        }
        break;
    }

    return { success: true, data: undefined };
  }
}
