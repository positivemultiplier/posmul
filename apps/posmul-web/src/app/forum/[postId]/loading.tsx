export default function ForumPostDetailLoading() {
  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 py-6 sm:py-8 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto space-y-6 animate-pulse">
        {/* 상단 네비게이션 스켈레톤 */}
        <div className="flex items-center justify-between">
          <div className="h-4 w-28 rounded bg-slate-800" />
          <div className="flex gap-2">
            <div className="h-8 w-16 rounded-xl bg-slate-800" />
            <div className="h-8 w-28 rounded-xl bg-emerald-900/50" />
          </div>
        </div>

        {/* 게시글 카드 스켈레톤 */}
        <div className="rounded-3xl bg-[#111520] border border-white/[0.06] p-6 sm:p-8 space-y-6">
          <div className="space-y-3 pb-5 border-b border-white/[0.06]">
            <div className="h-5 w-20 rounded-full bg-sky-900/40" />
            <div className="h-8 w-4/5 rounded-lg bg-slate-800" />
            <div className="flex justify-between pt-2">
              <div className="h-3.5 w-44 rounded bg-slate-800/80" />
              <div className="h-3.5 w-36 rounded bg-slate-800/80" />
            </div>
          </div>

          <div className="space-y-3 py-4">
            <div className="h-4 w-full rounded bg-slate-800/70" />
            <div className="h-4 w-11/12 rounded bg-slate-800/70" />
            <div className="h-4 w-4/5 rounded bg-slate-800/70" />
            <div className="h-48 w-full rounded-2xl bg-slate-900/90 mt-4" />
          </div>

          <div className="space-y-3 pt-4 border-t border-white/[0.06]">
            <div className="h-4 w-24 rounded bg-slate-800" />
            <div className="h-12 w-full rounded-2xl bg-slate-900" />
            <div className="h-16 w-full rounded-2xl bg-slate-900/70" />
          </div>
        </div>
      </div>
    </div>
  );
}
