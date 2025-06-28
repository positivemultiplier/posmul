/**
 * Forum Domain Value Objects
 * 포럼 도메인의 값 객체들
 */

// Post ID 브랜드 타입
export type PostId = string & { readonly __brand: 'PostId' };

export const createPostId = (id: string): PostId => {
  if (!id || id.trim().length === 0) {
    throw new Error('PostId cannot be empty');
  }
  return id as PostId;
};

// Comment ID 브랜드 타입
export type CommentId = string & { readonly __brand: 'CommentId' };

export const createCommentId = (id: string): CommentId => {
  if (!id || id.trim().length === 0) {
    throw new Error('CommentId cannot be empty');
  }
  return id as CommentId;
};

// Thread ID 브랜드 타입
export type ThreadId = string & { readonly __brand: 'ThreadId' };

export const createThreadId = (id: string): ThreadId => {
  if (!id || id.trim().length === 0) {
    throw new Error('ThreadId cannot be empty');
  }
  return id as ThreadId;
};

// Activity ID 브랜드 타입
export type ActivityId = string & { readonly __brand: 'ActivityId' };

export const createActivityId = (id: string): ActivityId => {
  if (!id || id.trim().length === 0) {
    throw new Error('ActivityId cannot be empty');
  }
  return id as ActivityId;
};

// Vote ID 브랜드 타입
export type VoteId = string & { readonly __brand: 'VoteId' };

export const createVoteId = (id: string): VoteId => {
  if (!id || id.trim().length === 0) {
    throw new Error('VoteId cannot be empty');
  }
  return id as VoteId;
};

// Forum Section Enum
export enum ForumSection {
  NEWS = 'NEWS',
  DEBATE = 'DEBATE', 
  BRAINSTORMING = 'BRAINSTORMING',
  BUDGET = 'BUDGET'
}

// Forum Category Enum
export enum ForumCategory {
  COSMOS = 'COSMOS',    // 우주/글로벌 차원
  COLONY = 'COLONY',    // 식민지/대륙 차원
  NATION = 'NATION',    // 국가 차원
  REGION = 'REGION',    // 지역 차원
  LOCAL = 'LOCAL'       // 지역/커뮤니티 차원
}

// Post Status Enum
export enum PostStatus {
  DRAFT = 'DRAFT',          // 임시저장
  PUBLISHED = 'PUBLISHED',  // 게시됨
  HIDDEN = 'HIDDEN',        // 숨김
  DELETED = 'DELETED',      // 삭제됨
  MODERATED = 'MODERATED'   // 검토 중
}

// Comment Status Enum
export enum CommentStatus {
  PUBLISHED = 'PUBLISHED',
  HIDDEN = 'HIDDEN',
  DELETED = 'DELETED',
  MODERATED = 'MODERATED'
}

// Vote Type Enum
export enum VoteType {
  UPVOTE = 'UPVOTE',     // 좋아요
  DOWNVOTE = 'DOWNVOTE', // 싫어요
  RATING = 'RATING'      // 별점 (1-5)
}

// Activity Type Enum
export enum ActivityType {
  POST_CREATED = 'POST_CREATED',
  POST_UPDATED = 'POST_UPDATED',
  POST_DELETED = 'POST_DELETED',
  COMMENT_CREATED = 'COMMENT_CREATED',
  COMMENT_UPDATED = 'COMMENT_UPDATED',
  COMMENT_DELETED = 'COMMENT_DELETED',
  VOTE_CAST = 'VOTE_CAST',
  VOTE_CHANGED = 'VOTE_CHANGED',
  THREAD_JOINED = 'THREAD_JOINED',
  THREAD_LEFT = 'THREAD_LEFT'
}

// News Category Enum (News Section 전용)
export enum NewsCategory {
  POLITICS = 'POLITICS',     // 정치
  ECONOMY = 'ECONOMY',       // 경제
  SOCIETY = 'SOCIETY',       // 사회
  CULTURE = 'CULTURE',       // 문화
  SPORTS = 'SPORTS',         // 스포츠
  TECHNOLOGY = 'TECHNOLOGY', // 기술
  SCIENCE = 'SCIENCE',       // 과학
  ENTERTAINMENT = 'ENTERTAINMENT' // 연예
}

// Budget Category Enum (Budget Section 전용)
export enum BudgetCategory {
  BS = 'BS', // Balance Sheet (대차대조표)
  IS = 'IS', // Income Statement (손익계산서) 
  EF = 'EF', // Equity Flow (자금흐름표)
  CF = 'CF', // Cash Flow (현금흐름표)
  FN = 'FN'  // Financial Notes (재무제표)
}

// Debate Position Enum (Debate Section 전용)
export enum DebatePosition {
  FOR = 'FOR',         // 찬성
  AGAINST = 'AGAINST', // 반대
  NEUTRAL = 'NEUTRAL'  // 중립
}

// User Reputation Value Object
export interface UserReputation {
  readonly score: number;
  readonly level: ReputationLevel;
}

export enum ReputationLevel {
  NEWCOMER = 'NEWCOMER',     // 0-99
  REGULAR = 'REGULAR',       // 100-499
  TRUSTED = 'TRUSTED',       // 500-999
  EXPERT = 'EXPERT',         // 1000-4999
  MASTER = 'MASTER'          // 5000+
}

export const createUserReputation = (score: number): UserReputation => {
  if (score < 0) {
    throw new Error('Reputation score cannot be negative');
  }
  
  let level: ReputationLevel;
  if (score < 100) level = ReputationLevel.NEWCOMER;
  else if (score < 500) level = ReputationLevel.REGULAR;
  else if (score < 1000) level = ReputationLevel.TRUSTED;
  else if (score < 5000) level = ReputationLevel.EXPERT;
  else level = ReputationLevel.MASTER;

  return { score, level };
};

// Activity Points Value Object
export interface ActivityPoints {
  readonly amount: number;
  readonly type: 'PMP' | 'PMC';
}

export const createActivityPoints = (amount: number, type: 'PMP' | 'PMC'): ActivityPoints => {
  if (amount < 0) {
    throw new Error('Activity points cannot be negative');
  }
  return { amount, type };
};

// Post Title Value Object
export interface PostTitle {
  readonly value: string;
}

export const createPostTitle = (title: string): PostTitle => {
  const trimmed = title.trim();
  if (trimmed.length < 5) {
    throw new Error('Post title must be at least 5 characters long');
  }
  if (trimmed.length > 100) {
    throw new Error('Post title cannot exceed 100 characters');
  }
  return { value: trimmed };
};

// Post Content Value Object
export interface PostContent {
  readonly value: string;
}

export const createPostContent = (content: string): PostContent => {
  const trimmed = content.trim();
  if (trimmed.length < 10) {
    throw new Error('Post content must be at least 10 characters long');
  }
  if (trimmed.length > 10000) {
    throw new Error('Post content cannot exceed 10,000 characters');
  }
  return { value: trimmed };
};

// Comment Content Value Object
export interface CommentContent {
  readonly value: string;
}

export const createCommentContent = (content: string): CommentContent => {
  const trimmed = content.trim();
  if (trimmed.length < 1) {
    throw new Error('Comment content cannot be empty');
  }
  if (trimmed.length > 1000) {
    throw new Error('Comment content cannot exceed 1,000 characters');
  }
  return { value: trimmed };
};

// Vote Value Object
export interface VoteValue {
  readonly type: VoteType;
  readonly value: number; // 1-5 for RATING, 1 for UPVOTE, -1 for DOWNVOTE
}

export const createVoteValue = (type: VoteType, value: number): VoteValue => {
  if (type === VoteType.RATING) {
    if (value < 1 || value > 5) {
      throw new Error('Rating value must be between 1 and 5');
    }
  } else if (type === VoteType.UPVOTE) {
    if (value !== 1) {
      throw new Error('Upvote value must be 1');
    }
  } else if (type === VoteType.DOWNVOTE) {
    if (value !== -1) {
      throw new Error('Downvote value must be -1');
    }
  }
  return { type, value };
};

// Thread Status Enum
export enum ThreadStatus {
  ACTIVE = 'ACTIVE',
  CLOSED = 'CLOSED',
  ARCHIVED = 'ARCHIVED'
}

// Post Metadata Value Object
export interface PostMetadata {
  readonly tags: string[];
  readonly isSticky: boolean;
  readonly isLocked: boolean;
  readonly viewCount: number;
}

export const createPostMetadata = (
  tags: string[] = [],
  isSticky: boolean = false,
  isLocked: boolean = false,
  viewCount: number = 0
): PostMetadata => {
  if (viewCount < 0) {
    throw new Error('View count cannot be negative');
  }
  if (tags.length > 10) {
    throw new Error('Cannot have more than 10 tags');
  }
  return { tags, isSticky, isLocked, viewCount };
};

// Moderation Action Enum
export enum ModerationAction {
  APPROVE = 'APPROVE',
  REJECT = 'REJECT',
  HIDE = 'HIDE',
  DELETE = 'DELETE',
  WARN = 'WARN',
  BAN = 'BAN'
}

// Report Reason Enum
export enum ReportReason {
  SPAM = 'SPAM',
  HARASSMENT = 'HARASSMENT',
  HATE_SPEECH = 'HATE_SPEECH',
  INAPPROPRIATE_CONTENT = 'INAPPROPRIATE_CONTENT',
  MISINFORMATION = 'MISINFORMATION',
  COPYRIGHT_VIOLATION = 'COPYRIGHT_VIOLATION',
  OTHER = 'OTHER'
}
