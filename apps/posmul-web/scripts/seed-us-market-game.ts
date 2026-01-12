
import { createClient } from "@supabase/supabase-js";
import { v4 as uuidv4 } from "uuid";
import dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seedUsMarketGame() {
    console.log("Creating US Market Prediction Game (Nasdaq 100)...");

    const gameId = uuidv4();
    const startTime = new Date(); // Start now
    const endTime = new Date(startTime.getTime() + 24 * 60 * 60 * 1000); // 24 hours
    const settlementTime = new Date(endTime.getTime() + 60 * 60 * 1000); // 1 hour after end

    // Create Nasdaq 100 Game
    const gameData = {
        game_id: gameId,
        title: "[TEST] 오늘의 나스닥(QQQ) 등락 예측",
        description: "나스닥 100 지수(QQQ)가 어제보다 오를까요? 내릴까요? (테스트용)",
        prediction_type: "BINARY",
        game_options: [
            { id: "up", label: "상승", description: "어제 종가보다 상승" },
            { id: "down", label: "하락", description: "어제 종가보다 하락" },
        ],
        registration_start: startTime.toISOString(),
        registration_end: endTime.toISOString(),
        settlement_date: settlementTime.toISOString(),
        min_bet_amount: 1000,
        max_bet_amount: 50000,
        // max_participants: 5000, // DB에 컬럼 없음
        creator_id: "system-scheduler",
        category: "INVEST",
        status: "ACTIVE",
        difficulty: 1,
        is_official: true,
        // game_importance_score, allocated_prize_pool, versionRemoved
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    };

    // 1. Get a valid user ID (optional, if constraints exist)
    // We'll try to insert with a random UUID, if it fails, we fetch one.
    // Actually, checking standard implementation, usually systems utilize a specific service role or a specific user.
    // Let's just try to fetch the first user from auth.users via admin API if possible, or use a hardcoded one if we know it.
    // Since we are using service_role key, we can query users.

    const { data: users } = await supabase.auth.admin.listUsers();
    const validUser = users?.users[0];
    let creatorId = validUser?.id;

    if (!creatorId) {
        console.log("No users found. Creating a dummy user for testing...");
        // Create a dummy user
        const { data: newUser, error: createUserError } = await supabase.auth.admin.createUser({
            email: `test-scheduler-${Date.now()}@example.com`,
            password: 'password123',
            email_confirm: true
        });
        if (createUserError || !newUser?.user) {
            console.error("Failed to create dummy user:", createUserError);
            return;
        }
        creatorId = newUser.user.id;
    }

    console.log(`Using Creator ID: ${creatorId}`);
    gameData.creator_id = creatorId;

    // Insert Game
    const { error: gameError } = await supabase
        .schema("prediction")
        .from("prediction_games")
        .insert(gameData);

    if (gameError) {
        console.error("Error creating game:", JSON.stringify(gameError, null, 2));
        return;
    }

    console.log(`Game created successfully! ID: ${gameId}`);

    // Insert Settlement Source
    const settlementSourceData = {
        game_id: gameId,
        source_type: "alpha-vantage",
        source_config: {
            symbol: "QQQ",
            comparisonType: "price_change_direction",
            optionMapping: { up: "up", down: "down" },
        },
        scheduled_at: settlementTime.toISOString(),
        status: "PENDING"
    };

    const { error: sourceError } = await supabase
        .schema("prediction")
        .from("settlement_sources")
        .insert(settlementSourceData);

    if (sourceError) {
        console.error("Error creating settlement source:", sourceError);
    } else {
        console.log("Settlement source created successfully!");
    }
}

seedUsMarketGame();
