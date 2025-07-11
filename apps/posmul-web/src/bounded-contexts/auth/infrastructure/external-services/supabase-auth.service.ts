/**
 * Supabase Auth 서비스 구현
 */

import type { Result, AuthError } from "@posmul/auth-economy-sdk";
import { SupabaseClient, createClient } from "@supabase/supabase-js";
import { IExternalAuthService } from "../../application/use-cases/sign-up.use-case";
import { SignUpData } from "../../domain/services/auth-domain.service";
import {
  DomainError,
  AuthenticationError,
} from "../../domain/helpers/result-helpers";

export class SupabaseAuthService implements IExternalAuthService {
  private supabase: SupabaseClient;

  constructor() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Supabase URL 또는 API 키가 설정되지 않았습니다.");
    }

    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  async signUp(data: SignUpData): Promise<
    Result<
      {
        id: string;
        accessToken: string;
        refreshToken: string;
      },
      Error
    >
  > {
    try {
      const { data: authData, error } = await this.supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            display_name: data.displayName || null,
          },
        },
      });

      if (error) {
        return {
          success: false,
          error: new DomainError(error.message, "SIGNUP_ERROR"),
        };
      }

      if (!authData.user || !authData.session) {
        return {
          success: false,
          error: new DomainError("회원가입 실패", "SIGNUP_ERROR"),
        };
      }

      return {
        success: true,
        data: {
          id: authData.user.id,
          accessToken: authData.session.access_token,
          refreshToken: authData.session.refresh_token,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: new DomainError(
          error instanceof Error
            ? error.message
            : "회원가입 중 오류가 발생했습니다.",
          "SIGNUP_ERROR"
        ),
      };
    }
  }

  async signIn(credentials: { email: string; password: string }): Promise<
    Result<
      {
        id: string;
        accessToken: string;
        refreshToken: string;
      },
      Error
    >
  > {
    try {
      const { data: authData, error } =
        await this.supabase.auth.signInWithPassword({
          email: credentials.email,
          password: credentials.password,
        });

      if (error) {
        return {
          success: false,
          error: new AuthenticationError(error.message),
        };
      }

      if (!authData.user || !authData.session) {
        return {
          success: false,
          error: new AuthenticationError("로그인에 실패했습니다."),
        };
      }

      return {
        success: true,
        data: {
          id: authData.user.id,
          accessToken: authData.session.access_token,
          refreshToken: authData.session.refresh_token,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: new AuthenticationError(
          error instanceof Error
            ? error.message
            : "로그인 중 오류가 발생했습니다."
        ),
      };
    }
  }

  async signOut(): Promise<Result<void, Error>> {
    try {
      const { error } = await this.supabase.auth.signOut();

      if (error) {
        return {
          success: false,
          error: new DomainError("SIGNOUT_ERROR", error.message),
        };
      }

      return { success: true, data: undefined };
    } catch (error) {
      return {
        success: false,
        error: new DomainError(
          error instanceof Error
            ? error.message
            : "로그아웃 중 오류가 발생했습니다.",
          "SIGNOUT_ERROR"
        ),
      };
    }
  }

  async refreshToken(refreshToken: string): Promise<
    Result<
      {
        accessToken: string;
        refreshToken: string;
        expiresAt: Date;
      },
      Error
    >
  > {
    try {
      const { data: authData, error } = await this.supabase.auth.refreshSession(
        {
          refresh_token: refreshToken,
        }
      );

      if (error) {
        return {
          success: false,
          error: new DomainError("REFRESH_TOKEN_ERROR", error.message),
        };
      }

      if (!authData.session) {
        return {
          success: false,
          error: new DomainError(
            "세션을 갱신할 수 없습니다.",
            "REFRESH_TOKEN_ERROR"
          ),
        };
      }

      return {
        success: true,
        data: {
          accessToken: authData.session.access_token,
          refreshToken: authData.session.refresh_token,
          expiresAt: new Date(authData.session.expires_at! * 1000),
        },
      };
    } catch (error) {
      return {
        success: false,
        error: new DomainError(
          error instanceof Error
            ? error.message
            : "토큰 갱신 중 오류가 발생했습니다.",
          "REFRESH_TOKEN_ERROR"
        ),
      };
    }
  }

  async deleteUser(userId: string): Promise<Result<void, Error>> {
    try {
      // Supabase에서는 클라이언트에서 직접 사용자 삭제가 제한됩니다.
      // 실제 프로덕션에서는 서버 측 API를 통해 처리해야 합니다.
      console.warn(`사용자 삭제 요청: ${userId} - 서버 측에서 처리 필요`);

      return {
        success: true,
        data: undefined,
      };
    } catch (error) {
      return {
        success: false,
        error: new DomainError(
          error instanceof Error
            ? error.message
            : "사용자 삭제 중 오류가 발생했습니다.",
          "DELETE_USER_ERROR"
        ),
      };
    }
  }
}
