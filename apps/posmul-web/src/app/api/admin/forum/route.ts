import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { banIp, unbanIp } from "@/shared/lib/security/ip-ban";

export async function GET(req: NextRequest) {
  try {
    // 1. 최신 게시글 50개 조회
    const { data: posts, error: postsError } = await supabaseAdmin
      .schema("forum")
      .from("forum_posts")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);

    if (postsError) {
      return NextResponse.json({ success: false, error: postsError.message }, { status: 500 });
    }

    // 2. 차단된 IP 목록 조회
    const { data: bannedIps, error: banError } = await supabaseAdmin
      .schema("forum")
      .from("banned_ips")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);

    if (banError) {
      console.warn("banned_ips fetch warning:", banError.message);
    }

    return NextResponse.json({
      success: true,
      posts: posts || [],
      bannedIps: bannedIps || [],
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, title, content, postId, status, ip, reason, expiresHours } = body;
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
          title,
          content,
          status: "published",
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
        // fallback to post_id if id eq failed
        await supabaseAdmin
          .schema("forum")
          .from("forum_posts")
          .update({ status, updated_at: new Date().toISOString() })
          .eq("post_id", postId);
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
        .or(`id.eq.${postId},post_id.eq.${postId}`);

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

      // 작성자 IP 조회
      const { data: postRecord } = await supabaseAdmin
        .schema("forum")
        .from("forum_posts")
        .select("id, title, author_ip")
        .or(`id.eq.${postId},post_id.eq.${postId}`)
        .maybeSingle();

      // 게시글 삭제
      const { error: delError } = await supabaseAdmin
        .schema("forum")
        .from("forum_posts")
        .delete()
        .or(`id.eq.${postId},post_id.eq.${postId}`);

      if (delError) {
        return NextResponse.json({ success: false, error: delError.message }, { status: 500 });
      }

      const targetIp = postRecord?.author_ip;
      let ipBanned = false;

      if (targetIp && targetIp !== "127.0.0.1" && !targetIp.includes("관리자")) {
        await banIp({
          ip: targetIp,
          reason: reason || `스팸/악성 게시글 작성으로 영구 차단됨 (글: ${postRecord?.title?.slice(0, 20)})`,
          bannedBy: "ADMIN_SPAM_PURGE",
        });
        ipBanned = true;
      }

      return NextResponse.json({
        success: true,
        purgedPostId: postId,
        bannedIp: targetIp || null,
        ipBanned,
      });
    }

    return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
