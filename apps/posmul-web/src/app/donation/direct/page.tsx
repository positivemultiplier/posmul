
import { createClient } from "../../../lib/supabase/server";
import { DirectDonationClient } from "./client";

// Force dynamic rendering to ensure fresh data
export const dynamic = 'force-dynamic';

// 카테고리 라벨 데이터 (공통 사용)
const categoryMap: Record<string, { label: string; icon: string }> = {
  clothing: { label: "의류/잡화", icon: "👕" },
  food: { label: "식품/생필품", icon: "🍚" },
  education: { label: "교육/도서", icon: "📚" },
  electronics: { label: "가전/디지털", icon: "🔌" },
  medical: { label: "의료/건강", icon: "💊" },
};

export default async function DirectDonationPage() {
  const supabase = await createClient();

  // 현재 사용자 확인
  const { data: { user } } = await supabase.auth.getUser();

  // 펀딩 프로젝트 목록 조회
  const { data: projects, error } = await supabase
    .schema("donation")
    .from("funding_projects")
    .select("*")
    .eq("status", "ongoing")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Funding projects fetch error:", error);
  }

  // 데이터 가공
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fundingProjects = (projects || []).map((project: any) => ({
    ...project,
    categoryLabel: categoryMap[project.category]?.label || "기타",
    categoryIcon: categoryMap[project.category]?.icon || "🎁",
    achievementRate: Math.min(100, Math.round((project.current_quantity / project.target_quantity) * 100)),
  }));

  return (
    <DirectDonationClient
      projects={fundingProjects}
      isLoggedIn={!!user}
      currentUserId={user?.id || null}
    />
  );
}
