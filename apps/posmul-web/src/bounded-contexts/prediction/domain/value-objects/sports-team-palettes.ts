/**
 * 저작권·상표권 100% 안전 스포츠 팀 컬러 & 약어 팔레트 (Domain Pure TS)
 * - 구단 공식 로고/엠블럼 이미지를 복제하지 않고, 고유 팀 컬러 2색 + 기하학 방패 + 약어(티커)로만 식별합니다.
 */

export type BadgePattern = "stripe" | "split" | "sash" | "solid";

export interface SportsTeamPalette {
  readonly code: string;
  readonly displayName: string;
  readonly league: string;
  readonly primaryHex: string;
  readonly secondaryHex: string;
  readonly textHex: string;
  readonly pattern: BadgePattern;
  readonly keywords: readonly string[];
}

export interface ResolvedTeamBadge {
  readonly code: string;
  readonly displayName: string;
  readonly league?: string;
  readonly primaryHex: string;
  readonly secondaryHex: string;
  readonly textHex: string;
  readonly pattern: BadgePattern;
}

export interface SportsMatchupBadges {
  readonly mode: "matchup" | "single";
  readonly home: ResolvedTeamBadge;
  readonly away?: ResolvedTeamBadge;
}

const t = (
  code: string,
  displayName: string,
  league: string,
  primaryHex: string,
  secondaryHex: string,
  pattern: BadgePattern,
  keywords: readonly string[],
  textHex = "#FFFFFF"
): SportsTeamPalette => ({
  code,
  displayName,
  league,
  primaryHex,
  secondaryHex,
  textHex,
  pattern,
  keywords,
});

export const SPORTS_TEAM_PALETTES: readonly SportsTeamPalette[] = [
  // 대한민국 국가대표팀
  t("KOR", "대한민국 대표팀", "국가대표", "#CD2E3A", "#0047A0", "sash", ["한국 축구대표팀", "대한민국 축구", "축구대표팀", "태극전사", "대한민국 대표팀", "벤투호", "홍명보호", "모레노"]),

  // K리그 (전남·광주 거점 포함)
  t("GWJ", "광주 FC", "K리그", "#F5B800", "#9B1B30", "stripe", ["광주fc", "광주 fc"], "#111827"),
  t("JND", "전남 드래곤즈", "K리그", "#FFD200", "#111827", "sash", ["전남 드래곤즈", "전남드래곤즈"], "#111827"),
  t("ULS", "울산 HD", "K리그", "#004B9B", "#FACC15", "stripe", ["울산 hd", "울산hd", "울산 현대", "울산현대"]),
  t("JBH", "전북 현대", "K리그", "#006940", "#10B981", "solid", ["전북 현대", "전북현대"]),
  t("POH", "포항 스틸러스", "K리그", "#D91E2A", "#111827", "stripe", ["포항 스틸러스", "포항스틸러스"]),
  t("SEO", "FC 서울", "K리그", "#B81D24", "#111827", "stripe", ["fc서울", "fc 서울"]),
  t("SWN", "수원 삼성", "K리그", "#005BAC", "#FFFFFF", "sash", ["수원 삼성", "수원삼성"]),
  t("DGU", "대구 FC", "K리그", "#38BDF8", "#0369A1", "split", ["대구fc", "대구 fc"], "#090B12"),
  t("INC", "인천 유나이티드", "K리그", "#0046A0", "#111827", "stripe", ["인천 유나이티드", "인천유나이티드"]),
  t("GWN", "강원 FC", "K리그", "#EA580C", "#0F766E", "sash", ["강원fc", "강원 fc"]),

  // EPL / 유럽 축구
  t("TOT", "토트넘", "EPL", "#132257", "#E2E8F0", "split", ["토트넘", "tottenham", "spurs", "손흥민"]),
  t("ARS", "아스날", "EPL", "#EF0107", "#FFFFFF", "split", ["아스날", "아스널", "arsenal"]),
  t("LIV", "리버풀", "EPL", "#C8102E", "#00B2A9", "solid", ["리버풀", "liverpool"]),
  t("MCI", "맨시티", "EPL", "#6CABDD", "#1C2C5B", "sash", ["맨시티", "맨체스터 시티", "man city", "manchester city"], "#090B12"),
  t("MUN", "맨유", "EPL", "#DA291C", "#FBE122", "split", ["맨유", "맨체스터 유나이티드", "man utd", "manchester united"]),
  t("CHE", "첼시", "EPL", "#034694", "#DBA111", "solid", ["첼시", "chelsea"]),
  t("NEW", "뉴캐슬", "EPL", "#111827", "#F8FAFC", "stripe", ["뉴캐슬", "newcastle"]),
  t("RMA", "레알 마드리드", "라리가", "#F8FAFC", "#D4AF37", "sash", ["레알 마드리드", "레알마드리드", "real madrid"], "#0F172A"),
  t("BAR", "바르셀로나", "라리가", "#A50044", "#004D98", "stripe", ["바르셀로나", "바르사", "barcelona"]),
  t("BAY", "바이에른 뮌헨", "분데스리가", "#DC052D", "#0066B2", "sash", ["바이에른", "뮌헨", "bayern", "김민재"]),
  t("PSG", "PSG", "리그1", "#004170", "#DA291C", "stripe", ["psg", "파리 생제르맹", "파리생제르맹", "이강인"]),
  t("BVB", "도르트문트", "분데스리가", "#FDE100", "#111827", "split", ["도르트문트", "dortmund", "bvb"], "#111827"),
  t("INT", "인터 밀란", "세리에A", "#010E80", "#111827", "stripe", ["인터 밀란", "인터밀란", "인테르", "inter milan"]),

  // KBO 프로야구 (KIA 타이거즈 포함 10구단)
  t("KIA", "KIA 타이거즈", "KBO", "#EA0029", "#06141F", "sash", ["kia", "기아 타이거즈", "기아타이거즈", "타이거즈"]),
  t("SAM", "삼성 라이온즈", "KBO", "#074CA1", "#CBD5E1", "solid", ["삼성 라이온즈", "삼성라이온즈", "라이온즈"]),
  t("LG", "LG 트윈스", "KBO", "#C30452", "#111827", "stripe", ["lg 트윈스", "lg트윈스", "트윈스"]),
  t("DOO", "두산 베어스", "KBO", "#131230", "#ED1C24", "sash", ["두산 베어스", "두산베어스", "베어스"]),
  t("SSG", "SSG 랜더스", "KBO", "#CE0E2D", "#FFB81C", "split", ["ssg", "랜더스"]),
  t("HAN", "한화 이글스", "KBO", "#FF6600", "#111827", "sash", ["한화 이글스", "한화이글스", "이글스"]),
  t("LOT", "롯데 자이언츠", "KBO", "#041E42", "#D00F31", "stripe", ["롯데 자이언츠", "롯데자이언츠", "자이언츠"]),
  t("KT", "KT 위즈", "KBO", "#111827", "#EB1C24", "sash", ["kt 위즈", "kt위즈", "위즈"]),
  t("NC", "NC 다이노스", "KBO", "#071D3D", "#C7A079", "split", ["nc 다이노스", "nc다이노스", "다이노스"]),
  t("KIW", "키움 히어로즈", "KBO", "#570514", "#D4AF37", "solid", ["키움 히어로즈", "키움히어로즈", "히어로즈"]),

  // MLB / LCK / NBA
  t("LAD", "LA 다저스", "MLB", "#005A9C", "#EF3E42", "sash", ["다저스", "dodgers", "오타니", "김혜성"]),
  t("SF", "샌프란시스코", "MLB", "#FD5A1E", "#111827", "split", ["샌프란시스코", "이정후"]),
  t("T1", "T1", "LCK", "#E2012D", "#111827", "sash", ["t1", "페이커", "faker"]),
  t("GEN", "젠지 (Gen.G)", "LCK", "#AA8A00", "#111827", "stripe", ["젠지", "gen.g", "geng"]),
  t("HLE", "한화생명", "LCK", "#FF6B00", "#1E293B", "split", ["한화생명", "hle"]),
  t("DK", "디플러스 기아", "LCK", "#00D2B8", "#0F172A", "sash", ["디플러스", "담원", "dk "], "#090B12"),
  t("LAL", "LA 레이커스", "NBA", "#552583", "#FDB927", "sash", ["레이커스", "lakers"]),
  t("GSW", "골든스테이트", "NBA", "#1D428A", "#FFC72C", "split", ["골든스테이트", "워리어스", "warriors", "커리"]),
  t("BOS", "보스턴 셀틱스", "NBA", "#007A33", "#BA9653", "solid", ["셀틱스", "celtics"]),
];

const FALLBACK_COLORS: ReadonlyArray<{
  primaryHex: string;
  secondaryHex: string;
  textHex: string;
}> = [
  { primaryHex: "#0284C7", secondaryHex: "#0F172A", textHex: "#FFFFFF" },
  { primaryHex: "#E11D48", secondaryHex: "#1E293B", textHex: "#FFFFFF" },
  { primaryHex: "#059669", secondaryHex: "#064E3B", textHex: "#FFFFFF" },
  { primaryHex: "#D97706", secondaryHex: "#111827", textHex: "#FFFFFF" },
  { primaryHex: "#7C3AED", secondaryHex: "#1E1B4B", textHex: "#FFFFFF" },
];

function hashText(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function toResolved(team: SportsTeamPalette): ResolvedTeamBadge {
  return {
    code: team.code,
    displayName: team.displayName,
    league: team.league,
    primaryHex: team.primaryHex,
    secondaryHex: team.secondaryHex,
    textHex: team.textHex,
    pattern: team.pattern,
  };
}

function buildFallbackTeamBadge(rawName: string): ResolvedTeamBadge {
  const clean = rawName
    .replace(/\([^)]*\)/g, "")
    .replace(/승리|승|우승|홈|원정/g, "")
    .trim();
  const palette = FALLBACK_COLORS[hashText(clean || rawName) % FALLBACK_COLORS.length];
  const latin = clean.match(/[A-Za-z0-9]{2,4}/)?.[0];
  const code = latin
    ? latin.toUpperCase()
    : clean.replace(/\s+/g, "").slice(0, 2) || "VS";

  return {
    code,
    displayName: clean || rawName,
    primaryHex: palette.primaryHex,
    secondaryHex: palette.secondaryHex,
    textHex: palette.textHex,
    pattern: "sash",
  };
}

export function findSportsTeamPalette(text: string): ResolvedTeamBadge | null {
  const lower = text.toLowerCase();
  for (const team of SPORTS_TEAM_PALETTES) {
    if (team.keywords.some((kw) => lower.includes(kw.toLowerCase()))) {
      return toResolved(team);
    }
  }
  return null;
}

export function extractSportsMatchupBadges(input: {
  title: string;
  category?: string;
  subcategory?: string;
  optionLabels?: ReadonlyArray<string>;
}): SportsMatchupBadges | null {
  const cat = (input.category ?? "").toUpperCase();
  const sub = (input.subcategory ?? "").toLowerCase();
  const isSports =
    cat === "SPORTS" ||
    ["soccer", "baseball", "basketball", "esports", "volleyball"].includes(sub) ||
    /\[SPORTS\]|EPL|K리그|KBO|LCK|UCL|NBA|MLB|축구|야구/i.test(input.title);

  if (!isSports) return null;

  const vsMatch = input.title.match(
    /(?:\[[^\]]+\]\s*)?([^:：,?!]+?)\s+(?:vs\.?|VS\.?|대)\s+([^:：,?!]+)/
  );
  if (vsMatch) {
    const leftRaw = vsMatch[1].trim();
    const rightRaw = vsMatch[2].trim();
    return {
      mode: "matchup",
      home: findSportsTeamPalette(leftRaw) ?? buildFallbackTeamBadge(leftRaw),
      away: findSportsTeamPalette(rightRaw) ?? buildFallbackTeamBadge(rightRaw),
    };
  }

  const combined = [input.title, ...(input.optionLabels ?? [])].join(" ").toLowerCase();
  const matched: ResolvedTeamBadge[] = [];

  for (const team of SPORTS_TEAM_PALETTES) {
    if (team.keywords.some((kw) => combined.includes(kw.toLowerCase()))) {
      matched.push(toResolved(team));
      if (matched.length === 2) break;
    }
  }

  if (matched.length === 2) return { mode: "matchup", home: matched[0], away: matched[1] };
  if (matched.length === 1) return { mode: "single", home: matched[0] };
  return null;
}
