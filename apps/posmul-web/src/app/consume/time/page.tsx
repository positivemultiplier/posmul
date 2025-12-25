'use client';

/**
 * TimeConsume Page
 *
 * 시간 투자를 통한 PMP 획득 페이지
 * - 광고 시청
 * - 설문 참여
 *
 * @since 2025-11
 */
import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';
import {
  useAdCampaigns,
  useDailyStats,
  useAdView,
  type AdCampaign,
} from '@/bounded-contexts/consume/presentation/hooks/use-time-consume';

type CurrentView = { viewId: string };

type ViewResult = {
  pmpEarned: number;
  message: string;
  watchDurationSeconds: number;
  completionRate: number;
};

type DailyStats = {
  totalViews: number;
  completedViews: number;
  totalWatchTime: number;
  totalPmpEarned: number;
  currentBalance: { pmp: number; pmc: number };
};

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}초`;
  return `${Math.floor(seconds / 60)}분 ${seconds % 60}초`;
}

function clearWatchTimer(timerRef: React.MutableRefObject<ReturnType<typeof setInterval> | null>): void {
  if (timerRef.current) {
    clearInterval(timerRef.current);
    timerRef.current = null;
  }
}

function getWatchDurationSeconds(startTimeMs: number): number {
  return Math.floor((Date.now() - startTimeMs) / 1000);
}

async function startWatchingCampaign(params: {
  campaign: AdCampaign;
  startView: (campaignId: string) => Promise<unknown>;
  setWatchingCampaign: React.Dispatch<React.SetStateAction<AdCampaign | null>>;
  setWatchProgress: React.Dispatch<React.SetStateAction<number>>;
  timerRef: React.MutableRefObject<ReturnType<typeof setInterval> | null>;
  startTimeRef: React.MutableRefObject<number>;
}): Promise<void> {
  try {
    await params.startView(params.campaign.id);
    params.setWatchingCampaign(params.campaign);
    params.setWatchProgress(0);
    params.startTimeRef.current = Date.now();

    clearWatchTimer(params.timerRef);

    params.timerRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - params.startTimeRef.current) / 1000);
      const progress = Math.min((elapsed / params.campaign.durationSeconds) * 100, 100);
      params.setWatchProgress(progress);

      if (elapsed >= params.campaign.durationSeconds) {
        clearWatchTimer(params.timerRef);
      }
    }, 1000);
  } catch (err) {
    void err;
  }
}

async function completeWatchingCampaign(params: {
  currentView: CurrentView | null;
  watchingCampaign: AdCampaign | null;
  completeView: (viewId: string, watchDurationSeconds: number, surveyCompleted?: boolean) => Promise<unknown>;
  setShowSurvey: React.Dispatch<React.SetStateAction<boolean>>;
  setWatchingCampaign: React.Dispatch<React.SetStateAction<AdCampaign | null>>;
  setWatchProgress: React.Dispatch<React.SetStateAction<number>>;
  refetchCampaigns: () => void;
  refetchStats: () => void;
  timerRef: React.MutableRefObject<ReturnType<typeof setInterval> | null>;
  startTimeRef: React.MutableRefObject<number>;
  withSurvey: boolean;
}): Promise<void> {
  if (!params.currentView || !params.watchingCampaign) return;

  clearWatchTimer(params.timerRef);
  const watchDurationSeconds = getWatchDurationSeconds(params.startTimeRef.current);

  try {
    await params.completeView(params.currentView.viewId, watchDurationSeconds, params.withSurvey);
    params.setShowSurvey(false);
    params.setWatchingCampaign(null);
    params.setWatchProgress(0);
    params.refetchCampaigns();
    params.refetchStats();
  } catch (err) {
    void err;
  }
}

async function cancelWatchingCampaign(params: {
  currentView: CurrentView | null;
  completeView: (viewId: string, watchDurationSeconds: number, surveyCompleted?: boolean) => Promise<unknown>;
  reset: () => void;
  setWatchingCampaign: React.Dispatch<React.SetStateAction<AdCampaign | null>>;
  setWatchProgress: React.Dispatch<React.SetStateAction<number>>;
  timerRef: React.MutableRefObject<ReturnType<typeof setInterval> | null>;
  startTimeRef: React.MutableRefObject<number>;
}): Promise<void> {
  clearWatchTimer(params.timerRef);

  if (params.currentView) {
    const watchDurationSeconds = getWatchDurationSeconds(params.startTimeRef.current);
    await params.completeView(params.currentView.viewId, watchDurationSeconds, false);
  }

  params.setWatchingCampaign(null);
  params.setWatchProgress(0);
  params.reset();
}

function ResultMessage({ result, onClose }: { result: ViewResult | null; onClose: () => void }) {
  if (!result) return null;

  const isSuccess = result.pmpEarned > 0;
  return (
    <div
      className={`rounded-xl p-6 ${
        isSuccess ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'
      }`}
    >
      <div className="flex items-center gap-3">
        <span className="text-2xl">{isSuccess ? '🎉' : '⚠️'}</span>
        <div>
          <p className={`font-semibold ${isSuccess ? 'text-green-800' : 'text-yellow-800'}`}>{result.message}</p>
          {isSuccess && (
            <p className="text-sm text-gray-600 mt-1">
              시청 시간: {result.watchDurationSeconds}초 | 완료율: {result.completionRate.toFixed(0)}%
            </p>
          )}
        </div>
        <button onClick={onClose} className="ml-auto text-gray-500 hover:text-gray-700">
          ✕
        </button>
      </div>
    </div>
  );
}

function ErrorMessage({ error, onClose }: { error: string | null; onClose: () => void }) {
  if (!error) return null;

  return (
    <div className="rounded-xl p-6 bg-red-50 border border-red-200">
      <div className="flex items-center gap-3">
        <span className="text-2xl">❌</span>
        <p className="font-semibold text-red-800">{error}</p>
        <button onClick={onClose} className="ml-auto text-gray-500 hover:text-gray-700">
          ✕
        </button>
      </div>
    </div>
  );
}

function WatchingModal(params: {
  watchingCampaign: AdCampaign | null;
  currentView: CurrentView | null;
  watchProgress: number;
  viewLoading: boolean;
  onOpenSurvey: () => void;
  onComplete: () => void;
  onCompleteEarly: () => void;
  onCancel: () => void;
}) {
  if (!params.watchingCampaign || !params.currentView) return null;

  const campaign = params.watchingCampaign;
  const earlyThreshold = (30 / campaign.durationSeconds) * 100;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-8 max-w-lg w-full mx-4">
        <div className="text-center">
          <div className="text-6xl mb-4">📺</div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">{campaign.title}</h3>
          <p className="text-gray-500 mb-6">{campaign.advertiserName}</p>

          <div className="mb-6">
            <div className="flex justify-between text-sm text-gray-500 mb-2">
              <span>시청 진행률</span>
              <span>{params.watchProgress.toFixed(0)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-purple-500 h-3 rounded-full transition-all duration-1000"
                style={{ width: `${params.watchProgress}%` }}
              />
            </div>
          </div>

          <div className="bg-purple-50 rounded-lg p-4 mb-6">
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <div className="text-gray-500">30초 이상</div>
                <div className="font-bold text-purple-600">+{campaign.pmpReward} PMP</div>
              </div>
              <div>
                <div className="text-gray-500">완전 시청</div>
                <div className="font-bold text-purple-600">+{campaign.pmpRewardFull} PMP</div>
              </div>
              <div>
                <div className="text-gray-500">+설문</div>
                <div className="font-bold text-green-600">+{campaign.surveyPmpBonus} PMP</div>
              </div>
            </div>
          </div>

          {params.watchProgress >= 100 ? (
            <div className="space-y-3">
              <button
                onClick={params.onOpenSurvey}
                disabled={params.viewLoading}
                className="w-full py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {params.viewLoading
                  ? '처리 중...'
                  : `🎁 설문 참여하고 +${campaign.surveyPmpBonus} PMP 더 받기`}
              </button>
              <button
                onClick={params.onComplete}
                disabled={params.viewLoading}
                className="w-full py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors disabled:opacity-50"
              >
                {params.viewLoading ? '처리 중...' : '완료하기'}
              </button>
            </div>
          ) : params.watchProgress >= earlyThreshold ? (
            <button
              onClick={params.onCompleteEarly}
              disabled={params.viewLoading}
              className="w-full py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors disabled:opacity-50"
            >
              {params.viewLoading ? '처리 중...' : `지금 완료 (+${campaign.pmpReward} PMP)`}
            </button>
          ) : (
            <p className="text-gray-500 text-sm">30초 이상 시청해야 PMP를 획득할 수 있습니다</p>
          )}

          <button
            onClick={params.onCancel}
            disabled={params.viewLoading}
            className="mt-4 text-gray-500 hover:text-gray-700 text-sm"
          >
            취소하고 나가기
          </button>
        </div>
      </div>
    </div>
  );
}

function SurveyModal(params: {
  open: boolean;
  campaign: AdCampaign | null;
  viewLoading: boolean;
  onSubmit: () => void;
  onSkip: () => void;
}) {
  if (!params.open || !params.campaign) return null;

  const campaign = params.campaign;
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-8 max-w-lg w-full mx-4">
        <div className="text-center">
          <div className="text-6xl mb-4">📝</div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">간단 설문</h3>
          <p className="text-gray-500 mb-6">
            설문에 참여하시면 +{campaign.surveyPmpBonus} PMP를 추가로 받으실 수 있습니다
          </p>

          <div className="space-y-4 text-left mb-6">
            <div>
              <p className="font-medium mb-2">Q. 이 광고가 유익했나요?</p>
              <div className="flex gap-2">
                {['매우 그렇다', '그렇다', '보통', '아니다'].map((option) => (
                  <button key={option} className="px-3 py-2 border rounded-lg text-sm hover:bg-gray-50">
                    {option}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button
            onClick={params.onSubmit}
            disabled={params.viewLoading}
            className="w-full py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            {params.viewLoading ? '처리 중...' : `설문 완료 (+${campaign.surveyPmpBonus} PMP 추가)`}
          </button>
          <button
            onClick={params.onSkip}
            disabled={params.viewLoading}
            className="mt-3 text-gray-500 hover:text-gray-700 text-sm"
          >
            설문 건너뛰기
          </button>
        </div>
      </div>
    </div>
  );
}

function CampaignList(params: {
  campaignsLoading: boolean;
  campaigns: AdCampaign[];
  viewLoading: boolean;
  hasCurrentView: boolean;
  onStartWatch: (campaign: AdCampaign) => void;
}) {
  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">📋 참여 가능한 캠페인</h2>
      {params.campaignsLoading ? (
        <div className="text-center py-12 text-gray-500">캠페인을 불러오는 중...</div>
      ) : params.campaigns.length === 0 ? (
        <div className="text-center py-12 text-gray-500">참여 가능한 캠페인이 없습니다</div>
      ) : (
        <div className="space-y-4">
          {params.campaigns.map((campaign) => (
            <div key={campaign.id} className="bg-white rounded-xl border p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                      📺 광고 시청
                    </span>
                    <span className="text-sm text-gray-500">{campaign.advertiserName}</span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{campaign.title}</h3>
                  {campaign.description && <p className="text-sm text-gray-600 mb-2">{campaign.description}</p>}
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>⏱️ {formatDuration(campaign.durationSeconds)}</span>
                    <span>📊 일일 {campaign.dailyViewLimit}회 제한</span>
                  </div>
                </div>
                <div className="text-right ml-6">
                  <div className="text-2xl font-bold text-purple-600">+{campaign.pmpRewardFull}</div>
                  <div className="text-sm text-gray-500">PMP (완전 시청)</div>
                  <button
                    onClick={() => params.onStartWatch(campaign)}
                    disabled={params.viewLoading || params.hasCurrentView}
                    className="mt-3 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {params.viewLoading ? '처리 중...' : '참여하기'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function DailyStatsSection(params: { statsLoading: boolean; stats: DailyStats | null }) {
  return (
    <div className="bg-gray-50 rounded-xl p-6">
      <h3 className="font-semibold mb-4">📊 오늘의 활동</h3>
      {params.statsLoading ? (
        <div className="text-center py-4 text-gray-500">통계를 불러오는 중...</div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">{params.stats?.totalViews ?? 0}</div>
            <div className="text-sm text-gray-500">총 시청</div>
          </div>
          <div className="bg-white rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{params.stats?.completedViews ?? 0}</div>
            <div className="text-sm text-gray-500">완전 시청</div>
          </div>
          <div className="bg-white rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">
              {Math.floor((params.stats?.totalWatchTime ?? 0) / 60)}분
            </div>
            <div className="text-sm text-gray-500">총 시청 시간</div>
          </div>
          <div className="bg-white rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-indigo-600">+{params.stats?.totalPmpEarned ?? 0}</div>
            <div className="text-sm text-gray-500">획득 PMP</div>
          </div>
        </div>
      )}

      {params.stats && (
        <div className="mt-4 pt-4 border-t">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">현재 보유 잔액</span>
            <div className="flex gap-4">
              <span className="font-bold text-purple-600">{params.stats.currentBalance.pmp.toLocaleString()} PMP</span>
              <span className="font-bold text-green-600">{params.stats.currentBalance.pmc.toLocaleString()} PMC</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TimeConsumePage() {
  const { campaigns, loading: campaignsLoading, refetch: refetchCampaigns } = useAdCampaigns();
  const { stats, loading: statsLoading, refetch: refetchStats } = useDailyStats();
  const { currentView, result, loading: viewLoading, error: viewError, startView, completeView, reset } = useAdView();

  const [watchingCampaign, setWatchingCampaign] = useState<AdCampaign | null>(null);
  const [watchProgress, setWatchProgress] = useState(0);
  const [showSurvey, setShowSurvey] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);

  // 광고 시청 시작
  const handleStartWatch = async (campaign: AdCampaign) => {
    await startWatchingCampaign({
      campaign,
      startView,
      setWatchingCampaign,
      setWatchProgress,
      timerRef,
      startTimeRef,
    });
  };

  // 광고 시청 완료
  const handleCompleteWatch = async (withSurvey: boolean = false) => {
    await completeWatchingCampaign({
      currentView: currentView as CurrentView | null,
      watchingCampaign,
      completeView,
      setShowSurvey,
      setWatchingCampaign,
      setWatchProgress,
      refetchCampaigns,
      refetchStats,
      timerRef,
      startTimeRef,
      withSurvey,
    });
  };

  // 광고 시청 취소
  const handleCancelWatch = async () => {
    await cancelWatchingCampaign({
      currentView: currentView as CurrentView | null,
      completeView,
      reset,
      setWatchingCampaign,
      setWatchProgress,
      timerRef,
      startTimeRef,
    });
  };

  // 컴포넌트 언마운트 시 타이머 정리
  useEffect(() => {
    return () => {
      clearWatchTimer(timerRef);
    };
  }, []);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/consume"
            className="text-sm text-gray-500 hover:text-gray-700 mb-2 inline-block"
          >
            ← Consume
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">⏰ TimeConsume</h1>
          <p className="text-gray-600 mt-2">
            시간을 투자하고 PMP를 획득하세요
          </p>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-500">오늘 획득한 PMP</div>
          <div className="text-2xl font-bold text-purple-600">
            {statsLoading ? '...' : `+${stats?.totalPmpEarned ?? 0} PMP`}
          </div>
        </div>
      </div>

      {/* PMP Info Banner */}
      <div className="bg-gradient-to-r from-purple-500 to-indigo-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold mb-2">
              💡 PMP는 Expect를 통해 PMC로 변환됩니다
            </h2>
            <p className="text-purple-100 text-sm">
              TimeConsume으로 획득한 PMP는 Expect(예측 게임)에서 성공하면 PMC로 변환됩니다.
              <br />
              PMC로 변환된 후에야 Donation이 가능합니다.
            </p>
          </div>
          <Link
            href="/prediction"
            className="bg-white text-purple-600 px-6 py-3 rounded-lg font-semibold hover:bg-purple-50 transition-colors flex-shrink-0"
          >
            Expect 게임 가기 →
          </Link>
        </div>
      </div>

      {/* Result Message */}
      <ResultMessage result={result as ViewResult | null} onClose={reset} />

      {/* Error Message */}
      <ErrorMessage error={viewError} onClose={reset} />

      {/* Watching Modal */}
      <WatchingModal
        watchingCampaign={watchingCampaign}
        currentView={currentView as CurrentView | null}
        watchProgress={watchProgress}
        viewLoading={viewLoading}
        onOpenSurvey={() => setShowSurvey(true)}
        onComplete={() => handleCompleteWatch(false)}
        onCompleteEarly={() => handleCompleteWatch(false)}
        onCancel={handleCancelWatch}
      />

      {/* Survey Modal */}
      <SurveyModal
        open={showSurvey}
        campaign={watchingCampaign}
        viewLoading={viewLoading}
        onSubmit={() => handleCompleteWatch(true)}
        onSkip={() => {
          setShowSurvey(false);
          handleCompleteWatch(false);
        }}
      />

      {/* Campaign List */}
      <CampaignList
        campaignsLoading={campaignsLoading}
        campaigns={campaigns}
        viewLoading={viewLoading}
        hasCurrentView={!!currentView}
        onStartWatch={handleStartWatch}
      />

      {/* Daily Stats */}
      <DailyStatsSection statsLoading={statsLoading} stats={stats as DailyStats | null} />
    </div>
  );
}
