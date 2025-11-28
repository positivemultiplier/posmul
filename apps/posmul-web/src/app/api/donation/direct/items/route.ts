/**
 * 직접 기부 물품 API
 * 
 * POST: 새 물품 등록
 * GET: 물품 목록 조회
 * 
 * @author PosMul Development Team
 * @since 2024-12
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../../../lib/supabase/server";

// ===== 타입 정의 =====
interface CreateItemRequest {
  donorUserId: string;
  title: string;
  description: string;
  category: string;
  condition: string;
  quantity: number;
  estimatedValue?: number;
  pickupLocation: string;
  pickupAvailableTimes?: string;
  images?: string[];
}

// ===== 유효성 검사 =====
const VALID_CATEGORIES = ["clothing", "food", "housing", "medical", "education"];
const VALID_CONDITIONS = ["new", "like_new", "good", "fair"];

function validateCreateRequest(body: CreateItemRequest): string | null {
  if (!body.donorUserId) return "기부자 ID가 필요합니다.";
  if (!body.title?.trim()) return "물품명을 입력해주세요.";
  if (body.title.length > 100) return "물품명은 100자 이내로 입력해주세요.";
  if (!body.description?.trim()) return "상세 설명을 입력해주세요.";
  if (body.description.length > 500) return "상세 설명은 500자 이내로 입력해주세요.";
  if (!VALID_CATEGORIES.includes(body.category)) return "올바른 카테고리를 선택해주세요.";
  if (!VALID_CONDITIONS.includes(body.condition)) return "올바른 물품 상태를 선택해주세요.";
  if (!body.quantity || body.quantity < 1) return "수량은 1개 이상이어야 합니다.";
  if (!body.pickupLocation?.trim()) return "수령 위치를 입력해주세요.";
  return null;
}

// ===== POST: 물품 등록 =====
export async function POST(request: NextRequest) {
  try {
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
    const body: CreateItemRequest = await request.json();

    // 사용자 ID 검증 (자신의 물품만 등록 가능)
    if (body.donorUserId !== user.id) {
      return NextResponse.json(
        { success: false, error: "권한이 없습니다." },
        { status: 403 }
      );
    }

    // 유효성 검사
    const validationError = validateCreateRequest(body);
    if (validationError) {
      return NextResponse.json(
        { success: false, error: validationError },
        { status: 400 }
      );
    }

    // 물품 등록
    const { data: item, error } = await supabase
      .schema("donation")
      .from("direct_donation_items")
      .insert({
        donor_user_id: user.id,
        title: body.title.trim(),
        description: body.description.trim(),
        category: body.category,
        condition: body.condition,
        quantity: body.quantity,
        estimated_value: body.estimatedValue || null,
        pickup_location: body.pickupLocation.trim(),
        pickup_available_times: body.pickupAvailableTimes?.trim() || null,
        images: body.images || null,
        status: "available",
      })
      .select()
      .single();

    if (error) {
      // eslint-disable-next-line no-console
      console.error("Item creation error:", error);
      return NextResponse.json(
        { success: false, error: "물품 등록에 실패했습니다." },
        { status: 500 }
      );
    }

    // 활동 로그 기록
    await logActivity(supabase, user.id, "item_registered", {
      itemId: item.id,
      title: body.title,
      category: body.category,
    });

    return NextResponse.json({
      success: true,
      data: {
        id: item.id,
        title: item.title,
        category: item.category,
        status: item.status,
      },
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Item POST error:", error);
    return NextResponse.json(
      { success: false, error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// ===== GET: 물품 목록 조회 =====
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    // 쿼리 파라미터
    const category = searchParams.get("category");
    const condition = searchParams.get("condition");
    const status = searchParams.get("status") || "available";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    // 쿼리 빌드
    let query = supabase
      .schema("donation")
      .from("direct_donation_items")
      .select("*", { count: "exact" });

    // 필터 적용
    if (category && VALID_CATEGORIES.includes(category)) {
      query = query.eq("category", category);
    }
    if (condition && VALID_CONDITIONS.includes(condition)) {
      query = query.eq("condition", condition);
    }
    if (status === "available") {
      query = query.in("status", ["available", "reserved"]);
    } else if (status !== "all") {
      query = query.eq("status", status);
    }

    // 페이지네이션
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to).order("created_at", { ascending: false });

    const { data: items, count, error } = await query;

    if (error) {
      // eslint-disable-next-line no-console
      console.error("Items fetch error:", error);
      return NextResponse.json(
        { success: false, error: "물품 목록 조회에 실패했습니다." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        items: items || [],
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limit),
        },
      },
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Items GET error:", error);
    return NextResponse.json(
      { success: false, error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// ===== 헬퍼: 활동 로그 기록 =====
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function logActivity(
  supabase: Awaited<ReturnType<typeof import("../../../../../lib/supabase/server").createClient>>,
  userId: string,
  activityType: string,
  metadata: Record<string, unknown>
): Promise<void> {
  try {
    await supabase
      .schema("donation")
      .from("donation_activity_logs")
      .insert({
        user_id: userId,
        activity_type: activityType,
        metadata: metadata,
      });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Activity log error:", err);
  }
}
