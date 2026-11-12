"use server";

import { supabaseAdmin } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import {
  attachHourlyGamePoolsToRows,
  type PredictionGameRow,
} from "@/app/prediction/components/prediction-game-mapper";
import {
  type LiveDbGameInput,
  type LiveEventRoom,
  mapPredictionGameToLiveRoom,
} from "../live-rooms.data";
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

const LIVE_GAME_SELECT =
  "game_id, slug, title, description, category, subcategory, league, status, data_source, prediction_type, game_options, registration_start, registration_end, settlement_date, settled_at, winning_option_id, difficulty, min_bet_amount, max_bet_amount, max_participants, created_at";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type LiveGameQueryRow = PredictionGameRow & {
  settled_at?: string | null;
  winning_option_id?: string | null;
};

/**
 * DB 예측 게임 목록을 기반으로 LIVE 응원톡 룸 목록을 동적으로 구성합니다.
 * - 진행 중(ACTIVE & 마감 전) 게임을 마감 임박순으로 우선 배치하고,
 *   최근 마감·정산 완료(CLOSED/SETTLED) 게임도 최대 6개 함께 노출합니다.
 */
export async function getLiveRoomsWithStatusAction(): Promise<{
  success: boolean;
  rooms: LiveEventRoom[];
}> {
  try {
    const [activeRes, endedRes] = await Promise.all([
      supabaseAdmin
        .schema("prediction")
        .from("prediction_games")
        .select(LIVE_GAME_SELECT)
        .eq("status", "ACTIVE")
        .order("registration_end", { ascending: true, nullsFirst: false })
        .limit(24),
      supabaseAdmin
        .schema("prediction")
        .from("prediction_games")
        .select(LIVE_GAME_SELECT)
        .in("status", ["CLOSED", "SETTLED"])
        .order("settled_at", { ascending: false, nullsFirst: false })
        .order("registration_end", { ascending: false, nullsFirst: false })
        .limit(6),
    ]);

    const combinedRows = [
      ...((activeRes.data || []) as LiveGameQueryRow[]),
      ...((endedRes.data || []) as LiveGameQueryRow[]),
    ];

    if (combinedRows.length === 0) {
      return { success: true, rooms: [] };
    }

    const enrichedRows = (await attachHourlyGamePoolsToRows(
      supabaseAdmin,
      combinedRows
    )) as LiveGameQueryRow[];

    const roomIds = enrichedRows.map((g) => g.slug || g.game_id);
    const msgCountByRoom = await fetchRecentRoomMessageCounts(roomIds);

    const rooms = enrichedRows.map((row) =>
      mapPredictionGameToLiveRoom(row as LiveDbGameInput, {
        recentMessagesCount: msgCountByRoom.get(row.slug || row.game_id) ?? 0,
      })
    );

    // LIVE 진행중 -> CLOSED -> ENDED 순으로 정렬 (같은 상태 내에서는 기존 순서 유지)
    const statusOrder: Record<LiveEventRoom["status"], number> = {
      LIVE: 0,
      UPCOMING: 1,
      CLOSED: 2,
      ENDED: 3,
    };
    rooms.sort((a, b) => statusOrder[a.status] - statusOrder[b.status]);

    return { success: true, rooms };
  } catch (err) {
    console.error("getLiveRoomsWithStatusAction exception:", err);
    return { success: false, rooms: [] };
  }
}

async function fetchRecentRoomMessageCounts(
  roomIds: string[]
): Promise<Map<string, number>> {
  const counts = new Map<string, number>();
  if (roomIds.length === 0) return counts;

  const { data } = await supabaseAdmin
    .schema("forum")
    .from("live_room_messages")
    .select("room_id")
    .in("room_id", roomIds)
    .order("created_at", { ascending: false })
    .limit(300);

  if (data) {
    for (const row of data as Array<{ room_id: string }>) {
      counts.set(row.room_id, (counts.get(row.room_id) ?? 0) + 1);
    }
  }
  return counts;
}

/**
 * 단일 라이브 룸 최신 상태 조회 (slug 또는 game_id 기반 직접 DB 조회)
 */
export async function getLiveRoomDetailAction(roomId: string): Promise<{
  success: boolean;
  room?: LiveEventRoom;
}> {
  try {
    const decoded = decodeURIComponent(roomId);
    let gameRow: LiveGameQueryRow | null = null;

    const bySlug = await supabaseAdmin
      .schema("prediction")
      .from("prediction_games")
      .select(LIVE_GAME_SELECT)
      .eq("slug", decoded)
      .maybeSingle();

    if (bySlug.data) {
      gameRow = bySlug.data as LiveGameQueryRow;
    } else if (UUID_REGEX.test(decoded)) {
      const byId = await supabaseAdmin
        .schema("prediction")
        .from("prediction_games")
        .select(LIVE_GAME_SELECT)
        .eq("game_id", decoded)
        .maybeSingle();
      if (byId.data) {
        gameRow = byId.data as LiveGameQueryRow;
      }
    }

    if (!gameRow) {
      return { success: false };
    }

    const [enriched] = (await attachHourlyGamePoolsToRows(supabaseAdmin, [
      gameRow,
    ])) as LiveGameQueryRow[];
    const msgCounts = await fetchRecentRoomMessageCounts([
      enriched.slug || enriched.game_id,
    ]);
    const room = mapPredictionGameToLiveRoom(enriched as LiveDbGameInput, {
      recentMessagesCount: msgCounts.get(enriched.slug || enriched.game_id) ?? 0,
    });

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
      time: new Date(m.created_at).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
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
    const eventStartAt = new Date(
      now.getTime() + params.durationMinutes * 60 * 1000
    );
    const settlementAt = new Date(eventStartAt.getTime() + 10 * 60 * 1000); // 마감 후 10분 뒤 정산

    const optionIds = ["A", "B"];
    const initialOptions: ChallengeOption[] = params.options
      .slice(0, 2)
      .map((label, idx) => {
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

    // 1. 챌린지 생성 (metadata.roomId에 방 ID 기록해 방별 격리)
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
        metadata: { roomId: params.roomId },
      })
      .select("*")
      .single();

    if (challengeError || !challenge) {
      console.error("createLiveQuickChallengeAction error:", challengeError);
      return {
        success: false,
        error: challengeError?.message || "번개 예측 생성 실패",
      };
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
  } catch (err: unknown) {
    console.error("createLiveQuickChallengeAction exception:", err);
    const msg =
      err instanceof Error
        ? err.message
        : "번개 예측 생성 중 오류가 발생했습니다.";
    return { success: false, error: msg };
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

    if (
      Date.now() >= new Date(challenge.event_start_at).getTime() ||
      challenge.status !== "OPEN"
    ) {
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

    const newTotalPmp = updatedOptions.reduce(
      (acc, cur) => acc + (cur.pmp || 0),
      0
    );
    const finalOptions = updatedOptions.map((opt) => ({
      ...opt,
      ratio:
        newTotalPmp > 0 ? Math.round(((opt.pmp || 0) / newTotalPmp) * 100) : 0,
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
  } catch (err: unknown) {
    console.error("quickVoteLiveChallengeAction exception:", err);
    const msg =
      err instanceof Error ? err.message : "투표 처리 중 오류가 발생했습니다.";
    return { success: false, error: msg };
  }
}

/**
 * [LIVE] 특정 라이브 방의 진행 중인 시청자 번개 챌린지 목록 조회
 */
export async function getLiveActiveChallengesAction(roomId?: string): Promise<{
  success: boolean;
  challenges: UserChallengeDTO[];
}> {
  try {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();

    let query = supabaseAdmin
      .schema("prediction")
      .from("user_challenges")
      .select("*")
      .gte("created_at", twoHoursAgo)
      .like("title", "[LIVE]%")
      .order("created_at", { ascending: false })
      .limit(20);

    if (roomId) {
      query = query.contains("metadata", { roomId });
    }

    const { data, error } = await query;

    if (error || !data) {
      return { success: false, challenges: [] };
    }

    const dtos: UserChallengeDTO[] = data.slice(0, 5).map((d) => ({
      id: d.id,
      hostId: d.host_id,
      hostName: d.host_name,
      title: String(d.title || "").replace(/^\[LIVE\]\s*/, ""),
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
