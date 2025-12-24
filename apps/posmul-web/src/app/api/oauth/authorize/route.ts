import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url)
        const clientId = searchParams.get('client_id')
        const redirectUri = searchParams.get('redirect_uri')

        // 1. Basic Validation
        if (!clientId || !redirectUri) {
            return NextResponse.json({ error: 'invalid_request', error_description: 'Missing client_id or redirect_uri' }, { status: 400 })
        }

        // 2. Auth Check
        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            // Allow user to login then return here
            const loginUrl = new URL('/auth/login', req.url)
            loginUrl.searchParams.set('next', req.nextUrl.pathname + req.nextUrl.search)
            return NextResponse.redirect(loginUrl)
        }

        // 3. Client Verification
        // Use 'any' or explicit cast if Types are not fully propagated yet in local env
        const { data: client, error: clientError } = await supabase
            .from('oauth_provider.clients' as any)
            .select('*')
            .eq('id', clientId)
            .single()

        if (clientError || !client) {
            return NextResponse.json({ error: 'unauthorized_client', error_description: 'Invalid client_id' }, { status: 401 })
        }

        // 4. Redirect URI Verification
        const registeredUris = client.redirect_uris as string[]
        if (!registeredUris.includes(redirectUri)) {
            return NextResponse.json({ error: 'invalid_request', error_description: 'Mismatching redirect_uri' }, { status: 400 })
        }

        // 5. Generate Authorization Code
        const code = crypto.randomUUID()
        const { error: insertError } = await supabase
            .from('oauth_provider.auth_codes' as any)
            .insert({
                code,
                client_id: client.id,
                user_id: user.id,
                redirect_uri: redirectUri,
                expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString() // 10 minutes
            })

        if (insertError) {
            console.error('Failed to create auth code:', insertError)
            return NextResponse.json({ error: 'server_error' }, { status: 500 })
        }

        // 6. Redirect to Callback
        const callbackUrl = new URL(redirectUri)
        callbackUrl.searchParams.set('code', code)
        // Add state if provided
        const state = searchParams.get('state')
        if (state) callbackUrl.searchParams.set('state', state)

        return NextResponse.redirect(callbackUrl)

    } catch (err: any) {
        console.error('OAuth Authorize Error:', err)
        return NextResponse.json({ error: 'server_error', details: err.message }, { status: 500 })
    }
}
