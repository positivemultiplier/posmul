/**
 * Forum API Hooks
 *
 * Forum 관련 API 호출 및 상태 관리
 */
"use client";

import { useState, useCallback } from "react";

// Types
export interface ForumPost {
  id: string;
  title: string;
  content: string;
  postType: string;
  tags: string[];
  viewCount: number;
  likeCount: number;
  commentCount: number;
  pmpEarned: number;
  createdAt: string;
  categoryId: string;
}

export interface ForumComment {
  id: string;
  content: string;
  depth: number;
  parentCommentId: string | null;
  likeCount: number;
  dislikeCount: number;
  replyCount: number;
  pmpEarned: number;
  createdAt: string;
  authorId: string;
}

export interface ForumActivity {
  type: string;
  count: number;
  pmpEarned: number;
  remaining: number;
}

export interface DailyLimitInfo {
  type: string;
  dailyLimit: number;
  pmpPerAction: number;
  maxDailyPmp: number;
}

export interface ForumActivitySummary {
  today: {
    activities: Record<string, ForumActivity>;
    totalPmpEarned: number;
    dailyMaxRemaining: number;
    dailyMaxPmp: number;
  };
  recentActivities: Array<{
    id: string;
    type: string;
    description: string;
    pmpEarned: number;
    createdAt: string;
  }>;
  limits: DailyLimitInfo[];
}

// API Response Types
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

/**
 * Forum Posts Hook
 */
export function useForumPosts() {
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPosts = useCallback(
    async (options?: {
      categoryId?: string;
      postType?: string;
      limit?: number;
      offset?: number;
    }) => {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams();
        if (options?.categoryId) params.set("categoryId", options.categoryId);
        if (options?.postType) params.set("postType", options.postType);
        if (options?.limit) params.set("limit", options.limit.toString());
        if (options?.offset) params.set("offset", options.offset.toString());

        const response = await fetch(`/api/forum/posts?${params.toString()}`);
        const result: ApiResponse<{ posts: ForumPost[] }> = await response.json();

        if (result.success && result.data) {
          setPosts(result.data.posts);
        } else {
          setError(result.error?.message || "게시글을 불러오는데 실패했습니다.");
        }
      } catch (err) {
        setError("서버 연결에 실패했습니다.");
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const createPost = useCallback(
    async (data: {
      categoryId: string;
      title: string;
      content: string;
      postType: string;
      tags?: string[];
    }): Promise<{ success: boolean; pmpEarned?: number; postId?: string; error?: string }> => {
      try {
        const response = await fetch("/api/forum/posts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });

        const result: ApiResponse<{
          postId: string;
          pmpEarned: number;
          dailyRemaining: number;
        }> = await response.json();

        if (result.success && result.data) {
          return {
            success: true,
            pmpEarned: result.data.pmpEarned,
            postId: result.data.postId,
          };
        } else {
          return {
            success: false,
            error: result.error?.message || "게시글 작성에 실패했습니다.",
          };
        }
      } catch (err) {
        return { success: false, error: "서버 연결에 실패했습니다." };
      }
    },
    []
  );

  return {
    posts,
    loading,
    error,
    fetchPosts,
    createPost,
  };
}

/**
 * Forum Comments Hook
 */
export function useForumComments(postId: string) {
  const [comments, setComments] = useState<ForumComment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchComments = useCallback(async () => {
    if (!postId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/forum/posts/${postId}/comments`);
      const result: ApiResponse<{ comments: ForumComment[] }> = await response.json();

      if (result.success && result.data) {
        setComments(result.data.comments);
      } else {
        setError(result.error?.message || "댓글을 불러오는데 실패했습니다.");
      }
    } catch (err) {
      setError("서버 연결에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }, [postId]);

  const createComment = useCallback(
    async (
      content: string,
      parentCommentId?: string
    ): Promise<{ success: boolean; pmpEarned?: number; commentId?: string; error?: string }> => {
      try {
        const response = await fetch(`/api/forum/posts/${postId}/comments`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content, parentCommentId }),
        });

        const result: ApiResponse<{
          commentId: string;
          pmpEarned: number;
          dailyRemaining: number;
        }> = await response.json();

        if (result.success && result.data) {
          // 댓글 목록 새로고침
          await fetchComments();
          return {
            success: true,
            pmpEarned: result.data.pmpEarned,
            commentId: result.data.commentId,
          };
        } else {
          return {
            success: false,
            error: result.error?.message || "댓글 작성에 실패했습니다.",
          };
        }
      } catch (err) {
        return { success: false, error: "서버 연결에 실패했습니다." };
      }
    },
    [postId, fetchComments]
  );

  return {
    comments,
    loading,
    error,
    fetchComments,
    createComment,
  };
}

/**
 * Forum Activity Summary Hook
 */
export function useForumActivity() {
  const [activity, setActivity] = useState<ForumActivitySummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchActivity = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/forum/activity");
      const result: ApiResponse<ForumActivitySummary> = await response.json();

      if (result.success && result.data) {
        setActivity(result.data);
      } else {
        setError(result.error?.message || "활동 현황을 불러오는데 실패했습니다.");
      }
    } catch (err) {
      setError("서버 연결에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    activity,
    loading,
    error,
    fetchActivity,
  };
}
