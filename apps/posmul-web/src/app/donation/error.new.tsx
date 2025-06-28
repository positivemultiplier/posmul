"use client";

import { BaseErrorUI } from "@/shared/components/error";
import {
  AuthenticationError,
  BusinessLogicError,
  InsufficientPointsError,
  NetworkError,
  ValidationError,
} from "@/shared/utils/errors";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

interface DonationErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * 기부 페이지 에러 처리 컴포넌트
 *
 * BaseErrorUI를 활용하여 기부 특화 에러 처리를 제공합니다.
 */
export default function DonationError({ error, reset }: DonationErrorProps) {
  const router = useRouter();

  // 기부 특화 에러 변환
  const enhancedError = (() => {
    const message = error.message.toLowerCase();

    // 기부 관련 특수 에러들 (PMC 사용)
    if (
      message.includes("insufficient") ||
      message.includes("balance") ||
      message.includes("pmc")
    ) {
      return new InsufficientPointsError(
        0, // currentPoints - 실제 값은 서버에서 받아야 함
        100, // requiredPoints - 실제 값은 서버에서 받아야 함
        "PMC 포인트가 부족합니다. 예측 게임이나 투자로 PMC를 획득하세요."
      );
    }

    if (
      message.includes("unauthorized") ||
      message.includes("authentication")
    ) {
      return new AuthenticationError(
        "기부 기능을 이용하려면 로그인이 필요합니다."
      );
    }

    if (
      message.includes("amount") ||
      message.includes("limit") ||
      message.includes("minimum") ||
      message.includes("maximum")
    ) {
      return new ValidationError(
        "기부 금액이 유효하지 않습니다. 최소/최대 기부 금액을 확인해주세요.",
        "donation_amount"
      );
    }

    if (
      message.includes("recipient") ||
      message.includes("target") ||
      message.includes("invalid")
    ) {
      return new ValidationError(
        "기부 대상이 올바르지 않습니다. 기부 대상을 다시 확인해주세요.",
        "donation_target"
      );
    }

    if (
      message.includes("closed") ||
      message.includes("ended") ||
      message.includes("deadline")
    ) {
      return new BusinessLogicError(
        "기부 모집이 종료되었습니다. 다른 진행 중인 기부에 참여해보세요.",
        "DONATION_CLOSED"
      );
    }

    if (message.includes("money wave") || message.includes("distribution")) {
      return new BusinessLogicError(
        "머니 웨이브 시스템 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
        "MONEY_WAVE_ERROR"
      );
    }

    if (message.includes("network") || message.includes("connection")) {
      return new NetworkError(
        "네트워크 연결에 문제가 있습니다. 인터넷 연결을 확인하고 다시 시도해주세요."
      );
    }

    // 기본적으로 비즈니스 로직 에러로 처리
    return new BusinessLogicError(
      error.message || "기부 처리 중 오류가 발생했습니다."
    );
  })();

  // 에러 로깅
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      console.error("Donation page error:", error);
    }
  }, [error]);

  const handleGoHome = () => {
    router.push("/dashboard");
  };

  const handleGoBack = () => {
    router.push("/donation");
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
                  label: "PMC 획득하기",
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
                  variant: "primary" as const,
                },
              ]
            : []),
          ...(enhancedError instanceof BusinessLogicError &&
          enhancedError.code === "MONEY_WAVE_ERROR"
            ? [
                {
                  label: "머니 웨이브 가이드",
                  action: () => router.push("/docs/money-wave"),
                  variant: "outline" as const,
                },
              ]
            : []),
        ]}
      />
    </div>
  );
}
