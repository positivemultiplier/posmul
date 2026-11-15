import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../../lib/supabase/server";
import { SupabaseNewsRepository } from "../../../../bounded-contexts/forum/infrastructure/repositories/supabase-news.repository";
import { getForumDailyEarnedPmp } from "../../../forum/forum-pmp-ledger";
import { FORUM_DAILY_MAX_PMP } from "../../../forum/forum-pmp-policy";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category") || "all";
    const regionCode = searchParams.get("region") || "";
    const search = searchParams.get("q") || "";
    const limitParam = Number(searchParams.get("limit") || "40");

    const newsRepo = new SupabaseNewsRepository();
    const articles = await newsRepo.listPublishedNews({
      category,
      regionCode,
      search,
      limit: Number.isFinite(limitParam) ? limitParam : 40,
    });

    let dailyEarnedPmp = 0;
    let isAuthenticated = false;
    try {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        isAuthenticated = true;
        dailyEarnedPmp = await getForumDailyEarnedPmp(supabase, user.id);
      }
    } catch {
      // 비로그인 요청도 뉴스 목록은 정상 조회
    }

    return NextResponse.json({
      success: true,
      data: {
        articles,
        viewer: {
          isAuthenticated,
          dailyEarnedPmp,
          dailyMaxPmp: FORUM_DAILY_MAX_PMP,
        },
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
