import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { requireAdminApi } from "@/shared/lib/security/admin-auth";

export async function POST(req: NextRequest) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;

  try {
    const body = await req.json();
    const {
      title,
      description,
      category,
      options,
      minBetAmount,
      maxBetAmount,
      registrationEnd,
      settlementDate,
    } = body;

    if (!title || !options || options.length < 2) {
      return NextResponse.json({ success: false, error: "Title and at least 2 options are required." }, { status: 400 });
    }

    const slug = `${title.substring(0, 20).replace(/\s+/g, "-").toLowerCase()}-${Date.now()}`;
    const creatorId =
      auth.authType === "admin"
        ? auth.user.id
        : "00000000-0000-0000-0000-000000000001";

    const { data: newGame, error } = await supabaseAdmin
      .schema("prediction")
      .from("prediction_games")
      .insert({
        title,
        description: description || title,
        status: "ACTIVE",
        category: category || "POLITICS",
        creator_id: creatorId,
        prediction_type: "BINARY",
        game_options: { options },
        registration_start: new Date().toISOString(),
        registration_end: registrationEnd || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        settlement_date: settlementDate || new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toISOString(),
        min_bet_amount: minBetAmount || 100,
        max_bet_amount: maxBetAmount || 10000,
        difficulty: 1.0,
        slug,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, game: newGame });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
