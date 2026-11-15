import { failure, isFailure, Result, success } from "@posmul/auth-economy-sdk";

import { FeedItem } from "../../domain/entities/feed-item.entity";
import {
  IFeedItemRepository,
  IRssSourceRepository,
} from "../../domain/repositories/feed.repository";
import {
  ContentClassification,
  ProcessStatus,
} from "../../domain/value-objects/feed-types";

const DEFAULT_TIMEOUT_MS = 9000;
const MAX_ITEMS_PER_AGENCY = 5;
const MAX_SUMMARY_CHARS = 1800;
const STALE_CUTOFF_DAYS = 14;

const BROWSER_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

export type AgencyAdapterKind = "boardEs" | "boardListDo" | "eminwon";

export interface PublicPressAgencyConfig {
  key: string;
  title: string;
  regionName: string;
  kind: AgencyAdapterKind;
  sourceUrl: string;
  listUrl: string;
  baseUrl: string;
  requiredLinkToken?: string;
  portalViewUrl?: string;
  detailMarkers: string[];
}

export interface PublicPressArticleDraft {
  title: string;
  link: string;
  publishedAt: Date;
  rawSummary: string;
}

export interface PublicPressCollectSummary {
  totalCollected: number;
  agenciesChecked: number;
  agencyCounts: Record<string, number>;
  errors: string[];
}

export const PUBLIC_PRESS_AGENCIES: readonly PublicPressAgencyConfig[] = [
  {
    key: "jeonnam-gwangju-city",
    title: "전남광주통합특별시청 - 보도자료",
    regionName: "전남·광주",
    kind: "boardListDo",
    sourceUrl:
      "https://www.jeonnam-gwangju.go.kr/boardList.do?boardId=JG_0000000003&pageId=jngj22",
    listUrl:
      "https://www.jeonnam-gwangju.go.kr/boardList.do?boardId=JG_0000000003&pageId=jngj22",
    baseUrl: "https://www.jeonnam-gwangju.go.kr",
    requiredLinkToken: "boardId=JG_0000000003",
    detailMarkers: ["b_cont_description", "d_cont_description", "boardContents", "board_view_body"],
  },
  {
    key: "gwangju-donggu",
    title: "광주 동구청 - 보도자료",
    regionName: "동구",
    kind: "boardEs",
    sourceUrl: "https://www.donggu.kr/board.es?mid=a10102040100&bid=0243",
    listUrl: "https://www.donggu.kr/board.es?mid=a10102040100&bid=0243",
    baseUrl: "https://www.donggu.kr",
    requiredLinkToken: "bid=0243",
    detailMarkers: ["view_cont", "board_view_cont", "board_view", "view_txt"],
  },
  {
    key: "gwangju-seogu",
    title: "광주 서구청 - 보도자료",
    regionName: "서구",
    kind: "boardEs",
    sourceUrl: "https://www.seogu.gwangju.kr/board.es?mid=c50501000000&bid=0154",
    listUrl: "https://www.seogu.gwangju.kr/board.es?mid=c50501000000&bid=0154",
    baseUrl: "https://www.seogu.gwangju.kr",
    requiredLinkToken: "bid=0154",
    detailMarkers: ["view_cont", "board_view_cont", "board_view", "view_txt"],
  },
  {
    key: "gwangju-namgu",
    title: "광주 남구청 - 구정소식·보도",
    regionName: "남구",
    kind: "boardEs",
    sourceUrl: "https://www.namgu.gwangju.kr/board.es?mid=a10604010000&bid=0001",
    listUrl: "https://www.namgu.gwangju.kr/board.es?mid=a10604010000&bid=0001",
    baseUrl: "https://www.namgu.gwangju.kr",
    requiredLinkToken: "bid=0001",
    detailMarkers: ["view_cont", "board_view_cont", "board_view", "view_txt"],
  },
  {
    key: "gwangju-bukgu",
    title: "광주 북구청 - 보도자료",
    regionName: "북구",
    kind: "eminwon",
    sourceUrl:
      "https://eminwon.bukgu.gwangju.kr/emwp/gov/mogaha/ntis/web/ofr/action/OfrAction.do",
    listUrl:
      "https://eminwon.bukgu.gwangju.kr/emwp/gov/mogaha/ntis/web/ofr/action/OfrAction.do",
    baseUrl: "https://eminwon.bukgu.gwangju.kr",
    portalViewUrl: "https://bukgu.gwangju.kr/menu.es?mid=a10201020000",
    detailMarkers: ["tstyle_view", "board_view", "view_cont"],
  },
  {
    key: "gwangju-gwangsan",
    title: "광주 광산구청 - 보도자료",
    regionName: "광산구",
    kind: "boardListDo",
    sourceUrl: "https://www.gwangsan.go.kr/boardList.do?boardId=REPORT_NEW&pageId=www16",
    listUrl: "https://www.gwangsan.go.kr/boardList.do?boardId=REPORT_NEW&pageId=www16",
    baseUrl: "https://www.gwangsan.go.kr",
    requiredLinkToken: "boardId=REPORT_NEW",
    detailMarkers: ["d_cont_description", "boardContents", "cont_inner"],
  },
] as const;

const PUBLIC_PRESS_URL_SET = new Set(PUBLIC_PRESS_AGENCIES.map((a) => a.sourceUrl));

/**
 * 지자체 HTML/폼 직접 수집 대상 URL인지 판별 (RSS XML 파서에서 제외하기 위해 사용)
 */
export function isPublicPressSourceUrl(url: string): boolean {
  return PUBLIC_PRESS_URL_SET.has(url.trim());
}

function decodeHtmlEntities(raw: string): string {
  return raw
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;|&lsquo;|&rsquo;/gi, "'")
    .replace(/&ldquo;|&rdquo;/gi, '"')
    .replace(/&middot;/gi, "·")
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(Number(dec)));
}

function stripHtmlTags(raw: string): string {
  return decodeHtmlEntities(
    raw
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<!--[\s\S]*?-->/g, " ")
      .replace(/<br\s*\/?>/gi, " ")
      .replace(/<\/(p|div|li|tr|h[1-6])>/gi, " ")
      .replace(/<[^>]+>/g, " ")
  )
    .replace(/\s+/g, " ")
    .trim();
}

function stripCommonPortalNoise(text: string): string {
  const cutMarkers = [
    "본 공공저작물은 공공누리",
    "1유형 : 출처표시",
    "제1유형 : 출처표시",
    "콘텐츠 만족도 조사",
    "현재 페이지에서 제공되는 서비스에 대하여 만족",
    "민원인 정보 등 개인정보와 민원내용은",
    "다음글이 존재하지 않습니다",
    "이전글 다음글",
    "목록보기",
  ];

  let cleaned = text;
  for (const marker of cutMarkers) {
    const idx = cleaned.indexOf(marker);
    if (idx > 120) {
      cleaned = cleaned.slice(0, idx);
    }
  }
  return cleaned.trim().slice(0, MAX_SUMMARY_CHARS);
}

/**
 * 클래스/ID 마커가 붙은 HTML 요소의 균형 잡힌 내부 HTML 블록을 추출
 */
function extractElementHtmlByMarker(html: string, marker: string): string | null {
  const escaped = marker.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const openRegex = new RegExp(
    `<(div|section|article|td)\\b[^>]*(?:class|id)=["'][^"']*${escaped}[^"']*["'][^>]*>`,
    "i"
  );
  const match = openRegex.exec(html);
  if (!match) return null;

  const tagName = match[1].toLowerCase();
  const startIdx = match.index + match[0].length;
  const tagScan = new RegExp(`<(\\/)?${tagName}\\b[^>]*>`, "gi");
  tagScan.lastIndex = startIdx;

  let depth = 1;
  let endIdx = html.length;
  let token: RegExpExecArray | null;
  while ((token = tagScan.exec(html)) !== null) {
    if (token[1] === "/") {
      depth--;
      if (depth === 0) {
        endIdx = token.index;
        break;
      }
    } else if (!token[0].endsWith("/>")) {
      depth++;
    }
  }

  return html.slice(startIdx, endIdx);
}

function extractDateFromText(text: string): Date | null {
  const match = text.match(/(20\d{2})[-./](\d{1,2})[-./](\d{1,2})/);
  if (!match) return null;
  const year = Number(match[1]);
  const month = String(Number(match[2])).padStart(2, "0");
  const day = String(Number(match[3])).padStart(2, "0");
  const parsed = new Date(`${year}-${month}-${day}T09:00:00+09:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function resolveAbsoluteUrl(baseUrl: string, rawHref: string): string {
  const decoded = decodeHtmlEntities(rawHref).trim();
  if (decoded.startsWith("http://") || decoded.startsWith("https://")) {
    return decoded;
  }
  if (decoded.startsWith("/")) {
    return `${baseUrl}${decoded}`;
  }
  return `${baseUrl}/${decoded}`;
}

async function fetchTextWithTimeout(
  url: string,
  init?: RequestInit & { timeoutMs?: number }
): Promise<string> {
  const controller = new AbortController();
  const timeoutMs = init?.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      ...init,
      signal: controller.signal,
      headers: {
        "User-Agent": BROWSER_USER_AGENT,
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        ...(init?.headers || {}),
      },
      cache: "no-store",
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} (${url})`);
    }
    return await response.text();
  } finally {
    clearTimeout(timer);
  }
}

/**
 * HTML 상세 페이지에서 보도자료/정책 본문과 발행일을 추출 (RSS 본문 보강에서도 공용 사용)
 */
export function extractReadablePressDetail(
  html: string,
  markers: readonly string[] = [
    "board_view_body",
    "bbs_view_contnet",
    "d_cont_description",
    "boardContents",
    "view_cont",
    "board_view",
    "bbs_view",
    "article_body",
  ]
): { bodyText: string; publishedAt: Date | null } {
  let extractedText = "";
  for (const marker of markers) {
    const fragment = extractElementHtmlByMarker(html, marker);
    if (!fragment) continue;
    const candidate = stripCommonPortalNoise(stripHtmlTags(fragment));
    if (candidate.length >= 80) {
      extractedText = candidate;
      break;
    }
  }

  if (!extractedText) {
    const cleanedBody = html
      .replace(/<header[\s\S]*?<\/header>/gi, " ")
      .replace(/<nav[\s\S]*?<\/nav>/gi, " ")
      .replace(/<footer[\s\S]*?<\/footer>/gi, " ");
    extractedText = stripCommonPortalNoise(stripHtmlTags(cleanedBody));
  }

  const dateWindow = stripHtmlTags(html.slice(0, 25000));
  const publishedAt = extractDateFromText(dateWindow);

  return { bodyText: extractedText, publishedAt };
}

/**
 * 외부 상세 URL HTML에서 기사/보도자료 본문만 깔끔하게 추출 (실패 시 null 반환)
 */
export async function fetchCleanPressBodyByUrl(
  url: string,
  markers?: readonly string[]
): Promise<string | null> {
  try {
    const html = await fetchTextWithTimeout(url, { timeoutMs: 7000 });
    const { bodyText } = extractReadablePressDetail(html, markers);
    return bodyText.length >= 60 ? bodyText : null;
  } catch {
    return null;
  }
}

interface RawListCandidate {
  title: string;
  link: string;
  publishedAt: Date | null;
  eminwonId?: string;
}

function parseAnchorBoardList(
  html: string,
  agency: PublicPressAgencyConfig
): RawListCandidate[] {
  const normalizedHtml = decodeHtmlEntities(html);
  const linkPattern =
    agency.kind === "boardEs"
      ? /<a\b[^>]*href=["']([^"']*board\.es[^"']*act=view[^"']*)["'][^>]*>([\s\S]*?)<\/a>/gi
      : /<a\b[^>]*href=["']([^"']*boardView\.do[^"']*)["'][^>]*>([\s\S]*?)<\/a>/gi;

  const seenLinks = new Set<string>();
  const results: RawListCandidate[] = [];
  let match: RegExpExecArray | null;

  while ((match = linkPattern.exec(normalizedHtml)) !== null) {
    const rawHref = match[1];
    if (agency.requiredLinkToken && !rawHref.includes(agency.requiredLinkToken)) {
      continue;
    }

    const rawTitle = stripHtmlTags(match[2])
      .replace(/^새글\s*/i, "")
      .replace(/^공지\s*/i, "")
      .trim();

    if (rawTitle.length < 6) continue;
    if (/이달의\s*구보|보도자료\s*검색|바로가기/.test(rawTitle)) continue;

    const absLink = resolveAbsoluteUrl(agency.baseUrl, rawHref);
    if (seenLinks.has(absLink)) continue;
    seenLinks.add(absLink);

    const rowContextStart = Math.max(0, match.index - 200);
    const rowContextEnd = Math.min(normalizedHtml.length, match.index + 900);
    const rowText = stripHtmlTags(normalizedHtml.slice(rowContextStart, rowContextEnd));
    const publishedAt = extractDateFromText(rowText);

    results.push({
      title: rawTitle,
      link: absLink,
      publishedAt,
    });
  }

  return results;
}

async function fetchEminwonCandidates(
  agency: PublicPressAgencyConfig
): Promise<RawListCandidate[]> {
  const formBody = new URLSearchParams({
    pageIndex: "1",
    jndinm: "OfrBcAdvNewsEJB",
    context: "NTIS",
    method: "selectListOfrNews",
    methodnm: "selectListOfrNewsHomepage",
    subCheck: "Y",
    ofr_pageSize: "10",
    news_epct_yn: "1",
    data_open_yn: "1",
    countYn: "Y",
  });

  const listHtml = await fetchTextWithTimeout(agency.listUrl, {
    method: "POST",
    body: formBody.toString(),
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Referer: `${agency.baseUrl}/emwp/jsp/ofr/OfrNewsEpctLSub.jsp`,
    },
  });

  const itemRegex = /searchDetail\(['"]([^'"]+)['"]\)[^>]*>([\s\S]*?)<\/a>/gi;
  const seenIds = new Set<string>();
  const results: RawListCandidate[] = [];
  let match: RegExpExecArray | null;

  while ((match = itemRegex.exec(listHtml)) !== null) {
    const epctId = match[1].trim();
    if (!epctId || seenIds.has(epctId)) continue;
    seenIds.add(epctId);

    const rawTitle = stripHtmlTags(match[2]).trim();
    if (rawTitle.length < 6) continue;

    const rowSlice = listHtml.slice(
      match.index,
      Math.min(listHtml.length, match.index + 600)
    );
    const publishedAt = extractDateFromText(stripHtmlTags(rowSlice));
    const portalBase = agency.portalViewUrl || agency.listUrl;

    results.push({
      title: rawTitle,
      link: `${portalBase}#news_epct_no=${epctId}`,
      publishedAt,
      eminwonId: epctId,
    });
  }

  return results;
}

async function fetchEminwonDetail(
  agency: PublicPressAgencyConfig,
  epctId: string
): Promise<{ bodyText: string; publishedAt: Date | null }> {
  const formBody = new URLSearchParams({
    news_epct_no: epctId,
    jndinm: "OfrBcAdvNewsEJB",
    context: "NTIS",
    method: "selectOfrNews",
    methodnm: "selectOfrNewsMgt",
    subCheck: "Y",
    ofr_pageSize: "10",
    news_epct_yn: "1",
    data_open_yn: "1",
  });

  const detailHtml = await fetchTextWithTimeout(agency.listUrl, {
    method: "POST",
    body: formBody.toString(),
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Referer: agency.listUrl,
    },
  });

  const fullText = stripHtmlTags(detailHtml)
    .replace(/^보도\s*및\s*대응자료\s*상세\s*/i, "")
    .trim();
  const publishedAt = extractDateFromText(fullText);

  const metaCut = fullText.match(/등록일자\s*:\s*20\d{2}[-./]\d{1,2}[-./]\d{1,2}\s*/);
  const afterMeta = metaCut && metaCut.index !== undefined
    ? fullText.slice(metaCut.index + metaCut[0].length)
    : fullText;

  return {
    bodyText: stripCommonPortalNoise(afterMeta),
    publishedAt,
  };
}

/**
 * 광주·전남 7대 공공기관 보도자료 직접 수집기 (트랙 B)
 */
export class PublicPressCollector {
  constructor(
    private readonly rssSourceRepository: IRssSourceRepository,
    private readonly feedItemRepository: IFeedItemRepository
  ) {}

  async collect(options?: {
    agencyKey?: string;
    maxItemsPerAgency?: number;
  }): Promise<Result<PublicPressCollectSummary>> {
    try {
      const sourcesRes = await this.rssSourceRepository.findAllActive();
      if (isFailure(sourcesRes)) {
        return failure(new Error(sourcesRes.error.message));
      }

      const activeSourceIdByUrl = new Map<string, string>();
      for (const src of sourcesRes.data) {
        activeSourceIdByUrl.set(src.url.trim(), src.id.toString());
      }

      const hasAnyRegisteredPublicSource = PUBLIC_PRESS_AGENCIES.some((a) =>
        activeSourceIdByUrl.has(a.sourceUrl)
      );

      const targetAgencies = PUBLIC_PRESS_AGENCIES.filter((agency) => {
        if (options?.agencyKey && agency.key !== options.agencyKey) {
          return false;
        }
        return !hasAnyRegisteredPublicSource || activeSourceIdByUrl.has(agency.sourceUrl);
      });

      const perAgencyLimit = options?.maxItemsPerAgency ?? MAX_ITEMS_PER_AGENCY;
      const staleCutoffMs = Date.now() - STALE_CUTOFF_DAYS * 24 * 60 * 60 * 1000;

      const agencyResults = await Promise.allSettled(
        targetAgencies.map((agency) =>
          this.collectSingleAgency(
            agency,
            activeSourceIdByUrl.get(agency.sourceUrl) ?? null,
            perAgencyLimit,
            staleCutoffMs
          )
        )
      );

      const agencyCounts: Record<string, number> = {};
      const errors: string[] = [];
      let totalCollected = 0;

      agencyResults.forEach((result, idx) => {
        const agency = targetAgencies[idx];
        if (result.status === "fulfilled") {
          agencyCounts[agency.key] = result.value;
          totalCollected += result.value;
        } else {
          const reason =
            result.reason instanceof Error
              ? result.reason.message
              : String(result.reason);
          agencyCounts[agency.key] = 0;
          errors.push(`${agency.title}: ${reason}`);
          console.error(`[PublicPressCollector] ${agency.key} failed:`, reason);
        }
      });

      return success({
        totalCollected,
        agenciesChecked: targetAgencies.length,
        agencyCounts,
        errors,
      });
    } catch (error) {
      return failure(
        error instanceof Error ? error : new Error("PublicPressCollector unexpected error")
      );
    }
  }

  private async collectSingleAgency(
    agency: PublicPressAgencyConfig,
    sourceId: string | null,
    limit: number,
    staleCutoffMs: number
  ): Promise<number> {
    let candidates: RawListCandidate[] = [];

    if (agency.kind === "eminwon") {
      candidates = await fetchEminwonCandidates(agency);
    } else {
      const listHtml = await fetchTextWithTimeout(agency.listUrl);
      candidates = parseAnchorBoardList(listHtml, agency);
    }

    const recentCandidates = candidates
      .filter((c) => !c.publishedAt || c.publishedAt.getTime() >= staleCutoffMs)
      .slice(0, limit * 2);

    if (recentCandidates.length === 0) return 0;

    let existingLinks = new Set<string>();
    if (this.feedItemRepository.findExistingLinks) {
      const existingRes = await this.feedItemRepository.findExistingLinks(
        recentCandidates.map((c) => c.link)
      );
      if (existingRes.success) {
        existingLinks = existingRes.data;
      }
    }

    let savedCount = 0;
    for (const candidate of recentCandidates) {
      if (savedCount >= limit) break;
      if (existingLinks.has(candidate.link)) continue;
      existingLinks.add(candidate.link);

      let bodyText = "";
      let detailDate: Date | null = null;

      try {
        if (agency.kind === "eminwon" && candidate.eminwonId) {
          const detail = await fetchEminwonDetail(agency, candidate.eminwonId);
          bodyText = detail.bodyText;
          detailDate = detail.publishedAt;
        } else {
          const detailHtml = await fetchTextWithTimeout(candidate.link);
          const parsed = extractReadablePressDetail(detailHtml, agency.detailMarkers);
          bodyText = parsed.bodyText;
          detailDate = parsed.publishedAt;
        }
      } catch (detailErr) {
        console.warn(
          `[PublicPressCollector] Detail fetch skipped for ${candidate.link}:`,
          detailErr instanceof Error ? detailErr.message : String(detailErr)
        );
      }

      const finalDate = candidate.publishedAt ?? detailDate ?? new Date();
      if (finalDate.getTime() < staleCutoffMs) continue;

      const enrichedSummary =
        bodyText.length > 0
          ? `[${agency.regionName} 공식 보도자료] ${bodyText}`
          : `[${agency.regionName} 공식 보도자료] ${candidate.title}`;

      const item = FeedItem.create({
        sourceId,
        title: candidate.title,
        link: candidate.link,
        contentSummary: enrichedSummary.slice(0, MAX_SUMMARY_CHARS),
        publishedAt: finalDate,
        aiClassification: ContentClassification.UNCLASSIFIED,
        processStatus: ProcessStatus.PENDING,
      });

      const saveRes = await this.feedItemRepository.save(item);
      if (saveRes.success) {
        savedCount++;
      }
    }

    return savedCount;
  }
}
