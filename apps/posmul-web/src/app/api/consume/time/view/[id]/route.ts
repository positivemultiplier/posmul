/**
 * TimeConsume Ad View Complete API Route
 * 광고 시청 완료 처리 및 PMP 지급
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * PATCH - 광고 시청 완료
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: viewId } = await params;
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
    const { watchDurationSeconds, surveyCompleted = false } = body;

    if (typeof watchDurationSeconds !== 'number' || watchDurationSeconds < 0) {
      return NextResponse.json(
        { error: '유효한 시청 시간이 필요합니다.' },
        { status: 400 }
      );
    }

    // 시청 기록 조회
    const { data: adView, error: viewError } = await supabase
      .schema('consume')
      .from('ad_views')
      .select('*')
      .eq('id', viewId)
      .single();

    if (viewError || !adView) {
      return NextResponse.json(
        { error: '시청 기록을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 본인 소유 확인
    if (adView.user_id !== user.id) {
      return NextResponse.json(
        { error: '권한이 없습니다.' },
        { status: 403 }
      );
    }

    // 이미 완료된 시청인지 확인
    if (adView.ended_at) {
      return NextResponse.json(
        { error: '이미 완료된 시청 기록입니다.' },
        { status: 400 }
      );
    }

    // 캠페인 조회
    const { data: campaign, error: campaignError } = await supabase
      .schema('consume')
      .from('ad_campaigns')
      .select('*')
      .eq('id', adView.campaign_id)
      .single();

    if (campaignError || !campaign) {
      return NextResponse.json(
        { error: '캠페인 정보를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // PMP 계산
    const completionRate = Math.min(
      (watchDurationSeconds / campaign.duration_seconds) * 100,
      100
    );
    const isCompleted = watchDurationSeconds >= campaign.duration_seconds;

    let pmpEarned = 0;
    if (watchDurationSeconds >= 30) {
      pmpEarned = isCompleted ? campaign.pmp_reward_full : campaign.pmp_reward;
      if (surveyCompleted) {
        pmpEarned += campaign.survey_pmp_bonus;
      }
    }

    // 시청 기록 업데이트
    const { error: updateError } = await supabase
      .schema('consume')
      .from('ad_views')
      .update({
        ended_at: new Date().toISOString(),
        watch_duration_seconds: watchDurationSeconds,
        completion_rate: completionRate,
        is_completed: isCompleted,
        survey_completed: surveyCompleted,
        pmp_earned: pmpEarned,
      })
      .eq('id', viewId);

    if (updateError) {
      console.error('시청 기록 업데이트 오류:', updateError);
      return NextResponse.json(
        { error: '시청 기록을 업데이트하는 데 실패했습니다.' },
        { status: 500 }
      );
    }

    // PMP 지급 (30초 이상 시청 시)
    if (pmpEarned > 0) {
      // 경제 계정에 PMP 추가
      const { error: pmpError } = await supabase
        .schema('economy')
        .from('pmp_pmc_accounts')
        .update({
          pmp_balance: supabase.rpc('increment_pmp', { amount: pmpEarned }),
          last_updated: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      if (pmpError) {
        // 계정이 없으면 생성
        const { error: upsertError } = await supabase
          .schema('economy')
          .from('pmp_pmc_accounts')
          .upsert({
            user_id: user.id,
            pmp_balance: pmpEarned,
            pmc_balance: 0,
            last_updated: new Date().toISOString(),
          });

        if (upsertError) {
          console.error('PMP 지급 오류:', upsertError);
        }
      }

      // 거래 기록 생성
      const description = surveyCompleted
        ? `TimeConsume: ${campaign.title} 시청 + 설문 완료`
        : `TimeConsume: ${campaign.title} 시청 완료`;

      await supabase
        .schema('economy')
        .from('pmp_pmc_transactions')
        .insert({
          user_id: user.id,
          transaction_type: 'PMP_EARN',
          pmp_amount: pmpEarned,
          description,
          metadata: {
            source: 'TIME_CONSUME',
            campaign_id: campaign.id,
            view_id: viewId,
            watch_duration: watchDurationSeconds,
            survey_completed: surveyCompleted,
          },
        });

      // 캠페인 예산 업데이트
      await supabase
        .schema('consume')
        .from('ad_campaigns')
        .update({
          used_budget: campaign.used_budget + pmpEarned,
          updated_at: new Date().toISOString(),
        })
        .eq('id', campaign.id);
    }

    // 일일 통계 업데이트
    const today = new Date().toISOString().split('T')[0];
    const { data: existingStats } = await supabase
      .schema('consume')
      .from('daily_view_stats')
      .select('*')
      .eq('user_id', user.id)
      .eq('view_date', today)
      .single();

    if (existingStats) {
      await supabase
        .schema('consume')
        .from('daily_view_stats')
        .update({
          total_views: existingStats.total_views + 1,
          completed_views: existingStats.completed_views + (isCompleted ? 1 : 0),
          total_watch_time: existingStats.total_watch_time + watchDurationSeconds,
          total_pmp_earned: existingStats.total_pmp_earned + pmpEarned,
          survey_count: existingStats.survey_count + (surveyCompleted ? 1 : 0),
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id)
        .eq('view_date', today);
    } else {
      await supabase
        .schema('consume')
        .from('daily_view_stats')
        .insert({
          user_id: user.id,
          view_date: today,
          total_views: 1,
          completed_views: isCompleted ? 1 : 0,
          total_watch_time: watchDurationSeconds,
          total_pmp_earned: pmpEarned,
          survey_count: surveyCompleted ? 1 : 0,
        });
    }

    // 결과 메시지 생성
    let message: string;
    if (pmpEarned === 0) {
      message = '30초 이상 시청해야 PMP를 획득할 수 있습니다.';
    } else if (surveyCompleted) {
      message = `축하합니다! ${pmpEarned} PMP를 획득했습니다. (시청 + 설문 보상)`;
    } else if (isCompleted) {
      message = `축하합니다! ${pmpEarned} PMP를 획득했습니다. (완전 시청 보상)`;
    } else {
      message = `${pmpEarned} PMP를 획득했습니다. (부분 시청 보상)`;
    }

    return NextResponse.json({
      success: true,
      data: {
        viewId,
        watchDurationSeconds,
        completionRate,
        isCompleted,
        pmpEarned,
        surveyCompleted,
        message,
      },
    });
  } catch (error) {
    console.error('광고 시청 완료 API 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
