/**
 * 사용자 리포지토리 인터페이스
 */
import type { Email, Result, UserId } from "@posmul/auth-economy-sdk";

import { User } from "../entities/user.entity";

export interface IUserRepository {
  // 사용자 생성
  save(user: User): Promise<Result<User, Error>>;

  // 사용자 조회
  findById(id: UserId): Promise<Result<User | null, Error>>;
  findByEmail(email: Email): Promise<Result<User | null, Error>>;

  // 사용자 업데이트
  update(user: User): Promise<Result<User, Error>>;

  // 사용자 존재 여부 확인
  existsByEmail(email: Email): Promise<Result<boolean, Error>>;

  // 사용자 목록 조회 (관리자용)
  findAll(page: number, limit: number): Promise<Result<User[], Error>>;

  // 사용자 삭제 (소프트 삭제)
  delete(id: UserId): Promise<Result<void, Error>>;
}
