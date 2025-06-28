"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

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

// 메인 도메인 데이터
const mainDomains: MainDomain[] = [
  { id: "investment", label: "Investment", href: "/investment", icon: "📈" },
  { id: "prediction", label: "Prediction", href: "/prediction", icon: "📊" },
  { id: "donation", label: "Donation", href: "/donation", icon: "❤️" },
  { id: "forum", label: "Forum", href: "/forum", icon: "💬" },
  { id: "ranking", label: "Ranking", href: "/dashboard", icon: "🏆" },
];

// 예측 도메인 카테고리
const predictionCategories: Category[] = [
  { id: "all", label: "📊 All", count: 342 },
  { id: "hot", label: "🔥 Hot", count: 23, isHot: true },
  { id: "investment", label: "💼 Investment", count: 67 },
  { id: "sports", label: "⚽ Sports", count: 89 },
  { id: "entertainment", label: "🎭 Entertainment", count: 45 },
  { id: "politics", label: "🏛️ Politics", count: 18 },
  { id: "user-suggest", label: "💡 User Suggest", count: 34 },
];

// 투자 도메인 카테고리
const investmentCategories: Category[] = [
  { id: "all", label: "💰 All", count: 156 },
  { id: "local-league", label: "🏪 Local League", count: 45 },
  { id: "major-league", label: "🏢 Major League", count: 67 },
  { id: "cloud-funding", label: "☁️ Cloud Funding", count: 34 },
  { id: "common", label: "⚙️ 공통 기능", count: 10 },
];

// 기부 도메인 카테고리
const donationCategories: Category[] = [
  { id: "all", label: "❤️ All", count: 89 },
  { id: "direct", label: "🤝 직접 기부", count: 32 },
  { id: "institute", label: "🏛️ 기관 기부", count: 28 },
  { id: "opinion-leader", label: "👑 오피니언 리더", count: 19 },
  { id: "common", label: "⚙️ 공통 기능", count: 10 },
];

// 포럼 도메인 카테고리
const forumCategories: Category[] = [
  { id: "all", label: "💬 All", count: 234 },
  { id: "brainstorming", label: "💡 브레인스토밍", count: 78 },
  { id: "debate", label: "🗣️ 토론", count: 92 },
  { id: "common", label: "⚙️ 공통 기능", count: 64 },
];

// 스포츠 서브카테고리
const sportsSubCategories: SubCategory[] = [
  { id: "all", label: "⚽ All", count: 89 },
  { id: "esports", label: "🎮 esports", count: 13 },
  { id: "soccer", label: "⚽ soccer", count: 20 },
  { id: "baseball", label: "⚾ baseball", count: 15 },
  { id: "basketball", label: "🏀 basketball", count: 5 },
  { id: "etc", label: "🏃 etc", count: 36 },
];

// Local League 서브카테고리
const localLeagueSubCategories: SubCategory[] = [
  { id: "all", label: "🏪 All", count: 45 },
  { id: "retail", label: "🛍️ 소매업", count: 15 },
  { id: "restaurant", label: "🍽️ 음식점", count: 12 },
  { id: "service", label: "🔧 서비스업", count: 10 },
  { id: "manufacturing", label: "🏭 제조업", count: 8 },
];

// Major League 서브카테고리
const majorLeagueSubCategories: SubCategory[] = [
  { id: "all", label: "🏢 All", count: 67 },
  { id: "tech", label: "💻 기술주", count: 25 },
  { id: "finance", label: "🏦 금융", count: 18 },
  { id: "healthcare", label: "🏥 헬스케어", count: 12 },
  { id: "energy", label: "⚡ 에너지", count: 12 },
];

export default function Navbar({
  economicBalance,
  isAuthenticated,
}: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();

  // URL 기반 상태 계산 (기존 useState 제거)
  const currentDomain =
    mainDomains.find((domain) => pathname.startsWith(domain.href))?.id ||
    "prediction";

  // 도메인별 카테고리 데이터 가져오기
  const getCurrentCategories = (): Category[] => {
    switch (currentDomain) {
      case "prediction":
        return predictionCategories;
      case "investment":
        return investmentCategories;
      case "donation":
        return donationCategories;
      case "forum":
        return forumCategories;
      default:
        return [];
    }
  };

  // URL에서 카테고리 추출 (모든 도메인 지원)
  const getActiveCategory = (): string => {
    const pathParts = pathname.split("/");
    if (pathParts.length >= 3) {
      const category = pathParts[2]; // /domain/category/... → 'category'
      const currentCategories = getCurrentCategories();
      return currentCategories.find((cat) => cat.id === category)?.id || "all";
    }
    return "all";
  };

  // URL에서 서브카테고리 추출 (확장 가능)
  const getActiveSubCategory = (): string => {
    const pathParts = pathname.split("/");
    if (pathParts.length >= 4) {
      const subCategory = pathParts[3]; // /domain/category/subcategory/... → 'subcategory'

      // 도메인과 카테고리에 따른 서브카테고리 결정
      if (pathname.startsWith("/prediction/sports")) {
        return (
          sportsSubCategories.find((sub) => sub.id === subCategory)?.id || "all"
        );
      } else if (pathname.startsWith("/investment/local-league")) {
        return (
          localLeagueSubCategories.find((sub) => sub.id === subCategory)?.id ||
          "all"
        );
      } else if (pathname.startsWith("/investment/major-league")) {
        return (
          majorLeagueSubCategories.find((sub) => sub.id === subCategory)?.id ||
          "all"
        );
      }
    }
    return "all";
  };

  // 현재 서브카테고리 데이터 가져오기
  const getCurrentSubCategories = (): SubCategory[] => {
    if (currentDomain === "prediction" && activeCategory === "sports") {
      return sportsSubCategories;
    } else if (
      currentDomain === "investment" &&
      activeCategory === "local-league"
    ) {
      return localLeagueSubCategories;
    } else if (
      currentDomain === "investment" &&
      activeCategory === "major-league"
    ) {
      return majorLeagueSubCategories;
    }
    return [];
  };

  const activeCategory = getActiveCategory();
  const activeSubCategory = getActiveSubCategory();
  const currentCategories = getCurrentCategories();
  const currentSubCategories = getCurrentSubCategories();

  // 카테고리 탭을 표시할지 결정
  const shouldShowCategories = currentCategories.length > 0;

  // 서브카테고리 탭을 표시할지 결정
  const shouldShowSubCategories = currentSubCategories.length > 0;

  // 카테고리 클릭 핸들러 - 실제 라우팅 (모든 도메인 지원)
  const handleCategoryClick = (categoryId: string) => {
    const domainPath = `/${currentDomain}`;
    if (categoryId === "all") {
      router.push(domainPath);
    } else {
      router.push(`${domainPath}/${categoryId}`);
    }
  };

  // 서브카테고리 클릭 핸들러 - 실제 라우팅 (확장 가능)
  const handleSubCategoryClick = (subCategoryId: string) => {
    const basePath = `/${currentDomain}/${activeCategory}`;
    if (subCategoryId === "all") {
      router.push(basePath);
    } else {
      router.push(`${basePath}/${subCategoryId}`);
    }
  };

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
          {/* Economic Balance */}
          <div className="hidden sm:flex items-center space-x-3 px-3 py-1 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-1">
              <span className="text-sm">🪙</span>
              <span className="text-xs font-medium">
                {economicBalance.pmp.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center space-x-1">
              <span className="text-sm">💎</span>
              <span className="text-xs font-medium">
                {economicBalance.pmc.toLocaleString()}
              </span>
            </div>
          </div>

          {/* User Actions */}
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
        </div>
      </div>

      {/* Level 2: Domain Categories (카테고리가 있는 모든 도메인에서 표시) */}
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

      {/* Level 3: Sub Categories (서브카테고리가 있을 때 표시) */}
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
