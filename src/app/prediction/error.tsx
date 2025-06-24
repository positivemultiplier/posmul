"use client";

import { BaseErrorUI } from "@/shared/components/error";
import {
  AuthenticationError,
  BusinessLogicError,
  NetworkError,
} from "@/shared/utils/errors";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

interface PredictionErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * 예측 게임 페이지 에러 처리 컴포넌트
 */
export default function PredictionError({
  error,
  reset,
}: PredictionErrorProps) {
  const router = useRouter();

  // 예측 게임 특화 에러 변환
  const enhancedError = (() => {
    const message = error.message.toLowerCase();

    if (
      message.includes("unauthorized") ||
      message.includes("authentication")
    ) {
      return new AuthenticationError(
        "예측 게임 참여를 위해 로그인이 필요합니다."
      );
    }

    if (message.includes("insufficient") || message.includes("balance")) {
      return new BusinessLogicError(
        "PMP 잔액이 부족합니다. 경제 활동을 통해 포인트를 충전해주세요.",
        "INSUFFICIENT_BALANCE"
      );
    }

    if (message.includes("game") || message.includes("prediction")) {
      return new BusinessLogicError(
        "예측 게임 데이터를 불러오는 중 오류가 발생했습니다.",
        "GAME_DATA_ERROR"
      );
    }

    if (message.includes("network") || message.includes("connection")) {
      return new NetworkError(
        "네트워크 연결에 문제가 있습니다. 인터넷 연결을 확인하고 다시 시도해주세요."
      );
    }

    return new BusinessLogicError(
      error.message || "예측 게임 로딩 중 오류가 발생했습니다."
    );
  })();

  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      console.error("Prediction page error:", error);
    }
  }, [error]);

  const handleGoHome = () => {
    router.push("/");
  };

  const handleGoBack = () => {
    router.push("/prediction");
  };

  const handleRetry = () => {
    reset();
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
          enhancedError.code === "INSUFFICIENT_BALANCE"
            ? [
                {
                  label: "포인트 충전하기",
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
