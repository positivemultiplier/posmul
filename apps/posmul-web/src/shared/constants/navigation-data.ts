/**
 * Navigation Data Configuration
 *
 * Based on Project_Features.md - defines navigation structure for each domain
 *
 * @author PosMul Development Team
 * @since 2024-12
 */
import {
  DomainNavigationConfig,
  DomainType,
  DonationNavigation,
  ForumNavigation,
  InvestmentNavigation,
  PredictionNavigation,
  SidebarLink,
} from "../types/navigation";

// Prediction Navigation (현재 구현됨)
const predictionNav: PredictionNavigation = {
  all: {
    slug: "all",
    title: "전체",
    description: "모든 예측 게임 보기",
  },
  economy: {
    slug: "economy",
    title: "경제",
    description: "경제 지표 및 기업 실적 예측",
    subcategories: [
      { slug: "stocks", title: "주식", description: "주가 등락 예측" },
      { slug: "earnings", title: "기업 실적", description: "분기 실적 예측" },
      { slug: "indicators", title: "경제 지표", description: "GDP, 물가, 금리" },
      { slug: "crypto", title: "암호화폐", description: "비트코인, 이더리움" },
    ],
  },
  invest: {
    slug: "invest",
    title: "참여",
    description: "새로운 예측에 참여합니다.",
  },
  sports: {
    slug: "sports",
    title: "스포츠",
    description: "스포츠 관련 예측 게임",
    subcategories: [
      { slug: "soccer", title: "축구", description: "축구 경기 예측" },
      { slug: "basketball", title: "농구", description: "농구 경기 예측" },
    ],
  },
  entertainment: {
    slug: "entertainment",
    title: "연예",
    description: "연예/방송 관련 예측 게임",
  },
  politics: {
    slug: "politics",
    title: "정치/경제",
    description: "정치/경제 관련 예측 게임",
  },
  "user-suggestions": {
    slug: "user-suggestions",
    title: "유저 제안",
    description: "사용자가 제안한 예측 게임",
  },
};

// Investment Navigation
const investmentNav: InvestmentNavigation = {
  "local-league": {
    slug: "local-league",
    title: "로컬 리그",
    description: "지역 상점 소비를 통한 투자",
  },
  "major-league": {
    slug: "major-league",
    title: "메이저 리그",
    description: "광고 시청을 통한 투자",
  },
  "cloud-funding": {
    slug: "cloud-funding",
    title: "클라우드 펀딩",
    description: "프로젝트/기업에 직접 투자",
  },
  common: { slug: "common", title: "공통", description: "투자 관련 공통 사항" },
};

// Donation Navigation
const donationNav: DonationNavigation = {
  direct: {
    slug: "direct",
    title: "직접 기부",
    description: "개인/단체에 직접 기부",
  },
  institute: {
    slug: "institute",
    title: "기관 기부",
    description: "공익 기관을 통한 기부",
  },
  "opinion-leader": {
    slug: "opinion-leader",
    title: "오피니언 리더",
    description: "오피니언 리더 후원",
  },
  common: { slug: "common", title: "공통", description: "기부 관련 공통 사항" },
};

// Forum Navigation
const forumNav: ForumNavigation = {
  news: { slug: "news", title: "뉴스", description: "최신 뉴스 및 토론" },
  debate: { slug: "debate", title: "토론", description: "주제별 찬반 토론" },
  brainstorming: {
    slug: "brainstorming",
    title: "브레인스토밍",
    description: "아이디어 제안 및 발전",
  },
  budget: { slug: "budget", title: "예산", description: "공공 예산 관련 토론" },
};

export const DOMAIN_CONFIGS: DomainNavigationConfig[] = [
  {
    domain: "prediction",
    title: "예측",
    description: "미래를 예측하고 보상을 받으세요.",
    icon: "🔮",
    primaryColor: "blue",
    navigation: predictionNav,
  },
  {
    domain: "investment",
    title: "투자",
    description: "포인트로 가치를 창출하세요.",
    icon: "📈",
    primaryColor: "green",
    navigation: investmentNav,
  },
  {
    domain: "donation",
    title: "기부",
    description: "세상을 바꾸는 작은 움직임",
    icon: "💖",
    primaryColor: "red",
    navigation: donationNav,
  },
  {
    domain: "forum",
    title: "포럼",
    description: "자유롭게 의견을 나누세요.",
    icon: "🏛️",
    primaryColor: "purple",
    navigation: forumNav,
  },
];

export const getDomainConfig = (
  domain: DomainType
): DomainNavigationConfig | undefined => {
  return DOMAIN_CONFIGS.find((config) => config.domain === domain);
};

export const getDomainNav = (domain: DomainType) => {
  const config = getDomainConfig(domain);
  return config?.navigation;
};

export const sidebarLinks: SidebarLink[] = [
  {
    category: "Dashboard",
    slug: "dashboard",
    title: "대시보드",
    description: "전체 활동 요약",
    icon: "LayoutDashboard",
  },
  {
    category: "Prediction",
    slug: "prediction",
    title: "예측",
    description: "미래 예측",
    icon: "Target",
    subLinks: [
      {
        slug: "/prediction/consume",
        title: "소비",
        description: "투자→소비 예측",
      },
      {
        slug: "/prediction/sports",
        title: "스포츠",
        description: "스포츠 예측",
      },
    ],
  },
  {
    category: "Investment",
    slug: "investment",
    title: "투자",
    description: "가치 창출",
    icon: "TrendingUp",
  },
  {
    category: "Donation",
    slug: "donation",
    title: "기부",
    description: "세상 변화",
    icon: "Heart",
  },
  {
    category: "Forum",
    slug: "forum",
    title: "포럼",
    description: "의견 공유",
    icon: "MessageSquare",
  },
  {
    category: "Community",
    slug: "community",
    title: "커뮤니티",
    description: "소통과 교류",
    icon: "Users",
  },
  {
    category: "My Page",
    slug: "mypage",
    title: "마이페이지",
    description: "내 정보",
    icon: "User",
  },
  {
    category: "Settings",
    slug: "settings",
    title: "설정",
    description: "계정 및 앱 설정",
    icon: "Settings",
  },
];
