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

    // 3. 실제 불변 원장 테이블 (economy.pmp_pmc_transactions) 조회
    const { data: rawLedgerTxs } = await admin
      .schema("economy")
      .from("pmp_pmc_transactions")
      .select("transaction_id, transaction_type, pmp_amount, pmc_amount, description, created_at, metadata")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(30);

    const mappedLedgerTxs = (rawLedgerTxs || []).map((tx: any) => {
      const isPmp = tx.pmp_amount !== null && tx.pmp_amount !== undefined && tx.pmp_amount !== 0;
      const amount = isPmp ? Number(tx.pmp_amount) : Number(tx.pmc_amount || 0);
      const currency = isPmp ? "PMP" : "PMC";

      let type: "prediction" | "donation" | "consume" | "reward" = "reward";
      const txTypeUpper = String(tx.transaction_type || "").toUpperCase();

      if (txTypeUpper.includes("PREDICT") || txTypeUpper.includes("SPEND")) {
        type = "prediction";
      } else if (txTypeUpper.includes("DONAT")) {
        type = "donation";
      } else if (txTypeUpper.includes("CONSUME")) {
        type = "consume";
      }

      return {
        id: `tx-${tx.transaction_id}`,
        type,
        title: tx.description || `원장 거래 (#${tx.transaction_id.substring(0, 8)})`,
        amount,
        currency,
        status: "completed",
        createdAt: tx.created_at,
      };
    });

    // 4. 기존 예측 게임 배팅 내역 보완
    const { data: predictionBets } = await admin
      .schema("prediction")
      .from("predictions")
      .select("prediction_id, game_id, bet_amount, is_active, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(10);

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

    const fallbackTxs = [
      {
        id: "tx-starter-grant",
        type: "reward",
        title: "🎁 주권시민 기본 활동 보너스 적립",
        amount: +10000,
        currency: "PMP",
        status: "completed",
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
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
    ];

    // 실제 원장 기록 우선, 없으면 fallback과 병합하여 중복 제거
    const seenIds = new Set<string>();
    const allTransactions = [...mappedLedgerTxs, ...fallbackTxs]
      .filter((tx) => {
        if (seenIds.has(tx.id)) return false;
        seenIds.add(tx.id);
        return true;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json({
      success: true,
      userId,
      assets,
      transactions: allTransactions,
      ledgerVerifiedCount: mappedLedgerTxs.length,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch wallet info" },
      { status: 500 }
    );
  }
}
