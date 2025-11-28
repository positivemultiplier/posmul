import { createClient } from "../../../lib/supabase/server";
import { HistoryClient } from "./client";

interface DonationRecord {
  id: string;
  donationType: string;
  amount: number;
  pmcAmount: number;
  title: string;
  category: string;
  status: string;
  isAnonymous: boolean;
  createdAt: string;
  completedAt: string | null;
  instituteName?: string;
}

export default async function DonationHistoryPage() {
  const supabase = await createClient();

  // 사용자 확인
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            로그인이 필요합니다
          </h1>
          <a
            href="/auth/login"
            className="inline-block px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
          >
            로그인하기
          </a>
        </div>
      </div>
    );
  }

  // 기부 내역 조회
  const { data: donations, error } = await supabase
    .schema("donation")
    .from("donations")
    .select(
      `
      id,
      donation_type,
      amount,
      pmc_amount,
      title,
      category,
      status,
      is_anonymous,
      created_at,
      completed_at,
      institute_id
    `
    )
    .eq("donor_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    // eslint-disable-next-line no-console
    console.error("Donation history fetch error:", error);
  }

  const donationList = Array.isArray(donations) ? donations : [];

  // 기관 정보 조회
  const instituteIds = donationList
    .filter((d) => d.institute_id)
    .map((d) => d.institute_id);

  let instituteMap: Record<string, string> = {};

  if (instituteIds.length > 0) {
    const { data: institutes } = await supabase
      .schema("donation")
      .from("donation_institutes")
      .select("id, name")
      .in("id", instituteIds);

    const instituteList = Array.isArray(institutes) ? institutes : [];

    instituteMap = instituteList.reduce(
      (
        acc: Record<string, string>,
        inst: { id: string; name: string }
      ) => {
        acc[inst.id] = inst.name;
        return acc;
      },
      {}
    );
  }

  // 통계 계산
  const stats = {
    totalCount: donationList.length,
    totalAmount: donationList.reduce(
      (sum, d) => sum + (Number(d.pmc_amount) || 0),
      0
    ),
    instituteCount: new Set(donationList.map((d) => d.institute_id).filter(Boolean))
      .size,
  };

  // 데이터 변환
  const formattedDonations: DonationRecord[] = donationList.map((d) => ({
    id: d.id,
    donationType: d.donation_type,
    amount: Number(d.amount),
    pmcAmount: Number(d.pmc_amount),
    title: d.title,
    category: d.category,
    status: d.status,
    isAnonymous: d.is_anonymous,
    createdAt: d.created_at,
    completedAt: d.completed_at,
    instituteName: d.institute_id ? instituteMap[d.institute_id] : undefined,
  }));

  return <HistoryClient donations={formattedDonations} stats={stats} />;
}
