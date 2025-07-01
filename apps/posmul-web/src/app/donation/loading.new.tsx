/**
 * 기부 페이지 로딩 스켈레톤
 *
 * BaseSkeleton을 활용하여 기부 프로젝트와 머니 웨이브의 스켈레톤 UI를 제공합니다.
 */

<<<<<<< HEAD:apps/posmul-web/src/app/donation/loading.new.tsx
import { BaseSkeleton } from "@posmul/shared-ui";
=======
import { BaseSkeleton } from "@/shared/components/loading";
>>>>>>> main:src/app/donation/loading.new.tsx

export default function DonationLoading() {
  return (
    <div className="space-y-8 pb-12">
      {/* 기부 헤더 스켈레톤 */}
      <div className="bg-gradient-to-r from-green-50 via-emerald-50 to-teal-50 rounded-2xl p-8 border border-green-200">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-4 animate-pulse"></div>
          <BaseSkeleton variant="header" className="mb-4" />
          <BaseSkeleton variant="paragraph" />
        </div>

        {/* 기부 통계 스켈레톤 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, index) => (
            <BaseSkeleton key={index} variant="card" />
          ))}
        </div>
      </div>

      {/* 머니 웨이브 현황 섹션 */}
      <div>
        <BaseSkeleton variant="header" className="mb-6" />
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <BaseSkeleton variant="chart" />
        </div>
      </div>

      {/* 진행 중인 기부 프로젝트 */}
      <div>
        <BaseSkeleton variant="header" className="mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, index) => (
            <BaseSkeleton key={index} variant="card" />
          ))}
        </div>
      </div>

      {/* 내 기부 내역 */}
      <div>
        <BaseSkeleton variant="header" className="mb-6" />
        <div className="bg-white rounded-xl border border-gray-200">
          <BaseSkeleton variant="list" count={4} />
        </div>
      </div>

      {/* 기부 임팩트 차트 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <BaseSkeleton variant="header" className="mb-6" />
          <BaseSkeleton variant="chart" />
        </div>
        <div>
          <BaseSkeleton variant="header" className="mb-6" />
          <div className="space-y-4">
            <BaseSkeleton variant="paragraph" count={3} />
          </div>
        </div>
      </div>
    </div>
  );
}
