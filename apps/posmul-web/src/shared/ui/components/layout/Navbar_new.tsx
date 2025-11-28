"use client";

import Link from "next/link";
import { ThemeSwitch } from "../../../../bounded-contexts/prediction/presentation/utils/ThemeSwitch";

type EconomicBalanceProps = {
  pmp: number;
  pmc: number;
};

type NavbarProps = {
  economicBalance?: EconomicBalanceProps;
  isAuthenticated?: boolean;
};

export default function Navbar({
  economicBalance = { pmp: 0, pmc: 0 },
  isAuthenticated = false,
}: NavbarProps) {
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

          {/* Main Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link
              href="/prediction"
              className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 px-3 py-2 rounded-md text-sm font-medium"
            >
              예측
            </Link>
            <Link
              href="/investment"
              className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 px-3 py-2 rounded-md text-sm font-medium"
            >
              투자
            </Link>
            <Link
              href="/donation"
              className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 px-3 py-2 rounded-md text-sm font-medium"
            >
              기부
            </Link>
            <Link
              href="/forum"
              className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 px-3 py-2 rounded-md text-sm font-medium"
            >
              포럼
            </Link>
          </div>

          {/* Economic Balance, Theme Switch & Auth */}
          <div className="flex items-center space-x-4">
            {/* Theme Switcher */}
            <ThemeSwitch variant="buttons" showLabel={false} />

            {isAuthenticated && (
              <div className="text-sm">
                <span className="text-blue-600 dark:text-blue-400 font-medium">
                  PMP: {economicBalance.pmp}
                </span>
                <span className="text-green-600 dark:text-green-400 font-medium ml-2">
                  PMC: {economicBalance.pmc}
                </span>
              </div>
            )}

            {isAuthenticated ? (
              <div className="flex items-center space-x-2">
                <button className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 px-3 py-2 rounded-md text-sm font-medium">
                  프로필
                </button>
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
          </div>
        </div>
      </div>
    </nav>
  );
}

export { Navbar };
