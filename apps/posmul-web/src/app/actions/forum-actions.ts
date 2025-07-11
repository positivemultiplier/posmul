"use server";

import { z } from "zod";

// 브레인스토밍 세션 생성 스키마
const createBrainstormingSchema = z.object({
  title: z.string().min(5, "제목은 최소 5자 이상이어야 합니다"),
  description: z.string().min(20, "설명은 최소 20자 이상이어야 합니다"),
  category: z.enum(["혁신", "창업", "기술", "사회문제해결"]),
  tags: z.string().optional(),
  duration: z
    .number()
    .min(30, "최소 30분 이상의 세션이어야 합니다")
    .max(480, "최대 8시간까지 가능합니다"),
  maxParticipants: z
    .number()
    .min(3, "최소 3명 이상의 참여자가 필요합니다")
    .max(50, "최대 50명까지 참여 가능합니다"),
  requiredExpertise: z.string().optional(),
  rewardPool: z.number().min(1000, "최소 보상 풀은 1,000 PmpAmount입니다"),
});

// 토론 주제 생성 스키마
const createDebateSchema = z.object({
  title: z.string().min(10, "토론 제목은 최소 10자 이상이어야 합니다"),
  description: z.string().min(50, "토론 설명은 최소 50자 이상이어야 합니다"),
  category: z.enum(["정치", "경제", "사회", "문화", "기술"]),
  debateType: z.enum(["찬반토론", "다자토론", "패널토론"]),
  position: z.enum(["찬성", "반대", "중립"]).optional(),
  tags: z.string().optional(),
  duration: z
    .number()
    .min(60, "최소 1시간 이상의 토론이어야 합니다")
    .max(720, "최대 12시간까지 가능합니다"),
  maxParticipants: z
    .number()
    .min(2, "최소 2명 이상의 참여자가 필요합니다")
    .max(100, "최대 100명까지 참여 가능합니다"),
  rewardPool: z.number().min(2000, "토론 최소 보상 풀은 2,000 PmpAmount입니다"),
});

// 의견/댓글 작성 스키마
const createCommentSchema = z.object({
  sessionId: z.string().min(1, "세션 ID가 필요합니다"),
  content: z.string().min(10, "의견은 최소 10자 이상이어야 합니다"),
  parentCommentId: z.string().optional(),
  type: z.enum(["idea", "support", "counter", "question"]),
  attachments: z.string().optional(),
});

// 브레인스토밍 세션 생성 Server Action
export async function createBrainstormingSession(formData: FormData) {
  try {
    const rawData = {
      title: formData.get("title") as string,
      description: formData.get("description") as string,
      category: formData.get("category") as string,
      tags: (formData.get("tags") as string) || undefined,
      duration: Number(formData.get("duration")),
      maxParticipants: Number(formData.get("maxParticipants")),
      requiredExpertise:
        (formData.get("requiredExpertise") as string) || undefined,
      rewardPool: Number(formData.get("rewardPool")),
    };

    // 데이터 검증
    const validatedData = createBrainstormingSchema.parse(rawData);

    // TODO: MCP를 통한 처리
    // 1. 사용자 PmpAmount 잔액 확인 (보상 풀 설정)
    // 2. 브레인스토밍 세션 생성
    // 3. PmpAmount 예치 처리
    console.log("Creating brainstorming session:", validatedData);

    return {
      success: true,
      message: "브레인스토밍 세션이 생성되었습니다!",
      data: {
        sessionId: "brainstorm-" + Date.now(),
        title: validatedData.title,
        category: validatedData.category,
        rewardPool: validatedData.rewardPool,
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

    console.error("Failed to create brainstorming session:", error);
    return {
      success: false,
      message: "브레인스토밍 세션 생성에 실패했습니다.",
    };
  }
}

// 토론 주제 생성 Server Action
export async function createDebateTopic(formData: FormData) {
  try {
    const rawData = {
      title: formData.get("title") as string,
      description: formData.get("description") as string,
      category: formData.get("category") as string,
      debateType: formData.get("debateType") as string,
      position: (formData.get("position") as string) || undefined,
      tags: (formData.get("tags") as string) || undefined,
      duration: Number(formData.get("duration")),
      maxParticipants: Number(formData.get("maxParticipants")),
      rewardPool: Number(formData.get("rewardPool")),
    };

    const validatedData = createDebateSchema.parse(rawData);

    // TODO: MCP를 통한 처리
    console.log("Creating debate topic:", validatedData);

    return {
      success: true,
      message: "토론 주제가 생성되었습니다!",
      data: {
        debateId: "debate-" + Date.now(),
        title: validatedData.title,
        category: validatedData.category,
        rewardPool: validatedData.rewardPool,
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

    console.error("Failed to create debate topic:", error);
    return {
      success: false,
      message: "토론 주제 생성에 실패했습니다.",
    };
  }
}

// 의견/댓글 작성 Server Action
export async function createComment(formData: FormData) {
  try {
    const rawData = {
      sessionId: formData.get("sessionId") as string,
      content: formData.get("content") as string,
      parentCommentId: (formData.get("parentCommentId") as string) || undefined,
      type: formData.get("type") as string,
      attachments: (formData.get("attachments") as string) || undefined,
    };

    const validatedData = createCommentSchema.parse(rawData);

    // TODO: MCP를 통한 처리
    // 1. 세션 유효성 확인
    // 2. 의견 저장
    // 3. 품질 평가 시스템 트리거
    // 4. PmpAmount 보상 계산 (추후)
    console.log("Creating comment:", validatedData);

    return {
      success: true,
      message: "의견이 등록되었습니다!",
      data: {
        commentId: "comment-" + Date.now(),
        sessionId: validatedData.sessionId,
        type: validatedData.type,
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

    console.error("Failed to create comment:", error);
    return {
      success: false,
      message: "의견 등록에 실패했습니다.",
    };
  }
}

// 세션 참여 Server Action
export async function joinSession(formData: FormData) {
  try {
    const sessionId = formData.get("sessionId") as string;
    const sessionType = formData.get("sessionType") as string; // "brainstorming" | "debate"

    if (!sessionId || !sessionType) {
      return {
        success: false,
        message: "세션 정보가 누락되었습니다.",
      };
    }

    // TODO: MCP를 통한 처리
    // 1. 세션 존재 및 상태 확인
    // 2. 참여자 수 제한 확인
    // 3. 참여 기록 저장
    console.log("Joining session:", { sessionId, sessionType });

    return {
      success: true,
      message: "세션에 참여했습니다!",
      data: {
        sessionId,
        sessionType,
        joinedAt: new Date().toISOString(),
      },
    };
  } catch (error) {
    console.error("Failed to join session:", error);
    return {
      success: false,
      message: "세션 참여에 실패했습니다.",
    };
  }
}
