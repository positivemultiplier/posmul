/**
 * Forum PMP 보상 및 일일 한도 단일 정책 (v3.0)
 * - 도배성 글 작성 보상은 낮추고, 다른 유저의 추천/공감(개념글) 보상을 높여 양질의 커뮤니티를 유도합니다.
 * - 모든 포럼 활동의 총합은 FORUM_DAILY_MAX_PMP 이하로 제한됩니다.
 */

export const FORUM_DAILY_MAX_PMP = 1000;

export const FORUM_POST_PMP_REWARDS = {
  debate: 30,
  brainstorming: 50,
  discussion: 30,
  question: 20,
  announcement: 0,
} as const;

export const FORUM_POST_DAILY_LIMITS = {
  debate: 3,
  brainstorming: 2,
  discussion: 5,
  question: 5,
} as const;

export const FORUM_COMMENT_PMP_REWARD = 10;
export const FORUM_COMMENT_DAILY_LIMIT = 10;

/** 다른 유저로부터 추천 1회 받을 때마다 글 작성자가 얻는 PMP */
export const FORUM_LIKE_RECEIVED_PMP = 20;
/** 하루에 추천 수령으로 인정되는 최대 횟수 */
export const FORUM_LIKE_RECEIVED_DAILY_LIMIT = 20;

/** 개념글(포텐) 승격 기준 추천 수 및 1회성 보너스 */
export const FORUM_CONCEPT_THRESHOLD = 3;
export const FORUM_CONCEPT_BONUS_PMP = 100;

export const FORUM_ACTIVITY_LIMIT_CONFIG = {
  debate: {
    limit: FORUM_POST_DAILY_LIMITS.debate,
    pmp: FORUM_POST_PMP_REWARDS.debate,
  },
  brainstorming: {
    limit: FORUM_POST_DAILY_LIMITS.brainstorming,
    pmp: FORUM_POST_PMP_REWARDS.brainstorming,
  },
  discussion: {
    limit: FORUM_POST_DAILY_LIMITS.discussion,
    pmp: FORUM_POST_PMP_REWARDS.discussion,
  },
  question: {
    limit: FORUM_POST_DAILY_LIMITS.question,
    pmp: FORUM_POST_PMP_REWARDS.question,
  },
  comment: {
    limit: FORUM_COMMENT_DAILY_LIMIT,
    pmp: FORUM_COMMENT_PMP_REWARD,
  },
  likeReceived: {
    limit: FORUM_LIKE_RECEIVED_DAILY_LIMIT,
    pmp: FORUM_LIKE_RECEIVED_PMP,
  },
} as const;

