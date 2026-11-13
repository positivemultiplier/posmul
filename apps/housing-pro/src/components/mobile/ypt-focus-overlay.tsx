"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Flame,
  Square,
  Camera,
  Zap,
  CheckCircle2,
  X,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { REAL_2026_EXAM_OX_CARDS } from "@/data/mock-exam-options";

interface YptFocusOverlayProps {
  isOpen: boolean;
  subjectTitle: string;
  subjectColor: string;
  coneEmoji: string;
  coneLevel: number;
  onConfirmValidTime: (elapsedSeconds: number) => void;
  onCancel: () => void;
}

function formatHHMMSS(totalSec: number): string {
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return [h, m, s].map((v) => String(v).padStart(2, "0")).join(" : ");
}

export function YptFocusOverlay({
  isOpen,
  subjectTitle,
  subjectColor,
  coneEmoji,
  coneLevel,
  onConfirmValidTime,
  onCancel,
}: YptFocusOverlayProps) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizCorrectCount, setQuizCorrectCount] = useState(0);
  const [quizFeedback, setQuizFeedback] = useState<string | null>(null);

  // 1초 타이머 구동
  useEffect(() => {
    if (!isOpen || showVerifyModal) return;
    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [isOpen, showVerifyModal]);

  // 열릴 때 초기화
  useEffect(() => {
    if (isOpen) {
      setElapsedSeconds(0);
      setShowVerifyModal(false);
      setQuizIndex(0);
      setQuizCorrectCount(0);
      setQuizFeedback(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const quickCards = REAL_2026_EXAM_OX_CARDS.slice(0, 3);
  const currentQuizCard = quickCards[quizIndex];

  const handleQuickQuizAnswer = (choice: boolean) => {
    if (!currentQuizCard || quizFeedback) return;
    const isRight = choice === currentQuizCard.isCorrectStatement;
    const nextCorrect = isRight ? quizCorrectCount + 1 : quizCorrectCount;

    if (isRight) {
      setQuizCorrectCount(nextCorrect);
      setQuizFeedback("✅ 정답! 핵심 함정을 정확히 파악했습니다.");
    } else {
      setQuizFeedback(`💡 ${currentQuizCard.trapCorrection}`);
    }

    setTimeout(() => {
      setQuizFeedback(null);
      if (quizIndex + 1 >= quickCards.length) {
        // 3문항 완료 시 유효시간 즉시 확정
        onConfirmValidTime(Math.max(elapsedSeconds, 60));
      } else {
        setQuizIndex((prev) => prev + 1);
      }
    }, 900);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0A0A0D] text-white flex flex-col items-center justify-between p-6">
      {/* 상단 상태 바 */}
      <div className="w-full max-w-[400px] flex items-center justify-between pt-2">
        <div className="flex items-center gap-2">
          <span
            className="w-2.5 h-2.5 rounded-full animate-ping"
            style={{ backgroundColor: subjectColor }}
          />
          <span className="text-xs font-extrabold text-slate-300">
            열공 불빛 ON · 다른 앱 차단 중
          </span>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="text-xs font-bold text-slate-500 hover:text-slate-300 transition"
        >
          취소
        </button>
      </div>

      {/* 중앙 몰입 스톱워치 & 스터디콘 */}
      <div className="w-full max-w-[400px] flex flex-col items-center text-center space-y-6 my-auto">
        <div className="relative">
          <div className="w-28 h-28 rounded-full bg-gradient-to-tr from-[#FF5A36]/25 to-[#FF8008]/15 border-2 border-[#FF5A36] flex items-center justify-center text-6xl shadow-[0_0_50px_rgba(255,90,54,0.35)] animate-pulse">
            {coneEmoji}
          </div>
          <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-[#FF5A36] text-white text-[10px] font-black whitespace-nowrap shadow-lg">
            🔥 Lv.{coneLevel} 열공 가동 중
          </span>
        </div>

        <div className="space-y-1.5 pt-2">
          <div className="text-xs font-bold text-[#FF7A59] tracking-wide">
            현재 학습 단원
          </div>
          <h2 className="text-base font-black text-white px-4">
            {subjectTitle}
          </h2>
        </div>

        {/* 초대형 스톱워치 */}
        <div className="py-2">
          <div className="font-mono text-5xl font-black tracking-wider text-white tabular-nums">
            {formatHHMMSS(elapsedSeconds)}
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            종료 후 AI 스캔 또는 1줄 O/X 3문제를 풀어야 유효시간으로 확정됩니다
          </p>
        </div>
      </div>

      {/* 하단 종료 버튼 */}
      <div className="w-full max-w-[400px] pb-4 space-y-3">
        <button
          type="button"
          onClick={() => setShowVerifyModal(true)}
          className="w-full py-4 rounded-2xl bg-[#FF5A36] hover:bg-[#ff6d4d] text-white font-black text-sm flex items-center justify-center gap-2 shadow-[0_8px_30px_rgba(255,90,54,0.4)] transition"
        >
          <Square className="w-4 h-4 fill-white" />
          <span>공부 종료 및 유효시간 확정</span>
        </button>
      </div>

      {/* 🛡️ 공회전 어뷰징 방지: 유효시간 확정 모달 */}
      {showVerifyModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-[400px] rounded-2xl bg-[#18181E] border border-[#FF5A36]/40 p-5 space-y-4 shadow-2xl">
            <div className="flex items-start justify-between border-b border-white/[0.08] pb-3">
              <div className="space-y-1">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#FF5A36]/20 text-[#FF7A59] text-[10px] font-black">
                  <ShieldCheck className="w-3 h-3" />
                  <span>공회전 어뷰징 차단 인증</span>
                </span>
                <h3 className="text-base font-black text-white">
                  유효 집중 시간 인증하기
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowVerifyModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              방금 공부한 <strong className="text-white">{subjectTitle}</strong>의 종이책을 AI 스캔(+40 PMP)하거나, 아래 <strong>3초 컷 O/X 3문제</strong>를 풀어 공부 시간을 확정하세요!
            </p>

            {/* 즉석 3문항 퀴즈 카드 */}
            {currentQuizCard && (
              <div className="p-3.5 rounded-xl bg-[#121216] border border-white/[0.08] space-y-3">
                <div className="flex items-center justify-between text-[11px] font-bold">
                  <span className="text-[#FF7A59]">
                    즉석 검증 퀴즈 ({quizIndex + 1} / {quickCards.length})
                  </span>
                  <span className="text-slate-400 font-mono">
                    {currentQuizCard.questionNumber}번 선지
                  </span>
                </div>
                <p className="text-xs font-bold text-white leading-relaxed">
                  &quot;{currentQuizCard.statement}&quot;
                </p>

                {quizFeedback ? (
                  <div className="p-2.5 rounded-lg bg-emerald-950/50 border border-emerald-500/30 text-[11px] font-bold text-emerald-300">
                    {quizFeedback}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => handleQuickQuizAnswer(false)}
                      className="py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-rose-300 font-black text-xs flex items-center justify-center gap-1"
                    >
                      <X className="w-4 h-4" />
                      <span>틀림 (X)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickQuizAnswer(true)}
                      className="py-2.5 rounded-xl bg-[#FF5A36] hover:bg-[#ff6d4d] text-white font-black text-xs flex items-center justify-center gap-1"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>맞음 (O)</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* 외부 인증 바로가기 */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <Link
                href="/scan"
                className="py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] text-xs font-bold text-amber-300 flex items-center justify-center gap-1.5"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>AI 스캔 (+40 PMP)</span>
              </Link>
              <Link
                href="/study/ox"
                className="py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] text-xs font-bold text-sky-300 flex items-center justify-center gap-1.5"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>전체 O/X 덱</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

