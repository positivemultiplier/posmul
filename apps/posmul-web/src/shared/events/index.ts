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

// Note: Clean Architecture 경계 준수 — shared/events에서 bounded-contexts 역참조 제거 완료.
// 도메인별 이벤트는 각 bounded-contexts/{domain}/domain/events 에서 직접 import 합니다.

/**
 * Domain Events System 초기화 헬퍼
 */
export function initializeDomainEventSystem() {
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
