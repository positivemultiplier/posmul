import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
  createAdminSupabaseClient,
  ensureUserProfile,
  ensureEconomyAccount,
} from "../auth-helper";

function getRedirectOrigin(request: NextRequest, requestUrl: URL): string {
  const forwardedHost = request.headers.get("x-forwarded-host");
  const isLocalEnv = process.env.NODE_ENV === "development";
  return forwardedHost && !isLocalEnv ? `https://${forwardedHost}` : requestUrl.origin;
}

/**
 * 소셜 프로필(카카오/네이버)을 기반으로 Supabase Auth 유저 생성 및 세션 쿠키 발급 공통 처리
 */
async function completeCustomOAuthLogin(params: {
  request: NextRequest;
  redirectOrigin: string;
  nextPath: string;
  email: string;
  nickname: string;
  fullName: string;
  avatarUrl: string | null;
  provider: "kakao" | "naver";
  providerId: string;
}) {
  const {
    request,
    redirectOrigin,
    nextPath,
    email,
    nickname,
    fullName,
    avatarUrl,
    provider,
    providerId,
  } = params;

  const adminSupabase = createAdminSupabaseClient();

  // 1. 유저 생성 시도 (이미 존재하는 이메일이면 에러가 반환되므로 무시하고 다음 단계에서 조회)
  const metadataPayload = {
    full_name: fullName,
    name: fullName,
    nickname,
    display_name: nickname,
    avatar_url: avatarUrl,
    provider,
    [`${provider}_id`]: providerId,
  };

  await adminSupabase.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: metadataPayload,
  });

  // 2. 매직링크 생성 (신규 유저든 기존 유저든 user 객체와 hashed_token을 정확히 반환함)
  const { data: linkData, error: linkError } = await adminSupabase.auth.admin.generateLink({
    type: "magiclink",
    email,
  });

  if (linkError || !linkData?.properties?.hashed_token || !linkData?.user) {
    console.error(`[${provider}] generateLink error:`, linkError);
    return NextResponse.redirect(
      `${redirectOrigin}/auth/login?error=${provider}_session_link_failed`
    );
  }

  const targetUser = linkData.user;

  // 기존 유저의 메타데이터 최신화 및 이메일 인증 완료 보장
  await adminSupabase.auth.admin.updateUserById(targetUser.id, {
    email_confirm: true,
    user_metadata: {
      ...targetUser.user_metadata,
      ...metadataPayload,
    },
  });

  // 3. SSR 클라이언트를 통해 verifyOtp 실행 -> 쿠키 캡처
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

  const hashedToken = linkData.properties.hashed_token;
  const { error: otpError } = await supabase.auth.verifyOtp({
    token_hash: hashedToken,
    type: "magiclink",
  });

  if (otpError) {
    // fallback: type 'email' 재시도
    const { error: retryError } = await supabase.auth.verifyOtp({
      token_hash: hashedToken,
      type: "email",
    });
    if (retryError) {
      console.error(`[${provider}] verifyOtp error:`, retryError);
      return NextResponse.redirect(
        `${redirectOrigin}/auth/login?error=${provider}_verify_otp_failed`
      );
    }
  }

  // 4. PosMul 프로필 및 10,000 PMP + 1,000 PMC 환영 보너스 계좌 생성 보장
  let resolvedPath = nextPath || "/dashboard";
  try {
    const profileMeta = await ensureUserProfile(adminSupabase, targetUser);
    await ensureEconomyAccount(adminSupabase, targetUser.id);

    if (resolvedPath === "/dashboard" && !profileMeta.onboardingCompleted) {
      resolvedPath = "/dashboard?onboarding=1";
    }
  } catch (err) {
    console.warn(`[${provider}] profile/economy init non-fatal error:`, err);
  }

  const finalTargetUrl = `${redirectOrigin}${
    resolvedPath.startsWith("/") ? resolvedPath : "/" + resolvedPath
  }`;
  const response = NextResponse.redirect(finalTargetUrl);

  // 캡처된 Supabase 세션 쿠키 세팅
  capturedCookies.forEach(({ name, value, options }) =>
    response.cookies.set(name, value, options)
  );

  // 임시 OAuth 쿠키 정리
  response.cookies.delete("posmul_oauth_provider");
  response.cookies.delete("posmul_oauth_next");

  return response;
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const state = requestUrl.searchParams.get("state") || "";
  const oauthError = requestUrl.searchParams.get("error");
  const oauthErrorDesc = requestUrl.searchParams.get("error_description");

  const redirectOrigin = getRedirectOrigin(request, requestUrl);

  if (oauthError) {
    console.error("OAuth callback returned error:", oauthError, oauthErrorDesc);
    return NextResponse.redirect(
      `${redirectOrigin}/auth/login?error=${encodeURIComponent(oauthErrorDesc || oauthError)}`
    );
  }

  if (!code) {
    return NextResponse.redirect(`${redirectOrigin}/auth/login?error=no_code`);
  }

  const cookieProvider = request.cookies.get("posmul_oauth_provider")?.value;
  const cookieNext = request.cookies.get("posmul_oauth_next")?.value;
  const nextParam = requestUrl.searchParams.get("next") || cookieNext || "/dashboard";
  const callbackUrl = `${redirectOrigin}/auth/callback`;

  // ============================================================================
  // A. 카카오(Kakao) 로그인 콜백 처리
  // ============================================================================
  if (state.startsWith("kakao_") || cookieProvider === "kakao") {
    try {
      const clientId = process.env.KAKAO_REST_API_KEY;
      const clientSecret = process.env.KAKAO_CLIENT_SECRET;

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
        return NextResponse.redirect(
          `${redirectOrigin}/auth/login?error=${encodeURIComponent(
            tokenData.error_description || "카카오 토큰 발급에 실패했습니다."
          )}`
        );
      }

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
      const email = (kakaoAccount.email || `kakao_${kakaoId}@posmul.com`).trim().toLowerCase();
      const nickname =
        kakaoAccount.profile?.nickname ||
        kakaoUser.properties?.nickname ||
        `카카오시민_${kakaoId.slice(-4)}`;
      const avatarUrl =
        kakaoAccount.profile?.profile_image_url ||
        kakaoUser.properties?.profile_image ||
        null;

      return await completeCustomOAuthLogin({
        request,
        redirectOrigin,
        nextPath: nextParam,
        email,
        nickname,
        fullName: nickname,
        avatarUrl,
        provider: "kakao",
        providerId: kakaoId,
      });
    } catch (err) {
      console.error("Kakao callback exception:", err);
      return NextResponse.redirect(`${redirectOrigin}/auth/login?error=kakao_exception`);
    }
  }

  // ============================================================================
  // B. 네이버(Naver) 로그인 콜백 처리
  // ============================================================================
  if (state.startsWith("naver_") || cookieProvider === "naver") {
    try {
      const clientId = process.env.NAVER_CLIENT_ID;
      const clientSecret = process.env.NAVER_CLIENT_SECRET;

      const tokenUrl = new URL("https://nid.naver.com/oauth2.0/token");
      tokenUrl.searchParams.set("grant_type", "authorization_code");
      tokenUrl.searchParams.set("client_id", clientId!);
      tokenUrl.searchParams.set("client_secret", clientSecret!);
      tokenUrl.searchParams.set("redirect_uri", callbackUrl);
      tokenUrl.searchParams.set("code", code);
      tokenUrl.searchParams.set("state", state);

      const tokenRes = await fetch(tokenUrl.toString(), {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });

      const tokenData = await tokenRes.json();
      if (!tokenRes.ok || !tokenData.access_token) {
        console.error("Naver token exchange failed:", tokenData);
        return NextResponse.redirect(
          `${redirectOrigin}/auth/login?error=${encodeURIComponent(
            tokenData.error_description || "네이버 토큰 발급에 실패했습니다."
          )}`
        );
      }

      const userRes = await fetch("https://openapi.naver.com/v1/nid/me", {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      });

      const naverUserRes = await userRes.json();
      if (!userRes.ok || !naverUserRes.response) {
        console.error("Naver user profile failed:", naverUserRes);
        return NextResponse.redirect(`${redirectOrigin}/auth/login?error=naver_profile_failed`);
      }

      const naverUser = naverUserRes.response;
      const naverId = String(naverUser.id);
      const email = (naverUser.email || `naver_${naverId}@posmul.com`).trim().toLowerCase();
      const nickname =
        naverUser.nickname ||
        naverUser.name ||
        `네이버시민_${naverId.slice(-4)}`;
      const fullName = naverUser.name || nickname;
      const avatarUrl = naverUser.profile_image || null;

      return await completeCustomOAuthLogin({
        request,
        redirectOrigin,
        nextPath: nextParam,
        email,
        nickname,
        fullName,
        avatarUrl,
        provider: "naver",
        providerId: naverId,
      });
    } catch (err) {
      console.error("Naver callback exception:", err);
      return NextResponse.redirect(`${redirectOrigin}/auth/login?error=naver_exception`);
    }
  }

  // ============================================================================
  // C. 기본 Supabase OAuth 콜백 처리 (Google 등)
  // ============================================================================
  let resolvedPath = nextParam;
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

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    console.error("Supabase exchangeCodeForSession error:", error);
    return NextResponse.redirect(`${redirectOrigin}/auth/login?error=auth_error`);
  }

  try {
    const { data } = await supabase.auth.getUser();
    const user = data.user;
    if (user) {
      const adminSupabase = createAdminSupabaseClient();
      const profileMeta = await ensureUserProfile(adminSupabase, user);
      await ensureEconomyAccount(adminSupabase, user.id);

      if (!requestUrl.searchParams.get("next") && !cookieNext) {
        if (!profileMeta.onboardingCompleted) {
          resolvedPath = "/dashboard?onboarding=1";
        } else if (profileMeta.defaultLanding) {
          resolvedPath = profileMeta.defaultLanding;
        }
      }
    }
  } catch {
    // 프로필/보너스 초기화 오류 시에도 로그인 세션은 정상 유지
  }

  const finalTargetUrl = `${redirectOrigin}${
    resolvedPath.startsWith("/") ? resolvedPath : "/" + resolvedPath
  }`;
  const response = NextResponse.redirect(finalTargetUrl);
  capturedCookies.forEach(({ name, value, options }) =>
    response.cookies.set(name, value, options)
  );

  return response;
}
