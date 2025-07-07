/**
 * React Native StudyCycle용 Auth-Economy SDK 훅
 * 
 * PosMul StudyCycle 앱에서 인증과 학습 보상 시스템을 통합하여 제공하는 React Hook
 * React Native 환경에 최적화된 SDK 클라이언트 사용
 */

import { useEffect, useState } from 'react';
import { createAuthEconomyClient } from '@posmul/auth-economy-sdk';
import type { User, AuthService, EconomyService, Email, UserId } from '@posmul/auth-economy-sdk';
import { Environment, validateEnvironment, logEnvironmentInfo } from '../config/environment';

// 유틸리티 함수: 브랜드 타입 변환
function toEmail(email: string): Email {
  return email as Email;
}

function toUserId(id: string): UserId {
  return id as UserId;
}

export interface StudyCycleAuthState {
  user: User | null;
  loading: boolean;
  authService: AuthService;
  economyService: EconomyService;
  // StudyCycle 특화 기능
  pmpBalance: number;
  pmcBalance: number;
  lastEconomicUpdate: Date | null;
  totalStudyMinutes: number; // 전체 학습 시간 (분)
  todayStudyMinutes: number; // 오늘 학습 시간 (분)
}

export interface StudyCycleAuthActions {
  signIn: (email: string, password: string) => Promise<boolean>;
  signUp: (email: string, password: string, displayName?: string) => Promise<boolean>;
  signOut: () => Promise<void>;
  refreshEconomicData: () => Promise<void>;
  // StudyCycle 전용 액션
  completeStudySession: (minutes: number) => Promise<boolean>;
  getTodayStudyStats: () => Promise<{ minutes: number; sessions: number }>;
}

/**
 * StudyCycle 앱용 통합 인증-경제 훅
 * 모바일 최적화: 백그라운드 동기화, 오프라인 대응, 학습 보상 자동화 등
 */
export function useAuthEconomy(): StudyCycleAuthState & StudyCycleAuthActions {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [pmpBalance, setPmpBalance] = useState(0);
  const [pmcBalance, setPmcBalance] = useState(0);
  const [lastEconomicUpdate, setLastEconomicUpdate] = useState<Date | null>(null);
  
  // StudyCycle 전용 상태
  const [totalStudyMinutes, setTotalStudyMinutes] = useState(0);
  const [todayStudyMinutes, setTodayStudyMinutes] = useState(0);

  // 환경 변수 검증
  useEffect(() => {
    if (!validateEnvironment()) {
      console.error('Environment validation failed - some features may not work');
    }
    if (Environment.IS_DEVELOPMENT) {
      logEnvironmentInfo();
    }
  }, []);

  // Auth-Economy SDK 클라이언트 초기화 (React Native 환경)
  const client = createAuthEconomyClient({
    supabaseUrl: Environment.SUPABASE_URL,
    supabaseAnonKey: Environment.SUPABASE_ANON_KEY,
    enableEconomy: true,
    debug: Environment.IS_DEVELOPMENT,
  });

  // 경제 데이터 새로고침 함수
  const refreshEconomicData = async () => {
    if (!user) return;

    try {
      const pmpResult = await client.economy.getPMPBalance(user.id);
      const pmcResult = await client.economy.getPMCBalance(user.id);

      if (pmpResult.success) {
        setPmpBalance(Number(pmpResult.data));
      }
      if (pmcResult.success) {
        setPmcBalance(Number(pmcResult.data));
      }
      
      setLastEconomicUpdate(new Date());
    } catch (error) {
      console.error('Failed to refresh economic data:', error);
    }    };

  // StudyCycle 전용: 학습 세션 완료 처리
  const completeStudySession = async (minutes: number): Promise<boolean> => {
    if (!user || minutes < 1) return false;

    try {
      // TODO: SDK를 통한 실제 보상 지급 구현 예정
      // const rewardResult = await client.economy.awardStudyReward(minutes);
      
      // 임시: 로컬 상태 업데이트
      const reward = minutes * 10; // 분당 10 PMP
      setPmpBalance(prev => prev + reward);
      setTotalStudyMinutes(prev => prev + minutes);
      setTodayStudyMinutes(prev => prev + minutes);
      setLastEconomicUpdate(new Date());
      
      console.log(`StudyCycle: ${minutes}분 학습 완료, ${reward} PMP 보상 지급`);
      return true;
    } catch (error) {
      console.error('Failed to complete study session:', error);
      return false;
    }
  };

  // StudyCycle 전용: 오늘 학습 통계 조회
  const getTodayStudyStats = async (): Promise<{ minutes: number; sessions: number }> => {
    // TODO: 실제 데이터베이스 조회 구현 예정
    return {
      minutes: todayStudyMinutes,
      sessions: Math.ceil(todayStudyMinutes / 25), // 25분 단위 세션으로 가정
    };
  };

  // 인증 상태 및 경제 데이터 초기화
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setLoading(true);
        
        // 현재 사용자 확인
        const userResult = await client.auth.getCurrentUser();
        if (userResult.success && userResult.data) {
          setUser(userResult.data);
          
          // 사용자가 있으면 경제 데이터도 로드
          globalThis.setTimeout(refreshEconomicData, 100); // 비동기 로딩
        }
      } catch (error) {
        console.error('Auth initialization failed:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // 로그인 함수
  const signIn = async (email: string, password: string): Promise<boolean> => {
    try {
      setLoading(true);
      const result = await client.auth.signIn(toEmail(email), password);
      
      if (result.success) {
        setUser(result.data.user);
        await refreshEconomicData();
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Sign in failed:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // 회원가입 함수
  const signUp = async (email: string, password: string, displayName?: string): Promise<boolean> => {
    try {
      setLoading(true);
      const result = await client.auth.signUp(toEmail(email), password, displayName);
      
      if (result.success) {
        setUser(result.data.user);
        // 회원가입시 초기 경제 계정 생성됨
        await refreshEconomicData();
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Sign up failed:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // 로그아웃 함수
  const signOut = async (): Promise<void> => {
    try {
      await client.auth.signOut();
      setUser(null);
      setPmpBalance(0);
      setPmcBalance(0);
      setLastEconomicUpdate(null);
    } catch (error) {
      console.error('Sign out failed:', error);
    }
  };

  return {
    // 상태
    user,
    loading,
    authService: client.auth,
    economyService: client.economy,
    pmpBalance,
    pmcBalance,
    lastEconomicUpdate,
    // StudyCycle 전용 상태
    totalStudyMinutes,
    todayStudyMinutes,
    
    // 액션
    signIn,
    signUp,
    signOut,
    refreshEconomicData,
    // StudyCycle 전용 액션
    completeStudySession,
    getTodayStudyStats,
  };
}

/**
 * 간단한 Android 경제 데이터 훅 (인증이 이미 된 상태에서 사용)
 */
export function useEconomicBalance(userId?: string) {
  const [pmpBalance, setPmpBalance] = useState(0);
  const [pmcBalance, setPmcBalance] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    const loadBalance = async () => {
      try {
        const client = createAuthEconomyClient({
          supabaseUrl: Environment.SUPABASE_URL,
          supabaseAnonKey: Environment.SUPABASE_ANON_KEY,
          enableEconomy: true,
        });

        const [pmpResult, pmcResult] = await Promise.all([
          client.economy.getPMPBalance(toUserId(userId)),
          client.economy.getPMCBalance(toUserId(userId)),
        ]);

        if (pmpResult.success) setPmpBalance(Number(pmpResult.data));
        if (pmcResult.success) setPmcBalance(Number(pmcResult.data));
      } catch (error) {
        console.error('Failed to load balance:', error);
      } finally {
        setLoading(false);
      }
    };

    loadBalance();
  }, [userId]);

  return { pmpBalance, pmcBalance, loading };
}
