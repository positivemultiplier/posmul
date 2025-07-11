/**
 * 인증 상태 관리 훅
 */

"use client";

import { useState, useEffect } from "react";
import { createAuthEconomyClient, isFailure } from "@posmul/auth-economy-sdk";
import type { User as SDKUser } from "@posmul/auth-economy-sdk";
import { User } from "../../domain/entities/user.entity";

// SDK User를 도메인 User 엔티티로 변환하는 유틸리티 함수
const convertSDKUserToDomainUser = (sdkUser: SDKUser): User => {
  // 임시로 기본값들을 사용하여 도메인 객체 생성
  // 실제로는 경제 정보 등을 추가로 조회해야 할 수 있음
  return User.fromDatabase({
    id: sdkUser.id as any, // UserId로 캐스팅
    email: { value: sdkUser.email } as any, // Email value object로 변환
    displayName: sdkUser.displayName,
    role: { value: "citizen" } as any, // 기본 역할로 설정
    pmcBalance: 0, // 기본값
    pmpBalance: 0, // 기본값
    isActive: true,
    createdAt: sdkUser.createdAt,
    updatedAt: sdkUser.lastActiveAt,
  });
};

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
}

interface AuthActions {
  signIn: (credentials: { email: string; password: string }) => Promise<void>;
  signUp: (data: {
    email: string;
    password: string;
    displayName?: string;
  }) => Promise<void>;
  signOut: () => Promise<void>;
  refreshToken: () => Promise<void>;
  clearError: () => void;
}

export function useAuth(): AuthState & AuthActions {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
    error: null,
  });

  const [error, setError] = useState<string | null>(null);

  // Auth-Economy SDK 클라이언트 초기화
  const authClient = createAuthEconomyClient({
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    enableEconomy: true,
    debug: process.env.NODE_ENV === "development",
  });

  // 초기 인증 상태 확인
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const clearError = () => {
    setError(null);
    setAuthState((prev) => ({ ...prev, error: null }));
  };

  const checkAuthStatus = async () => {
    try {
      // SDK를 통한 현재 사용자 확인
      const userResult = await authClient.auth.getCurrentUser();

      if (userResult.success && userResult.data) {
        // SDK User를 도메인 User 엔티티로 변환
        const domainUser = convertSDKUserToDomainUser(userResult.data);

        setAuthState({
          user: domainUser,
          isLoading: false,
          isAuthenticated: true,
          error: null,
        });
      } else {
        setAuthState({
          user: null,
          isLoading: false,
          isAuthenticated: false,
          error: null,
        });
      }
    } catch (error) {
      console.error("Auth status check failed:", error);
      setAuthState({
        user: null,
        isLoading: false,
        isAuthenticated: false,
        error: null,
      });
    }
  };

  const signIn = async (credentials: { email: string; password: string }) => {
    try {
      setError(null);
      setAuthState((prev) => ({ ...prev, isLoading: true, error: null }));

      // SDK를 통한 로그인
      const result = await authClient.auth.signIn(
        credentials.email as any,
        credentials.password
      );

      if (result.success) {
        const domainUser = convertSDKUserToDomainUser(result.data.user);
        setAuthState({
          user: domainUser,
          isLoading: false,
          isAuthenticated: true,
          error: null,
        });
      } else {
        const errorMessage = isFailure(result)
          ? typeof result.error === "string"
            ? result.error
            : result.error?.message || "Unknown error"
          : "로그인에 실패했습니다.";
        throw new Error(errorMessage);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "로그인 중 오류가 발생했습니다.";
      setError(errorMessage);
      setAuthState((prev) => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      throw error;
    }
  };

  const signUp = async (data: {
    email: string;
    password: string;
    displayName?: string;
  }) => {
    try {
      setError(null);
      setAuthState((prev) => ({ ...prev, isLoading: true, error: null }));

      // SDK를 통한 회원가입
      const result = await authClient.auth.signUp(
        data.email as any,
        data.password,
        data.displayName
      );

      if (result.success) {
        const domainUser = convertSDKUserToDomainUser(result.data.user);
        setAuthState({
          user: domainUser,
          isLoading: false,
          isAuthenticated: true,
          error: null,
        });
      } else {
        const errorMessage = isFailure(result)
          ? typeof result.error === "string"
            ? result.error
            : result.error?.message || "Unknown error"
          : "회원가입에 실패했습니다.";
        throw new Error(errorMessage);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "회원가입 중 오류가 발생했습니다.";
      setError(errorMessage);
      setAuthState((prev) => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      throw error;
    }
  };

  const signOut = async () => {
    try {
      setError(null);
      setAuthState((prev) => ({ ...prev, isLoading: true, error: null }));

      // SDK를 통한 로그아웃
      const result = await authClient.auth.signOut();

      if (result.success) {
        setAuthState({
          user: null,
          isLoading: false,
          isAuthenticated: false,
          error: null,
        });
      } else {
        const errorMessage = isFailure(result)
          ? typeof result.error === "string"
            ? result.error
            : result.error?.message || "Unknown error"
          : "로그아웃에 실패했습니다.";
        throw new Error(errorMessage);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "로그아웃 중 오류가 발생했습니다.";
      setError(errorMessage);
      setAuthState((prev) => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      throw error;
    }
  };

  const refreshToken = async () => {
    try {
      // SDK를 통한 토큰 갱신
      const result = await authClient.auth.refreshSession();

      if (result.success) {
        const domainUser = convertSDKUserToDomainUser(result.data.user);
        setAuthState((prev) => ({
          ...prev,
          user: domainUser,
          isAuthenticated: true,
        }));
      } else {
        const errorMessage = isFailure(result)
          ? typeof result.error === "string"
            ? result.error
            : result.error?.message || "Unknown error"
          : "토큰 갱신에 실패했습니다.";
        console.error("Token refresh failed:", errorMessage);
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error("Token refresh failed:", error);
      throw error;
    }
  };

  return {
    ...authState,
    signIn,
    signUp,
    signOut,
    refreshToken,
    clearError,
  };
}
