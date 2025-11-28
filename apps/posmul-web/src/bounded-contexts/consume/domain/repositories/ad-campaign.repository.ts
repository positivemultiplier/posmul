/**
 * AdCampaign Repository Interface
 * TimeConsume 광고 캠페인 리포지토리 인터페이스
 */

import type { AdCampaign } from '../entities/ad-campaign.entity';

export type Result<T, E = Error> =
  | { success: true; data: T }
  | { success: false; error: E };

export interface IAdCampaignRepository {
  /**
   * 활성 광고 캠페인 목록 조회
   */
  findActiveCampaigns(): Promise<Result<AdCampaign[]>>;

  /**
   * ID로 광고 캠페인 조회
   */
  findById(id: string): Promise<Result<AdCampaign | null>>;

  /**
   * 광고 캠페인 예산 사용량 업데이트
   */
  updateBudgetUsage(campaignId: string, pmpAmount: number): Promise<Result<void>>;
}
