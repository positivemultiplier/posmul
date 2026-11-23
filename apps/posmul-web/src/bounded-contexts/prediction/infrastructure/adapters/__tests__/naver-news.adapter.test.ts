import {
  buildNaverNewsQuery,
  cleanNaverHtmlText,
  filterAndDedupeRecentNews,
  resolveKoreanPublisherName,
} from "../naver-news.adapter";

describe("naver-news.adapter", () => {
  it("게임 제목에서 태그·수치·상투어를 제거하고 핵심 검색 키워드만 추출한다", () => {
    expect(
      buildNaverNewsQuery("[실적공시] SK하이닉스 이번 분기 연결 영업이익 5조 원 돌파할까?")
    ).toBe("SK하이닉스 연결 영업이익");

    expect(
      buildNaverNewsQuery(
        "[SPORTS] 로베르트 모레노 임시 감독은 계약 연장되어 2027년에도 한국 축구대표팀 지휘봉을 잡을까?"
      )
    ).toContain("로베르트");
  });

  it("네이버 API HTML 태그와 엔티티를 깔끔히 정제한다", () => {
    expect(
      cleanNaverHtmlText("<b>SK하이닉스</b> &quot;HBM&quot; &amp; &apos;영업이익&apos;")
    ).toBe(`SK하이닉스 "HBM" & '영업이익'`);
  });

  it("90일을 초과한 오래된 기사(예: 2011년 기사)를 차단하고 중복 제목을 제거한다", () => {
    const now = Date.parse("2026-11-24T00:00:00Z");
    const items = [
      {
        title: "<b>삼성전자</b> 4분기 실적 전망 상향",
        description: "최근 기사 1",
        originallink: "https://www.hankyung.com/article/1",
        pubDate: "Mon, 23 Nov 2026 09:00:00 +0900",
      },
      {
        title: "삼성전자 4분기 실적 전망 상향 - 속보",
        description: "중복 기사",
        originallink: "https://www.mk.co.kr/article/2",
        pubDate: "Mon, 23 Nov 2026 08:30:00 +0900",
      },
      {
        title: "반도체 수출 호조 지속",
        description: "최근 기사 2",
        originallink: "https://www.yna.co.kr/view/3",
        pubDate: "Sun, 22 Nov 2026 14:00:00 +0900",
      },
      {
        title: "2011년 국민연금 옛날 기사 노이즈",
        description: "구기사",
        originallink: "https://www.moneytoday.co.kr/view/old",
        pubDate: "Tue, 09 Aug 2011 12:00:00 +0900",
      },
    ];

    const filtered = filterAndDedupeRecentNews(items, now, 5);
    expect(filtered).toHaveLength(2);
    expect(filtered[0].publisher).toBe("한국경제");
    expect(filtered[1].publisher).toBe("연합뉴스");
  });

  it("전국지 및 전남광주 지역지 언론사명을 정확히 매핑한다", () => {
    expect(resolveKoreanPublisherName("https://www.kwangju.co.kr/article.php")).toBe("광주일보");
    expect(resolveKoreanPublisherName("https://www.jnilbo.com/news/1")).toBe("전남일보");
    expect(resolveKoreanPublisherName("https://www.yna.co.kr/view/1")).toBe("연합뉴스");
  });
});
