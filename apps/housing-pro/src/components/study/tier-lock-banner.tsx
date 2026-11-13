"use client";

import { Lock, Sparkles, BookOpen, KeyRound } from "lucide-react";

interface TierLockBannerProps {
  currentTier: number;
  onOpenSerialModal: () => void;
}

export function TierLockBanner({ currentTier, onOpenSerialModal }: TierLockBannerProps) {
  return (
    <div className="rounded-2xl bg-gradient-to-r from-amber-950/40 via-slate-900 to-indigo-950/40 border border-amber-500/30 p-5 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-extrabold text-[11px] border border-amber-500/30 flex items-center gap-1">
            <Lock className="w-3 h-3 text-amber-400" />
            <span>{currentTier}회독 ({currentTier * 20}%) 잠김 안내</span>
          </span>
          <span className="text-slate-400 text-xs font-bold">
            1회독(20% 뼈대 선지)은 무료 체험 제공 중
          </span>
        </div>
        <h3 className="text-base font-black text-white">
          빈출 기한·예외단서·판례유권해석·지엽 선지는 POD 교재 구매자 전용입니다
        </h3>
        <p className="text-xs text-slate-300">
          종이책에 인쇄된 16자리 시리얼 번호를 등록하시면 240개 전 선지가 즉시 해금되며, AI 카메라 스캔 보상(+40 PMP)이 활성화됩니다.
        </p>
      </div>

      <button
        onClick={onOpenSerialModal}
        className="px-5 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs flex items-center gap-2 transition shadow-lg shadow-amber-500/25 shrink-0"
      >
        <KeyRound className="w-4 h-4 text-slate-950" />
        <span>정품 시리얼 등록하고 전체 해금</span>
      </button>
    </div>
  );
}

