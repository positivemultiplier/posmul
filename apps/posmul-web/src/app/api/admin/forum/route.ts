import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function GET(req: NextRequest) {
  try {
    const { data: posts, error } = await supabaseAdmin
      .schema("forum")
      .from("forum_posts")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(30);

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, posts: posts || [] });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, title, content, postId, status } = body;
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
        .eq("post_id", postId);

      if (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true });
    }

    // 3. 게시글 삭제
    if (action === "delete") {
      if (!postId) {
        return NextResponse.json({ success: false, error: "postId required" }, { status: 400 });
      }

      const { error } = await supabaseAdmin
        .schema("forum")
        .from("forum_posts")
        .delete()
        .eq("post_id", postId);

      if (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
