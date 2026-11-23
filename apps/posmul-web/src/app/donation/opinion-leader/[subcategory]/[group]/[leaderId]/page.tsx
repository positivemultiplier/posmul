/**
 * 오피니언 리더 프로필 페이지 (Server Component)
 *
 * 특정 오피니언 리더의 상세 정보와 후원 기관 목록을 표시
 *
 * @author PosMul Development Team
 * @since 2025-11
 */
import { notFound } from "next/navigation";
import { createClient } from "../../../../../../lib/supabase/server";
import { OpinionLeaderProfileClient } from "./client";

// 카테고리 라벨 매핑
const categoryLabels: Record<
  string,
  { label: string; icon: string; color: string }
> = {
  environment: { label: "환경", icon: "", color: "green" },
  welfare: { label: "복지", icon: "", color: "blue" },
  science: { label: "과학", icon: "", color: "purple" },
  human_rights: { label: "인권", icon: "", color: "red" },
  education: { label: "교육", icon: "", color: "yellow" },
  health: { label: "건강", icon: "", color: "pink" },
  culture: { label: "문화", icon: "", color: "indigo" },
  economy: { label: "경제", icon: "", color: "emerald" },
  general: { label: "일반", icon: "", color: "gray" },
};

// 기관 카테고리 라벨
const instituteCategoryLabels: Record<string, { label: string; icon: string }> =
{
  children: { label: "아동복지", icon: "" },
  elderly: { label: "노인복지", icon: "" },
  disaster: { label: "재난구호", icon: "" },
  environment: { label: "환경보전", icon: "" },
  education: { label: "교육지원", icon: "" },
  medical: { label: "의료지원", icon: "" },
  animal: { label: "동물보호", icon: "" },
  other: { label: "기타", icon: "" },
};

interface PageProps {
  params: Promise<{
    leaderId: string;
  }>;
}

// 리더 데이터 변환 헬퍼
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function transformLeaderData(leader: any) {
  return {
    id: leader.id,
    displayName: leader.display_name,
    bio: leader.bio || "",
    avatarUrl: leader.avatar_url,
    socialLinks: leader.social_links || {},
    isVerified: !!leader.verified_at,
    followerCount: leader.follower_count || 0,
    totalDonationsInfluenced: Number(leader.total_donations_influenced) || 0,
    category: leader.category || "general",
    categoryLabel: categoryLabels[leader.category || "general"]?.label || "일반",
    categoryIcon: categoryLabels[leader.category || "general"]?.icon || "",
    categoryColor: categoryLabels[leader.category || "general"]?.color || "gray",
    createdAt: leader.created_at,
  };
}

// endorsements 데이터 변환 헬퍼
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function transformEndorsements(endorsements: any[]) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return endorsements.map((e: any) => {
    const inst = Array.isArray(e.donation_institutes)
      ? e.donation_institutes[0]
      : e.donation_institutes;

    return {
      id: e.id,
      endorsementMessage: e.endorsement_message || "",
      endorsedAt: e.endorsed_at,
      institute: {
        id: inst?.id || "",
        name: inst?.name || "",
        description: inst?.description || "",
        category: inst?.category || "other",
        categoryLabel:
          instituteCategoryLabels[inst?.category]?.label || inst?.category,
        categoryIcon: instituteCategoryLabels[inst?.category]?.icon || "",
        websiteUrl: inst?.website_url,
        trustScore: Number(inst?.trust_score) || 0,
        isVerified: inst?.is_verified || false,
      },
    };
  });
}

export default async function OpinionLeaderProfilePage({ params }: PageProps) {
  const { leaderId } = await params;
  const supabase = await createClient();

  // 현재 사용자 확인
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 리더 정보 조회
  const { data: leader, error: leaderError } = await supabase
    .schema("donation")
    .from("opinion_leaders")
    .select("*")
    .eq("id", leaderId)
    .eq("is_active", true)
    .single();

  if (leaderError || !leader) {
    notFound();
  }

  // 후원 기관 (endorsements) 조회
  const { data: endorsements } = await supabase
    .schema("donation")
    .from("opinion_leader_endorsements")
    .select(
      `
      id,
      endorsement_message,
      endorsed_at,
      institute_id,
      donation_institutes!inner (
        id, name, description, category, website_url, trust_score, is_verified
      )
    `
    )
    .eq("opinion_leader_id", leaderId)
    .order("endorsed_at", { ascending: false });

  // 팔로우 여부 및 PMC 잔액 조회
  let isFollowing = false;
  let userPmcBalance = 0;

  if (user) {
    const { data: followData } = await supabase
      .schema("donation")
      .from("opinion_leader_followers")
      .select("id")
      .eq("opinion_leader_id", leaderId)
      .eq("follower_user_id", user.id)
      .maybeSingle();

    isFollowing = !!followData;

    const { data: account } = await supabase
      .schema("economy")
      .from("pmp_pmc_accounts")
      .select("pmc_balance")
      .eq("user_id", user.id)
      .single();

    const accountData = Array.isArray(account) ? account[0] : account;
    userPmcBalance = Number(accountData?.pmc_balance) || 0;
  }

  const endorsementList = Array.isArray(endorsements) ? endorsements : [];

  return (
    <OpinionLeaderProfileClient
      leader={transformLeaderData(leader)}
      endorsements={transformEndorsements(endorsementList)}
      isFollowing={isFollowing}
      isLoggedIn={!!user}
      userId={user?.id || null}
      userPmcBalance={userPmcBalance}
    />
  );
}
