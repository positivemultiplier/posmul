"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Sparkles,
  Zap,
  Clock,
  Lock,
  Globe,
  Share2,
  Copy,
  Check,
  Send,
  Flame,
  Award,
} from "lucide-react";
import { CHALLENGE_PRESETS, ChallengePreset } from "../types";
import { createChallengeAction } from "../actions/challenge.actions";

export default function CreateChallengePage() {
  const router = useRouter();

  // 폼 상태
  const [selectedPresetId, setSelectedPresetId] = useState<string>("coffee");
  const [title, setTitle] = useState(CHALLENGE_PRESETS[0].title);
  const [category, setCategory] = useState<any>(CHALLENGE_PRESETS[0].category);
  const [options, setOptions] = useState<string[]>(CHALLENGE_PRESETS[0].options);
  const [durationHours, setDurationHours] = useState<number>(CHALLENGE_PRESETS[0].defaultDurationHours);
  const [hostOptionIndex, setHostOptionIndex] = useState<number>(0);
  const [hostBetAmount, setHostBetAmount] = useState<number>(300);
  const [visibility, setVisibility] = useState<"PRIVATE" | "PUBLIC">("PRIVATE");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdChallengeId, setCreatedChallengeId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // 프리셋 선택 핸들러
  const handleSelectPreset = (preset: ChallengePreset) => {
    setSelectedPresetId(preset.id);
    setTitle(preset.title);
    setCategory(preset.category);
    setOptions([...preset.options]);
    setDurationHours(preset.defaultDurationHours);
    setHostOptionIndex(0);
  };

  // 선택지 변경
  const handleOptionChange = (idx: number, val: string) => {
    const updated = [...options];
    updated[idx] = val;
    setOptions(updated);
  };

  // 선택지 추가
  const handleAddOption = () => {
    if (options.length < 4) {
      setOptions([...options, `선택지 ${options.length + 1}`]);
    }
  };

  // 챌린지 생성 제출
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert("질문을 입력해주세요!");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await createChallengeAction({
        title,
        options,
        category,
        visibility,
        durationHours,
        hostOptionIndex,
        hostBetAmount,
      });

      if (res.success && res.challengeId) {
        setCreatedChallengeId(res.challengeId);
      } else if ((res as any).requireLogin) {
        if (confirm("내기 룸을 개설하려면 로그인이 필요합니다. 로그인 페이지로 이동할까요?")) {
          router.push(`/auth/login?redirectTo=/challenge/create`);
        }
      } else {
        alert(res.error || "챌린지 생성에 실패했습니다.");
      }
    } catch (err: any) {
      alert(err?.message || "오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 링크 복사
  const handleCopyLink = () => {
    if (!createdChallengeId) return;
    const url = `${window.location.origin}/challenge/${createdChallengeId}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // 트위터(X) 공유
  const handleShareTwitter = () => {
    if (!createdChallengeId) return;
    const url = `${window.location.origin}/challenge/${createdChallengeId}`;
    const hostChoice = options[hostOptionIndex] || "내 선택";
    const tweetText = `🥊 [PosMul 맞짱 챌린지]\n"${title}"\n\n나는 [${hostChoice}]에 ${hostBetAmount} PMP 걸었다! 반대하는 사람 들어와라 ㅋㅋㅋ\n👉 ${url}`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`, "_blank");
  };

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 py-6 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* 상단 네비게이션 헤더 */}
        <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
          <Link
            href="/challenge"
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>챌린지 로비로</span>
          </Link>
          <div className="flex items-center gap-1 text-xs text-amber-400 font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>개설비: 100 PMP 소모</span>
          </div>
        </div>

        {/* 타이틀 배너 */}
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[11px] font-black">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>30초 초간편 모바일 내기</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            친구와 맞짱 내기 만들기 🥊
          </h1>
          <p className="text-xs text-slate-400">
            친구 단톡방에 링크를 던져 내기를 걸어보세요. 이기면 친구들의 PMP를 뺏어옵니다!
          </p>
        </div>

        {/* 1. 6대 일상 프리셋 템플릿 선택 바 */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-300">
            ⚡ 빠른 프리셋 템플릿 선택 (탭하면 자동 작성!)
          </label>
          <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
            {CHALLENGE_PRESETS.map((preset) => {
              const isSelected = selectedPresetId === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleSelectPreset(preset)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold shrink-0 transition-all border ${
                    isSelected
                      ? "bg-amber-500 text-slate-950 border-amber-400 shadow-md font-extrabold scale-[1.02]"
                      : "bg-[#111520] text-slate-400 border-white/[0.08] hover:text-white hover:bg-slate-800"
                  }`}
                >
                  <span>{preset.icon}</span>
                  <span>{preset.categoryLabel}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. 폼 입력창 */}
        <form onSubmit={handleSubmit} className="space-y-5 bg-[#111520] border border-white/[0.08] p-5 sm:p-6 rounded-3xl shadow-xl">
          {/* 질문 제목 */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
              <span>내기 질문</span>
              <span className="text-[10px] text-slate-500 font-normal">명확한 승패 기준</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="예: 오늘 북런던 더비 손흥민 골 넣을까?"
              required
              className="w-full bg-[#0c0f17] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-400 font-medium"
            />
          </div>

          {/* 선택지 목록 (2~4개) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-300">
                선택지 설정 (내가 걸 항목을 선택하세요)
              </label>
              {options.length < 4 && (
                <button
                  type="button"
                  onClick={handleAddOption}
                  className="text-[11px] text-sky-400 hover:underline font-bold"
                >
                  + 선택지 추가 (최대 4개)
                </button>
              )}
            </div>

            <div className="space-y-2">
              {options.map((opt, idx) => {
                const isHostPick = hostOptionIndex === idx;
                return (
                  <div key={idx} className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setHostOptionIndex(idx)}
                      className={`px-3 py-2.5 rounded-xl text-xs font-black shrink-0 border transition ${
                        isHostPick
                          ? "bg-red-500 text-white border-red-400 shadow-md"
                          : "bg-slate-900 text-slate-400 border-white/[0.06] hover:text-white"
                      }`}
                    >
                      {isHostPick ? "내 픽 🎯" : `선택 ${idx + 1}`}
                    </button>
                    <input
                      type="text"
                      value={opt}
                      onChange={(e) => handleOptionChange(idx, e.target.value)}
                      placeholder={`선택지 ${idx + 1}`}
                      required
                      className="flex-1 bg-[#0c0f17] border border-white/[0.08] rounded-xl px-3 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-400"
                    />
                  </div>
                );
              })}
            </div>
            <p className="text-[11px] text-slate-500">
              * 붉은색 [내 픽 🎯]으로 지정된 선택지에 방장의 초기 베팅이 걸립니다.
            </p>
          </div>

          {/* 내 베팅 PMP 설정 */}
          <div className="space-y-2 pt-2 border-t border-white/[0.06]">
            <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
              <span>내 베팅 판돈 (PMP)</span>
              <span className="text-amber-400 text-xs font-black">{hostBetAmount.toLocaleString()} PMP</span>
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[100, 300, 500, 1000].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setHostBetAmount(amt)}
                  className={`py-2 rounded-xl text-xs font-mono font-bold border transition ${
                    hostBetAmount === amt
                      ? "bg-amber-500 text-slate-950 border-amber-400 font-black shadow-md"
                      : "bg-slate-950/60 text-slate-400 border-slate-800 hover:text-white"
                  }`}
                >
                  +{amt.toLocaleString()}
                </button>
              ))}
            </div>
          </div>

          {/* 마감 시간 설정 (이중 시간) */}
          <div className="space-y-2 pt-2 border-t border-white/[0.06]">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>베팅 마감 시간 (경기/상황 시작 시점)</span>
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { label: "1시간 뒤", hours: 1 },
                { label: "3시간 뒤", hours: 3 },
                { label: "오늘 밤 24시", hours: 6 },
                { label: "내일 이맘때", hours: 24 },
              ].map((d) => (
                <button
                  key={d.hours}
                  type="button"
                  onClick={() => setDurationHours(d.hours)}
                  className={`py-2 rounded-xl text-xs font-bold border transition ${
                    durationHours === d.hours
                      ? "bg-sky-500 text-slate-950 border-sky-400 font-black shadow-md"
                      : "bg-slate-950/60 text-slate-400 border-slate-800 hover:text-white"
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-slate-500">
              * 마감 시간이 도래하면 자동으로 베팅이 잠기며 후행 베팅이 차단됩니다.
            </p>
          </div>

          {/* 공개 범위 토글 (프라이버시 안전) */}
          <div className="space-y-2 pt-2 border-t border-white/[0.06]">
            <label className="text-xs font-bold text-slate-300">공개 범위 설정</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setVisibility("PRIVATE")}
                className={`p-3 rounded-2xl text-left border transition flex items-start gap-2.5 ${
                  visibility === "PRIVATE"
                    ? "bg-slate-900 border-amber-400/80 shadow-md"
                    : "bg-slate-950/50 border-white/[0.06] text-slate-500"
                }`}
              >
                <Lock className={`w-4 h-4 shrink-0 mt-0.5 ${visibility === "PRIVATE" ? "text-amber-400" : "text-slate-500"}`} />
                <div className="space-y-0.5">
                  <div className={`text-xs font-bold ${visibility === "PRIVATE" ? "text-white" : "text-slate-400"}`}>
                    🔒 완전 비공개 (프라이빗)
                  </div>
                  <div className="text-[10px] text-slate-500">
                    링크를 가진 친구들끼리만 내기. 메인 노출 안 됨!
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setVisibility("PUBLIC")}
                className={`p-3 rounded-2xl text-left border transition flex items-start gap-2.5 ${
                  visibility === "PUBLIC"
                    ? "bg-slate-900 border-sky-400/80 shadow-md"
                    : "bg-slate-950/50 border-white/[0.06] text-slate-500"
                }`}
              >
                <Globe className={`w-4 h-4 shrink-0 mt-0.5 ${visibility === "PUBLIC" ? "text-sky-400" : "text-slate-500"}`} />
                <div className="space-y-0.5">
                  <div className={`text-xs font-bold ${visibility === "PUBLIC" ? "text-white" : "text-slate-400"}`}>
                    🌐 오픈 챌린지 (퍼블릭)
                  </div>
                  <div className="text-[10px] text-slate-500">
                    10명 이상 모이면 메인 승격 + 호스트 수수료 3% 획득!
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* 생성 제출 버튼 */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 hover:from-amber-400 hover:to-red-400 text-slate-950 font-black text-sm shadow-xl shadow-amber-500/20 active:scale-[0.99] transition-all flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <span>내기 룸 개설 중...</span>
            ) : (
              <>
                <Flame className="w-4 h-4" />
                <span>내기 룸 만들고 카톡/트위터로 쏘기 🚀</span>
              </>
            )}
          </button>
        </form>

        {/* 🌟 3. 개설 완료 팝업 모달 */}
        {createdChallengeId && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[#111520] border border-amber-500/40 rounded-3xl p-6 max-w-md w-full space-y-5 shadow-2xl text-center">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center mx-auto text-xl">
                🥊
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-black text-white">
                  맞짱 내기가 개설되었습니다!
                </h3>
                <p className="text-xs text-slate-400">
                  아래 링크를 친구 단톡방이나 트위터에 올려 도전자를 모집하세요!
                </p>
              </div>

              {/* 공유 버튼 그룹 */}
              <div className="space-y-2.5 pt-2">
                <button
                  type="button"
                  onClick={handleShareTwitter}
                  className="w-full py-3 rounded-xl bg-black hover:bg-slate-900 border border-white/20 text-white font-extrabold text-xs flex items-center justify-center gap-2 transition"
                >
                  <span className="font-mono text-sm font-black">𝕏</span>
                  <span>트위터(X)에 대형 포스터 카드로 자랑하기</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center gap-2 transition"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? "초대 링크 복사 완료!" : "카카오톡/단톡방 초대 링크 복사하기"}</span>
                </button>

                <Link
                  href={`/challenge/${createdChallengeId}`}
                  className="block w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-bold transition border border-white/[0.08]"
                >
                  내기 방으로 바로 입장하기 →
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

