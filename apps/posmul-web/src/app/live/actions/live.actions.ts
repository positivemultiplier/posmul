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
  "game_id, slug, title, description, category, subcategory, league, status, data_source, prediction_type, game_options, registration_start, registration_end, settlement_date, settled_at, winning_option_id, difficulty, min_bet_amount, max_bet_amount, metadata, created_at";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type LiveGameQueryRow = PredictionGameRow & {
  settled_at?: string | null;
  winning_option_id?: string | null;
  metadata?: Record<string, unknown> | null;
};

function isRowLiveOpened(
  row: LiveGameQueryRow,
  msgCountByRoom: Map<string, number>,
  challengeRoomKeys: Set<string>
): boolean {
  if (row.metadata && row.metadata.live_room_open === true) {
    return true;
  }
  const slugKey = row.slug || row.game_id;
  if ((msgCountByRoom.get(slugKey) ?? 0) > 0 || (msgCountByRoom.get(row.game_id) ?? 0) > 0) {
    return true;
  }
  if (challengeRoomKeys.has(slugKey) || challengeRoomKeys.has(row.game_id)) {
    return true;
  }
  return false;
}

async function fetchLiveChallengeRoomKeys(): Promise<Set<string>> {
  const keys = new Set<string>();
  const { data } = await supabaseAdmin
    .schema("prediction")
    .from("user_challenges")
    .select("linked_game_id, metadata")
    .like("title", "[LIVE]%")
    .order("created_at", { ascending: false })
    .limit(50);

  if (data) {
    for (const row of data as Array<{
      linked_game_id?: string | null;
      metadata?: Record<string, unknown> | null;
    }>) {
      if (row.linked_game_id) keys.add(String(row.linked_game_id));
      if (row.metadata?.roomId) keys.add(String(row.metadata.roomId));
    }
  }
  return keys;
}

/**
 * 실제 LIVE 응원톡이 개설된 예측 게임만 로비 룸 목록으로 구성합니다.
 * - 진행 중(ACTIVE & 마감 전) 중 개설된 방을 우선 배치하고,
 *   개설 이력이 있던 최근 마감·정산 완료(CLOSED/SETTLED) 방도 함께 노출합니다.
 */
export async function getLiveRoomsWithStatusAction(): Promise<{
  success: boolean;
  rooms: LiveEventRoom[];
}> {
  try {
    const [activeRes, endedRes, challengeRoomKeys] = await Promise.all([
      supabaseAdmin
        .schema("prediction")
        .from("prediction_games")
        .select(LIVE_GAME_SELECT)
        .eq("status", "ACTIVE")
        .order("registration_end", { ascending: true, nullsFirst: false })
        .limit(30),
      supabaseAdmin
        .schema("prediction")
        .from("prediction_games")
        .select(LIVE_GAME_SELECT)
        .in("status", ["CLOSED", "SETTLED"])
        .order("settled_at", { ascending: false, nullsFirst: false })
        .order("registration_end", { ascending: false, nullsFirst: false })
        .limit(12),
      fetchLiveChallengeRoomKeys(),
    ]);

    const combinedRows = [
      ...((activeRes.data || []) as LiveGameQueryRow[]),
      ...((endedRes.data || []) as LiveGameQueryRow[]),
    ];

    if (combinedRows.length === 0) {
      return { success: true, rooms: [] };
    }

    const roomKeys = Array.from(
      new Set(
        combinedRows.flatMap((g) =>
          g.slug ? [g.slug, g.game_id] : [g.game_id]
        )
      )
    );
    const msgCountByRoom = await fetchRecentRoomMessageCounts(roomKeys);

    // 실제로 LIVE 응원톡 방이 개설된 마켓만 필터링
    const openedRows = combinedRows.filter((row) =>
      isRowLiveOpened(row, msgCountByRoom, challengeRoomKeys)
    );

    if (openedRows.length === 0) {
      return { success: true, rooms: [] };
    }

    const enrichedRows = (await attachHourlyGamePoolsToRows(
      supabaseAdmin,
      openedRows
    )) as LiveGameQueryRow[];

    const rooms = enrichedRows.map((row) => {
      const slugKey = row.slug || row.game_id;
      const msgCount =
        (msgCountByRoom.get(slugKey) ?? 0) +
        (row.slug ? msgCountByRoom.get(row.game_id) ?? 0 : 0);
      return mapPredictionGameToLiveRoom(row as LiveDbGameInput, {
        recentMessagesCount: msgCount,
      });
    });

    // LIVE 진행중 -> CLOSED -> ENDED 순으로 정렬
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
 * - 아직 개설되지 않은 ACTIVE 게임이면 notOpened 메타데이터를 함께 반환
 */
export async function getLiveRoomDetailAction(roomId: string): Promise<{
  success: boolean;
  room?: LiveEventRoom;
  notOpened?: boolean;
  canOpen?: boolean;
  gameId?: string;
  gameTitle?: string;
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

    const roomKeys = gameRow.slug
      ? [gameRow.slug, gameRow.game_id]
      : [gameRow.game_id];
    const [msgCounts, challengeRoomKeys] = await Promise.all([
      fetchRecentRoomMessageCounts(roomKeys),
      fetchLiveChallengeRoomKeys(),
    ]);

    const opened = isRowLiveOpened(gameRow, msgCounts, challengeRoomKeys);
    if (!opened) {
      const isBeforeEnd =
        !gameRow.registration_end ||
        new Date(gameRow.registration_end).getTime() > Date.now();
      return {
        success: false,
        notOpened: true,
        canOpen: gameRow.status === "ACTIVE" && isBeforeEnd,
        gameId: gameRow.game_id,
        gameTitle: gameRow.title,
      };
    }

    const [enriched] = (await attachHourlyGamePoolsToRows(supabaseAdmin, [
      gameRow,
    ])) as LiveGameQueryRow[];
    const totalMsgCount =
      (msgCounts.get(enriched.slug || enriched.game_id) ?? 0) +
      (enriched.slug ? msgCounts.get(enriched.game_id) ?? 0 : 0);

    const room = mapPredictionGameToLiveRoom(enriched as LiveDbGameInput, {
      recentMessagesCount: totalMsgCount,
    });

    return { success: true, room };
  } catch (err) {
    console.error("getLiveRoomDetailAction exception:", err);
    return { success: false };
  }
}

/**
 * 진행 중(ACTIVE) 예측 게임에 LIVE 응원톡 방을 정식 개설합니다.
 */
export async function openLiveRoomForGameAction(gameIdOrSlug: string): Promise<{
  success: boolean;
  roomId?: string;
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
        error: "LIVE 응원톡 방을 개설하려면 로그인이 필요합니다.",
      };
    }

    const decoded = decodeURIComponent(gameIdOrSlug);
    const col = UUID_REGEX.test(decoded) ? "game_id" : "slug";
    const { data: gameRow, error: findErr } = await supabaseAdmin
      .schema("prediction")
      .from("prediction_games")
      .select("game_id, slug, title, status, registration_end, metadata")
      .eq(col, decoded)
      .maybeSingle();

    if (findErr || !gameRow) {
      return { success: false, error: "예측 게임을 찾을 수 없습니다." };
    }

    if (
      gameRow.status !== "ACTIVE" ||
      (gameRow.registration_end &&
        new Date(gameRow.registration_end).getTime() <= Date.now())
    ) {
      return {
        success: false,
        error: "마감되었거나 정산된 게임에는 새 LIVE 방을 개설할 수 없습니다.",
      };
    }

    const roomId = String(gameRow.slug || gameRow.game_id);
    const nextMetadata = {
      ...((gameRow.metadata as Record<string, unknown> | null) ?? {}),
      live_room_open: true,
      live_opened_by: user.id,
      live_opened_at: new Date().toISOString(),
    };

    const { error: updateErr } = await supabaseAdmin
      .schema("prediction")
      .from("prediction_games")
      .update({ metadata: nextMetadata })
      .eq("game_id", gameRow.game_id);

    if (updateErr) {
      return { success: false, error: updateErr.message };
    }

    const openerName =
      user.user_metadata?.name ||
      user.user_metadata?.full_name ||
      user.email?.split("@")[0] ||
      "시민개설자";

    await supabaseAdmin
      .schema("forum")
      .from("live_room_messages")
      .insert({
        room_id: roomId,
        sender: openerName,
        team_tag: "HOST",
        team_color: "bg-red-500/20 text-red-300 border-red-400/40",
        message: `"${gameRow.title}" LIVE 응원톡 방이 개설되었습니다! 자유롭게 실시간 예측과 의견을 나눠보세요.`,
        is_reaction: false,
      });

    return { success: true, roomId };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
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

    const totalPool = Math.max(50, Math.round(Number(params.hostBetAmount) || 0));
    const hostFee = Math.floor(totalPool * 0.03);

    // 연결된 공식 게임 조회 (LIVE 채팅방 번개 예측 <-> 상세페이지 꼬리 내기 양방향 연동)
    let linkedGame: { game_id: string; slug: string | null; title: string } | null = null;
    const decodedRoomId = decodeURIComponent(params.roomId || "");
    if (decodedRoomId) {
      const bySlug = await supabaseAdmin
        .schema("prediction")
        .from("prediction_games")
        .select("game_id, slug, title")
        .eq("slug", decodedRoomId)
        .maybeSingle();
      if (bySlug.data) {
        linkedGame = bySlug.data;
      } else if (UUID_REGEX.test(decodedRoomId)) {
        const byId = await supabaseAdmin
          .schema("prediction")
          .from("prediction_games")
          .select("game_id, slug, title")
          .eq("game_id", decodedRoomId)
          .maybeSingle();
        if (byId.data) linkedGame = byId.data;
      }
    }

    // 1. 챌린지 생성 (metadata.roomId + linked_game_id 기록)
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
        linked_game_id: linkedGame?.game_id ?? null,
        linked_game_slug: linkedGame?.slug ?? null,
        linked_game_title: linkedGame?.title ?? null,
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

    // 1-1. 호스트 PMP 에스크로 차감 (잔고 부족 시 생성 취소)
    const { error: deductError } = await supabaseAdmin.rpc(
      "deduct_challenge_pmp",
      {
        p_user_id: hostId,
        p_challenge_id: challenge.id,
        p_amount: totalPool,
        p_reason: "live_quick_challenge_create",
      }
    );

    if (deductError) {
      await supabaseAdmin
        .schema("prediction")
        .from("user_challenges")
        .delete()
        .eq("id", challenge.id);
      const errMsg = String(deductError.message || "").includes(
        "INSUFFICIENT_PMP_BALANCE"
      )
        ? "PMP 잔고가 부족합니다! 포럼 활동이나 출석으로 PMP를 모아 주세요."
        : deductError.message || "PMP 차감 실패";
      return { success: false, error: errMsg };
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
        amount_pmp: totalPool,
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

    const betAmount = Math.max(50, Math.round(Number(params.amountPmp) || 0));

    // 실제 PMP 에스크로 차감
    const { error: deductError } = await supabaseAdmin.rpc(
      "deduct_challenge_pmp",
      {
        p_user_id: userId,
        p_challenge_id: params.challengeId,
        p_amount: betAmount,
        p_reason: "live_quick_challenge_vote",
      }
    );

    if (deductError) {
      const errMsg = String(deductError.message || "").includes(
        "INSUFFICIENT_PMP_BALANCE"
      )
        ? "PMP 잔고가 부족합니다!"
        : deductError.message || "PMP 차감 실패";
      return { success: false, error: errMsg };
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
        amount_pmp: betAmount,
      });

    // 옵션 통계 재계산
    const currentOptions = (challenge.options as ChallengeOption[]) || [];
    const updatedOptions = currentOptions.map((opt) => {
      if (opt.id === params.optionId) {
        return {
          ...opt,
          votes: (opt.votes || 0) + 1,
          pmp: (opt.pmp || 0) + betAmount,
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
