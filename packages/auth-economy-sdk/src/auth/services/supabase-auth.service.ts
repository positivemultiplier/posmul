/**
 * Supabase 기반 인증 서비스 구현
 */

import {
  SupabaseClient,
  User as SupabaseUser,
} from "@supabase/supabase-js";
import {
  AuthService,
  AuthResult,
  User,
  UserId,
  Email,
  AuthError,
} from "../types";
import { Result } from "../../types";

export class SupabaseAuthService implements AuthService {
  constructor(private supabase: SupabaseClient) { }

  // 🔐 회원가입 + 경제 데이터 초기화
  async signUp(
    email: Email,
    password: string,
    displayName?: string
  ): Promise<Result<AuthResult, AuthError>> {
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
        return { success: false, error: this.mapAuthError(error) };
      }

      if (!data.user || !data.session) {
        return {
          success: false,
          error: new AuthError("회원가입에 실패했습니다."),
        };
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
        error: new AuthError(
          error instanceof Error
            ? error.message
            : "회원가입 중 오류가 발생했습니다."
        ),
      };
    }
  }

  // 🔐 로그인
  async signIn(
    email: Email,
    password: string
  ): Promise<Result<AuthResult, AuthError>> {
    try {
      const { data, error } = await this.supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { success: false, error: this.mapAuthError(error) };
      }

      if (!data.user || !data.session) {
        return {
          success: false,
          error: new AuthError("로그인에 실패했습니다."),
        };
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
        error: new AuthError(
          error instanceof Error
            ? error.message
            : "로그인 중 오류가 발생했습니다."
        ),
      };
    }
  }

  // 🔐 로그아웃
  async signOut(): Promise<Result<void, AuthError>> {
    try {
      const { error } = await this.supabase.auth.signOut();

      if (error) {
        return { success: false, error: this.mapAuthError(error) };
      }

      return { success: true, data: undefined };
    } catch (error) {
      return {
        success: false,
        error: new AuthError(
          error instanceof Error
            ? error.message
            : "로그아웃 중 오류가 발생했습니다."
        ),
      };
    }
  }

  // 👤 현재 사용자 조회
  async getCurrentUser(): Promise<Result<User | null, AuthError>> {
    try {
      const {
        data: { user },
        error,
      } = await this.supabase.auth.getUser();

      if (error) {
        return { success: false, error: this.mapAuthError(error) };
      }

      if (!user) {
        return { success: true, data: null };
      }

      const mappedUser = this.mapSupabaseUserToUser(user);
      return { success: true, data: mappedUser };
    } catch (error) {
      return {
        success: false,
        error: new AuthError(
          error instanceof Error
            ? error.message
            : "사용자 정보 조회 중 오류가 발생했습니다."
        ),
      };
    }
  }

  // 👤 프로필 업데이트
  async updateProfile(
    updates: Partial<User>
  ): Promise<Result<User, AuthError>> {
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
        return {
          success: false,
          error: new AuthError("프로필 업데이트에 실패했습니다."),
        };
      }

      const updatedUser = this.mapSupabaseUserToUser(data.user);
      return { success: true, data: updatedUser };
    } catch (error) {
      return {
        success: false,
        error: new AuthError(
          error instanceof Error
            ? error.message
            : "프로필 업데이트 중 오류가 발생했습니다."
        ),
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
        return {
          success: false,
          error: new AuthError("세션 갱신에 실패했습니다."),
        };
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
        error: new AuthError(
          error instanceof Error
            ? error.message
            : "세션 갱신 중 오류가 발생했습니다."
        ),
      };
    }
  }

  // 🌐 크로스 앱 세션 동기화
  async syncSessionAcrossApps(): Promise<Result<void, AuthError>> {
    try {
      // 현재 세션을 localStorage에 저장하여 다른 앱에서 접근 가능하게 함
      const {
        data: { session },
      } = await this.supabase.auth.getSession();

      if (
        session &&
        typeof globalThis !== "undefined" &&
        typeof globalThis.localStorage !== "undefined"
      ) {
        // 크로스 앱 세션 동기화를 위한 특별한 키에 저장
        globalThis.localStorage.setItem(
          "posmul-cross-app-session",
          JSON.stringify({
            access_token: session.access_token,
            refresh_token: session.refresh_token,
            expires_at: session.expires_at,
            user_id: session.user.id,
            synchronized_at: new Date().toISOString(),
          })
        );
      }

      return { success: true, data: undefined };
    } catch (error) {
      return {
        success: false,
        error: new AuthError(
          error instanceof Error
            ? error.message
            : "세션 동기화 중 오류가 발생했습니다."
        ),
      };
    }
  }

  // 🌐 유니버설 사용자 ID 조회
  async getUniversalUserId(): Promise<Result<UserId | null, AuthError>> {
    try {
      const {
        data: { user },
      } = await this.supabase.auth.getUser();

      if (!user) {
        return { success: true, data: null };
      }

      return { success: true, data: user.id as UserId };
    } catch (error) {
      return {
        success: false,
        error: new AuthError(
          error instanceof Error
            ? error.message
            : "사용자 ID 조회 중 오류가 발생했습니다."
        ),
      };
    }
  }

  // 🔐 소셜 로그인
  async signInWithOAuth(
    provider: "google" | "kakao" | "github",
    redirectTo?: string
  ): Promise<Result<void, AuthError>> {
    try {
      const { error } = await this.supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo,
        },
      });

      if (error) {
        return { success: false, error: this.mapAuthError(error) };
      }

      return { success: true, data: undefined };
    } catch (error) {
      return {
        success: false,
        error: new AuthError(
          error instanceof Error
            ? error.message
            : "소셜 로그인 중 오류가 발생했습니다."
        ),
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
      lastActiveAt: new Date(
        supabaseUser.last_sign_in_at || supabaseUser.created_at
      ),
    };
  }

  // Supabase 에러를 AuthError로 변환
  private mapAuthError(error: {
    message?: string;
    error_description?: string;
  }): AuthError {
    const errorMessage = error.message || "알 수 없는 오류가 발생했습니다.";

    // Supabase 에러 코드에 따른 한국어 메시지 매핑
    switch (error.message || error.error_description) {
      case "User already registered":
        return new AuthError("이미 가입된 이메일입니다.");
      case "Invalid login credentials":
        return new AuthError("이메일 또는 비밀번호가 틀렸습니다.");
      case "Password should be at least 6 characters":
        return new AuthError("비밀번호는 6자 이상이어야 합니다.");
      case "Email not confirmed":
        return new AuthError("이메일 확인이 필요합니다.");
      case "signup disabled":
        return new AuthError("회원가입이 비활성화되어 있습니다.");
      case "too many signup requests":
        return new AuthError(
          "너무 많은 가입 요청이 있었습니다. 잠시 후 다시 시도해주세요."
        );
      default:
        // 네트워크 에러 체크
        if (errorMessage.includes("fetch")) {
          return new AuthError("네트워크 연결을 확인해주세요.");
        }
        return new AuthError(errorMessage);
    }
  }

  // 경제 데이터 초기화 (회원가입시) - 트리거가 처리하므로 제거
  private async initializeEconomyData(_userId: UserId): Promise<void> {
    // DB 트리거(handle_new_user)가 자동으로 처리하므로 추가 작업 불필요
    // 필요시 여기서 추가적인 초기화 로직 수행 가능
  }

  // Supabase 클라이언트 직접 접근 (고급 기능용)
  getSupabaseClient(): SupabaseClient {
    return this.supabase;
  }
}
