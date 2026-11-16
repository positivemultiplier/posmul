import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

const AUDIO_EXTENSIONS = new Set(["mp3", "wav", "ogg", "m4a", "aac", "webm"]);
const IMAGE_EXTENSIONS = new Set(["png", "jpg", "jpeg", "webp", "gif"]);
const BUCKET_NAME = "healing-room-creations";

function sanitizeFileBaseName(rawName: string): string {
  const withoutExt = rawName.replace(/\.[^.]+$/, "");
  const asciiSlug = withoutExt
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_]+/g, "-")
    .toLowerCase()
    .slice(0, 40);

  return asciiSlug || "creation";
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.id) {
      return NextResponse.json(
        { success: false, error: "로그인 후 내 창작 파일을 업로드할 수 있습니다." },
        { status: 401 }
      );
    }

    const body = (await req.json()) as { fileName?: string; mediaType?: "audio" | "image" };
    const fileName = typeof body.fileName === "string" ? body.fileName.trim() : "";
    const mediaType = body.mediaType === "audio" ? "audio" : "image";

    if (!fileName) {
      return NextResponse.json(
        { success: false, error: "업로드할 파일명이 필요합니다." },
        { status: 400 }
      );
    }

    const extMatch = fileName.toLowerCase().match(/\.([a-z0-9]+)$/);
    const ext = extMatch?.[1] ?? "";
    const allowedSet = mediaType === "audio" ? AUDIO_EXTENSIONS : IMAGE_EXTENSIONS;

    if (!allowedSet.has(ext)) {
      return NextResponse.json(
        {
          success: false,
          error: `지원하지 않는 ${mediaType === "audio" ? "오디오" : "이미지"} 형식입니다. (${Array.from(allowedSet).join(", ")})`,
        },
        { status: 400 }
      );
    }

    const safeBase = sanitizeFileBaseName(fileName);
    const randomSuffix = Math.random().toString(36).slice(2, 8);
    const storagePath = `${user.id}/${mediaType}/${Date.now()}-${randomSuffix}-${safeBase}.${ext}`;

    const { data, error } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .createSignedUploadUrl(storagePath);

    if (error || !data) {
      return NextResponse.json(
        { success: false, error: error?.message ?? "업로드 URL 발급에 실패했습니다." },
        { status: 500 }
      );
    }

    const { data: publicData } = supabaseAdmin.storage
      .from(BUCKET_NAME)
      .getPublicUrl(storagePath);

    return NextResponse.json({
      success: true,
      bucket: BUCKET_NAME,
      storagePath,
      token: data.token,
      signedUrl: data.signedUrl,
      publicUrl: publicData.publicUrl,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "업로드 URL 생성 오류";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
