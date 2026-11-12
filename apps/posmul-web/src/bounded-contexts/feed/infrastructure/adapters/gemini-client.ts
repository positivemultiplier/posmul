import { ExaoneClient, extractJsonFromText } from "./exaone-client";
import type { OpenRouterClient } from "./openrouter-client";

export type LlmProvider = "exaone" | "gemini" | "openrouter";

export const DEFAULT_GEMINI_MODELS = [
  "gemini-3.5-flash",
  "gemini-3.5-flash-lite",
  "gemini-flash-lite-latest",
  "gemini-flash-latest",
];

export type CustomGeminiCaller = (
  systemPrompt: string,
  userPrompt: string,
  timeoutMs?: number
) => Promise<string>;

export interface GeminiClientOptions {
  apiKey?: string;
  models?: string[];
  customCaller?: CustomGeminiCaller;
}

/**
 * Google Gemini REST v1beta JSON 클라이언트
 */
export class GeminiClient {
  private readonly apiKey: string;
  private readonly models: string[];
  private readonly customCaller?: CustomGeminiCaller;
  private lastSucceededModel: string | null = null;

  constructor(options?: GeminiClientOptions) {
    this.apiKey = (
      options?.apiKey ??
      process.env.GOOGLE_GEMINI_API_KEY ??
      process.env.GEMINI_API_KEY ??
      ""
    ).trim();
    this.models = options?.models ?? DEFAULT_GEMINI_MODELS;
    this.customCaller = options?.customCaller;
  }

  public isConfigured(): boolean {
    return Boolean(this.customCaller) || this.apiKey.length > 0;
  }

  public getPrimaryModelName(): string {
    return this.lastSucceededModel ?? this.models[0] ?? "gemini-3.5-flash";
  }

  public async generateJson<T>(
    systemPrompt: string,
    userPrompt: string,
    timeoutMs = 22000,
    temperature = 0.25
  ): Promise<T> {
    if (this.customCaller) {
      const text = await this.customCaller(systemPrompt, userPrompt, timeoutMs);
      return extractJsonFromText<T>(text);
    }

    if (!this.apiKey) {
      throw new Error("GOOGLE_GEMINI_API_KEY is not configured");
    }

    let lastError: Error | null = null;
    const perModelTimeoutMs = Math.min(
      9500,
      Math.max(4500, Math.floor(timeoutMs * 0.6))
    );

    const sleep = (ms: number) =>
      new Promise<void>((resolve) => setTimeout(resolve, ms));

    const attemptModels = [
      ...this.models,
      this.models.includes("gemini-3.5-flash-lite")
        ? "gemini-3.5-flash-lite"
        : this.models[0],
    ].filter((m): m is string => Boolean(m));

    for (let idx = 0; idx < attemptModels.length; idx += 1) {
      const model = attemptModels[idx];
      if (idx > 0 && lastError && /429|503|RESOURCE_EXHAUSTED|UNAVAILABLE/i.test(lastError.message)) {
        // 일시적 과부하·RPM 버스트 시 짧은 백오프로 성공률 향상
        await sleep(idx === attemptModels.length - 1 ? 1500 : 700);
      }

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), perModelTimeoutMs);
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(
          this.apiKey
        )}`;
        const response = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: systemPrompt }] },
            contents: [{ role: "user", parts: [{ text: userPrompt }] }],
            generationConfig: {
              temperature,
              maxOutputTokens: 1800,
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

        this.lastSucceededModel = model;
        return extractJsonFromText<T>(rawText);
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
      } finally {
        clearTimeout(timer);
      }
    }

    throw lastError ?? new Error("All Gemini models failed");
  }
}

export interface LlmProviderClients {
  exaone: ExaoneClient;
  gemini: GeminiClient;
  openrouter?: OpenRouterClient;
}

export interface LlmInvokeOptions {
  temperature?: number;
  exaoneMaxTokens?: number;
  openrouterMaxTokens?: number;
  timeoutMs?: number;
}

/**
 * 프로바이더별 JSON 생성 호출을 공통 인터페이스로 실행
 */
export async function invokeLlmProviderJson<T>(
  provider: LlmProvider,
  clients: LlmProviderClients,
  systemPrompt: string,
  userPrompt: string,
  options?: LlmInvokeOptions
): Promise<T> {
  const temperature = options?.temperature ?? 0.25;

  if (provider === "exaone") {
    return clients.exaone.generateJson<T>(systemPrompt, userPrompt, {
      temperature,
      maxTokens: options?.exaoneMaxTokens ?? 1800,
      timeoutMs: options?.timeoutMs ?? 25000,
    });
  }

  if (provider === "openrouter") {
    if (!clients.openrouter) {
      throw new Error("OpenRouterClient is not provided");
    }
    return clients.openrouter.generateJson<T>(systemPrompt, userPrompt, {
      temperature,
      maxTokens: options?.openrouterMaxTokens ?? 3200,
      timeoutMs: Math.min(options?.timeoutMs ?? 15000, 18000),
    });
  }

  return clients.gemini.generateJson<T>(
    systemPrompt,
    userPrompt,
    options?.timeoutMs ?? 22000,
    temperature
  );
}

/**
 * 콘텐츠 언어·도메인에 따라 EXAONE / Gemini / OpenRouter(3순위 무료 백업) 호출 우선순위 결정
 */
export function resolveLlmOrder(
  content: string,
  exaone: ExaoneClient,
  gemini: GeminiClient,
  openrouter?: OpenRouterClient
): LlmProvider[] {
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
    ? ["exaone", "gemini", "openrouter"]
    : ["gemini", "exaone", "openrouter"];

  return preferred.filter((provider) => {
    if (provider === "exaone") return exaone.isConfigured();
    if (provider === "gemini") return gemini.isConfigured();
    return Boolean(openrouter?.isConfigured());
  });
}

