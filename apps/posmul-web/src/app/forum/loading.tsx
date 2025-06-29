/**
 * 포럼 페이지 로딩 스켈레톤
 *
 * BaseSkeleton을 활용하여 토론 주제 카드와 브레인스토밍 세션의 스켈레톤 UI를 제공합니다.
 */

import { BaseSkeleton } from "@posmul/shared-ui";

export default function ForumLoading() {
  return (
    <div className="space-y-8 pb-12">
      {/* 포럼 헤더 스켈레톤 */}
      <div className="bg-gradient-to-r from-purple-50 via-blue-50 to-indigo-50 rounded-2xl p-8 border border-purple-200">
        <div className="text-center">
          {/* 아이콘 스켈레톤 */}
          <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-4 animate-pulse"></div>

          {/* 제목과 설명 스켈레톤 */}
          <BaseSkeleton variant="header" className="mb-4" />
          <BaseSkeleton variant="paragraph" className="mb-8" />

          {/* 포럼 통계 스켈레톤 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-2xl mx-auto">
            {Array.from({ length: 4 }).map((_, index) => (
              <BaseSkeleton key={index} variant="card" />
            ))}
          </div>
        </div>
      </div>

      {/* 필터와 검색 영역 스켈레톤 */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex gap-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="h-10 w-20 bg-gray-200 rounded-lg animate-pulse"
            />
          ))}
        </div>
        <div className="h-10 w-80 bg-gray-200 rounded-lg animate-pulse"></div>
      </div>

      {/* 활성 토론 섹션 */}
      <div>
        <BaseSkeleton variant="header" className="mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Array.from({ length: 4 }).map((_, index) => (
            <BaseSkeleton key={index} variant="card" />
          ))}
        </div>
      </div>

      {/* 브레인스토밍 세션 섹션 */}
      <div>
        <BaseSkeleton variant="header" className="mb-6" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, index) => (
            <BaseSkeleton key={index} variant="card" />
          ))}
        </div>
      </div>

      {/* 최근 댓글 섹션 */}
      <div>
        <BaseSkeleton variant="header" className="mb-6" />
        <div className="bg-white rounded-xl border border-gray-200 divide-y">
          <BaseSkeleton variant="list" count={5} />
        </div>
      </div>

      {/* 인기 주제 섹션 */}
      <div>
        <BaseSkeleton variant="header" className="mb-6" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <div
              key={index}
              className="h-12 bg-gray-200 rounded-lg animate-pulse"
            ></div>
          ))}
        </div>
      </div>
    </div>
  );
}
