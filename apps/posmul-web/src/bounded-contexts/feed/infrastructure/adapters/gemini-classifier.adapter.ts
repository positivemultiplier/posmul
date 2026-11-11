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
  subcategory: string;
  predictionType: "BINARY" | "WIN_DRAW_LOSE" | "RANKING";
  options: string[];
  resolutionCriteria: string;
  closingHoursFromNow: number;
  settlementDelayHours: number;
  oracleType: string;
  oracleConfig: Record<string, unknown>;
}

const POLYMARKET_FALLBACK_SAMPLES: FallbackPredictionSample[] = [
  {
    title: "[금통위] 한국은행 차기 금융통화위원회 기준금리 결정은?",
    category: "ECONOMY",
    subcategory: "indicators",
    predictionType: "WIN_DRAW_LOSE",
    options: ["금리 동결 (Hold)", "금리 인하 (Cut)", "금리 인상 (Hike)"],
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
      optionMapping: { hold: "hold", cut: "cut", hike: "hike" },
    },
  },
  {
    title: "[실적공시] 삼성전자, 이번 분기 연결 영업이익 10조 원 돌파할까?",
    category: "ECONOMY",
    subcategory: "earnings",
    predictionType: "BINARY",
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
    subcategory: "indicators",
    predictionType: "BINARY",
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
    title: "[주말극장] 이번 주말 박스오피스 1위 최다 관객을 기록할 배급사·작품군은?",
    category: "ENTERTAINMENT",
    subcategory: "movie",
    predictionType: "RANKING",
    options: [
      "국내 대작 (CJ·쇼박스 등)",
      "할리우드 블록버스터",
      "일본·글로벌 애니메이션",
      "독립·예술 영화 및 기타",
    ],
    resolutionCriteria:
      "영화진흥위원회 영화관입장권통합전산망(KOBIS) 주말 박스오피스 주간 관객수 공식 1위 기준",
    closingHoursFromNow: 72,
    settlementDelayHours: 15,
    oracleType: "kobis",
    oracleConfig: {
      mode: "weekend_rank1_group",
      periodType: "weekend",
    },
  },
  {
    title: "[예능대전] 이번 주 일요일 프라임타임 지상파·종편 예능 시청률 1위는?",
    category: "ENTERTAINMENT",
    subcategory: "variety",
    predictionType: "WIN_DRAW_LOSE",
    options: ["SBS·KBS 지상파", "MBC 주말 예능", "tvN·JTBC 케이블/종편"],
    resolutionCriteria:
      "닐슨코리아 일요일 전국 가구 기준 프라임타임 예능 프로그램 최고 시청률 1위 방송사",
    closingHoursFromNow: 60,
    settlementDelayHours: 14,
    oracleType: "kcontent",
    oracleConfig: {
      subCategory: "variety_rating_rank1",
      metric: "nielsen_sunday_variety",
    },
  },
  {
    title: "[K-POP] 금주 멜론·써클 주간 디지털 차트 1위 예상 아티스트 군은?",
    category: "ENTERTAINMENT",
    subcategory: "music",
    predictionType: "RANKING",
    options: [
      "메이저 걸그룹 타이틀곡",
      "메이저 보이그룹 타이틀곡",
      "국내 솔로 음원 강자",
      "OST·인디·역주행 곡",
    ],
    resolutionCriteria:
      "써클차트 및 멜론 주간 디지털 종합 차트 공식 발표 1위 기준",
    closingHoursFromNow: 84,
    settlementDelayHours: 18,
    oracleType: "kcontent",
    oracleConfig: {
      subCategory: "music_chart_rank1",
      chartSource: "circle_melon_weekly",
    },
  },
  {
    title: "[빅매치] 금주 해외축구·대표팀 주요 맞대결 최종 승무패 결과는?",
    category: "SPORTS",
    subcategory: "soccer",
    predictionType: "WIN_DRAW_LOSE",
    options: ["홈팀 승리", "무승부", "원정팀 승리"],
    resolutionCriteria:
      "Football-Data 공식 90분 경기 결과(정규시간 + 추가시간 기준)",
    closingHoursFromNow: 48,
    settlementDelayHours: 4,
    oracleType: "football_data",
    oracleConfig: {
      competition: "EPL",
      market: "1X2",
    },
  },
  {
    title: "[소비트렌드] 올해 하반기 MZ세대 소비 지출 비중 1위 카테고리 전망은?",
    category: "INVEST",
    subcategory: "retail",
    predictionType: "RANKING",
    options: [
      "AI·테크 가전 구독",
      "해외여행·경험 소비",
      "프리미엄 외식·웰니스",
      "패션·뷰티 리셀/신상",
    ],
    resolutionCriteria:
      "통계청·한국은행 소비자동향 및 카드사 분기 업종별 소비 통계 1위 품목 기준",
    closingHoursFromNow: 144,
    settlementDelayHours: 24,
    oracleType: "kosis",
    oracleConfig: {
      indicatorCode: "RETAIL_SPEND_RANK",
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
  if (lower.includes("축구") || lower.includes("야구") || lower.includes("경기") || lower.includes("리그") || lower.includes("lck")) {
    return POLYMARKET_FALLBACK_SAMPLES[6]!;
  }
  if (lower.includes("소비") || lower.includes("유통") || lower.includes("트렌드") || lower.includes("투자")) {
    return POLYMARKET_FALLBACK_SAMPLES[7]!;
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
1. Title must be a concise 1-second proposition question ("~할까?", "~될까?", "1위는?", "승리팀은?").
2. Choose predictionType appropriately:
   - "BINARY": 2 options (Yes/No, 상승/하락, 돌파/미달).
   - "WIN_DRAW_LOSE": 3 options (스포츠 승/무/패, 금리 인상/동결/인하, 예능 3대 방송사 등 3지선다).
   - "RANKING": 4~5 options (박스오피스/음원/트렌드/대선 1위 후보 다자 경쟁).
3. Determine realistic closingHoursFromNow (hours until 1 hour BEFORE the event/announcement: e.g., daily market=24, weekend movie/drama=60, weekly chart/earnings=144).
4. Determine oracleType among: "ecos" (한국은행), "kosis" (통계청), "dart" (전자공시 실적), "kobis" (박스오피스), "kcontent" (드라마 시청률/음원차트), "fmp" (미국실적), "alpha-vantage" (환율/지수), "football_data" (축구), "manual".

Output JSON strictly:
{
  "title": "명제형 질문 제목",
  "summary": "핵심 내용 2문장 요약",
  "keywords": ["키워드1", "키워드2"],
  "predictionDraft": {
    "category": "ECONOMY | INVEST | SPORTS | ENTERTAINMENT | POLITICS",
    "subcategory": "indicators | earnings | stocks | crypto | movie | drama | variety | music | soccer | retail | legislation",
    "predictionType": "BINARY | WIN_DRAW_LOSE | RANKING",
    "resolutionCriteria": "검증 가능한 공식 발표 기관·지표·일시 1문장",
    "options": ["선택지1", "선택지2"],
    "closingHoursFromNow": 72,
    "settlementDelayHours": 12,
    "oracleType": "ecos | kosis | dart | kobis | kcontent | alpha-vantage | football_data | manual"
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
            subcategory: sample.subcategory,
            predictionType: sample.predictionType,
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
