import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { requireAdminApi } from "@/shared/lib/security/admin-auth";

const BGM_BUCKET = "healing-room-bgm";

interface CreateBgmBody {
  id?: string;
  label?: string;
  artist?: string;
  moodDesc?: string;
  audioUrl?: string | null;
  storagePath?: string | null;
  frequencies?: number[];
  waveform?: string;
  isActive?: boolean;
  sortOrder?: number;
}

interface UpdateBgmBody {
  id?: string;
  label?: string;
  artist?: string;
  moodDesc?: string;
  audioUrl?: string | null;
  isActive?: boolean;
  sortOrder?: number;
}

function buildTrackId(label: string): string {
  const ascii = label
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_]+/g, "-")
    .toLowerCase()
    .slice(0, 28);
  const suffix = Date.now().toString(36);
  return ascii ? `${ascii}-${suffix}` : `bgm-${suffix}`;
}

export async function GET(req: NextRequest) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;

  try {
    const [{ data: tracks, error: tracksError }, { count: roomsCount }] = await Promise.all([
      supabaseAdmin
        .schema("user")
        .from("healing_room_bgm_tracks")
        .select("*")
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: false }),
      supabaseAdmin
        .schema("user")
        .from("healing_rooms")
        .select("user_id", { count: "exact", head: true }),
    ]);

    if (tracksError) {
      return NextResponse.json(
        { success: false, error: tracksError.message },
        { status: 500 }
      );
    }

    const items = tracks ?? [];
    const activeCount = items.filter((t) => Boolean(t.is_active)).length;
    const mp3Count = items.filter((t) => Boolean(t.audio_url)).length;

    return NextResponse.json({
      success: true,
      tracks: items,
      stats: {
        totalTracks: items.length,
        activeTracks: activeCount,
        mp3Tracks: mp3Count,
        totalRooms: roomsCount ?? 0,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "BGM 목록 조회 실패";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;

  try {
    const body = (await req.json()) as CreateBgmBody;
    const label = typeof body.label === "string" ? body.label.trim() : "";
    const artist = typeof body.artist === "string" && body.artist.trim()
      ? body.artist.trim()
      : "PosMul Studio";
    const moodDesc = typeof body.moodDesc === "string" ? body.moodDesc.trim() : "";
    const audioUrl = typeof body.audioUrl === "string" && body.audioUrl.trim()
      ? body.audioUrl.trim()
      : null;
    const storagePath = typeof body.storagePath === "string" && body.storagePath.trim()
      ? body.storagePath.trim()
      : null;

    if (!label || label.length > 80) {
      return NextResponse.json(
        { success: false, error: "BGM 제목을 1~80자 이내로 입력해주세요." },
        { status: 400 }
      );
    }

    const trackId =
      typeof body.id === "string" && body.id.trim()
        ? body.id.trim().toLowerCase().replace(/[^a-z0-9-_]/g, "-")
        : buildTrackId(label);

    const sortOrder =
      typeof body.sortOrder === "number" && Number.isFinite(body.sortOrder)
        ? Math.round(body.sortOrder)
        : 100;

    const waveform =
      body.waveform === "triangle" ||
      body.waveform === "square" ||
      body.waveform === "sawtooth"
        ? body.waveform
        : "sine";

    const frequencies =
      Array.isArray(body.frequencies) && body.frequencies.length > 0
        ? body.frequencies.map((n) => Number(n)).filter((n) => Number.isFinite(n) && n > 0)
        : [220, 261.63, 329.63, 392.0];

    const { data, error } = await supabaseAdmin
      .schema("user")
      .from("healing_room_bgm_tracks")
      .insert({
        id: trackId,
        label,
        artist,
        mood_desc: moodDesc || "PosMul 힐링룸 오리지널 감성 BGM",
        audio_url: audioUrl,
        storage_path: storagePath,
        frequencies,
        waveform,
        is_active: body.isActive ?? true,
        sort_order: sortOrder,
      })
      .select("*")
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, track: data }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "BGM 등록 실패";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;

  try {
    const body = (await req.json()) as UpdateBgmBody;
    const id = typeof body.id === "string" ? body.id.trim() : "";

    if (!id) {
      return NextResponse.json(
        { success: false, error: "수정할 BGM ID가 필요합니다." },
        { status: 400 }
      );
    }

    const patch: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (typeof body.label === "string") {
      const trimmed = body.label.trim();
      if (!trimmed || trimmed.length > 80) {
        return NextResponse.json(
          { success: false, error: "BGM 제목은 1~80자여야 합니다." },
          { status: 400 }
        );
      }
      patch.label = trimmed;
    }
    if (typeof body.artist === "string") {
      patch.artist = body.artist.trim() || "PosMul Studio";
    }
    if (typeof body.moodDesc === "string") {
      patch.mood_desc = body.moodDesc.trim();
    }
    if (body.audioUrl !== undefined) {
      patch.audio_url =
        typeof body.audioUrl === "string" && body.audioUrl.trim()
          ? body.audioUrl.trim()
          : null;
    }
    if (typeof body.isActive === "boolean") {
      patch.is_active = body.isActive;
    }
    if (typeof body.sortOrder === "number" && Number.isFinite(body.sortOrder)) {
      patch.sort_order = Math.round(body.sortOrder);
    }

    const { data, error } = await supabaseAdmin
      .schema("user")
      .from("healing_room_bgm_tracks")
      .update(patch)
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, track: data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "BGM 수정 실패";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;

  try {
    const url = new URL(req.url);
    let id = url.searchParams.get("id")?.trim() ?? "";

    if (!id) {
      try {
        const body = (await req.json()) as { id?: string };
        id = typeof body.id === "string" ? body.id.trim() : "";
      } catch {
        id = "";
      }
    }

    if (!id) {
      return NextResponse.json(
        { success: false, error: "삭제할 BGM ID가 필요합니다." },
        { status: 400 }
      );
    }

    const { data: existing, error: fetchError } = await supabaseAdmin
      .schema("user")
      .from("healing_room_bgm_tracks")
      .select("id, storage_path")
      .eq("id", id)
      .maybeSingle();

    if (fetchError) {
      return NextResponse.json(
        { success: false, error: fetchError.message },
        { status: 500 }
      );
    }

    const { error: deleteError } = await supabaseAdmin
      .schema("user")
      .from("healing_room_bgm_tracks")
      .delete()
      .eq("id", id);

    if (deleteError) {
      return NextResponse.json(
        { success: false, error: deleteError.message },
        { status: 500 }
      );
    }

    if (existing?.storage_path) {
      await supabaseAdmin.storage.from(BGM_BUCKET).remove([existing.storage_path]);
    }

    return NextResponse.json({ success: true, deletedId: id });
  } catch (error) {
    const message = error instanceof Error ? error.message : "BGM 삭제 실패";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
