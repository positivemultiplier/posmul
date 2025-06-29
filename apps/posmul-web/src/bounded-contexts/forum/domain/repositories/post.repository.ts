/**
 * Post Repository Interface
 * 게시물 저장소 인터페이스
 */

import {
  PaginatedResult,
  PaginationParams,
  Result,
} from "@posmul/shared-types";
import { UserId } from "../../../auth/domain/value-objects/user-value-objects";
import { Post } from "../entities/post.entity";
import {
  BudgetCategory,
  DebatePosition,
  ForumCategory,
  ForumSection,
  NewsCategory,
  PostId,
  PostStatus,
} from "../value-objects/forum-value-objects";

/**
 * 게시물 검색 조건 인터페이스
 */
export interface PostSearchCriteria {
  authorId?: UserId;
  section?: ForumSection;
  category?: ForumCategory;
  status?: PostStatus;
  newsCategory?: NewsCategory;
  budgetCategory?: BudgetCategory;
  debatePosition?: DebatePosition;
  tags?: string[];
  keyword?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
  minUpvotes?: number;
  minComments?: number;
  isSticky?: boolean;
  isPinned?: boolean;
}

/**
 * 게시물 정렬 조건
 */
export interface PostSortOptions {
  field:
    | "createdAt"
    | "updatedAt"
    | "upvoteCount"
    | "commentCount"
    | "viewCount"
    | "popularityScore";
  direction: "asc" | "desc";
}

/**
 * 게시물 통계 인터페이스
 */
export interface PostStats {
  totalPosts: number;
  publishedPosts: number;
  draftPosts: number;
  hiddenPosts: number;
  deletedPosts: number;
  postsBySection: Record<ForumSection, number>;
  postsByCategory: Record<ForumCategory, number>;
  postsThisWeek: number;
  postsThisMonth: number;
  averageUpvotes: number;
  averageComments: number;
  mostActiveUsers: Array<{
    userId: UserId;
    postCount: number;
    totalUpvotes: number;
  }>;
}

/**
 * IPostRepository
 * 게시물 저장소 인터페이스
 */
export interface IPostRepository {
  /**
   * 게시물 저장
   */
  save(post: Post): Promise<Result<void>>;

  /**
   * 게시물 업데이트
   */
  update(post: Post): Promise<Result<void>>;

  /**
   * ID로 게시물 조회
   */
  findById(id: PostId): Promise<Result<Post | null>>;

  /**
   * 작성자별 게시물 목록 조회
   */
  findByAuthor(
    authorId: UserId,
    pagination?: PaginationParams,
    status?: PostStatus
  ): Promise<Result<PaginatedResult<Post>>>;

  /**
   * 섹션별 게시물 목록 조회
   */
  findBySection(
    section: ForumSection,
    pagination?: PaginationParams
  ): Promise<Result<PaginatedResult<Post>>>;

  /**
   * 카테고리별 게시물 목록 조회
   */
  findByCategory(
    category: ForumCategory,
    pagination?: PaginationParams
  ): Promise<Result<PaginatedResult<Post>>>;

  /**
   * 상태별 게시물 목록 조회
   */
  findByStatus(
    status: PostStatus,
    pagination?: PaginationParams
  ): Promise<Result<PaginatedResult<Post>>>;

  /**
   * 게시물 검색
   */
  search(
    criteria: PostSearchCriteria,
    pagination?: PaginationParams,
    sort?: PostSortOptions
  ): Promise<Result<PaginatedResult<Post>>>;

  /**
   * 인기 게시물 조회
   */
  findPopular(
    section?: ForumSection,
    category?: ForumCategory,
    timeframe?: "day" | "week" | "month" | "year",
    limit?: number
  ): Promise<Result<Post[]>>;

  /**
   * 최근 게시물 조회
   */
  findRecent(
    section?: ForumSection,
    category?: ForumCategory,
    limit?: number
  ): Promise<Result<Post[]>>;

  /**
   * 고정된 게시물 조회
   */
  findPinned(
    section?: ForumSection,
    category?: ForumCategory
  ): Promise<Result<Post[]>>;

  /**
   * 추천 게시물 조회 (개인화)
   */
  findRecommended(userId: UserId, limit?: number): Promise<Result<Post[]>>;

  /**
   * 트렌딩 게시물 조회
   */
  findTrending(
    section?: ForumSection,
    timeframe?: "hour" | "day" | "week",
    limit?: number
  ): Promise<Result<Post[]>>;

  /**
   * 관련 게시물 조회
   */
  findRelated(postId: PostId, limit?: number): Promise<Result<Post[]>>;

  /**
   * 태그별 게시물 조회
   */
  findByTags(
    tags: string[],
    pagination?: PaginationParams
  ): Promise<Result<PaginatedResult<Post>>>;

  /**
   * 키워드 검색
   */
  searchByKeyword(
    keyword: string,
    section?: ForumSection,
    pagination?: PaginationParams
  ): Promise<Result<PaginatedResult<Post>>>;

  /**
   * 사용자의 북마크된 게시물 조회
   */
  findBookmarkedByUser(
    userId: UserId,
    pagination?: PaginationParams
  ): Promise<Result<PaginatedResult<Post>>>;

  /**
   * 사용자가 좋아요한 게시물 조회
   */
  findUpvotedByUser(
    userId: UserId,
    pagination?: PaginationParams
  ): Promise<Result<PaginatedResult<Post>>>;

  /**
   * 사용자가 댓글단 게시물 조회
   */
  findCommentedByUser(
    userId: UserId,
    pagination?: PaginationParams
  ): Promise<Result<PaginatedResult<Post>>>;

  /**
   * 모더레이션 대기 게시물 조회
   */
  findPendingModeration(
    pagination?: PaginationParams
  ): Promise<Result<PaginatedResult<Post>>>;

  /**
   * 신고된 게시물 조회
   */
  findReported(
    pagination?: PaginationParams
  ): Promise<Result<PaginatedResult<Post>>>;

  /**
   * 아카이브된 게시물 조회
   */
  findArchived(
    section?: ForumSection,
    pagination?: PaginationParams
  ): Promise<Result<PaginatedResult<Post>>>;

  /**
   * 게시물 삭제
   */
  delete(id: PostId): Promise<Result<void>>;

  /**
   * 게시물 조회수 증가
   */
  incrementViewCount(id: PostId): Promise<Result<void>>;

  /**
   * 게시물 공유수 증가
   */
  incrementShareCount(id: PostId): Promise<Result<void>>;

  /**
   * 게시물 통계 조회
   */
  getStats(
    section?: ForumSection,
    category?: ForumCategory,
    dateRange?: { start: Date; end: Date }
  ): Promise<Result<PostStats>>;

  /**
   * 사용자별 게시물 통계
   */
  getUserStats(
    userId: UserId,
    dateRange?: { start: Date; end: Date }
  ): Promise<
    Result<{
      totalPosts: number;
      publishedPosts: number;
      totalUpvotes: number;
      totalComments: number;
      totalViews: number;
      averagePopularityScore: number;
      mostPopularPost?: Post;
      recentActivity: Date;
    }>
  >;

  /**
   * 일별 게시물 수 조회
   */
  getDailyPostCounts(
    dateRange: { start: Date; end: Date },
    section?: ForumSection
  ): Promise<Result<Array<{ date: Date; count: number }>>>;

  /**
   * 섹션별 활동 통계
   */
  getSectionActivity(timeframe: "day" | "week" | "month"): Promise<
    Result<
      Array<{
        section: ForumSection;
        postCount: number;
        commentCount: number;
        uniqueUsers: number;
        totalUpvotes: number;
      }>
    >
  >;

  /**
   * 게시물 일괄 업데이트 (관리자용)
   */
  bulkUpdate(
    criteria: PostSearchCriteria,
    updates: Partial<{
      status: PostStatus;
      isSticky: boolean;
      tags: string[];
    }>
  ): Promise<Result<number>>;

  /**
   * 만료된 게시물 아카이브 (스케줄 작업용)
   */
  archiveExpiredPosts(
    olderThan: Date,
    section?: ForumSection
  ): Promise<Result<number>>;

  /**
   * 게시물 존재 여부 확인
   */
  exists(id: PostId): Promise<Result<boolean>>;

  /**
   * 게시물 수 카운트
   */
  count(criteria?: PostSearchCriteria): Promise<Result<number>>;
}
