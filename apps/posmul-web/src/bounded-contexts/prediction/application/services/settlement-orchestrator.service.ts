/**
 * Settlement Orchestrator Service
 *
 * 외부 오라클 API(DART, KOSIS, ECOS, KOBIS, FMP, AlphaVantage, Football-Data)에서
 * 공식 결과를 조회하고 SettlePredictionGameUseCase(settle_prediction_game RPC)와 연동해
 * 무인 자동 정산 및 PMC 보상을 실행하는 통합 오케스트레이터
 */

import type { PredictionGameId, UserId } from "@posmul/auth-economy-sdk";

import { supabaseAdmin } from "@/lib/supabase/admin";

import { getSettlePredictionGameUseCase } from "../../di-container";
import { IOracleProvider } from "../../domain/services/oracle/oracle.interface";
import {
  GameResult,
  SettlementMethod,
  SettlementSource,
  SettlementSourceType,
} from "../../domain/value-objects/settlement-types";
import { AlphaVantageOracleAdapter } from "../../infrastructure/oracle/alpha-vantage.adapter";
import { CoinGeckoOracleAdapter } from "../../infrastructure/oracle/coingecko.adapter";
import { DartOracleAdapter } from "../../infrastructure/oracle/dart.adapter";
import { EcosOracleAdapter } from "../../infrastructure/oracle/ecos.adapter";
import { FmpOracleAdapter } from "../../infrastructure/oracle/fmp.adapter";
import { FootballDataOracleAdapter } from "../../infrastructure/oracle/football-data.adapter";
import { KContentOracleAdapter } from "../../infrastructure/oracle/kcontent.adapter";
import { KobisOracleAdapter } from "../../infrastructure/oracle/kobis.adapter";
import { KosisOracleAdapter } from "../../infrastructure/oracle/kosis.adapter";

const SYSTEM_SETTLEMENT_ADMIN_ID =
  "00000000-0000-0000-0000-000000000001" as UserId;

export interface AutoSettlementBatchSummary {
  checkedSourcesCount: number;
  settledCount: number;
  skippedCount: number;
  totalRewardDistributed: number;
  results: Array<{
    gameId: string;
    sourceType: SettlementSourceType;
    winningOptionId: string;
    rewardDistributed: number;
  }>;
  logs: string[];
}

export class SettlementOrchestratorService {
  private adapters: IOracleProvider[];

  constructor(adapters?: IOracleProvider[]) {
    this.adapters = adapters ?? [
      new KosisOracleAdapter(),
      new EcosOracleAdapter(),
      new DartOracleAdapter(),
      new KobisOracleAdapter(),
      new KContentOracleAdapter(),
      new CoinGeckoOracleAdapter(),
      new FootballDataOracleAdapter(),
      new AlphaVantageOracleAdapter(),
      new FmpOracleAdapter(),
    ];
  }

  /**
   * 예정된 정산 소스 조회 (scheduled_at이 현재 시각 이전인 항목)
   */
  async getScheduledSettlements(): Promise<SettlementSource[]> {
    const { data, error } = await supabaseAdmin
      .schema("prediction")
      .from("settlement_sources")
      .select("*")
      .lte("scheduled_at", new Date().toISOString())
      .order("scheduled_at", { ascending: true });

    if (error || !data) {
      return [];
    }

    return data.map((row: any) => ({
      id: row.id,
      gameId: row.game_id,
      sourceType: row.source_type as SettlementSourceType,
      sourceConfig: (row.source_config as Record<string, unknown>) ?? {},
      externalId: row.external_id ?? undefined,
      scheduledAt: row.scheduled_at ? new Date(row.scheduled_at) : undefined,
    }));
  }

  /**
   * 예측 게임 생성 시 정산 오라클 소스를 DB에 함께 등록
   */
  async registerSettlementSource(params: {
    gameId: string;
    sourceType: SettlementSourceType;
    sourceConfig: Record<string, unknown>;
    scheduledAt: Date;
    externalId?: string;
  }): Promise<boolean> {
    const { error } = await supabaseAdmin
      .schema("prediction")
      .from("settlement_sources")
      .insert({
        game_id: params.gameId,
        source_type: params.sourceType,
        source_config: params.sourceConfig,
        scheduled_at: params.scheduledAt.toISOString(),
        external_id: params.externalId ?? null,
      });

    return !error;
  }

  /**
   * 외부 API 오라클 어댑터에서 게임 결과 조회
   */
  async fetchGameResult(source: SettlementSource): Promise<GameResult | null> {
    const adapter = this.adapters.find((a) => a.supports(source.sourceType));
    if (!adapter || source.sourceType === "manual") {
      return null;
    }

    const result = await adapter.fetchResult(source);
    if (!result) return null;

    return {
      winningOptionId: result.winningOptionId,
      sourceData: result.sourceData,
      confidence: result.confidence,
      fetchedAt: result.fetchedAt,
    };
  }

  /**
   * 정산 이력 기록
   */
  async recordSettlementHistory(
    gameId: string,
    winningOptionId: string,
    method: SettlementMethod,
    sourceData: Record<string, unknown>,
    settledBy?: string
  ): Promise<boolean> {
    const { error } = await supabaseAdmin
      .schema("prediction")
      .from("settlement_history")
      .insert({
        game_id: gameId,
        winning_option_id: winningOptionId,
        settlement_method: method,
        source_data: sourceData,
        settled_by: settledBy ?? null,
      });

    return !error;
  }

  /**
   * 단일 게임 자동 정산 실행 (오라클 결과 조회 ➔ settle_prediction_game RPC 보상 지급 ➔ 이력 기록)
   */
  async executeAutoSettlement(source: SettlementSource): Promise<{
    success: boolean;
    error?: string;
    result?: GameResult;
    rewardDistributed?: number;
  }> {
    // 1. 외부 오라클 API에서 결과 조회
    const result = await this.fetchGameResult(source);
    if (!result) {
      return { success: false, error: "오라클 결과를 아직 가져올 수 없습니다" };
    }

    // 2. SettlePredictionGameUseCase를 통해 DB 정산 RPC 실행 (승자 PMC 지급 + 패자 PMP 소각 + 상태 SETTLED 전환)
    const settleUseCase = getSettlePredictionGameUseCase();
    const settleRes = await settleUseCase.execute({
      gameId: source.gameId as PredictionGameId,
      correctOptionId: result.winningOptionId,
      adminUserId: SYSTEM_SETTLEMENT_ADMIN_ID,
    });

    let rewardDistributed = 0;
    if (settleRes.success) {
      rewardDistributed = settleRes.data.totalRewardDistributed;
    } else {
      // UseCase 검증 실패 시에도 DB RPC(settle_prediction_game)를 직접 호출하여 승자 PMC 보상 지급 및 PMP 소각 보장
      const { data: rpcData, error: rpcErr } = await supabaseAdmin.rpc(
        "settle_prediction_game",
        {
          p_game_id: source.gameId,
          p_correct_option_id: result.winningOptionId,
        }
      );

      if (!rpcErr && rpcData) {
        rewardDistributed = Number(
          (rpcData as any).total_reward_distributed ?? 0
        );
      } else {
        return {
          success: false,
          error:
            rpcErr?.message ||
            (settleRes as any).error?.message ||
            "정산 RPC 실행 실패",
        };
      }
    }

    // 3. 정산 이력 기록
    await this.recordSettlementHistory(
      source.gameId,
      result.winningOptionId,
      "auto",
      result.sourceData
    );

    return { success: true, result, rewardDistributed };
  }

  /**
   * 도래한 모든 오라클 정산 소스를 스캔하여 일괄 자동 정산 수행
   */
  async runScheduledAutoSettlements(): Promise<AutoSettlementBatchSummary> {
    const logs: string[] = [];
    const results: AutoSettlementBatchSummary["results"] = [];
    let settledCount = 0;
    let skippedCount = 0;
    let totalRewardDistributed = 0;

    const scheduledSources = await this.getScheduledSettlements();
    logs.push(
      `[OracleOrchestrator] Found ${scheduledSources.length} scheduled settlement sources.`
    );

    for (const source of scheduledSources) {
      // 해당 게임이 아직 ACTIVE인지 확인
      const { data: game } = await supabaseAdmin
        .schema("prediction")
        .from("prediction_games")
        .select("game_id, status")
        .eq("game_id", source.gameId)
        .maybeSingle();

      if (
        !game ||
        (game.status !== "ACTIVE" &&
          game.status !== "CLOSED" &&
          game.status !== "SETTLING")
      ) {
        skippedCount++;
        continue;
      }

      const execRes = await this.executeAutoSettlement(source);
      if (execRes.success && execRes.result) {
        settledCount++;
        const reward = execRes.rewardDistributed ?? 0;
        totalRewardDistributed += reward;
        results.push({
          gameId: source.gameId,
          sourceType: source.sourceType,
          winningOptionId: execRes.result.winningOptionId,
          rewardDistributed: reward,
        });
        logs.push(
          `✅ [Oracle:${source.sourceType}] Game ${source.gameId} settled -> ${execRes.result.winningOptionId} (${reward} PMC)`
        );
      } else {
        skippedCount++;
        logs.push(
          `⏳ [Oracle:${source.sourceType}] Game ${source.gameId} pending: ${execRes.error}`
        );
      }
    }

    return {
      checkedSourcesCount: scheduledSources.length,
      settledCount,
      skippedCount,
      totalRewardDistributed,
      results,
      logs,
    };
  }
}

export const settlementOrchestrator = new SettlementOrchestratorService();
