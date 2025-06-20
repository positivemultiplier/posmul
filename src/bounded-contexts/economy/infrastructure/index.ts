/**
 * Economy Infrastructure Layer - Index
 *
 * 경제 도메인의 인프라스트럭처 계층 모든 구현체들을 export
 * Supabase 기반 Repository, Realtime Event Publisher, MCP 통합 등
 */

// Supabase Client 및 기본 설정
export * from "./supabase/client";
export * from "./supabase/types";

// Repository 구현체들
export { BaseSupabaseRepository } from "./repositories/base-supabase.repository";
export { SupabaseMoneyWaveHistoryRepository } from "./repositories/supabase-money-wave-history.repository";
export { SupabasePMPPMCAccountRepository } from "./repositories/supabase-pmp-pmc-account.repository";
// export { SupabaseUtilityFunctionRepository } from "./repositories/supabase-utility-function.repository";

// 실시간 이벤트 시스템
export { EconomicRealtimeEventPublisher } from "./events/economic-realtime-publisher";
export type {
  EconomicDomainEvent,
  EconomicEventType,
} from "./events/economic-realtime-publisher";

// MCP 통합 (향후 구현)
// export * from "./mcp";

// 외부 서비스 통합 (향후 구현)
// export * from "./external-services";

// 유틸리티
export { createEconomyInfrastructure } from "./create-infrastructure";
