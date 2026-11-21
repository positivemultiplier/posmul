import {
  ExaoneClient,
} from "@/shared/infrastructure/llm/exaone-client";
import {
  GeminiClient,
  invokeLlmProviderJson,
  LlmProvider,
  resolveLlmOrder,
} from "@/shared/infrastructure/llm/gemini-client";
import { OpenRouterClient } from "@/shared/infrastructure/llm/openrouter-client";
import type {
  BalancedBriefingDTO,
  BriefingMode,
  OptionScenarioBriefing,
  ScenarioArgument,
  ScenarioTone,
} from "@/bounded-contexts/prediction/domain/value-objects/briefing.types";
import { supabaseAdmin } from "@/lib/supabase/admin";

export interface BriefingGameOptionInput {
  id: string;
  label: string;
  description?: string;
}

export interface BriefingGameInput {
  gameId: string;
  title: string;
  description?: string | null;
  category?: string | null;
  predictionType?: string | null;
  dataSource?: string | null;
  options: BriefingGameOptionInput[];
  registrationEnd?: string | null;
  settlementDate?: string | null;
}

export interface GenerateBriefingResult {
  briefing: BalancedBriefingDTO;
  llmGenerated: boolean;
}

interface RawBriefingArgument {
  point?: string;
  detail?: string;
  triggerCondition?: string;
}

interface RawScenarioItem {
  optionId?: string;
  optionLabel?: string;
  stanceTag?: string;
  tone?: string;
  coreThesis?: string;
  probabilityCue?: string;
  arguments?: RawBriefingArgument[];
}

interface RawBriefingResponse {
  neutralFacts?: {
    title?: string;
    description?: string;
    currentValue?: string;
    historicalContext?: string;
    officialSchedule?: string;
    source?: string;
  };
  scenarios?: RawScenarioItem[];
  aiInsight?: string;
  tailRiskNote?: string;
}

export interface BalancedBriefingDeps {
  exaoneClient?: ExaoneClient;
  geminiClient?: GeminiClient;
  openrouterClient?: OpenRouterClient;
}

const DATA_SOURCE_LABELS: Record<string, string> = {
  football_data: "Football-Data.org 공식 매치 데이터",
  fmp: "Financial Modeling Prep (FMP) 실적 공시 API",
  coingecko: "CoinGecko 글로벌 현물 시세 인덱스",
  "alpha-vantage": "AlphaVantage 미국 증시 데이터",
  ecos: "한국은행 경제통계시스템(ECOS)",
  kosis: "통계청 국가통계포털(KOSIS)",
  dart: "금융감독원 전자공시(OpenDART)",
  kobis: "영화진흥위원회 통합전산망(KOBIS)",
  manual: "공식 발표 기관 및 PosMul 검증 오라클",
};

/**
 * 게임 유형(BINARY / WIN_DRAW_LOSE / RANKING) 판별
 */
export function resolveBriefingMode(
  predictionType: string | null | undefined,
  optionCount: number
): BriefingMode {
  const upper = String(predictionType ?? "").toUpperCase();
  if (optionCount >= 4 || upper === "RANKING") return "RANKING";
  if (optionCount === 3 || upper === "WIN_DRAW_LOSE") return "WIN_DRAW_LOSE";
  return "BINARY";
}

function formatKstDateTime(iso?: string | null): string {
  if (!iso) return "게임 마감·정산 일정에 따름";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "게임 마감·정산 일정에 따름";
  return `${new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(d)} (KST)`;
}

function stripUrls(text: string): string {
  return text.replace(/https?:\/\/\S+/gi, "").replace(/\s+/g, " ").trim();
}

function defaultToneForOption(
  mode: BriefingMode,
  idx: number,
  total: number,
  label: string
): ScenarioTone {
  if (mode === "BINARY") {
    return idx === 0 ? "bull" : "bear";
  }
  if (mode === "WIN_DRAW_LOSE") {
    if (idx === 1 || /무승부|동결|보합|draw/i.test(label)) return "neutral";
    return idx === 0 ? "bull" : "bear";
  }
  if (idx === 0 || idx === total - 1) return "darkhorse";
  return "neutral";
}

function normalizeTone(
  raw: string | undefined,
  fallback: ScenarioTone
): ScenarioTone {
  const lower = String(raw ?? "").toLowerCase();
  if (
    lower === "bull" ||
    lower === "bear" ||
    lower === "neutral" ||
    lower === "darkhorse"
  ) {
    return lower;
  }
  return fallback;
}

function parseRawOptions(gameOptionsField: unknown): BriefingGameOptionInput[] {
  if (!gameOptionsField || typeof gameOptionsField !== "object") return [];
  const maybeOptions = (gameOptionsField as { options?: unknown }).options;
  if (!Array.isArray(maybeOptions)) return [];

  return maybeOptions
    .map((item, idx) => {
      if (typeof item === "string") {
        return { id: `opt_${idx + 1}`, label: item };
      }
      if (item && typeof item === "object") {
        const obj = item as { id?: unknown; label?: unknown; text?: unknown; description?: unknown };
        const label = String(obj.label ?? obj.text ?? obj.id ?? `선택지 ${idx + 1}`).trim();
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

function buildModePromptInstructions(
  mode: BriefingMode,
  options: BriefingGameOptionInput[]
): string {
  const optionListText = options
    .map((o, i) => `${i + 1}. optionId="${o.id}" | label="${o.label}"${o.description ? ` (${o.description})` : ""}`)
    .join("\n");

  if (mode === "BINARY") {
    return [
      "[게임 유형: 양자택일(BINARY) — 좌우 VS 맞대결 비교]",
      "선택지 목록:",
      optionListText,
      "요구사항:",
      "- scenarios 배열에 위 2개 선택지를 optionId/optionLabel 그대로 각각 작성하세요.",
      "- 각 선택지 coreThesis는 35~55자 이내의 직관적인 두괄식 1문장으로 작성하세요.",
      "- 각 선택지 arguments에는 서로 다른 핵심 논거를 정확히 2개씩만 작성하세요 (point: 8~18자 짧은 제목, detail: 40~70자 쉬운 1문장).",
      '- 1번 선택지 tone은 "bull", 2번 선택지 tone은 "bear" 로 설정하세요.',
    ].join("\n");
  }

  if (mode === "WIN_DRAW_LOSE") {
    return [
      "[게임 유형: 3방향 시나리오(WIN_DRAW_LOSE) — 승무패 / 인상·동결·인하]",
      "선택지 목록:",
      optionListText,
      "요구사항:",
      "- scenarios 배열에 위 3개 선택지를 모두 각각 작성하세요 (YES/NO 이분법 금지).",
      '- 1번(홈승/강세) tone은 "bull", 2번(무승부/동결/보합) tone은 "neutral", 3번(원정승/약세) tone은 "bear".',
      "- 각 선택지 coreThesis는 35~55자 이내의 명확한 1문장으로 작성하세요. 특히 2번(무승부·동결)은 제3의 결말이 나오는 핵심 조건을 짚으세요.",
      "- 각 선택지 arguments에는 핵심 논거 2개씩만 간결히 담으세요 (point: 8~18자, detail: 40~70자 1문장).",
      "- tailRiskNote에 3방향 구도의 핵심 이변 변수를 1문장(45~65자)으로 작성하세요.",
    ].join("\n");
  }

  return [
    "[게임 유형: 다자/랭킹(RANKING) — 후보별 핵심 시나리오]",
    "선택지 목록:",
    optionListText,
    "요구사항:",
    `- scenarios 배열에 위 ${options.length}개 선택지를 빠짐없이 모두 각각 작성하세요.`,
    "- 각 선택지마다 stanceTag(4~8자)와 coreThesis(해당 후보/구간이 1위·적중할 핵심 조건 35~55자 1문장)를 작성하세요.",
    "- 각 선택지 arguments에는 핵심 근거 2개 이내를 간결히 담으세요 (point: 8~18자, detail: 40~70자 1문장).",
    "- tailRiskNote에 시장이 놓치기 쉬운 다크호스·이변 변수를 1문장(45~65자)으로 작성하세요.",
  ].join("\n");
}

function buildSystemPrompt(mode: BriefingMode, options: BriefingGameOptionInput[]): string {
  return [
    "당신은 한국 예측시장 PosMul의 수석 데이터 애널리스트입니다.",
    "시민이 15초 안에 양측·후보별 논거를 한눈에 비교하고 의사결정할 수 있도록 짧고 날카로운 AI 균형 브리핑 JSON을 생성하세요.",
    "",
    "[절대 준수 규칙]",
    "1. 할루시네이션 금지: 존재하지 않는 기사 제목, 가짜 통계 수치, URL(http/https)을 절대 지어내지 마세요.",
    "2. 가독성·간결성 최우선: 보고서식 장문·미사여구를 빼고, 누구나 바로 이해하는 쉬운 한국어 단문(1문장)으로 핵심만 쓰세요.",
    "3. 주제 일관성: 오직 제공된 게임 주제와 선택지에 관해서만 작성하세요.",
    "4. 사행성 용어 금지: '배팅', '도박', '올인' 대신 '예측 참여', '확률 판단', '시나리오'를 사용하세요.",
    "5. neutralFacts는 스키마 호환용으로 각 항목을 1줄 이내로 짧게 채우세요.",
    "",
    buildModePromptInstructions(mode, options),
    "",
    "반드시 아래 JSON 스키마만 출력하세요:",
    "{",
    '  "neutralFacts": {',
    '    "title": "주제 1줄 요약",',
    '    "description": "배경 1문장",',
    '    "currentValue": "현재 기준선 1줄",',
    '    "historicalContext": "직전 추이 1줄",',
    '    "officialSchedule": "마감·정산 시점 1줄",',
    '    "source": "공식 정산 출처명"',
    "  },",
    '  "scenarios": [',
    "    {",
    '      "optionId": "위 목록의 optionId",',
    '      "optionLabel": "위 목록의 label",',
    '      "stanceTag": "4~8자 태그",',
    '      "tone": "bull" | "bear" | "neutral" | "darkhorse",',
    '      "coreThesis": "핵심 주장 1문장 (35~55자)",',
    '      "probabilityCue": "성립 트리거 1줄 (선택)",',
    '      "arguments": [',
    '        { "point": "핵심 키워드 제목 (8~18자)", "detail": "쉬운 근거 1문장 (40~70자)" }',
    "      ]",
    "    }",
    "  ],",
    '  "aiInsight": "승부를 가를 단 하나의 핵심 변수 1문장 (45~75자)",',
    '  "tailRiskNote": "다크호스/이변 변수 1문장 (40~65자, 해당 시)"',
    "}",
  ].join("\n");
}

function buildUserPrompt(input: BriefingGameInput): string {
  const oracleLabel =
    (input.dataSource && DATA_SOURCE_LABELS[input.dataSource]) ||
    input.dataSource ||
    "공식 발표 및 검증 오라클";

  return [
    `게임 제목: ${input.title}`,
    `카테고리: ${input.category ?? "GENERAL"}`,
    `판정 오라클 출처: ${oracleLabel}`,
    `참여 마감: ${formatKstDateTime(input.registrationEnd)}`,
    `정산 예정: ${formatKstDateTime(input.settlementDate)}`,
    `게임 설명:\n${(input.description ?? "").trim() || "(설명 없음)"}`,
  ].join("\n");
}

function matchRawScenario(
  rawList: RawScenarioItem[],
  opt: BriefingGameOptionInput,
  index: number
): RawScenarioItem | undefined {
  return (
    rawList.find((s) => s.optionId && String(s.optionId).trim() === opt.id) ??
    rawList.find(
      (s) => s.optionLabel && String(s.optionLabel).trim() === opt.label
    ) ??
    rawList[index]
  );
}

function normalizeAndValidateBriefing(
  raw: RawBriefingResponse,
  input: BriefingGameInput,
  mode: BriefingMode,
  providerBadge: string
): BalancedBriefingDTO | null {
  if (!raw || !Array.isArray(raw.scenarios) || raw.scenarios.length === 0) {
    return null;
  }

  const scenarios: OptionScenarioBriefing[] = input.options.map((opt, idx) => {
    const matched = matchRawScenario(raw.scenarios!, opt, idx);
    const fallbackTone = defaultToneForOption(mode, idx, input.options.length, opt.label);

    const args: ScenarioArgument[] = Array.isArray(matched?.arguments)
      ? matched.arguments
          .map((a) => ({
            point: stripUrls(String(a?.point ?? "")),
            detail: stripUrls(String(a?.detail ?? "")),
            triggerCondition: a?.triggerCondition
              ? stripUrls(String(a.triggerCondition))
              : undefined,
          }))
          .filter((a) => a.point.length >= 2 && a.detail.length >= 8)
      : [];

    const coreThesis = stripUrls(String(matched?.coreThesis ?? ""));
    const defaultStance =
      mode === "BINARY"
        ? idx === 0
          ? "찬성·달성 시각"
          : "반대·리스크 시각"
        : mode === "WIN_DRAW_LOSE"
        ? idx === 1
          ? "균형·제3 변수"
          : "승부 시나리오"
        : idx === 0 || idx === input.options.length - 1
        ? "외곽 구간·다크호스"
        : "핵심 경합 구간";

    return {
      optionId: opt.id,
      optionLabel: opt.label,
      stanceTag: stripUrls(String(matched?.stanceTag ?? "")) || defaultStance,
      tone: normalizeTone(matched?.tone, fallbackTone),
      coreThesis:
        coreThesis ||
        `${opt.label} 시나리오가 실현될 경우의 핵심 전개 조건을 점검합니다.`,
      probabilityCue: matched?.probabilityCue
        ? stripUrls(String(matched.probabilityCue))
        : undefined,
      arguments:
        args.length > 0
          ? args.slice(0, 2)
          : [
              {
                point: `${opt.label} 성립 조건`,
                detail:
                  opt.description ||
                  `마감 시점까지 핵심 변수가 '${opt.label}' 방향으로 전개될 때 성립합니다.`,
              },
            ],
    };
  });

  // LLM이 최소 한 문장 이상의 유효한 논거를 생성했는지 검사
  const validScenarioCount = scenarios.filter(
    (s) => s.coreThesis.length >= 10 && s.arguments.length >= 1
  ).length;
  if (validScenarioCount < Math.min(2, input.options.length)) {
    return null;
  }

  const aiInsight = stripUrls(String(raw.aiInsight ?? ""));
  if (aiInsight.length < 15) {
    return null;
  }

  const oracleLabel =
    (input.dataSource && DATA_SOURCE_LABELS[input.dataSource]) ||
    input.dataSource ||
    "PosMul 검증 오라클";

  return {
    version: 2,
    gameId: input.gameId,
    mode,
    topic: input.title,
    providerBadge,
    generatedAt: new Date().toISOString(),
    neutralFacts: {
      title:
        stripUrls(String(raw.neutralFacts?.title ?? "")) ||
        `[중립 팩트] ${input.title}`,
      description:
        stripUrls(String(raw.neutralFacts?.description ?? "")) ||
        stripUrls(input.description ?? "") ||
        "마감 시점 공식 데이터 발표 기준에 따라 정산되는 예측 게임입니다.",
      currentValue:
        stripUrls(String(raw.neutralFacts?.currentValue ?? "")) ||
        "기준 데이터 실시간 추적 중",
      historicalContext:
        stripUrls(String(raw.neutralFacts?.historicalContext ?? "")) ||
        "유사 지표·이전 라운드 변동 추이 참고",
      officialSchedule:
        stripUrls(String(raw.neutralFacts?.officialSchedule ?? "")) ||
        `마감: ${formatKstDateTime(input.registrationEnd)}`,
      source:
        stripUrls(String(raw.neutralFacts?.source ?? "")) || oracleLabel,
    },
    scenarios,
    aiInsight,
    tailRiskNote: raw.tailRiskNote
      ? stripUrls(String(raw.tailRiskNote))
      : undefined,
  };
}

/**
 * LLM 장애 시에도 타 주제 예제('실업률 3.0%' 등)가 나오지 않도록 해당 게임 팩트만으로 조립하는 안전 폴백
 */
export function buildDeterministicFallbackBriefing(
  input: BriefingGameInput,
  mode: BriefingMode
): BalancedBriefingDTO {
  const oracleLabel =
    (input.dataSource && DATA_SOURCE_LABELS[input.dataSource]) ||
    input.dataSource ||
    "공식 발표 오라클";

  const scenarios: OptionScenarioBriefing[] = input.options.map((opt, idx) => ({
    optionId: opt.id,
    optionLabel: opt.label,
    stanceTag:
      mode === "WIN_DRAW_LOSE" && idx === 1
        ? "균형 시나리오"
        : mode === "RANKING"
        ? "후보 구간"
        : idx === 0
        ? "시나리오 A"
        : "시나리오 B",
    tone: defaultToneForOption(mode, idx, input.options.length, opt.label),
    coreThesis:
      opt.description ||
      `'${opt.label}' 쪽으로 흐름이 기울 때 성립하는 시나리오입니다.`,
    arguments: [
      {
        point: `${opt.label} 핵심 기준`,
        detail: `${oracleLabel} 최종 결과가 '${opt.label}' 조건을 충족하면 적중합니다.`,
      },
    ],
  }));

  return {
    version: 2,
    gameId: input.gameId,
    mode,
    topic: input.title,
    providerBadge: "기본 구조화 요약 (AI 상세 분석 대기)",
    generatedAt: new Date().toISOString(),
    neutralFacts: {
      title: input.title,
      description:
        (input.description ?? "").trim() ||
        "공식 정산 기준에 따라 결과가 판정됩니다.",
      currentValue: "실시간 참여 추이 참고",
      historicalContext: "공식 발표 지표 및 시장 흐름 반영",
      officialSchedule: `참여 마감: ${formatKstDateTime(input.registrationEnd)}`,
      source: oracleLabel,
    },
    scenarios,
    aiInsight:
      "각 선택지의 핵심 조건과 마감 직전 흐름을 비교해 균형 있게 판단해 보세요.",
  };
}

export class BalancedBriefingService {
  private readonly exaone: ExaoneClient;
  private readonly gemini: GeminiClient;
  private readonly openrouter: OpenRouterClient;

  constructor(deps?: BalancedBriefingDeps) {
    this.exaone = deps?.exaoneClient ?? new ExaoneClient();
    this.gemini = deps?.geminiClient ?? new GeminiClient();
    this.openrouter = deps?.openrouterClient ?? new OpenRouterClient();
  }

  private async invokeProvider(
    provider: LlmProvider,
    systemPrompt: string,
    userPrompt: string,
    timeoutMs: number
  ): Promise<RawBriefingResponse> {
    return invokeLlmProviderJson<RawBriefingResponse>(
      provider,
      {
        exaone: this.exaone,
        gemini: this.gemini,
        openrouter: this.openrouter,
      },
      systemPrompt,
      userPrompt,
      {
        temperature: 0.25,
        exaoneMaxTokens: 1800,
        openrouterMaxTokens: 3200,
        timeoutMs,
      }
    );
  }

  /**
   * 게임 유형(BINARY / WIN_DRAW_LOSE / RANKING)에 맞는 AI 균형 브리핑 생성
   */
  public async generateForGame(
    input: BriefingGameInput,
    options?: { timeoutMs?: number }
  ): Promise<GenerateBriefingResult> {
    const mode = resolveBriefingMode(input.predictionType, input.options.length);
    if (input.options.length < 2) {
      return {
        briefing: buildDeterministicFallbackBriefing(input, mode),
        llmGenerated: false,
      };
    }

    const combinedText = `${input.title}\n${input.description ?? ""}`;
    const providers = resolveLlmOrder(
      combinedText,
      this.exaone,
      this.gemini,
      this.openrouter
    );
    if (providers.length === 0) {
      return {
        briefing: buildDeterministicFallbackBriefing(input, mode),
        llmGenerated: false,
      };
    }

    const systemPrompt = buildSystemPrompt(mode, input.options);
    const userPrompt = buildUserPrompt(input);
    const timeoutMs = options?.timeoutMs ?? 20000;

    for (const provider of providers) {
      try {
        const raw = await this.invokeProvider(
          provider,
          systemPrompt,
          userPrompt,
          timeoutMs
        );
        const providerBadge =
          provider === "exaone"
            ? `LG EXAONE (${this.exaone.getModelName()}) 분석`
            : provider === "openrouter"
            ? `OpenRouter ERNIE (${this.openrouter.getModelName()}) 분석`
            : `Google Gemini (${this.gemini.getPrimaryModelName()}) 분석`;

        const normalized = normalizeAndValidateBriefing(
          raw,
          input,
          mode,
          providerBadge
        );
        if (normalized) {
          return { briefing: normalized, llmGenerated: true };
        }
      } catch (err) {
        console.warn(
          `[BalancedBriefing] ${provider} failed for game ${input.gameId}:`,
          err instanceof Error ? err.message : String(err)
        );
      }
    }

    return {
      briefing: buildDeterministicFallbackBriefing(input, mode),
      llmGenerated: false,
    };
  }

  /**
   * DB 게임의 metadata.briefing 조회 -> 미존재·구버전이면 1회 생성 후 DB 영구 캐싱
   */
  public async getOrCreateForGameId(
    gameId: string,
    options?: { timeoutMs?: number }
  ): Promise<BalancedBriefingDTO | null> {
    const { data: game, error } = await supabaseAdmin
      .schema("prediction")
      .from("prediction_games")
      .select(
        "game_id, title, description, category, prediction_type, data_source, game_options, registration_end, settlement_date, metadata"
      )
      .eq("game_id", gameId)
      .maybeSingle();

    if (error || !game) return null;

    const row = game as {
      game_id: string;
      title: string;
      description: string | null;
      category: string | null;
      prediction_type: string | null;
      data_source: string | null;
      game_options: unknown;
      registration_end: string | null;
      settlement_date: string | null;
      metadata: Record<string, unknown> | null;
    };

    const parsedOptions = parseRawOptions(row.game_options);
    const expectedMode = resolveBriefingMode(
      row.prediction_type,
      parsedOptions.length
    );

    const existingBriefing = row.metadata?.briefing as
      | Partial<BalancedBriefingDTO>
      | undefined;

    if (
      existingBriefing &&
      existingBriefing.version === 2 &&
      existingBriefing.mode === expectedMode &&
      Array.isArray(existingBriefing.scenarios) &&
      existingBriefing.scenarios.length === parsedOptions.length
    ) {
      return existingBriefing as BalancedBriefingDTO;
    }

    const result = await this.generateForGame(
      {
        gameId: row.game_id,
        title: row.title,
        description: row.description,
        category: row.category,
        predictionType: row.prediction_type,
        dataSource: row.data_source,
        options: parsedOptions,
        registrationEnd: row.registration_end,
        settlementDate: row.settlement_date,
      },
      options
    );

    if (result.llmGenerated) {
      const nextMetadata = {
        ...(row.metadata ?? {}),
        briefing: result.briefing,
      };
      await supabaseAdmin
        .schema("prediction")
        .from("prediction_games")
        .update({ metadata: nextMetadata } as any)
        .eq("game_id", row.game_id);
    }

    return result.briefing;
  }

  /**
   * ACTIVE 게임 중 metadata.briefing(v2)이 누락된 건을 소규모 배치로 보강 (자가치유)
   */
  public async backfillMissingActiveBriefings(options?: {
    limit?: number;
    batchSize?: number;
    delayMs?: number;
    timeoutMs?: number;
  }): Promise<{ checked: number; backfilled: number; failed: number }> {
    const limit = options?.limit ?? 15;
    const batchSize = Math.max(1, options?.batchSize ?? 2);
    const delayMs = Math.max(0, options?.delayMs ?? 1200);
    const timeoutMs = options?.timeoutMs ?? 16000;

    const { data, error } = await supabaseAdmin
      .schema("prediction")
      .from("prediction_games")
      .select("game_id, prediction_type, game_options, metadata")
      .eq("status", "ACTIVE")
      .order("created_at", { ascending: false })
      .limit(50);

    if (error || !data) {
      return { checked: 0, backfilled: 0, failed: 0 };
    }

    const targets = (
      data as Array<{
        game_id: string;
        prediction_type: string | null;
        game_options: unknown;
        metadata: Record<string, unknown> | null;
      }>
    )
      .filter((row) => {
        const parsedOptions = parseRawOptions(row.game_options);
        const expectedMode = resolveBriefingMode(
          row.prediction_type,
          parsedOptions.length
        );
        const existing = row.metadata?.briefing as
          | Partial<BalancedBriefingDTO>
          | undefined;
        return !(
          existing &&
          existing.version === 2 &&
          existing.mode === expectedMode &&
          Array.isArray(existing.scenarios) &&
          existing.scenarios.length === parsedOptions.length
        );
      })
      .slice(0, limit);

    let backfilled = 0;
    let failed = 0;
    const sleep = (ms: number) =>
      new Promise<void>((resolve) => setTimeout(resolve, ms));

    for (let i = 0; i < targets.length; i += batchSize) {
      if (i > 0 && delayMs > 0) {
        await sleep(delayMs);
      }
      const batch = targets.slice(i, i + batchSize);
      const settled = await Promise.allSettled(
        batch.map((t) => this.getOrCreateForGameId(t.game_id, { timeoutMs }))
      );
      for (const res of settled) {
        if (
          res.status === "fulfilled" &&
          res.value &&
          !res.value.providerBadge.includes("대기")
        ) {
          backfilled += 1;
        } else {
          failed += 1;
        }
      }
    }

    return { checked: targets.length, backfilled, failed };
  }
}

export const balancedBriefingService = new BalancedBriefingService();

