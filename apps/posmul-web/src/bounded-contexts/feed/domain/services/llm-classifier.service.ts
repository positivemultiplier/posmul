import { Result } from "@posmul/auth-economy-sdk";

import { ContentClassification } from "../value-objects/feed-types";

// 분류 결과 DTO
export interface ClassificationResult {
  classification: ContentClassification;
  confidence: number; // 0.0 ~ 1.0 (확신도)
  reasoning: string; // 분류 이유
}

// 요약 및 초안 생성 결과 DTO
export interface DraftResult {
  title: string;
  summary: string;
  keywords: string[];
  predictionDraft?: {
    category?: string;
    subcategory?: string;
    predictionType?: "BINARY" | "WIN_DRAW_LOSE" | "RANKING";
    resolutionCriteria: string;
    options: string[];
    /** 이벤트 발생/발표 1시간 전 마감까지 남은 시간(시간 단위, 예: 일간=24, 주말=72, 주간=168) */
    closingHoursFromNow?: number;
    /** 베팅 마감 후 공식 결과 정산까지 소요 시간(시간 단위, 기본 12~24) */
    settlementDelayHours?: number;
    /** 연동 오라클 소스 타입 ('ecos' | 'kosis' | 'dart' | 'kobis' | 'kcontent' | 'fmp' | 'alpha-vantage' | 'football_data' | 'manual') */
    oracleType?: string;
    /** 오라클 자동 정산용 메타 설정 */
    oracleConfig?: Record<string, unknown>;
  };
  forumDraft?: {
    discussionPoints: string[];
  };
}

export interface ILlmClassifierService {
  /**
   * 콘텐츠를 분석하여 카테고리(PREDICTION, FORUM, UNCLASSIFIED)를 분류합니다.
   */
  classify(content: string): Promise<Result<ClassificationResult>>;

  /**
   * 분류된 콘텐츠를 바탕으로 요약 및 초안을 생성합니다.
   */
  generateDraft(
    content: string,
    classification: ContentClassification
  ): Promise<Result<DraftResult>>;
}
