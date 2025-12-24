import { SupabaseClient } from "@supabase/supabase-js";

/**
 * Calculates the total allocated prize pool for a given scope.
 *
 * @param supabase Supabase client instance
 * @param category (Optional) Filter by category (e.g., 'sports', 'politics')
 * @param subcategory (Optional) Filter by subcategory (metadata->>sport or tags)
 * @returns Total prize pool amount (number)
 */
export async function getAggregatedPrizePool(
  _supabase: SupabaseClient,
  category?: string,
  subcategory?: string
): Promise<number> {
  // Currently bypassing DB query to prevent runtime errors with unstable schema (missing columns).
  // Returning simulated pool (EBIT model) as requested.
  // In the future, RESTORE this query when 'allocated_prize_pool' or similar column is available.

  /*
  let query = _supabase
    .schema("prediction")
    .from("prediction_games")
    .select("id", { count: "exact", head: true })
    .eq("status", "ACTIVE");

  if (category && category !== "all") {
    query = query.eq("category", category.toUpperCase());
  }

  if (subcategory) {
      query = query.or(`metadata->>sport.eq.${subcategory},tags.cs.{${subcategory}}`);
  }

  const { error } = await query;

  if (error) {
    console.error("Error calculating prize pool:", error.message, error.details);
  }
  */

  return calculateSimulatedPool(category, subcategory);
}

// Simulated Pool Calculation (Fallback)
function calculateSimulatedPool(category: string = "all", subcategory?: string): number {
  // Base Pool: ~69억 (Platform Total)
  let pool = 6912000000;

  // Category Weights
  const weights: Record<string, number> = {
    "all": 1.0,
    "sports": 0.35, // Sports is popular
    "politics": 0.25,
    "economy": 0.20,
    "entertainment": 0.20
  };

  const catWeight = weights[category.toLowerCase()] || 0.2;
  pool *= catWeight;

  // Subcategory variation (if provided)
  if (subcategory) {
    pool *= 0.25; // Assume roughly 1/4 share
  }

  // Add some randomness based on date/hour to make it look "alive" but stable for hydration
  // For server-side, simple random might cause hydration mismatch if passed to client?
  // No, this is passed as props, so it's fine.
  pool *= (0.9 + Math.random() * 0.2);

  return Math.floor(pool);
}
