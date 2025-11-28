/**
 * AdView Repository Interface
 * TimeConsume 광고 시청 기록 리포지토리 인터페이스
 */

import type { AdView } from '../entities/ad-view.entity';

export type Result<T, E = Error> =
  | { success: true; data: T }
  | { success: false; error: E };

export interface DailyViewStats {
  totalViews: number;
  completedViews: number;
  totalWatchTime: number;
  totalPmpEarned: number;
  surveyCount: number;
}

export interface IAdViewRepository {
  /**
   * 광고 시청 기록 저장
   */
  save(adView: AdView): Promise<Result<AdView>>;

  /**
   * 광고 시청 기록 업데이트
   */
  update(adView: AdView): Promise<Result<AdView>>;

  /**
   * ID로 광고 시청 기록 조회
   */
  findById(id: string): Promise<Result<AdView | null>>;

  /**
   * 사용자의 특정 날짜 시청 횟수 조회
   */
  countUserDailyViews(userId: string, campaignId: string, date: Date): Promise<Result<number>>;

  /**
   * 사용자의 일일 통계 조회
   */
  getDailyStats(userId: string, date: Date): Promise<Result<DailyViewStats>>;

  /**
   * 일일 통계 업데이트/생성
   */
  upsertDailyStats(
    userId: string,
    date: Date,
    pmpEarned: number,
    watchTime: number,
    isCompleted: boolean,
    hasSurvey: boolean
  ): Promise<Result<void>>;
}
