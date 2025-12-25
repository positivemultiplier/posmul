/**
 * TimeConsume Ad View API Route
 * 광고 시청 시작/완료 처리
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * POST - 광고 시청 시작
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // 사용자 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: '로그인이 필요합니다.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { campaignId, deviceInfo } = body;

    if (!campaignId) {
      return NextResponse.json(
        { error: '캠페인 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    // 캠페인 조회
    const { data: campaign, error: campaignError } = await supabase
      .schema('consume')
      .from('ad_campaigns')
      .select('*')
      .eq('id', campaignId)
      .single();

    if (campaignError || !campaign) {
      return NextResponse.json(
        { error: '캠페인을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    if (campaign.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: '이 캠페인은 현재 활성 상태가 아닙니다.' },
        { status: 400 }
      );
    }

    if (campaign.used_budget >= campaign.total_budget) {
      return NextResponse.json(
        { error: '이 캠페인의 예산이 소진되었습니다.' },
        { status: 400 }
      );
    }

    // 일일 시청 횟수 확인
    const today = new Date().toISOString().split('T')[0];
    const { count, error: countError } = await supabase
      .schema('consume')
      .from('ad_views')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('campaign_id', campaignId)
      .eq('view_date', today);

    if (countError) {
      void countError;
    }

    if ((count ?? 0) >= campaign.daily_view_limit) {
      return NextResponse.json(
        { error: `오늘 이 광고의 일일 시청 한도(${campaign.daily_view_limit}회)에 도달했습니다.` },
        { status: 400 }
      );
    }

    // 시청 기록 생성
    const { data: adView, error: insertError } = await supabase
      .schema('consume')
      .from('ad_views')
      .insert({
        user_id: user.id,
        campaign_id: campaignId,
        view_date: today,
        started_at: new Date().toISOString(),
        device_info: deviceInfo ?? null,
      })
      .select()
      .single();

    if (insertError) {
      void insertError;
      return NextResponse.json(
        { error: '시청 기록을 생성하는 데 실패했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        viewId: adView.id,
        campaignId: campaign.id,
        campaignTitle: campaign.title,
        durationSeconds: campaign.duration_seconds,
        pmpReward: campaign.pmp_reward,
        pmpRewardFull: campaign.pmp_reward_full,
        surveyPmpBonus: campaign.survey_pmp_bonus,
        startedAt: adView.started_at,
      },
    });
  } catch (error) {
    void error;
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
