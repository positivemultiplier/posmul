/**
 * Prediction Domain Event Handlers
 *
 * ?�측 ?�메?�에??발생?�는 ?�벤?�들??처리?�는 ?�들?�들???�의?�니??
 * 경제 ?�스?�과???�신 �??�른 ?�메?�과???�호?�용???�당?�니??
 *
 * @author PosMul Development Team
 * @since 2024-12
 */
import {
  BusinessLogicError,
  HandlerError,
  IDomainEventSubscriber,
  PmcEarnedEvent,
  PmcSpentEvent,
  PmpEarnedEvent,
  PmpSpentEvent,
} from "@posmul/auth-economy-sdk";
import { Result } from "@posmul/auth-economy-sdk";

import {
  MoneyWaveDistributionCompletedEvent,
  PmcEarnedFromPredictionEvent,
  PmpSpentForPredictionEvent,
  PredictionGameSettledEvent,
  PredictionParticipatedEvent,
} from "../../../prediction/domain/events/prediction-game-events";

/**
 * ?�측 참여 ?�벤???�들??
 * PmpAmount 차감 ?�벤?��? 경제 ?�스?�으�??�파?�니??
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

      // 1. ?�계 ?�데?�트 (?�제 구현?�서???�계 ?�비???�출)
      await this.updateParticipationStats(event);

      // 2. ?�시�??�림 발송 (?�제 구현?�서???�림 ?�비???�출)
      await this.sendParticipationNotification(event);

      // 3. 게임 ?�태 ?�데?�트 체크 (참여????기반)
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
        error: new HandlerError("Invalid state", {
          cause: error instanceof Error ? error.message : "unknown error",
        }),
      };
    }
  }

  private async updateParticipationStats(
    event: PredictionParticipatedEvent
  ): Promise<void> {
    // TODO: ?�제 ?�계 ?�비?��? ?�동
    console.log(
      `[Stats] User ${event.userId} participated in game ${event.gameId} with stake ${event.stakeAmount}`
    );
  }

  private async sendParticipationNotification(
    event: PredictionParticipatedEvent
  ): Promise<void> {
    // TODO: ?�제 ?�림 ?�비?��? ?�동
    console.log(
      `[Notification] Participation notification sent for user ${event.userId}`
    );
  }

  private async checkGameStateUpdate(
    event: PredictionParticipatedEvent
  ): Promise<void> {
    // TODO: 게임 ?�태 ?�데?�트 로직
    console.log(`[GameState] Checking state update for game ${event.gameId}`);
  }
}

/**
 * PmpAmount 지�??�벤???�들??
 * 경제 ?�스?�의 PmpAmount 지출을 처리?�니??
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

      // 1. 경제 ?�스???�랜??�� 기록
      await this.recordEconomicTransaction(event);

      // 2. ?�용???�액 ?�데?�트 ?�인
      await this.verifyBalanceUpdate(event);

      // 3. 감사 로그 ?�성
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
        error: new HandlerError("Invalid state", {
          cause: error instanceof Error ? error.message : "unknown error",
        }),
      };
    }
  }

  private async recordEconomicTransaction(
    event: PmpSpentForPredictionEvent
  ): Promise<void> {
    // TODO: 경제 ?�스???�랜??�� 기록
    console.log(
      `[EconomicTransaction] PmpAmount spent recorded: ${event.amount} for user ${event.userId}`
    );
  }

  private async verifyBalanceUpdate(
    event: PmpSpentForPredictionEvent
  ): Promise<void> {
    // TODO: ?�액 ?�데?�트 ?�인
    console.log(
      `[BalanceVerification] Verifying balance update for user ${event.userId}`
    );
  }

  private async createAuditLog(
    event: PmpSpentForPredictionEvent
  ): Promise<void> {
    // TODO: 감사 로그 ?�성
    console.log(
      `[AuditLog] PmpAmount spending audit log created for transaction ${event.transactionId}`
    );
  }
}

/**
 * ?�측 게임 ?�산 ?�벤???�들??
 * 게임 ?�산 ??PmcAmount 보상 분배�?처리?�니??
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

      // 1. 게임 결과 ?�계 ?�데?�트
      await this.updateGameResultStats(event);

      // 2. 참여???�과 기록 ?�데?�트
      await this.updateParticipantPerformance(event);

      // 3. 리더보드 ?�데?�트
      await this.updateLeaderboard(event);

      // 4. ?�산 ?�료 ?�림 발송
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
        error: new HandlerError("Invalid state", {
          cause: error instanceof Error ? error.message : "unknown error",
        }),
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
 * PmcAmount ?�득 ?�벤???�들??
 * ?�측 ?�공?�로 ?�한 PmcAmount 보상??처리?�니??
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

      // 1. 경제 ?�스??PmcAmount ?�레??기록
      await this.recordPmcCredit(event);

      // 2. ?�용???�과 기록 ?�데?�트
      await this.updateUserPerformance(event);

      // 3. 보상 ?�림 발송
      await this.sendRewardNotification(event);

      // 4. MoneyWave ?�분�??�리�?체크
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
        error: new HandlerError("Invalid state", {
          cause: error instanceof Error ? error.message : "unknown error",
        }),
      };
    }
  }

  private async recordPmcCredit(
    event: PmcEarnedFromPredictionEvent
  ): Promise<void> {
    console.log(
      `[PmcCredit] Recording PmcAmount credit: ${event.amount} for user ${event.userId}`
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
 * MoneyWave 분배 ?�료 ?�벤???�들??
 * MoneyWave ?�스?�의 분배 ?�료�?처리?�니??
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

      // 1. 분배 ?�계 ?�데?�트
      await this.updateDistributionStats(event);

      // 2. 게임�?분배 ?�황 ?�데?�트
      await this.updateGameDistributionStatus(event);

      // 3. 경제 ?�스??메트�??�데?�트
      await this.updateEconomicMetrics(event);

      // 4. 분배 ?�료 ?�림 발송
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
        error: new HandlerError("Invalid state", {
          cause: error instanceof Error ? error.message : "unknown error",
        }),
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
 * 경제 ?�스???�벤???�들??
 * Economy Kernel?�서 발생?�는 ?�벤?�들??처리?�니??
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

      // ?�벤???�?�별 처리
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
        error: new HandlerError("Invalid state", {
          cause: error instanceof Error ? error.message : "unknown error",
        }),
      };
    }
  }

  private async handlePmpEarned(event: PmpEarnedEvent): Promise<void> {
    console.log(`[PmpEarned] Event received with type: ${event.type}`);
  }

  private async handlePmcEarned(event: PmcEarnedEvent): Promise<void> {
    console.log(`[PmcEarned] Event received with type: ${event.type}`);
  }

  private async handlePmpSpent(event: PmpSpentEvent): Promise<void> {
    console.log(`[PmpSpent] Event received with type: ${event.type}`);
  }

  private async handlePmcSpent(event: PmcSpentEvent): Promise<void> {
    console.log(`[PmcSpent] Event received with type: ${event.type}`);
  }
}

/**
 * 모든 ?�벤???�들?�들???�보?�는 ?�토�?
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
 * ?�벤???�들???�록 ?�퍼
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
