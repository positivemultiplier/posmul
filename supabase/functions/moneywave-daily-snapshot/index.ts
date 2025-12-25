// @ts-nocheck
/* eslint-disable */
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

import { createClient } from "jsr:@supabase/supabase-js@2";

type MoneyWaveDailySnapshotRow = {
  snapshot_id: string;
  snapshot_date: string;
  timezone: string;
  algorithm_version: string;
  computed_at: string;
  annual_ebitda: number | null;
  tax_rate: number | null;
  interest_rate: number | null;
  daily_pool_wave1_pmc: number;
  daily_pool_wave2_pmc: number;
  daily_pool_wave3_pmc: number;
  daily_pool_total_pmc: number;
  hourly_pool_total_pmc: number;
  metadata: unknown | null;
};

function toSeoulDateString(now: Date): string {
  const datePart = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
  return datePart;
}

function toNumber(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string") {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

type SignalResult = {
  count: number;
  warning?: string;
};

function safeCount(count: number | null | undefined, error: { message: string } | null): SignalResult {
  if (error) return { count: 0, warning: error.message };
  return { count: count ?? 0 };
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "method_not_allowed" }), {
      status: 405,
      headers: { "content-type": "application/json" },
    });
  }

  let forceRecompute = false;
  try {
    const body = (await req.json()) as { force?: unknown };
    forceRecompute = body?.force === true;
  } catch {
    // ignore invalid JSON
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !serviceRoleKey) {
    return new Response(JSON.stringify({ error: "missing_supabase_env" }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  const now = new Date();
  const snapshotDate = toSeoulDateString(now);

  // v2 algorithm: read config from DB + allocate by real signals.
  const configRes = await supabase
    .schema("economy")
    .from("money_wave_config")
    .select("timezone, algorithm_version, annual_ebitda, tax_rate, interest_rate, mw2_dormant_days")
    .eq("is_active", true)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const config = configRes.data;
  if (!config) {
    return new Response(JSON.stringify({ error: "missing_money_wave_config" }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }

  const desiredAlgorithmVersion = (config.algorithm_version ?? "v2_signals_based") as string;

  // Idempotent-by-version: if already computed today with same algorithm_version, return it.
  // If version changed (or force=true), recompute and update today's row.
  const existing = await supabase
    .schema("economy")
    .from("money_wave_daily_snapshots")
    .select("*")
    .eq("snapshot_date", snapshotDate)
    .maybeSingle();

  if (existing.error) {
    return new Response(
      JSON.stringify({ error: "read_existing_failed", detail: existing.error.message }),
      { status: 500, headers: { "content-type": "application/json" } }
    );
  }

  const existingRow = existing.data ? (existing.data as MoneyWaveDailySnapshotRow) : null;
  const shouldRecompute =
    forceRecompute || !existingRow || existingRow.algorithm_version !== desiredAlgorithmVersion;

  if (existingRow && !shouldRecompute) {
    return new Response(
      JSON.stringify({
        status: "already_exists",
        snapshot: existingRow,
      }),
      { status: 200, headers: { "content-type": "application/json" } }
    );
  }

  const annualEbitda = toNumber(config.annual_ebitda);
  const taxRate = toNumber(config.tax_rate) ?? 0;
  const interestRate = toNumber(config.interest_rate) ?? 0;
  const dormantDays = typeof config.mw2_dormant_days === "number" ? config.mw2_dormant_days : 30;

  if (annualEbitda === null) {
    return new Response(JSON.stringify({ error: "invalid_config_annual_ebitda" }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }

  const netAnnual = annualEbitda * (1 - taxRate - interestRate);
  const dailyTotal = netAnnual / 365;

  // Signals
  const activeGamesRes = await supabase
    .schema("prediction")
    .from("prediction_games")
    .select("game_id", { count: "exact", head: true })
    .eq("status", "ACTIVE");

  const activeVenturesRes = await supabase
    .schema("economy")
    .from("money_wave3_ventures")
    .select("venture_id", { count: "exact", head: true })
    .eq("is_active", true);

  const dormantCutoffIso = new Date(now.getTime() - dormantDays * 24 * 60 * 60 * 1000).toISOString();
  const dormantRes = await supabase
    .schema("economy")
    .from("account_activity_stats")
    .select("user_id", { count: "exact", head: true })
    .lt("last_transaction_date", dormantCutoffIso);

  const s1 = safeCount(activeGamesRes.count, activeGamesRes.error);
  const s2 = safeCount(dormantRes.count, dormantRes.error);
  const s3 = safeCount(activeVenturesRes.count, activeVenturesRes.error);

  const w1 = s1.count;
  const w2 = s2.count;
  const w3 = s3.count;
  const sum = w1 + w2 + w3;

  const dailyWave1 = sum > 0 ? (dailyTotal * w1) / sum : dailyTotal;
  const dailyWave2 = sum > 0 ? (dailyTotal * w2) / sum : 0;
  const dailyWave3 = sum > 0 ? (dailyTotal * w3) / sum : 0;
  const dailyPoolTotal = dailyWave1 + dailyWave2 + dailyWave3;
  const hourlyPoolTotal = dailyPoolTotal / 24;

  const warnings = [s1.warning, s2.warning, s3.warning].filter(
    (w): w is string => typeof w === "string" && w.length > 0
  );

  const payload = {
    snapshot_date: snapshotDate,
    timezone: config.timezone ?? "Asia/Seoul",
    algorithm_version: desiredAlgorithmVersion,
    computed_at: now.toISOString(),
    annual_ebitda: annualEbitda,
    tax_rate: taxRate,
    interest_rate: interestRate,
    daily_pool_wave1_pmc: dailyWave1,
    daily_pool_wave2_pmc: dailyWave2,
    daily_pool_wave3_pmc: dailyWave3,
    daily_pool_total_pmc: dailyPoolTotal,
    hourly_pool_total_pmc: hourlyPoolTotal,
    metadata: {
      signals: {
        activePredictionGames: w1,
        dormantAccounts: w2,
        activeVentures: w3,
        dormantDays,
      },
      warnings: warnings.length > 0 ? warnings : undefined,
      previous: existingRow
        ? {
            algorithm_version: existingRow.algorithm_version,
            computed_at: existingRow.computed_at,
          }
        : undefined,
    },
  };

  if (existingRow) {
    const updated = await supabase
      .schema("economy")
      .from("money_wave_daily_snapshots")
      .update(payload)
      .eq("snapshot_date", snapshotDate)
      .select("*")
      .single();

    if (updated.error) {
      return new Response(
        JSON.stringify({ error: "update_failed", detail: updated.error.message }),
        { status: 500, headers: { "content-type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ status: "updated", snapshot: updated.data }),
      { status: 200, headers: { "content-type": "application/json" } }
    );
  }

  const inserted = await supabase
    .schema("economy")
    .from("money_wave_daily_snapshots")
    .insert(payload)
    .select("*")
    .single();

  if (inserted.error) {
    return new Response(
      JSON.stringify({ error: "insert_failed", detail: inserted.error.message }),
      { status: 500, headers: { "content-type": "application/json" } }
    );
  }

  return new Response(
    JSON.stringify({ status: "created", snapshot: inserted.data }),
    { status: 201, headers: { "content-type": "application/json" } }
  );
});
