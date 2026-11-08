import type { MetadataRoute } from "next";

/**
 * 모두의창업 3기 발표 전까지 외부 검색 로봇의 크롤링을 100% 차단합니다.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      disallow: "/",
    },
  };
}

