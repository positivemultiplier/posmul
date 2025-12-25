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

class HttpError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string
  ) {
    super(message);
  }
}

function jsonError(error: HttpError): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: {
        code: error.code,
        message: error.message,
      },
    },
    { status: error.status }
  );
}

async function getPostId(params: Promise<{ id: string }>): Promise<string> {
  const { id } = await params;
  return id;
}

async function requireUserId(supabase: Awaited<ReturnType<typeof createClient>>): Promise<string> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new HttpError(401, "UNAUTHORIZED", "로그인이 필요합니다.");
  }

  return user.id;
}

async function parseBody(request: NextRequest): Promise<{ content: string; parentCommentId?: string }> {
  const body = (await request.json()) as unknown;
  if (!body || typeof body !== "object") {
    throw new HttpError(400, "INVALID_BODY", "요청 본문이 올바르지 않습니다.");
  }

  const content = (body as { content?: unknown }).content;
  const parentCommentId = (body as { parentCommentId?: unknown }).parentCommentId;

  if (typeof content !== "string") {
    throw new HttpError(400, "INVALID_CONTENT", "댓글 내용은 필수입니다.");
  }

  if (content.length < 1) {
    throw new HttpError(400, "INVALID_CONTENT", "댓글 내용은 필수입니다.");
  }

  if (content.length > 1000) {
    throw new HttpError(400, "CONTENT_TOO_LONG", "댓글은 1000자 이하여야 합니다.");
  }

  return {
    content,
    parentCommentId: typeof parentCommentId === "string" ? parentCommentId : undefined,
  };
}

async function getPublishedPostOrThrow(
  supabase: Awaited<ReturnType<typeof createClient>>,
  postId: string
): Promise<{ id: string; title: string; status: string; comment_count?: number | null }> {
  const { data: post, error: postError } = await supabase
    .schema("forum")
    .from("forum_posts")
    .select("id, title, status, comment_count")
    .eq("id", postId)
    .single();

  const postData = Array.isArray(post) ? post[0] : post;

  if (postError || !postData) {
    throw new HttpError(404, "POST_NOT_FOUND", "게시글을 찾을 수 없습니다.");
  }

  if (postData.status !== "published") {
    throw new HttpError(400, "POST_NOT_AVAILABLE", "댓글을 작성할 수 없는 게시글입니다.");
  }

  return postData as { id: string; title: string; status: string; comment_count?: number | null };
}

function getTodayStartIso(): string {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  return todayStart.toISOString();
}

async function getTodayCommentCount(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
): Promise<number> {
  const { data: todayComments } = await supabase
    .schema("forum")
    .from("forum_comments")
    .select("id", { count: "exact" })
    .eq("author_id", userId)
    .gte("created_at", getTodayStartIso());

  return Array.isArray(todayComments) ? todayComments.length : 0;
}

function assertDailyLimitNotReached(todayCount: number): void {
  if (todayCount >= DAILY_COMMENT_LIMIT) {
    throw new HttpError(
      429,
      "DAILY_LIMIT_REACHED",
      `오늘의 댓글 작성 한도(${DAILY_COMMENT_LIMIT}회)에 도달했습니다.`
    );
  }
}

async function getThreadInfo(
  supabase: Awaited<ReturnType<typeof createClient>>,
  postId: string,
  parentCommentId?: string
): Promise<{ depth: number; path: string; parentCommentId: string | null }> {
  if (!parentCommentId) {
    return { depth: 0, path: postId, parentCommentId: null };
  }

  const { data: parentComment } = await supabase
    .schema("forum")
    .from("forum_comments")
    .select("id, depth, path")
    .eq("id", parentCommentId)
    .single();

  const parentData = Array.isArray(parentComment) ? parentComment[0] : parentComment;

  if (!parentData) {
    return { depth: 0, path: postId, parentCommentId: null };
  }

  const depth = (parentData.depth || 0) + 1;
  if (depth > 5) {
    throw new HttpError(400, "MAX_DEPTH_EXCEEDED", "최대 5단계까지만 대댓글을 작성할 수 있습니다.");
  }

  const path = parentData.path ? `${parentData.path}/${parentCommentId}` : parentCommentId;
  return { depth, path, parentCommentId };
}

async function createCommentOrThrow(params: {
  supabase: Awaited<ReturnType<typeof createClient>>;
  postId: string;
  userId: string;
  content: string;
  depth: number;
  path: string;
  parentCommentId: string | null;
}): Promise<{ id: string; content: string; pmp_earned: number; created_at: string }> {
  const { data: comment, error: commentError } = await params.supabase
    .schema("forum")
    .from("forum_comments")
    .insert({
      post_id: params.postId,
      author_id: params.userId,
      content: params.content,
      parent_comment_id: params.parentCommentId,
      depth: params.depth,
      path: params.path,
      status: "published",
      pmp_earned: COMMENT_PMP_REWARD,
    })
    .select("id, content, pmp_earned, created_at")
    .single();

  const commentData = Array.isArray(comment) ? comment[0] : comment;

  if (commentError || !commentData) {
    throw new HttpError(500, "CREATE_FAILED", "댓글 생성에 실패했습니다.");
  }

  return commentData as { id: string; content: string; pmp_earned: number; created_at: string };
}

async function updatePostAfterComment(params: {
  supabase: Awaited<ReturnType<typeof createClient>>;
  postId: string;
  currentCommentCount?: number | null;
}): Promise<void> {
  const nextCount = params.currentCommentCount ? params.currentCommentCount + 1 : 1;

  await params.supabase
    .schema("forum")
    .from("forum_posts")
    .update({
      comment_count: nextCount,
      last_activity_at: new Date().toISOString(),
    })
    .eq("id", params.postId);
}

async function rewardForComment(params: {
  supabase: Awaited<ReturnType<typeof createClient>>;
  userId: string;
  postId: string;
  commentId: string;
  content: string;
}): Promise<void> {
  // 1. 활동 로그 기록
  await params.supabase.schema("forum").from("forum_activity_logs").insert({
    user_id: params.userId,
    activity_type: "comment_created",
    post_id: params.postId,
    comment_id: params.commentId,
    description: `댓글 작성: ${params.content.substring(0, 50)}...`,
    pmp_earned: COMMENT_PMP_REWARD,
  });

  // 2. PMP 잔액 증가
  const { data: account } = await params.supabase
    .schema("economy")
    .from("pmp_pmc_accounts")
    .select("pmp_balance")
    .eq("user_id", params.userId)
    .single();

  const accountData = Array.isArray(account) ? account[0] : account;
  const currentBalance = Number(accountData?.pmp_balance) || 0;

  await params.supabase
    .schema("economy")
    .from("pmp_pmc_accounts")
    .update({ pmp_balance: currentBalance + COMMENT_PMP_REWARD })
    .eq("user_id", params.userId);

  // 3. 거래 내역 기록
  await params.supabase.schema("economy").from("pmp_pmc_transactions").insert({
    user_id: params.userId,
    transaction_type: "PMP_EARN",
    pmp_amount: COMMENT_PMP_REWARD,
    description: `Forum 댓글 작성`,
    timestamp: new Date().toISOString(),
    metadata: {
      source: "forum",
      post_id: params.postId,
      comment_id: params.commentId,
    },
  });
}

/**
 * POST /api/forum/posts/[id]/comments
 * 댓글 작성 + PMP 지급
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const postId = await getPostId(params);
    const supabase = await createClient();

    const userId = await requireUserId(supabase);
    const { content, parentCommentId } = await parseBody(request);

    const postData = await getPublishedPostOrThrow(supabase, postId);
    const todayCount = await getTodayCommentCount(supabase, userId);
    assertDailyLimitNotReached(todayCount);

    const threadInfo = await getThreadInfo(supabase, postId, parentCommentId);
    const commentData = await createCommentOrThrow({
      supabase,
      postId,
      userId,
      content,
      depth: threadInfo.depth,
      path: threadInfo.path,
      parentCommentId: threadInfo.parentCommentId,
    });

    await updatePostAfterComment({
      supabase,
      postId,
      currentCommentCount: postData.comment_count,
    });

    await rewardForComment({
      supabase,
      userId,
      postId,
      commentId: commentData.id,
      content,
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
    if (error instanceof HttpError) {
      return jsonError(error);
    }
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
