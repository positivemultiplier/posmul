/**
 * 수혜자 매칭 API
 * 
 * POST: 매칭 생성
 * GET: 매칭 추천 목록 조회
 * 
 * @author PosMul Development Team
 * @since 2024-12
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../../../lib/supabase/server";

// ===== 타입 정의 =====
interface CreateMatchRequest {
  itemId: string;
  recipientId: string;
}

interface RawRecipient {
  id: string;
  display_name: string;
  bio: string | null;
  needed_categories: string[] | null;
  location_city: string | null;
  location_district: string | null;
  is_verified: boolean;
}

// ===== POST: 매칭 생성 =====
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
    const body: CreateMatchRequest = await request.json();

    if (!body.itemId || !body.recipientId) {
      return NextResponse.json(
        { success: false, error: "물품 ID와 수혜자 ID가 필요합니다." },
        { status: 400 }
      );
    }

    // 물품 조회 및 권한 확인
    const itemResult = await fetchAndValidateItem(supabase, body.itemId, user.id);
    if (!itemResult.success) {
      return NextResponse.json(
        { success: false, error: itemResult.error },
        { status: itemResult.status || 400 }
      );
    }

    // 수혜자 존재 확인
    const recipientResult = await validateRecipient(supabase, body.recipientId);
    if (!recipientResult.success) {
      return NextResponse.json(
        { success: false, error: recipientResult.error },
        { status: recipientResult.status || 400 }
      );
    }

    // 이미 매칭된 건이 있는지 확인
    const existingResult = await checkExistingMatch(supabase, body.itemId);
    if (!existingResult.success) {
      return NextResponse.json(
        { success: false, error: existingResult.error },
        { status: existingResult.status || 400 }
      );
    }

    // 매칭 생성
    const { data: match, error: matchError } = await supabase
      .schema("donation")
      .from("direct_donation_matches")
      .insert({
        item_id: body.itemId,
        recipient_id: body.recipientId,
        status: "pending",
        donor_confirmed: true, // 기부자가 직접 매칭 요청
        recipient_confirmed: false,
      })
      .select()
      .single();

    if (matchError) {
      // eslint-disable-next-line no-console
      console.error("Match creation error:", matchError);
      return NextResponse.json(
        { success: false, error: "매칭 생성에 실패했습니다." },
        { status: 500 }
      );
    }

    // 물품 상태 업데이트
    await supabase
      .schema("donation")
      .from("direct_donation_items")
      .update({ status: "reserved" })
      .eq("id", body.itemId);

    return NextResponse.json({
      success: true,
      data: {
        matchId: match.id,
        status: "pending",
        message: "매칭 요청이 전송되었습니다. 수혜자의 확인을 기다려주세요.",
      },
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Match POST error:", error);
    return NextResponse.json(
      { success: false, error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// ===== GET: 매칭 추천 목록 =====
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    const itemId = searchParams.get("itemId");

    if (!itemId) {
      return NextResponse.json(
        { success: false, error: "물품 ID가 필요합니다." },
        { status: 400 }
      );
    }

    // 물품 정보 조회
    const { data: item, error: itemError } = await supabase
      .schema("donation")
      .from("direct_donation_items")
      .select("id, category, pickup_location")
      .eq("id", itemId)
      .single();

    if (itemError || !item) {
      return NextResponse.json(
        { success: false, error: "물품을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 해당 카테고리가 필요한 수혜자 조회
    const { data: recipients, error: recipientsError } = await supabase
      .schema("donation")
      .from("donation_recipients")
      .select("*")
      .eq("is_active", true)
      .contains("needed_categories", [item.category]);

    if (recipientsError) {
      // eslint-disable-next-line no-console
      console.error("Recipients fetch error:", recipientsError);
      return NextResponse.json(
        { success: false, error: "수혜자 목록 조회에 실패했습니다." },
        { status: 500 }
      );
    }

    // 매칭 점수 계산 및 정렬
    const scoredRecipients = calculateMatchScores(
      recipients || [],
      item.category,
      item.pickup_location
    );

    return NextResponse.json({
      success: true,
      data: {
        item: {
          id: item.id,
          category: item.category,
        },
        recommendations: scoredRecipients,
      },
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

// ===== 헬퍼: Supabase 클라이언트 타입 =====
type SupabaseClientType = Awaited<ReturnType<typeof createClient>>;

async function fetchAndValidateItem(
  supabase: SupabaseClientType,
  itemId: string,
  userId: string
): Promise<{ success: boolean; error?: string; status?: number }> {
  const { data: item, error } = await supabase
    .schema("donation")
    .from("direct_donation_items")
    .select("id, donor_user_id, category, status")
    .eq("id", itemId)
    .single();

  if (error || !item) {
    return { success: false, error: "물품을 찾을 수 없습니다.", status: 404 };
  }

  if (item.donor_user_id !== userId) {
    return { success: false, error: "본인의 물품만 매칭할 수 있습니다.", status: 403 };
  }

  if (item.status !== "available") {
    return { success: false, error: "이미 매칭된 물품입니다.", status: 400 };
  }

  return { success: true };
}

// ===== 헬퍼: 수혜자 존재 확인 =====
async function validateRecipient(
  supabase: SupabaseClientType,
  recipientId: string
): Promise<{ success: boolean; error?: string; status?: number }> {
  const { data: recipient, error } = await supabase
    .schema("donation")
    .from("donation_recipients")
    .select("id")
    .eq("id", recipientId)
    .single();

  if (error || !recipient) {
    return { success: false, error: "수혜자를 찾을 수 없습니다.", status: 404 };
  }

  return { success: true };
}

// ===== 헬퍼: 기존 매칭 확인 =====
async function checkExistingMatch(
  supabase: SupabaseClientType,
  itemId: string
): Promise<{ success: boolean; error?: string; status?: number }> {
  const { data: existing } = await supabase
    .schema("donation")
    .from("direct_donation_matches")
    .select("id")
    .eq("item_id", itemId)
    .maybeSingle();

  if (existing) {
    return { success: false, error: "이미 매칭 요청이 있는 물품입니다.", status: 400 };
  }

  return { success: true };
}

// ===== 헬퍼: 매칭 점수 계산 =====
interface ScoredRecipient {
  id: string;
  displayName: string;
  bio: string;
  locationCity: string;
  locationDistrict: string;
  isVerified: boolean;
  matchScore: number;
  matchReasons: string[];
}

function calculateMatchScores(
  recipients: RawRecipient[],
  itemCategory: string,
  itemLocation: string | null
): ScoredRecipient[] {
  return recipients
    .map((r) => {
      let score = 0;
      const reasons: string[] = [];

      // 카테고리 매칭 (기본 점수)
      if (r.needed_categories?.includes(itemCategory)) {
        score += 50;
        reasons.push("필요 카테고리 일치");
      }

      // 인증된 수혜자
      if (r.is_verified) {
        score += 20;
        reasons.push("인증된 수혜자");
      }

      // 지역 매칭 (간단한 문자열 비교)
      if (itemLocation && r.location_city) {
        if (itemLocation.includes(r.location_city)) {
          score += 30;
          reasons.push("동일 지역");
        }
      }

      return {
        id: r.id,
        displayName: r.display_name,
        bio: r.bio || "",
        locationCity: r.location_city || "",
        locationDistrict: r.location_district || "",
        isVerified: r.is_verified,
        matchScore: score,
        matchReasons: reasons,
      };
    })
    .sort((a, b) => b.matchScore - a.matchScore);
}
