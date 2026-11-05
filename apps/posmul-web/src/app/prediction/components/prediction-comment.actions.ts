"use server";

import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

export interface PredictionCommentDTO {
  id: string;
  postId: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  content: string;
  optionId?: string;
  optionLabel?: string;
  pmpEarned: number;
  likeCount: number;
  createdAt: string;
}

const DEFAULT_FORUM_CATEGORY_ID = "040567a7-dd38-4826-896b-08da1bfcd25d"; // 일반 토론
const SYSTEM_USER_ID = "00000000-0000-0000-0000-000000000001";

/**
 * 로그인 세션 유저가 "user".users 테이블에 없으면 자동 동기화하여 외래키 제약조건 충족
 */
async function ensureUserInDatabase(user: { id: string; email?: string; user_metadata?: any }): Promise<void> {
  try {
    const { data: existing } = await supabaseAdmin
      .schema("user")
      .from("users")
      .select("id")
      .eq("id", user.id)
      .maybeSingle();

    if (existing?.id) return;

    const email = user.email || `user_${user.id.substring(0, 8)}@posmul.com`;
    const baseName = user.user_metadata?.display_name || user.user_metadata?.username || (user.email ? user.email.split("@")[0] : "citizen");
    const uniqueUsername = `${baseName}_${user.id.substring(0, 6)}`;

    await supabaseAdmin
      .schema("user")
      .from("users")
      .insert({
        id: user.id,
        email,
        username: uniqueUsername,
        full_name: user.user_metadata?.full_name || user.user_metadata?.name || baseName,
        is_active: true,
      });
  } catch (err) {
    console.warn("ensureUserInDatabase warning (non-fatal):", err);
  }
}

/**
 * 게임 ID에 연계된 토론 포스트 ID를 조회하거나 없으면 자동 개설
 */
async function ensureForumPostForGame(gameId: string, fallbackAuthorId?: string): Promise<string | null> {
  try {
    // 1. 기존 링크 확인
    const { data: link } = await supabaseAdmin
      .schema("forum")
      .from("forum_prediction_links")
      .select("forum_post_id")
      .eq("prediction_game_id", gameId)
      .maybeSingle();

    if (link?.forum_post_id) {
      return link.forum_post_id;
    }

    // 2. 게임 정보 조회
    const { data: game } = await supabaseAdmin
      .schema("prediction")
      .from("prediction_games")
      .select("title, description, category")
      .eq("game_id", gameId)
      .maybeSingle();

    const gameTitle = game?.title || "예측 게임 공론장";
    const gameDesc = game?.description || "이 예측에 대한 시민들의 자유로운 분석과 의견을 나누는 공론장입니다.";

    // 유효한 author_id 확인 (외래키 제약조건 준수)
    let authorId = fallbackAuthorId;
    if (!authorId) {
      const { data: firstUser } = await supabaseAdmin
        .schema("user")
        .from("users")
        .select("id")
        .limit(1)
        .maybeSingle();
      authorId = firstUser?.id;
    }

    if (!authorId) {
      console.error("No valid user found for forum post author");
      return null;
    }

    // 3. 포럼 포스트 신규 생성
    const { data: newPost, error: postErr } = await supabaseAdmin
      .schema("forum")
      .from("forum_posts")
      .insert({
        category_id: DEFAULT_FORUM_CATEGORY_ID,
        author_id: authorId,
        title: `[시민 공론장] ${gameTitle}`,
        content: `${gameDesc}\n\n시민 여러분의 예측 근거와 찬반 의견을 자유롭게 나눠주세요. 의견 작성 시 +10 PMP 활동 포인트가 지급됩니다.`,
        post_type: "debate",
        section: "DEBATE",
        status: "published",
      })
      .select("id")
      .single();

    if (postErr || !newPost) {
      console.error("ensureForumPostForGame post creation error:", postErr);
      return null;
    }

    // 4. 링크 등록
    await supabaseAdmin
      .schema("forum")
      .from("forum_prediction_links")
      .insert({
        forum_post_id: newPost.id,
        prediction_game_id: gameId,
        link_type: "RELATED",
      });

    return newPost.id;
  } catch (e) {
    console.error("ensureForumPostForGame exception:", e);
    return null;
  }
}

/**
 * 특정 예측 게임의 댓글 목록 조회
 */
export async function getPredictionCommentsAction(
  gameId: string
): Promise<{ success: boolean; comments: PredictionCommentDTO[]; error?: string }> {
  try {
    const postId = await ensureForumPostForGame(gameId);
    if (!postId) {
      return { success: true, comments: [] };
    }

    // 댓글 및 작성자 프로필 조회
    const { data: comments, error } = await supabaseAdmin
      .schema("forum")
      .from("forum_comments")
      .select("id, post_id, author_id, content, like_count, pmp_earned, metadata, created_at")
      .eq("post_id", postId)
      .eq("status", "published")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("getPredictionCommentsAction error:", error);
      return { success: false, comments: [], error: error.message };
    }

    // 작성자 ID 목록 수집
    const authorIds = Array.from(new Set((comments || []).map((c) => c.author_id)));
    const userProfileMap = new Map<string, { username: string }>();

    if (authorIds.length > 0) {
      const { data: profiles } = await supabaseAdmin
        .schema("user")
        .from("profiles")
        .select("id, username, display_name")
        .in("id", authorIds);

      (profiles || []).forEach((p: any) => {
        userProfileMap.set(p.id, {
          username: p.display_name || p.username || "시민",
        });
      });
    }

    const mappedComments: PredictionCommentDTO[] = (comments || []).map((c) => {
      const meta = (c.metadata as any) || {};
      const profile = userProfileMap.get(c.author_id);
      const name = profile?.username || `시민_${c.author_id.substring(0, 5)}`;

      return {
        id: c.id,
        postId: c.post_id,
        authorId: c.author_id,
        authorName: name,
        authorAvatar: "bg-gradient-to-tr from-blue-500 to-indigo-500",
        content: c.content,
        optionId: meta.optionId,
        optionLabel: meta.optionLabel,
        pmpEarned: Number(c.pmp_earned) || 10,
        likeCount: c.like_count || 0,
        createdAt: c.created_at || new Date().toISOString(),
      };
    });

    return { success: true, comments: mappedComments };
  } catch (e: any) {
    console.error("getPredictionCommentsAction exception:", e);
    return { success: false, comments: [], error: e?.message };
  }
}

/**
 * 예측 게임 토론 의견(댓글) 등록 및 PMP 활동 리워드 지급
 */
export async function addPredictionCommentAction(input: {
  gameId: string;
  content: string;
  optionId?: string;
  optionLabel?: string;
}): Promise<{
  success: boolean;
  comment?: PredictionCommentDTO;
  earnedPmp?: number;
  newBalance?: number;
  error?: string;
}> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser();

    if (authErr || !user) {
      return { success: false, error: "로그인이 필요합니다." };
    }

    // 유저가 "user".users 테이블에 등록되어 있는지 확인 및 보장 (외래키 제약조건 충족)
    await ensureUserInDatabase(user);

    if (!input.content.trim()) {
      return { success: false, error: "의견 내용을 입력해주세요." };
    }

    const postId = await ensureForumPostForGame(input.gameId, user.id);
    if (!postId) {
      return { success: false, error: "토론 게시판을 찾을 수 없습니다." };
    }

    const commentId = crypto.randomUUID();
    const now = new Date().toISOString();
    const pmpReward = 10; // 댓글 작성 리워드 10 PMP

    // 1. 댓글 레코드 생성
    const { error: commentErr } = await supabaseAdmin
      .schema("forum")
      .from("forum_comments")
      .insert({
        id: commentId,
        post_id: postId,
        author_id: user.id,
        content: input.content.trim(),
        depth: 0,
        path: commentId,
        status: "published",
        pmp_earned: pmpReward,
        metadata: {
          optionId: input.optionId,
          optionLabel: input.optionLabel,
          gameId: input.gameId,
        },
        like_count: 0,
        created_at: now,
        updated_at: now,
      });

    if (commentErr) {
      console.error("addPredictionCommentAction comment insert error:", commentErr);
      return { success: false, error: commentErr.message };
    }

    // 2. 포스트 댓글 카운트 증가
    try {
      await supabaseAdmin.rpc("increment", {
        row_id: postId,
        table_name: "forum.forum_posts",
        column_name: "comment_count",
      });
    } catch {
      // 무시
    }

    // 3. 사용자 PMP 잔액에 +10 PMP 활동 리워드 즉시 지급 (economy.grant_pmp 및 pmp_pmc_transactions 기록)
    let newBalance = 0;
    try {
      await supabaseAdmin
        .schema("economy")
        .rpc("grant_pmp", {
          p_user_id: user.id,
          p_amount: pmpReward,
          p_description: `예측 공론장 의견 작성 리워드 (+${pmpReward} PMP)`,
          p_source: "prediction_comment",
        });

      const { data: account } = await supabaseAdmin
        .schema("economy")
        .from("pmp_pmc_accounts")
        .select("pmp_balance")
        .eq("user_id", user.id)
        .maybeSingle();

      newBalance = Number(account?.pmp_balance) || pmpReward;
    } catch (econErr) {
      console.warn("PMP reward account update warning:", econErr);
    }

    // 사용자 이름 조회 ("user".profiles 스키마 사용)
    const { data: profile } = await supabaseAdmin
      .schema("user")
      .from("profiles")
      .select("username, display_name")
      .eq("id", user.id)
      .maybeSingle();

    const authorName =
      (profile as any)?.display_name ||
      profile?.username ||
      user.user_metadata?.display_name ||
      user.email?.split("@")[0] ||
      "시민";

    const newComment: PredictionCommentDTO = {
      id: commentId,
      postId,
      authorId: user.id,
      authorName,
      authorAvatar: "bg-gradient-to-tr from-purple-500 to-pink-500",
      content: input.content.trim(),
      optionId: input.optionId,
      optionLabel: input.optionLabel,
      pmpEarned: pmpReward,
      likeCount: 0,
      createdAt: now,
    };

    revalidatePath("/prediction", "layout");

    return {
      success: true,
      comment: newComment,
      earnedPmp: pmpReward,
      newBalance,
    };
  } catch (e: any) {
    console.error("addPredictionCommentAction exception:", e);
    return { success: false, error: e?.message || "댓글 등록 중 오류가 발생했습니다." };
  }
}

/**
 * 댓글 좋아요 증가
 */
export async function likePredictionCommentAction(
  commentId: string
): Promise<{ success: boolean; newLikes?: number; error?: string }> {
  try {
    const { data: comment, error: fetchErr } = await supabaseAdmin
      .schema("forum")
      .from("forum_comments")
      .select("like_count")
      .eq("id", commentId)
      .single();

    if (fetchErr || !comment) {
      return { success: false, error: "댓글을 찾을 수 없습니다." };
    }

    const newLikes = (comment.like_count || 0) + 1;

    const { error: updateErr } = await supabaseAdmin
      .schema("forum")
      .from("forum_comments")
      .update({ like_count: newLikes })
      .eq("id", commentId);

    if (updateErr) {
      return { success: false, error: updateErr.message };
    }

    return { success: true, newLikes };
  } catch (e: any) {
    return { success: false, error: e?.message };
  }
}
