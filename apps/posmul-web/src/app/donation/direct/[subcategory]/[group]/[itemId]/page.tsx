/**
 * Donation Direct 상세 (Depth5 라우트 래퍼)
 *
 * URL 예시:
 * /donation/direct/:subcategory/:group/:itemId
 */
import ItemDetailPage from "../../../item/[itemId]/page";

interface PageProps {
  params: Promise<{
    subcategory: string;
    group: string;
    itemId: string;
  }>;
}

export default async function DirectItemDepth5Page({ params }: PageProps) {
  const { itemId } = await params;
  return ItemDetailPage({ params: Promise.resolve({ itemId }) });
}
