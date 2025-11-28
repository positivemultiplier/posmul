/**
 * Prediction Games Repository (DDD Infrastructure Layer)
 * 
 * DDD 원칙에 따라 Supabase prediction 스키마의 prediction_games 테이블과 상호작용하는 레포지토리
 * 
 * @author PosMul Development Team
 * @since 2024-12
 */

import { createClient } from "@/lib/supabase/server";

/**
 * 예측 게임 목록 조회 (필터링 옵션 포함)
 */
export async function getPredictionGames(options?: {
  category?: string;
  status?: string;
  limit?: number;
  offset?: number;
}) {
  const supabase = await createClient();
  
  let query = supabase
    .schema("prediction")
    .from("prediction_games")
    .select("*")
    .order("created_at", { ascending: false });

  if (options?.category) {
    query = query.eq("category", options.category);
  }

  if (options?.status) {
    query = query.eq("status", options.status);
  }

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  if (options?.offset) {
    query = query.range(
      options.offset,
      options.offset + (options.limit || 10) - 1
    );
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching prediction games:", error);
    throw error;
  }

  return data;
}

/**
 * 특정 예측 게임 조회 (slug 기반)
 */
export async function getPredictionGameBySlug(slug: string) {
  const supabase = await createClient();

  console.log("[DEBUG] getPredictionGameBySlug called with slug:", slug);

  // slug 컬럼으로 직접 조회 - maybeSingle() 사용하여 배열/null 처리
  const { data, error } = await supabase
    .schema("prediction")
    .from("prediction_games")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  console.log("[DEBUG] Query result - data:", JSON.stringify(data), "error:", JSON.stringify(error));

  if (error) {
    console.error(`Error fetching prediction game with slug ${slug}:`, error);
    return null;
  }

  // 데이터가 없으면 game_id로 시도
  if (!data) {
    const { data: gameById, error: errorById } = await supabase
      .schema("prediction")
      .from("prediction_games")
      .select("*")
      .eq("game_id", slug)
      .maybeSingle();

    if (errorById) {
      console.error(`Error fetching prediction game with game_id ${slug}:`, errorById);
      return null;
    }

    console.log("[DEBUG] Returning game by game_id:", gameById?.game_id);
    return gameById;
  }

  console.log("[DEBUG] Returning game with game_id:", data?.game_id);
  return data;
}

/**
 * 스포츠 카테고리 예측 게임 조회
 */
export async function getSportsPredictionGames(options?: {
  limit?: number;
  status?: string;
}) {
  return getPredictionGames({
    category: "SPORTS",
    status: options?.status || "ACTIVE",
    limit: options?.limit || 10,
  });
}

/**
 * 예측 게임 통계 조회
 */
export async function getPredictionGameStats(gameId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .schema("prediction")
    .from("prediction_statistics")
    .select("*")
    .eq("game_id", gameId)
    .single();

  if (error) {
    console.error(`Error fetching stats for game ${gameId}:`, error);
    return null;
  }

  return data;
}

/**
 * 게임 옵션 데이터 파싱 헬퍼
 */
export function parseGameOptions(gameOptions: any) {
  try {
    if (Array.isArray(gameOptions)) {
      return gameOptions;
    }
    
    if (typeof gameOptions === "object" && gameOptions !== null) {
      if (gameOptions.options) {
        return gameOptions.options;
      }
      return Object.values(gameOptions);
    }
    
    return [];
  } catch (error) {
    console.error("Error parsing game options:", error);
    return [];
  }
}
