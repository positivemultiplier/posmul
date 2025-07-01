"use client";

import {
  AuthenticationError,
  BusinessLogicError,
  InsufficientPointsError,
  NetworkError,
  ValidationError,
} from "@posmul/shared-types";
import { BaseErrorUI } from "@posmul/shared-ui";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

interface InvestmentErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * 투자 페이지 에러 처리 컴포넌트
 *
 * BaseErrorUI를 활용하여 투자 특화 에러 처리를 제공합니다.
 */
export default function InvestmentError({
  error,
  reset,
}: InvestmentErrorProps) {
  const router = useRouter();

  // 투자 특화 에러 변환
  const enhancedError = (() => {
    const message = error.message.toLowerCase();

    // 투자 관련 에러들
    if (
      message.includes("insufficient") ||
      message.includes("balance") ||
      message.includes("pmp") ||
      message.includes("pmc")
    ) {
      return new InsufficientPointsError(
        0, // currentPoints - 실제 값은 서버에서 받아야 함
        100, // requiredPoints - 실제 값은 서버에서 받아야 함
        "투자에 필요한 포인트가 부족합니다. 예측 게임이나 다른 활동으로 포인트를 획득하세요."
      );
    }

    if (
      message.includes("unauthorized") ||
      message.includes("authentication")
    ) {
      return new AuthenticationError(
        "투자 기능을 이용하려면 로그인이 필요합니다."
      );
    }

    if (
      message.includes("amount") ||
      message.includes("limit") ||
      message.includes("minimum") ||
      message.includes("maximum")
    ) {
      return new ValidationError(
        "투자 금액이 유효하지 않습니다. 최소/최대 투자 금액을 확인해주세요.",
        "investment_amount"
      );
    }

    if (
      message.includes("closed") ||
      message.includes("ended") ||
      message.includes("deadline")
    ) {
      return new BusinessLogicError(
        "투자 모집이 종료되었습니다. 다른 진행 중인 투자에 참여해보세요.",
        "INVESTMENT_CLOSED"
      );
    }

    if (
      message.includes("capacity") ||
      message.includes("full") ||
      message.includes("limit reached")
    ) {
      return new BusinessLogicError(
        "투자 모집 정원이 마감되었습니다. 다른 투자 기회를 찾아보세요.",
        "CAPACITY_FULL"
      );
    }

    if (message.includes("network") || message.includes("connection")) {
      return new NetworkError(
        "네트워크 연결에 문제가 있습니다. 인터넷 연결을 확인하고 다시 시도해주세요."
      );
    }

    // 기본적으로 비즈니스 로직 에러로 처리
    return new BusinessLogicError(
      error.message || "투자 처리 중 오류가 발생했습니다."
    );
  })();

  // 에러 로깅
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      console.error("Investment page error:", error);
    }
  }, [error]);

  const handleGoHome = () => {
    router.push("/dashboard");
  };

  const handleGoBack = () => {
    router.push("/investment");
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
          ...(enhancedError instanceof InsufficientPointsError
            ? [
                {
                  label: "포인트 획득하기",
                  action: () => router.push("/prediction"),
                  variant: "outline" as const,
                },
              ]
            : []),
          ...(enhancedError instanceof AuthenticationError
            ? [
                {
                  label: "로그인하기",
                  action: () => router.push("/auth/login"),
                  variant: "outline" as const,
                },
              ]
            : []),
        ]}
      />
    </div>
  );
}
