import { isFailure, isSuccess } from "@posmul/auth-economy-sdk";

import { ContentClassification } from "../../../domain/value-objects/feed-types";
import { validateGeneratedDraft } from "../draft-quality-gate";
import { ExaoneClient, extractJsonFromText } from "../exaone-client";
import {
  GeminiClassifierAdapter,
  serializeBlueprint,
} from "../gemini-classifier.adapter";

describe("extractJsonFromText & validateGeneratedDraft", () => {
  it("코드펜스 및 앞뒤 설명이 포함된 문자열에서 JSON을 정확히 추출한다", () => {
    const raw = `생각 중...\n\`\`\`json\n{"classification":"PREDICTION","confidence":0.9}\n\`\`\`\n완료.`;
    const parsed = extractJsonFromText<{ classification: string; confidence: number }>(
      raw
    );
    expect(parsed.classification).toBe("PREDICTION");
    expect(parsed.confidence).toBe(0.9);
  });

  it("추상 옵션('홈팀 승리')이 포함된 드래프트는 품질 게이트에서 거부된다", () => {
    const gate = validateGeneratedDraft("맨시티 vs 풀럼 프리미어리그 경기", {
      title: "[EPL] 맨시티 vs 풀럼 승부 결과는?",
      summary:
        "🎯 기준선: 맨시티 홈 경기\n📈 상승: 홈 강세\n📉 하락: 풀럼 역습\n⚖️ 판정: 경기 종료 후 정산",
      keywords: ["EPL", "맨시티", "풀럼"],
      predictionDraft: {
        predictionType: "BINARY",
        options: ["홈팀 승리", "원정팀 승리"],
        resolutionCriteria: "Football-Data API 공식 경기 종료 결과",
      },
    });
    expect(gate.ok).toBe(false);
    expect(gate.reason).toContain("Abstract placeholder option");
  });

  it("비트코인 원문에 해외축구 제목이 붙는 도메인 짬뽕을 차단한다", () => {
    const gate = validateGeneratedDraft(
      "비트코인(BTC) 현재가 1억 3,500만 원 돌파, 기관 자금 유입",
      {
        title: "[빅매치] 해외축구 주말 리그 맞대결 최종 결과는?",
        summary:
          "🎯 기준선: 유럽 5대 리그 빅매치\n📈 홈승\n📉 원정승\n⚖️ 경기 결과 정산",
        keywords: ["축구"],
        predictionDraft: {
          predictionType: "BINARY",
          options: ["아스널 승리", "첼시 승리"],
          resolutionCriteria: "공식 경기 종료 결과",
        },
      }
    );
    expect(gate.ok).toBe(false);
    expect(gate.reason).toContain("Domain mismatch");
  });
});

describe("GeminiClassifierAdapter (LG EXAONE + Gemini + OpenRouter 3중 오케스트레이터)", () => {
  it("한국어 콘텐츠는 EXAONE -> Gemini -> OpenRouter 순, 영문 글로벌 콘텐츠는 Gemini -> EXAONE -> OpenRouter 순으로 라우팅한다", () => {
    const mockExaone = {
      isConfigured: () => true,
      getModelName: () => "k-exaone_v2.5",
      generateJson: jest.fn(),
    } as unknown as ExaoneClient;

    const adapter = new GeminiClassifierAdapter({
      exaoneClient: mockExaone,
      geminiApiKey: "test-gemini-key",
      openrouterApiKey: "test-openrouter-key",
    });

    expect(
      adapter.resolveProviderOrder("삼성전자 4분기 영업이익 10조 돌파 전망")
    ).toEqual(["exaone", "gemini", "openrouter"]);

    expect(
      adapter.resolveProviderOrder(
        "Manchester City faces Fulham in Saturday Premier League clash"
      )
    ).toEqual(["gemini", "exaone", "openrouter"]);
  });

  it("EXAONE 실패 또는 품질 게이트 탈락 시 Gemini로 자동 폴백해 고품질 드래프트를 생성한다", async () => {
    const exaoneGenerate = jest.fn().mockResolvedValue({
      title: "[빅매치] 금주 해외축구·대표팀 주요 맞대결 최종 승무패 결과는?",
      summary: "비트코인 시세와는 전혀 상관없는 엉뚱한 설명 텍스트입니다 1234567890",
      predictionType: "BINARY",
      options: ["홈팀 승리", "원정팀 승리"],
      resolutionCriteria: "공식 경기 결과",
      category: "SPORTS",
    });

    const geminiCaller = jest.fn().mockResolvedValue(
      JSON.stringify({
        title:
          "[암호화폐] 비트코인(BTC) 이번 주말 업비트 기준 1억 4,000만 원 돌파할까?",
        summary:
          "🎯 기준선: 현재 비트코인(BTC) 시세는 1억 3,600만 원선에서 등락 중입니다.\n📈 상승·찬성 측 논거: 현물 ETF 순유입이 5거래일 연속 이어지고 있습니다.\n📉 하락·반대 측 논거: 1억 4,000만 원 부근 차익 실현 매물 출회 가능성이 큽니다.\n⚖️ 판정 기준: 마감 시점 업비트 KRW-BTC 종가 기준으로 자동 정산합니다.",
        keywords: ["비트코인", "BTC", "업비트"],
        predictionType: "BINARY",
        options: ["1억 4,000만 원 이상 돌파", "1억 4,000만 원 미만 유지"],
        resolutionCriteria: "마감 시점 CoinGecko/업비트 공식 시세 기준",
        category: "ECONOMY",
        closingHoursFromNow: 72,
      })
    );

    const mockExaone = {
      isConfigured: () => true,
      getModelName: () => "k-exaone_v2.5",
      generateJson: exaoneGenerate,
    } as unknown as ExaoneClient;

    const adapter = new GeminiClassifierAdapter({
      exaoneClient: mockExaone,
      geminiCaller,
      openrouterApiKey: "",
    });

    const res = await adapter.generateDraft(
      "비트코인(BTC) 업비트 현재 시세 1억 3,600만 원, 현물 ETF 순유입 지속",
      ContentClassification.PREDICTION
    );

    expect(isSuccess(res)).toBe(true);
    if (isSuccess(res)) {
      expect(exaoneGenerate).toHaveBeenCalledTimes(1);
      expect(geminiCaller).toHaveBeenCalledTimes(1);
      expect(res.data.title).toContain("비트코인");
      expect(res.data.predictionDraft?.options).toEqual([
        "1억 4,000만 원 이상 돌파",
        "1억 4,000만 원 미만 유지",
      ]);
    }
  });

  it("EXAONE과 Gemini가 모두 실패하면 3순위 OpenRouter(ERNIE 5.5 Flash)로 자동 폴백해 분류·초안을 생성한다", async () => {
    const mockExaone = {
      isConfigured: () => true,
      getModelName: () => "k-exaone_v2.5",
      generateJson: jest.fn().mockRejectedValue(new Error("EXAONE 503")),
    } as unknown as ExaoneClient;

    const geminiCaller = jest.fn().mockRejectedValue(new Error("Gemini 429"));
    const openrouterCaller = jest
      .fn()
      .mockResolvedValueOnce(
        JSON.stringify({
          classification: "PREDICTION",
          reasoning: "한국은행 기준금리 결정은 공식 정산이 가능한 이슈입니다.",
          confidence: 0.91,
        })
      )
      .mockResolvedValueOnce(
        JSON.stringify({
          title: "[금통위] 한국은행 이번 금융통화위원회 기준금리 동결할까?",
          summary:
            "🎯 기준선: 현재 한국은행 기준금리는 연 2.75%입니다.\n📈 상승·찬성 측 논거: 환율 변동성과 가계부채 리스크가 동결 요인입니다.\n📉 하락·반대 측 논거: 내수 둔화와 경기 하방 압력이 인하 요인입니다.\n⚖️ 판정 기준: 한국은행 금융통화위원회 공식 의결 발표 기준.",
          keywords: ["한국은행", "기준금리", "금통위"],
          predictionType: "BINARY",
          options: ["기준금리 동결", "기준금리 25bp 인하"],
          resolutionCriteria: "한국은행 금융통화위원회 공식 보도자료 기준",
          category: "ECONOMY",
          closingHoursFromNow: 72,
        })
      );

    const adapter = new GeminiClassifierAdapter({
      exaoneClient: mockExaone,
      geminiCaller,
      openrouterCaller,
      openrouterModel: "baidu/ernie-5.5-flash-preview:free",
    });

    const cls = await adapter.classify(
      "한국은행 금융통화위원회 이번 주 기준금리 동결 vs 인하 전망"
    );
    expect(isSuccess(cls)).toBe(true);
    if (isSuccess(cls)) {
      expect(cls.data.classification).toBe(ContentClassification.PREDICTION);
      expect(cls.data.reasoning).toContain("OpenRouter ERNIE");
    }

    const draftRes = await adapter.generateDraft(
      "한국은행 금융통화위원회 이번 주 기준금리 동결 vs 인하 전망",
      ContentClassification.PREDICTION
    );
    expect(isSuccess(draftRes)).toBe(true);
    if (isSuccess(draftRes)) {
      expect(draftRes.data.title).toContain("한국은행");
      expect(draftRes.data.predictionDraft?.options).toEqual([
        "기준금리 동결",
        "기준금리 25bp 인하",
      ]);
    }
    expect(openrouterCaller).toHaveBeenCalledTimes(2);
  });

  it("모든 LLM이 실패하면 가짜 랜덤 샘플 대신 failure Result를 반환한다", async () => {
    const mockExaone = {
      isConfigured: () => true,
      getModelName: () => "k-exaone_v2.5",
      generateJson: jest.fn().mockRejectedValue(new Error("EXAONE 503")),
    } as unknown as ExaoneClient;

    const adapter = new GeminiClassifierAdapter({
      exaoneClient: mockExaone,
      geminiCaller: jest.fn().mockRejectedValue(new Error("Gemini 429")),
      openrouterCaller: jest.fn().mockRejectedValue(new Error("OpenRouter 429")),
    });

    const res = await adapter.generateDraft(
      "한국은행 금통위 기준금리 동결 여부 논의",
      ContentClassification.PREDICTION
    );
    expect(isFailure(res)).toBe(true);
  });

  it("구조화된 [POSMUL_BLUEPRINT] 콘텐츠는 자동 PREDICTION 분류되며 LLM 장애 시에도 원안 팩트를 보존한다", async () => {
    const mockExaone = {
      isConfigured: () => true,
      getModelName: () => "k-exaone_v2.5",
      generateJson: jest.fn().mockRejectedValue(new Error("Temporary network error")),
    } as unknown as ExaoneClient;

    const adapter = new GeminiClassifierAdapter({
      exaoneClient: mockExaone,
      geminiApiKey: "",
      openrouterApiKey: "",
    });

    const blueprint = serializeBlueprint({
      title: "[실시간 외환] 원/달러 환율, 금요일 마감 기준 1,410원 돌파할까?",
      summary:
        "🎯 기준선: 현재 원/달러 매매기준율은 1,395원입니다.\n⚖️ 판정 기준: 한국수출입은행 공시 환율 기준.",
      predictionType: "BINARY",
      options: ["1,410원 이상 마감", "1,410원 미만 마감"],
      resolutionCriteria: "마감일 기준 원/달러 공식 환율 API 종가",
      category: "ECONOMY",
      subcategory: "indicators",
      closingHoursFromNow: 48,
      oracleType: "alpha-vantage",
      baselineFact: "현재 환율 1,395원",
    });

    const cls = await adapter.classify(`원/달러 환율 실시간\n${blueprint}`);
    expect(isSuccess(cls)).toBe(true);
    if (isSuccess(cls)) {
      expect(cls.data.classification).toBe(ContentClassification.PREDICTION);
    }

    const res = await adapter.generateDraft(
      `원/달러 환율 실시간\n${blueprint}`,
      ContentClassification.PREDICTION
    );
    expect(isSuccess(res)).toBe(true);
    if (isSuccess(res)) {
      expect(res.data.title).toContain("1,410원");
      expect(res.data.predictionDraft?.options).toEqual([
        "1,410원 이상 마감",
        "1,410원 미만 마감",
      ]);
      expect(res.data.predictionDraft?.oracleType).toBe("alpha-vantage");
    }
  });
});
