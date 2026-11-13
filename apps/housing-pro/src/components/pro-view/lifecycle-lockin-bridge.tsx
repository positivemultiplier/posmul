"use client";

import { useState } from "react";
import { GraduationCap, ArrowRight, ShieldCheck, Printer, Download, Sparkles, CheckCircle2, Lock } from "lucide-react";

export function LifecycleLockinBridge() {
  const [copied, setCopied] = useState(false);

  const handlePrint = () => {
    window.print();
  };

  const handleExportCal = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-[#10172B] to-indigo-950/60 border border-indigo-500/30 p-4 shadow-xl space-y-3.5">
      <div className="flex flex-col gap-3 border-b border-white/[0.08] pb-3.5">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-extrabold text-[10px] border border-indigo-500/30 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-indigo-400" />
              <span>생애주기 락인 가동</span>
            </span>
            <span className="text-slate-400 text-[10.5px] font-bold flex items-center gap-1">
              <Lock className="w-3 h-3 text-slate-500" />
              <span>게이미피케이션 차단 (업무 안심)</span>
            </span>
          </div>

          <h2 className="text-sm font-black text-white leading-snug">
            수험 시절 외웠던 240개 선지, 이제 과태료 4,800만원 방패가 됩니다
          </h2>

          <p className="text-[11px] text-slate-300 leading-relaxed">
            관계법규·관리실무 2차 기출에서 훈련한 법정 주기가 단지 캘린더로 100% 직결되었습니다.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={handlePrint}
            className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-bold transition flex items-center justify-center gap-1.5 border border-white/[0.06]"
          >
            <Printer className="w-3.5 h-3.5 shrink-0" />
            <span>캘린더 인쇄</span>
          </button>

          <button
            type="button"
            onClick={handleExportCal}
            className="py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-black transition flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/30"
          >
            <Download className="w-3.5 h-3.5 shrink-0" />
            <span>{copied ? "iCal 생성 완료!" : "모바일 동기화"}</span>
          </button>
        </div>
      </div>

      {/* 수험 ➡️ 실무 매핑 플로우 카드 */}
      <div className="grid grid-cols-1 gap-2.5 text-xs">
        <div className="p-3.5 rounded-xl bg-slate-950/80 border border-white/[0.06] space-y-1.5">
          <div className="flex items-center justify-between text-slate-400 font-bold">
            <span className="flex items-center gap-1">
              <GraduationCap className="w-3.5 h-3.5 text-sky-400" />
              1. 수험 단계
            </span>
            <span className="text-[10px] text-sky-300">2026 제29회 2차</span>
          </div>
          <div className="font-extrabold text-white text-xs">
            48문항 240개 선지 O/★/X 분해
          </div>
          <p className="text-[11px] text-slate-400">
            기한·벌칙·정족수 지엽 함정을 3초 컷 1줄 카드로 완벽 체화
          </p>
        </div>

        <div className="p-3.5 rounded-xl bg-indigo-950/40 border border-indigo-500/30 space-y-1.5">
          <div className="flex items-center justify-between text-indigo-300 font-bold">
            <span className="flex items-center gap-1">
              <ArrowRight className="w-3.5 h-3.5 text-indigo-400" />
              2. 합격 직후 단지 매핑
            </span>
            <span className="text-[10px] text-emerald-400 font-bold">자동 전환</span>
          </div>
          <div className="font-extrabold text-white text-xs">
            단지 스펙 입력 즉시 16대 법정 룰 활성화
          </div>
          <p className="text-[11px] text-slate-300">
            승강기, 소방, 관리비, K-apt 보고일정이 D-Day 엔진으로 전환
          </p>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-950/80 border border-white/[0.06] space-y-1.5">
          <div className="flex items-center justify-between text-slate-400 font-bold">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              3. 현직 소장 코파일럿
            </span>
            <span className="text-[10px] text-emerald-300">평생 락인</span>
          </div>
          <div className="font-extrabold text-white text-xs">
            과태료 0건 & AM 7시 AI 브리핑
          </div>
          <p className="text-[11px] text-slate-400">
            동대표·민원인 앞에서도 떳떳한 전문직 전용 인트라넷 환경 제공
          </p>
        </div>
      </div>
    </div>
  );
}

