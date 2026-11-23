/**
 * Demographic Debate Card Component
 * 인구통계 기반 토론 및 예측 게임 카드
 */
"use client";

import { useState } from "react";
import {
  StatCategory,
  PeriodType,
} from "../../domain/value-objects/forum-value-objects";

/**
 * 통계 카테고리별 아이콘 및 색상
 */
const STAT_CATEGORY_CONFIG: Record<
  StatCategory,
  { icon: string; color: string; bgColor: string; label: string }
> = {
  [StatCategory.BIRTH]: {
    icon: "",
    color: "text-pink-600",
    bgColor: "bg-pink-50",
    label: "출생아 수",
  },
  [StatCategory.DEATH]: {
    icon: "",
    color: "text-gray-600",
    bgColor: "bg-gray-50",
    label: "사망자 수",
  },
  [StatCategory.MARRIAGE]: {
    icon: "",
    color: "text-red-500",
    bgColor: "bg-red-50",
    label: "혼인 건수",
  },
  [StatCategory.DIVORCE]: {
    icon: "",
    color: "text-purple-600",
    bgColor: "bg-purple-50",
    label: "이혼 건수",
  },
  [StatCategory.MIGRATION_IN]: {
    icon: "",
    color: "text-green-600",
    bgColor: "bg-green-50",
    label: "전입자 수",
  },
  [StatCategory.MIGRATION_OUT]: {
    icon: "",
    color: "text-orange-600",
    bgColor: "bg-orange-50",
    label: "전출자 수",
  },
  [StatCategory.EMPLOYMENT]: {
    icon: "",
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    label: "취업률",
  },
  [StatCategory.UNEMPLOYMENT]: {
    icon: "",
    color: "text-red-600",
    bgColor: "bg-red-50",
    label: "실업률",
  },
  [StatCategory.LABOR_FORCE]: {
    icon: "",
    color: "text-indigo-600",
    bgColor: "bg-indigo-50",
    label: "경제활동인구",
  },
  [StatCategory.CPI]: {
    icon: "",
    color: "text-amber-600",
    bgColor: "bg-amber-50",
    label: "소비자물가지수",
  },
  [StatCategory.POPULATION]: {
    icon: "",
    color: "text-teal-600",
    bgColor: "bg-teal-50",
    label: "총 인구",
  },
};

/**
 * 토론 + 예측 게임 데이터 타입
 */
export interface DemographicDebate {
  id: string;
  postId: string;
  title: string;
  description: string;
  statCategory: StatCategory;
  regionCode: string;
  regionName: string;
  periodType: PeriodType;
  targetYear: number;
  targetMonth?: number;
  targetQuarter?: number;

  // 예측 게임 정보
  predictionId?: string;
  rangeMin: number;
  rangeMax: number;
  rangeStep: number;
  unit: string;
  deadline: Date;

  // 통계
  participantCount: number;
  totalBetPmp: number;
  commentCount: number;

  // 상태
  status: "OPEN" | "CLOSED" | "SETTLED";
  actualValue?: number;

  createdAt: Date;
  creatorName: string;
}

interface DemographicDebateCardProps {
  debate: DemographicDebate;
  onParticipate?: (debateId: string) => void;
  onViewDetails?: (debateId: string) => void;
}

/**
 * 남은 시간 계산
 */
function formatTimeRemaining(deadline: Date): string {
  const now = new Date();
  const diff = deadline.getTime() - now.getTime();

  if (diff <= 0) return "마감됨";

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

  if (days > 0) return `${days}일 ${hours}시간 남음`;
  if (hours > 0) return `${hours}시간 남음`;

  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  return `${minutes}분 남음`;
}

/**
 * 기간 포맷
 */
function formatTargetPeriod(
  year: number,
  month?: number,
  quarter?: number,
  periodType?: PeriodType
): string {
  switch (periodType) {
    case PeriodType.MONTHLY:
      return `${year}년 ${month}월`;
    case PeriodType.QUARTERLY:
      return `${year}년 ${quarter}분기`;
    case PeriodType.YEARLY:
      return `${year}년`;
    default:
      return month ? `${year}년 ${month}월` : `${year}년`;
  }
}

export function DemographicDebateCard({
  debate,
  onParticipate,
  onViewDetails,
}: DemographicDebateCardProps) {
  const config = STAT_CATEGORY_CONFIG[debate.statCategory];
  const timeRemaining = formatTimeRemaining(debate.deadline);
  const targetPeriod = formatTargetPeriod(
    debate.targetYear,
    debate.targetMonth,
    debate.targetQuarter,
    debate.periodType
  );

  const isOpen = debate.status === "OPEN";
  const isSettled = debate.status === "SETTLED";

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
      {/* Header with Category Badge */}
      <div className={`${config.bgColor} px-4 py-3 border-b border-gray-100`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{config.icon}</span>
            <div>
              <span className={`text-sm font-semibold ${config.color}`}>
                {config.label}
              </span>
              <span className="text-gray-500 text-xs ml-2">{debate.regionName}</span>
            </div>
          </div>
          <div
            className={`px-2 py-1 rounded-full text-xs font-medium ${
              isOpen
                ? "bg-green-100 text-green-700"
                : isSettled
                  ? "bg-blue-100 text-blue-700"
                  : "bg-gray-100 text-gray-600"
            }`}
          >
            {isOpen ? "참여 가능" : isSettled ? "정산 완료" : "마감"}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-bold text-gray-900 text-lg mb-2 line-clamp-2">
          {debate.title}
        </h3>
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">{debate.description}</p>

        {/* Target Period & Range */}
        <div className="bg-gray-50 rounded-lg p-3 mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500">예측 대상</span>
            <span className="text-sm font-medium text-gray-900">{targetPeriod}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">예측 범위</span>
            <span className="text-sm font-medium text-gray-900">
              {debate.rangeMin.toLocaleString()} ~ {debate.rangeMax.toLocaleString()}{" "}
              {debate.unit}
            </span>
          </div>
          {isSettled && debate.actualValue !== undefined && (
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-200">
              <span className="text-sm text-gray-500">실제 결과</span>
              <span className="text-sm font-bold text-blue-600">
                {debate.actualValue.toLocaleString()} {debate.unit}
              </span>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="text-center">
            <div className="text-lg font-bold text-gray-900">
              {debate.participantCount}
            </div>
            <div className="text-xs text-gray-500">참여자</div>
          </div>
          <div className="text-center border-x border-gray-200">
            <div className="text-lg font-bold text-green-600">
              {debate.totalBetPmp.toLocaleString()}
            </div>
            <div className="text-xs text-gray-500">총 PMP</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-gray-900">{debate.commentCount}</div>
            <div className="text-xs text-gray-500">토론</div>
          </div>
        </div>

        {/* Deadline */}
        {isOpen && (
          <div className="flex items-center justify-between text-sm mb-4">
            <span className="text-gray-500">마감까지</span>
            <span
              className={`font-medium ${
                timeRemaining.includes("시간") || timeRemaining.includes("분")
                  ? "text-red-600"
                  : "text-gray-900"
              }`}
            >
              {timeRemaining}
            </span>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          {isOpen && onParticipate && (
            <button
              onClick={() => onParticipate(debate.id)}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              예측 참여하기
            </button>
          )}
          {onViewDetails && (
            <button
              onClick={() => onViewDetails(debate.id)}
              className={`${
                isOpen ? "flex-none" : "flex-1"
              } bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 px-4 rounded-lg transition-colors`}
            >
              상세보기
            </button>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="bg-gray-50 px-4 py-2 border-t border-gray-100">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>작성자: {debate.creatorName}</span>
          <span>
            {new Date(debate.createdAt).toLocaleDateString("ko-KR", {
              month: "short",
              day: "numeric",
            })}
          </span>
        </div>
      </div>
    </div>
  );
}

/**
 * 토론 카드 리스트
 */
interface DemographicDebateListProps {
  debates: DemographicDebate[];
  onParticipate?: (debateId: string) => void;
  onViewDetails?: (debateId: string) => void;
  emptyMessage?: string;
}

export function DemographicDebateList({
  debates,
  onParticipate,
  onViewDetails,
  emptyMessage = "진행 중인 토론이 없습니다.",
}: DemographicDebateListProps) {
  const [filter, setFilter] = useState<StatCategory | "ALL">("ALL");

  const filteredDebates =
    filter === "ALL"
      ? debates
      : debates.filter((d) => d.statCategory === filter);

  return (
    <div>
      {/* Filter Tabs */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
        <button
          onClick={() => setFilter("ALL")}
          className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
            filter === "ALL"
              ? "bg-gray-900 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          전체
        </button>
        {Object.entries(STAT_CATEGORY_CONFIG).map(([key, config]) => (
          <button
            key={key}
            onClick={() => setFilter(key as StatCategory)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              filter === key
                ? `${config.bgColor} ${config.color}`
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {config.icon} {config.label}
          </button>
        ))}
      </div>

      {/* Debate Cards */}
      {filteredDebates.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <div className="text-4xl mb-3"></div>
          <p>{emptyMessage}</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredDebates.map((debate) => (
            <DemographicDebateCard
              key={debate.id}
              debate={debate}
              onParticipate={onParticipate}
              onViewDetails={onViewDetails}
            />
          ))}
        </div>
      )}
    </div>
  );
}
