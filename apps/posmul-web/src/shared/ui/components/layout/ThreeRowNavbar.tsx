"use client";

import Link from "next/link";
import { Suspense, useState, useEffect, useRef } from "react";
import {
  Menu,
  X,
  ChevronDown,
  LayoutDashboard,
  User as UserIcon,
  Settings,
  LogOut,
  Gift,
  FileSpreadsheet,
  HelpCircle,
} from "lucide-react";
import { createClient } from "../../../../lib/supabase/client";
import { User } from "@supabase/supabase-js";
import { usePathname, useSearchParams } from "next/navigation";
import { CompactBalanceWidget } from "./CompactBalanceWidget";
import {
  DOMAIN_PHILOSOPHY_MAP,
  type PosMulDomainKey,
} from "../../tokens/domain-tones";

type ThreeRowNavbarProps = {
  hideNav?: boolean;
};

export interface NavSubcategoryItem {
  title: string;
  path: string;
}

export interface NavCategoryItem {
  title: string;
  href: string;
  /** URL 2번째 세그먼트 매칭용 별칭 (예: 'major-league' -> 'major') */
  segmentAliases?: string[];
  subcategories: NavSubcategoryItem[];
}

export interface NavDomainItem {
  title: string;
  href: string;
  categories: Record<string, NavCategoryItem>;
}

// PosMul 시민 선순환 3단 네비게이션 구조
export const navigationData: Record<PosMulDomainKey, NavDomainItem> = {
  forum: {
    title: "포럼",
    href: "/forum",
    categories: {
      all: {
        title: "전체 공론장",
        href: "/forum",
        subcategories: [
          { title: "포럼 홈", path: "/forum" },
          { title: "공공 뉴스", path: "/forum/news" },
          { title: "예산 감시", path: "/forum/budget" },
          { title: "시민 아고라", path: "/forum/agora" },
        ],
      },
      news: {
        title: "News",
        href: "/forum/news",
        segmentAliases: ["news"],
        subcategories: [
          { title: "전체 뉴스", path: "/forum/news" },
          { title: "전남·광주", path: "/forum/news?category=gwangju" },
          { title: "AI·테크", path: "/forum/news?category=ai" },
          { title: "경제·정책", path: "/forum/news?category=economy" },
          { title: "스포츠", path: "/forum/news?category=sports" },
        ],
      },
      budget: {
        title: "Budget",
        href: "/forum/budget",
        segmentAliases: ["budget"],
        subcategories: [
          { title: "전체 예산", path: "/forum/budget" },
          { title: "국가 예산", path: "/forum/budget?level=national" },
          { title: "지역 예산", path: "/forum/budget?level=regional" },
          { title: "재정 이슈", path: "/forum/budget?level=issue" },
        ],
      },
      agora: {
        title: "Agora",
        href: "/forum/agora",
        segmentAliases: ["agora"],
        subcategories: [
          { title: "전체 안건", path: "/forum/agora" },
          { title: "브레인스토밍", path: "/forum/agora?type=brainstorm" },
          { title: "정책 토론", path: "/forum/agora?type=debate" },
          { title: "시민 제안", path: "/forum/agora?type=proposal" },
        ],
      },
    },
  },
  consume: {
    title: "소비",
    href: "/consume",
    categories: {
      all: {
        title: "전체 소비",
        href: "/consume",
        subcategories: [
          { title: "소비 홈", path: "/consume" },
          { title: "Major League (광고)", path: "/consume/major-league" },
          { title: "Minor League (상점)", path: "/consume/minor-league" },
          { title: "Cloud Funding (펀딩)", path: "/consume/cloud-funding" },
        ],
      },
      major: {
        title: "Major League",
        href: "/consume/major-league",
        segmentAliases: ["major-league", "major", "time"],
        subcategories: [
          { title: "전체 광고", path: "/consume/major-league" },
          { title: "라이프스타일", path: "/consume/major-league?category=라이프스타일" },
          { title: "교육·AI", path: "/consume/major-league?category=교육" },
          { title: "문화·건강", path: "/consume/major-league?category=문화" },
        ],
      },
      minor: {
        title: "Minor League",
        href: "/consume/minor-league",
        segmentAliases: ["minor-league", "minor", "money"],
        subcategories: [
          { title: "전체 상점", path: "/consume/minor-league" },
          { title: "카페", path: "/consume/minor-league?category=cafe" },
          { title: "음식점", path: "/consume/minor-league?category=restaurant" },
          { title: "서점·문화", path: "/consume/minor-league?category=bookstore" },
        ],
      },
      cloud: {
        title: "Cloud Funding",
        href: "/consume/cloud-funding",
        segmentAliases: ["cloud-funding", "cloud"],
        subcategories: [
          { title: "전체 프로젝트", path: "/consume/cloud-funding" },
          { title: "창업·스타트업", path: "/consume/cloud-funding?category=startup" },
          { title: "출판·문화", path: "/consume/cloud-funding?category=publish" },
          { title: "친환경·농업", path: "/consume/cloud-funding?category=agriculture" },
        ],
      },
    },
  },
  prediction: {
    title: "예측",
    href: "/prediction",
    categories: {
      all: {
        title: "전체 마켓",
        href: "/prediction",
        subcategories: [
          { title: "전체 마켓 피드", path: "/prediction" },
          { title: "인기·핫이슈", path: "/prediction?filter=hot" },
          { title: "고액 상금풀", path: "/prediction?filter=high-pool" },
          { title: "마감 임박", path: "/prediction?filter=closing" },
        ],
      },
      economy: {
        title: "경제",
        href: "/prediction/economy",
        segmentAliases: ["economy", "invest"],
        subcategories: [
          { title: "경제 전체", path: "/prediction/economy" },
          { title: "주식", path: "/prediction/economy/stocks" },
          { title: "기업 실적", path: "/prediction/economy/earnings" },
          { title: "경제 지표", path: "/prediction/economy/indicators" },
          { title: "암호화폐", path: "/prediction/economy/crypto" },
        ],
      },
      consume: {
        title: "소비예측",
        href: "/prediction/consume",
        segmentAliases: ["consume"],
        subcategories: [
          { title: "소비예측 전체", path: "/prediction/consume" },
          { title: "TimeConsume", path: "/prediction/consume/time" },
          { title: "MoneyConsume", path: "/prediction/consume/money" },
          { title: "CloudConsume", path: "/prediction/consume/cloud" },
        ],
      },
      sports: {
        title: "스포츠",
        href: "/prediction/sports",
        segmentAliases: ["sports"],
        subcategories: [
          { title: "스포츠 전체", path: "/prediction/sports" },
          { title: "축구", path: "/prediction/sports/soccer" },
          { title: "야구", path: "/prediction/sports/baseball" },
          { title: "농구", path: "/prediction/sports/basketball" },
          { title: "e스포츠", path: "/prediction/sports/esports" },
        ],
      },
      entertainment: {
        title: "엔터테인먼트",
        href: "/prediction/entertainment",
        segmentAliases: ["entertainment"],
        subcategories: [
          { title: "엔터 전체", path: "/prediction/entertainment" },
          { title: "영화", path: "/prediction/entertainment/movies" },
          { title: "드라마", path: "/prediction/entertainment/dramas" },
          { title: "예능·방송", path: "/prediction/entertainment/variety" },
          { title: "음악", path: "/prediction/entertainment/music" },
          { title: "시상식", path: "/prediction/entertainment/awards" },
        ],
      },
      politics: {
        title: "정치/선거",
        href: "/prediction/politics",
        segmentAliases: ["politics"],
        subcategories: [
          { title: "정치 전체", path: "/prediction/politics" },
          { title: "국가 선거", path: "/prediction/politics/national-elections" },
          { title: "지역 선거", path: "/prediction/politics/local-elections" },
          { title: "정책 변화", path: "/prediction/politics/policy-changes" },
        ],
      },
      "user-suggestions": {
        title: "시민 제안",
        href: "/prediction/user-suggestions",
        segmentAliases: ["user-suggestions"],
        subcategories: [
          { title: "제안 전체", path: "/prediction/user-suggestions" },
          { title: "시민 제안", path: "/prediction/user-suggestions/user-proposals" },
          { title: "AI 추천", path: "/prediction/user-suggestions/ai-recommendations" },
          { title: "오피니언 리더", path: "/prediction/user-suggestions/opinion-leader-suggestions" },
        ],
      },
    },
  },
  donation: {
    title: "기부",
    href: "/donation",
    categories: {
      all: {
        title: "전체 기부",
        href: "/donation",
        subcategories: [
          { title: "기부 홈", path: "/donation" },
          { title: "직접 물품 기부", path: "/donation/direct" },
          { title: "공익 기관 기부", path: "/donation/institute" },
          { title: "오피니언 리더 후원", path: "/donation/opinion-leader" },
        ],
      },
      direct: {
        title: "K-물품 기부",
        href: "/donation/direct",
        segmentAliases: ["direct"],
        subcategories: [
          { title: "전체 물품", path: "/donation/direct" },
          { title: "의류·잡화", path: "/donation/direct?category=clothing" },
          { title: "식품·생필품", path: "/donation/direct?category=food" },
          { title: "교육·도서", path: "/donation/direct?category=education" },
          { title: "의료·건강", path: "/donation/direct?category=medical" },
        ],
      },
      institute: {
        title: "기관 기부",
        href: "/donation/institute",
        segmentAliases: ["institute"],
        subcategories: [
          { title: "전체 기관", path: "/donation/institute" },
          { title: "긴급구호", path: "/donation/institute?type=emergency" },
          { title: "아동복지", path: "/donation/institute?type=children" },
          { title: "환경보호", path: "/donation/institute?type=environment" },
          { title: "교육지원", path: "/donation/institute?type=education" },
        ],
      },
      opinion: {
        title: "오피니언 리더",
        href: "/donation/opinion-leader",
        segmentAliases: ["opinion-leader", "opinion"],
        subcategories: [
          { title: "전체 리더", path: "/donation/opinion-leader" },
          { title: "환경", path: "/donation/opinion-leader?field=environment" },
          { title: "복지", path: "/donation/opinion-leader?field=welfare" },
          { title: "과학", path: "/donation/opinion-leader?field=science" },
          { title: "인권", path: "/donation/opinion-leader?field=human-rights" },
        ],
      },
    },
  },
  ranking: {
    title: "랭킹",
    href: "/ranking",
    categories: {
      expect: {
        title: "예측 명사수",
        href: "/ranking?category=expect",
        subcategories: [
          { title: "전국 명예의 전당", path: "/ranking?category=expect" },
          { title: "서울특별시", path: "/ranking?category=expect&sido=서울특별시" },
          { title: "경기도", path: "/ranking?category=expect&sido=경기도" },
          { title: "부산광역시", path: "/ranking?category=expect&sido=부산광역시" },
        ],
      },
      overall: {
        title: "종합 시민",
        href: "/ranking?category=overall",
        subcategories: [
          { title: "전국 종합", path: "/ranking?category=overall" },
          { title: "서울특별시", path: "/ranking?category=overall&sido=서울특별시" },
          { title: "경기도", path: "/ranking?category=overall&sido=경기도" },
          { title: "부산광역시", path: "/ranking?category=overall&sido=부산광역시" },
        ],
      },
      forum: {
        title: "공론 기여",
        href: "/ranking?category=forum",
        subcategories: [
          { title: "PMP 공론 랭킹", path: "/ranking?category=forum" },
          { title: "서울특별시", path: "/ranking?category=forum&sido=서울특별시" },
          { title: "경기도", path: "/ranking?category=forum&sido=경기도" },
        ],
      },
      consume: {
        title: "상생 소비",
        href: "/ranking?category=consume",
        subcategories: [
          { title: "PMC 소비 랭킹", path: "/ranking?category=consume" },
          { title: "서울특별시", path: "/ranking?category=consume&sido=서울특별시" },
          { title: "경기도", path: "/ranking?category=consume&sido=경기도" },
        ],
      },
      donation: {
        title: "나눔 리더",
        href: "/ranking?category=donation",
        subcategories: [
          { title: "PMC 기부 랭킹", path: "/ranking?category=donation" },
          { title: "서울특별시", path: "/ranking?category=donation&sido=서울특별시" },
          { title: "경기도", path: "/ranking?category=donation&sido=경기도" },
        ],
      },
    },
  },
  other: {
    title: "기타",
    href: "/other",
    categories: {
      all: {
        title: "전체 서비스",
        href: "/other",
        subcategories: [
          { title: "기타 홈", path: "/other" },
          { title: "Gift Aid (세액공제)", path: "/other/gift-aid" },
          { title: "Accounting & Tax", path: "/other/tax" },
        ],
      },
      giftaid: {
        title: "Gift Aid",
        href: "/other/gift-aid",
        segmentAliases: ["gift-aid", "giftaid"],
        subcategories: [
          { title: "기부 내역", path: "/other/gift-aid" },
          { title: "영수증 발급", path: "/other/gift-aid?tab=receipt" },
          { title: "세액공제 계산", path: "/other/gift-aid?tab=calculator" },
        ],
      },
      tax: {
        title: "세무·회계",
        href: "/other/tax",
        segmentAliases: ["tax"],
        subcategories: [
          { title: "거래 내역", path: "/other/tax" },
          { title: "수익 명세서", path: "/other/tax?tab=statement" },
          { title: "세무 자료", path: "/other/tax?tab=tax-docs" },
        ],
      },
      support: {
        title: "고객지원",
        href: "/other/support",
        segmentAliases: ["support"],
        subcategories: [
          { title: "FAQ", path: "/other/support" },
          { title: "1:1 문의", path: "/other/support?tab=contact" },
          { title: "이용 가이드", path: "/other/support?tab=guide" },
        ],
      },
      settings: {
        title: "설정",
        href: "/other/settings",
        segmentAliases: ["settings"],
        subcategories: [
          { title: "프로필", path: "/other/settings" },
          { title: "알림", path: "/other/settings?tab=notifications" },
          { title: "보안", path: "/other/settings?tab=security" },
        ],
      },
    },
  },
};

function isDomainKey(value: string): value is PosMulDomainKey {
  return value in navigationData;
}

function findMatchingCategoryKey(
  categories: Record<string, NavCategoryItem>,
  segment: string | undefined
): string {
  const fallback = "all" in categories ? "all" : Object.keys(categories)[0] ?? "all";
  if (!segment) return fallback;
  for (const [catKey, cat] of Object.entries(categories)) {
    if (catKey === segment || cat.segmentAliases?.includes(segment)) {
      return catKey;
    }
  }
  return fallback;
}

/**
 * URL pathname과 searchParams로부터 현재 활성 도메인과 카테고리(Row 2) 키를 결정론적으로 도출
 */
function resolveDomainAndCategory(
  pathname: string,
  searchParamsString: string
): { domain: PosMulDomainKey; categoryKey: string } {
  const parts = pathname.split("/").filter(Boolean);
  const first = parts[0];
  const second = parts[1];

  if (!first || first === "prediction") {
    return {
      domain: "prediction",
      categoryKey: findMatchingCategoryKey(navigationData.prediction.categories, second),
    };
  }

  if (first === "invest") {
    return { domain: "consume", categoryKey: "all" };
  }

  if (!isDomainKey(first)) {
    return { domain: "prediction", categoryKey: "all" };
  }

  const domain = first;
  const categories = navigationData[domain].categories;

  if (domain === "ranking") {
    const queryCat = new URLSearchParams(searchParamsString).get("category");
    const categoryKey = queryCat && queryCat in categories ? queryCat : "expect";
    return { domain, categoryKey };
  }

  return {
    domain,
    categoryKey: findMatchingCategoryKey(categories, second),
  };
}

function checkQuerySubcategoryMatch(
  subBase: string,
  subQueryStr: string,
  allSubcategories: NavSubcategoryItem[],
  pathname: string,
  currentParams: URLSearchParams
): boolean {
  if (pathname !== subBase) return false;
  const subParams = new URLSearchParams(subQueryStr);
  for (const [k, v] of subParams.entries()) {
    if (currentParams.get(k) !== v) return false;
  }

  for (const sib of allSubcategories) {
    const q = sib.path.split("?")[1];
    if (!q) continue;
    for (const k of new URLSearchParams(q).keys()) {
      if (!subParams.has(k) && currentParams.has(k)) return false;
    }
  }
  return true;
}

function collectSiblingQueryKeys(
  subPath: string,
  subBase: string,
  allSubcategories: NavSubcategoryItem[]
): Set<string> {
  const keys = new Set<string>();
  for (const sib of allSubcategories) {
    if (sib.path === subPath) continue;
    const [sibBase, sibQ] = sib.path.split("?");
    if (sibBase === subBase && sibQ) {
      for (const k of new URLSearchParams(sibQ).keys()) {
        keys.add(k);
      }
    }
  }
  return keys;
}

/**
 * Row 3 서브카테고리 활성 여부 판별 (쿼리 파라미터까지 정확히 비교하여 중복 하이라이트 방지)
 */
function checkSubcategoryActive(
  subPath: string,
  allSubcategories: NavSubcategoryItem[],
  pathname: string,
  searchParamsString: string
): boolean {
  const [subBase, subQueryStr] = subPath.split("?");
  const currentParams = new URLSearchParams(searchParamsString);

  if (subQueryStr) {
    return checkQuerySubcategoryMatch(
      subBase,
      subQueryStr,
      allSubcategories,
      pathname,
      currentParams
    );
  }

  const siblingQueryKeys = collectSiblingQueryKeys(subPath, subBase, allSubcategories);
  if (siblingQueryKeys.size > 0) {
    if (pathname !== subBase) return false;
    return Array.from(siblingQueryKeys).every((k) => !currentParams.has(k));
  }

  const hasDeeperSiblingMatch = allSubcategories.some((sib) => {
    if (sib.path === subPath) return false;
    const sibBase = sib.path.split("?")[0] ?? sib.path;
    return (
      sibBase.length > subBase.length &&
      (pathname === sibBase || pathname.startsWith(`${sibBase}/`))
    );
  });

  if (hasDeeperSiblingMatch) return false;
  return pathname === subBase || pathname.startsWith(`${subBase}/`);
}

// Row 1 핵심 도메인 (예측 · 기부 · 포럼)
const PRIMARY_DOMAIN_KEYS: PosMulDomainKey[] = ["prediction", "donation", "forum"];

// '기타 ▼' 드롭다운에 통합된 보조 도메인 및 서비스
const MORE_MENU_GROUPS = [
  {
    label: "확장 도메인",
    items: [
      {
        title: "소비",
        desc: "광고 · 상점 · 클라우드 펀딩",
        href: "/consume",
        icon: "",
        badge: "+PMP·PMC",
      },
      {
        title: "랭킹",
        desc: "전국·지역 시민 명예의 전당",
        href: "/ranking",
        icon: "",
        badge: "명예",
      },
    ],
  },
  {
    label: "실시간 · 커뮤니티",
    items: [
      {
        title: "LIVE 응원톡",
        desc: "실시간 이슈 라이브 중계·응원",
        href: "/live",
        icon: "",
        badge: "LIVE",
      },
      {
        title: "맞짱 챌린지",
        desc: "1:1 예측 승부 및 커스텀 내기",
        href: "/challenge",
        icon: "",
        badge: "대결",
      },
      {
        title: "프렌즈 도감",
        desc: "포스멀 캐릭터 유니버스",
        href: "/characters",
        icon: "",
        badge: "도감",
      },
    ],
  },
  {
    label: "기타 서비스",
    items: [
      {
        title: "Gift Aid (세액공제)",
        desc: "기부 영수증 및 공제 계산",
        href: "/other/gift-aid",
        icon: "",
      },
      {
        title: "세무 · 회계",
        desc: "거래 내역 및 수익 명세서",
        href: "/other/tax",
        icon: "",
      },
      {
        title: "고객지원 · 가이드",
        desc: "FAQ · 1:1 문의 · 이용 안내",
        href: "/other/support",
        icon: "",
      },
      {
        title: "기타 서비스 전체",
        desc: "전체 부가 기능 모아보기",
        href: "/other",
        icon: "",
      },
    ],
  },
];

function ThreeRowNavbarContent({ hideNav = false }: ThreeRowNavbarProps) {
  const [user, setUser] = useState<User | null>(null);
  const [authResolved, setAuthResolved] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  const moreMenuRef = useRef<HTMLDivElement>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  const pathname = usePathname() || "/";
  const searchParams = useSearchParams();
  const searchParamsString = searchParams?.toString() || "";
  const supabase = createClient();

  const { domain: selectedDomain, categoryKey: selectedCategory } =
    resolveDomainAndCategory(pathname, searchParamsString);

  useEffect(() => {
    setMounted(true);
  }, []);

  // 경로 변경 시 열려있는 드롭다운 자동 닫기
  useEffect(() => {
    setMoreMenuOpen(false);
    setProfileMenuOpen(false);
    setMobileOpen(false);
  }, [pathname, searchParamsString]);

  // 외부 클릭 또는 ESC 키로 드롭다운 닫기
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      const target = event.target as Node;
      if (moreMenuRef.current && !moreMenuRef.current.contains(target)) {
        setMoreMenuOpen(false);
      }
      if (profileMenuRef.current && !profileMenuRef.current.contains(target)) {
        setProfileMenuOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMoreMenuOpen(false);
        setProfileMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  useEffect(() => {
    const getUser = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session?.user) {
          setUser(session.user);
        } else {
          // 쿠키가 서버에서 갱신됐거나 막 콜백으로 돌아온 경우 getUser()로 한 번 더 확인
          const { data } = await supabase.auth.getUser();
          setUser(data.user ?? null);
        }
      } finally {
        setAuthResolved(true);
      }
    };

    void getUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event: string, session: { user: User } | null) => {
      setUser(session?.user ?? null);
      setAuthResolved(true);
    });

    return () => subscription.unsubscribe();
  }, [supabase, pathname]);

  const resolvedUserLabel = user
    ? ((user.user_metadata?.display_name as string | undefined) ||
        (user.user_metadata?.nickname as string | undefined) ||
        (user.user_metadata?.full_name as string | undefined) ||
        (user.user_metadata?.name as string | undefined) ||
        user.email?.split("@")[0] ||
        "시민")
    : null;

  const resolvedAvatarUrl = user
    ? ((user.user_metadata?.avatar_url as string | undefined) ||
        (user.user_metadata?.picture as string | undefined) ||
        null)
    : null;

  const handleSignOut = async () => {
    setProfileMenuOpen(false);
    await supabase.auth.signOut();
    if (mounted) {
      window.location.href = "/";
    }
  };

  const handleOpenHealingRoom = (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    const popup = window.open(
      "/healing-room",
      "PosMulHealingRoom",
      "width=1280,height=860,left=100,top=60,resizable=yes,scrollbars=yes"
    );
    if (!popup) {
      window.open("/healing-room", "_blank", "noopener,noreferrer");
    } else {
      popup.focus();
    }
  };

  // 로그인/회원가입 후 현재 보던 페이지로 복귀하기 위한 return URL
  const currentReturnPath =
    pathname && !pathname.startsWith("/auth") && !pathname.startsWith("/gate")
      ? `${pathname}${searchParamsString ? `?${searchParamsString}` : ""}`
      : null;
  const loginHref = currentReturnPath
    ? `/auth/login?next=${encodeURIComponent(currentReturnPath)}`
    : "/auth/login";
  const signupHref = currentReturnPath
    ? `/auth/signup?next=${encodeURIComponent(currentReturnPath)}`
    : "/auth/signup";

  if (hideNav || pathname.startsWith("/healing-room")) return null;

  const currentDomainMeta = DOMAIN_PHILOSOPHY_MAP[selectedDomain];
  const currentCategories = navigationData[selectedDomain].categories;
  const currentSubcategories =
    currentCategories[selectedCategory]?.subcategories ?? [];

  const isMoreActive =
    selectedDomain === "consume" ||
    selectedDomain === "ranking" ||
    selectedDomain === "other" ||
    pathname.startsWith("/live") ||
    pathname.startsWith("/challenge") ||
    pathname.startsWith("/characters");

  const activeMoreTitle = pathname.startsWith("/live")
    ? "LIVE"
    : pathname.startsWith("/challenge")
      ? "맞짱"
      : pathname.startsWith("/characters")
        ? "프렌즈"
        : selectedDomain === "consume"
          ? "소비"
          : selectedDomain === "ranking"
            ? "랭킹"
            : null;

  return (
    <header className="fixed top-0 w-full z-50 bg-[#090b12]/90 backdrop-blur-2xl border-b border-white/[0.07] shadow-[0_6px_30px_rgba(0,0,0,0.6)]">
      {/* 상단 도메인 앰비언트 라이트 라인 (Tone-on-Tone) */}
      <div
        className={`pointer-events-none absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r ${currentDomainMeta.tones.ambientGlow}`}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* ==================== Row 1: Logo + 핵심 도메인(예측·기부·포럼·기타▼) + 프로필 ==================== */}
        <div className="flex justify-between items-center h-[58px] border-b border-white/[0.05] gap-4">
          {/* 좌측: 브랜드 로고 + 핵심 3도메인 + 기타 드롭다운 */}
          <div className="flex items-center gap-6 min-w-0">
            <Link
              href="/"
              className="flex items-center gap-2 group focus:outline-none whitespace-nowrap shrink-0"
            >
              <span className="text-2xl font-black bg-gradient-to-r from-sky-300 via-indigo-300 to-purple-300 bg-clip-text text-transparent tracking-tight">
                PosMul
              </span>
            </Link>

            {/* Desktop: Row 1 핵심 네비게이션 (예측 · 기부 · 포럼 · 기타▼) */}
            <nav
              aria-label="주요 도메인 네비게이션"
              className="hidden md:flex items-center gap-1.5"
            >
              {PRIMARY_DOMAIN_KEYS.map((domainKey) => {
                const data = navigationData[domainKey];
                const meta = DOMAIN_PHILOSOPHY_MAP[domainKey];
                const isSelected = !isMoreActive && selectedDomain === domainKey;

                return (
                  <Link
                    key={domainKey}
                    href={data.href}
                    prefetch={true}
                    className={`px-3.5 py-1.5 rounded-xl transition-all duration-200 flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                      isSelected
                        ? meta.tones.row1Active
                        : "text-slate-300 hover:text-white hover:bg-white/[0.05] border border-transparent"
                    }`}
                  >
                    <span className="text-sm font-bold tracking-tight">
                      {data.title}
                    </span>
                  </Link>
                );
              })}

              {/* 기타 ▼ 통합 드롭다운 (소비·랭킹·LIVE·맞짱·프렌즈·기타 서비스) */}
              <div ref={moreMenuRef} className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setMoreMenuOpen((prev) => !prev);
                    setProfileMenuOpen(false);
                  }}
                  aria-expanded={moreMenuOpen}
                  aria-haspopup="menu"
                  className={`px-3.5 py-1.5 rounded-xl transition-all duration-200 flex items-center gap-1 whitespace-nowrap shrink-0 text-sm font-bold tracking-tight ${
                    isMoreActive
                      ? currentDomainMeta.tones.row1Active
                      : moreMenuOpen
                        ? "bg-white/[0.08] text-white border border-white/[0.12]"
                        : "text-slate-300 hover:text-white hover:bg-white/[0.05] border border-transparent"
                  }`}
                >
                  <span>{activeMoreTitle ? `기타 · ${activeMoreTitle}` : "기타"}</span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform duration-200 ${
                      moreMenuOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {moreMenuOpen && (
                  <div
                    role="menu"
                    className="absolute left-0 top-full mt-2 w-[320px] rounded-2xl bg-[#0e1320]/98 backdrop-blur-2xl border border-white/[0.1] shadow-[0_18px_45px_rgba(0,0,0,0.75)] p-3 z-50 space-y-3"
                  >
                    {MORE_MENU_GROUPS.map((group) => (
                      <div key={group.label}>
                        <div className="px-2.5 pb-1.5 text-[10.5px] font-bold uppercase tracking-wider text-slate-500">
                          {group.label}
                        </div>
                        <div className="space-y-0.5">
                          {group.items.map((item) => {
                            const active =
                              pathname === item.href ||
                              (item.href !== "/other" && pathname.startsWith(`${item.href}/`));
                            return (
                              <Link
                                key={item.href}
                                href={item.href}
                                prefetch={true}
                                onClick={() => setMoreMenuOpen(false)}
                                className={`flex items-center justify-between gap-3 px-2.5 py-2 rounded-xl transition-colors ${
                                  active
                                    ? "bg-sky-500/15 border border-sky-400/30 text-white"
                                    : "hover:bg-white/[0.05] text-slate-200 border border-transparent"
                                }`}
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <span className="text-base leading-none shrink-0">
                                    {item.icon}
                                  </span>
                                  <div className="min-w-0">
                                    <div className="text-xs font-bold text-slate-100 truncate">
                                      {item.title}
                                    </div>
                                    <div className="text-[11px] text-slate-400 truncate">
                                      {item.desc}
                                    </div>
                                  </div>
                                </div>
                                {"badge" in item && item.badge && (
                                  <span className="px-1.5 py-0.5 rounded-md bg-white/[0.06] text-[10px] font-bold text-slate-300 whitespace-nowrap shrink-0">
                                    {item.badge}
                                  </span>
                                )}
                              </Link>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </nav>
          </div>

          {/* 우측: 힐링룸 + 프로필(로그인 시) / 로그인·회원가입(비로그인 시) */}
          <div className="hidden md:flex items-center gap-2.5 shrink-0">
            <a
              href="/healing-room"
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleOpenHealingRoom}
              className="px-3 py-1.5 bg-gradient-to-r from-sky-500/20 via-indigo-500/20 to-purple-500/20 hover:from-sky-500/30 hover:to-purple-500/30 text-sky-200 rounded-xl transition-all duration-200 border border-sky-400/40 text-xs font-semibold flex items-center gap-1 whitespace-nowrap shrink-0"
            >
              <span></span>
              <span>힐링룸</span>
            </a>

            {user ? (
              <div ref={profileMenuRef} className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setProfileMenuOpen((prev) => !prev);
                    setMoreMenuOpen(false);
                  }}
                  aria-expanded={profileMenuOpen}
                  aria-haspopup="menu"
                  title={`로그인 계정: ${user.email ?? resolvedUserLabel ?? ""}`}
                  className={`flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-full border transition-all duration-200 whitespace-nowrap shrink-0 ${
                    profileMenuOpen
                      ? "bg-slate-800/95 border-sky-400/50 text-white shadow-lg shadow-sky-500/10"
                      : "bg-slate-900/90 hover:bg-slate-800/90 border-white/[0.1] text-slate-100"
                  }`}
                >
                  {resolvedAvatarUrl ? (
                    <img
                      src={resolvedAvatarUrl}
                      alt={resolvedUserLabel ?? "프로필"}
                      className="w-6 h-6 rounded-full object-cover ring-1 ring-emerald-400/50 shrink-0"
                    />
                  ) : (
                    <span className="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300 shrink-0">
                      <UserIcon className="w-3.5 h-3.5" />
                    </span>
                  )}
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                  <span className="text-xs font-bold max-w-[130px] truncate">
                    {resolvedUserLabel}
                  </span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 shrink-0 ${
                      profileMenuOpen ? "rotate-180 text-sky-300" : ""
                    }`}
                  />
                </button>

                {profileMenuOpen && (
                  <div
                    role="menu"
                    className="absolute right-0 top-full mt-2 w-64 rounded-2xl bg-[#0e1320]/98 backdrop-blur-2xl border border-white/[0.1] shadow-[0_18px_45px_rgba(0,0,0,0.75)] p-2 z-50"
                  >
                    {/* 계정 요약 헤더 */}
                    <div className="px-3 py-2.5 border-b border-white/[0.07] mb-1.5">
                      <div className="text-xs font-extrabold text-white truncate">
                        {resolvedUserLabel} 님
                      </div>
                      {user.email && (
                        <div className="text-[11px] text-slate-400 truncate mt-0.5">
                          {user.email}
                        </div>
                      )}
                    </div>

                    {/* 개인 메뉴 (내 대시보드 · 프로필 설정 · 세무/기부 내역) */}
                    <div className="space-y-0.5">
                      <Link
                        href="/dashboard"
                        onClick={() => setProfileMenuOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-200 hover:text-white hover:bg-white/[0.06] transition-colors"
                      >
                        <LayoutDashboard className="w-4 h-4 text-sky-400 shrink-0" />
                        <span>내 대시보드</span>
                      </Link>
                      <Link
                        href="/dashboard?onboarding=1"
                        onClick={() => setProfileMenuOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-200 hover:text-white hover:bg-white/[0.06] transition-colors"
                      >
                        <UserIcon className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>프로필 · 관심사 설정</span>
                      </Link>
                      <Link
                        href="/other/settings"
                        onClick={() => setProfileMenuOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-200 hover:text-white hover:bg-white/[0.06] transition-colors"
                      >
                        <Settings className="w-4 h-4 text-slate-400 shrink-0" />
                        <span>계정 · 알림 · 보안 설정</span>
                      </Link>
                      <Link
                        href="/other/gift-aid"
                        onClick={() => setProfileMenuOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-200 hover:text-white hover:bg-white/[0.06] transition-colors"
                      >
                        <Gift className="w-4 h-4 text-amber-400 shrink-0" />
                        <span>내 기부 · Gift Aid</span>
                      </Link>
                      <Link
                        href="/other/tax"
                        onClick={() => setProfileMenuOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-200 hover:text-white hover:bg-white/[0.06] transition-colors"
                      >
                        <FileSpreadsheet className="w-4 h-4 text-indigo-400 shrink-0" />
                        <span>거래 내역 · 세무 자료</span>
                      </Link>
                      <Link
                        href="/other/support"
                        onClick={() => setProfileMenuOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-200 hover:text-white hover:bg-white/[0.06] transition-colors"
                      >
                        <HelpCircle className="w-4 h-4 text-slate-400 shrink-0" />
                        <span>고객지원 · FAQ</span>
                      </Link>
                    </div>

                    <div className="my-1.5 border-t border-white/[0.07]" />

                    <button
                      type="button"
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-300 hover:text-rose-200 hover:bg-rose-500/10 transition-colors"
                    >
                      <LogOut className="w-4 h-4 shrink-0" />
                      <span>로그아웃</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link
                  href={loginHref}
                  className="px-3.5 py-1.5 text-slate-300 hover:text-white transition-colors text-xs font-semibold whitespace-nowrap shrink-0"
                >
                  로그인
                </Link>
                <Link
                  href={signupHref}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 whitespace-nowrap shrink-0 ${currentDomainMeta.tones.primaryButton}`}
                >
                  회원가입
                </Link>
              </>
            )}
          </div>

          {/* Mobile: Hamburger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="모바일 메뉴 열기"
            className="md:hidden text-slate-300 p-2 rounded-xl bg-slate-900 border border-slate-800 shrink-0"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* ==================== Row 2: 도메인 중분류 카테고리 + 우측 PMP/PMC 잔액 ==================== */}
        <div className="hidden md:flex items-center justify-between h-[42px] border-b border-white/[0.04] gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar min-w-0">
            {Object.entries(currentCategories).map(([categoryKey, category]) => {
              const isSelected = selectedCategory === categoryKey;
              return (
                <Link
                  key={categoryKey}
                  href={category.href}
                  prefetch={true}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all duration-200 whitespace-nowrap shrink-0 border ${
                    isSelected
                      ? currentDomainMeta.tones.row2Active
                      : `text-slate-400 border-transparent ${currentDomainMeta.tones.row2Hover}`
                  }`}
                >
                  {category.title}
                </Link>
              );
            })}
          </div>

          {/* PMP / PMC 잔액 위젯 (Row 2 우측에 여유롭게 배치) */}
          <CompactBalanceWidget
            activeAssetType={currentDomainMeta.assetType}
            user={user}
            authResolved={authResolved}
            className="shrink-0 pl-3 border-l border-white/[0.06]"
          />
        </div>

        {/* ==================== Row 3: 소분류 필터 칩 (Tone-on-Tone Soft Layer) ==================== */}
        <div className="hidden md:flex items-center justify-between h-[36px]">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {currentSubcategories.map((subcategory, index) => {
              const active = checkSubcategoryActive(
                subcategory.path,
                currentSubcategories,
                pathname,
                searchParamsString
              );
              return (
                <Link
                  key={`${subcategory.path}-${index}`}
                  href={subcategory.path}
                  prefetch={true}
                  className={`px-2.5 py-0.5 text-[11px] rounded-md transition-all duration-200 flex items-center gap-1.5 whitespace-nowrap shrink-0 border ${
                    active
                      ? currentDomainMeta.tones.row3Active
                      : `text-slate-400 border-transparent ${currentDomainMeta.tones.row3Hover}`
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full transition-opacity ${
                      active
                        ? `${currentDomainMeta.tones.row3Dot} opacity-100`
                        : "bg-slate-600 opacity-40"
                    }`}
                  />
                  <span>{subcategory.title}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* ==================== Mobile Menu ==================== */}
      {mobileOpen && (
        <div className="md:hidden bg-[#090b12]/98 backdrop-blur-2xl border-t border-white/10 max-h-[82vh] overflow-y-auto">
          <div className="px-4 py-4 space-y-4">
            {/* Mobile: PMP / PMC 잔액 */}
            {user && (
              <div className="pb-2 border-b border-slate-800/80">
                <CompactBalanceWidget
                  activeAssetType={currentDomainMeta.assetType}
                  user={user}
                  authResolved={authResolved}
                />
              </div>
            )}

            {/* Mobile: 핵심 도메인 (예측 · 기부 · 포럼) */}
            <div className="space-y-2">
              {PRIMARY_DOMAIN_KEYS.map((domainKey) => {
                const data = navigationData[domainKey];
                const meta = DOMAIN_PHILOSOPHY_MAP[domainKey];
                const isSelected = !isMoreActive && selectedDomain === domainKey;
                return (
                  <div key={domainKey} className="space-y-1">
                    <Link
                      href={data.href}
                      prefetch={true}
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center justify-between px-3 py-2 rounded-xl font-bold text-sm ${
                        isSelected
                          ? meta.tones.row2Active
                          : "text-slate-300 hover:bg-white/5"
                      }`}
                    >
                      <span>{data.title}</span>
                      <span className="text-[10px] font-medium text-slate-400">
                        {meta.assetBadge}
                      </span>
                    </Link>

                    {isSelected && (
                      <div className="flex flex-wrap gap-1.5 pl-3 pt-1 pb-2">
                        {Object.entries(data.categories).map(([catKey, cat]) => (
                          <Link
                            key={catKey}
                            href={cat.href}
                            onClick={() => setMobileOpen(false)}
                            className={`px-2.5 py-1 rounded-lg text-xs ${
                              selectedCategory === catKey
                                ? meta.tones.row3Active
                                : "bg-slate-900 text-slate-400"
                            }`}
                          >
                            {cat.title}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Mobile: 기타 메뉴 (소비 · 랭킹 · LIVE · 맞짱 · 프렌즈 · 기타 서비스) */}
            <div className="pt-2 border-t border-slate-800 space-y-2">
              <div className="px-1 text-[11px] font-bold text-slate-500">기타 메뉴</div>
              <div className="grid grid-cols-2 gap-1.5">
                {MORE_MENU_GROUPS.flatMap((group) => group.items).map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-900/80 border border-white/[0.06] text-xs font-semibold text-slate-200 hover:bg-slate-800"
                  >
                    <span>{item.icon}</span>
                    <span className="truncate">{item.title}</span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Mobile: 프로필 / 인증 */}
            <div className="pt-2 border-t border-slate-800 space-y-2">
              <a
                href="/healing-room"
                target="_blank"
                rel="noopener noreferrer"
                onClick={(event) => {
                  setMobileOpen(false);
                  handleOpenHealingRoom(event);
                }}
                className="block w-full px-4 py-2 bg-gradient-to-r from-sky-500/20 via-indigo-500/20 to-purple-500/20 border border-sky-400/40 text-sky-200 rounded-xl text-center text-xs font-bold"
              >
                PosMul 힐링룸 (새 창)
              </a>
              {user ? (
                <div className="space-y-2">
                  <div className="px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-400/30 text-xs font-bold text-emerald-200 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                    <span className="truncate">
                      {resolvedUserLabel} 님 {user.email ? `(${user.email})` : ""}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Link
                      href="/dashboard"
                      onClick={() => setMobileOpen(false)}
                      className="block px-4 py-2 bg-slate-800 text-slate-200 rounded-xl text-center text-xs font-semibold"
                    >
                      내 대시보드
                    </Link>
                    <Link
                      href="/other/settings"
                      onClick={() => setMobileOpen(false)}
                      className="block px-4 py-2 bg-slate-900 border border-slate-800 text-slate-200 rounded-xl text-center text-xs font-semibold"
                    >
                      프로필 설정
                    </Link>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      void handleSignOut();
                      setMobileOpen(false);
                    }}
                    className="block w-full px-4 py-2 bg-rose-950/50 text-rose-300 rounded-xl text-center text-xs font-semibold"
                  >
                    로그아웃
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <Link
                    href={loginHref}
                    onClick={() => setMobileOpen(false)}
                    className="block px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-center text-xs font-semibold text-slate-200"
                  >
                    로그인
                  </Link>
                  <Link
                    href={signupHref}
                    onClick={() => setMobileOpen(false)}
                    className={`block px-4 py-2 rounded-xl text-center text-xs font-bold ${currentDomainMeta.tones.primaryButton}`}
                  >
                    회원가입
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

export function ThreeRowNavbar(props: ThreeRowNavbarProps) {
  return (
    <Suspense
      fallback={
        <div className="fixed top-0 w-full h-[60px] md:h-[142px] z-50 bg-[#090b12]/90 backdrop-blur-2xl border-b border-white/[0.07]" />
      }
    >
      <ThreeRowNavbarContent {...props} />
    </Suspense>
  );
}
