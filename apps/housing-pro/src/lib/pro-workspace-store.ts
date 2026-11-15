"use client";

import { useState, useEffect, useCallback } from "react";
import { type ComplexProfile } from "@/components/pro-view/complex-profile-bar";
import {
  INITIAL_PRO_COMMUNITY_POSTS,
  type ProCommunityPost,
} from "@/data/mock-pro-community";
import {
  MOCK_LEGAL_OBLIGATIONS,
  type LegalObligationRule,
} from "@/data/mock-legal-obligations";

const PRO_STORAGE_KEY = "housing_pro_workspace_v1";
const PERSONA_MODE_KEY = "housing_pro_persona_mode";
const PRO_SYNC_EVENT = "housing-pro-workspace-sync";

export type PersonaMode = "student" | "pro";

export function getSavedPersonaMode(): PersonaMode {
  if (typeof globalThis === "undefined" || !("localStorage" in globalThis)) {
    return "student";
  }
  const saved = globalThis.localStorage.getItem(PERSONA_MODE_KEY);
  return saved === "pro" ? "pro" : "student";
}

export function setSavedPersonaMode(mode: PersonaMode): void {
  if (typeof globalThis === "undefined" || !("localStorage" in globalThis)) return;
  globalThis.localStorage.setItem(PERSONA_MODE_KEY, mode);
}

export type LegalMonthStatus = "done" | "due" | "upcoming";

export interface ProWorkspaceState {
  complexProfile: ComplexProfile;
  userPmpBalance: number;
  userPmcBalance: number;
  /** 법정의무 ID -> 해당 월(1~12) 상태 */
  annualMatrix: Record<string, Record<number, LegalMonthStatus>>;
  obligations: LegalObligationRule[];
  communityPosts: ProCommunityPost[];
  votedPostOptions: Record<string, string>;
  likedPostIds: string[];
}

function createInitialAnnualMatrix(): Record<string, Record<number, LegalMonthStatus>> {
  const matrix: Record<string, Record<number, LegalMonthStatus>> = {};
  for (const rule of MOCK_LEGAL_OBLIGATIONS) {
    const months: Record<number, LegalMonthStatus> = {};
    if (rule.cycleRule === "MONTHLY") {
      for (let m = 1; m <= 10; m++) months[m] = "done";
      months[11] = "due";
      months[12] = "upcoming";
    } else if (rule.cycleRule === "QUARTERLY") {
      months[3] = "done";
      months[6] = "done";
      months[9] = "done";
      months[12] = "upcoming";
    } else if (rule.cycleRule === "HALF_YEARLY") {
      months[5] = "done";
      months[11] = "due";
    } else if (rule.cycleRule === "ANNUAL") {
      months[11] = "due";
    } else {
      months[12] = "due";
    }
    matrix[rule.id] = months;
  }
  return matrix;
}

function createDefaultProState(): ProWorkspaceState {
  return {
    complexProfile: {
      name: "래미안 파크팰리스",
      totalHouseholds: 1240,
      buildingCount: 14,
      elevatorCount: 28,
      heatingType: "지역난방",
      fireGrade: "1급",
      completionDate: "2018-05",
      accidentFreeDays: 342,
      savedFineAmountKrw: 48000000,
    },
    userPmpBalance: 1250,
    userPmcBalance: 340,
    annualMatrix: createInitialAnnualMatrix(),
    obligations: MOCK_LEGAL_OBLIGATIONS,
    communityPosts: INITIAL_PRO_COMMUNITY_POSTS,
    votedPostOptions: {},
    likedPostIds: [],
  };
}

function readProState(): ProWorkspaceState {
  if (typeof globalThis === "undefined" || !("localStorage" in globalThis)) {
    return createDefaultProState();
  }
  try {
    const raw = globalThis.localStorage.getItem(PRO_STORAGE_KEY);
    if (!raw) return createDefaultProState();
    const parsed = JSON.parse(raw) as Partial<ProWorkspaceState>;
    const fallback = createDefaultProState();
    return {
      complexProfile: parsed.complexProfile || fallback.complexProfile,
      userPmpBalance: parsed.userPmpBalance ?? fallback.userPmpBalance,
      userPmcBalance: parsed.userPmcBalance ?? fallback.userPmcBalance,
      annualMatrix: parsed.annualMatrix || fallback.annualMatrix,
      obligations: parsed.obligations || fallback.obligations,
      communityPosts: parsed.communityPosts || fallback.communityPosts,
      votedPostOptions: parsed.votedPostOptions || {},
      likedPostIds: parsed.likedPostIds || [],
    };
  } catch {
    return createDefaultProState();
  }
}

function persistProState(next: ProWorkspaceState): void {
  if (typeof globalThis === "undefined" || !("localStorage" in globalThis)) return;
  try {
    globalThis.localStorage.setItem(PRO_STORAGE_KEY, JSON.stringify(next));
    globalThis.dispatchEvent(new globalThis.Event(PRO_SYNC_EVENT));
  } catch {
    // ignore
  }
}

export function useProWorkspace() {
  const [state, setState] = useState<ProWorkspaceState>(() => createDefaultProState());

  useEffect(() => {
    setState(readProState());
    const onSync = () => setState(readProState());
    if (typeof globalThis !== "undefined" && "addEventListener" in globalThis) {
      globalThis.addEventListener(PRO_SYNC_EVENT, onSync);
      return () => globalThis.removeEventListener(PRO_SYNC_EVENT, onSync);
    }
    return undefined;
  }, []);

  const updateState = useCallback(
    (updater: (prev: ProWorkspaceState) => ProWorkspaceState) => {
      setState((prev) => {
        const next = updater(prev);
        persistProState(next);
        return next;
      });
    },
    []
  );

  const updateComplexProfile = useCallback(
    (profile: ComplexProfile) => {
      updateState((prev) => ({ ...prev, complexProfile: profile }));
    },
    [updateState]
  );

  const setUserPmpBalance = useCallback(
    (newBalance: number) => {
      updateState((prev) => ({ ...prev, userPmpBalance: newBalance }));
    },
    [updateState]
  );

  /** 과태료 방어 성공 시 누적 방어액 + 무사고일 + PMP 보상 */
  const defendFineSuccess = useCallback(
    (amountKrw: number) => {
      updateState((prev) => ({
        ...prev,
        complexProfile: {
          ...prev.complexProfile,
          savedFineAmountKrw: prev.complexProfile.savedFineAmountKrw + amountKrw,
          accidentFreeDays: prev.complexProfile.accidentFreeDays + 1,
        },
        userPmpBalance: prev.userPmpBalance + 25,
      }));
    },
    [updateState]
  );

  /** 연간 법정점검 매트릭스 월별 상태 순환 (비어있음 -> 예정 -> 완료 -> 비어있음) */
  const cycleAnnualMatrixCell = useCallback(
    (ruleId: string, month: number) => {
      updateState((prev) => {
        const ruleMonths = { ...(prev.annualMatrix[ruleId] || {}) };
        const current = ruleMonths[month];
        if (!current) ruleMonths[month] = "upcoming";
        else if (current === "upcoming") ruleMonths[month] = "due";
        else if (current === "due") ruleMonths[month] = "done";
        else delete ruleMonths[month];

        return {
          ...prev,
          annualMatrix: {
            ...prev.annualMatrix,
            [ruleId]: ruleMonths,
          },
        };
      });
    },
    [updateState]
  );

  /** 커뮤니티 집단지성 투표 참여 (+10 PMP) */
  const voteCommunityPoll = useCallback(
    (postId: string, optionId: string) => {
      updateState((prev) => {
        if (prev.votedPostOptions[postId]) return prev;
        return {
          ...prev,
          votedPostOptions: { ...prev.votedPostOptions, [postId]: optionId },
          userPmpBalance: prev.userPmpBalance + 10,
          communityPosts: prev.communityPosts.map((post) => {
            if (post.id !== postId || !post.poll) return post;
            return {
              ...post,
              poll: {
                ...post.poll,
                options: post.poll.options.map((o) =>
                  o.id === optionId ? { ...o, votes: o.votes + 1 } : o
                ),
              },
            };
          }),
        };
      });
    },
    [updateState]
  );

  /** 커뮤니티 댓글 작성 (+15 PMP) */
  const addCommunityComment = useCallback(
    (postId: string, text: string, lawRef?: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      updateState((prev) => ({
        ...prev,
        userPmpBalance: prev.userPmpBalance + 15,
        communityPosts: prev.communityPosts.map((post) => {
          if (post.id !== postId) return post;
          return {
            ...post,
            commentCount: post.commentCount + 1,
            comments: [
              ...post.comments,
              {
                id: `c-${Date.now()}`,
                author: `${prev.complexProfile.name} 소장`,
                badge: "현직인증",
                text: trimmed,
                lawRef: lawRef?.trim() || undefined,
              },
            ],
          };
        }),
      }));
    },
    [updateState]
  );

  /** 커뮤니티 새 실무 질문/사례 등록 (+20 PMP) */
  const createCommunityPost = useCallback(
    (params: {
      category: ProCommunityPost["category"];
      categoryLabel: string;
      title: string;
      content: string;
      pollQuestion?: string;
    }) => {
      updateState((prev) => {
        const newPost: ProCommunityPost = {
          id: `pro-post-${Date.now()}`,
          category: params.category,
          categoryLabel: params.categoryLabel,
          authorName: `${prev.complexProfile.name} 소장`,
          complexBadge: `${prev.complexProfile.totalHouseholds.toLocaleString()}세대 · ${prev.complexProfile.heatingType}`,
          createdAt: "방금 전",
          title: params.title.trim(),
          content: params.content.trim(),
          pmpReward: 20,
          likes: 1,
          commentCount: 0,
          comments: [],
          poll: params.pollQuestion?.trim()
            ? {
                question: params.pollQuestion.trim(),
                options: [
                  { id: "opt-a", label: "장기수선충당금 / 법정의무 처리", votes: 1 },
                  { id: "opt-b", label: "수선유지비 / 일반관리비 처리", votes: 0 },
                  { id: "opt-c", label: "입대의 의결·유권해석 후 진행", votes: 0 },
                ],
              }
            : undefined,
        };
        return {
          ...prev,
          userPmpBalance: prev.userPmpBalance + 20,
          communityPosts: [newPost, ...prev.communityPosts],
        };
      });
    },
    [updateState]
  );

  /** 좋아요 토글 */
  const toggleLikePost = useCallback(
    (postId: string) => {
      updateState((prev) => {
        const liked = prev.likedPostIds.includes(postId);
        return {
          ...prev,
          likedPostIds: liked
            ? prev.likedPostIds.filter((id) => id !== postId)
            : [...prev.likedPostIds, postId],
          communityPosts: prev.communityPosts.map((p) =>
            p.id === postId ? { ...p, likes: p.likes + (liked ? -1 : 1) } : p
          ),
        };
      });
    },
    [updateState]
  );

  return {
    ...state,
    updateComplexProfile,
    setUserPmpBalance,
    defendFineSuccess,
    cycleAnnualMatrixCell,
    voteCommunityPoll,
    addCommunityComment,
    createCommunityPost,
    toggleLikePost,
  };
}
