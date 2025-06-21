/**
 * Prediction Layout with 3-Tier Navigation
 *
 * Implements the navigation structure from Project_Features.md:
 * 1단: Expect (예측)
 * 2단: invest, sports, entertainment, politics, user-suggestions
 * 3단: Category-specific subcategories
 *
 * @author PosMul Development Team
 * @since 2024-12
 */

import { MoneyWaveStatus } from "@/shared/components/MoneyWaveStatus";
import { Suspense } from "react";

interface PredictionLayoutProps {
  children: React.ReactNode;
}

export default function PredictionLayout({ children }: PredictionLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Prediction Navigation */}
      <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-8">
              <h1 className="text-xl font-bold text-blue-600">🔮 Prediction</h1>
            </div>
          </div>
        </div>
        {/* Simple Navigation for now */}
        <div className="border-t border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex space-x-8 overflow-x-auto py-2">
              <a
                href="/prediction/invest"
                className="text-sm text-gray-600 hover:text-blue-600 whitespace-nowrap py-2"
              >
                💼 Invest 예측
              </a>
              <a
                href="/prediction/sports"
                className="text-sm text-gray-600 hover:text-blue-600 whitespace-nowrap py-2"
              >
                🏆 스포츠
              </a>
              <a
                href="/prediction/entertainment"
                className="text-sm text-gray-600 hover:text-blue-600 whitespace-nowrap py-2"
              >
                🎬 엔터테인먼트
              </a>
              <a
                href="/prediction/politics"
                className="text-sm text-gray-600 hover:text-blue-600 whitespace-nowrap py-2"
              >
                🗳️ 정치
              </a>
              <a
                href="/prediction/user-suggestions"
                className="text-sm text-gray-600 hover:text-blue-600 whitespace-nowrap py-2"
              >
                💡 사용자 제안
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* MoneyWave Status */}
      <Suspense fallback={<div className="h-20 bg-blue-50 animate-pulse" />}>
        <MoneyWaveStatus />
      </Suspense>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Suspense
          fallback={
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          }
        >
          {children}
        </Suspense>
      </main>
    </div>
  );
}
