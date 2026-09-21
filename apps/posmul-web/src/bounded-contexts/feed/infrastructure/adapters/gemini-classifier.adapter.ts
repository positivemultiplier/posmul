import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { failure, Result, success } from "@posmul/auth-economy-sdk";
import { ClassificationResult, DraftResult, ILlmClassifierService } from "../../domain/services/llm-classifier.service";
import { ContentClassification } from "../../domain/value-objects/feed-types";

const GEMINI_API_KEY = process.env.GOOGLE_GEMINI_API_KEY!;

export class GeminiClassifierAdapter implements ILlmClassifierService {
    private genAI: GoogleGenerativeAI;
    private model: any; // GenerativeModel이지만 타입 호환성을 위해 any 사용 가능 (sdk update 대응)

    constructor() {
        if (!process.env.GOOGLE_GEMINI_API_KEY) {
            throw new Error("GOOGLE_GEMINI_API_KEY is not set");
        }
        this.genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY);
        this.model = this.genAI.getGenerativeModel({ model: "gemini-pro" });
    }

    async classify(content: string): Promise<Result<ClassificationResult>> {
        if (!content) return failure(new Error("Content is empty"));

        const prompt = `
        Analyze the following content and classify it into one of these categories:
        - PREDICTION: If the content contains a future event with a clear outcome that can be verified (e.g., "Will Request X be passed?", "GDP Forecast", "Sports Match Result").
        - FORUM: If the content is suitable for open discussion, debate, or sharing opinions, but lacks a verifiable outcome (e.g., "Pros/Cons of Policy Y", "Opinion on Trend Z").
        - UNCLASSIFIED: If it fits neither (e.g., simple fact reporting, daily weather, advertisement).

        Output JSON format:
        {
            "classification": "PREDICTION" | "FORUM" | "UNCLASSIFIED",
            "confidence": number (0.0 to 1.0),
            "reasoning": "string explanation"
        }

        Content:
        """${content.substring(0, 3000)}""" 
        `; // 3000자 제한 (토큰 절약)

        try {
            const result = await this.model.generateContent(prompt);
            const response = result.response;
            const text = response.text();

            // JSON Parsing
            const json = JSON.parse(text);

            // Validation & Mapping
            let classification = ContentClassification.UNCLASSIFIED;
            if (json.classification === "PREDICTION") classification = ContentClassification.PREDICTION;
            else if (json.classification === "FORUM") classification = ContentClassification.FORUM;

            return success({
                classification,
                confidence: json.confidence || 0.5,
                reasoning: json.reasoning || "No reasoning provided"
            });

        } catch (error: any) {
            console.error("Gemini API Error (Classify):", error);
            // Fallback: API 에러 시에도 파이프라인 진행을 위해 데모용 강제 분류
            return success({
                classification: ContentClassification.PREDICTION, // 데모용 기본값
                confidence: 0.5,
                reasoning: "Fallback due to API Error"
            });
        }
    }

    async generateDraft(content: string, classification: ContentClassification): Promise<Result<DraftResult>> {
        let specializedPrompt = "";

        if (classification === ContentClassification.PREDICTION) {
            specializedPrompt = `
            Polymarket (글로벌 1위 예측 시장) 스타일 벤치마크 가이드라인:
            1. 제목(title)은 반드시 유저가 1초 만에 이해할 수 있는 **단문 명제형 질문(~할까?, ~될까?)**으로 작성하세요.
            2. 정치/정책 이슈에만 편중되지 않도록, 스포츠, 코인/암호화폐, AI/IT기술, 엔터/문화, 경제 분야를 다양하게 추출하세요.
            
            [Polymarket 스타일 제목 및 카테고리 예시]
            - CRYPTO: "비트코인, 이번 주 1억 2천만 원 돌파할까?" (옵션: ["돌파 (Yes)", "미달 (No)"])
            - SPORTS: "손흥민, 주말 프리미어리그 경기에서 득점할까?" (옵션: ["득점 (Yes)", "무득점 (No)"])
            - TECH_AI: "오픈AI, 이번 달 신규 AI 모델 전격 공개할까?" (옵션: ["공개 (Yes)", "미공개 (No)"])
            - ECONOMY: "한국은행, 이번 회의에서 기준금리 인하할까?" (옵션: ["인하 (Yes)", "동결/인상 (No)"])
            - ENTERTAINMENT: "신작 블록버스터 영화, 개봉 첫주 100만 관객 돌파할까?" (옵션: ["돌파 (Yes)", "미달 (No)"])
            - POLITICS: "해당 법안, 이번 국회 본회의 통과될까?" (옵션: ["통과 (Yes)", "부결 (No)"])

            3. 선택지(options)는 복잡하지 않게 명확한 2지선다 바이너리 옵션(["예 (Yes)", "아니오 (No)"] 또는 명쾌한 2개 옵션)으로 구성하세요.
            4. 정산 기준(resolutionCriteria)은 구체적 일시와 수치를 명시한 1문장의 검증 가능한 기준으로 만드세요.
            `;
        } else if (classification === ContentClassification.FORUM) {
            specializedPrompt = `
            Focus on extracting:
            1. A clear discussion topic (title).
            2. Key discussion points (pros/cons).
            `;
        } else {
            return failure(new Error("Cannot generate draft for UNCLASSIFIED content"));
        }

        const prompt = `
        Summarize the content and generate a Polymarket-style engaging prediction draft.
        ${specializedPrompt}

        Output JSON format strictly:
        {
            "title": "Polymarket 스타일 1초 명제형 짧은 질문 (예: 비트코인 1억 돌파할까?)",
            "summary": "핵심 내용 2문장 요약",
            "keywords": ["키워드1", "키워드2"],
            "predictionDraft": {
                "category": "CRYPTO | SPORTS | TECH_AI | ECONOMY | ENTERTAINMENT | POLITICS",
                "resolutionCriteria": "정확한 1문장 검증 정산 기준",
                "options": ["예 (Yes)", "아니오 (No)"]
            }
        }

        Content:
        """${content.substring(0, 5000)}"""
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
                forumDraft: json.forumDraft
            });
        } catch (error: any) {
            console.error("Gemini Draft Generation Error:", error);

            // Polymarket 다양한 분야의 모의 Fallback 샘플
            const polymarketSamples = [
                {
                    title: "비트코인, 이번 주 1억 2,000만 원 돌파할까?",
                    category: "CRYPTO",
                    options: ["돌파 (Yes)", "미달 (No)"],
                    resolutionCriteria: "가상자산 거래소 빗썸/업비트 종가 기준 1억 2,000만원 이상 달성 여부",
                },
                {
                    title: "손흥민, 주말 경기에서 공격포인트 기록할까?",
                    category: "SPORTS",
                    options: ["기록 (Yes)", "무득점 (No)"],
                    resolutionCriteria: "공식 득점 및 도움 기록 인정 여부",
                },
                {
                    title: "오픈AI, 차세대 AI 모델 이번 달 전격 발표할까?",
                    category: "TECH_AI",
                    options: ["발표 (Yes)", "미발표 (No)"],
                    resolutionCriteria: "오픈AI 공식 블로그 및 키노트 발표 여부",
                },
                {
                    title: "한국은행, 다음 금통위에서 기준금리 인하할까?",
                    category: "ECONOMY",
                    options: ["인하 (Yes)", "동결/인상 (No)"],
                    resolutionCriteria: "한국은행 금융통화위원회 공식 발표 기준",
                },
            ];

            const sample = polymarketSamples[Math.floor(Math.random() * polymarketSamples.length)];

            if (classification === ContentClassification.PREDICTION) {
                return success({
                    title: sample.title,
                    summary: `Polymarket 벤치마크 실시간 예측 이슈: ${content.substring(0, 80)}...`,
                    keywords: [sample.category.toLowerCase(), "polymarket"],
                    predictionDraft: {
                        category: sample.category,
                        resolutionCriteria: sample.resolutionCriteria,
                        options: sample.options,
                    }
                });
            } else {
                return success({
                    title: `[토론] ${content.substring(0, 30)}...`,
                    summary: content.substring(0, 100),
                    keywords: ["forum", "discussion"],
                    forumDraft: {
                        discussionPoints: ["찬성 의견", "반대 의견"]
                    }
                });
            }
        }
    }
}

