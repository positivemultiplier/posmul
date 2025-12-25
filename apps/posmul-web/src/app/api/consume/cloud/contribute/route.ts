/**
 * CloudConsume Funding Contribution API Route
 * 펀딩 참여 및 PMC 지급
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function jsonError(status: number, message: string) {
  return NextResponse.json({ error: message }, { status });
}

function parseContributionBody(body: unknown):
  | { ok: true; data: { projectId: string; amount: number } }
  | { ok: false; response: NextResponse } {
  if (!isRecord(body)) {
    return { ok: false, response: jsonError(400, '프로젝트 ID와 펀딩 금액이 필요합니다.') };
  }

  const projectId = body['projectId'];
  const amount = body['amount'];

  if (typeof projectId !== 'string' || typeof amount !== 'number') {
    return { ok: false, response: jsonError(400, '프로젝트 ID와 펀딩 금액이 필요합니다.') };
  }

  return { ok: true, data: { projectId, amount } };
}

function validateProjectContribution(params: {
  project: Record<string, unknown>;
  amount: number;
}): NextResponse | null {
  const { project, amount } = params;

  const minContribution = Number(project['min_contribution']);
  const maxContribution = project['max_contribution'] ?? 10000000;
  const endDate = project['end_date'];

  if (amount < minContribution) {
    return jsonError(
      400,
      `최소 펀딩 금액은 ${minContribution.toLocaleString()}원입니다.`
    );
  }

  const normalizedMax = Number(maxContribution);
  if (amount > normalizedMax) {
    return jsonError(
      400,
      `최대 펀딩 금액은 ${normalizedMax.toLocaleString()}원입니다.`
    );
  }

  if (typeof endDate === 'string' && new Date(endDate) < new Date()) {
    return jsonError(400, '펀딩 기간이 종료되었습니다.');
  }

  return null;
}

/**
 * POST - 펀딩 참여
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // 사용자 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return jsonError(401, '로그인이 필요합니다.');

    const body: unknown = await request.json();
    const parsedBody = parseContributionBody(body);
    if (parsedBody.ok === false) return parsedBody.response;
    const { projectId, amount } = parsedBody.data;

    // 프로젝트 조회
    const { data: project, error: projectError } = await supabase
      .schema('consume')
      .from('funding_projects')
      .select('*')
      .eq('id', projectId)
      .eq('status', 'ACTIVE')
      .single();

    const projectData = Array.isArray(project) ? project[0] : project;
    if (projectError || !projectData) {
      return jsonError(404, '프로젝트를 찾을 수 없거나 펀딩이 종료되었습니다.');
    }

    const validationErrorResponse = validateProjectContribution({
      project: projectData,
      amount,
    });
    if (validationErrorResponse) return validationErrorResponse;

    // PMC 계산 (펀딩 금액 * PMC 비율)
    const pmcEarned =
      Math.floor(amount * Number(projectData.pmc_rate) * 100) / 100;

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

    if (insertError) return jsonError(500, '펀딩 참여에 실패했습니다.');

    // 프로젝트 금액 및 후원자 수 업데이트
    const newCurrentAmount = Number(projectData.current_amount) + amount;
    const newBackerCount = Number(projectData.backer_count) + 1;
    const newStatus =
      newCurrentAmount >= Number(projectData.target_amount) ? 'FUNDED' : 'ACTIVE';

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
          description: `CloudConsume: ${projectData.title} 펀딩 참여`,
          metadata: {
            source: 'CLOUD_CONSUME',
            project_id: projectId,
            project_title: projectData.title,
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

    const progress = Math.min(
      Math.round((newCurrentAmount / Number(projectData.target_amount)) * 100),
      100
    );

    return NextResponse.json({
      success: true,
      data: {
        contributionId: contribution.id,
        projectId,
        projectTitle: projectData.title,
        amount,
        pmcEarned,
        updatedBalance: {
          pmcAvailable: Number(balance?.pmc_balance ?? 0) + pmcEarned,
        },
        projectProgress: {
          currentAmount: newCurrentAmount,
          targetAmount: Number(projectData.target_amount),
          progress,
          contributorCount: newBackerCount,
        },
        message: `펀딩 참여 완료! ${pmcEarned.toFixed(2)} PMC를 획득했습니다.`,
      },
    });
  } catch (error) {
    void error;
    return jsonError(500, '서버 오류가 발생했습니다.');
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
    void error;
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
