import { renderPredictionDetailBySlug } from "../../../../components/prediction-detail-by-slug";

interface PageProps {
  params: Promise<{ subcategory: string; league: string; slug: string }>;
}

export default async function PredictionEntertainmentDepth5Page({
  params,
}: PageProps) {
  const { slug } = await params;
  return renderPredictionDetailBySlug(slug);
}
