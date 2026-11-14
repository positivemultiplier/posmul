import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { requireAdminApi } from "@/shared/lib/security/admin-auth";

const ALLOWED_EXTENSIONS = new Set(["mp3", "wav", "ogg", "m4a", "aac", "webm"]);
const BUCKET_NAME = "healing-room-bgm";

function sanitizeFileBaseName(rawName: string): string {
  const withoutExt = rawName.replace(/\.[^.]+$/, "");
  const asciiSlug = withoutExt
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_]+/g, "-")
    .toLowerCase()
    .slice(0, 40);

  return asciiSlug || "track";
}

export async function POST(req: NextRequest) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;

  try {
    const body = (await req.json()) as { fileName?: string };
    const fileName = typeof body.fileName === "string" ? body.fileName.trim() : "";

    if (!fileName) {
      return NextResponse.json(
        { success: false, error: "업로드할 파일명이 필요합니다." },
        { status: 400 }
      );
    }

    const extMatch = fileName.toLowerCase().match(/\.([a-z0-9]+)$/);
    const ext = extMatch?.[1] ?? "";
    if (!ALLOWED_EXTENSIONS.has(ext)) {
      return NextResponse.json(
        {
          success: false,
          error: `지원하지 않는 오디오 형식입니다. (${Array.from(ALLOWED_EXTENSIONS).join(", ")})`,
        },
        { status: 400 }
      );
    }

    const safeBase = sanitizeFileBaseName(fileName);
    const randomSuffix = Math.random().toString(36).slice(2, 8);
    const storagePath = `tracks/${Date.now()}-${randomSuffix}-${safeBase}.${ext}`;

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
