/**
 * GET /api/forum/activity
 * 사용자의 Forum 활동 현황 및 일일 PMP 획득 요약
 */
import { NextResponse } from "next/server";
import { createClient } from "../../../../lib/supabase/server";

// 일일 한도 정의
const DAILY_LIMITS = {
  debate: { limit: 3, pmp: 100 },
  brainstorming: { limit: 2, pmp: 150 },
  discussion: { limit: 5, pmp: 50 },
  question: { limit: 10, pmp: 30 },
  comment: { limit: 10, pmp: 20 },
};

const DAILY_MAX_PMP = 1350;

/**
 * GET /api/forum/activity
 * 일일 활동 현황 조회
 */
export async function GET() {
  try {
    const supabase = await createClient();

    // 현재 사용자 확인
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: "로그인이 필요합니다.",
          },
        },
        { status: 401 }
      );
    }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    // 오늘의 게시글 활동
    const { data: todayPosts } = await supabase
      .schema("forum")
      .from("forum_posts")
      .select("id, post_type, pmp_earned, created_at")
      .eq("author_id", user.id)
      .gte("created_at", todayStart.toISOString());

    const postList = Array.isArray(todayPosts) ? todayPosts : [];

    // 오늘의 댓글 활동
    const { data: todayComments } = await supabase
      .schema("forum")
      .from("forum_comments")
      .select("id, pmp_earned, created_at")
      .eq("author_id", user.id)
      .gte("created_at", todayStart.toISOString());

    const commentList = Array.isArray(todayComments) ? todayComments : [];

    // 활동별 집계
    const activities = {
      debate: { count: 0, pmpEarned: 0, remaining: DAILY_LIMITS.debate.limit },
      brainstorming: { count: 0, pmpEarned: 0, remaining: DAILY_LIMITS.brainstorming.limit },
      discussion: { count: 0, pmpEarned: 0, remaining: DAILY_LIMITS.discussion.limit },
      question: { count: 0, pmpEarned: 0, remaining: DAILY_LIMITS.question.limit },
      comment: { count: 0, pmpEarned: 0, remaining: DAILY_LIMITS.comment.limit },
    };

    // 게시글 집계
    postList.forEach((post: { post_type: string; pmp_earned: number }) => {
      const postType = post.post_type as keyof typeof activities;
      if (activities[postType]) {
        activities[postType].count++;
        activities[postType].pmpEarned += post.pmp_earned || 0;
        activities[postType].remaining = Math.max(
          0,
          DAILY_LIMITS[postType]?.limit - activities[postType].count || 0
        );
      }
    });

    // 댓글 집계
    activities.comment.count = commentList.length;
    activities.comment.pmpEarned = commentList.reduce(
      (sum: number, c: { pmp_earned: number }) => sum + (c.pmp_earned || 0),
      0
    );
    activities.comment.remaining = Math.max(
      0,
      DAILY_LIMITS.comment.limit - activities.comment.count
    );

    // 총 PMP 계산
    const totalPmpEarned =
      Object.values(activities).reduce((sum, a) => sum + a.pmpEarned, 0);

    // 최근 활동 로그
    const { data: recentLogs } = await supabase
      .schema("forum")
      .from("forum_activity_logs")
      .select("id, activity_type, description, pmp_earned, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10);

    const logList = Array.isArray(recentLogs) ? recentLogs : [];

    return NextResponse.json({
      success: true,
      data: {
        today: {
          activities,
          totalPmpEarned,
          dailyMaxRemaining: Math.max(0, DAILY_MAX_PMP - totalPmpEarned),
          dailyMaxPmp: DAILY_MAX_PMP,
        },
        recentActivities: logList.map(
          (log: {
            id: string;
            activity_type: string;
            description: string;
            pmp_earned: number;
            created_at: string;
          }) => ({
            id: log.id,
            type: log.activity_type,
            description: log.description,
            pmpEarned: log.pmp_earned,
            createdAt: log.created_at,
          })
        ),
        limits: Object.entries(DAILY_LIMITS).map(([type, config]) => ({
          type,
          dailyLimit: config.limit,
          pmpPerAction: config.pmp,
          maxDailyPmp: config.limit * config.pmp,
        })),
      },
    });
  } catch (error) {
    void error;
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "서버 오류가 발생했습니다.",
        },
      },
      { status: 500 }
    );
  }
}
