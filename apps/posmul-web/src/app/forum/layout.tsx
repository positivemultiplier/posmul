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

import { MoneyWaveStatus } from "@posmul/shared-ui";
import { Suspense } from "react";

interface ForumLayoutProps {
  children: React.ReactNode;
}

export default function ForumLayout({ children }: ForumLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* MoneyWave Status */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Suspense
          fallback={<div className="h-20 bg-purple-50 animate-pulse" />}
        >
          <MoneyWaveStatus />
        </Suspense>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
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
