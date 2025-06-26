/**
 * 대시보드 페이지 로딩 스켈레톤
 *
 * BaseSkeleton을 활용하여 경제 데이터와 차트의 스켈레톤 UI를 제공합니다.
 */

import { BaseSkeleton } from "@/shared/components/loading";

export default function DashboardLoading() {
  return (
    <div className="space-y-8 pb-12">
      {/* 대시보드 헤더 스켈레톤 */}
      <div className="bg-gradient-to-r from-blue-50 via-purple-50 to-indigo-50 rounded-2xl p-8 border border-blue-200">
        <div className="text-center mb-8">
          <BaseSkeleton variant="header" className="mb-4" />
          <BaseSkeleton variant="paragraph" />
        </div>

        {/* 경제 개요 카드들 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, index) => (
            <BaseSkeleton key={index} variant="card" />
          ))}
        </div>
      </div>

      {/* 주요 차트 섹션 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <BaseSkeleton variant="header" className="mb-6" />
          <BaseSkeleton variant="chart" />
        </div>
        <div>
          <BaseSkeleton variant="header" className="mb-6" />
          <BaseSkeleton variant="chart" />
        </div>
      </div>

      {/* 활동 요약 섹션 */}
      <div>
        <BaseSkeleton variant="header" className="mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, index) => (
            <BaseSkeleton key={index} variant="card" />
          ))}
        </div>
      </div>

      {/* 최근 거래 내역 */}
      <div>
        <BaseSkeleton variant="header" className="mb-6" />
        <div className="bg-white rounded-xl border border-gray-200">
          <BaseSkeleton variant="list" count={5} />
        </div>
      </div>

      {/* 추천 활동 섹션 */}
      <div>
        <BaseSkeleton variant="header" className="mb-6" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <BaseSkeleton key={index} variant="card" />
          ))}
        </div>
      </div>
    </div>
  );
}
