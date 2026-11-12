/**
 * GET /api/forum/activity
 * 사용자의 Forum 활동 현황 및 일일 PMP 획득 요약
 */
import { NextResponse } from "next/server";
import { createClient } from "../../../../lib/supabase/server";
import {
  FORUM_ACTIVITY_LIMIT_CONFIG,
  FORUM_DAILY_MAX_PMP,
} from "../../../forum/forum-pmp-policy";

const DAILY_LIMITS = FORUM_ACTIVITY_LIMIT_CONFIG;
const DAILY_MAX_PMP = FORUM_DAILY_MAX_PMP;

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
    const activities: Record<
      "debate" | "brainstorming" | "discussion" | "question" | "comment",
      { count: number; pmpEarned: number; remaining: number }
    > = {
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

    // 최근 활동 로그 및 오늘 추천 수령 집계
    const { data: todayLogs } = await supabase
      .schema("forum")
      .from("forum_activity_logs")
      .select("activity_type, pmp_earned")
      .eq("user_id", user.id)
      .gte("created_at", todayStart.toISOString());

    const todayLikeLogs = Array.isArray(todayLogs)
      ? todayLogs.filter(
          (l: { activity_type: string }) =>
            l.activity_type === "post_like_received" ||
            l.activity_type === "concept_post_bonus"
        )
      : [];

    const likeReceivedCount = todayLikeLogs.filter(
      (l: { activity_type: string }) => l.activity_type === "post_like_received"
    ).length;
    const likeReceivedPmp = todayLikeLogs.reduce(
      (sum: number, l: { pmp_earned: number | null }) =>
        sum + (Number(l.pmp_earned) || 0),
      0
    );

    const { data: recentLogs } = await supabase
      .schema("forum")
      .from("forum_activity_logs")
      .select("id, activity_type, description, pmp_earned, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10);

    const logList = Array.isArray(recentLogs) ? recentLogs : [];

    // 총 PMP 계산 (글 + 댓글 + 추천 수령/개념글 보너스)
    const totalPmpEarned =
      Object.values(activities).reduce((sum, a) => sum + a.pmpEarned, 0) +
      likeReceivedPmp;

    return NextResponse.json({
      success: true,
      data: {
        today: {
          activities: {
            ...activities,
            likeReceived: {
              count: likeReceivedCount,
              pmpEarned: likeReceivedPmp,
              remaining: Math.max(0, DAILY_LIMITS.likeReceived.limit - likeReceivedCount),
            },
          },
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
