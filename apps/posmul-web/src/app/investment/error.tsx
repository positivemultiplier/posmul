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

    // 투자 관련 특수 에러들
    if (
      message.includes("insufficient") ||
      message.includes("balance") ||
      message.includes("pmp")
    ) {
      return new InsufficientPointsError(
        0, // currentPoints - 실제 값은 서버에서 받아야 함
        100, // requiredPoints - 실제 값은 서버에서 받아야 함
        "PMP 포인트가 부족합니다. 포럼 활동이나 예측 게임으로 PMP를 획득하세요."
      );
    }

    if (
      message.includes("limit") ||
      message.includes("exceed") ||
      message.includes("maximum")
    ) {
      return new ValidationError(
        "투자 한도를 초과했습니다. 투자 금액을 조정하고 다시 시도해주세요.",
        "investment_limit"
      );
    }

    if (
      message.includes("closed") ||
      message.includes("deadline") ||
      message.includes("expired")
    ) {
      return new BusinessLogicError(
        "투자 모집이 종료되었습니다. 다른 진행 중인 투자 기회를 확인해보세요.",
        "INVESTMENT_CLOSED"
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

    if (message.includes("validation") || message.includes("invalid")) {
      return new ValidationError(
        "입력하신 투자 정보가 올바르지 않습니다.",
        "validation_error"
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
                  label: "PMP 획득하기",
                  action: () => router.push("/forum"),
                  variant: "outline" as const,
                },
              ]
            : []),
          ...(enhancedError instanceof ValidationError &&
          enhancedError.field === "investment_limit"
            ? [
                {
                  label: "투자 가이드 보기",
                  action: () => router.push("/docs/investment-guide"),
                  variant: "outline" as const,
                },
              ]
            : []),
        ]}
      />
    </div>
  );
}
