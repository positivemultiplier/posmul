import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const { client_id, client_secret, code, grant_type, redirect_uri } = body

        if (grant_type !== 'authorization_code') {
            return NextResponse.json({ error: 'unsupported_grant_type' }, { status: 400 })
        }

        const supabase = await createClient()

        // Verify Client
        const { data: client, error: clientError } = await supabase
            .from('oauth_provider.clients' as any)
            .select('*')
            .eq('id', client_id)
            .eq('secret', client_secret) // In prod, use hash comparison
            .single()

        if (clientError || !client) {
            return NextResponse.json({ error: 'invalid_client' }, { status: 401 })
        }

        // Verify Code
        const { data: authCode, error: codeError } = await supabase
            .from('oauth_provider.auth_codes' as any)
            .select('*')
            .eq('code', code)
            .single()

        if (codeError || !authCode) {
            return NextResponse.json({ error: 'invalid_grant' }, { status: 400 })
        }

        if (new Date(authCode.expires_at) < new Date() || authCode.used_at) {
            return NextResponse.json({ error: 'invalid_grant', error_description: 'Code expired or used' }, { status: 400 })
        }

        if (authCode.client_id !== client_id) {
            return NextResponse.json({ error: 'invalid_grant', error_description: 'Client mismatch' }, { status: 400 })
        }

        // Mark Code Used
        await supabase.from('oauth_provider.auth_codes' as any).update({ used_at: new Date().toISOString() }).eq('code', code)

        // Issue Token
        const accessToken = crypto.randomUUID()
        const refreshToken = crypto.randomUUID()
        const expiresAt = new Date(Date.now() + 3600 * 1000).toISOString() // 1 hour

        const { error: tokenError } = await supabase.from('oauth_provider.tokens' as any).insert({
            access_token: accessToken,
            refresh_token: refreshToken,
            client_id: client_id,
            user_id: authCode.user_id,
            expires_at: expiresAt
        })

        if (tokenError) {
            throw new Error('Failed to save token')
        }

        return NextResponse.json({
            access_token: accessToken,
            token_type: 'Bearer',
            expires_in: 3600,
            refresh_token: refreshToken
        })

    } catch (err: any) {
        console.error('Token Error:', err)
        return NextResponse.json({ error: 'server_error', details: err.message }, { status: 500 })
    }
}
