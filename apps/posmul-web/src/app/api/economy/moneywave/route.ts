import { NextResponse } from "next/server";
import { createClient } from "../../../../lib/supabase/server";

/**
 * GET /api/economy/moneywave
 * MoneyWave 현황 및 내 수령 내역 조회
 */
export async function GET() {
  try {
    const supabase = await createClient();

    // 현재 사용자 확인
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Wave별 최신 실행 정보 조회
    const { data: waveHistory } = await supabase
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

    // Wave별 집계
    const wave1Data = waves.filter((w) => w.wave_type === "wave1");
    const wave2Data = waves.filter((w) => w.wave_type === "wave2");
    const wave3Data = waves.filter((w) => w.wave_type === "wave3");

    // 내 수령 내역 조회 (로그인한 경우만)
    let myRewards = { wave1: 0, wave2: 0, wave3: 0, total: 0 };

    if (user) {
      // Wave1 수령 내역
      const { data: wave1Records } = await supabase
        .schema("economy")
        .from("money_wave1_ebit_records")
        .select("pmc_received")
        .eq("user_id", user.id);

      const wave1List = Array.isArray(wave1Records) ? wave1Records : [];
      myRewards.wave1 = wave1List.reduce(
        (sum, r) => sum + (Number(r.pmc_received) || 0),
        0
      );

      // Wave2 수령 내역
      const { data: wave2Records } = await supabase
        .schema("economy")
        .from("money_wave2_redistribution_records")
        .select("pmc_received")
        .eq("user_id", user.id);

      const wave2List = Array.isArray(wave2Records) ? wave2Records : [];
      myRewards.wave2 = wave2List.reduce(
        (sum, r) => sum + (Number(r.pmc_received) || 0),
        0
      );

      // Wave3 수령 내역
      const { data: wave3Records } = await supabase
        .schema("economy")
        .from("money_wave3_entrepreneur_records")
        .select("investment_received")
        .eq("entrepreneur_id", user.id);

      const wave3List = Array.isArray(wave3Records) ? wave3Records : [];
      myRewards.wave3 = wave3List.reduce(
        (sum, r) => sum + (Number(r.investment_received) || 0),
        0
      );

      myRewards.total = myRewards.wave1 + myRewards.wave2 + myRewards.wave3;
    }

    // 응답 데이터 구성
    const responseData = {
      wave1: {
        lastExecution: wave1Data[0]?.execution_date || null,
        totalPmcIssued: wave1Data.reduce(
          (sum, w) => sum + (Number(w.pmc_issued) || 0),
          0
        ),
        affectedUsers: wave1Data.reduce(
          (sum, w) => sum + (w.affected_users_count || 0),
          0
        ),
      },
      wave2: {
        lastExecution: wave2Data[0]?.execution_date || null,
        dormantPmcAmount: wave2Data[0]?.dormant_pmc_amount || 0,
        redistributedAmount: wave2Data.reduce(
          (sum, w) => sum + (Number(w.pmc_issued) || 0),
          0
        ),
      },
      wave3: {
        lastExecution: wave3Data[0]?.execution_date || null,
        entrepreneurCount: wave3Data[0]?.entrepreneur_count || 0,
        investmentPool: wave3Data[0]?.total_investment_pool || 0,
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
