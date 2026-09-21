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
    summary: string; // 3줄 요약
    keywords: string[]; // 핵심 키워드 3~5개
    predictionDraft?: {
        category?: string;
        resolutionCriteria: string; // 판정 기준
        options: string[]; // 선택지 (예/아니오 등)
    };
    forumDraft?: {
        discussionPoints: string[]; // 토론 포인트
    };
}

export interface ILlmClassifierService {
    /**
     * 콘텐츠를 분석하여 카테고리(PREDICTION, FORUM, UNCLASSIFIED)를 분류합니다.
     * @param content 원문 텍스트 (제목 + 본문)
     */
    classify(content: string): Promise<Result<ClassificationResult>>;

    /**
     * 분류된 콘텐츠를 바탕으로 요약 및 초안을 생성합니다.
     * @param content 원문 텍스트
     * @param classification 확정된 분류 (Prompt 최적화용)
     */
    generateDraft(content: string, classification: ContentClassification): Promise<Result<DraftResult>>;
}
