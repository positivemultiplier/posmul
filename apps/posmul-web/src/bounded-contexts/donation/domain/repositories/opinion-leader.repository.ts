/**
 * Opinion Leader Repository Interface
 * 오피니언 리더 리포지토리 인터페이스
 */
import { PaginatedResult, Result, UserId } from "@posmul/auth-economy-sdk";

import { OpinionLeader, OpinionLeaderStatus, VerificationStatus } from "../entities/opinion-leader.entity";
import { OpinionLeaderId, SupportCategory } from "../value-objects/donation-value-objects";

export interface OpinionLeaderSearchCriteria {
  name?: string;
  category?: SupportCategory;
  status?: OpinionLeaderStatus;
  verificationStatus?: VerificationStatus;
  userId?: UserId;
}

export interface IOpinionLeaderRepository {
  // 기본 CRUD
  save(opinionLeader: OpinionLeader): Promise<Result<void>>;
  findById(id: OpinionLeaderId): Promise<Result<OpinionLeader | null>>;
  findByUserId(userId: UserId): Promise<Result<OpinionLeader | null>>;
  update(opinionLeader: OpinionLeader): Promise<Result<void>>;
  delete(id: OpinionLeaderId): Promise<Result<void>>;

  // 검색
  findAll(
    page?: number,
    limit?: number
  ): Promise<Result<PaginatedResult<OpinionLeader>>>;

  findByCategory(
    category: SupportCategory,
    page?: number,
    limit?: number
  ): Promise<Result<PaginatedResult<OpinionLeader>>>;

  findByStatus(
    status: OpinionLeaderStatus,
    page?: number,
    limit?: number
  ): Promise<Result<PaginatedResult<OpinionLeader>>>;

  findByVerificationStatus(
    status: VerificationStatus,
    page?: number,
    limit?: number
  ): Promise<Result<PaginatedResult<OpinionLeader>>>;

  // 복합 검색
  findByCriteria(
    criteria: OpinionLeaderSearchCriteria,
    page?: number,
    limit?: number
  ): Promise<Result<PaginatedResult<OpinionLeader>>>;

  // 통계
  countByStatus(status: OpinionLeaderStatus): Promise<Result<number>>;
  countByCategory(category: SupportCategory): Promise<Result<number>>;

  // 랭킹
  getTopLeaders(
    limit: number
  ): Promise<Result<OpinionLeader[]>>;
}
