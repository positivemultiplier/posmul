"use server";

import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import {
  UserChallengeDTO,
  ChallengeOption,
  ChallengeCommentDTO,
} from "../types";

/**
 * 1. 30초 인스턴트 내기 생성 (로그인 필수)
 */
export async function createChallengeAction(params: {
  title: string;
  options: string[]; // ["옵션 A", "옵션 B", ...]
  category: "CASUAL" | "SPORTS" | "FANDOM" | "COMPANY" | "COUPLE" | "STUDY";
  visibility: "PRIVATE" | "PUBLIC";
  durationHours: number; // 몇 시간 뒤 마감할지
  hostOptionIndex: number; // 호스트가 선택한 옵션 인덱스 (0, 1)
  hostBetAmount: number; // 호스트가 건 PMP (예: 500)
}): Promise<{ success: boolean; challengeId?: string; requireLogin?: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, requireLogin: true, error: "내기 룸을 개설하려면 로그인이 필요합니다." };
    }

    const hostId = user.id;
    const hostName =
      user.user_metadata?.name ||
      user.user_metadata?.full_name ||
      user.email?.split("@")[0] ||
      "방장시민";

    if (!params.title.trim() || params.options.length < 2) {
      return { success: false, error: "질문과 최소 2개 이상의 선택지를 입력해주세요." };
    }

    const now = new Date();
    const eventStartAt = new Date(now.getTime() + params.durationHours * 60 * 60 * 1000);
    const settlementAt = new Date(eventStartAt.getTime() + 2 * 60 * 60 * 1000); // 마감 후 2시간 뒤 정산

    const optionIds = ["A", "B", "C", "D"];
    const initialOptions: ChallengeOption[] = params.options.slice(0, 4).map((label, idx) => {
      const isHostPick = idx === params.hostOptionIndex;
      const pmp = isHostPick ? params.hostBetAmount : 0;
      const votes = isHostPick ? 1 : 0;
      return {
        id: optionIds[idx],
        label: label.trim(),
        votes,
        pmp,
        ratio: isHostPick ? 100 : 0,
      };
    });

    const totalPool = params.hostBetAmount;
    const hostFee = Math.floor(totalPool * 0.03);

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
        total_pool_pmp: totalPool,
        host_fee_pmp: hostFee,
      })
      .select("id")
      .single();

    if (challengeError || !challenge) {
      console.error("createChallengeAction error:", challengeError);
      return { success: false, error: challengeError?.message || "챌린지 생성 실패" };
    }

    // 2. 호스트의 첫 베팅 내역 기록
    const hostOptionId = optionIds[params.hostOptionIndex];
    await supabaseAdmin
      .schema("prediction")
      .from("user_challenge_bets")
      .insert({
        challenge_id: challenge.id,
        user_id: hostId,
        user_name: hostName,
        option_id: hostOptionId,
        amount_pmp: params.hostBetAmount,
      });

    revalidatePath("/challenge");
    return { success: true, challengeId: challenge.id };
  } catch (err: any) {
    console.error("createChallengeAction exception:", err);
    return { success: false, error: err?.message || "챌린지 생성 중 오류가 발생했습니다." };
  }
}

/**
 * 2. 챌린지 상세 및 실시간 투표 비율 조회
 */
export async function getChallengeDetailAction(
  challengeId: string
): Promise<{ success: boolean; challenge?: UserChallengeDTO; error?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data, error } = await supabaseAdmin
      .schema("prediction")
      .from("user_challenges")
      .select("*")
      .eq("id", challengeId)
      .single();

    if (error || !data) {
      return { success: false, error: "존재하지 않거나 삭제된 챌린지입니다." };
    }

    // 마감 시간 초과 시 상태 자동 계산
    let currentStatus: "OPEN" | "LOCKED" | "SETTLED" | "VOID" = data.status;
    const nowMs = Date.now();
    const closeMs = new Date(data.event_start_at).getTime();

    if (currentStatus === "OPEN" && nowMs >= closeMs) {
      currentStatus = "LOCKED";
    }

    // 옵션 비율 계산
    const rawOptions = (data.options as ChallengeOption[]) || [];
    const totalPmp = rawOptions.reduce((acc, cur) => acc + (cur.pmp || 0), 0);

    const calculatedOptions = rawOptions.map((opt) => ({
      ...opt,
      ratio: totalPmp > 0 ? Math.round(((opt.pmp || 0) / totalPmp) * 100) : 0,
    }));

    // 내가 베팅한 내역 조회
    let myBet: { optionId: string; amountPmp: number } | undefined = undefined;
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

    const winningOption = calculatedOptions.find((o) => o.id === data.winning_option_id);

    const challengeDTO: UserChallengeDTO = {
      id: data.id,
      hostId: data.host_id,
      hostName: data.host_name,
      title: data.title,
      options: calculatedOptions,
      category: data.category,
      visibility: data.visibility,
      eventStartAt: data.event_start_at,
      settlementAt: data.settlement_at,
      settledAt: data.settled_at,
      status: currentStatus,
      winningOptionId: data.winning_option_id,
      winningOptionLabel: winningOption?.label,
      totalPoolPmp: totalPmp,
      hostFeePmp: data.host_fee_pmp || 0,
      disputeCount: data.dispute_count || 0,
      createdAt: data.created_at,
      myBet,
    };

    return { success: true, challenge: challengeDTO };
  } catch (err: any) {
    console.error("getChallengeDetailAction exception:", err);
    return { success: false, error: err?.message || "챌린지 조회 실패" };
  }
}

/**
 * 3. 친구의 도전 수락 & 맞불 베팅 참여 (로그인 필수 - 라이벌 전적 기록용)
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
      return { success: false, requireLogin: true, error: "상대방과 라이벌 전적을 기록하려면 로그인이 필요합니다." };
    }

    const userId = user.id;
    const userName =
      user.user_metadata?.name ||
      user.user_metadata?.full_name ||
      user.email?.split("@")[0] ||
      `도전자_${userId.substring(0, 4)}`;

    const { data: challenge } = await supabaseAdmin
      .schema("prediction")
      .from("user_challenges")
      .select("*")
      .eq("id", params.challengeId)
      .single();

    if (!challenge) {
      return { success: false, error: "챌린지를 찾을 수 없습니다." };
    }

    // 마감 시간 검사
    if (Date.now() >= new Date(challenge.event_start_at).getTime() || challenge.status !== "OPEN") {
      return { success: false, error: "이미 베팅이 마감된 챌린지입니다." };
    }

    // 중복 베팅 검사
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

    // 1. 베팅 내역 저장
    await supabaseAdmin
      .schema("prediction")
      .from("user_challenge_bets")
      .insert({
        challenge_id: params.challengeId,
        user_id: userId,
        user_name: userName,
        option_id: params.optionId,
        amount_pmp: params.amountPmp,
      });

    // 2. 챌린지 룸 통계 갱신
    const currentOptions = (challenge.options as ChallengeOption[]) || [];
    const updatedOptions = currentOptions.map((opt) => {
      if (opt.id === params.optionId) {
        return {
          ...opt,
          votes: (opt.votes || 0) + 1,
          pmp: (opt.pmp || 0) + params.amountPmp,
        };
      }
      return opt;
    });

    const newTotalPool = (challenge.total_pool_pmp || 0) + params.amountPmp;
    const newHostFee = Math.floor(newTotalPool * 0.03);

    // 참여자 10명 돌파 시 자동으로 퍼블릭 노출 승격
    const totalVotes = updatedOptions.reduce((acc, cur) => acc + cur.votes, 0);
    const newVisibility = totalVotes >= 10 ? "PUBLIC" : challenge.visibility;

    await supabaseAdmin
      .schema("prediction")
      .from("user_challenges")
      .update({
        options: updatedOptions,
        total_pool_pmp: newTotalPool,
        host_fee_pmp: newHostFee,
        visibility: newVisibility,
      })
      .eq("id", params.challengeId);

    revalidatePath(`/challenge/${params.challengeId}`);
    return { success: true };
  } catch (err: any) {
    console.error("participateChallengeAction exception:", err);
    return { success: false, error: err?.message || "베팅 참여 실패" };
  }
}

/**
 * 4. 챌린지 룸 내 타임라인 댓글 조회 & 작성
 */
export async function getChallengeCommentsAction(
  challengeId: string
): Promise<{ success: boolean; comments: ChallengeCommentDTO[] }> {
  try {
    const { data } = await supabaseAdmin
      .schema("prediction")
      .from("user_challenge_comments")
      .select("id, challenge_id, user_id, user_name, option_id, message, created_at")
      .eq("challenge_id", challengeId)
      .order("created_at", { ascending: true })
      .limit(50);

    const comments: ChallengeCommentDTO[] = (data || []).map((c) => ({
      id: c.id,
      challengeId: c.challenge_id,
      userId: c.user_id,
      userName: c.user_name,
      optionId: c.option_id,
      message: c.message,
      createdAt: c.created_at,
    }));

    return { success: true, comments };
  } catch (err) {
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

    const userId = user?.id || `anon-${Math.random().toString(36).substring(7)}`;
    const userName =
      user?.user_metadata?.name ||
      user?.user_metadata?.full_name ||
      user?.email?.split("@")[0] ||
      `응원단_${userId.substring(0, 4)}`;

    await supabaseAdmin
      .schema("prediction")
      .from("user_challenge_comments")
      .insert({
        challenge_id: params.challengeId,
        user_id: userId,
        user_name: userName,
        option_id: params.optionId,
        message: params.message.slice(0, 200),
      });

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || "댓글 등록 실패" };
  }
}

/**
 * 5. 호스트의 결과 확정 (정산 집행)
 */
export async function settleChallengeAction(params: {
  challengeId: string;
  winningOptionId: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: challenge } = await supabaseAdmin
      .schema("prediction")
      .from("user_challenges")
      .select("*")
      .eq("id", params.challengeId)
      .single();

    if (!challenge) {
      return { success: false, error: "챌린지를 찾을 수 없습니다." };
    }

    await supabaseAdmin
      .schema("prediction")
      .from("user_challenges")
      .update({
        status: "SETTLED",
        winning_option_id: params.winningOptionId,
        settled_at: new Date().toISOString(),
      })
      .eq("id", params.challengeId);

    revalidatePath(`/challenge/${params.challengeId}`);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || "정산 처리 실패" };
  }
}

/**
 * 6. 오픈 챌린지 및 인기 챌린지 목록 조회
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
      .limit(20);

    const challenges: UserChallengeDTO[] = (data || []).map((d) => {
      const rawOptions = (d.options as ChallengeOption[]) || [];
      const totalPmp = d.total_pool_pmp || 0;
      const calcOptions = rawOptions.map((o) => ({
        ...o,
        ratio: totalPmp > 0 ? Math.round(((o.pmp || 0) / totalPmp) * 100) : 0,
      }));

      return {
        id: d.id,
        hostId: d.host_id,
        hostName: d.host_name,
        title: d.title,
        options: calcOptions,
        category: d.category,
        visibility: d.visibility,
        eventStartAt: d.event_start_at,
        settlementAt: d.settlement_at,
        settledAt: d.settled_at,
        status: d.status,
        winningOptionId: d.winning_option_id,
        totalPoolPmp: totalPmp,
        hostFeePmp: d.host_fee_pmp || 0,
        disputeCount: d.dispute_count || 0,
        createdAt: d.created_at,
      };
    });

    return { success: true, challenges };
  } catch (err) {
    return { success: false, challenges: [] };
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

    // 두 유저가 참여했고 이미 정산된(SETTLED) 챌린지들 조회
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

      // 호스트의 베팅 옵션 찾기 (첫 번째 옵션이거나 호스트 픽)
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

