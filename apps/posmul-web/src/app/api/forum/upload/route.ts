import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

export async function POST(req: NextRequest) {
  try {
    // 1. 서버 세션 인증 필수
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: "로그인이 필요합니다." },
        { status: 401 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ success: false, error: "파일이 없습니다." }, { status: 400 });
    }

    // 2. 파일 크기 제한 검증
    if (file.size <= 0 || file.size > MAX_UPLOAD_BYTES) {
      return NextResponse.json(
        { success: false, error: "이미지 크기는 최대 5MB까지 업로드할 수 있습니다." },
        { status: 400 }
      );
    }

    // 3. MIME 타입 화이트리스트 검증 (클라이언트 파일명 확장자 신뢰 금지)
    const safeExt = ALLOWED_MIME_TO_EXT[file.type];
    if (!safeExt) {
      return NextResponse.json(
        { success: false, error: "허용된 이미지 형식(JPG, PNG, WEBP, GIF)만 업로드할 수 있습니다." },
        { status: 400 }
      );
    }

    const fileName = `${Date.now()}-${uuidv4()}.${safeExt}`;
    const filePath = `uploads/${user.id}/${fileName}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { error: uploadError } = await supabaseAdmin.storage
      .from("forum-images")
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      return NextResponse.json(
        { success: false, error: uploadError.message },
        { status: 500 }
      );
    }

    const { data: publicUrlData } = supabaseAdmin.storage
      .from("forum-images")
      .getPublicUrl(filePath);

    return NextResponse.json({
      success: true,
      url: publicUrlData.publicUrl,
    });
  } catch (err: unknown) {
    console.error("Upload handler error:", err);
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "업로드 중 오류 발생" },
      { status: 500 }
    );
  }
}
