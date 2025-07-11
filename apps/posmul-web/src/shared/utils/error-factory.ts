/**
 * Error Factory Utility
 *
 * Error 객체를 올바르게 생성하는 유틸리티 함수들
 */

/**
 * Error 객체를 올바르게 생성합니다 (name 속성 포함)
 */
export function createError(message: string, name: string = "Error"): Error {
  const error = new Error(message);
  error.name = name;
  return error;
}

/**
 * Error 유사 객체를 올바른 Error 객체로 변환합니다
 */
export function createErrorLike(
  message: string,
  name: string = "Error"
): Error {
  const error = new Error(message);
  error.name = name;
  return error;
}

/**
 * 기존 error 객체나 string에서 올바른 Error 객체 생성
 */
export function normalizeError(
  error: unknown,
  defaultName: string = "Error"
): Error {
  if (error instanceof Error) {
    return error;
  }

  const message = typeof error === "string" ? error : String(error);
  const normalizedError = new Error(message);
  normalizedError.name = defaultName;
  return normalizedError;
}
