/**
 * Institute Repository Interface
 * 기관 리포지토리 인터페이스
 */

import { Result } from "@posmul/auth-economy-sdk";
import { PaginatedResult, PaginationParams } from "@posmul/auth-economy-sdk";

import {
  Institute,
  InstituteStatus,
  TrustLevel,
} from "../entities/institute.entity";
import {
  InstituteCategory,
  InstituteId,
} from "../value-objects/donation-value-objects";

export interface InstituteSearchCriteria {
  category?: InstituteCategory;
  status?: InstituteStatus;
  trustLevel?: TrustLevel;
  name?: string;
  verified?: boolean;
}

export interface IInstituteRepository {
  // 기본 CRUD 작업
  save(institute: Institute): Promise<Result<void>>;
  findById(id: InstituteId): Promise<Result<Institute | null>>;
  update(institute: Institute): Promise<Result<void>>;
  delete(id: InstituteId): Promise<Result<void>>;

  // 검색 및 필터링
  findAll(
    pagination?: PaginationParams
  ): Promise<Result<PaginatedResult<Institute>>>;
  findByCategory(
    category: InstituteCategory,
    pagination?: PaginationParams
  ): Promise<Result<PaginatedResult<Institute>>>;
  findByStatus(
    status: InstituteStatus,
    pagination?: PaginationParams
  ): Promise<Result<PaginatedResult<Institute>>>;
  findByTrustLevel(
    trustLevel: TrustLevel,
    pagination?: PaginationParams
  ): Promise<Result<PaginatedResult<Institute>>>;

  // 복합 검색
  findByCriteria(
    criteria: InstituteSearchCriteria,
    pagination?: PaginationParams
  ): Promise<Result<PaginatedResult<Institute>>>;

  // 이름으로 검색
  findByName(name: string): Promise<Result<Institute | null>>;
  searchByName(
    namePattern: string,
    pagination?: PaginationParams
  ): Promise<Result<PaginatedResult<Institute>>>;

  // 활성 기관 조회
  findActiveInstitutes(
    pagination?: PaginationParams
  ): Promise<Result<PaginatedResult<Institute>>>;
  findVerifiedInstitutes(
    pagination?: PaginationParams
  ): Promise<Result<PaginatedResult<Institute>>>;

  // 통계
  countByStatus(status: InstituteStatus): Promise<Result<number>>;
  countByCategory(category: InstituteCategory): Promise<Result<number>>;
  countByTrustLevel(trustLevel: TrustLevel): Promise<Result<number>>;

  // 등록번호로 검증
  findByRegistrationNumber(
    registrationNumber: string
  ): Promise<Result<Institute | null>>;

  // 인기 기관 (기부 데이터 기반)
  getPopularInstitutes(
    period: "monthly" | "yearly" | "all",
    limit: number
  ): Promise<
    Result<
      {
        institute: Institute;
        totalDonations: number;
        totalAmount: number;
        donorCount: number;
      }[]
    >
  >;

  // 카테고리별 기관 수
  getCategoryDistribution(): Promise<Result<Record<InstituteCategory, number>>>;

  // 대시보드용 요약
  getAdminSummary(): Promise<
    Result<{
      totalInstitutes: number;
      activeInstitutes: number;
      pendingApprovals: number;
      verifiedInstitutes: number;
      categoryDistribution: Record<InstituteCategory, number>;
      trustLevelDistribution: Record<TrustLevel, number>;
    }>
  >;
}
