import { ExaoneClient, extractJsonFromText } from "./exaone-client";

export type LlmProvider = "exaone" | "gemini";

export const DEFAULT_GEMINI_MODELS = ["gemini-3.8-flash", "gemini-flash-latest"];

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
    return this.models[0] ?? "gemini-3.8-flash";
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
    for (const model of this.models) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
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

/**
 * 콘텐츠 언어·도메인에 따라 EXAONE / Gemini 호출 우선순위 결정
 */
export function resolveLlmOrder(
  content: string,
  exaone: ExaoneClient,
  gemini: GeminiClient
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
    ? ["exaone", "gemini"]
    : ["gemini", "exaone"];

  return preferred.filter((provider) =>
    provider === "exaone" ? exaone.isConfigured() : gemini.isConfigured()
  );
}

