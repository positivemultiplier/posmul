"use server";

import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { checkIsIpBanned, banIp } from "@/shared/lib/security/ip-ban";
import { checkTextForBannedWords } from "@/shared/lib/security/banned-words";

async function getClientIpFromHeaders(): Promise<string> {
  try {
    const h = await headers();
    const forwarded = h.get("x-forwarded-for");
    if (forwarded) {
      const first = forwarded.split(",")[0].trim();
      if (first) return first;
    }
    const realIp = h.get("x-real-ip");
    if (realIp) return realIp.trim();
    const cfIp = h.get("cf-connecting-ip");
    if (cfIp) return cfIp.trim();
  } catch {}
  return "127.0.0.1";
}

export interface GalleryPostDTO {
  id: string;
  categoryId: string;
  categoryName: string;
  gameId?: string;
  gameTitle?: string;
  tag?: string;
  title: string;
  content: string;
  authorId: string;
  authorName: string;
  authorBadge?: string; // 예: "3.0% 이하 베팅"
  likeCount: number;
  dislikeCount: number;
  commentCount: number;
  viewCount: number;
  isPinned: boolean;
  isConcept: boolean; // 추천 3개 이상이면 개념글
  createdAt: string;
}

export interface GalleryCommentDTO {
  id: string;
  postId: string;
  authorId: string;
  authorName: string;
  authorBadge?: string;
  content: string;
  likeCount: number;
  pmpEarned: number;
  createdAt: string;
}

const DEFAULT_CATEGORY_MAP: Record<string, string> = {
  all: "전체",
  economy: "경제/주식",
  crypto: "크립토",
  politics: "정치/사회",
  culture: "엔터/문화",
  free: "자유/잡담",
};

/**
 * 사용자 정보 외래키 보장
 */
async function ensureUserExists(userId: string, email?: string, name?: string) {
  try {
    const { data: existing } = await supabaseAdmin
      .schema("user")
      .from("users")
      .select("id")
      .eq("id", userId)
      .maybeSingle();

    if (existing?.id) return;

    await supabaseAdmin
      .schema("user")
      .from("users")
      .insert({
        id: userId,
        email: email || `user_${userId.substring(0, 8)}@posmul.com`,
        username: name || `citizen_${userId.substring(0, 6)}`,
        full_name: name || "시민",
        is_active: true,
      });
  } catch (err) {
    console.warn("ensureUserExists non-fatal warning:", err);
  }
}

/**
 * 갤러리 게시글 목록 조회 (DC갤 스타일)
 */
export async function getGalleryPostsAction(params: {
  category?: string; // "all", "concept", "economy", "crypto", "politics", "culture", "free"
  gameId?: string;
  page?: number;
  limit?: number;
}): Promise<{ success: boolean; posts: GalleryPostDTO[]; total: number; error?: string }> {
  try {
    const { category = "all", gameId, page = 1, limit = 20 } = params;
    const offset = (page - 1) * limit;

    let query = supabaseAdmin
      .schema("forum")
      .from("forum_posts")
      .select("id, category_id, author_id, title, content, like_count, dislike_count, comment_count, view_count, is_pinned, tags, metadata, created_at", { count: "exact" })
      .eq("status", "published");

    // 개념글 필터
    if (category === "concept") {
      query = query.gte("like_count", 3);
    } else if (category && category !== "all") {
      // 태그나 카테고리로 필터
      query = query.contains("tags", [category]);
    }

    // 특정 게임 연동 필터
    if (gameId) {
      query = query.eq("metadata->>gameId", gameId);
    }

    query = query
      .order("is_pinned", { ascending: false })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    const { data: posts, count, error } = await query;

    if (error) {
      console.error("getGalleryPostsAction query error:", error);
      return { success: false, posts: [], total: 0, error: error.message };
    }

    // 작성자 프로필 조회
    const authorIds = Array.from(new Set((posts || []).map((p) => p.author_id)));
    const userMap = new Map<string, string>();

    if (authorIds.length > 0) {
      const { data: profiles } = await supabaseAdmin
        .schema("user")
        .from("profiles")
        .select("id, username, display_name")
        .in("id", authorIds);

      (profiles || []).forEach((p: any) => {
        userMap.set(p.id, p.display_name || p.username || "시민");
      });
    }

    const mappedPosts: GalleryPostDTO[] = (posts || []).map((p) => {
      const meta = (p.metadata as any) || {};
      const likeCount = p.like_count || 0;
      const authorName = userMap.get(p.author_id) || meta.authorName || `시민_${p.author_id.substring(0, 5)}`;

      return {
        id: p.id,
        categoryId: p.category_id || "general",
        categoryName: meta.categoryName || "일반",
        gameId: meta.gameId,
        gameTitle: meta.gameTitle,
        tag: p.tags?.[0] || meta.tag || (meta.gameTitle ? meta.gameTitle.slice(0, 15) : "자유"),
        title: p.title,
        content: p.content,
        authorId: p.author_id,
        authorName,
        authorBadge: meta.betOptionLabel ? `${meta.betOptionLabel} 지지` : undefined,
        likeCount,
        dislikeCount: p.dislike_count || 0,
        commentCount: p.comment_count || 0,
        viewCount: p.view_count || 0,
        isPinned: !!p.is_pinned,
        isConcept: likeCount >= 3,
        createdAt: p.created_at || new Date().toISOString(),
      };
    });

    return { success: true, posts: mappedPosts, total: count || 0 };
  } catch (err: any) {
    console.error("getGalleryPostsAction exception:", err);
    return { success: false, posts: [], total: 0, error: err?.message || "게시글 조회 중 오류가 발생했습니다." };
  }
}

/**
 * 갤러리 게시글 상세 조회
 */
export async function getGalleryPostDetailAction(
  postId: string
): Promise<{ success: boolean; post?: GalleryPostDTO; comments: GalleryCommentDTO[]; error?: string }> {
  try {
    // 1. 조회수 1 증가 (비동기)
    try {
      await supabaseAdmin.rpc("increment_post_view_count", { post_id: postId });
    } catch {}

    // 2. 게시글 본문 조회
    const { data: post, error } = await supabaseAdmin
      .schema("forum")
      .from("forum_posts")
      .select("*")
      .eq("id", postId)
      .single();

    if (error || !post) {
      return { success: false, comments: [], error: "게시글을 찾을 수 없습니다." };
    }

    // 3. 댓글 목록 조회
    const { data: rawComments } = await supabaseAdmin
      .schema("forum")
      .from("forum_comments")
      .select("id, post_id, author_id, content, like_count, pmp_earned, metadata, created_at")
      .eq("post_id", postId)
      .eq("status", "published")
      .order("created_at", { ascending: true });

    // 작성자 이름 조회
    const authorIds = Array.from(new Set([post.author_id, ...(rawComments || []).map((c) => c.author_id)]));
    const userMap = new Map<string, string>();

    if (authorIds.length > 0) {
      const { data: profiles } = await supabaseAdmin
        .schema("user")
        .from("profiles")
        .select("id, username, display_name")
        .in("id", authorIds);

      (profiles || []).forEach((p: any) => {
        userMap.set(p.id, p.display_name || p.username || "시민");
      });
    }

    const meta = (post.metadata as any) || {};
    const mappedPost: GalleryPostDTO = {
      id: post.id,
      categoryId: post.category_id,
      categoryName: meta.categoryName || "일반",
      gameId: meta.gameId,
      gameTitle: meta.gameTitle,
      tag: post.tags?.[0] || meta.tag || "자유",
      title: post.title,
      content: post.content,
      authorId: post.author_id,
      authorName: userMap.get(post.author_id) || meta.authorName || "시민",
      authorBadge: meta.betOptionLabel ? `${meta.betOptionLabel} 지지` : undefined,
      likeCount: post.like_count || 0,
      dislikeCount: post.dislike_count || 0,
      commentCount: post.comment_count || (rawComments?.length || 0),
      viewCount: (post.view_count || 0) + 1,
      isPinned: !!post.is_pinned,
      isConcept: (post.like_count || 0) >= 3,
      createdAt: post.created_at || new Date().toISOString(),
    };

    const mappedComments: GalleryCommentDTO[] = (rawComments || []).map((c) => {
      const cMeta = (c.metadata as any) || {};
      return {
        id: c.id,
        postId: c.post_id,
        authorId: c.author_id,
        authorName: userMap.get(c.author_id) || cMeta.authorName || `시민_${c.author_id.substring(0, 5)}`,
        authorBadge: cMeta.betOptionLabel ? `${cMeta.betOptionLabel} 베팅` : undefined,
        content: c.content,
        likeCount: c.like_count || 0,
        pmpEarned: Number(c.pmp_earned) || 10,
        createdAt: c.created_at || new Date().toISOString(),
      };
    });

    return { success: true, post: mappedPost, comments: mappedComments };
  } catch (err: any) {
    return { success: false, comments: [], error: err?.message || "게시글 상세 로드 실패" };
  }
}

/**
 * 새 글 작성
 */
export async function createGalleryPostAction(params: {
  title: string;
  content: string;
  category: string; // "economy", "crypto", "politics", "culture", "free"
  gameId?: string;
  gameTitle?: string;
  tag?: string;
  honeypot?: string;
}): Promise<{ success: boolean; post?: GalleryPostDTO; error?: string }> {
  try {
    const clientIp = await getClientIpFromHeaders();

    // 1. IP 차단 여부 검사
    const ipStatus = await checkIsIpBanned(clientIp);
    if (ipStatus.banned) {
      return {
        success: false,
        error: `접근이 제한된 IP입니다: ${ipStatus.reason || "비정상 활동 탐지"}`,
      };
    }

    // 2. 허니팟 봇 트랩 검사
    if (params.honeypot && params.honeypot.trim().length > 0) {
      await banIp({
        ip: clientIp,
        reason: "허니팟 트랩 감지 (스팸 봇 자동 차단)",
        bannedBy: "SYSTEM_HONEYPOT",
      });
      return {
        success: false,
        error: "비정상적인 접근 패턴이 감지되어 IP가 즉시 차단되었습니다.",
      };
    }

    // 3. 금지어(욕설/스팸/불법키워드) 검사
    const bannedCheck = await checkTextForBannedWords(`${params.title} ${params.content}`);
    if (bannedCheck.hasBannedWord) {
      return {
        success: false,
        error: `등록할 수 없는 금지어('${bannedCheck.detectedWord}')가 포함되어 있습니다.`,
      };
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // 비로그인 시 임시 데모 유저 또는 로그인 유도
    const authorId = user?.id || "00000000-0000-0000-0000-000000000001";
    const authorName = user?.user_metadata?.display_name || user?.email?.split("@")[0] || "익명시민";

    await ensureUserExists(authorId, user?.email, authorName);

    // 사용자의 해당 게임 베팅 내역 조회 (베팅 배지용)
    let betOptionLabel: string | undefined;
    if (params.gameId && user?.id) {
      const { data: userBet } = await supabaseAdmin
        .schema("prediction")
        .from("prediction_bets")
        .select("selected_option")
        .eq("game_id", params.gameId)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (userBet?.selected_option) {
        betOptionLabel = userBet.selected_option;
      }
    }

    const tags = [params.category];
    if (params.tag) tags.push(params.tag);
    if (params.gameTitle) tags.push(params.gameTitle.slice(0, 15));

    const metadata = {
      gameId: params.gameId,
      gameTitle: params.gameTitle,
      categoryName: DEFAULT_CATEGORY_MAP[params.category] || "자유",
      betOptionLabel,
      authorName,
    };

    const { data: newPost, error } = await supabaseAdmin
      .schema("forum")
      .from("forum_posts")
      .insert({
        category_id: "040567a7-dd38-4826-896b-08da1bfcd25d", // 기본 카테고리
        author_id: authorId,
        author_ip: clientIp,
        title: params.title.trim(),
        content: params.content.trim(),
        post_type: "debate",
        section: "DEBATE",
        status: "published",
        tags,
        metadata,
      })
      .select("*")
      .single();

    if (error || !newPost) {
      console.error("createGalleryPostAction error:", error);
      return { success: false, error: error?.message || "게시글 작성에 실패했습니다." };
    }

    // 예측 게임과 1:1 링크 생성
    if (params.gameId) {
      try {
        await supabaseAdmin
          .schema("forum")
          .from("forum_prediction_links")
          .insert({
            forum_post_id: newPost.id,
            prediction_game_id: params.gameId,
            link_type: "DISCUSSION",
          });
      } catch {}
    }

    revalidatePath("/forum");
    if (params.gameId) revalidatePath(`/prediction/${params.gameId}`);

    return {
      success: true,
      post: {
        id: newPost.id,
        categoryId: newPost.category_id,
        categoryName: metadata.categoryName,
        gameId: params.gameId,
        gameTitle: params.gameTitle,
        tag: tags[0],
        title: newPost.title,
        content: newPost.content,
        authorId,
        authorName,
        authorBadge: betOptionLabel ? `${betOptionLabel} 지지` : undefined,
        likeCount: 0,
        dislikeCount: 0,
        commentCount: 0,
        viewCount: 0,
        isPinned: false,
        isConcept: false,
        createdAt: newPost.created_at || new Date().toISOString(),
      },
    };
  } catch (err: any) {
    return { success: false, error: err?.message || "오류가 발생했습니다." };
  }
}

/**
 * 게시글 추천 (개념글 가기) / 비추천
 */
export async function voteGalleryPostAction(
  postId: string,
  type: "up" | "down"
): Promise<{ success: boolean; likeCount?: number; dislikeCount?: number; error?: string }> {
  try {
    const { data: post } = await supabaseAdmin
      .schema("forum")
      .from("forum_posts")
      .select("like_count, dislike_count")
      .eq("id", postId)
      .single();

    if (!post) return { success: false, error: "게시글이 존재하지 않습니다." };

    const newLike = type === "up" ? (post.like_count || 0) + 1 : post.like_count || 0;
    const newDislike = type === "down" ? (post.dislike_count || 0) + 1 : post.dislike_count || 0;

    await supabaseAdmin
      .schema("forum")
      .from("forum_posts")
      .update({ like_count: newLike, dislike_count: newDislike })
      .eq("id", postId);

    revalidatePath("/forum");
    return { success: true, likeCount: newLike, dislikeCount: newDislike };
  } catch (err: any) {
    return { success: false, error: err?.message || "추천 처리 실패" };
  }
}

/**
 * 댓글 작성 및 +10 PMP 리워드
 */
export async function addGalleryCommentAction(params: {
  postId: string;
  content: string;
  gameId?: string;
  honeypot?: string;
}): Promise<{ success: boolean; comment?: GalleryCommentDTO; earnedPmp?: number; error?: string }> {
  try {
    const clientIp = await getClientIpFromHeaders();

    // 1. IP 차단 여부 검사
    const ipStatus = await checkIsIpBanned(clientIp);
    if (ipStatus.banned) {
      return {
        success: false,
        error: `접근이 제한된 IP입니다: ${ipStatus.reason || "비정상 활동 탐지"}`,
      };
    }

    // 2. 허니팟 봇 트랩 검사
    if (params.honeypot && params.honeypot.trim().length > 0) {
      await banIp({
        ip: clientIp,
        reason: "허니팟 트랩 감지 (댓글 스팸 봇 자동 차단)",
        bannedBy: "SYSTEM_HONEYPOT",
      });
      return {
        success: false,
        error: "비정상적인 접근 패턴이 감지되어 IP가 즉시 차단되었습니다.",
      };
    }

    // 3. 댓글 금지어 검사
    const bannedCheck = await checkTextForBannedWords(params.content);
    if (bannedCheck.hasBannedWord) {
      return {
        success: false,
        error: `댓글에 등록할 수 없는 금지어('${bannedCheck.detectedWord}')가 포함되어 있습니다.`,
      };
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const authorId = user?.id || "00000000-0000-0000-0000-000000000001";
    const authorName = user?.user_metadata?.display_name || user?.email?.split("@")[0] || "익명시민";

    await ensureUserExists(authorId, user?.email, authorName);

    // 베팅 배지 확인
    let betOptionLabel: string | undefined;
    if (params.gameId && user?.id) {
      const { data: userBet } = await supabaseAdmin
        .schema("prediction")
        .from("prediction_bets")
        .select("selected_option")
        .eq("game_id", params.gameId)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (userBet?.selected_option) betOptionLabel = userBet.selected_option;
    }

    const commentId = crypto.randomUUID();

    const { data: comment, error } = await supabaseAdmin
      .schema("forum")
      .from("forum_comments")
      .insert({
        id: commentId,
        post_id: params.postId,
        author_id: authorId,
        author_ip: clientIp,
        content: params.content.trim(),
        depth: 0,
        path: commentId,
        pmp_earned: 10,
        status: "published",
        metadata: {
          authorName,
          betOptionLabel,
        },
      })
      .select("*")
      .single();

    if (error || !comment) {
      return { success: false, error: error?.message || "댓글 등록 실패" };
    }

    // 게시글 comment_count 증가
    try {
      await supabaseAdmin
        .schema("forum")
        .rpc("increment_post_comment_count", { post_id: params.postId });
    } catch {
      // RPC가 없으면 직접 카운트 업데이트
      const { count } = await supabaseAdmin
        .schema("forum")
        .from("forum_comments")
        .select("id", { count: "exact" })
        .eq("post_id", params.postId);

      await supabaseAdmin
        .schema("forum")
        .from("forum_posts")
        .update({ comment_count: count || 1 })
        .eq("id", params.postId);
    }

    // PMP 포인트 적립 (유저 지갑)
    if (user?.id) {
      try {
        await supabaseAdmin.rpc("reward_pmp_to_user", {
          p_user_id: user.id,
          p_amount: 10,
          p_reason: "FORUM_COMMENT_REWARD",
        });
      } catch {}
    }

    revalidatePath("/forum");

    return {
      success: true,
      earnedPmp: 10,
      comment: {
        id: comment.id,
        postId: comment.post_id,
        authorId,
        authorName,
        authorBadge: betOptionLabel ? `${betOptionLabel} 베팅` : undefined,
        content: comment.content,
        likeCount: 0,
        pmpEarned: 10,
        createdAt: comment.created_at || new Date().toISOString(),
      },
    };
  } catch (err: any) {
    return { success: false, error: err?.message || "댓글 작성 오류" };
  }
}

/**
 * 글 작성 시 연동할 수 있는 활성 예측 게임 목록 조회
 */
export async function getActivePredictionGamesForForumAction(): Promise<{
  success: boolean;
  games: Array<{
    id: string;
    title: string;
    category: string;
    subcategory?: string;
    options: Array<{ id: string; text: string; odds?: number }>;
    allocatedPrizePool: number;
    participantsCount: number;
  }>;
}> {
  try {
    const { data, error } = await supabaseAdmin
      .schema("prediction")
      .from("prediction_games")
      .select("game_id, title, category, subcategory, game_options, difficulty, status")
      .in("status", ["ACTIVE", "DRAFT"])
      .order("created_at", { ascending: false })
      .limit(20);

    if (error || !data) {
      return { success: false, games: [] };
    }

    const mapped = data.map((g) => {
      let optionsList: Array<{ id: string; text: string }> = [];
      try {
        const parsed = typeof g.game_options === "string" ? JSON.parse(g.game_options) : g.game_options;
        if (parsed?.options && Array.isArray(parsed.options)) {
          optionsList = parsed.options.map((opt: any, idx: number) => ({
            id: opt.id || `opt-${idx}`,
            text: opt.label || opt.text || `선택지 ${idx + 1}`,
          }));
        }
      } catch {}

      if (optionsList.length === 0) {
        optionsList = [
          { id: "yes", text: "상승/찬성 (Yes)" },
          { id: "no", text: "하락/반대 (No)" },
        ];
      }

      return {
        id: g.game_id,
        title: g.title,
        category: g.category || "ECONOMY",
        subcategory: g.subcategory || undefined,
        options: optionsList,
        allocatedPrizePool: 2200,
        participantsCount: 14,
      };
    });

    return { success: true, games: mapped };
  } catch (err) {
    console.error("getActivePredictionGamesForForumAction error:", err);
    return { success: false, games: [] };
  }
}

/**
 * 게시글 수정 (작성자 본인 검증)
 */
export async function updateGalleryPostAction(params: {
  postId: string;
  title: string;
  content: string;
  category?: string;
  tag?: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "로그인이 필요합니다." };
    }

    // 금지어 검사
    const bannedCheck = await checkTextForBannedWords(`${params.title} ${params.content}`);
    if (bannedCheck.hasBannedWord) {
      return {
        success: false,
        error: `수정 내용에 금지어('${bannedCheck.detectedWord}')가 포함되어 있습니다.`,
      };
    }

    // 작성자 본인 확인
    const { data: post, error: fetchError } = await supabaseAdmin
      .schema("forum")
      .from("forum_posts")
      .select("id, author_id, metadata, tags")
      .eq("id", params.postId)
      .maybeSingle();

    if (fetchError || !post) {
      return { success: false, error: "게시글을 찾을 수 없습니다." };
    }

    // 어드민 여부 확인
    const isAdmin = user.email?.includes("admin") || user.id === "00000000-0000-0000-0000-000000000001";
    if (post.author_id !== user.id && !isAdmin) {
      return { success: false, error: "본인이 작성한 글만 수정할 수 있습니다." };
    }

    const updatedTags = params.category ? [params.category] : post.tags;
    if (params.tag && !updatedTags.includes(params.tag)) {
      updatedTags.push(params.tag);
    }

    const meta = (post.metadata as any) || {};
    if (params.category) {
      meta.categoryName = DEFAULT_CATEGORY_MAP[params.category] || "자유";
    }

    const { error: updateError } = await supabaseAdmin
      .schema("forum")
      .from("forum_posts")
      .update({
        title: params.title.trim(),
        content: params.content.trim(),
        tags: updatedTags,
        metadata: meta,
        updated_at: new Date().toISOString(),
      })
      .eq("id", params.postId);

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    revalidatePath("/forum");
    revalidatePath(`/forum/${params.postId}`);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "게시글 수정 실패" };
  }
}

/**
 * 게시글 삭제 (작성자 본인 검증)
 */
export async function deleteGalleryPostAction(
  postId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "로그인이 필요합니다." };
    }

    // 작성자 확인
    const { data: post, error: fetchError } = await supabaseAdmin
      .schema("forum")
      .from("forum_posts")
      .select("id, author_id")
      .eq("id", postId)
      .maybeSingle();

    if (fetchError || !post) {
      return { success: false, error: "게시글을 찾을 수 없습니다." };
    }

    const isAdmin = user.email?.includes("admin") || user.id === "00000000-0000-0000-0000-000000000001";
    if (post.author_id !== user.id && !isAdmin) {
      return { success: false, error: "본인이 작성한 글만 삭제할 수 있습니다." };
    }

    const { error: delError } = await supabaseAdmin
      .schema("forum")
      .from("forum_posts")
      .delete()
      .eq("id", postId);

    if (delError) {
      return { success: false, error: delError.message };
    }

    revalidatePath("/forum");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "게시글 삭제 실패" };
  }
}

/**
 * 댓글 수정 (작성자 본인 검증)
 */
export async function updateGalleryCommentAction(params: {
  commentId: string;
  content: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "로그인이 필요합니다." };
    }

    // 금지어 검사
    const bannedCheck = await checkTextForBannedWords(params.content);
    if (bannedCheck.hasBannedWord) {
      return {
        success: false,
        error: `댓글에 금지어('${bannedCheck.detectedWord}')가 포함되어 있습니다.`,
      };
    }

    // 작성자 확인
    const { data: comment, error: fetchError } = await supabaseAdmin
      .schema("forum")
      .from("forum_comments")
      .select("id, author_id, post_id")
      .eq("id", params.commentId)
      .maybeSingle();

    if (fetchError || !comment) {
      return { success: false, error: "댓글을 찾을 수 없습니다." };
    }

    const isAdmin = user.email?.includes("admin") || user.id === "00000000-0000-0000-0000-000000000001";
    if (comment.author_id !== user.id && !isAdmin) {
      return { success: false, error: "본인이 작성한 댓글만 수정할 수 있습니다." };
    }

    const { error: updateError } = await supabaseAdmin
      .schema("forum")
      .from("forum_comments")
      .update({
        content: params.content.trim(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", params.commentId);

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    revalidatePath(`/forum/${comment.post_id}`);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "댓글 수정 실패" };
  }
}

/**
 * 댓글 삭제 (작성자 본인 검증)
 */
export async function deleteGalleryCommentAction(params: {
  commentId: string;
  postId: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "로그인이 필요합니다." };
    }

    // 작성자 확인
    const { data: comment, error: fetchError } = await supabaseAdmin
      .schema("forum")
      .from("forum_comments")
      .select("id, author_id")
      .eq("id", params.commentId)
      .maybeSingle();

    if (fetchError || !comment) {
      return { success: false, error: "댓글을 찾을 수 없습니다." };
    }

    const isAdmin = user.email?.includes("admin") || user.id === "00000000-0000-0000-0000-000000000001";
    if (comment.author_id !== user.id && !isAdmin) {
      return { success: false, error: "본인이 작성한 댓글만 삭제할 수 있습니다." };
    }

    const { error: delError } = await supabaseAdmin
      .schema("forum")
      .from("forum_comments")
      .delete()
      .eq("id", params.commentId);

    if (delError) {
      return { success: false, error: delError.message };
    }

    revalidatePath(`/forum/${params.postId}`);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "댓글 삭제 실패" };
  }
}

