
import { createClient } from "../../../../../lib/supabase/server";
import { GroupClient } from "./client";

// 그룹 테마 매핑 (Mock)
const themeConfig: Record<string, { title: string; description: string }> = {
    "winter-campaign": {
        title: "따뜻한 겨울나기 캠페인",
        description: "추운 겨울, 소외된 이웃들에게 따뜻한 온기를 전해주세요. 난방비 지원부터 방한용품 전달까지."
    },
    "emergency-relief": {
        title: "긴급 구호 연대",
        description: "재난으로 삶의 터전을 잃은 분들을 위한 긴급 지원 네트워크입니다."
    },
    "education-support": {
        title: "미래를 여는 교육 지원",
        description: "모든 아이들이 꿈을 꿀 수 있도록 교육 기회를 제공하는 기관들입니다."
    }
};

// 카테고리 라벨 매핑 (복사함 - Shared Config 권장)
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

export default async function GroupPage({
    params
}: {
    params: Promise<{ subcategory: string; group: string }>
}) {
    const { subcategory, group } = await params;

    // 테마 정보 가져오기 (없으면 기본값)
    const theme = themeConfig[group] || {
        title: `${group} 컬렉션`,
        description: `${subcategory} 분야의 ${group} 관련 기관들을 모았습니다.`
    };

    const supabase = await createClient();

    // 해당 카테고리의 모든 기관 가져오기 (그룹 필터가 없으므로)
    // 실제로는 donation_institutes에 group_tags 같은 컬럼이 있어야 함.
    const { data: institutes, error } = await supabase
        .schema("donation")
        .from("donation_institutes")
        .select("*")
        .eq("is_active", true)
        .eq("category", subcategory) // 일단 카테고리로 필터링
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
        <GroupClient
            groupSlug={group}
            subcategorySlug={subcategory}
            themeTitle={theme.title}
            themeDescription={theme.description}
            institutes={institutesForClient}
        />
    );
}
