/**
 * 인프라 계층 에러 정의
 * SDK에 없는 에러 타입들의 로컬 구현
 */

import { NetworkError } from "@posmul/auth-economy-sdk";

/**
 * 외부 서비스 에러
 * Supabase 등 외부 서비스 호출 시 발생하는 에러
 * NetworkError를 확장하여 외부 서비스 관련 정보 추가
 */
export class DomainError extends NetworkError {
  public readonly service: string;
  public readonly originalError?: unknown;

  constructor(
    message: string,
    service: string,
    originalError?: unknown
  ) {
    super(message, { 
      service,
      originalError: originalError instanceof Error ? originalError.message : String(originalError)
    });
    this.service = service;
    this.originalError = originalError;
  }
} 