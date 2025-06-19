/**
 * Comment Entity
 * 포럼 댓글 엔티티
 */

import { UserId } from '../../../auth/domain/value-objects/user-value-objects';
import {
  CommentId,
  PostId,
  CommentStatus,
  CommentContent,
  ActivityPoints,
  createActivityPoints
} from '../value-objects/forum-value-objects';

/**
 * Comment Entity
 * 게시물에 대한 댓글을 표현하는 엔티티
 */
export class Comment {
  private constructor(
    private readonly id: CommentId,
    private readonly postId: PostId,
    private readonly authorId: UserId,
    private content: CommentContent,
    private status: CommentStatus,
    private readonly createdAt: Date,
    private updatedAt: Date,
    
    // 계층 구조 (3단계까지 지원)
    private readonly parentCommentId?: CommentId,
    private readonly depth: number = 0,
    
    // 상호작용 통계
    private upvoteCount: number = 0,
    private downvoteCount: number = 0,
    private replyCount: number = 0,
    
    // 모더레이션
    private moderatedAt?: Date,
    private moderatedBy?: UserId,
    
    // 메타데이터
    private isEdited: boolean = false,
    private editedAt?: Date
  ) {}

  /**
   * 새로운 댓글 생성
   */
  static create(
    id: CommentId,
    postId: PostId,
    authorId: UserId,
    content: CommentContent,
    parentCommentId?: CommentId,
    depth: number = 0
  ): Comment {
    // 최대 3단계까지만 허용
    if (depth > 2) {
      throw new Error('Comments can only be nested up to 3 levels deep');
    }

    const now = new Date();
    
    return new Comment(
      id,
      postId,
      authorId,
      content,
      CommentStatus.PUBLISHED,
      now,
      now,
      parentCommentId,
      depth
    );
  }

  /**
   * 기존 댓글 복원 (Repository에서 사용)
   */
  static restore(
    id: CommentId,
    postId: PostId,
    authorId: UserId,
    content: CommentContent,
    status: CommentStatus,
    createdAt: Date,
    updatedAt: Date,
    parentCommentId?: CommentId,
    depth: number = 0,
    upvoteCount: number = 0,
    downvoteCount: number = 0,
    replyCount: number = 0,
    moderatedAt?: Date,
    moderatedBy?: UserId,
    isEdited: boolean = false,
    editedAt?: Date
  ): Comment {
    return new Comment(
      id,
      postId,
      authorId,
      content,
      status,
      createdAt,
      updatedAt,
      parentCommentId,
      depth,
      upvoteCount,
      downvoteCount,
      replyCount,
      moderatedAt,
      moderatedBy,
      isEdited,
      editedAt
    );
  }

  // Getters
  getId(): CommentId { return this.id; }
  getPostId(): PostId { return this.postId; }
  getAuthorId(): UserId { return this.authorId; }
  getContent(): CommentContent { return this.content; }
  getStatus(): CommentStatus { return this.status; }
  getCreatedAt(): Date { return this.createdAt; }
  getUpdatedAt(): Date { return this.updatedAt; }
  getParentCommentId(): CommentId | undefined { return this.parentCommentId; }
  getDepth(): number { return this.depth; }
  getUpvoteCount(): number { return this.upvoteCount; }
  getDownvoteCount(): number { return this.downvoteCount; }
  getReplyCount(): number { return this.replyCount; }
  getModeratedAt(): Date | undefined { return this.moderatedAt; }
  getModeratedBy(): UserId | undefined { return this.moderatedBy; }
  getIsEdited(): boolean { return this.isEdited; }
  getEditedAt(): Date | undefined { return this.editedAt; }

  /**
   * 댓글 내용 수정
   */
  updateContent(newContent: CommentContent, editorId: UserId): void {
    this.checkEditPermission(editorId);
    
    this.content = newContent;
    this.isEdited = true;
    this.editedAt = new Date();
    this.updatedAt = new Date();
  }

  /**
   * 댓글 삭제
   */
  delete(deleterId: UserId): void {
    this.checkEditPermission(deleterId);
    this.status = CommentStatus.DELETED;
    this.updatedAt = new Date();
  }

  /**
   * 댓글 숨김 (모더레이션)
   */
  hide(moderatorId: UserId): void {
    this.status = CommentStatus.HIDDEN;
    this.moderatedAt = new Date();
    this.moderatedBy = moderatorId;
    this.updatedAt = new Date();
  }

  /**
   * 댓글 복원
   */
  restore(restorerId: UserId): void {
    this.checkEditPermission(restorerId);
    if (this.status !== CommentStatus.DELETED && this.status !== CommentStatus.HIDDEN) {
      throw new Error('Only deleted or hidden comments can be restored');
    }
    this.status = CommentStatus.PUBLISHED;
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
   * 답글 수 증가
   */
  incrementReplyCount(): void {
    this.replyCount++;
  }

  /**
   * 답글 수 감소
   */
  decrementReplyCount(): void {
    if (this.replyCount > 0) {
      this.replyCount--;
    }
  }

  /**
   * 댓글이 최상위 댓글인지 확인
   */
  isTopLevel(): boolean {
    return this.depth === 0 && !this.parentCommentId;
  }

  /**
   * 댓글이 답글인지 확인
   */
  isReply(): boolean {
    return this.depth > 0 && !!this.parentCommentId;
  }

  /**
   * 댓글이 활성 상태인지 확인
   */
  isActive(): boolean {
    return this.status === CommentStatus.PUBLISHED;
  }

  /**
   * 댓글 수정 가능 여부 확인
   */
  canEdit(userId: UserId): boolean {
    return this.authorId === userId && this.status !== CommentStatus.DELETED;
  }

  /**
   * 답글을 달 수 있는지 확인
   */
  canReply(): boolean {
    return this.depth < 2 && this.status === CommentStatus.PUBLISHED;
  }

  /**
   * 댓글 작성으로 얻는 포인트 계산
   */
  calculateCreationPoints(): ActivityPoints {
    // 답글 깊이에 따른 차등 포인트
    let basePoints = 5; // 기본 댓글 포인트
    
    if (this.depth === 0) {
      basePoints = 5; // 최상위 댓글
    } else if (this.depth === 1) {
      basePoints = 3; // 답글
    } else {
      basePoints = 2; // 대댓글
    }

    return createActivityPoints(basePoints, 'PMP');
  }

  /**
   * 댓글 품질 점수 계산
   */
  calculateQualityScore(): number {
    const contentLength = this.content.value.length;
    const votes = this.upvoteCount - this.downvoteCount;
    const replies = this.replyCount;
    
    let score = 0;
    
    // 콘텐츠 길이 점수 (0-20점)
    if (contentLength > 200) score += 20;
    else if (contentLength > 100) score += 15;
    else if (contentLength > 50) score += 10;
    else score += 5;
    
    // 투표 점수 (0-50점)
    score += Math.min(votes * 5, 50);
    
    // 답글 유도 점수 (0-30점)
    score += Math.min(replies * 10, 30);
    
    return Math.max(0, Math.min(100, score));
  }

  /**
   * 댓글의 인기도 점수 계산
   */
  calculatePopularityScore(): number {
    const ageInHours = (Date.now() - this.createdAt.getTime()) / (1000 * 60 * 60);
    const votes = this.upvoteCount - this.downvoteCount;
    const engagement = this.replyCount;
    
    // 시간이 지날수록 점수가 감소하는 알고리즘
    return (votes + engagement) / Math.pow(ageInHours + 1, 1.2);
  }

  /**
   * 편집 권한 확인
   */
  private checkEditPermission(userId: UserId): void {
    if (this.authorId !== userId) {
      throw new Error('Only the author can edit this comment');
    }
    if (this.status === CommentStatus.DELETED) {
      throw new Error('Cannot edit deleted comments');
    }
  }

  /**
   * 댓글 메타데이터 반환
   */
  getMetadata(): {
    isEdited: boolean;
    editedAt?: Date;
    depth: number;
    hasReplies: boolean;
    totalVotes: number;
    netVotes: number;
  } {
    return {
      isEdited: this.isEdited,
      editedAt: this.editedAt,
      depth: this.depth,
      hasReplies: this.replyCount > 0,
      totalVotes: this.upvoteCount + this.downvoteCount,
      netVotes: this.upvoteCount - this.downvoteCount
    };
  }

  /**
   * 도메인 이벤트 생성을 위한 정보 반환
   */
  getEventData(): {
    commentId: CommentId;
    postId: PostId;
    authorId: UserId;
    parentCommentId?: CommentId;
    depth: number;
    status: CommentStatus;
    createdAt: Date;
    updatedAt: Date;
  } {
    return {
      commentId: this.id,
      postId: this.postId,
      authorId: this.authorId,
      parentCommentId: this.parentCommentId,
      depth: this.depth,
      status: this.status,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  /**
   * 스레드 ID 계산 (동일한 최상위 댓글 하위의 모든 댓글들)
   */
  getThreadId(): CommentId {
    // 최상위 댓글이면 자신의 ID가 스레드 ID
    if (this.isTopLevel()) {
      return this.id;
    }
    
    // 답글이면 부모 댓글을 찾아서 스레드 ID를 찾아야 함
    // 이는 Repository에서 처리해야 할 로직
    return this.parentCommentId!;
  }

  /**
   * 댓글 경로 생성 (breadcrumb 용도)
   */
  getCommentPath(): string {
    if (this.isTopLevel()) {
      return this.id;
    }
    // 실제 구현에서는 Repository에서 부모 댓글들을 조회하여 경로를 생성
    return `${this.parentCommentId}/${this.id}`;
  }
}
