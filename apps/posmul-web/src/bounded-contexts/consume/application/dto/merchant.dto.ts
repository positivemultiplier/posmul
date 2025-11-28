import { z } from "zod";

import { MerchantCategory } from "../../domain/value-objects/investment-value-objects";

// Merchant 관련 DTO
export const CreateMerchantRequestSchema = z.object({
  name: z
    .string()
    .min(1, "상점명은 필수입니다")
    .max(100, "상점명은 100자 이하여야 합니다"),
  description: z
    .string()
    .min(1, "상점 설명은 필수입니다")
    .max(500, "상점 설명은 500자 이하여야 합니다"),
  category: z.nativeEnum(MerchantCategory, {
    errorMap: () => new Error("유효한 카테고리를 선택해주세요"),
  }),
  location: z.object({
    region: z.string().min(1, "지역은 필수입니다"),
    city: z.string().min(1, "도시는 필수입니다"),
    district: z.string().optional(),
    address: z.string().min(1, "주소는 필수입니다"),
    postalCode: z.string().optional(),
  }),
  contactInfo: z.object({
    phone: z.string().min(1, "전화번호는 필수입니다"),
    email: z.string().email("유효한 이메일을 입력해주세요").optional(),
    website: z.string().url("유효한 웹사이트 URL을 입력해주세요").optional(),
  }),
  businessHours: z.object({
    open: z
      .string()
      .regex(
        /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/,
        "올바른 시간 형식(HH:MM)을 입력해주세요"
      ),
    close: z
      .string()
      .regex(
        /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/,
        "올바른 시간 형식(HH:MM)을 입력해주세요"
      ),
    closedDays: z.array(z.string()).optional(),
  }),
  rewardRate: z
    .number()
    .min(0, "보상률은 0% 이상이어야 합니다")
    .max(50, "보상률은 50% 이하여야 합니다"),
});

export const UpdateMerchantRequestSchema =
  CreateMerchantRequestSchema.partial().extend({
    id: z.string().min(1, "상점 ID는 필수입니다"),
  });

export const MerchantListRequestSchema = z.object({
  category: z.nativeEnum(MerchantCategory).optional(),
  region: z.string().optional(),
  city: z.string().optional(),
  isActive: z.boolean().optional(),
  limit: z.number().min(1).max(100).default(20),
  offset: z.number().min(0).default(0),
  search: z.string().optional(),
});

export const MerchantResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  category: z.nativeEnum(MerchantCategory),
  status: z.string(),
  location: z.object({
    region: z.string(),
    city: z.string(),
    district: z.string().optional(),
    address: z.string(),
    postalCode: z.string().optional(),
  }),
  contactInfo: z.object({
    phone: z.string(),
    email: z.string().optional(),
    website: z.string().optional(),
  }),
  businessHours: z.object({
    open: z.string(),
    close: z.string(),
    closedDays: z.array(z.string()).optional(),
  }),
  rewardRate: z.object({
    rate: z.number(),
    type: z.string(),
  }),
  qrCode: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
  activatedAt: z.date().optional(),
});

export const MerchantListResponseSchema = z.object({
  merchants: z.array(MerchantResponseSchema),
  total: z.number(),
  limit: z.number(),
  offset: z.number(),
});

// 타입 추론
export type CreateMerchantRequest = z.infer<typeof CreateMerchantRequestSchema>;
export type UpdateMerchantRequest = z.infer<typeof UpdateMerchantRequestSchema>;
export type MerchantListRequest = z.infer<typeof MerchantListRequestSchema>;
export type MerchantResponse = z.infer<typeof MerchantResponseSchema>;
export type MerchantListResponse = z.infer<typeof MerchantListResponseSchema>;
