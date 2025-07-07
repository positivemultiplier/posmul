/**
 * PosMul Auth-Economy SDK
 * 
 * 순수 인증 및 경제 시스템 비즈니스 로직 SDK
 * UI 컴포넌트는 각 앱에서 자체 구현됩니다.
 */

// === 인증 시스템 ===
export * from './auth';

// === 경제 시스템 ===
export * from './economy';

// === 공통 타입 ===
export * from './types';

// === 에러 처리 ===
export * from './errors';

// === 유틸리티 ===
export * from './utils';

// === 통합 클라이언트 ===
export { createAuthEconomyClient } from './client';
