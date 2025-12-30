import { notFound } from "next/navigation";
import { createClient } from "../../../../../lib/supabase/server";
import { DirectDonationDetailClient } from "./client";

export const dynamic = 'force-dynamic';

export default async function DirectDonationDetailPage(props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const { id } = params;
    const supabase = await createClient();

    // 펀딩 프로젝트 단건 조회
    const { data: project, error } = await supabase
        .schema("donation")
        .from("funding_projects")
        .select("*")
        .eq("id", id)
        .single();

    if (error || !project) {
        console.error("Project fetch error:", error);
        return notFound();
    }

    // 현재 사용자 확인
    const { data: { user } } = await supabase.auth.getUser();

    // 데이터 가공
    const processedProject = {
        ...project,
        achievementRate: Math.min(100, Math.round((project.current_quantity / project.target_quantity) * 100)),
    };

    return (
        <DirectDonationDetailClient
            project={processedProject}
            isLoggedIn={!!user}
            currentUserId={user?.id || null}
        />
    );
}
