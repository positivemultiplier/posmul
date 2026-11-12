jest.mock("@/lib/supabase/admin", () => ({
  supabaseAdmin: {},
}));

import { ExaoneClient } from "@/bounded-contexts/feed/infrastructure/adapters/exaone-client";
import { GeminiClient } from "@/bounded-contexts/feed/infrastructure/adapters/gemini-client";
import { OpenRouterClient } from "@/bounded-contexts/feed/infrastructure/adapters/openrouter-client";

import {
  BalancedBriefingService,
  BriefingGameInput,
  resolveBriefingMode,
} from "../balanced-briefing.service";

function createMockExaone(overrides?: Partial<ExaoneClient>): ExaoneClient {
  return {
    isConfigured: jest.fn(() => true),
    getModelName: jest.fn(() => "k-exaone_v2.5"),
    generateJson: jest.fn(),
    ...overrides,
  } as unknown as ExaoneClient;
}

function createMockGemini(overrides?: Partial<GeminiClient>): GeminiClient {
  return {
    isConfigured: jest.fn(() => true),
    getPrimaryModelName: jest.fn(() => "gemini-3.8-flash"),
    generateJson: jest.fn(),
    ...overrides,
  } as unknown as GeminiClient;
}

function createMockOpenRouter(
  overrides?: Partial<OpenRouterClient>
): OpenRouterClient {
  return {
    isConfigured: jest.fn(() => true),
    getModelName: jest.fn(() => "baidu/ernie-5.5-flash-preview:free"),
    generateJson: jest.fn(),
    ...overrides,
  } as unknown as OpenRouterClient;
}

describe("BalancedBriefingService (유형별 다형성 AI 균형 의사결정 브리핑)", () => {
  it("resolveBriefingMode가 옵션 개수와 predictionType에 따라 BINARY / WIN_DRAW_LOSE / RANKING을 정확히 판별한다", () => {
    expect(resolveBriefingMode("BINARY", 2)).toBe("BINARY");
    expect(resolveBriefingMode("WIN_DRAW_LOSE", 3)).toBe("WIN_DRAW_LOSE");
    expect(resolveBriefingMode(undefined, 3)).toBe("WIN_DRAW_LOSE");
    expect(resolveBriefingMode("RANKING", 4)).toBe("RANKING");
    expect(resolveBriefingMode("BINARY", 5)).toBe("RANKING");
  });

  it("BINARY 게임에서 한국어 콘텐츠는 EXAONE이 생성하고 할루시네이션 URL을 제거한다", async () => {
    const mockExaone = createMockExaone({
      generateJson: jest.fn().mockResolvedValue({
        neutralFacts: {
          title: "[공식 지표] 삼성전자 분기 잠정실적 발표",
          description: "공시 기준선과 컨센서스를 비교합니다 https://fake-url.test/leak",
          currentValue: "직전 분기 영업이익 10.4조 원",
          historicalContext: "메모리 업황 사이클에 따라 변동폭 확대",
          officialSchedule: "분기 실적 공시일 09:00 KST",
          source: "금융감독원 전자공시(OpenDART) http://bad.example.com",
        },
        scenarios: [
          {
            optionId: "opt-yes",
            optionLabel: "컨센서스 상회 (예)",
            stanceTag: "상회 시나리오",
            tone: "bull",
            coreThesis: "HBM 출하 확대 및 NAND ASP 상승이 수익성을 견인합니다.",
            arguments: [
              {
                point: "AI 서버용 고부가 제품 비중 증가",
                detail: "전분기 대비 수익성 개선 폭이 예상을 상회할 수 있습니다.",
              },
            ],
          },
          {
            optionId: "opt-no",
            optionLabel: "컨센서스 하회 (아니오)",
            stanceTag: "하회 시나리오",
            tone: "bear",
            coreThesis: "파운드리 가동률 둔화와 일회성 성과급이 이익을 제약합니다.",
            arguments: [
              {
                point: "비메모리 부문 적자 지속 가능성",
                detail: "원달러 환율 하락 시 수출 채산성이 일부 둔화됩니다.",
              },
            ],
          },
        ],
        aiInsight:
          "메모리 ASP 상승 탄력과 일회성 비용 규모 중 어느 요인이 큰지 균형 있게 점검하세요 https://phishing.test",
      }),
    });
    const mockGemini = createMockGemini();

    const service = new BalancedBriefingService({
      exaoneClient: mockExaone,
      geminiClient: mockGemini,
    });

    const input: BriefingGameInput = {
      gameId: "game-binary-1",
      title: "삼성전자 3분기 영업이익이 컨센서스를 상회할까요?",
      description: "금융감독원 잠정실적 공시 기준",
      category: "ECONOMY",
      predictionType: "BINARY",
      dataSource: "dart",
      options: [
        { id: "opt-yes", label: "컨센서스 상회 (예)" },
        { id: "opt-no", label: "컨센서스 하회 (아니오)" },
      ],
    };

    const result = await service.generateForGame(input);

    expect(result.llmGenerated).toBe(true);
    expect(result.briefing.version).toBe(2);
    expect(result.briefing.mode).toBe("BINARY");
    expect(result.briefing.providerBadge).toContain("LG EXAONE");
    expect(result.briefing.scenarios).toHaveLength(2);
    expect(result.briefing.scenarios.map((s) => s.optionId)).toEqual([
      "opt-yes",
      "opt-no",
    ]);
    // 할루시네이션 URL이 모두 제거되어야 한다
    expect(result.briefing.neutralFacts.description).not.toContain("https://");
    expect(result.briefing.neutralFacts.source).not.toContain("http://");
    expect(result.briefing.aiInsight).not.toContain("https://");
    expect(mockGemini.generateJson).not.toHaveBeenCalled();
  });

  it("WIN_DRAW_LOSE 게임(맨시티 vs 풀럼)에서 3개 선택지 시나리오가 optionId/label과 1:1 매핑된다", async () => {
    const mockExaone = createMockExaone({
      generateJson: jest.fn().mockResolvedValue({
        neutralFacts: {
          title: "[EPL 매치 프리뷰] 맨시티 vs 풀럼",
          description: "에티하드 스타디움 정규시간 90분 승부",
          currentValue: "홈팀 최근 5경기 4승 1무",
          historicalContext: "최근 맞대결 맨시티 우세",
          officialSchedule: "경기 종료 휘슬 직후 정산",
          source: "Football-Data.org",
        },
        scenarios: [
          {
            optionId: "home",
            optionLabel: "맨체스터 시티 승",
            stanceTag: "홈 승리 조건",
            tone: "bull",
            coreThesis: "높은 점유율과 하프스페이스 침투로 선제 득점 가능성이 큽니다.",
            arguments: [{ point: "홈 화력 우위", detail: "세트피스와 측면 크로스 집중" }],
          },
          {
            optionId: "draw",
            optionLabel: "무승부",
            stanceTag: "교착·무승부 변수",
            tone: "neutral",
            coreThesis: "풀럼의 5백 밀집 수비와 역습이 효과적이면 균형이 유지됩니다.",
            arguments: [{ point: "저득점 교착", detail: "후반 체력 저하 시 실점 억제" }],
          },
          {
            optionId: "away",
            optionLabel: "풀럼 승",
            stanceTag: "이변·원정 승리",
            tone: "bear",
            coreThesis: "전환 속도와 세트피스 한 방으로 이변을 만들 수 있습니다.",
            arguments: [{ point: "역습 한 방", detail: "뒷공간 침투 성공 시 1점 차 수성" }],
          },
        ],
        aiInsight:
          "초반 선제골 여부와 풀럼의 수비 블록 유지 시간에 따라 무승부 확률이 크게 달라집니다.",
      }),
    });

    const service = new BalancedBriefingService({
      exaoneClient: mockExaone,
      geminiClient: createMockGemini(),
    });

    const result = await service.generateForGame({
      gameId: "game-wdl-1",
      title: "[EPL] 맨체스터 시티 vs 풀럼 승부 결과는?",
      category: "SPORTS",
      predictionType: "WIN_DRAW_LOSE",
      dataSource: "football_data",
      options: [
        { id: "home", label: "맨체스터 시티 승" },
        { id: "draw", label: "무승부" },
        { id: "away", label: "풀럼 승" },
      ],
    });

    expect(result.llmGenerated).toBe(true);
    expect(result.briefing.mode).toBe("WIN_DRAW_LOSE");
    expect(result.briefing.scenarios).toHaveLength(3);
    expect(result.briefing.scenarios.map((s) => s.optionLabel)).toEqual([
      "맨체스터 시티 승",
      "무승부",
      "풀럼 승",
    ]);
  });

  it("RANKING 4구간 게임에서 EXAONE 실패 시 Gemini로 폴백해 tailRiskNote와 구간별 시나리오를 반환한다", async () => {
    const mockExaone = createMockExaone({
      generateJson: jest.fn().mockRejectedValue(new Error("EXAONE timeout")),
    });
    const mockGemini = createMockGemini({
      generateJson: jest.fn().mockResolvedValue({
        neutralFacts: {
          title: "[가상자산] BTC 주말 종가 구간 예측",
          description: "CoinGecko 현물 종가 기준 4개 가격 구간 판정",
          currentValue: "현재 BTC 현물 약 $72,400 부근 등락",
          historicalContext: "최근 7일 일평균 변동폭 ±3.8%",
          officialSchedule: "일요일 23:59 KST 스냅샷 정산",
          source: "CoinGecko 글로벌 현물 인덱스",
        },
        scenarios: [
          {
            optionId: "b1",
            optionLabel: "$68,000 미만",
            stanceTag: "하락 이탈 구간",
            tone: "bear",
            coreThesis: "ETF 순유출 확대 시 하단 지지선 이탈 가능 구간입니다.",
            probabilityCue: "약 15%",
            arguments: [{ point: "매도 압력", detail: "레버리지 롱 청산 연쇄 여부" }],
          },
          {
            optionId: "b2",
            optionLabel: "$68,000 ~ $72,000",
            stanceTag: "하단 박스권",
            tone: "neutral",
            coreThesis: "단기 숨고르기 국면에서 가장 빈번히 머무는 지지 구간입니다.",
            probabilityCue: "약 35%",
            arguments: [{ point: "매물대 지지", detail: "현물 저가 매수 유입" }],
          },
          {
            optionId: "b3",
            optionLabel: "$72,000 ~ $76,000",
            stanceTag: "상단 유력 구간",
            tone: "bull",
            coreThesis: "현재 시세가 위치해 변동성이 보통 수준이면 도달 확률이 높습니다.",
            probabilityCue: "약 38%",
            arguments: [{ point: "추세 유지", detail: "기관 순유입 지속" }],
          },
          {
            optionId: "b4",
            optionLabel: "$76,000 이상",
            stanceTag: "급등 돌파(다크호스)",
            tone: "darkhorse",
            coreThesis: "숏 스퀴즈와 매크로 호재가 겹칠 때 발생하는 꼬리 시나리오입니다.",
            probabilityCue: "약 12%",
            arguments: [{ point: "상단 돌파", detail: "거래량 동반 저항선 돌파" }],
          },
        ],
        aiInsight:
          "구간 경계값($72,000) 부근 변동성에 유의하며 중앙 구간과 꼬리 구간 확률을 비교하세요.",
        tailRiskNote:
          "주말 유동성 공백 시간대(새벽)에 급격한 윕소로 경계값을 일시 이탈할 위험이 있습니다.",
      }),
    });

    const service = new BalancedBriefingService({
      exaoneClient: mockExaone,
      geminiClient: mockGemini,
    });

    const result = await service.generateForGame({
      gameId: "game-rank-1",
      title: "이번 주 일요일 비트코인(BTC) 종가 구간은?",
      category: "TECH",
      predictionType: "RANKING",
      dataSource: "coingecko",
      options: [
        { id: "b1", label: "$68,000 미만" },
        { id: "b2", label: "$68,000 ~ $72,000" },
        { id: "b3", label: "$72,000 ~ $76,000" },
        { id: "b4", label: "$76,000 이상" },
      ],
    });

    expect(result.llmGenerated).toBe(true);
    expect(result.briefing.mode).toBe("RANKING");
    expect(result.briefing.providerBadge).toContain("Google Gemini");
    expect(result.briefing.scenarios).toHaveLength(4);
    expect(result.briefing.scenarios[3].tone).toBe("darkhorse");
    expect(result.briefing.tailRiskNote).toContain("유동성 공백");
    expect(mockExaone.generateJson).toHaveBeenCalledTimes(1);
    expect(mockGemini.generateJson).toHaveBeenCalledTimes(1);
  });

  it("EXAONE과 Gemini가 모두 실패하면 3순위 OpenRouter(ERNIE 5.5 Flash)로 폴백해 균형 브리핑을 생성한다", async () => {
    const mockExaone = createMockExaone({
      generateJson: jest.fn().mockRejectedValue(new Error("EXAONE 503")),
    });
    const mockGemini = createMockGemini({
      generateJson: jest.fn().mockRejectedValue(new Error("Gemini 429")),
    });
    const mockOpenRouter = createMockOpenRouter({
      generateJson: jest.fn().mockResolvedValue({
        neutralFacts: {
          title: "[금통위] 한국은행 기준금리 결정",
          description: "한국은행 금융통화위원회 통화정책방향 의결문 기준",
          currentValue: "현재 기준금리 연 2.75%",
          historicalContext: "직전 2차례 회의 연속 동결",
          officialSchedule: "금통위 본회의 직후 오전 10:00 발표",
          source: "한국은행 경제통계시스템(ECOS)",
        },
        scenarios: [
          {
            optionId: "hold",
            optionLabel: "기준금리 동결",
            stanceTag: "동결 논거",
            tone: "neutral",
            coreThesis: "환율 변동성과 가계부채 리스크로 신중한 유지가 유력합니다.",
            arguments: [{ point: "외환·금융안정", detail: "원/달러 상방 압력 경계" }],
          },
          {
            optionId: "cut",
            optionLabel: "기준금리 25bp 인하",
            stanceTag: "인하 논거",
            tone: "bull",
            coreThesis: "내수·수출 둔화에 선제 대응할 필요가 커지고 있습니다.",
            arguments: [{ point: "경기 하방 방어", detail: "소비·투자 회복 지원" }],
          },
        ],
        aiInsight:
          "환율 안정 여부와 내수 경기 둔화 강도 중 금통위가 어디에 무게를 둘지 주목하세요.",
      }),
    });

    const service = new BalancedBriefingService({
      exaoneClient: mockExaone,
      geminiClient: mockGemini,
      openrouterClient: mockOpenRouter,
    });

    const result = await service.generateForGame({
      gameId: "game-or-fallback-1",
      title: "한국은행 이번 금융통화위원회 기준금리 동결할까?",
      category: "ECONOMY",
      predictionType: "BINARY",
      dataSource: "ecos",
      options: [
        { id: "hold", label: "기준금리 동결" },
        { id: "cut", label: "기준금리 25bp 인하" },
      ],
    });

    expect(result.llmGenerated).toBe(true);
    expect(result.briefing.providerBadge).toContain("OpenRouter ERNIE");
    expect(result.briefing.providerBadge).toContain("ernie-5.5-flash");
    expect(result.briefing.scenarios).toHaveLength(2);
    expect(mockExaone.generateJson).toHaveBeenCalledTimes(1);
    expect(mockGemini.generateJson).toHaveBeenCalledTimes(1);
    expect(mockOpenRouter.generateJson).toHaveBeenCalledTimes(1);
  });

  it("모든 LLM(EXAONE/Gemini/OpenRouter)이 실패해도 실업률 3.0% 같은 타 도메인 예제 없이 해당 게임 기반 안전 폴백을 반환한다", async () => {
    const mockExaone = createMockExaone({
      generateJson: jest.fn().mockRejectedValue(new Error("503")),
    });
    const mockGemini = createMockGemini({
      generateJson: jest.fn().mockRejectedValue(new Error("429")),
    });
    const mockOpenRouter = createMockOpenRouter({
      generateJson: jest.fn().mockRejectedValue(new Error("429")),
    });

    const service = new BalancedBriefingService({
      exaoneClient: mockExaone,
      geminiClient: mockGemini,
      openrouterClient: mockOpenRouter,
    });

    const result = await service.generateForGame({
      gameId: "game-fallback-1",
      title: "이번 주말 국내 영화 박스오피스 1위 작품은?",
      category: "CULTURE",
      predictionType: "RANKING",
      dataSource: "kobis",
      options: [
        { id: "m1", label: "영화 A" },
        { id: "m2", label: "영화 B" },
        { id: "m3", label: "영화 C" },
        { id: "m4", label: "기타 작품" },
      ],
    });

    expect(result.llmGenerated).toBe(false);
    expect(result.briefing.mode).toBe("RANKING");
    expect(result.briefing.topic).toContain("박스오피스");
    expect(result.briefing.neutralFacts.source).toContain("KOBIS");
    expect(result.briefing.scenarios.map((s) => s.optionLabel)).toEqual([
      "영화 A",
      "영화 B",
      "영화 C",
      "기타 작품",
    ]);
    // 과거 하드코딩 예제 문자열이 절대 섞이지 않아야 함
    const serialized = JSON.stringify(result.briefing);
    expect(serialized).not.toContain("실업률");
    expect(serialized).not.toContain("3.0%");
    expect(serialized).not.toContain("PMP");
  });
});

