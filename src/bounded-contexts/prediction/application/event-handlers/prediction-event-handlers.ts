/**
 * Prediction Domain Event Handlers
 *
 * 예측 도메인에서 발생하는 이벤트들을 처리하는 핸들러들을 정의합니다.
 * 경제 시스템과의 통신 및 다른 도메인과의 상호작용을 담당합니다.
 *
 * @author PosMul Development Team
 * @since 2024-12
 */

import {
  PmcEarnedEvent,
  PmcSpentEvent,
  PmpEarnedEvent,
  PmpSpentEvent,
} from "@/shared/economy-kernel/events/economic-events";
import {
  HandlerError,
  IDomainEventSubscriber,
} from "@/shared/events/event-publisher";
import { Result } from "@/shared/types/common";
import {
  MoneyWaveDistributionCompletedEvent,
  PmcEarnedFromPredictionEvent,
  PmpSpentForPredictionEvent,
  PredictionGameSettledEvent,
  PredictionParticipatedEvent,
} from "../../../prediction/domain/events/prediction-game-events";

/**
 * 예측 참여 이벤트 핸들러
 * PMP 차감 이벤트를 경제 시스템으로 전파합니다.
 */
export class PredictionParticipatedEventHandler
  implements IDomainEventSubscriber<PredictionParticipatedEvent>
{
  readonly eventType = "PredictionParticipated";
  readonly subscriberId = "prediction-participated-handler";

  async handle(
    event: PredictionParticipatedEvent
  ): Promise<Result<void, HandlerError>> {
    try {
      console.log(
        `[PredictionParticipatedEventHandler] Processing event: ${event.id}`
      );

      // 1. 통계 업데이트 (실제 구현에서는 통계 서비스 호출)
      await this.updateParticipationStats(event);

      // 2. 실시간 알림 발송 (실제 구현에서는 알림 서비스 호출)
      await this.sendParticipationNotification(event);

      // 3. 게임 상태 업데이트 체크 (참여자 수 기반)
      await this.checkGameStateUpdate(event);

      console.log(
        `[PredictionParticipatedEventHandler] Successfully processed event: ${event.id}`
      );

      return { success: true, data: undefined };
    } catch (error) {
      console.error(
        `[PredictionParticipatedEventHandler] Error processing event: ${event.id}`,
        error
      );

      return {
        success: false,
        error: new HandlerError(
          `Failed to handle PredictionParticipated event: ${
            error instanceof Error ? error.message : "Unknown error"
          }`,
          error instanceof Error ? error : undefined,
          this.subscriberId
        ),
      };
    }
  }

  private async updateParticipationStats(
    event: PredictionParticipatedEvent
  ): Promise<void> {
    // TODO: 실제 통계 서비스와 연동
    console.log(
      `[Stats] User ${event.userId} participated in game ${event.gameId} with stake ${event.stakeAmount}`
    );
  }

  private async sendParticipationNotification(
    event: PredictionParticipatedEvent
  ): Promise<void> {
    // TODO: 실제 알림 서비스와 연동
    console.log(
      `[Notification] Participation notification sent for user ${event.userId}`
    );
  }

  private async checkGameStateUpdate(
    event: PredictionParticipatedEvent
  ): Promise<void> {
    // TODO: 게임 상태 업데이트 로직
    console.log(`[GameState] Checking state update for game ${event.gameId}`);
  }
}

/**
 * PMP 지출 이벤트 핸들러
 * 경제 시스템의 PMP 지출을 처리합니다.
 */
export class PmpSpentForPredictionEventHandler
  implements IDomainEventSubscriber<PmpSpentForPredictionEvent>
{
  readonly eventType = "PmpSpentForPrediction";
  readonly subscriberId = "pmp-spent-prediction-handler";

  async handle(
    event: PmpSpentForPredictionEvent
  ): Promise<Result<void, HandlerError>> {
    try {
      console.log(
        `[PmpSpentForPredictionEventHandler] Processing event: ${event.id}`
      );

      // 1. 경제 시스템 트랜잭션 기록
      await this.recordEconomicTransaction(event);

      // 2. 사용자 잔액 업데이트 확인
      await this.verifyBalanceUpdate(event);

      // 3. 감사 로그 생성
      await this.createAuditLog(event);

      console.log(
        `[PmpSpentForPredictionEventHandler] Successfully processed event: ${event.id}`
      );

      return { success: true, data: undefined };
    } catch (error) {
      console.error(
        `[PmpSpentForPredictionEventHandler] Error processing event: ${event.id}`,
        error
      );

      return {
        success: false,
        error: new HandlerError(
          `Failed to handle PmpSpentForPrediction event: ${
            error instanceof Error ? error.message : "Unknown error"
          }`,
          error instanceof Error ? error : undefined,
          this.subscriberId
        ),
      };
    }
  }

  private async recordEconomicTransaction(
    event: PmpSpentForPredictionEvent
  ): Promise<void> {
    // TODO: 경제 시스템 트랜잭션 기록
    console.log(
      `[EconomicTransaction] PMP spent recorded: ${event.amount} for user ${event.userId}`
    );
  }

  private async verifyBalanceUpdate(
    event: PmpSpentForPredictionEvent
  ): Promise<void> {
    // TODO: 잔액 업데이트 확인
    console.log(
      `[BalanceVerification] Verifying balance update for user ${event.userId}`
    );
  }

  private async createAuditLog(
    event: PmpSpentForPredictionEvent
  ): Promise<void> {
    // TODO: 감사 로그 생성
    console.log(
      `[AuditLog] PMP spending audit log created for transaction ${event.transactionId}`
    );
  }
}

/**
 * 예측 게임 정산 이벤트 핸들러
 * 게임 정산 시 PMC 보상 분배를 처리합니다.
 */
export class PredictionGameSettledEventHandler
  implements IDomainEventSubscriber<PredictionGameSettledEvent>
{
  readonly eventType = "PredictionGameSettled";
  readonly subscriberId = "prediction-game-settled-handler";

  async handle(
    event: PredictionGameSettledEvent
  ): Promise<Result<void, HandlerError>> {
    try {
      console.log(
        `[PredictionGameSettledEventHandler] Processing event: ${event.id}`
      );

      // 1. 게임 결과 통계 업데이트
      await this.updateGameResultStats(event);

      // 2. 참여자 성과 기록 업데이트
      await this.updateParticipantPerformance(event);

      // 3. 리더보드 업데이트
      await this.updateLeaderboard(event);

      // 4. 정산 완료 알림 발송
      await this.sendSettlementNotifications(event);

      console.log(
        `[PredictionGameSettledEventHandler] Successfully processed event: ${event.id}`
      );

      return { success: true, data: undefined };
    } catch (error) {
      console.error(
        `[PredictionGameSettledEventHandler] Error processing event: ${event.id}`,
        error
      );

      return {
        success: false,
        error: new HandlerError(
          `Failed to handle PredictionGameSettled event: ${
            error instanceof Error ? error.message : "Unknown error"
          }`,
          error instanceof Error ? error : undefined,
          this.subscriberId
        ),
      };
    }
  }

  private async updateGameResultStats(
    event: PredictionGameSettledEvent
  ): Promise<void> {
    console.log(
      `[GameStats] Updating stats for game ${event.gameId}: ${event.winnerCount}/${event.totalParticipants} winners`
    );
  }

  private async updateParticipantPerformance(
    event: PredictionGameSettledEvent
  ): Promise<void> {
    console.log(
      `[ParticipantPerformance] Updating performance records for game ${event.gameId}`
    );
  }

  private async updateLeaderboard(
    event: PredictionGameSettledEvent
  ): Promise<void> {
    console.log(
      `[Leaderboard] Updating leaderboard after game ${event.gameId} settlement`
    );
  }

  private async sendSettlementNotifications(
    event: PredictionGameSettledEvent
  ): Promise<void> {
    console.log(
      `[Notification] Sending settlement notifications for game ${event.gameId}`
    );
  }
}

/**
 * PMC 획득 이벤트 핸들러
 * 예측 성공으로 인한 PMC 보상을 처리합니다.
 */
export class PmcEarnedFromPredictionEventHandler
  implements IDomainEventSubscriber<PmcEarnedFromPredictionEvent>
{
  readonly eventType = "PmcEarnedFromPrediction";
  readonly subscriberId = "pmc-earned-prediction-handler";

  async handle(
    event: PmcEarnedFromPredictionEvent
  ): Promise<Result<void, HandlerError>> {
    try {
      console.log(
        `[PmcEarnedFromPredictionEventHandler] Processing event: ${event.id}`
      );

      // 1. 경제 시스템 PMC 크레딧 기록
      await this.recordPmcCredit(event);

      // 2. 사용자 성과 기록 업데이트
      await this.updateUserPerformance(event);

      // 3. 보상 알림 발송
      await this.sendRewardNotification(event);

      // 4. MoneyWave 재분배 트리거 체크
      await this.checkMoneyWaveRedistribution(event);

      console.log(
        `[PmcEarnedFromPredictionEventHandler] Successfully processed event: ${event.id}`
      );

      return { success: true, data: undefined };
    } catch (error) {
      console.error(
        `[PmcEarnedFromPredictionEventHandler] Error processing event: ${event.id}`,
        error
      );

      return {
        success: false,
        error: new HandlerError(
          `Failed to handle PmcEarnedFromPrediction event: ${
            error instanceof Error ? error.message : "Unknown error"
          }`,
          error instanceof Error ? error : undefined,
          this.subscriberId
        ),
      };
    }
  }

  private async recordPmcCredit(
    event: PmcEarnedFromPredictionEvent
  ): Promise<void> {
    console.log(
      `[PmcCredit] Recording PMC credit: ${event.amount} for user ${event.userId}`
    );
  }

  private async updateUserPerformance(
    event: PmcEarnedFromPredictionEvent
  ): Promise<void> {
    console.log(
      `[UserPerformance] Updating performance for user ${event.userId} with accuracy ${event.accuracyScore}`
    );
  }

  private async sendRewardNotification(
    event: PmcEarnedFromPredictionEvent
  ): Promise<void> {
    console.log(
      `[RewardNotification] Sending reward notification to user ${event.userId}`
    );
  }

  private async checkMoneyWaveRedistribution(
    event: PmcEarnedFromPredictionEvent
  ): Promise<void> {
    console.log(
      `[MoneyWave] Checking redistribution triggers for user ${event.userId}`
    );
  }
}

/**
 * MoneyWave 분배 완료 이벤트 핸들러
 * MoneyWave 시스템의 분배 완료를 처리합니다.
 */
export class MoneyWaveDistributionCompletedEventHandler
  implements IDomainEventSubscriber<MoneyWaveDistributionCompletedEvent>
{
  readonly eventType = "MoneyWaveDistributionCompleted";
  readonly subscriberId = "money-wave-distribution-completed-handler";

  async handle(
    event: MoneyWaveDistributionCompletedEvent
  ): Promise<Result<void, HandlerError>> {
    try {
      console.log(
        `[MoneyWaveDistributionCompletedEventHandler] Processing event: ${event.id}`
      );

      // 1. 분배 통계 업데이트
      await this.updateDistributionStats(event);

      // 2. 게임별 분배 현황 업데이트
      await this.updateGameDistributionStatus(event);

      // 3. 경제 시스템 메트릭 업데이트
      await this.updateEconomicMetrics(event);

      // 4. 분배 완료 알림 발송
      await this.sendDistributionNotifications(event);

      console.log(
        `[MoneyWaveDistributionCompletedEventHandler] Successfully processed event: ${event.id}`
      );

      return { success: true, data: undefined };
    } catch (error) {
      console.error(
        `[MoneyWaveDistributionCompletedEventHandler] Error processing event: ${event.id}`,
        error
      );

      return {
        success: false,
        error: new HandlerError(
          `Failed to handle MoneyWaveDistributionCompleted event: ${
            error instanceof Error ? error.message : "Unknown error"
          }`,
          error instanceof Error ? error : undefined,
          this.subscriberId
        ),
      };
    }
  }

  private async updateDistributionStats(
    event: MoneyWaveDistributionCompletedEvent
  ): Promise<void> {
    console.log(
      `[DistributionStats] Updating stats for ${event.distributionType} distribution: ${event.totalDistributed} distributed`
    );
  }

  private async updateGameDistributionStatus(
    event: MoneyWaveDistributionCompletedEvent
  ): Promise<void> {
    console.log(
      `[GameDistribution] Updating distribution status for ${event.distributions.length} games`
    );
  }

  private async updateEconomicMetrics(
    event: MoneyWaveDistributionCompletedEvent
  ): Promise<void> {
    console.log(
      `[EconomicMetrics] Updating economic metrics for ${event.distributionType} wave`
    );
  }

  private async sendDistributionNotifications(
    event: MoneyWaveDistributionCompletedEvent
  ): Promise<void> {
    console.log(
      `[DistributionNotification] Sending distribution notifications to ${event.recipientCount} recipients`
    );
  }
}

/**
 * 경제 시스템 이벤트 핸들러
 * Economy Kernel에서 발생하는 이벤트들을 처리합니다.
 */
export class EconomicEventHandler
  implements
    IDomainEventSubscriber<
      PmpEarnedEvent | PmcEarnedEvent | PmpSpentEvent | PmcSpentEvent
    >
{
  readonly eventType = "EconomicEvent";
  readonly subscriberId = "prediction-economic-event-handler";

  async handle(
    event: PmpEarnedEvent | PmcEarnedEvent | PmpSpentEvent | PmcSpentEvent
  ): Promise<Result<void, HandlerError>> {
    try {
      console.log(
        `[EconomicEventHandler] Processing economic event: ${event.type}`
      );

      // 이벤트 타입별 처리
      switch (event.type) {
        case "PmpEarnedEvent":
          await this.handlePmpEarned(event as PmpEarnedEvent);
          break;
        case "PmcEarnedEvent":
          await this.handlePmcEarned(event as PmcEarnedEvent);
          break;
        case "PmpSpentEvent":
          await this.handlePmpSpent(event as PmpSpentEvent);
          break;
        case "PmcSpentEvent":
          await this.handlePmcSpent(event as PmcSpentEvent);
          break;
        default:
          console.warn(
            `[EconomicEventHandler] Unknown economic event type: ${event.type}`
          );
      }

      return { success: true, data: undefined };
    } catch (error) {
      console.error(
        `[EconomicEventHandler] Error processing economic event: ${event.type}`,
        error
      );

      return {
        success: false,
        error: new HandlerError(
          `Failed to handle economic event: ${
            error instanceof Error ? error.message : "Unknown error"
          }`,
          error instanceof Error ? error : undefined,
          this.subscriberId
        ),
      };
    }
  }

  private async handlePmpEarned(event: PmpEarnedEvent): Promise<void> {
    console.log(
      `[PmpEarned] User ${event.userId} earned ${event.amount} PMP from ${event.source}`
    );
  }

  private async handlePmcEarned(event: PmcEarnedEvent): Promise<void> {
    console.log(
      `[PmcEarned] User ${event.userId} earned ${event.amount} PMC from ${event.source}`
    );
  }

  private async handlePmpSpent(event: PmpSpentEvent): Promise<void> {
    console.log(
      `[PmpSpent] User ${event.userId} spent ${event.amount} PMP for ${event.purpose}`
    );
  }

  private async handlePmcSpent(event: PmcSpentEvent): Promise<void> {
    console.log(
      `[PmcSpent] User ${event.userId} spent ${event.amount} PMC for ${event.purpose}`
    );
  }
}

/**
 * 모든 이벤트 핸들러들을 내보내는 팩토리
 */
export const createPredictionEventHandlers = () => {
  return [
    new PredictionParticipatedEventHandler(),
    new PmpSpentForPredictionEventHandler(),
    new PredictionGameSettledEventHandler(),
    new PmcEarnedFromPredictionEventHandler(),
    new MoneyWaveDistributionCompletedEventHandler(),
    new EconomicEventHandler(),
  ];
};

/**
 * 이벤트 핸들러 등록 헬퍼
 */
export const registerPredictionEventHandlers = (eventPublisher: any) => {
  const handlers = createPredictionEventHandlers();

  handlers.forEach((handler) => {
    eventPublisher.subscribe(handler);
    console.log(
      `[EventRegistration] Registered handler: ${handler.subscriberId} for event: ${handler.eventType}`
    );
  });

  return handlers;
};
