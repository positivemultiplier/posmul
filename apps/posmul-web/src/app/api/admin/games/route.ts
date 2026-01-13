/**
 * 예측 게임 생성 API
 * 
 * 관리자가 수동으로 게임을 생성할 때 사용
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface CreateGameRequest {
    title: string;
    description: string;
    category: string;
    subcategory?: string;
    predictionType: "binary" | "wdl" | "ranking";
    options: { id: string; label: string }[];
    startTime: string;
    endTime: string;
    minimumStake: number;
    maximumStake: number;
    maxParticipants?: number;
    settlementSource?: {
        type: "manual" | "api";
        sourceType?: string;
        sourceConfig?: Record<string, unknown>;
    };
}

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();

        // 인증 확인
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json(
                { success: false, error: "Unauthorized" },
                { status: 401 }
            );
        }

        // 관리자 권한 확인 (TODO: 실제 권한 체크)
        const { data: profile } = await supabase
            .from("user_profiles")
            .select("role")
            .eq("id", user.id)
            .single();

        // 임시로 모든 사용자 허용 (실제로는 role 체크 필요)
        // if (profile?.role !== "admin") {
        //   return NextResponse.json(
        //     { success: false, error: "Admin access required" },
        //     { status: 403 }
        //   );
        // }

        const body: CreateGameRequest = await request.json();

        // 유효성 검사
        if (!body.title || !body.category || !body.options || body.options.length < 2) {
            return NextResponse.json(
                { success: false, error: "Missing required fields" },
                { status: 400 }
            );
        }

        // 게임 생성
        const gameData = {
            title: body.title,
            description: body.description || "",
            category: body.category,
            subcategory: body.subcategory || null,
            prediction_type: body.predictionType,
            options: body.options,
            start_time: new Date(body.startTime).toISOString(),
            end_time: new Date(body.endTime).toISOString(),
            minimum_stake: body.minimumStake,
            maximum_stake: body.maximumStake,
            max_participants: body.maxParticipants || 1000,
            status: "active",
            creator_id: user.id,
            settlement_source: body.settlementSource || { type: "manual" },
            created_at: new Date().toISOString(),
        };

        const { data: game, error: insertError } = await supabase
            .from("prediction.games")
            .insert(gameData)
            .select()
            .single();

        if (insertError) {
            console.error("[Create Game API] Insert error:", insertError);
            return NextResponse.json(
                { success: false, error: insertError.message },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            data: game,
        });

    } catch (error) {
        console.error("[Create Game API] Error:", error);
        return NextResponse.json(
            { success: false, error: "Internal Server Error" },
            { status: 500 }
        );
    }
}

// 게임 목록 조회
export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();
        const url = new URL(request.url);
        const status = url.searchParams.get("status") || "all";
        const category = url.searchParams.get("category");
        const limit = parseInt(url.searchParams.get("limit") || "50");

        let query = supabase
            .from("prediction.games")
            .select("*")
            .order("created_at", { ascending: false })
            .limit(limit);

        if (status !== "all") {
            query = query.eq("status", status);
        }

        if (category) {
            query = query.eq("category", category);
        }

        const { data: games, error } = await query;

        if (error) {
            console.error("[Get Games API] Error:", error);
            return NextResponse.json(
                { success: false, error: error.message },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            data: games,
            count: games?.length ?? 0,
        });

    } catch (error) {
        console.error("[Get Games API] Error:", error);
        return NextResponse.json(
            { success: false, error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
