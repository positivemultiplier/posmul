/**
 * TimeConsume Daily Stats API Route
 * 사용자 일일 시청 통계 조회
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET - 일일 시청 통계 조회
 */
export async function GET(request: NextRequest) {
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

    // URL에서 날짜 파라미터 추출 (기본값: 오늘)
    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get('date');
    const date = dateParam ?? new Date().toISOString().split('T')[0];

    // 일일 통계 조회
    const { data: stats, error: statsError } = await supabase
      .schema('consume')
      .from('daily_view_stats')
      .select('*')
      .eq('user_id', user.id)
      .eq('view_date', date)
      .single();

    if (statsError && statsError.code !== 'PGRST116') {
      void statsError;
      return NextResponse.json(
        { error: '통계를 불러오는 데 실패했습니다.' },
        { status: 500 }
      );
    }

    // 경제 계정 잔액 조회
    const { data: account } = await supabase
      .schema('economy')
      .from('pmp_pmc_accounts')
      .select('pmp_balance, pmc_balance')
      .eq('user_id', user.id)
      .single();

    return NextResponse.json({
      success: true,
      data: {
        date,
        totalViews: stats?.total_views ?? 0,
        completedViews: stats?.completed_views ?? 0,
        totalWatchTime: stats?.total_watch_time ?? 0,
        totalPmpEarned: stats?.total_pmp_earned ?? 0,
        surveyCount: stats?.survey_count ?? 0,
        currentBalance: {
          pmp: Number(account?.pmp_balance ?? 0),
          pmc: Number(account?.pmc_balance ?? 0),
        },
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
