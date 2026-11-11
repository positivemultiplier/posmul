import { failure, Result, success } from "@posmul/auth-economy-sdk";

import {
  ClassificationResult,
  DraftResult,
  ILlmClassifierService,
} from "../../domain/services/llm-classifier.service";
import { ContentClassification } from "../../domain/value-objects/feed-types";
import { validateGeneratedDraft } from "./draft-quality-gate";
import { ExaoneClient, extractJsonFromText } from "./exaone-client";

export type LlmProvider = "exaone" | "gemini";

export interface StructuredBlueprint {
  title: string;
  summary: string;
  keywords?: string[];
  category?: string;
  subcategory?: string;
  predictionType: "BINARY" | "WIN_DRAW_LOSE" | "RANKING";
  options: string[];
  resolutionCriteria: string;
  closingHoursFromNow?: number;
  settlementDelayHours?: number;
  oracleType?: string;
  oracleConfig?: Record<string, unknown>;
  baselineFact?: string;
}

export const BLUEPRINT_START_TAG = "[POSMUL_BLUEPRINT]";
export const BLUEPRINT_END_TAG = "[/POSMUL_BLUEPRINT]";

export function serializeBlueprint(blueprint: StructuredBlueprint): string {
  return `${BLUEPRINT_START_TAG}${JSON.stringify(blueprint)}${BLUEPRINT_END_TAG}`;
}

export function extractBlueprint(content: string): StructuredBlueprint | null {
  const start = content.indexOf(BLUEPRINT_START_TAG);
  const end = content.indexOf(BLUEPRINT_END_TAG);
  if (start === -1 || end === -1 || end <= start) {
    return null;
  }
  const raw = content.slice(start + BLUEPRINT_START_TAG.length, end).trim();
  try {
    const parsed = JSON.parse(raw) as Partial<StructuredBlueprint>;
    if (
      typeof parsed.title === "string" &&
      typeof parsed.summary === "string" &&
      Array.isArray(parsed.options) &&
      parsed.options.length >= 2 &&
      typeof parsed.resolutionCriteria === "string"
    ) {
      const predType =
        parsed.predictionType === "WIN_DRAW_LOSE"
          ? "WIN_DRAW_LOSE"
          : parsed.predictionType === "RANKING"
          ? "RANKING"
          : "BINARY";
      return {
        title: parsed.title,
        summary: parsed.summary,
        keywords: Array.isArray(parsed.keywords)
          ? parsed.keywords.map((k) => String(k))
          : [],
        category: parsed.category,
        subcategory: parsed.subcategory,
        predictionType: predType,
        options: parsed.options.map((o) => String(o)),
        resolutionCriteria: parsed.resolutionCriteria,
        closingHoursFromNow: parsed.closingHoursFromNow,
        settlementDelayHours: parsed.settlementDelayHours,
        oracleType: parsed.oracleType,
        oracleConfig: parsed.oracleConfig,
        baselineFact: parsed.baselineFact,
      };
    }
  } catch {
    return null;
  }
  return null;
}

interface RawClassificationResponse {
  classification?: string;
  reasoning?: string;
  confidence?: number;
}

interface RawPredictionDraftJson {
  title?: string;
  summary?: string;
  keywords?: unknown[];
  category?: string;
  subcategory?: string;
  predictionType?: string;
  options?: unknown[];
  resolutionCriteria?: string;
  closingHoursFromNow?: number;
  settlementDelayHours?: number;
}

interface RawForumDraftJson {
  title?: string;
  summary?: string;
  keywords?: unknown[];
  discussionPoints?: unknown[];
}

export interface MultiLlmDeps {
  exaoneClient?: ExaoneClient;
  geminiApiKey?: string;
  geminiModels?: string[];
  geminiCaller?: (
    systemPrompt: string,
    userPrompt: string,
    timeoutMs?: number
  ) => Promise<string>;
}

const DEFAULT_GEMINI_MODELS = ["gemini-3.8-flash", "gemini-flash-latest"];

const ALLOWED_CATEGORIES = new Set([
  "SPORTS",
  "ECONOMY",
  "INVEST",
  "ENTERTAINMENT",
  "POLITICS",
  "USER_PROPOSED",
]);

/**
 * LG AI EXAONE + Google Gemini 멀티-LLM 예측 게임 생성 및 분류 어댑터
 * - 국내/한국어 콘텐츠: LG EXAONE 우선 -> Gemini 자동 폴백
 * - 글로벌/영문 콘텐츠: Gemini 우선 -> LG EXAONE 자동 폴백
 * - 랜덤 하드코딩 짬뽕 폴백 완전 제거, 품질 게이트 통과 초안만 채택
 */
export class GeminiClassifierAdapter implements ILlmClassifierService {
  private readonly exaone: ExaoneClient;
  private readonly geminiApiKey: string;
  private readonly geminiModels: string[];
  private readonly customGeminiCaller?: MultiLlmDeps["geminiCaller"];

  constructor(deps?: MultiLlmDeps) {
    this.exaone = deps?.exaoneClient ?? new ExaoneClient();
    this.geminiApiKey = (
      deps?.geminiApiKey ??
      process.env.GOOGLE_GEMINI_API_KEY ??
      process.env.GEMINI_API_KEY ??
      ""
    ).trim();
    this.geminiModels = deps?.geminiModels ?? DEFAULT_GEMINI_MODELS;
    this.customGeminiCaller = deps?.geminiCaller;
  }

  private hasGemini(): boolean {
    return Boolean(this.customGeminiCaller) || this.geminiApiKey.length > 0;
  }

  /**
   * 콘텐츠 언어·도메인에 따라 1순위/2순위 LLM 순서 결정
   */
  public resolveProviderOrder(content: string): LlmProvider[] {
    const cleanText = content
      .replace(/\[POSMUL_BLUEPRINT\][\s\S]*?\[\/POSMUL_BLUEPRINT\]/g, "")
      .trim();
    const koreanMatches = cleanText.match(/[가-힣]/g) ?? [];
    const koreanRatio =
      cleanText.length > 0 ? koreanMatches.length / cleanText.length : 0;
    const isKoreanContext =
      koreanRatio >= 0.08 ||
      /국회|한국|코스피|코스닥|원\/달러|금융통화위원회|통계청|멜론|케이팝|법안/.test(
        cleanText
      );

    const preferred: LlmProvider[] = isKoreanContext
      ? ["exaone", "gemini"]
      : ["gemini", "exaone"];

    return preferred.filter((provider) =>
      provider === "exaone" ? this.exaone.isConfigured() : this.hasGemini()
    );
  }

  private async callGeminiJson<T>(
    systemPrompt: string,
    userPrompt: string,
    timeoutMs = 22000
  ): Promise<T> {
    if (this.customGeminiCaller) {
      const text = await this.customGeminiCaller(
        systemPrompt,
        userPrompt,
        timeoutMs
      );
      return extractJsonFromText<T>(text);
    }

    if (!this.geminiApiKey) {
      throw new Error("GOOGLE_GEMINI_API_KEY is not configured");
    }

    let lastError: Error | null = null;
    for (const model of this.geminiModels) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(
          this.geminiApiKey
        )}`;
        const response = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: systemPrompt }] },
            contents: [{ role: "user", parts: [{ text: userPrompt }] }],
            generationConfig: {
              temperature: 0.25,
              maxOutputTokens: 1600,
              responseMimeType: "application/json",
            },
          }),
          signal: controller.signal,
        });

        if (!response.ok) {
          const errText = await response.text().catch(() => "");
          lastError = new Error(
            `Gemini(${model}) error ${response.status}: ${errText.slice(0, 200)}`
          );
          continue;
        }

        const payload = (await response.json()) as {
          candidates?: Array<{
            content?: { parts?: Array<{ text?: string }> };
          }>;
        };
        const rawText =
          payload.candidates?.[0]?.content?.parts
            ?.map((p) => p.text ?? "")
            .join("")
            .trim() ?? "";

        if (!rawText) {
          lastError = new Error(`Gemini(${model}) returned empty text`);
          continue;
        }

        return extractJsonFromText<T>(rawText);
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
      } finally {
        clearTimeout(timer);
      }
    }

    throw lastError ?? new Error("All Gemini models failed");
  }

  private async invokeProviderJson<T>(
    provider: LlmProvider,
    systemPrompt: string,
    userPrompt: string
  ): Promise<T> {
    if (provider === "exaone") {
      return this.exaone.generateJson<T>(systemPrompt, userPrompt, {
        temperature: 0.25,
        maxTokens: 1800,
        timeoutMs: 25000,
      });
    }
    return this.callGeminiJson<T>(systemPrompt, userPrompt, 22000);
  }

  public async classify(content: string): Promise<Result<ClassificationResult>> {
    if (extractBlueprint(content)) {
      return success({
        classification: ContentClassification.PREDICTION,
        reasoning: "구조화 블루프린트(실측 데이터 기반) 자동 확정",
        confidence: 0.98,
      });
    }

    const providers = this.resolveProviderOrder(content);
    if (providers.length === 0) {
      return failure(
        new Error("No LLM provider configured (EXAONE_API_KEY / GOOGLE_GEMINI_API_KEY)")
      );
    }

    const systemPrompt = [
      "당신은 한국 예측시장(Prediction Market) 플랫폼 PosMul의 수석 에디터입니다.",
      "주어진 뉴스·데이터가 미래 시점에 객관적 출처로 정산 가능한 예측 게임(PREDICTION)감인지 판별하세요.",
      "엄격한 기준:",
      "1) PREDICTION: 미래 특정 시점(1일~30일 내)에 공식 수치/결과(금리, 주가, 환율, 코인, 경기 승패, 박스오피스, 법안 표결, 실적 발표 등)로 정산 가능하고 찬반/다지선다가 팽팽할 이슈.",
      "2) FORUM: 가치 판단·논쟁 중심 칼럼이나 정책 토론 주제(정량적 정산 불가).",
      "3) UNCLASSIFIED: 이미 종료된 사건 요약, 단순 사건사고·부고·가십·단순 홍보성 기사.",
      '반드시 JSON만 출력: { "classification": "PREDICTION" | "FORUM" | "UNCLASSIFIED", "reasoning": "한국어 1줄 사유", "confidence": 0.0~1.0 }',
    ].join("\n");

    const userPrompt = `콘텐츠:\n"""\n${content.slice(0, 1800)}\n"""`;

    let lastErr: Error | null = null;
    for (const provider of providers) {
      try {
        const res = await this.invokeProviderJson<RawClassificationResponse>(
          provider,
          systemPrompt,
          userPrompt
        );
        const clsRaw = String(res.classification ?? "").toUpperCase();
        const classification =
          clsRaw === "PREDICTION"
            ? ContentClassification.PREDICTION
            : clsRaw === "FORUM"
            ? ContentClassification.FORUM
            : ContentClassification.UNCLASSIFIED;

        const providerTag =
          provider === "exaone"
            ? `LG EXAONE (${this.exaone.getModelName()})`
            : "Google Gemini";

        return success({
          classification,
          reasoning: `[${providerTag}] ${res.reasoning ?? "분류 완료"}`,
          confidence:
            typeof res.confidence === "number"
              ? Math.max(0, Math.min(1, res.confidence))
              : 0.85,
        });
      } catch (err) {
        lastErr = err instanceof Error ? err : new Error(String(err));
        console.warn(`[MultiLLM classify] ${provider} failed:`, lastErr.message);
      }
    }

    return failure(
      lastErr ?? new Error("All LLM providers failed during classification")
    );
  }

  public async generateDraft(
    content: string,
    classification: ContentClassification
  ): Promise<Result<DraftResult>> {
    if (
      classification === ContentClassification.UNCLASSIFIED ||
      classification === ContentClassification.DISCARD
    ) {
      return failure(new Error(`Skipped non-draftable classification: ${classification}`));
    }

    const blueprint = extractBlueprint(content);
    if (blueprint && classification === ContentClassification.PREDICTION) {
      const enriched = await this.enrichBlueprintDraft(blueprint, content);
      return success(enriched);
    }

    const providers = this.resolveProviderOrder(content);
    if (providers.length === 0) {
      return failure(
        new Error("No LLM provider configured (EXAONE_API_KEY / GOOGLE_GEMINI_API_KEY)")
      );
    }

    if (classification === ContentClassification.FORUM) {
      return this.generateForumDraft(content, providers);
    }

    const systemPrompt = [
      "당신은 Kalshi·Polymarket 수준의 한국어 예측 게임(Prediction Market) 설계 전문가입니다.",
      "주어진 원문만을 근거로 참여자가 몰입할 수 있는 고품질 예측 게임 JSON 1개를 생성하세요.",
      "",
      "[절대 준수 규칙]",
      "1. 구체성: 원문에 있는 실제 기업명, 팀명, 인물명, 종목, 수치, 법안명을 반드시 사용하세요.",
      "   '홈팀 승리', '원정팀 승리', '메이저 걸그룹', '국내 대작', '주요 맞대결', '작품군' 같은 추상적 대명사는 절대 금지입니다.",
      "2. 팽팽한 라인 설계: 99% 한쪽으로 기운 뻔한 질문 금지. 찬반이 50:50에 가깝게 갈릴 기준값 또는 3~4개 구간 옵션을 만드세요.",
      "3. 원문 일관성: 원문 주제에서 벗어나 다른 도메인 내용을 지어내지 마세요.",
      "4. summary는 반드시 아래 4줄 브리핑(한글)으로 작성하세요:",
      "🎯 기준선: <현재 수치 또는 원문의 핵심 팩트 1줄>",
      "📈 상승·찬성 측 논거: <핵심 근거 1줄>",
      "📉 하락·반대 측 논거: <핵심 리스크 또는 반론 1줄>",
      "⚖️ 판정 기준: <종료 시점 및 공식 정산 출처 1줄>",
      "5. 사행성 표현('배팅', '도박', '베팅금') 금지. 대신 '예측 참여', '지분', '보상'을 사용하세요.",
      "",
      "출력 JSON 스키마:",
      "{",
      '  "title": "[카테고리] 구체적인 예측 질문 (~할까? 또는 ~결과는?)",',
      '  "summary": "위 4줄 브리핑 형식",',
      '  "keywords": ["키워드1", "키워드2", "키워드3"],',
      '  "category": "SPORTS" | "ECONOMY" | "INVEST" | "ENTERTAINMENT" | "POLITICS",',
      '  "subcategory": "소분류 영문 (예: crypto, stocks, indicators, soccer, baseball, movie, drama, music, legislation)",',
      '  "predictionType": "BINARY" | "WIN_DRAW_LOSE" | "RANKING",',
      '  "options": ["구체적 선택지1", "구체적 선택지2"],',
      '  "resolutionCriteria": "정산 시점 및 공식 확인 출처",',
      '  "closingHoursFromNow": 24~336 사이 정수,',
      '  "settlementDelayHours": 6~48 사이 정수',
      "}",
    ].join("\n");

    const cleanContent = content.replace(/\s+/g, " ").trim().slice(0, 2200);
    const userPrompt = `원문 콘텐츠:\n"""\n${cleanContent}\n"""`;

    let lastError: Error | null = null;
    for (const provider of providers) {
      try {
        const raw = await this.invokeProviderJson<RawPredictionDraftJson>(
          provider,
          systemPrompt,
          userPrompt
        );
        const normalized = this.normalizePredictionDraft(raw);
        const gate = validateGeneratedDraft(cleanContent, normalized);
        if (!gate.ok) {
          lastError = new Error(
            `Quality gate rejected (${provider}): ${gate.reason}`
          );
          console.warn(`[MultiLLM draft] ${lastError.message}`);
          continue;
        }

        console.info(
          `[MultiLLM draft] Generated via ${provider.toUpperCase()}: ${normalized.title}`
        );
        return success(normalized);
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        console.warn(`[MultiLLM draft] ${provider} error:`, lastError.message);
      }
    }

    return failure(
      lastError ?? new Error("Failed to generate valid prediction draft from all LLMs")
    );
  }

  private async generateForumDraft(
    content: string,
    providers: LlmProvider[]
  ): Promise<Result<DraftResult>> {
    const systemPrompt = [
      "당신은 PosMul 토론(Agora) 에디터입니다.",
      "원문을 바탕으로 균형 잡힌 한국어 토론 주제와 3개의 핵심 논점을 JSON으로 생성하세요.",
      'JSON: { "title": "제목", "summary": "요약", "keywords": ["k1","k2"], "discussionPoints": ["논점1","논점2","논점3"] }',
    ].join("\n");
    const cleanContent = content.replace(/\s+/g, " ").trim().slice(0, 1800);

    let lastErr: Error | null = null;
    for (const provider of providers) {
      try {
        const raw = await this.invokeProviderJson<RawForumDraftJson>(
          provider,
          systemPrompt,
          `원문:\n"""\n${cleanContent}\n"""`
        );
        const points = Array.isArray(raw.discussionPoints)
          ? raw.discussionPoints.map((p) => String(p).trim()).filter(Boolean)
          : [];
        return success({
          title: String(raw.title ?? "사회 이슈 토론").trim(),
          summary: String(raw.summary ?? cleanContent.slice(0, 200)).trim(),
          keywords: Array.isArray(raw.keywords)
            ? raw.keywords.map((k) => String(k).trim()).filter(Boolean)
            : [],
          forumDraft: {
            discussionPoints:
              points.length > 0
                ? points
                : ["핵심 쟁점과 장기적 영향에 대한 참여자 의견 교환"],
          },
        });
      } catch (err) {
        lastErr = err instanceof Error ? err : new Error(String(err));
      }
    }
    return failure(lastErr ?? new Error("Failed to generate forum draft"));
  }

  private async enrichBlueprintDraft(
    blueprint: StructuredBlueprint,
    rawContent: string
  ): Promise<DraftResult> {
    const cleanContext = rawContent
      .replace(/\[POSMUL_BLUEPRINT\][\s\S]*?\[\/POSMUL_BLUEPRINT\]/g, "")
      .trim();

    const baseDraft: DraftResult = {
      title: blueprint.title,
      summary: blueprint.summary,
      keywords: blueprint.keywords ?? [],
      predictionDraft: {
        category:
          blueprint.category && ALLOWED_CATEGORIES.has(blueprint.category)
            ? blueprint.category
            : "ECONOMY",
        subcategory: blueprint.subcategory,
        predictionType: blueprint.predictionType,
        options: blueprint.options,
        resolutionCriteria: blueprint.resolutionCriteria,
        closingHoursFromNow: blueprint.closingHoursFromNow ?? 72,
        settlementDelayHours: blueprint.settlementDelayHours ?? 12,
        oracleType: blueprint.oracleType ?? "manual",
        oracleConfig: blueprint.oracleConfig,
      },
    };

    const providers = this.resolveProviderOrder(cleanContext || blueprint.title);
    if (providers.length === 0) {
      return baseDraft;
    }

    const systemPrompt = [
      "당신은 PosMul 예측시장의 데이터 애널리스트입니다.",
      "이미 제목, 선택지, 실시간 기준 수치, 오라클 정산 기준은 확정되어 있습니다. 수치를 임의로 바꾸지 마세요.",
      "참여자의 의사결정을 돕는 객관적 4줄 브리핑 `summary`만 작성해 JSON으로 반환하세요:",
      "🎯 기준선: <확정 수치 기반 현재 상태>",
      "📈 강세·달성 요인: <핵심 모멘텀 1줄>",
      "📉 약세·미달 요인: <핵심 리스크 1줄>",
      "⚖️ 판정 기준: <정확한 정산 시점 및 공식 출처 1줄>",
      '반드시 JSON만 출력: { "summary": "..." }',
    ].join("\n");

    const userPrompt = [
      `제목: ${blueprint.title}`,
      `선택지: ${blueprint.options.join(" | ")}`,
      `기준 팩트: ${blueprint.baselineFact ?? cleanContext}`,
      `정산 기준: ${blueprint.resolutionCriteria}`,
    ].join("\n");

    for (const provider of providers) {
      try {
        const res = await this.invokeProviderJson<{ summary?: string }>(
          provider,
          systemPrompt,
          userPrompt
        );
        const enrichedSummary = (res.summary ?? "").trim();
        if (enrichedSummary.length >= 40) {
          const candidate: DraftResult = {
            ...baseDraft,
            summary: enrichedSummary,
          };
          const gate = validateGeneratedDraft(
            `${cleanContext} ${blueprint.title}`,
            candidate
          );
          if (gate.ok) {
            return candidate;
          }
        }
      } catch (err) {
        console.warn(
          `[MultiLLM blueprint-enrich] ${provider} fallback to base summary:`,
          err instanceof Error ? err.message : String(err)
        );
      }
    }

    return baseDraft;
  }

  private normalizePredictionDraft(raw: RawPredictionDraftJson): DraftResult {
    const options = Array.isArray(raw.options)
      ? raw.options.map((o) => String(o).trim()).filter(Boolean)
      : ["예", "아니오"];

    const rawType = String(raw.predictionType ?? "").toUpperCase();
    const predictionType: "BINARY" | "WIN_DRAW_LOSE" | "RANKING" =
      rawType === "WIN_DRAW_LOSE" && options.length === 3
        ? "WIN_DRAW_LOSE"
        : rawType === "RANKING" || options.length >= 4
        ? "RANKING"
        : options.length === 3
        ? "WIN_DRAW_LOSE"
        : "BINARY";

    const catRaw = String(raw.category ?? "ECONOMY").toUpperCase();
    const category = ALLOWED_CATEGORIES.has(catRaw) ? catRaw : "ECONOMY";

    const rawHours = Number(raw.closingHoursFromNow);
    const closingHoursFromNow =
      Number.isFinite(rawHours) && rawHours >= 6 && rawHours <= 720
        ? Math.round(rawHours)
        : 72;

    const rawDelay = Number(raw.settlementDelayHours);
    const settlementDelayHours =
      Number.isFinite(rawDelay) && rawDelay >= 1 && rawDelay <= 168
        ? Math.round(rawDelay)
        : 12;

    return {
      title: String(raw.title ?? "").trim(),
      summary: String(raw.summary ?? "").trim(),
      keywords: Array.isArray(raw.keywords)
        ? raw.keywords.map((k) => String(k).trim()).filter(Boolean)
        : [],
      predictionDraft: {
        category,
        subcategory: raw.subcategory ? String(raw.subcategory).trim() : undefined,
        predictionType,
        options,
        resolutionCriteria: String(raw.resolutionCriteria ?? "").trim(),
        closingHoursFromNow,
        settlementDelayHours,
        oracleType: "manual",
      },
    };
  }
}
