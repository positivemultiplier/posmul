import { createServerClient } from "@supabase/ssr";
import type { User } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import {
  createAdminSupabaseClient,
  ensureUserProfile,
  ensureEconomyAccount,
} from "@/app/auth/auth-helper";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const rawState = requestUrl.searchParams.get("state");

  const forwardedHost = request.headers.get("x-forwarded-host");
  const isLocalEnv = process.env.NODE_ENV === "development";
  const redirectOrigin = forwardedHost && !isLocalEnv ? `https://${forwardedHost}` : requestUrl.origin;

  let next = "/dashboard";
  if (rawState) {
    try {
      const parsed = JSON.parse(rawState);
      if (parsed.next) next = parsed.next;
    } catch {
      // 파싱 실패 시 기본 대시보드
    }
  }

  if (!code) {
    return NextResponse.redirect(`${redirectOrigin}/auth/login?error=kakao_no_code`);
  }

  const callbackUrl = `${redirectOrigin}/api/auth/kakao/callback`;
  const clientId = process.env.KAKAO_REST_API_KEY;
  const clientSecret = process.env.KAKAO_CLIENT_SECRET;

  try {
    // 1. 카카오 Access Token 발급 요청
    const tokenRes = await fetch("https://kauth.kakao.com/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded;charset=utf-8" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        client_id: clientId!,
        ...(clientSecret ? { client_secret: clientSecret } : {}),
        redirect_uri: callbackUrl,
        code,
      }),
    });

    const tokenData = await tokenRes.json();
    if (!tokenRes.ok || !tokenData.access_token) {
      console.error("Kakao token exchange failed:", tokenData);
      return NextResponse.redirect(`${redirectOrigin}/auth/login?error=kakao_token_failed`);
    }

    // 2. 카카오 유저 프로필 조회
    const userRes = await fetch("https://kapi.kakao.com/v2/user/me", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    const kakaoUser = await userRes.json();
    if (!userRes.ok || !kakaoUser.id) {
      console.error("Kakao user profile failed:", kakaoUser);
      return NextResponse.redirect(`${redirectOrigin}/auth/login?error=kakao_profile_failed`);
    }

    const kakaoId = String(kakaoUser.id);
    const kakaoAccount = kakaoUser.kakao_account || {};
    const email = kakaoAccount.email || `kakao_${kakaoId}@posmul.kakao`;
    const nickname =
      kakaoAccount.profile?.nickname ||
      kakaoUser.properties?.nickname ||
      `카카오시민_${kakaoId.substring(0, 4)}`;
    const avatarUrl =
      kakaoAccount.profile?.profile_image_url ||
      kakaoUser.properties?.profile_image ||
      null;

    // 3. Supabase Admin을 통한 유저 보장
    const adminSupabase = createAdminSupabaseClient();
    const { data: userList } = await adminSupabase.auth.admin.listUsers();
    const allUsers = (userList?.users as User[]) || [];
    let targetUser: User | undefined = allUsers.find(
      (u) => u.email === email || u.user_metadata?.kakao_id === kakaoId
    );

    if (!targetUser) {
      const { data: newUser, error: createError } = await adminSupabase.auth.admin.createUser({
        email,
        email_confirm: true,
        user_metadata: {
          full_name: nickname,
          name: nickname,
          nickname,
          avatar_url: avatarUrl,
          provider: "kakao",
          kakao_id: kakaoId,
        },
      });

      if (createError || !newUser?.user) {
        console.error("Supabase create user error:", createError);
        return NextResponse.redirect(`${redirectOrigin}/auth/login?error=user_create_failed`);
      }
      targetUser = newUser.user;
    } else {
      // 기존 유저 메타데이터 갱신
      await adminSupabase.auth.admin.updateUserById(targetUser.id, {
        user_metadata: {
          ...targetUser.user_metadata,
          nickname: targetUser.user_metadata?.nickname || nickname,
          avatar_url: targetUser.user_metadata?.avatar_url || avatarUrl,
          provider: "kakao",
          kakao_id: kakaoId,
        },
      });
    }

    // 4. Supabase 세션 매직링크 생성 및 verifyOtp로 공식 세션 쿠키 획득
    const { data: linkData, error: linkError } = await adminSupabase.auth.admin.generateLink({
      type: "magiclink",
      email: targetUser.email!,
    });

    if (linkError || !linkData?.properties?.hashed_token) {
      console.error("Failed to generate session link:", linkError);
      return NextResponse.redirect(`${redirectOrigin}/auth/login?error=session_link_failed`);
    }

    const capturedCookies: Array<{ name: string; value: string; options?: any }> = [];
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              request.cookies.set(name, value);
              capturedCookies.push({ name, value, options });
            });
          },
        },
      }
    );

    // hashed_token으로 세션 활성화 및 쿠키 세팅
    await supabase.auth.verifyOtp({
      token_hash: linkData.properties.hashed_token,
      type: "email",
    });

    // 5. 프로필 및 환영 자산(10,000 PMP) 보장
    const profileMeta = await ensureUserProfile(adminSupabase, targetUser);
    await ensureEconomyAccount(adminSupabase, targetUser.id);

    let resolvedPath = next;
    if (next === "/dashboard" && !profileMeta.onboardingCompleted) {
      resolvedPath = "/dashboard?onboarding=1";
    }

    const finalTargetUrl = `${redirectOrigin}${resolvedPath.startsWith("/") ? resolvedPath : "/" + resolvedPath}`;
    const response = NextResponse.redirect(finalTargetUrl);

    capturedCookies.forEach(({ name, value, options }) =>
      response.cookies.set(name, value, options)
    );

    return response;
  } catch (err: any) {
    console.error("Kakao OAuth error:", err);
    return NextResponse.redirect(`${redirectOrigin}/auth/login?error=kakao_oauth_error`);
  }
}

