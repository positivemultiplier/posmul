/**
 * Economy Domain Real-time Event Publisher
 *
 * Supabase Realtime을 활용한 경제 도메인 이벤트 실시간 발행 시스템
 * MoneyWave 실행, 계좌 잔액 변경, 시장 데이터 업데이트 등 실시간 알림
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { UserId } from "@posmul/shared-types";
import { Result } from "@posmul/shared-types";
import { PMC, PMP } from "../../domain/value-objects";

/**
 * 경제 도메인 이벤트 타입
 */
export interface EconomicDomainEvent {
  readonly eventId: string;
  readonly eventType: EconomicEventType;
  readonly timestamp: Date;
  readonly userId?: UserId;
  readonly data: Record<string, any>;
}

export type EconomicEventType =
  | "MONEY_WAVE_1_EXECUTED"
  | "MONEY_WAVE_2_EXECUTED"
  | "MONEY_WAVE_3_EXECUTED"
  | "ACCOUNT_BALANCE_CHANGED"
  | "TRANSACTION_COMPLETED"
  | "UTILITY_UPDATED"
  | "SOCIAL_WELFARE_CALCULATED"
  | "MARKET_DATA_UPDATED";

/**
 * 실시간 이벤트 발행자
 */
export class EconomicRealtimeEventPublisher {
  private client: SupabaseClient;

  constructor() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Missing Supabase configuration for realtime events");
    }

    this.client = createClient(supabaseUrl, supabaseKey);
  }

  /**
   * MoneyWave 실행 이벤트 발행
   */
  async publishMoneyWaveEvent(
    waveType: "WAVE1" | "WAVE2" | "WAVE3",
    eventData: {
      executionId: string;
      affectedUsers: UserId[];
      totalPMCImpact: PMC;
      metadata: Record<string, any>;
    }
  ): Promise<Result<void>> {
    try {
      const event: EconomicDomainEvent = {
        eventId: crypto.randomUUID(),
        eventType: `MONEY_WAVE_${waveType.slice(
          -1
        )}_EXECUTED` as EconomicEventType,
        timestamp: new Date(),
        data: {
          ...eventData,
          waveType,
        },
      };

      const { error } = await this.client.from("economic_events").insert({
        event_id: event.eventId,
        event_type: event.eventType,
        timestamp: event.timestamp.toISOString(),
        data: event.data,
      });

      if (error) {
        return { success: false, error };
      }

      // Realtime 채널로 즉시 브로드캐스트
      await this.broadcastToChannel("economy:money-waves", event);

      return { success: true, data: undefined };
    } catch (error) {
      return { success: false, error: error as Error };
    }
  }

  /**
   * 계좌 잔액 변경 이벤트 발행
   */
  async publishAccountBalanceChange(
    userId: UserId,
    changes: {
      pmpBefore: PMP;
      pmpAfter: PMP;
      pmcBefore: PMC;
      pmcAfter: PMC;
      transactionId: string;
      reason: string;
    }
  ): Promise<Result<void>> {
    try {
      const event: EconomicDomainEvent = {
        eventId: crypto.randomUUID(),
        eventType: "ACCOUNT_BALANCE_CHANGED",
        timestamp: new Date(),
        userId,
        data: changes,
      };

      const { error } = await this.client.from("economic_events").insert({
        event_id: event.eventId,
        event_type: event.eventType,
        timestamp: event.timestamp.toISOString(),
        user_id: userId,
        data: event.data,
      });

      if (error) {
        return { success: false, error };
      }

      // 개인별 채널로 브로드캐스트
      await this.broadcastToChannel(`economy:user:${userId}`, event);

      // 전체 잔액 변경 채널로도 브로드캐스트
      await this.broadcastToChannel("economy:balances", {
        ...event,
        data: {
          userId,
          pmpChange: changes.pmpAfter.valueOf() - changes.pmpBefore.valueOf(),
          pmcChange: changes.pmcAfter.valueOf() - changes.pmcBefore.valueOf(),
        },
      });

      return { success: true, data: undefined };
    } catch (error) {
      return { success: false, error: error as Error };
    }
  }

  /**
   * 거래 완료 이벤트 발행
   */
  async publishTransactionCompleted(transactionData: {
    transactionId: string;
    fromUserId?: UserId;
    toUserId?: UserId;
    amount: PMC | PMP;
    type: "TRANSFER" | "CONVERT" | "EARN" | "BURN";
    metadata: Record<string, any>;
  }): Promise<Result<void>> {
    try {
      const event: EconomicDomainEvent = {
        eventId: crypto.randomUUID(),
        eventType: "TRANSACTION_COMPLETED",
        timestamp: new Date(),
        data: transactionData,
      };

      const { error } = await this.client.from("economic_events").insert({
        event_id: event.eventId,
        event_type: event.eventType,
        timestamp: event.timestamp.toISOString(),
        data: event.data,
      });

      if (error) {
        return { success: false, error };
      }

      // 관련 사용자들에게 브로드캐스트
      if (transactionData.fromUserId) {
        await this.broadcastToChannel(
          `economy:user:${transactionData.fromUserId}`,
          event
        );
      }
      if (transactionData.toUserId) {
        await this.broadcastToChannel(
          `economy:user:${transactionData.toUserId}`,
          event
        );
      }

      // 전체 거래 채널로도 브로드캐스트
      await this.broadcastToChannel("economy:transactions", event);

      return { success: true, data: undefined };
    } catch (error) {
      return { success: false, error: error as Error };
    }
  }

  /**
   * 시장 데이터 업데이트 이벤트 발행
   */
  async publishMarketDataUpdate(marketData: {
    marketId: string;
    indicators: Record<string, number>;
    trends: Record<string, "UP" | "DOWN" | "STABLE">;
    predictions: Record<string, number>;
  }): Promise<Result<void>> {
    try {
      const event: EconomicDomainEvent = {
        eventId: crypto.randomUUID(),
        eventType: "MARKET_DATA_UPDATED",
        timestamp: new Date(),
        data: marketData,
      };

      const { error } = await this.client.from("economic_events").insert({
        event_id: event.eventId,
        event_type: event.eventType,
        timestamp: event.timestamp.toISOString(),
        data: event.data,
      });

      if (error) {
        return { success: false, error };
      }

      // 시장 데이터 채널로 브로드캐스트
      await this.broadcastToChannel("economy:market-data", event);

      return { success: true, data: undefined };
    } catch (error) {
      return { success: false, error: error as Error };
    }
  }

  /**
   * 사회후생 계산 완료 이벤트 발행
   */
  async publishSocialWelfareCalculated(welfareData: {
    calculationId: string;
    overallWelfare: number;
    giniCoefficient: number;
    affected: {
      totalUsers: number;
      averageUtilityChange: number;
    };
    breakdown: Record<string, number>;
  }): Promise<Result<void>> {
    try {
      const event: EconomicDomainEvent = {
        eventId: crypto.randomUUID(),
        eventType: "SOCIAL_WELFARE_CALCULATED",
        timestamp: new Date(),
        data: welfareData,
      };

      const { error } = await this.client.from("economic_events").insert({
        event_id: event.eventId,
        event_type: event.eventType,
        timestamp: event.timestamp.toISOString(),
        data: event.data,
      });

      if (error) {
        return { success: false, error };
      }

      // 사회후생 분석 채널로 브로드캐스트
      await this.broadcastToChannel("economy:social-welfare", event);

      return { success: true, data: undefined };
    } catch (error) {
      return { success: false, error: error as Error };
    }
  }

  /**
   * 특정 채널로 이벤트 브로드캐스트
   */
  private async broadcastToChannel(
    channel: string,
    event: EconomicDomainEvent
  ): Promise<void> {
    try {
      await this.client.channel(channel).send({
        type: "broadcast",
        event: event.eventType,
        payload: event,
      });
    } catch (error) {
      console.error(`Failed to broadcast to channel ${channel}:`, error);
      // 브로드캐스트 실패는 치명적이지 않으므로 에러를 throw하지 않음
    }
  }

  /**
   * 이벤트 히스토리 조회
   */
  async getEventHistory(
    eventType?: EconomicEventType,
    userId?: UserId,
    startDate?: Date,
    endDate?: Date,
    limit: number = 100
  ): Promise<Result<EconomicDomainEvent[]>> {
    try {
      let query = this.client
        .from("economic_events")
        .select("*")
        .order("timestamp", { ascending: false })
        .limit(limit);

      if (eventType) {
        query = query.eq("event_type", eventType);
      }
      if (userId) {
        query = query.eq("user_id", userId);
      }
      if (startDate) {
        query = query.gte("timestamp", startDate.toISOString());
      }
      if (endDate) {
        query = query.lte("timestamp", endDate.toISOString());
      }

      const { data, error } = await query;

      if (error) {
        return { success: false, error };
      }

      const events: EconomicDomainEvent[] = data.map((row) => ({
        eventId: row.event_id,
        eventType: row.event_type,
        timestamp: new Date(row.timestamp),
        userId: row.user_id as UserId | undefined,
        data: row.data,
      }));

      return { success: true, data: events };
    } catch (error) {
      return { success: false, error: error as Error };
    }
  }

  /**
   * 연결 해제
   */
  async disconnect(): Promise<void> {
    await this.client.removeAllChannels();
  }
}
