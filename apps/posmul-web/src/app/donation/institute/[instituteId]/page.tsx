/**
 * 기부 기관 상세 페이지
 * 
 * 기관 정보, 기부 현황, 투명성 보고서 등을 표시
 * 
 * @author PosMul Development Team
 * @since 2024-12
 */
import { notFound } from "next/navigation";
import { createClient } from "../../../../lib/supabase/server";
import { InstituteDetailClient } from "./client";

interface InstituteDetailPageProps {
  params: Promise<{
    instituteId: string;
  }>;
}

export default async function InstituteDetailPage({ params }: InstituteDetailPageProps) {
  const { instituteId } = await params;
  const supabase = await createClient();

  // 현재 사용자 확인
  const { data: { user } } = await supabase.auth.getUser();

  // 기관 정보 조회
  const { data: institute, error } = await supabase
    .schema("donation")
    .from("donation_institutes")
    .select("*")
    .eq("id", instituteId)
    .eq("is_active", true)
    .single();

  const instData = Array.isArray(institute) ? institute[0] : institute;

  if (error || !instData) {
    notFound();
  }

  // 해당 기관의 총 기부 통계 조회
  const { data: donations } = await supabase
    .schema("donation")
    .from("donations")
    .select("pmc_amount, created_at")
    .eq("institute_id", instituteId)
    .eq("status", "completed");

  const donationList = Array.isArray(donations) ? donations : (donations ? [donations] : []);
  
  const totalDonations = donationList.length;
  const totalAmount = donationList.reduce((sum: number, d: { pmc_amount: number }) => 
    sum + (Number(d.pmc_amount) || 0), 0
  );

  // 최근 기부 내역 (익명 처리)
  const { data: recentDonations } = await supabase
    .schema("donation")
    .from("donations")
    .select("pmc_amount, created_at, is_anonymous")
    .eq("institute_id", instituteId)
    .eq("status", "completed")
    .order("created_at", { ascending: false })
    .limit(10);

  const recentList = Array.isArray(recentDonations) ? recentDonations : [];

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

  // 투명성 보고서 조회
  const { data: transparencyReports } = await supabase
    .schema("economy")
    .from("transparency_reports")
    .select("*")
    .eq("institute_id", instituteId)
    .order("report_period_end", { ascending: false })
    .limit(5);

  const reportsList = Array.isArray(transparencyReports) ? transparencyReports : [];

  // 오피니언 리더 후원 정보 조회
  const { data: endorsements } = await supabase
    .schema("donation")
    .from("opinion_leader_endorsements")
    .select(`
      id,
      endorsement_message,
      endorsed_at,
      opinion_leader_id
    `)
    .eq("institute_id", instituteId)
    .eq("is_active", true);

  const endorsementList = Array.isArray(endorsements) ? endorsements : [];

  // 오피니언 리더 상세 정보 조회
  const leaderIds = endorsementList.map((e: { opinion_leader_id: string }) => e.opinion_leader_id);
  let opinionLeaders: Array<{
    id: string;
    displayName: string;
    bio: string;
    avatarUrl: string | null;
    followerCount: number;
    isVerified: boolean;
    endorsementMessage: string;
    endorsedAt: string;
  }> = [];

  if (leaderIds.length > 0) {
    const { data: leaders } = await supabase
      .schema("donation")
      .from("opinion_leaders")
      .select("*")
      .in("id", leaderIds)
      .eq("is_active", true);

    const leaderList = Array.isArray(leaders) ? leaders : [];
    
    opinionLeaders = leaderList.map((leader: {
      id: string;
      display_name: string;
      bio: string | null;
      avatar_url: string | null;
      follower_count: number;
      verified_at: string | null;
    }) => {
      const endorsement = endorsementList.find(
        (e: { opinion_leader_id: string }) => e.opinion_leader_id === leader.id
      );
      return {
        id: leader.id,
        displayName: leader.display_name,
        bio: leader.bio || "",
        avatarUrl: leader.avatar_url,
        followerCount: leader.follower_count || 0,
        isVerified: !!leader.verified_at,
        endorsementMessage: endorsement?.endorsement_message || "",
        endorsedAt: endorsement?.endorsed_at || "",
      };
    });
  }

  // 카테고리 라벨 매핑
  const categoryLabels: Record<string, { label: string; icon: string; color: string }> = {
    children: { label: "아동복지", icon: "👶", color: "from-pink-500 to-rose-500" },
    elderly: { label: "노인복지", icon: "👴", color: "from-amber-500 to-orange-500" },
    disaster: { label: "재난구호", icon: "🆘", color: "from-red-500 to-rose-600" },
    environment: { label: "환경보전", icon: "🌿", color: "from-green-500 to-emerald-500" },
    education: { label: "교육지원", icon: "📚", color: "from-blue-500 to-indigo-500" },
    medical: { label: "의료지원", icon: "🏥", color: "from-cyan-500 to-teal-500" },
    animal: { label: "동물보호", icon: "🐾", color: "from-yellow-500 to-amber-500" },
    other: { label: "기타", icon: "💝", color: "from-purple-500 to-violet-500" },
  };

  const categoryInfo = categoryLabels[instData.category] || categoryLabels.other;

  return (
    <InstituteDetailClient
      institute={{
        id: instData.id,
        name: instData.name,
        description: instData.description || "",
        category: instData.category,
        categoryLabel: categoryInfo.label,
        categoryIcon: categoryInfo.icon,
        categoryColor: categoryInfo.color,
        websiteUrl: instData.website_url,
        contactEmail: instData.contact_email,
        contactPhone: instData.contact_phone,
        registrationNumber: instData.registration_number,
        trustScore: Number(instData.trust_score) || 0,
        isVerified: instData.is_verified,
      }}
      stats={{
        totalDonations,
        totalAmount,
        donorCount: totalDonations, // 간단히 기부 건수로 대체
      }}
      recentDonations={recentList.map((d: { pmc_amount: number; created_at: string; is_anonymous: boolean }) => ({
        amount: Number(d.pmc_amount) || 0,
        createdAt: d.created_at,
        isAnonymous: d.is_anonymous,
      }))}
      transparencyReports={reportsList.map((r: {
        id: string;
        report_period_start: string;
        report_period_end: string;
        total_received: number;
        total_used: number;
        usage_breakdown: Record<string, number> | null;
        impact_metrics: Record<string, number> | null;
        report_url: string | null;
        published_at: string | null;
      }) => ({
        id: r.id,
        periodStart: r.report_period_start,
        periodEnd: r.report_period_end,
        totalReceived: Number(r.total_received) || 0,
        totalUsed: Number(r.total_used) || 0,
        usageBreakdown: r.usage_breakdown || {},
        impactMetrics: r.impact_metrics || {},
        reportUrl: r.report_url,
        publishedAt: r.published_at,
      }))}
      opinionLeaders={opinionLeaders}
      userPmcBalance={userPmcBalance}
      isLoggedIn={!!user}
    />
  );
}
