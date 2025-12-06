/**
 * MCP Post Repository
 * Supabase MCP를 통한 게시물 저장소 구현
 */
import { Result, PaginatedResult, PaginationParams } from "@posmul/auth-economy-sdk";
import { UserId } from "../../../auth/domain/value-objects/user-value-objects";
import { Post } from "../../domain/entities/post.entity";
import {
  ForumCategory,
  ForumSection,
  PostId,
  PostStatus,
  createPostId,
} from "../../domain/value-objects/forum-value-objects";
import {
  IPostRepository,
  PostSearchCriteria,
  PostSortOptions,
  PostStats,
} from "../../domain/repositories/post.repository";

// Supabase 클라이언트 타입
type SupabaseClient = {
  from: (table: string) => unknown;
};

/**
 * DB Row 타입 정의
 */
interface PostRow {
  id: string;
  author_id: string;
  title: string;
  content: string;
  section: string;
  category: string;
  status: string;
  tags: string[];
  is_sticky: boolean;
  is_pinned: boolean;
  upvote_count: number;
  downvote_count: number;
  comment_count: number;
  view_count: number;
  share_count: number;
  popularity_score: number;
  region_code: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
  published_at: string | null;
}

/**
 * Query Builder 타입 (Supabase 호환)
 */
interface QueryBuilder<T = unknown> {
  select: (cols: string, options?: { count?: string; head?: boolean }) => QueryBuilder<T>;
  insert: (data: unknown) => QueryBuilder<T>;
  update: (data: unknown) => QueryBuilder<T>;
  delete: () => QueryBuilder<T>;
  eq: (col: string, val: unknown) => QueryBuilder<T>;
  neq: (col: string, val: unknown) => QueryBuilder<T>;
  in: (col: string, vals: unknown[]) => QueryBuilder<T>;
  contains: (col: string, vals: unknown[]) => QueryBuilder<T>;
  gte: (col: string, val: unknown) => QueryBuilder<T>;
  lte: (col: string, val: unknown) => QueryBuilder<T>;
  ilike: (col: string, val: string) => QueryBuilder<T>;
  or: (conditions: string) => QueryBuilder<T>;
  order: (col: string, options?: { ascending?: boolean; nullsFirst?: boolean }) => QueryBuilder<T>;
  range: (from: number, to: number) => QueryBuilder<T>;
  limit: (n: number) => QueryBuilder<T>;
  single: () => Promise<{ data: T | null; error: Error | null }>;
  then: <R>(fn: (result: { data: T[] | null; error: Error | null; count?: number | null }) => R) => Promise<R>;
}

/**
 * MCPPostRepository
 * forum.forum_posts 테이블에 대한 CRUD 구현
 */
export class MCPPostRepository implements IPostRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  // ==================== 기본 CRUD ====================

  async save(post: Post): Promise<Result<void>> {
    try {
      const row = this.mapEntityToRow(post);
      const { error } = await this.getQueryBuilder()
        .insert(row);

      if (error) {
        return { success: false, error: new Error(error.message) };
      }
      return { success: true, data: undefined };
    } catch (e) {
      return { success: false, error: e as Error };
    }
  }

  async update(post: Post): Promise<Result<void>> {
    try {
      const row = this.mapEntityToRow(post);
      const { error } = await this.getQueryBuilder()
        .update(row)
        .eq("id", post.getId());

      if (error) {
        return { success: false, error: new Error(error.message) };
      }
      return { success: true, data: undefined };
    } catch (e) {
      return { success: false, error: e as Error };
    }
  }

  async findById(id: PostId): Promise<Result<Post | null>> {
    try {
      const { data, error } = await this.getQueryBuilder<PostRow>()
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        if (error.message.includes("No rows")) {
          return { success: true, data: null };
        }
        return { success: false, error: new Error(error.message) };
      }

      return { success: true, data: data ? this.mapRowToEntity(data) : null };
    } catch (e) {
      return { success: false, error: e as Error };
    }
  }

  async delete(id: PostId): Promise<Result<void>> {
    try {
      const { error } = await this.getQueryBuilder()
        .delete()
        .eq("id", id);

      if (error) {
        return { success: false, error: new Error(error.message) };
      }
      return { success: true, data: undefined };
    } catch (e) {
      return { success: false, error: e as Error };
    }
  }

  // ==================== 목록 조회 ====================

  async findByAuthor(
    authorId: UserId,
    pagination?: PaginationParams,
    status?: PostStatus
  ): Promise<Result<PaginatedResult<Post>>> {
    try {
      let query = this.getQueryBuilder<PostRow>()
        .select("*", { count: "exact" })
        .eq("author_id", authorId);

      if (status) {
        query = query.eq("status", status);
      }

      query = this.applyPagination(query, pagination);
      query = query.order("created_at", { ascending: false });

      const result = await this.executeListQuery(query, pagination);
      return result;
    } catch (e) {
      return { success: false, error: e as Error };
    }
  }

  async findBySection(
    section: ForumSection,
    pagination?: PaginationParams
  ): Promise<Result<PaginatedResult<Post>>> {
    try {
      let query = this.getQueryBuilder<PostRow>()
        .select("*", { count: "exact" })
        .eq("section", section)
        .eq("status", PostStatus.PUBLISHED);

      query = this.applyPagination(query, pagination);
      query = query.order("is_sticky", { ascending: false })
        .order("created_at", { ascending: false });

      return this.executeListQuery(query, pagination);
    } catch (e) {
      return { success: false, error: e as Error };
    }
  }

  async findByCategory(
    category: ForumCategory,
    pagination?: PaginationParams
  ): Promise<Result<PaginatedResult<Post>>> {
    try {
      let query = this.getQueryBuilder<PostRow>()
        .select("*", { count: "exact" })
        .eq("category", category)
        .eq("status", PostStatus.PUBLISHED);

      query = this.applyPagination(query, pagination);
      query = query.order("created_at", { ascending: false });

      return this.executeListQuery(query, pagination);
    } catch (e) {
      return { success: false, error: e as Error };
    }
  }

  async findByStatus(
    status: PostStatus,
    pagination?: PaginationParams
  ): Promise<Result<PaginatedResult<Post>>> {
    try {
      let query = this.getQueryBuilder<PostRow>()
        .select("*", { count: "exact" })
        .eq("status", status);

      query = this.applyPagination(query, pagination);
      query = query.order("created_at", { ascending: false });

      return this.executeListQuery(query, pagination);
    } catch (e) {
      return { success: false, error: e as Error };
    }
  }

  // ==================== 검색 ====================

  async search(
    criteria: PostSearchCriteria,
    pagination?: PaginationParams,
    sort?: PostSortOptions
  ): Promise<Result<PaginatedResult<Post>>> {
    try {
      let query = this.getQueryBuilder<PostRow>()
        .select("*", { count: "exact" });

      // 검색 조건 적용
      query = this.applyCriteria(query, criteria);

      // 정렬 적용
      if (sort) {
        const columnMap: Record<string, string> = {
          createdAt: "created_at",
          updatedAt: "updated_at",
          upvoteCount: "upvote_count",
          commentCount: "comment_count",
          viewCount: "view_count",
          popularityScore: "popularity_score",
        };
        const column = columnMap[sort.field] || "created_at";
        query = query.order(column, { ascending: sort.direction === "asc" });
      } else {
        query = query.order("created_at", { ascending: false });
      }

      query = this.applyPagination(query, pagination);

      return this.executeListQuery(query, pagination);
    } catch (e) {
      return { success: false, error: e as Error };
    }
  }

  async searchByKeyword(
    keyword: string,
    section?: ForumSection,
    pagination?: PaginationParams
  ): Promise<Result<PaginatedResult<Post>>> {
    try {
      let query = this.getQueryBuilder<PostRow>()
        .select("*", { count: "exact" })
        .eq("status", PostStatus.PUBLISHED)
        .or(`title.ilike.%${keyword}%,content.ilike.%${keyword}%`);

      if (section) {
        query = query.eq("section", section);
      }

      query = this.applyPagination(query, pagination);
      query = query.order("created_at", { ascending: false });

      return this.executeListQuery(query, pagination);
    } catch (e) {
      return { success: false, error: e as Error };
    }
  }

  async findByTags(
    tags: string[],
    pagination?: PaginationParams
  ): Promise<Result<PaginatedResult<Post>>> {
    try {
      let query = this.getQueryBuilder<PostRow>()
        .select("*", { count: "exact" })
        .eq("status", PostStatus.PUBLISHED)
        .contains("tags", tags);

      query = this.applyPagination(query, pagination);
      query = query.order("created_at", { ascending: false });

      return this.executeListQuery(query, pagination);
    } catch (e) {
      return { success: false, error: e as Error };
    }
  }

  // ==================== 인기/추천 게시물 ====================

  async findPopular(
    section?: ForumSection,
    category?: ForumCategory,
    timeframe?: "day" | "week" | "month" | "year",
    limit: number = 10
  ): Promise<Result<Post[]>> {
    try {
      let query = this.getQueryBuilder<PostRow>()
        .select("*")
        .eq("status", PostStatus.PUBLISHED);

      if (section) {
        query = query.eq("section", section);
      }
      if (category) {
        query = query.eq("category", category);
      }

      // 기간 필터
      if (timeframe) {
        const since = this.getTimeframeSince(timeframe);
        query = query.gte("created_at", since.toISOString());
      }

      query = query.order("popularity_score", { ascending: false }).limit(limit);

      const { data, error } = await query;

      if (error) {
        return { success: false, error: new Error(error.message) };
      }

      return {
        success: true,
        data: (data as PostRow[] || []).map((row) => this.mapRowToEntity(row)),
      };
    } catch (e) {
      return { success: false, error: e as Error };
    }
  }

  async findRecent(
    section?: ForumSection,
    category?: ForumCategory,
    limit: number = 10
  ): Promise<Result<Post[]>> {
    try {
      let query = this.getQueryBuilder<PostRow>()
        .select("*")
        .eq("status", PostStatus.PUBLISHED);

      if (section) {
        query = query.eq("section", section);
      }
      if (category) {
        query = query.eq("category", category);
      }

      query = query.order("created_at", { ascending: false }).limit(limit);

      const { data, error } = await query;

      if (error) {
        return { success: false, error: new Error(error.message) };
      }

      return {
        success: true,
        data: (data as PostRow[] || []).map((row) => this.mapRowToEntity(row)),
      };
    } catch (e) {
      return { success: false, error: e as Error };
    }
  }

  async findPinned(
    section?: ForumSection,
    category?: ForumCategory
  ): Promise<Result<Post[]>> {
    try {
      let query = this.getQueryBuilder<PostRow>()
        .select("*")
        .eq("status", PostStatus.PUBLISHED)
        .eq("is_pinned", true);

      if (section) {
        query = query.eq("section", section);
      }
      if (category) {
        query = query.eq("category", category);
      }

      query = query.order("created_at", { ascending: false });

      const { data, error } = await query;

      if (error) {
        return { success: false, error: new Error(error.message) };
      }

      return {
        success: true,
        data: (data as PostRow[] || []).map((row) => this.mapRowToEntity(row)),
      };
    } catch (e) {
      return { success: false, error: e as Error };
    }
  }

  async findTrending(
    section?: ForumSection,
    timeframe: "hour" | "day" | "week" = "day",
    limit: number = 10
  ): Promise<Result<Post[]>> {
    // 트렌딩: 최근 시간대 대비 급상승 인기 게시물
    return this.findPopular(section, undefined, timeframe === "hour" ? "day" : timeframe, limit);
  }

  async findRecommended(userId: UserId, limit: number = 10): Promise<Result<Post[]>> {
    // 추천: 사용자 관심사 기반 (현재는 인기 게시물로 대체)
    return this.findPopular(undefined, undefined, "week", limit);
  }

  async findRelated(postId: PostId, limit: number = 5): Promise<Result<Post[]>> {
    try {
      // 먼저 원본 게시물 조회
      const originalResult = await this.findById(postId);
      if (!originalResult.success || !originalResult.data) {
        return { success: true, data: [] };
      }

      const original = originalResult.data;
      const _tags = original.getTags(); // Reserved for future tag-based filtering

      // 같은 카테고리 또는 태그 공유 게시물
      let query = this.getQueryBuilder<PostRow>()
        .select("*")
        .eq("status", PostStatus.PUBLISHED)
        .neq("id", postId)
        .eq("category", original.getCategory());

      query = query.order("popularity_score", { ascending: false }).limit(limit);

      const { data, error } = await query;

      if (error) {
        return { success: false, error: new Error(error.message) };
      }

      return {
        success: true,
        data: (data as PostRow[] || []).map((row) => this.mapRowToEntity(row)),
      };
    } catch (e) {
      return { success: false, error: e as Error };
    }
  }

  // ==================== 사용자 관련 ====================

  async findBookmarkedByUser(
    userId: UserId,
    pagination?: PaginationParams
  ): Promise<Result<PaginatedResult<Post>>> {
    // 북마크 기능은 별도 테이블 필요 - 현재는 빈 결과 반환
    return {
      success: true,
      data: {
        items: [],
        total: 0,
        page: pagination?.page ?? 1,
        pageSize: pagination?.pageSize ?? 20,
        totalPages: 0,
        hasNext: false,
        hasPrev: false,
      },
    };
  }

  async findUpvotedByUser(
    userId: UserId,
    pagination?: PaginationParams
  ): Promise<Result<PaginatedResult<Post>>> {
    // 좋아요 기능은 forum_votes 테이블 조인 필요
    return {
      success: true,
      data: {
        items: [],
        total: 0,
        page: pagination?.page ?? 1,
        pageSize: pagination?.pageSize ?? 20,
        totalPages: 0,
        hasNext: false,
        hasPrev: false,
      },
    };
  }

  async findCommentedByUser(
    userId: UserId,
    pagination?: PaginationParams
  ): Promise<Result<PaginatedResult<Post>>> {
    // 댓글 기능은 forum_comments 테이블 조인 필요
    return {
      success: true,
      data: {
        items: [],
        total: 0,
        page: pagination?.page ?? 1,
        pageSize: pagination?.pageSize ?? 20,
        totalPages: 0,
        hasNext: false,
        hasPrev: false,
      },
    };
  }

  // ==================== 모더레이션 ====================

  async findPendingModeration(
    pagination?: PaginationParams
  ): Promise<Result<PaginatedResult<Post>>> {
    return this.findByStatus(PostStatus.MODERATED, pagination);
  }

  async findReported(
    pagination?: PaginationParams
  ): Promise<Result<PaginatedResult<Post>>> {
    // 신고된 게시물은 별도 테이블/필드 필요
    return this.findByStatus(PostStatus.HIDDEN, pagination);
  }

  async findArchived(
    section?: ForumSection,
    pagination?: PaginationParams
  ): Promise<Result<PaginatedResult<Post>>> {
    try {
      let query = this.getQueryBuilder<PostRow>()
        .select("*", { count: "exact" })
        .eq("status", PostStatus.HIDDEN); // ARCHIVED 대신 HIDDEN 사용

      if (section) {
        query = query.eq("section", section);
      }

      query = this.applyPagination(query, pagination);
      query = query.order("updated_at", { ascending: false });

      return this.executeListQuery(query, pagination);
    } catch (e) {
      return { success: false, error: e as Error };
    }
  }

  // ==================== 통계 ====================

  async incrementViewCount(id: PostId): Promise<Result<void>> {
    try {
      // RPC 함수 또는 직접 UPDATE 필요
      // 현재는 간단한 구현
      const findResult = await this.findById(id);
      if (!findResult.success || !findResult.data) {
        return { success: false, error: new Error("Post not found") };
      }

      const _post = findResult.data; // Reserved for view_count increment logic
      // view_count 증가 로직 필요
      return { success: true, data: undefined };
    } catch (e) {
      return { success: false, error: e as Error };
    }
  }

  async incrementShareCount(_id: PostId): Promise<Result<void>> {
    try {
      return { success: true, data: undefined };
    } catch (e) {
      return { success: false, error: e as Error };
    }
  }

  async getStats(
    _section?: ForumSection,
    _category?: ForumCategory,
    _dateRange?: { start: Date; end: Date }
  ): Promise<Result<PostStats>> {
    // 통계 조회는 복잡한 집계 쿼리 필요 - 기본값 반환
    const defaultStats: PostStats = {
      totalPosts: 0,
      publishedPosts: 0,
      draftPosts: 0,
      hiddenPosts: 0,
      deletedPosts: 0,
      postsBySection: {} as Record<ForumSection, number>,
      postsByCategory: {} as Record<ForumCategory, number>,
      postsThisWeek: 0,
      postsThisMonth: 0,
      averageUpvotes: 0,
      averageComments: 0,
      mostActiveUsers: [],
    };
    return { success: true, data: defaultStats };
  }

  async getUserStats(
    _userId: UserId,
    _dateRange?: { start: Date; end: Date }
  ): Promise<Result<{
    totalPosts: number;
    publishedPosts: number;
    totalUpvotes: number;
    totalComments: number;
    totalViews: number;
    averagePopularityScore: number;
    mostPopularPost?: Post;
    recentActivity: Date;
  }>> {
    return {
      success: true,
      data: {
        totalPosts: 0,
        publishedPosts: 0,
        totalUpvotes: 0,
        totalComments: 0,
        totalViews: 0,
        averagePopularityScore: 0,
        recentActivity: new Date(),
      },
    };
  }

  async getDailyPostCounts(
    _dateRange: { start: Date; end: Date },
    _section?: ForumSection
  ): Promise<Result<Array<{ date: Date; count: number }>>> {
    return { success: true, data: [] };
  }

  async getSectionActivity(_timeframe: "day" | "week" | "month"): Promise<
    Result<
      Array<{
        section: ForumSection;
        postCount: number;
        commentCount: number;
        uniqueUsers: number;
        totalUpvotes: number;
      }>
    >
  > {
    return { success: true, data: [] };
  }

  // ==================== 일괄 작업 ====================

  async bulkUpdate(
    _criteria: PostSearchCriteria,
    _updates: Partial<{
      status: PostStatus;
      isSticky: boolean;
      tags: string[];
    }>
  ): Promise<Result<number>> {
    return { success: true, data: 0 };
  }

  async archiveExpiredPosts(
    _olderThan: Date,
    _section?: ForumSection
  ): Promise<Result<number>> {
    return { success: true, data: 0 };
  }

  async exists(id: PostId): Promise<Result<boolean>> {
    try {
      const { data, error } = await this.getQueryBuilder<PostRow>()
        .select("id")
        .eq("id", id)
        .single();

      if (error) {
        if (error.message.includes("No rows")) {
          return { success: true, data: false };
        }
        return { success: false, error: new Error(error.message) };
      }

      return { success: true, data: !!data };
    } catch (e) {
      return { success: false, error: e as Error };
    }
  }

  async count(criteria?: PostSearchCriteria): Promise<Result<number>> {
    try {
      let query = this.getQueryBuilder<PostRow>()
        .select("*", { count: "exact", head: true });

      if (criteria) {
        query = this.applyCriteria(query, criteria);
      }

      const { count, error } = await query;

      if (error) {
        return { success: false, error: new Error(error.message) };
      }

      return { success: true, data: count ?? 0 };
    } catch (e) {
      return { success: false, error: e as Error };
    }
  }

  // ==================== Private Helpers ====================

  private getQueryBuilder<T = unknown>(): QueryBuilder<T> {
    return (this.supabase as unknown as { from: (table: string) => QueryBuilder<T> })
      .from("forum.forum_posts");
  }

  private mapEntityToRow(entity: Post): Partial<PostRow> {
    return {
      id: entity.getId(),
      author_id: entity.getAuthorId(),
      title: entity.getTitle() as unknown as string,
      content: entity.getContent() as unknown as string,
      section: entity.getSection(),
      category: entity.getCategory(),
      status: entity.getStatus(),
      tags: entity.getTags(),
      is_sticky: entity.getIsSticky(),
      is_pinned: entity.getIsPinned(),
      upvote_count: entity.getUpvoteCount(),
      downvote_count: entity.getDownvoteCount(),
      comment_count: entity.getCommentCount(),
      view_count: entity.getViewCount(),
      share_count: entity.getShareCount(),
      popularity_score: entity.getPopularityScore(),
      region_code: entity.getRegionCode() ?? null,
      metadata: entity.getMetadata() as unknown as Record<string, unknown> ?? null,
      created_at: entity.getCreatedAt().toISOString(),
      updated_at: entity.getUpdatedAt().toISOString(),
      published_at: entity.getPublishedAt()?.toISOString() ?? null,
    };
  }

  private mapRowToEntity(row: PostRow): Post {
    return Post.restore(
      createPostId(row.id),
      row.author_id as UserId,
      row.title,
      row.content,
      row.section as ForumSection,
      row.category as ForumCategory,
      row.status as PostStatus,
      row.tags,
      row.is_sticky,
      row.is_pinned,
      row.upvote_count,
      row.downvote_count,
      row.comment_count,
      row.view_count,
      row.share_count,
      row.popularity_score,
      new Date(row.created_at),
      new Date(row.updated_at),
      row.published_at ? new Date(row.published_at) : undefined,
      row.region_code ?? undefined,
      row.metadata ?? undefined
    );
  }

  private applyCriteria(
    query: QueryBuilder<PostRow>,
    criteria: PostSearchCriteria
  ): QueryBuilder<PostRow> {
    if (criteria.authorId) {
      query = query.eq("author_id", criteria.authorId);
    }
    if (criteria.section) {
      query = query.eq("section", criteria.section);
    }
    if (criteria.category) {
      query = query.eq("category", criteria.category);
    }
    if (criteria.status) {
      query = query.eq("status", criteria.status);
    }
    if (criteria.tags && criteria.tags.length > 0) {
      query = query.contains("tags", criteria.tags);
    }
    if (criteria.keyword) {
      query = query.or(`title.ilike.%${criteria.keyword}%,content.ilike.%${criteria.keyword}%`);
    }
    if (criteria.dateRange) {
      query = query.gte("created_at", criteria.dateRange.start.toISOString());
      query = query.lte("created_at", criteria.dateRange.end.toISOString());
    }
    if (criteria.minUpvotes !== undefined) {
      query = query.gte("upvote_count", criteria.minUpvotes);
    }
    if (criteria.minComments !== undefined) {
      query = query.gte("comment_count", criteria.minComments);
    }
    if (criteria.isSticky !== undefined) {
      query = query.eq("is_sticky", criteria.isSticky);
    }
    if (criteria.isPinned !== undefined) {
      query = query.eq("is_pinned", criteria.isPinned);
    }

    return query;
  }

  private applyPagination(
    query: QueryBuilder<PostRow>,
    pagination?: PaginationParams
  ): QueryBuilder<PostRow> {
    const page = pagination?.page ?? 1;
    const pageSize = pagination?.pageSize ?? 20;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    return query.range(from, to);
  }

  private async executeListQuery(
    query: QueryBuilder<PostRow>,
    pagination?: PaginationParams
  ): Promise<Result<PaginatedResult<Post>>> {
    const { data, error, count } = await query;

    if (error) {
      return { success: false, error: new Error(error.message) };
    }

    const page = pagination?.page ?? 1;
    const pageSize = pagination?.pageSize ?? 20;
    const total = count ?? 0;
    const totalPages = Math.ceil(total / pageSize);

    return {
      success: true,
      data: {
        items: (data as PostRow[] || []).map((row) => this.mapRowToEntity(row)),
        total,
        page,
        pageSize,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }

  private getTimeframeSince(timeframe: "day" | "week" | "month" | "year"): Date {
    const now = new Date();
    switch (timeframe) {
      case "day":
        return new Date(now.getTime() - 24 * 60 * 60 * 1000);
      case "week":
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case "month":
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      case "year":
        return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      default:
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }
  }
}
