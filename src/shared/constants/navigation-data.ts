/**
 * Navigation Data Configuration
 *
 * Based on Project_Features.md - defines navigation structure for each domain
 *
 * @author PosMul Development Team
 * @since 2024-12
 */

import type {
  DomainNavigationConfig,
  DonationNavigation,
  ForumNavigation,
  InvestmentNavigation,
  PredictionNavigation,
} from "@/shared/types/navigation";

// Prediction Navigation (현재 구현됨)
const predictionNavigation: PredictionNavigation = {
  invest: {
    slug: "invest",
    title: "💼 Invest 예측",
    description: "PosMul 투자 서비스 예측",
    subcategories: [
      {
        slug: "local-league",
        title: "Local League",
        description: "지역 소상공인 투자",
      },
      {
        slug: "minor-league",
        title: "Minor League",
        description: "중소기업 투자",
      },
      {
        slug: "major-league",
        title: "Major League",
        description: "대기업 광고 참여",
      },
    ],
  },
  sports: {
    slug: "sports",
    title: "⚽ 스포츠 예측",
    description: "경기 결과 및 선수 성과 예측",
    subcategories: [
      { slug: "soccer", title: "축구", description: "국내외 축구 경기" },
      { slug: "baseball", title: "야구", description: "KBO, MLB 경기" },
      { slug: "basketball", title: "농구", description: "KBL, NBA 경기" },
      { slug: "esports", title: "e스포츠", description: "LOL, 오버워치 등" },
    ],
  },
  entertainment: {
    slug: "entertainment",
    title: "🎬 엔터테인먼트",
    description: "흥행 성적 및 수상 예측",
    subcategories: [
      { slug: "movies", title: "영화", description: "박스오피스 예측" },
      { slug: "dramas", title: "드라마", description: "시청률 예측" },
      { slug: "music", title: "음악", description: "차트 순위 예측" },
      { slug: "tv", title: "TV", description: "예능 프로그램" },
      { slug: "awards", title: "시상식", description: "각종 시상식 수상" },
    ],
  },
  politics: {
    slug: "politics",
    title: "🗳️ 정치/선거",
    description: "선거 결과 및 정책 예측",
    subcategories: [
      {
        slug: "national-elections",
        title: "국가 선거",
        description: "대통령, 국회의원 선거",
      },
      {
        slug: "local-elections",
        title: "지역 선거",
        description: "지방자치단체장 선거",
      },
      {
        slug: "international-elections",
        title: "국제 선거",
        description: "해외 주요 선거",
      },
      {
        slug: "policy-changes",
        title: "정책 변화",
        description: "정부 정책 시행 예측",
      },
    ],
  },
  "user-suggestions": {
    slug: "user-suggestions",
    title: "💡 사용자 제안",
    description: "커뮤니티 제안 예측 시장",
    subcategories: [
      {
        slug: "user-proposals",
        title: "사용자 제안",
        description: "개인 제안 주제",
      },
      {
        slug: "ai-recommendations",
        title: "AI 추천",
        description: "AI 기반 예측 주제",
      },
      {
        slug: "opinion-leader-suggestions",
        title: "오피니언 리더",
        description: "전문가 초청 예측",
      },
    ],
  },
};

// Investment Navigation (새로 구현 필요)
const investmentNavigation: InvestmentNavigation = {
  "local-league": {
    slug: "local-league",
    title: "🏪 Local League",
    description: "지역 소상공인과의 지속 가능한 소비",
    subcategories: [
      { slug: "clothing", title: "의류", description: "로컬 패션 브랜드" },
      { slug: "food", title: "식품", description: "지역 농수산물, 음식점" },
      { slug: "health", title: "건강", description: "헬스케어, 웰니스" },
      { slug: "lifestyle", title: "생활용품", description: "일상 생활용품" },
    ],
  },
  "major-league": {
    slug: "major-league",
    title: "🏢 Major League",
    description: "기업 제품/서비스 광고 시청으로 PMP 적립",
    subcategories: [
      { slug: "products", title: "제품", description: "제품 소개 영상" },
      { slug: "services", title: "서비스", description: "서비스 홍보" },
      { slug: "brands", title: "브랜드", description: "브랜드 스토리" },
      { slug: "esg", title: "ESG", description: "ESG 경영 실천 기업" },
    ],
  },
  "cloud-funding": {
    slug: "cloud-funding",
    title: "☁️ Cloud Funding",
    description: "개인/소상공인의 꿈과 아이디어 후원",
    subcategories: [
      { slug: "accessories", title: "액세서리", description: "패션 액세서리" },
      { slug: "books", title: "도서", description: "출판 프로젝트" },
      { slug: "movies", title: "영화", description: "독립영화 제작" },
      { slug: "performances", title: "공연", description: "공연 예술" },
      { slug: "art", title: "예술품", description: "미술 작품" },
    ],
  },
  common: {
    slug: "common",
    title: "⚙️ 공통 기능",
    description: "투자 관리 및 지원 서비스",
    subcategories: [
      {
        slug: "history",
        title: "투자 내역",
        description: "투자/후원 내역 조회",
      },
      {
        slug: "notifications",
        title: "알림",
        description: "투자 성사 및 리워드 알림",
      },
      {
        slug: "support",
        title: "고객 지원",
        description: "1:1 문의 및 가이드",
      },
      {
        slug: "settlement",
        title: "정산/환불",
        description: "자동 정산 및 환불",
      },
    ],
  },
};

// Donation Navigation (새로 구현 필요)
const donationNavigation: DonationNavigation = {
  direct: {
    slug: "direct",
    title: "🎁 직접 기부",
    description: "개인이 직접 원하는 물품을 PMC로 기부",
    subcategories: [
      { slug: "clothing", title: "의류", description: "의류 기부" },
      { slug: "food", title: "식품", description: "식품 기부" },
      { slug: "housing", title: "주거", description: "주거 지원" },
      { slug: "medical", title: "의료", description: "의료 지원" },
      { slug: "education", title: "교육", description: "교육 지원" },
      { slug: "others", title: "기타", description: "기타 물품" },
    ],
  },
  institute: {
    slug: "institute",
    title: "🏛️ 기관 기부",
    description: "신뢰할 수 있는 기관에 PMC로 기부",
    subcategories: [
      { slug: "emergency", title: "긴급구호", description: "재해 긴급 지원" },
      { slug: "children", title: "아동복지", description: "아동 복지 지원" },
      {
        slug: "international",
        title: "국제구호",
        description: "국제 구호 활동",
      },
      { slug: "environment", title: "환경보호", description: "환경 보호 활동" },
      { slug: "education", title: "교육지원", description: "교육 기회 확대" },
    ],
  },
  "opinion-leader": {
    slug: "opinion-leader",
    title: "👨‍💼 오피니언 리더",
    description: "오피니언 리더들의 주장에 PMC로 후원",
    subcategories: [
      { slug: "environment", title: "환경", description: "환경 운동가 후원" },
      { slug: "welfare", title: "복지", description: "복지 전문가 후원" },
      { slug: "science", title: "과학", description: "과학자 연구 후원" },
      { slug: "human-rights", title: "인권", description: "인권 활동가 후원" },
      { slug: "education", title: "교육", description: "교육자 후원" },
      { slug: "others", title: "기타", description: "기타 분야" },
    ],
  },
  common: {
    slug: "common",
    title: "⚙️ 공통 기능",
    description: "기부 관리 및 지원 서비스",
    subcategories: [
      {
        slug: "history",
        title: "기부 내역",
        description: "기부/후원 내역 조회",
      },
      {
        slug: "notifications",
        title: "알림",
        description: "기부 완료 및 사용 내역 알림",
      },
      {
        slug: "support",
        title: "고객 지원",
        description: "1:1 문의 및 가이드",
      },
      {
        slug: "settlement",
        title: "정산/환불",
        description: "기부금 투명 공개",
      },
    ],
  },
};

// Forum Navigation (새로 구현 필요)
const forumNavigation: ForumNavigation = {
  news: {
    slug: "news",
    title: "📰 네트워크 뉴스",
    description: "다양한 분야의 최신 뉴스와 정보",
    subcategories: [
      { slug: "cosmos", title: "Cosmos", description: "글로벌 뉴스" },
      { slug: "colony", title: "Colony", description: "콜로니 뉴스" },
      { slug: "nation", title: "Nation", description: "국가 뉴스" },
      { slug: "region", title: "Region", description: "지역 뉴스" },
      { slug: "local", title: "Local", description: "로컬 뉴스" },
    ],
  },
  debate: {
    slug: "debate",
    title: "🗣️ 토론/토의",
    description: "다양한 주제에 대한 심층적인 토론",
    subcategories: [
      { slug: "cosmos", title: "Cosmos", description: "글로벌 이슈 토론" },
      { slug: "colony", title: "Colony", description: "콜로니 이슈 토론" },
      { slug: "nation", title: "Nation", description: "국가 이슈 토론" },
      { slug: "region", title: "Region", description: "지역 이슈 토론" },
      { slug: "local", title: "Local", description: "로컬 이슈 토론" },
    ],
  },
  brainstorming: {
    slug: "brainstorming",
    title: "💡 아이디어 제안",
    description: "혁신적인 아이디어 발굴 및 협업",
    subcategories: [
      { slug: "cosmos", title: "Cosmos", description: "글로벌 아이디어" },
      { slug: "colony", title: "Colony", description: "콜로니 아이디어" },
      { slug: "nation", title: "Nation", description: "국가 아이디어" },
      { slug: "region", title: "Region", description: "지역 아이디어" },
      { slug: "local", title: "Local", description: "로컬 아이디어" },
    ],
  },
  budget: {
    slug: "budget",
    title: "💰 예산 관리",
    description: "다양한 범위의 예산 관리 및 재무 분석",
    subcategories: [
      {
        slug: "colony",
        title: "Colony Budget",
        description: "콜로니 예산 관리",
      },
      {
        slug: "national",
        title: "National Budget",
        description: "국가 예산 관리",
      },
      { slug: "region", title: "Region Budget", description: "지역 예산 관리" },
      { slug: "local", title: "Local Budget", description: "로컬 예산 관리" },
    ],
  },
};

// Domain configurations
export const DOMAIN_CONFIGS: DomainNavigationConfig[] = [
  {
    domain: "prediction",
    title: "🔮 Expect",
    description: "이벤트 예측으로 PMP를 PMC로 전환",
    icon: "🔮",
    primaryColor: "blue",
    navigation: predictionNavigation,
  },
  {
    domain: "investment",
    title: "💼 Invest",
    description: "PMP, PMC 적립을 위한 다양한 투자 활동",
    icon: "💼",
    primaryColor: "green",
    navigation: investmentNavigation,
  },
  {
    domain: "donation",
    title: "❤️ Donation",
    description: "PMC 소비를 통한 기부 활동",
    icon: "❤️",
    primaryColor: "red",
    navigation: donationNavigation,
  },
  {
    domain: "forum",
    title: "💬 Forum",
    description: "커뮤니티 의사소통으로 PMP 적립",
    icon: "💬",
    primaryColor: "purple",
    navigation: forumNavigation,
  },
];

// Helper functions
export const getDomainConfig = (domain: string) => {
  return DOMAIN_CONFIGS.find((config) => config.domain === domain);
};

export const getDomainNavigation = (domain: string) => {
  const config = getDomainConfig(domain);
  return config?.navigation;
};
