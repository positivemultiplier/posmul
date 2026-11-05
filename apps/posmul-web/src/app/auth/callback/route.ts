import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import type { User } from '@supabase/supabase-js';
import { NextResponse, type NextRequest } from 'next/server';

// 개발 보너스 금액
const DEV_BONUS_PMP = 10000;
const DEV_BONUS_PMC = 10000;

function getCallbackParams(request: NextRequest) {
    const requestUrl = new URL(request.url);
    return {
        requestUrl,
        code: requestUrl.searchParams.get('code'),
        next: requestUrl.searchParams.get('next') ?? '/dashboard',
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

async function ensureUserProfile(adminSupabase: ReturnType<typeof createAdminSupabaseClient>, user: User) {
    const { username, displayName } = buildUserIdentity(user);

    const { data: existingProfile } = await adminSupabase
        .schema('user')
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single();

    if (existingProfile) return;

    const { error: profileError } = await adminSupabase
        .schema('user')
        .from('profiles')
        .insert({
            id: user.id,
            username,
            display_name: displayName,
            email_verified: !!user.email_confirmed_at,
            account_status: 'active',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        });

    if (profileError) {
        void profileError;
    }
}

async function upsertDevBonusAccount(adminSupabase: ReturnType<typeof createAdminSupabaseClient>, userId: string) {
    const { data: existingAccount } = await adminSupabase
        .schema('economy')
        .from('pmp_pmc_accounts')
        .select('user_id, pmp_balance, pmc_balance')
        .eq('user_id', userId)
        .single();

    if (existingAccount) {
        const newPmpBalance = Number(existingAccount.pmp_balance || 0) + DEV_BONUS_PMP;
        const newPmcBalance = Number(existingAccount.pmc_balance || 0) + DEV_BONUS_PMC;

        const { error: updateError } = await adminSupabase
            .schema('economy')
            .from('pmp_pmc_accounts')
            .update({
                pmp_balance: newPmpBalance,
                pmc_balance: newPmcBalance,
                updated_at: new Date().toISOString(),
            })
            .eq('user_id', userId);

        if (updateError) {
            void updateError;
        }

        return;
    }

    const { error: insertError } = await adminSupabase
        .schema('economy')
        .from('pmp_pmc_accounts')
        .insert({
            user_id: userId,
            pmp_balance: DEV_BONUS_PMP,
            pmc_balance: DEV_BONUS_PMC,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        });

    if (insertError) {
        void insertError;
    }
}

async function awardDevBonusIfNeeded(supabase: ReturnType<typeof createServerClient>) {
    if (!isDevelopment()) return;

    const { data } = await supabase.auth.getUser();
    const user = data.user;
    if (!user) return;

    const adminSupabase = createAdminSupabaseClient();

    await ensureUserProfile(adminSupabase, user);
    await upsertDevBonusAccount(adminSupabase, user.id);
}

export async function GET(request: NextRequest) {
    const { requestUrl, code, next } = getCallbackParams(request);

    // Vercel 프록시 환경 대응: x-forwarded-host 우선 사용
    const forwardedHost = request.headers.get('x-forwarded-host');
    const isLocalEnv = process.env.NODE_ENV === 'development';
    const redirectOrigin = forwardedHost && !isLocalEnv ? `https://${forwardedHost}` : requestUrl.origin;
    const targetUrl = `${redirectOrigin}${next.startsWith('/') ? next : '/' + next}`;

    if (!code) {
        return NextResponse.redirect(`${redirectOrigin}/auth/login?error=no_code`);
    }

    let response = NextResponse.redirect(targetUrl);

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
                    response = NextResponse.redirect(targetUrl);
                    cookiesToSet.forEach(({ name, value, options }) =>
                        response.cookies.set(name, value, options)
                    );
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
        await awardDevBonusIfNeeded(supabase);
    } catch {
        // 보너스 지급 실패해도 로그인은 계속 진행
    }

    return response;
}
