import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { requireAdminApi } from "@/shared/lib/security/admin-auth";
import { banIp, unbanIp } from "@/shared/lib/security/ip-ban";
import {
  getAllBannedWords,
  addBannedWord,
  deleteBannedWord,
} from "@/shared/lib/security/banned-words";

export async function GET(req: NextRequest) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;

  try {
    const url = new URL(req.url);
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") || "20", 10)));
    const search = url.searchParams.get("search")?.trim() || "";
    const status = url.searchParams.get("status") || "all";
    const sortBy = url.searchParams.get("sortBy") || "latest";
    const offset = (page - 1) * limit;

    // 1. 게시글 쿼리 구성
    let postsQuery = supabaseAdmin
      .schema("forum")
      .from("forum_posts")
      .select("*", { count: "exact" });

    // 상태 필터
    if (status && status !== "all") {
      postsQuery = postsQuery.eq("status", status);
    }

    // 검색 필터 (제목, 내용, IP)
    if (search) {
      postsQuery = postsQuery.or(`title.ilike.%${search}%,content.ilike.%${search}%,author_ip.ilike.%${search}%`);
    }

    // 정렬
    if (sortBy === "likes") {
      postsQuery = postsQuery.order("like_count", { ascending: false });
    } else if (sortBy === "comments") {
      postsQuery = postsQuery.order("comment_count", { ascending: false });
    } else if (sortBy === "views") {
      postsQuery = postsQuery.order("view_count", { ascending: false });
    } else {
      postsQuery = postsQuery.order("created_at", { ascending: false });
    }

    // 페이징
    const { data: posts, error: postsError, count: totalPostsCount } = await postsQuery
      .range(offset, offset + limit - 1);

    if (postsError) {
      return NextResponse.json({ success: false, error: postsError.message }, { status: 500 });
    }

    // 2. 최신 댓글 목록 (최신 30개)
    const { data: comments, error: commentsError, count: totalCommentsCount } = await supabaseAdmin
      .schema("forum")
      .from("forum_comments")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .limit(30);

    if (commentsError) {
      console.warn("forum_comments fetch warning:", commentsError.message);
    }

    // 3. 차단된 IP 목록 조회 (최신 100개)
    const { data: bannedIps, error: banError, count: totalBannedCount } = await supabaseAdmin
      .schema("forum")
      .from("banned_ips")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .limit(100);

    if (banError) {
      console.warn("banned_ips fetch warning:", banError.message);
    }

    // 4. 금지어 목록 조회
    const bannedWords = await getAllBannedWords();

    return NextResponse.json({
      success: true,
      pagination: {
        page,
        limit,
        totalPosts: totalPostsCount || 0,
        totalPages: Math.ceil((totalPostsCount || 0) / limit),
      },
      stats: {
        totalPosts: totalPostsCount || 0,
        totalComments: totalCommentsCount || 0,
        totalBannedIps: totalBannedCount || 0,
        totalBannedWords: bannedWords.length,
      },
      posts: posts || [],
      comments: comments || [],
      bannedIps: bannedIps || [],
      bannedWords: bannedWords || [],
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;

  try {
    const body = await req.json();
    const {
      action,
      title,
      content,
      postId,
      commentId,
      status,
      ip,
      reason,
      expiresHours,
      word,
      wordId,
    } = body;
    const SYSTEM_USER_ID = "00000000-0000-0000-0000-000000000001";

    // 1. 신규 포럼 글 생성
    if (action === "create") {
      if (!title || !content) {
        return NextResponse.json({ success: false, error: "Title and content are required" }, { status: 400 });
      }

      const { data: newPost, error } = await supabaseAdmin
        .schema("forum")
        .from("forum_posts")
        .insert({
          title: title.trim(),
          content: content.trim(),
          status: "published",
          category_id: "040567a7-dd38-4826-896b-08da1bfcd25d",
          post_type: "debate",
          section: "DEBATE",
          author_id: SYSTEM_USER_ID,
          author_ip: "127.0.0.1 (관리자)",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, post: newPost });
    }

    // 2. 게시글 상태 변경 (published / hidden)
    if (action === "update-status") {
      if (!postId || !status) {
        return NextResponse.json({ success: false, error: "postId and status required" }, { status: 400 });
      }

      const { error } = await supabaseAdmin
        .schema("forum")
        .from("forum_posts")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", postId);

      if (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true });
    }

    // 3. 게시글 일반 삭제
    if (action === "delete") {
      if (!postId) {
        return NextResponse.json({ success: false, error: "postId required" }, { status: 400 });
      }

      const { error } = await supabaseAdmin
        .schema("forum")
        .from("forum_posts")
        .delete()
        .eq("id", postId);

      if (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true });
    }

    // 4. IP 직접 차단 등록
    if (action === "ban-ip") {
      if (!ip) {
        return NextResponse.json({ success: false, error: "차단할 IP 주소가 필요합니다." }, { status: 400 });
      }

      const expiresAt = expiresHours ? new Date(Date.now() + Number(expiresHours) * 3600 * 1000) : null;
      const result = await banIp({
        ip,
        reason: reason || "관리자 수동 차단",
        bannedBy: "ADMIN_MANUAL",
        expiresAt,
      });

      if (!result.success) {
        return NextResponse.json({ success: false, error: result.error }, { status: 500 });
      }

      return NextResponse.json({ success: true, message: `${ip} 차단 완료` });
    }

    // 5. IP 차단 해제
    if (action === "unban-ip") {
      if (!ip) {
        return NextResponse.json({ success: false, error: "해제할 IP 주소가 필요합니다." }, { status: 400 });
      }

      const result = await unbanIp(ip);
      if (!result.success) {
        return NextResponse.json({ success: false, error: result.error }, { status: 500 });
      }

      return NextResponse.json({ success: true, message: `${ip} 차단 해제 완료` });
    }

    // 6. 스팸 게시글 즉시 영구 삭제 + 작성자 IP 자동 차단
    if (action === "purge-post-and-ban-ip") {
      if (!postId) {
        return NextResponse.json({ success: false, error: "postId required" }, { status: 400 });
      }

      // 게시글 및 작성자 IP 조회
      const { data: postRecord } = await supabaseAdmin
        .schema("forum")
        .from("forum_posts")
        .select("id, title, author_ip")
        .eq("id", postId)
        .maybeSingle();

      const rawIp = postRecord?.author_ip?.trim();
      let ipBanned = false;
      let targetIp: string | null = null;

      // 작성자 IP가 유효하면 즉시 IP 차단 등록
      if (
        rawIp &&
        rawIp !== "127.0.0.1" &&
        !rawIp.includes("관리자") &&
        rawIp !== "기록 없음"
      ) {
        targetIp = rawIp.split(" ")[0].trim();
        const banRes = await banIp({
          ip: targetIp,
          reason: reason || `스팸/악성 게시글 작성으로 영구 차단됨 (글: ${postRecord?.title?.slice(0, 20)})`,
          bannedBy: "ADMIN_SPAM_PURGE",
        });
        if (banRes.success) {
          ipBanned = true;
        }
      }

      // 게시글 삭제
      const { error: delError } = await supabaseAdmin
        .schema("forum")
        .from("forum_posts")
        .delete()
        .eq("id", postId);

      if (delError) {
        return NextResponse.json({ success: false, error: delError.message }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        purgedPostId: postId,
        bannedIp: targetIp,
        ipBanned,
      });
    }

    // 7. 댓글 일반 삭제
    if (action === "delete-comment") {
      if (!commentId) {
        return NextResponse.json({ success: false, error: "commentId required" }, { status: 400 });
      }

      const { error } = await supabaseAdmin
        .schema("forum")
        .from("forum_comments")
        .delete()
        .eq("id", commentId);

      if (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true });
    }

    // 8. 악성 댓글 삭제 + 작성자 IP 즉시 차단
    if (action === "purge-comment-and-ban-ip") {
      if (!commentId) {
        return NextResponse.json({ success: false, error: "commentId required" }, { status: 400 });
      }

      const { data: commentRecord } = await supabaseAdmin
        .schema("forum")
        .from("forum_comments")
        .select("id, content, author_ip")
        .eq("id", commentId)
        .maybeSingle();

      const { error: delError } = await supabaseAdmin
        .schema("forum")
        .from("forum_comments")
        .delete()
        .eq("id", commentId);

      if (delError) {
        return NextResponse.json({ success: false, error: delError.message }, { status: 500 });
      }

      const targetIp = commentRecord?.author_ip;
      let ipBanned = false;

      if (targetIp && targetIp !== "127.0.0.1" && !targetIp.includes("관리자")) {
        await banIp({
          ip: targetIp,
          reason: reason || `악성/스팸 댓글 작성으로 IP 영구 차단됨 (댓글: ${commentRecord?.content?.slice(0, 20)})`,
          bannedBy: "ADMIN_COMMENT_PURGE",
        });
        ipBanned = true;
      }

      return NextResponse.json({
        success: true,
        purgedCommentId: commentId,
        bannedIp: targetIp || null,
        ipBanned,
      });
    }

    // 9. 금지어 추가
    if (action === "add-banned-word") {
      if (!word) {
        return NextResponse.json({ success: false, error: "금지어 단어가 필요합니다." }, { status: 400 });
      }

      const result = await addBannedWord({
        word,
        reason: reason || "관리자 지정 금지어",
        createdBy: "ADMIN",
      });

      if (!result.success) {
        return NextResponse.json({ success: false, error: result.error }, { status: 500 });
      }

      return NextResponse.json({ success: true, message: `'${word}' 금지어 등록 완료` });
    }

    // 10. 금지어 삭제
    if (action === "delete-banned-word") {
      const target = wordId || word;
      if (!target) {
        return NextResponse.json({ success: false, error: "삭제할 금지어 식별자가 필요합니다." }, { status: 400 });
      }

      const result = await deleteBannedWord(target);
      if (!result.success) {
        return NextResponse.json({ success: false, error: result.error }, { status: 500 });
      }

      return NextResponse.json({ success: true, message: "금지어 삭제 완료" });
    }

    return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
