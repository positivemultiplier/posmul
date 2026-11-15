export interface BoxSubItem {
  label: string;
  text: string;
}

const KOREAN_ORDER: Record<string, number> = {
  ㄱ: 1,
  ㄴ: 2,
  ㄷ: 3,
  ㄹ: 4,
  ㅁ: 5,
};

/**
 * <보기> 박스 본문에서 ㄱ., ㄴ., ㄷ., ㄹ., ㅁ. 항목을 분리 추출합니다.
 */
export function extractBoxSubItems(boxContent: string | null | undefined): BoxSubItem[] {
  if (!boxContent) return [];

  const matches = Array.from(boxContent.matchAll(/(?:^|[\s\n])([ㄱㄴㄷㄹㅁ])\.\s+/g));
  if (matches.length < 2) return [];

  const items: BoxSubItem[] = [];
  for (let i = 0; i < matches.length; i++) {
    const m = matches[i];
    const label = m[1];
    const start = (m.index ?? 0) + m[0].length;
    const end = i + 1 < matches.length ? (matches[i + 1].index ?? boxContent.length) : boxContent.length;
    const text = boxContent.slice(start, end).replace(/\s+/g, " ").trim();
    if (text) {
      items.push({ label, text });
    }
  }

  if (items.length < 2) return [];
  // 중복 라벨 방어 및 ㄱ-ㄴ-ㄷ-ㄹ-ㅁ 순서 정돈
  const seen = new Set<string>();
  const unique = items.filter((item) => {
    if (seen.has(item.label)) return false;
    seen.add(item.label);
    return true;
  });
  return unique.sort((a, b) => (KOREAN_ORDER[a.label] ?? 9) - (KOREAN_ORDER[b.label] ?? 9));
}

/**
 * 5지선다가 "ㄱ", "ㄴ, ㄷ", "ㄱ, ㄴ, ㄹ", "없음" 같은 조합형 기호인지 판별합니다.
 */
export function isBoxCombinationOptions(options: Array<{ optionText: string }>): boolean {
  if (options.length === 0) return false;
  return options.every((o) => {
    const clean = o.optionText.replace(/[\s,·ㆍ]/g, "");
    return clean === "없음" || /^[ㄱㄴㄷㄹㅁ]+$/.test(clean);
  });
}

/**
 * 조합형 정답 선지로부터 <보기> 각 항목(ㄱ, ㄴ, ㄷ, ㄹ)이 실제로 O(옳음/해당)인지 X(틀림/해당안함)인지 역산합니다.
 */
export function inferBoxItemCorrectness(
  questionText: string,
  boxItems: BoxSubItem[],
  options: Array<{ optionNumber: number; optionText: string }>,
  correctOptions: number[],
  isNegativeFlag?: boolean
): Record<string, boolean> | null {
  if (boxItems.length < 2 || !isBoxCombinationOptions(options) || correctOptions.length === 0) {
    return null;
  }
  const ansOpt = options.find((o) => o.optionNumber === correctOptions[0]);
  if (!ansOpt) return null;

  const isNegative =
    Boolean(isNegativeFlag) ||
    /(옳지\s*않은|틀린\s*것|아닌\s*것|해당하지\s*않는|포함되지\s*않는|잘못\s*연결|바르지\s*않은)/.test(
      questionText
    );

  const selectedLabels = new Set(Array.from(ansOpt.optionText.matchAll(/[ㄱㄴㄷㄹㅁ]/g)).map((m) => m[0]));
  const result: Record<string, boolean> = {};
  for (const item of boxItems) {
    const inAnswer = selectedLabels.has(item.label);
    result[item.label] = isNegative ? !inAnswer : inAnswer;
  }
  return result;
}
