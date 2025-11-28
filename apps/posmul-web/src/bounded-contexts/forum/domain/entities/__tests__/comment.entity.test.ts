/**
 * Comment Entity Tests
 * Comment 엔티티에 대한 포괄적인 테스트
 */
import { UserId } from "../../../../auth/domain/value-objects/user-value-objects";
import {
  CommentContent,
  CommentId,
  CommentStatus,
  PostId,
  createCommentContent,
  createCommentId,
  createPostId,
} from "../../value-objects/forum-value-objects";
import { Comment } from "../comment.entity";

describe("Comment Entity", () => {
  let validCommentProps: {
    id: CommentId;
    postId: PostId;
    authorId: UserId;
    content: CommentContent;
  };

  beforeEach(() => {
    validCommentProps = {
      id: createCommentId("comment-123"),
      postId: createPostId("post-123"),
      authorId: "user-123" as UserId,
      content: createCommentContent("테스트 댓글 내용입니다."),
    };
  });

  describe("Comment Creation", () => {
    it("유효한 데이터로 댓글을 생성할 수 있다", () => {
      // When
      const comment = Comment.create(
        validCommentProps.id,
        validCommentProps.postId,
        validCommentProps.authorId,
        validCommentProps.content
      );

      // Then
      expect(comment).toBeInstanceOf(Comment);
      expect(comment.getId()).toBe(validCommentProps.id);
      expect(comment.getPostId()).toBe(validCommentProps.postId);
      expect(comment.getAuthorId()).toBe(validCommentProps.authorId);
      expect(comment.getContent()).toBe(validCommentProps.content);
      expect(comment.getStatus()).toBe(CommentStatus.PUBLISHED);
      expect(comment.getDepth()).toBe(0);
    });

    it("부모 댓글이 있는 답글을 생성할 수 있다", () => {
      // Given
      const parentCommentId = createCommentId("parent-comment");

      // When
      const comment = Comment.create(
        validCommentProps.id,
        validCommentProps.postId,
        validCommentProps.authorId,
        validCommentProps.content,
        parentCommentId,
        1
      );

      // Then
      expect(comment.getParentCommentId()).toBe(parentCommentId);
      expect(comment.getDepth()).toBe(1);
      expect(comment.isReply()).toBe(true);
      expect(comment.isTopLevel()).toBe(false);
    });

    it("3단계보다 깊은 댓글은 생성할 수 없다", () => {
      // When & Then
      expect(() =>
        Comment.create(
          validCommentProps.id,
          validCommentProps.postId,
          validCommentProps.authorId,
          validCommentProps.content,
          createCommentId("parent"),
          3
        )
      ).toThrow("Comments can only be nested up to 3 levels deep");
    });
  });

  describe("Comment Content Management", () => {
    let comment: Comment;

    beforeEach(() => {
      comment = Comment.create(
        validCommentProps.id,
        validCommentProps.postId,
        validCommentProps.authorId,
        validCommentProps.content
      );
    });

    it("댓글 내용을 수정할 수 있다", () => {
      // Given
      const newContent = createCommentContent("수정된 댓글 내용입니다.");

      // When
      comment.updateContent(newContent, validCommentProps.authorId);

      // Then
      expect(comment.getContent()).toBe(newContent);
      expect(comment.getIsEdited()).toBe(true);
      expect(comment.getEditedAt()).toBeDefined();
    });

    it("작성자가 아니면 내용을 수정할 수 없다", () => {
      // Given
      const otherUserId = "other-user" as UserId;
      const newContent = createCommentContent("수정된 댓글 내용입니다.");

      // When & Then
      expect(() => comment.updateContent(newContent, otherUserId)).toThrow(
        "Only the author can edit this comment"
      );
    });
  });

  describe("Comment State Management", () => {
    let comment: Comment;

    beforeEach(() => {
      comment = Comment.create(
        validCommentProps.id,
        validCommentProps.postId,
        validCommentProps.authorId,
        validCommentProps.content
      );
    });

    it("댓글을 삭제할 수 있다", () => {
      // When
      comment.delete(validCommentProps.authorId);

      // Then
      expect(comment.getStatus()).toBe(CommentStatus.DELETED);
    });

    it("작성자가 아니면 삭제할 수 없다", () => {
      // Given
      const otherUserId = "other-user" as UserId;

      // When & Then
      expect(() => comment.delete(otherUserId)).toThrow(
        "Only the author can edit this comment"
      );
    });

    it("댓글을 숨길 수 있다", () => {
      // Given
      const moderatorId = "moderator" as UserId;

      // When
      comment.hide(moderatorId);

      // Then
      expect(comment.getStatus()).toBe(CommentStatus.HIDDEN);
      expect(comment.getModeratedBy()).toBe(moderatorId);
      expect(comment.getModeratedAt()).toBeDefined();
    });

    it("숨김 댓글을 복원할 수 있다", () => {
      // Given
      const moderatorId = "moderator" as UserId;
      comment.hide(moderatorId);

      // When
      comment.restore(validCommentProps.authorId);

      // Then
      expect(comment.getStatus()).toBe(CommentStatus.PUBLISHED);
    });

    it("삭제된 댓글을 복원할 수 없다 (비즈니스 로직 제약)", () => {
      // Given
      comment.delete(validCommentProps.authorId);

      // When & Then
      expect(() => comment.restore(validCommentProps.authorId)).toThrow(
        "Cannot edit deleted comments"
      );
    });
  });

  describe("Comment Interaction", () => {
    let comment: Comment;

    beforeEach(() => {
      comment = Comment.create(
        validCommentProps.id,
        validCommentProps.postId,
        validCommentProps.authorId,
        validCommentProps.content
      );
    });

    it("좋아요 수를 증가시킬 수 있다", () => {
      // When
      comment.incrementUpvote();

      // Then
      expect(comment.getUpvoteCount()).toBe(1);
    });

    it("좋아요 수를 감소시킬 수 있다", () => {
      // Given
      comment.incrementUpvote();

      // When
      comment.decrementUpvote();

      // Then
      expect(comment.getUpvoteCount()).toBe(0);
    });

    it("좋아요 수는 0 이하로 감소하지 않는다", () => {
      // When
      comment.decrementUpvote();

      // Then
      expect(comment.getUpvoteCount()).toBe(0);
    });

    it("싫어요 수를 증가시킬 수 있다", () => {
      // When
      comment.incrementDownvote();

      // Then
      expect(comment.getDownvoteCount()).toBe(1);
    });

    it("싫어요 수를 감소시킬 수 있다", () => {
      // Given
      comment.incrementDownvote();

      // When
      comment.decrementDownvote();

      // Then
      expect(comment.getDownvoteCount()).toBe(0);
    });

    it("답글 수를 증가시킬 수 있다", () => {
      // When
      comment.incrementReplyCount();

      // Then
      expect(comment.getReplyCount()).toBe(1);
    });

    it("답글 수를 감소시킬 수 있다", () => {
      // Given
      comment.incrementReplyCount();

      // When
      comment.decrementReplyCount();

      // Then
      expect(comment.getReplyCount()).toBe(0);
    });
  });

  describe("Comment Status Checks", () => {
    let comment: Comment;

    beforeEach(() => {
      comment = Comment.create(
        validCommentProps.id,
        validCommentProps.postId,
        validCommentProps.authorId,
        validCommentProps.content
      );
    });

    it("최상위 댓글 여부를 확인할 수 있다", () => {
      // When & Then
      expect(comment.isTopLevel()).toBe(true);
      expect(comment.isReply()).toBe(false);
    });

    it("답글 여부를 확인할 수 있다", () => {
      // Given
      const replyComment = Comment.create(
        createCommentId("reply"),
        validCommentProps.postId,
        validCommentProps.authorId,
        validCommentProps.content,
        validCommentProps.id,
        1
      );

      // When & Then
      expect(replyComment.isTopLevel()).toBe(false);
      expect(replyComment.isReply()).toBe(true);
    });

    it("활성 상태를 확인할 수 있다", () => {
      // When & Then
      expect(comment.isActive()).toBe(true);

      // Given
      comment.delete(validCommentProps.authorId);

      // When & Then
      expect(comment.isActive()).toBe(false);
    });

    it("편집 권한을 확인할 수 있다", () => {
      // When & Then
      expect(comment.canEdit(validCommentProps.authorId)).toBe(true);
      expect(comment.canEdit("other-user" as UserId)).toBe(false);
    });

    it("답글 가능 여부를 확인할 수 있다", () => {
      // Given
      const topLevelComment = Comment.create(
        createCommentId("top-level"),
        validCommentProps.postId,
        validCommentProps.authorId,
        validCommentProps.content
      );

      const level1Comment = Comment.create(
        createCommentId("level-1"),
        validCommentProps.postId,
        validCommentProps.authorId,
        validCommentProps.content,
        createCommentId("parent"),
        1
      );

      const level2Comment = Comment.create(
        createCommentId("level-2"),
        validCommentProps.postId,
        validCommentProps.authorId,
        validCommentProps.content,
        createCommentId("parent"),
        2
      );

      // When & Then
      expect(topLevelComment.canReply()).toBe(true);
      expect(level1Comment.canReply()).toBe(true);
      expect(level2Comment.canReply()).toBe(false);
    });
  });

  describe("Comment Analytics", () => {
    let comment: Comment;

    beforeEach(() => {
      comment = Comment.create(
        validCommentProps.id,
        validCommentProps.postId,
        validCommentProps.authorId,
        validCommentProps.content
      );
    });

    it("생성 포인트를 계산할 수 있다", () => {
      // When
      const points = comment.calculateCreationPoints();

      // Then
      expect(points).toBeDefined();
      expect(points.amount).toBe(5); // 최상위 댓글
      expect(points.type).toBe("PmpAmount");
    });

    it("답글의 생성 포인트를 계산할 수 있다", () => {
      // Given
      const replyComment = Comment.create(
        createCommentId("reply"),
        validCommentProps.postId,
        validCommentProps.authorId,
        validCommentProps.content,
        validCommentProps.id,
        1
      );

      // When
      const points = replyComment.calculateCreationPoints();

      // Then
      expect(points.amount).toBe(3); // 답글
    });

    it("대댓글의 생성 포인트를 계산할 수 있다", () => {
      // Given
      const deepReplyComment = Comment.create(
        createCommentId("deep-reply"),
        validCommentProps.postId,
        validCommentProps.authorId,
        validCommentProps.content,
        validCommentProps.id,
        2
      );

      // When
      const points = deepReplyComment.calculateCreationPoints();

      // Then
      expect(points.amount).toBe(2); // 대댓글
    });

    it("품질 점수를 계산할 수 있다", () => {
      // Given
      comment.incrementUpvote();

      // When
      const score = comment.calculateQualityScore();

      // Then
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });

    it("인기도 점수를 계산할 수 있다", () => {
      // Given
      comment.incrementUpvote();
      comment.incrementReplyCount();

      // When
      const score = comment.calculatePopularityScore();

      // Then
      expect(score).toBeGreaterThan(0);
      expect(typeof score).toBe("number");
    });
  });

  describe("Comment Metadata", () => {
    let comment: Comment;

    beforeEach(() => {
      comment = Comment.create(
        validCommentProps.id,
        validCommentProps.postId,
        validCommentProps.authorId,
        validCommentProps.content
      );
    });

    it("메타데이터를 올바르게 반환한다", () => {
      // Given
      comment.incrementUpvote();
      comment.incrementDownvote();
      comment.incrementReplyCount();

      // When
      const metadata = comment.getMetadata();

      // Then
      expect(metadata.isEdited).toBe(false);
      expect(metadata.depth).toBe(0);
      expect(metadata.hasReplies).toBe(true);
      expect(metadata.totalVotes).toBe(2);
      expect(metadata.netVotes).toBe(0);
    });

    it("수정된 댓글의 메타데이터를 올바르게 반환한다", () => {
      // Given
      const newContent = createCommentContent("수정된 내용입니다.");
      comment.updateContent(newContent, validCommentProps.authorId);

      // When
      const metadata = comment.getMetadata();

      // Then
      expect(metadata.isEdited).toBe(true);
      expect(metadata.editedAt).toBeDefined();
    });
  });

  describe("Comment Restoration", () => {
    it("기존 댓글을 복원할 수 있다", () => {
      // Given
      const now = new Date();

      // When
      const restoredComment = Comment.restore(
        validCommentProps.id,
        validCommentProps.postId,
        validCommentProps.authorId,
        validCommentProps.content,
        CommentStatus.PUBLISHED,
        now,
        now,
        undefined,
        0,
        5, // upvoteCount
        1, // downvoteCount
        3, // replyCount
        undefined,
        undefined,
        true, // isEdited
        now
      );

      // Then
      expect(restoredComment.getId()).toBe(validCommentProps.id);
      expect(restoredComment.getStatus()).toBe(CommentStatus.PUBLISHED);
      expect(restoredComment.getUpvoteCount()).toBe(5);
      expect(restoredComment.getDownvoteCount()).toBe(1);
      expect(restoredComment.getReplyCount()).toBe(3);
      expect(restoredComment.getIsEdited()).toBe(true);
    });
  });

  describe("Event Data", () => {
    it("도메인 이벤트 데이터를 올바르게 반환한다", () => {
      // Given
      const comment = Comment.create(
        validCommentProps.id,
        validCommentProps.postId,
        validCommentProps.authorId,
        validCommentProps.content
      );

      // When
      const eventData = comment.getEventData();

      // Then
      expect(eventData.commentId).toBe(validCommentProps.id);
      expect(eventData.postId).toBe(validCommentProps.postId);
      expect(eventData.authorId).toBe(validCommentProps.authorId);
      expect(eventData.depth).toBe(0);
      expect(eventData.status).toBe(CommentStatus.PUBLISHED);
      expect(eventData.createdAt).toBeInstanceOf(Date);
      expect(eventData.updatedAt).toBeInstanceOf(Date);
    });
  });

  describe("Comment Threading", () => {
    it("최상위 댓글의 스레드 ID는 자신의 ID이다", () => {
      // Given
      const comment = Comment.create(
        validCommentProps.id,
        validCommentProps.postId,
        validCommentProps.authorId,
        validCommentProps.content
      );

      // When
      const threadId = comment.getThreadId();

      // Then
      expect(threadId).toBe(validCommentProps.id);
    });

    it("답글의 스레드 ID는 부모 댓글 ID이다", () => {
      // Given
      const parentId = createCommentId("parent-comment");
      const replyComment = Comment.create(
        createCommentId("reply"),
        validCommentProps.postId,
        validCommentProps.authorId,
        validCommentProps.content,
        parentId,
        1
      );

      // When
      const threadId = replyComment.getThreadId();

      // Then
      expect(threadId).toBe(parentId);
    });

    it("댓글 경로를 생성할 수 있다", () => {
      // Given
      const topLevelComment = Comment.create(
        validCommentProps.id,
        validCommentProps.postId,
        validCommentProps.authorId,
        validCommentProps.content
      );

      const replyComment = Comment.create(
        createCommentId("reply"),
        validCommentProps.postId,
        validCommentProps.authorId,
        validCommentProps.content,
        validCommentProps.id,
        1
      );

      // When
      const topLevelPath = topLevelComment.getCommentPath();
      const replyPath = replyComment.getCommentPath();

      // Then
      expect(topLevelPath).toBe(validCommentProps.id);
      expect(replyPath).toContain(validCommentProps.id);
      expect(replyPath).toContain("reply");
    });
  });
});
