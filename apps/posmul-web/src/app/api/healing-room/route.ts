/**
 * PosMul 힐링룸 API Route Handler
 * - GET: 본인/이웃 힐링룸 조회 및 파도타기(wave)
 * - POST: update_room / buy_item(PMP 전용) / write_guestbook 액션 처리
 */
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "../../../lib/supabase/server";
import {
  HealingRoomError,
  buyHealingRoomItem,
  loadHealingRoomData,
  updateHealingRoom,
  writeHealingRoomGuestbook,
} from "../../healing-room/healing-room-service";

export const dynamic = "force-dynamic";

interface UpdateRoomRequestBody {
  action: "update_room";
  roomTitle?: unknown;
  statusMessage?: unknown;
  moodTag?: unknown;
  bgmTrack?: unknown;
  roomTheme?: unknown;
  minimiStyle?: unknown;
  minimiQuote?: unknown;
  placedItems?: unknown;
}

interface BuyItemRequestBody {
  action: "buy_item";
  itemId?: unknown;
  equipOnBuy?: unknown;
}

interface WriteGuestbookRequestBody {
  action: "write_guestbook";
  roomUserId?: unknown;
  content?: unknown;
  guestName?: unknown;
  relationLabel?: unknown;
}

type HealingRoomPostBody =
  | UpdateRoomRequestBody
  | BuyItemRequestBody
  | WriteGuestbookRequestBody
  | { action?: unknown };

async function resolveViewerUserId(): Promise<string | null> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user?.id ?? null;
  } catch {
    return null;
  }
}

function handleApiError(error: unknown): NextResponse {
  if (error instanceof HealingRoomError) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: error.status }
    );
  }
  const message = error instanceof Error ? error.message : "힐링룸 요청 처리 중 오류가 발생했습니다.";
  return NextResponse.json({ success: false, error: message }, { status: 500 });
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const viewerUserId = await resolveViewerUserId();
    const { searchParams } = new URL(request.url);
    const targetUserId = searchParams.get("userId");
    const currentRoomUserId = searchParams.get("currentRoomUserId");
    const waveParam = searchParams.get("wave");
    const visitParam = searchParams.get("visit");

    const wave = waveParam === "1" || waveParam === "true";
    const incrementVisit = visitParam !== "0" && visitParam !== "false";

    const data = await loadHealingRoomData({
      viewerUserId,
      targetUserId,
      wave,
      currentRoomUserId,
      incrementVisit,
    });

    return NextResponse.json(
      { success: true, data },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const viewerUserId = await resolveViewerUserId();
    const rawBody = (await request.json()) as HealingRoomPostBody;

    if (!rawBody || typeof rawBody !== "object" || typeof rawBody.action !== "string") {
      throw new HealingRoomError("요청 action 값이 필요합니다.", 400);
    }

    if (rawBody.action === "update_room") {
      const body = rawBody as UpdateRoomRequestBody;
      const data = await updateHealingRoom(viewerUserId, {
        roomTitle: typeof body.roomTitle === "string" ? body.roomTitle : undefined,
        statusMessage: typeof body.statusMessage === "string" ? body.statusMessage : undefined,
        moodTag: typeof body.moodTag === "string" ? body.moodTag : undefined,
        bgmTrack: typeof body.bgmTrack === "string" ? body.bgmTrack : undefined,
        roomTheme: typeof body.roomTheme === "string" ? body.roomTheme : undefined,
        minimiStyle: typeof body.minimiStyle === "string" ? body.minimiStyle : undefined,
        minimiQuote: typeof body.minimiQuote === "string" ? body.minimiQuote : undefined,
        placedItems: Array.isArray(body.placedItems)
          ? body.placedItems.filter((item): item is string => typeof item === "string")
          : undefined,
      });
      return NextResponse.json({ success: true, data }, { status: 200 });
    }

    if (rawBody.action === "buy_item") {
      const body = rawBody as BuyItemRequestBody;
      if (typeof body.itemId !== "string" || body.itemId.trim().length === 0) {
        throw new HealingRoomError("구매할 itemId가 필요합니다.", 400);
      }
      const data = await buyHealingRoomItem(viewerUserId, {
        itemId: body.itemId.trim(),
        equipOnBuy: typeof body.equipOnBuy === "boolean" ? body.equipOnBuy : true,
      });
      return NextResponse.json({ success: true, data }, { status: 200 });
    }

    if (rawBody.action === "write_guestbook") {
      const body = rawBody as WriteGuestbookRequestBody;
      if (typeof body.roomUserId !== "string" || typeof body.content !== "string") {
        throw new HealingRoomError("방 주인 ID와 방명록 내용이 필요합니다.", 400);
      }
      const data = await writeHealingRoomGuestbook(viewerUserId, {
        roomUserId: body.roomUserId,
        content: body.content,
        guestName: typeof body.guestName === "string" ? body.guestName : undefined,
        relationLabel: typeof body.relationLabel === "string" ? body.relationLabel : undefined,
      });
      return NextResponse.json({ success: true, data }, { status: 200 });
    }

    throw new HealingRoomError(`지원하지 않는 action입니다: ${rawBody.action}`, 400);
  } catch (error) {
    return handleApiError(error);
  }
}
