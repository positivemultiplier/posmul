import { createClient } from "@supabase/supabase-js";

interface BannedWordRecord {
  id: string;
  word: string;
  reason?: string;
  is_active: boolean;
  created_at: string;
  created_by?: string;
}

let cachedWords: string[] = [];
let cacheTimestamp = 0;
const CACHE_TTL_MS = 30 * 1000; // 30초 캐싱

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

/**
 * 활성 금지어 목록 조회 (인메모리 캐시 적용)
 */
export async function getActiveBannedWords(): Promise<string[]> {
  const now = Date.now();
  if (cachedWords.length > 0 && now - cacheTimestamp < CACHE_TTL_MS) {
    return cachedWords;
  }

  try {
    const admin = getAdminClient();
    const { data, error } = await admin
      .schema("forum")
      .from("banned_words")
      .select("word")
      .eq("is_active", true);

    if (error || !data) {
      console.warn("banned_words fetch error:", error?.message);
      return cachedWords;
    }

    cachedWords = data.map((d: { word: string }) => d.word.trim().toLowerCase()).filter(Boolean);
    cacheTimestamp = now;
    return cachedWords;
  } catch (err) {
    console.warn("getActiveBannedWords exception:", err);
    return cachedWords;
  }
}

/**
 * 텍스트 내 금지어 포함 여부 검사
 */
export async function checkTextForBannedWords(
  text: string
): Promise<{ hasBannedWord: boolean; detectedWord?: string }> {
  if (!text) return { hasBannedWord: false };

  const bannedList = await getActiveBannedWords();
  if (!bannedList || bannedList.length === 0) {
    return { hasBannedWord: false };
  }

  // HTML 태그 제거 및 소문자 정규화
  const cleanText = text.replace(/<[^>]*>?/gm, "").toLowerCase();

  for (const word of bannedList) {
    if (word && cleanText.includes(word)) {
      return { hasBannedWord: true, detectedWord: word };
    }
  }

  return { hasBannedWord: false };
}

/**
 * 금지어 추가
 */
export async function addBannedWord(params: {
  word: string;
  reason?: string;
  createdBy?: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const cleanWord = params.word.trim();
    if (!cleanWord) {
      return { success: false, error: "금지어 단어를 입력해주세요." };
    }

    const admin = getAdminClient();
    const { error } = await admin
      .schema("forum")
      .from("banned_words")
      .upsert(
        {
          word: cleanWord,
          reason: params.reason?.trim() || "부적절한 단어/욕설/도배",
          is_active: true,
          created_by: params.createdBy || "ADMIN",
        },
        { onConflict: "word" }
      );

    if (error) {
      return { success: false, error: error.message };
    }

    // 캐시 무효화
    cacheTimestamp = 0;
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * 금지어 삭제
 */
export async function deleteBannedWord(
  wordIdOrWord: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const admin = getAdminClient();
    const { error } = await admin
      .schema("forum")
      .from("banned_words")
      .delete()
      .or(`id.eq.${wordIdOrWord},word.eq.${wordIdOrWord}`);

    if (error) {
      return { success: false, error: error.message };
    }

    // 캐시 무효화
    cacheTimestamp = 0;
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * 관리자용 전체 금지어 목록 조회
 */
export async function getAllBannedWords(): Promise<BannedWordRecord[]> {
  try {
    const admin = getAdminClient();
    const { data } = await admin
      .schema("forum")
      .from("banned_words")
      .select("*")
      .order("created_at", { ascending: false });

    return (data || []) as BannedWordRecord[];
  } catch {
    return [];
  }
}

