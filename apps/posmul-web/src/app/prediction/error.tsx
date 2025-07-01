"use client";

import {
  AuthenticationError,
  BusinessLogicError,
  NetworkError,
  ValidationError,
} from "@posmul/shared-types";
import { BaseErrorUI } from "@posmul/shared-ui";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

interface PredictionErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * 예측 게임 페이지 에러 처리 컴포넌트
 *
 * BaseErrorUI를 활용하여 예측 게임 특화 에러 처리를 제공합니다.
 */
export default function PredictionError({
  error,
  reset,
}: PredictionErrorProps) {
  const router = useRouter();

  // 예측 게임 특화 에러 변환
  const enhancedError = (() => {
    const message = error.message.toLowerCase();

    // 예측 게임 관련 에러들
    if (
      message.includes("unauthorized") ||
      message.includes("authentication")
    ) {
      return new AuthenticationError(
        "예측 게임에 참여하려면 로그인이 필요합니다."
      );
    }

    if (
      message.includes("closed") ||
      message.includes("ended") ||
      message.includes("deadline")
    ) {
      return new BusinessLogicError(
        "예측 게임이 종료되었습니다. 다른 진행 중인 게임에 참여해보세요.",
        "GAME_CLOSED"
      );
    }

    if (
      message.includes("full") ||
      message.includes("capacity") ||
      message.includes("limit")
    ) {
      return new BusinessLogicError(
        "예측 게임 참여 인원이 가득 찼습니다. 다른 게임을 찾아보세요.",
        "GAME_FULL"
      );
    }

    if (
      message.includes("prediction") ||
      message.includes("invalid") ||
      message.includes("validation")
    ) {
      return new ValidationError(
        "예측 내용이 올바르지 않습니다. 다시 확인해주세요.",
        "prediction_validation"
      );
    }

    if (message.includes("network") || message.includes("connection")) {
      return new NetworkError(
        "네트워크 연결에 문제가 있습니다. 인터넷 연결을 확인하고 다시 시도해주세요."
      );
    }

    // 기본적으로 비즈니스 로직 에러로 처리
    return new BusinessLogicError(
      error.message || "예측 게임 처리 중 오류가 발생했습니다."
    );
  })();

  // 에러 로깅
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      console.error("Prediction page error:", error);
    }
  }, [error]);

  const handleGoHome = () => {
    router.push("/dashboard");
  };

  const handleGoBack = () => {
    router.push("/prediction");
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
                  variant: "outline" as const,
                },
              ]
            : []),
        ]}
      />
    </div>
  );
}
