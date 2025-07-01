/**
 * Supabase PMP/PMC Account Repository Implementation (MCP Version)
 *
 * Clean Architecture Infrastructure 계층의 Repository 구현체
 * IPMPPMCAccountRepository 인터페이스를 Supabase MCP로 구현
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
import { BaseMCPRepository } from "./base-mcp.repository";

// Helper to convert DB rows to domain objects
const toAccountBalance = (data: any): AccountBalance => ({
  userId: data.user_id,
  pmpBalance: createPMP(data.pmp_balance),
  pmcBalance: createPMC(data.pmc_balance),
  totalPMPEarned: createPMP(data.total_pmp_earned || 0),
  totalPMCEarned: createPMC(data.total_pmc_earned || 0),
  totalPMPSpent: createPMP(data.total_pmp_spent || 0),
  totalPMCSpent: createPMC(data.total_pmc_spent || 0),
  accountStatus: data.account_status || "active",
  lastActivityAt: new Date(data.last_activity_at),
  agencyScore: data.agency_score || 0,
  informationAsymmetryReduction: data.information_asymmetry_reduction || 0,
  createdAt: new Date(data.created_at),
  updatedAt: new Date(data.updated_at),
});

const toTransaction = (data: any): Transaction => ({
  transactionId: data.transaction_id,
  userId: data.user_id,
  type: data.transaction_type,
  amount: data.amount,
  currencyType: data.currency_type,
  description: data.description,
  timestamp: new Date(data.timestamp),
  referenceType: data.reference_type || undefined,
  referenceId: data.reference_id || undefined,
  behavioralEconomicsBonus: data.behavioral_economics_bonus || undefined,
  agencyTheoryMultiplier: data.agency_theory_multiplier || undefined,
  networkEffectBonus: data.network_effect_bonus || undefined,
  pmpBalanceAfter: data.pmp_balance_after || undefined,
  pmcBalanceAfter: data.pmc_balance_after || undefined,
});

export class SupabasePMPPMCAccountRepository
  extends BaseMCPRepository
  implements IPMPPMCAccountRepository
{
  private async _handleError(error: unknown): Promise<Result<any, Error>> {
    console.error("Repository Error:", error);
    return { success: false, error: new Error(String(error)) };
  }

  async getAccountBalance(userId: UserId): Promise<Result<AccountBalance>> {
    try {
      const query = `SELECT * FROM user_economic_profiles WHERE user_id = '${userId}' LIMIT 1;`;
      const result = await this.executeQuery(query);

      if (!result.data || result.data.length === 0) {
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
        return { success: true, data: defaultAccount };
      }
      return { success: true, data: toAccountBalance(result.data[0]) };
    } catch (error) {
      return this._handleError(error);
    }
  }

  async getAccountBalances(
    userIds: UserId[]
  ): Promise<Result<AccountBalance[]>> {
    if (userIds.length === 0) {
      return { success: true, data: [] };
    }
    try {
      const ids = userIds.map((id) => `'${id}'`).join(",");
      const query = `SELECT * FROM user_economic_profiles WHERE user_id IN (${ids});`;
      const result = await this.executeQuery(query);
      const balances = result.data?.map(toAccountBalance) || [];
      return { success: true, data: balances };
    } catch (error) {
      return this._handleError(error);
    }
  }

  async updateAccountBalance(
    userId: UserId,
    pmpBalance: PMP,
    pmcBalance: PMC
  ): Promise<Result<AccountBalance>> {
    try {
      const query = `
        INSERT INTO user_economic_profiles (user_id, pmp_balance, pmc_balance, last_activity_at, updated_at)
        VALUES ('${userId}', ${unwrapPMP(pmpBalance)}, ${unwrapPMC(
        pmcBalance
      )}, NOW(), NOW())
        ON CONFLICT (user_id) DO UPDATE SET 
          pmp_balance = EXCLUDED.pmp_balance, 
          pmc_balance = EXCLUDED.pmc_balance, 
          updated_at = NOW()
        RETURNING *;`;
      const result = await this.executeQuery(query);
      return { success: true, data: toAccountBalance(result.data[0]) };
    } catch (error) {
      return this._handleError(error);
    }
  }

  async saveTransaction(
    transaction: Omit<Transaction, "transactionId">
  ): Promise<Result<Transaction>> {
    try {
      const transactionId = crypto.randomUUID();
      // WARNING: This is not safe for production. Use parameterized queries.
      const query = `
        INSERT INTO economic_transactions (transaction_id, user_id, transaction_type, amount, currency_type, description, timestamp)
        VALUES ('${transactionId}', '${transaction.userId}', '${
        transaction.type
      }', ${transaction.amount}, '${
        transaction.currencyType
      }', '${transaction.description.replace(
        /'/g,
        "''"
      )}', '${transaction.timestamp.toISOString()}')
        RETURNING *;
      `;
      const result = await this.executeQuery(query);
      return { success: true, data: toTransaction(result.data[0]) };
    } catch (error) {
      return this._handleError(error);
    }
  }

  async getTransactionById(
    transactionId: string
  ): Promise<Result<Transaction>> {
    try {
      const query = `SELECT * FROM economic_transactions WHERE transaction_id = '${transactionId}';`;
      const result = await this.executeQuery(query);
      if (!result.data || result.data.length === 0) {
        return { success: false, error: new Error("Transaction not found") };
      }
      return { success: true, data: toTransaction(result.data[0]) };
    } catch (error) {
      return this._handleError(error);
    }
  }

  async getUserTransactions(
    userId: UserId,
    limit = 20,
    offset = 0
  ): Promise<Result<Transaction[]>> {
    try {
      const query = `
        SELECT * FROM economic_transactions 
        WHERE user_id = '${userId}' 
        ORDER BY timestamp DESC
        LIMIT ${limit}
        OFFSET ${offset};
      `;
      const result = await this.executeQuery(query);
      const transactions = result.data?.map(toTransaction) || [];
      return { success: true, data: transactions };
    } catch (error) {
      return this._handleError(error);
    }
  }

  async getAccountActivity(userId: UserId): Promise<Result<AccountActivity>> {
    try {
      const query = `SELECT * FROM account_activity_stats WHERE user_id = '${userId}';`;
      const result = await this.executeQuery(query);
      if (!result.data || result.data.length === 0) {
        const defaultActivity: AccountActivity = {
          userId,
          lastLoginDate: new Date(),
          lastTransactionDate: new Date(),
          transactionCount: 0,
          totalPMPEarned: createPMP(0),
          totalPMCEarned: createPMC(0),
          averageActivityScore: 0,
        };
        return { success: true, data: defaultActivity };
      }
      const data = result.data[0];
      const activity: AccountActivity = {
        userId,
        lastLoginDate: new Date(data.last_login_date),
        lastTransactionDate: new Date(data.last_transaction_date),
        transactionCount: data.transaction_count,
        totalPMPEarned: createPMP(data.total_pmp_earned),
        totalPMCEarned: createPMC(data.total_pmc_earned),
        averageActivityScore: data.average_activity_score,
      };
      return { success: true, data: activity };
    } catch (error) {
      return this._handleError(error);
    }
  }

  async findDormantAccounts(
    dormancyPeriodMonths: number,
    minBalance?: PMC
  ): Promise<Result<AccountBalance[]>> {
    try {
      const dormancyDate = new Date();
      dormancyDate.setMonth(dormancyDate.getMonth() - dormancyPeriodMonths);

      let whereClauses = [
        `last_activity_at <= '${dormancyDate.toISOString()}'`,
      ];
      if (minBalance) {
        whereClauses.push(`pmc_balance >= ${unwrapPMC(minBalance)}`);
      }
      const whereString = whereClauses.join(" AND ");

      const query = `SELECT * FROM user_economic_profiles WHERE ${whereString};`;
      const result = await this.executeQuery(query);
      const accounts = result.data?.map(toAccountBalance) || [];
      return { success: true, data: accounts };
    } catch (error) {
      return this._handleError(error);
    }
  }

  async calculateGiniCoefficient(): Promise<Result<GiniCoefficient>> {
    try {
      const query = `SELECT pmc_balance FROM user_economic_profiles WHERE pmc_balance > 0;`;
      const result = await this.executeQuery(query);
      const balances = result.data?.map((d: any) => d.pmc_balance) || [];

      const n = balances.length;
      if (n < 2) return { success: true, data: createGiniCoefficient(0) };

      const sumOfBalances = balances.reduce(
        (acc: number, val: number) => acc + val,
        0
      );
      if (sumOfBalances === 0)
        return { success: true, data: createGiniCoefficient(0) };

      let sumOfAbsoluteDifferences = 0;
      for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
          sumOfAbsoluteDifferences += Math.abs(balances[i] - balances[j]);
        }
      }
      const gini = sumOfAbsoluteDifferences / (2 * n * sumOfBalances);
      return { success: true, data: createGiniCoefficient(gini) };
    } catch (error) {
      return this._handleError(error);
    }
  }

  async searchAccounts(
    filter: AccountSearchFilter,
    limit = 100,
    offset = 0
  ): Promise<Result<AccountBalance[]>> {
    try {
      let whereClauses: string[] = [];
      if (filter.accountStatus)
        whereClauses.push(`account_status = '${filter.accountStatus}'`);
      if (filter.minPMPBalance)
        whereClauses.push(`pmp_balance >= ${unwrapPMP(filter.minPMPBalance)}`);
      if (filter.maxPMPBalance)
        whereClauses.push(`pmp_balance <= ${unwrapPMP(filter.maxPMPBalance)}`);
      if (filter.minPMCBalance)
        whereClauses.push(`pmc_balance >= ${unwrapPMC(filter.minPMCBalance)}`);
      if (filter.maxPMCBalance)
        whereClauses.push(`pmc_balance <= ${unwrapPMC(filter.maxPMCBalance)}`);
      if (filter.lastActivityAfter)
        whereClauses.push(
          `last_activity_at >= '${filter.lastActivityAfter.toISOString()}'`
        );
      if (filter.lastActivityBefore)
        whereClauses.push(
          `last_activity_at <= '${filter.lastActivityBefore.toISOString()}'`
        );

      const whereString =
        whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";

      const query = `
        SELECT * FROM user_economic_profiles
        ${whereString}
        ORDER BY created_at DESC
        LIMIT ${limit}
        OFFSET ${offset};
      `;
      const result = await this.executeQuery(query);
      const accounts = result.data?.map(toAccountBalance) || [];
      return { success: true, data: accounts };
    } catch (error) {
      return this._handleError(error);
    }
  }

  async getSystemTotals(): Promise<
    Result<{
      totalPMPSupply: PMP;
      totalPMCSupply: PMC;
      activeAccountCount: number;
      totalTransactionCount: number;
    }>
  > {
    try {
      const query = `SELECT * FROM get_system_totals();`;
      const result = await this.executeQuery(query);
      const data = result.data[0];
      return {
        success: true,
        data: {
          totalPMPSupply: createPMP(data.total_pmp_supply),
          totalPMCSupply: createPMC(data.total_pmc_supply),
          activeAccountCount: data.active_account_count,
          totalTransactionCount: data.total_transaction_count,
        },
      };
    } catch (error) {
      return this._handleError(error);
    }
  }

  async getWealthDistribution(): Promise<
    Result<{
      pmcDistribution: number[];
      pmpDistribution: number[];
      giniCoefficient: number;
    }>
  > {
    try {
      const query = `SELECT * FROM get_wealth_distribution();`;
      const result = await this.executeQuery(query);
      if (!result.data || result.data.length === 0) {
        return {
          success: true,
          data: {
            pmcDistribution: [],
            pmpDistribution: [],
            giniCoefficient: 0,
          },
        };
      }
      return { success: true, data: result.data[0] };
    } catch (error) {
      return this._handleError(error);
    }
  }
}
