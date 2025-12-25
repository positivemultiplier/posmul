import { z } from "zod";

export const predictionTypeInputSchema = z.enum(["binary", "multiple", "numeric"]);

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
  })
  .refine((data) => data.maximumStake >= data.minimumStake, {
    message: "최대 참여 금액은 최소 참여 금액 이상이어야 합니다.",
    path: ["maximumStake"],
  });

export type UserProposedPredictionGameRequest = z.infer<
  typeof userProposedPredictionGameRequestSchema
>;
