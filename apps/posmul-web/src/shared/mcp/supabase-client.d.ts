/**
 * Supabase MCP Client
 *
 * PosMul Platform Supabase 통합을 위한 MCP 클라이언트
 * MoneyWave 시스템과 PmpAmount/PmcAmount 경제 연동 지원
 */

// SDK MCP 유틸리티 import (메인 패키지에서)
export * from "@posmul/auth-economy-sdk";

declare global {
  function mcp_supabase_execute_sql(params: {
    project_id: string;
    query: string;
  }): Promise<{
    data: any[] | null;
    error: any | null;
  }>;
  function mcp_supabase_apply_migration(params: {
    project_id: string;
    name: string;
    query: string;
  }): Promise<{
    success: boolean;
    error?: any;
  }>;
  function mcp_supabase_list_tables(params: {
    project_id: string;
    schemas?: string[];
  }): Promise<{
    data: any[] | null;
    error: any | null;
  }>;
  function mcp_supabase_get_advisors(params: {
    project_id: string;
    type: "security" | "performance";
  }): Promise<{
    data: any[] | null;
    error: any | null;
  }>;
  function mcp_supabase_generate_typescript_types(params: {
    project_id: string;
  }): Promise<{
    data: string | null;
    error: any | null;
  }>;
}

/**
 * Supabase MCP 클라이언트 클래스
 */
export declare class SupabaseMCPClient {
  private readonly projectId;
  constructor(projectId: string);

  /**
   * 🔮 SQL 쿼리 실행 (예측 게임 및 경제 시스템용)
   */
  executeSQL(
    query: string,
    options?: {
      retry?: boolean;
      maxRetries?: number;
      context?: Record<string, any>;
    }
  ): Promise<{
    data: any[] | null;
    error: any | null;
  }>;

  /**
   * 🌊 MoneyWave1 연동 - 예측 게임 데이터 조회
   */
  findPredictionGamesForMoneyWave(filters?: {
    status?: string;
    minParticipants?: number;
    hasMoneyWave?: boolean;
  }): Promise<any[]>;

  /**
   * 💰 PmpAmount/PmcAmount 계정 잔액 조회
   */
  getEconomicBalance(userId: string): Promise<{
    pmpBalance: number;
    pmcBalance: number;
    lastActivity: string | null;
  }>;

  /**
   * 🔄 경제 트랜잭션 기록
   */
  recordEconomicTransaction(transaction: {
    userId: string;
    transactionType: "pmp_earned" | "pmp_spent" | "pmc_earned" | "pmc_spent";
    amount: number;
    sourceDomain: "prediction" | "investment" | "forum" | "donation";
    sourceId: string;
    description?: string;
  }): Promise<void>;

  /**
   * 🌊 MoneyWave 할당 기록
   */
  allocateMoneyWave(allocation: {
    gameId: string;
    waveType: "WAVE1" | "WAVE2" | "WAVE3";
    allocatedPmc: number;
    importance: number;
    difficulty: number;
  }): Promise<void>;

  /**
   * 📊 경제 시스템 통계 조회
   */
  getEconomicStatistics(): Promise<{
    totalPmpCirculation: number;
    totalPmcCirculation: number;
    activeGamesWithMoneyWave: number;
    dailyTransactions: number;
  }>;

  /**
   * 🔒 데이터베이스 보안 검사 (정기 실행)
   */
  runSecurityCheck(): Promise<any[]>;

  /**
   * ⚡ 성능 최적화 검사
   */
  runPerformanceCheck(): Promise<any[]>;
}

/**
 * 전역 MCP Supabase 클라이언트 인스턴스
 */
export declare const createSupabaseMCPClient: (
  projectId: string
) => SupabaseMCPClient;

/**
 * 기본 MCP 함수들의 래퍼 (하위 호환성)
 */
export declare const mcp_supabase_execute_sql: (params: {
  project_id: string;
  query: string;
}) => Promise<{
  data: any[] | null;
  error: any | null;
}>;

export declare const mcp_supabase_apply_migration: (params: {
  project_id: string;
  name: string;
  query: string;
}) => Promise<{
  success: boolean;
  error?: any;
}>;

export declare const mcp_supabase_get_advisors: (params: {
  project_id: string;
  type: "security" | "performance";
}) => Promise<{
  data: any[] | null;
  error: any | null;
}>;

export declare const mcp_supabase_list_tables: (params: {
  project_id: string;
  schemas?: string[];
}) => Promise<{
  data: any[] | null;
  error: any | null;
}>;
