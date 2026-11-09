"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Zap, Clock, Users, ArrowRight, CheckCircle2, Share2, Flame } from "lucide-react";
import { ChallengeOption } from "@/app/challenge/types";

export interface LiveChallengePayload {
  id: string; // 챌린지 DB id
  title: string;
  hostName: string;
  options: ChallengeOption[];
  eventStartAt: string; // 마감 시간 (ISO)
  totalPoolPmp: number;
}

interface LiveChallengeCardProps {
  challenge: LiveChallengePayload;
  onQuickVote: (challengeId: string, optionId: "A" | "B") => Promise<boolean>;
  userVote?: "A" | "B" | null;
}

export function LiveChallengeCard({
  challenge,
  onQuickVote,
  userVote: initialUserVote = null,
}: LiveChallengeCardProps) {
  const [timeLeftStr, setTimeLeftStr] = useState<string>("계산중...");
  const [isExpired, setIsExpired] = useState<boolean>(false);
  const [isVoting, setIsVoting] = useState<boolean>(false);
  const [myVote, setMyVote] = useState<"A" | "B" | null>(initialUserVote);
  const [copied, setCopied] = useState<boolean>(false);

  const optA = challenge.options[0] || { id: "A", label: "선택 A", ratio: 50, pmp: 0 };
  const optB = challenge.options[1] || { id: "B", label: "선택 B", ratio: 50, pmp: 0 };

  // 남은 시간 실시간 카운트다운
  useEffect(() => {
    const updateCountdown = () => {
      const endMs = new Date(challenge.eventStartAt).getTime();
      const nowMs = Date.now();
      const diffMs = endMs - nowMs;

      if (diffMs <= 0) {
        setIsExpired(true);
        setTimeLeftStr("마감됨 (결과 대기)");
        return;
      }

      setIsExpired(false);
      const m = Math.floor(diffMs / 60000);
      const s = Math.floor((diffMs % 60000) / 1000);
      setTimeLeftStr(`${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [challenge.eventStartAt]);

  const handleVoteClick = async (optionId: "A" | "B") => {
    if (isExpired || isVoting || myVote) return;
    setIsVoting(true);
    try {
      const ok = await onQuickVote(challenge.id, optionId);
      if (ok) {
        setMyVote(optionId);
      }
    } finally {
      setIsVoting(false);
    }
  };

  const handleCopyLink = () => {
    const url = `${window.location.origin}/challenge/${challenge.id}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full my-2 bg-gradient-to-br from-indigo-950/80 via-slate-900/90 to-purple-950/80 border border-indigo-500/40 hover:border-indigo-400/60 rounded-2xl p-4 shadow-xl backdrop-blur-md transition-all">
      {/* 상단 헤더 태그 */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 text-[11px] font-bold tracking-wide">
          <Zap className="w-3.5 h-3.5 fill-amber-400 animate-pulse" />
          <span>시청자 번개 예측</span>
          <span className="text-slate-400 font-normal">by {challenge.hostName}</span>
        </div>

        <div className="flex items-center gap-1.5">
          <div
            className={`inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded-md ${
              isExpired
                ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                : "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-bold"
            }`}
          >
            <Clock className="w-3 h-3" />
            <span>{timeLeftStr}</span>
          </div>

          <button
            onClick={handleCopyLink}
            title="내기 링크 복사"
            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 챌린지 타이틀 */}
      <h4 className="text-sm sm:text-base font-extrabold text-white mb-3 leading-snug flex items-center gap-1.5">
        <Flame className="w-4 h-4 text-orange-400 shrink-0" />
        <span>{challenge.title}</span>
      </h4>

      {/* 실시간 대결 게이지 바 */}
      <div className="mb-3">
        <div className="flex justify-between items-center text-xs font-semibold mb-1">
          <span className="text-sky-300 truncate max-w-[45%]">
            A. {optA.label} ({optA.ratio}%)
          </span>
          <span className="text-rose-300 truncate max-w-[45%] text-right">
            B. {optB.label} ({optB.ratio}%)
          </span>
        </div>
        <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden flex border border-slate-700/50">
          <div
            className="bg-gradient-to-r from-sky-500 to-blue-500 transition-all duration-500"
            style={{ width: `${optA.ratio}%` }}
          />
          <div
            className="bg-gradient-to-r from-rose-500 to-pink-500 transition-all duration-500"
            style={{ width: `${optB.ratio}%` }}
          />
        </div>
      </div>

      {/* 원클릭 투표 버튼 영역 */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        {/* A 옵션 투표 버튼 */}
        <button
          onClick={() => handleVoteClick("A")}
          disabled={isExpired || isVoting || myVote !== null}
          className={`py-2 px-2.5 rounded-xl text-xs font-bold transition-all flex flex-col items-center justify-center gap-0.5 border ${
            myVote === "A"
              ? "bg-sky-500 text-white border-sky-300 shadow-md shadow-sky-500/30"
              : myVote !== null || isExpired
              ? "bg-slate-800/40 text-slate-500 border-slate-700/30 cursor-not-allowed"
              : "bg-sky-500/15 hover:bg-sky-500/25 text-sky-300 border-sky-500/40 active:scale-95 cursor-pointer"
          }`}
        >
          <div className="flex items-center gap-1">
            {myVote === "A" && <CheckCircle2 className="w-3.5 h-3.5" />}
            <span className="truncate">{optA.label}</span>
          </div>
          <span className="text-[10px] opacity-75 font-normal">
            {myVote === "A" ? "내 투표 완료" : "100포 밀어주기"}
          </span>
        </button>

        {/* B 옵션 투표 버튼 */}
        <button
          onClick={() => handleVoteClick("B")}
          disabled={isExpired || isVoting || myVote !== null}
          className={`py-2 px-2.5 rounded-xl text-xs font-bold transition-all flex flex-col items-center justify-center gap-0.5 border ${
            myVote === "B"
              ? "bg-rose-500 text-white border-rose-300 shadow-md shadow-rose-500/30"
              : myVote !== null || isExpired
              ? "bg-slate-800/40 text-slate-500 border-slate-700/30 cursor-not-allowed"
              : "bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border-rose-500/40 active:scale-95 cursor-pointer"
          }`}
        >
          <div className="flex items-center gap-1">
            {myVote === "B" && <CheckCircle2 className="w-3.5 h-3.5" />}
            <span className="truncate">{optB.label}</span>
          </div>
          <span className="text-[10px] opacity-75 font-normal">
            {myVote === "B" ? "내 투표 완료" : "100포 밀어주기"}
          </span>
        </button>
      </div>

      {/* 하단 판돈 & 전용방 이동 링크 */}
      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800/80">
        <span className="font-medium text-slate-300">
          누적 판돈 <span className="text-amber-400 font-bold font-mono">{challenge.totalPoolPmp.toLocaleString()}P</span>
        </span>

        <Link
          href={`/challenge/${challenge.id}`}
          target="_blank"
          className="inline-flex items-center gap-1 text-indigo-300 hover:text-indigo-200 font-semibold group cursor-pointer"
        >
          <span>자세히 보기 & 토론</span>
          <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>

      {copied && (
        <div className="mt-2 text-center text-[10px] text-emerald-400 animate-fade-in font-medium">
          ✓ 내기 링크가 복사되었습니다! 카톡이나 X에 공유해 보세요.
        </div>
      )}
    </div>
  );
}

