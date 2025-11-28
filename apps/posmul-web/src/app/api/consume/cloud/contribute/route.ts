/**
 * CloudConsume Funding Contribution API Route
 * 펀딩 참여 및 PMC 지급
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * POST - 펀딩 참여
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
    const { projectId, amount } = body;

    if (!projectId || !amount) {
      return NextResponse.json(
        { error: '프로젝트 ID와 펀딩 금액이 필요합니다.' },
        { status: 400 }
      );
    }

    // 프로젝트 조회
    const { data: project, error: projectError } = await supabase
      .schema('consume')
      .from('funding_projects')
      .select('*')
      .eq('id', projectId)
      .eq('status', 'ACTIVE')
      .single();

    if (projectError || !project) {
      return NextResponse.json(
        { error: '프로젝트를 찾을 수 없거나 펀딩이 종료되었습니다.' },
        { status: 404 }
      );
    }

    // 최소/최대 펀딩 금액 확인
    if (amount < project.min_contribution) {
      return NextResponse.json(
        { error: `최소 펀딩 금액은 ${project.min_contribution.toLocaleString()}원입니다.` },
        { status: 400 }
      );
    }

    const maxContribution = project.max_contribution ?? 10000000;
    if (amount > maxContribution) {
      return NextResponse.json(
        { error: `최대 펀딩 금액은 ${maxContribution.toLocaleString()}원입니다.` },
        { status: 400 }
      );
    }

    // 마감일 확인
    if (new Date(project.end_date) < new Date()) {
      return NextResponse.json(
        { error: '펀딩 기간이 종료되었습니다.' },
        { status: 400 }
      );
    }

    // PMC 계산 (펀딩 금액 * PMC 비율)
    const pmcEarned = Math.floor(amount * Number(project.pmc_rate) * 100) / 100;

    // 펀딩 참여 기록 생성 (contributions 테이블 사용)
    const { data: contribution, error: insertError } = await supabase
      .schema('consume')
      .from('contributions')
      .insert({
        user_id: user.id,
        project_id: projectId,
        amount,
        pmc_earned: pmcEarned,
        status: 'COMPLETED',
      })
      .select()
      .single();

    if (insertError) {
      console.error('펀딩 참여 기록 생성 오류:', insertError);
      return NextResponse.json(
        { error: '펀딩 참여에 실패했습니다.' },
        { status: 500 }
      );
    }

    // 프로젝트 금액 및 후원자 수 업데이트
    const newCurrentAmount = Number(project.current_amount) + amount;
    const newBackerCount = project.backer_count + 1;
    const newStatus = newCurrentAmount >= project.target_amount ? 'FUNDED' : 'ACTIVE';

    await supabase
      .schema('consume')
      .from('funding_projects')
      .update({
        current_amount: newCurrentAmount,
        backer_count: newBackerCount,
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', projectId);

    // PMC 지급 (economy 스키마 사용)
    if (pmcEarned > 0) {
      // 거래 기록 생성
      await supabase
        .schema('economy')
        .from('pmp_pmc_transactions')
        .insert({
          user_id: user.id,
          transaction_type: 'PMC_EARN',
          pmc_amount: pmcEarned,
          description: `CloudConsume: ${project.title} 펀딩 참여`,
          metadata: {
            source: 'CLOUD_CONSUME',
            project_id: projectId,
            project_title: project.title,
            contribution_id: contribution.id,
            contribution_amount: amount,
          },
        });
    }

    // 현재 PMC 잔액 조회
    const { data: balance } = await supabase
      .schema('economy')
      .from('pmp_pmc_accounts')
      .select('pmc_balance')
      .eq('user_id', user.id)
      .single();

    const progress = Math.min(Math.round((newCurrentAmount / Number(project.target_amount)) * 100), 100);

    return NextResponse.json({
      success: true,
      data: {
        contributionId: contribution.id,
        projectId,
        projectTitle: project.title,
        amount,
        pmcEarned,
        updatedBalance: {
          pmcAvailable: Number(balance?.pmc_balance ?? 0) + pmcEarned,
        },
        projectProgress: {
          currentAmount: newCurrentAmount,
          targetAmount: Number(project.target_amount),
          progress,
          contributorCount: newBackerCount,
        },
        message: `펀딩 참여 완료! ${pmcEarned.toFixed(2)} PMC를 획득했습니다.`,
      },
    });
  } catch (error) {
    console.error('펀딩 참여 API 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

/**
 * GET - 사용자 펀딩 참여 내역 조회
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

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') ?? '20');
    const offset = parseInt(searchParams.get('offset') ?? '0');

    const { data: contributions, error } = await supabase
      .schema('consume')
      .from('contributions')
      .select(`
        *,
        project:funding_projects(title, category, status, target_amount, current_amount)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('펀딩 참여 내역 조회 오류:', error);
      return NextResponse.json(
        { error: '펀딩 참여 내역을 불러오는 데 실패했습니다.' },
        { status: 500 }
      );
    }

    // 총계 계산
    const { data: totals } = await supabase
      .schema('consume')
      .from('contributions')
      .select('amount, pmc_earned')
      .eq('user_id', user.id)
      .eq('status', 'COMPLETED');

    const totalAmount = totals?.reduce((sum, c) => sum + Number(c.amount), 0) ?? 0;
    const totalPmc = totals?.reduce((sum, c) => sum + Number(c.pmc_earned), 0) ?? 0;

    return NextResponse.json({
      success: true,
      data: {
        contributions: (contributions ?? []).map(formatContribution),
        total: totals?.length ?? 0,
        totalPmcEarned: totalPmc,
        totalAmount,
      },
    });
  } catch (error) {
    console.error('펀딩 참여 내역 API 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

interface ProjectInfo {
  title: string;
  category: string;
  status: string;
  target_amount: number;
  current_amount: number;
}

interface ContributionRow {
  id: string;
  amount: number;
  pmc_earned: number;
  status: string;
  created_at: string;
  project: ProjectInfo | null;
}

function formatContribution(row: ContributionRow) {
  return {
    id: row.id,
    amount: Number(row.amount),
    pmcEarned: Number(row.pmc_earned),
    status: row.status,
    createdAt: row.created_at,
    project: row.project ? {
      title: row.project.title,
      category: row.project.category,
    } : null,
  };
}
