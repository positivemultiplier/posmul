/**
 * Investment Layout
 *
 * Layout for investment domain with navigation structure:
 * 1단: Invest (투자)
 * 2단: local-league, major-league, cloud-funding, common
 * 3단: Category-specific subcategories
 *
 * @author PosMul Development Team
 * @since 2024-12
 */

import { MoneyWaveStatus } from "@/shared/components/MoneyWaveStatus";
import { Suspense } from "react";

interface InvestmentLayoutProps {
  children: React.ReactNode;
}

export default function InvestmentLayout({ children }: InvestmentLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Investment Navigation - TODO: Implement InvestmentNavigation component */}
      <nav className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-8">
              <h1 className="text-xl font-bold text-green-600">💼 Invest</h1>
              {/* TODO: Add InvestmentNavigation component */}
              <div className="hidden md:flex space-x-6">
                <a
                  href="/investment/local-league"
                  className="text-gray-600 hover:text-green-600"
                >
                  🏪 Local League
                </a>
                <a
                  href="/investment/major-league"
                  className="text-gray-600 hover:text-green-600"
                >
                  🏢 Major League
                </a>
                <a
                  href="/investment/cloud-funding"
                  className="text-gray-600 hover:text-green-600"
                >
                  ☁️ Cloud Funding
                </a>
                <a
                  href="/investment/common"
                  className="text-gray-600 hover:text-green-600"
                >
                  ⚙️ 공통 기능
                </a>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* MoneyWave Status */}
      <Suspense fallback={<div className="h-20 bg-green-50 animate-pulse" />}>
        <MoneyWaveStatus />
      </Suspense>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Suspense
          fallback={
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
            </div>
          }
        >
          {children}
        </Suspense>
      </main>
    </div>
  );
}
