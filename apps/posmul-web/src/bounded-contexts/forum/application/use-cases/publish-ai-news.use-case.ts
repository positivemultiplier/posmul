import { supabaseAdmin } from "../../../../lib/supabase/admin";
import { AiNewsroomDeskAdapter } from "../../../feed/infrastructure/adapters/ai-newsroom-desk.adapter";
import { SupabaseNewsRepository } from "../../infrastructure/repositories/supabase-news.repository";

interface FeedItemWithSourceRow {
  id: string;
  source_id: string | null;
  title: string;
  link: string;
  content_summary: string | null;
  published_at: string | null;
  process_status: string | null;
  created_at: string | null;
}

interface RssSourceMetaRow {
  id: string;
  title: string;
  category: string;
}

export interface PublishBatchNewsResult {
  attempted: number;
  created: number;
  skipped: number;
  failed: number;
  createdIds: string[];
  errors: string[];
}

export class PublishAiNewsUseCase {
  private readonly desk = new AiNewsroomDeskAdapter();
  private readonly newsRepo = new SupabaseNewsRepository();

  public async publishSingleFeedItem(
    feedItemId: string,
    publishMode: "draft" | "published" = "draft"
  ): Promise<{
    success: boolean;
    articleId?: string;
    title?: string;
    alreadyExists?: boolean;
    error?: string;
  }> {
    const { data: item, error } = await supabaseAdmin
      .schema("feed")
      .from("items")
      .select("id, source_id, title, link, content_summary, published_at")
      .eq("id", feedItemId)
      .maybeSingle();

    if (error || !item) {
      return { success: false, error: "피드 아이템을 찾을 수 없습니다." };
    }

    const row = item as unknown as FeedItemWithSourceRow;
    const existingId = await this.newsRepo.findExistingNewsBySource({
      feedItemId: row.id,
      sourceUrl: row.link,
    });
    if (existingId) {
      return {
        success: true,
        articleId: existingId,
        title: row.title,
        alreadyExists: true,
      };
    }

    let sourceTitle = "외부 공식 피드";
    let sourceCategory = "ECONOMY";
    if (row.source_id) {
      const { data: src } = await supabaseAdmin
        .schema("feed")
        .from("rss_sources")
        .select("title, category")
        .eq("id", row.source_id)
        .maybeSingle();
      if (src) {
        sourceTitle = String(src.title || sourceTitle);
        sourceCategory = String(src.category || sourceCategory);
      }
    }

    const composedRes = await this.desk.composeNewsBriefing({
      feedItemId: row.id,
      title: row.title,
      rawSummary: row.content_summary || "",
      link: row.link,
      sourceTitle,
      sourceCategory,
    });

    if (!composedRes.success) {
      return {
        success: false,
        error:
          "error" in composedRes && composedRes.error
            ? composedRes.error.message
            : "AI 뉴스 생성 실패",
      };
    }

    const created = await this.newsRepo.createNewsArticle({
      composed: composedRes.data,
      status: publishMode,
    });

    return {
      success: true,
      articleId: created.id,
      title: composedRes.data.title,
      alreadyExists: created.alreadyExists,
    };
  }

  public async publishBatchFromFeed(options?: {
    sourceCategory?: string;
    limit?: number;
    publishMode?: "draft" | "published";
  }): Promise<PublishBatchNewsResult> {
    const limit = Math.min(Math.max(options?.limit ?? 4, 1), 16);
    const publishMode = options?.publishMode ?? "draft";
    const targetCategory = options?.sourceCategory?.trim().toUpperCase();

    const [sourcesRes, itemsRes] = await Promise.all([
      supabaseAdmin.schema("feed").from("rss_sources").select("id, title, category"),
      supabaseAdmin
        .schema("feed")
        .from("items")
        .select("id, source_id, title, link, content_summary, published_at, process_status, created_at")
        .neq("process_status", "PUBLISHED")
        .order("created_at", { ascending: false })
        .limit(120),
    ]);

    const sourceMap = new Map<string, RssSourceMetaRow>();
    ((sourcesRes.data || []) as RssSourceMetaRow[]).forEach((s) => {
      sourceMap.set(s.id, s);
    });

    let candidates = ((itemsRes.data || []) as FeedItemWithSourceRow[]).filter((item) => {
      if (!item.source_id) return !targetCategory || targetCategory === "ALL";
      const src = sourceMap.get(item.source_id);
      if (!src) return false;
      if (!targetCategory || targetCategory === "ALL") {
        return ["GWANGJU", "AI", "ECONOMY", "SPORTS", "POLICY"].includes(
          src.category.toUpperCase()
        );
      }
      return src.category.toUpperCase() === targetCategory;
    });

    // 카테고리별 균등 선택 (ALL일 때 한 분야에만 몰리지 않게 라운드로빈)
    if (!targetCategory || targetCategory === "ALL") {
      const buckets: Record<string, FeedItemWithSourceRow[]> = {
        GWANGJU: [],
        AI: [],
        ECONOMY: [],
        SPORTS: [],
        OTHER: [],
      };
      for (const item of candidates) {
        const cat = (item.source_id && sourceMap.get(item.source_id)?.category.toUpperCase()) || "OTHER";
        if (cat in buckets) buckets[cat].push(item);
        else buckets.OTHER.push(item);
      }

      const balanced: FeedItemWithSourceRow[] = [];
      const order = ["GWANGJU", "AI", "ECONOMY", "SPORTS", "OTHER"];
      let idx = 0;
      while (balanced.length < limit * 2) {
        let pushedInRound = false;
        for (const key of order) {
          const picked = buckets[key][idx];
          if (picked) {
            balanced.push(picked);
            pushedInRound = true;
          }
        }
        if (!pushedInRound) break;
        idx++;
      }
      candidates = balanced;
    }

    const result: PublishBatchNewsResult = {
      attempted: 0,
      created: 0,
      skipped: 0,
      failed: 0,
      createdIds: [],
      errors: [],
    };

    for (const item of candidates) {
      if (result.created >= limit) break;

      const existing = await this.newsRepo.findExistingNewsBySource({
        feedItemId: item.id,
        sourceUrl: item.link,
      });
      if (existing) {
        result.skipped++;
        continue;
      }

      result.attempted++;
      const res = await this.publishSingleFeedItem(item.id, publishMode);
      if (res.success && res.articleId) {
        if (res.alreadyExists) {
          result.skipped++;
        } else {
          result.created++;
          result.createdIds.push(res.articleId);
        }
      } else {
        result.failed++;
        if (res.error) result.errors.push(`${item.title.slice(0, 24)}: ${res.error}`);
      }
    }

    return result;
  }
}
