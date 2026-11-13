/**
 * Prediction Deep Analysis Page (/prediction/[slug]/analysis)
 * 방법 A: 1차 참여 화면(/prediction/[slug])에서 분리된 심층 경제학 · 오라클 분석 페이지
 */

import { notFound } from "next/navigation";
import { fetchPredictionDetailDataBySlug } from "../../components/prediction-detail-by-slug";
import { PredictionAnalysisDetailClient } from "./client";

export const revalidate = 10;

interface PredictionAnalysisPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function PredictionAnalysisPage({
  params,
}: PredictionAnalysisPageProps) {
  const { slug } = await params;
  const decodedSlug = decodeURIComponent(slug);

  const dbDetailData = await fetchPredictionDetailDataBySlug(decodedSlug);
  if (!dbDetailData) {
    notFound();
  }

  return (
    <PredictionAnalysisDetailClient
      game={dbDetailData.game}
      userBalance={dbDetailData.userBalance}
      userLearningProfile={dbDetailData.userLearningProfile}
      slug={dbDetailData.slug}
    />
  );
}

