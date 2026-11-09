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
      // 기본 대시보드
    }
  }

  if (!code) {
    return NextResponse.redirect(`${redirectOrigin}/auth/login?error=naver_no_code`);
  }

  const clientId = process.env.NAVER_CLIENT_ID;
  const clientSecret = process.env.NAVER_CLIENT_SECRET;

  try {
    // 1. 네이버 Access Token 발급 요청
    const tokenUrl = new URL("https://nid.naver.com/oauth2.0/token");
    tokenUrl.searchParams.set("grant_type", "authorization_code");
    tokenUrl.searchParams.set("client_id", clientId!);
    tokenUrl.searchParams.set("client_secret", clientSecret!);
    tokenUrl.searchParams.set("code", code);
    tokenUrl.searchParams.set("state", rawState || "");

    const tokenRes = await fetch(tokenUrl.toString(), {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });

    const tokenData = await tokenRes.json();
    if (!tokenRes.ok || !tokenData.access_token) {
      console.error("Naver token exchange failed:", tokenData);
      return NextResponse.redirect(`${redirectOrigin}/auth/login?error=naver_token_failed`);
    }

    // 2. 네이버 유저 프로필 조회
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
    const email = naverUser.email || `naver_${naverId}@posmul.naver`;
    const nickname =
      naverUser.nickname ||
      naverUser.name ||
      `네이버시민_${naverId.substring(0, 4)}`;
    const avatarUrl = naverUser.profile_image || null;

    // 3. Supabase Admin을 통한 유저 보장
    const adminSupabase = createAdminSupabaseClient();
    const { data: userList } = await adminSupabase.auth.admin.listUsers();
    const allUsers = (userList?.users as User[]) || [];
    let targetUser: User | undefined = allUsers.find(
      (u) => u.email === email || u.user_metadata?.naver_id === naverId
    );

    if (!targetUser) {
      const { data: newUser, error: createError } = await adminSupabase.auth.admin.createUser({
        email,
        email_confirm: true,
        user_metadata: {
          full_name: naverUser.name || nickname,
          name: naverUser.name || nickname,
          nickname,
          avatar_url: avatarUrl,
          provider: "naver",
          naver_id: naverId,
        },
      });

      if (createError || !newUser?.user) {
        console.error("Supabase create user error:", createError);
        return NextResponse.redirect(`${redirectOrigin}/auth/login?error=user_create_failed`);
      }
      targetUser = newUser.user;
    } else {
      await adminSupabase.auth.admin.updateUserById(targetUser.id, {
        user_metadata: {
          ...targetUser.user_metadata,
          nickname: targetUser.user_metadata?.nickname || nickname,
          avatar_url: targetUser.user_metadata?.avatar_url || avatarUrl,
          provider: "naver",
          naver_id: naverId,
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
    console.error("Naver OAuth error:", err);
    return NextResponse.redirect(`${redirectOrigin}/auth/login?error=naver_oauth_error`);
  }
}

