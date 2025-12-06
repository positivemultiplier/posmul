/**
 * Create Prediction From Forum Use Case
 * Forum 토론에서 인구통계 기반 예측 게임을 생성하는 유스케이스
 */
import { Result } from "@posmul/auth-economy-sdk";
import { UserId } from "../../../auth/domain/value-objects/user-value-objects";
import { PostId } from "../../domain/value-objects/forum-value-objects";
import { StatCategory, PeriodType } from "../../../demographic-data/domain";

/**
 * 예측 게임 생성 요청 DTO
 */
export interface CreatePredictionFromForumRequest {
  /** 연계할 Forum Post ID */
  postId: PostId;
  /** 예측 대상 통계 카테고리 */
  statCategory: StatCategory;
  /** 예측 대상 지역 코드 */
  regionCode: string;
  /** 예측 기간 타입 */
  periodType: PeriodType;
  /** 예측 대상 연도 */
  targetYear: number;
  /** 예측 대상 월 (월별 예측 시) */
  targetMonth?: number;
  /** 예측 대상 분기 (분기별 예측 시) */
  targetQuarter?: number;
  /** 예측 범위 최소값 */
  rangeMin: number;
  /** 예측 범위 최대값 */
  rangeMax: number;
  /** 예측 단위 (예: 50명 단위) */
  rangeStep: number;
  /** 최소 배팅 PMP */
  minBetPmp: number;
  /** 최대 배팅 PMP */
  maxBetPmp: number;
  /** 예측 마감일 */
  deadline: Date;
  /** 생성자 ID */
  creatorId: UserId;
}

/**
 * 예측 게임 생성 결과 DTO
 */
export interface CreatePredictionFromForumResult {
  predictionId: string;
  postId: string;
  linkId: string;
  title: string;
  statCategory: StatCategory;
  regionCode: string;
  targetPeriod: string;
  rangeDescription: string;
  deadline: Date;
  createdAt: Date;
}

/**
 * 예측 게임 템플릿
 */
export interface DemographicPredictionTemplate {
  category: StatCategory;
  titleTemplate: string;
  descriptionTemplate: string;
  defaultRange: {
    min: number;
    max: number;
    step: number;
  };
  defaultBetRange: {
    minPmp: number;
    maxPmp: number;
  };
  unit: string;
}

/**
 * 인구통계 예측 템플릿 정의
 */
export const DEMOGRAPHIC_PREDICTION_TEMPLATES: Record<StatCategory, DemographicPredictionTemplate> = {
  [StatCategory.BIRTH]: {
    category: StatCategory.BIRTH,
    titleTemplate: "{region} {period} 출생아 수 예측",
    descriptionTemplate: "{region}의 {period} 출생아 수를 예측해보세요. 저출산 정책의 효과를 함께 논의합니다.",
    defaultRange: { min: 500, max: 2000, step: 50 },
    defaultBetRange: { minPmp: 50, maxPmp: 500 },
    unit: "명",
  },
  [StatCategory.DEATH]: {
    category: StatCategory.DEATH,
    titleTemplate: "{region} {period} 사망자 수 예측",
    descriptionTemplate: "{region}의 {period} 사망자 수를 예측해보세요.",
    defaultRange: { min: 500, max: 3000, step: 100 },
    defaultBetRange: { minPmp: 50, maxPmp: 300 },
    unit: "명",
  },
  [StatCategory.MARRIAGE]: {
    category: StatCategory.MARRIAGE,
    titleTemplate: "{region} {period} 혼인 건수 예측",
    descriptionTemplate: "{region}의 {period} 혼인 건수를 예측해보세요.",
    defaultRange: { min: 200, max: 1500, step: 50 },
    defaultBetRange: { minPmp: 50, maxPmp: 300 },
    unit: "건",
  },
  [StatCategory.DIVORCE]: {
    category: StatCategory.DIVORCE,
    titleTemplate: "{region} {period} 이혼 건수 예측",
    descriptionTemplate: "{region}의 {period} 이혼 건수를 예측해보세요.",
    defaultRange: { min: 100, max: 800, step: 25 },
    defaultBetRange: { minPmp: 50, maxPmp: 300 },
    unit: "건",
  },
  [StatCategory.MIGRATION_IN]: {
    category: StatCategory.MIGRATION_IN,
    titleTemplate: "{region} {period} 전입자 수 예측",
    descriptionTemplate: "{region}으로의 {period} 전입자 수를 예측해보세요. 지역 발전과 인구 유입 정책을 함께 논의합니다.",
    defaultRange: { min: 1000, max: 10000, step: 500 },
    defaultBetRange: { minPmp: 50, maxPmp: 500 },
    unit: "명",
  },
  [StatCategory.MIGRATION_OUT]: {
    category: StatCategory.MIGRATION_OUT,
    titleTemplate: "{region} {period} 전출자 수 예측",
    descriptionTemplate: "{region}에서의 {period} 전출자 수를 예측해보세요.",
    defaultRange: { min: 1000, max: 10000, step: 500 },
    defaultBetRange: { minPmp: 50, maxPmp: 500 },
    unit: "명",
  },
  [StatCategory.EMPLOYMENT]: {
    category: StatCategory.EMPLOYMENT,
    titleTemplate: "{region} {period} 취업자 수 예측",
    descriptionTemplate: "{region}의 {period} 취업자 수를 예측해보세요. 고용 정책의 효과를 함께 분석합니다.",
    defaultRange: { min: 50000, max: 100000, step: 1000 },
    defaultBetRange: { minPmp: 100, maxPmp: 1000 },
    unit: "천 명",
  },
  [StatCategory.UNEMPLOYMENT]: {
    category: StatCategory.UNEMPLOYMENT,
    titleTemplate: "{region} {period} 실업률 예측",
    descriptionTemplate: "{region}의 {period} 실업률을 예측해보세요.",
    defaultRange: { min: 1, max: 10, step: 0.1 },
    defaultBetRange: { minPmp: 100, maxPmp: 1000 },
    unit: "%",
  },
  [StatCategory.LABOR_FORCE]: {
    category: StatCategory.LABOR_FORCE,
    titleTemplate: "{region} {period} 경제활동인구 예측",
    descriptionTemplate: "{region}의 {period} 경제활동인구를 예측해보세요.",
    defaultRange: { min: 50000, max: 150000, step: 5000 },
    defaultBetRange: { minPmp: 100, maxPmp: 1000 },
    unit: "천 명",
  },
  [StatCategory.CPI]: {
    category: StatCategory.CPI,
    titleTemplate: "{period} 소비자물가지수 예측",
    descriptionTemplate: "{period} 소비자물가지수를 예측해보세요. 물가 안정 정책을 함께 논의합니다.",
    defaultRange: { min: 100, max: 120, step: 0.5 },
    defaultBetRange: { minPmp: 100, maxPmp: 1000 },
    unit: "",
  },
  [StatCategory.POPULATION]: {
    category: StatCategory.POPULATION,
    titleTemplate: "{region} {period} 총인구 예측",
    descriptionTemplate: "{region}의 {period} 총인구를 예측해보세요.",
    defaultRange: { min: 100000, max: 2000000, step: 10000 },
    defaultBetRange: { minPmp: 100, maxPmp: 1000 },
    unit: "명",
  },
};

/**
 * 광주광역시 지역 코드 → 지역명 매핑
 */
export const GWANGJU_REGION_NAMES: Record<string, string> = {
  "29000": "광주광역시",
  "29110": "동구",
  "29140": "서구",
  "29155": "남구",
  "29170": "북구",
  "29200": "광산구",
};

/**
 * CreatePredictionFromForumUseCase
 * Forum 토론에서 인구통계 예측 게임을 생성
 */
export class CreatePredictionFromForumUseCase {
  constructor(
    private readonly forumPredictionLinkRepository: IForumPredictionLinkRepository,
    private readonly predictionRepository: IPredictionRepository
  ) {}

  async execute(
    request: CreatePredictionFromForumRequest
  ): Promise<Result<CreatePredictionFromForumResult>> {
    try {
      // 1. 템플릿 기반 제목/설명 생성
      const template = DEMOGRAPHIC_PREDICTION_TEMPLATES[request.statCategory];
      const regionName = GWANGJU_REGION_NAMES[request.regionCode] || request.regionCode;
      const targetPeriod = this.formatTargetPeriod(
        request.targetYear,
        request.targetMonth,
        request.targetQuarter,
        request.periodType
      );

      const title = template.titleTemplate
        .replace("{region}", regionName)
        .replace("{period}", targetPeriod);

      const description = template.descriptionTemplate
        .replace("{region}", regionName)
        .replace("{period}", targetPeriod);

      // 2. 예측 게임 생성
      const predictionId = crypto.randomUUID();
      const linkId = crypto.randomUUID();
      const now = new Date();

      // 3. forum_prediction_links 테이블에 연계 정보 저장
      const linkResult = await this.forumPredictionLinkRepository.save({
        id: linkId,
        postId: request.postId,
        predictionId: predictionId,
        statCategory: request.statCategory,
        regionCode: request.regionCode,
        periodType: request.periodType,
        targetYear: request.targetYear,
        targetMonth: request.targetMonth,
        targetQuarter: request.targetQuarter,
        createdAt: now,
      });

      if (!linkResult.success) {
        const failedResult = linkResult as { success: false; error: Error };
        return { success: false, error: failedResult.error };
      }

      // 4. prediction.predictions 테이블에 예측 게임 저장
      const predictionResult = await this.predictionRepository.create({
        id: predictionId,
        title,
        description,
        category: "DEMOGRAPHIC",
        status: "OPEN",
        creatorId: request.creatorId,
        rangeMin: request.rangeMin,
        rangeMax: request.rangeMax,
        rangeStep: request.rangeStep,
        minBetPmp: request.minBetPmp,
        maxBetPmp: request.maxBetPmp,
        deadline: request.deadline,
        metadata: {
          statCategory: request.statCategory,
          regionCode: request.regionCode,
          periodType: request.periodType,
          targetYear: request.targetYear,
          targetMonth: request.targetMonth,
          targetQuarter: request.targetQuarter,
          forumPostId: request.postId,
          unit: template.unit,
        },
        createdAt: now,
      });

      if (!predictionResult.success) {
        // Rollback link
        await this.forumPredictionLinkRepository.delete(linkId);
        const failedPrediction = predictionResult as { success: false; error: Error };
        return { success: false, error: failedPrediction.error };
      }

      return {
        success: true,
        data: {
          predictionId,
          postId: request.postId,
          linkId,
          title,
          statCategory: request.statCategory,
          regionCode: request.regionCode,
          targetPeriod,
          rangeDescription: `${request.rangeMin}${template.unit} ~ ${request.rangeMax}${template.unit} (${request.rangeStep}${template.unit} 단위)`,
          deadline: request.deadline,
          createdAt: now,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error("Unknown error"),
      };
    }
  }

  /**
   * 기본 템플릿으로 예측 게임 생성 (편의 메서드)
   */
  async createWithDefaults(
    postId: PostId,
    statCategory: StatCategory,
    regionCode: string,
    targetYear: number,
    targetMonth: number,
    creatorId: UserId,
    deadline: Date
  ): Promise<Result<CreatePredictionFromForumResult>> {
    const template = DEMOGRAPHIC_PREDICTION_TEMPLATES[statCategory];

    return this.execute({
      postId,
      statCategory,
      regionCode,
      periodType: PeriodType.MONTHLY,
      targetYear,
      targetMonth,
      rangeMin: template.defaultRange.min,
      rangeMax: template.defaultRange.max,
      rangeStep: template.defaultRange.step,
      minBetPmp: template.defaultBetRange.minPmp,
      maxBetPmp: template.defaultBetRange.maxPmp,
      deadline,
      creatorId,
    });
  }

  private formatTargetPeriod(
    year: number,
    month?: number,
    quarter?: number,
    periodType?: PeriodType
  ): string {
    switch (periodType) {
      case PeriodType.MONTHLY:
        return `${year}년 ${month}월`;
      case PeriodType.QUARTERLY:
        return `${year}년 ${quarter}분기`;
      case PeriodType.YEARLY:
        return `${year}년`;
      default:
        return month ? `${year}년 ${month}월` : `${year}년`;
    }
  }
}

/**
 * Forum-Prediction Link Repository Interface
 */
export interface IForumPredictionLinkRepository {
  save(link: ForumPredictionLink): Promise<Result<void>>;
  findByPostId(postId: PostId): Promise<Result<ForumPredictionLink[]>>;
  findByPredictionId(predictionId: string): Promise<Result<ForumPredictionLink | null>>;
  delete(id: string): Promise<Result<void>>;
}

/**
 * Forum-Prediction Link Entity
 */
export interface ForumPredictionLink {
  id: string;
  postId: PostId;
  predictionId: string;
  statCategory: StatCategory;
  regionCode: string;
  periodType: PeriodType;
  targetYear: number;
  targetMonth?: number;
  targetQuarter?: number;
  createdAt: Date;
}

/**
 * Prediction Repository Interface (Simplified)
 */
export interface IPredictionRepository {
  create(prediction: PredictionCreateData): Promise<Result<void>>;
  findById(id: string): Promise<Result<PredictionData | null>>;
  updateStatus(id: string, status: string): Promise<Result<void>>;
  settle(id: string, actualValue: number): Promise<Result<void>>;
}

export interface PredictionCreateData {
  id: string;
  title: string;
  description: string;
  category: string;
  status: string;
  creatorId: UserId;
  rangeMin: number;
  rangeMax: number;
  rangeStep: number;
  minBetPmp: number;
  maxBetPmp: number;
  deadline: Date;
  metadata: Record<string, unknown>;
  createdAt: Date;
}

export interface PredictionData {
  id: string;
  title: string;
  description: string;
  status: string;
  actualValue?: number;
  settledAt?: Date;
}
