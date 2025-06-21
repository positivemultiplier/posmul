/**
 * Forum Layout
 *
 * Layout for forum domain with navigation structure:
 * 1단: Forum (포럼)
 * 2단: brainstorming, debate, common
 * 3단: Category-specific subcategories
 *
 * @author PosMul Development Team
 * @since 2024-12
 */

import { MoneyWaveStatus } from "@/shared/components/MoneyWaveStatus";
import { Suspense } from "react";

interface ForumLayoutProps {
  children: React.ReactNode;
}

export default function ForumLayout({ children }: ForumLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Forum Navigation */}
      <nav className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-8">
              <h1 className="text-xl font-bold text-purple-600">💬 Forum</h1>
              {/* TODO: Add ForumNavigation component */}
              <div className="hidden md:flex space-x-6">
                <a
                  href="/forum/brainstorming"
                  className="text-gray-600 hover:text-purple-600"
                >
                  💡 브레인스토밍
                </a>
                <a
                  href="/forum/debate"
                  className="text-gray-600 hover:text-purple-600"
                >
                  🗣️ 토론
                </a>
                <a
                  href="/forum/common"
                  className="text-gray-600 hover:text-purple-600"
                >
                  ⚙️ 공통 기능
                </a>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* MoneyWave Status */}
      <Suspense fallback={<div className="h-20 bg-purple-50 animate-pulse" />}>
        <MoneyWaveStatus />
      </Suspense>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Suspense
          fallback={
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            </div>
          }
        >
          {children}
        </Suspense>
      </main>
    </div>
  );
}
