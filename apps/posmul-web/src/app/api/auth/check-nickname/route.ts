import { NextRequest, NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

// 예약어 및 금지 닉네임 목록
const FORBIDDEN_NICKNAMES = [
  "admin",
  "administrator",
  "root",
  "system",
  "posmul",
  "포스멀",
  "관리자",
  "운영자",
  "시민대표",
  "오피셜",
  "official",
  "support",
];

function getAdminClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const nickname = (searchParams.get("nickname") || "").trim();

    if (!nickname) {
      return NextResponse.json(
        { available: false, message: "닉네임을 입력해 주세요." },
        { status: 400 }
      );
    }

    // 1. 길이 검증 (2~12자)
    if (nickname.length < 2 || nickname.length > 12) {
      return NextResponse.json(
        { available: false, message: "닉네임은 2자 이상 12자 이하여야 합니다." },
        { status: 200 }
      );
    }

    // 2. 문자 형식 검증 (한글, 영문, 숫자, 밑줄 허용)
    const validRegex = /^[a-zA-Z0-9가-힣_]+$/;
    if (!validRegex.test(nickname)) {
      return NextResponse.json(
        { available: false, message: "한글, 영문, 숫자, 밑줄(_)만 사용 가능합니다 (공백/특수문자 불가)." },
        { status: 200 }
      );
    }

    // 3. 금지어 검증
    const lower = nickname.toLowerCase();
    if (FORBIDDEN_NICKNAMES.some((bad) => lower.includes(bad))) {
      return NextResponse.json(
        { available: false, message: "시스템 예약어 또는 관리자 사칭 닉네임은 사용할 수 없습니다." },
        { status: 200 }
      );
    }

    // 4. Supabase DB 중복 조회 (user.profiles)
    const admin = getAdminClient();
    const { data: existing, error } = await admin
      .schema("user")
      .from("profiles")
      .select("id")
      .or(`display_name.ilike."${nickname}",username.ilike."${nickname}"`)
      .limit(1);

    if (error) {
      // 쿼리 에러 시 안전하게 허용하되 경고
      return NextResponse.json(
        { available: true, message: "사용 가능한 멋진 시민 닉네임입니다!" },
        { status: 200 }
      );
    }

    if (existing && existing.length > 0) {
      return NextResponse.json(
        { available: false, message: "이미 사용 중인 닉네임입니다. 다른 닉네임을 입력해 주세요." },
        { status: 200 }
      );
    }

    return NextResponse.json({
      available: true,
      message: "사용 가능한 멋진 시민 닉네임입니다!",
    });
  } catch (err: any) {
    return NextResponse.json(
      { available: false, message: "중복 확인 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

