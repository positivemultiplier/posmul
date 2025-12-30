/**
 * Donation Direct 상세 (Depth5 라우트 래퍼)
 *
 * URL 예시:
 * /donation/direct/:subcategory/:group/:itemId
 */
import { redirect } from "next/navigation";

interface PageProps {
  params: Promise<{
    subcategory: string;
    group: string;
    itemId: string;
  }>;
}

export default async function DirectItemDepth5Page({ params }: PageProps) {
  const { itemId } = await params;
  // 실제 상세 페이지로 리다이렉트
  redirect(`/donation/direct/item/${itemId}`);
}

