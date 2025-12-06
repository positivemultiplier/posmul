/**
 * Demographic Debate Page Client Component
 * 인구통계 토론 + 예측 게임 클라이언트 컴포넌트
 */
"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  TrendingUp,
  Users,
  Calendar,
  MapPin,
  Plus,
  Filter,
  BarChart3,
} from "lucide-react";
import {
  StatCategory,
  PeriodType,
} from "@/bounded-contexts/forum/domain/value-objects/forum-value-objects";

/**
 * 통계 카테고리 설정
 */
const STAT_CATEGORIES: Array<{
  key: StatCategory;
  icon: string;
  label: string;
  color: string;
  bgColor: string;
}> = [
  { key: StatCategory.BIRTH, icon: "👶", label: "출생아", color: "text-pink-600", bgColor: "bg-pink-50" },
  { key: StatCategory.DEATH, icon: "🕯️", label: "사망자", color: "text-gray-600", bgColor: "bg-gray-50" },
  { key: StatCategory.MARRIAGE, icon: "💍", label: "혼인", color: "text-red-500", bgColor: "bg-red-50" },
  { key: StatCategory.DIVORCE, icon: "💔", label: "이혼", color: "text-purple-600", bgColor: "bg-purple-50" },
  { key: StatCategory.MIGRATION_IN, icon: "🏠", label: "전입", color: "text-green-600", bgColor: "bg-green-50" },
  { key: StatCategory.MIGRATION_OUT, icon: "🚚", label: "전출", color: "text-orange-600", bgColor: "bg-orange-50" },
  { key: StatCategory.EMPLOYMENT, icon: "💼", label: "취업률", color: "text-blue-600", bgColor: "bg-blue-50" },
  { key: StatCategory.UNEMPLOYMENT, icon: "📉", label: "실업률", color: "text-red-600", bgColor: "bg-red-50" },
  { key: StatCategory.CPI, icon: "📊", label: "물가지수", color: "text-amber-600", bgColor: "bg-amber-50" },
];

/**
 * 광주광역시 지역 정보
 */
const GWANGJU_REGIONS = [
  { code: "29000", name: "광주광역시", level: "시" },
  { code: "29110", name: "동구", level: "구" },
  { code: "29140", name: "서구", level: "구" },
  { code: "29155", name: "남구", level: "구" },
  { code: "29170", name: "북구", level: "구" },
  { code: "29200", name: "광산구", level: "구" },
];

/**
 * 샘플 토론 데이터 (API 연동 전)
 */
interface DemographicDebate {
  id: string;
  title: string;
  description: string;
  statCategory: StatCategory;
  regionCode: string;
  regionName: string;
  periodType: PeriodType;
  targetYear: number;
  targetMonth?: number;
  rangeMin: number;
  rangeMax: number;
  unit: string;
  deadline: Date;
  status: "OPEN" | "CLOSED" | "SETTLED";
  participantCount: number;
  totalBetPmp: number;
  commentCount: number;
  actualValue?: number;
  createdAt: Date;
  creatorName: string;
}

const SAMPLE_DEBATES: DemographicDebate[] = [
  {
    id: "1",
    title: "12월 광주시 출생아 수 예측",
    description: "저출산 추세 속 12월 광주시 출생아 수는? KOSIS 데이터 기반 예측 게임입니다.",
    statCategory: StatCategory.BIRTH,
    regionCode: "29000",
    regionName: "광주광역시",
    periodType: PeriodType.MONTHLY,
    targetYear: 2025,
    targetMonth: 12,
    rangeMin: 800,
    rangeMax: 1200,
    unit: "명",
    deadline: new Date("2025-12-25"),
    status: "OPEN",
    participantCount: 24,
    totalBetPmp: 4800,
    commentCount: 18,
    createdAt: new Date("2025-11-28"),
    creatorName: "데이터분석러",
  },
  {
    id: "2",
    title: "12월 서구 전입자 수 예측",
    description: "연말 이동 시즌, 서구로 전입하는 인구는 얼마나 될까요?",
    statCategory: StatCategory.MIGRATION_IN,
    regionCode: "29140",
    regionName: "서구",
    periodType: PeriodType.MONTHLY,
    targetYear: 2025,
    targetMonth: 12,
    rangeMin: 3000,
    rangeMax: 5000,
    unit: "명",
    deadline: new Date("2025-12-28"),
    status: "OPEN",
    participantCount: 15,
    totalBetPmp: 2250,
    commentCount: 8,
    createdAt: new Date("2025-11-29"),
    creatorName: "지역경제연구",
  },
  {
    id: "3",
    title: "12월 광주시 실업률 예측",
    description: "연말 고용 상황 변화를 예측해보세요. 계절적 요인과 경기 동향을 함께 분석합니다.",
    statCategory: StatCategory.UNEMPLOYMENT,
    regionCode: "29000",
    regionName: "광주광역시",
    periodType: PeriodType.MONTHLY,
    targetYear: 2025,
    targetMonth: 12,
    rangeMin: 2.0,
    rangeMax: 4.0,
    unit: "%",
    deadline: new Date("2025-12-30"),
    status: "OPEN",
    participantCount: 31,
    totalBetPmp: 6200,
    commentCount: 25,
    createdAt: new Date("2025-11-27"),
    creatorName: "경제정책팀",
  },
];

function formatTimeRemaining(deadline: Date): string {
  const now = new Date();
  const diff = deadline.getTime() - now.getTime();
  if (diff <= 0) return "마감됨";
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  if (days > 0) return `${days}일 ${hours}시간`;
  return `${hours}시간`;
}

export function DemographicDebatePageClient() {
  const router = useRouter();
  const [debates, _setDebates] = useState<DemographicDebate[]>(SAMPLE_DEBATES);
  const [selectedCategory, setSelectedCategory] = useState<StatCategory | "ALL">("ALL");
  const [selectedRegion, setSelectedRegion] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "OPEN" | "CLOSED" | "SETTLED">("OPEN");

  // 필터링된 토론 목록
  const filteredDebates = debates.filter((debate) => {
    if (selectedCategory !== "ALL" && debate.statCategory !== selectedCategory) return false;
    if (selectedRegion !== "ALL" && debate.regionCode !== selectedRegion) return false;
    if (statusFilter !== "ALL" && debate.status !== statusFilter) return false;
    return true;
  });

  // 통계 요약
  const stats = {
    totalDebates: debates.filter((d) => d.status === "OPEN").length,
    totalParticipants: debates.reduce((sum, d) => sum + d.participantCount, 0),
    totalPmp: debates.reduce((sum, d) => sum + d.totalBetPmp, 0),
  };

  const handleParticipate = useCallback((debateId: string) => {
    router.push(`/prediction/demographic/${debateId}`);
  }, [router]);

  const handleViewDetails = useCallback((debateId: string) => {
    router.push(`/forum/debate/${debateId}`);
  }, [router]);

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <BarChart3 className="w-8 h-8 text-green-600" />
          <h1 className="text-3xl font-bold text-gray-900">인구통계 예측 토론</h1>
        </div>
        <p className="text-gray-600">
          광주광역시 인구통계 데이터를 기반으로 토론하고, 예측에 참여하여 PMP를 획득하세요!
        </p>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
            <TrendingUp className="w-4 h-4" />
            진행 중인 예측
          </div>
          <div className="text-2xl font-bold text-gray-900">{stats.totalDebates}개</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
            <Users className="w-4 h-4" />
            총 참여자
          </div>
          <div className="text-2xl font-bold text-gray-900">{stats.totalParticipants}명</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
            <Calendar className="w-4 h-4" />
            총 배팅 PMP
          </div>
          <div className="text-2xl font-bold text-green-600">{stats.totalPmp.toLocaleString()}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-gray-500" />
          <span className="font-medium text-gray-700">필터</span>
        </div>

        {/* Category Filter */}
        <div className="mb-4">
          <div className="text-sm text-gray-500 mb-2">통계 유형</div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory("ALL")}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                selectedCategory === "ALL"
                  ? "bg-gray-900 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              전체
            </button>
            {STAT_CATEGORIES.map((cat) => (
              <button
                key={cat.key}
                onClick={() => setSelectedCategory(cat.key)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  selectedCategory === cat.key
                    ? `${cat.bgColor} ${cat.color}`
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {cat.icon} {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Region Filter */}
        <div className="mb-4">
          <div className="text-sm text-gray-500 mb-2">지역</div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedRegion("ALL")}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                selectedRegion === "ALL"
                  ? "bg-gray-900 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              전체
            </button>
            {GWANGJU_REGIONS.map((region) => (
              <button
                key={region.code}
                onClick={() => setSelectedRegion(region.code)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  selectedRegion === region.code
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                <MapPin className="w-3 h-3 inline mr-1" />
                {region.name}
              </button>
            ))}
          </div>
        </div>

        {/* Status Filter */}
        <div>
          <div className="text-sm text-gray-500 mb-2">상태</div>
          <div className="flex gap-2">
            {(["ALL", "OPEN", "CLOSED", "SETTLED"] as const).map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  statusFilter === status
                    ? status === "OPEN"
                      ? "bg-green-600 text-white"
                      : status === "SETTLED"
                        ? "bg-blue-600 text-white"
                        : "bg-gray-900 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {status === "ALL" && "전체"}
                {status === "OPEN" && "참여 가능"}
                {status === "CLOSED" && "마감"}
                {status === "SETTLED" && "정산 완료"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Create New Button */}
      <div className="flex justify-end mb-6">
        <Link
          href="/forum/debate/create"
          className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors"
        >
          <Plus className="w-5 h-5" />
          새 예측 게임 만들기
        </Link>
      </div>

      {/* Debate Cards */}
      {filteredDebates.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <div className="text-4xl mb-4">📊</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            조건에 맞는 예측 게임이 없습니다
          </h3>
          <p className="text-gray-500 mb-4">필터를 변경하거나 새 예측 게임을 만들어보세요!</p>
          <Link
            href="/forum/debate/create"
            className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors"
          >
            <Plus className="w-5 h-5" />
            새 예측 게임 만들기
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredDebates.map((debate) => {
            const catConfig = STAT_CATEGORIES.find((c) => c.key === debate.statCategory);
            const isOpen = debate.status === "OPEN";

            return (
              <div
                key={debate.id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
              >
                {/* Header */}
                <div className={`${catConfig?.bgColor || "bg-gray-50"} px-4 py-3 border-b border-gray-100`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{catConfig?.icon}</span>
                      <span className={`text-sm font-semibold ${catConfig?.color}`}>
                        {catConfig?.label}
                      </span>
                      <span className="text-gray-500 text-xs">{debate.regionName}</span>
                    </div>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        isOpen
                          ? "bg-green-100 text-green-700"
                          : debate.status === "SETTLED"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {isOpen ? "참여 가능" : debate.status === "SETTLED" ? "정산 완료" : "마감"}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4">
                  <h3 className="font-bold text-gray-900 mb-2 line-clamp-2">{debate.title}</h3>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">{debate.description}</p>

                  {/* Target Info */}
                  <div className="bg-gray-50 rounded-lg p-3 mb-4 text-sm">
                    <div className="flex justify-between mb-1">
                      <span className="text-gray-500">예측 대상</span>
                      <span className="font-medium">
                        {debate.targetYear}년 {debate.targetMonth}월
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">예측 범위</span>
                      <span className="font-medium">
                        {debate.rangeMin.toLocaleString()} ~ {debate.rangeMax.toLocaleString()} {debate.unit}
                      </span>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-2 mb-4 text-center text-sm">
                    <div>
                      <div className="font-bold text-gray-900">{debate.participantCount}</div>
                      <div className="text-gray-500 text-xs">참여자</div>
                    </div>
                    <div className="border-x border-gray-200">
                      <div className="font-bold text-green-600">{debate.totalBetPmp.toLocaleString()}</div>
                      <div className="text-gray-500 text-xs">총 PMP</div>
                    </div>
                    <div>
                      <div className="font-bold text-gray-900">{debate.commentCount}</div>
                      <div className="text-gray-500 text-xs">토론</div>
                    </div>
                  </div>

                  {/* Deadline */}
                  {isOpen && (
                    <div className="flex items-center justify-between text-sm mb-4">
                      <span className="text-gray-500">마감까지</span>
                      <span className="font-medium text-orange-600">
                        ⏰ {formatTimeRemaining(debate.deadline)}
                      </span>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2">
                    {isOpen && (
                      <button
                        onClick={() => handleParticipate(debate.id)}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-3 rounded-lg transition-colors text-sm"
                      >
                        예측 참여
                      </button>
                    )}
                    <button
                      onClick={() => handleViewDetails(debate.id)}
                      className={`${isOpen ? "flex-none" : "flex-1"} bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 px-3 rounded-lg transition-colors text-sm`}
                    >
                      상세보기
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Info Section */}
      <div className="mt-12 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200 p-6">
        <h2 className="text-xl font-bold text-green-900 mb-4">💡 인구통계 예측 게임 안내</h2>
        <div className="grid md:grid-cols-3 gap-6 text-sm">
          <div>
            <h3 className="font-semibold text-green-800 mb-2">📊 데이터 출처</h3>
            <p className="text-green-700">
              모든 통계 데이터는 KOSIS(국가통계포털)에서 제공하는 공식 데이터를 사용합니다.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-green-800 mb-2">🎯 예측 방법</h3>
            <p className="text-green-700">
              제시된 범위 내에서 예측값을 선택하고 PMP를 배팅합니다. 정답에 가까울수록 더 많은 보상!
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-green-800 mb-2">💰 보상 시스템</h3>
            <p className="text-green-700">
              실제 통계 발표 후 정답에 가까운 예측자에게 PMC로 보상이 지급됩니다.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
