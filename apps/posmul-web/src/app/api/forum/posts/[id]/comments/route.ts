/**
 * POST /api/forum/posts/[id]/comments
 * 게시글 댓글 작성 + PMP 지급
 *
 * GET /api/forum/posts/[id]/comments
 * 게시글 댓글 목록 조회
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../../../../lib/supabase/server";

// 댓글 PMP 보상
const COMMENT_PMP_REWARD = 20;
const DAILY_COMMENT_LIMIT = 10;

/**
 * POST /api/forum/posts/[id]/comments
 * 댓글 작성 + PMP 지급
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: postId } = await params;
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

    const body = await request.json();
    const { content, parentCommentId } = body;

    // 유효성 검사
    if (!content || content.length < 1) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_CONTENT",
            message: "댓글 내용은 필수입니다.",
          },
        },
        { status: 400 }
      );
    }

    if (content.length > 1000) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "CONTENT_TOO_LONG",
            message: "댓글은 1000자 이하여야 합니다.",
          },
        },
        { status: 400 }
      );
    }

    // 게시글 존재 확인
    const { data: post, error: postError } = await supabase
      .schema("forum")
      .from("forum_posts")
      .select("id, title, status")
      .eq("id", postId)
      .single();

    const postData = Array.isArray(post) ? post[0] : post;

    if (postError || !postData) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "POST_NOT_FOUND",
            message: "게시글을 찾을 수 없습니다.",
          },
        },
        { status: 404 }
      );
    }

    if (postData.status !== "published") {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "POST_NOT_AVAILABLE",
            message: "댓글을 작성할 수 없는 게시글입니다.",
          },
        },
        { status: 400 }
      );
    }

    // 일일 한도 체크
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const { data: todayComments } = await supabase
      .schema("forum")
      .from("forum_comments")
      .select("id", { count: "exact" })
      .eq("author_id", user.id)
      .gte("created_at", todayStart.toISOString());

    const todayCount = Array.isArray(todayComments) ? todayComments.length : 0;

    if (todayCount >= DAILY_COMMENT_LIMIT) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "DAILY_LIMIT_REACHED",
            message: `오늘의 댓글 작성 한도(${DAILY_COMMENT_LIMIT}회)에 도달했습니다.`,
          },
        },
        { status: 429 }
      );
    }

    // 부모 댓글이 있으면 depth 계산
    let depth = 0;
    let path = "";

    if (parentCommentId) {
      const { data: parentComment } = await supabase
        .schema("forum")
        .from("forum_comments")
        .select("id, depth, path")
        .eq("id", parentCommentId)
        .single();

      const parentData = Array.isArray(parentComment)
        ? parentComment[0]
        : parentComment;

      if (parentData) {
        depth = (parentData.depth || 0) + 1;
        if (depth > 5) {
          return NextResponse.json(
            {
              success: false,
              error: {
                code: "MAX_DEPTH_EXCEEDED",
                message: "최대 5단계까지만 대댓글을 작성할 수 있습니다.",
              },
            },
            { status: 400 }
          );
        }
        path = parentData.path ? `${parentData.path}/${parentCommentId}` : parentCommentId;
      }
    }

    // 댓글 생성
    const { data: comment, error: commentError } = await supabase
      .schema("forum")
      .from("forum_comments")
      .insert({
        post_id: postId,
        author_id: user.id,
        content,
        parent_comment_id: parentCommentId || null,
        depth,
        path: path || postId,
        status: "published",
        pmp_earned: COMMENT_PMP_REWARD,
      })
      .select("id, content, pmp_earned, created_at")
      .single();

    const commentData = Array.isArray(comment) ? comment[0] : comment;

    if (commentError || !commentData) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "CREATE_FAILED",
            message: "댓글 생성에 실패했습니다.",
          },
        },
        { status: 500 }
      );
    }

    // 게시글 댓글 수 증가
    await supabase
      .schema("forum")
      .from("forum_posts")
      .update({
        comment_count: (postData as { comment_count?: number }).comment_count
          ? (postData as { comment_count?: number }).comment_count! + 1
          : 1,
        last_activity_at: new Date().toISOString(),
      })
      .eq("id", postId);

    // PMP 지급
    // 1. 활동 로그 기록
    await supabase.schema("forum").from("forum_activity_logs").insert({
      user_id: user.id,
      activity_type: "comment_created",
      post_id: postId,
      comment_id: commentData.id,
      description: `댓글 작성: ${content.substring(0, 50)}...`,
      pmp_earned: COMMENT_PMP_REWARD,
    });

    // 2. PMP 잔액 증가
    const { data: account } = await supabase
      .schema("economy")
      .from("pmp_pmc_accounts")
      .select("pmp_balance")
      .eq("user_id", user.id)
      .single();

    const accountData = Array.isArray(account) ? account[0] : account;
    const currentBalance = Number(accountData?.pmp_balance) || 0;

    await supabase
      .schema("economy")
      .from("pmp_pmc_accounts")
      .update({ pmp_balance: currentBalance + COMMENT_PMP_REWARD })
      .eq("user_id", user.id);

    // 3. 거래 내역 기록
    await supabase.schema("economy").from("pmp_pmc_transactions").insert({
      user_id: user.id,
      transaction_type: "PMP_EARN",
      pmp_amount: COMMENT_PMP_REWARD,
      description: `Forum 댓글 작성`,
      timestamp: new Date().toISOString(),
      metadata: {
        source: "forum",
        post_id: postId,
        comment_id: commentData.id,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        commentId: commentData.id,
        content: commentData.content,
        pmpEarned: COMMENT_PMP_REWARD,
        dailyRemaining: DAILY_COMMENT_LIMIT - todayCount - 1,
        createdAt: commentData.created_at,
      },
    });
  } catch (error) {
    console.error("Forum comment creation error:", error);
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

/**
 * GET /api/forum/posts/[id]/comments
 * 댓글 목록 조회
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: postId } = await params;
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    // 댓글 목록 조회
    const { data: comments, error: commentsError } = await supabase
      .schema("forum")
      .from("forum_comments")
      .select(
        `
        id,
        content,
        depth,
        path,
        parent_comment_id,
        status,
        like_count,
        dislike_count,
        reply_count,
        pmp_earned,
        created_at,
        updated_at,
        author_id
      `
      )
      .eq("post_id", postId)
      .eq("status", "published")
      .order("path", { ascending: true })
      .order("created_at", { ascending: true })
      .range(offset, offset + limit - 1);

    if (commentsError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "FETCH_ERROR",
            message: "댓글 목록 조회에 실패했습니다.",
          },
        },
        { status: 500 }
      );
    }

    const commentList = Array.isArray(comments) ? comments : [];

    return NextResponse.json({
      success: true,
      data: {
        comments: commentList.map(
          (c: {
            id: string;
            content: string;
            depth: number;
            path: string;
            parent_comment_id: string | null;
            status: string;
            like_count: number;
            dislike_count: number;
            reply_count: number;
            pmp_earned: number;
            created_at: string;
            updated_at: string;
            author_id: string;
          }) => ({
            id: c.id,
            content: c.content,
            depth: c.depth,
            parentCommentId: c.parent_comment_id,
            likeCount: c.like_count,
            dislikeCount: c.dislike_count,
            replyCount: c.reply_count,
            pmpEarned: c.pmp_earned,
            createdAt: c.created_at,
            authorId: c.author_id,
          })
        ),
        pagination: {
          limit,
          offset,
          hasMore: commentList.length === limit,
        },
      },
    });
  } catch (error) {
    console.error("Forum comments fetch error:", error);
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
