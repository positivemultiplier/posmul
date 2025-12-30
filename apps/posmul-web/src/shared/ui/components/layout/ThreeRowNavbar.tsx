"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { ChevronRightIcon, Menu, X } from "lucide-react";
import { createClient } from "../../../../lib/supabase/client";
import { User } from "@supabase/supabase-js";
import { useRouter, usePathname } from "next/navigation";
import { JourneyBarContainer } from "./JourneyBarContainer";
import { CompactBalanceWidget } from "./CompactBalanceWidget";

type ThreeRowNavbarProps = {
  hideNav?: boolean;
};

// 프로젝트 문서 기반 3단 네비게이션 구조
const navigationData = {
  consume: {
    title: "소비",
    href: "/consume",
    categories: {
      major: {
        title: "🎬 Major League",
        href: "/consume/major-league",
        subcategories: [
          { title: "오늘의 추천", path: "/consume/major-league" },
          { title: "광고 시청", path: "/consume/major-league?type=video" },
          { title: "설문 참여", path: "/consume/major-league?type=survey" },
        ]
      },
      minor: {
        title: "🏪 Minor League",
        href: "/consume/minor-league",
        subcategories: [
          { title: "전체 상점", path: "/consume/minor-league" },
          { title: "카페", path: "/consume/minor-league?category=cafe" },
          { title: "음식점", path: "/consume/minor-league?category=restaurant" },
          { title: "서점", path: "/consume/minor-league?category=bookstore" },
        ]
      },
      cloud: {
        title: "💡 Cloud Funding",
        href: "/consume/cloud-funding",
        subcategories: [
          { title: "전체 프로젝트", path: "/consume/cloud-funding" },
          { title: "창업", path: "/consume/cloud-funding?category=startup" },
          { title: "출판", path: "/consume/cloud-funding?category=publish" },
          { title: "농업", path: "/consume/cloud-funding?category=agriculture" },
        ]
      }
    }
  },
  prediction: {
    title: "예측",
    href: "/prediction",
    categories: {
      consume: {
        title: "소비",
        href: "/prediction/consume",
        subcategories: [
          { title: "⏰ TimeConsume", path: "/prediction/consume/time" },
          { title: "💳 MoneyConsume", path: "/prediction/consume/money" },
          { title: "☁️ CloudConsume", path: "/prediction/consume/cloud" },
        ]
      },
      sports: {
        title: "스포츠",
        href: "/prediction/sports",
        subcategories: [
          { title: "축구", path: "/prediction/sports/soccer" },
          { title: "야구", path: "/prediction/sports/baseball" },
          { title: "농구", path: "/prediction/sports/basketball" },
          { title: "e스포츠", path: "/prediction/sports/esports" },
        ]
      },
      entertainment: {
        title: "엔터테인먼트",
        href: "/prediction/entertainment",
        subcategories: [
          { title: "영화", path: "/prediction/entertainment/movies" },
          { title: "드라마", path: "/prediction/entertainment/dramas" },
          { title: "음악", path: "/prediction/entertainment/music" },
          { title: "시상식", path: "/prediction/entertainment/awards" },
        ]
      },
      politics: {
        title: "정치/선거",
        href: "/prediction/politics",
        subcategories: [
          { title: "국가 선거", path: "/prediction/politics/national-elections" },
          { title: "지역 선거", path: "/prediction/politics/local-elections" },
          { title: "정책 변화", path: "/prediction/politics/policy-changes" },
        ]
      },
      "user-suggestions": {
        title: "사용자 제안",
        href: "/prediction/user-suggestions",
        subcategories: [
          { title: "사용자 제안", path: "/prediction/user-suggestions/user-proposals" },
          { title: "AI 추천", path: "/prediction/user-suggestions/ai-recommendations" },
          { title: "오피니언 리더", path: "/prediction/user-suggestions/opinion-leader-suggestions" },
        ]
      }
    }
  },
  donation: {
    title: "기부",
    href: "/donation",
    categories: {
      direct: {
        title: "직접 기부",
        href: "/donation/direct",
        subcategories: [
          { title: "의류", path: "/donation/direct?category=clothing" },
          { title: "식품", path: "/donation/direct?category=food" },
          { title: "주거", path: "/donation/direct?category=housing" },
          { title: "의료", path: "/donation/direct?category=medical" },
        ]
      },
      institute: {
        title: "기관 기부",
        href: "/donation/institute",
        subcategories: [
          { title: "긴급구호", path: "/donation/institute?type=emergency" },
          { title: "아동복지", path: "/donation/institute?type=children" },
          { title: "환경보호", path: "/donation/institute?type=environment" },
          { title: "교육지원", path: "/donation/institute?type=education" },
        ]
      },
      opinion: {
        title: "오피니언 리더",
        href: "/donation/opinion-leader",
        subcategories: [
          { title: "환경", path: "/donation/opinion-leader?field=environment" },
          { title: "복지", path: "/donation/opinion-leader?field=welfare" },
          { title: "과학", path: "/donation/opinion-leader?field=science" },
          { title: "인권", path: "/donation/opinion-leader?field=human-rights" },
        ]
      }
    }
  },
  forum: {
    title: "포럼",
    href: "/forum",
    categories: {
      news: {
        title: "📰 News",
        href: "/forum/news",
        subcategories: [
          { title: "전체 뉴스", path: "/forum/news" },
          { title: "정책·법률", path: "/forum/news?category=policy" },
          { title: "경제·재정", path: "/forum/news?category=economy" },
          { title: "사회·복지", path: "/forum/news?category=society" },
        ]
      },
      budget: {
        title: "💰 Budget",
        href: "/forum/budget",
        subcategories: [
          { title: "예산 감시", path: "/forum/budget" },
          { title: "국가 예산", path: "/forum/budget?level=national" },
          { title: "지역 예산", path: "/forum/budget?level=regional" },
          { title: "이슈 리포트", path: "/forum/budget?type=report" },
        ]
      },
      agora: {
        title: "💬 Agora",
        href: "/forum/agora",
        subcategories: [
          { title: "공론장", path: "/forum/agora" },
          { title: "브레인스토밍", path: "/forum/agora?type=brainstorm" },
          { title: "정책 토론", path: "/forum/agora?type=debate" },
          { title: "시민 제안", path: "/forum/agora?type=proposal" },
        ]
      }
    }
  },
  ranking: {
    title: "랭킹",
    href: "/ranking",
    categories: {
      overall: {
        title: "🏆 종합",
        href: "/ranking?category=overall",
        subcategories: [
          { title: "전체 기간", path: "/ranking?category=overall&period=all" },
          { title: "이번 달", path: "/ranking?category=overall&period=monthly" },
          { title: "이번 주", path: "/ranking?category=overall&period=weekly" },
        ]
      },
      forum: {
        title: "💬 Forum",
        href: "/ranking?category=forum",
        subcategories: [
          { title: "PMP 획득", path: "/ranking?category=forum&period=all" },
          { title: "글 작성", path: "/ranking?category=forum&type=posts" },
          { title: "댓글", path: "/ranking?category=forum&type=comments" },
        ]
      },
      consume: {
        title: "💳 Consume",
        href: "/ranking?category=consume",
        subcategories: [
          { title: "PMC 획득", path: "/ranking?category=consume&period=all" },
          { title: "MoneyConsume", path: "/ranking?category=consume&type=money" },
          { title: "CloudConsume", path: "/ranking?category=consume&type=cloud" },
        ]
      },
      donation: {
        title: "❤️ Donation",
        href: "/ranking?category=donation",
        subcategories: [
          { title: "기부 총액", path: "/ranking?category=donation&period=all" },
          { title: "기부 횟수", path: "/ranking?category=donation&type=count" },
          { title: "연속 기부", path: "/ranking?category=donation&type=streak" },
        ]
      }
    }
  },
  other: {
    title: "기타",
    href: "/other",
    categories: {
      giftaid: {
        title: "🎁 Gift Aid",
        href: "/other/gift-aid",
        subcategories: [
          { title: "기부 내역", path: "/other/gift-aid?tab=history" },
          { title: "영수증 발급", path: "/other/gift-aid?tab=receipt" },
          { title: "세액공제 계산", path: "/other/gift-aid?tab=calculator" },
        ]
      },
      tax: {
        title: "📊 Accounting & Tax",
        href: "/other/tax",
        subcategories: [
          { title: "거래 내역", path: "/other/tax?tab=transactions" },
          { title: "명세서", path: "/other/tax?tab=statement" },
          { title: "세무 자료", path: "/other/tax?tab=tax-docs" },
        ]
      },
      support: {
        title: "💬 Support",
        href: "/other/support",
        subcategories: [
          { title: "FAQ", path: "/other/support?tab=faq" },
          { title: "1:1 문의", path: "/other/support?tab=contact" },
          { title: "가이드", path: "/other/support?tab=guide" },
        ]
      },
      settings: {
        title: "⚙️ Settings",
        href: "/other/settings",
        subcategories: [
          { title: "프로필", path: "/other/settings?tab=profile" },
          { title: "알림", path: "/other/settings?tab=notifications" },
          { title: "보안", path: "/other/settings?tab=security" },
        ]
      }
    }
  }
};

// 도메인별 Tone on Tone 컬러 시스템
const domainColors: Record<keyof typeof navigationData, {
  active: string;
  hover: string;
  border: string;
  shadow: string;
  categoryActive: string;
  categoryHover: string;
}> = {
  consume: {
    active: "bg-gradient-to-r from-indigo-600 to-purple-600 text-white",
    hover: "hover:bg-indigo-900/30 hover:text-indigo-300",
    border: "border-indigo-500/50",
    shadow: "shadow-indigo-500/30",
    categoryActive: "bg-indigo-500 text-white",
    categoryHover: "hover:bg-indigo-900/30 hover:text-indigo-300",
  },
  prediction: {
    active: "bg-gradient-to-r from-blue-600 to-cyan-600 text-white",
    hover: "hover:bg-blue-900/30 hover:text-blue-300",
    border: "border-blue-500/50",
    shadow: "shadow-blue-500/30",
    categoryActive: "bg-blue-500 text-white",
    categoryHover: "hover:bg-blue-900/30 hover:text-blue-300",
  },
  donation: {
    active: "bg-gradient-to-r from-purple-600 to-pink-600 text-white",
    hover: "hover:bg-purple-900/30 hover:text-purple-300",
    border: "border-purple-500/50",
    shadow: "shadow-purple-500/30",
    categoryActive: "bg-purple-500 text-white",
    categoryHover: "hover:bg-purple-900/30 hover:text-purple-300",
  },
  forum: {
    active: "bg-gradient-to-r from-emerald-600 to-teal-600 text-white",
    hover: "hover:bg-emerald-900/30 hover:text-emerald-300",
    border: "border-emerald-500/50",
    shadow: "shadow-emerald-500/30",
    categoryActive: "bg-emerald-500 text-white",
    categoryHover: "hover:bg-emerald-900/30 hover:text-emerald-300",
  },
  ranking: {
    active: "bg-gradient-to-r from-amber-600 to-orange-600 text-white",
    hover: "hover:bg-amber-900/30 hover:text-amber-300",
    border: "border-amber-500/50",
    shadow: "shadow-amber-500/30",
    categoryActive: "bg-amber-500 text-white",
    categoryHover: "hover:bg-amber-900/30 hover:text-amber-300",
  },
  other: {
    active: "bg-gradient-to-r from-slate-600 to-gray-600 text-white",
    hover: "hover:bg-slate-900/30 hover:text-slate-300",
    border: "border-slate-500/50",
    shadow: "shadow-slate-500/30",
    categoryActive: "bg-slate-500 text-white",
    categoryHover: "hover:bg-slate-900/30 hover:text-slate-300",
  },
};

function ThreeRowNavbar({ hideNav = false }: ThreeRowNavbarProps) {
  const [user, setUser] = useState<User | null>(null);
  const [selectedDomain, setSelectedDomain] = useState<keyof typeof navigationData>('consume');
  const [selectedCategory, setSelectedCategory] = useState<string>('time');
  const [mobileOpen, setMobileOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

  const getDefaultCategoryKey = (domain: keyof typeof navigationData): string => {
    const keys = Object.keys(navigationData[domain].categories);
    return keys[0] ?? "";
  };

  const isDomainKey = (value: string): value is keyof typeof navigationData => {
    return value in navigationData;
  };

  // 인증 상태 확인
  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
    };

    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // pathname 기반으로 현재 선택 상태 동기화
  useEffect(() => {
    if (!pathname) return;

    const parts = pathname.split("/").filter(Boolean);
    const first = parts[0];

    // Legacy alias: '/invest' currently maps to Consume domain in this navbar
    if (first === "invest" || first === "consume") {
      setSelectedDomain("consume");
      setSelectedCategory("time");
      return;
    }

    if (!first || !isDomainKey(first)) return;

    const domain = first;
    setSelectedDomain(domain);

    const categories = navigationData[domain].categories as Record<string, unknown>;
    const maybeCategoryKey = parts[1];
    const nextCategory =
      maybeCategoryKey && maybeCategoryKey in categories
        ? maybeCategoryKey
        : getDefaultCategoryKey(domain);

    if (nextCategory) setSelectedCategory(nextCategory);
  }, [pathname]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  if (hideNav) return null;

  const currentCategories = navigationData[selectedDomain].categories;
  const currentSubcategories = (currentCategories as any)[selectedCategory]?.subcategories || [];

  const isActiveSubcategory = (path: string): boolean => {
    const basePath = path.split("?")[0] ?? path;
    return pathname === basePath || pathname.startsWith(`${basePath}/`);
  };

  return (
    <div className="fixed top-0 w-full z-50 bg-[#0a0a0f]/90 backdrop-blur-xl border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Row 1: Logo + 메인 도메인 + Auth */}
        <div className="flex justify-between items-center h-16 border-b border-white/10">
          {/* Logo */}
          <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mr-8">
            PosMul
          </Link>

          {/* Desktop: 메인 도메인 (Invest, Prediction, Donation, Forum) */}
          <div className="hidden md:flex items-center space-x-4 flex-1">
            {Object.entries(navigationData).map(([domain, data]) => {
              const colors = domainColors[domain as keyof typeof navigationData];
              const isSelected = selectedDomain === domain;
              return (
                <Link
                  key={domain}
                  href={data.href}
                  onClick={() => {
                    setSelectedDomain(domain as keyof typeof navigationData);
                    setSelectedCategory(Object.keys(data.categories)[0]);
                  }}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${isSelected
                    ? `${colors.active} shadow-lg ${colors.shadow}`
                    : `text-gray-400 ${colors.hover}`
                    }`}
                >
                  {data.title}
                </Link>
              );
            })}
          </div>

          {/* Desktop: Auth Header + Balance Widget */}
          <div className="hidden md:flex items-center gap-3">
            {/* Compact Balance Widget */}
            <CompactBalanceWidget />

            {user ? (
              <>
                <Link
                  href="/dashboard"
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-all duration-200 border border-white/20 text-sm"
                >
                  대시보드
                </Link>
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-400 to-purple-400 flex items-center justify-center text-xs font-bold">
                  {user.email?.[0].toUpperCase()}
                </div>
                <button
                  onClick={handleSignOut}
                  className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg transition-all duration-200 border border-red-500/30 text-sm"
                >
                  로그아웃
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  className="px-4 py-2 text-white hover:text-blue-300 transition-colors text-sm"
                >
                  로그인
                </Link>
                <Link
                  href="/auth/signup"
                  className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg hover:shadow-blue-500/50 transition-all duration-300 font-semibold text-sm"
                >
                  회원가입
                </Link>
              </>
            )}
          </div>

          {/* Mobile: Hamburger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden text-white"
          >
            {mobileOpen ? <X /> : <Menu />}
          </button>
        </div>

        {/* Row 2: 카테고리 (Desktop만) */}
        <div className="hidden md:flex items-center h-12 border-b border-white/10">
          <div className="flex items-center space-x-4">
            {Object.entries(currentCategories).map(([categoryKey, category]) => {
              const colors = domainColors[selectedDomain];
              const isSelected = selectedCategory === categoryKey;
              return (
                <Link
                  key={categoryKey}
                  href={(category as any).href}
                  onClick={() => setSelectedCategory(categoryKey)}
                  className={`px-3 py-1.5 text-sm font-medium rounded-full transition-all duration-200 ${isSelected
                    ? colors.categoryActive
                    : `text-gray-400 ${colors.categoryHover}`
                    }`}
                >
                  {category.title}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Row 3: 서브카테고리 (Desktop만) */}
        <div className="hidden md:flex items-center h-10">
          <div className="flex items-center space-x-4">
            {currentSubcategories.map((subcategory: any, index: number) => {
              const colors = domainColors[selectedDomain];
              const active = isActiveSubcategory(subcategory.path);
              return (
                <Link
                  key={index}
                  href={subcategory.path}
                  className={
                    "px-3 py-1 text-sm font-medium rounded-lg transition-all duration-200 flex items-center " +
                    (active
                      ? `${colors.categoryActive} shadow-sm`
                      : `text-gray-400 ${colors.categoryHover}`)
                  }
                >
                  {subcategory.title}
                  {index < currentSubcategories.length - 1 && (
                    <ChevronRightIcon className={"h-3 w-3 mx-1 " + (active ? "text-white/80" : "text-gray-500")} />
                  )}
                </Link>
              );
            })}
          </div>
        </div>

      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden bg-[#1a1a2e] border-t border-white/10">
          <div className="px-4 py-4 space-y-4">
            {/* Mobile: Domains */}
            {Object.entries(navigationData).map(([domain, data]) => (
              <Link
                key={domain}
                href={data.href}
                onClick={() => setMobileOpen(false)}
                className="block text-gray-400 hover:text-white py-2"
              >
                {data.title}
              </Link>
            ))}

            {/* Mobile: Auth */}
            <div className="pt-4 border-t border-white/10 space-y-3">
              {user ? (
                <>
                  <Link
                    href="/dashboard"
                    onClick={() => setMobileOpen(false)}
                    className="block px-4 py-2 bg-white/10 rounded-lg text-center"
                  >
                    대시보드
                  </Link>
                  <button
                    onClick={() => { handleSignOut(); setMobileOpen(false); }}
                    className="block w-full px-4 py-2 bg-red-500/20 text-red-300 rounded-lg text-center"
                  >
                    로그아웃
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/auth/login"
                    onClick={() => setMobileOpen(false)}
                    className="block px-4 py-2 text-center text-white"
                  >
                    로그인
                  </Link>
                  <Link
                    href="/auth/signup"
                    onClick={() => setMobileOpen(false)}
                    className="block px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg text-center font-semibold"
                  >
                    회원가입
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Journey Bar - 추후 Row1에 통합 예정 */}
      {/* <JourneyBarContainer /> */}
    </div>
  );
}

export { ThreeRowNavbar };
