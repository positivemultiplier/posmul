/**
 * TimeConsume Ad View Complete API Route
 * 광고 시청 완료 처리 및 PMP 지급
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface RouteParams {
  params: Promise<{ id: string }>;
}

class HttpError extends Error {
  constructor(
    public readonly status: number,
    message: string
  ) {
    super(message);
  }
}

interface PatchBody {
  watchDurationSeconds: number;
  surveyCompleted: boolean;
}

interface AdViewRow {
  id: string;
  user_id: string;
  campaign_id: string;
  ended_at: string | null;
}

interface CampaignRow {
  id: string;
  title: string;
  duration_seconds: number;
  pmp_reward_full: number;
  pmp_reward: number;
  survey_pmp_bonus: number;
  used_budget: number;
}

async function requireUserId(supabase: Awaited<ReturnType<typeof createClient>>): Promise<string> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new HttpError(401, '로그인이 필요합니다.');
  }

  return user.id;
}

async function parsePatchBody(request: NextRequest): Promise<PatchBody> {
  const body = (await request.json()) as Partial<PatchBody>;
  const watchDurationSeconds = body.watchDurationSeconds;
  const surveyCompleted = body.surveyCompleted ?? false;

  if (typeof watchDurationSeconds !== 'number' || watchDurationSeconds < 0) {
    throw new HttpError(400, '유효한 시청 시간이 필요합니다.');
  }

  return { watchDurationSeconds, surveyCompleted };
}

async function getAdView(
  supabase: Awaited<ReturnType<typeof createClient>>,
  viewId: string
): Promise<AdViewRow> {
  const { data: adView, error: viewError } = await supabase
    .schema('consume')
    .from('ad_views')
    .select('*')
    .eq('id', viewId)
    .single();

  if (viewError || !adView) {
    throw new HttpError(404, '시청 기록을 찾을 수 없습니다.');
  }

  return adView as AdViewRow;
}

function assertOwnership(adView: AdViewRow, userId: string) {
  if (adView.user_id !== userId) {
    throw new HttpError(403, '권한이 없습니다.');
  }
}

function assertNotAlreadyEnded(adView: AdViewRow) {
  if (adView.ended_at) {
    throw new HttpError(400, '이미 완료된 시청 기록입니다.');
  }
}

async function getCampaign(
  supabase: Awaited<ReturnType<typeof createClient>>,
  campaignId: string
): Promise<CampaignRow> {
  const { data: campaign, error: campaignError } = await supabase
    .schema('consume')
    .from('ad_campaigns')
    .select('*')
    .eq('id', campaignId)
    .single();

  if (campaignError || !campaign) {
    throw new HttpError(404, '캠페인 정보를 찾을 수 없습니다.');
  }

  return campaign as CampaignRow;
}

function calculateReward(params: {
  watchDurationSeconds: number;
  campaign: CampaignRow;
  surveyCompleted: boolean;
}): {
  completionRate: number;
  isCompleted: boolean;
  pmpEarned: number;
} {
  const completionRate = Math.min(
    (params.watchDurationSeconds / params.campaign.duration_seconds) * 100,
    100
  );
  const isCompleted = params.watchDurationSeconds >= params.campaign.duration_seconds;

  if (params.watchDurationSeconds < 30) {
    return { completionRate, isCompleted, pmpEarned: 0 };
  }

  let pmpEarned = isCompleted
    ? params.campaign.pmp_reward_full
    : params.campaign.pmp_reward;

  if (params.surveyCompleted) {
    pmpEarned += params.campaign.survey_pmp_bonus;
  }

  return { completionRate, isCompleted, pmpEarned };
}

async function updateAdView(
  supabase: Awaited<ReturnType<typeof createClient>>,
  params: {
    viewId: string;
    watchDurationSeconds: number;
    completionRate: number;
    isCompleted: boolean;
    surveyCompleted: boolean;
    pmpEarned: number;
  }
) {
  const { error: updateError } = await supabase
    .schema('consume')
    .from('ad_views')
    .update({
      ended_at: new Date().toISOString(),
      watch_duration_seconds: params.watchDurationSeconds,
      completion_rate: params.completionRate,
      is_completed: params.isCompleted,
      survey_completed: params.surveyCompleted,
      pmp_earned: params.pmpEarned,
    })
    .eq('id', params.viewId);

  if (updateError) {
    void updateError;
    throw new HttpError(500, '시청 기록을 업데이트하는 데 실패했습니다.');
  }
}

async function tryAddPmpToAccount(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  pmpEarned: number
) {
  const { error: pmpError } = await supabase
    .schema('economy')
    .from('pmp_pmc_accounts')
    .update({
      pmp_balance: supabase.rpc('increment_pmp', { amount: pmpEarned }),
      last_updated: new Date().toISOString(),
    })
    .eq('user_id', userId);

  if (!pmpError) return;

  const { error: upsertError } = await supabase
    .schema('economy')
    .from('pmp_pmc_accounts')
    .upsert({
      user_id: userId,
      pmp_balance: pmpEarned,
      pmc_balance: 0,
      last_updated: new Date().toISOString(),
    });

  if (upsertError) {
    void upsertError;
  }
}

async function createPmpTransaction(
  supabase: Awaited<ReturnType<typeof createClient>>,
  params: {
    userId: string;
    pmpEarned: number;
    campaign: CampaignRow;
    viewId: string;
    watchDurationSeconds: number;
    surveyCompleted: boolean;
  }
) {
  const description = params.surveyCompleted
    ? `TimeConsume: ${params.campaign.title} 시청 + 설문 완료`
    : `TimeConsume: ${params.campaign.title} 시청 완료`;

  await supabase
    .schema('economy')
    .from('pmp_pmc_transactions')
    .insert({
      user_id: params.userId,
      transaction_type: 'PMP_EARN',
      pmp_amount: params.pmpEarned,
      description,
      metadata: {
        source: 'TIME_CONSUME',
        campaign_id: params.campaign.id,
        view_id: params.viewId,
        watch_duration: params.watchDurationSeconds,
        survey_completed: params.surveyCompleted,
      },
    });
}

async function updateCampaignBudget(
  supabase: Awaited<ReturnType<typeof createClient>>,
  params: { campaign: CampaignRow; pmpEarned: number }
) {
  await supabase
    .schema('consume')
    .from('ad_campaigns')
    .update({
      used_budget: params.campaign.used_budget + params.pmpEarned,
      updated_at: new Date().toISOString(),
    })
    .eq('id', params.campaign.id);
}

async function updateDailyViewStats(
  supabase: Awaited<ReturnType<typeof createClient>>,
  params: {
    userId: string;
    watchDurationSeconds: number;
    isCompleted: boolean;
    pmpEarned: number;
    surveyCompleted: boolean;
  }
) {
  const today = new Date().toISOString().split('T')[0];
  const { data: existingStats } = await supabase
    .schema('consume')
    .from('daily_view_stats')
    .select('*')
    .eq('user_id', params.userId)
    .eq('view_date', today)
    .single();

  if (existingStats) {
    await supabase
      .schema('consume')
      .from('daily_view_stats')
      .update({
        total_views: existingStats.total_views + 1,
        completed_views: existingStats.completed_views + (params.isCompleted ? 1 : 0),
        total_watch_time: existingStats.total_watch_time + params.watchDurationSeconds,
        total_pmp_earned: existingStats.total_pmp_earned + params.pmpEarned,
        survey_count: existingStats.survey_count + (params.surveyCompleted ? 1 : 0),
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', params.userId)
      .eq('view_date', today);
    return;
  }

  await supabase
    .schema('consume')
    .from('daily_view_stats')
    .insert({
      user_id: params.userId,
      view_date: today,
      total_views: 1,
      completed_views: params.isCompleted ? 1 : 0,
      total_watch_time: params.watchDurationSeconds,
      total_pmp_earned: params.pmpEarned,
      survey_count: params.surveyCompleted ? 1 : 0,
    });
}

function buildResultMessage(params: {
  pmpEarned: number;
  isCompleted: boolean;
  surveyCompleted: boolean;
}): string {
  if (params.pmpEarned === 0) {
    return '30초 이상 시청해야 PMP를 획득할 수 있습니다.';
  }

  if (params.surveyCompleted) {
    return `축하합니다! ${params.pmpEarned} PMP를 획득했습니다. (시청 + 설문 보상)`;
  }

  if (params.isCompleted) {
    return `축하합니다! ${params.pmpEarned} PMP를 획득했습니다. (완전 시청 보상)`;
  }

  return `${params.pmpEarned} PMP를 획득했습니다. (부분 시청 보상)`;
}

/**
 * PATCH - 광고 시청 완료
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { id: viewId } = await params;
  const supabase = await createClient();

  try {
    const userId = await requireUserId(supabase);
    const { watchDurationSeconds, surveyCompleted } = await parsePatchBody(request);

    const adView = await getAdView(supabase, viewId);
    assertOwnership(adView, userId);
    assertNotAlreadyEnded(adView);

    const campaign = await getCampaign(supabase, adView.campaign_id);
    const { completionRate, isCompleted, pmpEarned } = calculateReward({
      watchDurationSeconds,
      campaign,
      surveyCompleted,
    });

    await updateAdView(supabase, {
      viewId,
      watchDurationSeconds,
      completionRate,
      isCompleted,
      surveyCompleted,
      pmpEarned,
    });

    if (pmpEarned > 0) {
      await tryAddPmpToAccount(supabase, userId, pmpEarned);
      await createPmpTransaction(supabase, {
        userId,
        pmpEarned,
        campaign,
        viewId,
        watchDurationSeconds,
        surveyCompleted,
      });
      await updateCampaignBudget(supabase, { campaign, pmpEarned });
    }

    await updateDailyViewStats(supabase, {
      userId,
      watchDurationSeconds,
      isCompleted,
      pmpEarned,
      surveyCompleted,
    });

    const message = buildResultMessage({ pmpEarned, isCompleted, surveyCompleted });

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
    if (error instanceof HttpError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    void error;
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
