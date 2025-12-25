/**
 * POST /api/forum/posts
 * 포럼 게시글 생성 (토론, 브레인스토밍 등)
 *
 * GET /api/forum/posts
 * 포럼 게시글 목록 조회
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../../lib/supabase/server";

// PMP 보상 규칙
const PMP_REWARDS = {
  discussion: 50, // 일반 토론
  question: 30, // 질문
  debate: 100, // 토론 주제
  brainstorming: 150, // 브레인스토밍 아이디어
  announcement: 0, // 공지사항 (보상 없음)
};

// 일일 한도
const DAILY_LIMITS = {
  debate: 3,
  brainstorming: 2,
  discussion: 5,
  question: 10,
};

type CreateForumPostBodyParsed = {
  categoryId: string;
  title: string;
  content: string;
  postType: string;
  tags: string[];
};

function jsonError(status: number, code: string, message: string) {
  return NextResponse.json(
    {
      success: false,
      error: {
        code,
        message,
      },
    },
    { status }
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parseCreateForumPostBody(body: unknown):
  | { ok: true; data: CreateForumPostBodyParsed }
  | { ok: false; response: NextResponse } {
  if (!isRecord(body)) {
    return {
      ok: false,
      response: jsonError(400, "INVALID_REQUEST", "카테고리, 제목, 내용은 필수입니다."),
    };
  }

  const categoryId = body["categoryId"];
  const title = body["title"];
  const content = body["content"];
  const postType = body["postType"];
  const tags = body["tags"];

  const normalizedCategoryId = typeof categoryId === "string" ? categoryId : "";
  const normalizedTitle = typeof title === "string" ? title : "";
  const normalizedContent = typeof content === "string" ? content : "";
  const normalizedPostType = typeof postType === "string" ? postType : "discussion";
  const normalizedTags = Array.isArray(tags)
    ? tags.filter((t): t is string => typeof t === "string")
    : [];

  if (!normalizedCategoryId || !normalizedTitle || !normalizedContent) {
    return {
      ok: false,
      response: jsonError(400, "INVALID_REQUEST", "카테고리, 제목, 내용은 필수입니다."),
    };
  }

  return {
    ok: true,
    data: {
      categoryId: normalizedCategoryId,
      title: normalizedTitle,
      content: normalizedContent,
      postType: normalizedPostType,
      tags: normalizedTags,
    },
  };
}

function getDailyLimit(postType: string): number {
  return DAILY_LIMITS[postType as keyof typeof DAILY_LIMITS] || 5;
}

function getPmpReward(postType: string): number {
  return PMP_REWARDS[postType as keyof typeof PMP_REWARDS] || 0;
}

function startOfToday(): Date {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  return todayStart;
}

async function countTodayPosts(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  postType: string,
  todayStart: Date
): Promise<number> {
  const { data: todayPosts, error: _countError } = await supabase
    .schema("forum")
    .from("forum_posts")
    .select("id", { count: "exact" })
    .eq("author_id", userId)
    .eq("post_type", postType)
    .gte("created_at", todayStart.toISOString());

  void _countError;
  return Array.isArray(todayPosts) ? todayPosts.length : 0;
}

async function awardPmpForPost(params: {
  supabase: Awaited<ReturnType<typeof createClient>>;
  userId: string;
  postId: string;
  title: string;
  postType: string;
  tags: string[];
  pmpEarned: number;
}) {
  const { supabase, userId, postId, title, postType, tags, pmpEarned } = params;

  await supabase.schema("forum").from("forum_activity_logs").insert({
    user_id: userId,
    activity_type: "post_created",
    post_id: postId,
    description: `${postType} 게시글 작성: ${title}`,
    pmp_earned: pmpEarned,
    metadata: { postType, tags },
  });

  const { data: account } = await supabase
    .schema("economy")
    .from("pmp_pmc_accounts")
    .select("pmp_balance")
    .eq("user_id", userId)
    .single();

  const accountData = Array.isArray(account) ? account[0] : account;
  const currentBalance = Number(accountData?.pmp_balance) || 0;

  await supabase
    .schema("economy")
    .from("pmp_pmc_accounts")
    .update({ pmp_balance: currentBalance + pmpEarned })
    .eq("user_id", userId);

  await supabase.schema("economy").from("pmp_pmc_transactions").insert({
    user_id: userId,
    transaction_type: "PMP_EARN",
    pmp_amount: pmpEarned,
    description: `Forum ${postType} 작성: ${title}`,
    timestamp: new Date().toISOString(),
    metadata: {
      source: "forum",
      post_id: postId,
      post_type: postType,
    },
  });
}

/**
 * POST /api/forum/posts
 * 게시글 생성 + PMP 지급
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // 현재 사용자 확인
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return jsonError(401, "UNAUTHORIZED", "로그인이 필요합니다.");
    }

    const body: unknown = await request.json();
    const parsedBodyResult = parseCreateForumPostBody(body);
    if (parsedBodyResult.ok === false) return parsedBodyResult.response;
    const { categoryId, title, content, postType, tags } = parsedBodyResult.data;

    if (title.length < 5 || title.length > 200) {
      return jsonError(400, "INVALID_TITLE", "제목은 5자 이상 200자 이하여야 합니다.");
    }

    if (content.length < 10) {
      return jsonError(400, "INVALID_CONTENT", "내용은 10자 이상이어야 합니다.");
    }

    // 일일 한도 체크
    const dailyLimit = getDailyLimit(postType);
    const todayStart = startOfToday();
    const todayCount = await countTodayPosts(
      supabase,
      user.id,
      postType,
      todayStart
    );

    if (todayCount >= dailyLimit) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "DAILY_LIMIT_REACHED",
            message: `오늘의 ${postType} 게시 한도(${dailyLimit}회)에 도달했습니다.`,
          },
        },
        { status: 429 }
      );
    }

    // 게시글 생성
    const { data: post, error: postError } = await supabase
      .schema("forum")
      .from("forum_posts")
      .insert({
        category_id: categoryId,
        author_id: user.id,
        title,
        content,
        post_type: postType,
        tags,
        status: "published",
        pmp_earned: PMP_REWARDS[postType as keyof typeof PMP_REWARDS] || 0,
      })
      .select("id, title, post_type, pmp_earned, created_at")
      .single();

    const postData = Array.isArray(post) ? post[0] : post;

    if (postError || !postData) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "CREATE_FAILED",
            message: "게시글 생성에 실패했습니다.",
          },
        },
        { status: 500 }
      );
    }

    const pmpEarned = getPmpReward(postType);

    // PMP 지급
    if (pmpEarned > 0) {
      await awardPmpForPost({
        supabase,
        userId: user.id,
        postId: postData.id,
        title,
        postType,
        tags,
        pmpEarned,
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        postId: postData.id,
        title: postData.title,
        postType: postData.post_type,
        pmpEarned,
        dailyRemaining: dailyLimit - todayCount - 1,
        createdAt: postData.created_at,
      },
    });
  } catch (error) {
    void error;
    return jsonError(500, "INTERNAL_ERROR", "서버 오류가 발생했습니다.");
  }
}

/**
 * GET /api/forum/posts
 * 게시글 목록 조회
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    const categoryId = searchParams.get("categoryId");
    const postType = searchParams.get("postType");
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);
    const sortBy = searchParams.get("sortBy") || "created_at";
    const sortOrder = searchParams.get("sortOrder") || "desc";

    // 기본 쿼리
    let query = supabase
      .schema("forum")
      .from("forum_posts")
      .select(
        `
        id,
        title,
        content,
        post_type,
        tags,
        status,
        view_count,
        like_count,
        comment_count,
        pmp_earned,
        created_at,
        updated_at,
        category_id
      `
      )
      .eq("status", "published");

    // 필터 적용
    if (categoryId) {
      query = query.eq("category_id", categoryId);
    }
    if (postType) {
      query = query.eq("post_type", postType);
    }

    // 정렬
    query = query.order(sortBy, { ascending: sortOrder === "asc" });

    // 페이지네이션
    query = query.range(offset, offset + limit - 1);

    const { data: posts, error: postsError } = await query;

    if (postsError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "FETCH_ERROR",
            message: "게시글 목록 조회에 실패했습니다.",
          },
        },
        { status: 500 }
      );
    }

    const postList = Array.isArray(posts) ? posts : [];

    return NextResponse.json({
      success: true,
      data: {
        posts: postList.map(
          (p: {
            id: string;
            title: string;
            content: string;
            post_type: string;
            tags: string[];
            status: string;
            view_count: number;
            like_count: number;
            comment_count: number;
            pmp_earned: number;
            created_at: string;
            updated_at: string;
            category_id: string;
          }) => ({
            id: p.id,
            title: p.title,
            content: p.content.substring(0, 200) + (p.content.length > 200 ? "..." : ""),
            postType: p.post_type,
            tags: p.tags,
            viewCount: p.view_count,
            likeCount: p.like_count,
            commentCount: p.comment_count,
            pmpEarned: p.pmp_earned,
            createdAt: p.created_at,
            categoryId: p.category_id,
          })
        ),
        pagination: {
          limit,
          offset,
          hasMore: postList.length === limit,
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
