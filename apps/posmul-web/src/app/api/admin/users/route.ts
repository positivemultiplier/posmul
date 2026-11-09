import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = (searchParams.get("search") || "").trim().toLowerCase();
    const status = searchParams.get("status") || "all";
    const sido = searchParams.get("sido") || "all";
    const providerFilter = searchParams.get("provider") || "all";

    // 1. user.profiles, auth.users, pmp_pmc_accounts, user_scores 병렬 조회
    const [profilesRes, accountsRes, scoresRes, authUsersRes] = await Promise.all([
      supabaseAdmin
        .schema("user")
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false }),
      supabaseAdmin
        .schema("economy")
        .from("pmp_pmc_accounts")
        .select("user_id, pmp_balance, pmc_balance"),
      supabaseAdmin
        .schema("ranking")
        .from("user_scores")
        .select("user_id, sido, job_group, contribution_score, overall_rank"),
      supabaseAdmin.auth.admin.listUsers({ perPage: 1000 }),
    ]);

    const accountsMap = new Map<string, { pmp: number; pmc: number }>();
    for (const acc of accountsRes.data || []) {
      accountsMap.set(acc.user_id, {
        pmp: Number(acc.pmp_balance || 0),
        pmc: Number(acc.pmc_balance || 0),
      });
    }

    const scoresMap = new Map<string, any>();
    for (const score of scoresRes.data || []) {
      scoresMap.set(score.user_id, score);
    }

    const authMap = new Map<string, any>();
    for (const u of authUsersRes.data?.users || []) {
      authMap.set(u.id, u);
    }

    // 2. 통합 회원 리스트 구성
    const allUsers = (profilesRes.data || []).map((p: any) => {
      const authUser = authMap.get(p.id);
      const acc = accountsMap.get(p.id) || { pmp: 0, pmc: 0 };
      const score = scoresMap.get(p.id);

      const email = authUser?.email || p.email || (p.username?.includes("@") ? p.username : "-");
      const meta = authUser?.user_metadata || {};
      const appMeta = authUser?.app_metadata || {};

      // 소셜 프로바이더 정밀 판별
      let provider = "email";
      if (
        meta.provider === "kakao" ||
        meta.kakao_id ||
        appMeta.provider === "kakao" ||
        email.startsWith("kakao_") ||
        email.includes("@kakao")
      ) {
        provider = "kakao";
      } else if (
        meta.provider === "naver" ||
        meta.naver_id ||
        appMeta.provider === "naver" ||
        email.startsWith("naver_") ||
        meta.naver_id != null
      ) {
        provider = "naver";
      } else if (
        appMeta.provider === "google" ||
        meta.iss?.includes("google") ||
        email.endsWith("@gmail.com")
      ) {
        provider = "google";
      }

      // 연동된 모든 소셜 채널 수집
      const connectedProviders: string[] = [];
      if (meta.kakao_id || provider === "kakao") connectedProviders.push("kakao");
      if (meta.naver_id || provider === "naver") connectedProviders.push("naver");
      if (appMeta.provider === "google" || meta.iss?.includes("google") || provider === "google") {
        connectedProviders.push("google");
      }
      if (connectedProviders.length === 0) connectedProviders.push("email");

      return {
        id: p.id,
        username: p.username || `user_${p.id.slice(0, 8)}`,
        displayName: p.display_name || p.username || "시민",
        email,
        provider,
        connectedProviders,
        kakaoId: meta.kakao_id || null,
        naverId: meta.naver_id || null,
        accountStatus: p.account_status || "active", // active, suspended, banned
        emailVerified: Boolean(p.email_verified || authUser?.email_confirmed_at),
        createdAt: p.created_at || authUser?.created_at || new Date().toISOString(),
        lastActiveAt: p.last_active_at || authUser?.last_sign_in_at || p.created_at,
        sido: score?.sido || "서울특별시",
        jobGroup: score?.job_group || "주권시민",
        pmpBalance: acc.pmp,
        pmcBalance: acc.pmc,
        contributionScore: Number(score?.contribution_score || 0),
      };
    });

    // 전체 가입 채널별 통계 산출 (필터링 전 기준)
    const totalUsers = allUsers.length;
    const kakaoUsers = allUsers.filter((u) => u.provider === "kakao").length;
    const naverUsers = allUsers.filter((u) => u.provider === "naver").length;
    const googleUsers = allUsers.filter((u) => u.provider === "google").length;
    const emailUsers = allUsers.filter((u) => u.provider === "email").length;

    // 3. 필터링 적용
    let filteredUsers = allUsers;

    if (search) {
      filteredUsers = filteredUsers.filter(
        (u) =>
          u.displayName.toLowerCase().includes(search) ||
          u.username.toLowerCase().includes(search) ||
          u.email.toLowerCase().includes(search)
      );
    }

    if (status !== "all") {
      filteredUsers = filteredUsers.filter((u) => u.accountStatus === status);
    }

    if (sido !== "all") {
      filteredUsers = filteredUsers.filter((u) => u.sido === sido);
    }

    if (providerFilter !== "all") {
      filteredUsers = filteredUsers.filter((u) => u.provider === providerFilter);
    }

    // 4. 통계 집계
    const activeUsers = filteredUsers.filter((u) => u.accountStatus === "active").length;
    const suspendedUsers = filteredUsers.filter(
      (u) => u.accountStatus === "suspended" || u.accountStatus === "banned"
    ).length;
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    const todayNewUsers = allUsers.filter((u) => new Date(u.createdAt).getTime() >= oneDayAgo).length;

    return NextResponse.json({
      success: true,
      stats: {
        totalUsers,
        activeUsers,
        suspendedUsers,
        todayNewUsers,
        kakaoUsers,
        naverUsers,
        googleUsers,
        emailUsers,
      },
      users: filteredUsers,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || "회원 목록 조회 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, userId } = body;

    if (!userId) {
      return NextResponse.json({ success: false, error: "userId가 누락되었습니다." }, { status: 400 });
    }

    // 1. 회원 상태 변경 (정상 active / 정지 suspended / 차단 banned)
    if (action === "update_status") {
      const nextStatus = body.status;
      if (!["active", "suspended", "banned"].includes(nextStatus)) {
        return NextResponse.json({ success: false, error: "올바르지 않은 상태값입니다." }, { status: 400 });
      }

      const { error } = await supabaseAdmin
        .schema("user")
        .from("profiles")
        .update({
          account_status: nextStatus,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId);

      if (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        message: `회원 상태가 '${nextStatus}'(으)로 변경되었습니다.`,
      });
    }

    // 2. 관리자 포인트 수동 조정 (원장 기록 연동)
    if (action === "adjust_balance") {
      const pmpChange = Number(body.pmpChange || 0);
      const pmcChange = Number(body.pmcChange || 0);
      const reason = body.reason || "관리자 수동 자산 조정";

      const { data: rpcResult, error: rpcError } = await supabaseAdmin.rpc(
        "execute_ledger_transaction",
        {
          p_user_id: userId,
          p_transaction_type: pmpChange >= 0 ? "ADMIN_GRANT" : "ADMIN_REVOKE",
          p_pmp_change: pmpChange,
          p_pmc_change: pmcChange,
          p_description: reason,
          p_metadata: {
            admin_action: true,
            adjusted_at: new Date().toISOString(),
          },
        }
      );

      if (rpcError) {
        return NextResponse.json(
          { success: false, error: `원장 반영 실패: ${rpcError.message}` },
          { status: 500 }
        );
      }

      const row = Array.isArray(rpcResult) ? rpcResult[0] : rpcResult;
      return NextResponse.json({
        success: true,
        message: `원장에 기록되고 잔액이 조정되었습니다. (PMP: ${row?.new_pmp_balance}, PMC: ${row?.new_pmc_balance})`,
        transactionId: row?.transaction_id,
        newPmpBalance: row?.new_pmp_balance,
        newPmcBalance: row?.new_pmc_balance,
      });
    }

    return NextResponse.json({ success: false, error: "지원하지 않는 액션입니다." }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || "회원 처리 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

