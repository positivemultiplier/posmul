/**
 * 매칭 상태 업데이트 API
 * 
 * PATCH: 매칭 상태 변경 (수락/거절/완료)
 * 
 * @author PosMul Development Team
 * @since 2024-12
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../../../../lib/supabase/server";

// ===== 타입 정의 =====
interface UpdateMatchRequest {
  action: "accept" | "reject" | "complete" | "cancel";
}

interface RouteParams {
  params: Promise<{ matchId: string }>;
}

// ===== PATCH: 매칭 상태 업데이트 =====
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { matchId } = await params;
    const supabase = await createClient();

    // 현재 사용자 확인
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "로그인이 필요합니다." },
        { status: 401 }
      );
    }

    // 요청 본문 파싱
    const body: UpdateMatchRequest = await request.json();
    const { action } = body;

    if (!["accept", "reject", "complete", "cancel"].includes(action)) {
      return NextResponse.json(
        { success: false, error: "유효하지 않은 액션입니다." },
        { status: 400 }
      );
    }

    // 매칭 정보 조회
    const { data: match, error: matchError } = await supabase
      .schema("donation")
      .from("direct_donation_matches")
      .select(`
        id,
        item_id,
        recipient_id,
        status,
        donor_confirmed,
        recipient_confirmed,
        direct_donation_items (donor_user_id),
        donation_recipients (user_id)
      `)
      .eq("id", matchId)
      .single();

    if (matchError || !match) {
      return NextResponse.json(
        { success: false, error: "매칭을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 권한 확인 및 업데이트 데이터 결정
    const updateResult = determineUpdate(match, user.id, action);
    if (!updateResult.success) {
      return NextResponse.json(
        { success: false, error: updateResult.error },
        { status: updateResult.status || 400 }
      );
    }

    // 매칭 상태 업데이트
    const { error: updateError } = await supabase
      .schema("donation")
      .from("direct_donation_matches")
      .update(updateResult.updateData)
      .eq("id", matchId);

    if (updateError) {
      // eslint-disable-next-line no-console
      console.error("Match update error:", updateError);
      return NextResponse.json(
        { success: false, error: "매칭 상태 업데이트에 실패했습니다." },
        { status: 500 }
      );
    }

    // 물품 상태 업데이트
    if (updateResult.itemStatus) {
      await supabase
        .schema("donation")
        .from("direct_donation_items")
        .update({ status: updateResult.itemStatus })
        .eq("id", match.item_id);
    }

    return NextResponse.json({
      success: true,
      data: {
        matchId,
        action,
        newStatus: updateResult.updateData.status || match.status,
        message: updateResult.message,
      },
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Match PATCH error:", error);
    return NextResponse.json(
      { success: false, error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// ===== 헬퍼: 업데이트 데이터 결정 =====
interface Match {
  id: string;
  item_id: string;
  recipient_id: string;
  status: string;
  donor_confirmed: boolean;
  recipient_confirmed: boolean;
  direct_donation_items: { donor_user_id: string } | { donor_user_id: string }[] | null;
  donation_recipients: { user_id: string | null } | { user_id: string | null }[] | null;
}

interface UpdateResult {
  success: boolean;
  error?: string;
  status?: number;
  updateData: Record<string, unknown>;
  itemStatus?: string;
  message: string;
}

function determineUpdate(
  match: Match,
  userId: string,
  action: string
): UpdateResult {
  // 배열 방어 처리
  const item = Array.isArray(match.direct_donation_items)
    ? match.direct_donation_items[0]
    : match.direct_donation_items;
  const recipient = Array.isArray(match.donation_recipients)
    ? match.donation_recipients[0]
    : match.donation_recipients;

  const isDonor = item?.donor_user_id === userId;
  const isRecipient = recipient?.user_id === userId;

  // 수혜자의 수락/거절
  if (action === "accept" && isRecipient) {
    if (match.status !== "pending") {
      return { success: false, error: "대기 중인 매칭만 수락할 수 있습니다.", status: 400, updateData: {}, message: "" };
    }
    return {
      success: true,
      updateData: { status: "accepted", recipient_confirmed: true, matched_at: new Date().toISOString() },
      itemStatus: "matched",
      message: "매칭이 수락되었습니다.",
    };
  }

  if (action === "reject" && isRecipient) {
    if (match.status !== "pending") {
      return { success: false, error: "대기 중인 매칭만 거절할 수 있습니다.", status: 400, updateData: {}, message: "" };
    }
    return {
      success: true,
      updateData: { status: "rejected" },
      itemStatus: "available",
      message: "매칭이 거절되었습니다.",
    };
  }

  // 기부 완료 (양측 모두 가능)
  if (action === "complete") {
    if (match.status !== "accepted") {
      return { success: false, error: "수락된 매칭만 완료할 수 있습니다.", status: 400, updateData: {}, message: "" };
    }

    if (isDonor) {
      // 기부자가 완료 처리
      if (match.recipient_confirmed) {
        return {
          success: true,
          updateData: { status: "completed", donor_confirmed: true, completed_at: new Date().toISOString() },
          itemStatus: "completed",
          message: "기부가 완료되었습니다!",
        };
      }
      return {
        success: true,
        updateData: { donor_confirmed: true },
        message: "완료 확인되었습니다. 수혜자의 확인을 기다리고 있습니다.",
      };
    }

    if (isRecipient) {
      // 수혜자가 완료 처리
      if (match.donor_confirmed) {
        return {
          success: true,
          updateData: { status: "completed", recipient_confirmed: true, completed_at: new Date().toISOString() },
          itemStatus: "completed",
          message: "기부가 완료되었습니다!",
        };
      }
      return {
        success: true,
        updateData: { recipient_confirmed: true },
        message: "완료 확인되었습니다. 기부자의 확인을 기다리고 있습니다.",
      };
    }
  }

  // 취소 (기부자만 가능, pending 상태에서만)
  if (action === "cancel" && isDonor) {
    if (match.status !== "pending") {
      return { success: false, error: "대기 중인 매칭만 취소할 수 있습니다.", status: 400, updateData: {}, message: "" };
    }
    return {
      success: true,
      updateData: { status: "cancelled" },
      itemStatus: "available",
      message: "매칭이 취소되었습니다.",
    };
  }

  return { success: false, error: "권한이 없거나 유효하지 않은 요청입니다.", status: 403, updateData: {}, message: "" };
}

// ===== GET: 매칭 상세 조회 =====
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { matchId } = await params;
    const supabase = await createClient();

    const { data: match, error } = await supabase
      .schema("donation")
      .from("direct_donation_matches")
      .select(`
        id,
        item_id,
        recipient_id,
        status,
        donor_confirmed,
        recipient_confirmed,
        matched_at,
        completed_at,
        created_at,
        direct_donation_items (
          id,
          title,
          category,
          condition,
          pickup_location,
          donor_user_id
        ),
        donation_recipients (
          id,
          display_name,
          location_city,
          location_district,
          user_id
        )
      `)
      .eq("id", matchId)
      .single();

    if (error || !match) {
      return NextResponse.json(
        { success: false, error: "매칭을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: match,
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Match GET error:", error);
    return NextResponse.json(
      { success: false, error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
