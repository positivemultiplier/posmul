"use server";

import { supabaseAdmin } from "@/lib/supabase/admin";
import { LIVE_ROOMS, LiveEventRoom, getLiveRoomEffectiveStatus } from "../live-rooms.data";

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

