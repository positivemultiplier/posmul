import { createClient } from "@/lib/supabase/server";
import { WishlistPageClient } from "./client";

export const dynamic = "force-dynamic";

export default async function WishlistPage() {
  const supabase = await createClient();

  // 1. 전체 위시리스트 목록 조회 (모든 상태: pending, approved)
  const { data: allRequests } = await supabase
    .schema("donation")
    .from("funding_wishlist_requests")
    .select(`
      *,
      project:project_id (
        id,
        title,
        product_name,
        manufacturer,
        unit_price,
        category
      )
    `)
    .order("created_at", { ascending: false });

  // 2. 현재 로그인 사용자
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <WishlistPageClient
      initialRequests={allRequests || []}
      isLoggedIn={!!user}
      currentUserId={user?.id || null}
    />
  );
}
