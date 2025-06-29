"use client";

import { BaseErrorUI } from "@posmul/shared-ui";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import {
  AuthenticationError,
  BusinessLogicError,
  ExternalServiceError,
  NetworkError,
} from "./";

interface DashboardErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * 대시보드 페이지 에러 처리 컴포넌트
 *
 * BaseErrorUI를 활용하여 대시보드 특화 에러 처리를 제공합니다.
 */
export default function DashboardError({ error, reset }: DashboardErrorProps) {
  const router = useRouter();

  // 대시보드 특화 에러 변환
  const enhancedError = (() => {
    const message = error.message.toLowerCase();

    // 대시보드 관련 특수 에러들
    if (
      message.includes("unauthorized") ||
      message.includes("authentication")
    ) {
      return new AuthenticationError(
        "대시보드 접근을 위해 로그인이 필요합니다."
      );
    }

    if (
      message.includes("chart") ||
      message.includes("data visualization") ||
      message.includes("graph")
    ) {
      return new BusinessLogicError(
        "차트 데이터를 불러오는 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
        "CHART_DATA_ERROR"
      );
    }

    if (
      message.includes("economic") ||
      message.includes("pmp") ||
      message.includes("pmc") ||
      message.includes("balance")
    ) {
      return new BusinessLogicError(
        "경제 데이터를 불러오는 중 오류가 발생했습니다. 포인트 정보 갱신에 시간이 걸릴 수 있습니다.",
        "ECONOMIC_DATA_ERROR"
      );
    }

    if (
      message.includes("api") ||
      message.includes("external") ||
      message.includes("service")
    ) {
      return new ExternalServiceError(
        "dashboard",
        "외부 데이터 연동 중 오류가 발생했습니다. 일부 정보가 지연될 수 있습니다."
      );
    }

    if (message.includes("permission") || message.includes("access")) {
      return new BusinessLogicError(
        "일부 대시보드 기능에 대한 접근 권한이 없습니다.",
        "ACCESS_RESTRICTED"
      );
    }

    if (message.includes("network") || message.includes("connection")) {
      return new NetworkError(
        "네트워크 연결에 문제가 있습니다. 인터넷 연결을 확인하고 다시 시도해주세요."
      );
    }

    // 기본적으로 비즈니스 로직 에러로 처리
    return new BusinessLogicError(
      error.message || "대시보드 로딩 중 오류가 발생했습니다."
    );
  })();

  // 에러 로깅
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      console.error("Dashboard page error:", error);
    }
  }, [error]);

  const handleGoHome = () => {
    router.push("/");
  };

  const handleGoBack = () => {
    router.refresh();
  };

  const handleRetry = () => {
    if (enhancedError instanceof NetworkError) {
      setTimeout(() => {
        reset();
      }, 1000);
    } else {
      reset();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <BaseErrorUI
        error={enhancedError}
        onRetry={handleRetry}
        onGoHome={handleGoHome}
        onGoBack={handleGoBack}
        showDetails={process.env.NODE_ENV === "development"}
        className="max-w-lg"
        customActions={[
          ...(enhancedError instanceof AuthenticationError
            ? [
                {
                  label: "로그인하기",
                  action: () => router.push("/auth/login"),
                  variant: "primary" as const,
                },
              ]
            : []),
          ...(enhancedError instanceof BusinessLogicError &&
          enhancedError.code === "ECONOMIC_DATA_ERROR"
            ? [
                {
                  label: "경제 활동 하기",
                  action: () => router.push("/investment"),
                  variant: "outline" as const,
                },
              ]
            : []),
        ]}
      />
    </div>
  );
}
