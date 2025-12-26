
import { createClient } from "../../../../lib/supabase/server";
import { OpinionLeaderCategoryClient } from "./client";

const categoryLabels: Record<string, string> = {
    environment: "환경",
    welfare: "복지",
    science: "과학",
    human_rights: "인권",
    education: "교육",
    health: "건강",
    culture: "문화",
    economy: "경제",
    general: "일반",
};

export default async function OpinionLeaderCategoryPage({
    params,
}: {
    params: Promise<{ subcategory: string }>;
}) {
    const { subcategory } = await params;
    const label = categoryLabels[subcategory] || subcategory;

    const supabase = await createClient();

    // 현재 사용자 (팔로우 여부 확인용)
    const { data: { user } } = await supabase.auth.getUser();

    const { data: leaders, error } = await supabase
        .schema("donation")
        .from("opinion_leaders")
        .select("*")
        .eq("is_active", true)
        .eq("category", subcategory)
        .order("follower_count", { ascending: false });

    if (error) {
        console.error("Fetch Error:", error);
    }

    const leaderList = Array.isArray(leaders) ? leaders : [];

    // 팔로우 여부 확인
    let followedLeaderIds: string[] = [];
    if (user) {
        const { data: followData } = await supabase
            .schema("donation")
            .from("opinion_leader_followers")
            .select("opinion_leader_id")
            .eq("follower_user_id", user.id);

        const followList = Array.isArray(followData) ? followData : [];
        followedLeaderIds = followList.map((f: { opinion_leader_id: string }) => f.opinion_leader_id);
    }

    const leadersForClient = leaderList.map((leader) => ({
        id: leader.id,
        displayName: leader.display_name,
        bio: leader.bio || "",
        avatarUrl: leader.avatar_url,
        socialLinks: leader.social_links || {},
        isVerified: !!leader.verified_at,
        followerCount: leader.follower_count || 0,
        totalDonationsInfluenced: Number(leader.total_donations_influenced) || 0,
        category: leader.category || "general",
        categoryLabel: categoryLabels[leader.category || "general"] || "일반",
        categoryIcon: "👤", // Icon logic simplified for now
        categoryColor: "gray",
        isFollowing: followedLeaderIds.includes(leader.id),
    }));

    return (
        <OpinionLeaderCategoryClient
            category={subcategory}
            categoryLabel={label}
            leaders={leadersForClient}
        />
    );
}
