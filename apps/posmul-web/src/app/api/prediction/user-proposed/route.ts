import { NextResponse } from "next/server";
import { createClient as createSupabaseServerClient } from "../../../../lib/supabase/server";

import { createClient } from "@supabase/supabase-js";

type PredictionTypeInput = "binary" | "multiple" | "numeric";

type RequestBody = {
  title: string;
  description: string;
  predictionType: PredictionTypeInput;
  options: string[];
  endTime: string;
  settlementTime: string;
  minimumStake: number;
  maximumStake: number;
};

const normalizeSlug = (value: string): string => {
  const trimmed = value.trim();
  const collapsed = trimmed.replace(/\s+/g, "-");
  const cleaned = collapsed.replace(/[^\p{L}\p{N}\-_.]/gu, "");
  const deduped = cleaned.replace(/-+/g, "-");
  const withoutEdge = deduped.replace(/^-+|-+$/g, "");
  return withoutEdge || "prediction";
};

const mapPredictionType = (value: PredictionTypeInput): "BINARY" | "RANKING" => {
  switch (value) {
    case "binary":
      return "BINARY";
    case "multiple":
    case "numeric":
      return "RANKING";
  }
};

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body = (await request.json()) as Partial<RequestBody>;

    if (
      typeof body.title !== "string" ||
      typeof body.description !== "string" ||
      (body.predictionType !== "binary" &&
        body.predictionType !== "multiple" &&
        body.predictionType !== "numeric") ||
      !Array.isArray(body.options) ||
      body.options.length < 2 ||
      typeof body.endTime !== "string" ||
      typeof body.settlementTime !== "string" ||
      typeof body.minimumStake !== "number" ||
      typeof body.maximumStake !== "number"
    ) {
      return NextResponse.json(
        { success: false, error: { message: "Invalid request body" } },
        { status: 400 }
      );
    }

    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: { message: "Unauthorized" } },
        { status: 401 }
      );
    }

    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

    if (!serviceRoleKey || !supabaseUrl) {
      return NextResponse.json(
        {
          success: false,
          error: { message: "Missing server configuration" },
        },
        { status: 500 }
      );
    }

    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });

    const options = body.options
      .map((v) => (typeof v === "string" ? v.trim() : ""))
      .filter((v) => v.length > 0);

    if (options.length < 2) {
      return NextResponse.json(
        { success: false, error: { message: "At least 2 options required" } },
        { status: 400 }
      );
    }

    const baseSlug = normalizeSlug(body.title);
    const now = new Date();

    // slug unique constraint 대응: 충돌 시 suffix 재시도
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const slugSuffix = attempt === 0 ? "" : `-${Math.random().toString(36).slice(2, 8)}`;
      const slug = `${baseSlug}-${Date.now().toString(36)}${slugSuffix}`;

      const { data, error } = await admin
        .schema("prediction")
        .from("prediction_games")
        .insert({
          game_id: crypto.randomUUID(),
          creator_id: user.id,
          title: body.title,
          description: body.description,
          category: "USER_PROPOSED",
          prediction_type: mapPredictionType(body.predictionType),
          game_options: {
            options: options.map((label, idx) => ({
              id: `opt-${idx + 1}`,
              label,
            })),
          },
          difficulty: 1.0,
          min_bet_amount: body.minimumStake,
          max_bet_amount: body.maximumStake,
          registration_start: now.toISOString(),
          registration_end: new Date(body.endTime).toISOString(),
          settlement_date: new Date(body.settlementTime).toISOString(),
          status: "ACTIVE",
          created_at: now.toISOString(),
          updated_at: now.toISOString(),
          slug,
          subcategory: "user-proposals",
          league: "all",
          tags: ["community"],
          metadata: { source: "user", route: "user-suggestions" },
        })
        .select("slug, subcategory, league")
        .single();

      if (!error && data) {
        return NextResponse.json({ success: true, data }, { status: 201 });
      }

      // unique violation이면 재시도
      const pgCode = (error as unknown as { code?: string } | null)?.code;
      if (pgCode === "23505") {
        continue;
      }

      return NextResponse.json(
        { success: false, error: { message: error?.message ?? "Insert failed" } },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: false, error: { message: "Slug conflict" } },
      { status: 409 }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error";
    return NextResponse.json(
      { success: false, error: { message } },
      { status: 500 }
    );
  }
}
