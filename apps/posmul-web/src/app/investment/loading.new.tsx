/**
 * 투자 페이지 로딩 스켈레톤
 *
 * BaseSkeleton을 활용하여 투자 기회 카드와 포트폴리오 통계의 스켈레톤 UI를 제공합니다.
 */

<<<<<<< HEAD:apps/posmul-web/src/app/investment/loading.new.tsx
import { BaseSkeleton } from "@posmul/shared-ui";
=======
import { BaseSkeleton } from "@/shared/components/loading";
>>>>>>> main:src/app/investment/loading.new.tsx

export default function InvestmentLoading() {
  return (
    <div className="space-y-12 pb-12">
      {/* 투자 대시보드 헤더 스켈레톤 */}
      <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-2xl p-8 border border-blue-200">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 포트폴리오 개요 */}
          <div>
            <BaseSkeleton variant="header" className="mb-6" />
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-white/80 backdrop-blur-sm p-6 rounded-xl border border-white/50">
                <div className="space-y-3">
                  <div className="h-4 w-16 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-8 w-24 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-3 w-20 bg-gray-200 rounded animate-pulse"></div>
                </div>
              </div>
              <div className="bg-white/80 backdrop-blur-sm p-6 rounded-xl border border-white/50">
                <div className="space-y-3">
                  <div className="h-4 w-16 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-8 w-24 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-3 w-20 bg-gray-200 rounded animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>

          {/* 수익률 차트 스켈레톤 */}
          <div>
            <BaseSkeleton variant="header" className="mb-4" />
            <BaseSkeleton variant="chart" />
          </div>
        </div>
      </div>

      {/* 투자 기회 섹션 헤더 */}
      <div>
        <BaseSkeleton variant="header" className="mb-6" />

        {/* 필터 버튼들 스켈레톤 */}
        <div className="flex gap-3 mb-6">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="h-10 w-20 bg-gray-200 rounded-lg animate-pulse"
            />
          ))}
        </div>

        {/* 투자 기회 카드들 스켈레톤 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="bg-white rounded-xl border border-gray-200 p-6 space-y-4"
            >
              {/* 카드 헤더 */}
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gray-200 rounded-lg animate-pulse"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-5 w-3/4 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-4 w-1/2 bg-gray-200 rounded animate-pulse"></div>
                </div>
              </div>

              {/* 진행률 바 */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <div className="h-3 w-16 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-3 w-12 bg-gray-200 rounded animate-pulse"></div>
                </div>
                <div className="h-2 w-full bg-gray-200 rounded-full animate-pulse"></div>
              </div>

              {/* 투자 정보 */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="h-3 w-12 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-5 w-16 bg-gray-200 rounded animate-pulse"></div>
                </div>
                <div className="space-y-1">
                  <div className="h-3 w-12 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-5 w-16 bg-gray-200 rounded animate-pulse"></div>
                </div>
              </div>

              {/* 투자 버튼 */}
              <div className="h-10 w-full bg-gray-200 rounded-lg animate-pulse"></div>
            </div>
          ))}
        </div>
      </div>

      {/* 내 투자 현황 섹션 */}
      <div>
        <BaseSkeleton variant="header" className="mb-6" />

        {/* 투자 현황 테이블 */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {/* 테이블 헤더 */}
          <div className="border-b border-gray-200 p-4">
            <div className="grid grid-cols-5 gap-4">
              {["프로젝트", "투자금액", "수익률", "상태", "액션"].map(
                (_, index) => (
                  <div
                    key={index}
                    className="h-4 bg-gray-200 rounded animate-pulse"
                  ></div>
                )
              )}
            </div>
          </div>

          {/* 테이블 행들 */}
          {Array.from({ length: 5 }).map((_, rowIndex) => (
            <div
              key={rowIndex}
              className="border-b border-gray-100 p-4 last:border-b-0"
            >
              <div className="grid grid-cols-5 gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
                </div>
                <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 w-16 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-6 w-16 bg-gray-200 rounded-full animate-pulse"></div>
                <div className="h-8 w-20 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 투자 분석 섹션 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <BaseSkeleton variant="header" className="mb-6" />
          <BaseSkeleton variant="chart" />
        </div>
        <div>
          <BaseSkeleton variant="header" className="mb-6" />
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
            <BaseSkeleton variant="paragraph" count={4} />
          </div>
        </div>
      </div>
    </div>
  );
}
