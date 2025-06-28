/**
 * Economy Infrastructure Layer - Index (MCP Pattern)
 *
 * 경제 도메인의 인프라스트럭처 계층 모든 구현체들을 export
 * MCP 기반 Repository, Realtime Event Publisher 등
 */

// MCP Repository 기본 구현체
export { BaseMCPRepository } from "./repositories/base-mcp.repository";

// Repository 구현체들 (MCP 패턴)
export { SupabaseMoneyWaveHistoryRepository } from "./repositories/supabase-money-wave-history.repository";
export { SupabasePMPPMCAccountRepository } from "./repositories/supabase-pmp-pmc-account.repository";
export { SupabaseUtilityFunctionRepository } from "./repositories/supabase-utility-function.repository";

// 실시간 이벤트 시스템
export { EconomicRealtimeEventPublisher } from "./events/economic-realtime-publisher";
export type {
  EconomicDomainEvent,
  EconomicEventType,
} from "./events/economic-realtime-publisher";

// 유틸리티
export { createEconomyInfrastructure } from "./create-infrastructure";
