/**
 * Post Entity Tests
 * Post 엔티티에 대한 포괄적인 테스트
 */
import { UserId } from "../../../../auth/domain/value-objects/user-value-objects";
import {
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
  createPostContent,
  createPostId,
  createPostMetadata,
  createPostTitle,
} from "../../value-objects/forum-value-objects";
import { Post } from "../post.entity";

describe("Post Entity", () => {
  let validPostProps: {
    id: PostId;
    authorId: UserId;
    section: ForumSection;
    category: ForumCategory;
    title: PostTitle;
    content: PostContent;
    metadata: PostMetadata;
  };

  beforeEach(() => {
    validPostProps = {
      id: createPostId("post-123"),
      authorId: "user-123" as UserId,
      section: ForumSection.BRAINSTORMING,
      category: ForumCategory.LOCAL,
      title: createPostTitle("테스트 게시물 제목입니다"),
      content: createPostContent(
        "테스트 게시물 내용입니다. 충분히 긴 내용입니다."
      ),
      metadata: createPostMetadata(["test", "post"], false, false, 0),
    };
  });

  describe("Post Creation", () => {
    it("유효한 데이터로 게시물을 생성할 수 있다", () => {
      // When
      const post = Post.create(
        validPostProps.id,
        validPostProps.authorId,
        validPostProps.section,
        validPostProps.category,
        validPostProps.title,
        validPostProps.content,
        validPostProps.metadata
      );

      // Then
      expect(post).toBeInstanceOf(Post);
      expect(post.getId()).toBe(validPostProps.id);
      expect(post.getAuthorId()).toBe(validPostProps.authorId);
      expect(post.getSection()).toBe(validPostProps.section);
      expect(post.getStatus()).toBe(PostStatus.DRAFT);
    });

    it("뉴스 게시물에는 뉴스 카테고리가 필요하다", () => {
      // When & Then
      expect(() =>
        Post.create(
          validPostProps.id,
          validPostProps.authorId,
          ForumSection.NEWS,
          validPostProps.category,
          validPostProps.title,
          validPostProps.content,
          validPostProps.metadata
        )
      ).toThrow("News posts must have a news category");
    });

    it("뉴스 게시물을 뉴스 카테고리와 함께 생성할 수 있다", () => {
      // When
      const post = Post.create(
        validPostProps.id,
        validPostProps.authorId,
        ForumSection.NEWS,
        validPostProps.category,
        validPostProps.title,
        validPostProps.content,
        validPostProps.metadata,
        NewsCategory.POLITICS
      );

      // Then
      expect(post.getSection()).toBe(ForumSection.NEWS);
      expect(post.getNewsCategory()).toBe(NewsCategory.POLITICS);
    });

    it("예산 게시물에는 예산 카테고리가 필요하다", () => {
      // When & Then
      expect(() =>
        Post.create(
          validPostProps.id,
          validPostProps.authorId,
          ForumSection.BUDGET,
          validPostProps.category,
          validPostProps.title,
          validPostProps.content,
          validPostProps.metadata
        )
      ).toThrow("Budget posts must have a budget category");
    });

    it("예산 게시물을 예산 카테고리와 함께 생성할 수 있다", () => {
      // When
      const post = Post.create(
        validPostProps.id,
        validPostProps.authorId,
        ForumSection.BUDGET,
        validPostProps.category,
        validPostProps.title,
        validPostProps.content,
        validPostProps.metadata,
        undefined,
        BudgetCategory.IS
      );

      // Then
      expect(post.getSection()).toBe(ForumSection.BUDGET);
      expect(post.getBudgetCategory()).toBe(BudgetCategory.IS);
    });

    it("토론 게시물에는 토론 포지션이 필요하다", () => {
      // When & Then
      expect(() =>
        Post.create(
          validPostProps.id,
          validPostProps.authorId,
          ForumSection.DEBATE,
          validPostProps.category,
          validPostProps.title,
          validPostProps.content,
          validPostProps.metadata
        )
      ).toThrow("Debate posts must have a position");
    });

    it("토론 게시물을 토론 포지션과 함께 생성할 수 있다", () => {
      // When
      const post = Post.create(
        validPostProps.id,
        validPostProps.authorId,
        ForumSection.DEBATE,
        validPostProps.category,
        validPostProps.title,
        validPostProps.content,
        validPostProps.metadata,
        undefined,
        undefined,
        DebatePosition.FOR
      );

      // Then
      expect(post.getSection()).toBe(ForumSection.DEBATE);
      expect(post.getDebatePosition()).toBe(DebatePosition.FOR);
    });

    it("브레인스토밍 게시물은 추가 카테고리 없이 생성할 수 있다", () => {
      // When
      const post = Post.create(
        validPostProps.id,
        validPostProps.authorId,
        ForumSection.BRAINSTORMING,
        validPostProps.category,
        validPostProps.title,
        validPostProps.content,
        validPostProps.metadata
      );

      // Then
      expect(post).toBeInstanceOf(Post);
      expect(post.getSection()).toBe(ForumSection.BRAINSTORMING);
    });
  });

  describe("Post State Management", () => {
    let post: Post;

    beforeEach(() => {
      post = Post.create(
        validPostProps.id,
        validPostProps.authorId,
        ForumSection.BRAINSTORMING,
        validPostProps.category,
        validPostProps.title,
        validPostProps.content,
        validPostProps.metadata
      );
    });

    it("게시물을 게시할 수 있다", () => {
      // When
      post.publish(validPostProps.authorId);

      // Then
      expect(post.getStatus()).toBe(PostStatus.PUBLISHED);
    });

    it("작성자가 아니면 게시할 수 없다", () => {
      // Given
      const otherUserId = "other-user" as UserId;

      // When & Then
      expect(() => post.publish(otherUserId)).toThrow(
        "Only the author can edit this post"
      );
    });

    it("게시물을 숨길 수 있다", () => {
      // Given
      const moderatorId = "moderator" as UserId;

      // When
      post.hide(moderatorId);

      // Then
      expect(post.getStatus()).toBe(PostStatus.HIDDEN);
      expect(post.getModeratedBy()).toBe(moderatorId);
      expect(post.getModeratedAt()).toBeDefined();
    });

    it("게시물을 삭제할 수 있다", () => {
      // When
      post.delete(validPostProps.authorId);

      // Then
      expect(post.getStatus()).toBe(PostStatus.DELETED);
    });

    it("삭제된 게시물을 복원할 수 없다 (비즈니스 로직 제약)", () => {
      // Given
      post.delete(validPostProps.authorId);

      // When & Then
      expect(() => post.restore(validPostProps.authorId)).toThrow(
        "Cannot edit deleted posts"
      );
    });

    it("숨김 게시물을 복원할 수 있다", () => {
      // Given
      const moderatorId = "moderator" as UserId;
      post.hide(moderatorId);

      // When
      post.restore(validPostProps.authorId);

      // Then
      expect(post.getStatus()).toBe(PostStatus.PUBLISHED);
    });
  });

  describe("Post Content Management", () => {
    let post: Post;

    beforeEach(() => {
      post = Post.create(
        validPostProps.id,
        validPostProps.authorId,
        ForumSection.BRAINSTORMING,
        validPostProps.category,
        validPostProps.title,
        validPostProps.content,
        validPostProps.metadata
      );
    });

    it("게시물 제목을 수정할 수 있다", () => {
      // Given
      const newTitle = createPostTitle("새로운 제목입니다");

      // When
      post.updateTitle(newTitle, validPostProps.authorId);

      // Then
      expect(post.getTitle()).toBe(newTitle);
    });

    it("게시물 내용을 수정할 수 있다", () => {
      // Given
      const newContent = createPostContent(
        "새로운 내용입니다. 충분히 긴 내용입니다."
      );

      // When
      post.updateContent(newContent, validPostProps.authorId);

      // Then
      expect(post.getContent()).toBe(newContent);
    });

    it("작성자가 아니면 내용을 수정할 수 없다", () => {
      // Given
      const otherUserId = "other-user" as UserId;
      const newTitle = createPostTitle("새로운 제목입니다");

      // When & Then
      expect(() => post.updateTitle(newTitle, otherUserId)).toThrow(
        "Only the author can edit this post"
      );
    });
  });

  describe("Post Interaction", () => {
    let post: Post;

    beforeEach(() => {
      post = Post.create(
        validPostProps.id,
        validPostProps.authorId,
        ForumSection.BRAINSTORMING,
        validPostProps.category,
        validPostProps.title,
        validPostProps.content,
        validPostProps.metadata
      );
    });

    it("좋아요 수를 증가시킬 수 있다", () => {
      // When
      post.incrementUpvote();

      // Then
      expect(post.getUpvoteCount()).toBe(1);
    });

    it("좋아요 수를 감소시킬 수 있다", () => {
      // Given
      post.incrementUpvote();

      // When
      post.decrementUpvote();

      // Then
      expect(post.getUpvoteCount()).toBe(0);
    });

    it("좋아요 수는 0 이하로 감소하지 않는다", () => {
      // When
      post.decrementUpvote();

      // Then
      expect(post.getUpvoteCount()).toBe(0);
    });

    it("싫어요 수를 증가시킬 수 있다", () => {
      // When
      post.incrementDownvote();

      // Then
      expect(post.getDownvoteCount()).toBe(1);
    });

    it("댓글 수를 증가시킬 수 있다", () => {
      // When
      post.incrementCommentCount();

      // Then
      expect(post.getCommentCount()).toBe(1);
    });

    it("공유 수를 증가시킬 수 있다", () => {
      // When
      post.incrementShareCount();

      // Then
      expect(post.getShareCount()).toBe(1);
    });

    it("조회 수를 증가시킬 수 있다", () => {
      // When
      post.incrementViewCount();

      // Then
      expect(post.getMetadata().viewCount).toBe(1);
    });
  });

  describe("Post Analytics", () => {
    let post: Post;

    beforeEach(() => {
      post = Post.create(
        validPostProps.id,
        validPostProps.authorId,
        ForumSection.BRAINSTORMING,
        validPostProps.category,
        validPostProps.title,
        validPostProps.content,
        validPostProps.metadata
      );
    });

    it("인기도 점수를 계산할 수 있다", () => {
      // Given
      post.incrementUpvote();
      post.incrementCommentCount();

      // When
      const score = post.calculatePopularityScore();

      // Then
      expect(score).toBeGreaterThan(0);
      expect(typeof score).toBe("number");
    });

    it("품질 점수를 계산할 수 있다", () => {
      // Given
      post.incrementUpvote();

      // When
      const score = post.calculateQualityScore();

      // Then
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });

    it("생성 포인트를 계산할 수 있다", () => {
      // When
      const points = post.calculateCreationPoints();

      // Then
      expect(points).toBeDefined();
      expect(points.amount).toBeGreaterThan(0);
      expect(points.type).toBe("PmpAmount");
    });
  });

  describe("Post Status Checks", () => {
    let post: Post;

    beforeEach(() => {
      post = Post.create(
        validPostProps.id,
        validPostProps.authorId,
        ForumSection.BRAINSTORMING,
        validPostProps.category,
        validPostProps.title,
        validPostProps.content,
        validPostProps.metadata
      );
    });

    it("게시된 게시물은 활성 상태이다", () => {
      // Given
      post.publish(validPostProps.authorId);

      // When & Then
      expect(post.isActive()).toBe(true);
    });

    it("임시저장 게시물은 활성 상태가 아니다", () => {
      // When & Then
      expect(post.isActive()).toBe(false);
    });

    it("게시물 고정 상태를 확인할 수 있다", () => {
      // Given
      const moderatorId = "moderator" as UserId;

      // When
      post.pin(moderatorId);

      // Then
      expect(post.isPinned()).toBe(true);
    });

    it("편집 권한을 확인할 수 있다", () => {
      // When & Then
      expect(post.canEdit(validPostProps.authorId)).toBe(true);
      expect(post.canEdit("other-user" as UserId)).toBe(false);
    });

    it("섹션별 타입을 확인할 수 있다", () => {
      // Given
      const newsPost = Post.create(
        createPostId("news-post"),
        validPostProps.authorId,
        ForumSection.NEWS,
        validPostProps.category,
        validPostProps.title,
        validPostProps.content,
        validPostProps.metadata,
        NewsCategory.POLITICS
      );

      // When & Then
      expect(newsPost.isNewsPost()).toBe(true);
      expect(newsPost.isDebatePost()).toBe(false);
      expect(newsPost.isBrainstormingPost()).toBe(false);
      expect(newsPost.isBudgetPost()).toBe(false);
    });
  });

  describe("Post Restoration", () => {
    it("기존 게시물을 복원할 수 있다", () => {
      // Given
      const now = new Date();

      // When
      const restoredPost = Post.restore(
        validPostProps.id,
        validPostProps.authorId,
        validPostProps.title as unknown as string,
        validPostProps.content as unknown as string,
        validPostProps.section,
        validPostProps.category,
        PostStatus.PUBLISHED,
        [], // tags
        false, // isSticky
        false, // isPinned
        5, // upvoteCount
        1, // downvoteCount
        3, // commentCount
        0, // viewCount
        2, // shareCount
        0, // popularityScore
        now,
        now,
        undefined, // publishedAt
        undefined, // regionCode
        validPostProps.metadata as unknown as Record<string, unknown>
      );

      // Then
      expect(restoredPost.getId()).toBe(validPostProps.id);
      expect(restoredPost.getStatus()).toBe(PostStatus.PUBLISHED);
      expect(restoredPost.getUpvoteCount()).toBe(5);
      expect(restoredPost.getDownvoteCount()).toBe(1);
      expect(restoredPost.getCommentCount()).toBe(3);
      expect(restoredPost.getShareCount()).toBe(2);
    });
  });

  describe("Event Data", () => {
    it("도메인 이벤트 데이터를 올바르게 반환한다", () => {
      // Given
      const post = Post.create(
        validPostProps.id,
        validPostProps.authorId,
        ForumSection.BRAINSTORMING,
        validPostProps.category,
        validPostProps.title,
        validPostProps.content,
        validPostProps.metadata
      );

      // When
      const eventData = post.getEventData();

      // Then
      expect(eventData.postId).toBe(validPostProps.id);
      expect(eventData.authorId).toBe(validPostProps.authorId);
      expect(eventData.section).toBe(ForumSection.BRAINSTORMING);
      expect(eventData.category).toBe(validPostProps.category);
      expect(eventData.status).toBe(PostStatus.DRAFT);
      expect(eventData.createdAt).toBeInstanceOf(Date);
      expect(eventData.updatedAt).toBeInstanceOf(Date);
    });
  });
});
