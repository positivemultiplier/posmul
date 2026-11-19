import { extractJsonFromText } from "./exaone-client";

export type OpenRouterReasoningEffort = "minimal" | "low" | "medium" | "high";

export type CustomOpenRouterCaller = (
  systemPrompt: string,
  userPrompt: string,
  timeoutMs?: number
) => Promise<string>;

export interface OpenRouterConfig {
  apiKey?: string;
  baseUrl?: string;
  model?: string;
  reasoningEffort?: OpenRouterReasoningEffort;
  customCaller?: CustomOpenRouterCaller;
}

export interface OpenRouterGenerateOptions {
  temperature?: number;
  maxTokens?: number;
  timeoutMs?: number;
  reasoningEffort?: OpenRouterReasoningEffort;
}

const DEFAULT_OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";
const DEFAULT_OPENROUTER_MODEL = "baidu/ernie-5.5-flash-preview:free";
const DEFAULT_REASONING_EFFORT: OpenRouterReasoningEffort = "minimal";
// ERNIE 5.5 Flash는 reasoning이 상시 활성화되므로 본문이 잘리지 않도록 최소 출력 한도를 넉넉히 확보한다.
const MIN_REASONING_SAFE_MAX_TOKENS = 2800;
const VALID_REASONING_EFFORTS = new Set<OpenRouterReasoningEffort>([
  "minimal",
  "low",
  "medium",
  "high",
]);

function normalizeReasoningEffort(
  raw?: string
): OpenRouterReasoningEffort {
  const normalized = String(raw ?? "").trim().toLowerCase() as OpenRouterReasoningEffort;
  return VALID_REASONING_EFFORTS.has(normalized)
    ? normalized
    : DEFAULT_REASONING_EFFORT;
}

interface OpenRouterChatPayload {
  choices?: Array<{
    message?: {
      content?: string | null;
      reasoning?: string | null;
    };
  }>;
}

/**
 * OpenRouter 응답 페이로드(content 우선, 필요 시 reasoning 보조 스캔)에서 JSON 객체를 추출한다.
 */
function parseOpenRouterPayload<T>(payload: OpenRouterChatPayload): T {
  const message = payload.choices?.[0]?.message;
  const content = message?.content?.trim() ?? "";
  const reasoning = message?.reasoning?.trim() ?? "";

  if (content) {
    try {
      return extractJsonFromText<T>(content);
    } catch (parseErr) {
      if (reasoning.includes("{")) {
        return extractJsonFromText<T>(reasoning);
      }
      throw parseErr;
    }
  }

  if (reasoning.includes("{")) {
    return extractJsonFromText<T>(reasoning);
  }

  throw new Error("OpenRouter returned empty message content");
}

function isAbortOrTimeoutError(err: unknown): boolean {
  return (
    err instanceof Error &&
    (err.name === "AbortError" || /aborted|timeout/i.test(err.message))
  );
}

/**
 * OpenRouter OpenAI-compatible JSON 클라이언트 (3순위 무료 백업: Baidu ERNIE 5.5 Flash Preview)
 * - 환경변수 OPENROUTER_API_KEY, OPENROUTER_BASE_URL, OPENROUTER_MODEL, OPENROUTER_REASONING_EFFORT 사용
 * - 상시 추론 모델 특성상 reasoning.enabled=false 시 400이 발생하므로 effort="minimal" 및 충분한 max_tokens를 강제한다.
 */
export class OpenRouterClient {
  private static consecutiveFailures = 0;
  private static cooldownUntilMs = 0;

  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly model: string;
  private readonly reasoningEffort: OpenRouterReasoningEffort;
  private readonly customCaller?: CustomOpenRouterCaller;

  constructor(config?: OpenRouterConfig) {
    this.apiKey = (config?.apiKey ?? process.env.OPENROUTER_API_KEY ?? "").trim();
    const rawBase = (
      config?.baseUrl ??
      process.env.OPENROUTER_BASE_URL ??
      DEFAULT_OPENROUTER_BASE_URL
    ).trim();
    this.baseUrl = rawBase.replace(/\/+$/, "");
    this.model = (
      config?.model ??
      process.env.OPENROUTER_MODEL ??
      DEFAULT_OPENROUTER_MODEL
    ).trim();
    this.reasoningEffort = normalizeReasoningEffort(
      config?.reasoningEffort ?? process.env.OPENROUTER_REASONING_EFFORT
    );
    this.customCaller = config?.customCaller;
  }

  public static resetCircuitBreakerForTests(): void {
    OpenRouterClient.consecutiveFailures = 0;
    OpenRouterClient.cooldownUntilMs = 0;
  }

  public isConfigured(): boolean {
    return Boolean(this.customCaller) || this.apiKey.length > 0;
  }

  public getModelName(): string {
    return this.model;
  }

  public async generateJson<T = unknown>(
    systemPrompt: string,
    userPrompt: string,
    options?: OpenRouterGenerateOptions
  ): Promise<T> {
    if (this.customCaller) {
      const text = await this.customCaller(
        systemPrompt,
        userPrompt,
        options?.timeoutMs
      );
      return extractJsonFromText<T>(text);
    }

    if (!this.apiKey) {
      throw new Error("OPENROUTER_API_KEY is not configured");
    }

    if (Date.now() < OpenRouterClient.cooldownUntilMs) {
      throw new Error(
        "OpenRouter circuit breaker active (temporary cooldown after rate limit or timeout)"
      );
    }

    const payload = await this.requestCompletionPayload(
      systemPrompt,
      userPrompt,
      options
    );
    OpenRouterClient.consecutiveFailures = 0;
    OpenRouterClient.cooldownUntilMs = 0;

    return parseOpenRouterPayload<T>(payload);
  }

  private async requestCompletionPayload(
    systemPrompt: string,
    userPrompt: string,
    options?: OpenRouterGenerateOptions
  ): Promise<OpenRouterChatPayload> {
    const controller = new AbortController();
    // 풀 스키마 JSON 응답이 실측 12초 내외 소요될 수 있어 기본 15초 / 최대 18초 허용
    const timeoutMs = Math.min(options?.timeoutMs ?? 15000, 18000);
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
          "HTTP-Referer":
            process.env.NEXT_PUBLIC_SITE_URL ?? "https://posmul.com",
          "X-Title": "PosMul",
        },
        body: JSON.stringify(
          this.buildRequestBody(systemPrompt, userPrompt, options)
        ),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errBody = await response.text().catch(() => "");
        this.handleHttpFailure(response.status);
        throw new Error(
          `OpenRouter API error ${response.status}: ${errBody.slice(0, 240)}`
        );
      }

      return (await response.json()) as OpenRouterChatPayload;
    } catch (err) {
      if (isAbortOrTimeoutError(err)) {
        this.recordTransientFailure();
      }
      throw err;
    } finally {
      clearTimeout(timer);
    }
  }

  private buildRequestBody(
    systemPrompt: string,
    userPrompt: string,
    options?: OpenRouterGenerateOptions
  ) {
    return {
      model: this.model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: options?.temperature ?? 0.25,
      max_tokens: Math.max(
        options?.maxTokens ?? 3200,
        MIN_REASONING_SAFE_MAX_TOKENS
      ),
      response_format: { type: "json_object" },
      reasoning: {
        effort: options?.reasoningEffort ?? this.reasoningEffort,
      },
    };
  }

  private handleHttpFailure(status: number): void {
    if (status === 429) {
      // 무료 티어 분당/일일 한도(RPM/RPD) 도달 시 60초 쿨다운
      OpenRouterClient.cooldownUntilMs = Date.now() + 60_000;
      return;
    }
    if (status >= 500) {
      this.recordTransientFailure();
    }
  }

  private recordTransientFailure(): void {
    OpenRouterClient.consecutiveFailures += 1;
    if (OpenRouterClient.consecutiveFailures >= 2) {
      OpenRouterClient.cooldownUntilMs = Date.now() + 120_000;
    }
  }
}

