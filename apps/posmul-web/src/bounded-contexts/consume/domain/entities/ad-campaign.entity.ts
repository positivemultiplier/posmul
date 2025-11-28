/**
 * AdCampaign Entity
 * TimeConsume 광고 캠페인 도메인 엔티티
 */

export type AdCampaignStatus = 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'EXPIRED';

export interface AdCampaignProps {
  id: string;
  title: string;
  description: string | null;
  advertiserName: string;
  videoUrl: string | null;
  thumbnailUrl: string | null;
  durationSeconds: number;
  pmpReward: number;
  pmpRewardFull: number;
  surveyPmpBonus: number;
  dailyViewLimit: number;
  totalBudget: number;
  usedBudget: number;
  status: AdCampaignStatus;
  startDate: Date;
  endDate: Date | null;
  targetDemographics: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}

export class AdCampaign {
  private constructor(private readonly props: AdCampaignProps) {}

  get id(): string {
    return this.props.id;
  }

  get title(): string {
    return this.props.title;
  }

  get description(): string | null {
    return this.props.description;
  }

  get advertiserName(): string {
    return this.props.advertiserName;
  }

  get videoUrl(): string | null {
    return this.props.videoUrl;
  }

  get thumbnailUrl(): string | null {
    return this.props.thumbnailUrl;
  }

  get durationSeconds(): number {
    return this.props.durationSeconds;
  }

  get pmpReward(): number {
    return this.props.pmpReward;
  }

  get pmpRewardFull(): number {
    return this.props.pmpRewardFull;
  }

  get surveyPmpBonus(): number {
    return this.props.surveyPmpBonus;
  }

  get dailyViewLimit(): number {
    return this.props.dailyViewLimit;
  }

  get totalBudget(): number {
    return this.props.totalBudget;
  }

  get usedBudget(): number {
    return this.props.usedBudget;
  }

  get status(): AdCampaignStatus {
    return this.props.status;
  }

  get remainingBudget(): number {
    return this.props.totalBudget - this.props.usedBudget;
  }

  get isActive(): boolean {
    return this.props.status === 'ACTIVE' && this.remainingBudget > 0;
  }

  /**
   * 30초 이상 시청 기준으로 PMP 계산
   */
  calculatePmpReward(watchDurationSeconds: number, surveyCompleted: boolean): number {
    if (watchDurationSeconds < 30) {
      return 0;
    }

    let reward = watchDurationSeconds >= this.props.durationSeconds
      ? this.props.pmpRewardFull
      : this.props.pmpReward;

    if (surveyCompleted) {
      reward += this.props.surveyPmpBonus;
    }

    return reward;
  }

  static create(props: AdCampaignProps): AdCampaign {
    return new AdCampaign(props);
  }

  static fromDatabase(row: Record<string, unknown>): AdCampaign {
    return new AdCampaign({
      id: row.id as string,
      title: row.title as string,
      description: row.description as string | null,
      advertiserName: row.advertiser_name as string,
      videoUrl: row.video_url as string | null,
      thumbnailUrl: row.thumbnail_url as string | null,
      durationSeconds: row.duration_seconds as number,
      pmpReward: row.pmp_reward as number,
      pmpRewardFull: row.pmp_reward_full as number,
      surveyPmpBonus: row.survey_pmp_bonus as number,
      dailyViewLimit: row.daily_view_limit as number,
      totalBudget: row.total_budget as number,
      usedBudget: row.used_budget as number,
      status: row.status as AdCampaignStatus,
      startDate: new Date(row.start_date as string),
      endDate: row.end_date ? new Date(row.end_date as string) : null,
      targetDemographics: row.target_demographics as Record<string, unknown> | null,
      createdAt: new Date(row.created_at as string),
      updatedAt: new Date(row.updated_at as string),
    });
  }

  toJSON(): AdCampaignProps {
    return { ...this.props };
  }
}
