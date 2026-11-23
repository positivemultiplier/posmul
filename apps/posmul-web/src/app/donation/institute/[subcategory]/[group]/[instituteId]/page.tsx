/**
 * 기부 기관 상세 페이지 (Depth 5)
 * 
 * 기관 정보, 기부 현황, 투명성 보고서 등을 표시
 * 
 * @author PosMul Development Team
 * @since 2024-12
 */
import { notFound } from "next/navigation";
import { createClient } from "../../../../../../lib/supabase/server";
import { InstituteDetailClient } from "./client";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

function unwrapFirst<T>(data: T | T[] | null | undefined): T | null {
  if (!data) return null;
  return Array.isArray(data) ? (data[0] ?? null) : data;
}

function toArray<T>(data: T | T[] | null | undefined): T[] {
  if (!data) return [];
  return Array.isArray(data) ? data : [data];
}

async function getCurrentUser(supabase: SupabaseServerClient) {
  const { data } = await supabase.auth.getUser();
  return data.user;
}

async function fetchActiveInstitute(
  supabase: SupabaseServerClient,
  instituteId: string
) {
  const { data: institute, error } = await supabase
    .schema("donation")
    .from("donation_institutes")
    .select("*")
    .eq("id", instituteId)
    .eq("is_active", true)
    .single();

  const instData = unwrapFirst(institute);
  return { instData, error };
}

async function fetchDonationStats(supabase: SupabaseServerClient, instituteId: string) {
  const { data: donations } = await supabase
    .schema("donation")
    .from("donations")
    .select("pmc_amount, created_at")
    .eq("institute_id", instituteId)
    .eq("status", "completed");

  const donationList = toArray(donations as { pmc_amount: number; created_at: string }[] | { pmc_amount: number; created_at: string } | null);
  const totalDonations = donationList.length;
  const totalAmount = donationList.reduce(
    (sum: number, d: { pmc_amount: number }) => sum + (Number(d.pmc_amount) || 0),
    0
  );

  return { totalDonations, totalAmount };
}

async function fetchRecentDonations(supabase: SupabaseServerClient, instituteId: string) {
  const { data: recentDonations } = await supabase
    .schema("donation")
    .from("donations")
    .select("pmc_amount, created_at, is_anonymous")
    .eq("institute_id", instituteId)
    .eq("status", "completed")
    .order("created_at", { ascending: false })
    .limit(10);

  return toArray(
    recentDonations as
    | { pmc_amount: number; created_at: string; is_anonymous: boolean }[]
    | { pmc_amount: number; created_at: string; is_anonymous: boolean }
    | null
  );
}

async function fetchUserPmcBalance(
  supabase: SupabaseServerClient,
  userId: string | undefined
) {
  if (!userId) return 0;

  const { data: account } = await supabase
    .schema("economy")
    .from("pmp_pmc_accounts")
    .select("pmc_balance")
    .eq("user_id", userId)
    .single();

  const accountData = unwrapFirst(account as { pmc_balance: number } | { pmc_balance: number }[] | null);
  return Number(accountData?.pmc_balance) || 0;
}

async function fetchTransparencyReports(supabase: SupabaseServerClient, instituteId: string) {
  const { data: transparencyReports } = await supabase
    .schema("economy")
    .from("transparency_reports")
    .select("*")
    .eq("institute_id", instituteId)
    .order("report_period_end", { ascending: false })
    .limit(5);

  return toArray(transparencyReports as unknown[] | null);
}

async function fetchOpinionLeaders(supabase: SupabaseServerClient, instituteId: string) {
  const { data: endorsements } = await supabase
    .schema("donation")
    .from("opinion_leader_endorsements")
    .select(
      `
      id,
      endorsement_message,
      endorsed_at,
      opinion_leader_id
    `
    )
    .eq("institute_id", instituteId)
    .eq("is_active", true);

  const endorsementList = toArray(
    endorsements as
    | {
      opinion_leader_id: string;
      endorsement_message: string;
      endorsed_at: string;
    }[]
    | {
      opinion_leader_id: string;
      endorsement_message: string;
      endorsed_at: string;
    }
    | null
  );

  const leaderIds = endorsementList.map((e) => e.opinion_leader_id);
  if (leaderIds.length === 0) return [] as Array<{
    id: string;
    displayName: string;
    bio: string;
    avatarUrl: string | null;
    followerCount: number;
    isVerified: boolean;
    endorsementMessage: string;
    endorsedAt: string;
  }>;

  const { data: leaders } = await supabase
    .schema("donation")
    .from("opinion_leaders")
    .select("*")
    .in("id", leaderIds)
    .eq("is_active", true);

  const leaderList = toArray(
    leaders as
    | {
      id: string;
      display_name: string;
      bio: string | null;
      avatar_url: string | null;
      follower_count: number;
      verified_at: string | null;
    }[]
    | {
      id: string;
      display_name: string;
      bio: string | null;
      avatar_url: string | null;
      follower_count: number;
      verified_at: string | null;
    }
    | null
  );

  return leaderList.map((leader) => {
    const endorsement = endorsementList.find(
      (e) => e.opinion_leader_id === leader.id
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

interface InstituteDetailPageProps {
  params: Promise<{
    subcategory: string;
    group: string;
    instituteId: string;
  }>;
}

export default async function InstituteDetailPage({ params }: InstituteDetailPageProps) {
  const { instituteId } = await params;
  const supabase = await createClient();

  const user = await getCurrentUser(supabase);

  const { instData, error } = await fetchActiveInstitute(supabase, instituteId);
  if (error || !instData) {
    notFound();
  }

  const { totalDonations, totalAmount } = await fetchDonationStats(
    supabase,
    instituteId
  );

  const recentList = await fetchRecentDonations(supabase, instituteId);
  const userPmcBalance = await fetchUserPmcBalance(supabase, user?.id);
  const reportsList = await fetchTransparencyReports(supabase, instituteId);
  const opinionLeaders = await fetchOpinionLeaders(supabase, instituteId);

  // 카테고리 라벨 매핑
  const categoryLabels: Record<string, { label: string; icon: string; color: string }> = {
    children: { label: "아동복지", icon: "", color: "from-pink-500 to-rose-500" },
    elderly: { label: "노인복지", icon: "", color: "from-amber-500 to-orange-500" },
    disaster: { label: "재난구호", icon: "", color: "from-red-500 to-rose-600" },
    environment: { label: "환경보전", icon: "", color: "from-green-500 to-emerald-500" },
    education: { label: "교육지원", icon: "", color: "from-blue-500 to-indigo-500" },
    medical: { label: "의료지원", icon: "", color: "from-cyan-500 to-teal-500" },
    animal: { label: "동물보호", icon: "", color: "from-yellow-500 to-amber-500" },
    other: { label: "기타", icon: "", color: "from-purple-500 to-violet-500" },
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
      transparencyReports={(reportsList as Array<{
        id: string;
        report_period_start: string;
        report_period_end: string;
        total_received: number;
        total_used: number;
        usage_breakdown: Record<string, number> | null;
        impact_metrics: Record<string, number> | null;
        report_url: string | null;
        published_at: string | null;
      }>).map((r) => ({
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
