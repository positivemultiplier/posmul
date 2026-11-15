"use client";

import Link from "next/link";
import {
  Building2,
  ShieldAlert,
  FileText,
  TrendingUp,
  MessageSquare,
  ArrowRight,
  Coins,
  AlertTriangle,
  Sparkles,
} from "lucide-react";
import { MobileAppShell } from "@/components/mobile/mobile-app-shell";
import { ComplexProfileBar } from "@/components/pro-view/complex-profile-bar";
import { LifecycleLockinBridge } from "@/components/pro-view/lifecycle-lockin-bridge";
import { useProWorkspace } from "@/lib/pro-workspace-store";

export default function ProComplexHomePage() {
  const {
    complexProfile,
    userPmpBalance,
    userPmcBalance,
    obligations,
    communityPosts,
    updateComplexProfile,
  } = useProWorkspace();

  const urgentRules = [...obligations]
    .filter((o) => !o.isCompleted)
    .sort((a, b) => a.daysUntilDue - b.daysUntilDue)
    .slice(0, 2);

  const latestPollPost = communityPosts.find((p) => Boolean(p.poll));

  return (
    <MobileAppShell isProMode>
      {/* 상단 소장Pro 헤더 */}
      <header className="px-4 py-3 bg-[#0D1322] border-b border-white/[0.06] flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Building2 className="w-4 h-4 text-sky-400 shrink-0" />
          <h1 className="text-sm font-black text-white truncate">
            단지 실무 코파일럿
          </h1>
        </div>
        <div className="flex items-center gap-1.5 shrink-0 font-mono text-[10px] font-black">
          <span className="px-2 py-0.5 rounded-full bg-indigo-950 text-sky-300 border border-sky-500/30">
            {userPmpBalance.toLocaleString()} PMP
          </span>
          <span className="px-2 py-0.5 rounded-full bg-amber-950/70 text-amber-300 border border-amber-500/30">
            {userPmcBalance.toLocaleString()} PMC
          </span>
        </div>
      </header>

      <div className="px-4 py-4 space-y-4">
        {/* 1. 우리 단지 프로필 & 과태료 무사고 현황 */}
        <ComplexProfileBar
          profile={complexProfile}
          onUpdateProfile={updateComplexProfile}
        />

        {/* 2. 임박한 법정의무 긴급 알림 -> 법정일정 탭 연결 */}
        <section className="rounded-2xl bg-[#121A2B] border border-rose-500/30 p-4 space-y-3 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-black text-white">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              <span>긴급 법정의무 D-Day</span>
            </div>
            <Link
              href="/pro/legal"
              className="text-[11px] font-bold text-sky-400 hover:underline flex items-center gap-1"
            >
              <span>연간 매트릭스</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="space-y-2">
            {urgentRules.map((rule) => (
              <Link
                key={rule.id}
                href="/pro/legal"
                className="block p-3 rounded-xl bg-slate-950/80 border border-white/[0.06] hover:border-sky-500/40 transition"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-mono text-[10px] font-black">
                    D-{rule.daysUntilDue}
                  </span>
                  <span className="text-[10px] font-bold text-amber-300">
                    {rule.maxFineLabel}
                  </span>
                </div>
                <div className="text-xs font-extrabold text-white mt-1.5">
                  {rule.title}
                </div>
                <div className="text-[10.5px] text-slate-400 mt-0.5 truncate">
                  {rule.legalCitation}
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* 3. 소장 실무 빠른 실행 4메뉴 */}
        <section className="grid grid-cols-2 gap-2.5">
          <Link
            href="/pro/docs"
            className="p-3.5 rounded-2xl bg-[#121A2B] border border-white/[0.08] hover:border-sky-400/50 space-y-1.5 transition"
          >
            <FileText className="w-5 h-5 text-sky-400" />
            <div className="text-xs font-black text-white">입대의·공문 초안</div>
            <div className="text-[10.5px] text-slate-400">
              안건지·입찰공고·민원회신 10초 생성
            </div>
          </Link>

          <Link
            href="/pro/legal"
            className="p-3.5 rounded-2xl bg-[#121A2B] border border-white/[0.08] hover:border-emerald-400/50 space-y-1.5 transition"
          >
            <ShieldAlert className="w-5 h-5 text-emerald-400" />
            <div className="text-xs font-black text-white">법정점검 매트릭스</div>
            <div className="text-[10.5px] text-slate-400">
              1~12월 과태료 방어 이력 관리
            </div>
          </Link>
        </section>

        {/* 4. PosMul 플랫폼 연동: 소장 예측 마켓 & 집단지성 커뮤니티 */}
        <section className="rounded-2xl bg-gradient-to-br from-[#11192D] via-[#131B32] to-indigo-950/60 border border-indigo-500/35 p-4 space-y-3 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <span className="text-xs font-black text-white">
                PosMul 소장 집단지성 · 경제 연동
              </span>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[9.5px] font-black">
              PMP/PMC 보상
            </span>
          </div>

          <div className="grid grid-cols-1 gap-2">
            <Link
              href="/pro/predict"
              className="p-3 rounded-xl bg-slate-950/80 border border-white/[0.08] hover:border-indigo-400/50 flex items-center justify-between gap-2 transition"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/15 text-indigo-300 flex items-center justify-center shrink-0">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-black text-white truncate">
                    법령 개정 · K-apt 난방비 예측 마켓
                  </div>
                  <div className="text-[10.5px] text-slate-400 truncate">
                    장충금 하한선 국회 통과 예측 참여 중 (342명)
                  </div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />
            </Link>

            {latestPollPost && (
              <Link
                href="/pro/community"
                className="p-3 rounded-xl bg-slate-950/80 border border-white/[0.08] hover:border-sky-400/50 flex items-center justify-between gap-2 transition"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-sky-500/15 text-sky-300 flex items-center justify-center shrink-0">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-black text-white truncate">
                      {latestPollPost.title}
                    </div>
                    <div className="text-[10.5px] text-amber-300 font-bold flex items-center gap-1">
                      <Coins className="w-3 h-3" />
                      <span>소장 투표 참여 시 +{latestPollPost.pmpReward} PMP</span>
                    </div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />
              </Link>
            )}
          </div>
        </section>

        {/* 5. 수험 -> 실무 생애주기 브릿지 */}
        <LifecycleLockinBridge />
      </div>
    </MobileAppShell>
  );
}
