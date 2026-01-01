import { z } from "zod";

export const predictionTypeInputSchema = z.enum(["binary", "multiple", "numeric"]);

// 정산 유형
export const settlementTypeSchema = z.enum(["auto", "semi_auto", "manual"]);
export const settlementSourceTypeSchema = z.enum(["football_data", "kosis", "thesportsdb", "manual"]);

const optionsSchema = z
  .array(z.string())
  .transform((values) =>
    values
      .map((value) => (typeof value === "string" ? value.trim() : ""))
      .filter((value) => value.length > 0)
  )
  .refine((values) => values.length >= 2, {
    message: "최소 2개의 선택지가 필요합니다.",
  });

// 정산 소스 설정 (optional)
const settlementSourceConfigSchema = z.object({
  externalId: z.string().optional(), // 외부 API의 match_id 등
  optionMapping: z.record(z.string()).optional(), // API 결과 → 옵션 매핑
}).optional();

export const userProposedPredictionGameRequestSchema = z
  .object({
    title: z.string().min(10, "제목은 10자 이상이어야 합니다."),
    description: z.string().min(20, "설명은 20자 이상이어야 합니다."),
    predictionType: predictionTypeInputSchema,
    options: optionsSchema,
    endTime: z.string().min(1, "종료 시간을 선택해주세요."),
    settlementTime: z.string().min(1, "정산 시간을 선택해주세요."),
    minimumStake: z
      .number()
      .min(1, "최소 참여 금액은 1 PmpAmount 이상이어야 합니다."),
    maximumStake: z
      .number()
      .min(1, "최대 참여 금액은 1 PmpAmount 이상이어야 합니다."),
    // 정산 관련 필드
    settlementType: settlementTypeSchema.default("manual"),
    settlementSourceType: settlementSourceTypeSchema.default("manual"),
    settlementSourceConfig: settlementSourceConfigSchema,
  })
  .refine((data) => data.maximumStake >= data.minimumStake, {
    message: "최대 참여 금액은 최소 참여 금액 이상이어야 합니다.",
    path: ["maximumStake"],
  });

export type UserProposedPredictionGameRequest = z.infer<
  typeof userProposedPredictionGameRequestSchema
>;

export type SettlementType = z.infer<typeof settlementTypeSchema>;
export type SettlementSourceType = z.infer<typeof settlementSourceTypeSchema>;
