import { ExaoneClient } from "@/bounded-contexts/feed/infrastructure/adapters/exaone-client";
import { GeminiClient } from "@/bounded-contexts/feed/infrastructure/adapters/gemini-client";
import { supabaseAdmin } from "@/lib/supabase/admin";

import { IOracleProvider } from "../../domain/services/oracle/oracle.interface";
import {
  OracleResult,
  SettlementSource,
} from "../../domain/value-objects/settlement-types";

export interface RssAiOracleConfig {
  /** 검색 키워드 목록 (쉼표 또는 배열) */
  keywords?: string[] | string;
  /** 예측 게임 제목 */
  title?: string;
  /** 정산 판정 기준 설명 */
  resolutionCriteria?: string;
  /** 선택지 목록 */
  options?: Array<{ id: string; label: string }>;
  /** 최소 신뢰도 임계치 (기본 0.85) */
  minConfidence?: number;
  /** true일 때만 크론 자동 정산 허용 (기본 false = 반자동 관리자 승인) */
  allowAutoSettle?: boolean;
}

export interface RssMatchedArticle {
  id: string;
  title: string;
  link: string;
  summary: string;
  publishedAt: string | null;
  matchScore: number;
}

export interface RssAiEvaluationResult {
  resolved: boolean;
  winningOptionId: string | null;
  confidence: number;
  rationale: string;
  provider: string;
  keywordsUsed: string[];
  evidenceArticles: RssMatchedArticle[];
  checkedAt: string;
}

interface LlmVerdictJson {
  resolved?: boolean;
  winningOptionId?: string | null;
  confidence?: number;
  rationale?: string;
}

function parseKeywords(config: RssAiOracleConfig, fallbackTitle?: string): string[] {
  const raw = config.keywords;
  let tokens: string[] = [];

  if (Array.isArray(raw)) {
    tokens = raw.map((item) => String(item).trim());
  } else if (typeof raw === "string") {
    tokens = raw.split(/[,\n]+/).map((item) => item.trim());
  }

  const cleaned = tokens.filter((t) => t.length >= 2);
  if (cleaned.length > 0) return cleaned.slice(0, 8);

  if (!fallbackTitle) return [];
  return fallbackTitle
    .replace(/\[[^\]]*\]/g, " ")
    .replace(/[?!.,"'()]/g, " ")
    .split(/\s+/)
    .map((w) => w.trim())
    .filter((w) => w.length >= 2)
    .slice(0, 6);
}

function scoreArticle(
  article: { title?: string | null; content_summary?: string | null },
  keywords: string[]
): number {
  const haystack = `${article.title ?? ""} ${article.content_summary ?? ""}`.toLowerCase();
  let score = 0;
  for (const kw of keywords) {
    if (haystack.includes(kw.toLowerCase())) {
      score += 1;
    }
  }
  return score;
}

function normalizeOptions(
  raw?: Array<{ id?: string; label?: string } | string>
): Array<{ id: string; label: string }> {
  if (!raw || raw.length === 0) {
    return [
      { id: "yes", label: "예 (Yes)" },
      { id: "no", label: "아니오 (No)" },
    ];
  }
  return raw.map((item, idx) => {
    if (typeof item === "string") {
      return { id: item, label: item };
    }
    return {
      id: String(item.id || `opt_${idx}`),
      label: String(item.label || item.id || `옵션 ${idx + 1}`),
    };
  });
}

/**
 * RSS 피드 기사 + LLM 기반 반자동 판정 오라클 어댑터 (`rss_ai`)
 * - 수집된 `feed.items`에서 키워드 매칭 기사들을 추출하고 LLM으로 승리 옵션 및 신뢰도·근거를 추론합니다.
 */
export class RssAiOracleAdapter implements IOracleProvider {
  supports(sourceType: string): boolean {
    return sourceType === "rss_ai";
  }

  /**
   * RSS 기사 매칭 + LLM 판정 분석 (미확정 시에도 근거 기사 목록 및 분석 사유 반환)
   */
  async evaluateEvidence(source: SettlementSource): Promise<RssAiEvaluationResult> {
    const config = (source.sourceConfig || {}) as unknown as RssAiOracleConfig;
    let gameTitle = config.title || "";
    let gameOptions = normalizeOptions(config.options);
    let resolutionCriteria = config.resolutionCriteria || "";

    // gameId가 유효 UUID이고 title/options가 비어있다면 DB에서 보완
    if (source.gameId && source.gameId !== "preview" && (!gameTitle || !config.options)) {
      const { data: gameRow } = await supabaseAdmin
        .schema("prediction")
        .from("prediction_games")
        .select("title, description, game_options")
        .eq("game_id", source.gameId)
        .maybeSingle();

      if (gameRow) {
        if (!gameTitle) gameTitle = String(gameRow.title || "");
        if (!resolutionCriteria) resolutionCriteria = String(gameRow.description || "");
        const rawOpts = (gameRow.game_options as { options?: unknown[] } | null)?.options;
        if (!config.options && Array.isArray(rawOpts) && rawOpts.length >= 2) {
          gameOptions = normalizeOptions(
            rawOpts as Array<{ id?: string; label?: string } | string>
          );
        }
      }
    }

    const keywordsUsed = parseKeywords(config, gameTitle);
    const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();

    const { data: feedRows, error } = await supabaseAdmin
      .schema("feed")
      .from("items")
      .select("id, title, link, content_summary, published_at, created_at")
      .gte("created_at", twoWeeksAgo)
      .order("published_at", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false })
      .limit(120);

    if (error || !feedRows || feedRows.length === 0) {
      return {
        resolved: false,
        winningOptionId: null,
        confidence: 0,
        rationale: "최근 14일 내 수집된 RSS 기사가 없어 판정할 수 없습니다.",
        provider: "rss_ai",
        keywordsUsed,
        evidenceArticles: [],
        checkedAt: new Date().toISOString(),
      };
    }

    const scored = feedRows
      .map((row) => ({
        id: String(row.id),
        title: String(row.title || ""),
        link: String(row.link || ""),
        summary: String(row.content_summary || "").slice(0, 320),
        publishedAt: row.published_at ? String(row.published_at) : null,
        matchScore: keywordsUsed.length > 0 ? scoreArticle(row, keywordsUsed) : 0,
      }))
      .filter((item) => (keywordsUsed.length > 0 ? item.matchScore > 0 : true))
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 6);

    if (scored.length === 0) {
      return {
        resolved: false,
        winningOptionId: null,
        confidence: 0,
        rationale: `키워드 [${keywordsUsed.join(", ")}]와 일치하는 최신 RSS 기사가 아직 없습니다.`,
        provider: "rss_ai",
        keywordsUsed,
        evidenceArticles: [],
        checkedAt: new Date().toISOString(),
      };
    }

    const systemPrompt = [
      "당신은 PosMul 예측 마켓의 객관적 뉴스 오라클 판정관입니다.",
      "제공된 RSS 기사 제목과 요약만을 근거로 예측 질문의 결과가 확정되었는지 판단하세요.",
      "추측·전망 기사는 확정으로 보지 말고, 명확한 사실이 기사에서 확인될 때만 resolved=true를 반환하세요.",
      '반드시 JSON만 출력하세요: {"resolved": boolean, "winningOptionId": string | null, "confidence": number, "rationale": string}',
    ].join("\n");

    const userPrompt = [
      `예측 질문: ${gameTitle || "(제목 없음)"}`,
      resolutionCriteria ? `정산 기준: ${resolutionCriteria}` : "",
      `선택지 목록 (반드시 아래 id 중 하나를 winningOptionId로 사용):`,
      ...gameOptions.map((o) => `- id: "${o.id}" | label: "${o.label}"`),
      "",
      "수집된 최신 RSS 기사:",
      ...scored.map(
        (a, idx) =>
          `[${idx + 1}] (${a.publishedAt ?? "날짜미상"}) ${a.title}\n요약: ${a.summary}\n링크: ${a.link}`
      ),
    ]
      .filter(Boolean)
      .join("\n");

    const gemini = new GeminiClient();
    const exaone = new ExaoneClient();
    let verdict: LlmVerdictJson | null = null;
    let usedProvider = "none";

    if (gemini.isConfigured()) {
      try {
        verdict = await gemini.generateJson<LlmVerdictJson>(systemPrompt, userPrompt, 15000, 0.1);
        usedProvider = `rss_ai:${gemini.getPrimaryModelName()}`;
      } catch {
        verdict = null;
      }
    }

    if (!verdict && exaone.isConfigured()) {
      try {
        verdict = await exaone.generateJson<LlmVerdictJson>(systemPrompt, userPrompt, {
          timeoutMs: 9000,
          temperature: 0.1,
        });
        usedProvider = "rss_ai:exaone";
      } catch {
        verdict = null;
      }
    }

    if (!verdict) {
      return {
        resolved: false,
        winningOptionId: null,
        confidence: 0,
        rationale: "매칭된 RSS 기사는 찾았으나 LLM 판정 API 호출에 실패했거나 키가 설정되지 않았습니다.",
        provider: "rss_ai:no-llm",
        keywordsUsed,
        evidenceArticles: scored,
        checkedAt: new Date().toISOString(),
      };
    }

    const validOptionIds = new Set(gameOptions.map((o) => o.id));
    const candidateOpt = verdict.winningOptionId ? String(verdict.winningOptionId) : null;
    const isValidOption = Boolean(candidateOpt && validOptionIds.has(candidateOpt));
    const confidence = Math.min(1, Math.max(0, Number(verdict.confidence ?? 0)));

    return {
      resolved: Boolean(verdict.resolved) && isValidOption,
      winningOptionId: isValidOption ? candidateOpt : null,
      confidence,
      rationale: String(verdict.rationale || "근거 요약 없음"),
      provider: usedProvider,
      keywordsUsed,
      evidenceArticles: scored,
      checkedAt: new Date().toISOString(),
    };
  }

  async fetchResult(source: SettlementSource): Promise<OracleResult | null> {
    const config = (source.sourceConfig || {}) as unknown as RssAiOracleConfig;
    const minConfidence = Number(config.minConfidence ?? 0.85);
    const evalRes = await this.evaluateEvidence(source);

    if (!evalRes.resolved || !evalRes.winningOptionId || evalRes.confidence < minConfidence) {
      return null;
    }

    return {
      winningOptionId: evalRes.winningOptionId,
      sourceData: {
        provider: evalRes.provider,
        keywordsUsed: evalRes.keywordsUsed,
        rationale: evalRes.rationale,
        evidenceArticles: evalRes.evidenceArticles,
        checkedAt: evalRes.checkedAt,
      },
      confidence: evalRes.confidence,
      fetchedAt: new Date(),
    };
  }
}

