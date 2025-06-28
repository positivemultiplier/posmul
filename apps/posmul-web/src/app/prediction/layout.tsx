/**
 * Prediction Layout - Simplified
 *
 * Removed duplicate navigation as it's handled by main Navbar
 * Main Navbar already implements 3-tier navigation:
 * - Level 1: Main domains (Investment, Prediction, etc.)
 * - Level 2: Prediction categories (Investment, Sports, etc.)
 * - Level 3: Sports subcategories (soccer, esports, etc.)
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
