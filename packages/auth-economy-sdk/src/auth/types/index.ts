/**
 * 인증 시스템 타입 정의
 */

import { Result, UserId } from '../../types';
import { AuthError } from '../../errors';

// === 공통 타입 재수출 ===
export type { UserId, Result } from '../../types';

// === 인증 전용 브랜드 타입 ===
export type Email = string & { readonly brand: unique symbol };
export type Username = string & { readonly brand: unique symbol };

// === 에러 타입 재수출 ===
export { AuthError } from '../../errors';

// === 사용자 정보 ===
export interface User {
  id: UserId;
  email: Email;
  username?: Username;
  displayName?: string;
  avatarUrl?: string;
  createdAt: Date;
  lastActiveAt: Date;
}

// === 세션 정보 ===
export interface Session {
  access_token: string;
  refresh_token: string;
  expires_at: number;
}

// === 인증 결과 ===
export interface AuthResult {
  user: User;
  session: Session;
}

// === 인증 서비스 인터페이스 ===
export interface AuthService {
  signUp(email: Email, password: string, displayName?: string): Promise<Result<AuthResult, AuthError>>;
  signIn(email: Email, password: string): Promise<Result<AuthResult, AuthError>>;
  signOut(): Promise<Result<void, AuthError>>;
  getCurrentUser(): Promise<Result<User | null, AuthError>>;
  updateProfile(updates: Partial<User>): Promise<Result<User, AuthError>>;
  refreshSession(): Promise<Result<AuthResult, AuthError>>;
  syncSessionAcrossApps(): Promise<Result<void, AuthError>>;
  getUniversalUserId(): Promise<Result<UserId | null, AuthError>>;
  signInWithOAuth(provider: 'google' | 'kakao' | 'github', redirectTo?: string): Promise<Result<void, AuthError>>;
}

// === 유틸리티 타입 가드 ===
export function isValidEmail(email: string): email is Email {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function createUserId(id: string): UserId {
  return id as UserId;
}

export function createEmail(email: string): Email {
  if (!isValidEmail(email)) {
    throw new Error('Invalid email format');
  }
  return email as Email;
}

export function createUsername(username: string): Username {
  if (username.length < 3 || username.length > 20) {
    throw new Error('Username must be between 3 and 20 characters');
  }
  return username as Username;
}
