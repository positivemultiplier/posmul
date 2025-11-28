/**
 * Post Entity
 * 포럼 게시물 엔티티
 */
import { UserId } from "../../../auth/domain/value-objects/user-value-objects";
import {
  ActivityPoints,
  BudgetCategory,
  DebatePosition,
  ForumCategory,
  ForumSection,
  NewsCategory,
  PostContent,
  PostId,
  PostMetadata,
  PostStatus,
  PostTitle,
  createActivityPoints,
} from "../value-objects/forum-value-objects";

/**
 * Post Entity
 * 포럼의 모든 게시물을 표현하는 엔티티
 */
export class Post {
  private constructor(
    private readonly id: PostId,
    private readonly authorId: UserId,
    private readonly section: ForumSection,
    private readonly category: ForumCategory,
    private title: PostTitle,
    private content: PostContent,
    private status: PostStatus,
    private metadata: PostMetadata,
    private readonly createdAt: Date,
    private updatedAt: Date,

    // Section별 특화 필드들
    private readonly newsCategory?: NewsCategory,
    private readonly budgetCategory?: BudgetCategory,
    private readonly debatePosition?: DebatePosition,

    // 통계 및 상호작용
    private upvoteCount: number = 0,
    private downvoteCount: number = 0,
    private commentCount: number = 0,
    private shareCount: number = 0,

    // 선택적 필드들
    private moderatedAt?: Date,
    private moderatedBy?: UserId,
    private pinnedAt?: Date,
    private archivedAt?: Date
  ) {}

  /**
   * 새로운 게시물 생성
   */
  static create(
    id: PostId,
    authorId: UserId,
    section: ForumSection,
    category: ForumCategory,
    title: PostTitle,
    content: PostContent,
    metadata: PostMetadata,
    newsCategory?: NewsCategory,
    budgetCategory?: BudgetCategory,
    debatePosition?: DebatePosition
  ): Post {
    const now = new Date();

    // Section별 특화 필드 검증
    if (section === ForumSection.NEWS && !newsCategory) {
      throw new Error("News posts must have a news category");
    }
    if (section === ForumSection.BUDGET && !budgetCategory) {
      throw new Error("Budget posts must have a budget category");
    }
    if (section === ForumSection.DEBATE && !debatePosition) {
      throw new Error("Debate posts must have a position");
    }

    return new Post(
      id,
      authorId,
      section,
      category,
      title,
      content,
      PostStatus.DRAFT,
      metadata,
      now,
      now,
      newsCategory,
      budgetCategory,
      debatePosition
    );
  }

  /**
   * 기존 게시물 복원 (Repository에서 사용)
   */
  static restore(
    id: PostId,
    authorId: UserId,
    section: ForumSection,
    category: ForumCategory,
    title: PostTitle,
    content: PostContent,
    status: PostStatus,
    metadata: PostMetadata,
    createdAt: Date,
    updatedAt: Date,
    newsCategory?: NewsCategory,
    budgetCategory?: BudgetCategory,
    debatePosition?: DebatePosition,
    upvoteCount: number = 0,
    downvoteCount: number = 0,
    commentCount: number = 0,
    shareCount: number = 0,
    moderatedAt?: Date,
    moderatedBy?: UserId,
    pinnedAt?: Date,
    archivedAt?: Date
  ): Post {
    return new Post(
      id,
      authorId,
      section,
      category,
      title,
      content,
      status,
      metadata,
      createdAt,
      updatedAt,
      newsCategory,
      budgetCategory,
      debatePosition,
      upvoteCount,
      downvoteCount,
      commentCount,
      shareCount,
      moderatedAt,
      moderatedBy,
      pinnedAt,
      archivedAt
    );
  }

  // Getters
  getId(): PostId {
    return this.id;
  }
  getAuthorId(): UserId {
    return this.authorId;
  }
  getSection(): ForumSection {
    return this.section;
  }
  getCategory(): ForumCategory {
    return this.category;
  }
  getTitle(): PostTitle {
    return this.title;
  }
  getContent(): PostContent {
    return this.content;
  }
  getStatus(): PostStatus {
    return this.status;
  }
  getMetadata(): PostMetadata {
    return this.metadata;
  }
  getCreatedAt(): Date {
    return this.createdAt;
  }
  getUpdatedAt(): Date {
    return this.updatedAt;
  }
  getNewsCategory(): NewsCategory | undefined {
    return this.newsCategory;
  }
  getBudgetCategory(): BudgetCategory | undefined {
    return this.budgetCategory;
  }
  getDebatePosition(): DebatePosition | undefined {
    return this.debatePosition;
  }
  getUpvoteCount(): number {
    return this.upvoteCount;
  }
  getDownvoteCount(): number {
    return this.downvoteCount;
  }
  getCommentCount(): number {
    return this.commentCount;
  }
  getShareCount(): number {
    return this.shareCount;
  }
  getModeratedAt(): Date | undefined {
    return this.moderatedAt;
  }
  getModeratedBy(): UserId | undefined {
    return this.moderatedBy;
  }
  getPinnedAt(): Date | undefined {
    return this.pinnedAt;
  }
  getArchivedAt(): Date | undefined {
    return this.archivedAt;
  }

  /**
   * 게시물 제목 수정
   */
  updateTitle(newTitle: PostTitle, editorId: UserId): void {
    this.checkEditPermission(editorId);
    this.title = newTitle;
    this.updatedAt = new Date();
  }

  /**
   * 게시물 내용 수정
   */
  updateContent(newContent: PostContent, editorId: UserId): void {
    this.checkEditPermission(editorId);
    this.content = newContent;
    this.updatedAt = new Date();
  }

  /**
   * 게시물 메타데이터 수정
   */
  updateMetadata(newMetadata: PostMetadata, editorId: UserId): void {
    this.checkEditPermission(editorId);
    this.metadata = newMetadata;
    this.updatedAt = new Date();
  }

  /**
   * 게시물 게시
   */
  publish(publisherId: UserId): void {
    this.checkEditPermission(publisherId);
    if (this.status !== PostStatus.DRAFT) {
      throw new Error("Only draft posts can be published");
    }
    this.status = PostStatus.PUBLISHED;
    this.updatedAt = new Date();
  }

  /**
   * 게시물 숨김
   */
  hide(moderatorId: UserId): void {
    this.status = PostStatus.HIDDEN;
    this.moderatedAt = new Date();
    this.moderatedBy = moderatorId;
    this.updatedAt = new Date();
  }

  /**
   * 게시물 삭제
   */
  delete(deleterId: UserId): void {
    this.checkEditPermission(deleterId);
    this.status = PostStatus.DELETED;
    this.updatedAt = new Date();
  }

  /**
   * 게시물 복원
   */
  restore(restorerId: UserId): void {
    this.checkEditPermission(restorerId);
    if (
      this.status !== PostStatus.DELETED &&
      this.status !== PostStatus.HIDDEN
    ) {
      throw new Error("Only deleted or hidden posts can be restored");
    }
    this.status = PostStatus.PUBLISHED;
    this.updatedAt = new Date();
  }

  /**
   * 게시물 고정
   */
  pin(moderatorId: UserId): void {
    this.pinnedAt = new Date();
    this.moderatedBy = moderatorId;
    this.updatedAt = new Date();
  }

  /**
   * 게시물 고정 해제
   */
  unpin(moderatorId: UserId): void {
    this.pinnedAt = undefined;
    this.moderatedBy = moderatorId;
    this.updatedAt = new Date();
  }

  /**
   * 게시물 아카이브
   */
  archive(): void {
    this.archivedAt = new Date();
    this.status = PostStatus.HIDDEN;
    this.updatedAt = new Date();
  }

  /**
   * 좋아요 증가
   */
  incrementUpvote(): void {
    this.upvoteCount++;
  }

  /**
   * 좋아요 감소
   */
  decrementUpvote(): void {
    if (this.upvoteCount > 0) {
      this.upvoteCount--;
    }
  }

  /**
   * 싫어요 증가
   */
  incrementDownvote(): void {
    this.downvoteCount++;
  }

  /**
   * 싫어요 감소
   */
  decrementDownvote(): void {
    if (this.downvoteCount > 0) {
      this.downvoteCount--;
    }
  }

  /**
   * 댓글 수 증가
   */
  incrementCommentCount(): void {
    this.commentCount++;
  }

  /**
   * 댓글 수 감소
   */
  decrementCommentCount(): void {
    if (this.commentCount > 0) {
      this.commentCount--;
    }
  }

  /**
   * 공유 수 증가
   */
  incrementShareCount(): void {
    this.shareCount++;
  }

  /**
   * 조회수 증가
   */
  incrementViewCount(): void {
    this.metadata = {
      ...this.metadata,
      viewCount: this.metadata.viewCount + 1,
    };
  }

  /**
   * 게시물의 인기도 점수 계산
   */
  calculatePopularityScore(): number {
    const ageInHours =
      (Date.now() - this.createdAt.getTime()) / (1000 * 60 * 60);
    const votes = this.upvoteCount - this.downvoteCount;
    const engagement = this.commentCount + this.shareCount;

    // 시간이 지날수록 점수가 감소하는 알고리즘
    return (votes * 2 + engagement) / Math.pow(ageInHours + 2, 1.5);
  }

  /**
   * 게시물이 활성 상태인지 확인
   */
  isActive(): boolean {
    return this.status === PostStatus.PUBLISHED && !this.archivedAt;
  }

  /**
   * 게시물이 고정되었는지 확인
   */
  isPinned(): boolean {
    return !!this.pinnedAt;
  }

  /**
   * 게시물이 수정 가능한지 확인
   */
  canEdit(userId: UserId): boolean {
    return this.authorId === userId && this.status !== PostStatus.DELETED;
  }

  /**
   * 게시물 생성으로 얻는 포인트 계산
   */
  calculateCreationPoints(): ActivityPoints {
    // 섹션별 차등 포인트
    let basePoints = 10;

    switch (this.section) {
      case ForumSection.NEWS:
        basePoints = 15; // 뉴스 작성은 15 PmpAmount
        break;
      case ForumSection.DEBATE:
        basePoints = 20; // 토론 주제 제기는 20 PmpAmount
        break;
      case ForumSection.BRAINSTORMING:
        basePoints = 25; // 아이디어 제안은 25 PmpAmount
        break;
      case ForumSection.BUDGET:
        basePoints = 30; // 예산 분석은 30 PmpAmount
        break;
    }

    return createActivityPoints(basePoints, "PmpAmount");
  }

  /**
   * 게시물 품질 점수 계산
   */
  calculateQualityScore(): number {
    const contentLength = this.content.value.length;
    const votes = this.upvoteCount - this.downvoteCount;
    const engagement = this.commentCount;

    // 콘텐츠 길이, 투표, 참여도를 종합한 품질 점수
    let score = 0;

    // 콘텐츠 길이 점수 (0-30점)
    if (contentLength > 1000) score += 30;
    else if (contentLength > 500) score += 20;
    else if (contentLength > 100) score += 10;

    // 투표 점수 (0-40점)
    score += Math.min(votes * 2, 40);

    // 참여도 점수 (0-30점)
    score += Math.min(engagement * 3, 30);

    return Math.max(0, Math.min(100, score));
  }

  /**
   * 편집 권한 확인
   */
  private checkEditPermission(userId: UserId): void {
    if (this.authorId !== userId) {
      throw new Error("Only the author can edit this post");
    }
    if (this.status === PostStatus.DELETED) {
      throw new Error("Cannot edit deleted posts");
    }
  }

  /**
   * 게시물이 토론용인지 확인
   */
  isDebatePost(): boolean {
    return this.section === ForumSection.DEBATE;
  }

  /**
   * 게시물이 뉴스인지 확인
   */
  isNewsPost(): boolean {
    return this.section === ForumSection.NEWS;
  }

  /**
   * 게시물이 아이디어 제안인지 확인
   */
  isBrainstormingPost(): boolean {
    return this.section === ForumSection.BRAINSTORMING;
  }

  /**
   * 게시물이 예산 관련인지 확인
   */
  isBudgetPost(): boolean {
    return this.section === ForumSection.BUDGET;
  }

  /**
   * 도메인 이벤트 생성을 위한 정보 반환
   */
  getEventData(): {
    postId: PostId;
    authorId: UserId;
    section: ForumSection;
    category: ForumCategory;
    status: PostStatus;
    createdAt: Date;
    updatedAt: Date;
  } {
    return {
      postId: this.id,
      authorId: this.authorId,
      section: this.section,
      category: this.category,
      status: this.status,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
