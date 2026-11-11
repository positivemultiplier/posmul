import {
  ExaoneClient,
} from "@/bounded-contexts/feed/infrastructure/adapters/exaone-client";
import {
  GeminiClient,
  LlmProvider,
  resolveLlmOrder,
} from "@/bounded-contexts/feed/infrastructure/adapters/gemini-client";
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
      "[게임 유형: 양자택일(BINARY) — 확증편향 방지 대조 분석]",
      "선택지 목록:",
      optionListText,
      "요구사항:",
      "- scenarios 배열에 위 2개 선택지를 optionId/optionLabel 그대로 각각 작성하세요.",
      "- 각 선택지마다 arguments 배열에 서로 다른 구체적 논거 2개씩 작성하고 triggerCondition(실현 핵심 조건)을 1줄 붙이세요.",
      '- 1번 선택지 tone은 "bull", 2번 선택지 tone은 "bear" 로 설정하세요.',
    ].join("\n");
  }

  if (mode === "WIN_DRAW_LOSE") {
    return [
      "[게임 유형: 3방향 균형(WIN_DRAW_LOSE) — 승무패 / 인상·동결·인하 시나리오 분석]",
      "선택지 목록:",
      optionListText,
      "요구사항:",
      "- scenarios 배열에 위 3개 선택지를 모두 각각 작성하세요 (YES/NO 이분법 금지).",
      '- 1번(홈승/강세) tone은 "bull", 2번(무승부/동결/보합) tone은 "neutral", 3번(원정승/약세) tone은 "bear".',
      "- 특히 2번(무승부·동결) 선택지는 왜 양극단이 아닌 제3의 결말이 나타날 수 있는지 구체적 전개 조건을 반드시 분석하세요.",
      "- 각 선택지 arguments에는 구체적 논거 2개씩 넣고, tailRiskNote에 3방향 구도에서의 핵심 이변 변수를 1줄로 작성하세요.",
    ].join("\n");
  }

  return [
    "[게임 유형: 다구간/랭킹(RANKING) — 분포 및 후보별 비교 매트릭스]",
    "선택지 목록:",
    optionListText,
    "요구사항:",
    `- scenarios 배열에 위 ${options.length}개 선택지를 빠짐없이 모두 각각 작성하세요.`,
    "- 각 선택지마다 stanceTag(예: '중심 유력', '상방 돌파', '하방 이탈', '다크호스')와 coreThesis(해당 구간/후보가 1위·적중할 조건 1~2문장), probabilityCue(예상 성립 조건 요약 1줄)를 작성하세요.",
    "- 각 선택지의 arguments에는 핵심 근거 1~2개를 간결히 담으세요.",
    "- tailRiskNote에 시장이 과소평가하기 쉬운 꼬리위험(Tail Risk)이나 다크호스 변수를 1줄로 작성하세요.",
  ].join("\n");
}

function buildSystemPrompt(mode: BriefingMode, options: BriefingGameOptionInput[]): string {
  return [
    "당신은 한국 예측시장 PosMul의 수석 데이터 애널리스트입니다.",
    "주어진 예측 게임의 제목, 설명, 오라클 정보, 선택지만을 근거로 편향 없는 AI 균형 의사결정 브리핑 JSON을 생성하세요.",
    "",
    "[절대 준수 규칙]",
    "1. 할루시네이션 금지: 존재하지 않는 언론사 기사 제목, 가짜 통계 수치, URL(http/https)을 절대 지어내지 마세요.",
    "2. 주제 일관성: 오직 제공된 게임 주제와 선택지에 관해서만 작성하세요. 타 주제 예시를 섞지 마세요.",
    "3. 사행성 용어 금지: '배팅', '도박', '올인' 대신 '예측 참여', '확률 판단', '시나리오'를 사용하세요.",
    "4. neutralFacts 4대 항목: currentValue(현재 기준선/관전 포인트), historicalContext(유사 패턴/맥락), officialSchedule(마감 및 정산 일정), source(공식 판정 출처)를 간결히 채우세요.",
    "",
    buildModePromptInstructions(mode, options),
    "",
    "반드시 아래 JSON 스키마만 출력하세요:",
    "{",
    '  "neutralFacts": {',
    '    "title": "팩트체크 요약 제목",',
    '    "description": "중립적 핵심 배경 1~2문장",',
    '    "currentValue": "현재 확인된 기준 수치 또는 매치/공시 현황",',
    '    "historicalContext": "과거 추이 또는 상대전적/컨센서스 맥락",',
    '    "officialSchedule": "참여 마감 및 공식 정산 시점",',
    '    "source": "공식 정산 기관/API 명칭"',
    "  },",
    '  "scenarios": [',
    "    {",
    '      "optionId": "위 목록의 optionId",',
    '      "optionLabel": "위 목록의 label",',
    '      "stanceTag": "4~10자 태그",',
    '      "tone": "bull" | "bear" | "neutral" | "darkhorse",',
    '      "coreThesis": "이 선택지가 성립할 핵심 논리 1~2문장",',
    '      "probabilityCue": "성립 트리거 조건 1줄",',
    '      "arguments": [',
    '        { "point": "핵심 포인트 제목", "detail": "구체적 근거 1~2문장", "triggerCondition": "발생 조건" }',
    "      ]",
    "    }",
    "  ],",
    '  "aiInsight": "양쪽·모든 시나리오를 비교한 균형 총평 1~2문장",',
    '  "tailRiskNote": "다크호스/이변/변동성 유의사항 1줄 (해당 시)"',
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
          ? args
          : [
              {
                point: `${opt.label} 성립 조건`,
                detail:
                  opt.description ||
                  `${input.title}의 마감 시점까지 핵심 변수가 ${opt.label} 방향으로 전개되는 경우입니다.`,
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
      `'${opt.label}' 결과가 최종 정산 조건에 부합하는 경우입니다.`,
    arguments: [
      {
        point: `${opt.label} 판단 기준`,
        detail: `${oracleLabel} 기준 최종 결과값이 '${opt.label}' 조건에 해당할 때 선택됩니다.`,
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
      title: `[공식 팩트체크] ${input.title}`,
      description:
        (input.description ?? "").trim() ||
        "공식 정산 일정과 기준 데이터를 확인한 뒤 예측에 참여하세요.",
      currentValue: "게임 상세 설명의 기준선 참고",
      historicalContext: "공식 발표 지표 및 시장 컨센서스 반영",
      officialSchedule: `참여 마감: ${formatKstDateTime(input.registrationEnd)}`,
      source: oracleLabel,
    },
    scenarios,
    aiInsight:
      "각 선택지의 판정 조건과 마감 일정을 확인하고, 한쪽 편향 없이 균형 있게 판단해 보세요.",
  };
}

export class BalancedBriefingService {
  private readonly exaone: ExaoneClient;
  private readonly gemini: GeminiClient;

  constructor(deps?: BalancedBriefingDeps) {
    this.exaone = deps?.exaoneClient ?? new ExaoneClient();
    this.gemini = deps?.geminiClient ?? new GeminiClient();
  }

  private async invokeProvider(
    provider: LlmProvider,
    systemPrompt: string,
    userPrompt: string,
    timeoutMs: number
  ): Promise<RawBriefingResponse> {
    if (provider === "exaone") {
      return this.exaone.generateJson<RawBriefingResponse>(
        systemPrompt,
        userPrompt,
        {
          temperature: 0.25,
          maxTokens: 1800,
          timeoutMs,
        }
      );
    }
    return this.gemini.generateJson<RawBriefingResponse>(
      systemPrompt,
      userPrompt,
      timeoutMs,
      0.25
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
    const providers = resolveLlmOrder(combinedText, this.exaone, this.gemini);
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
}

export const balancedBriefingService = new BalancedBriefingService();

