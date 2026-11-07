import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

export async function GET() {
  try {
    const supabase = await createClient();

    // 1. 유저 세션 확인 (없을 시 데모 유저 ID 사용)
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const userId = user?.id || "00000000-0000-0000-0000-000000000001";

    const admin = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    );

    // 2. 유저 자산 정보 조회 (economy.pmp_pmc_accounts Single Source of Truth)
    let assets = {
      pmp: 15000,
      pmc: 3500,
      pmg: 320,
    };

    const { data: dbAccount } = await admin
      .schema("economy")
      .from("pmp_pmc_accounts")
      .select("pmp_balance, pmc_balance")
      .eq("user_id", userId)
      .maybeSingle();

    if (dbAccount) {
      assets = {
        pmp: Number(dbAccount.pmp_balance ?? assets.pmp),
        pmc: Number(dbAccount.pmc_balance ?? assets.pmc),
        pmg: 320,
      };
    }

    // 3. 예측 게임 배팅 내역 조회 (prediction.predictions + prediction_games)
    const { data: predictionBets } = await admin
      .schema("prediction")
      .from("predictions")
      .select("prediction_id, game_id, bet_amount, is_active, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(15);

    const gameIds = Array.from(
      new Set((predictionBets || []).map((b: any) => b.game_id).filter(Boolean))
    );

    const gameMap = new Map<string, { title: string; status: string }>();
    if (gameIds.length > 0) {
      const { data: games } = await admin
        .schema("prediction")
        .from("prediction_games")
        .select("game_id, title, status")
        .in("game_id", gameIds);
      for (const g of games || []) {
        gameMap.set(g.game_id, { title: g.title, status: g.status });
      }
    }

    // 4. 통합 원장(Ledger Transactions) 조합
    const transactions = [
      {
        id: "tx-bonus-welcome",
        type: "reward",
        title: "🎁 시민 기본 활동 보너스 적립",
        amount: +10000,
        currency: "PMP",
        status: "completed",
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
      },
      {
        id: "tx-don-001",
        type: "donation",
        title: "🌱 공익 기부 - 초록우산 환경·아동재단",
        amount: -1000,
        currency: "PMC",
        status: "completed",
        createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
      },
      {
        id: "tx-con-001",
        type: "consume",
        title: "🎬 Major League 캠페인 시청 적립",
        amount: +250,
        currency: "PMP",
        status: "completed",
        createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
      },
      ...(predictionBets || []).map((bet: any) => {
        const gameInfo = gameMap.get(bet.game_id);
        return {
          id: `tx-bet-${bet.prediction_id}`,
          type: "prediction",
          title: `🎲 예측 참여: ${gameInfo?.title || `#${String(bet.game_id).substring(0, 8)}`}`,
          amount: -Number(bet.bet_amount || 0),
          currency: "PMP",
          status:
            !bet.is_active
              ? "cancelled"
              : gameInfo?.status === "SETTLED"
              ? "completed"
              : "pending",
          createdAt: bet.created_at,
        };
      }),
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json({
      success: true,
      userId,
      assets,
      transactions,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch wallet info" },
      { status: 500 }
    );
  }
}
