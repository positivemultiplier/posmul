import { ExaoneClient } from "@/shared/infrastructure/llm/exaone-client";
import { GeminiClient } from "@/shared/infrastructure/llm/gemini-client";
import { OpenRouterClient } from "@/shared/infrastructure/llm/openrouter-client";
import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  AiForecastService,
  type AiForecastProviderPort,
  type AiForecastStore,
  type DbForecastGameRow,
  type DbForecastRow,
  type NewDbForecastRow,
  type RawAiForecastPayload,
} from "@/bounded-contexts/prediction/application/services/ai-forecast.service";
import type { AiProviderKey } from "@/bounded-contexts/prediction/domain/value-objects/ai-forecast.types";

function resolveOpenRouterLabel(modelName: string): string {
  const lower = modelName.toLowerCase();
  if (lower.includes("claude")) return "Anthropic Claude";
  if (lower.includes("gpt") || lower.includes("openai/")) return "OpenAI GPT";
  if (lower.includes("ernie")) return "Baidu ERNIE";
  return "OpenRouter AI";
}

export class SupabaseAiForecastStore implements AiForecastStore {
  async getGameById(gameId: string): Promise<DbForecastGameRow | null> {
    const { data, error } = await supabaseAdmin
      .schema("prediction")
      .from("prediction_games")
      .select(
        "game_id, title, description, category, prediction_type, data_source, game_options, registration_end, settlement_date, status"
      )
      .eq("game_id", gameId)
      .maybeSingle();
    if (error || !data) return null;
    return data as DbForecastGameRow;
  }

  async getForecastsByGameId(gameId: string): Promise<DbForecastRow[]> {
    const { data, error } = await supabaseAdmin
      .schema("prediction")
      .from("ai_forecasts")
      .select(
        "forecast_id, game_id, provider_key, provider_label, model_name, category, selected_option_id, selected_option_label, confidence_pct, reasoning, is_hit, brier_score, settled_at, created_at"
      )
      .eq("game_id", gameId)
      .order("created_at", { ascending: true });
    if (error || !data) return [];
    return data as DbForecastRow[];
  }

  async insertForecasts(rows: NewDbForecastRow[]): Promise<void> {
    if (rows.length === 0) return;
    await supabaseAdmin
      .schema("prediction")
      .from("ai_forecasts")
      .upsert(rows, { onConflict: "game_id,provider_key", ignoreDuplicates: true });
  }

  async getSettledHistoryByProviders(providerKeys: AiProviderKey[]) {
    if (providerKeys.length === 0) return [];
    const { data, error } = await supabaseAdmin
      .schema("prediction")
      .from("ai_forecasts")
      .select("game_id, provider_key, category, is_hit, settled_at")
      .in("provider_key", providerKeys)
      .not("is_hit", "is", null)
      .not("settled_at", "is", null)
      .order("settled_at", { ascending: false })
      .limit(200);
    if (error || !data) return [];
    return data as Array<{
      game_id: string;
      provider_key: string;
      category: string;
      is_hit: boolean;
      settled_at: string;
    }>;
  }
}

export function createAiForecastProviders(): AiForecastProviderPort[] {
  const gemini = new GeminiClient();
  const exaone = new ExaoneClient();
  const openrouter = new OpenRouterClient();
  const openrouterModel = openrouter.getModelName();

  return [
    {
      key: "gemini",
      label: "Google Gemini",
      modelName: gemini.getPrimaryModelName(),
      isConfigured: () => gemini.isConfigured(),
      predictJson: (sys, usr, timeout) =>
        gemini.generateJson<RawAiForecastPayload>(sys, usr, timeout, 0.35),
    },
    {
      key: "exaone",
      label: "LG EXAONE",
      modelName: exaone.getModelName(),
      isConfigured: () => exaone.isConfigured(),
      predictJson: (sys, usr, timeout) =>
        exaone.generateJson<RawAiForecastPayload>(sys, usr, {
          temperature: 0.35,
          timeoutMs: timeout,
        }),
    },
    {
      key: "openrouter",
      label: resolveOpenRouterLabel(openrouterModel),
      modelName: openrouterModel,
      isConfigured: () => openrouter.isConfigured(),
      predictJson: (sys, usr, timeout) =>
        openrouter.generateJson<RawAiForecastPayload>(sys, usr, {
          temperature: 0.35,
          timeoutMs: timeout,
        }),
    },
  ];
}

export function createAiForecastService(): AiForecastService {
  return new AiForecastService(
    createAiForecastProviders(),
    new SupabaseAiForecastStore()
  );
}
