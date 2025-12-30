import {
  Result,
  UserId,
  success,
  failure,
  createUserId
} from "@posmul/auth-economy-sdk";
import { Entity } from "../../../../shared/domain/entity";

export interface AdViewProps {
  userId: UserId;
  advertisementId: string;
  completed: boolean;
  rewardClaimed: boolean;
  rewardAmount: number;
}

// DB 레코드 타입
export interface AdViewDbRecord {
  id: string;
  user_id: string;
  campaign_id: string;
  view_date: string;
  started_at: string;
  ended_at?: string | null;
  watch_duration_seconds: number;
  completion_rate: number;
  is_completed: boolean;
  survey_completed: boolean;
  pmp_earned: number;
  device_info?: Record<string, unknown> | null;
}

export class AdView extends Entity<string> {
  private _userId: UserId;
  private _advertisementId: string;
  private _viewedAt: Date;
  private _completed: boolean;
  private _rewardClaimed: boolean;
  private _rewardAmount: number;
  private _watchDurationSeconds: number;
  private _completionRate: number;
  private _surveyCompleted: boolean;

  private constructor(
    id: string,
    props: AdViewProps,
    viewedAt?: Date,
    watchDurationSeconds: number = 0,
    completionRate: number = 0,
    surveyCompleted: boolean = false
  ) {
    super(id);
    this._userId = props.userId;
    this._advertisementId = props.advertisementId;
    this._completed = props.completed;
    this._rewardClaimed = props.rewardClaimed;
    this._rewardAmount = props.rewardAmount;
    this._viewedAt = viewedAt || new Date();
    this._watchDurationSeconds = watchDurationSeconds;
    this._completionRate = completionRate;
    this._surveyCompleted = surveyCompleted;
  }

  public static create(
    props: AdViewProps,
    id?: string
  ): Result<AdView, Error> {
    const viewId = id || crypto.randomUUID();
    return success(new AdView(viewId, props));
  }

  /**
   * DB 레코드로부터 AdView 엔티티 생성
   */
  public static fromDatabase(row: Record<string, unknown>): AdView {
    const userId = createUserId(String(row.user_id));
    const props: AdViewProps = {
      userId,
      advertisementId: String(row.campaign_id),
      completed: Boolean(row.is_completed),
      rewardClaimed: Boolean(row.pmp_earned && Number(row.pmp_earned) > 0),
      rewardAmount: Number(row.pmp_earned) || 0,
    };

    return new AdView(
      String(row.id),
      props,
      row.started_at ? new Date(String(row.started_at)) : new Date(),
      Number(row.watch_duration_seconds) || 0,
      Number(row.completion_rate) || 0,
      Boolean(row.survey_completed)
    );
  }

  /**
   * DB 저장용 레코드로 변환
   */
  public toDatabase(): AdViewDbRecord {
    return {
      id: this.id.toString(),
      user_id: String(this._userId),
      campaign_id: this._advertisementId,
      view_date: this._viewedAt.toISOString().split("T")[0],
      started_at: this._viewedAt.toISOString(),
      ended_at: this._completed ? new Date().toISOString() : null,
      watch_duration_seconds: this._watchDurationSeconds,
      completion_rate: this._completionRate,
      is_completed: this._completed,
      survey_completed: this._surveyCompleted,
      pmp_earned: this._rewardAmount,
      device_info: null,
    };
  }

  public claimReward(): Result<void, Error> {
    if (!this._completed) {
      return failure(new Error("Cannot claim reward for incomplete view"));
    }
    if (this._rewardClaimed) {
      return failure(new Error("Reward already claimed"));
    }
    this._rewardClaimed = true;
    return success(undefined);
  }

  // Getters
  get rewardClaimed(): boolean { return this._rewardClaimed; }
  get userId(): UserId { return this._userId; }
  get advertisementId(): string { return this._advertisementId; }
  get viewedAt(): Date { return this._viewedAt; }
  get completed(): boolean { return this._completed; }
  get rewardAmount(): number { return this._rewardAmount; }
  get watchDurationSeconds(): number { return this._watchDurationSeconds; }
  get completionRate(): number { return this._completionRate; }
  get surveyCompleted(): boolean { return this._surveyCompleted; }
}
