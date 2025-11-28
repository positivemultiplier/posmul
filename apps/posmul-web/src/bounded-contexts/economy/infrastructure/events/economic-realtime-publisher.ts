/**
 * Economy Domain Real-time Event Publisher
 *
 * Supabase Realtime???�용??경제 ?�메???�벤???�시�?발행 ?�스?? * MoneyWave ?�행, 계좌 ?�액 변�? ?�장 ?�이???�데?�트 ???�시�??�림
 */
import { UserId } from "@posmul/auth-economy-sdk";
import { Result } from "@posmul/auth-economy-sdk";

import { SupabaseClient, createClient } from "@supabase/supabase-js";

import { PmcAmount, PmpAmount } from "../../domain/value-objects";

/**
 * 경제 ?�메???�벤???�?? */
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
 * ?�시�??�벤??발행?? */
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
   * MoneyWave ?�행 ?�벤??발행
   */
  async publishMoneyWaveEvent(
    waveType: "WAVE1" | "WAVE2" | "WAVE3",
    eventData: {
      executionId: string;
      affectedUsers: UserId[];
      totalPmcAmountImpact: PmcAmount;
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

      // Realtime 채널�?즉시 브로?�캐?�트
      await this.broadcastToChannel("economy:money-waves", event);

      return { success: true, data: undefined };
    } catch (error) {
      return {
        success: false,
        error: new Error(
          `MoneyWaveEventError: ${error instanceof Error ? error.message : String(error)}`
        ),
      };
    }
  }

  /**
   * 계좌 ?�액 변�??�벤??발행
   */
  async publishAccountBalanceChange(
    userId: UserId,
    changes: {
      pmpBefore: PmpAmount;
      pmpAfter: PmpAmount;
      pmcBefore: PmcAmount;
      pmcAfter: PmcAmount;
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

      // 개인�?채널�?브로?�캐?�트
      await this.broadcastToChannel(`economy:user:${userId}`, event);

      // ?�체 ?�액 변�?채널로도 브로?�캐?�트
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
      return {
        success: false,
        error: new Error(
          `AccountBalanceEventError: ${error instanceof Error ? error.message : String(error)}`
        ),
      };
    }
  }

  /**
   * 거래 ?�료 ?�벤??발행
   */
  async publishTransactionCompleted(transactionData: {
    transactionId: string;
    fromUserId?: UserId;
    toUserId?: UserId;
    amount: PmcAmount | PmpAmount;
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

      // 관???�용?�들?�게 브로?�캐?�트
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

      // ?�체 거래 채널로도 브로?�캐?�트
      await this.broadcastToChannel("economy:transactions", event);

      return { success: true, data: undefined };
    } catch (error) {
      return {
        success: false,
        error: new Error(
          `TransactionEventError: ${error instanceof Error ? error.message : String(error)}`
        ),
      };
    }
  }

  /**
   * ?�장 ?�이???�데?�트 ?�벤??발행
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

      // ?�장 ?�이??채널�?브로?�캐?�트
      await this.broadcastToChannel("economy:market-data", event);

      return { success: true, data: undefined };
    } catch (error) {
      return {
        success: false,
        error: new Error(
          error instanceof Error ? error.message : String(error)
        ),
      };
    }
  }

  /**
   * ?�회?�생 계산 ?�료 ?�벤??발행
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

      // ?�회?�생 분석 채널�?브로?�캐?�트
      await this.broadcastToChannel("economy:social-welfare", event);

      return { success: true, data: undefined };
    } catch (error) {
      return {
        success: false,
        error: new Error(
          error instanceof Error ? error.message : String(error)
        ),
      };
    }
  }

  /**
   * ?�정 채널�??�벤??브로?�캐?�트
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
      // 브로?�캐?�트 ?�패??치명?�이지 ?�으므�??�러�?throw?��? ?�음
    }
  }

  /**
   * ?�벤???�스?�리 조회
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
      return {
        success: false,
        error: new Error(
          error instanceof Error ? error.message : String(error)
        ),
      };
    }
  }

  /**
   * ?�결 ?�제
   */
  async disconnect(): Promise<void> {
    await this.client.removeAllChannels();
  }
}
