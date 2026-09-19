
import * as fs from 'fs';
import * as path from 'path';
import { createClient } from '@supabase/supabase-js';

// Load Env
const envPath = path.resolve(process.cwd(), '.env.local');
const envFile = fs.readFileSync(envPath, 'utf8');
const envConfig = {};
envFile.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
        process.env[key.trim()] = value.trim();
    }
});

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false }
});

async function run() {
    console.log("Testing Insert...");

    // Get Valid Auth User
    let validUserId;
    const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();

    if (users && users.length > 0) {
        validUserId = users[0].id;
    } else {
        console.log("Creating new System User...");
        const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
            email: 'system@posmul.local',
            password: 'system-password-123',
            email_confirm: true
        });
        if (createError || !newUser.user) {
            console.error("Failed to create system user:", createError);
            return;
        }
        validUserId = newUser.user.id;
    }
    console.log("Using Auth User ID:", validUserId);

    const slug = `test-slug-${Date.now()}`;
    const { data, error } = await supabase.schema('prediction').from('prediction_games').insert({
        title: "Test Insert",
        description: "Test Description must be at least 20 characters long to pass the constraint.",
        status: 'DRAFT',
        category: 'POLITICS',
        creator_id: validUserId,
        prediction_type: 'BINARY',
        game_options: { options: ["Yes", "No"] },
        registration_start: new Date(),
        registration_end: new Date(Date.now() + 100000),
        settlement_date: new Date(Date.now() + 200000),
        min_bet_amount: 100,
        max_bet_amount: 10000,
        difficulty: 1.0,
        slug: slug,
        updated_at: new Date()
    }).select();

    if (error) {
        console.error("Insert Error:", error);
    } else {
        console.log("Insert Success:", data);
        // Clean up
        if (data && data[0]) {
            await supabase.schema('prediction').from('prediction_games').delete().eq('game_id', data[0].game_id);
            console.log("Cleanup Done");
        }
    }
}

run();
