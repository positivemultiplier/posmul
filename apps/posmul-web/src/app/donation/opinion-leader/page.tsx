/**
 * 오피니언 리더 목록 페이지 (Server Component)
 *
 * 영향력 있는 오피니언 리더들을 조회하고 필터링할 수 있는 페이지
 * - 카테고리별 필터링
 * - 팔로워순/기부영향력순 정렬
 * - 인증된 리더 표시
 *
 * @author PosMul Development Team
 * @since 2025-11
 */
import { createClient } from "../../../lib/supabase/server";
import { OpinionLeaderClient } from "./client";

// 카테고리 라벨 매핑
const categoryLabels: Record<string, { label: string; icon: string; color: string }> = {
  environment: { label: "환경", icon: "🌿", color: "green" },
  welfare: { label: "복지", icon: "🤝", color: "blue" },
  science: { label: "과학", icon: "🔬", color: "purple" },
  human_rights: { label: "인권", icon: "⚖️", color: "red" },
  education: { label: "교육", icon: "📚", color: "yellow" },
  health: { label: "건강", icon: "💊", color: "pink" },
  culture: { label: "문화", icon: "🎨", color: "indigo" },
  economy: { label: "경제", icon: "💰", color: "emerald" },
  general: { label: "일반", icon: "👤", color: "gray" },
};

export default async function OpinionLeaderPage() {
  const supabase = await createClient();

  // 현재 사용자 확인
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 오피니언 리더 목록 조회
  const { data: leaders, error } = await supabase
    .schema("donation")
    .from("opinion_leaders")
    .select("*")
    .eq("is_active", true)
    .order("follower_count", { ascending: false });

  if (error) {
    // eslint-disable-next-line no-console
    console.error("Opinion leader fetch error:", error);
  }

  // Array 방어
  const leaderList = Array.isArray(leaders) ? leaders : [];

  // 사용자가 팔로우한 리더 ID 목록 조회
  let followedLeaderIds: string[] = [];
  if (user) {
    const { data: followData } = await supabase
      .schema("donation")
      .from("opinion_leader_followers")
      .select("opinion_leader_id")
      .eq("follower_user_id", user.id);

    const followList = Array.isArray(followData) ? followData : [];
    followedLeaderIds = followList.map(
      (f: { opinion_leader_id: string }) => f.opinion_leader_id
    );
  }

  // 데이터 변환
  const leadersForClient = leaderList.map(
    (leader: {
      id: string;
      display_name: string;
      bio: string | null;
      avatar_url: string | null;
      social_links: Record<string, string> | null;
      verified_at: string | null;
      follower_count: number | null;
      total_donations_influenced: string | number | null;
      category: string | null;
    }) => ({
      id: leader.id,
      displayName: leader.display_name,
      bio: leader.bio || "",
      avatarUrl: leader.avatar_url,
      socialLinks: leader.social_links || {},
      isVerified: !!leader.verified_at,
      followerCount: leader.follower_count || 0,
      totalDonationsInfluenced: Number(leader.total_donations_influenced) || 0,
      category: leader.category || "general",
      categoryLabel:
        categoryLabels[leader.category || "general"]?.label || "일반",
      categoryIcon: categoryLabels[leader.category || "general"]?.icon || "👤",
      categoryColor:
        categoryLabels[leader.category || "general"]?.color || "gray",
      isFollowing: followedLeaderIds.includes(leader.id),
    })
  );

  // 사용자 PMC 잔액 조회
  let userPmcBalance = 0;
  if (user) {
    const { data: account } = await supabase
      .schema("economy")
      .from("pmp_pmc_accounts")
      .select("pmc_balance")
      .eq("user_id", user.id)
      .single();

    const accountData = Array.isArray(account) ? account[0] : account;
    userPmcBalance = Number(accountData?.pmc_balance) || 0;
  }

  return (
    <OpinionLeaderClient
      leaders={leadersForClient}
      userPmcBalance={userPmcBalance}
      isLoggedIn={!!user}
      userId={user?.id || null}
    />
  );
}
