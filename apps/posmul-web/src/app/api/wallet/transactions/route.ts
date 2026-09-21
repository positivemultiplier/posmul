import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  try {
    const supabase = await createClient();

    // 1. 유저 세션 확인 (없을 시 데모 유저 ID 사용)
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id || "00000000-0000-0000-0000-000000000001";

    // 2. 유저 자산 정보 조회 (prediction.user_assets 또는 fallback)
    let assets = {
      pmp: 12500,
      pmc: 8400,
      pmg: 320,
    };

    const { data: dbAssets } = await supabase
      .from("user_assets")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (dbAssets) {
      assets = {
        pmp: dbAssets.pmp_balance ?? assets.pmp,
        pmc: dbAssets.pmc_balance ?? assets.pmc,
        pmg: dbAssets.pmg_balance ?? assets.pmg,
      };
    }

    // 3. 예측 게임 배팅 내역 조회 (prediction.predictions)
    const { data: predictionBets } = await supabase
      .schema("prediction")
      .from("predictions")
      .select("id, game_id, selected_option_id, amount, status, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(10);

    // 4. 통합 원장(Ledger Transactions) 조합
    const transactions = [
      {
        id: "tx-don-001",
        type: "donation",
        title: "🌱 기부 - 환경재단",
        amount: -1000,
        currency: "PMC",
        status: "completed",
        createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
      },
      {
        id: "tx-con-001",
        type: "consume",
        title: "🎬 광고 시청 보상",
        amount: +50,
        currency: "PMP",
        status: "completed",
        createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
      },
      ...(predictionBets || []).map((bet) => ({
        id: `tx-bet-${bet.id}`,
        type: "prediction",
        title: `🎲 예측 배팅 (#${bet.game_id.substring(0, 8)})`,
        amount: -bet.amount,
        currency: "PMP",
        status: bet.status === "won" ? "completed" : bet.status === "lost" ? "completed" : "pending",
        createdAt: bet.created_at,
      })),
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json({
      success: true,
      userId,
      assets,
      transactions,
    });
  } catch (error: any) {
    console.error("Wallet transactions error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch wallet info" },
      { status: 500 }
    );
  }
}
