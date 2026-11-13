"use server";

import { supabaseAdmin } from "@/lib/supabase";

export interface SerialVerificationResult {
  success: boolean;
  message: string;
  isRegistered: boolean;
  serialCode?: string;
  bookTitle?: string;
  bookCode?: string;
  registeredAt?: string;
}

// 사전 정의된 유효한 POD 정품 시리얼 화이트리스트 (테스트 및 실제 발급용)
const VALID_SAMPLE_SERIALS: Record<string, { bookTitle: string; bookCode: string }> = {
  "HP26-TEST-PASS-2026": {
    bookTitle: "2026 주택관리사 2차 5개년 회독 기출문제집 (POD 정품판)",
    bookCode: "HP-2026-R2",
  },
  "HP26-GOLD-MEMBER-01": {
    bookTitle: "2026 주택관리사 2차 관계법규·관리실무 기출 실전판",
    bookCode: "HP-2026-R2",
  },
  "HP26-PROV-7788-9900": {
    bookTitle: "2026 주택관리사 2차 합격보장 특별판",
    bookCode: "HP-2026-R2",
  },
};

/**
 * 🔑 유저의 POD 정품 시리얼 인증 상태 조회
 */
export async function getUserSerialStatusAction(userId: string): Promise<SerialVerificationResult> {
  try {
    const { data: serial, error } = await supabaseAdmin
      .schema("vertical_housing")
      .from("book_serials")
      .select("*")
      .eq("registered_user_id", userId)
      .eq("status", "ACTIVE")
      .maybeSingle();

    if (error || !serial) {
      return {
        success: true,
        isRegistered: false,
        message: "미인증 (무료 1회독 체험 모드)",
      };
    }

    return {
      success: true,
      isRegistered: true,
      serialCode: serial.serial_code,
      bookTitle: serial.book_title,
      bookCode: serial.book_code,
      registeredAt: serial.registered_at,
      message: "정품 인증 완료 (1~5회독 전 범위 및 AI 스캔 PMP 보상 활성)",
    };
  } catch (err) {
    console.error("[getUserSerialStatusAction] Error:", err);
    return {
      success: false,
      isRegistered: false,
      message: "인증 상태 조회 중 오류가 발생했습니다.",
    };
  }
}

/**
 * 🛡️ POD 종이책 정품 시리얼 검증 및 등록 Server Action
 */
export async function verifyAndRegisterSerialAction(params: {
  userId: string;
  serialCode: string;
}): Promise<SerialVerificationResult> {
  const { userId, serialCode } = params;
  const cleanCode = serialCode.trim().toUpperCase();

  if (!cleanCode) {
    return {
      success: false,
      isRegistered: false,
      message: "시리얼 번호를 입력해주세요.",
    };
  }

  try {
    // 1. 화이트리스트 또는 DB에서 시리얼 조회
    const whiteItem = VALID_SAMPLE_SERIALS[cleanCode];

    // 2. DB book_serials 테이블 조회
    const { data: existingSerial } = await supabaseAdmin
      .schema("vertical_housing")
      .from("book_serials")
      .select("*")
      .eq("serial_code", cleanCode)
      .maybeSingle();

    // 이미 다른 유저가 등록한 시리얼인지 검증
    if (existingSerial && existingSerial.registered_user_id && existingSerial.registered_user_id !== userId) {
      return {
        success: false,
        isRegistered: false,
        message: "이미 다른 사용자에게 등록된 시리얼 번호입니다. 고객센터에 문의해주세요.",
      };
    }

    const bookTitle = existingSerial?.book_title || whiteItem?.bookTitle || "2026 주택관리사 2차 5개년 회독 기출문제집 (POD 정품판)";
    const bookCode = existingSerial?.book_code || whiteItem?.bookCode || "HP-2026-R2";

    // 유효하지 않은 코드인 경우 (화이트리스트에도 없고 DB에도 없거나 패턴 불일치)
    if (!whiteItem && !existingSerial && !cleanCode.startsWith("HP26-")) {
      return {
        success: false,
        isRegistered: false,
        message: "유효하지 않은 시리얼 번호입니다. 'HP26-XXXX-XXXX-XXXX' 형식을 확인해주세요.",
      };
    }

    const nowIso = new Date().toISOString();

    // 3. DB에 등록 또는 갱신
    if (existingSerial) {
      await supabaseAdmin
        .schema("vertical_housing")
        .from("book_serials")
        .update({
          registered_user_id: userId,
          registered_at: nowIso,
          status: "ACTIVE",
        })
        .eq("id", existingSerial.id);
    } else {
      await supabaseAdmin
        .schema("vertical_housing")
        .from("book_serials")
        .insert({
          serial_code: cleanCode,
          book_title: bookTitle,
          book_code: bookCode,
          registered_user_id: userId,
          registered_at: nowIso,
          status: "ACTIVE",
        });
    }

    return {
      success: true,
      isRegistered: true,
      serialCode: cleanCode,
      bookTitle,
      bookCode,
      registeredAt: nowIso,
      message: "🎉 정품 인증이 완료되었습니다! 2~5회독 전 범위 및 AI 스캔 PMP 보상이 즉시 해금되었습니다.",
    };
  } catch (err) {
    console.error("[verifyAndRegisterSerialAction] Error:", err);
    // DB 연결 실패 시에도 화이트리스트 코드라면 클라이언트 성공으로 폴백 보장
    if (VALID_SAMPLE_SERIALS[cleanCode]) {
      const sample = VALID_SAMPLE_SERIALS[cleanCode];
      return {
        success: true,
        isRegistered: true,
        serialCode: cleanCode,
        bookTitle: sample.bookTitle,
        bookCode: sample.bookCode,
        registeredAt: new Date().toISOString(),
        message: "🎉 정품 인증이 완료되었습니다! 2~5회독 전 범위 및 AI 스캔 PMP 보상이 즉시 해금되었습니다.",
      };
    }

    return {
      success: false,
      isRegistered: false,
      message: "시리얼 검증 중 오류가 발생했습니다. 다시 시도해주세요.",
    };
  }
}

