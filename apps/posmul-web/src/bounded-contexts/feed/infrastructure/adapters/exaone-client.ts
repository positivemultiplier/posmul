/**
 * LG AI EXAONE OpenAI-compatible 클라이언트
 * - 환경변수 EXAONE_API_KEY, EXAONE_BASE_URL, EXAONE_MODEL 사용
 * - reasoning_content를 먼저 출력하는 k-exaone 모델 특성에 맞춰 충분한 max_tokens 확보
 */

export interface ExaoneConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
}

export interface ExaoneGenerateOptions {
  temperature?: number;
  maxTokens?: number;
  timeoutMs?: number;
}

/**
 * LLM 응답 문자열(코드펜스/설명/reasoning 텍스트 포함 가능)에서 최외곽 JSON 객체를 안전하게 추출
 */
export function extractJsonFromText<T = unknown>(raw: string): T {
  const cleaned = raw.trim();
  if (!cleaned) {
    throw new Error("Empty response text from LLM");
  }

  // 1. 코드블록 우선 추출
  const fenceMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenceMatch?.[1]) {
    try {
      return JSON.parse(fenceMatch[1].trim()) as T;
    } catch {
      // 아래 중괄호 추출로 폴백
    }
  }

  // 2. 원문 자체가 JSON인 경우
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    // 중괄호 균형 스캔으로 폴백
  }

  // 3. 문자열 리터럴을 고려해 첫 '{' ~ 매칭 '}' 또는 마지막 '}' 범위 추출
  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    const candidate = cleaned.slice(firstBrace, lastBrace + 1);
    return JSON.parse(candidate) as T;
  }

  throw new Error(`No valid JSON object found in LLM response (len=${cleaned.length})`);
}

export class ExaoneClient {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly model: string;

  constructor(config?: Partial<ExaoneConfig>) {
    this.apiKey = (config?.apiKey ?? process.env.EXAONE_API_KEY ?? "").trim();
    const rawBase = (
      config?.baseUrl ??
      process.env.EXAONE_BASE_URL ??
      "https://api.exaone.ai/v1"
    ).trim();
    this.baseUrl = rawBase.replace(/\/+$/, "");
    this.model = (
      config?.model ??
      process.env.EXAONE_MODEL ??
      "k-exaone_v2.5"
    ).trim();
  }

  public isConfigured(): boolean {
    return this.apiKey.length > 0;
  }

  public getModelName(): string {
    return this.model;
  }

  public async generateJson<T = unknown>(
    systemPrompt: string,
    userPrompt: string,
    options?: ExaoneGenerateOptions
  ): Promise<T> {
    if (!this.isConfigured()) {
      throw new Error("EXAONE_API_KEY is not configured");
    }

    const controller = new AbortController();
    const timeoutMs = options?.timeoutMs ?? 25000;
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          temperature: options?.temperature ?? 0.25,
          max_tokens: options?.maxTokens ?? 1800,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errBody = await response.text().catch(() => "");
        throw new Error(
          `EXAONE API error ${response.status}: ${errBody.slice(0, 240)}`
        );
      }

      const payload = (await response.json()) as {
        choices?: Array<{
          message?: {
            content?: string | null;
            reasoning_content?: string | null;
          };
        }>;
      };

      const message = payload.choices?.[0]?.message;
      const content = message?.content?.trim() ?? "";
      const reasoning = message?.reasoning_content?.trim() ?? "";

      if (content) {
        try {
          return extractJsonFromText<T>(content);
        } catch (parseErr) {
          // content 파싱 실패 시 reasoning 뒤에 JSON이 포함된 예외 케이스 점검
          if (reasoning.includes("{")) {
            return extractJsonFromText<T>(reasoning);
          }
          throw parseErr;
        }
      }

      if (reasoning.includes("{")) {
        return extractJsonFromText<T>(reasoning);
      }

      throw new Error("EXAONE returned empty message content");
    } finally {
      clearTimeout(timer);
    }
  }
}

