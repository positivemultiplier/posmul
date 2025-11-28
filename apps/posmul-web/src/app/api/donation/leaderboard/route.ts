/**
 * 기부 리더보드 API
 * 
 * 기부 랭킹을 조회합니다.
 * 
 * @author PosMul Development Team
 * @since 2024-12
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../../lib/supabase/server";

interface LeaderboardEntry {
  rank: number;
  userId: string;
  displayName: string;
  totalAmount: number;
  donationCount: number;
  isAnonymous: boolean;
  badge: string | null;
}

interface DonationData {
  donor_id: string;
  pmc_amount: number;
  is_anonymous: boolean;
}

interface UserAggregate {
  totalAmount: number;
  donationCount: number;
  isAnonymous: boolean;
}

// 기부 배지 결정
function getBadge(totalAmount: number): string | null {
  if (totalAmount >= 1000000) return "diamond";
  if (totalAmount >= 500000) return "platinum";
  if (totalAmount >= 100000) return "gold";
  if (totalAmount >= 50000) return "silver";
  if (totalAmount >= 10000) return "bronze";
  return null;
}

// 기간에 따른 시작일 계산
function getStartDate(period: string): string | null {
  const now = new Date();
  
  if (period === "weekly") {
    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 7);
    return weekAgo.toISOString();
  }
  
  if (period === "monthly") {
    const monthAgo = new Date(now);
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    return monthAgo.toISOString();
  }
  
  return null; // "all" 기간
}

// 사용자별 기부 집계
function aggregateDonations(donations: DonationData[]): Record<string, UserAggregate> {
  const userAggregates: Record<string, UserAggregate> = {};

  for (const donation of donations) {
    const donorId = donation.donor_id;
    if (!userAggregates[donorId]) {
      userAggregates[donorId] = {
        totalAmount: 0,
        donationCount: 0,
        isAnonymous: donation.is_anonymous,
      };
    }
    userAggregates[donorId].totalAmount += Number(donation.pmc_amount) || 0;
    userAggregates[donorId].donationCount += 1;
    if (!donation.is_anonymous) {
      userAggregates[donorId].isAnonymous = false;
    }
  }

  return userAggregates;
}

// 리더보드 데이터 생성
function createLeaderboard(
  userAggregates: Record<string, UserAggregate>,
  userProfiles: Record<string, string>
): LeaderboardEntry[] {
  return Object.entries(userAggregates)
    .map(([userId, data]) => ({
      rank: 0,
      userId,
      displayName: userProfiles[userId] || "사용자",
      totalAmount: data.totalAmount,
      donationCount: data.donationCount,
      isAnonymous: data.isAnonymous,
      badge: getBadge(data.totalAmount),
    }))
    .sort((a, b) => b.totalAmount - a.totalAmount)
    .slice(0, 20)
    .map((entry, index) => ({
      ...entry,
      rank: index + 1,
    }));
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const period = searchParams.get("period") || "monthly";

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  try {
    const startDate = getStartDate(period);

    // 기부 집계 쿼리
    let query = supabase
      .schema("donation")
      .from("donations")
      .select("donor_id, pmc_amount, is_anonymous")
      .eq("status", "completed");

    if (startDate) {
      query = query.gte("created_at", startDate);
    }

    const { data: donations, error } = await query;

    if (error) {
      return NextResponse.json({
        success: false,
        error: { message: "기부 데이터 조회 실패", code: error.code },
      }, { status: 500 });
    }

    const donationList = Array.isArray(donations) ? donations : [];
    const userAggregates = aggregateDonations(donationList);
    const userIds = Object.keys(userAggregates);

    // 사용자 프로필 조회
    const userProfiles: Record<string, string> = {};
    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from("user_profiles")
        .select("id, username")
        .in("id", userIds);

      const profileList = Array.isArray(profiles) ? profiles : [];
      for (const profile of profileList) {
        userProfiles[profile.id] = profile.username || "사용자";
      }
    }

    const leaderboardData = createLeaderboard(userAggregates, userProfiles);

    // 현재 사용자의 랭킹
    let userRank: LeaderboardEntry | null = null;
    if (user && userAggregates[user.id]) {
      const allRankings = Object.entries(userAggregates)
        .sort(([, a], [, b]) => b.totalAmount - a.totalAmount);
      
      const userIndex = allRankings.findIndex(([id]) => id === user.id);
      if (userIndex !== -1) {
        userRank = {
          rank: userIndex + 1,
          userId: user.id,
          displayName: userProfiles[user.id] || "나",
          totalAmount: userAggregates[user.id].totalAmount,
          donationCount: userAggregates[user.id].donationCount,
          isAnonymous: userAggregates[user.id].isAnonymous,
          badge: getBadge(userAggregates[user.id].totalAmount),
        };
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        leaderboard: leaderboardData,
        userRank,
        period,
        totalDonors: userIds.length,
      },
    });

  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Leaderboard API error:", error);
    return NextResponse.json({
      success: false,
      error: { message: "서버 오류가 발생했습니다." },
    }, { status: 500 });
  }
}
