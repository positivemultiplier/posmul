
import { createClient } from "@supabase/supabase-js";

// Service Role Key is required for admin operations (bypassing RLS)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Note: This module should only be imported in server-side contexts
// Checking keys at runtime to avoid build-time errors if CLIENT bundle tries to process this file
// (Though it shouldn't be bundled to client if used correctly)

export const createAdminClient = () => {
    if (!supabaseUrl || !supabaseServiceRoleKey) {
        console.error("Missing Supabase admin keys - Admin operations will fail");
        // Throwing error might crash build if env not set during build
        // Return null or throw? Throwing is safer for runtime correctness.
    }

    return createClient(supabaseUrl, supabaseServiceRoleKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    });
};

// Singleton instance for server-side usage
export const supabaseAdmin = createClient(supabaseUrl || "", supabaseServiceRoleKey || "", {
    auth: {
        autoRefreshToken: false,
        persistSession: false,
    },
});
