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

interface ForumErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * 포럼 페이지 에러 처리 컴포넌트
 *
 * BaseErrorUI를 활용하여 포럼 특화 에러 처리를 제공합니다.
 */
export default function ForumError({ error, reset }: ForumErrorProps) {
  const router = useRouter();

  // 포럼 특화 에러 변환
  const enhancedError = (() => {
    const message = error.message.toLowerCase();

    // 포럼 참여 관련 에러들 (PMP 사용)
    if (
      message.includes("insufficient") ||
      message.includes("balance") ||
      message.includes("pmp")
    ) {
      return new InsufficientPointsError(
        0, // currentPoints - 실제 값은 서버에서 받아야 함
        10, // requiredPoints - 토론 참여는 보통 10 PMP
        "PMP 포인트가 부족합니다. 예측 게임으로 PMP를 획득하세요."
      );
    }

    if (
      message.includes("unauthorized") ||
      message.includes("authentication")
    ) {
      return new AuthenticationError(
        "포럼 기능을 이용하려면 로그인이 필요합니다."
      );
    }

    if (
      message.includes("content") ||
      message.includes("inappropriate") ||
      message.includes("spam")
    ) {
      return new ValidationError(
        "부적절한 내용이 포함되어 있습니다. 커뮤니티 가이드라인을 확인해주세요.",
        "forum_content"
      );
    }

    if (
      message.includes("length") ||
      message.includes("minimum") ||
      message.includes("maximum")
    ) {
      return new ValidationError(
        "글 내용의 길이가 적절하지 않습니다. 최소/최대 글자 수를 확인해주세요.",
        "content_length"
      );
    }

    if (
      message.includes("closed") ||
      message.includes("ended") ||
      message.includes("archived")
    ) {
      return new BusinessLogicError(
        "이미 종료되거나 보관된 토론입니다. 다른 활성 토론에 참여해보세요.",
        "DISCUSSION_CLOSED"
      );
    }

    if (
      message.includes("permission") ||
      message.includes("forbidden") ||
      message.includes("access")
    ) {
      return new BusinessLogicError(
        "해당 토론에 참여할 권한이 없습니다. 토론 설정을 확인해주세요.",
        "ACCESS_DENIED"
      );
    }

    if (message.includes("network") || message.includes("connection")) {
      return new NetworkError(
        "네트워크 연결에 문제가 있습니다. 인터넷 연결을 확인하고 다시 시도해주세요."
      );
    }

    // 기본적으로 비즈니스 로직 에러로 처리
    return new BusinessLogicError(
      error.message || "포럼 처리 중 오류가 발생했습니다."
    );
  })();

  // 에러 로깅
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      console.error("Forum page error:", error);
    }
  }, [error]);

  const handleGoHome = () => {
    router.push("/dashboard");
  };

  const handleGoBack = () => {
    router.push("/forum");
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
          ...(enhancedError instanceof ValidationError
            ? [
                {
                  label: "가이드라인 보기",
                  action: () => router.push("/docs/community-guidelines"),
                  variant: "outline" as const,
                },
              ]
            : []),
        ]}
      />
    </div>
  );
}
