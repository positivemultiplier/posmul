"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { memo, useMemo, useCallback } from "react";

interface EconomicBalance {
  pmp: number;
  pmc: number;
}

interface NavbarProps {
  economicBalance: EconomicBalance;
  isAuthenticated: boolean;
}

interface MainDomain {
  id: string;
  label: string;
  href: string;
  icon: string;
}

interface Category {
  id: string;
  label: string;
  count: number;
  isHot?: boolean;
}

interface SubCategory {
  id: string;
  label: string;
  count: number;
}

// 메인 도메인 데이터 (상수로 메모이제이션)
const mainDomains: MainDomain[] = [
  { id: "investment", label: "Investment", href: "/investment", icon: "📈" },
  { id: "prediction", label: "Prediction", href: "/prediction", icon: "📊" },
  { id: "donation", label: "Donation", href: "/donation", icon: "❤️" },
  { id: "forum", label: "Forum", href: "/forum", icon: "💬" },
  { id: "ranking", label: "Ranking", href: "/dashboard", icon: "🏆" },
];

// 카테고리 데이터 (상수로 메모이제이션)
const categoryData = {
  prediction: [
    { id: "all", label: "📊 All", count: 342 },
    { id: "hot", label: "🔥 Hot", count: 23, isHot: true },
    { id: "investment", label: "💼 Investment", count: 67 },
    { id: "sports", label: "⚽ Sports", count: 89 },
    { id: "entertainment", label: "🎭 Entertainment", count: 45 },
    { id: "politics", label: "🏛️ Politics", count: 18 },
    { id: "user-suggest", label: "💡 User Suggest", count: 34 },
  ],
  investment: [
    { id: "all", label: "💰 All", count: 156 },
    { id: "local-league", label: "🏪 Local League", count: 45 },
    { id: "major-league", label: "🏢 Major League", count: 67 },
    { id: "cloud-funding", label: "☁️ Cloud Funding", count: 34 },
    { id: "common", label: "⚙️ 공통 기능", count: 10 },
  ],
  donation: [
    { id: "all", label: "❤️ All", count: 89 },
    { id: "direct", label: "🤝 직접 기부", count: 32 },
    { id: "institute", label: "🏛️ 기관 기부", count: 28 },
    { id: "opinion-leader", label: "👑 오피니언 리더", count: 19 },
    { id: "common", label: "⚙️ 공통 기능", count: 10 },
  ],
  forum: [
    { id: "all", label: "💬 All", count: 234 },
    { id: "brainstorming", label: "💡 브레인스토밍", count: 78 },
    { id: "debate", label: "🗣️ 토론", count: 92 },
    { id: "common", label: "⚙️ 공통 기능", count: 64 },
  ],
} as const;

// 서브카테고리 데이터 (상수로 메모이제이션)
const subCategoryData = {
  "prediction/sports": [
    { id: "all", label: "⚽ All", count: 89 },
    { id: "esports", label: "🎮 esports", count: 13 },
    { id: "soccer", label: "⚽ soccer", count: 20 },
    { id: "baseball", label: "⚾ baseball", count: 15 },
    { id: "basketball", label: "🏀 basketball", count: 5 },
    { id: "etc", label: "🏃 etc", count: 36 },
  ],
  "investment/local-league": [
    { id: "all", label: "🏪 All", count: 45 },
    { id: "retail", label: "🛍️ 소매업", count: 15 },
    { id: "restaurant", label: "🍽️ 음식점", count: 12 },
    { id: "service", label: "🔧 서비스업", count: 10 },
    { id: "manufacturing", label: "🏭 제조업", count: 8 },
  ],
  "investment/major-league": [
    { id: "all", label: "🏢 All", count: 67 },
    { id: "tech", label: "💻 기술주", count: 25 },
    { id: "finance", label: "🏦 금융", count: 18 },
    { id: "healthcare", label: "🏥 헬스케어", count: 12 },
    { id: "energy", label: "⚡ 에너지", count: 12 },
  ],
} as const;

// 메모이제이션된 컴포넌트들
const EconomicBalance = memo(({ pmp, pmc }: { pmp: number; pmc: number }) => (
  <div className="hidden sm:flex items-center space-x-3 px-3 py-1 bg-gray-50 rounded-lg">
    <div className="flex items-center space-x-1">
      <span className="text-sm">🪙</span>
      <span className="text-xs font-medium">{pmp.toLocaleString()}</span>
    </div>
    <div className="flex items-center space-x-1">
      <span className="text-sm">💎</span>
      <span className="text-xs font-medium">{pmc.toLocaleString()}</span>
    </div>
  </div>
));
EconomicBalance.displayName = "EconomicBalance";

const AuthActions = memo(({ isAuthenticated }: { isAuthenticated: boolean }) => (
  <div className="flex items-center space-x-2">
    {isAuthenticated ? (
      <button className="p-1 text-gray-600 hover:text-gray-900 rounded-md hover:bg-gray-100">
        <span className="text-sm">👤</span>
      </button>
    ) : (
      <div className="flex items-center space-x-2">
        <Link
          href="/auth/login"
          className="px-2 py-1 text-xs text-gray-600 hover:text-gray-900"
        >
          Login
        </Link>
        <Link
          href="/auth/signup"
          className="px-2 py-1 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Sign Up
        </Link>
      </div>
    )}
  </div>
));
AuthActions.displayName = "AuthActions";

function Navbar({ economicBalance, isAuthenticated }: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();

  // 현재 도메인 계산 (메모이제이션)
  const currentDomain = useMemo(() => {
    return mainDomains.find((domain) => pathname.startsWith(domain.href))?.id || "prediction";
  }, [pathname]);

  // 현재 카테고리 계산 (메모이제이션)
  const activeCategory = useMemo(() => {
    const pathParts = pathname.split("/");
    if (pathParts.length >= 3) {
      const category = pathParts[2];
      const currentCategories = categoryData[currentDomain as keyof typeof categoryData] || [];
      return currentCategories.find((cat) => cat.id === category)?.id || "all";
    }
    return "all";
  }, [pathname, currentDomain]);

  // 현재 서브카테고리 계산 (메모이제이션)
  const activeSubCategory = useMemo(() => {
    const pathParts = pathname.split("/");
    if (pathParts.length >= 4) {
      const subCategory = pathParts[3];
      const key = `${currentDomain}/${activeCategory}` as keyof typeof subCategoryData;
      const subCategories = subCategoryData[key] || [];
      return subCategories.find((sub) => sub.id === subCategory)?.id || "all";
    }
    return "all";
  }, [pathname, currentDomain, activeCategory]);

  // 현재 카테고리 데이터 (메모이제이션)
  const currentCategories = useMemo(() => {
    return categoryData[currentDomain as keyof typeof categoryData] || [];
  }, [currentDomain]);

  // 현재 서브카테고리 데이터 (메모이제이션)
  const currentSubCategories = useMemo(() => {
    const key = `${currentDomain}/${activeCategory}` as keyof typeof subCategoryData;
    return subCategoryData[key] || [];
  }, [currentDomain, activeCategory]);

  // 표시 여부 계산 (메모이제이션)
  const shouldShowCategories = useMemo(() => currentCategories.length > 0, [currentCategories]);
  const shouldShowSubCategories = useMemo(() => currentSubCategories.length > 0, [currentSubCategories]);

  // 이벤트 핸들러 (useCallback으로 메모이제이션)
  const handleCategoryClick = useCallback((categoryId: string) => {
    const domainPath = `/${currentDomain}`;
    if (categoryId === "all") {
      router.push(domainPath);
    } else {
      router.push(`${domainPath}/${categoryId}`);
    }
  }, [currentDomain, router]);

  const handleSubCategoryClick = useCallback((subCategoryId: string) => {
    const basePath = `/${currentDomain}/${activeCategory}`;
    if (subCategoryId === "all") {
      router.push(basePath);
    } else {
      router.push(`${basePath}/${subCategoryId}`);
    }
  }, [currentDomain, activeCategory, router]);

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      {/* Level 1: Main Header */}
      <div className="flex items-center justify-between px-4 h-12">
        {/* Left: Logo + Main Domains */}
        <div className="flex items-center space-x-4">
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-xl">🎯</span>
            <span className="text-lg font-bold text-gray-900">PosMul</span>
          </Link>

          <nav className="hidden md:flex items-center space-x-4">
            {mainDomains.map((domain) => (
              <Link
                key={domain.id}
                href={domain.href}
                className={`flex items-center space-x-1 px-2 py-1 rounded-md text-sm font-medium transition-colors ${
                  currentDomain === domain.id
                    ? "bg-blue-100 text-blue-700"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                }`}
              >
                <span className="text-sm">{domain.icon}</span>
                <span>{domain.label}</span>
              </Link>
            ))}
          </nav>
        </div>

        {/* Right: Economic Info + User Actions */}
        <div className="flex items-center space-x-3">
          <EconomicBalance pmp={economicBalance.pmp} pmc={economicBalance.pmc} />
          <AuthActions isAuthenticated={isAuthenticated} />
        </div>
      </div>

      {/* Level 2: Domain Categories */}
      {shouldShowCategories && (
        <div className="border-t border-gray-100 bg-gray-50">
          <div className="flex items-center space-x-1 px-4 py-1 overflow-x-auto">
            {currentCategories.map((category) => (
              <button
                key={category.id}
                onClick={() => handleCategoryClick(category.id)}
                className={`flex items-center space-x-1 px-2 py-0.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
                  activeCategory === category.id
                    ? "bg-blue-100 text-blue-700"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                }`}
              >
                <span>{category.label}</span>
                <span className="text-xs text-gray-500">{category.count}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Level 3: Sub Categories */}
      {shouldShowSubCategories && (
        <div className="border-t border-gray-100 bg-gray-25">
          <div className="flex items-center space-x-1 px-4 py-1 overflow-x-auto">
            {currentSubCategories.map((subCategory) => (
              <button
                key={subCategory.id}
                onClick={() => handleSubCategoryClick(subCategory.id)}
                className={`flex items-center space-x-1 px-2 py-0.5 rounded text-xs font-medium whitespace-nowrap transition-colors ${
                  activeSubCategory === subCategory.id
                    ? "bg-blue-100 text-blue-700"
                    : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                }`}
              >
                <span>{subCategory.label}</span>
                <span className="text-xs text-gray-400">
                  {subCategory.count}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}

// 메인 컴포넌트 메모이제이션
export default memo(Navbar);
