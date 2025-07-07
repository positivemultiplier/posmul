import { UserId } from "@posmul/auth-economy-sdk";

import { Result } from "@posmul/auth-economy-sdk";

import { Advertisement } from "../entities/advertisement.entity";
import { AdvertisementId } from "../value-objects/investment-value-objects";

/**
 * Advertisement Repository Interface
 * Major League 광고 데이터 관리를 위한 리포지토리 인터페이스
 */
export interface IAdvertisementRepository {
  /**
   * 광고 저장
   */
  save(advertisement: Advertisement): Promise<Result<void>>;

  /**
   * ID로 광고 조회
   */
  findById(id: AdvertisementId): Promise<Result<Advertisement | null>>;

  /**
   * 광고주 ID로 광고 조회
   */
  findByAdvertiserId(advertiserId: UserId): Promise<Result<Advertisement[]>>;

  /**
   * 카테고리별 광고 조회
   */
  findByCategory(
    category: string,
    limit?: number,
    offset?: number
  ): Promise<
    Result<{
      advertisements: Advertisement[];
      total: number;
    }>
  >;

  /**
   * 활성 광고 조회
   */
  findActive(
    limit?: number,
    offset?: number
  ): Promise<
    Result<{
      advertisements: Advertisement[];
      total: number;
    }>
  >;

  /**
   * 사용자 시청 가능한 광고 조회
   */
  findAvailableForUser(
    userId: UserId,
    limit?: number,
    offset?: number
  ): Promise<
    Result<{
      advertisements: Advertisement[];
      total: number;
    }>
  >;

  /**
   * 광고 삭제
   */
  delete(id: AdvertisementId): Promise<Result<void>>;

  /**
   * 광고 검색
   */
  search(
    query: string,
    limit?: number,
    offset?: number
  ): Promise<
    Result<{
      advertisements: Advertisement[];
      total: number;
    }>
  >;
}
