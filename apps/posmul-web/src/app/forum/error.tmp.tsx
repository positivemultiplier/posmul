"use client";

import { BaseErrorUI } from "@/shared/components/error";
import {
  AuthenticationError,
  BusinessLogicError,
  ForbiddenError,
  NetworkError,
  ValidationError,
} from "@/shared/utils/errors";
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

    // 포럼 관련 특수 에러들
    if (message.includes("unauthorized") || message.includes("login")) {
      return new AuthenticationError("포럼 참여를 위해 로그인이 필요합니다.");
    }

    if (
      message.includes("forbidden") ||
      message.includes("permission") ||
      message.includes("banned")
    ) {
      return new ForbiddenError(
        "포럼 참여 권한이 없습니다. 커뮤니티 가이드라인을 확인해주세요."
      );
    }

    if (
      message.includes("spam") ||
      message.includes("rate limit") ||
      message.includes("too many")
    ) {
      return new ValidationError(
        "너무 빈번한 게시물 작성입니다. 잠시 후 다시 시도해주세요.",
        "rate_limit"
      );
    }

    if (
      message.includes("content") ||
      message.includes("inappropriate") ||
      message.includes("blocked")
    ) {
      return new ValidationError(
        "부적절한 내용이 포함되어 있습니다. 내용을 수정하고 다시 시도해주세요.",
        "content_validation"
      );
    }

    if (
      message.includes("session") ||
      message.includes("expired") ||
      message.includes("closed")
    ) {
      return new BusinessLogicError(
        "토론 세션이 종료되었습니다. 새로운 세션에 참여해보세요.",
        "SESSION_EXPIRED"
      );
    }

    if (message.includes("validation") || message.includes("invalid")) {
      return new ValidationError(
        "입력하신 내용이 올바르지 않습니다. 다시 확인해주세요."
      );
    }

    if (message.includes("network") || message.includes("connection")) {
      return new NetworkError(
        "네트워크 연결에 문제가 있습니다. 인터넷 연결을 확인하고 다시 시도해주세요."
      );
    }

    // 기본적으로 비즈니스 로직 에러로 처리
    return new BusinessLogicError(
      error.message || "포럼 기능 처리 중 오류가 발생했습니다."
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
          ...(enhancedError instanceof AuthenticationError
            ? [
                {
                  label: "로그인하기",
                  action: () => router.push("/auth/login"),
                  variant: "primary" as const,
                },
              ]
            : []),
          ...(enhancedError instanceof ForbiddenError
            ? [
                {
                  label: "가이드라인 보기",
                  action: () => router.push("/forum/guidelines"),
                  variant: "outline" as const,
                },
              ]
            : []),
          ...(enhancedError instanceof ValidationError &&
          enhancedError.field === "content_validation"
            ? [
                {
                  label: "작성 가이드",
                  action: () => router.push("/forum/writing-guide"),
                  variant: "outline" as const,
                },
              ]
            : []),
        ]}
      />
    </div>
  );
}
