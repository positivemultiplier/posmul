"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Sparkles, RefreshCw, ArrowUpRight } from "lucide-react";
import {
  getFriendByDomain,
  getFriendById,
  type PosMulFriendId,
} from "./posmul-friends";

export interface PosMulCharacterCompanionProps {
  /** 도메인 키 (economy, prediction, donation, consume, forum, ranking, challenge, live, healing-room) */
  domain?: string;
  /** 직접 캐릭터 지정 (domain보다 우선) */
  friendId?: PosMulFriendId;
  /** 표시 형태: banner(와이드 안내 카드) | compact(헤더 내 슬림 칩) */
  variant?: "banner" | "compact";
  /** 커스텀 대사 (지정 시 첫 문장으로 표시) */
  customMessage?: string;
  /** 추가 Tailwind 클래스 */
  className?: string;
}

/**
 * 도메인 페이지에서 PosMul Friends 캐릭터가 가이드를 건네는 인터랙티브 동반자 컴포넌트.
 * 캐릭터를 클릭하면 표정과 대사가 전환됩니다.
 */
export function PosMulCharacterCompanion({
  domain = "economy",
  friendId,
  variant = "banner",
  customMessage,
  className = "",
}: PosMulCharacterCompanionProps) {
  const friend = friendId ? getFriendById(friendId) : getFriendByDomain(domain);
  const [step, setStep] = useState<number>(0);

  const tips = customMessage ? [customMessage, ...friend.domainTips] : friend.domainTips;
  const activeTip = tips[step % tips.length] ?? friend.catchphrase;

  // step 0은 기본 front, 1~4는 expressions 순환
  const activeExpr = step === 0 ? null : friend.expressions[(step - 1) % friend.expressions.length];
  const avatarSrc = activeExpr ? activeExpr.image : friend.views.front;

  function handleCycleReaction() {
    setStep((prev) => prev + 1);
  }

  if (variant === "compact") {
    return (
      <div
        className={`flex items-center justify-between gap-3 rounded-xl border bg-[#090b12]/65 px-3 py-2 backdrop-blur-md ${className}`}
        style={{ borderColor: `${friend.accentHex}38` }}
      >
        <button
          type="button"
          onClick={handleCycleReaction}
          title="클릭하면 표정과 한마디가 바뀌어요!"
          className="group flex min-w-0 flex-1 items-center gap-2.5 text-left"
        >
          <div
            className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full border bg-white/95 p-0.5 shadow-sm transition-transform duration-200 group-hover:scale-110"
            style={{ borderColor: friend.accentHex }}
          >
            <img
              src={avatarSrc}
              alt={`${friend.nameKo} (${friend.species})`}
              className="h-full w-full object-contain"
            />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs font-extrabold text-white">{friend.nameKo}</span>
              <span
                className={`rounded-full border px-1.5 py-0.2 text-[10px] font-bold ${friend.badgeClass}`}
              >
                {activeExpr ? activeExpr.label : friend.species}
              </span>
              <span className="hidden text-[10px] text-slate-500 sm:inline">
                (터치해 대화하기)
              </span>
            </div>
            <p className="mt-0.5 truncate text-xs text-slate-300">{activeTip}</p>
          </div>
        </button>

        <div className="flex shrink-0 items-center gap-1.5">
          <button
            type="button"
            onClick={handleCycleReaction}
            aria-label="다른 한마디 보기"
            className="rounded-lg border border-white/10 bg-white/5 p-1.5 text-slate-300 transition hover:bg-white/10 hover:text-white"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
          <Link
            href={`/characters?focus=${friend.id}`}
            className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-[11px] font-bold text-slate-200 transition hover:bg-white/15 hover:text-white"
          >
            <span>도감</span>
            <ArrowUpRight className="h-3 w-3" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border bg-gradient-to-r p-4 shadow-xl backdrop-blur-xl ${friend.surfaceClass} ${className}`}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3.5 min-w-0">
          <button
            type="button"
            onClick={handleCycleReaction}
            title="클릭해 표정 바꾸기"
            className="group relative h-16 w-16 shrink-0 rounded-2xl border bg-white/95 p-1 shadow-md transition-transform duration-200 hover:-translate-y-0.5 hover:scale-105 active:scale-95"
            style={{ borderColor: `${friend.accentHex}88` }}
          >
            <img
              src={avatarSrc}
              alt={`${friend.nameKo} (${friend.species})`}
              className="h-full w-full object-contain"
            />
            <span
              className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border border-slate-900 bg-slate-950 text-[10px] text-white shadow"
              aria-hidden="true"
            >
              💬
            </span>
          </button>

          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-black text-white">
                {friend.nameKo}
              </span>
              <span className="text-[11px] font-semibold text-slate-400">
                {friend.nameEn}
              </span>
              <span
                className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold ${friend.badgeClass}`}
              >
                <Sparkles className="h-2.5 w-2.5" />
                {activeExpr ? activeExpr.label : friend.roleTitle}
              </span>
            </div>
            <p className="text-xs sm:text-sm leading-relaxed text-slate-200">
              “{activeTip}”
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2 self-end sm:self-center">
          <div className="hidden md:flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/90 p-1" title={friend.signaturePropName}>
            <img
              src={friend.propImage}
              alt={friend.signaturePropName}
              className="h-full w-full object-contain"
            />
          </div>
          <button
            type="button"
            onClick={handleCycleReaction}
            className="inline-flex items-center gap-1 rounded-xl border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-bold text-slate-100 transition hover:bg-white/20"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>표정·팁</span>
          </button>
          <Link
            href={`/characters?focus=${friend.id}`}
            className={`inline-flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-black shadow transition ${friend.buttonClass}`}
          >
            <span>프렌즈 도감</span>
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
