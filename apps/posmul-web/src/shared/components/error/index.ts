/**
 * Error Components - 통합 내보내기
 */

export { default as BaseError, BaseErrorUI } from "./BaseErrorUI";

// 편의를 위한 타입 재내보내기
export type { BaseError as BaseErrorType } from "../../utils/errors";
