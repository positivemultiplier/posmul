import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import {
    createAdminSupabaseClient,
    ensureUserProfile,
    ensureEconomyAccount,
} from '../auth-helper';

function getCallbackParams(request: NextRequest) {
    const requestUrl = new URL(request.url);
    return {
        requestUrl,
        code: requestUrl.searchParams.get('code'),
        next: requestUrl.searchParams.get('next'),
    };
}

export async function GET(request: NextRequest) {
    const { requestUrl, code, next } = getCallbackParams(request);

    // Vercel 프록시 환경 대응: x-forwarded-host 우선 사용
    const forwardedHost = request.headers.get('x-forwarded-host');
    const isLocalEnv = process.env.NODE_ENV === 'development';
    const redirectOrigin = forwardedHost && !isLocalEnv ? `https://${forwardedHost}` : requestUrl.origin;

    if (!code) {
        return NextResponse.redirect(`${redirectOrigin}/auth/login?error=no_code`);
    }

    let resolvedPath = next ?? '/dashboard';
    let response = NextResponse.redirect(
        `${redirectOrigin}${resolvedPath.startsWith('/') ? resolvedPath : '/' + resolvedPath}`
    );

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
        void error;
        return NextResponse.redirect(`${redirectOrigin}/auth/login?error=auth_error`);
    }

    try {
        const { data } = await supabase.auth.getUser();
        const user = data.user;
        if (user) {
            const adminSupabase = createAdminSupabaseClient();
            const profileMeta = await ensureUserProfile(adminSupabase, user);
            await ensureEconomyAccount(adminSupabase, user.id);

            if (!next) {
                if (!profileMeta.onboardingCompleted) {
                    resolvedPath = '/dashboard?onboarding=1';
                } else if (profileMeta.defaultLanding) {
                    resolvedPath = profileMeta.defaultLanding;
                }
            }
        }
    } catch {
        // 프로필/보너스 초기화 오류 시에도 로그인 세션은 정상 유지
    }

    const finalTargetUrl = `${redirectOrigin}${resolvedPath.startsWith('/') ? resolvedPath : '/' + resolvedPath}`;
    response = NextResponse.redirect(finalTargetUrl);
    capturedCookies.forEach(({ name, value, options }) =>
        response.cookies.set(name, value, options)
    );

    return response;
}
