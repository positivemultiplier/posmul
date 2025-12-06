/**
 * Demographic Debate Page
 * 인구통계 기반 토론 + 예측 게임 목록
 */
import { Suspense } from "react";
import { Metadata } from "next";
import { DemographicDebatePageClient } from "./page-client";

export const metadata: Metadata = {
  title: "인구통계 토론 | PosMul Forum",
  description: "광주광역시 인구통계 데이터 기반 토론 및 예측 게임",
};

function LoadingFallback() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-8 bg-gray-200 rounded w-1/3" />
      <div className="h-4 bg-gray-200 rounded w-2/3" />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mt-8">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="h-64 bg-gray-100 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

export default function DemographicDebatePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Suspense fallback={<LoadingFallback />}>
          <DemographicDebatePageClient />
        </Suspense>
      </div>
    </div>
  );
}
