"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

// 예측 게임 생성 스키마
const createPredictionGameSchema = z.object({
  title: z.string().min(5, "제목은 최소 5자 이상이어야 합니다"),
  description: z.string().min(10, "설명은 최소 10자 이상이어야 합니다"),
  category: z.enum(["sports", "entertainment", "politics", "user-suggestions"]),
  predictionType: z.enum(["binary", "wdl", "ranking"]),
  options: z.string().min(1, "예측 옵션을 입력해주세요"),
  minimumStake: z
    .number()
    .min(100, "최소 베팅 금액은 100 PmpAmount 이상이어야 합니다"),
  maximumStake: z
    .number()
    .max(10000, "최대 베팅 금액은 10,000 PmpAmount 이하여야 합니다"),
  maxParticipants: z.number().optional(),
  endTime: z.string().min(1, "종료 시간을 설정해주세요"),
  settlementTime: z.string().min(1, "정산 시간을 설정해주세요"),
});

// 예측 게임 생성 Server Action
export async function createPredictionGame(formData: FormData) {
  try {
    // FormData에서 데이터 추출
    const rawData = {
      title: formData.get("title") as string,
      description: formData.get("description") as string,
      category: formData.get("category") as string,
      predictionType: formData.get("predictionType") as string,
      options: formData.get("options") as string,
      minimumStake: Number(formData.get("minimumStake")),
      maximumStake: Number(formData.get("maximumStake")),
      maxParticipants: formData.get("maxParticipants")
        ? Number(formData.get("maxParticipants"))
        : undefined,
      endTime: formData.get("endTime") as string,
      settlementTime: formData.get("settlementTime") as string,
    };

    // 데이터 검증
    const validatedData = createPredictionGameSchema.parse(rawData);

    // TODO: MCP를 통한 데이터베이스 저장
    // 현재는 콘솔에 로그만 출력
    console.log("Creating prediction game:", validatedData);

    // 임시 게임 ID 생성 (실제로는 DB에서 반환)
    const gameId = "temp-" + Date.now();

    // 성공 후 예측 게임 상세 페이지로 리다이렉트
    redirect(`/prediction/games/${gameId}`);
  } catch (error) {
    if (error instanceof z.ZodError) {
      // 검증 오류 처리
      const errorMessages = error.errors.map((err) => err.message).join(", ");
      throw new Error(`입력 오류: ${errorMessages}`);
    }

    // 기타 오류 처리
    console.error("Failed to create prediction game:", error);
    throw new Error("예측 게임 생성에 실패했습니다. 다시 시도해주세요.");
  }
}

// 예측 참여 Server Action
export async function participateInPrediction(formData: FormData) {
  try {
    const gameId = formData.get("gameId") as string;
    const selectedOption = formData.get("selectedOption") as string;
    const stakeAmount = Number(formData.get("stakeAmount"));

    // 기본 검증
    if (!gameId || !selectedOption || !stakeAmount) {
      throw new Error("필수 정보가 누락되었습니다.");
    }

    if (stakeAmount < 100 || stakeAmount > 10000) {
      throw new Error("베팅 금액은 100~10,000 PmpAmount 사이여야 합니다.");
    }

    // TODO: MCP를 통한 데이터베이스 처리
    // 1. 사용자 PmpAmount 잔액 확인
    // 2. 예측 참여 기록 저장
    // 3. PmpAmount 차감 처리
    console.log("Participating in prediction:", {
      gameId,
      selectedOption,
      stakeAmount,
    });

    return {
      success: true,
      message: "예측 참여가 완료되었습니다!",
      data: { gameId, selectedOption, stakeAmount },
    };
  } catch (error) {
    console.error("Failed to participate in prediction:", error);
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "예측 참여에 실패했습니다.",
    };
  }
}
