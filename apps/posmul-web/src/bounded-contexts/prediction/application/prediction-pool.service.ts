import { SupabaseClient } from "@supabase/supabase-js";

import { getKstHourStartIso } from "@/shared/utils/time/getKstHourStartIso";

type PoolPmcRow = { pool_pmc: number | string | null };

const toFiniteNumberOrNull = (value: number | string | null): number | null => {
  const n = typeof value === "string" ? Number(value) : value;
  return Number.isFinite(n) ? n : null;
};

const sumPoolPmc = (rows: PoolPmcRow[]): number => {
  return rows.reduce((acc, row) => {
    const v = toFiniteNumberOrNull(row.pool_pmc);
    return v === null ? acc : acc + v;
  }, 0);
};

const fetchHourlyGamePoolsTotal = async (
  supabase: SupabaseClient,
  hourStart: string,
  category: string,
  subcategory: string
): Promise<number | null> => {
  const { data, error } = await supabase
    .schema("economy")
    .from("money_wave_hourly_game_pools")
    .select("pool_pmc")
    .eq("domain", "prediction")
    .eq("hour_start", hourStart)
    .eq("category", category)
    .eq("subcategory", subcategory);

  if (error || !data) return null;
  const total = sumPoolPmc(data as PoolPmcRow[]);
  return total > 0 ? Math.floor(total) : null;
};

const fetchHourlyCategoryAllocation = async (
  supabase: SupabaseClient,
  hourStart: string,
  category: string
): Promise<number | null> => {
  const { data, error } = await supabase
    .schema("economy")
    .from("money_wave_hourly_category_allocations")
    .select("pool_pmc")
    .eq("domain", "prediction")
    .eq("hour_start", hourStart)
    .eq("category", category)
    .maybeSingle();

  if (error || !data) return null;
  const value = toFiniteNumberOrNull((data as PoolPmcRow).pool_pmc);
  return value !== null && value > 0 ? Math.floor(value) : null;
};

const fetchPredictionDomainTotal = async (
  supabase: SupabaseClient,
  hourStart: string
): Promise<number> => {
  const { data, error } = await supabase
    .schema("economy")
    .from("money_wave_hourly_category_allocations")
    .select("pool_pmc")
    .eq("domain", "prediction")
    .eq("hour_start", hourStart);

  if (error || !data) return 0;
  return Math.floor(sumPoolPmc(data as PoolPmcRow[]));
};

/**
 * Calculates the total allocated prize pool for a given scope.
 *
 * @param supabase Supabase client instance
 * @param category (Optional) Filter by category (e.g., 'sports', 'politics')
 * @param subcategory (Optional) Filter by subcategory (metadata->>sport or tags)
 * @returns Total prize pool amount (number)
 */
export async function getAggregatedPrizePool(
  supabase: SupabaseClient,
  category?: string,
  subcategory?: string
): Promise<number> {
  const hourStart = getKstHourStartIso();

  const normalizedCategory = category?.trim().toUpperCase();
  const normalizedSubcategory = subcategory?.trim();

  try {
    // Depth 3+: if subcategory is specified, aggregate from the hourly game pools (Truth).
    if (normalizedCategory && normalizedCategory !== "ALL" && normalizedSubcategory) {
      const total = await fetchHourlyGamePoolsTotal(
        supabase,
        hourStart,
        normalizedCategory,
        normalizedSubcategory
      );
      if (total !== null) return total;
    }

    // Depth 2+: aggregate from hourly category allocations.
    if (normalizedCategory && normalizedCategory !== "ALL") {
      const value = await fetchHourlyCategoryAllocation(
        supabase,
        hourStart,
        normalizedCategory
      );
      if (value !== null) return value;
    }

    // Depth 1: platform total for prediction domain.
    return await fetchPredictionDomainTotal(supabase, hourStart);
  } catch {
    return 0;
  }
}
