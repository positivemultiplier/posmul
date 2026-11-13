"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  X,
  Sparkles,
  ArrowRight,
  Flame,
  Trophy,
  Filter,
  Lock,
  KeyRound,
  Zap,
} from "lucide-react";
import { MobileAppShell } from "@/components/mobile/mobile-app-shell";
import { REAL_2026_EXAM_OX_CARDS } from "@/data/mock-exam-options";
import { SerialRegisterModal } from "@/components/auth/serial-register-modal";
import { TierLockBanner } from "@/components/study/tier-lock-banner";
import { getUserSerialStatusAction } from "@/app/actions/serial.actions";

export default function OxSwipeStudyPage() {
  const [selectedTier, setSelectedTier] = useState<number>(1); // 기본 1회독(20% 뼈대 선지)
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answered, setAnswered] = useState<boolean | null>(null);
  const [userSelected, setUserSelected] = useState<boolean | null>(null);
  const [earnedPmpTotal, setEarnedPmpTotal] = useState(0);

  // 정품 시리얼 인증 상태
  const [isSerialVerified, setIsSerialVerified] = useState(false);
  const [isSerialModalOpen, setIsSerialModalOpen] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const cached = localStorage.getItem("housing_pro_serial_auth");
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (parsed.serialCode) {
            setIsSerialVerified(true);
          }
        } catch (e) {
          console.error(e);
        }
      }
    }

    getUserSerialStatusAction("user-demo-housing-1").then((res) => {
      if (res.isRegistered) {
        setIsSerialVerified(true);
      }
    });
  }, []);

  const activeCards = useMemo(() => {
    return REAL_2026_EXAM_OX_CARDS.filter((c) => c.masteryTier <= selectedTier);
  }, [selectedTier]);

  const isTierLocked = selectedTier > 1 && !isSerialVerified;
  const currentCard = activeCards[currentIndex];
  const isFinished = currentIndex >= activeCards.length;

  const handleAnswer = (selected: boolean) => {
    if (answered !== null || !currentCard || isTierLocked) return;
    setUserSelected(selected);
    const isRight = selected === currentCard.isCorrectStatement;
    setAnswered(isRight);

    if (isRight) {
      setEarnedPmpTotal((prev) => prev + 10);
    }
  };

  const handleNext = () => {
    setAnswered(null);
    setUserSelected(null);
    setCurrentIndex((prev) => prev + 1);
  };

  const handleTierChange = (tier: number) => {
    setSelectedTier(tier);
    setCurrentIndex(0);
    setAnswered(null);
    setUserSelected(null);
  };

  return (
    <MobileAppShell>
      {/* 상단 앱 헤더 */}
      <header className="px-4 py-3 bg-[#16161C] border-b border-white/[0.06] space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-[#FF5A36] fill-[#FF5A36]" />
            <h1 className="text-sm font-black text-white">3초 컷 1줄 O/X 덱</h1>
          </div>

          <div className="flex items-center gap-2">
            {earnedPmpTotal > 0 && (
              <span className="text-[10px] font-black text-amber-300 bg-amber-950/70 px-2 py-0.5 rounded-full border border-amber-500/30 font-mono">
                +{earnedPmpTotal} PMP
              </span>
            )}
            {isSerialVerified ? (
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-950/80 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                <span>정품인증</span>
              </span>
            ) : (
              <button
                type="button"
                onClick={() => setIsSerialModalOpen(true)}
                className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/[0.08] text-amber-300 border border-amber-500/30 flex items-center gap-1"
              >
                <KeyRound className="w-3 h-3" />
                <span>키등록</span>
              </button>
            )}
          </div>
        </div>

        {/* 1~5회독 해금 필터 바 */}
        <div className="grid grid-cols-5 gap-1 pb-0.5">
          {[1, 2, 3, 4, 5].map((tier) => {
            const locked = tier > 1 && !isSerialVerified;
            return (
              <button
                key={tier}
                type="button"
                onClick={() => handleTierChange(tier)}
                className={`py-1.5 rounded-xl text-[10.5px] font-black transition flex items-center justify-center gap-0.5 ${
                  selectedTier === tier
                    ? "bg-[#FF5A36] text-white shadow-md"
                    : "bg-[#0E0E12] text-slate-400 hover:text-white border border-white/[0.05]"
                }`}
              >
                {locked && <Lock className="w-2.5 h-2.5 text-amber-400 shrink-0" />}
                <span>{tier}회독</span>
              </button>
            );
          })}
        </div>
      </header>

      {/* 메인 카드 영역 */}
      <div className="px-4 py-4 flex-1 flex flex-col justify-between space-y-4">
        {isTierLocked ? (
          <div className="space-y-4">
            <TierLockBanner
              currentTier={selectedTier}
              onOpenSerialModal={() => setIsSerialModalOpen(true)}
            />

            <div className="p-6 rounded-3xl bg-[#1A1A21] border border-white/[0.08] text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-[#121216] border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto">
                <Lock className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-black text-white">
                  {selectedTier}회독 ({selectedTier * 20}%) 카드 잠금
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  1회독(20% 기초 뼈대)은 무료 체험 가능하며, 정품 시리얼 등록 시 240개 전체 선지가 해금됩니다.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => handleTierChange(1)}
                  className="py-2.5 rounded-xl bg-white/[0.06] text-slate-200 text-xs font-bold"
                >
                  1회독 풀기
                </button>
                <button
                  type="button"
                  onClick={() => setIsSerialModalOpen(true)}
                  className="py-2.5 rounded-xl bg-amber-500 text-slate-950 text-xs font-black"
                >
                  정품 시리얼 등록
                </button>
              </div>
            </div>
          </div>
        ) : !isFinished && currentCard ? (
          <>
            {/* 진행도 바 */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-bold">
                <span className="text-slate-400">
                  [{currentCard.subject}] 제{currentCard.examRound}회 {currentCard.questionNumber}번
                </span>
                <span className="font-mono text-[#FF7A59]">
                  {currentIndex + 1} / {activeCards.length}
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-[#1E1E24] overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#FF5A36] to-[#FF8008] transition-all duration-300"
                  style={{ width: `${((currentIndex + 1) / activeCards.length) * 100}%` }}
                />
              </div>
            </div>

            {/* 화면 중앙 대형 플래시카드 */}
            <div className="flex-1 flex flex-col justify-center p-6 rounded-3xl bg-gradient-to-b from-[#1D1D24] to-[#16161C] border border-white/[0.08] shadow-2xl space-y-5 min-h-[260px]">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded-full bg-[#FF5A36]/15 text-[#FF7A59] border border-[#FF5A36]/30 text-[10px] font-black">
                  {currentCard.masteryTier}회독 ({currentCard.masteryTier * 20}%) · 선지 {currentCard.optionNumber}번
                </span>
                <span className="text-[10.5px] font-bold text-amber-300">
                  정답 시 +10 PMP
                </span>
              </div>

              <p className="text-lg font-extrabold text-white leading-relaxed tracking-tight">
                &quot;{currentCard.statement}&quot;
              </p>

              {answered !== null && (
                <div
                  className={`p-3.5 rounded-2xl border space-y-1.5 ${
                    answered
                      ? "bg-emerald-950/50 border-emerald-500/40 text-emerald-200"
                      : "bg-rose-950/50 border-rose-500/40 text-rose-200"
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-black">
                    <span>
                      {answered ? "✅ 정답! (+10 PMP)" : "❌ 오답! 오답덱 자동 등록"}
                    </span>
                    <span className="font-mono">
                      정답: {currentCard.isCorrectStatement ? "O" : "X"}
                    </span>
                  </div>
                  {currentCard.trapCorrection && (
                    <div className="text-xs font-bold text-amber-300">
                      💡 {currentCard.trapCorrection}
                    </div>
                  )}
                  {currentCard.citation && (
                    <div className="text-[10.5px] text-slate-400 font-mono">
                      근거: {currentCard.citation}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 하단 엄지손가락 대형 O / X 터치 버튼 */}
            <div className="space-y-2.5">
              {answered === null ? (
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => handleAnswer(false)}
                    className="py-5 rounded-2xl bg-[#1F1A1D] hover:bg-rose-950/70 border-2 border-rose-500/40 text-rose-300 font-black text-base flex flex-col items-center justify-center gap-1 transition active:scale-95 shadow-lg"
                  >
                    <X className="w-7 h-7 text-rose-400" />
                    <span>틀린 지문 (X)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleAnswer(true)}
                    className="py-5 rounded-2xl bg-[#1A211E] hover:bg-emerald-950/70 border-2 border-emerald-500/40 text-emerald-300 font-black text-base flex flex-col items-center justify-center gap-1 transition active:scale-95 shadow-lg"
                  >
                    <CheckCircle2 className="w-7 h-7 text-emerald-400" />
                    <span>맞는 지문 (O)</span>
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleNext}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#FF5A36] to-[#FF8008] text-white font-black text-sm flex items-center justify-center gap-2 shadow-[0_6px_20px_rgba(255,90,54,0.4)] active:scale-95 transition"
                >
                  <span>다음 선지 3초 컷</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </>
        ) : (
          <div className="p-7 rounded-3xl bg-[#1A1A21] border border-white/[0.08] text-center space-y-4 my-auto">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-amber-400 to-[#FF5A36] flex items-center justify-center mx-auto text-slate-950 shadow-lg">
              <Trophy className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-black text-white">
                {selectedTier}회독 복습 완료!
              </h3>
              <p className="text-xs text-slate-400">
                총 {activeCards.length}개 선지 점검 · +{earnedPmpTotal} PMP 획득
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setCurrentIndex(0);
                  setAnswered(null);
                  setUserSelected(null);
                }}
                className="py-3 rounded-xl bg-white/[0.06] text-white font-bold text-xs"
              >
                다시 풀기
              </button>
              <Link
                href="/"
                className="py-3 rounded-xl bg-[#FF5A36] text-white font-black text-xs flex items-center justify-center"
              >
                타이머 홈으로
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* 정품 시리얼 등록 모달 (z-50) */}
      <SerialRegisterModal
        isOpen={isSerialModalOpen}
        onClose={() => setIsSerialModalOpen(false)}
        onSuccess={() => setIsSerialVerified(true)}
      />
    </MobileAppShell>
  );
}
