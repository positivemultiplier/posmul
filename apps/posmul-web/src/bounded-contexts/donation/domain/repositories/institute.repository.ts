/**
 * Institute Repository Interface
 * 기부 기관 리포지토리 인터페이스
 */
import { PaginatedResult, Result } from "@posmul/auth-economy-sdk";

import { Institute, InstituteStatus, TrustLevel } from "../entities/institute.entity";
import { InstituteCategory, InstituteId } from "../value-objects/donation-value-objects";

export interface InstituteSearchCriteria {
  name?: string;
  category?: InstituteCategory;
  status?: InstituteStatus;
  trustLevel?: TrustLevel;
  isVerified?: boolean;
}

export interface IInstituteRepository {
  // 기본 CRUD
  save(institute: Institute): Promise<Result<void>>;
  findById(id: InstituteId): Promise<Result<Institute | null>>;
  update(institute: Institute): Promise<Result<void>>;
  delete(id: InstituteId): Promise<Result<void>>;

  // 검색
  findAll(
    page?: number,
    limit?: number
  ): Promise<Result<PaginatedResult<Institute>>>;

  findByCategory(
    category: InstituteCategory,
    page?: number,
    limit?: number
  ): Promise<Result<PaginatedResult<Institute>>>;

  findByStatus(
    status: InstituteStatus,
    page?: number,
    limit?: number
  ): Promise<Result<PaginatedResult<Institute>>>;

  findByTrustLevel(
    level: TrustLevel,
    page?: number,
    limit?: number
  ): Promise<Result<PaginatedResult<Institute>>>;

  // 복합 검색
  findByCriteria(
    criteria: InstituteSearchCriteria,
    page?: number,
    limit?: number
  ): Promise<Result<PaginatedResult<Institute>>>;

  // 통계
  countByStatus(status: InstituteStatus): Promise<Result<number>>;
  countByCategory(category: InstituteCategory): Promise<Result<number>>;
}
