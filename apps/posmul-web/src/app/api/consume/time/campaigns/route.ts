/**
 * TimeConsume Ad Campaigns API Route
 * 광고 캠페인 목록 조회
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    
    // 활성 광고 캠페인 조회
    const { data: campaigns, error } = await supabase
      .schema('consume')
      .from('ad_campaigns')
      .select('*')
      .eq('status', 'ACTIVE')
      .lt('used_budget', supabase.rpc('raw', { sql: 'total_budget' }))
      .order('created_at', { ascending: false });

    if (error) {
      // RPC가 없을 경우 일반 쿼리 시도
      const { data: fallbackCampaigns, error: fallbackError } = await supabase
        .schema('consume')
        .from('ad_campaigns')
        .select('*')
        .eq('status', 'ACTIVE')
        .order('created_at', { ascending: false });

      if (fallbackError) {
        void fallbackError;
        return NextResponse.json(
          { error: '광고 캠페인을 불러오는 데 실패했습니다.' },
          { status: 500 }
        );
      }

      // 클라이언트에서 예산 필터링
      const activeCampaigns = (fallbackCampaigns ?? []).filter(
        (c: { used_budget: number; total_budget: number }) => c.used_budget < c.total_budget
      );

      return NextResponse.json({
        success: true,
        data: activeCampaigns.map(formatCampaign),
      });
    }

    return NextResponse.json({
      success: true,
      data: (campaigns ?? []).map(formatCampaign),
    });
  } catch (error) {
    void error;
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

interface CampaignRow {
  id: string;
  title: string;
  description: string | null;
  advertiser_name: string;
  video_url: string | null;
  thumbnail_url: string | null;
  duration_seconds: number;
  pmp_reward: number;
  pmp_reward_full: number;
  survey_pmp_bonus: number;
  daily_view_limit: number;
  total_budget: number;
  used_budget: number;
  status: string;
}

function formatCampaign(row: CampaignRow) {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    advertiserName: row.advertiser_name,
    videoUrl: row.video_url,
    thumbnailUrl: row.thumbnail_url,
    durationSeconds: row.duration_seconds,
    pmpReward: row.pmp_reward,
    pmpRewardFull: row.pmp_reward_full,
    surveyPmpBonus: row.survey_pmp_bonus,
    dailyViewLimit: row.daily_view_limit,
    remainingBudget: row.total_budget - row.used_budget,
    status: row.status,
  };
}
