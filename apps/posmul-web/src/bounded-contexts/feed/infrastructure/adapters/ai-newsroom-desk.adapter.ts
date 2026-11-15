import { failure, Result, success } from "@posmul/auth-economy-sdk";
import {
  detectNewsRegionFromText,
  NewsArticleMetadata,
  NewsQuizItem,
  NewsSectionCategory,
} from "../../../forum/domain/value-objects/news-article.types";
import { ExaoneClient } from "./exaone-client";
import {
  GeminiClient,
  invokeLlmProviderJson,
  LlmProvider,
  resolveLlmOrder,
} from "./gemini-client";
import { OpenRouterClient } from "./openrouter-client";

export interface ComposeNewsInput {
  feedItemId?: string;
  title: string;
  rawSummary: string;
  link: string;
  sourceTitle: string;
  sourceCategory: string;
}

export interface ComposedNewsArticle {
  title: string;
  bodyMarkdown: string;
  tags: string[];
  regionCode: string;
  newsCategory: NewsSectionCategory;
  metadata: NewsArticleMetadata;
}

interface RawAiNewsJson {
  headline?: unknown;
  newsCategory?: unknown;
  districtHint?: unknown;
  threeLineSummary?: unknown;
  bodyMarkdown?: unknown;
  readTimeMinutes?: unknown;
  predictionHook?: unknown;
  factCheckNote?: unknown;
  quiz?: unknown;
  tags?: unknown;
}

function stripHtmlAndDecode(raw: string): string {
  return raw
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function inferDefaultCategory(sourceCategory: string, text: string): NewsSectionCategory {
  const cat = sourceCategory.toUpperCase();
  if (cat === "GWANGJU") return "gwangju";
  if (cat === "AI") return "ai";
  if (cat === "SPORTS") return "sports";
  if (cat === "ECONOMY") return "economy";

  if (/광주|전남|동구|서구|남구|북구|광산구|첨단|수완|상무/.test(text)) return "gwangju";
  if (/OpenAI|DeepMind|Anthropic|Hugging\s*Face|LLM|인공지능|\bAI\b|딥러닝|생성형/.test(text)) {
    return "ai";
  }
  if (/KIA|기아\s*타이거즈|광주FC|KBO|K리그|프리미어리그|야구|축구|경기/.test(text)) {
    return "sports";
  }
  return "economy";
}

function normalizeSectionCategory(
  rawCat: unknown,
  sourceCategory: string,
  text: string
): NewsSectionCategory {
  const s = String(rawCat ?? "").trim().toLowerCase();
  if (s === "gwangju" || s === "ai" || s === "economy" || s === "sports") {
    // 소스 카테고리가 GWANGJU나 AI로 명시되어 있으면 우선권을 존중
    if (sourceCategory.toUpperCase() === "GWANGJU" && s !== "sports") return "gwangju";
    if (sourceCategory.toUpperCase() === "AI") return "ai";
    return s;
  }
  return inferDefaultCategory(sourceCategory, text);
}

function sanitizeQuiz(rawQuiz: unknown, headline: string, summaryLines: string[]): NewsQuizItem[] {
  const items: NewsQuizItem[] = [];
  if (Array.isArray(rawQuiz)) {
    rawQuiz.slice(0, 2).forEach((entry, idx) => {
      if (typeof entry !== "object" || entry === null) return;
      const obj = entry as Record<string, unknown>;
      const question = String(obj.question ?? "").trim();
      const rawOptions = Array.isArray(obj.options)
        ? obj.options.map((o) => String(o).trim()).filter(Boolean)
        : [];
      const ansRaw = Number(obj.answerIndex);
      const explanation = String(obj.explanation ?? "").trim();

      if (question.length >= 6 && rawOptions.length === 4 && Number.isInteger(ansRaw) && ansRaw >= 0 && ansRaw < 4) {
        items.push({
          id: idx + 1,
          question,
          options: rawOptions,
          answerIndex: ansRaw,
          explanation: explanation || "기사 핵심 내용을 다시 확인해 보세요.",
        });
      }
    });
  }

  if (items.length === 0) {
    const firstLine = summaryLines[0] || headline;
    items.push({
      id: 1,
      question: `다음 중 '${headline.slice(0, 28)}...' 브리핑의 핵심 내용으로 가장 알맞은 것은?`,
      options: [
        firstLine.slice(0, 60),
        "관련 기관의 공식 발표나 자료가 전혀 확인되지 않았다",
        "모든 일정과 수치가 전면 백지화되었다",
        "해당 사안은 해외 기업이 단독으로 전면 중단했다",
      ],
      answerIndex: 0,
      explanation: `원천 자료 핵심 요약: ${firstLine}`,
    });
  }

  return items;
}

/**
 * PosMul AI 언론사 데스크 어댑터
 * - 원천 자료(공공 보도자료/공식 블로그/뉴스 피드)를 기반으로 과장·추측 없는 사실 기반 브리핑과 이해 퀴즈를 생성합니다.
 */
export class AiNewsroomDeskAdapter {
  private readonly exaone: ExaoneClient;
  private readonly gemini: GeminiClient;
  private readonly openrouter: OpenRouterClient;

  constructor() {
    this.exaone = new ExaoneClient();
    this.gemini = new GeminiClient();
    this.openrouter = new OpenRouterClient();
  }

  public async composeNewsBriefing(
    input: ComposeNewsInput
  ): Promise<Result<ComposedNewsArticle>> {
    const cleanSummary = stripHtmlAndDecode(input.rawSummary || "");
    const cleanTitle = stripHtmlAndDecode(input.title || "");
    const combinedText = `${cleanTitle}\n${cleanSummary}\n${input.sourceTitle}`;

    const providers: LlmProvider[] = resolveLlmOrder(
      combinedText,
      this.exaone,
      this.gemini,
      this.openrouter
    );

    if (providers.length === 0) {
      return failure(
        new Error(
          "No LLM provider configured (GOOGLE_GEMINI_API_KEY / EXAONE_API_KEY / OPENROUTER_API_KEY)"
        )
      );
    }

    const systemPrompt = [
      "당신은 시민 공론장·예측 플랫폼 'PosMul AI 언론사'의 수석 데스크입니다.",
      "주어진 1차 원천 제목과 요약·출처를 바탕으로 독자가 2분 안에 맥락과 의미를 이해할 수 있는 한국어 뉴스 브리핑을 작성하세요.",
      "",
      "[절대 준수 팩트·저작권 규칙]",
      "1. 원천 텍스트에 없는 구체적 수치·날짜·발언·통계를 절대 지어내지 마세요(환각 엄금).",
      "2. 원천 텍스트의 문장을 그대로 복붙하지 말고, 시민의 눈높이에서 배경과 의미를 재구성해 쉽게 풀어쓰세요.",
      "3. 영문 원문(OpenAI/DeepMind/HuggingFace 등)은 정확한 한국어로 번역·해설하세요.",
      "4. 공공기관 보도자료의 경우 홍보성·미사여구를 걷어내고, 실제 지원 대상·예산·신청 기간·기대 효과와 한계를 시민 관점에서 객관적으로 정리하세요.",
      "5. 광주광역시(동구·서구·남구·북구·광산구)·전라남도 이슈는 'gwangju', AI 기술/모델은 'ai', 경제·재정·정책·부동산은 'economy', KIA 타이거즈·광주FC·경기는 'sports'로 분류하세요.",
      "6. 퀴즈(quiz)는 반드시 작성한 본문 내용만으로 정확히 답을 고를 수 있는 4지선다 2문항을 만드세요.",
      "",
      "[출력 JSON 스키마 - JSON 외 텍스트 금지]",
      "{",
      '  "headline": "명확하고 신뢰감 있는 한국어 뉴스 제목 (20~55자, 낚시성 금지)",',
      '  "newsCategory": "gwangju" | "ai" | "economy" | "sports",',
      '  "districtHint": "동구" | "서구" | "남구" | "북구" | "광산구" | "광주" | "전남" | "전국",',
      '  "threeLineSummary": ["핵심 요약 1문장", "핵심 요약 2문장", "핵심 요약 3문장"],',
      '  "bodyMarkdown": "## 핵심 내용\\n...\\n\\n## 왜 주목해야 할까\\n...\\n\\n## 우리 동네·일상에 미치는 영향\\n...",',
      '  "readTimeMinutes": 3,',
      '  "predictionHook": "이 이슈와 연결해 시민이 예측해볼 만한 열린 질문 1문장",',
      '  "factCheckNote": "원천 자료 범위 내에서 확인된 핵심 사실 요약 1문장",',
      '  "tags": ["키워드1", "키워드2", "키워드3"],',
      '  "quiz": [',
      "    {",
      '      "question": "본문 기반 이해도 질문 1",',
      '      "options": ["보기1", "보기2", "보기3", "보기4"],',
      '      "answerIndex": 0,',
      '      "explanation": "정답 해설 1문장"',
      "    },",
      "    {",
      '      "question": "본문 기반 이해도 질문 2",',
      '      "options": ["보기1", "보기2", "보기3", "보기4"],',
      '      "answerIndex": 1,',
      '      "explanation": "정답 해설 1문장"',
      "    }",
      "  ]",
      "}",
    ].join("\n");

    const userPrompt = [
      `출처: ${input.sourceTitle} (카테고리 힌트: ${input.sourceCategory})`,
      `원문 제목: ${cleanTitle}`,
      `원문 요약: ${cleanSummary || "(요약 없음 - 제목과 출처 범위 안에서만 보수적으로 맥락을 설명하고, 확인되지 않은 세부 수치는 추측하지 마세요)"}`,
      `원문 링크: ${input.link}`,
    ].join("\n");

    let lastErr: Error | null = null;
    for (const provider of providers) {
      try {
        const raw = await invokeLlmProviderJson<RawAiNewsJson>(
          provider,
          {
            exaone: this.exaone,
            gemini: this.gemini,
            openrouter: this.openrouter,
          },
          systemPrompt,
          userPrompt,
          {
            temperature: 0.2,
            exaoneMaxTokens: 2200,
            openrouterMaxTokens: 3200,
            timeoutMs: 25000,
          }
        );

        const headline = String(raw.headline ?? cleanTitle).trim() || cleanTitle;
        const rawSummaryLines = Array.isArray(raw.threeLineSummary)
          ? raw.threeLineSummary.map((s) => String(s).trim()).filter(Boolean).slice(0, 3)
          : [];
        const threeLineSummary =
          rawSummaryLines.length > 0
            ? rawSummaryLines
            : [cleanSummary || headline];

        const bodyCore = String(raw.bodyMarkdown ?? "").trim();
        if (bodyCore.length < 60) {
          throw new Error("Generated article body is too short");
        }

        const newsCategory = normalizeSectionCategory(
          raw.newsCategory,
          input.sourceCategory,
          `${headline} ${cleanSummary} ${input.sourceTitle}`
        );

        const districtHint = String(raw.districtHint ?? "").trim();
        const regionSourceHint = /로컬 뉴스|보도자료|구청|시청|도청/.test(
          input.sourceTitle
        )
          ? input.sourceTitle
          : "";
        const region = detectNewsRegionFromText(
          `${regionSourceHint} ${headline} ${cleanSummary} ${bodyCore}`,
          districtHint
        );

        const quiz = sanitizeQuiz(raw.quiz, headline, threeLineSummary);
        const readTimeRaw = Number(raw.readTimeMinutes);
        const readTimeMinutes =
          Number.isFinite(readTimeRaw) && readTimeRaw >= 1 && readTimeRaw <= 15
            ? Math.round(readTimeRaw)
            : 3;

        const tags = Array.isArray(raw.tags)
          ? raw.tags.map((t) => String(t).trim()).filter(Boolean).slice(0, 5)
          : [];
        if (!tags.includes("AI언론사")) tags.unshift("AI언론사");

        const aiModelLabel =
          provider === "gemini"
            ? this.gemini.getPrimaryModelName()
            : provider === "exaone"
            ? "LG EXAONE"
            : "OpenRouter";

        const factCheckNote =
          String(raw.factCheckNote ?? "").trim() ||
          `${input.sourceTitle} 원천 자료의 사실관계를 기반으로 정리되었으며, 세부 수치는 원문 링크를 통해 교차 확인할 수 있습니다.`;

        const predictionHook = String(raw.predictionHook ?? "").trim() || undefined;

        const fullBodyMarkdown = [
          bodyCore,
          "",
          "---",
          `> **출처 및 편집 투명성 안내**: 본 브리핑은 **${input.sourceTitle}** 자료를 바탕으로 PosMul AI 데스크(${aiModelLabel})가 핵심 맥락을 정리했습니다. 원문 확인: [원천 기사 바로가기](${input.link})`,
        ].join("\n");

        const metadata: NewsArticleMetadata = {
          version: 1,
          newsCategory,
          regionCode: region.regionCode,
          regionName: region.regionName,
          sourceName: input.sourceTitle || "공식 피드",
          sourceUrl: input.link,
          feedItemId: input.feedItemId,
          threeLineSummary,
          readTimeMinutes,
          pmpReward: 20,
          quiz,
          predictionHook,
          aiModel: aiModelLabel,
          factCheckNote,
          isAiDesk: true,
        };

        return success({
          title: headline,
          bodyMarkdown: fullBodyMarkdown,
          tags,
          regionCode: region.regionCode,
          newsCategory,
          metadata,
        });
      } catch (err: unknown) {
        lastErr = err instanceof Error ? err : new Error(String(err));
      }
    }

    return failure(lastErr ?? new Error("All LLM providers failed to compose news article"));
  }
}
