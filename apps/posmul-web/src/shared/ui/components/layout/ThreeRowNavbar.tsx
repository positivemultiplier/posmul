"use client";

import Link from "next/link";
import { Suspense, useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import { createClient } from "../../../../lib/supabase/client";
import { User } from "@supabase/supabase-js";
import { usePathname, useSearchParams } from "next/navigation";
import { CompactBalanceWidget } from "./CompactBalanceWidget";
import {
  DOMAIN_PHILOSOPHY_MAP,
  ORDERED_DOMAIN_KEYS,
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
        title: "📰 News",
        href: "/forum/news",
        segmentAliases: ["news"],
        subcategories: [
          { title: "전체 뉴스", path: "/forum/news" },
          { title: "정책·법률", path: "/forum/news?category=policy" },
          { title: "경제·재정", path: "/forum/news?category=economy" },
          { title: "사회·복지", path: "/forum/news?category=society" },
        ],
      },
      budget: {
        title: "💰 Budget",
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
        title: "💬 Agora",
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
        title: "🎬 Major League",
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
        title: "🏪 Minor League",
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
        title: "💡 Cloud Funding",
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
          { title: "🔥 인기·핫이슈", path: "/prediction?filter=hot" },
          { title: "💰 고액 상금풀", path: "/prediction?filter=high-pool" },
          { title: "⏰ 마감 임박", path: "/prediction?filter=closing" },
        ],
      },
      economy: {
        title: "📈 경제",
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
        title: "💳 소비예측",
        href: "/prediction/consume",
        segmentAliases: ["consume"],
        subcategories: [
          { title: "소비예측 전체", path: "/prediction/consume" },
          { title: "⏰ TimeConsume", path: "/prediction/consume/time" },
          { title: "💳 MoneyConsume", path: "/prediction/consume/money" },
          { title: "☁️ CloudConsume", path: "/prediction/consume/cloud" },
        ],
      },
      sports: {
        title: "⚽ 스포츠",
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
        title: "🎬 엔터테인먼트",
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
        title: "🗳️ 정치/선거",
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
        title: "💡 시민 제안",
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
        title: "📦 K-물품 기부",
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
        title: "🏛️ 기관 기부",
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
        title: "🌟 오피니언 리더",
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
        title: "🔮 예측 명사수",
        href: "/ranking?category=expect",
        subcategories: [
          { title: "전국 명예의 전당", path: "/ranking?category=expect" },
          { title: "서울특별시", path: "/ranking?category=expect&sido=서울특별시" },
          { title: "경기도", path: "/ranking?category=expect&sido=경기도" },
          { title: "부산광역시", path: "/ranking?category=expect&sido=부산광역시" },
        ],
      },
      overall: {
        title: "🏆 종합 시민",
        href: "/ranking?category=overall",
        subcategories: [
          { title: "전국 종합", path: "/ranking?category=overall" },
          { title: "서울특별시", path: "/ranking?category=overall&sido=서울특별시" },
          { title: "경기도", path: "/ranking?category=overall&sido=경기도" },
          { title: "부산광역시", path: "/ranking?category=overall&sido=부산광역시" },
        ],
      },
      forum: {
        title: "💬 공론 기여",
        href: "/ranking?category=forum",
        subcategories: [
          { title: "PMP 공론 랭킹", path: "/ranking?category=forum" },
          { title: "서울특별시", path: "/ranking?category=forum&sido=서울특별시" },
          { title: "경기도", path: "/ranking?category=forum&sido=경기도" },
        ],
      },
      consume: {
        title: "💳 상생 소비",
        href: "/ranking?category=consume",
        subcategories: [
          { title: "PMC 소비 랭킹", path: "/ranking?category=consume" },
          { title: "서울특별시", path: "/ranking?category=consume&sido=서울특별시" },
          { title: "경기도", path: "/ranking?category=consume&sido=경기도" },
        ],
      },
      donation: {
        title: "❤️ 나눔 리더",
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
        title: "🎁 Gift Aid",
        href: "/other/gift-aid",
        segmentAliases: ["gift-aid", "giftaid"],
        subcategories: [
          { title: "기부 내역", path: "/other/gift-aid" },
          { title: "영수증 발급", path: "/other/gift-aid?tab=receipt" },
          { title: "세액공제 계산", path: "/other/gift-aid?tab=calculator" },
        ],
      },
      tax: {
        title: "📊 세무·회계",
        href: "/other/tax",
        segmentAliases: ["tax"],
        subcategories: [
          { title: "거래 내역", path: "/other/tax" },
          { title: "수익 명세서", path: "/other/tax?tab=statement" },
          { title: "세무 자료", path: "/other/tax?tab=tax-docs" },
        ],
      },
      support: {
        title: "💬 고객지원",
        href: "/other/support",
        segmentAliases: ["support"],
        subcategories: [
          { title: "FAQ", path: "/other/support" },
          { title: "1:1 문의", path: "/other/support?tab=contact" },
          { title: "이용 가이드", path: "/other/support?tab=guide" },
        ],
      },
      settings: {
        title: "⚙️ 설정",
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

function ThreeRowNavbarContent({ hideNav = false }: ThreeRowNavbarProps) {
  const [user, setUser] = useState<User | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  const pathname = usePathname() || "/";
  const searchParams = useSearchParams();
  const searchParamsString = searchParams?.toString() || "";
  const supabase = createClient();

  const { domain: selectedDomain, categoryKey: selectedCategory } =
    resolveDomainAndCategory(pathname, searchParamsString);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
    };

    getUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
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

  if (hideNav || pathname.startsWith("/healing-room")) return null;

  const currentDomainMeta = DOMAIN_PHILOSOPHY_MAP[selectedDomain];
  const currentCategories = navigationData[selectedDomain].categories;
  const currentSubcategories =
    currentCategories[selectedCategory]?.subcategories ?? [];

  return (
    <header className="fixed top-0 w-full z-50 bg-[#090b12]/90 backdrop-blur-2xl border-b border-white/[0.07] shadow-[0_6px_30px_rgba(0,0,0,0.6)]">
      {/* 상단 도메인 앰비언트 라이트 라인 (Tone-on-Tone) */}
      <div
        className={`pointer-events-none absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r ${currentDomainMeta.tones.ambientGlow}`}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* ==================== Row 1: Logo + Citizen Flywheel Domains + Balance/Auth ==================== */}
        <div className="flex justify-between items-center h-[60px] border-b border-white/[0.05]">
          {/* Brand Logo */}
          <div className="flex items-center gap-5">
            <Link
              href="/"
              className="flex items-center gap-2 group focus:outline-none"
            >
              <span className="text-2xl font-black bg-gradient-to-r from-sky-300 via-indigo-300 to-purple-300 bg-clip-text text-transparent tracking-tight">
                PosMul
              </span>
            </Link>

            {/* Desktop: Row 1 메인 도메인 (시민 선순환 순서: 포럼 ➔ 소비 ➔ 예측 ➔ 기부 ➔ 랭킹 | 기타) */}
            <nav
              aria-label="주요 도메인 네비게이션"
              className="hidden md:flex items-center gap-1"
            >
              {ORDERED_DOMAIN_KEYS.map((domainKey, idx) => {
                const data = navigationData[domainKey];
                const meta = DOMAIN_PHILOSOPHY_MAP[domainKey];
                const isSelected = selectedDomain === domainKey;
                const showCycleArrow = idx < 4; // 포럼 ➔ 소비 ➔ 예측 ➔ 기부 ➔ 랭킹 흐름 표시

                return (
                  <div key={domainKey} className="flex items-center">
                    {domainKey === "other" && (
                      <div className="h-4 w-px bg-white/10 mx-1.5" />
                    )}
                    <Link
                      href={data.href}
                      prefetch={true}
                      className={`px-3 py-1.5 rounded-xl transition-all duration-200 flex items-center gap-1.5 ${
                        isSelected
                          ? meta.tones.row1Active
                          : "text-slate-400 hover:text-slate-100 hover:bg-white/[0.04] border border-transparent"
                      }`}
                    >
                      <span className="text-xs font-bold tracking-tight">
                        {data.title}
                      </span>
                    </Link>
                  </div>
                );
              })}

              {/* 🔴 LIVE (응원톡) 눈에 띄는 화려한 뱃지 */}
              <Link
                href="/live"
                className="ml-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-orange-500 hover:from-red-500 hover:to-orange-400 text-white text-xs font-black shadow-lg shadow-red-500/25 border border-red-400/40 hover:scale-105 transition-all animate-pulse"
              >
                <span className="w-2 h-2 rounded-full bg-white" />
                <span>LIVE</span>
              </Link>

              {/* 🥊 맞짱 내기 챌린지 뱃지 */}
              <Link
                href="/challenge"
                className="ml-1.5 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 text-xs font-black shadow-lg shadow-amber-500/20 border border-amber-400/40 hover:scale-105 transition-all"
              >
                <span>🥊</span>
                <span>맞짱</span>
              </Link>
            </nav>
          </div>

          {/* Desktop: Balance Widget + Auth */}
          <div className="hidden md:flex items-center gap-2.5">
            <CompactBalanceWidget activeAssetType={currentDomainMeta.assetType} />

            {user ? (
              <>
                <a
                  href="/healing-room"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={handleOpenHealingRoom}
                  className="px-3 py-1.5 bg-gradient-to-r from-sky-500/20 via-indigo-500/20 to-purple-500/20 hover:from-sky-500/30 hover:to-purple-500/30 text-sky-200 rounded-xl transition-all duration-200 border border-sky-400/40 text-xs font-semibold flex items-center gap-1"
                >
                  <span>🏡 힐링룸</span>
                </a>
                <Link
                  href="/dashboard"
                  className="px-3 py-1.5 bg-slate-900/90 hover:bg-slate-800 text-slate-200 rounded-xl transition-all duration-200 border border-slate-700/60 text-xs font-semibold flex items-center gap-1"
                >
                  <span>📊 내 대시보드</span>
                </Link>
                <Link
                  href="/dashboard?onboarding=1"
                  title="개인맞춤 설정"
                  className="w-7 h-7 rounded-full bg-slate-800 hover:bg-blue-600/40 border border-slate-700 hover:border-blue-400/50 flex items-center justify-center text-xs font-bold text-slate-200 transition-colors"
                >
                  {user.email?.[0]?.toUpperCase() ?? "U"}
                </Link>
                <button
                  onClick={handleSignOut}
                  className="px-2.5 py-1.5 bg-rose-950/30 hover:bg-rose-900/50 text-rose-300 rounded-xl transition-all duration-200 border border-rose-800/30 text-xs font-medium"
                >
                  로그아웃
                </button>
              </>
            ) : (
              <>
                <a
                  href="/healing-room"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={handleOpenHealingRoom}
                  className="px-2.5 py-1.5 bg-gradient-to-r from-sky-500/15 to-indigo-500/20 hover:from-sky-500/25 hover:to-indigo-500/30 text-sky-200 rounded-xl border border-sky-400/35 transition-colors text-xs font-semibold"
                >
                  🏡 힐링룸
                </a>
                <Link
                  href="/dashboard"
                  className="px-2.5 py-1.5 bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl border border-slate-800 transition-colors text-xs font-semibold"
                >
                  📊 MY
                </Link>
                <Link
                  href="/auth/login"
                  className="px-3 py-1.5 text-slate-300 hover:text-white transition-colors text-xs font-semibold"
                >
                  로그인
                </Link>
                <Link
                  href="/auth/signup"
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 ${currentDomainMeta.tones.primaryButton}`}
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
            className="md:hidden text-slate-300 p-2 rounded-xl bg-slate-900 border border-slate-800"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* ==================== Row 2: 도메인 중분류 카테고리 (Tone-on-Tone Mid Layer) ==================== */}
        <div className="hidden md:flex items-center justify-between h-[42px] border-b border-white/[0.04]">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {Object.entries(currentCategories).map(([categoryKey, category]) => {
              const isSelected = selectedCategory === categoryKey;
              return (
                <Link
                  key={categoryKey}
                  href={category.href}
                  prefetch={true}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all duration-200 whitespace-nowrap border ${
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
                  className={`px-2.5 py-0.5 text-[11px] rounded-md transition-all duration-200 flex items-center gap-1.5 whitespace-nowrap border ${
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
        <div className="md:hidden bg-[#090b12]/98 backdrop-blur-2xl border-t border-white/10">
          <div className="px-4 py-4 space-y-3">
            {/* Mobile: Domains & Categories */}
            <div className="space-y-2">
              {ORDERED_DOMAIN_KEYS.map((domainKey) => {
                const data = navigationData[domainKey];
                const meta = DOMAIN_PHILOSOPHY_MAP[domainKey];
                const isSelected = selectedDomain === domainKey;
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

            {/* Mobile: Auth */}
            <div className="pt-2 border-t border-slate-800 space-y-2">
              <a
                href="/healing-room"
                target="_blank"
                rel="noopener noreferrer"
                onClick={(event) => {
                  setMobileOpen(false);
                  handleOpenHealingRoom(event);
                }}
                className="mb-2 block w-full px-4 py-2 bg-gradient-to-r from-sky-500/20 via-indigo-500/20 to-purple-500/20 border border-sky-400/40 text-sky-200 rounded-xl text-center text-xs font-bold"
              >
                🏡 PosMul 힐링룸 미니홈피 (새 창)
              </a>
              {user ? (
                <div className="grid grid-cols-2 gap-2">
                  <Link
                    href="/dashboard"
                    onClick={() => setMobileOpen(false)}
                    className="block px-4 py-2 bg-slate-800 text-slate-200 rounded-xl text-center text-xs font-semibold"
                  >
                    대시보드
                  </Link>
                  <button
                    onClick={() => {
                      handleSignOut();
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
                    href="/auth/login"
                    onClick={() => setMobileOpen(false)}
                    className="block px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-center text-xs font-semibold text-slate-200"
                  >
                    로그인
                  </Link>
                  <Link
                    href="/auth/signup"
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
