/**
 * 기관 기부 페이지
 * 
 * 신뢰할 수 있는 기관을 통한 기부 페이지
 * DB에서 기부 기관 목록을 불러와 표시
 * 
 * @author PosMul Development Team
 * @since 2024-12
 */
import { createClient } from "../../../lib/supabase/server";
import { InstituteClient } from "./client";

// 카테고리 라벨 매핑
const categoryLabels: Record<string, { label: string; icon: string }> = {
  children: { label: "아동복지", icon: "👶" },
  elderly: { label: "노인복지", icon: "👴" },
  disaster: { label: "재난구호", icon: "🆘" },
  environment: { label: "환경보전", icon: "🌿" },
  education: { label: "교육지원", icon: "📚" },
  medical: { label: "의료지원", icon: "🏥" },
  animal: { label: "동물보호", icon: "🐾" },
  other: { label: "기타", icon: "💝" },
};

export default async function InstitutePage() {
  const supabase = await createClient();

  // 현재 사용자 확인
  const { data: { user } } = await supabase.auth.getUser();

  // 기부 기관 목록 조회
  const { data: institutes, error } = await supabase
    .schema("donation")
    .from("donation_institutes")
    .select("*")
    .eq("is_active", true)
    .order("trust_score", { ascending: false });

  if (error) {
    // eslint-disable-next-line no-console
    console.error("Institute fetch error:", error);
  }

  // Array 방어
  const instituteList = Array.isArray(institutes) ? institutes : [];

  // 데이터 변환
  const institutesForClient = instituteList.map((inst: {
    id: string;
    name: string;
    description: string | null;
    category: string;
    website_url: string | null;
    trust_score: string | number | null;
    is_verified: boolean;
  }) => ({
    id: inst.id,
    name: inst.name,
    description: inst.description || "",
    category: inst.category,
    categoryLabel: categoryLabels[inst.category]?.label || inst.category,
    categoryIcon: categoryLabels[inst.category]?.icon || "💝",
    websiteUrl: inst.website_url,
    trustScore: Number(inst.trust_score) || 0,
    isVerified: inst.is_verified,
  }));

  return (
    <InstituteClient 
      institutes={institutesForClient}
      isLoggedIn={!!user}
    />
  );
}
