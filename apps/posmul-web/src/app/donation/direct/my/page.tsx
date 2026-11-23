/**
 * 내 기부 내역 페이지
 * 
 * 사용자의 직접 기부 물품 및 매칭 상태를 추적
 * 
 * @author PosMul Development Team
 * @since 2024-12
 */
import { redirect } from "next/navigation";
import { createClient } from "../../../../lib/supabase/server";
import { MyDonationsClient } from "./client";

// 카테고리 라벨 매핑
const categoryLabels: Record<string, { label: string; icon: string }> = {
  clothing: { label: "의류", icon: "" },
  food: { label: "식품", icon: "" },
  housing: { label: "주거", icon: "" },
  medical: { label: "의료", icon: "" },
  education: { label: "교육", icon: "" },
};

// 상태 라벨 매핑
const statusLabels: Record<string, { label: string; color: string }> = {
  available: { label: "기부 가능", color: "green" },
  reserved: { label: "예약됨", color: "yellow" },
  matched: { label: "매칭 완료", color: "blue" },
  completed: { label: "기부 완료", color: "gray" },
  cancelled: { label: "취소됨", color: "red" },
};

// 매칭 상태 라벨
const matchStatusLabels: Record<string, { label: string; color: string }> = {
  pending: { label: "수락 대기", color: "yellow" },
  accepted: { label: "수락됨", color: "green" },
  rejected: { label: "거절됨", color: "red" },
  completed: { label: "완료", color: "blue" },
  cancelled: { label: "취소됨", color: "gray" },
};

// 내부 타입 정의
interface RawItem {
  id: string;
  title: string;
  category: string;
  condition: string;
  status: string;
  created_at: string;
  pickup_location: string | null;
}

interface RawMatch {
  id: string;
  status: string;
  donor_confirmed: boolean;
  recipient_confirmed: boolean;
  created_at: string;
  matched_at: string | null;
  completed_at: string | null;
  donation_recipients: {
    display_name: string;
    location_city: string | null;
    location_district: string | null;
  } | null;
}

interface RawItemWithMatch extends RawItem {
  direct_donation_matches: RawMatch[];
}

export default async function MyDonationsPage() {
  const supabase = await createClient();

  // 현재 사용자 확인
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login?redirect=/donation/direct/my");
  }

  // 내 기부 물품 목록 조회 (매칭 정보 포함)
  const { data: items, error } = await supabase
    .schema("donation")
    .from("direct_donation_items")
    .select(`
      id,
      title,
      category,
      condition,
      status,
      created_at,
      pickup_location,
      direct_donation_matches (
        id,
        status,
        donor_confirmed,
        recipient_confirmed,
        created_at,
        matched_at,
        completed_at,
        donation_recipients (
          display_name,
          location_city,
          location_district
        )
      )
    `)
    .eq("donor_user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    // eslint-disable-next-line no-console
    console.error("Items fetch error:", error);
  }

  // 데이터 변환
  const itemList = (items || []) as unknown as RawItemWithMatch[];
  
  const itemsForClient = itemList.map((item) => {
    const match = item.direct_donation_matches?.[0] || null;
    
    return {
      id: item.id,
      title: item.title,
      category: item.category,
      categoryLabel: categoryLabels[item.category]?.label || item.category,
      categoryIcon: categoryLabels[item.category]?.icon || "",
      status: item.status,
      statusLabel: statusLabels[item.status]?.label || item.status,
      statusColor: statusLabels[item.status]?.color || "gray",
      pickupLocation: item.pickup_location || "",
      createdAt: item.created_at,
      match: match ? {
        id: match.id,
        status: match.status,
        statusLabel: matchStatusLabels[match.status]?.label || match.status,
        statusColor: matchStatusLabels[match.status]?.color || "gray",
        donorConfirmed: match.donor_confirmed,
        recipientConfirmed: match.recipient_confirmed,
        createdAt: match.created_at,
        matchedAt: match.matched_at,
        completedAt: match.completed_at,
        recipient: match.donation_recipients ? {
          displayName: match.donation_recipients.display_name,
          location: `${match.donation_recipients.location_city || ""} ${match.donation_recipients.location_district || ""}`.trim(),
        } : null,
      } : null,
    };
  });

  // 통계 계산
  const stats = {
    total: itemsForClient.length,
    available: itemsForClient.filter((i) => i.status === "available").length,
    matched: itemsForClient.filter((i) => i.status === "matched").length,
    completed: itemsForClient.filter((i) => i.status === "completed").length,
    pending: itemsForClient.filter((i) => i.match?.status === "pending").length,
  };

  return <MyDonationsClient items={itemsForClient} stats={stats} />;
}
