/**
 * 예측 게임 페이지 로딩 스켈레톤
 *
 * 게임 목록과 필터 영역의 스켈레톤 UI를 제공합니다.
 */

export default function PredictionLoading() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* 헤더 스켈레톤 */}
      <div className="space-y-4">
        <div className="h-8 bg-gray-200 rounded-md w-48"></div>
        <div className="h-4 bg-gray-200 rounded-md w-96"></div>
      </div>

      {/* 필터 영역 스켈레톤 */}
      <div className="flex gap-4 p-4 bg-gray-50 rounded-lg">
        <div className="h-10 bg-gray-200 rounded-md w-32"></div>
        <div className="h-10 bg-gray-200 rounded-md w-32"></div>
        <div className="h-10 bg-gray-200 rounded-md w-32"></div>
        <div className="flex-1"></div>
        <div className="h-10 bg-gray-200 rounded-md w-40"></div>
      </div>

      {/* 통계 카드 스켈레톤 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white p-6 rounded-xl border shadow-sm">
            <div className="h-6 bg-gray-200 rounded-md w-24 mb-3"></div>
            <div className="h-8 bg-gray-200 rounded-md w-16 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded-md w-32"></div>
          </div>
        ))}
      </div>

      {/* 게임 카드 스켈레톤 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-xl border shadow-sm overflow-hidden"
          >
            {/* 카드 헤더 */}
            <div className="p-4 border-b">
              <div className="flex items-center justify-between mb-3">
                <div className="h-5 bg-gray-200 rounded-md w-20"></div>
                <div className="h-6 bg-gray-200 rounded-full w-16"></div>
              </div>
              <div className="h-6 bg-gray-200 rounded-md w-full mb-2"></div>
              <div className="h-4 bg-gray-200 rounded-md w-3/4"></div>
            </div>

            {/* 옵션 영역 */}
            <div className="p-4 space-y-3">
              {[...Array(2)].map((_, j) => (
                <div
                  key={j}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="h-5 bg-gray-200 rounded-md w-24"></div>
                  <div className="h-6 bg-gray-200 rounded-md w-16"></div>
                </div>
              ))}
            </div>

            {/* 푸터 */}
            <div className="p-4 bg-gray-50 border-t">
              <div className="flex items-center justify-between mb-3">
                <div className="h-4 bg-gray-200 rounded-md w-32"></div>
                <div className="h-4 bg-gray-200 rounded-md w-20"></div>
              </div>
              <div className="h-10 bg-gray-200 rounded-md w-full"></div>
            </div>
          </div>
        ))}
      </div>

      {/* 페이지네이션 스켈레톤 */}
      <div className="flex justify-center items-center gap-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-10 w-10 bg-gray-200 rounded-md"></div>
        ))}
      </div>
    </div>
  );
}
