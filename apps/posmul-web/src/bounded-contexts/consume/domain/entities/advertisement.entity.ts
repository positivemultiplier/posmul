import {
  Result,
  success,
} from "@posmul/auth-economy-sdk";
import { Entity } from "../../../../shared/domain/entity";
import { AdvertisementStatus, RewardRate } from "../value-objects/investment-value-objects";

export interface AdvertisementProps {
  campaignId: string;
  title: string;
  description: string;
  videoUrl: string;
  thumbnailUrl: string;
  durationSeconds: number;
  rewardPmpAmount: number;
  predictionTopicId?: string;
  status?: AdvertisementStatus;
  rewardRate?: RewardRate;
}

// DB 레코드 타입
export interface AdvertisementDbRecord {
  id: string;
  campaign_id: string;
  title: string;
  description: string;
  video_url: string;
  thumbnail_url: string;
  duration_seconds: number;
  reward_pmp_amount: number;
  prediction_topic_id?: string | null;
  status: string;
  reward_rate: number;
  created_at: string;
}

export class Advertisement extends Entity<string> {
  private _campaignId: string;
  private _title: string;
  private _description: string;
  private _videoUrl: string;
  private _thumbnailUrl: string;
  private _durationSeconds: number;
  private _rewardPmpAmount: number;
  private _predictionTopicId?: string;
  private _createdAt: Date;
  private _status: AdvertisementStatus;
  private _rewardRate: RewardRate;

  private constructor(
    id: string,
    props: AdvertisementProps,
    createdAt?: Date
  ) {
    super(id);
    this._campaignId = props.campaignId;
    this._title = props.title;
    this._description = props.description;
    this._videoUrl = props.videoUrl;
    this._thumbnailUrl = props.thumbnailUrl;
    this._durationSeconds = props.durationSeconds;
    this._rewardPmpAmount = props.rewardPmpAmount;
    this._predictionTopicId = props.predictionTopicId;
    this._createdAt = createdAt || new Date();
    this._status = props.status || AdvertisementStatus.ACTIVE;
    // 기본 보상률 5%
    if (props.rewardRate) {
      this._rewardRate = props.rewardRate;
    } else {
      const defaultRateResult = RewardRate.createPercentage(5);
      if (defaultRateResult.success) {
        this._rewardRate = defaultRateResult.data;
      } else {
        // Fallback: 이 경우는 발생하지 않아야 하지만 타입 안전을 위해
        throw new Error("Failed to create default reward rate");
      }
    }
  }

  public static create(
    props: AdvertisementProps,
    id?: string
  ): Result<Advertisement, Error> {
    const adId = id || crypto.randomUUID();
    return success(new Advertisement(adId, props));
  }

  /**
   * DB 레코드로부터 Advertisement 엔티티 생성
   */
  public static fromDatabase(row: Record<string, unknown>): Advertisement {
    const rewardRateResult = RewardRate.createPercentage(Number(row.reward_rate) || 5);

    const props: AdvertisementProps = {
      campaignId: String(row.campaign_id || ""),
      title: String(row.title || ""),
      description: String(row.description || ""),
      videoUrl: String(row.video_url || ""),
      thumbnailUrl: String(row.thumbnail_url || ""),
      durationSeconds: Number(row.duration_seconds) || 0,
      rewardPmpAmount: Number(row.reward_pmp_amount) || 0,
      predictionTopicId: row.prediction_topic_id ? String(row.prediction_topic_id) : undefined,
      status: (row.status as AdvertisementStatus) || AdvertisementStatus.ACTIVE,
      rewardRate: rewardRateResult.success ? rewardRateResult.data : undefined,
    };

    return new Advertisement(
      String(row.id),
      props,
      row.created_at ? new Date(String(row.created_at)) : new Date()
    );
  }

  /**
   * DB 저장용 레코드로 변환
   */
  public toDatabase(): AdvertisementDbRecord {
    return {
      id: this.id.toString(),
      campaign_id: this._campaignId,
      title: this._title,
      description: this._description,
      video_url: this._videoUrl,
      thumbnail_url: this._thumbnailUrl,
      duration_seconds: this._durationSeconds,
      reward_pmp_amount: this._rewardPmpAmount,
      prediction_topic_id: this._predictionTopicId || null,
      status: this._status,
      reward_rate: this._rewardRate.getRate(),
      created_at: this._createdAt.toISOString(),
    };
  }

  // Getters
  get title(): string { return this._title; }
  get description(): string { return this._description; }
  get videoUrl(): string { return this._videoUrl; }
  get thumbnailUrl(): string { return this._thumbnailUrl; }
  get rewardPmpAmount(): number { return this._rewardPmpAmount; }
  get durationSeconds(): number { return this._durationSeconds; }
  get campaignId(): string { return this._campaignId; }
  get predictionTopicId(): string | undefined { return this._predictionTopicId; }
  get createdAt(): Date { return this._createdAt; }

  // Methods for InvestmentDomainService
  getStatus(): AdvertisementStatus { return this._status; }
  getRewardRate(): RewardRate { return this._rewardRate; }
}

