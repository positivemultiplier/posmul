import { NextResponse } from "next/server";
import { createClient } from "../../../../lib/supabase/server";
import { supabaseAdmin } from "../../../../lib/supabase/admin";

/**
 * GET /api/economy/moneywave
 * MoneyWave 현황(일일 스냅샷 + 정산 분배 이력) 및 내 수령 내역 조회
 */
export async function GET() {
  try {
    const supabase = await createClient();

    // 현재 사용자 확인
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // 1. 최신 일일 스냅샷 조회 (일일 100,000 PMC 배정 현황)
    const { data: latestSnapshot } = await supabaseAdmin
      .schema("economy")
      .from("money_wave_daily_snapshots")
      .select("*")
      .order("snapshot_date", { ascending: false })
      .limit(1)
      .maybeSingle();

    // 2. Wave별 실행 이력 조회
    const { data: waveHistory } = await supabaseAdmin
      .schema("economy")
      .from("money_wave_history")
      .select(`
        wave_id,
        wave_type,
        execution_date,
        status,
        pmc_issued,
        affected_users_count,
        dormant_pmc_amount,
        entrepreneur_count,
        total_investment_pool
      `)
      .eq("status", "completed")
      .order("execution_date", { ascending: false })
      .limit(20);

    const waves = Array.isArray(waveHistory) ? waveHistory : [];

    const wave1Data = waves.filter((w) => w.wave_type === "wave1");
    const wave2Data = waves.filter((w) => w.wave_type === "wave2");
    const wave3Data = waves.filter((w) => w.wave_type === "wave3");

    // 3. 내 수령 내역 조회 (실제 DB 컬럼명 및 거래 기록과 정합성 보장)
    const myRewards = { wave1: 0, wave2: 0, wave3: 0, total: 0 };

    if (user) {
      // Wave 1 수령 내역: 예측 게임 승리 등으로 수령한 PMC_EARN 합계
      const { data: wave1Txs } = await supabaseAdmin
        .schema("economy")
        .from("pmp_pmc_transactions")
        .select("pmc_amount")
        .eq("user_id", user.id)
        .eq("transaction_type", "PMC_EARN");

      myRewards.wave1 = (wave1Txs || []).reduce(
        (sum, r) => sum + (Number(r.pmc_amount) || 0),
        0
      );

      // Wave 2 수령 내역: target_user_id, pmc_amount 컬럼 사용
      const { data: wave2Records } = await supabaseAdmin
        .schema("economy")
        .from("money_wave2_redistribution_records")
        .select("pmc_amount")
        .eq("target_user_id", user.id);

      myRewards.wave2 = (wave2Records || []).reduce(
        (sum, r) => sum + (Number(r.pmc_amount) || 0),
        0
      );

      // Wave 3 수령 내역: entrepreneur_id, investment_amount 컬럼 사용
      const { data: wave3Records } = await supabaseAdmin
        .schema("economy")
        .from("money_wave3_entrepreneur_records")
        .select("investment_amount")
        .eq("entrepreneur_id", user.id);

      myRewards.wave3 = (wave3Records || []).reduce(
        (sum, r) => sum + (Number(r.investment_amount) || 0),
        0
      );

      myRewards.total = myRewards.wave1 + myRewards.wave2 + myRewards.wave3;
    }

    const snapshotWave1 = Number(latestSnapshot?.daily_pool_wave1_pmc) || 80000;
    const snapshotWave2 = Number(latestSnapshot?.daily_pool_wave2_pmc) || 20000;
    const snapshotWave3 = Number(latestSnapshot?.daily_pool_wave3_pmc) || 0;
    const snapshotComputedAt = latestSnapshot?.computed_at || null;

    const historyWave1Total = wave1Data.reduce(
      (sum, w) => sum + (Number(w.pmc_issued) || 0),
      0
    );
    const historyWave2Total = wave2Data.reduce(
      (sum, w) => sum + (Number(w.pmc_issued) || 0),
      0
    );

    const responseData = {
      wave1: {
        lastExecution: wave1Data[0]?.execution_date || snapshotComputedAt,
        totalPmcIssued: historyWave1Total > 0 ? historyWave1Total : snapshotWave1,
        affectedUsers: wave1Data.reduce(
          (sum, w) => sum + (w.affected_users_count || 0),
          0
        ),
      },
      wave2: {
        lastExecution: wave2Data[0]?.execution_date || snapshotComputedAt,
        dormantPmcAmount:
          Number(wave2Data[0]?.dormant_pmc_amount) || snapshotWave2,
        redistributedAmount:
          historyWave2Total > 0 ? historyWave2Total : snapshotWave2,
      },
      wave3: {
        lastExecution: wave3Data[0]?.execution_date || snapshotComputedAt,
        entrepreneurCount: wave3Data[0]?.entrepreneur_count || 0,
        investmentPool:
          Number(wave3Data[0]?.total_investment_pool) || snapshotWave3,
      },
      recentWaves: waves.slice(0, 10).map((w) => ({
        waveType: w.wave_type,
        executionDate: w.execution_date,
        pmcIssued: Number(w.pmc_issued) || 0,
        affectedUsers: w.affected_users_count || 0,
        status: w.status,
      })),
      myRewards,
    };

    return NextResponse.json({
      success: true,
      data: responseData,
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("MoneyWave API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "서버 오류가 발생했습니다.",
        },
      },
      { status: 500 }
    );
  }
}
