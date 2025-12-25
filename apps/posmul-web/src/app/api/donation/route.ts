import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../lib/supabase/server";

type DonationCreateBodyParsed = {
  instituteId: string;
  amount: number;
  isAnonymous: boolean;
  message: string;
};

function jsonError(status: number, code: string, message: string) {
  return NextResponse.json(
    {
      success: false,
      error: {
        code,
        message,
      },
    },
    { status }
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parseNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed)) return null;
  return parsed;
}

function parseDonationCreateBody(body: unknown):
  | { ok: true; data: DonationCreateBodyParsed }
  | { ok: false; response: NextResponse } {
  if (!isRecord(body)) {
    return {
      ok: false,
      response: jsonError(400, "INVALID_REQUEST", "기관 ID와 금액은 필수입니다."),
    };
  }

  const instituteIdRaw = body["instituteId"];
  const amountRaw = body["amount"];
  const isAnonymousRaw = body["isAnonymous"];
  const messageRaw = body["message"];

  const instituteId = typeof instituteIdRaw === "string" ? instituteIdRaw : "";
  const amount = parseNumber(amountRaw);
  const isAnonymous = typeof isAnonymousRaw === "boolean" ? isAnonymousRaw : false;
  const message = typeof messageRaw === "string" ? messageRaw : "";

  if (!instituteId || amount === null) {
    return {
      ok: false,
      response: jsonError(400, "INVALID_REQUEST", "기관 ID와 금액은 필수입니다."),
    };
  }

  return { ok: true, data: { instituteId, amount, isAnonymous, message } };
}

async function fetchInstitute(
  supabase: Awaited<ReturnType<typeof createClient>>,
  instituteId: string
): Promise<
  | { ok: true; data: { id: string; name: string; category: string } }
  | { ok: false; response: NextResponse }
> {
  const { data: institute, error: instError } = await supabase
    .schema("donation")
    .from("donation_institutes")
    .select("id, name, category")
    .eq("id", instituteId)
    .eq("is_active", true)
    .single();

  const instData = Array.isArray(institute) ? institute[0] : institute;
  if (instError || !instData) {
    return {
      ok: false,
      response: jsonError(404, "INSTITUTE_NOT_FOUND", "유효하지 않은 기부 기관입니다."),
    };
  }

  return {
    ok: true,
    data: {
      id: instData.id,
      name: instData.name,
      category: instData.category,
    },
  };
}

async function fetchPmcBalance(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
): Promise<
  | { ok: true; pmcBalance: number }
  | { ok: false; response: NextResponse }
> {
  const { data: account, error: accError } = await supabase
    .schema("economy")
    .from("pmp_pmc_accounts")
    .select("pmc_balance")
    .eq("user_id", userId)
    .single();

  const accData = Array.isArray(account) ? account[0] : account;
  if (accError || !accData) {
    return {
      ok: false,
      response: jsonError(404, "ACCOUNT_NOT_FOUND", "경제 계정을 찾을 수 없습니다."),
    };
  }

  const pmcBalance = Number(accData.pmc_balance) || 0;
  return { ok: true, pmcBalance };
}

async function updatePmcBalance(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  newBalance: number,
  errorCode: string,
  errorMessage: string
): Promise<{ ok: true } | { ok: false; response: NextResponse }> {
  const { error } = await supabase
    .schema("economy")
    .from("pmp_pmc_accounts")
    .update({ pmc_balance: newBalance })
    .eq("user_id", userId);

  if (error) {
    return { ok: false, response: jsonError(500, errorCode, errorMessage) };
  }

  return { ok: true };
}

async function createDonationRecord(params: {
  supabase: Awaited<ReturnType<typeof createClient>>;
  userId: string;
  instituteId: string;
  instituteName: string;
  category: string;
  amount: number;
  isAnonymous: boolean;
  message: string;
}): Promise<{ ok: true; donationId: string } | { ok: false }> {
  const {
    supabase,
    userId,
    instituteId,
    instituteName,
    category,
    amount,
    isAnonymous,
    message,
  } = params;

  const { data: donation, error: donationError } = await supabase
    .schema("donation")
    .from("donations")
    .insert({
      donor_id: userId,
      donation_type: "institute",
      amount: amount,
      pmc_amount: amount,
      title: `${instituteName} 기부`,
      description: message || `${instituteName}에 대한 기부`,
      category,
      status: "completed",
      institute_id: instituteId,
      is_anonymous: isAnonymous,
      support_message: message,
      completed_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  const donationData = Array.isArray(donation) ? donation[0] : donation;
  if (donationError || !donationData) return { ok: false };

  return { ok: true, donationId: donationData.id };
}

/**
 * POST /api/donation
 * PMC를 사용하여 기부 생성
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // 현재 사용자 확인
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return jsonError(401, "UNAUTHORIZED", "로그인이 필요합니다.");
    }

    const body: unknown = await request.json();
    const parsedBodyResult = parseDonationCreateBody(body);
    if (parsedBodyResult.ok === false) return parsedBodyResult.response;
    const { instituteId, amount, isAnonymous, message } = parsedBodyResult.data;

    if (amount < 100) {
      return jsonError(400, "MINIMUM_AMOUNT", "최소 기부 금액은 100 PMC입니다.");
    }

    const instituteResult = await fetchInstitute(supabase, instituteId);
    if (instituteResult.ok === false) return instituteResult.response;

    const balanceResult = await fetchPmcBalance(supabase, user.id);
    if (balanceResult.ok === false) return balanceResult.response;
    const pmcBalance = balanceResult.pmcBalance;

    if (pmcBalance < amount) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INSUFFICIENT_BALANCE",
            message: `PMC 잔액이 부족합니다. (보유: ${pmcBalance.toLocaleString()}, 필요: ${amount.toLocaleString()})`,
          },
        },
        { status: 400 }
      );
    }

    // 트랜잭션 시작: PMC 차감 + 기부 생성
    // 1. PMC 차감
    const newBalance = pmcBalance - amount;
    const deductionResult = await updatePmcBalance(
      supabase,
      user.id,
      newBalance,
      "PMC_DEDUCTION_FAILED",
      "PMC 차감에 실패했습니다."
    );
    if (deductionResult.ok === false) return deductionResult.response;

    // 2. 기부 레코드 생성
    const donationResult = await createDonationRecord({
      supabase,
      userId: user.id,
      instituteId,
      instituteName: instituteResult.data.name,
      category: instituteResult.data.category,
      amount,
      isAnonymous,
      message,
    });

    if (!donationResult.ok) {
      // 기부 생성 실패 시 PMC 롤백
      await updatePmcBalance(
        supabase,
        user.id,
        pmcBalance,
        "PMC_ROLLBACK_FAILED",
        "PMC 롤백에 실패했습니다."
      );
      return jsonError(500, "DONATION_CREATE_FAILED", "기부 생성에 실패했습니다.");
    }

    // 3. 거래 내역 기록
    await supabase
      .schema("economy")
      .from("pmp_pmc_transactions")
      .insert({
        user_id: user.id,
        transaction_type: "DONATION",
        pmc_amount: -amount,
        description: `${instituteResult.data.name}에 기부`,
        timestamp: new Date().toISOString(),
        metadata: {
          donation_id: donationResult.donationId,
          institute_id: instituteId,
          institute_name: instituteResult.data.name,
        },
      });

    return NextResponse.json({
      success: true,
      data: {
        donationId: donationResult.donationId,
        instituteName: instituteResult.data.name,
        amount,
        newBalance,
      },
    });
  } catch (error) {
    void error;
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

/**
 * GET /api/donation
 * 내 기부 내역 조회
 */
export async function GET() {
  try {
    const supabase = await createClient();

    // 현재 사용자 확인
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: "로그인이 필요합니다.",
          },
        },
        { status: 401 }
      );
    }

    // 기부 내역 조회
    const { data: donations, error: donationError } = await supabase
      .schema("donation")
      .from("donations")
      .select(`
        id,
        donation_type,
        amount,
        pmc_amount,
        title,
        category,
        status,
        is_anonymous,
        created_at,
        completed_at
      `)
      .eq("donor_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);

    if (donationError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "FETCH_ERROR",
            message: "기부 내역 조회에 실패했습니다.",
          },
        },
        { status: 500 }
      );
    }

    const donationList = Array.isArray(donations) ? donations : [];

    return NextResponse.json({
      success: true,
      data: {
        donations: donationList.map((d: {
          id: string;
          donation_type: string;
          amount: number;
          pmc_amount: number;
          title: string;
          category: string;
          status: string;
          is_anonymous: boolean;
          created_at: string;
          completed_at: string | null;
        }) => ({
          id: d.id,
          type: d.donation_type,
          amount: d.amount,
          pmcAmount: d.pmc_amount,
          title: d.title,
          category: d.category,
          status: d.status,
          isAnonymous: d.is_anonymous,
          createdAt: d.created_at,
          completedAt: d.completed_at,
        })),
        totalCount: donationList.length,
      },
    });
  } catch (error) {
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
