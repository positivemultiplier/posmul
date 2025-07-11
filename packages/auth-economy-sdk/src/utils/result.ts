/**
 * 함수형 프로그래밍 Result 타입
 * Railway Programming 패턴 구현
 */

export type Result<T, E = Error> =
  | { success: true; data: T }
  | { success: false; error: E };

export const isSuccess = <T, E>(
  result: Result<T, E>
): result is { success: true; data: T } => result.success;

export const isFailure = <T, E>(
  result: Result<T, E>
): result is { success: false; error: E } => !result.success;

export const ok = <T>(data: T): Result<T, never> => ({ success: true, data });

export const err = <E>(error: E): Result<never, E> => ({
  success: false,
  error,
});

// 함수형 프로그래밍 유틸리티들
export const map = <T, U, E>(
  result: Result<T, E>,
  fn: (data: T) => U
): Result<U, E> => {
  return isSuccess(result) ? ok(fn(result.data)) : result;
};

export const flatMap = <T, U, E>(
  result: Result<T, E>,
  fn: (data: T) => Result<U, E>
): Result<U, E> => {
  return isSuccess(result) ? fn(result.data) : result;
};

export const unwrap = <T, E>(result: Result<T, E>): T => {
  if (isFailure(result)) {
    throw result.error;
  }
  return result.data;
};

export const unwrapOr = <T, E>(result: Result<T, E>, defaultValue: T): T => {
  return isSuccess(result) ? result.data : defaultValue;
};

// 추가적인 유틸리티 함수들
export const unwrapOrElse = <T, E>(
  result: Result<T, E>,
  fn: (error: E) => T
): T => {
  return isSuccess(result) ? result.data : fn(result.error);
};

export const mapError = <T, E, F>(
  result: Result<T, E>,
  fn: (error: E) => F
): Result<T, F> => {
  return isFailure(result) ? err(fn(result.error)) : result;
};

// Promise와의 결합을 위한 유틸리티
export const fromPromise = async <T>(
  promise: Promise<T>
): Promise<Result<T, Error>> => {
  try {
    const data = await promise;
    return ok(data);
  } catch (error) {
    return err(error instanceof Error ? error : new Error(String(error)));
  }
};

export const toPromise = <T, E>(result: Result<T, E>): Promise<T> => {
  return isSuccess(result)
    ? Promise.resolve(result.data)
    : Promise.reject(result.error);
};
