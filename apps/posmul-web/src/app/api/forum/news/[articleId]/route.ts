import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../../../lib/supabase/server";
import { SupabaseNewsRepository } from "../../../../../bounded-contexts/forum/infrastructure/repositories/supabase-news.repository";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ articleId: string }> }
) {
  try {
    const { articleId } = await context.params;
    if (!articleId) {
      return NextResponse.json(
        { success: false, error: { code: "BAD_REQUEST", message: "기사 ID가 필요합니다." } },
        { status: 400 }
      );
    }

    let userId: string | null = null;
    try {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      userId = user?.id ?? null;
    } catch {
      userId = null;
    }

    const newsRepo = new SupabaseNewsRepository();
    const article = await newsRepo.getPublishedNewsById(articleId, userId);

    if (!article) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "발행된 뉴스를 찾을 수 없습니다." } },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        article,
        isAuthenticated: Boolean(userId),
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message } },
      { status: 500 }
    );
  }
}
