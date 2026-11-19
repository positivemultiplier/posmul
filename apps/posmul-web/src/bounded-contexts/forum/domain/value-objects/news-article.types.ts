/**
 * PosMul AI 언론사(뉴스룸) 도메인 타입 및 광주 5개구 실험실 지역 매핑 유틸리티
 */
import { resolveNormalizedRegion } from "@/shared/domain/region/region-hierarchy";

export type NewsSectionCategory = "gwangju" | "ai" | "economy" | "sports";

export interface NewsCategoryMeta {
  key: NewsSectionCategory;
  label: string;
  shortLabel: string;
  description: string;
  gradient: string;
  badgeClass: string;
}

export const NEWS_CATEGORIES: ReadonlyArray<NewsCategoryMeta> = [
  {
    key: "gwangju",
    label: "📍 전남·광주",
    shortLabel: "전남·광주",
    description: "광주 5개구(동·서·남·북·광산) 생활밀착 로컬 브리핑",
    gradient: "from-emerald-500 to-teal-500",
    badgeClass: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  },
  {
    key: "ai",
    label: "🤖 AI·테크",
    shortLabel: "AI",
    description: "글로벌 AI 연구·모델 업데이트와 실전 활용 해설",
    gradient: "from-violet-500 to-indigo-500",
    badgeClass: "bg-violet-500/15 text-violet-300 border-violet-500/30",
  },
  {
    key: "economy",
    label: "📈 경제·정책",
    shortLabel: "경제",
    description: "거시지표·부동산·세제·중소벤처 핵심 정책 브리핑",
    gradient: "from-blue-500 to-cyan-500",
    badgeClass: "bg-blue-500/15 text-blue-300 border-blue-500/30",
  },
  {
    key: "sports",
    label: "⚽ 스포츠",
    shortLabel: "스포츠",
    description: "KIA 타이거즈·광주FC 및 국내외 스포츠 분석·예측",
    gradient: "from-amber-500 to-orange-500",
    badgeClass: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  },
];

export interface GwangjuRegionFilterOption {
  code: string;
  label: string;
  neighborhoodHint: string;
}

export const GWANGJU_REGION_FILTERS: ReadonlyArray<GwangjuRegionFilterOption> = [
  { code: "ALL_GWANGJU", label: "광주·전남 전체", neighborhoodHint: "광역·5개구 통합" },
  { code: "29110", label: "동구", neighborhoodHint: "충장·금남·ACC·학동" },
  { code: "29140", label: "서구", neighborhoodHint: "상무·풍암·화정·월드컵" },
  { code: "29155", label: "남구", neighborhoodHint: "봉선·양림·진월·효천" },
  { code: "29170", label: "북구", neighborhoodHint: "전남대·용봉·일곡·임동" },
  { code: "29200", label: "광산구", neighborhoodHint: "첨단·수완·송정·하남" },
  { code: "46000", label: "전남", neighborhoodHint: "나주·목포·여수·순천" },
];

export interface NewsQuizItem {
  id: number;
  question: string;
  options: string[];
  answerIndex: number;
  explanation: string;
}

export interface PublicNewsQuizItem {
  id: number;
  question: string;
  options: string[];
}

export interface NewsArticleMetadata {
  version: number;
  newsCategory: NewsSectionCategory;
  regionCode: string;
  regionName: string;
  sourceName: string;
  sourceUrl: string;
  feedItemId?: string;
  threeLineSummary: string[];
  readTimeMinutes: number;
  pmpReward: number;
  quiz: NewsQuizItem[];
  predictionHook?: string;
  aiModel: string;
  factCheckNote: string;
  isAiDesk: true;
}

export interface NewsArticleListItem {
  id: string;
  title: string;
  summary: string;
  category: NewsSectionCategory;
  categoryLabel: string;
  regionCode: string;
  regionName: string;
  sourceName: string;
  sourceUrl: string;
  publishedAt: string;
  readTimeMinutes: number;
  viewCount: number;
  commentCount: number;
  likeCount: number;
  pmpReward: number;
  hasQuiz: boolean;
  quizCount: number;
  threeLineSummary: string[];
  isNew: boolean;
  isAiDesk: boolean;
}

export interface NewsArticleDetail extends NewsArticleListItem {
  content: string;
  aiModel: string;
  factCheckNote: string;
  predictionHook?: string;
  quiz: PublicNewsQuizItem[];
  quizCompleted: boolean;
  quizAwardedPmp: number;
  solvedQuizDetails?: NewsQuizItem[];
  relatedArticles: Array<{
    id: string;
    title: string;
    category: NewsSectionCategory;
    regionName: string;
  }>;
  linkedGames: Array<{
    gameId: string;
    title: string;
    status: string;
  }>;
}

/**
 * 레거시 카테고리 쿼리(?category=policy, society, local 등)와 신규 4대 섹션을 정규화합니다.
 */
export function normalizeNewsCategoryFilter(raw?: string | null): NewsSectionCategory | "all" {
  const val = (raw || "").trim().toLowerCase();
  if (!val || val === "all") return "all";
  if (val === "gwangju" || val === "local") return "gwangju";
  if (val === "ai" || val === "tech") return "ai";
  if (val === "economy" || val === "policy" || val === "finance") return "economy";
  if (val === "sports") return "sports";
  if (val === "society") return "gwangju";
  return "all";
}

export function getNewsCategoryMeta(cat: NewsSectionCategory): NewsCategoryMeta {
  return NEWS_CATEGORIES.find((c) => c.key === cat) ?? NEWS_CATEGORIES[0];
}

const DISTRICT_KEYWORDS: ReadonlyArray<{
  code: string;
  name: string;
  patterns: RegExp[];
}> = [
  {
    code: "29110",
    name: "광주광역시 동구",
    patterns: [/광주\s*(?:광역시\s*)?동구/, /동구청/, /충장로/, /금남로/, /아시아문화전당|ACC/, /지산동|학동|산수동|계림동|조선대/],
  },
  {
    code: "29140",
    name: "광주광역시 서구",
    patterns: [/광주\s*(?:광역시\s*)?서구/, /서구청/, /상무지구/, /치평동|화정동|풍암동|금호동|농성동|쌍촌동|광천동|양동시장/, /광주\s*월드컵경기장|광주FC/],
  },
  {
    code: "29155",
    name: "광주광역시 남구",
    patterns: [/광주\s*(?:광역시\s*)?남구/, /남구청/, /봉선동|양림동|진월동|백운동|주월동|효천지구|노대동|송하동|대촌동/],
  },
  {
    code: "29170",
    name: "광주광역시 북구",
    patterns: [/광주\s*(?:광역시\s*)?북구/, /북구청/, /용봉동|전남대|일곡동|매곡동|문흥동|운암동|두암동|각화동|첨단2지구/, /챔피언스필드|기아\s*타이거즈|KIA\s*타이거즈/],
  },
  {
    code: "29200",
    name: "광주광역시 광산구",
    patterns: [/광산구/, /광산구청/, /수완지구|수완동/, /첨단지구|첨단\d?동/, /광주송정역|송정동|하남산단|월곡동|신창동|신가동|운남동|평동|우산동/],
  },
];

/**
 * 기사 제목·본문·출처명에서 광주 5개구 또는 광역 지역 코드를 정밀 추론합니다.
 */
export function detectNewsRegionFromText(
  text: string,
  hintDistrict?: string | null
): { regionCode: string; regionName: string } {
  const combined = `${hintDistrict || ""} ${text}`;

  for (const district of DISTRICT_KEYWORDS) {
    if (district.patterns.some((re) => re.test(combined))) {
      return { regionCode: district.code, regionName: district.name };
    }
  }

  if (/전남|전라남도|나주|목포|여수|순천|광양|담양|해남|무안/.test(combined)) {
    return { regionCode: "46000", regionName: "전라남도" };
  }

  const normalized = resolveNormalizedRegion({ title: combined });
  if (normalized.regionCode !== "KR") {
    return { regionCode: normalized.regionCode, regionName: normalized.regionName };
  }

  if (/광주광역시|광주시/.test(combined)) {
    return { regionCode: "29000", regionName: "광주광역시" };
  }

  return { regionCode: "KR", regionName: "대한민국" };
}

export function getShortRegionLabel(regionCode: string, regionName?: string): string {
  const preset = GWANGJU_REGION_FILTERS.find((r) => r.code === regionCode);
  if (preset && preset.code !== "ALL_GWANGJU") return `광주 ${preset.label}`.replace("광주 전남", "전남");
  if (regionCode === "29000") return "광주광역시";
  if (regionCode === "46000") return "전라남도";
  if (regionCode === "KR") return "전국";
  return regionName || "전국";
}
