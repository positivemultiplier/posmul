// Server Actions 통합 인덱스 파일
export * from "./donation-actions";
export * from "./forum-actions";
export * from "./prediction-actions";

// 공통 Server Action 결과 타입
export type ServerActionResult<T = any> = {
  success: boolean;
  message: string;
  data?: T;
  errors?: string[];
};

// 공통 에러 처리 유틸리티
export function createServerActionError(
  message: string,
  errors?: string[]
): ServerActionResult {
  return {
    success: false,
    message,
    errors,
  };
}

export function createServerActionSuccess<T>(
  message: string,
  data?: T
): ServerActionResult<T> {
  return {
    success: true,
    message,
    data,
  };
}
