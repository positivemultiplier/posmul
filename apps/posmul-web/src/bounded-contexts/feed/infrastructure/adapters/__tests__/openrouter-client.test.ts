import { OpenRouterClient } from "../openrouter-client";

describe("OpenRouterClient (Baidu ERNIE 5.5 Flash Preview 무료 백업)", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    OpenRouterClient.resetCircuitBreakerForTests();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it("API 키가 비어 있으면 isConfigured()는 false이고 호출 시 즉시 에러를 던진다", async () => {
    const client = new OpenRouterClient({ apiKey: "" });
    expect(client.isConfigured()).toBe(false);
    await expect(client.generateJson("sys", "user")).rejects.toThrow(
      "OPENROUTER_API_KEY is not configured"
    );
  });

  it("요청 시 ERNIE 5.5 Flash 모델, reasoning.effort='minimal', json_object, 충분한 max_tokens를 전송한다", async () => {
    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              content: '{"summary":"한국어 요약","ok":true}',
              reasoning: "internal thinking",
            },
          },
        ],
      }),
    });
    global.fetch = mockFetch as unknown as typeof fetch;

    const client = new OpenRouterClient({ apiKey: "or-test-key" });
    expect(client.isConfigured()).toBe(true);
    expect(client.getModelName()).toBe("baidu/ernie-5.5-flash-preview:free");

    const result = await client.generateJson<{ summary: string; ok: boolean }>(
      "시스템",
      "사용자",
      { maxTokens: 1200 }
    );

    expect(result).toEqual({ summary: "한국어 요약", ok: true });
    expect(mockFetch).toHaveBeenCalledTimes(1);

    const [, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(String(init.body));
    expect(body.model).toBe("baidu/ernie-5.5-flash-preview:free");
    expect(body.reasoning).toEqual({ effort: "minimal" });
    expect(body.response_format).toEqual({ type: "json_object" });
    // ERNIE 5.5 Flash reasoning 소비를 고려해 최소 2800 이상으로 보정되어야 한다
    expect(body.max_tokens).toBeGreaterThanOrEqual(2800);
  });

  it("content가 비어 있고 reasoning에 JSON이 포함된 예외 응답도 안전하게 파싱한다", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              content: "",
              reasoning: '추론 끝\n```json\n{"classification":"PREDICTION"}\n```',
            },
          },
        ],
      }),
    }) as unknown as typeof fetch;

    const client = new OpenRouterClient({ apiKey: "or-test-key" });
    const parsed = await client.generateJson<{ classification: string }>(
      "sys",
      "user"
    );
    expect(parsed.classification).toBe("PREDICTION");
  });

  it("429 Rate Limit 응답 시 쿨다운 서킷 브레이커가 동작해 다음 호출을 즉시 차단한다", async () => {
    const mockFetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 429,
      text: async () => "Rate limit exceeded",
    });
    global.fetch = mockFetch as unknown as typeof fetch;

    const client = new OpenRouterClient({ apiKey: "or-test-key" });
    await expect(client.generateJson("sys", "user")).rejects.toThrow(
      "OpenRouter API error 429"
    );
    await expect(client.generateJson("sys", "user")).rejects.toThrow(
      "circuit breaker active"
    );
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });
});

