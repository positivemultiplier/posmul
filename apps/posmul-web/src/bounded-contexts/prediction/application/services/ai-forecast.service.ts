import {
  clampConfidencePct,
  normalizeForecastReasoning,
  type AiForecastDTO,
  type AiProviderKey,
  type AiProviderStats,
  type AiRecentFormItem,
} from "@/bounded-contexts/prediction/domain/value-objects/ai-forecast.types";

export interface ForecastOptionInput {
  id: string;
  label: string;
  description?: string;
}

export interface RawAiForecastPayload {
  selectedOptionId?: string;
  confidencePct?: number;
  reasoning?: string;
}

export interface DbForecastRow {
  forecast_id: string;
  game_id: string;
  provider_key: string;
  provider_label: string;
  model_name: string;
  category: string;
  selected_option_id: string;
  selected_option_label: string;
  confidence_pct: number;
  reasoning: string;
  is_hit: boolean | null;
  brier_score: number | null;
  settled_at: string | null;
  created_at: string;
}

export interface DbForecastGameRow {
  game_id: string;
  title: string;
  description: string | null;
  category: string | null;
  prediction_type: string | null;
  data_source: string | null;
  game_options: unknown;
  registration_end: string | null;
  settlement_date: string | null;
  status: string | null;
}

export type NewDbForecastRow = Omit<
  DbForecastRow,
  "forecast_id" | "is_hit" | "brier_score" | "settled_at" | "created_at"
> & {
  prediction_type: string;
  region_code: string | null;
};

export interface AiForecastProviderPort {
  key: AiProviderKey;
  label: string;
  modelName: string;
  isConfigured(): boolean;
  predictJson(
    systemPrompt: string,
    userPrompt: string,
    timeoutMs: number
  ): Promise<RawAiForecastPayload>;
}

export interface AiForecastStore {
  getGameById(gameId: string): Promise<DbForecastGameRow | null>;
  getForecastsByGameId(gameId: string): Promise<DbForecastRow[]>;
  insertForecasts(rows: NewDbForecastRow[]): Promise<void>;
  getSettledHistoryByProviders(providerKeys: AiProviderKey[]): Promise<
    Array<{
      game_id: string;
      provider_key: string;
      category: string;
      is_hit: boolean;
      settled_at: string;
    }>
  >;
}

const CATEGORY_LABELS: Record<string, string> = {
  ECONOMY: "경제",
  INVEST: "투자",
  SPORTS: "스포츠",
  ENTERTAINMENT: "엔터",
  POLITICS: "정치",
  USER_PROPOSED: "제안",
  CONSUME: "소비",
};

function parseOptions(gameOptionsField: unknown): ForecastOptionInput[] {
  if (!gameOptionsField || typeof gameOptionsField !== "object") return [];
  const raw = (gameOptionsField as { options?: unknown }).options;
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item, idx) => {
      if (typeof item === "string") {
        return { id: `opt_${idx + 1}`, label: item };
      }
      if (item && typeof item === "object") {
        const obj = item as {
          id?: unknown;
          label?: unknown;
          text?: unknown;
          description?: unknown;
        };
        const label = String(
          obj.label ?? obj.text ?? obj.id ?? `선택지 ${idx + 1}`
        ).trim();
        const id = String(obj.id ?? `opt_${idx + 1}`).trim();
        return {
          id,
          label,
          description: obj.description ? String(obj.description) : undefined,
        };
      }
      return { id: `opt_${idx + 1}`, label: `선택지 ${idx + 1}` };
    })
    .filter((o) => Boolean(o.label));
}

function buildForecastPrompts(
  game: DbForecastGameRow,
  options: ForecastOptionInput[]
) {
  const optionLines = options
    .map((o, idx) => `${idx + 1}. optionId="${o.id}" | label="${o.label}"`)
    .join("\n");

  const systemPrompt = [
    "당신은 예측 시장의 독립 분석 모델입니다.",
    "주어진 예측 의제와 선택지만을 바탕으로 가장 가능성이 높다고 판단되는 선택지 1개를 독립적으로 예측하세요.",
    "",
    "[규칙]",
    "1. 할루시네이션 금지: 존재하지 않는 기사·수치·URL을 지어내지 마세요.",
    "2. 이모지 금지: 텍스트 안에 이모지를 절대 넣지 마세요.",
    "3. 간결성: reasoning은 누구나 바로 읽을 수 있는 쉬운 한국어 1문장(35~75자)으로 작성하세요.",
    "4. 반드시 아래 JSON 형식으로만 출력하세요:",
    '{ "selectedOptionId": "선택지 optionId", "confidencePct": 65, "reasoning": "핵심 판단 근거 1문장" }',
  ].join("\n");

  const userPrompt = [
    `의제 제목: ${game.title}`,
    `카테고리: ${game.category ?? "GENERAL"}`,
    `판정 출처: ${game.data_source ?? "공식 오라클"}`,
    `마감 시각: ${game.registration_end ?? "미정"}`,
    `설명: ${(game.description ?? "").trim() || "(없음)"}`,
    "선택지 목록:",
    optionLines,
  ].join("\n");

  return { systemPrompt, userPrompt };
}

export class AiForecastService {
  constructor(
    private readonly providers: ReadonlyArray<AiForecastProviderPort>,
    private readonly store: AiForecastStore
  ) {}

  private buildProviderStats(
    providerKey: AiProviderKey,
    targetCategory: string,
    history: Array<{
      game_id: string;
      provider_key: string;
      category: string;
      is_hit: boolean;
      settled_at: string;
    }>
  ): AiProviderStats {
    const providerRows = history.filter((h) => h.provider_key === providerKey);
    const categoryRows = providerRows.filter(
      (h) => h.category.toUpperCase() === targetCategory.toUpperCase()
    );

    const useCategory = categoryRows.length > 0;
    const chosenRows = useCategory ? categoryRows : providerRows;
    const categoryLabel =
      CATEGORY_LABELS[targetCategory.toUpperCase()] ?? targetCategory;

    if (chosenRows.length === 0) {
      return {
        scope: "none",
        categoryLabel,
        settledCount: 0,
        hitCount: 0,
        hitRatePct: null,
        recentForm: [],
      };
    }

    const hitCount = chosenRows.filter((r) => r.is_hit).length;
    const recentForm: AiRecentFormItem[] = chosenRows.slice(0, 5).map((r) => ({
      gameId: r.game_id,
      isHit: Boolean(r.is_hit),
      settledAt: r.settled_at,
    }));

    return {
      scope: useCategory ? "category" : "overall",
      categoryLabel: useCategory ? categoryLabel : "전체",
      settledCount: chosenRows.length,
      hitCount,
      hitRatePct: Math.round((hitCount / chosenRows.length) * 100),
      recentForm,
    };
  }

  public async getOrCreateForGameId(
    gameId: string,
    opts?: { timeoutMs?: number }
  ): Promise<AiForecastDTO[]> {
    const game = await this.store.getGameById(gameId);
    if (!game) return [];

    const options = parseOptions(game.game_options);
    if (options.length < 2) return [];

    const existing = await this.store.getForecastsByGameId(gameId);
    const existingKeys = new Set(existing.map((r) => r.provider_key));
    const configured = this.providers.filter((p) => p.isConfigured());
    const isGameActive = String(game.status ?? "").toUpperCase() === "ACTIVE";

    // 시점 공정성: ACTIVE 상태인 게임에 대해서만 미기록·실연동 LLM 예측 스냅샷 생성
    const missingProviders = isGameActive
      ? configured.filter((p) => !existingKeys.has(p.key))
      : [];

    if (missingProviders.length > 0) {
      const { systemPrompt, userPrompt } = buildForecastPrompts(game, options);
      const timeoutMs = opts?.timeoutMs ?? 12000;
      const category = (game.category ?? "GENERAL").toUpperCase();
      const predictionType = (game.prediction_type ?? "BINARY").toUpperCase();

      const results = await Promise.allSettled(
        missingProviders.map(async (provider): Promise<NewDbForecastRow | null> => {
          const payload = await provider.predictJson(
            systemPrompt,
            userPrompt,
            timeoutMs
          );
          const selectedRaw = String(payload?.selectedOptionId ?? "").trim();
          const matchedOption =
            options.find((o) => o.id === selectedRaw) ??
            options.find((o) => o.label === selectedRaw);
          const reasoning = normalizeForecastReasoning(payload?.reasoning);
          if (!matchedOption || reasoning.length < 8) {
            return null;
          }
          return {
            game_id: game.game_id,
            provider_key: provider.key,
            provider_label: provider.label,
            model_name: provider.modelName,
            category,
            prediction_type: predictionType,
            region_code: null,
            selected_option_id: matchedOption.id,
            selected_option_label: matchedOption.label,
            confidence_pct: clampConfidencePct(payload?.confidencePct),
            reasoning,
          };
        })
      );

      const toInsert = results
        .filter(
          (r): r is PromiseFulfilledResult<NewDbForecastRow> =>
            r.status === "fulfilled" && r.value !== null
        )
        .map((r) => r.value);

      if (toInsert.length > 0) {
        await this.store.insertForecasts(toInsert);
      }
    }

    const finalRows =
      missingProviders.length > 0
        ? await this.store.getForecastsByGameId(gameId)
        : existing;

    if (finalRows.length === 0) return [];

    const keys = finalRows.map((r) => r.provider_key as AiProviderKey);
    const history = await this.store.getSettledHistoryByProviders(keys);
    const targetCategory = (game.category ?? "GENERAL").toUpperCase();

    return finalRows.map((row) => ({
      providerKey: row.provider_key as AiProviderKey,
      providerLabel: row.provider_label,
      modelName: row.model_name,
      selectedOptionId: row.selected_option_id,
      selectedOptionLabel: row.selected_option_label,
      confidencePct: row.confidence_pct,
      reasoning: row.reasoning,
      isHit: row.is_hit,
      brierScore: row.brier_score,
      createdAt: row.created_at,
      stats: this.buildProviderStats(
        row.provider_key as AiProviderKey,
        targetCategory,
        history
      ),
    }));
  }
}
