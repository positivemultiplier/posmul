import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { getKstHourStartIso } from "../src/shared/utils/time/getKstHourStartIso";

type AllocationRow = {
  category: string;
  pool_pmc: string | number | null;
};

type GamePoolRow = {
  game_id: string;
  category: string;
  pool_pmc: string | number | null;
};

const requireEnv = (key: string): string => {
  const v = process.env[key];
  if (!v) {
    throw new Error(
      `Missing env var: ${key}. Set it before running this script.`
    );
  }
  return v;
};

const toStringSafe = (value: string | number | null): string | null => {
  if (value === null) return null;
  return typeof value === "string" ? value : String(value);
};

const decimalToMicro = (value: string): bigint => {
  const trimmed = value.trim();
  if (!trimmed) return 0n;

  const sign = trimmed.startsWith("-") ? -1n : 1n;
  const unsigned = trimmed.startsWith("-") ? trimmed.slice(1) : trimmed;
  const [intPartRaw, fracPartRaw] = unsigned.split(".");
  const intPart = intPartRaw && /^\d+$/.test(intPartRaw) ? BigInt(intPartRaw) : 0n;
  const fracDigits = (fracPartRaw ?? "").replace(/[^0-9]/g, "");
  const frac6 = (fracDigits + "000000").slice(0, 6);
  const frac = frac6 ? BigInt(frac6) : 0n;

  return sign * (intPart * 1000000n + frac);
};

const toMicro = (value: string | number | null): bigint => {
  const asString = toStringSafe(value);
  if (asString === null) return 0n;
  return decimalToMicro(asString);
};

const sumMicro = (values: Array<string | number | null>): bigint => {
  return values.reduce((acc, v) => acc + toMicro(v), 0n);
};

const formatPmc = (micro: bigint): string => {
  const sign = micro < 0n ? "-" : "";
  const abs = micro < 0n ? -micro : micro;
  const intPart = abs / 1000000n;
  const frac = abs % 1000000n;
  const fracStr = frac.toString().padStart(6, "0");
  return `${sign}${intPart.toString()}.${fracStr}`;
};

const fetchAllocations = async (params: {
  supabase: SupabaseClient;
  hourStart: string;
}): Promise<AllocationRow[]> => {
  const { supabase, hourStart } = params;
  const { data, error } = await supabase
    .schema("economy")
    .from("money_wave_hourly_category_allocations")
    .select("category,pool_pmc")
    .eq("domain", "prediction")
    .eq("hour_start", hourStart);
  if (error) throw new Error(`allocations query failed: ${error.message}`);
  return (data ?? []) as AllocationRow[];
};

const fetchGamePools = async (params: {
  supabase: SupabaseClient;
  hourStart: string;
}): Promise<GamePoolRow[]> => {
  const { supabase, hourStart } = params;
  const { data, error } = await supabase
    .schema("economy")
    .from("money_wave_hourly_game_pools")
    .select("game_id,category,pool_pmc")
    .eq("domain", "prediction")
    .eq("hour_start", hourStart);
  if (error) throw new Error(`game_pools query failed: ${error.message}`);
  return (data ?? []) as GamePoolRow[];
};

const groupSumByCategory = (rows: GamePoolRow[]): Map<string, bigint> => {
  const map = new Map<string, bigint>();
  for (const r of rows) {
    const key = r.category;
    const prev = map.get(key) ?? 0n;
    map.set(key, prev + toMicro(r.pool_pmc));
  }
  return map;
};

const assert = (condition: boolean, message: string): void => {
  if (!condition) throw new Error(message);
};

async function main(): Promise<void> {
  const url = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
  const serviceRoleKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");

  const supabase = createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const hourStart = getKstHourStartIso();
  const previousHourStart = getKstHourStartIso(
    new Date(new Date(hourStart).getTime() - 60 * 60 * 1000)
  );

  const targets = [previousHourStart, hourStart];

  for (const targetHourStart of targets) {
    const allocations = await fetchAllocations({
      supabase,
      hourStart: targetHourStart,
    });
    const gamePools = await fetchGamePools({
      supabase,
      hourStart: targetHourStart,
    });

    console.log("\n=== MoneyWave Depth5 Verification ===");
    console.log("hour_start:", targetHourStart);
    console.log("allocations rows:", allocations.length);
    console.log("game pools rows:", gamePools.length);

    assert(allocations.length > 0, "No category allocations found.");
    assert(gamePools.length > 0, "No game pools found.");

    const allocTotal = sumMicro(allocations.map((r) => r.pool_pmc));
    const gameTotal = sumMicro(gamePools.map((r) => r.pool_pmc));

    console.log("alloc total (PMC):", formatPmc(allocTotal));
    console.log("game total  (PMC):", formatPmc(gameTotal));

    assert(
      allocTotal === gameTotal,
      `Invariant failed: sum(game pools) != sum(category allocations). (alloc=${formatPmc(
        allocTotal
      )}, game=${formatPmc(gameTotal)})`
    );

    const gameSumByCategory = groupSumByCategory(gamePools);
    for (const a of allocations) {
      const expected = toMicro(a.pool_pmc);
      const actual = gameSumByCategory.get(a.category) ?? 0n;
      assert(
        expected === actual,
        `Invariant failed for category=${a.category}: expected=${formatPmc(
          expected
        )}, actual=${formatPmc(actual)}`
      );
    }

    console.log("OK: invariants hold for", targetHourStart);
  }
}

main().catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  console.error("FAILED:", message);
  process.exitCode = 1;
});
