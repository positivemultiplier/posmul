/**
 * 오피니언 리더 팔로우/언팔로우 API
 *
 * POST /api/donation/opinion-leader/follow
 * Body: { leaderId: string, action: 'follow' | 'unfollow' }
 *
 * @author PosMul Development Team
 * @since 2025-11
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../../../lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";

// 팔로우 처리 헬퍼 함수
async function handleFollow(
  supabase: SupabaseClient,
  leaderId: string,
  userId: string,
  currentFollowerCount: number
): Promise<NextResponse> {
  const { error: insertError } = await supabase
    .schema("donation")
    .from("opinion_leader_followers")
    .insert({
      opinion_leader_id: leaderId,
      follower_user_id: userId,
    });

  if (insertError) {
    // eslint-disable-next-line no-console
    console.error("Follow insert error:", insertError);
    return NextResponse.json(
      { error: "팔로우 처리 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }

  // 팔로워 카운트 증가
  await supabase
    .schema("donation")
    .from("opinion_leaders")
    .update({ follower_count: currentFollowerCount + 1 })
    .eq("id", leaderId);

  return NextResponse.json({
    success: true,
    message: "팔로우 완료",
    isFollowing: true,
    followerCount: currentFollowerCount + 1,
  });
}

// 언팔로우 처리 헬퍼 함수
async function handleUnfollow(
  supabase: SupabaseClient,
  leaderId: string,
  userId: string,
  currentFollowerCount: number
): Promise<NextResponse> {
  const { error: deleteError } = await supabase
    .schema("donation")
    .from("opinion_leader_followers")
    .delete()
    .eq("opinion_leader_id", leaderId)
    .eq("follower_user_id", userId);

  if (deleteError) {
    // eslint-disable-next-line no-console
    console.error("Follow delete error:", deleteError);
    return NextResponse.json(
      { error: "언팔로우 처리 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }

  const newCount = Math.max(0, currentFollowerCount - 1);
  await supabase
    .schema("donation")
    .from("opinion_leaders")
    .update({ follower_count: newCount })
    .eq("id", leaderId);

  return NextResponse.json({
    success: true,
    message: "언팔로우 완료",
    isFollowing: false,
    followerCount: newCount,
  });
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // 현재 사용자 확인
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "로그인이 필요합니다." },
        { status: 401 }
      );
    }

    // 요청 바디 파싱
    const body = await request.json();
    const { leaderId, action } = body;

    if (!leaderId || !["follow", "unfollow"].includes(action)) {
      return NextResponse.json(
        { error: "잘못된 요청입니다." },
        { status: 400 }
      );
    }

    // 리더 존재 확인
    const { data: leader, error: leaderError } = await supabase
      .schema("donation")
      .from("opinion_leaders")
      .select("id, follower_count, user_id")
      .eq("id", leaderId)
      .eq("is_active", true)
      .single();

    if (leaderError || !leader) {
      return NextResponse.json(
        { error: "해당 리더를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 자기 자신을 팔로우하는 것 방지
    if (leader.user_id === user.id) {
      return NextResponse.json(
        { error: "자기 자신은 팔로우할 수 없습니다." },
        { status: 400 }
      );
    }

    // 현재 팔로우 상태 확인
    const { data: existingFollow } = await supabase
      .schema("donation")
      .from("opinion_leader_followers")
      .select("id")
      .eq("opinion_leader_id", leaderId)
      .eq("follower_user_id", user.id)
      .maybeSingle();

    const currentCount = leader.follower_count || 0;

    if (action === "follow") {
      if (existingFollow) {
        return NextResponse.json(
          { error: "이미 팔로우 중입니다.", isFollowing: true },
          { status: 400 }
        );
      }
      return handleFollow(supabase, leaderId, user.id, currentCount);
    } else {
      if (!existingFollow) {
        return NextResponse.json(
          { error: "팔로우 상태가 아닙니다.", isFollowing: false },
          { status: 400 }
        );
      }
      return handleUnfollow(supabase, leaderId, user.id, currentCount);
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Follow API error:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// GET: 팔로우 상태 확인
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const leaderId = searchParams.get("leaderId");

    if (!leaderId) {
      return NextResponse.json(
        { error: "leaderId가 필요합니다." },
        { status: 400 }
      );
    }

    // 현재 사용자 확인
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ isFollowing: false, isLoggedIn: false });
    }

    // 팔로우 상태 확인
    const { data: followData } = await supabase
      .schema("donation")
      .from("opinion_leader_followers")
      .select("id")
      .eq("opinion_leader_id", leaderId)
      .eq("follower_user_id", user.id)
      .maybeSingle();

    return NextResponse.json({
      isFollowing: !!followData,
      isLoggedIn: true,
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Follow status check error:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
