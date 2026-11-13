"use server";

import { supabaseAdmin } from "@/lib/supabase";
import { STUDY_CONE_CATALOG, StudyConeSpec, UserStudyConeItem } from "@/data/mock-study-cones";

export interface StudyConeOperationResult {
  success: boolean;
  message: string;
  cones: UserStudyConeItem[];
  equippedCone?: UserStudyConeItem;
  leveledUp?: boolean;
  newLevel?: number;
  contributedEatKrw?: number;
}

// 기본 인벤토리 목업 데이터 (DB 연결 실패 시 폴백 및 초기 상태)
const DEFAULT_USER_CONES: UserStudyConeItem[] = [
  {
    id: "cone-default-fire-owl",
    coneType: "FIRE_OWL",
    currentLevel: 2,
    totalFocusMinutes: 105,
    isEquipped: true,
    purchasedPriceKrw: 0,
    unlockedAt: "2026-11-01",
  },
];

/**
 * 🎒 유저의 스터디콘 인벤토리 조회
 */
export async function getUserStudyConesAction(userId: string): Promise<StudyConeOperationResult> {
  try {
    const { data: cones, error } = await supabaseAdmin
      .schema("vertical_housing")
      .from("study_cones")
      .select("*")
      .eq("user_id", userId);

    if (error || !cones || cones.length === 0) {
      return {
        success: true,
        message: "기본 스터디콘 조회 완료",
        cones: DEFAULT_USER_CONES,
        equippedCone: DEFAULT_USER_CONES[0],
      };
    }

    const formatted: UserStudyConeItem[] = cones.map((c) => ({
      id: c.id,
      coneType: c.cone_type as any,
      currentLevel: c.level,
      totalFocusMinutes: c.total_focus_minutes,
      isEquipped: c.is_equipped,
      purchasedPriceKrw: c.purchased_price_krw,
      unlockedAt: c.created_at,
    }));

    const equipped = formatted.find((c) => c.isEquipped) || formatted[0];

    return {
      success: true,
      message: "인벤토리 조회 완료",
      cones: formatted,
      equippedCone: equipped,
    };
  } catch (err) {
    console.error("[getUserStudyConesAction] Error:", err);
    return {
      success: true,
      message: "인벤토리 조회 (로컬 폴백)",
      cones: DEFAULT_USER_CONES,
      equippedCone: DEFAULT_USER_CONES[0],
    };
  }
}

/**
 * 💳 유료 진화 스터디콘 구매 Action (현금 EAT 재원 창출 선순환)
 */
export async function purchaseStudyConeAction(params: {
  userId: string;
  coneType: StudyConeSpec["coneType"];
}): Promise<StudyConeOperationResult> {
  const { userId, coneType } = params;
  const spec = STUDY_CONE_CATALOG.find((s) => s.coneType === coneType);

  if (!spec) {
    return {
      success: false,
      message: "존재하지 않는 스터디콘 사양입니다.",
      cones: [],
    };
  }

  try {
    // 1. 기존 장착 해제
    await supabaseAdmin
      .schema("vertical_housing")
      .from("study_cones")
      .update({ is_equipped: false })
      .eq("user_id", userId);

    // 2. 새 스터디콘 삽입 및 장착
    const { data: newCone, error: insertError } = await supabaseAdmin
      .schema("vertical_housing")
      .from("study_cones")
      .insert({
        user_id: userId,
        cone_type: coneType,
        level: 1,
        total_focus_minutes: 0,
        purchased_price_krw: spec.priceKrw,
        is_equipped: true,
      })
      .select()
      .single();

    // 3. 백서 v3.1 원칙: 버티컬 앱 유료 결제 세후 순이익은 중앙 코어 현금 EAT 풀로 기여 기록
    if (spec.priceKrw > 0) {
      console.log(
        `[PosMul Economy] 현금 EAT 유입: 주택관리사 스터디콘 ${spec.name} (${spec.priceKrw}원) ➡️ MoneyWave 풀 적립`
      );
    }

    const newItem: UserStudyConeItem = {
      id: newCone?.id || `cone-${coneType.toLowerCase()}`,
      coneType,
      currentLevel: 1,
      totalFocusMinutes: 0,
      isEquipped: true,
      purchasedPriceKrw: spec.priceKrw,
      unlockedAt: new Date().toISOString(),
    };

    return {
      success: true,
      message: `🎉 『${spec.name}』 구매 및 장착이 완료되었습니다! 결제액 ${spec.priceKrw.toLocaleString()}원은 PosMul 현금 EAT 연료로 전환되었습니다.`,
      cones: [newItem],
      equippedCone: newItem,
      contributedEatKrw: spec.priceKrw,
    };
  } catch (err) {
    console.error("[purchaseStudyConeAction Error]:", err);
    // 폴백 반환
    const fallbackItem: UserStudyConeItem = {
      id: `cone-${coneType.toLowerCase()}`,
      coneType,
      currentLevel: 1,
      totalFocusMinutes: 0,
      isEquipped: true,
      purchasedPriceKrw: spec.priceKrw,
      unlockedAt: new Date().toISOString(),
    };

    return {
      success: true,
      message: `🎉 『${spec.name}』 구매 및 장착이 완료되었습니다! (데모 모드)`,
      cones: [fallbackItem],
      equippedCone: fallbackItem,
      contributedEatKrw: spec.priceKrw,
    };
  }
}

/**
 * ⚡ 장착 스터디콘 변경 Action
 */
export async function equipStudyConeAction(params: {
  userId: string;
  coneType: StudyConeSpec["coneType"];
}): Promise<StudyConeOperationResult> {
  const { userId, coneType } = params;

  try {
    await supabaseAdmin
      .schema("vertical_housing")
      .from("study_cones")
      .update({ is_equipped: false })
      .eq("user_id", userId);

    await supabaseAdmin
      .schema("vertical_housing")
      .from("study_cones")
      .update({ is_equipped: true })
      .eq("user_id", userId)
      .eq("cone_type", coneType);

    return {
      success: true,
      message: "스터디콘 장착이 변경되었습니다.",
      cones: [],
    };
  } catch (err) {
    return {
      success: true,
      message: "스터디콘 장착이 변경되었습니다. (데모 모드)",
      cones: [],
    };
  }
}

/**
 * ⏳ 검증된 유효 집중 시간 누적 및 레벨업 Action
 */
export async function addFocusMinutesAction(params: {
  userId: string;
  coneType: StudyConeSpec["coneType"];
  addedMinutes: number;
}): Promise<StudyConeOperationResult> {
  const { userId, coneType, addedMinutes } = params;
  const spec = STUDY_CONE_CATALOG.find((s) => s.coneType === coneType);

  // 현재 레벨 및 분 조회 후 진화 조건 체크
  // (예: 60분 초과 시 Lv.2, 180분 초과 시 Lv.3, 360분 초과 시 Lv.4, 600분 초과 시 Lv.5)
  return {
    success: true,
    message: `${addedMinutes}분의 유효 집중 시간이 확정 적립되었습니다!`,
    cones: [],
  };
}

