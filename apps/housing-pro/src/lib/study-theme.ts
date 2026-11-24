/**
 * Housing-Pro Study v2.0 미니멀 컬러 토큰 및 포맷 유틸리티
 * - 저채도 뮤트 과목 컬러 (형광/네온 배제)
 * - 타이포그래피 숫자 정렬 및 이니셜 생성
 */

export const MUTED_SUBJECT_PALETTE: ReadonlyArray<{ keywords: string[]; hex: string }> = [
  { keywords: ["민법"], hex: "#4F7CAC" },
  { keywords: ["회계"], hex: "#C97B63" },
  { keywords: ["시설"], hex: "#5B8C73" },
  { keywords: ["법규", "관계법규"], hex: "#7D6FA3" },
  { keywords: ["실무", "관리실무"], hex: "#B89B5E" },
];

const FALLBACK_MUTED_HEXES = [
  "#4F7CAC",
  "#C97B63",
  "#5B8C73",
  "#7D6FA3",
  "#B89B5E",
  "#6C8EAD",
  "#A67C7C",
  "#6B9080",
] as const;

/** 과목명 또는 기존 색상을 저채도 미니멀 과목 컬러로 정규화 */
export function getMutedSubjectColor(subjectTitle: string, fallbackHex?: string, index = 0): string {
  const clean = (subjectTitle || "").trim();
  for (const entry of MUTED_SUBJECT_PALETTE) {
    if (entry.keywords.some((kw) => clean.includes(kw))) {
      return entry.hex;
    }
  }
  const normalizedFallback = (fallbackHex || "").trim().toUpperCase();
  // 기존 형광/원색 프리셋은 저채도 팔레트로 치환
  const brightLegacyColors = new Set([
    "#FF5A36",
    "#3B82F6",
    "#10B981",
    "#F59E0B",
    "#EC4899",
    "#A855F7",
    "#06B6D4",
    "#C4E538",
    "#F97316",
    "#7C3AED",
    "#F43F5E",
  ]);
  if (normalizedFallback && !brightLegacyColors.has(normalizedFallback)) {
    return fallbackHex as string;
  }
  return FALLBACK_MUTED_HEXES[Math.abs(index) % FALLBACK_MUTED_HEXES.length];
}

/** 초 단위를 HH:MM:SS 형태로 포맷 */
export function formatClockHHMMSS(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(safe / 3600);
  const m = Math.floor((safe % 3600) / 60);
  const s = safe % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/** 분 단위를 '3h 20m' 또는 '45m' 형태로 간결 포맷 */
export function formatCompactMinutes(totalMinutes: number): string {
  const safe = Math.max(0, Math.round(totalMinutes));
  const h = Math.floor(safe / 60);
  const m = safe % 60;
  if (h <= 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

/** 초 단위를 '3:20:05' 또는 '0:45:10' 형태로 포맷 */
export function formatShortClock(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(safe / 3600);
  const m = Math.floor((safe % 3600) / 60);
  const s = safe % 60;
  return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/** 닉네임에서 깔끔한 1~2글자 아바타 이니셜 추출 (이모지 미사용) */
export function getMemberInitials(name: string): string {
  const clean = (name || "").replace(/\s+/g, "").trim();
  if (!clean) return "HP";
  if (/^[A-Za-z0-9]/.test(clean)) {
    return clean.slice(0, 2).toUpperCase();
  }
  return clean.slice(0, 2);
}
