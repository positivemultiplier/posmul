/**
 * Supabase PMP/PMC Account Repository Implementation
 *
 * Clean Architecture Infrastructure 계층의 Repository 구현체
 * IPMPPMCAccountRepository 인터페이스를 Supabase로 구현
 */

import { UserId } from "@/shared/types/branded-types";
import { Result } from "@/shared/types/common";
import {
  AccountActivity,
  AccountBalance,
  AccountSearchFilter,
  IPMPPMCAccountRepository,
  Transaction,
} from "../../domain/repositories";
import {
  GiniCoefficient,
  PMC,
  PMP,
  createGiniCoefficient,
  createPMC,
  createPMP,
  unwrapPMC,
  unwrapPMP,
} from "../../domain/value-objects";
import { BaseSupabaseRepository } from "./base-supabase.repository";

/**
 * Supabase 기반 PMP/PMC 계정 Repository 구현
 */
export class SupabasePMPPMCAccountRepository
  extends BaseSupabaseRepository
  implements IPMPPMCAccountRepository
{
  /**
   * 사용자 계정 잔액 조회
   */
  async getAccountBalance(userId: UserId): Promise<Result<AccountBalance>> {
    try {
      const { data, error } = await this.client
        .from("user_economic_profiles")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          // 계정이 없는 경우 기본 계정 생성
          const defaultAccount: AccountBalance = {
            userId,
            pmpBalance: createPMP(0),
            pmcBalance: createPMC(0),
            totalPMPEarned: createPMP(0),
            totalPMCEarned: createPMC(0),
            totalPMPSpent: createPMP(0),
            totalPMCSpent: createPMC(0),
            accountStatus: "active",
            lastActivityAt: new Date(),
            agencyScore: 0,
            informationAsymmetryReduction: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          return this.handleSuccess(defaultAccount);
        }
        return this.handleError(error);
      }

      const balance: AccountBalance = {
        userId,
        pmpBalance: createPMP(data.pmp_balance),
        pmcBalance: createPMC(data.pmc_balance),
        totalPMPEarned: createPMP(data.total_pmp_earned || 0),
        totalPMCEarned: createPMC(data.total_pmc_earned || 0),
        totalPMPSpent: createPMP(data.total_pmp_spent || 0),
        totalPMCSpent: createPMC(data.total_pmc_spent || 0),
        accountStatus: data.account_status || "active",
        lastActivityAt: new Date(data.last_activity_at),
        agencyScore: data.agency_score || 0,
        informationAsymmetryReduction:
          data.information_asymmetry_reduction || 0,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
      };

      return this.handleSuccess(balance);
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * 여러 사용자 계정 잔액 조회
   */
  async getAccountBalances(
    userIds: UserId[]
  ): Promise<Result<AccountBalance[]>> {
    try {
      const { data, error } = await this.client
        .from("user_economic_profiles")
        .select("*")
        .in("user_id", userIds);

      if (error) {
        return this.handleError(error);
      }

      const balances: AccountBalance[] = data.map((row) => ({
        userId: row.user_id as UserId,
        pmpBalance: createPMP(row.pmp_balance),
        pmcBalance: createPMC(row.pmc_balance),
        totalPMPEarned: createPMP(row.total_pmp_earned || 0),
        totalPMCEarned: createPMC(row.total_pmc_earned || 0),
        totalPMPSpent: createPMP(row.total_pmp_spent || 0),
        totalPMCSpent: createPMC(row.total_pmc_spent || 0),
        accountStatus: row.account_status || "active",
        lastActivityAt: new Date(row.last_activity_at),
        agencyScore: row.agency_score || 0,
        informationAsymmetryReduction: row.information_asymmetry_reduction || 0,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
      }));

      return this.handleSuccess(balances);
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * 계정 잔액 업데이트
   */
  async updateAccountBalance(
    userId: UserId,
    pmpBalance: PMP,
    pmcBalance: PMC
  ): Promise<Result<AccountBalance>> {
    try {
      const { data, error } = await this.client
        .from("user_economic_profiles")
        .upsert(
          {
            user_id: userId,
            pmp_balance: unwrapPMP(pmpBalance),
            pmc_balance: unwrapPMC(pmcBalance),
            last_activity_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: "user_id",
          }
        )
        .select()
        .single();

      if (error) {
        return this.handleError(error);
      }

      const balance: AccountBalance = {
        userId,
        pmpBalance,
        pmcBalance,
        totalPMPEarned: createPMP(data.total_pmp_earned || 0),
        totalPMCEarned: createPMC(data.total_pmc_earned || 0),
        totalPMPSpent: createPMP(data.total_pmp_spent || 0),
        totalPMCSpent: createPMC(data.total_pmc_spent || 0),
        accountStatus: data.account_status || "active",
        lastActivityAt: new Date(data.last_activity_at),
        agencyScore: data.agency_score || 0,
        informationAsymmetryReduction:
          data.information_asymmetry_reduction || 0,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
      };

      return this.handleSuccess(balance);
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * 거래 내역 저장
   */
  async saveTransaction(
    transaction: Omit<Transaction, "transactionId">
  ): Promise<Result<Transaction>> {
    try {
      const transactionId = crypto.randomUUID();
      const { data, error } = await this.client
        .from("economic_transactions")
        .insert({
          transaction_id: transactionId,
          user_id: transaction.userId,
          transaction_type: transaction.type,
          amount: transaction.amount,
          currency_type: transaction.currencyType,
          description: transaction.description,
          timestamp: transaction.timestamp.toISOString(),
          reference_type: transaction.referenceType || null,
          reference_id: transaction.referenceId || null,
          behavioral_economics_bonus:
            transaction.behavioralEconomicsBonus || null,
          agency_theory_multiplier: transaction.agencyTheoryMultiplier || null,
          network_effect_bonus: transaction.networkEffectBonus || null,
          pmp_balance_after: transaction.pmpBalanceAfter || null,
          pmc_balance_after: transaction.pmcBalanceAfter || null,
        })
        .select()
        .single();

      if (error) {
        return this.handleError(error);
      }

      const savedTransaction: Transaction = {
        transactionId: data.transaction_id,
        userId: transaction.userId,
        type: transaction.type,
        amount: transaction.amount,
        currencyType: transaction.currencyType,
        description: transaction.description,
        timestamp: new Date(data.timestamp),
        referenceType: data.reference_type || undefined,
        referenceId: data.reference_id || undefined,
        behavioralEconomicsBonus: data.behavioral_economics_bonus || undefined,
        agencyTheoryMultiplier: data.agency_theory_multiplier || undefined,
        networkEffectBonus: data.network_effect_bonus || undefined,
        pmpBalanceAfter: data.pmp_balance_after || undefined,
        pmcBalanceAfter: data.pmc_balance_after || undefined,
      };

      return this.handleSuccess(savedTransaction);
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * 거래 ID로 거래 조회
   */
  async getTransactionById(
    transactionId: string
  ): Promise<Result<Transaction>> {
    try {
      const { data, error } = await this.client
        .from("economic_transactions")
        .select("*")
        .eq("transaction_id", transactionId)
        .single();

      if (error) {
        return this.handleError(error);
      }

      const transaction: Transaction = {
        transactionId: data.transaction_id,
        userId: data.user_id as UserId,
        type: data.transaction_type as Transaction["type"],
        amount: data.amount,
        currencyType: data.currency_type as "PMP" | "PMC",
        description: data.description,
        timestamp: new Date(data.timestamp),
        referenceType: data.reference_type || undefined,
        referenceId: data.reference_id || undefined,
        behavioralEconomicsBonus: data.behavioral_economics_bonus || undefined,
        agencyTheoryMultiplier: data.agency_theory_multiplier || undefined,
        networkEffectBonus: data.network_effect_bonus || undefined,
        pmpBalanceAfter: data.pmp_balance_after || undefined,
        pmcBalanceAfter: data.pmc_balance_after || undefined,
      };

      return this.handleSuccess(transaction);
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * 사용자 거래 내역 조회
   */
  async getUserTransactions(
    userId: UserId,
    limit?: number,
    offset?: number
  ): Promise<Result<Transaction[]>> {
    try {
      let query = this.client
        .from("economic_transactions")
        .select("*")
        .eq("user_id", userId)
        .order("timestamp", { ascending: false });

      if (limit) {
        query = query.limit(limit);
      }

      if (offset) {
        query = query.range(offset, offset + (limit || 100) - 1);
      }

      const { data, error } = await query;

      if (error) {
        return this.handleError(error);
      }

      const transactions: Transaction[] = data.map((row) => ({
        transactionId: row.transaction_id,
        userId: row.user_id as UserId,
        type: row.transaction_type as Transaction["type"],
        amount: row.amount,
        currencyType: row.currency_type as "PMP" | "PMC",
        description: row.description,
        timestamp: new Date(row.timestamp),
        referenceType: row.reference_type || undefined,
        referenceId: row.reference_id || undefined,
        behavioralEconomicsBonus: row.behavioral_economics_bonus || undefined,
        agencyTheoryMultiplier: row.agency_theory_multiplier || undefined,
        networkEffectBonus: row.network_effect_bonus || undefined,
        pmpBalanceAfter: row.pmp_balance_after || undefined,
        pmcBalanceAfter: row.pmc_balance_after || undefined,
      }));

      return this.handleSuccess(transactions);
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * 계정 활동 상태 업데이트
   */
  async updateAccountActivity(
    activity: AccountActivity
  ): Promise<Result<void>> {
    try {
      const { error } = await this.client.from("account_activity_stats").upsert(
        {
          user_id: activity.userId,
          last_login_date: activity.lastLoginDate.toISOString(),
          last_transaction_date: activity.lastTransactionDate.toISOString(),
          transaction_count: activity.transactionCount,
          total_pmp_earned: unwrapPMP(activity.totalPMPEarned),
          total_pmc_earned: unwrapPMC(activity.totalPMCEarned),
          average_activity_score: activity.averageActivityScore,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "user_id",
        }
      );

      if (error) {
        return this.handleError(error);
      }

      return this.handleSuccess(undefined);
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * 계정 활동 상태 조회
   */
  async getAccountActivity(userId: UserId): Promise<Result<AccountActivity>> {
    try {
      const { data, error } = await this.client
        .from("account_activity_stats")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          // 활동 데이터가 없는 경우 기본값 반환
          const defaultActivity: AccountActivity = {
            userId,
            lastLoginDate: new Date(),
            lastTransactionDate: new Date(),
            transactionCount: 0,
            totalPMPEarned: createPMP(0),
            totalPMCEarned: createPMC(0),
            averageActivityScore: 0,
          };
          return this.handleSuccess(defaultActivity);
        }
        return this.handleError(error);
      }

      const activity: AccountActivity = {
        userId,
        lastLoginDate: new Date(data.last_login_date),
        lastTransactionDate: new Date(data.last_transaction_date),
        transactionCount: data.transaction_count,
        totalPMPEarned: createPMP(data.total_pmp_earned),
        totalPMCEarned: createPMC(data.total_pmc_earned),
        averageActivityScore: data.average_activity_score,
      };

      return this.handleSuccess(activity);
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * 시스템 전체 PMP/PMC 통계 조회
   */
  async getSystemStatistics(): Promise<
    Result<{ totalPMP: PMP; totalPMC: PMC; activeUsers: number }>
  > {
    try {
      const { data, error } = await this.client
        .from("system_statistics")
        .select("total_pmp_supply, total_pmc_supply, active_user_count")
        .order("recorded_at", { ascending: false })
        .limit(1)
        .single();

      if (error) {
        return this.handleError(error);
      }

      const statistics = {
        totalPMP: createPMP(data.total_pmp_supply || 0),
        totalPMC: createPMC(data.total_pmc_supply || 0),
        activeUsers: data.active_user_count || 0,
      };

      return this.handleSuccess(statistics);
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * 자산 분포 조회 (지니계수 계산용)
   */
  async getAssetDistribution(): Promise<Result<Array<{ pmp: PMP; pmc: PMC }>>> {
    try {
      const { data, error } = await this.client
        .from("user_economic_profiles")
        .select("pmp_balance, pmc_balance")
        .eq("account_status", "active");

      if (error) {
        return this.handleError(error);
      }

      const distribution = data.map((row) => ({
        pmp: createPMP(row.pmp_balance),
        pmc: createPMC(row.pmc_balance),
      }));

      return this.handleSuccess(distribution);
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * 지니계수 계산
   */
  async calculateGiniCoefficient(): Promise<Result<GiniCoefficient>> {
    try {
      const distributionResult = await this.getAssetDistribution();
      if (!distributionResult.success) {
        return distributionResult as Result<GiniCoefficient>;
      }

      const distribution = distributionResult.data;
      if (distribution.length === 0) {
        return this.handleSuccess(createGiniCoefficient(0));
      }

      // 총 자산 (PMP + PMC 가치) 계산
      const totalAssets = distribution.map(
        (d) => unwrapPMP(d.pmp) + unwrapPMC(d.pmc)
      );

      // 지니계수 계산 알고리즘
      totalAssets.sort((a, b) => a - b);
      const n = totalAssets.length;
      const sum = totalAssets.reduce((acc, val) => acc + val, 0);

      if (sum === 0) {
        return this.handleSuccess(createGiniCoefficient(0));
      }

      let giniSum = 0;
      for (let i = 0; i < n; i++) {
        giniSum += (2 * (i + 1) - n - 1) * totalAssets[i];
      }

      const giniCoefficient = giniSum / (n * sum);
      return this.handleSuccess(createGiniCoefficient(giniCoefficient));
    } catch (error) {
      return this.handleError(error);
    }
  }
  /**
   * 계정 검색
   */
  async searchAccounts(
    filter: AccountSearchFilter,
    limit?: number,
    offset?: number
  ): Promise<Result<AccountBalance[]>> {
    try {
      let query = this.client.from("user_economic_profiles").select("*");

      if (filter.accountStatus !== undefined) {
        query = query.eq("account_status", filter.accountStatus);
      }

      if (filter.minPMPBalance !== undefined) {
        query = query.gte("pmp_balance", unwrapPMP(filter.minPMPBalance));
      }

      if (filter.maxPMPBalance !== undefined) {
        query = query.lte("pmp_balance", unwrapPMP(filter.maxPMPBalance));
      }

      if (filter.minPMCBalance !== undefined) {
        query = query.gte("pmc_balance", unwrapPMC(filter.minPMCBalance));
      }

      if (filter.maxPMCBalance !== undefined) {
        query = query.lte("pmc_balance", unwrapPMC(filter.maxPMCBalance));
      }

      if (filter.lastActivityAfter) {
        query = query.gte(
          "last_activity_at",
          filter.lastActivityAfter.toISOString()
        );
      }
      if (filter.lastActivityBefore) {
        query = query.lte(
          "last_activity_at",
          filter.lastActivityBefore.toISOString()
        );
      }

      if (offset) {
        query = query.range(offset, offset + (limit || 100) - 1);
      }

      const { data, error } = await query
        .order("last_activity_at", { ascending: false })
        .limit(limit || 100);

      if (error) {
        return this.handleError(error);
      }

      const accounts: AccountBalance[] = data.map((row) => ({
        userId: row.user_id as UserId,
        pmpBalance: createPMP(row.pmp_balance),
        pmcBalance: createPMC(row.pmc_balance),
        totalPMPEarned: createPMP(row.total_pmp_earned || 0),
        totalPMCEarned: createPMC(row.total_pmc_earned || 0),
        totalPMPSpent: createPMP(row.total_pmp_spent || 0),
        totalPMCSpent: createPMC(row.total_pmc_spent || 0),
        accountStatus: row.account_status || "active",
        lastActivityAt: new Date(row.last_activity_at),
        agencyScore: row.agency_score || 0,
        informationAsymmetryReduction: row.information_asymmetry_reduction || 0,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
      }));

      return this.handleSuccess(accounts);
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * 휴면 계정 검색
   */
  async findDormantAccounts(
    dormancyPeriodMonths: number,
    minBalance?: PMC
  ): Promise<Result<AccountBalance[]>> {
    try {
      const dormancyDate = new Date();
      dormancyDate.setMonth(dormancyDate.getMonth() - dormancyPeriodMonths);

      let query = this.client
        .from("user_economic_profiles")
        .select("*")
        .lte("last_activity_at", dormancyDate.toISOString())
        .eq("account_status", "active");

      if (minBalance !== undefined) {
        query = query.gte("pmc_balance", unwrapPMC(minBalance));
      }

      const { data, error } = await query;

      if (error) {
        return this.handleError(error);
      }

      const accounts: AccountBalance[] = data.map((row) => ({
        userId: row.user_id as UserId,
        pmpBalance: createPMP(row.pmp_balance),
        pmcBalance: createPMC(row.pmc_balance),
        totalPMPEarned: createPMP(row.total_pmp_earned || 0),
        totalPMCEarned: createPMC(row.total_pmc_earned || 0),
        totalPMPSpent: createPMP(row.total_pmp_spent || 0),
        totalPMCSpent: createPMC(row.total_pmc_spent || 0),
        accountStatus: row.account_status || "active",
        lastActivityAt: new Date(row.last_activity_at),
        agencyScore: row.agency_score || 0,
        informationAsymmetryReduction: row.information_asymmetry_reduction || 0,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
      }));

      return this.handleSuccess(accounts);
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * 전체 PMP/PMC 통계
   */
  async getSystemTotals(): Promise<
    Result<{
      totalPMPSupply: PMP;
      totalPMCSupply: PMC;
      activeAccountCount: number;
      totalTransactionCount: number;
    }>
  > {
    try {
      // 계정 통계 조회
      const { data: accountData, error: accountError } = await this.client
        .from("user_economic_profiles")
        .select("pmp_balance, pmc_balance, account_status");

      if (accountError) {
        return this.handleError(accountError);
      }

      // 거래 수 조회
      const { count: transactionCount, error: transactionError } =
        await this.client
          .from("economic_transactions")
          .select("*", { count: "exact", head: true });

      if (transactionError) {
        return this.handleError(transactionError);
      }

      // 통계 계산
      const totalPMP = accountData.reduce(
        (sum, row) => sum + row.pmp_balance,
        0
      );
      const totalPMC = accountData.reduce(
        (sum, row) => sum + row.pmc_balance,
        0
      );
      const activeAccounts = accountData.filter(
        (row) => row.account_status === "active"
      ).length;

      const statistics = {
        totalPMPSupply: createPMP(totalPMP),
        totalPMCSupply: createPMC(totalPMC),
        activeAccountCount: activeAccounts,
        totalTransactionCount: transactionCount || 0,
      };

      return this.handleSuccess(statistics);
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * 지니계수 계산을 위한 자산 분포 조회
   */
  async getWealthDistribution(): Promise<
    Result<{
      pmcDistribution: number[];
      pmpDistribution: number[];
      giniCoefficient: number;
    }>
  > {
    try {
      const { data, error } = await this.client
        .from("user_economic_profiles")
        .select("pmp_balance, pmc_balance")
        .eq("account_status", "active");

      if (error) {
        return this.handleError(error);
      }

      const pmpDistribution = data
        .map((row) => row.pmp_balance)
        .sort((a, b) => a - b);
      const pmcDistribution = data
        .map((row) => row.pmc_balance)
        .sort((a, b) => a - b);

      // 지니계수 계산 (PMP + PMC 총 자산 기준)
      const totalAssets = data
        .map((row) => row.pmp_balance + row.pmc_balance)
        .sort((a, b) => a - b);
      const n = totalAssets.length;
      const sum = totalAssets.reduce((acc, val) => acc + val, 0);

      let giniCoefficient = 0;
      if (n > 0 && sum > 0) {
        let giniSum = 0;
        for (let i = 0; i < n; i++) {
          giniSum += (2 * (i + 1) - n - 1) * totalAssets[i];
        }
        giniCoefficient = giniSum / (n * sum);
      }

      const distribution = {
        pmcDistribution,
        pmpDistribution,
        giniCoefficient,
      };

      return this.handleSuccess(distribution);
    } catch (error) {
      return this.handleError(error);
    }
  }
}
