/**
 * Forum PMP Status Card Component
 *
 * 오늘의 Forum 활동 현황 및 PMP 획득량 표시
 */
"use client";

import { useEffect } from "react";
import { useForumActivity } from "../hooks/use-forum";

interface ActivityDisplayProps {
  type: string;
  label: string;
  count: number;
  remaining: number;
  pmpEarned: number;
  pmpPerAction: number;
}

function ActivityDisplay({
  label,
  count,
  remaining,
  pmpEarned,
  pmpPerAction,
}: ActivityDisplayProps) {
  const total = count + remaining;
  const progress = total > 0 ? (count / total) * 100 : 0;

  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-medium text-gray-700">{label}</span>
          <span className="text-xs text-gray-500">
            {count}/{total}회 ({pmpPerAction} PMP/회)
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-1.5">
          <div
            className={`h-1.5 rounded-full transition-all ${
              progress >= 100 ? "bg-orange-500" : "bg-green-500"
            }`}
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
      </div>
      <div className="ml-4 text-right">
        <span className="text-sm font-semibold text-green-600">+{pmpEarned}</span>
      </div>
    </div>
  );
}

export function ForumPmpStatusCard() {
  const { activity, loading, error, fetchActivity } = useForumActivity();

  useEffect(() => {
    fetchActivity();
  }, [fetchActivity]);

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4" />
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-8 bg-gray-100 rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-red-200 p-6">
        <p className="text-red-600 text-sm">{error}</p>
        <button
          onClick={fetchActivity}
          className="mt-2 text-sm text-blue-600 hover:underline"
        >
          다시 시도
        </button>
      </div>
    );
  }

  if (!activity) return null;

  const { today, limits } = activity;
  const limitMap = new Map(limits.map((l) => [l.type, l]));

  const activityLabels: Record<string, string> = {
    debate: "토론 글 작성",
    brainstorming: "브레인스토밍",
    discussion: "일반 토론",
    question: "질문 작성",
    comment: "댓글 작성",
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-4">
        <div className="flex items-center justify-between text-white">
          <div>
            <h3 className="text-lg font-bold">오늘의 PMP 획득</h3>
            <p className="text-green-100 text-sm">Forum 활동으로 PMP를 모으세요!</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">{today.totalPmpEarned}</div>
            <div className="text-green-100 text-sm">/ {today.dailyMaxPmp} PMP</div>
          </div>
        </div>

        {/* 전체 진행률 */}
        <div className="mt-3">
          <div className="w-full bg-green-400/30 rounded-full h-2">
            <div
              className="h-2 rounded-full bg-white transition-all"
              style={{
                width: `${Math.min((today.totalPmpEarned / today.dailyMaxPmp) * 100, 100)}%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* Activity Details */}
      <div className="p-4">
        <h4 className="text-sm font-semibold text-gray-600 mb-3">활동별 현황</h4>
        <div className="space-y-1">
          {Object.entries(today.activities).map(([type, data]) => {
            const limitInfo = limitMap.get(type);
            return (
              <ActivityDisplay
                key={type}
                type={type}
                label={activityLabels[type] || type}
                count={data.count}
                remaining={data.remaining}
                pmpEarned={data.pmpEarned}
                pmpPerAction={limitInfo?.pmpPerAction || 0}
              />
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="bg-gray-50 px-4 py-3 border-t border-gray-100">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">남은 획득 가능량</span>
          <span className="font-semibold text-gray-700">
            {today.dailyMaxRemaining} PMP
          </span>
        </div>
      </div>
    </div>
  );
}

/**
 * Compact version for sidebar or smaller areas
 */
export function ForumPmpStatusCompact() {
  const { activity, loading, fetchActivity } = useForumActivity();

  useEffect(() => {
    fetchActivity();
  }, [fetchActivity]);

  if (loading || !activity) {
    return (
      <div className="bg-green-50 rounded-lg p-3 animate-pulse">
        <div className="h-4 bg-green-200 rounded w-2/3" />
      </div>
    );
  }

  const { today } = activity;
  const progress = (today.totalPmpEarned / today.dailyMaxPmp) * 100;

  return (
    <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-3 border border-green-200">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-green-800">오늘의 PMP</span>
        <span className="text-sm font-bold text-green-600">
          {today.totalPmpEarned} / {today.dailyMaxPmp}
        </span>
      </div>
      <div className="w-full bg-green-200 rounded-full h-1.5">
        <div
          className="h-1.5 rounded-full bg-green-500 transition-all"
          style={{ width: `${Math.min(progress, 100)}%` }}
        />
      </div>
    </div>
  );
}
