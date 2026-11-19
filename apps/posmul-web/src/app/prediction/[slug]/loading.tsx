export default function PredictionDetailLoading() {
  return (
    <div className="min-h-screen bg-[#090b12] text-slate-100 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6 animate-pulse">
        {/* 상단 브레드크럼 & 제목 스켈레톤 */}
        <div className="flex items-center justify-between">
          <div className="h-4 w-32 rounded-lg bg-slate-800/80" />
          <div className="h-7 w-24 rounded-full bg-slate-800/80" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* 좌측 메인 카드 + 차트 스켈레톤 */}
          <div className="lg:col-span-8 space-y-5">
            <div className="rounded-2xl bg-[#121621] border border-white/[0.06] p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-slate-800" />
                <div className="space-y-2 flex-1">
                  <div className="h-3 w-36 rounded bg-slate-800" />
                  <div className="h-6 w-3/4 rounded bg-slate-800" />
                </div>
              </div>
              <div className="h-56 w-full rounded-xl bg-slate-900/90 border border-white/[0.04]" />
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="h-16 rounded-xl bg-slate-900/80" />
                <div className="h-16 rounded-xl bg-slate-900/80" />
              </div>
            </div>

            <div className="rounded-2xl bg-[#121621] border border-white/[0.06] p-6 space-y-3">
              <div className="h-4 w-40 rounded bg-slate-800" />
              <div className="h-3 w-full rounded bg-slate-800/70" />
              <div className="h-3 w-5/6 rounded bg-slate-800/70" />
            </div>
          </div>

          {/* 우측 참여 패널 스켈레톤 */}
          <div className="lg:col-span-4 space-y-4">
            <div className="rounded-2xl bg-[#121621] border border-white/[0.06] p-5 space-y-4">
              <div className="h-5 w-32 rounded bg-slate-800" />
              <div className="h-12 w-full rounded-xl bg-slate-900" />
              <div className="h-12 w-full rounded-xl bg-slate-900" />
              <div className="h-11 w-full rounded-xl bg-sky-500/20" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
