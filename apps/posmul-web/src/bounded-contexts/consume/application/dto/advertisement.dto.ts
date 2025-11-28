import { z } from "zod";

import { AdvertisementCategory } from "../../domain/value-objects/investment-value-objects";

// Advertisement 관련 DTO
export const CreateAdvertisementRequestSchema = z.object({
  title: z
    .string()
    .min(1, "광고 제목은 필수입니다")
    .max(100, "광고 제목은 100자 이하여야 합니다"),
  description: z
    .string()
    .min(1, "광고 설명은 필수입니다")
    .max(1000, "광고 설명은 1000자 이하여야 합니다"),
  category: z.nativeEnum(AdvertisementCategory, {
    errorMap: () => new Error("유효한 카테고리를 선택해주세요"),
  }),
  content: z
    .object({
      imageUrl: z.string().url("유효한 이미지 URL을 입력해주세요").optional(),
      videoUrl: z.string().url("유효한 비디오 URL을 입력해주세요").optional(),
      text: z
        .string()
        .max(2000, "텍스트 내용은 2000자 이하여야 합니다")
        .optional(),
    })
    .refine(
      (data) => data.imageUrl || data.videoUrl || data.text,
      new Error("이미지, 비디오, 텍스트 중 최소 하나는 필수입니다")
    ),
  viewingDuration: z
    .number()
    .min(5, "최소 시청 시간은 5초입니다")
    .max(300, "최대 시청 시간은 300초입니다"),
  rewardRate: z
    .number()
    .min(0, "보상률은 0% 이상이어야 합니다")
    .max(50, "보상률은 50% 이하여야 합니다"),
  targetAudience: z
    .object({
      ageGroups: z.array(z.string()).optional(),
      interests: z.array(z.string()).optional(),
      regions: z.array(z.string()).optional(),
    })
    .optional(),
  budget: z.number().min(0, "예산은 0원 이상이어야 합니다"),
  maxViews: z
    .number()
    .min(1, "최대 시청 횟수는 1회 이상이어야 합니다")
    .optional(),
});

export const UpdateAdvertisementRequestSchema =
  CreateAdvertisementRequestSchema.partial().extend({
    id: z.string().min(1, "광고 ID는 필수입니다"),
  });

export const AdvertisementListRequestSchema = z.object({
  category: z.nativeEnum(AdvertisementCategory).optional(),
  status: z.string().optional(),
  advertiserId: z.string().optional(),
  isActive: z.boolean().optional(),
  limit: z.number().min(1).max(100).default(20),
  offset: z.number().min(0).default(0),
  search: z.string().optional(),
});

export const WatchAdvertisementRequestSchema = z.object({
  advertisementId: z.string().min(1, "광고 ID는 필수입니다"),
  watchedDuration: z.number().min(1, "시청 시간은 1초 이상이어야 합니다"),
});

export const AdvertisementResponseSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  category: z.nativeEnum(AdvertisementCategory),
  status: z.string(),
  content: z.object({
    imageUrl: z.string().optional(),
    videoUrl: z.string().optional(),
    text: z.string().optional(),
  }),
  viewingDuration: z.number(),
  rewardRate: z.object({
    rate: z.number(),
    type: z.string(),
  }),
  targetAudience: z
    .object({
      ageGroups: z.array(z.string()).optional(),
      interests: z.array(z.string()).optional(),
      regions: z.array(z.string()).optional(),
    })
    .optional(),
  budget: z.number(),
  maxViews: z.number().optional(),
  currentViews: z.number(),
  totalRewards: z.number(),
  advertiserId: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
  publishedAt: z.date().optional(),
});

export const AdvertisementListResponseSchema = z.object({
  advertisements: z.array(AdvertisementResponseSchema),
  total: z.number(),
  limit: z.number(),
  offset: z.number(),
});

export const WatchAdvertisementResponseSchema = z.object({
  success: z.boolean(),
  rewardEarned: z.number(),
  totalWatchTime: z.number(),
  isCompleted: z.boolean(),
});

// 타입 추론
export type CreateAdvertisementRequest = z.infer<
  typeof CreateAdvertisementRequestSchema
>;
export type UpdateAdvertisementRequest = z.infer<
  typeof UpdateAdvertisementRequestSchema
>;
export type AdvertisementListRequest = z.infer<
  typeof AdvertisementListRequestSchema
>;
export type WatchAdvertisementRequest = z.infer<
  typeof WatchAdvertisementRequestSchema
>;
export type AdvertisementResponse = z.infer<typeof AdvertisementResponseSchema>;
export type AdvertisementListResponse = z.infer<
  typeof AdvertisementListResponseSchema
>;
export type WatchAdvertisementResponse = z.infer<
  typeof WatchAdvertisementResponseSchema
>;
