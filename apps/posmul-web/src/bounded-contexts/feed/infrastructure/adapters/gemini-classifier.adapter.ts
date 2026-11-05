import { GoogleGenerativeAI } from "@google/generative-ai";
import { failure, Result, success } from "@posmul/auth-economy-sdk";

import {
  ClassificationResult,
  DraftResult,
  ILlmClassifierService,
} from "../../domain/services/llm-classifier.service";
import { ContentClassification } from "../../domain/value-objects/feed-types";

interface FallbackPredictionSample {
  title: string;
  category: string;
  options: string[];
  resolutionCriteria: string;
  closingHoursFromNow: number;
  settlementDelayHours: number;
  oracleType: string;
  oracleConfig: Record<string, unknown>;
}

const POLYMARKET_FALLBACK_SAMPLES: FallbackPredictionSample[] = [
  {
    title: "[금통위] 한국은행, 차기 금융통화위원회에서 기준금리 인하할까?",
    category: "ECONOMY",
    options: ["인하 (Yes)", "동결·인상 (No)"],
    resolutionCriteria:
      "한국은행 금융통화위원회 통화정책방향 결정회의 공식 기준금리 발표치 기준 (ECOS 722Y001)",
    closingHoursFromNow: 120,
    settlementDelayHours: 2,
    oracleType: "ecos",
    oracleConfig: {
      statCode: "722Y001",
      cycle: "M",
      itemCode1: "0101000",
      comparisonType: "change_direction",
      optionMapping: { cut: "yes", hold: "no", hike: "no" },
    },
  },
  {
    title: "[실적공시] 삼성전자, 이번 분기 연결 영업이익 10조 원 돌파할까?",
    category: "INVEST",
    options: ["10조 초과 (Yes)", "10조 이하 (No)"],
    resolutionCriteria:
      "금융감독원 전자공시시스템(OpenDART) 삼성전자 분기보고서 연결재무제표 영업이익 기준",
    closingHoursFromNow: 168,
    settlementDelayHours: 24,
    oracleType: "dart",
    oracleConfig: {
      corpCode: "00126380",
      bsnsYear: "auto",
      reprtCode: "auto",
      accountName: "영업이익",
      comparisonType: "greater",
      threshold: 10_000_000_000_000,
      optionMapping: { above: "yes", below: "no" },
    },
  },
  {
    title: "[물가동향] 통계청 이번 달 소비자물가 상승률 2.5% 상회할까?",
    category: "ECONOMY",
    options: ["2.5% 초과 (Yes)", "2.5% 이하 (No)"],
    resolutionCriteria:
      "통계청 국가통계포털(KOSIS DT_1J22003) 소비자물가동향 전년동월대비 상승률 기준",
    closingHoursFromNow: 96,
    settlementDelayHours: 2,
    oracleType: "kosis",
    oracleConfig: {
      indicatorCode: "CPI_RATE",
      comparisonType: "greater",
      threshold: 2.5,
      optionMapping: { above: "yes", below: "no" },
    },
  },
  {
    title: "[주말극장] 이번 주말 박스오피스 1위 영화, 누적 관객 100만 돌파할까?",
    category: "ENTERTAINMENT",
    options: ["100만 돌파 (Yes)", "100만 미달 (No)"],
    resolutionCriteria:
      "영화진흥위원회 영화관입장권통합전산망(KOBIS) 주말 박스오피스 1위작 일요일 자정 누적 관객수 기준",
    closingHoursFromNow: 72,
    settlementDelayHours: 15,
    oracleType: "kobis",
    oracleConfig: {
      mode: "audience_threshold",
      periodType: "weekend",
      threshold: 1_000_000,
      optionMapping: { above: "yes", below: "no" },
    },
  },
  {
    title: "[주말드라마] 금토·주말 미니시리즈 전국 최고 시청률 12.0% 돌파할까?",
    category: "ENTERTAINMENT",
    options: ["12% 돌파 (Yes)", "12% 미만 (No)"],
    resolutionCriteria:
      "닐슨코리아 일일 전국 가구 기준 주말 미니시리즈 최고 시청률 12.0% 이상 기록 여부",
    closingHoursFromNow: 60,
    settlementDelayHours: 12,
    oracleType: "kcontent",
    oracleConfig: {
      subCategory: "drama_rating",
      threshold: 12.0,
      optionMapping: { above: "yes", below: "no" },
    },
  },
  {
    title: "[K-POP 음원] 금주 컴백 타이틀곡, 발매 24시간 내 멜론 TOP 10 진입할까?",
    category: "ENTERTAINMENT",
    options: ["TOP 10 진입 (Yes)", "11위 이하 (No)"],
    resolutionCriteria:
      "음원 발매 익일 멜론 TOP 100 및 써클차트 일간 디지털 차트 10위 이내 진입 여부",
    closingHoursFromNow: 48,
    settlementDelayHours: 24,
    oracleType: "kcontent",
    oracleConfig: {
      subCategory: "music_chart_top10",
      optionMapping: { above: "yes", below: "no" },
    },
  },
];

function selectContextualFallbackSample(
  content: string
): FallbackPredictionSample {
  const lower = content.toLowerCase();
  if (lower.includes("금리") || lower.includes("한국은행") || lower.includes("gdp")) {
    return POLYMARKET_FALLBACK_SAMPLES[0]!;
  }
  if (lower.includes("영업이익") || lower.includes("실적") || lower.includes("삼성") || lower.includes("dart")) {
    return POLYMARKET_FALLBACK_SAMPLES[1]!;
  }
  if (lower.includes("물가") || lower.includes("실업률") || lower.includes("통계청")) {
    return POLYMARKET_FALLBACK_SAMPLES[2]!;
  }
  if (lower.includes("박스오피스") || lower.includes("관객") || lower.includes("영화")) {
    return POLYMARKET_FALLBACK_SAMPLES[3]!;
  }
  if (lower.includes("드라마") || lower.includes("시청률") || lower.includes("예능")) {
    return POLYMARKET_FALLBACK_SAMPLES[4]!;
  }
  if (lower.includes("멜론") || lower.includes("k-pop") || lower.includes("빌보드") || lower.includes("음원")) {
    return POLYMARKET_FALLBACK_SAMPLES[5]!;
  }
  return POLYMARKET_FALLBACK_SAMPLES[
    Math.floor(Math.random() * POLYMARKET_FALLBACK_SAMPLES.length)
  ]!;
}

export class GeminiClassifierAdapter implements ILlmClassifierService {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor() {
    if (!process.env.GOOGLE_GEMINI_API_KEY) {
      throw new Error("GOOGLE_GEMINI_API_KEY is not set");
    }
    this.genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY);
    this.model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  }

  async classify(content: string): Promise<Result<ClassificationResult>> {
    if (!content) return failure(new Error("Content is empty"));

    const prompt = `
Analyze the following content and classify it into one of these categories:
- PREDICTION: If the content contains a future event or periodic indicator with a clear verifiable outcome (e.g., BOK Base Rate, DART Earnings, KOSIS CPI, Box Office #1, Drama Rating, Sports Match, Assembly Bill).
- FORUM: If the content is suitable for open citizen debate or policy discussion without a binary/numeric settlement metric.
- UNCLASSIFIED: Simple past fact reporting or ads.

Output JSON strictly:
{
  "classification": "PREDICTION" | "FORUM" | "UNCLASSIFIED",
  "confidence": 0.85,
  "reasoning": "string explanation"
}

Content:
"""${content.substring(0, 3000)}"""
`;

    try {
      const result = await this.model.generateContent(prompt);
      const text = result.response.text();
      const json = JSON.parse(text);

      let classification = ContentClassification.UNCLASSIFIED;
      if (json.classification === "PREDICTION") {
        classification = ContentClassification.PREDICTION;
      } else if (json.classification === "FORUM") {
        classification = ContentClassification.FORUM;
      }

      return success({
        classification,
        confidence: json.confidence || 0.7,
        reasoning: json.reasoning || "Classified by Gemini",
      });
    } catch {
      return success({
        classification: ContentClassification.PREDICTION,
        confidence: 0.6,
        reasoning: "Fallback classification",
      });
    }
  }

  async generateDraft(
    content: string,
    classification: ContentClassification
  ): Promise<Result<DraftResult>> {
    if (
      classification !== ContentClassification.PREDICTION &&
      classification !== ContentClassification.FORUM
    ) {
      return failure(
        new Error("Cannot generate draft for UNCLASSIFIED content")
      );
    }

    const prompt = `
Summarize the content and generate a standardized PosMul prediction game draft.
1. Title must be a concise 1-second proposition question ("~할까?", "~될까?").
2. Determine realistic closingHoursFromNow (hours until 1 hour BEFORE the event/announcement: e.g., daily market=24, weekend movie/drama=60, weekly chart/earnings=144).
3. Determine oracleType among: "ecos" (한국은행), "kosis" (통계청), "dart" (전자공시 실적), "kobis" (박스오피스), "kcontent" (드라마 시청률/음원차트), "fmp" (미국실적), "alpha-vantage" (환율/지수), "football_data" (축구), "manual".

Output JSON strictly:
{
  "title": "명제형 질문 제목",
  "summary": "핵심 내용 2문장 요약",
  "keywords": ["키워드1", "키워드2"],
  "predictionDraft": {
    "category": "ECONOMY | INVEST | SPORTS | ENTERTAINMENT | POLITICS",
    "resolutionCriteria": "검증 가능한 공식 발표 기관·지표·일시 1문장",
    "options": ["예 (Yes)", "아니오 (No)"],
    "closingHoursFromNow": 72,
    "settlementDelayHours": 12,
    "oracleType": "ecos | kosis | dart | kobis | kcontent | alpha-vantage | manual"
  }
}

Content:
"""${content.substring(0, 4000)}"""
`;

    try {
      const result = await this.model.generateContent(prompt);
      const text = result.response.text();
      const json = JSON.parse(text);

      return success({
        title: json.title,
        summary: json.summary,
        keywords: json.keywords ?? [],
        predictionDraft: json.predictionDraft,
        forumDraft: json.forumDraft,
      });
    } catch {
      const sample = selectContextualFallbackSample(content);

      if (classification === ContentClassification.PREDICTION) {
        return success({
          title: sample.title,
          summary: `${content.substring(0, 110)}...`,
          keywords: [sample.category.toLowerCase(), sample.oracleType],
          predictionDraft: {
            category: sample.category,
            resolutionCriteria: sample.resolutionCriteria,
            options: sample.options,
            closingHoursFromNow: sample.closingHoursFromNow,
            settlementDelayHours: sample.settlementDelayHours,
            oracleType: sample.oracleType,
            oracleConfig: sample.oracleConfig,
          },
        });
      }

      return success({
        title: `[시민 아고라] ${content.substring(0, 35)}...`,
        summary: content.substring(0, 120),
        keywords: ["forum", "agora"],
        forumDraft: {
          discussionPoints: ["찬성 측 핵심 논거", "반대 측 핵심 논거"],
        },
      });
    }
  }
}
