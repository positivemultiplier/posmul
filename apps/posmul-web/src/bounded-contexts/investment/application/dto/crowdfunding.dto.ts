import { z } from "zod";
import { FundingCategory } from "../../domain/value-objects/investment-value-objects";

// CrowdFunding 관련 DTO
export const CreateCrowdFundingRequestSchema = z
  .object({
    title: z
      .string()
      .min(1, "프로젝트 제목은 필수입니다")
      .max(100, "프로젝트 제목은 100자 이하여야 합니다"),
    description: z
      .string()
      .min(1, "프로젝트 설명은 필수입니다")
      .max(2000, "프로젝트 설명은 2000자 이하여야 합니다"),
    category: z.nativeEnum(FundingCategory, {
      errorMap: () => ({ message: "유효한 카테고리를 선택해주세요" }),
    }),
    targetAmount: z
      .number()
      .min(10000, "목표 금액은 최소 10,000원입니다")
      .max(100000000, "목표 금액은 최대 1억원입니다"),
    startDate: z
      .date()
      .refine(
        (date) => date > new Date(),
        "시작일은 현재 시간보다 이후여야 합니다"
      ),
    endDate: z.date(),
    content: z
      .object({
        images: z
          .array(z.string().url("유효한 이미지 URL을 입력해주세요"))
          .optional(),
        videos: z
          .array(z.string().url("유효한 비디오 URL을 입력해주세요"))
          .optional(),
        documents: z
          .array(z.string().url("유효한 문서 URL을 입력해주세요"))
          .optional(),
      })
      .optional(),
    rewardTiers: z
      .array(
        z.object({
          amount: z.number().min(1000, "최소 투자 금액은 1,000원입니다"),
          description: z
            .string()
            .min(1, "리워드 설명은 필수입니다")
            .max(500, "리워드 설명은 500자 이하여야 합니다"),
          estimatedDelivery: z.date().optional(),
          limitQuantity: z.number().min(1).optional(),
        })
      )
      .min(1, "최소 1개의 리워드 티어는 필요합니다"),
  })
  .refine((data) => data.endDate > data.startDate, {
    message: "종료일은 시작일보다 이후여야 합니다",
    path: ["endDate"],
  });

export const UpdateCrowdFundingRequestSchema = z.object({
  id: z.string().min(1, "크라우드 펀딩 ID는 필수입니다"),
  title: z
    .string()
    .min(1, "프로젝트 제목은 필수입니다")
    .max(100, "프로젝트 제목은 100자 이하여야 합니다")
    .optional(),
  description: z
    .string()
    .min(1, "프로젝트 설명은 필수입니다")
    .max(2000, "프로젝트 설명은 2000자 이하여야 합니다")
    .optional(),
  category: z
    .nativeEnum(FundingCategory, {
      errorMap: () => ({ message: "유효한 카테고리를 선택해주세요" }),
    })
    .optional(),
  targetAmount: z
    .number()
    .min(10000, "목표 금액은 최소 10,000원입니다")
    .max(100000000, "목표 금액은 최대 1억원입니다")
    .optional(),
  content: z
    .object({
      images: z
        .array(z.string().url("유효한 이미지 URL을 입력해주세요"))
        .optional(),
      videos: z
        .array(z.string().url("유효한 비디오 URL을 입력해주세요"))
        .optional(),
      documents: z
        .array(z.string().url("유효한 문서 URL을 입력해주세요"))
        .optional(),
    })
    .optional(),
  rewardTiers: z
    .array(
      z.object({
        amount: z.number().min(1000, "최소 투자 금액은 1,000원입니다"),
        description: z
          .string()
          .min(1, "리워드 설명은 필수입니다")
          .max(500, "리워드 설명은 500자 이하여야 합니다"),
        estimatedDelivery: z.date().optional(),
        limitQuantity: z.number().min(1).optional(),
      })
    )
    .optional(),
});

export const CrowdFundingListRequestSchema = z.object({
  category: z.nativeEnum(FundingCategory).optional(),
  status: z.string().optional(),
  creatorId: z.string().optional(),
  isActive: z.boolean().optional(),
  minAmount: z.number().min(0).optional(),
  maxAmount: z.number().min(0).optional(),
  limit: z.number().min(1).max(100).default(20),
  offset: z.number().min(0).default(0),
  search: z.string().optional(),
  sortBy: z
    .enum(["created", "amount", "progress", "endDate"])
    .default("created"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export const InvestCrowdFundingRequestSchema = z.object({
  crowdFundingId: z.string().min(1, "크라우드 펀딩 ID는 필수입니다"),
  amount: z
    .number()
    .min(1000, "최소 투자 금액은 1,000원입니다")
    .max(10000000, "최대 투자 금액은 1,000만원입니다"),
  rewardTierId: z.string().min(1, "리워드 티어 선택은 필수입니다"),
});

export const CrowdFundingResponseSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  category: z.nativeEnum(FundingCategory),
  status: z.string(),
  targetAmount: z.number(),
  currentAmount: z.number(),
  investorCount: z.number(),
  startDate: z.date(),
  endDate: z.date(),
  content: z
    .object({
      images: z.array(z.string()).optional(),
      videos: z.array(z.string()).optional(),
      documents: z.array(z.string()).optional(),
    })
    .optional(),
  rewardTiers: z.array(
    z.object({
      id: z.string(),
      amount: z.number(),
      description: z.string(),
      estimatedDelivery: z.date().optional(),
      limitQuantity: z.number().optional(),
      currentInvestors: z.number(),
    })
  ),
  creatorId: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
  publishedAt: z.date().optional(),
  progressPercentage: z.number(),
  daysRemaining: z.number(),
});

export const CrowdFundingListResponseSchema = z.object({
  crowdFundings: z.array(CrowdFundingResponseSchema),
  total: z.number(),
  limit: z.number(),
  offset: z.number(),
});

export const InvestCrowdFundingResponseSchema = z.object({
  success: z.boolean(),
  investmentId: z.string(),
  rewardTier: z.object({
    id: z.string(),
    amount: z.number(),
    description: z.string(),
  }),
  estimatedReturn: z.number(),
});

// 타입 추론
export type CreateCrowdFundingRequest = z.infer<
  typeof CreateCrowdFundingRequestSchema
>;
export type UpdateCrowdFundingRequest = z.infer<
  typeof UpdateCrowdFundingRequestSchema
>;
export type CrowdFundingListRequest = z.infer<
  typeof CrowdFundingListRequestSchema
>;
export type InvestCrowdFundingRequest = z.infer<
  typeof InvestCrowdFundingRequestSchema
>;
export type CrowdFundingResponse = z.infer<typeof CrowdFundingResponseSchema>;
export type CrowdFundingListResponse = z.infer<
  typeof CrowdFundingListResponseSchema
>;
export type InvestCrowdFundingResponse = z.infer<
  typeof InvestCrowdFundingResponseSchema
>;
