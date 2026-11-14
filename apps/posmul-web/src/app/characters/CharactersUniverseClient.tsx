"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  RotateCw,
  FlipHorizontal2,
  Sparkles,
  ArrowUpRight,
  Layers,
  X,
  MessageCircleHeart,
} from "lucide-react";
import {
  POSMUL_FRIENDS,
  getFriendById,
  type PosMulCharacterViewKey,
  type PosMulFriendId,
} from "@/shared/characters/posmul-friends";

const VIEW_TABS: ReadonlyArray<{ key: PosMulCharacterViewKey; label: string; shortLabel: string }> = [
  { key: "front", label: "정면 (FRONT)", shortLabel: "FRONT" },
  { key: "three-quarter", label: "45° 반측면 (3/4)", shortLabel: "3/4" },
  { key: "side", label: "측면 (SIDE)", shortLabel: "SIDE" },
  { key: "back", label: "후면 (BACK)", shortLabel: "BACK" },
];

export function CharactersUniverseClient() {
  const searchParams = useSearchParams();
  const focusParam = searchParams.get("focus");

  const [selectedId, setSelectedId] = useState<PosMulFriendId>(() =>
    getFriendById(focusParam).id
  );
  const [viewKey, setViewKey] = useState<PosMulCharacterViewKey>("front");
  const [flipped, setFlipped] = useState<boolean>(false);
  const [activeExprIdx, setActiveExprIdx] = useState<number | null>(null);
  const [showRawSheetModal, setShowRawSheetModal] = useState<boolean>(false);

  useEffect(() => {
    if (focusParam) {
      setSelectedId(getFriendById(focusParam).id);
      setActiveExprIdx(null);
      setViewKey("front");
    }
  }, [focusParam]);

  const friend = getFriendById(selectedId);
  const activeExpr =
    activeExprIdx !== null ? friend.expressions[activeExprIdx] ?? null : null;

  function handleSelectFriend(id: PosMulFriendId) {
    setSelectedId(id);
    setActiveExprIdx(null);
    setViewKey("front");
    setFlipped(false);
  }

  function handleRotateStep() {
    setActiveExprIdx(null);
    const currentIdx = VIEW_TABS.findIndex((t) => t.key === viewKey);
    const nextIdx = (currentIdx + 1) % VIEW_TABS.length;
    setViewKey(VIEW_TABS[nextIdx].key);
  }

  const stageImageSrc = activeExpr ? activeExpr.image : friend.views[viewKey];

  return (
    <div className="min-h-screen bg-[#080a11] text-slate-100 pb-16">
      {/* 상단 세계관 프롤로그 */}
      <div className="relative overflow-hidden border-b border-white/[0.07] bg-gradient-to-b from-indigo-950/40 via-[#0b0f1a] to-[#080a11]">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="space-y-2 max-w-2xl">
              <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/35 bg-amber-500/15 px-3 py-1 text-[11px] font-black text-amber-300">
                <Sparkles className="h-3.5 w-3.5" />
                <span>POSMUL UNIVERSE · 포스멀 타운 공식 도감</span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white">
                포스멀 프렌즈 (PosMul Friends)
              </h1>
              <p className="text-xs sm:text-sm leading-relaxed text-slate-300">
                현실 세계에서 사람들이 보낸 작은 <strong className="text-amber-300">긍정적 선택의 파동(Positive Multiplier)</strong>이
                모여 탄생한 7명의 친구들이에요. PMP 햇살 에너지로 움직이고, 매시 정각 황금 모래시계{" "}
                <strong className="text-sky-300">MoneyWave</strong>를 거쳐, 현실을 바꾸는{" "}
                <strong className="text-rose-300">PMC 나눔</strong>과 따뜻한{" "}
                <strong className="text-violet-300">힐링룸</strong>으로 이어집니다.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Link
                href="/healing-room"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-xl border border-violet-400/40 bg-violet-600/25 px-4 py-2 text-xs font-extrabold text-violet-200 transition hover:bg-violet-600/40"
              >
                <span>🏡 힐링룸에서 미니미로 만나기</span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>

          {/* 7인 캐릭터 선택 독 */}
          <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
            {POSMUL_FRIENDS.map((item) => {
              const isSelected = item.id === friend.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelectFriend(item.id)}
                  className={`group flex flex-col items-center gap-1.5 rounded-2xl border p-2.5 text-center transition-all ${
                    isSelected
                      ? "bg-white/10 shadow-lg scale-[1.02]"
                      : "border-white/[0.07] bg-slate-900/60 hover:bg-white/[0.06]"
                  }`}
                  style={
                    isSelected
                      ? { borderColor: item.accentHex, boxShadow: `0 8px 24px -8px ${item.accentHex}55` }
                      : undefined
                  }
                >
                  <div className="h-14 w-14 overflow-hidden rounded-xl bg-white/95 p-1 transition-transform group-hover:scale-105">
                    <img
                      src={item.views.front}
                      alt={item.nameKo}
                      className="h-full w-full object-contain"
                    />
                  </div>
                  <div>
                    <div className="text-xs font-black text-white">{item.nameKo}</div>
                    <div className="text-[10px] font-medium text-slate-400 line-clamp-1">
                      {item.domainKey.toUpperCase()}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 메인 캐릭터 쇼케이스 (좌: 멀티뷰 턴어라운드 스테이지 / 우: 세계관 & 표정 스티커) */}
      <div className="mx-auto mt-8 max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* 좌측: 360° 턴어라운드 스테이지 */}
          <div className="lg:col-span-5 flex flex-col rounded-3xl border border-white/10 bg-[#0e1320] p-5 shadow-2xl">
            <div className="flex items-center justify-between gap-2">
              <span
                className={`rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${friend.badgeClass}`}
              >
                #{String(friend.order).padStart(2, "0")} · {friend.domainLabel}
              </span>
              <button
                type="button"
                onClick={() => setShowRawSheetModal(true)}
                className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-bold text-slate-300 hover:bg-white/10 hover:text-white"
              >
                <Layers className="h-3.5 w-3.5" />
                <span>원화 시트 보기</span>
              </button>
            </div>

            {/* 턴어라운드 디스플레이 캔버스 */}
            <div className="relative mt-4 flex aspect-square w-full flex-col items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-slate-100 via-white to-slate-100 p-6 shadow-inner">
              {/* 말풍선 */}
              <div className="absolute top-3 left-3 right-3 z-10 flex justify-center">
                <div className="rounded-xl border border-slate-200 bg-white/95 px-3 py-1.5 text-center text-xs font-bold text-slate-800 shadow-sm">
                  “{activeExpr ? activeExpr.caption : friend.catchphrase}”
                </div>
              </div>

              {/* 바닥 그림자 */}
              <div className="absolute bottom-9 h-6 w-40 rounded-full bg-slate-900/12 blur-[2px]" />

              <img
                src={stageImageSrc}
                alt={`${friend.nameKo} ${activeExpr ? activeExpr.label : viewKey}`}
                className={`relative z-0 mt-6 h-64 w-64 object-contain transition-all duration-300 ${
                  flipped ? "-scale-x-100" : ""
                }`}
              />

              <div className="absolute bottom-2.5 right-3 rounded-md bg-slate-900/80 px-2 py-0.5 text-[10px] font-bold text-white">
                {activeExpr
                  ? `스티커 · ${activeExpr.label}`
                  : `멀티뷰 · ${VIEW_TABS.find((t) => t.key === viewKey)?.label ?? "FRONT"}`}
              </div>
            </div>

            {/* 4방향 턴어라운드 & 회전/반전 컨트롤 */}
            <div className="mt-4 space-y-2.5">
              <div className="grid grid-cols-4 gap-1.5">
                {VIEW_TABS.map((tab) => {
                  const active = !activeExpr && viewKey === tab.key;
                  return (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() => {
                        setActiveExprIdx(null);
                        setViewKey(tab.key);
                      }}
                      className={`rounded-xl border py-2 text-xs font-extrabold transition ${
                        active
                          ? "border-white/40 bg-white text-slate-950 shadow"
                          : "border-white/10 bg-white/[0.04] text-slate-300 hover:bg-white/10"
                      }`}
                    >
                      {tab.shortLabel}
                    </button>
                  );
                })}
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleRotateStep}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/5 py-2 text-xs font-bold text-slate-200 hover:bg-white/10"
                >
                  <RotateCw className="h-3.5 w-3.5" />
                  <span>다음 각도로 돌리기</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFlipped((prev) => !prev)}
                  className={`flex items-center justify-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-bold transition ${
                    flipped
                      ? "border-sky-400/60 bg-sky-500/20 text-sky-200"
                      : "border-white/10 bg-white/5 text-slate-200 hover:bg-white/10"
                  }`}
                >
                  <FlipHorizontal2 className="h-3.5 w-3.5" />
                  <span>좌우 반전</span>
                </button>
              </div>
            </div>
          </div>

          {/* 우측: 캐릭터 스토리 · 감정 스티커 팩 · 시그니처 소품 */}
          <div className="lg:col-span-7 space-y-5">
            <div
              className={`rounded-3xl border bg-gradient-to-br p-6 shadow-xl ${friend.surfaceClass}`}
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-bold text-slate-400">
                    {friend.species} · {friend.nameEn}
                  </p>
                  <h2 className="mt-1 text-2xl sm:text-3xl font-black text-white">
                    {friend.nameKo}{" "}
                    <span className="text-base font-bold text-slate-300">
                      — {friend.roleTitle}
                    </span>
                  </h2>
                </div>

                <Link
                  href={friend.domainHref}
                  className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-black shadow-lg transition ${friend.buttonClass}`}
                >
                  <span>{friend.domainLabel} 가기</span>
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              </div>

              <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                    성격 & 반전 매력
                  </h3>
                  <p className="mt-1.5 text-xs sm:text-sm leading-relaxed text-slate-200">
                    {friend.personality}
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                    세계관 스토리
                  </h3>
                  <p className="mt-1.5 text-xs sm:text-sm leading-relaxed text-slate-200">
                    {friend.backstory}
                  </p>
                </div>
              </div>

              {/* 시그니처 소품 */}
              <div className="mt-4 flex items-center gap-4 rounded-2xl border border-white/10 bg-slate-950/70 p-3.5">
                <div className="h-16 w-16 shrink-0 rounded-xl bg-white/95 p-1.5 shadow">
                  <img
                    src={friend.propImage}
                    alt={friend.signaturePropName}
                    className="h-full w-full object-contain"
                  />
                </div>
                <div>
                  <div className="text-[11px] font-bold text-amber-300">
                    ✨ 시그니처 소품
                  </div>
                  <div className="text-sm font-black text-white">
                    {friend.signaturePropName}
                  </div>
                  <p className="mt-0.5 text-xs text-slate-300">
                    {friend.signaturePropDesc}
                  </p>
                </div>
              </div>
            </div>

            {/* 감정 스티커 (이모티콘) 4종 */}
            <div className="rounded-3xl border border-white/10 bg-[#0e1320] p-5 shadow-xl">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <MessageCircleHeart className="h-4 w-4 text-rose-400" />
                  <h3 className="text-sm font-black text-white">
                    {friend.nameKo} 감정 스티커 팩 (힐링룸 방명록 사용 가능)
                  </h3>
                </div>
                <span className="text-[11px] text-slate-400">
                  스티커를 클릭하면 왼쪽 무대에서 크게 볼 수 있어요
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {friend.expressions.map((expr, idx) => {
                  const isPicked = activeExprIdx === idx;
                  return (
                    <button
                      key={expr.id}
                      type="button"
                      onClick={() =>
                        setActiveExprIdx((prev) => (prev === idx ? null : idx))
                      }
                      className={`group flex flex-col items-center rounded-2xl border p-3 text-center transition ${
                        isPicked
                          ? "border-amber-400 bg-amber-500/10"
                          : "border-white/10 bg-white/[0.03] hover:bg-white/[0.08]"
                      }`}
                    >
                      <div className="h-24 w-24 overflow-hidden rounded-xl bg-white/95 p-1.5 transition-transform group-hover:scale-105">
                        <img
                          src={expr.image}
                          alt={expr.label}
                          className="h-full w-full object-contain"
                        />
                      </div>
                      <span className="mt-2 text-xs font-extrabold text-white">
                        {expr.label}
                      </span>
                      <span className="mt-0.5 text-[10px] text-slate-400 line-clamp-2">
                        {expr.caption}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 원화 레퍼런스 시트 모달 */}
      {showRawSheetModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          onClick={() => setShowRawSheetModal(false)}
        >
          <div
            className="relative w-full max-w-4xl rounded-2xl border border-white/15 bg-slate-950 p-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <h4 className="text-sm font-black text-white">
                {friend.nameKo} ({friend.nameEn}) 공식 멀티뷰 레퍼런스 시트
              </h4>
              <button
                type="button"
                onClick={() => setShowRawSheetModal(false)}
                className="rounded-lg bg-white/10 p-1.5 text-slate-300 hover:bg-white/20 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="overflow-hidden rounded-xl bg-white p-2">
              <img
                src={friend.sheetImage}
                alt={`${friend.nameKo} 원화 시트`}
                className="w-full h-auto object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
