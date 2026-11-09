"use client";

import React, { useState, useTransition } from "react";
import { Zap, X, Clock, Flame, Trophy, Sparkles, CheckCircle2 } from "lucide-react";
import { createLiveQuickChallengeAction } from "../actions/live.actions";
import { UserChallengeDTO } from "@/app/challenge/types";

interface LiveQuickChallengeModalProps {
  roomId: string;
  isOpen: boolean;
  onClose: () => void;
  onCreated: (challenge: UserChallengeDTO) => void;
}

interface TemplatePreset {
  id: string;
  category: "LCK" | "SPORTS" | "CUSTOM";
  title: string;
  optA: string;
  optB: string;
  defaultMinutes: number;
}

const PRESETS: TemplatePreset[] = [
  // LCK / 롤
  {
    id: "lck-baron",
    category: "LCK",
    title: "2세트 3번째 바론 T1이 먹는다?",
    optA: "T1이 먹는다 (버프 획득)",
    optB: "못 먹는다 (스틸 or 상대 획득)",
    defaultMinutes: 5,
  },
  {
    id: "lck-dragon",
    category: "LCK",
    title: "이번 드래곤 전투에서 스틸이 발생할까?",
    optA: "스틸 성공! (대역전)",
    optB: "정상 처치 (안전 획득)",
    defaultMinutes: 3,
  },
  {
    id: "lck-faker",
    category: "LCK",
    title: "페이커(Faker) 이번 세트 노데스 승리할까?",
    optA: "노데스 캐리 승리 (Yes)",
    optB: "1데스 이상 발생 (No)",
    defaultMinutes: 10,
  },
  {
    id: "lck-ace",
    category: "LCK",
    title: "다음 5분 내 에이스(Ace) 한타가 터질까?",
    optA: "한 팀 전멸 에이스 발생",
    optB: "전멸 없이 대치 지속",
    defaultMinutes: 5,
  },
  // 스포츠 / 축구
  {
    id: "sports-goal",
    category: "SPORTS",
    title: "다음 10분 내에 추가골이 터질까?",
    optA: "골 터진다! (GOAL)",
    optB: "골 없이 방어 성공",
    defaultMinutes: 10,
  },
  {
    id: "sports-son",
    category: "SPORTS",
    title: "손흥민 이번 경기 공격포인트(골/도움) 달성?",
    optA: "공격포인트 달성! (Yes)",
    optB: "무득점/무도움 (No)",
    defaultMinutes: 15,
  },
];

export function LiveQuickChallengeModal({
  roomId,
  isOpen,
  onClose,
  onCreated,
}: LiveQuickChallengeModalProps) {
  const [selectedCategory, setSelectedCategory] = useState<"LCK" | "SPORTS" | "CUSTOM">("LCK");
  const [title, setTitle] = useState(PRESETS[0].title);
  const [optA, setOptA] = useState(PRESETS[0].optA);
  const [optB, setOptB] = useState(PRESETS[0].optB);
  const [durationMinutes, setDurationMinutes] = useState(5);
  const [hostPickIndex, setHostPickIndex] = useState<number>(0); // 0: optA, 1: optB
  const [betAmount, setBetAmount] = useState<number>(100);
  const [error, setError] = useState<string | null>(null);

  const [isPending, startTransition] = useTransition();

  if (!isOpen) return null;

  const handleSelectPreset = (p: TemplatePreset) => {
    setTitle(p.title);
    setOptA(p.optA);
    setOptB(p.optB);
    setDurationMinutes(p.defaultMinutes);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !optA.trim() || !optB.trim()) {
      setError("질문과 선택지 2개를 모두 입력해 주세요.");
      return;
    }

    setError(null);
    startTransition(async () => {
      const res = await createLiveQuickChallengeAction({
        roomId,
        title: title.trim(),
        options: [optA.trim(), optB.trim()],
        durationMinutes,
        hostPickIndex,
        hostBetAmount: betAmount,
      });

      if (res.requireLogin) {
        if (confirm("번개 예측을 개설하려면 로그인이 필요합니다. 로그인 페이지로 이동할까요?")) {
          window.location.href = `/auth/login?redirectTo=/live/${roomId}`;
        }
        return;
      }

      if (!res.success || !res.challenge) {
        setError(res.error || "번개 예측 생성에 실패했습니다.");
        return;
      }

      onCreated(res.challenge);
      onClose();
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg bg-slate-900 border border-indigo-500/40 rounded-2xl p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        {/* 닫기 버튼 */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* 모달 헤더 */}
        <div className="flex items-center gap-2 mb-4">
          <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-lg shadow-amber-500/10">
            <Zap className="w-5 h-5 fill-amber-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-1.5">
              <span>실시간 번개 예측 개설</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 font-semibold">
                채팅방 투척용
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              경기를 보며 10초 만에 내기를 만들고 시청자들과 실시간으로 베팅해 보세요!
            </p>
          </div>
        </div>

        {/* 카테고리 탭 */}
        <div className="flex gap-2 p-1 bg-slate-950/60 rounded-xl mb-4 border border-slate-800">
          <button
            type="button"
            onClick={() => {
              setSelectedCategory("LCK");
              handleSelectPreset(PRESETS[0]);
            }}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              selectedCategory === "LCK"
                ? "bg-indigo-600 text-white shadow-md"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            🎮 LCK/롤 전용
          </button>
          <button
            type="button"
            onClick={() => {
              setSelectedCategory("SPORTS");
              handleSelectPreset(PRESETS[4]);
            }}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              selectedCategory === "SPORTS"
                ? "bg-indigo-600 text-white shadow-md"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            ⚽ 스포츠/축구
          </button>
          <button
            type="button"
            onClick={() => {
              setSelectedCategory("CUSTOM");
              setTitle("");
              setOptA("");
              setOptB("");
            }}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              selectedCategory === "CUSTOM"
                ? "bg-indigo-600 text-white shadow-md"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            ✍️ 직접 입력
          </button>
        </div>

        {/* 프리셋 버튼 목록 */}
        {selectedCategory !== "CUSTOM" && (
          <div className="mb-4">
            <label className="block text-[11px] font-semibold text-slate-400 mb-1.5">
              💡 1초 완성 템플릿 선택
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {PRESETS.filter((p) => p.category === selectedCategory).map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleSelectPreset(p)}
                  className={`text-left p-2.5 rounded-xl text-xs border transition-all cursor-pointer ${
                    title === p.title
                      ? "bg-indigo-500/20 border-indigo-500 text-white font-bold"
                      : "bg-slate-800/40 border-slate-700/50 text-slate-300 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  <p className="line-clamp-1">{p.title}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 예측 질문 */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              예측 질문 (내기 내용)
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="예: 2세트 3번째 바론 T1이 먹는다?"
              maxLength={60}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* 선택지 2개 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-sky-400 mb-1">
                옵션 A 선택지
              </label>
              <input
                type="text"
                value={optA}
                onChange={(e) => setOptA(e.target.value)}
                placeholder="예: 먹는다 (Yes)"
                maxLength={30}
                className="w-full bg-slate-950 border border-sky-500/40 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-400"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-rose-400 mb-1">
                옵션 B 선택지
              </label>
              <input
                type="text"
                value={optB}
                onChange={(e) => setOptB(e.target.value)}
                placeholder="예: 못 먹는다 (No)"
                maxLength={30}
                className="w-full bg-slate-950 border border-rose-500/40 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-400"
              />
            </div>
          </div>

          {/* 방장이 걸 쪽 & 판돈 선택 */}
          <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800 space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                🎯 방장(나)은 어느 쪽에 베팅하시겠습니까?
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setHostPickIndex(0)}
                  className={`py-2 px-3 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                    hostPickIndex === 0
                      ? "bg-sky-500 text-white border-sky-400 shadow-md shadow-sky-500/20"
                      : "bg-slate-900 border-slate-700 text-slate-400 hover:text-white"
                  }`}
                >
                  A. {optA || "옵션 A"}
                </button>
                <button
                  type="button"
                  onClick={() => setHostPickIndex(1)}
                  className={`py-2 px-3 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                    hostPickIndex === 1
                      ? "bg-rose-500 text-white border-rose-400 shadow-md shadow-rose-500/20"
                      : "bg-slate-900 border-slate-700 text-slate-400 hover:text-white"
                  }`}
                >
                  B. {optB || "옵션 B"}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between gap-4">
              <div className="flex-1">
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  ⏱️ 마감 시간
                </label>
                <div className="flex gap-1.5">
                  {[3, 5, 10, 15].map((min) => (
                    <button
                      key={min}
                      type="button"
                      onClick={() => setDurationMinutes(min)}
                      className={`flex-1 py-1 rounded-md text-[11px] font-semibold border transition-all cursor-pointer ${
                        durationMinutes === min
                          ? "bg-indigo-600 text-white border-indigo-500"
                          : "bg-slate-900 text-slate-400 border-slate-700 hover:text-slate-200"
                      }`}
                    >
                      {min}분
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex-1">
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  🪙 베팅 포인트
                </label>
                <div className="flex gap-1.5">
                  {[100, 300, 500, 1000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setBetAmount(amt)}
                      className={`flex-1 py-1 rounded-md text-[11px] font-semibold border transition-all cursor-pointer ${
                        betAmount === amt
                          ? "bg-amber-600 text-white border-amber-500"
                          : "bg-slate-900 text-slate-400 border-slate-700 hover:text-slate-200"
                      }`}
                    >
                      {amt}P
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {error && (
            <div className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 p-2.5 rounded-lg">
              {error}
            </div>
          )}

          {/* 제출 버튼 */}
          <button
            type="submit"
            disabled={isPending}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-indigo-600 hover:from-amber-400 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            <Zap className="w-4 h-4 fill-white" />
            <span>{isPending ? "채팅방에 쏘아 올리는 중..." : "⚡ 채팅방에 번개 예측 던지기!"}</span>
          </button>
        </form>
      </div>
    </div>
  );
}

