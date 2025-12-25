"use server";

import { z } from "zod";

// 직접 기부 스키마
const directDonationSchema = z.object({
  recipientType: z.enum(["individual", "family", "organization"]),
  category: z.enum(["의료", "교육", "주거", "식품", "의류"]),
  amount: z.number().min(1000, "최소 기부 금액은 1,000 PmcAmount입니다"),
  message: z.string().optional(),
  isAnonymous: z.boolean().default(false),
  recipientInfo: z.string().min(1, "수혜자 정보를 입력해주세요"),
});

// 기관 기부 스키마
const instituteDonationSchema = z.object({
  instituteId: z.string().min(1, "기관을 선택해주세요"),
  category: z.enum([
    "긴급구호",
    "아동복지",
    "국제구호",
    "환경보호",
    "동물보호",
  ]),
  amount: z.number().min(5000, "기관 기부 최소 금액은 5,000 PmcAmount입니다"),
  message: z.string().optional(),
  isAnonymous: z.boolean().default(false),
  projectId: z.string().optional(),
});

// 오피니언 리더 기부 스키마
const opinionLeaderDonationSchema = z.object({
  leaderId: z.string().min(1, "오피니언 리더를 선택해주세요"),
  category: z.enum(["환경", "복지", "과학", "인권", "교육", "문화"]),
  amount: z
    .number()
    .min(10000, "오피니언 리더 기부 최소 금액은 10,000 PmcAmount입니다"),
  message: z.string().optional(),
  isAnonymous: z.boolean().default(false),
  campaignId: z.string().optional(),
});

// 직접 기부 Server Action
export async function createDirectDonation(formData: FormData) {
  try {
    const rawData = {
      recipientType: formData.get("recipientType") as string,
      category: formData.get("category") as string,
      amount: Number(formData.get("amount")),
      message: (formData.get("message") as string) || undefined,
      isAnonymous: formData.get("isAnonymous") === "true",
      recipientInfo: formData.get("recipientInfo") as string,
    };

    // 데이터 검증
    const validatedData = directDonationSchema.parse(rawData);

    // TODO: MCP를 통한 처리
    // 1. 사용자 PmcAmount 잔액 확인
    // 2. 기부 기록 저장
    // 3. PmcAmount 차감 및 Money Wave 처리

    return {
      success: true,
      message: "직접 기부가 완료되었습니다!",
      data: {
        donationId: "direct-" + Date.now(),
        amount: validatedData.amount,
        category: validatedData.category,
      },
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors.map((err) => err.message).join(", ");
      return {
        success: false,
        message: `입력 오류: ${errorMessages}`,
      };
    }

    return {
      success: false,
      message: "기부 처리에 실패했습니다. 다시 시도해주세요.",
    };
  }
}

// 기관 기부 Server Action
export async function createInstituteDonation(formData: FormData) {
  try {
    const rawData = {
      instituteId: formData.get("instituteId") as string,
      category: formData.get("category") as string,
      amount: Number(formData.get("amount")),
      message: (formData.get("message") as string) || undefined,
      isAnonymous: formData.get("isAnonymous") === "true",
      projectId: (formData.get("projectId") as string) || undefined,
    };

    const validatedData = instituteDonationSchema.parse(rawData);

    // TODO: MCP를 통한 처리

    return {
      success: true,
      message: "기관 기부가 완료되었습니다!",
      data: {
        donationId: "institute-" + Date.now(),
        amount: validatedData.amount,
        institute: validatedData.instituteId,
      },
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors.map((err) => err.message).join(", ");
      return {
        success: false,
        message: `입력 오류: ${errorMessages}`,
      };
    }

    return {
      success: false,
      message: "기관 기부 처리에 실패했습니다.",
    };
  }
}

// 오피니언 리더 기부 Server Action
export async function createOpinionLeaderDonation(formData: FormData) {
  try {
    const rawData = {
      leaderId: formData.get("leaderId") as string,
      category: formData.get("category") as string,
      amount: Number(formData.get("amount")),
      message: (formData.get("message") as string) || undefined,
      isAnonymous: formData.get("isAnonymous") === "true",
      campaignId: (formData.get("campaignId") as string) || undefined,
    };

    const validatedData = opinionLeaderDonationSchema.parse(rawData);

    // TODO: MCP를 통한 처리

    return {
      success: true,
      message: "오피니언 리더 기부가 완료되었습니다!",
      data: {
        donationId: "leader-" + Date.now(),
        amount: validatedData.amount,
        leader: validatedData.leaderId,
      },
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors.map((err) => err.message).join(", ");
      return {
        success: false,
        message: `입력 오류: ${errorMessages}`,
      };
    }

    return {
      success: false,
      message: "오피니언 리더 기부 처리에 실패했습니다.",
    };
  }
}
