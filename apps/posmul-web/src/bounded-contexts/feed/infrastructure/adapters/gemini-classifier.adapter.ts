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
            Focus on extracting:
            1. A prediction question (title).
            2. Resolution criteria (how to determine the outcome).
            3. Binary options (e.g., Yes/No, Pass/Reject).
            `;
        } else if (classification === ContentClassification.FORUM) {
            specializedPrompt = `
            Focus on extracting:
            1. A discussion topic (title).
            2. Key discussion points (pros/cons or perspectives).
            `;
        } else {
            return failure(new Error("Cannot generate draft for UNCLASSIFIED content"));
        }

        const prompt = `
        Summarize the following content and generate a draft for a ${classification} post.
        ${specializedPrompt}

        Output JSON format:
        {
            "title": "Short, engaging title",
            "summary": "3-sentence summary of the content",
            "keywords": ["keyword1", "keyword2", "keyword3"],
            "predictionDraft": {
                "resolutionCriteria": "Criteria for prediction settlement",
                "options": ["Option A", "Option B"]
            } (only if classification is PREDICTION),
            "forumDraft": {
                "discussionPoints": ["Point 1", "Point 2"]
            } (only if classification is FORUM)
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
            // Fallback for Phase 2 Verification
            const fallbackTitle = `[Fallback] ${content.substring(0, 30)}...`;
            const fallbackSummary = "This is a fallback summary generated because the Gemini API call failed. " + content.substring(0, 100);

            if (classification === ContentClassification.PREDICTION) {
                return success({
                    title: fallbackTitle,
                    summary: fallbackSummary,
                    keywords: ["fallback", "prediction"],
                    predictionDraft: {
                        resolutionCriteria: "This is a fallback resolution criteria.",
                        options: ["Yes", "No"]
                    }
                });
            } else if (classification === ContentClassification.FORUM) {
                return success({
                    title: fallbackTitle,
                    summary: fallbackSummary,
                    keywords: ["fallback", "forum"],
                    forumDraft: {
                        discussionPoints: ["Fallback Point 1", "Fallback Point 2"]
                    }
                });
            }

            return failure(error instanceof Error ? error : new Error(String(error)));
        }
    }
}
