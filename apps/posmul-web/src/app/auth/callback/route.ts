import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import type { User } from '@supabase/supabase-js';
import { NextResponse, type NextRequest } from 'next/server';

// 신규 가입 환영 보너스 및 개발 보너스 금액
const WELCOME_BONUS_PMP = 10000;
const WELCOME_BONUS_PMC = 1000;
const DEV_BONUS_PMP = 10000;
const DEV_BONUS_PMC = 10000;

function getCallbackParams(request: NextRequest) {
    const requestUrl = new URL(request.url);
    return {
        requestUrl,
        code: requestUrl.searchParams.get('code'),
        next: requestUrl.searchParams.get('next'),
    };
}

function createAdminSupabaseClient() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { persistSession: false } }
    );
}

function isDevelopment() {
    return process.env.NODE_ENV === 'development';
}

function buildUserIdentity(user: User) {
    const username = user.email?.split('@')[0] || `user_${user.id.slice(0, 8)}`;
    const displayName =
        (user.user_metadata?.full_name as string | undefined) ||
        (user.user_metadata?.name as string | undefined) ||
        username;

    return { username, displayName };
}

async function ensureUserProfile(
    adminSupabase: ReturnType<typeof createAdminSupabaseClient>,
    user: User
): Promise<{ onboardingCompleted: boolean; defaultLanding: string }> {
    const { username, displayName } = buildUserIdentity(user);

    const { data: existingProfile } = await adminSupabase
        .schema('user')
        .from('profiles')
        .select('id, onboarding_completed, notification_preferences')
        .eq('id', user.id)
        .maybeSingle();

    if (existingProfile) {
        const rawNotif = (existingProfile.notification_preferences || {}) as Record<string, any>;
        const defaultLanding = rawNotif?.personalization?.defaultLanding || '/dashboard';
        return {
            onboardingCompleted: Boolean(existingProfile.onboarding_completed),
            defaultLanding,
        };
    }

    const { error: profileError } = await adminSupabase
        .schema('user')
        .from('profiles')
        .insert({
            id: user.id,
            username,
            display_name: displayName,
            email_verified: !!user.email_confirmed_at,
            onboarding_completed: false,
            account_status: 'active',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        });

    if (profileError) {
        void profileError;
    }

    return {
        onboardingCompleted: false,
        defaultLanding: '/dashboard',
    };
}

async function ensureEconomyAccount(
    adminSupabase: ReturnType<typeof createAdminSupabaseClient>,
    userId: string
) {
    const { data: existingAccount } = await adminSupabase
        .schema('economy')
        .from('pmp_pmc_accounts')
        .select('user_id, pmp_balance, pmc_balance')
        .eq('user_id', userId)
        .maybeSingle();

    if (existingAccount) {
        // 개발 환경에서는 로그인 시마다 개발 보너스 추가 지급
        if (isDevelopment()) {
            const newPmpBalance = Number(existingAccount.pmp_balance || 0) + DEV_BONUS_PMP;
            const newPmcBalance = Number(existingAccount.pmc_balance || 0) + DEV_BONUS_PMC;

            await adminSupabase
                .schema('economy')
                .from('pmp_pmc_accounts')
                .update({
                    pmp_balance: newPmpBalance,
                    pmc_balance: newPmcBalance,
                    updated_at: new Date().toISOString(),
                })
                .eq('user_id', userId);
        }
        return;
    }

    // 프로덕션 및 로컬 모두 최초 로그인 시 환영 스타터 자산(10,000 PMP + 1,000 PMC) 지급
    const { error: insertError } = await adminSupabase
        .schema('economy')
        .from('pmp_pmc_accounts')
        .insert({
            user_id: userId,
            pmp_balance: isDevelopment() ? DEV_BONUS_PMP : WELCOME_BONUS_PMP,
            pmc_balance: isDevelopment() ? DEV_BONUS_PMC : WELCOME_BONUS_PMC,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        });

    if (insertError) {
        void insertError;
    }
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
