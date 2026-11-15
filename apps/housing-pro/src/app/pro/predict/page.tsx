"use client";

import { useState } from "react";
import {
  TrendingUp,
  FileText,
  ExternalLink,
  Coins,
  Sparkles,
} from "lucide-react";
import { MobileAppShell } from "@/components/mobile/mobile-app-shell";
import { ContextualPredictionWidget } from "@/components/prediction/contextual-prediction-widget";
import { AiBriefingViewer } from "@/components/pro-view/ai-briefing-viewer";
import { useProWorkspace } from "@/lib/pro-workspace-store";

export default function ProPredictAndBriefingPage() {
  const { userPmpBalance, userPmcBalance, setUserPmpBalance } = useProWorkspace();
  const [activeTab, setActiveTab] = useState<"predict" | "briefing">("predict");

  return (
    <MobileAppShell isProMode>
      <header className="px-4 py-3 bg-[#0D1322] border-b border-white/[0.06] space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-sky-400" />
            <h1 className="text-sm font-black text-white">PosMul 예측 · 법령 브리핑</h1>
          </div>
          <div className="flex items-center gap-1.5 font-mono text-[10px] font-black">
            <span className="px-2 py-0.5 rounded-full bg-indigo-950 text-sky-300 border border-sky-500/30">
              {userPmpBalance.toLocaleString()} PMP
            </span>
            <span className="px-2 py-0.5 rounded-full bg-amber-950/70 text-amber-300 border border-amber-500/30">
              {userPmcBalance.toLocaleString()} PMC
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-1 p-1 rounded-2xl bg-[#070B15] border border-white/[0.06] text-[11px] font-black">
          <button
            type="button"
            onClick={() => setActiveTab("predict")}
            className={`py-2 rounded-xl transition flex items-center justify-center gap-1.5 ${
              activeTab === "predict"
                ? "bg-indigo-600 text-white shadow"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>PosMul 실무 예측</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("briefing")}
            className={`py-2 rounded-xl transition flex items-center justify-center gap-1.5 ${
              activeTab === "briefing"
                ? "bg-indigo-600 text-white shadow"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>AM 7:00 법령 브리핑</span>
          </button>
        </div>
      </header>

      <div className="px-4 py-4 space-y-4">
        {/* PosMul 플랫폼 경제 연동 배너 */}
        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-[#111A2E] to-indigo-950/60 border border-indigo-500/30 flex items-center justify-between gap-3">
          <div className="space-y-0.5 min-w-0">
            <div className="text-[11px] font-black text-white flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <span>PosMul 집단지성 예측 오라클 연동</span>
            </div>
            <p className="text-[10.5px] text-slate-300 leading-snug">
              법정의무 방어·커뮤니티 기여로 모은 PMP로 정책·관리비 예측에 참여해 PMC를 획득하세요.
            </p>
          </div>
          <a
            href="https://posmul.com/prediction"
            target="_blank"
            rel="noopener noreferrer"
            className="px-2.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-black flex items-center gap-1 shrink-0 transition"
          >
            <Coins className="w-3 h-3" />
            <span>PosMul</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        {activeTab === "predict" ? (
          <ContextualPredictionWidget
            userPmpBalance={userPmpBalance}
            onBalanceChange={setUserPmpBalance}
          />
        ) : (
          <AiBriefingViewer />
        )}
      </div>
    </MobileAppShell>
  );
}
