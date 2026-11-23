
import { createClient } from "../../../../lib/supabase/server";
import { CategoryClient } from "./client";

// 카테고리 라벨 매핑 (Shared config로 이동 권장)
const categoryLabels: Record<string, { label: string; icon: string }> = {
    children: { label: "아동복지", icon: "" },
    elderly: { label: "노인복지", icon: "" },
    disaster: { label: "재난구호", icon: "" },
    environment: { label: "환경보전", icon: "" },
    education: { label: "교육지원", icon: "" },
    medical: { label: "의료지원", icon: "" },
    animal: { label: "동물보호", icon: "" },
    other: { label: "기타", icon: "" },
};

export default async function CategoryPage({
    params
}: {
    params: Promise<{ subcategory: string }>
}) {
    const { subcategory } = await params;
    const categoryInfo = categoryLabels[subcategory] || { label: subcategory, icon: "" };

    const supabase = await createClient();

    // Fetch institutes filtered by category
    const { data: institutes, error } = await supabase
        .schema("donation")
        .from("donation_institutes")
        .select("*")
        .eq("is_active", true)
        .eq("category", subcategory)
        .order("trust_score", { ascending: false });

    if (error) {
        console.error("Institute fetch error:", error);
    }

    const instituteList = Array.isArray(institutes) ? institutes : [];

    const institutesForClient = instituteList.map((inst) => ({
        id: inst.id,
        name: inst.name,
        description: inst.description || "",
        category: inst.category,
        categoryLabel: categoryLabels[inst.category]?.label || inst.category,
        categoryIcon: categoryLabels[inst.category]?.icon || "",
        websiteUrl: inst.website_url,
        trustScore: Number(inst.trust_score) || 0,
        isVerified: inst.is_verified,
    }));

    return (
        <CategoryClient
            categorySlug={subcategory}
            categoryLabel={categoryInfo.label}
            categoryIcon={categoryInfo.icon}
            institutes={institutesForClient}
        />
    );
}
