import { NextRequest, NextResponse } from "next/server";

export interface LookedUpBook {
  isbn: string;
  title: string;
  author: string;
  publisher: string;
  pubDate: string;
  coverImageUrl: string;
  description: string;
  link: string;
  suggestedBadge: string;
}

function stripHtml(text: string): string {
  return (text || "")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

function makeSuggestedBadge(title: string, publisher: string): string {
  const cleanedPub = publisher.replace(/\(주\)|주식회사|출판사/g, "").trim();
  if (cleanedPub && cleanedPub.length <= 6) return cleanedPub;
  const cleanedTitle = title.replace(/^\d{4}\s*/, "").trim();
  return (cleanedTitle || title || "커스텀").slice(0, 6);
}

/** 국립중앙도서관 ISBN 서지정보 OpenAPI 조회 (인증키 설정 시 동작, BOOK_TB_CNT 목차 포함) */
async function lookupFromNationalLibrary(
  isbn: string
): Promise<{ book: LookedUpBook; tocText: string | null } | null> {
  const certKey = process.env.NL_SEOJI_CERT_KEY;
  if (!certKey || !isbn) return null;

  try {
    const url = `https://www.nl.go.kr/seoji/SearchApi.do?cert_key=${encodeURIComponent(
      certKey
    )}&result_style=json&page_no=1&page_size=1&isbn=${encodeURIComponent(isbn)}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      docs?: Array<Record<string, string>>;
    };
    const doc = data.docs?.[0];
    if (!doc || !doc.TITLE) return null;

    const title = stripHtml(doc.TITLE);
    const publisher = stripHtml(doc.PUBLISHER || "");
    const tocRaw = stripHtml(doc.BOOK_TB_CNT || "");

    return {
      book: {
        isbn: doc.EA_ISBN || isbn,
        title,
        author: stripHtml(doc.AUTHOR || ""),
        publisher,
        pubDate: doc.PUBLISH_PREDATE || doc.INPUT_DATE || "",
        coverImageUrl: doc.TITLE_URL || "",
        description: stripHtml(doc.BOOK_INTRODUCTION || ""),
        link: "",
        suggestedBadge: makeSuggestedBadge(title, publisher),
      },
      tocText: tocRaw.length > 0 ? tocRaw : null,
    };
  } catch {
    return null;
  }
}

/** 네이버 책 검색 API 조회 (ISBN 및 제목 검색 지원, 목차 미제공) */
async function lookupFromNaver(
  query: string,
  isIsbn: boolean
): Promise<LookedUpBook[] | null> {
  const clientId = process.env.NAVER_CLIENT_ID;
  const clientSecret = process.env.NAVER_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;

  try {
    const endpoint = isIsbn
      ? `https://openapi.naver.com/v1/search/book_adv.json?d_isbn=${encodeURIComponent(
          query
        )}&display=5`
      : `https://openapi.naver.com/v1/search/book.json?query=${encodeURIComponent(
          query
        )}&display=5`;

    const res = await fetch(endpoint, {
      headers: {
        "X-Naver-Client-Id": clientId,
        "X-Naver-Client-Secret": clientSecret,
      },
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) return null;

    const data = (await res.json()) as {
      items?: Array<{
        title: string;
        link: string;
        image: string;
        author: string;
        publisher: string;
        pubdate: string;
        isbn: string;
        description: string;
      }>;
    };

    const items = data.items || [];
    if (items.length === 0) return null;

    return items.map((item) => {
      const title = stripHtml(item.title);
      const publisher = stripHtml(item.publisher);
      const isbnTokens = (item.isbn || "").split(/\s+/).filter(Boolean);
      const bestIsbn =
        isbnTokens.find((t) => t.length === 13) || isbnTokens[0] || (isIsbn ? query : "");
      return {
        isbn: bestIsbn,
        title,
        author: stripHtml(item.author).replace(/\^/g, ", "),
        publisher,
        pubDate: item.pubdate || "",
        coverImageUrl: item.image || "",
        description: stripHtml(item.description),
        link: item.link || "",
        suggestedBadge: makeSuggestedBadge(title, publisher),
      };
    });
  } catch {
    return null;
  }
}

/** 카카오 책 검색 API 보조 조회 */
async function lookupFromKakao(
  query: string,
  isIsbn: boolean
): Promise<LookedUpBook[] | null> {
  const apiKey = process.env.KAKAO_REST_API_KEY;
  if (!apiKey) return null;

  try {
    const endpoint = `https://dapi.kakao.com/v3/search/book?query=${encodeURIComponent(
      query
    )}&size=5${isIsbn ? "&target=isbn" : ""}`;
    const res = await fetch(endpoint, {
      headers: { Authorization: `KakaoAK ${apiKey}` },
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) return null;

    const data = (await res.json()) as {
      documents?: Array<{
        title: string;
        contents: string;
        url: string;
        isbn: string;
        datetime: string;
        authors: string[];
        publisher: string;
        thumbnail: string;
      }>;
    };
    const docs = data.documents || [];
    if (docs.length === 0) return null;

    return docs.map((doc) => {
      const title = stripHtml(doc.title);
      const publisher = stripHtml(doc.publisher);
      const isbnTokens = (doc.isbn || "").split(/\s+/).filter(Boolean);
      const bestIsbn =
        isbnTokens.find((t) => t.length === 13) || isbnTokens[0] || (isIsbn ? query : "");
      return {
        isbn: bestIsbn,
        title,
        author: (doc.authors || []).join(", "),
        publisher,
        pubDate: doc.datetime ? doc.datetime.slice(0, 10) : "",
        coverImageUrl: doc.thumbnail || "",
        description: stripHtml(doc.contents),
        link: doc.url || "",
        suggestedBadge: makeSuggestedBadge(title, publisher),
      };
    });
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const rawInput = (searchParams.get("isbn") || searchParams.get("q") || "").trim();
  if (!rawInput) {
    return NextResponse.json(
      { found: false, error: "ISBN 또는 책 제목을 입력해 주세요." },
      { status: 400 }
    );
  }

  const cleanDigits = rawInput.replace(/[^0-9Xx]/g, "");
  const isIsbn = cleanDigits.length === 10 || cleanDigits.length === 13;
  const queryValue = isIsbn ? cleanDigits : rawInput;

  // 1순위: 국립중앙도서관 ISBN 서지정보 API (목차 BOOK_TB_CNT 포함 가능)
  let nlTocText: string | null = null;
  if (isIsbn) {
    const nlResult = await lookupFromNationalLibrary(cleanDigits);
    if (nlResult) {
      return NextResponse.json({
        found: true,
        source: "nl_seoji",
        book: nlResult.book,
        candidates: [nlResult.book],
        tocText: nlResult.tocText,
        tocNotice: nlResult.tocText
          ? "국립중앙도서관 서지정보에서 목차를 자동으로 불러왔습니다."
          : "국립중앙도서관 서지정보에 목차 데이터가 없어 아래에서 직접 입력하거나 목차 사진을 스캔해 주세요.",
      });
    }
  }

  // 2순위: 네이버 책 검색 API (표지·제목·저자·출판사)
  const naverResults = await lookupFromNaver(queryValue, isIsbn);
  if (naverResults && naverResults.length > 0) {
    return NextResponse.json({
      found: true,
      source: "naver",
      book: naverResults[0],
      candidates: naverResults,
      tocText: nlTocText,
      tocNotice:
        "도서 기본 정보(제목·저자·출판사·표지)를 불러왔습니다. 서점 API는 목차를 제공하지 않으므로 아래에 목차를 입력·붙여넣기하거나 목차 사진을 스캔해 주세요.",
    });
  }

  // 3순위: 카카오 책 검색 API fallback
  const kakaoResults = await lookupFromKakao(queryValue, isIsbn);
  if (kakaoResults && kakaoResults.length > 0) {
    return NextResponse.json({
      found: true,
      source: "kakao",
      book: kakaoResults[0],
      candidates: kakaoResults,
      tocText: null,
      tocNotice:
        "도서 기본 정보를 불러왔습니다. 목차는 아래에서 직접 입력·붙여넣기하거나 목차 사진을 스캔해 주세요.",
    });
  }

  return NextResponse.json({
    found: false,
    source: "none",
    candidates: [],
    tocText: null,
    tocNotice: "해당 ISBN/검색어에 맞는 도서를 찾지 못했습니다. 직접 책 정보를 입력해 주세요.",
  });
}
