import { supabaseAdmin } from "../../../../lib/supabase/admin";
import { grantForumPmpWithDailyCap } from "../../../../app/forum/forum-pmp-ledger";
import type { ComposedNewsArticle } from "../../../feed/infrastructure/adapters/ai-newsroom-desk.adapter";
import {
  getNewsCategoryMeta,
  getShortRegionLabel,
  NewsArticleDetail,
  NewsArticleListItem,
  NewsArticleMetadata,
  NewsQuizItem,
  NewsSectionCategory,
  normalizeNewsCategoryFilter,
} from "../../domain/value-objects/news-article.types";

const SYSTEM_USER_ID = "00000000-0000-0000-0000-000000000001";
const GWANGJU_ALL_CODES = new Set(["29000", "29110", "29140", "29155", "29170", "29200", "46000"]);

const CATEGORY_NAME_MAP: Record<NewsSectionCategory, string[]> = {
  ai: ["기술 토론", "일반 토론"],
  gwangju: ["정책 토론", "일반 토론"],
  economy: ["정책 토론", "일반 토론"],
  sports: ["일반 토론"],
};

interface ForumPostNewsRow {
  id: string;
  category_id: string;
  author_id: string;
  title: string;
  content: string;
  tags: string[] | null;
  status: string;
  view_count: number | null;
  like_count: number | null;
  comment_count: number | null;
  region_code: string | null;
  section: string | null;
  metadata: unknown;
  created_at: string | null;
  updated_at: string | null;
}

export interface DraftNewsArticleItem {
  id: string;
  title: string;
  category: NewsSectionCategory;
  regionCode: string;
  regionName: string;
  sourceName: string;
  sourceUrl: string;
  threeLineSummary: string[];
  quizCount: number;
  aiModel: string;
  factCheckNote: string;
  createdAt: string;
}

export interface QuizSubmissionResult {
  success: boolean;
  alreadySolved?: boolean;
  totalQuestions: number;
  correctCount: number;
  awardedPmp: number;
  dailyRemaining: number;
  quizResults: Array<{
    id: number;
    question: string;
    selectedIndex: number;
    answerIndex: number;
    isCorrect: boolean;
    explanation: string;
  }>;
  error?: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parseNewsMetadata(raw: unknown, rowRegionCode?: string | null): NewsArticleMetadata {
  const rec = isRecord(raw) ? raw : {};
  const categoryNorm = normalizeNewsCategoryFilter(
    typeof rec.newsCategory === "string" ? rec.newsCategory : "economy"
  );
  const newsCategory: NewsSectionCategory =
    categoryNorm === "all" ? "economy" : categoryNorm;

  const regionCode =
    (typeof rec.regionCode === "string" && rec.regionCode) || rowRegionCode || "KR";
  const regionName =
    (typeof rec.regionName === "string" && rec.regionName) ||
    getShortRegionLabel(regionCode);

  const threeLineSummary = Array.isArray(rec.threeLineSummary)
    ? rec.threeLineSummary.map((s) => String(s)).filter(Boolean)
    : [];

  const quiz: NewsQuizItem[] = Array.isArray(rec.quiz)
    ? rec.quiz
        .map((q, idx): NewsQuizItem | null => {
          if (!isRecord(q)) return null;
          const question = typeof q.question === "string" ? q.question : "";
          const options = Array.isArray(q.options)
            ? q.options.map((o) => String(o)).filter(Boolean)
            : [];
          const answerIndex = Number(q.answerIndex ?? q.answer ?? 0);
          const explanation = typeof q.explanation === "string" ? q.explanation : "";
          if (!question || options.length < 2) return null;
          return {
            id: typeof q.id === "number" ? q.id : idx + 1,
            question,
            options,
            answerIndex: Number.isInteger(answerIndex) ? answerIndex : 0,
            explanation,
          };
        })
        .filter((item): item is NewsQuizItem => item !== null)
    : [];

  return {
    version: Number(rec.version) || 1,
    newsCategory,
    regionCode,
    regionName,
    sourceName: typeof rec.sourceName === "string" ? rec.sourceName : "PosMul AI 데스크",
    sourceUrl: typeof rec.sourceUrl === "string" ? rec.sourceUrl : "",
    feedItemId: typeof rec.feedItemId === "string" ? rec.feedItemId : undefined,
    threeLineSummary,
    readTimeMinutes: Number(rec.readTimeMinutes) || 3,
    pmpReward: Number(rec.pmpReward) || 20,
    quiz,
    predictionHook: typeof rec.predictionHook === "string" ? rec.predictionHook : undefined,
    aiModel: typeof rec.aiModel === "string" ? rec.aiModel : "Gemini",
    factCheckNote:
      typeof rec.factCheckNote === "string"
        ? rec.factCheckNote
        : "공식·1차 자료를 바탕으로 PosMul AI 데스크가 요약했습니다.",
    isAiDesk: true,
  };
}

function mapRowToListItem(row: ForumPostNewsRow): NewsArticleListItem {
  const meta = parseNewsMetadata(row.metadata, row.region_code);
  const catMeta = getNewsCategoryMeta(meta.newsCategory);
  const createdMs = row.created_at ? new Date(row.created_at).getTime() : 0;
  const isNew = createdMs > 0 && Date.now() - createdMs < 48 * 60 * 60 * 1000;

  return {
    id: row.id,
    title: row.title,
    summary: meta.threeLineSummary[0] || row.content.slice(0, 140).replace(/[#>*`]/g, ""),
    category: meta.newsCategory,
    categoryLabel: catMeta.shortLabel,
    regionCode: meta.regionCode,
    regionName: getShortRegionLabel(meta.regionCode, meta.regionName),
    sourceName: meta.sourceName,
    sourceUrl: meta.sourceUrl,
    publishedAt: row.created_at || new Date().toISOString(),
    readTimeMinutes: meta.readTimeMinutes,
    viewCount: row.view_count ?? 0,
    commentCount: row.comment_count ?? 0,
    likeCount: row.like_count ?? 0,
    pmpReward: meta.pmpReward,
    hasQuiz: meta.quiz.length > 0,
    quizCount: meta.quiz.length,
    threeLineSummary: meta.threeLineSummary,
    isNew,
    isAiDesk: meta.isAiDesk,
  };
}

export class SupabaseNewsRepository {
  private async resolveCategoryId(newsCategory: NewsSectionCategory): Promise<string> {
    const { data } = await supabaseAdmin
      .schema("forum")
      .from("forum_categories")
      .select("id, name");

    const rows = (data || []) as Array<{ id: string; name: string }>;
    const preferredNames = CATEGORY_NAME_MAP[newsCategory];
    for (const targetName of preferredNames) {
      const hit = rows.find((r) => r.name === targetName);
      if (hit) return hit.id;
    }
    if (rows[0]) return rows[0].id;
    throw new Error("forum.forum_categories has no category rows");
  }

  public async findExistingNewsBySource(params: {
    feedItemId?: string;
    sourceUrl?: string;
  }): Promise<string | null> {
    if (params.feedItemId) {
      const { data } = await supabaseAdmin
        .schema("forum")
        .from("forum_posts")
        .select("id")
        .eq("section", "NEWS")
        .contains("metadata", { feedItemId: params.feedItemId })
        .limit(1);
      if (data && data.length > 0) return String(data[0].id);
    }

    if (params.sourceUrl) {
      const { data } = await supabaseAdmin
        .schema("forum")
        .from("forum_posts")
        .select("id")
        .eq("section", "NEWS")
        .contains("metadata", { sourceUrl: params.sourceUrl })
        .limit(1);
      if (data && data.length > 0) return String(data[0].id);
    }

    return null;
  }

  public async createNewsArticle(params: {
    composed: ComposedNewsArticle;
    status: "draft" | "published";
  }): Promise<{ id: string; alreadyExists: boolean }> {
    const existingId = await this.findExistingNewsBySource({
      feedItemId: params.composed.metadata.feedItemId,
      sourceUrl: params.composed.metadata.sourceUrl,
    });

    if (existingId) {
      return { id: existingId, alreadyExists: true };
    }

    const categoryId = await this.resolveCategoryId(params.composed.newsCategory);
    const nowIso = new Date().toISOString();

    const { data, error } = await supabaseAdmin
      .schema("forum")
      .from("forum_posts")
      .insert({
        category_id: categoryId,
        author_id: SYSTEM_USER_ID,
        title: params.composed.title,
        content: params.composed.bodyMarkdown,
        post_type: "discussion",
        tags: params.composed.tags,
        status: params.status,
        region_code: params.composed.regionCode,
        section: "NEWS",
        metadata: params.composed.metadata,
        created_at: nowIso,
        updated_at: nowIso,
        last_activity_at: nowIso,
      })
      .select("id")
      .single();

    if (error || !data) {
      throw new Error(error?.message || "Failed to insert AI news post");
    }

    if (params.composed.metadata.feedItemId) {
      await supabaseAdmin
        .schema("feed")
        .from("items")
        .update({
          process_status: params.status === "published" ? "PUBLISHED" : "DRAFT_CREATED",
          processed_at: nowIso,
        })
        .eq("id", params.composed.metadata.feedItemId);
    }

    return { id: String(data.id), alreadyExists: false };
  }

  public async listPublishedNews(options?: {
    category?: string | null;
    regionCode?: string | null;
    search?: string | null;
    limit?: number;
  }): Promise<NewsArticleListItem[]> {
    const normalizedCat = normalizeNewsCategoryFilter(options?.category);
    const regionFilter = (options?.regionCode || "").trim();
    const search = (options?.search || "").trim().toLowerCase();
    const limit = Math.min(Math.max(options?.limit ?? 40, 1), 100);

    let query = supabaseAdmin
      .schema("forum")
      .from("forum_posts")
      .select(
        "id, category_id, author_id, title, content, tags, status, view_count, like_count, comment_count, region_code, section, metadata, created_at, updated_at"
      )
      .eq("section", "NEWS")
      .eq("status", "published")
      .order("created_at", { ascending: false })
      .limit(120);

    if (regionFilter && regionFilter !== "ALL" && regionFilter !== "ALL_GWANGJU") {
      query = query.eq("region_code", regionFilter);
    }

    const { data, error } = await query;
    if (error || !data) {
      console.error("[SupabaseNewsRepository.listPublishedNews]", error);
      return [];
    }

    let items = (data as unknown as ForumPostNewsRow[]).map(mapRowToListItem);

    if (normalizedCat !== "all") {
      items = items.filter((item) => item.category === normalizedCat);
    }

    if (regionFilter === "ALL_GWANGJU") {
      items = items.filter((item) => GWANGJU_ALL_CODES.has(item.regionCode));
    }

    if (search) {
      items = items.filter(
        (item) =>
          item.title.toLowerCase().includes(search) ||
          item.summary.toLowerCase().includes(search) ||
          item.regionName.toLowerCase().includes(search) ||
          item.sourceName.toLowerCase().includes(search)
      );
    }

    return items.slice(0, limit);
  }

  public async listDraftNews(limit = 30): Promise<DraftNewsArticleItem[]> {
    const { data, error } = await supabaseAdmin
      .schema("forum")
      .from("forum_posts")
      .select(
        "id, title, content, status, region_code, metadata, created_at"
      )
      .eq("section", "NEWS")
      .eq("status", "draft")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error || !data) {
      return [];
    }

    return (data as unknown as ForumPostNewsRow[]).map((row) => {
      const meta = parseNewsMetadata(row.metadata, row.region_code);
      return {
        id: row.id,
        title: row.title,
        category: meta.newsCategory,
        regionCode: meta.regionCode,
        regionName: getShortRegionLabel(meta.regionCode, meta.regionName),
        sourceName: meta.sourceName,
        sourceUrl: meta.sourceUrl,
        threeLineSummary: meta.threeLineSummary,
        quizCount: meta.quiz.length,
        aiModel: meta.aiModel,
        factCheckNote: meta.factCheckNote,
        createdAt: row.created_at || new Date().toISOString(),
      };
    });
  }

  public async updateNewsStatus(
    postId: string,
    status: "published" | "archived"
  ): Promise<{ success: boolean; error?: string }> {
    const { data: existing } = await supabaseAdmin
      .schema("forum")
      .from("forum_posts")
      .select("id, metadata")
      .eq("id", postId)
      .eq("section", "NEWS")
      .maybeSingle();

    if (!existing) {
      return { success: false, error: "해당 뉴스 초안을 찾을 수 없습니다." };
    }

    const nowIso = new Date().toISOString();
    const { error } = await supabaseAdmin
      .schema("forum")
      .from("forum_posts")
      .update({
        status,
        updated_at: nowIso,
        last_activity_at: nowIso,
      })
      .eq("id", postId);

    if (error) {
      return { success: false, error: error.message };
    }

    const meta = parseNewsMetadata(existing.metadata);
    if (meta.feedItemId) {
      await supabaseAdmin
        .schema("feed")
        .from("items")
        .update({
          process_status: status === "published" ? "PUBLISHED" : "IGNORED",
          processed_at: nowIso,
        })
        .eq("id", meta.feedItemId);
    }

    return { success: true };
  }

  public async getPublishedNewsById(
    articleId: string,
    userId?: string | null
  ): Promise<NewsArticleDetail | null> {
    const { data: row, error } = await supabaseAdmin
      .schema("forum")
      .from("forum_posts")
      .select(
        "id, category_id, author_id, title, content, tags, status, view_count, like_count, comment_count, region_code, section, metadata, created_at, updated_at"
      )
      .eq("id", articleId)
      .eq("section", "NEWS")
      .eq("status", "published")
      .maybeSingle();

    if (error || !row) {
      return null;
    }

    const postRow = row as unknown as ForumPostNewsRow;
    const meta = parseNewsMetadata(postRow.metadata, postRow.region_code);
    const baseItem = mapRowToListItem(postRow);

    // 조회수 비동기 증가 (응답 지연 없이 반영)
    void supabaseAdmin
      .schema("forum")
      .from("forum_posts")
      .update({ view_count: (postRow.view_count ?? 0) + 1 })
      .eq("id", articleId);

    let quizCompleted = false;
    let quizAwardedPmp = 0;

    if (userId) {
      const { data: logs } = await supabaseAdmin
        .schema("forum")
        .from("forum_activity_logs")
        .select("pmp_earned")
        .eq("user_id", userId)
        .eq("post_id", articleId)
        .eq("activity_type", "news_quiz_completed")
        .limit(1);

      if (logs && logs.length > 0) {
        quizCompleted = true;
        quizAwardedPmp = Number(logs[0]?.pmp_earned ?? 0);
      }
    }

    // 관련 기사 2건 조회
    const sameCategory = await this.listPublishedNews({
      category: meta.newsCategory,
      limit: 6,
    });
    const relatedArticles = sameCategory
      .filter((item) => item.id !== articleId)
      .slice(0, 2)
      .map((item) => ({
        id: item.id,
        title: item.title,
        category: item.category,
        regionName: item.regionName,
      }));

    // 연계 예측 게임 조회
    const { data: links } = await supabaseAdmin
      .schema("forum")
      .from("forum_prediction_links")
      .select("prediction_game_id")
      .eq("forum_post_id", articleId)
      .limit(3);

    const linkedGames: NewsArticleDetail["linkedGames"] = [];
    if (links && links.length > 0) {
      const gameIds = links.map((l) => String(l.prediction_game_id));
      const { data: games } = await supabaseAdmin
        .schema("prediction")
        .from("prediction_games")
        .select("game_id, title, status")
        .in("game_id", gameIds);
      (games || []).forEach((g) => {
        linkedGames.push({
          gameId: String(g.game_id),
          title: String(g.title),
          status: String(g.status),
        });
      });
    }

    return {
      ...baseItem,
      viewCount: baseItem.viewCount + 1,
      content: postRow.content,
      aiModel: meta.aiModel,
      factCheckNote: meta.factCheckNote,
      predictionHook: meta.predictionHook,
      quiz: meta.quiz.map((q) => ({
        id: q.id,
        question: q.question,
        options: q.options,
      })),
      quizCompleted,
      quizAwardedPmp,
      solvedQuizDetails: quizCompleted ? meta.quiz : undefined,
      relatedArticles,
      linkedGames,
    };
  }

  public async submitNewsQuiz(params: {
    articleId: string;
    userId: string;
    selectedAnswers: number[];
  }): Promise<QuizSubmissionResult> {
    const { articleId, userId, selectedAnswers } = params;

    const { data: row, error } = await supabaseAdmin
      .schema("forum")
      .from("forum_posts")
      .select("id, title, region_code, metadata, status, section")
      .eq("id", articleId)
      .eq("section", "NEWS")
      .eq("status", "published")
      .maybeSingle();

    if (error || !row) {
      return {
        success: false,
        totalQuestions: 0,
        correctCount: 0,
        awardedPmp: 0,
        dailyRemaining: 0,
        quizResults: [],
        error: "기사를 찾을 수 없습니다.",
      };
    }

    const meta = parseNewsMetadata(row.metadata, row.region_code);
    if (meta.quiz.length === 0) {
      return {
        success: false,
        totalQuestions: 0,
        correctCount: 0,
        awardedPmp: 0,
        dailyRemaining: 0,
        quizResults: [],
        error: "이 기사에는 등록된 이해도 퀴즈가 없습니다.",
      };
    }

    // 중복 참여 방지
    const { data: existingLogs } = await supabaseAdmin
      .schema("forum")
      .from("forum_activity_logs")
      .select("pmp_earned")
      .eq("user_id", userId)
      .eq("post_id", articleId)
      .eq("activity_type", "news_quiz_completed")
      .limit(1);

    const quizResults = meta.quiz.map((q, idx) => {
      const selected = Number.isInteger(selectedAnswers[idx]) ? selectedAnswers[idx] : -1;
      const isCorrect = selected === q.answerIndex;
      return {
        id: q.id,
        question: q.question,
        selectedIndex: selected,
        answerIndex: q.answerIndex,
        isCorrect,
        explanation: q.explanation,
      };
    });

    const correctCount = quizResults.filter((r) => r.isCorrect).length;

    if (existingLogs && existingLogs.length > 0) {
      return {
        success: true,
        alreadySolved: true,
        totalQuestions: meta.quiz.length,
        correctCount,
        awardedPmp: Number(existingLogs[0]?.pmp_earned ?? 0),
        dailyRemaining: 0,
        quizResults,
      };
    }

    const requestedPmp =
      correctCount > 0
        ? Math.max(5, Math.round(meta.pmpReward * (correctCount / meta.quiz.length)))
        : 0;

    const grantRes = await grantForumPmpWithDailyCap({
      supabase: supabaseAdmin,
      userId,
      activityType: "news_quiz_completed",
      requestedPmp,
      description: `뉴스 이해도 퀴즈 완료: ${String(row.title).slice(0, 40)}`,
      ledgerDescription: `AI 뉴스 퀴즈 보상 (${correctCount}/${meta.quiz.length} 정답)`,
      postId: articleId,
      metadata: {
        newsCategory: meta.newsCategory,
        regionCode: meta.regionCode,
        correctCount,
        totalQuestions: meta.quiz.length,
      },
    });

    return {
      success: true,
      alreadySolved: false,
      totalQuestions: meta.quiz.length,
      correctCount,
      awardedPmp: grantRes.awardedPmp,
      dailyRemaining: grantRes.dailyRemaining,
      quizResults,
    };
  }
}
