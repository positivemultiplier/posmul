/**
 * Reward Forum Activity Use Case
 *
 * Forum 활동(토론, 댓글, 브레인스토밍 등)에 대한 PMP 보상 지급
 * Economy Bounded Context의 AcquirePmpAmountUseCase와 연동
 */
import { Result } from "@posmul/auth-economy-sdk";

import {
  AcquirePmpAmountUseCase,
  PmpAmountAcquisitionRequest,
} from "../../../economy/application/use-cases/acquire-pmp.use-case";
import { UserId } from "../../../auth/domain/value-objects/user-value-objects";

/**
 * Forum 활동 유형
 */
export type ForumActivityType =
  | "debate_post" // 토론 글 작성
  | "debate_comment" // 토론 댓글 작성
  | "brainstorm_idea" // 브레인스토밍 아이디어 제안
  | "news_read" // 뉴스 읽기
  | "budget_vote" // 예산 투표 참여
  | "quality_content"; // 우수 콘텐츠 선정

/**
 * PMP 보상 규칙
 * 일일 한도와 함께 정의
 */
export interface PmpRewardRule {
  readonly baseAmount: number;
  readonly dailyLimit: number;
  readonly description: string;
}

/**
 * Forum PMP 보상 규칙 상수
 */
export const FORUM_PMP_REWARDS: Record<ForumActivityType, PmpRewardRule> = {
  debate_post: {
    baseAmount: 100,
    dailyLimit: 3,
    description: "토론 글 작성",
  },
  debate_comment: {
    baseAmount: 20,
    dailyLimit: 10,
    description: "토론 댓글 작성",
  },
  brainstorm_idea: {
    baseAmount: 150,
    dailyLimit: 2,
    description: "브레인스토밍 아이디어 제안",
  },
  news_read: {
    baseAmount: 5,
    dailyLimit: 20,
    description: "뉴스 읽기",
  },
  budget_vote: {
    baseAmount: 50,
    dailyLimit: 5,
    description: "예산 투표 참여",
  },
  quality_content: {
    baseAmount: 200,
    dailyLimit: 1,
    description: "우수 콘텐츠 선정",
  },
};

/**
 * 일일 최대 PMP 획득량
 * (3*100) + (10*20) + (2*150) + (20*5) + (5*50) + (1*200) = 300 + 200 + 300 + 100 + 250 + 200 = 1,350 PMP
 */
export const DAILY_MAX_PMP = 1350;

/**
 * Forum 활동 보상 요청
 */
export interface RewardForumActivityRequest {
  readonly userId: UserId;
  readonly activityType: ForumActivityType;
  readonly contentId: string;
  readonly contentTitle?: string;
  readonly qualityScore?: number; // 0-10
  readonly timestamp?: Date;
}

/**
 * Forum 활동 보상 결과
 */
export interface RewardForumActivityResult {
  readonly success: boolean;
  readonly pmpEarned: number;
  readonly dailyRemaining: number;
  readonly dailyLimitReached: boolean;
  readonly message: string;
  readonly activityLogId?: string;
}

/**
 * Forum Activity Log 저장소 인터페이스
 */
export interface IForumActivityLogRepository {
  /**
   * 활동 로그 저장
   */
  saveActivityLog(
    log: ForumActivityLog
  ): Promise<Result<{ id: string }>>;

  /**
   * 사용자의 오늘 활동 횟수 조회
   */
  getTodayActivityCount(
    userId: UserId,
    activityType: ForumActivityType
  ): Promise<Result<number>>;

  /**
   * 사용자의 오늘 총 PMP 획득량 조회
   */
  getTodayTotalPmpEarned(
    userId: UserId
  ): Promise<Result<number>>;
}

/**
 * Forum 활동 로그
 */
export interface ForumActivityLog {
  readonly userId: UserId;
  readonly activityType: ForumActivityType;
  readonly contentId: string;
  readonly pmpEarned: number;
  readonly description: string;
  readonly metadata?: Record<string, unknown>;
  readonly createdAt: Date;
}

/**
 * Reward Forum Activity Use Case
 *
 * Forum 활동에 대한 PMP 보상을 지급하는 UseCase
 * - 활동 유형별 PMP 지급
 * - 일일 한도 체크
 * - Economy 도메인과 연동
 */
export class RewardForumActivityUseCase {
  constructor(
    private readonly activityLogRepository: IForumActivityLogRepository,
    private readonly acquirePmpUseCase: AcquirePmpAmountUseCase
  ) {}

  async execute(
    request: RewardForumActivityRequest
  ): Promise<RewardForumActivityResult> {
    const timestamp = request.timestamp ?? new Date();

    try {
      const fail = (params: {
        message: string;
        dailyRemaining: number;
        dailyLimitReached: boolean;
      }): RewardForumActivityResult => ({
        success: false,
        pmpEarned: 0,
        dailyRemaining: params.dailyRemaining,
        dailyLimitReached: params.dailyLimitReached,
        message: params.message,
      });

      const getRewardRule = () => {
        const rule = FORUM_PMP_REWARDS[request.activityType];
        if (!rule) {
          return {
            ok: false as const,
            response: fail({
              message: `Unknown activity type: ${request.activityType}`,
              dailyRemaining: 0,
              dailyLimitReached: false,
            }),
          };
        }
        return { ok: true as const, rule };
      };

      const getTodayCount = async (rewardRule: (typeof FORUM_PMP_REWARDS)[ForumActivityType]) => {
        const todayCountResult =
          await this.activityLogRepository.getTodayActivityCount(
            request.userId,
            request.activityType
          );

        if (!todayCountResult.success) {
          return {
            ok: false as const,
            response: fail({
              message: "Failed to check daily activity count",
              dailyRemaining: rewardRule.dailyLimit,
              dailyLimitReached: false,
            }),
          };
        }

        const todayCount = todayCountResult.data;
        const remaining = Math.max(0, rewardRule.dailyLimit - todayCount);

        if (todayCount >= rewardRule.dailyLimit) {
          return {
            ok: false as const,
            response: fail({
              message: `일일 ${rewardRule.description} 한도(${rewardRule.dailyLimit}회)에 도달했습니다.`,
              dailyRemaining: 0,
              dailyLimitReached: true,
            }),
          };
        }

        return { ok: true as const, todayCount, remaining };
      };

      const checkDailyMax = async () => {
        const todayTotalResult =
          await this.activityLogRepository.getTodayTotalPmpEarned(request.userId);

        if (todayTotalResult.success && todayTotalResult.data >= DAILY_MAX_PMP) {
          return {
            ok: false as const,
            response: fail({
              message: `일일 최대 PMP 획득량(${DAILY_MAX_PMP} PMP)에 도달했습니다.`,
              dailyRemaining: 0,
              dailyLimitReached: true,
            }),
          };
        }

        return { ok: true as const };
      };

      const calculatePmpAmount = (
        rewardRule: (typeof FORUM_PMP_REWARDS)[ForumActivityType]
      ) => {
        const baseAmount = rewardRule.baseAmount;
        if (!request.qualityScore || request.qualityScore <= 7) return baseAmount;

        const bonusMultiplier = 1 + ((request.qualityScore - 7) / 3) * 0.5;
        return Math.floor(baseAmount * bonusMultiplier);
      };

      const buildPmpRequest = (
        rewardRule: (typeof FORUM_PMP_REWARDS)[ForumActivityType],
        pmpAmount: number
      ): PmpAmountAcquisitionRequest => ({
        userId: request.userId,
        activityType: "civic_participation",
        activityData: {
          amount: pmpAmount,
          description: `Forum ${rewardRule.description}: ${request.contentTitle || request.contentId}`,
          socialImpact: request.qualityScore ? request.qualityScore * 10 : 0,
        },
        timestamp,
      });

      // 1. 보상 규칙 조회
      const rewardRuleResult = getRewardRule();
      if (!rewardRuleResult.ok) return rewardRuleResult.response;
      const rewardRule = rewardRuleResult.rule;

      // 2. 오늘 해당 활동 횟수 체크
      const todayCountResult = await getTodayCount(rewardRule);
      if (!todayCountResult.ok) return todayCountResult.response;
      const remaining = todayCountResult.remaining;

      // 4. 오늘 총 PMP 획득량 체크
      const dailyMaxResult = await checkDailyMax();
      if (!dailyMaxResult.ok) return dailyMaxResult.response;

      // 5. PMP 보상 계산 (품질 점수에 따른 보너스)
      const pmpAmount = calculatePmpAmount(rewardRule);

      // 6. Economy 도메인을 통한 PMP 지급
      const pmpRequest = buildPmpRequest(rewardRule, pmpAmount);

      const pmpResult = await this.acquirePmpUseCase.execute(pmpRequest);

      if (!pmpResult.success) {
        return {
          success: false,
          pmpEarned: 0,
          dailyRemaining: remaining,
          dailyLimitReached: false,
          message: pmpResult.message,
        };
      }

      // 7. 활동 로그 저장
      const activityLog: ForumActivityLog = {
        userId: request.userId,
        activityType: request.activityType,
        contentId: request.contentId,
        pmpEarned: pmpAmount,
        description: `${rewardRule.description}: ${request.contentTitle || request.contentId}`,
        metadata: {
          qualityScore: request.qualityScore,
          bonusApplied: request.qualityScore && request.qualityScore > 7,
        },
        createdAt: timestamp,
      };

      const logResult = await this.activityLogRepository.saveActivityLog(activityLog);

      return {
        success: true,
        pmpEarned: pmpAmount,
        dailyRemaining: remaining - 1,
        dailyLimitReached: remaining - 1 <= 0,
        message: `${pmpAmount} PMP를 획득했습니다! (${rewardRule.description})`,
        activityLogId: logResult.success ? logResult.data.id : undefined,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      return {
        success: false,
        pmpEarned: 0,
        dailyRemaining: 0,
        dailyLimitReached: false,
        message: `Failed to reward forum activity: ${errorMessage}`,
      };
    }
  }

  /**
   * 사용자의 오늘 활동 요약 조회
   */
  async getDailySummary(
    userId: UserId
  ): Promise<Result<{
    activities: Record<ForumActivityType, { count: number; remaining: number; pmpEarned: number }>;
    totalPmpEarned: number;
    dailyMaxRemaining: number;
  }>> {
    try {
      const activities = {} as Record<
        ForumActivityType,
        { count: number; remaining: number; pmpEarned: number }
      >;

      // 각 활동 유형별 오늘 횟수 조회
      for (const [activityType, rule] of Object.entries(FORUM_PMP_REWARDS)) {
        const countResult = await this.activityLogRepository.getTodayActivityCount(
          userId,
          activityType as ForumActivityType
        );

        const count = countResult.success ? countResult.data : 0;
        activities[activityType as ForumActivityType] = {
          count,
          remaining: Math.max(0, rule.dailyLimit - count),
          pmpEarned: count * rule.baseAmount,
        };
      }

      // 오늘 총 PMP 획득량
      const totalResult = await this.activityLogRepository.getTodayTotalPmpEarned(userId);
      const totalPmpEarned = totalResult.success ? totalResult.data : 0;

      return {
        success: true,
        data: {
          activities,
          totalPmpEarned,
          dailyMaxRemaining: Math.max(0, DAILY_MAX_PMP - totalPmpEarned),
        },
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      return {
        success: false,
        error: new Error(`Failed to get daily summary: ${errorMessage}`),
      };
    }
  }
}
