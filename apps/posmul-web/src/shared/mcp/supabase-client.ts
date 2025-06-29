/**
 * Supabase MCP Client
 *
 * PosMul Platform Supabase 통합을 위한 MCP 클라이언트
 * MoneyWave 시스템과 PMP/PMC 경제 연동 지원
 */

import {
  SupabaseMCPError,
  handleMCPError,
  retryMCPOperation,
} from "./mcp-errors";

export * from "@posmul/shared-auth";

// MCP 함수들의 타입 정의
declare global {
  function mcp_supabase_execute_sql(params: {
    project_id: string;
    query: string;
  }): Promise<{ data: any[] | null; error: any | null }>;

  function mcp_supabase_apply_migration(params: {
    project_id: string;
    name: string;
    query: string;
  }): Promise<{ success: boolean; error?: any }>;

  function mcp_supabase_list_tables(params: {
    project_id: string;
    schemas?: string[];
  }): Promise<{ data: any[] | null; error: any | null }>;

  function mcp_supabase_get_advisors(params: {
    project_id: string;
    type: "security" | "performance";
  }): Promise<{ data: any[] | null; error: any | null }>;

  function mcp_supabase_generate_typescript_types(params: {
    project_id: string;
  }): Promise<{ data: string | null; error: any | null }>;
}

/**
 * Supabase MCP 클라이언트 클래스
 */
export class SupabaseMCPClient {
  constructor(private readonly projectId: string) {}

  /**
   * 🔮 SQL 쿼리 실행 (예측 게임 및 경제 시스템용)
   */
  async executeSQL(
    query: string,
    options?: {
      retry?: boolean;
      maxRetries?: number;
      context?: Record<string, any>;
    }
  ): Promise<{ data: any[] | null; error: any | null }> {
    const operation = () =>
      mcp_supabase_execute_sql({
        project_id: this.projectId,
        query,
      });

    try {
      if (options?.retry) {
        return await retryMCPOperation(
          operation,
          "supabase_execute_sql",
          options.maxRetries || 3
        );
      }

      return await operation();
    } catch (error) {
      throw new SupabaseMCPError(
        `Failed to execute SQL query`,
        this.projectId,
        query,
        error as Error
      );
    }
  }

  /**
   * 🌊 MoneyWave1 연동 - 예측 게임 데이터 조회
   */
  async findPredictionGamesForMoneyWave(filters?: {
    status?: string;
    minParticipants?: number;
    hasMoneyWave?: boolean;
  }): Promise<any[]> {
    let conditions = [];

    if (filters?.status) {
      conditions.push(`pg.status = '${filters.status}'`);
    }

    if (filters?.minParticipants) {
      conditions.push(`participant_count >= ${filters.minParticipants}`);
    }

    if (filters?.hasMoneyWave) {
      conditions.push(`mw.allocated_pmc > 0`);
    }

    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const query = `
      SELECT 
        pg.*,
        COUNT(p.id) as participant_count,
        SUM(p.pmp_amount) as total_pmp_staked,
        COALESCE(mw.allocated_pmc, 0) as money_wave_pmc,
        mw.wave_type
      FROM prediction_games pg
      LEFT JOIN predictions p ON pg.game_id = p.game_id
      LEFT JOIN money_wave_allocations mw ON pg.game_id = mw.game_id
      ${whereClause}
      GROUP BY pg.game_id, mw.allocated_pmc, mw.wave_type
      ORDER BY pg.created_at DESC
    `;

    const result = await this.executeSQL(query, { retry: true });

    if (result.error) {
      throw new SupabaseMCPError(
        "Failed to find prediction games for MoneyWave",
        this.projectId,
        query,
        result.error
      );
    }

    return result.data || [];
  }

  /**
   * 💰 PMP/PMC 계정 잔액 조회
   */
  async getEconomicBalance(userId: string): Promise<{
    pmpBalance: number;
    pmcBalance: number;
    lastActivity: string | null;
  }> {
    const query = `
      SELECT 
        COALESCE(pmp.balance, 0) as pmp_balance,
        COALESCE(pmc.balance, 0) as pmc_balance,
        GREATEST(pmp.updated_at, pmc.updated_at) as last_activity
      FROM users u
      LEFT JOIN pmp_accounts pmp ON u.id = pmp.user_id
      LEFT JOIN pmc_accounts pmc ON u.id = pmc.user_id
      WHERE u.id = '${userId}'
    `;

    const result = await this.executeSQL(query, { retry: true });

    if (result.error) {
      throw new SupabaseMCPError(
        "Failed to get economic balance",
        this.projectId,
        query,
        result.error
      );
    }

    const data = result.data?.[0];
    return {
      pmpBalance: data?.pmp_balance || 0,
      pmcBalance: data?.pmc_balance || 0,
      lastActivity: data?.last_activity || null,
    };
  }

  /**
   * 🔄 경제 트랜잭션 기록
   */
  async recordEconomicTransaction(transaction: {
    userId: string;
    transactionType: "pmp_earned" | "pmp_spent" | "pmc_earned" | "pmc_spent";
    amount: number;
    sourceDomain: "prediction" | "investment" | "forum" | "donation";
    sourceId: string;
    description?: string;
  }): Promise<void> {
    const query = `
      INSERT INTO economic_transactions (
        user_id, transaction_type, amount, source_domain, source_id, description, created_at
      ) VALUES (
        '${transaction.userId}',
        '${transaction.transactionType}',
        ${transaction.amount},
        '${transaction.sourceDomain}',
        '${transaction.sourceId}',
        '${transaction.description || ""}',
        NOW()
      )
    `;

    const result = await this.executeSQL(query, { retry: true });

    if (result.error) {
      throw new SupabaseMCPError(
        "Failed to record economic transaction",
        this.projectId,
        query,
        result.error
      );
    }
  }

  /**
   * 🌊 MoneyWave 할당 기록
   */
  async allocateMoneyWave(allocation: {
    gameId: string;
    waveType: "WAVE1" | "WAVE2" | "WAVE3";
    allocatedPmc: number;
    importance: number;
    difficulty: number;
  }): Promise<void> {
    const query = `
      INSERT INTO money_wave_allocations (
        game_id, wave_type, allocated_pmc, importance_score, difficulty_score, created_at
      ) VALUES (
        '${allocation.gameId}',
        '${allocation.waveType}',
        ${allocation.allocatedPmc},
        ${allocation.importance},
        ${allocation.difficulty},
        NOW()
      )
      ON CONFLICT (game_id) DO UPDATE SET
        allocated_pmc = EXCLUDED.allocated_pmc,
        importance_score = EXCLUDED.importance_score,
        difficulty_score = EXCLUDED.difficulty_score,
        updated_at = NOW()
    `;

    const result = await this.executeSQL(query, { retry: true });

    if (result.error) {
      throw new SupabaseMCPError(
        "Failed to allocate MoneyWave",
        this.projectId,
        query,
        result.error
      );
    }
  }

  /**
   * 📊 경제 시스템 통계 조회
   */
  async getEconomicStatistics(): Promise<{
    totalPmpCirculation: number;
    totalPmcCirculation: number;
    activeGamesWithMoneyWave: number;
    dailyTransactions: number;
  }> {
    const query = `
      SELECT 
        (SELECT COALESCE(SUM(balance), 0) FROM pmp_accounts) as total_pmp,
        (SELECT COALESCE(SUM(balance), 0) FROM pmc_accounts) as total_pmc,
        (SELECT COUNT(*) FROM prediction_games pg 
         JOIN money_wave_allocations mw ON pg.game_id = mw.game_id 
         WHERE pg.status = 'ACTIVE') as active_games_with_money_wave,
        (SELECT COUNT(*) FROM economic_transactions 
         WHERE created_at >= CURRENT_DATE) as daily_transactions
    `;

    const result = await this.executeSQL(query, { retry: true });

    if (result.error) {
      throw new SupabaseMCPError(
        "Failed to get economic statistics",
        this.projectId,
        query,
        result.error
      );
    }

    const data = result.data?.[0];
    return {
      totalPmpCirculation: data?.total_pmp || 0,
      totalPmcCirculation: data?.total_pmc || 0,
      activeGamesWithMoneyWave: data?.active_games_with_money_wave || 0,
      dailyTransactions: data?.daily_transactions || 0,
    };
  }

  /**
   * 🔒 데이터베이스 보안 검사 (정기 실행)
   */
  async runSecurityCheck(): Promise<any[]> {
    try {
      const result = await mcp_supabase_get_advisors({
        project_id: this.projectId,
        type: "security",
      });

      if (result.error) {
        throw new SupabaseMCPError(
          "Failed to run security check",
          this.projectId,
          undefined,
          result.error
        );
      }

      return result.data || [];
    } catch (error) {
      throw handleMCPError(error, "security_check");
    }
  }

  /**
   * ⚡ 성능 최적화 검사
   */
  async runPerformanceCheck(): Promise<any[]> {
    try {
      const result = await mcp_supabase_get_advisors({
        project_id: this.projectId,
        type: "performance",
      });

      if (result.error) {
        throw new SupabaseMCPError(
          "Failed to run performance check",
          this.projectId,
          undefined,
          result.error
        );
      }

      return result.data || [];
    } catch (error) {
      throw handleMCPError(error, "performance_check");
    }
  }
}

/**
 * 전역 MCP Supabase 클라이언트 인스턴스
 */
export const createSupabaseMCPClient = (
  projectId: string
): SupabaseMCPClient => {
  return new SupabaseMCPClient(projectId);
};

/**
 * 기본 MCP 함수들의 래퍼 (하위 호환성)
 */
export const mcp_supabase_execute_sql = async (params: {
  project_id: string;
  query: string;
}): Promise<{ data: any[] | null; error: any | null }> => {
  const client = createSupabaseMCPClient(params.project_id);
  return client.executeSQL(params.query);
};

export const mcp_supabase_apply_migration = async (params: {
  project_id: string;
  name: string;
  query: string;
}): Promise<{ success: boolean; error?: any }> => {
  try {
    // MCP 도구가 실제로 사용 가능한 경우 호출
    if (typeof globalThis.mcp_supabase_apply_migration === "function") {
      return await globalThis.mcp_supabase_apply_migration(params);
    }

    // MCP 도구가 없는 경우 SQL 실행으로 대체
    const client = createSupabaseMCPClient(params.project_id);
    const result = await client.executeSQL(params.query);

    if (result.error) {
      return result;
    }

    return { success: true };
  } catch (error) {
    return { success: false, error };
  }
};

export const mcp_supabase_get_advisors = async (params: {
  project_id: string;
  type: "security" | "performance";
}): Promise<{ data: any[] | null; error: any | null }> => {
  try {
    // MCP 도구가 실제로 사용 가능한 경우 호출
    if (typeof globalThis.mcp_supabase_get_advisors === "function") {
      return await globalThis.mcp_supabase_get_advisors(params);
    }

    // MCP 도구가 없는 경우 빈 결과 반환
    return { data: [], error: null };
  } catch (error) {
    return { data: null, error };
  }
};

export const mcp_supabase_list_tables = async (params: {
  project_id: string;
  schemas?: string[];
}): Promise<{ data: any[] | null; error: any | null }> => {
  try {
    // MCP 도구가 실제로 사용 가능한 경우 호출
    if (typeof globalThis.mcp_supabase_list_tables === "function") {
      return await globalThis.mcp_supabase_list_tables(params);
    }

    // MCP 도구가 없는 경우 SQL 쿼리로 대체
    const client = createSupabaseMCPClient(params.project_id);
    const schemas = params.schemas || ["public"];
    const schemaList = schemas.map((s) => `'${s}'`).join(",");

    const query = `
      SELECT 
        table_name,
        table_schema,
        table_type
      FROM information_schema.tables 
      WHERE table_schema IN (${schemaList})
      ORDER BY table_schema, table_name
    `;

    return await client.executeSQL(query);
  } catch (error) {
    return { data: null, error };
  }
};
