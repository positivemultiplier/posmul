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
import { Suspense } from "react";

import { MoneyWaveStatus } from "../../shared/ui";

interface InvestmentLayoutProps {
  children: React.ReactNode;
}

export default function InvestmentLayout({ children }: InvestmentLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* MoneyWave Status */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Suspense fallback={<div className="h-20 bg-green-50 animate-pulse" />}>
          <MoneyWaveStatus />
        </Suspense>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
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
