import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { NextResponse, type NextRequest } from 'next/server';

// 개발 보너스 금액
const DEV_BONUS_PMP = 10000;
const DEV_BONUS_PMC = 10000;

export async function GET(request: NextRequest) {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get('code');
    const next = requestUrl.searchParams.get('next') ?? '/dashboard';

    if (code) {
        const cookieStore = await cookies();

        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    get(name: string) {
                        return cookieStore.get(name)?.value;
                    },
                    set(name: string, value: string, options: CookieOptions) {
                        try {
                            cookieStore.set({ name, value, ...options });
                        } catch {
                            // Server Component 환경에서는 set이 실패할 수 있음
                        }
                    },
                    remove(name: string, options: CookieOptions) {
                        try {
                            cookieStore.set({ name, value: '', ...options });
                        } catch {
                            // Server Component 환경에서는 remove가 실패할 수 있음
                        }
                    },
                },
            }
        );

        const { error } = await supabase.auth.exchangeCodeForSession(code);

        if (!error) {
            console.log('✅ OAuth callback success! Redirecting to:', next);
            
            // 🎁 개발용 보너스 지급 (Service Role 사용 - RLS 우회)
            try {
                const { data: { user } } = await supabase.auth.getUser();
                
                if (user && process.env.NODE_ENV === 'development') {
                    // Service Role 클라이언트 생성 (RLS 우회)
                    const adminSupabase = createClient(
                        process.env.NEXT_PUBLIC_SUPABASE_URL!,
                        process.env.SUPABASE_SERVICE_ROLE_KEY!,
                        { auth: { persistSession: false } }
                    );
                    
                    const username = user.email?.split('@')[0] || `user_${user.id.slice(0, 8)}`;
                    const displayName = user.user_metadata?.full_name || 
                                       user.user_metadata?.name || 
                                       username;
                    
                    // DDD: user.profiles에서 프로필 확인
                    const { data: existingProfile } = await adminSupabase
                        .schema('user')
                        .from('profiles')
                        .select('id')
                        .eq('id', user.id)
                        .single();
                    
                    // DDD: economy.pmp_pmc_accounts에서 잔액 확인 (Single Source of Truth)
                    const { data: existingAccount } = await adminSupabase
                        .schema('economy')
                        .from('pmp_pmc_accounts')
                        .select('user_id, pmp_balance, pmc_balance')
                        .eq('user_id', user.id)
                        .single();
                    
                    // 프로필이 없으면 생성
                    if (!existingProfile) {
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
                            console.warn('⚠️ [OAuth] 프로필 생성 실패:', profileError.message);
                        } else {
                            console.log('✅ [OAuth] 새 사용자 프로필 생성');
                        }
                    }
                    
                    if (existingAccount) {
                        // 이미 존재하면 잔액에 보너스 추가
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
                            .eq('user_id', user.id);
                        
                        if (!updateError) {
                            console.log(`🎁 [OAuth] 기존 사용자 보너스 추가! PMP: ${newPmpBalance}, PMC: ${newPmcBalance}`);
                        } else {
                            console.error('⚠️ [OAuth] 잔액 업데이트 실패:', updateError.message);
                        }
                    } else {
                        // 경제 계정이 없으면 새로 생성 (handle_new_user 트리거가 실패했을 수 있음)
                        const { error: insertError } = await adminSupabase
                            .schema('economy')
                            .from('pmp_pmc_accounts')
                            .insert({
                                user_id: user.id,
                                pmp_balance: DEV_BONUS_PMP,
                                pmc_balance: DEV_BONUS_PMC,
                                created_at: new Date().toISOString(),
                                updated_at: new Date().toISOString(),
                            });
                        
                        if (!insertError) {
                            console.log(`🎁 [OAuth] 새 경제 계정 생성 + 보너스 지급! PMP: ${DEV_BONUS_PMP}, PMC: ${DEV_BONUS_PMC}`);
                        } else {
                            console.error('⚠️ [OAuth] 경제 계정 생성 실패:', insertError.message);
                        }
                    }
                }
            } catch (bonusError) {
                console.error('⚠️ [OAuth] 개발 보너스 지급 실패:', bonusError);
                // 보너스 지급 실패해도 로그인은 계속 진행
            }
            
            return NextResponse.redirect(new URL(next, request.url));
        }

        console.error('❌ Code exchange error:', error);
        return NextResponse.redirect(new URL('/auth/login?error=auth_error', request.url));
    }

    console.log('⚠️ No code parameter, redirecting to login');
    return NextResponse.redirect(new URL('/auth/login?error=no_code', request.url));
}
