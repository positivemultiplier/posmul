"use server";

import { supabaseAdmin } from "@/lib/supabase/admin";

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

