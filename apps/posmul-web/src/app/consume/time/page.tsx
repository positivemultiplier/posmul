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

export default function TimeConsumePage() {
  const { campaigns, loading: campaignsLoading, refetch: refetchCampaigns } = useAdCampaigns();
  const { stats, loading: statsLoading, refetch: refetchStats } = useDailyStats();
  const { currentView, result, loading: viewLoading, error: viewError, startView, completeView, reset } = useAdView();

  const [watchingCampaign, setWatchingCampaign] = useState<AdCampaign | null>(null);
  const [watchProgress, setWatchProgress] = useState(0);
  const [showSurvey, setShowSurvey] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  // 광고 시청 시작
  const handleStartWatch = async (campaign: AdCampaign) => {
    try {
      await startView(campaign.id);
      setWatchingCampaign(campaign);
      setWatchProgress(0);
      startTimeRef.current = Date.now();

      // 1초마다 진행 상황 업데이트
      timerRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
        const progress = Math.min((elapsed / campaign.durationSeconds) * 100, 100);
        setWatchProgress(progress);

        if (elapsed >= campaign.durationSeconds) {
          if (timerRef.current) {
            clearInterval(timerRef.current);
          }
        }
      }, 1000);
    } catch (err) {
      console.error('시청 시작 실패:', err);
    }
  };

  // 광고 시청 완료
  const handleCompleteWatch = async (withSurvey: boolean = false) => {
    if (!currentView || !watchingCampaign) return;

    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    const watchDuration = Math.floor((Date.now() - startTimeRef.current) / 1000);

    try {
      await completeView(currentView.viewId, watchDuration, withSurvey);
      setShowSurvey(false);
      setWatchingCampaign(null);
      setWatchProgress(0);
      refetchCampaigns();
      refetchStats();
    } catch (err) {
      console.error('시청 완료 실패:', err);
    }
  };

  // 광고 시청 취소
  const handleCancelWatch = async () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    if (currentView) {
      const watchDuration = Math.floor((Date.now() - startTimeRef.current) / 1000);
      await completeView(currentView.viewId, watchDuration, false);
    }
    
    setWatchingCampaign(null);
    setWatchProgress(0);
    reset();
  };

  // 컴포넌트 언마운트 시 타이머 정리
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}초`;
    return `${Math.floor(seconds / 60)}분 ${seconds % 60}초`;
  };

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
      {result && (
        <div className={`rounded-xl p-6 ${result.pmpEarned > 0 ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'}`}>
          <div className="flex items-center gap-3">
            <span className="text-2xl">{result.pmpEarned > 0 ? '🎉' : '⚠️'}</span>
            <div>
              <p className={`font-semibold ${result.pmpEarned > 0 ? 'text-green-800' : 'text-yellow-800'}`}>
                {result.message}
              </p>
              {result.pmpEarned > 0 && (
                <p className="text-sm text-gray-600 mt-1">
                  시청 시간: {result.watchDurationSeconds}초 | 완료율: {result.completionRate.toFixed(0)}%
                </p>
              )}
            </div>
            <button
              onClick={() => reset()}
              className="ml-auto text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Error Message */}
      {viewError && (
        <div className="rounded-xl p-6 bg-red-50 border border-red-200">
          <div className="flex items-center gap-3">
            <span className="text-2xl">❌</span>
            <p className="font-semibold text-red-800">{viewError}</p>
            <button
              onClick={() => reset()}
              className="ml-auto text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Watching Modal */}
      {watchingCampaign && currentView && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 max-w-lg w-full mx-4">
            <div className="text-center">
              <div className="text-6xl mb-4">📺</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {watchingCampaign.title}
              </h3>
              <p className="text-gray-500 mb-6">{watchingCampaign.advertiserName}</p>

              {/* Progress Bar */}
              <div className="mb-6">
                <div className="flex justify-between text-sm text-gray-500 mb-2">
                  <span>시청 진행률</span>
                  <span>{watchProgress.toFixed(0)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-purple-500 h-3 rounded-full transition-all duration-1000"
                    style={{ width: `${watchProgress}%` }}
                  />
                </div>
              </div>

              {/* Reward Info */}
              <div className="bg-purple-50 rounded-lg p-4 mb-6">
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <div className="text-gray-500">30초 이상</div>
                    <div className="font-bold text-purple-600">+{watchingCampaign.pmpReward} PMP</div>
                  </div>
                  <div>
                    <div className="text-gray-500">완전 시청</div>
                    <div className="font-bold text-purple-600">+{watchingCampaign.pmpRewardFull} PMP</div>
                  </div>
                  <div>
                    <div className="text-gray-500">+설문</div>
                    <div className="font-bold text-green-600">+{watchingCampaign.surveyPmpBonus} PMP</div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              {watchProgress >= 100 ? (
                <div className="space-y-3">
                  <button
                    onClick={() => setShowSurvey(true)}
                    disabled={viewLoading}
                    className="w-full py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    {viewLoading ? '처리 중...' : `🎁 설문 참여하고 +${watchingCampaign.surveyPmpBonus} PMP 더 받기`}
                  </button>
                  <button
                    onClick={() => handleCompleteWatch(false)}
                    disabled={viewLoading}
                    className="w-full py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors disabled:opacity-50"
                  >
                    {viewLoading ? '처리 중...' : '완료하기'}
                  </button>
                </div>
              ) : watchProgress >= (30 / watchingCampaign.durationSeconds) * 100 ? (
                <button
                  onClick={() => handleCompleteWatch(false)}
                  disabled={viewLoading}
                  className="w-full py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors disabled:opacity-50"
                >
                  {viewLoading ? '처리 중...' : `지금 완료 (+${watchingCampaign.pmpReward} PMP)`}
                </button>
              ) : (
                <p className="text-gray-500 text-sm">30초 이상 시청해야 PMP를 획득할 수 있습니다</p>
              )}

              <button
                onClick={handleCancelWatch}
                disabled={viewLoading}
                className="mt-4 text-gray-500 hover:text-gray-700 text-sm"
              >
                취소하고 나가기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Survey Modal */}
      {showSurvey && watchingCampaign && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 max-w-lg w-full mx-4">
            <div className="text-center">
              <div className="text-6xl mb-4">📝</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">간단 설문</h3>
              <p className="text-gray-500 mb-6">
                설문에 참여하시면 +{watchingCampaign.surveyPmpBonus} PMP를 추가로 받으실 수 있습니다
              </p>

              <div className="space-y-4 text-left mb-6">
                <div>
                  <p className="font-medium mb-2">Q. 이 광고가 유익했나요?</p>
                  <div className="flex gap-2">
                    {['매우 그렇다', '그렇다', '보통', '아니다'].map((option) => (
                      <button
                        key={option}
                        className="px-3 py-2 border rounded-lg text-sm hover:bg-gray-50"
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleCompleteWatch(true)}
                disabled={viewLoading}
                className="w-full py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {viewLoading ? '처리 중...' : `설문 완료 (+${watchingCampaign.surveyPmpBonus} PMP 추가)`}
              </button>
              <button
                onClick={() => {
                  setShowSurvey(false);
                  handleCompleteWatch(false);
                }}
                disabled={viewLoading}
                className="mt-3 text-gray-500 hover:text-gray-700 text-sm"
              >
                설문 건너뛰기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Campaign List */}
      <div>
        <h2 className="text-xl font-semibold mb-4">📋 참여 가능한 캠페인</h2>
        {campaignsLoading ? (
          <div className="text-center py-12 text-gray-500">캠페인을 불러오는 중...</div>
        ) : campaigns.length === 0 ? (
          <div className="text-center py-12 text-gray-500">참여 가능한 캠페인이 없습니다</div>
        ) : (
          <div className="space-y-4">
            {campaigns.map((campaign) => (
              <div
                key={campaign.id}
                className="bg-white rounded-xl border p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                        📺 광고 시청
                      </span>
                      <span className="text-sm text-gray-500">{campaign.advertiserName}</span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {campaign.title}
                    </h3>
                    {campaign.description && (
                      <p className="text-sm text-gray-600 mb-2">{campaign.description}</p>
                    )}
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>⏱️ {formatDuration(campaign.durationSeconds)}</span>
                      <span>📊 일일 {campaign.dailyViewLimit}회 제한</span>
                    </div>
                  </div>
                  <div className="text-right ml-6">
                    <div className="text-2xl font-bold text-purple-600">
                      +{campaign.pmpRewardFull}
                    </div>
                    <div className="text-sm text-gray-500">PMP (완전 시청)</div>
                    <button
                      onClick={() => handleStartWatch(campaign)}
                      disabled={viewLoading || !!currentView}
                      className="mt-3 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {viewLoading ? '처리 중...' : '참여하기'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Daily Stats */}
      <div className="bg-gray-50 rounded-xl p-6">
        <h3 className="font-semibold mb-4">📊 오늘의 활동</h3>
        {statsLoading ? (
          <div className="text-center py-4 text-gray-500">통계를 불러오는 중...</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">{stats?.totalViews ?? 0}</div>
              <div className="text-sm text-gray-500">총 시청</div>
            </div>
            <div className="bg-white rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{stats?.completedViews ?? 0}</div>
              <div className="text-sm text-gray-500">완전 시청</div>
            </div>
            <div className="bg-white rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">
                {Math.floor((stats?.totalWatchTime ?? 0) / 60)}분
              </div>
              <div className="text-sm text-gray-500">총 시청 시간</div>
            </div>
            <div className="bg-white rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-indigo-600">+{stats?.totalPmpEarned ?? 0}</div>
              <div className="text-sm text-gray-500">획득 PMP</div>
            </div>
          </div>
        )}

        {/* Current Balance */}
        {stats && (
          <div className="mt-4 pt-4 border-t">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">현재 보유 잔액</span>
              <div className="flex gap-4">
                <span className="font-bold text-purple-600">{stats.currentBalance.pmp.toLocaleString()} PMP</span>
                <span className="font-bold text-green-600">{stats.currentBalance.pmc.toLocaleString()} PMC</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
