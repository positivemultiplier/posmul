import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
    try {
        const authHeader = req.headers.get('authorization')
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'invalid_request' }, { status: 401 })
        }
        const token = authHeader.split(' ')[1]

        const supabase = await createClient()

        // Validate Token
        const { data: tokenData, error: tokenError } = await supabase
            .from('oauth_provider.tokens' as any)
            .select('*')
            .eq('access_token', token)
            .single()

        if (tokenError || !tokenData || new Date(tokenData.expires_at) < new Date()) {
            return NextResponse.json({ error: 'invalid_token' }, { status: 401 })
        }

        // Fetch User Profile
        // Try getting public profile first
        const { data: userProfile } = await supabase
            .from('user.profiles' as any)
            .select('username')
            .eq('id', tokenData.user_id)
            .single()

        // Fallback or additional info if needed
        // Since we are server-side, we can try to fetch auth.users, but standard supabase client won't let us query auth schema easily
        // We will just return what we have. External SDK mainly needs the ID (sub).

        return NextResponse.json({
            sub: tokenData.user_id,
            name: userProfile?.username || 'Unknown User',
            // scope: "profile" // MVP
        })

    } catch (err: any) {
        console.error('UserInfo Error:', err)
        return NextResponse.json({ error: 'server_error' }, { status: 500 })
    }
}
