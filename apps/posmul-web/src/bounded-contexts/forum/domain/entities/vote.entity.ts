/**
 * Vote Entity
 * 포럼 투표 엔티티
 */

import { UserId } from '../../../auth/domain/value-objects/user-value-objects';
import {
  VoteId,
  PostId,
  CommentId,
  VoteType,
  VoteValue,
  ActivityPoints,
  createActivityPoints
} from '../value-objects/forum-value-objects';

/**
 * Vote Entity
 * 게시물이나 댓글에 대한 투표를 표현하는 엔티티
 */
export class Vote {
  private constructor(
    private readonly id: VoteId,
    private readonly userId: UserId,
    private readonly targetType: 'POST' | 'COMMENT',
    private readonly targetId: PostId | CommentId,
    private voteValue: VoteValue,
    private readonly createdAt: Date,
    private updatedAt: Date,
    
    // 투표 메타데이터
    private previousVoteValue?: VoteValue,
    private changeCount: number = 0
  ) {}

  /**
   * 새로운 투표 생성
   */
  static create(
    id: VoteId,
    userId: UserId,
    targetType: 'POST' | 'COMMENT',
    targetId: PostId | CommentId,
    voteValue: VoteValue
  ): Vote {
    const now = new Date();
    
    return new Vote(
      id,
      userId,
      targetType,
      targetId,
      voteValue,
      now,
      now
    );
  }

  /**
   * 기존 투표 복원 (Repository에서 사용)
   */
  static restore(
    id: VoteId,
    userId: UserId,
    targetType: 'POST' | 'COMMENT',
    targetId: PostId | CommentId,
    voteValue: VoteValue,
    createdAt: Date,
    updatedAt: Date,
    previousVoteValue?: VoteValue,
    changeCount: number = 0
  ): Vote {
    return new Vote(
      id,
      userId,
      targetType,
      targetId,
      voteValue,
      createdAt,
      updatedAt,
      previousVoteValue,
      changeCount
    );
  }

  // Getters
  getId(): VoteId { return this.id; }
  getUserId(): UserId { return this.userId; }
  getTargetType(): 'POST' | 'COMMENT' { return this.targetType; }
  getTargetId(): PostId | CommentId { return this.targetId; }
  getVoteValue(): VoteValue { return this.voteValue; }
  getCreatedAt(): Date { return this.createdAt; }
  getUpdatedAt(): Date { return this.updatedAt; }
  getPreviousVoteValue(): VoteValue | undefined { return this.previousVoteValue; }
  getChangeCount(): number { return this.changeCount; }

  /**
   * 투표 값 변경
   */
  changeVote(newVoteValue: VoteValue): void {
    if (this.voteValue.type === newVoteValue.type && 
        this.voteValue.value === newVoteValue.value) {
      throw new Error('Cannot change to the same vote value');
    }

    this.previousVoteValue = this.voteValue;
    this.voteValue = newVoteValue;
    this.changeCount++;
    this.updatedAt = new Date();
  }

  /**
   * 투표가 좋아요인지 확인
   */
  isUpvote(): boolean {
    return this.voteValue.type === VoteType.UPVOTE;
  }

  /**
   * 투표가 싫어요인지 확인
   */
  isDownvote(): boolean {
    return this.voteValue.type === VoteType.DOWNVOTE;
  }

  /**
   * 투표가 별점인지 확인
   */
  isRating(): boolean {
    return this.voteValue.type === VoteType.RATING;
  }

  /**
   * 게시물에 대한 투표인지 확인
   */
  isPostVote(): boolean {
    return this.targetType === 'POST';
  }

  /**
   * 댓글에 대한 투표인지 확인
   */
  isCommentVote(): boolean {
    return this.targetType === 'COMMENT';
  }

  /**
   * 투표가 변경되었는지 확인
   */
  hasBeenChanged(): boolean {
    return this.changeCount > 0;
  }

  /**
   * 투표로 얻는 포인트 계산
   */
  calculateParticipationPoints(): ActivityPoints {
    // 투표 참여 포인트 (1 PMP)
    return createActivityPoints(1, 'PMP');
  }

  /**
   * 투표 대상 ID를 PostId로 캐스팅 (타입 가드 후 사용)
   */
  getPostId(): PostId {
    if (this.targetType !== 'POST') {
      throw new Error('This vote is not for a post');
    }
    return this.targetId as PostId;
  }

  /**
   * 투표 대상 ID를 CommentId로 캐스팅 (타입 가드 후 사용)
   */
  getCommentId(): CommentId {
    if (this.targetType !== 'COMMENT') {
      throw new Error('This vote is not for a comment');
    }
    return this.targetId as CommentId;
  }

  /**
   * 투표 점수 계산 (별점의 경우)
   */
  getScore(): number {
    if (this.voteValue.type === VoteType.RATING) {
      return this.voteValue.value;
    }
    
    if (this.voteValue.type === VoteType.UPVOTE) {
      return 1;
    }
    
    if (this.voteValue.type === VoteType.DOWNVOTE) {
      return -1;
    }
    
    return 0;
  }

  /**
   * 투표 변경 이력 요약
   */
  getChangeHistory(): {
    hasChanged: boolean;
    changeCount: number;
    previousValue?: VoteValue;
    currentValue: VoteValue;
    lastChangedAt: Date;
  } {
    return {
      hasChanged: this.hasBeenChanged(),
      changeCount: this.changeCount,
      previousValue: this.previousVoteValue,
      currentValue: this.voteValue,
      lastChangedAt: this.updatedAt
    };
  }

  /**
   * 투표의 가중치 계산 (사용자 평판도에 따라)
   */
  calculateWeight(userReputationScore: number): number {
    // 평판도에 따른 투표 가중치
    if (userReputationScore >= 5000) return 2.0;      // 마스터: 2배
    if (userReputationScore >= 1000) return 1.5;      // 전문가: 1.5배
    if (userReputationScore >= 500) return 1.2;       // 신뢰받는 사용자: 1.2배
    if (userReputationScore >= 100) return 1.0;       // 일반 사용자: 1배
    return 0.5; // 신규 사용자: 0.5배
  }

  /**
   * 투표가 유효한지 검증
   */
  isValid(): boolean {
    // 투표 값의 유효성 검증
    if (this.voteValue.type === VoteType.RATING) {
      return this.voteValue.value >= 1 && this.voteValue.value <= 5;
    }
    
    if (this.voteValue.type === VoteType.UPVOTE) {
      return this.voteValue.value === 1;
    }
    
    if (this.voteValue.type === VoteType.DOWNVOTE) {
      return this.voteValue.value === -1;
    }
    
    return false;
  }

  /**
   * 도메인 이벤트 생성을 위한 정보 반환
   */
  getEventData(): {
    voteId: VoteId;
    userId: UserId;
    targetType: 'POST' | 'COMMENT';
    targetId: PostId | CommentId;
    voteValue: VoteValue;
    previousVoteValue?: VoteValue;
    isNewVote: boolean;
    createdAt: Date;
    updatedAt: Date;
  } {
    return {
      voteId: this.id,
      userId: this.userId,
      targetType: this.targetType,
      targetId: this.targetId,
      voteValue: this.voteValue,
      previousVoteValue: this.previousVoteValue,
      isNewVote: this.changeCount === 0,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  /**
   * 투표 요약 정보
   */
  getSummary(): {
    type: VoteType;
    value: number;
    score: number;
    isChanged: boolean;
    target: {
      type: 'POST' | 'COMMENT';
      id: string;
    };
  } {
    return {
      type: this.voteValue.type,
      value: this.voteValue.value,
      score: this.getScore(),
      isChanged: this.hasBeenChanged(),
      target: {
        type: this.targetType,
        id: this.targetId
      }
    };
  }
}
