/**
 * 물품 상세 페이지
 * 
 * 기부 물품의 상세 정보 및 매칭 기능 제공
 * 
 * @author PosMul Development Team
 * @since 2024-12
 */
import { notFound } from "next/navigation";
import { createClient } from "../../../../../lib/supabase/server";
import { ItemDetailClient } from "./client";

// 카테고리 라벨 매핑
const categoryLabels: Record<string, { label: string; icon: string }> = {
  clothing: { label: "의류", icon: "👕" },
  food: { label: "식품", icon: "🍚" },
  housing: { label: "주거", icon: "🏠" },
  medical: { label: "의료", icon: "💊" },
  education: { label: "교육", icon: "📚" },
};

// 상태 라벨 매핑
const conditionLabels: Record<string, string> = {
  new: "새것",
  like_new: "거의 새것",
  good: "양호",
  fair: "사용감 있음",
};

// 상태 라벨 매핑
const statusLabels: Record<string, { label: string; color: string }> = {
  available: { label: "기부 가능", color: "green" },
  reserved: { label: "예약됨", color: "yellow" },
  matched: { label: "매칭 완료", color: "blue" },
  completed: { label: "기부 완료", color: "gray" },
  cancelled: { label: "취소됨", color: "red" },
};

// 내부 타입 정의
interface RawRecipient {
  id: string;
  display_name: string;
  bio: string | null;
  needed_categories: string[] | null;
  location_city: string | null;
  location_district: string | null;
  is_verified: boolean;
}

interface RawMatch {
  id: string;
  status: string;
  donor_confirmed: boolean;
  recipient_confirmed: boolean;
  created_at: string;
  donation_recipients: {
    id: string;
    display_name: string;
    location_city: string | null;
    location_district: string | null;
  } | null;
}

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
  pickup_available_times: string | null;
  status: string;
  created_at: string;
}

interface PageProps {
  params: Promise<{ itemId: string }>;
}

export default async function ItemDetailPage({ params }: PageProps) {
  const { itemId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // 물품 정보 조회
  const { data: item, error } = await supabase
    .schema("donation")
    .from("direct_donation_items")
    .select("*")
    .eq("id", itemId)
    .single();

  if (error || !item) {
    notFound();
  }

  const typedItem = item as RawItem;

  // 추천/매칭 조회 및 클라이언트 데이터 준비
  const recommendations = await getRecommendations(supabase, user, typedItem);
  const existingMatch = await getExistingMatch(supabase, itemId);
  const itemForClient = buildItemForClient(typedItem);
  const matchForClient = buildMatchForClient(existingMatch);

  return (
    <ItemDetailClient
      item={itemForClient}
      recommendations={recommendations}
      existingMatch={matchForClient}
      isOwner={user?.id === typedItem.donor_user_id}
      isLoggedIn={!!user}
    />
  );
}

// ===== 헬퍼: 추천 수혜자 조회 =====
type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

async function getRecommendations(
  supabase: SupabaseClient,
  user: { id: string } | null,
  item: RawItem
) {
  if (!user || user.id !== item.donor_user_id || item.status !== "available") {
    return [];
  }

  const { data: recipients } = await supabase
    .schema("donation")
    .from("donation_recipients")
    .select("*")
    .eq("is_active", true)
    .contains("needed_categories", [item.category]);

  if (!recipients) return [];

  return (recipients as RawRecipient[]).map((r) => {
    const { score, reasons } = calculateScore(r, item);
    return {
      id: r.id,
      displayName: r.display_name,
      bio: r.bio || "",
      locationCity: r.location_city || "",
      locationDistrict: r.location_district || "",
      isVerified: r.is_verified,
      neededCategories: (r.needed_categories || []).map((cat: string) => ({
        category: cat,
        label: categoryLabels[cat]?.label || cat,
        icon: categoryLabels[cat]?.icon || "📦",
      })),
      matchScore: score,
      matchReasons: reasons,
    };
  }).sort((a, b) => b.matchScore - a.matchScore);
}

function calculateScore(r: RawRecipient, item: RawItem) {
  let score = 50;
  const reasons: string[] = ["필요 카테고리 일치"];
  if (r.is_verified) { score += 20; reasons.push("인증된 수혜자"); }
  if (item.pickup_location && r.location_city && item.pickup_location.includes(r.location_city)) {
    score += 30; reasons.push("동일 지역");
  }
  return { score, reasons };
}

// ===== 헬퍼: 기존 매칭 조회 =====
async function getExistingMatch(supabase: SupabaseClient, itemId: string) {
  const { data } = await supabase
    .schema("donation")
    .from("direct_donation_matches")
    .select(`id, status, donor_confirmed, recipient_confirmed, created_at,
      donation_recipients (id, display_name, location_city, location_district)`)
    .eq("item_id", itemId)
    .maybeSingle();
  return data as unknown as RawMatch | null;
}

// ===== 헬퍼: 클라이언트 데이터 빌드 =====
function buildItemForClient(item: RawItem) {
  return {
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
    pickupAvailableTimes: item.pickup_available_times || "",
    status: item.status,
    statusLabel: statusLabels[item.status]?.label || item.status,
    statusColor: statusLabels[item.status]?.color || "gray",
    createdAt: item.created_at,
  };
}

function buildMatchForClient(match: RawMatch | null) {
  if (!match) return null;
  return {
    id: match.id,
    status: match.status,
    donorConfirmed: match.donor_confirmed,
    recipientConfirmed: match.recipient_confirmed,
    createdAt: match.created_at,
    recipient: match.donation_recipients ? {
      id: match.donation_recipients.id,
      displayName: match.donation_recipients.display_name,
      location: `${match.donation_recipients.location_city || ""} ${match.donation_recipients.location_district || ""}`.trim(),
    } : null,
  };
}
