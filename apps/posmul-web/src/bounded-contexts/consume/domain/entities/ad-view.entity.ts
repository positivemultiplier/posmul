/**
 * AdView Entity
 * TimeConsume 광고 시청 기록 도메인 엔티티
 */

export interface AdViewProps {
  id: string;
  userId: string;
  campaignId: string;
  viewDate: Date;
  startedAt: Date;
  endedAt: Date | null;
  watchDurationSeconds: number;
  completionRate: number;
  isCompleted: boolean;
  surveyCompleted: boolean;
  pmpEarned: number;
  deviceInfo: Record<string, unknown> | null;
  createdAt: Date;
}

export interface CreateAdViewInput {
  userId: string;
  campaignId: string;
  deviceInfo?: Record<string, unknown>;
}

export interface CompleteAdViewInput {
  endedAt: Date;
  watchDurationSeconds: number;
  campaignDuration: number;
  pmpReward: number;
  pmpRewardFull: number;
  surveyPmpBonus: number;
  surveyCompleted: boolean;
}

export class AdView {
  private constructor(private props: AdViewProps) {}

  get id(): string {
    return this.props.id;
  }

  get userId(): string {
    return this.props.userId;
  }

  get campaignId(): string {
    return this.props.campaignId;
  }

  get viewDate(): Date {
    return this.props.viewDate;
  }

  get startedAt(): Date {
    return this.props.startedAt;
  }

  get endedAt(): Date | null {
    return this.props.endedAt;
  }

  get watchDurationSeconds(): number {
    return this.props.watchDurationSeconds;
  }

  get completionRate(): number {
    return this.props.completionRate;
  }

  get isCompleted(): boolean {
    return this.props.isCompleted;
  }

  get surveyCompleted(): boolean {
    return this.props.surveyCompleted;
  }

  get pmpEarned(): number {
    return this.props.pmpEarned;
  }

  get deviceInfo(): Record<string, unknown> | null {
    return this.props.deviceInfo;
  }

  /**
   * 광고 시청 완료 처리
   */
  complete(input: CompleteAdViewInput): AdView {
    const completionRate = Math.min(
      (input.watchDurationSeconds / input.campaignDuration) * 100,
      100
    );

    let pmpEarned = 0;
    
    // 30초 이상 시청해야 PMP 지급
    if (input.watchDurationSeconds >= 30) {
      pmpEarned = input.watchDurationSeconds >= input.campaignDuration
        ? input.pmpRewardFull
        : input.pmpReward;
    }

    // 설문 참여 시 추가 보상
    if (input.surveyCompleted && input.watchDurationSeconds >= 30) {
      pmpEarned += input.surveyPmpBonus;
    }

    return new AdView({
      ...this.props,
      endedAt: input.endedAt,
      watchDurationSeconds: input.watchDurationSeconds,
      completionRate,
      isCompleted: input.watchDurationSeconds >= input.campaignDuration,
      surveyCompleted: input.surveyCompleted,
      pmpEarned,
    });
  }

  static create(input: CreateAdViewInput): AdView {
    const now = new Date();
    return new AdView({
      id: crypto.randomUUID(),
      userId: input.userId,
      campaignId: input.campaignId,
      viewDate: now,
      startedAt: now,
      endedAt: null,
      watchDurationSeconds: 0,
      completionRate: 0,
      isCompleted: false,
      surveyCompleted: false,
      pmpEarned: 0,
      deviceInfo: input.deviceInfo ?? null,
      createdAt: now,
    });
  }

  static fromDatabase(row: Record<string, unknown>): AdView {
    return new AdView({
      id: row.id as string,
      userId: row.user_id as string,
      campaignId: row.campaign_id as string,
      viewDate: new Date(row.view_date as string),
      startedAt: new Date(row.started_at as string),
      endedAt: row.ended_at ? new Date(row.ended_at as string) : null,
      watchDurationSeconds: row.watch_duration_seconds as number,
      completionRate: Number(row.completion_rate),
      isCompleted: row.is_completed as boolean,
      surveyCompleted: row.survey_completed as boolean,
      pmpEarned: row.pmp_earned as number,
      deviceInfo: row.device_info as Record<string, unknown> | null,
      createdAt: new Date(row.created_at as string),
    });
  }

  toDatabase(): Record<string, unknown> {
    return {
      id: this.props.id,
      user_id: this.props.userId,
      campaign_id: this.props.campaignId,
      view_date: this.props.viewDate.toISOString().split('T')[0],
      started_at: this.props.startedAt.toISOString(),
      ended_at: this.props.endedAt?.toISOString() ?? null,
      watch_duration_seconds: this.props.watchDurationSeconds,
      completion_rate: this.props.completionRate,
      is_completed: this.props.isCompleted,
      survey_completed: this.props.surveyCompleted,
      pmp_earned: this.props.pmpEarned,
      device_info: this.props.deviceInfo,
    };
  }

  toJSON(): AdViewProps {
    return { ...this.props };
  }
}
