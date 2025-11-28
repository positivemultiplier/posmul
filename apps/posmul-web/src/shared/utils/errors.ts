import { ValidationError } from "@posmul/auth-economy-sdk";

/**
 * Error Utility Functions
 * 에러 처리 관련 유틸리티 함수들
 */

export * from "../legacy-compatibility";

/**
 * 에러 타입 확인 함수들
 */
export const isValidationError = (error: unknown): error is ValidationError => {
  return error instanceof ValidationError;
};

export const isNetworkError = (error: unknown): boolean => {
  return (
    error instanceof Error &&
    (error.message.includes("fetch") ||
      error.message.includes("network") ||
      error.message.includes("Failed to fetch"))
  );
};

export const isAuthenticationError = (error: unknown): boolean => {
  return (
    error instanceof Error &&
    (error.message.includes("unauthorized") ||
      error.message.includes("401") ||
      error.message.includes("authentication"))
  );
};

export const isForbiddenError = (error: unknown): boolean => {
  return (
    error instanceof Error &&
    (error.message.includes("forbidden") ||
      error.message.includes("403") ||
      error.message.includes("access denied"))
  );
};

/**
 * 에러 메시지 정규화 함수
 */
export const normalizeErrorMessage = (error: unknown): string => {
  if (typeof error === "string") {
    return error;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "알 수 없는 오류가 발생했습니다.";
};

/**
 * 사용자 친화적 에러 메시지 생성
 */
export const getUserFriendlyErrorMessage = (error: unknown): string => {
  const message = normalizeErrorMessage(error);

  if (isValidationError(error)) {
    return "입력하신 정보를 다시 확인해주세요.";
  }

  if (isNetworkError(error)) {
    return "네트워크 연결을 확인해주세요.";
  }

  if (isAuthenticationError(error)) {
    return "로그인이 필요하거나 세션이 만료되었습니다.";
  }

  if (isForbiddenError(error)) {
    return "이 작업을 수행할 권한이 없습니다.";
  }

  // 기본 메시지
  return message || "요청을 처리하는 중 오류가 발생했습니다.";
};
