export interface SubjectiveSlot {
  key: string;
  label: string;
}

/**
 * 공식 정답 및 문제 본문에서 주관식 입력 칸(ㄱ, ㄴ, ㄷ, ㄹ 등)을 추출합니다.
 */
export function extractSubjectiveSlots(
  subjectiveAnswer: string | null,
  questionText: string,
  boxContent: string | null
): SubjectiveSlot[] {
  const ans = (subjectiveAnswer ?? "").replace(/[‘’'"]/g, "").trim();

  // 1) 정답 문자열에 ㄱ: ㄴ: ㄷ: ㄹ: 라벨이 명시된 경우
  const labelMatches = Array.from(ans.split(/또는/)[0].matchAll(/(ㄱ|ㄴ|ㄷ|ㄹ)\s*:/g)).map((m) => m[1]);
  if (labelMatches.length > 0) {
    const uniqueLabels = Array.from(new Set(labelMatches));
    return uniqueLabels.map((lbl) => ({ key: lbl, label: lbl }));
  }

  // 2) 문제 본문/박스 안에 ( ㄱ ), ( ㄴ ), ( ㄷ ) 형태가 있는 경우
  const combinedText = `${questionText} ${boxContent ?? ""}`;
  const bodyLabels = Array.from(combinedText.matchAll(/\(\s*(ㄱ|ㄴ|ㄷ|ㄹ)\s*\)/g)).map((m) => m[1]);
  if (bodyLabels.length > 0) {
    const uniqueBody = Array.from(new Set(bodyLabels));
    return uniqueBody.map((lbl) => ({ key: lbl, label: lbl }));
  }

  // 3) 구버전(2019 등) 정답이 "300, 100" / "9, 재무제표" 처럼 쉼표+공백으로 나뉜 복수 답인 경우
  const firstAlt = ans.split(/또는/)[0].trim();
  const commaParts = firstAlt.split(/,\s+/).filter(Boolean);
  if (commaParts.length >= 2) {
    const koreanLabels = ["ㄱ", "ㄴ", "ㄷ", "ㄹ"];
    return commaParts.map((_, i) => ({
      key: koreanLabels[i] ?? String(i + 1),
      label: koreanLabels[i] ?? `${i + 1}`,
    }));
  }

  return [{ key: "답", label: "답" }];
}

/**
 * 저장된 문자열("ㄱ: 50 ㄴ: 25" 또는 단일 텍스트)을 슬롯별 Map으로 파싱합니다.
 */
export function parseSubjectiveInputToMap(
  rawInput: string | null | undefined,
  slots: SubjectiveSlot[]
): Record<string, string> {
  const result: Record<string, string> = {};
  for (const s of slots) result[s.key] = "";

  const text = (rawInput ?? "").trim();
  if (!text) return result;

  if (slots.length === 1 && !/^(ㄱ|ㄴ|ㄷ|ㄹ)\s*:/.test(text)) {
    result[slots[0].key] = text;
    return result;
  }

  // "ㄱ: 50 ㄴ: 25" 또는 "ㄱ: 1 ㄴ: 승강기안전종합 정보망" 파싱
  const regex = /(ㄱ|ㄴ|ㄷ|ㄹ)\s*:\s*([\s\S]*?)(?=(?:\s+(?:ㄱ|ㄴ|ㄷ|ㄹ)\s*:)|$)/g;
  let matched = false;
  for (const m of text.matchAll(regex)) {
    matched = true;
    const key = m[1];
    if (key in result) {
      result[key] = m[2].trim();
    }
  }

  if (!matched && slots.length > 0) {
    const parts = text.split(/,\s*/);
    slots.forEach((s, idx) => {
      if (parts[idx] !== undefined) result[s.key] = parts[idx].trim();
    });
  }

  return result;
}

/**
 * 슬롯별 입력값을 DB 저장용 문자열("ㄱ: 50 ㄴ: 25" 또는 단일 문자열)로 직렬화합니다.
 */
export function serializeSubjectiveMap(
  map: Record<string, string>,
  slots: SubjectiveSlot[]
): string {
  if (slots.length === 1 && slots[0].key === "답") {
    return (map["답"] ?? "").trim();
  }
  const filled = slots
    .map((s) => ({ key: s.key, val: (map[s.key] ?? "").trim() }))
    .filter((item) => item.val.length > 0);
  if (filled.length === 0) return "";
  return slots.map((s) => `${s.key}: ${(map[s.key] ?? "").trim()}`).join(" ");
}

function normalizeToken(val: string): string {
  return val.replace(/[\s,·ㆍ]/g, "").toLowerCase();
}

/**
 * "10(십)" -> ["10", "십"], "5만(50,000)" -> ["5만", "50000"], "부등률(율)" -> ["부등률", "부등율"] 등 허용 후보 생성
 */
function expandAcceptedVariants(expectedPart: string): string[] {
  const clean = expectedPart.replace(/[‘’'"]/g, "").trim();
  const variants = new Set<string>([normalizeToken(clean)]);

  const parenMatch = clean.match(/^([^(]+)\(([^)]+)\)$/);
  if (parenMatch) {
    const main = parenMatch[1].trim();
    const inside = parenMatch[2].trim();
    variants.add(normalizeToken(main));
    variants.add(normalizeToken(inside));
    // "부등률(율)" 처럼 마지막 1글자 대체형
    if (inside.length === 1 && main.length >= 2) {
      variants.add(normalizeToken(main.slice(0, -1) + inside));
    }
  }
  return Array.from(variants).filter(Boolean);
}

export interface SubjectiveGradeResult {
  isAllCorrect: boolean | null;
  slotCorrectness: Record<string, boolean | null>;
}

/**
 * 복수 슬롯 및 "또는" 대안 정답을 모두 지원해 주관식 정오답을 판정합니다.
 */
export function gradeSubjectiveBySlots(
  rawInput: string | null | undefined,
  subjectiveAnswer: string | null,
  slots: SubjectiveSlot[]
): SubjectiveGradeResult {
  const inputMap = parseSubjectiveInputToMap(rawInput, slots);
  const hasAnyInput = Object.values(inputMap).some((v) => v.trim().length > 0);
  if (!hasAnyInput || !subjectiveAnswer) {
    return { isAllCorrect: null, slotCorrectness: {} };
  }

  const cleanOfficial = subjectiveAnswer.replace(/[‘’'"]/g, "").trim();
  const alternatives = cleanOfficial.split(/\s+또는\s+/).map((a) => a.trim()).filter(Boolean);

  for (const alt of alternatives) {
    const slotExpected: Record<string, string> = {};
    if (slots.length === 1 && !/(ㄱ|ㄴ|ㄷ|ㄹ)\s*:/.test(alt)) {
      slotExpected[slots[0].key] = alt;
    } else if (/(ㄱ|ㄴ|ㄷ|ㄹ)\s*:/.test(alt)) {
      const parsed = parseSubjectiveInputToMap(alt, slots);
      Object.assign(slotExpected, parsed);
    } else {
      const parts = alt.split(/,\s*/);
      slots.forEach((s, idx) => {
        slotExpected[s.key] = (parts[idx] ?? parts[0] ?? "").trim();
      });
    }

    const perSlot: Record<string, boolean> = {};
    let allMatched = true;
    for (const s of slots) {
      const userVal = normalizeToken(inputMap[s.key] ?? "");
      const exp = slotExpected[s.key] ?? "";
      const accepted = expandAcceptedVariants(exp);
      const ok = userVal.length > 0 && accepted.includes(userVal);
      perSlot[s.key] = ok;
      if (!ok) allMatched = false;
    }

    if (allMatched) {
      return { isAllCorrect: true, slotCorrectness: perSlot };
    }
  }

  // 오답일 때는 첫 번째 대안 기준으로 어느 칸이 맞고 틀렸는지 상세 표시
  const firstAlt = alternatives[0] ?? cleanOfficial;
  const fallbackExpected =
    slots.length === 1 && !/(ㄱ|ㄴ|ㄷ|ㄹ)\s*:/.test(firstAlt)
      ? { [slots[0].key]: firstAlt }
      : /(ㄱ|ㄴ|ㄷ|ㄹ)\s*:/.test(firstAlt)
        ? parseSubjectiveInputToMap(firstAlt, slots)
        : Object.fromEntries(slots.map((s, idx) => [s.key, firstAlt.split(/,\s*/)[idx] ?? ""]));

  const slotCorrectness: Record<string, boolean | null> = {};
  for (const s of slots) {
    const userVal = normalizeToken(inputMap[s.key] ?? "");
    if (!userVal) {
      slotCorrectness[s.key] = false;
    } else {
      const accepted = expandAcceptedVariants(fallbackExpected[s.key] ?? "");
      slotCorrectness[s.key] = accepted.includes(userVal);
    }
  }

  return { isAllCorrect: false, slotCorrectness };
}
