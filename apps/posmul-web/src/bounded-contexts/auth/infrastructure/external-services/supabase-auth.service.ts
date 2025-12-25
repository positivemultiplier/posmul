import {
  isFailure,
  type Result,
} from "@posmul/auth-economy-sdk";
import { SupabaseAuthService as SdkAuthService } from "@posmul/auth-economy-sdk/auth"; // SDK Service Import
import {
  SupabaseClient,
  createClient,
} from "@supabase/supabase-js";

import { IExternalAuthService } from "../../application/use-cases/sign-up.use-case";
import {
  AuthenticationError,
  DomainError,
} from "../../domain/helpers/result-helpers";
import { SignUpData } from "../../domain/services/auth-domain.service";

export class SupabaseAuthService implements IExternalAuthService {
  private supabase: SupabaseClient;
  private sdkAuthService: SdkAuthService; // SDK Service Instance

  constructor() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Supabase URL 또는 API 키가 설정되지 않았습니다.");
    }

    this.supabase = createClient(supabaseUrl, supabaseKey);
    // Initialize SDK Service with the Supabase client
    this.sdkAuthService = new SdkAuthService(this.supabase);
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
      // Use SDK for sign up
      const result = await this.sdkAuthService.signUp(
        data.email as any, // Type assertion needed as SDK uses branded types
        data.password,
        data.displayName
      );

      if (isFailure(result)) {
        return {
          success: false,
          error: new DomainError(result.error.message, "SIGNUP_ERROR"),
        };
      }

      return {
        success: true,
        data: {
          id: result.data.user.id,
          accessToken: result.data.session.access_token,
          refreshToken: result.data.session.refresh_token,
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
      // Use SDK for sign in
      const result = await this.sdkAuthService.signIn(
        credentials.email as any,
        credentials.password
      );

      if (isFailure(result)) {
        return {
          success: false,
          error: new AuthenticationError(result.error.message),
        };
      }

      return {
        success: true,
        data: {
          id: result.data.user.id,
          accessToken: result.data.session.access_token,
          refreshToken: result.data.session.refresh_token,
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
      // Use SDK for sign out
      const result = await this.sdkAuthService.signOut();

      if (isFailure(result)) {
        return {
          success: false,
          error: new DomainError("SIGNOUT_ERROR", result.error.message),
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
      // Use SDK for refresh session
      const { data: authData, error } = await this.sdkAuthService
        .getSupabaseClient()
        .auth.refreshSession({
          refresh_token: refreshToken,
        });

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

  async deleteUser(_userId: string): Promise<Result<void, Error>> {
    try {
      // SDK doesn't have deleteUser, keep local stub
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

  async signInWithOAuth(
    provider: "google" | "kakao" | "github"
  ): Promise<Result<void, Error>> {
    try {
      const result = await this.sdkAuthService.signInWithOAuth(provider);

      if (isFailure(result)) {
        return {
          success: false,
          error: new AuthenticationError(result.error.message),
        };
      }

      return { success: true, data: undefined };
    } catch (error) {
      return {
        success: false,
        error: new AuthenticationError(
          error instanceof Error
            ? error.message
            : "소셜 로그인 중 오류가 발생했습니다."
        ),
      };
    }
  }
}
