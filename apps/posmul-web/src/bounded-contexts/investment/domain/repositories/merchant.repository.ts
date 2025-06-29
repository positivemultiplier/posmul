import { Result } from '@posmul/shared-types';
import { UserId } from '@posmul/shared-types';
import { Merchant } from '../entities/merchant.entity';
import { MerchantId } from '../value-objects/investment-value-objects';

/**
 * Merchant Repository Interface
 * Local League 상점 데이터 관리를 위한 리포지토리 인터페이스
 */
export interface IMerchantRepository {
  /**
   * 상점 저장
   */
  save(merchant: Merchant): Promise<Result<void>>;

  /**
   * ID로 상점 조회
   */
  findById(id: MerchantId): Promise<Result<Merchant | null>>;

  /**
   * 소유자 ID로 상점 조회
   */
  findByOwnerId(ownerId: UserId): Promise<Result<Merchant[]>>;

  /**
   * 카테고리별 상점 조회
   */
  findByCategory(category: string, limit?: number, offset?: number): Promise<Result<{
    merchants: Merchant[];
    total: number;
  }>>;

  /**
   * 지역별 상점 조회
   */
  findByLocation(region: string, city?: string, limit?: number, offset?: number): Promise<Result<{
    merchants: Merchant[];
    total: number;
  }>>;

  /**
   * 활성 상점 조회
   */
  findActive(limit?: number, offset?: number): Promise<Result<{
    merchants: Merchant[];
    total: number;
  }>>;

  /**
   * 상점 삭제
   */
  delete(id: MerchantId): Promise<Result<void>>;

  /**
   * 상점 검색
   */
  search(query: string, limit?: number, offset?: number): Promise<Result<{
    merchants: Merchant[];
    total: number;
  }>>;
}
