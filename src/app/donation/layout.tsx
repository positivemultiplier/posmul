/**
 * Donation Layout
 *
 * Layout for donation domain with navigation structure:
 * 1단: Donation (기부)
 * 2단: direct, institute, opinion-leader, common
 * 3단: Category-specific subcategories
 *
 * @author PosMul Development Team
 * @since 2024-12
 */

import { MoneyWaveStatus } from "@/shared/components/MoneyWaveStatus";
import { Suspense } from "react";

interface DonationLayoutProps {
  children: React.ReactNode;
}

export default function DonationLayout({ children }: DonationLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Donation Navigation */}
      <nav className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-8">
              <h1 className="text-xl font-bold text-red-600">❤️ Donation</h1>
              {/* TODO: Add DonationNavigation component */}
              <div className="hidden md:flex space-x-6">
                <a
                  href="/donation/direct"
                  className="text-gray-600 hover:text-red-600"
                >
                  🤝 직접 기부
                </a>
                <a
                  href="/donation/institute"
                  className="text-gray-600 hover:text-red-600"
                >
                  🏛️ 기관 기부
                </a>
                <a
                  href="/donation/opinion-leader"
                  className="text-gray-600 hover:text-red-600"
                >
                  👑 오피니언 리더
                </a>
                <a
                  href="/donation/common"
                  className="text-gray-600 hover:text-red-600"
                >
                  ⚙️ 공통 기능
                </a>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* MoneyWave Status */}
      <Suspense fallback={<div className="h-20 bg-red-50 animate-pulse" />}>
        <MoneyWaveStatus />
      </Suspense>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Suspense
          fallback={
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
            </div>
          }
        >
          {children}
        </Suspense>
      </main>
    </div>
  );
}
