/**
 * 예측 게임 페이지 로딩 스켈레톤 (다크 테마 최적화)
 *
 * 다크 테마 배경에 맞춰 부드러운 펄스 애니메이션으로 즉각적인 피드백을 제공합니다.
 */

export default function PredictionLoading() {
  return (
    <div className="min-h-screen bg-[#090b12] text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 animate-pulse">
        {/* 상단 도메인 컨텍스트 헤더 스켈레톤 */}
        <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800/80 space-y-4">
          <div className="flex justify-between items-start gap-4">
            <div className="space-y-2">
              <div className="h-7 w-64 bg-slate-800 rounded-lg"></div>
              <div className="h-4 w-96 max-w-full bg-slate-800/60 rounded-md"></div>
            </div>
            <div className="flex gap-4">
              <div className="h-12 w-28 bg-slate-800/70 rounded-xl"></div>
              <div className="h-12 w-28 bg-slate-800/70 rounded-xl"></div>
            </div>
          </div>
        </div>

        {/* 카테고리 칩 스켈레톤 */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-800/80">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="h-9 w-24 bg-slate-900/80 border border-slate-800 rounded-xl shrink-0"
            ></div>
          ))}
        </div>

        {/* 예측 카드 그리드 스켈레톤 (6개) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-5 space-y-4 shadow-xl"
            >
              {/* 카드 상단: 카테고리 & 마감 배지 */}
              <div className="flex justify-between items-center">
                <div className="h-5 w-20 bg-slate-800 rounded-full"></div>
                <div className="h-4 w-24 bg-slate-800/60 rounded-md"></div>
              </div>

              {/* 제목 */}
              <div className="space-y-2">
                <div className="h-5 w-full bg-slate-800 rounded-md"></div>
                <div className="h-4 w-3/4 bg-slate-800/60 rounded-md"></div>
              </div>

              {/* 옵션 바 */}
              <div className="space-y-2 pt-2">
                <div className="h-10 w-full bg-slate-800/50 rounded-xl"></div>
                <div className="h-10 w-full bg-slate-800/50 rounded-xl"></div>
              </div>

              {/* 푸터: 상금풀 & 참가자 */}
              <div className="pt-3 border-t border-slate-800/60 flex justify-between items-center">
                <div className="h-4 w-28 bg-slate-800/70 rounded-md"></div>
                <div className="h-4 w-20 bg-slate-800/70 rounded-md"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
