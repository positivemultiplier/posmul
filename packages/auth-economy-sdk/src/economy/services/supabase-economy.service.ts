/**
 * Supabase 기반 경제 서비스 구현
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { 
  UserId, 
  PmpAmount, 
  PmcAmount, 
  EconomicBalance, 
  TransactionResult,
  TransactionId,
  Result,
  EconomyService,
  EconomyError
} from '../types';

// 개발 모드 체크
const IS_DEVELOPMENT = process.env.NODE_ENV === 'development';
const DEV_BONUS_PMP = 10000;
const DEV_BONUS_PMC = 10000;

export class SupabaseEconomyService implements EconomyService {
  constructor(private supabase: SupabaseClient) {}

  // 🎁 개발용 로그인 보너스 지급 (개발 환경에서만)
  async grantDevLoginBonus(userId: UserId): Promise<Result<{ pmpBalance: number; pmcBalance: number; bonusGranted: boolean }, EconomyError>> {
    // 프로덕션 환경에서는 스킵
    if (!IS_DEVELOPMENT) {
      return {
        success: true,
        data: {
          pmpBalance: 0,
          pmcBalance: 0,
          bonusGranted: false,
        }
      };
    }

    try {
      // DDD: economy.pmp_pmc_accounts에서 잔액 조회 (Single Source of Truth)
      const { data: account, error: accountError } = await this.supabase
        .schema('economy')
        .from('pmp_pmc_accounts')
        .select('pmp_balance, pmc_balance')
        .eq('user_id', userId)
        .single();

      if (accountError?.code === 'PGRST116') {
        // 계정이 없으면 새로 생성
        const { error: insertError } = await this.supabase
          .schema('economy')
          .from('pmp_pmc_accounts')
          .insert({
            user_id: userId,
            pmp_balance: DEV_BONUS_PMP,
            pmc_balance: DEV_BONUS_PMC,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });

        if (insertError) {
          return {
            success: false,
            error: new EconomyError(`경제 계정 생성 실패: ${insertError.message}`),
          };
        }

        console.log(`🎁 [DEV/SDK] 새 사용자에게 개발 보너스 지급: +${DEV_BONUS_PMP} PMP, +${DEV_BONUS_PMC} PMC`);

        return {
          success: true,
          data: {
            pmpBalance: DEV_BONUS_PMP,
            pmcBalance: DEV_BONUS_PMC,
            bonusGranted: true,
          }
        };
      }

      if (accountError) {
        return {
          success: false,
          error: new EconomyError(`잔액 조회 실패: ${accountError.message}`),
        };
      }

      // 현재 잔액에 보너스 추가
      const currentPmp = Number(account.pmp_balance) || 0;
      const currentPmc = Number(account.pmc_balance) || 0;
      const newPmpBalance = currentPmp + DEV_BONUS_PMP;
      const newPmcBalance = currentPmc + DEV_BONUS_PMC;

      const { error: updateError } = await this.supabase
        .schema('economy')
        .from('pmp_pmc_accounts')
        .update({
          pmp_balance: newPmpBalance,
          pmc_balance: newPmcBalance,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);

      if (updateError) {
        return {
          success: false,
          error: new EconomyError(`잔액 업데이트 실패: ${updateError.message}`),
        };
      }

      console.log(`🎁 [DEV/SDK] 개발 보너스 지급: +${DEV_BONUS_PMP} PMP, +${DEV_BONUS_PMC} PMC`);
      console.log(`   - PMP: ${currentPmp.toLocaleString()} → ${newPmpBalance.toLocaleString()}`);
      console.log(`   - PMC: ${currentPmc.toLocaleString()} → ${newPmcBalance.toLocaleString()}`);

      return {
        success: true,
        data: {
          pmpBalance: newPmpBalance,
          pmcBalance: newPmcBalance,
          bonusGranted: true,
        }
      };
    } catch (error) {
      return {
        success: false,
        error: new EconomyError(error instanceof Error ? error.message : '개발 보너스 지급 중 오류가 발생했습니다.'),
      };
    }
  }

  // 💰 PmpAmount 잔액 조회
  async getPmpAmountBalance(userId: UserId): Promise<Result<PmpAmount, EconomyError>> {
    try {
      // DDD: economy.pmp_pmc_accounts is Single Source of Truth
      const { data, error } = await this.supabase
        .schema('economy')
        .from('pmp_pmc_accounts')
        .select('pmp_balance')
        .eq('user_id', userId)
        .single();

      if (error) {
        return { success: false, error: new EconomyError(`PmpAmount 잔액 조회 실패: ${error.message}`) };
      }

      return { success: true, data: data.pmp_balance as PmpAmount };
    } catch (error) {
      return { 
        success: false, 
        error: new EconomyError(error instanceof Error ? error.message : 'PmpAmount 잔액 조회 중 오류가 발생했습니다.') 
      };
    }
  }

  // 💰 PmcAmount 잔액 조회
  async getPmcAmountBalance(userId: UserId): Promise<Result<PmcAmount, EconomyError>> {
    try {
      // DDD: economy.pmp_pmc_accounts is Single Source of Truth
      const { data, error } = await this.supabase
        .schema('economy')
        .from('pmp_pmc_accounts')
        .select('pmc_balance')
        .eq('user_id', userId)
        .single();

      if (error) {
        return { success: false, error: new EconomyError(`PmcAmount 잔액 조회 실패: ${error.message}`) };
      }

      return { success: true, data: data.pmc_balance as PmcAmount };
    } catch (error) {
      return { 
        success: false, 
        error: new EconomyError(error instanceof Error ? error.message : 'PmcAmount 잔액 조회 중 오류가 발생했습니다.') 
      };
    }
  }

  // 💰 통합 잔액 조회
  async getCombinedBalance(userId: UserId): Promise<Result<EconomicBalance, EconomyError>> {
    try {
      // DDD: economy.pmp_pmc_accounts is Single Source of Truth
      const { data, error } = await this.supabase
        .schema('economy')
        .from('pmp_pmc_accounts')
        .select('pmp_balance, pmc_balance, updated_at')
        .eq('user_id', userId)
        .single();

      if (error) {
        return { success: false, error: new EconomyError(`잔액 조회 실패: ${error.message}`) };
      }

      const balance: EconomicBalance = {
        pmp: data.pmp_balance as PmpAmount,
        pmc: data.pmc_balance as PmcAmount,
        lastUpdated: new Date(data.updated_at)
      };

      return { success: true, data: balance };
    } catch (error) {
      return { 
        success: false, 
        error: new EconomyError(error instanceof Error ? error.message : '잔액 조회 중 오류가 발생했습니다.') 
      };
    }
  }

  // 💸 PmpAmount 전송
  async transferPmpAmount(fromUserId: UserId, toUserId: UserId, amount: PmpAmount): Promise<Result<TransactionResult, EconomyError>> {
    try {
      const { data, error } = await this.supabase.rpc('transfer_pmp', {
        from_user_id: fromUserId,
        to_user_id: toUserId,
        amount: amount
      });

      if (error) {
        return { success: false, error: new EconomyError(`PmpAmount 전송 실패: ${error.message}`) };
      }

      const transaction: TransactionResult = {
        id: data.transaction_id as TransactionId,
        fromUserId,
        toUserId,
        amount,
        type: 'PmpAmount',
        status: 'completed',
        createdAt: new Date()
      };

      return { success: true, data: transaction };
    } catch (error) {
      return { 
        success: false, 
        error: new EconomyError(error instanceof Error ? error.message : 'PmpAmount 전송 중 오류가 발생했습니다.') 
      };
    }
  }

  // 💸 PmcAmount 전송  
  async transferPmcAmount(fromUserId: UserId, toUserId: UserId, amount: PmcAmount): Promise<Result<TransactionResult, EconomyError>> {
    try {
      const { data, error } = await this.supabase.rpc('transfer_pmc', {
        from_user_id: fromUserId,
        to_user_id: toUserId,
        amount: amount
      });

      if (error) {
        return { success: false, error: new EconomyError(`PmcAmount 전송 실패: ${error.message}`) };
      }

      const transaction: TransactionResult = {
        id: data.transaction_id as TransactionId,
        fromUserId,
        toUserId,
        amount,
        type: 'PmcAmount',
        status: 'completed',
        createdAt: new Date()
      };

      return { success: true, data: transaction };
    } catch (error) {
      return { 
        success: false, 
        error: new EconomyError(error instanceof Error ? error.message : 'PmcAmount 전송 중 오류가 발생했습니다.') 
      };
    }
  }

  // 📊 트랜잭션 기록 조회 (정식 멀티스키마 economy.pmp_pmc_transactions 사용)
  async getTransactionHistory(userId: UserId): Promise<Result<TransactionResult[], EconomyError>> {
    try {
      const { data, error } = await this.supabase
        .schema('economy')
        .from('pmp_pmc_transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) {
        return { success: false, error: new EconomyError(`트랜잭션 기록 조회 실패: ${error.message}`) };
      }

      const transactions: TransactionResult[] = (data || []).map((row: Record<string, unknown>) => {
        const pmpVal = Number(row.pmp_amount ?? 0);
        const pmcVal = Number(row.pmc_amount ?? 0);
        const isPmc = Math.abs(pmcVal) > 0 && Math.abs(pmpVal) === 0;
        return {
          id: String(row.transaction_id ?? row.id ?? '') as TransactionId,
          fromUserId: String(row.user_id ?? userId) as UserId,
          toUserId: String(row.user_id ?? userId) as UserId,
          amount: (isPmc ? pmcVal : pmpVal) as PmpAmount | PmcAmount,
          type: (isPmc ? 'PmcAmount' : 'PmpAmount') as 'PmpAmount' | 'PmcAmount',
          status: 'completed' as const,
          createdAt: new Date(String(row.created_at ?? new Date().toISOString()))
        };
      });

      return { success: true, data: transactions };
    } catch (error) {
      return { 
        success: false, 
        error: new EconomyError(error instanceof Error ? error.message : '트랜잭션 기록 조회 중 오류가 발생했습니다.') 
      };
    }
  }

  // 🎯 예측 게임에 PmpAmount 스테이킹
  async stakePmpAmountOnPrediction(userId: UserId, predictionId: string, amount: PmpAmount): Promise<Result<TransactionResult, EconomyError>> {
    try {
      const { data, error } = await this.supabase
        .schema('economy')
        .rpc('stake_pmp_on_prediction', {
          user_id: userId,
          prediction_id: predictionId,
          stake_amount: amount
        });

      if (error) {
        return { success: false, error: new EconomyError(`예측 스테이킹 실패: ${error.message}`) };
      }

      const transaction: TransactionResult = {
        id: data.transaction_id as TransactionId,
        fromUserId: userId,
        toUserId: 'PREDICTION_POOL' as UserId, // 예측 풀
        amount,
        type: 'PmpAmount',
        status: 'completed',
        createdAt: new Date()
      };

      return { success: true, data: transaction };
    } catch (error) {
      return { 
        success: false, 
        error: new EconomyError(error instanceof Error ? error.message : '예측 스테이킹 중 오류가 발생했습니다.') 
      };
    }
  }

  // 🎯 정답 예측 PmcAmount 보상
  async rewardPmcAmountForCorrectPrediction(userId: UserId, predictionId: string, amount: PmcAmount): Promise<Result<TransactionResult, EconomyError>> {
    try {
      const { data, error } = await this.supabase.rpc('reward_pmc_for_prediction', {
        user_id: userId,
        prediction_id: predictionId,
        reward_amount: amount
      });

      if (error) {
        return { success: false, error: new EconomyError(`예측 보상 지급 실패: ${error.message}`) };
      }

      const transaction: TransactionResult = {
        id: data.transaction_id as TransactionId,
        fromUserId: 'PREDICTION_REWARD' as UserId, // 예측 보상 풀
        toUserId: userId,
        amount,
        type: 'PmcAmount',
        status: 'completed',
        createdAt: new Date()
      };

      return { success: true, data: transaction };
    } catch (error) {
      return { 
        success: false, 
        error: new EconomyError(error instanceof Error ? error.message : '예측 보상 지급 중 오류가 발생했습니다.') 
      };
    }
  }

  // 🔄 크로스 앱 경제 데이터 동기화
  async syncEconomicDataAcrossApps(userId: UserId): Promise<Result<EconomicBalance, EconomyError>> {
    try {
      // 최신 잔액 조회하여 모든 앱에서 동일한 데이터 보장
      const balanceResult = await this.getCombinedBalance(userId);
      
      if (!balanceResult.success) {
        return balanceResult;
      }

      // 크로스 앱 동기화를 위한 캐시 업데이트
      if (typeof globalThis !== 'undefined' && typeof globalThis.localStorage !== 'undefined') {
        globalThis.localStorage.setItem(`posmul-balance-${userId}`, JSON.stringify({
          balance: balanceResult.data,
          synchronized_at: new Date().toISOString(),
        }));
      }

      return balanceResult;
    } catch (error) {
      return { 
        success: false, 
        error: new EconomyError(error instanceof Error ? error.message : '경제 데이터 동기화 중 오류가 발생했습니다.') 
      };
    }
  }

  // 🎓 스터디 완료 보상 (StudyCycle 연동)
  async awardStudyReward(userId: UserId, studyMinutes: number): Promise<Result<TransactionResult, EconomyError>> {
    try {
      // 스터디 시간에 따른 PmpAmount 보상 계산 (1분당 1 PmpAmount)
      const rewardAmount = Math.floor(studyMinutes) as PmpAmount;

      const { data, error } = await this.supabase.rpc('award_study_reward', {
        user_id: userId,
        study_minutes: studyMinutes,
        reward_amount: rewardAmount
      });

      if (error) {
        return { success: false, error: new EconomyError(`스터디 보상 지급 실패: ${error.message}`) };
      }

      const transaction: TransactionResult = {
        id: data.transaction_id as TransactionId,
        fromUserId: 'STUDY_REWARD' as UserId, // 스터디 보상 풀
        toUserId: userId,
        amount: rewardAmount,
        type: 'PmpAmount',
        status: 'completed',
        createdAt: new Date()
      };

      return { success: true, data: transaction };
    } catch (error) {
      return { 
        success: false, 
        error: new EconomyError(error instanceof Error ? error.message : '스터디 보상 지급 중 오류가 발생했습니다.') 
      };
    }
  }

  // Supabase 클라이언트 직접 접근 (고급 기능용)
  getSupabaseClient(): SupabaseClient {
    return this.supabase;
  }
}
