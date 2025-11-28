/**
 * 직접 기부 메인 페이지
 * 
 * 물품 기부를 통한 직접 기부 페이지
 * DB에서 기부 물품 목록과 수혜자 정보를 불러와 표시
 * 
 * @author PosMul Development Team
 * @since 2024-12
 */
import { createClient } from "../../../lib/supabase/server";
import { DirectDonationClient } from "./client";

// 카테고리 라벨 매핑
const categoryLabels: Record<string, { label: string; icon: string }> = {
  clothing: { label: "의류", icon: "👕" },
  food: { label: "식품", icon: "🍚" },
  housing: { label: "주거", icon: "🏠" },
  medical: { label: "의료", icon: "💊" },
  education: { label: "교육", icon: "📚" },
};

// 상태 라벨 매핑
const statusLabels: Record<string, { label: string; color: string }> = {
  available: { label: "기부 가능", color: "green" },
  reserved: { label: "예약됨", color: "yellow" },
  matched: { label: "매칭 완료", color: "blue" },
  completed: { label: "기부 완료", color: "gray" },
  cancelled: { label: "취소됨", color: "red" },
};

// 상태 라벨 매핑
const conditionLabels: Record<string, string> = {
  new: "새것",
  like_new: "거의 새것",
  good: "양호",
  fair: "사용감 있음",
};

export default async function DirectDonationPage() {
  const supabase = await createClient();

  // 현재 사용자 확인
  const { data: { user } } = await supabase.auth.getUser();

  // 기부 물품 목록 조회 (available 상태만)
  const { data: items, error: itemsError } = await supabase
    .schema("donation")
    .from("direct_donation_items")
    .select("*")
    .in("status", ["available", "reserved"])
    .order("created_at", { ascending: false });

  if (itemsError) {
    // eslint-disable-next-line no-console
    console.error("Items fetch error:", itemsError);
  }

  // 수혜자 목록 조회 (활성 상태만)
  const { data: recipients, error: recipientsError } = await supabase
    .schema("donation")
    .from("donation_recipients")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (recipientsError) {
    // eslint-disable-next-line no-console
    console.error("Recipients fetch error:", recipientsError);
  }

  // Array 방어
  const itemList = Array.isArray(items) ? items : [];
  const recipientList = Array.isArray(recipients) ? recipients : [];

  // 물품 데이터 변환
  interface RawItem {
    id: string;
    donor_user_id: string;
    title: string;
    description: string | null;
    category: string;
    condition: string;
    quantity: number;
    estimated_value: string | number | null;
    images: string[] | null;
    pickup_location: string | null;
    status: string;
    created_at: string;
  }

  const itemsForClient = itemList.map((item: RawItem) => ({
    id: item.id,
    donorUserId: item.donor_user_id,
    title: item.title,
    description: item.description || "",
    category: item.category,
    categoryLabel: categoryLabels[item.category]?.label || item.category,
    categoryIcon: categoryLabels[item.category]?.icon || "📦",
    condition: item.condition,
    conditionLabel: conditionLabels[item.condition] || item.condition,
    quantity: item.quantity,
    estimatedValue: Number(item.estimated_value) || 0,
    images: item.images || [],
    pickupLocation: item.pickup_location || "",
    status: item.status,
    statusLabel: statusLabels[item.status]?.label || item.status,
    statusColor: statusLabels[item.status]?.color || "gray",
    createdAt: item.created_at,
  }));

  // 수혜자 데이터 변환
  interface RawRecipient {
    id: string;
    user_id: string | null;
    display_name: string;
    bio: string | null;
    needed_categories: string[] | null;
    location_city: string | null;
    location_district: string | null;
    is_verified: boolean;
    created_at: string;
  }

  const recipientsForClient = recipientList.map((r: RawRecipient) => ({
    id: r.id,
    userId: r.user_id,
    displayName: r.display_name,
    bio: r.bio || "",
    neededCategories: (r.needed_categories || []).map((cat: string) => ({
      category: cat,
      label: categoryLabels[cat]?.label || cat,
      icon: categoryLabels[cat]?.icon || "📦",
    })),
    locationCity: r.location_city || "",
    locationDistrict: r.location_district || "",
    isVerified: r.is_verified,
    createdAt: r.created_at,
  }));

  // 통계 계산
  const stats = {
    totalItems: itemList.length,
    availableItems: itemList.filter((i: RawItem) => i.status === "available").length,
    totalRecipients: recipientList.length,
    categoryCounts: Object.entries(categoryLabels).map(([key, value]) => ({
      category: key,
      label: value.label,
      icon: value.icon,
      count: itemList.filter((i: RawItem) => i.category === key).length,
    })),
  };

  return (
    <DirectDonationClient 
      items={itemsForClient}
      recipients={recipientsForClient}
      stats={stats}
      isLoggedIn={!!user}
      currentUserId={user?.id || null}
    />
  );
}
