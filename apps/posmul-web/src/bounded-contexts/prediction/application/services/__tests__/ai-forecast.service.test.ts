import {
  AiForecastService,
  type AiForecastProviderPort,
  type AiForecastStore,
  type NewDbForecastRow,
} from "../ai-forecast.service";

function createMockStore(overrides?: Partial<AiForecastStore>): AiForecastStore {
  return {
    getGameById: jest.fn().mockResolvedValue({
      game_id: "game-1",
      title: "비트코인 이번 주 1억 5천만 원 돌파할까?",
      description: "업비트 종가 기준",
      category: "ECONOMY",
      prediction_type: "BINARY",
      data_source: "coingecko",
      game_options: {
        options: [
          { id: "opt-yes", label: "돌파한다" },
          { id: "opt-no", label: "못 한다" },
        ],
      },
      registration_end: "2026-11-30T14:59:59Z",
      settlement_date: "2026-11-30T15:00:00Z",
      status: "ACTIVE",
    }),
    getForecastsByGameId: jest.fn().mockResolvedValue([]),
    insertForecasts: jest.fn().mockResolvedValue(undefined),
    getSettledHistoryByProviders: jest.fn().mockResolvedValue([]),
    ...overrides,
  };
}

describe("AiForecastService (연동된 LLM 독립 예측 & 분야별 최근 5경기)", () => {
  it("연동된(isConfigured=true) LLM만 병렬 호출하고 미연동 LLM은 건너뛴다", async () => {
    const gemini: AiForecastProviderPort = {
      key: "gemini",
      label: "Google Gemini",
      modelName: "gemini-3.5-flash",
      isConfigured: () => true,
      predictJson: jest.fn().mockResolvedValue({
        selectedOptionId: "opt-yes",
        confidencePct: 71,
        reasoning: "현물 ETF 자금 유입 흐름이 단기 지지를 강화하고 있습니다.",
      }),
    };

    const exaone: AiForecastProviderPort = {
      key: "exaone",
      label: "LG EXAONE",
      modelName: "k-exaone_v2.5",
      isConfigured: () => true,
      predictJson: jest.fn().mockResolvedValue({
        selectedOptionId: "opt-no",
        confidencePct: 62,
        reasoning: "단기 급등에 따른 차익 실현 물량 출회 가능성이 높습니다.",
      }),
    };

    const openrouter: AiForecastProviderPort = {
      key: "openrouter",
      label: "OpenAI GPT",
      modelName: "openai/gpt-4o",
      isConfigured: () => false,
      predictJson: jest.fn(),
    };

    let savedRows: NewDbForecastRow[] = [];
    const store = createMockStore({
      getForecastsByGameId: jest.fn().mockImplementation(async () =>
        savedRows.map((r, idx) => ({
          forecast_id: `f-${idx}`,
          is_hit: null,
          brier_score: null,
          settled_at: null,
          created_at: "2026-11-23T00:00:00Z",
          ...r,
        }))
      ),
      insertForecasts: jest.fn().mockImplementation(async (rows) => {
        savedRows = rows;
      }),
      getSettledHistoryByProviders: jest.fn().mockResolvedValue([
        {
          game_id: "g-old-1",
          provider_key: "gemini",
          category: "ECONOMY",
          is_hit: true,
          settled_at: "2026-11-22T10:00:00Z",
        },
        {
          game_id: "g-old-2",
          provider_key: "gemini",
          category: "ECONOMY",
          is_hit: false,
          settled_at: "2026-11-21T10:00:00Z",
        },
      ]),
    });

    const service = new AiForecastService([gemini, exaone, openrouter], store);
    const result = await service.getOrCreateForGameId("game-1");

    expect(openrouter.predictJson).not.toHaveBeenCalled();
    expect(result).toHaveLength(2);
    expect(result[0].providerKey).toBe("gemini");
    expect(result[0].selectedOptionLabel).toBe("돌파한다");
    expect(result[0].stats.scope).toBe("category");
    expect(result[0].stats.hitRatePct).toBe(50);
    expect(result[0].stats.recentForm.map((f) => f.isHit)).toEqual([true, false]);
    expect(result[1].providerKey).toBe("exaone");
    expect(result[1].stats.scope).toBe("none");
  });

  it("이미 SETTLED된 게임에 기존 스냅샷이 없으면 사후 예측을 생성하지 않는다", async () => {
    const gemini: AiForecastProviderPort = {
      key: "gemini",
      label: "Google Gemini",
      modelName: "gemini-3.5-flash",
      isConfigured: () => true,
      predictJson: jest.fn(),
    };

    const store = createMockStore({
      getGameById: jest.fn().mockResolvedValue({
        game_id: "game-settled",
        title: "종료된 게임",
        description: null,
        category: "SPORTS",
        prediction_type: "BINARY",
        data_source: "football_data",
        game_options: {
          options: [
            { id: "a", label: "A" },
            { id: "b", label: "B" },
          ],
        },
        registration_end: "2026-11-20T00:00:00Z",
        settlement_date: "2026-11-20T02:00:00Z",
        status: "SETTLED",
      }),
    });

    const service = new AiForecastService([gemini], store);
    const result = await service.getOrCreateForGameId("game-settled");
    expect(gemini.predictJson).not.toHaveBeenCalled();
    expect(result).toEqual([]);
  });
});
