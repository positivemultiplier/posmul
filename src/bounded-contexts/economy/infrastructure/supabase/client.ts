/**
 * Economy Bounded Context Supabase Configuration
 * DDD Infrastructure Layer - Supabase Database Connection
 */

import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

// Environment variables with validation
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing Supabase environment variables");
}

/**
 * Economy-specific Supabase client
 * Configured for economic data operations with optimal settings
 */
export const economySupabaseClient = createClient<Database>(
  supabaseUrl,
  supabaseKey,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
    realtime: {
      params: {
        eventsPerSecond: 10, // Optimize for economic data updates
      },
    },
    global: {
      headers: {
        "X-Client-Info": "economy-context",
      },
    },
  }
);

/**
 * Supabase database types for Economy schema
 * Auto-generated types should replace this when available
 */
export type EconomyTables = Database["economy"];

/**
 * Real-time subscription manager for economic events
 */
export class EconomyRealtimeManager {
  private subscriptions = new Map<string, any>();

  /**
   * Subscribe to PMP/PMC account changes
   */
  subscribeToPMPPMCChanges(userId: string, callback: (payload: any) => void) {
    const subscription = economySupabaseClient
      .channel(`pmp-pmc-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "economy",
          table: "pmp_pmc_accounts",
          filter: `user_id=eq.${userId}`,
        },
        callback
      )
      .subscribe();

    this.subscriptions.set(`pmp-pmc-${userId}`, subscription);
    return subscription;
  }

  /**
   * Subscribe to MoneyWave events
   */
  subscribeToMoneyWaveEvents(callback: (payload: any) => void) {
    const subscription = economySupabaseClient
      .channel("money-wave-events")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "economy",
          table: "money_wave_events",
        },
        callback
      )
      .subscribe();

    this.subscriptions.set("money-wave-events", subscription);
    return subscription;
  }

  /**
   * Subscribe to utility function updates
   */
  subscribeToUtilityFunctionUpdates(
    userId: string,
    callback: (payload: any) => void
  ) {
    const subscription = economySupabaseClient
      .channel(`utility-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "economy",
          table: "utility_functions",
          filter: `user_id=eq.${userId}`,
        },
        callback
      )
      .subscribe();

    this.subscriptions.set(`utility-${userId}`, subscription);
    return subscription;
  }

  /**
   * Subscribe to economic analytics updates
   */
  subscribeToEconomicAnalytics(callback: (payload: any) => void) {
    const subscription = economySupabaseClient
      .channel("economic-analytics")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "economy",
          table: "economic_indicators",
        },
        callback
      )
      .subscribe();

    this.subscriptions.set("economic-analytics", subscription);
    return subscription;
  }

  /**
   * Unsubscribe from a specific channel
   */
  unsubscribe(channelKey: string) {
    const subscription = this.subscriptions.get(channelKey);
    if (subscription) {
      subscription.unsubscribe();
      this.subscriptions.delete(channelKey);
    }
  }

  /**
   * Unsubscribe from all channels
   */
  unsubscribeAll() {
    for (const [key, subscription] of this.subscriptions) {
      subscription.unsubscribe();
    }
    this.subscriptions.clear();
  }
}

/**
 * Global instance of the realtime manager
 */
export const economyRealtimeManager = new EconomyRealtimeManager();

/**
 * Database transaction helper
 */
export class EconomyTransactionManager {
  /**
   * Execute multiple operations in a transaction
   */
  async executeTransaction<T>(
    operations: Array<() => Promise<any>>
  ): Promise<
    { success: true; results: T[] } | { success: false; error: Error }
  > {
    try {
      const results: T[] = [];

      // Supabase doesn't support explicit transactions in the client
      // So we implement compensation-based approach
      const operationResults: any[] = [];

      for (const operation of operations) {
        const result = await operation();
        operationResults.push(result);

        if (result.error) {
          // Rollback previous operations if possible
          await this.rollbackOperations(operationResults.slice(0, -1));
          throw new Error(result.error.message);
        }

        results.push(result.data);
      }

      return { success: true, results };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error("Transaction failed"),
      };
    }
  }

  private async rollbackOperations(operations: any[]) {
    // Implement compensation logic based on operation types
    // This is a simplified version - real implementation would need
    // to understand each operation type and how to reverse it
    console.warn("Transaction rollback not fully implemented");
  }
}

export const economyTransactionManager = new EconomyTransactionManager();
