/**
 * Economy Kernel Export Index
 *
 * Shared Economy Kernel의 모든 공개 인터페이스와 클래스들을 export합니다.
 * 다른 도메인에서는 이 인덱스를 통해서만 Economy Kernel에 접근해야 합니다.
 *
 * @author PosMul Development Team
 * @since 2024-12
 */

// === Core Economy Kernel Service ===
export {
  EconomyKernel,
  EconomyKernelError,
  getEconomyKernel,
  type EconomySystemStats,
  type IEconomyKernelRepository,
  type PmcAccount,
  type PmpAccount,
} from "./services/economy-kernel.service";

// === Domain Events ===
export {
  AccountCreatedEvent,
  BaseEconomicEvent,
  EconomicEventUtils,
  MoneyWaveDistributionEvent,
  PmcEarnedEvent,
  PmcSpentEvent,
  PmpEarnedEvent,
  PmpSpentEvent,
  PredictionParticipationEvent,
  PredictionSettlementEvent,
  type EconomicDomainEvent,
  type IDomainEventHandler,
  type IDomainEventPublisher,
  type IEventStore,
} from "./events/economic-events";

// Re-export DomainEvent from SDK
export type { DomainEvent } from "@posmul/auth-economy-sdk/types";

// === Economy Kernel 사용 가이드 ===

/**
 * Economy Kernel 사용 방법:
 *
 * 1. 읽기 전용 접근:
 * ```typescript
 * import { getEconomyKernel } from "@posmul/shared-ui/economy-kernel";
 *
 * const economyKernel = getEconomyKernel();
 * const balance = await economyKernel.getPmpBalance(userId);
 * ```
 *
 * 2. 경제 데이터 변경 (이벤트를 통해서만):
 * ```typescript
 * import { PmpSpentEvent } from "@posmul/shared-ui/economy-kernel";
 *
 * const event = new PmpSpentEvent(
 *   userId,
 *   amount,
 *   "prediction-participation",
 *   predictionId
 * );
 * await eventPublisher.publish(event);
 * ```
 *
 * 3. 도메인별 경제 서비스 구현:
 * ```typescript
 * export class PredictionEconomicService {
 *   constructor(
 *     private readonly economyKernel: EconomyKernel,
 *     private readonly eventPublisher: IDomainEventPublisher
 *   ) {}
 *
 *   async canParticipate(userId: UserId, stake: number): Promise<boolean> {
 *     const result = await this.economyKernel.canSpendPmp(userId, stake);
 *     return result.success ? result.data : false;
 *   }
 * }
 * ```
 */
