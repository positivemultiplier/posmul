"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronDownIcon, LockClosedIcon } from "@heroicons/react/24/outline";
import { ThemeSwitch } from "../../../../bounded-contexts/prediction/presentation/utils/ThemeSwitch";
import { GeographicNavbar } from "./GeographicNavbar";

type EconomicBalanceProps = {
  pmp: number;
  pmc: number;
};

type FeatureUnlock = {
  isUnlocked: boolean;
  progress?: number;
  requirements?: string[];
};

type UnlockStatus = {
  localInvestment: FeatureUnlock;
  localPrediction: FeatureUnlock;
  localDonation: FeatureUnlock;
  localForum: FeatureUnlock;
};

type NavbarProps = {
  economicBalance?: EconomicBalanceProps;
  isAuthenticated?: boolean;
  unlockStatus?: UnlockStatus;
};

export default function Navbar({
  economicBalance = { pmp: 0, pmc: 0 },
  isAuthenticated = false,
  unlockStatus = {
    localInvestment: { isUnlocked: false, progress: 0, requirements: ["PMP 100 이상", "이메일 인증"] },
    localPrediction: { isUnlocked: false, progress: 30, requirements: ["예측 3회 이상", "정확도 40%"] },
    localDonation: { isUnlocked: false, progress: 60, requirements: ["PMC 200 이상", "신뢰도 레벨 2"] },
    localForum: { isUnlocked: true, progress: 100 },
  }
}: NavbarProps) {
  const [isInvestmentOpen, setIsInvestmentOpen] = useState(false);
  const [isPredictionOpen, setIsPredictionOpen] = useState(false);
  const [isDonationOpen, setIsDonationOpen] = useState(false);
  const [isForumOpen, setIsForumOpen] = useState(false);

  // Unlock 상태에 따른 링크 렌더링
  const renderNavLink = (
    href: string,
    label: string,
    unlockFeature: FeatureUnlock,
    isOpen: boolean,
    setIsOpen: (open: boolean) => void,
    children?: React.ReactNode
  ) => {
    const isUnlocked = unlockFeature.isUnlocked;

    return (
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
            isUnlocked
              ? "text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
              : "text-gray-400 dark:text-gray-500 cursor-not-allowed"
          }`}
          disabled={!isUnlocked}
        >
          <span>{label}</span>
          {!isUnlocked && (
            <LockClosedIcon className="h-4 w-4 ml-1" />
          )}
          {children && (
            <ChevronDownIcon className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          )}
        </button>

        {/* Dropdown Menu */}
        {children && isOpen && (
          <div className="absolute top-full left-0 mt-1 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 z-50">
            <div className="py-1">
              {children}
            </div>
          </div>
        )}

        {/* Unlock Progress Tooltip */}
        {!isUnlocked && unlockFeature.progress !== undefined && (
          <div className="absolute top-full left-0 mt-1 w-64 bg-gray-900 text-white text-xs rounded-md p-3 z-50 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="mb-2">
              <div className="flex justify-between items-center mb-1">
                <span>진행도</span>
                <span>{unlockFeature.progress}%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${unlockFeature.progress}%` }}
                ></div>
              </div>
            </div>
            {unlockFeature.requirements && (
              <div>
                <div className="font-medium mb-1">필요 조건:</div>
                <ul className="text-xs space-y-1">
                  {unlockFeature.requirements.map((req, index) => (
                    <li key={index}>• {req}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <nav className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="text-xl font-bold text-blue-600 dark:text-blue-400">
              PosMul
            </Link>
          </div>

          {/* Main Navigation - 3단계 고정형 */}
          <div className="hidden md:flex items-center space-x-8">
            {/* 1단계: 예측 (Expect) */}
            {renderNavLink(
              "/prediction",
              "예측",
              { isUnlocked: true },
              isPredictionOpen,
              setIsPredictionOpen,
              <div>
                <Link href="/prediction/binary" className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                  이진 예측
                </Link>
                <Link href="/prediction/ranking" className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                  순위 예측
                </Link>
                <div className="border-t border-gray-200 dark:border-gray-600 my-1"></div>
                <div className={`px-4 py-2 text-sm ${unlockStatus.localPrediction.isUnlocked ? 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer' : 'text-gray-400 dark:text-gray-500 cursor-not-allowed'}`}>
                  {unlockStatus.localPrediction.isUnlocked ? '지역 예측' : '🔒 지역 예측'}
                </div>
              </div>
            )}

            {/* 2단계: 투자 (Invest) */}
            {renderNavLink(
              "/investment",
              "투자",
              { isUnlocked: true },
              isInvestmentOpen,
              setIsInvestmentOpen,
              <div>
                <Link href="/investment/major" className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                  Major League
                </Link>
                <Link href="/investment/cloud" className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                  Cloud League
                </Link>
                <div className="border-t border-gray-200 dark:border-gray-600 my-1"></div>
                <div className={`px-4 py-2 text-sm ${unlockStatus.localInvestment.isUnlocked ? 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer' : 'text-gray-400 dark:text-gray-500 cursor-not-allowed'}`}>
                  {unlockStatus.localInvestment.isUnlocked ? '지역 투자' : '🔒 지역 투자'}
                </div>
              </div>
            )}

            {/* 3단계: 기부 (Donate) */}
            {renderNavLink(
              "/donation",
              "기부",
              { isUnlocked: true },
              isDonationOpen,
              setIsDonationOpen,
              <div>
                <Link href="/donation/direct" className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                  직접 기부
                </Link>
                <Link href="/donation/institute" className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                  기관 기부
                </Link>
                <div className="border-t border-gray-200 dark:border-gray-600 my-1"></div>
                <div className={`px-4 py-2 text-sm ${unlockStatus.localDonation.isUnlocked ? 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer' : 'text-gray-400 dark:text-gray-500 cursor-not-allowed'}`}>
                  {unlockStatus.localDonation.isUnlocked ? '지역 기부' : '🔒 지역 기부'}
                </div>
              </div>
            )}

            {/* 4단계: 포럼 (Forum) */}
            {renderNavLink(
              "/forum",
              "포럼",
              unlockStatus.localForum,
              isForumOpen,
              setIsForumOpen,
              <div>
                <Link href="/forum/discussion" className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                  토론
                </Link>
                <Link href="/forum/brainstorming" className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                  브레인스토밍
                </Link>
                <div className="border-t border-gray-200 dark:border-gray-600 my-1"></div>
                <Link href="/forum/local" className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                  지역 포럼
                </Link>
              </div>
            )}
          </div>

          {/* Economic Balance, Theme Switch & Auth */}
          <div className="flex items-center space-x-4">
            {/* Theme Switcher */}
            <ThemeSwitch variant="buttons" showLabel={false} />

            {isAuthenticated && (
              <div className="text-sm">
                <span className="text-blue-600 dark:text-blue-400 font-medium">
                  PMP: {economicBalance.pmp.toLocaleString()}
                </span>
                <span className="text-green-600 dark:text-green-400 font-medium ml-2">
                  PMC: {economicBalance.pmc.toLocaleString()}
                </span>
              </div>
            )}

            {isAuthenticated ? (
              <div className="flex items-center space-x-2">
                <Link
                  href="/profile"
                  className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 px-3 py-2 rounded-md text-sm font-medium"
                >
                  프로필
                </Link>
                <button className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 px-3 py-2 rounded-md text-sm font-medium">
                  로그아웃
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  href="/auth/login"
                  className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 px-3 py-2 rounded-md text-sm font-medium"
                >
                  로그인
                </Link>
                <Link
                  href="/auth/signup"
                  className="bg-blue-600 dark:bg-blue-500 text-white hover:bg-blue-700 dark:hover:bg-blue-600 px-4 py-2 rounded-md text-sm font-medium"
                >
                  회원가입
                </Link>
              </div>
            )}

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 p-2 rounded-md"
                aria-label="메뉴 열기"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Navigation (기본 숨김, 추후 모바일 대응시 구현) */}
      <div className="md:hidden hidden bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
        <div className="px-2 pt-2 pb-3 space-y-1">
          <Link href="/prediction" className="block px-3 py-2 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 rounded-md text-base font-medium">
            예측
          </Link>
          <Link href="/investment" className="block px-3 py-2 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 rounded-md text-base font-medium">
            투자
          </Link>
          <Link href="/donation" className="block px-3 py-2 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 rounded-md text-base font-medium">
            기부
          </Link>
          <Link href="/forum" className="block px-3 py-2 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 rounded-md text-base font-medium">
            포럼
          </Link>
        </div>
      </div>
    </nav>
  );
}

export { Navbar };
export { GeographicNavbar };
