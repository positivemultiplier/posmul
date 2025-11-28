/**
 * Unified Ranking API Route
 * 통합 랭킹 조회 API
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

type RankingCategory = 'overall' | 'forum' | 'consume' | 'expect' | 'donation';
type RankingPeriod = 'all' | 'monthly' | 'weekly';

interface RankingEntry {
  rank: number;
  userId: string;
  displayName: string;
  score: number;
  details: {
    forumPmp?: number;
    consumePmc?: number;
    expectPmc?: number;
    donationPmc?: number;
    postsCount?: number;
    donationCount?: number;
  };
  badge: string | null;
  isCurrentUser: boolean;
}

interface UserProfile {
  id: string;
  username: string | null;
  display_name: string | null;
}

interface ScoreEntry {
  user_id: string;
  contribution_score: number;
  forum_pmp_earned: number;
  forum_posts_count: number;
  money_consume_pmc: number;
  cloud_consume_pmc: number;
  expect_pmc_earned: number;
  donation_total_pmc: number;
  donation_count: number;
}

// 카테고리별 정렬 기준
function getOrderColumn(category: RankingCategory): string {
  const columns: Record<RankingCategory, string> = {
    forum: 'forum_pmp_earned',
    consume: 'money_consume_pmc',
    expect: 'expect_pmc_earned',
    donation: 'donation_total_pmc',
    overall: 'contribution_score',
  };
  return columns[category];
}

// 카테고리별 점수 계산
function getScoreByCategory(entry: ScoreEntry, category: RankingCategory): number {
  const scores: Record<RankingCategory, number> = {
    forum: entry.forum_pmp_earned ?? 0,
    consume: (entry.money_consume_pmc ?? 0) + (entry.cloud_consume_pmc ?? 0),
    expect: entry.expect_pmc_earned ?? 0,
    donation: entry.donation_total_pmc ?? 0,
    overall: entry.contribution_score ?? 0,
  };
  return scores[category];
}

// 배지 계산 - 기부
function getDonationBadge(score: number): string | null {
  if (score >= 1000000) return '💎 다이아몬드';
  if (score >= 500000) return '🌟 플래티넘';
  if (score >= 100000) return '🏅 골드';
  if (score >= 50000) return '🎖️ 실버';
  if (score >= 10000) return '🎗️ 브론즈';
  return null;
}

// 배지 계산 - 포럼
function getForumBadge(score: number): string | null {
  if (score >= 10000) return '📝 마스터';
  if (score >= 5000) return '📖 전문가';
  if (score >= 1000) return '✍️ 활동가';
  return null;
}

// 배지 계산 - 종합
function getOverallBadge(score: number): string | null {
  if (score >= 10000) return '👑 레전드';
  if (score >= 5000) return '⭐ 마스터';
  if (score >= 2000) return '🔥 열정';
  if (score >= 500) return '🌱 성장';
  return null;
}

// 배지 결정
function getBadge(score: number, category: RankingCategory): string | null {
  if (category === 'donation') return getDonationBadge(score);
  if (category === 'forum') return getForumBadge(score);
  if (category === 'overall') return getOverallBadge(score);
  return null;
}

// 랭킹 엔트리 포맷팅
function formatRankingEntry(
  entry: ScoreEntry,
  index: number,
  profileMap: Map<string, UserProfile>,
  category: RankingCategory,
  currentUserId: string | undefined
): RankingEntry {
  const profile = profileMap.get(entry.user_id);
  const score = getScoreByCategory(entry, category);
  
  return {
    rank: index + 1,
    userId: entry.user_id,
    displayName: profile?.display_name ?? profile?.username ?? `사용자 ${index + 1}`,
    score,
    details: {
      forumPmp: entry.forum_pmp_earned,
      consumePmc: (entry.money_consume_pmc ?? 0) + (entry.cloud_consume_pmc ?? 0),
      expectPmc: entry.expect_pmc_earned,
      donationPmc: entry.donation_total_pmc,
      postsCount: entry.forum_posts_count,
      donationCount: entry.donation_count,
    },
    badge: getBadge(score, category),
    isCurrentUser: entry.user_id === currentUserId,
  };
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    
    const category = (searchParams.get('category') ?? 'overall') as RankingCategory;
    const period = (searchParams.get('period') ?? 'all') as RankingPeriod;
    const limit = parseInt(searchParams.get('limit') ?? '20');

    // 현재 사용자 확인
    const { data: { user } } = await supabase.auth.getUser();
    const currentUserId = user?.id;

    // 카테고리별 정렬 기준
    const orderColumn = getOrderColumn(category);

    // 랭킹 데이터 조회
    const { data: rankings, error } = await supabase
      .schema('ranking')
      .from('user_scores')
      .select('*')
      .order(orderColumn, { ascending: false })
      .limit(limit);

    if (error) {
      return NextResponse.json(
        { error: '랭킹을 불러오는 데 실패했습니다.' },
        { status: 500 }
      );
    }

    // 사용자 프로필 조회
    const userIds = rankings?.map(r => r.user_id) ?? [];
    const { data: profiles } = await supabase
      .from('user_profiles')
      .select('id, username, display_name')
      .in('id', userIds);

    const profileMap = new Map(
      (profiles as UserProfile[] | null)?.map(p => [p.id, p]) ?? []
    );

    // 랭킹 데이터 포맷팅
    const formattedRankings = (rankings as ScoreEntry[] ?? []).map((entry, index) =>
      formatRankingEntry(entry, index, profileMap, category, currentUserId)
    );

    // 통계 계산
    const { count: totalParticipants } = await supabase
      .schema('ranking')
      .from('user_scores')
      .select('*', { count: 'exact', head: true });

    return NextResponse.json({
      success: true,
      data: {
        rankings: formattedRankings,
        currentUser: formattedRankings.find(r => r.isCurrentUser) ?? null,
        meta: {
          category,
          period,
          totalParticipants: totalParticipants ?? 0,
          lastUpdated: new Date().toISOString(),
        },
      },
    });
  } catch {
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
