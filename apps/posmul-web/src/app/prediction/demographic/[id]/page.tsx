/**
 * Demographic Prediction Detail Page
 * 인구통계 예측 게임 상세 + 참여 페이지
 */
import { Suspense } from "react";
import { Metadata } from "next";
import { PredictionDetailClient } from "./page-client";

export const metadata: Metadata = {
  title: "예측 게임 상세 | PosMul",
  description: "인구통계 예측 게임 상세 및 참여",
};

interface PageProps {
  params: Promise<{ id: string }>;
}

function LoadingFallback() {
  return (
    <div className="animate-pulse space-y-4 max-w-4xl mx-auto">
      <div className="h-8 bg-gray-200 rounded w-2/3" />
      <div className="h-4 bg-gray-200 rounded w-1/2" />
      <div className="h-64 bg-gray-100 rounded-xl mt-8" />
      <div className="h-48 bg-gray-100 rounded-xl" />
    </div>
  );
}

export default async function PredictionDetailPage({ params }: PageProps) {
  const { id } = await params;
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Suspense fallback={<LoadingFallback />}>
          <PredictionDetailClient predictionId={id} />
        </Suspense>
      </div>
    </div>
  );
}
