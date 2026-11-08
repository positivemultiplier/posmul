import { NextResponse } from "next/server";

const VALID_PASSWORDS = [
  "modoo3gi",
  "posmul2026",
  (process.env.SITE_SECRET_PASS || "").trim().toLowerCase(),
].filter(Boolean);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const inputPass = String(body.pass || "").trim().toLowerCase();

    if (!inputPass) {
      return NextResponse.json(
        { ok: false, message: "입장 코드를 입력해 주세요." },
        { status: 400 }
      );
    }

    const isValid = VALID_PASSWORDS.includes(inputPass);

    if (!isValid) {
      return NextResponse.json(
        { ok: false, message: "유효하지 않은 입장 코드입니다. 다시 확인해 주세요." },
        { status: 401 }
      );
    }

    const response = NextResponse.json({
      ok: true,
      message: "인증에 성공했습니다. PosMul 프리뷰로 이동합니다.",
    });

    // 30일간 유효한 보안 쿠키 발급
    response.cookies.set("posmul_access_pass", "granted", {
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30일
      httpOnly: false, // 클라이언트 리다이렉트 및 상태 확인 호환
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });

    return response;
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: "서버 처리 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

