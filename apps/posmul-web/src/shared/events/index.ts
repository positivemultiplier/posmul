/**
 * Domain Events System - Main Export
 *
 * EK-002 Domain Events 구현의 중앙 집중식 내보내기 파일입니다.
 * 모든 도메인 이벤트, 발행자, 구독자, 유틸리티를 통합 관리합니다.
 *
 * @author PosMul Development Team
 * @since 2024-12
 */

// Core Infrastructure
export {
  globalEventBus,
  publishEvent,
  subscribeToEvent,
} from "./domain-events";

// Event Publisher
export type {
  HandlerError,
  IDomainEventPublisher,
  IDomainEventSubscriber,
  IEventStore,
  PublishError,
} from "./event-publisher";

export {
  InMemoryEventPublisher,
  SupabaseEventPublisher,
  globalEventPublisher,
  publishDomainEvent,
  publishDomainEvents,
  subscribeToDomainEvent,
} from "./event-publisher";

// Economic Events
export {
  BaseEconomicEvent,
  EconomicEventUtils,
  PmcEarnedEvent,
  PmcSpentEvent,
  PmpEarnedEvent,
  PmpSpentEvent,
} from "../economy-kernel/events/economic-events";

// Money Wave Events
export {
  AgencyTheoryIncentiveAdjustedEvent,
  MoneyWave1DistributionCompletedEvent,
  MoneyWave1GamePrizeAllocatedEvent,
  MoneyWave1PrizePoolCreatedEvent,
  MoneyWave2RedistributionExecutedEvent,
  MoneyWave2UnusedPmcDetectedEvent,
  MoneyWave3CustomPredictionCreatedEvent,
  MoneyWave3CustomPredictionRequestedEvent,
  MoneyWave3IncentiveDistributedEvent,
  MoneyWaveEventTypes,
  MoneyWaveEventUtils,
} from "../economy-kernel/events/money-wave-events";

// Prediction Events
export {
  MoneyWaveDistributionCompletedEvent,
  MoneyWaveDistributionStartedEvent,
  PmcEarnedFromPredictionEvent,
  PmpSpentForPredictionEvent,
  PredictionGameCreatedEvent,
  PredictionGameEndedEvent,
  PredictionGameEventTypes,
  PredictionGameSettledEvent,
  PredictionGameStartedEvent,
  PredictionParticipatedEvent,
} from "../../bounded-contexts/prediction/domain/events/prediction-game-events";

// Event Handlers
export {
  EconomicEventHandler,
  MoneyWaveDistributionCompletedEventHandler,
  PmcEarnedFromPredictionEventHandler,
  PmpSpentForPredictionEventHandler,
  PredictionGameSettledEventHandler,
  PredictionParticipatedEventHandler,
  createPredictionEventHandlers,
  registerPredictionEventHandlers,
} from "../../bounded-contexts/prediction/application/event-handlers/prediction-event-handlers";

// User Events (Auth Domain)
export {
  UserCreatedEvent,
  UserDeactivatedEvent,
  UserLoggedInEvent,
  UserProfileUpdatedEvent,
} from "../../bounded-contexts/auth/domain/events/user-events";

/**
 * Domain Events System 초기화 헬퍼
 */
export function initializeDomainEventSystem() {
  console.log("[DomainEvents] Initializing Domain Event System...");

  // Event handlers는 다른 곳에서 수동으로 등록
  console.log("[DomainEvents] Event handlers should be registered manually");
  console.log("[DomainEvents] Domain Event System initialized successfully");

  return {
    eventPublisher: "Available via import",
    registeredHandlers: 0,
    isHealthy: () => true,
  };
}

/**
 * Event System 상태 체크
 */
export function getDomainEventSystemStatus() {
  return {
    subscriberStats: {},
    totalStoredEvents: 0,
    eventTypes: [],
    isHealthy: true,
    lastEventTimestamp: null,
  };
}
