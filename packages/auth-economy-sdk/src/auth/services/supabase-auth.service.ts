/**
 * Supabase 기반 인증 서비스 구현
 */

import { createClient, SupabaseClient, User as SupabaseUser } from '@supabase/supabase-js';
import { AuthService, AuthResult, User, UserId, Email, AuthError } from '../types';
import { Result } from '../../types';

export class SupabaseAuthService implements AuthService {
  private supabase: SupabaseClient;

  constructor(url: string, anonKey: string) {
    this.supabase = createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storage: typeof globalThis !== 'undefined' && typeof globalThis.localStorage !== 'undefined' ? globalThis.localStorage : undefined,
      },
    });
  }

  // 🔐 회원가입 + 경제 데이터 초기화
  async signUp(email: Email, password: string, displayName?: string): Promise<Result<AuthResult, AuthError>> {
    try {
      const { data, error } = await this.supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: displayName,
          },
        },
      });

      if (error) {
        return { success: false, error: new AuthError(error.message) };
      }

      if (!data.user || !data.session) {
        return { success: false, error: new AuthError('회원가입에 실패했습니다.') };
      }

      // 경제 데이터 초기화
      await this.initializeEconomyData(data.user.id as UserId);

      const user = this.mapSupabaseUserToUser(data.user);
      const authResult: AuthResult = {
        user,
        session: {
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
          expires_at: data.session.expires_at || 0,
        },
      };

      return { success: true, data: authResult };
    } catch (error) {
      return { 
        success: false, 
        error: new AuthError(error instanceof Error ? error.message : '회원가입 중 오류가 발생했습니다.') 
      };
    }
  }

  // 🔐 로그인
  async signIn(email: Email, password: string): Promise<Result<AuthResult, AuthError>> {
    try {
      const { data, error } = await this.supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { success: false, error: new AuthError(error.message) };
      }

      if (!data.user || !data.session) {
        return { success: false, error: new AuthError('로그인에 실패했습니다.') };
      }

      const user = this.mapSupabaseUserToUser(data.user);
      const authResult: AuthResult = {
        user,
        session: {
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
          expires_at: data.session.expires_at || 0,
        },
      };

      return { success: true, data: authResult };
    } catch (error) {
      return { 
        success: false, 
        error: new AuthError(error instanceof Error ? error.message : '로그인 중 오류가 발생했습니다.') 
      };
    }
  }

  // 🔐 로그아웃
  async signOut(): Promise<Result<void, AuthError>> {
    try {
      const { error } = await this.supabase.auth.signOut();
      
      if (error) {
        return { success: false, error: new AuthError(error.message) };
      }

      return { success: true, data: undefined };
    } catch (error) {
      return { 
        success: false, 
        error: new AuthError(error instanceof Error ? error.message : '로그아웃 중 오류가 발생했습니다.') 
      };
    }
  }

  // 👤 현재 사용자 조회
  async getCurrentUser(): Promise<Result<User | null, AuthError>> {
    try {
      const { data: { user }, error } = await this.supabase.auth.getUser();

      if (error) {
        return { success: false, error: new AuthError(error.message) };
      }

      if (!user) {
        return { success: true, data: null };
      }

      const mappedUser = this.mapSupabaseUserToUser(user);
      return { success: true, data: mappedUser };
    } catch (error) {
      return { 
        success: false, 
        error: new AuthError(error instanceof Error ? error.message : '사용자 정보 조회 중 오류가 발생했습니다.') 
      };
    }
  }

  // 👤 프로필 업데이트
  async updateProfile(updates: Partial<User>): Promise<Result<User, AuthError>> {
    try {
      const { data, error } = await this.supabase.auth.updateUser({
        data: {
          display_name: updates.displayName,
        },
      });

      if (error) {
        return { success: false, error: new AuthError(error.message) };
      }

      if (!data.user) {
        return { success: false, error: new AuthError('프로필 업데이트에 실패했습니다.') };
      }

      const updatedUser = this.mapSupabaseUserToUser(data.user);
      return { success: true, data: updatedUser };
    } catch (error) {
      return { 
        success: false, 
        error: new AuthError(error instanceof Error ? error.message : '프로필 업데이트 중 오류가 발생했습니다.') 
      };
    }
  }

  // 🔄 세션 갱신
  async refreshSession(): Promise<Result<AuthResult, AuthError>> {
    try {
      const { data, error } = await this.supabase.auth.refreshSession();

      if (error) {
        return { success: false, error: new AuthError(error.message) };
      }

      if (!data.session || !data.user) {
        return { success: false, error: new AuthError('세션 갱신에 실패했습니다.') };
      }

      const user = this.mapSupabaseUserToUser(data.user);
      const authResult: AuthResult = {
        user,
        session: {
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
          expires_at: data.session.expires_at || 0,
        },
      };

      return { success: true, data: authResult };
    } catch (error) {
      return { 
        success: false, 
        error: new AuthError(error instanceof Error ? error.message : '세션 갱신 중 오류가 발생했습니다.') 
      };
    }
  }

  // 🌐 크로스 앱 세션 동기화
  async syncSessionAcrossApps(): Promise<Result<void, AuthError>> {
    try {
      // 현재 세션을 localStorage에 저장하여 다른 앱에서 접근 가능하게 함
      const { data: { session } } = await this.supabase.auth.getSession();
      
      if (session && typeof globalThis !== 'undefined' && typeof globalThis.localStorage !== 'undefined') {
        // 크로스 앱 세션 동기화를 위한 특별한 키에 저장
        globalThis.localStorage.setItem('posmul-cross-app-session', JSON.stringify({
          access_token: session.access_token,
          refresh_token: session.refresh_token,
          expires_at: session.expires_at,
          user_id: session.user.id,
          synchronized_at: new Date().toISOString(),
        }));
      }

      return { success: true, data: undefined };
    } catch (error) {
      return { 
        success: false, 
        error: new AuthError(error instanceof Error ? error.message : '세션 동기화 중 오류가 발생했습니다.') 
      };
    }
  }

  // 🌐 유니버설 사용자 ID 조회
  async getUniversalUserId(): Promise<Result<UserId | null, AuthError>> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser();
      
      if (!user) {
        return { success: true, data: null };
      }

      return { success: true, data: user.id as UserId };
    } catch (error) {
      return { 
        success: false, 
        error: new AuthError(error instanceof Error ? error.message : '사용자 ID 조회 중 오류가 발생했습니다.') 
      };
    }
  }

  // === 내부 유틸리티 메서드 ===

  private mapSupabaseUserToUser(supabaseUser: SupabaseUser): User {
    return {
      id: supabaseUser.id as UserId,
      email: supabaseUser.email as Email,
      displayName: supabaseUser.user_metadata?.display_name,
      avatarUrl: supabaseUser.user_metadata?.avatar_url,
      createdAt: new Date(supabaseUser.created_at),
      lastActiveAt: new Date(supabaseUser.last_sign_in_at || supabaseUser.created_at),
    };
  }

  // 경제 데이터 초기화 (회원가입시)
  private async initializeEconomyData(userId: UserId): Promise<void> {
    try {
      // user_profiles 테이블에 초기 경제 데이터 생성
      const { error } = await this.supabase
        .from('user_profiles')
        .insert({
          id: userId,
          pmp_balance: 1000, // 웰컴 보너스
          pmc_balance: 100,  // 웰컴 보너스
        });

      if (error && error.code !== '23505') { // 이미 존재하는 경우 무시
        console.warn('경제 데이터 초기화 실패:', error);
      }
    } catch (error) {
      console.warn('경제 데이터 초기화 중 오류:', error);
    }
  }

  // Supabase 클라이언트 직접 접근 (고급 기능용)
  getSupabaseClient(): SupabaseClient {
    return this.supabase;
  }
}
