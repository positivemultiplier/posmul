import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../../../../lib/supabase/server";
import { SupabaseNewsRepository } from "../../../../../../bounded-contexts/forum/infrastructure/repositories/supabase-news.repository";

export const dynamic = "force-dynamic";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ articleId: string }> }
) {
  try {
    const { articleId } = await context.params;
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: "퀴즈 제출 및 PMP 보상을 받으려면 로그인이 필요합니다.",
          },
        },
        { status: 401 }
      );
    }

    const body: unknown = await request.json();
    const selectedAnswers =
      isRecord(body) && Array.isArray(body.answers)
        ? body.answers.map((v) => Number(v))
        : [];

    if (selectedAnswers.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "INVALID_REQUEST", message: "선택한 답안이 필요합니다." },
        },
        { status: 400 }
      );
    }

    const newsRepo = new SupabaseNewsRepository();
    const result = await newsRepo.submitNewsQuiz({
      articleId,
      userId: user.id,
      selectedAnswers,
    });

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "QUIZ_ERROR", message: result.error || "퀴즈 채점 실패" },
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message } },
      { status: 500 }
    );
  }
}
