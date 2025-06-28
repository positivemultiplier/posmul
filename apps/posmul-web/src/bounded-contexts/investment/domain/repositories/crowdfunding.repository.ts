import { Result } from '@/shared/types/common';
import { UserId } from '@/bounded-contexts/auth/domain/value-objects/user-value-objects';
import { CrowdFunding } from '../entities/crowdfunding.entity';
import { CrowdFundingId, FundingCategory } from '../value-objects/investment-value-objects';

/**
 * CrowdFunding Repository Interface
 * Cloud Funding 크라우드 펀딩 데이터 관리를 위한 리포지토리 인터페이스
 */
export interface ICrowdFundingRepository {
  /**
   * 크라우드 펀딩 저장
   */
  save(crowdFunding: CrowdFunding): Promise<Result<void>>;

  /**
   * ID로 크라우드 펀딩 조회
   */
  findById(id: CrowdFundingId): Promise<Result<CrowdFunding | null>>;

  /**
   * 생성자 ID로 크라우드 펀딩 조회
   */
  findByCreatorId(creatorId: UserId): Promise<Result<CrowdFunding[]>>;

  /**
   * 카테고리별 크라우드 펀딩 조회
   */
  findByCategory(category: FundingCategory, limit?: number, offset?: number): Promise<Result<{
    crowdFundings: CrowdFunding[];
    total: number;
  }>>;

  /**
   * 활성 크라우드 펀딩 조회
   */
  findActive(limit?: number, offset?: number): Promise<Result<{
    crowdFundings: CrowdFunding[];
    total: number;
  }>>;

  /**
   * 투자 가능한 크라우드 펀딩 조회
   */
  findAvailableForInvestment(limit?: number, offset?: number): Promise<Result<{
    crowdFundings: CrowdFunding[];
    total: number;
  }>>;

  /**
   * 성공한 크라우드 펀딩 조회
   */
  findSuccessful(limit?: number, offset?: number): Promise<Result<{
    crowdFundings: CrowdFunding[];
    total: number;
  }>>;

  /**
   * 크라우드 펀딩 삭제
   */
  delete(id: CrowdFundingId): Promise<Result<void>>;

  /**
   * 크라우드 펀딩 검색
   */
  search(query: string, limit?: number, offset?: number): Promise<Result<{
    crowdFundings: CrowdFunding[];
    total: number;
  }>>;
}
