/**
 * PosMul 4단계 공간 계층(나라 · 시/도 · 구/군 · 동) Value Object 및 공통 정규화 유틸리티
 * - 초기 진입 단계 전략: 자동/공공데이터 게임은 구·군(LOCAL) 단위까지를 주력으로 운영
 * - 동·읍·면(DONG) 계층은 스키마·필터·유저/확장 경로를 유지하여 커뮤니티 성장 시 단계적 확장
 */

export type RegionHierarchyLevel = "NATION" | "REGION" | "LOCAL" | "DONG";

export const VALID_REGION_LEVELS = new Set<RegionHierarchyLevel>([
  "NATION",
  "REGION",
  "LOCAL",
  "DONG",
]);

export interface RegionPreset {
  level: RegionHierarchyLevel;
  code: string;
  name: string;
  parentCode?: string;
  /** 텍스트 자동 추론 시 매칭할 고유 행정명 별칭 */
  aliases: string[];
}

export const REGION_LEVEL_OPTIONS: ReadonlyArray<{
  value: RegionHierarchyLevel;
  label: string;
  shortLabel: string;
  description: string;
}> = [
  {
    value: "NATION",
    label: "🇰🇷 나라 (전국)",
    shortLabel: "나라",
    description: "전국 공통 경제·정책·스포츠·문화 이슈",
  },
  {
    value: "REGION",
    label: "🏙️ 시·도 (광역)",
    shortLabel: "시·도",
    description: "광역시·도 단위 대기질·행사·광역 생활 지표",
  },
  {
    value: "LOCAL",
    label: "📍 구·군 (우리구 · 초기 주력)",
    shortLabel: "구·군",
    description: "구청·시청 공식 통계·도서관·문화행사·상권 활력",
  },
  {
    value: "DONG",
    label: "🏡 동·읍·면 (우리동네 · 확장형)",
    shortLabel: "우리동네",
    description: "동네 날씨 및 주민센터·이웃 커뮤니티 확장용",
  },
];

/**
 * DB forum.forum_regions 시드와 동기화된 기본 행정구역 프리셋
 */
export const DEFAULT_REGION_PRESETS: ReadonlyArray<RegionPreset> = [
  { level: "NATION", code: "KR", name: "대한민국", aliases: ["대한민국", "전국"] },
  { level: "REGION", code: "11000", name: "서울특별시", parentCode: "KR", aliases: ["서울특별시", "서울시"] },
  { level: "REGION", code: "26000", name: "부산광역시", parentCode: "KR", aliases: ["부산광역시", "부산시"] },
  { level: "REGION", code: "29000", name: "광주광역시", parentCode: "KR", aliases: ["광주광역시", "광주시"] },
  { level: "REGION", code: "41000", name: "경기도", parentCode: "KR", aliases: ["경기도"] },
  { level: "REGION", code: "50000", name: "제주특별자치도", parentCode: "KR", aliases: ["제주특별자치도", "제주도"] },
  { level: "LOCAL", code: "11200", name: "서울 성동구", parentCode: "11000", aliases: ["성동구"] },
  { level: "LOCAL", code: "11440", name: "서울 마포구", parentCode: "11000", aliases: ["마포구"] },
  { level: "LOCAL", code: "29110", name: "광주 동구", parentCode: "29000", aliases: ["광주 동구", "광주광역시 동구"] },
  { level: "LOCAL", code: "29140", name: "광주 서구", parentCode: "29000", aliases: ["광주 서구", "광주광역시 서구"] },
  { level: "LOCAL", code: "29155", name: "광주 남구", parentCode: "29000", aliases: ["광주 남구", "광주광역시 남구"] },
  { level: "LOCAL", code: "29170", name: "광주 북구", parentCode: "29000", aliases: ["광주 북구", "광주광역시 북구"] },
  { level: "LOCAL", code: "29200", name: "광주 광산구", parentCode: "29000", aliases: ["광산구"] },
  { level: "LOCAL", code: "41135", name: "경기 성남시 분당구", parentCode: "41000", aliases: ["분당구", "성남시 분당구"] },
  { level: "LOCAL", code: "50110", name: "제주 제주시", parentCode: "50000", aliases: ["제주시"] },
  { level: "LOCAL", code: "11680", name: "서울 강남구", parentCode: "11000", aliases: ["강남구"] },
  { level: "LOCAL", code: "11710", name: "서울 송파구", parentCode: "11000", aliases: ["송파구"] },
  { level: "LOCAL", code: "26350", name: "부산 해운대구", parentCode: "26000", aliases: ["해운대구"] },
  { level: "DONG", code: "11200650", name: "성수1가2동", parentCode: "11200", aliases: ["성수1가2동", "성수동"] },
  { level: "DONG", code: "11440710", name: "연남동", parentCode: "11440", aliases: ["연남동"] },
  { level: "DONG", code: "29110510", name: "충장동", parentCode: "29110", aliases: ["충장동"] },
  { level: "DONG", code: "29200635", name: "첨단2동", parentCode: "29200", aliases: ["첨단2동", "첨단동"] },
  { level: "DONG", code: "50110253", name: "애월읍", parentCode: "50110", aliases: ["애월읍"] },
];

export interface NormalizedRegionInfo {
  regionLevel: RegionHierarchyLevel;
  regionCode: string;
  regionName: string;
}

export interface ResolveRegionInput {
  regionLevel?: string | null;
  regionCode?: string | null;
  regionName?: string | null;
  title?: string | null;
  summary?: string | null;
}

const DEFAULT_NAME_BY_LEVEL: Record<RegionHierarchyLevel, string> = {
  NATION: "대한민국",
  REGION: "시·도",
  LOCAL: "우리구",
  DONG: "우리동네",
};

const DEFAULT_CODE_BY_LEVEL: Record<RegionHierarchyLevel, string> = {
  NATION: "KR",
  REGION: "KR-REGION",
  LOCAL: "KR-LOCAL",
  DONG: "KR-DONG",
};

const CITY_DISTRICT_PATTERN =
  /(서울|부산|대구|인천|광주|대전|울산|세종|성남|수원|용인|고양|창원|청주|전주|천안)(?:시|광역시|특별시)?\s+([가-힣]{1,5}(?:구|군))/;

function findPresetByCodeOrName(
  code?: string | null,
  name?: string | null,
  level?: RegionHierarchyLevel
): RegionPreset | undefined {
  const cleanCode = code?.trim();
  if (cleanCode) {
    const byCode = DEFAULT_REGION_PRESETS.find((p) => p.code === cleanCode);
    if (byCode) return byCode;
  }

  const cleanName = name?.trim();
  if (!cleanName) return undefined;

  return DEFAULT_REGION_PRESETS.find(
    (p) =>
      (!level || p.level === level) &&
      (p.name === cleanName || p.aliases.some((alias) => alias === cleanName))
  );
}

/**
 * 명시적 지역 입력값 또는 제목·요약 텍스트를 바탕으로 표준 4단계 공간 정보를 정규화합니다.
 * - 명시값이 없으면 시/도·구/군 고유 명칭을 우선 탐지하고, 미매칭 시 NATION(대한민국)으로 귀속합니다.
 */
export function resolveNormalizedRegion(
  input: ResolveRegionInput
): NormalizedRegionInfo {
  const rawLevel = input.regionLevel?.trim().toUpperCase() ?? "";
  const explicitLevel = VALID_REGION_LEVELS.has(rawLevel as RegionHierarchyLevel)
    ? (rawLevel as RegionHierarchyLevel)
    : undefined;

  if (explicitLevel) {
    const preset = findPresetByCodeOrName(
      input.regionCode,
      input.regionName,
      explicitLevel
    );
    return {
      regionLevel: explicitLevel,
      regionCode:
        input.regionCode?.trim() ||
        preset?.code ||
        DEFAULT_CODE_BY_LEVEL[explicitLevel],
      regionName:
        input.regionName?.trim() ||
        preset?.name ||
        DEFAULT_NAME_BY_LEVEL[explicitLevel],
    };
  }

  const combinedText = `${input.title ?? ""} ${input.summary ?? ""}`.trim();
  if (!combinedText) {
    return { regionLevel: "NATION", regionCode: "KR", regionName: "대한민국" };
  }

  // 1) 제목 접두어 명시 태그 우선 확인
  if (combinedText.includes("[우리동네")) {
    const dongMatch = DEFAULT_REGION_PRESETS.find(
      (p) => p.level === "DONG" && p.aliases.some((a) => combinedText.includes(a))
    );
    return {
      regionLevel: "DONG",
      regionCode: dongMatch?.code ?? "KR-DONG",
      regionName: dongMatch?.name ?? "우리동네",
    };
  }
  if (combinedText.includes("[우리구")) {
    const localMatch = DEFAULT_REGION_PRESETS.find(
      (p) => p.level === "LOCAL" && p.aliases.some((a) => combinedText.includes(a))
    );
    return {
      regionLevel: "LOCAL",
      regionCode: localMatch?.code ?? "KR-LOCAL",
      regionName: localMatch?.name ?? "우리구",
    };
  }
  if (combinedText.includes("[우리시")) {
    const regionMatch = DEFAULT_REGION_PRESETS.find(
      (p) => p.level === "REGION" && p.aliases.some((a) => combinedText.includes(a))
    );
    return {
      regionLevel: "REGION",
      regionCode: regionMatch?.code ?? "KR-REGION",
      regionName: regionMatch?.name ?? "시·도",
    };
  }

  // 2) 초기 주력 단위: 구체적 구/군 명칭 탐지 (오탐 방지를 위해 프리셋 또는 시+구 패턴 사용)
  const localPreset = DEFAULT_REGION_PRESETS.find(
    (p) => p.level === "LOCAL" && p.aliases.some((alias) => combinedText.includes(alias))
  );
  if (localPreset) {
    return {
      regionLevel: "LOCAL",
      regionCode: localPreset.code,
      regionName: localPreset.name,
    };
  }

  const cityDistrictMatch = combinedText.match(CITY_DISTRICT_PATTERN);
  if (cityDistrictMatch) {
    const inferredName = `${cityDistrictMatch[1]} ${cityDistrictMatch[2]}`;
    return {
      regionLevel: "LOCAL",
      regionCode: "KR-LOCAL",
      regionName: inferredName,
    };
  }

  // 3) 광역 시·도 명칭 탐지
  const regionPreset = DEFAULT_REGION_PRESETS.find(
    (p) => p.level === "REGION" && p.aliases.some((alias) => combinedText.includes(alias))
  );
  if (regionPreset) {
    return {
      regionLevel: "REGION",
      regionCode: regionPreset.code,
      regionName: regionPreset.name,
    };
  }

  // 4) 동·읍·면 시범 거점 명칭이 제목에 명시된 경우에만 DONG 매핑
  const dongPreset = DEFAULT_REGION_PRESETS.find(
    (p) => p.level === "DONG" && p.aliases.some((alias) => (input.title ?? "").includes(alias))
  );
  if (dongPreset) {
    return {
      regionLevel: "DONG",
      regionCode: dongPreset.code,
      regionName: dongPreset.name,
    };
  }

  return {
    regionLevel: "NATION",
    regionCode: "KR",
    regionName: "대한민국",
  };
}
