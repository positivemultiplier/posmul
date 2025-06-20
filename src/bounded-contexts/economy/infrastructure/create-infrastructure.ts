/**
 * Economy Infrastructure Factory
 *
 * 경제 도메인 인프라스트럭처 구성요소들을 생성하고 초기화하는 팩토리
 * Dependency Injection Container 역할
 */

import {
  IMoneyWaveHistoryRepository,
  IPMPPMCAccountRepository,
} from "../domain/repositories";
import { SupabaseMoneyWaveHistoryRepository } from "./repositories/supabase-money-wave-history.repository";
import { SupabasePMPPMCAccountRepository } from "./repositories/supabase-pmp-pmc-account.repository";
// import { SupabaseUtilityFunctionRepository } from "./repositories/supabase-utility-function.repository";
import { EconomicRealtimeEventPublisher } from "./events/economic-realtime-publisher";

/**
 * 경제 인프라스트럭처 컨테이너
 */
export interface EconomyInfrastructureContainer {
  repositories: {
    pmpPmcAccountRepository: IPMPPMCAccountRepository;
    moneyWaveHistoryRepository: IMoneyWaveHistoryRepository;
    // utilityFunctionRepository: IUtilityFunctionRepository;
  };
  events: {
    realtimeEventPublisher: EconomicRealtimeEventPublisher;
  };
}

/**
 * 인프라스트럭처 설정
 */
export interface InfrastructureConfig {
  supabase: {
    url: string;
    key: string;
  };
  events: {
    enableRealtime: boolean;
  };
}

/**
 * 경제 도메인 인프라스트럭처 생성
 */
export function createEconomyInfrastructure(
  config?: Partial<InfrastructureConfig>
): EconomyInfrastructureContainer {
  // 기본 설정
  const defaultConfig: InfrastructureConfig = {
    supabase: {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL || "",
      key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
    },
    events: {
      enableRealtime: true,
    },
  };

  const finalConfig = { ...defaultConfig, ...config };
  // Repository 인스턴스 생성
  const pmpPmcAccountRepository = new SupabasePMPPMCAccountRepository();
  const moneyWaveHistoryRepository = new SupabaseMoneyWaveHistoryRepository();
  // const utilityFunctionRepository = new SupabaseUtilityFunctionRepository();

  // 이벤트 시스템 생성
  const realtimeEventPublisher = new EconomicRealtimeEventPublisher();

  return {
    repositories: {
      pmpPmcAccountRepository,
      moneyWaveHistoryRepository,
      // utilityFunctionRepository,
    },
    events: {
      realtimeEventPublisher,
    },
  };
}

/**
 * 싱글톤 인스턴스 (필요시 사용)
 */
let infrastructureInstance: EconomyInfrastructureContainer | null = null;

export function getEconomyInfrastructure(): EconomyInfrastructureContainer {
  if (!infrastructureInstance) {
    infrastructureInstance = createEconomyInfrastructure();
  }
  return infrastructureInstance;
}

/**
 * 인프라스트럭처 정리 (테스트나 종료시 사용)
 */
export async function destroyEconomyInfrastructure(): Promise<void> {
  if (infrastructureInstance) {
    await infrastructureInstance.events.realtimeEventPublisher.disconnect();
    infrastructureInstance = null;
  }
}
