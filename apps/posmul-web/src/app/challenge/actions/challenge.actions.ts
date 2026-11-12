"use server";

import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import {
  UserChallengeDTO,
  ChallengeOption,
  ChallengeCommentDTO,
} from "../types";

const OPTION_IDS = ["A", "B", "C", "D"] as const;

function resolveChallengeDisplayName(user: {
  id: string;
  email?: string;
  user_metadata?: Record<string, unknown>;
}): string {
  const metaName =
    (typeof user.user_metadata?.name === "string" && user.user_metadata.name) ||
    (typeof user.user_metadata?.full_name === "string" &&
      user.user_metadata.full_name) ||
    user.email?.split("@")[0];
  return metaName || `도전자_${user.id.substring(0, 4)}`;
}

function formatPmpRpcError(err: unknown, fallback: string): string {
  const msg =
    err && typeof err === "object" && "message" in err
      ? String((err as { message?: unknown }).message)
      : "";
  if (msg.includes("INSUFFICIENT_PMP_BALANCE")) {
    return "PMP 잔고가 부족합니다! 포럼 활동이나 출석으로 PMP를 모아 다시 도전해 보세요.";
  }
  if (msg.includes("FORBIDDEN_NOT_HOST")) {
    return "방장(개설자)만 결과를 확정할 수 있습니다.";
  }
  if (msg.includes("ONLY_LOSER_CAN_CONFIRM_GG")) {
    return "패배 측 참여자만 즉시 인정(GG)을 누를 수 있습니다.";
  }
  if (msg.includes("ALREADY_DISPUTED")) {
    return "이미 판정 이의를 제기하셨습니다.";
  }
  if (msg.includes("ONLY_PARTICIPANT_CAN_DISPUTE")) {
    return "해당 내기에 참여한 유저만 이의를 제기할 수 있습니다.";
  }
  return msg || fallback;
}

function computeOptionRatios(rawOptions: ChallengeOption[]): {
  options: ChallengeOption[];
  totalPmp: number;
} {
  const totalPmp = rawOptions.reduce((acc, cur) => acc + (cur.pmp || 0), 0);
  const options = rawOptions.map((opt) => ({
    ...opt,
    ratio: totalPmp > 0 ? Math.round(((opt.pmp || 0) / totalPmp) * 100) : 0,
  }));
  return { options, totalPmp };
}

function resolveEffectiveStatus(
  status: string,
  eventStartAt: string
): UserChallengeDTO["status"] {
  if (status === "OPEN" && Date.now() >= new Date(eventStartAt).getTime()) {
    return "LOCKED";
  }
  if (
    status === "OPEN" ||
    status === "LOCKED" ||
    status === "PENDING_SETTLEMENT" ||
    status === "SETTLED" ||
    status === "VOID"
  ) {
    return status;
  }
  return "OPEN";
}

function mapChallengeRowToDto(
  data: Record<string, unknown>,
  viewerUserId?: string,
  myBet?: { optionId: string; amountPmp: number }
): UserChallengeDTO {
  const rawOptions = (data.options as ChallengeOption[]) || [];
  const { options, totalPmp } = computeOptionRatios(rawOptions);
  const winningOptId =
    typeof data.winning_option_id === "string" ? data.winning_option_id : null;
  const pendingOptId =
    typeof data.pending_winning_option_id === "string"
      ? data.pending_winning_option_id
      : null;

  const winningOption = options.find((o) => o.id === winningOptId);
  const pendingOption = options.find((o) => o.id === pendingOptId);
  const disputeVoters = Array.isArray(data.dispute_voters)
    ? (data.dispute_voters as string[])
    : [];
  const hostId = String(data.host_id || "");

  return {
    id: String(data.id),
    hostId,
    hostName: String(data.host_name || "방장시민"),
    title: String(data.title || ""),
    options,
    category: (data.category as UserChallengeDTO["category"]) || "CASUAL",
    visibility: (data.visibility as UserChallengeDTO["visibility"]) || "PUBLIC",
    eventStartAt: String(data.event_start_at),
    settlementAt: String(data.settlement_at),
    settledAt: typeof data.settled_at === "string" ? data.settled_at : null,
    status: resolveEffectiveStatus(
      String(data.status || "OPEN"),
      String(data.event_start_at)
    ),
    winningOptionId: winningOptId,
    winningOptionLabel: winningOption?.label ?? null,
    pendingWinningOptionId: pendingOptId,
    pendingWinningOptionLabel: pendingOption?.label ?? null,
    settlementProposedAt:
      typeof data.settlement_proposed_at === "string"
        ? data.settlement_proposed_at
        : null,
    linkedGameId:
      typeof data.linked_game_id === "string" ? data.linked_game_id : null,
    linkedGameSlug:
      typeof data.linked_game_slug === "string" ? data.linked_game_slug : null,
    linkedGameTitle:
      typeof data.linked_game_title === "string" ? data.linked_game_title : null,
    totalPoolPmp: totalPmp || Number(data.total_pool_pmp || 0),
    hostFeePmp: Number(data.host_fee_pmp || 0),
    disputeCount: Number(data.dispute_count || disputeVoters.length || 0),
    hasDisputed: Boolean(viewerUserId && disputeVoters.includes(viewerUserId)),
    isHost: Boolean(viewerUserId && hostId === viewerUserId),
    payoutDetails:
      (data.payout_details as UserChallengeDTO["payoutDetails"]) ?? null,
    createdAt: String(data.created_at),
    myBet,
  };
}

/**
 * 1. 유저 자율 예측 / 맞짱 생성 (단독 또는 공식 게임 꼬리 연결 · 실제 PMP 차감)
 */
export async function createChallengeAction(params: {
  title: string;
  options: string[];
  category: "CASUAL" | "SPORTS" | "FANDOM" | "COMPANY" | "COUPLE" | "STUDY";
  visibility: "PRIVATE" | "PUBLIC";
  durationHours: number;
  hostOptionIndex: number;
  hostBetAmount: number;
  linkedGameId?: string;
  linkedGameSlug?: string;
  linkedGameTitle?: string;
}): Promise<{
  success: boolean;
  challengeId?: string;
  requireLogin?: boolean;
  error?: string;
}> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return {
        success: false,
        requireLogin: true,
        error: "내기 룸을 개설하려면 로그인이 필요합니다.",
      };
    }

    if (!params.title.trim() || params.options.length < 2) {
      return {
        success: false,
        error: "질문과 최소 2개 이상의 선택지를 입력해주세요.",
      };
    }

    const betAmount = Math.max(50, Math.round(Number(params.hostBetAmount) || 0));
    const safePickIdx =
      params.hostOptionIndex >= 0 && params.hostOptionIndex < Math.min(4, params.options.length)
        ? params.hostOptionIndex
        : 0;

    const hostId = user.id;
    const hostName = resolveChallengeDisplayName(user);
    const now = new Date();
    const eventStartAt = new Date(
      now.getTime() + Math.max(0.25, params.durationHours) * 60 * 60 * 1000
    );
    const settlementAt = new Date(eventStartAt.getTime() + 2 * 60 * 60 * 1000);

    const initialOptions: ChallengeOption[] = params.options
      .slice(0, 4)
      .map((label, idx) => {
        const isHostPick = idx === safePickIdx;
        return {
          id: OPTION_IDS[idx],
          label: label.trim(),
          votes: isHostPick ? 1 : 0,
          pmp: isHostPick ? betAmount : 0,
          ratio: isHostPick ? 100 : 0,
        };
      });

    const hostFee = Math.floor(betAmount * 0.03);
    const metadata: Record<string, unknown> = {};
    if (params.linkedGameSlug) {
      metadata.roomId = params.linkedGameSlug;
    }

    // 1. 챌린지 룸 생성
    const { data: challenge, error: challengeError } = await supabaseAdmin
      .schema("prediction")
      .from("user_challenges")
      .insert({
        host_id: hostId,
        host_name: hostName,
        title: params.title.trim(),
        options: initialOptions,
        category: params.category,
        visibility: params.visibility,
        event_start_at: eventStartAt.toISOString(),
        settlement_at: settlementAt.toISOString(),
        status: "OPEN",
        total_pool_pmp: betAmount,
        host_fee_pmp: hostFee,
        linked_game_id: params.linkedGameId || null,
        linked_game_slug: params.linkedGameSlug || null,
        linked_game_title: params.linkedGameTitle || null,
        metadata,
      })
      .select("id")
      .single();

    if (challengeError || !challenge) {
      console.error("createChallengeAction error:", challengeError);
      return {
        success: false,
        error: challengeError?.message || "챌린지 생성 실패",
      };
    }

    // 2. 실제 PMP 잔고 검증 및 차감 (실패 시 생성된 챌린지 롤백)
    const { error: deductError } = await supabaseAdmin.rpc(
      "deduct_challenge_pmp",
      {
        p_user_id: hostId,
        p_challenge_id: challenge.id,
        p_amount: betAmount,
        p_reason: "challenge_create",
      }
    );

    if (deductError) {
      await supabaseAdmin
        .schema("prediction")
        .from("user_challenges")
        .delete()
        .eq("id", challenge.id);
      return {
        success: false,
        error: formatPmpRpcError(deductError, "PMP 잔고 차감 실패"),
      };
    }

    // 3. 호스트 첫 베팅 내역 기록
    const hostOptionId = OPTION_IDS[safePickIdx];
    await supabaseAdmin
      .schema("prediction")
      .from("user_challenge_bets")
      .insert({
        challenge_id: challenge.id,
        user_id: hostId,
        user_name: hostName,
        option_id: hostOptionId,
        amount_pmp: betAmount,
      });

    revalidatePath("/challenge");
    revalidatePath("/prediction");
    return { success: true, challengeId: challenge.id };
  } catch (err: unknown) {
    console.error("createChallengeAction exception:", err);
    return {
      success: false,
      error: formatPmpRpcError(err, "챌린지 생성 중 오류가 발생했습니다."),
    };
  }
}

/**
 * 2. 챌린지 상세 및 실시간 투표 비율 조회 (+10분 경과 시 자동 합의 정산 실행)
 */
export async function getChallengeDetailAction(
  challengeId: string
): Promise<{ success: boolean; challenge?: UserChallengeDTO; error?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data: initialData, error } = await supabaseAdmin
      .schema("prediction")
      .from("user_challenges")
      .select("*")
      .eq("id", challengeId)
      .single();

    if (error || !initialData) {
      return {
        success: false,
        error: "존재하지 않거나 삭제된 챌린지입니다.",
      };
    }

    let data = initialData;
    // 이의제기 골든타임(10분) 경과 시 자동 확정 정산 시도
    if (data.status === "PENDING_SETTLEMENT") {
      await supabaseAdmin.rpc("finalize_challenge_settlement", {
        p_challenge_id: challengeId,
        p_actor_user_id: null,
        p_force_gg: false,
      });
      const refreshed = await supabaseAdmin
        .schema("prediction")
        .from("user_challenges")
        .select("*")
        .eq("id", challengeId)
        .single();
      if (refreshed.data) {
        data = refreshed.data;
      }
    }

    let myBet: { optionId: string; amountPmp: number } | undefined;
    if (user?.id) {
      const { data: betData } = await supabaseAdmin
        .schema("prediction")
        .from("user_challenge_bets")
        .select("option_id, amount_pmp")
        .eq("challenge_id", challengeId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (betData) {
        myBet = {
          optionId: betData.option_id,
          amountPmp: betData.amount_pmp,
        };
      }
    }

    return {
      success: true,
      challenge: mapChallengeRowToDto(
        data as Record<string, unknown>,
        user?.id,
        myBet
      ),
    };
  } catch (err: unknown) {
    console.error("getChallengeDetailAction exception:", err);
    return {
      success: false,
      error: formatPmpRpcError(err, "챌린지 조회 실패"),
    };
  }
}

/**
 * 3. 도전 수락 & 맞불 베팅 참여 (실제 PMP 차감 · 5명 달성 시 공개 피드 자동 승격)
 */
export async function participateChallengeAction(params: {
  challengeId: string;
  optionId: string;
  amountPmp: number;
}): Promise<{ success: boolean; requireLogin?: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return {
        success: false,
        requireLogin: true,
        error: "상대방과 라이벌 전적을 기록하려면 로그인이 필요합니다.",
      };
    }

    const betAmount = Math.max(50, Math.round(Number(params.amountPmp) || 0));
    const userId = user.id;
    const userName = resolveChallengeDisplayName(user);

    const { data: challenge } = await supabaseAdmin
      .schema("prediction")
      .from("user_challenges")
      .select("*")
      .eq("id", params.challengeId)
      .single();

    if (!challenge) {
      return { success: false, error: "챌린지를 찾을 수 없습니다." };
    }

    if (
      Date.now() >= new Date(challenge.event_start_at).getTime() ||
      challenge.status !== "OPEN"
    ) {
      return { success: false, error: "이미 베팅이 마감된 챌린지입니다." };
    }

    const { data: existingBet } = await supabaseAdmin
      .schema("prediction")
      .from("user_challenge_bets")
      .select("id")
      .eq("challenge_id", params.challengeId)
      .eq("user_id", userId)
      .maybeSingle();

    if (existingBet) {
      return { success: false, error: "이미 이 챌린지에 베팅하셨습니다!" };
    }

    // 1. 실제 PMP 에스크로 차감
    const { error: deductError } = await supabaseAdmin.rpc(
      "deduct_challenge_pmp",
      {
        p_user_id: userId,
        p_challenge_id: params.challengeId,
        p_amount: betAmount,
        p_reason: "challenge_participate",
      }
    );

    if (deductError) {
      return {
        success: false,
        error: formatPmpRpcError(deductError, "PMP 잔고 부족"),
      };
    }

    // 2. 베팅 내역 저장
    await supabaseAdmin
      .schema("prediction")
      .from("user_challenge_bets")
      .insert({
        challenge_id: params.challengeId,
        user_id: userId,
        user_name: userName,
        option_id: params.optionId,
        amount_pmp: betAmount,
      });

    // 3. 챌린지 통계 갱신 및 5명 돌파 시 퍼블릭 노출 자동 승격
    const currentOptions = (challenge.options as ChallengeOption[]) || [];
    const updatedOptions = currentOptions.map((opt) =>
      opt.id === params.optionId
        ? {
            ...opt,
            votes: (opt.votes || 0) + 1,
            pmp: (opt.pmp || 0) + betAmount,
          }
        : opt
    );

    const newTotalPool = (challenge.total_pool_pmp || 0) + betAmount;
    const newHostFee = Math.floor(newTotalPool * 0.03);
    const totalVotes = updatedOptions.reduce((acc, cur) => acc + cur.votes, 0);
    const newVisibility = totalVotes >= 5 ? "PUBLIC" : challenge.visibility;

    await supabaseAdmin
      .schema("prediction")
      .from("user_challenges")
      .update({
        options: updatedOptions,
        total_pool_pmp: newTotalPool,
        host_fee_pmp: newHostFee,
        visibility: newVisibility,
        updated_at: new Date().toISOString(),
      })
      .eq("id", params.challengeId);

    revalidatePath(`/challenge/${params.challengeId}`);
    revalidatePath("/challenge");
    return { success: true };
  } catch (err: unknown) {
    console.error("participateChallengeAction exception:", err);
    return {
      success: false,
      error: formatPmpRpcError(err, "베팅 참여 실패"),
    };
  }
}

/**
 * 4. 챌린지 룸 내 타임라인 댓글 조회 & 작성
 */
export async function getChallengeCommentsAction(
  challengeId: string
): Promise<{ success: boolean; comments: ChallengeCommentDTO[] }> {
  try {
    const { data, error } = await supabaseAdmin
      .schema("prediction")
      .from("user_challenge_comments")
      .select("*")
      .eq("challenge_id", challengeId)
      .order("created_at", { ascending: true })
      .limit(50);

    if (error || !data) {
      return { success: false, comments: [] };
    }

    const mapped: ChallengeCommentDTO[] = data.map((c) => ({
      id: c.id,
      challengeId: c.challenge_id,
      userId: c.user_id,
      userName: c.user_name,
      optionId: c.option_id,
      message: c.message,
      createdAt: c.created_at,
    }));

    return { success: true, comments: mapped };
  } catch (err) {
    console.error("getChallengeCommentsAction error:", err);
    return { success: false, comments: [] };
  }
}

export async function postChallengeCommentAction(params: {
  challengeId: string;
  message: string;
  optionId?: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "댓글을 남기려면 로그인이 필요합니다." };
    }

    const userName = resolveChallengeDisplayName(user);
    await supabaseAdmin
      .schema("prediction")
      .from("user_challenge_comments")
      .insert({
        challenge_id: params.challengeId,
        user_id: user.id,
        user_name: userName,
        option_id: params.optionId,
        message: params.message.slice(0, 200),
      });

    return { success: true };
  } catch (err: unknown) {
    return {
      success: false,
      error: formatPmpRpcError(err, "댓글 등록 실패"),
    };
  }
}

/**
 * 5. 호스트의 결과 확정 제안 (호스트 인증 필수 · 단독/쏠림 즉시 환불, 대결 시 10분 합의창 시작)
 */
export async function settleChallengeAction(params: {
  challengeId: string;
  winningOptionId: string;
}): Promise<{ success: boolean; resultStatus?: string; error?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "정산을 확정하려면 로그인이 필요합니다." };
    }

    const { data, error } = await supabaseAdmin.rpc(
      "propose_challenge_settlement",
      {
        p_challenge_id: params.challengeId,
        p_host_user_id: user.id,
        p_winning_option_id: params.winningOptionId,
      }
    );

    if (error) {
      return {
        success: false,
        error: formatPmpRpcError(error, "정산 제안 처리 실패"),
      };
    }

    revalidatePath(`/challenge/${params.challengeId}`);
    revalidatePath("/challenge");
    const status =
      data && typeof data === "object" && "status" in data
        ? String((data as { status?: unknown }).status)
        : undefined;
    return { success: true, resultStatus: status };
  } catch (err: unknown) {
    return {
      success: false,
      error: formatPmpRpcError(err, "정산 처리 실패"),
    };
  }
}

/**
 * 5-1. 패배 측 참여자의 1초 인정(GG) 즉시 정산 실행
 */
export async function acceptChallengeResultAction(params: {
  challengeId: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "로그인이 필요합니다." };
    }

    const { error } = await supabaseAdmin.rpc("finalize_challenge_settlement", {
      p_challenge_id: params.challengeId,
      p_actor_user_id: user.id,
      p_force_gg: true,
    });

    if (error) {
      return {
        success: false,
        error: formatPmpRpcError(error, "GG 인정 정산 처리 실패"),
      };
    }

    revalidatePath(`/challenge/${params.challengeId}`);
    revalidatePath("/challenge");
    return { success: true };
  } catch (err: unknown) {
    return {
      success: false,
      error: formatPmpRpcError(err, "GG 정산 처리 오류"),
    };
  }
}

/**
 * 5-2. 참여자 판정 이의 제기 (30% 이상 동의 시 전액 PMP 환불 VOID)
 */
export async function disputeChallengeResultAction(params: {
  challengeId: string;
}): Promise<{ success: boolean; voided?: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "로그인이 필요합니다." };
    }

    const { data, error } = await supabaseAdmin.rpc(
      "dispute_challenge_settlement",
      {
        p_challenge_id: params.challengeId,
        p_user_id: user.id,
      }
    );

    if (error) {
      return {
        success: false,
        error: formatPmpRpcError(error, "이의제기 처리 실패"),
      };
    }

    revalidatePath(`/challenge/${params.challengeId}`);
    revalidatePath("/challenge");
    const status =
      data && typeof data === "object" && "status" in data
        ? String((data as { status?: unknown }).status)
        : "";
    return { success: true, voided: status === "VOID" };
  } catch (err: unknown) {
    return {
      success: false,
      error: formatPmpRpcError(err, "이의제기 처리 오류"),
    };
  }
}

/**
 * 6. 오픈 챌린지(단독 + 꼬리 통합) 피드 조회
 */
export async function getPublicChallengesAction(): Promise<{
  success: boolean;
  challenges: UserChallengeDTO[];
}> {
  try {
    const { data } = await supabaseAdmin
      .schema("prediction")
      .from("user_challenges")
      .select("*")
      .eq("visibility", "PUBLIC")
      .order("created_at", { ascending: false })
      .limit(24);

    const challenges = (data || []).map((d) =>
      mapChallengeRowToDto(d as Record<string, unknown>)
    );
    return { success: true, challenges };
  } catch {
    return { success: false, challenges: [] };
  }
}

/**
 * 6-1. 특정 공식 예측 게임에 달린 꼬리 내기 목록 조회
 */
export async function getTailChallengesForGameAction(
  gameId: string,
  slug?: string
): Promise<UserChallengeDTO[]> {
  try {
    const query = supabaseAdmin
      .schema("prediction")
      .from("user_challenges")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20);

    const { data } = await (slug
      ? query.or(`linked_game_id.eq.${gameId},linked_game_slug.eq.${slug}`)
      : query.eq("linked_game_id", gameId));

    if (!data) return [];
    return data
      .slice(0, 8)
      .map((d) => mapChallengeRowToDto(d as Record<string, unknown>));
  } catch (err) {
    console.warn("getTailChallengesForGameAction warning:", err);
    return [];
  }
}

/**
 * 7. 호스트와 현재 유저 간의 1:1 라이벌 전적 조회 (N승 N패, 뺏어온 PMP)
 */
export async function getRivalRecordAction(hostId: string): Promise<{
  success: boolean;
  isSelf: boolean;
  isLoggedIn: boolean;
  rivalName?: string;
  myWins: number;
  hostWins: number;
  totalMatches: number;
  netPmpWon: number;
}> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return {
        success: true,
        isSelf: false,
        isLoggedIn: false,
        myWins: 0,
        hostWins: 0,
        totalMatches: 0,
        netPmpWon: 0,
      };
    }

    if (user.id === hostId) {
      return {
        success: true,
        isSelf: true,
        isLoggedIn: true,
        myWins: 0,
        hostWins: 0,
        totalMatches: 0,
        netPmpWon: 0,
      };
    }

    const { data: myBets } = await supabaseAdmin
      .schema("prediction")
      .from("user_challenge_bets")
      .select("challenge_id, option_id, amount_pmp")
      .eq("user_id", user.id);

    if (!myBets || myBets.length === 0) {
      return {
        success: true,
        isSelf: false,
        isLoggedIn: true,
        myWins: 0,
        hostWins: 0,
        totalMatches: 0,
        netPmpWon: 0,
      };
    }

    const challengeIds = myBets.map((b) => b.challenge_id);
    const { data: hostChallenges } = await supabaseAdmin
      .schema("prediction")
      .from("user_challenges")
      .select("id, host_id, status, winning_option_id, options")
      .eq("host_id", hostId)
      .eq("status", "SETTLED")
      .in("id", challengeIds);

    let myWins = 0;
    let hostWins = 0;
    let netPmpWon = 0;

    (hostChallenges || []).forEach((c) => {
      const myBet = myBets.find((b) => b.challenge_id === c.id);
      if (!myBet || !c.winning_option_id) return;

      const isMyWin = myBet.option_id === c.winning_option_id;
      if (isMyWin) {
        myWins += 1;
        netPmpWon += myBet.amount_pmp;
      } else {
        hostWins += 1;
        netPmpWon -= myBet.amount_pmp;
      }
    });

    return {
      success: true,
      isSelf: false,
      isLoggedIn: true,
      myWins,
      hostWins,
      totalMatches: myWins + hostWins,
      netPmpWon,
    };
  } catch (err) {
    console.error("getRivalRecordAction error:", err);
    return {
      success: false,
      isSelf: false,
      isLoggedIn: false,
      myWins: 0,
      hostWins: 0,
      totalMatches: 0,
      netPmpWon: 0,
    };
  }
}
