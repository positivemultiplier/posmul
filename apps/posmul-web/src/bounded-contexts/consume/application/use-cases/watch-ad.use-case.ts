/**
 * Watch Ad Use Case
 * 광고 시청 시작 및 완료 처리 유스케이스
 */

import type { IAdCampaignRepository } from '../../domain/repositories/ad-campaign.repository';
import type { IAdViewRepository } from '../../domain/repositories/ad-view.repository';
import { AdView } from '../../domain/entities/ad-view.entity';

export type Result<T, E = Error> =
  | { success: true; data: T }
  | { success: false; error: E };

export interface StartAdViewInput {
  userId: string;
  campaignId: string;
  deviceInfo?: Record<string, unknown>;
}

export interface CompleteAdViewInput {
  viewId: string;
  watchDurationSeconds: number;
  surveyCompleted: boolean;
}

export interface StartAdViewOutput {
  viewId: string;
  campaignId: string;
  campaignTitle: string;
  durationSeconds: number;
  startedAt: Date;
}

export interface CompleteAdViewOutput {
  viewId: string;
  watchDurationSeconds: number;
  completionRate: number;
  isCompleted: boolean;
  pmpEarned: number;
  surveyCompleted: boolean;
  message: string;
}

// PMP 지급을 위한 콜백 타입
type AwardPmpCallback = (userId: string, amount: number, description: string) => Promise<Result<void>>;

export class WatchAdUseCase {
  constructor(
    private readonly campaignRepository: IAdCampaignRepository,
    private readonly viewRepository: IAdViewRepository,
    private readonly awardPmp: AwardPmpCallback
  ) {}

  /**
   * 광고 시청 시작
   */
  async startAdView(input: StartAdViewInput): Promise<Result<StartAdViewOutput>> {
    // 1. 캠페인 조회
    const campaignResult = await this.campaignRepository.findById(input.campaignId);
    if (campaignResult.success === false) {
      return { success: false, error: campaignResult.error };
    }

    const campaign = campaignResult.data;
    if (!campaign) {
      return { success: false, error: new Error('캠페인을 찾을 수 없습니다.') };
    }

    if (!campaign.isActive) {
      return { success: false, error: new Error('이 캠페인은 현재 활성 상태가 아닙니다.') };
    }

    // 2. 일일 시청 횟수 확인
    const dailyCountResult = await this.viewRepository.countUserDailyViews(
      input.userId,
      input.campaignId,
      new Date()
    );

    if (dailyCountResult.success === false) {
      return { success: false, error: dailyCountResult.error };
    }

    if (dailyCountResult.data >= campaign.dailyViewLimit) {
      return {
        success: false,
        error: new Error(`오늘 이 광고의 일일 시청 한도(${campaign.dailyViewLimit}회)에 도달했습니다.`),
      };
    }

    // 3. 시청 기록 생성
    const adView = AdView.create({
      userId: input.userId,
      campaignId: input.campaignId,
      deviceInfo: input.deviceInfo,
    });

    const saveResult = await this.viewRepository.save(adView);
    if (saveResult.success === false) {
      return { success: false, error: saveResult.error };
    }

    return {
      success: true,
      data: {
        viewId: saveResult.data.id,
        campaignId: campaign.id,
        campaignTitle: campaign.title,
        durationSeconds: campaign.durationSeconds,
        startedAt: saveResult.data.startedAt,
      },
    };
  }

  /**
   * 광고 시청 완료
   */
  async completeAdView(input: CompleteAdViewInput): Promise<Result<CompleteAdViewOutput>> {
    // 1. 시청 기록 조회
    const viewResult = await this.viewRepository.findById(input.viewId);
    if (viewResult.success === false) {
      return { success: false, error: viewResult.error };
    }

    const view = viewResult.data;
    if (!view) {
      return { success: false, error: new Error('시청 기록을 찾을 수 없습니다.') };
    }

    if (view.endedAt) {
      return { success: false, error: new Error('이미 완료된 시청 기록입니다.') };
    }

    // 2. 캠페인 조회
    const campaignResult = await this.campaignRepository.findById(view.campaignId);
    if (campaignResult.success === false) {
      return { success: false, error: campaignResult.error };
    }

    const campaign = campaignResult.data;
    if (!campaign) {
      return { success: false, error: new Error('캠페인을 찾을 수 없습니다.') };
    }

    // 3. 시청 완료 처리
    const completedView = view.complete({
      endedAt: new Date(),
      watchDurationSeconds: input.watchDurationSeconds,
      campaignDuration: campaign.durationSeconds,
      pmpReward: campaign.pmpReward,
      pmpRewardFull: campaign.pmpRewardFull,
      surveyPmpBonus: campaign.surveyPmpBonus,
      surveyCompleted: input.surveyCompleted,
    });

    // 4. 시청 기록 업데이트
    const updateResult = await this.viewRepository.update(completedView);
    if (updateResult.success === false) {
      return { success: false, error: updateResult.error };
    }

    // 5. PMP 지급 (30초 이상 시청 시)
    if (completedView.pmpEarned > 0) {
      const pmpDescription = input.surveyCompleted
        ? `TimeConsume: ${campaign.title} 시청 + 설문 완료`
        : `TimeConsume: ${campaign.title} 시청 완료`;

      const pmpResult = await this.awardPmp(view.userId, completedView.pmpEarned, pmpDescription);
      if (pmpResult.success === false) {
        console.error('PMP 지급 실패:', pmpResult.error);
        // PMP 지급 실패해도 시청 완료는 처리됨
      }

      // 6. 캠페인 예산 업데이트
      await this.campaignRepository.updateBudgetUsage(campaign.id, completedView.pmpEarned);
    }

    // 7. 일일 통계 업데이트
    await this.viewRepository.upsertDailyStats(
      view.userId,
      new Date(),
      completedView.pmpEarned,
      completedView.watchDurationSeconds,
      completedView.isCompleted,
      completedView.surveyCompleted
    );

    // 8. 결과 메시지 생성
    let message: string;
    if (completedView.pmpEarned === 0) {
      message = '30초 이상 시청해야 PMP를 획득할 수 있습니다.';
    } else if (completedView.surveyCompleted) {
      message = `축하합니다! ${completedView.pmpEarned} PMP를 획득했습니다. (시청 + 설문 보상)`;
    } else if (completedView.isCompleted) {
      message = `축하합니다! ${completedView.pmpEarned} PMP를 획득했습니다. (완전 시청 보상)`;
    } else {
      message = `${completedView.pmpEarned} PMP를 획득했습니다. (부분 시청 보상)`;
    }

    return {
      success: true,
      data: {
        viewId: completedView.id,
        watchDurationSeconds: completedView.watchDurationSeconds,
        completionRate: completedView.completionRate,
        isCompleted: completedView.isCompleted,
        pmpEarned: completedView.pmpEarned,
        surveyCompleted: completedView.surveyCompleted,
        message,
      },
    };
  }
}
