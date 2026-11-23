import { unstable_cache } from "next/cache";

export interface RelatedNewsItem {
  readonly title: string;
  readonly description: string;
  readonly url: string;
  readonly publisher: string;
  readonly pubDateIso: string;
}

interface NaverNewsApiItem {
  title?: string;
  originallink?: string;
  link?: string;
  description?: string;
  pubDate?: string;
}

interface NaverNewsApiResponse {
  items?: NaverNewsApiItem[];
}

const PUBLISHER_DOMAIN_MAP: ReadonlyArray<readonly [string, string]> = [
  ["yna.co.kr", "연합뉴스"],
  ["yonhapnewstv", "연합뉴스TV"],
  ["newsis.com", "뉴시스"],
  ["news1.kr", "뉴스1"],
  ["hankyung.com", "한국경제"],
  ["mk.co.kr", "매일경제"],
  ["sedaily.com", "서울경제"],
  ["edaily.co.kr", "이데일리"],
  ["mt.co.kr", "머니투데이"],
  ["moneytoday.co.kr", "머니투데이"],
  ["fnnews.com", "파이낸셜뉴스"],
  ["heraldcorp.com", "헤럴드경제"],
  ["asiae.co.kr", "아시아경제"],
  ["chosun.com", "조선일보"],
  ["joongang.co.kr", "중앙일보"],
  ["donga.com", "동아일보"],
  ["hani.co.kr", "한겨레"],
  ["khan.co.kr", "경향신문"],
  ["kmib.co.kr", "국민일보"],
  ["seoul.co.kr", "서울신문"],
  ["segye.com", "세계일보"],
  ["munhwa.com", "문화일보"],
  ["hankookilbo.com", "한국일보"],
  ["kbs.co.kr", "KBS"],
  ["sbs.co.kr", "SBS"],
  ["imbc.com", "MBC"],
  ["ytn.co.kr", "YTN"],
  ["jtbc.co.kr", "JTBC"],
  ["sportsseoul.com", "스포츠서울"],
  ["sportalkorea.com", "스포탈코리아"],
  ["spotvnews.co.kr", "스포티비뉴스"],
  ["interfootball.co.kr", "인터풋볼"],
  ["osen.co.kr", "OSEN"],
  ["kwangju.co.kr", "광주일보"],
  ["jnilbo.com", "전남일보"],
  ["kjdaily.com", "광주매일신문"],
  ["namdonews.com", "남도일보"],
  ["mdilbo.com", "무등일보"],
];

const QUERY_STOPWORDS = new Set([
  "이번",
  "오늘",
  "내일",
  "주말",
  "분기",
  "올해",
  "내년",
  "연내",
  "최종",
  "과연",
  "우리",
  "동네",
  "주요",
  "전체",
  "대비",
  "전일",
  "이상",
  "이하",
  "초과",
  "미만",
  "중",
  "및",
  "등",
  "수",
  "여부",
  "결과",
  "결정",
  "달성",
  "돌파",
  "상회",
  "하회",
  "마감",
  "상승",
  "하락",
  "연장",
  "계약",
  "기준",
]);

/**
 * 네이버 API HTML 태그 및 엔티티 정제
 */
export function cleanNaverHtmlText(raw: string): string {
  return raw
    .replace(/<\/?b>/gi, "")
    .replace(/<[^>]+>/g, "")
    .replace(/&quot;/g, '"')
    .replace(/&apos;|&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * 기사 URL에서 언론사 표시명 추출
 */
export function resolveKoreanPublisherName(url: string): string {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "").toLowerCase();
    for (const [domain, label] of PUBLISHER_DOMAIN_MAP) {
      if (host.includes(domain)) return label;
    }
    const parts = host.split(".");
    return parts.length >= 2 ? parts[parts.length - 2].toUpperCase() : host;
  } catch {
    return "언론 보도";
  }
}

/**
 * 예측 게임 제목에서 네이버 뉴스 검색용 핵심 키워드 2~4개 추출
 * (대괄호 태그·의문형 어미·수치/기호·상투어 제거)
 */
export function buildNaverNewsQuery(title: string): string {
  const withoutTags = title
    .replace(/^[^\p{L}\p{N}[]+/u, "")
    .replace(/\[[^\]]+\]/g, " ")
    .replace(/\([^)]*\)/g, " ")
    .replace(/[?!~·•:,./'"“”‘’%$℃₩()]/g, " ")
    .replace(/\b\d+(?:\.\d+)?(?:조|억|만|천|원|달러|위|개|년|월|일|시|분|배|호|구)?\b/g, " ");

  const tokens = withoutTags
    .split(/\s+/)
    .map((t) =>
      t
        .replace(/(할까|일까|될까|인가|인지|에서|으로|에도|은|는|이|가|을|를|의|와|과|도|만|까지)$/u, "")
        .trim()
    )
    .filter((t) => t.length >= 2 && !QUERY_STOPWORDS.has(t));

  const unique: string[] = [];
  for (const tok of tokens) {
    if (!unique.includes(tok)) {
      unique.push(tok);
    }
    if (unique.length >= 4) break;
  }

  return unique.join(" ").trim();
}

const DAY_MS = 24 * 60 * 60 * 1000;

function parseRecentNewsItem(
  item: NaverNewsApiItem,
  nowMs: number
): (RelatedNewsItem & { ageMs: number; dedupeKey: string }) | null {
  const title = cleanNaverHtmlText(item.title ?? "");
  const description = cleanNaverHtmlText(item.description ?? "");
  const url = (item.originallink || item.link || "").trim();
  if (!title || !url || !/^https?:\/\//i.test(url)) return null;

  const pubTime = item.pubDate ? Date.parse(item.pubDate) : NaN;
  if (!Number.isFinite(pubTime)) return null;

  const ageMs = nowMs - pubTime;
  if (ageMs < -DAY_MS || ageMs > 90 * DAY_MS) return null;

  const dedupeKey = title.replace(/[^0-9a-zA-Z가-힣]/g, "").slice(0, 12);
  return {
    title,
    description,
    url,
    publisher: resolveKoreanPublisherName(url),
    pubDateIso: new Date(pubTime).toISOString(),
    ageMs,
    dedupeKey,
  };
}

/**
 * 구기사(예: 수년 전 기사) 차단 + 중복 제목 제거
 * - 1순위: 최근 30일 이내 기사
 * - 2순위: 30일 이내 기사가 2건 미만이면 최근 90일 이내까지 허용
 * - 90일 초과 구기사는 전면 차단 (오래된 노이즈 기사 방지)
 */
export function filterAndDedupeRecentNews(
  rawItems: ReadonlyArray<NaverNewsApiItem>,
  nowMs: number = Date.now(),
  maxCount = 5
): RelatedNewsItem[] {
  const parsed = rawItems
    .map((item) => parseRecentNewsItem(item, nowMs))
    .filter((v): v is NonNullable<typeof v> => v !== null)
    .sort((a, b) => a.ageMs - b.ageMs);

  const within30d = parsed.filter((p) => p.ageMs <= 30 * DAY_MS);
  const candidates = within30d.length >= 2 ? within30d : parsed;

  const seen = new Set<string>();
  const results: RelatedNewsItem[] = [];
  for (const item of candidates) {
    if (seen.has(item.dedupeKey)) continue;
    seen.add(item.dedupeKey);
    results.push({
      title: item.title,
      description: item.description,
      url: item.url,
      publisher: item.publisher,
      pubDateIso: item.pubDateIso,
    });
    if (results.length >= maxCount) break;
  }

  return results;
}

async function fetchNaverNewsRaw(
  query: string,
  timeoutMs = 2000
): Promise<RelatedNewsItem[]> {
  const clientId = (process.env.NAVER_CLIENT_ID || "").trim();
  const clientSecret = (process.env.NAVER_CLIENT_SECRET || "").trim();
  if (!clientId || !clientSecret || !query) {
    return [];
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const endpoint = `https://openapi.naver.com/v1/search/news.json?query=${encodeURIComponent(
      query
    )}&display=15&sort=date`;

    const res = await fetch(endpoint, {
      headers: {
        "X-Naver-Client-Id": clientId,
        "X-Naver-Client-Secret": clientSecret,
      },
      signal: controller.signal,
      cache: "no-store",
    });

    if (!res.ok) return [];
    const payload = (await res.json()) as NaverNewsApiResponse;
    return filterAndDedupeRecentNews(payload.items ?? [], Date.now(), 5);
  } catch {
    return [];
  } finally {
    clearTimeout(timer);
  }
}

/**
 * 예측 게임 관련 최신 네이버 뉴스 30분 서버 캐시 조회
 * - 캐시 히트 시 0ms, 미스 시 최대 2초 타임아웃으로 상세페이지 속도 무영향
 */
export const getCachedRelatedNaverNews = unstable_cache(
  async (gameTitle: string): Promise<RelatedNewsItem[]> => {
    const query = buildNaverNewsQuery(gameTitle);
    if (!query) return [];
    return fetchNaverNewsRaw(query, 2000);
  },
  ["posmul-naver-related-news-v1"],
  { revalidate: 1800, tags: ["prediction-related-news"] }
);
