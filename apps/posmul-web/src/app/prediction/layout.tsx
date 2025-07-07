/**
 * Prediction Layout - With 3-Tier Navigation
 *
 * Implements 3-tier navigation system:
 * - Level 1: Main domains (handled by main Navbar)
 * - Level 2: Prediction categories (invest, sports, entertainment, politics)
 * - Level 3: Category subcategories (soccer, esports, movies, etc.)
 *
 * @author PosMul Development Team
 * @since 2024-12
 */

import { MoneyWaveStatus } from "../../shared/ui";
import { PredictionsNavigation } from "../../bounded-contexts/prediction/presentation/components/PredictionsNavigation";
import { Suspense } from "react";

interface PredictionLayoutProps {
  children: React.ReactNode;
}

export default function PredictionLayout({ children }: PredictionLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* 3-Tier Predictions Navigation */}
      <PredictionsNavigation />

      {/* Money Wave Status - 예측 도메인에서 중요한 정보 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Suspense
          fallback={
            <div className="animate-pulse bg-gray-200 h-32 rounded-lg" />
          }
        >
          <MoneyWaveStatus />
        </Suspense>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        {children}
      </div>
    </div>
  );
}
