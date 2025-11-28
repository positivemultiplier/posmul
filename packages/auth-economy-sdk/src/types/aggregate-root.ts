/**
 * Aggregate Root Base Class
 * DDD (Domain-Driven Design) 패턴에서 사용하는 Aggregate Root 기본 클래스
 */

import { DomainEvent } from "./domain-events";

/**
 * Aggregate Root 기본 클래스
 * 도메인 이벤트를 수집하고 관리하는 역할
 */
export abstract class AggregateRoot {
  private _domainEvents: DomainEvent[] = [];
  protected _version: number = 1;

  /**
   * 도메인 이벤트 추가
   */
  protected addDomainEvent(event: DomainEvent): void {
    this._domainEvents.push(event);
  }

  /**
   * 대기 중인 도메인 이벤트들 가져오기
   */
  getDomainEvents(): DomainEvent[] {
    return [...this._domainEvents];
  }

  /**
   * 도메인 이벤트들 클리어
   */
  clearDomainEvents(): void {
    this._domainEvents = [];
  }

  /**
   * 현재 버전 가져오기
   */
  get version(): number {
    return this._version;
  }

  /**
   * 버전 증가 (이벤트 발생 시 호출)
   */
  protected incrementVersion(): void {
    this._version += 1;
  }
}

/**
 * Timestamp 타입 (ISO 8601 형식 문자열)
 */
export type Timestamp = string;

/**
 * 타임스탬프 생성 유틸리티
 */
export const createTimestamp = (): Timestamp => new Date().toISOString();

/**
 * 타임스탬프 파싱 유틸리티
 */
export const parseTimestamp = (timestamp: Timestamp): Date =>
  new Date(timestamp);

/**
 * 현재 시각 타임스탬프 검증
 */
export const isValidTimestamp = (timestamp: string): timestamp is Timestamp => {
  const date = new Date(timestamp);
  return !isNaN(date.getTime());
};
