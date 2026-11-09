"use server";

import { supabaseAdmin } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { LIVE_ROOMS, LiveEventRoom, getLiveRoomEffectiveStatus } from "../live-rooms.data";
import { ChallengeOption, UserChallengeDTO } from "@/app/challenge/types";

export interface LiveMessageDTO {
  id: string;
  sender: string;
  teamTag?: string;
  teamColor?: string;
  message: string;
  time: string;
  isReaction?: boolean;
}

/**
 * DB 예측 게임 상태를 반영한 라이브 룸 목록 전체 조회 (마감/정산 자동 판정)
 */
export async function getLiveRoomsWithStatusAction(): Promise<{
  success: boolean;
  rooms: LiveEventRoom[];
}> {
  try {
    const gameIds = LIVE_ROOMS.map((r) => r.predictionGame?.id).filter(Boolean) as string[];

    let dbGameMap = new Map<string, any>();
    if (gameIds.length > 0) {
      const { data: dbGames } = await supabaseAdmin
        .schema("prediction")
        .from("prediction_games")
        .select("game_id, status, registration_end, settlement_date, settled_at, winning_option_id, game_options")
        .in("game_id", gameIds);

      (dbGames || []).forEach((g: any) => {
        dbGameMap.set(g.game_id, g);
      });
    }

    const mergedRooms = LIVE_ROOMS.map((room) => {
      const g = room.predictionGame?.id ? dbGameMap.get(room.predictionGame.id) : null;
      let effectiveRoom: LiveEventRoom = { ...room };

      if (g) {
        effectiveRoom.registrationEnd = g.registration_end || effectiveRoom.registrationEnd;
        effectiveRoom.settlementDate = g.settlement_date || effectiveRoom.settlementDate;
        effectiveRoom.settledAt = g.settled_at || null;
        effectiveRoom.winningOptionId = g.winning_option_id || null;

        // DB에 winning_option_id가 있으면 라벨 찾기
        if (g.winning_option_id && room.predictionGame) {
          if (room.predictionGame.optionA.id === g.winning_option_id) {
            effectiveRoom.winningOptionLabel = room.predictionGame.optionA.label;
          } else if (room.predictionGame.optionB.id === g.winning_option_id) {
            effectiveRoom.winningOptionLabel = room.predictionGame.optionB.label;
          }
        }

        // DB 상태가 직접 CLOSED이거나 SETTLED인 경우 우선 반영
        if (g.status === "SETTLED" || g.settled_at) {
          effectiveRoom.status = "ENDED";
        } else if (g.status === "CLOSED") {
          effectiveRoom.status = "CLOSED";
        }
      }

      // 최종 실효 상태 계산 (시간 초과 시 CLOSED)
      effectiveRoom.status = getLiveRoomEffectiveStatus(effectiveRoom);
      return effectiveRoom;
    });

    return { success: true, rooms: mergedRooms };
  } catch (err) {
    console.error("getLiveRoomsWithStatusAction exception:", err);
    // fallback: 기본 정적 데이터 기반 판정
    const fallbackRooms = LIVE_ROOMS.map((r) => ({
      ...r,
      status: getLiveRoomEffectiveStatus(r),
    }));
    return { success: true, rooms: fallbackRooms };
  }
}

/**
 * 단일 라이브 룸 최신 상태 조회
 */
export async function getLiveRoomDetailAction(roomId: string): Promise<{
  success: boolean;
  room?: LiveEventRoom;
}> {
  try {
    const listRes = await getLiveRoomsWithStatusAction();
    const room = listRes.rooms.find((r) => r.id === roomId);
    if (!room) {
      return { success: false };
    }
    return { success: true, room };
  } catch (err) {
    console.error("getLiveRoomDetailAction exception:", err);
    return { success: false };
  }
}

/**
 * 방 입장/새로고침 시 최근 30개 메시지 버퍼 조회
 */
export async function getRecentLiveMessagesAction(roomId: string): Promise<{
  success: boolean;
  messages: LiveMessageDTO[];
}> {
  try {
    const { data, error } = await supabaseAdmin
      .schema("forum")
      .from("live_room_messages")
      .select("id, sender, team_tag, team_color, message, is_reaction, created_at")
      .eq("room_id", roomId)
      .order("created_at", { ascending: false })
      .limit(30);

    if (error || !data) {
      return { success: false, messages: [] };
    }

    const mapped = data.reverse().map((m) => ({
      id: m.id,
      sender: m.sender,
      teamTag: m.team_tag || undefined,
      teamColor: m.team_color || undefined,
      message: m.message,
      time: new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      isReaction: m.is_reaction || false,
    }));

    return { success: true, messages: mapped };
  } catch (err) {
    console.error("getRecentLiveMessagesAction error:", err);
    return { success: false, messages: [] };
  }
}

/**
 * 채팅 전송 시 백그라운드 30개 버퍼 저장 (실패해도 브로드캐스트는 정상 작동하도록 비동기 보장)
 */
export async function saveLiveMessageBufferAction(params: {
  roomId: string;
  sender: string;
  teamTag?: string;
  teamColor?: string;
  message: string;
  isReaction?: boolean;
}): Promise<void> {
  try {
    await supabaseAdmin
      .schema("forum")
      .from("live_room_messages")
      .insert({
        room_id: params.roomId,
        sender: params.sender,
        team_tag: params.teamTag,
        team_color: params.teamColor,
        message: params.message.slice(0, 300), // 최대 300자 제한
        is_reaction: params.isReaction || false,
      });
  } catch (err) {
    console.warn("saveLiveMessageBuffer non-fatal error:", err);
  }
}

/**
 * [LIVE 킬러 기능] 시청자 실시간 번개 예측 개설 액션
 */
export async function createLiveQuickChallengeAction(params: {
  roomId: string;
  title: string;
  options: string[]; // 2개 옵션 ["A", "B"]
  durationMinutes: number; // 몇 분 뒤 마감할지 (3, 5, 10분)
  hostPickIndex: number; // 0 or 1
  hostBetAmount: number; // 기본 100포
}): Promise<{
  success: boolean;
  challenge?: UserChallengeDTO;
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
        error: "실시간 번개 예측을 만들려면 로그인이 필요합니다.",
      };
    }

    const hostId = user.id;
    const hostName =
      user.user_metadata?.name ||
      user.user_metadata?.full_name ||
      user.email?.split("@")[0] ||
      "열혈시청자";

    if (!params.title.trim() || params.options.length < 2) {
      return { success: false, error: "질문과 2개의 선택지를 입력해 주세요." };
    }

    const now = new Date();
    const eventStartAt = new Date(now.getTime() + params.durationMinutes * 60 * 1000);
    const settlementAt = new Date(eventStartAt.getTime() + 10 * 60 * 1000); // 마감 후 10분 뒤 정산

    const optionIds = ["A", "B"];
    const initialOptions: ChallengeOption[] = params.options.slice(0, 2).map((label, idx) => {
      const isHostPick = idx === params.hostPickIndex;
      return {
        id: optionIds[idx],
        label: label.trim(),
        votes: isHostPick ? 1 : 0,
        pmp: isHostPick ? params.hostBetAmount : 0,
        ratio: isHostPick ? 100 : 0,
      };
    });

    const totalPool = params.hostBetAmount;
    const hostFee = Math.floor(totalPool * 0.03);

    // 1. 챌린지 생성
    const { data: challenge, error: challengeError } = await supabaseAdmin
      .schema("prediction")
      .from("user_challenges")
      .insert({
        host_id: hostId,
        host_name: hostName,
        title: `[LIVE] ${params.title.trim()}`,
        options: initialOptions,
        category: "SPORTS",
        visibility: "PUBLIC",
        event_start_at: eventStartAt.toISOString(),
        settlement_at: settlementAt.toISOString(),
        status: "OPEN",
        total_pool_pmp: totalPool,
        host_fee_pmp: hostFee,
      })
      .select("*")
      .single();

    if (challengeError || !challenge) {
      console.error("createLiveQuickChallengeAction error:", challengeError);
      return { success: false, error: challengeError?.message || "번개 예측 생성 실패" };
    }

    // 2. 호스트 첫 베팅 기록
    const hostOptionId = optionIds[params.hostPickIndex];
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

    const challengeDTO: UserChallengeDTO = {
      id: challenge.id,
      hostId: challenge.host_id,
      hostName: challenge.host_name,
      title: challenge.title,
      options: initialOptions,
      category: "SPORTS",
      visibility: "PUBLIC",
      eventStartAt: challenge.event_start_at,
      settlementAt: challenge.settlement_at,
      status: "OPEN",
      totalPoolPmp: totalPool,
      hostFeePmp: hostFee,
      disputeCount: 0,
      createdAt: challenge.created_at,
      myBet: {
        optionId: hostOptionId,
        amountPmp: params.hostBetAmount,
      },
    };

    return { success: true, challenge: challengeDTO };
  } catch (err: any) {
    console.error("createLiveQuickChallengeAction exception:", err);
    return { success: false, error: err?.message || "번개 예측 생성 중 오류가 발생했습니다." };
  }
}

/**
 * [LIVE 킬러 기능] 채팅창 인라인 챌린지 원클릭 투표/베팅
 */
export async function quickVoteLiveChallengeAction(params: {
  challengeId: string;
  optionId: "A" | "B";
  amountPmp: number;
}): Promise<{
  success: boolean;
  options?: ChallengeOption[];
  totalPool?: number;
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
        error: "예측에 참여하려면 로그인이 필요합니다.",
      };
    }

    const userId = user.id;
    const userName =
      user.user_metadata?.name ||
      user.user_metadata?.full_name ||
      user.email?.split("@")[0] ||
      `시청자_${userId.substring(0, 4)}`;

    const { data: challenge } = await supabaseAdmin
      .schema("prediction")
      .from("user_challenges")
      .select("*")
      .eq("id", params.challengeId)
      .single();

    if (!challenge) {
      return { success: false, error: "해당 번개 예측을 찾을 수 없습니다." };
    }

    if (Date.now() >= new Date(challenge.event_start_at).getTime() || challenge.status !== "OPEN") {
      return { success: false, error: "이미 마감된 번개 예측입니다." };
    }

    // 중복 투표 검사
    const { data: existingBet } = await supabaseAdmin
      .schema("prediction")
      .from("user_challenge_bets")
      .select("id")
      .eq("challenge_id", params.challengeId)
      .eq("user_id", userId)
      .maybeSingle();

    if (existingBet) {
      return { success: false, error: "이미 이 예측에 참여하셨습니다!" };
    }

    // 베팅 레코드 저장
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

    // 옵션 통계 재계산
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

    const newTotalPmp = updatedOptions.reduce((acc, cur) => acc + (cur.pmp || 0), 0);
    const finalOptions = updatedOptions.map((opt) => ({
      ...opt,
      ratio: newTotalPmp > 0 ? Math.round(((opt.pmp || 0) / newTotalPmp) * 100) : 0,
    }));

    await supabaseAdmin
      .schema("prediction")
      .from("user_challenges")
      .update({
        options: finalOptions,
        total_pool_pmp: newTotalPmp,
        updated_at: new Date().toISOString(),
      })
      .eq("id", params.challengeId);

    return {
      success: true,
      options: finalOptions,
      totalPool: newTotalPmp,
    };
  } catch (err: any) {
    console.error("quickVoteLiveChallengeAction exception:", err);
    return { success: false, error: err?.message || "투표 처리 중 오류가 발생했습니다." };
  }
}

/**
 * [LIVE] 최근 생성된 진행 중인 시청자 챌린지 목록 조회
 */
export async function getLiveActiveChallengesAction(): Promise<{
  success: boolean;
  challenges: UserChallengeDTO[];
}> {
  try {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabaseAdmin
      .schema("prediction")
      .from("user_challenges")
      .select("*")
      .gte("created_at", twoHoursAgo)
      .like("title", "[LIVE]%")
      .order("created_at", { ascending: false })
      .limit(5);

    if (error || !data) {
      return { success: false, challenges: [] };
    }

    const dtos: UserChallengeDTO[] = data.map((d: any) => ({
      id: d.id,
      hostId: d.host_id,
      hostName: d.host_name,
      title: d.title.replace(/^\[LIVE\]\s*/, ""),
      options: d.options || [],
      category: d.category,
      visibility: d.visibility,
      eventStartAt: d.event_start_at,
      settlementAt: d.settlement_at,
      status: d.status,
      totalPoolPmp: d.total_pool_pmp || 0,
      hostFeePmp: d.host_fee_pmp || 0,
      disputeCount: d.dispute_count || 0,
      createdAt: d.created_at,
    }));

    return { success: true, challenges: dtos };
  } catch (err) {
    console.error("getLiveActiveChallengesAction error:", err);
    return { success: false, challenges: [] };
  }
}


