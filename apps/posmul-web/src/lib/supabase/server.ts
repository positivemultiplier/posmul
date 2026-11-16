import { createServerClient } from '@supabase/ssr'
import { cookies, headers } from 'next/headers'
import { resolveCrossSubdomainCookieDomain } from './sso-cookie'

export async function createClient() {
    const cookieStore = await cookies()
    const headerStore = await headers()
    const host = headerStore.get('x-forwarded-host') || headerStore.get('host')
    const ssoDomain = resolveCrossSubdomainCookieDomain(host)

    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll()
                },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, {
                                ...options,
                                ...(ssoDomain ? { domain: ssoDomain } : {}),
                            })
                        )
                    } catch {
                        // The `setAll` method was called from a Server Component.
                        // This can be ignored if you have middleware refreshing
                        // user sessions.
                    }
                },
            },
            global: {
                headers: {
                    accept: 'application/json',
                },
            },
        }
    )
}
