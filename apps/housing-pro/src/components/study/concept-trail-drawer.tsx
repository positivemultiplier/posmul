"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  BookOpen,
  ChevronRight,
  Crown,
  Flame,
  GitCompareArrows,
  Lightbulb,
  Loader2,
  Plus,
  ShieldCheck,
  ThumbsUp,
  TrendingUp,
  X,
  Zap,
} from "lucide-react";
import {
  getConceptById,
  getContrastAxisById,
} from "@/data/knowledge-graph-housing";
import type { KnowledgeTrailTarget } from "@/components/study/concept-linked-text";
import {
  createConceptMnemonicAction,
  fetchConceptMnemonicsAction,
  toggleMnemonicVoteAction,
  type ConceptMnemonicItem,
  type MnemonicType,
} from "@/app/actions/concept-graph.actions";
import {
  searchStudyOptionsByKeywordsAction,
  type KeywordMatchedOption,
} from "@/app/actions/exam-study.actions";
import { useStudyAuth } from "@/components/auth/study-auth-provider";

interface ConceptTrailDrawerProps {
  initialTarget: KnowledgeTrailTarget | null;
  onClose: () => void;
}

const MNEMONIC_TYPE_LABELS: Record<MnemonicType, { label: string; badge: string }> = {
  ACRONYM: { label: "두문자", badge: "bg-[#FF5A36]/20 text-[#FF8A70] border-[#FF5A36]/40" },
  COMPARE: { label: "비교", badge: "bg-sky-500/20 text-sky-300 border-sky-500/40" },
  STORY: { label: "스토리", badge: "bg-violet-500/20 text-violet-300 border-violet-500/40" },
  TIP: { label: "실전팁", badge: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40" },
};

/**
 * 모바일 440px 전용 「꼬리에 꼬리를 무는 지식 그래프 드릴다운 드로어」
 * - 브레드크럼 스택으로 개념 ↔ 대조 축 ↔ 연관 기출을 무한 탐색 후 1탭 복귀
 * - 개념별 역대 출제 횟수·회차 통계 + 집단지성 암기법 등록 & 인기투표(Supabase 실연동)
 */
export function ConceptTrailDrawer({ initialTarget, onClose }: ConceptTrailDrawerProps) {
  const { isLoggedIn } = useStudyAuth();
  const [trail, setTrail] = useState<KnowledgeTrailTarget[]>([]);

  // 집단지성 암기법 상태
  const [mnemonics, setMnemonics] = useState<ConceptMnemonicItem[]>([]);
  const [loadingMnemonics, setLoadingMnemonics] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newMnemonicType, setNewMnemonicType] = useState<MnemonicType>("ACRONYM");
  const [newShortHook, setNewShortHook] = useState("");
  const [newDetailNote, setNewDetailNote] = useState("");
  const [submittingMnemonic, setSubmittingMnemonic] = useState(false);
  const [mnemonicFeedback, setMnemonicFeedback] = useState<string | null>(null);

  // 연관 실제 DB 기출 선지 상태
  const [relatedOptions, setRelatedOptions] = useState<KeywordMatchedOption[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [miniOxPicks, setMiniOxPicks] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (initialTarget) {
      setTrail([initialTarget]);
    } else {
      setTrail([]);
    }
  }, [initialTarget]);

  const current = trail[trail.length - 1] ?? null;
  const activeConcept =
    current?.kind === "concept" ? getConceptById(current.conceptId) : null;
  const activeAxis = current?.kind === "axis" ? getContrastAxisById(current.axisId) : null;

  // 현재 개념 변경 시: 집단지성 암기법 + 실제 DB 기출 선지 병렬 로드
  useEffect(() => {
    if (!activeConcept) {
      setMnemonics([]);
      setRelatedOptions([]);
      return;
    }

    let cancelled = false;
    setShowAddForm(false);
    setMnemonicFeedback(null);
    setMiniOxPicks({});

    setLoadingMnemonics(true);
    void fetchConceptMnemonicsAction(activeConcept.id).then((res) => {
      if (cancelled) return;
      if (res.success) setMnemonics(res.items);
      setLoadingMnemonics(false);
    });

    setLoadingOptions(true);
    void searchStudyOptionsByKeywordsAction(
      activeConcept.dbSearchKeyword,
      activeConcept.subject
    ).then((res) => {
      if (cancelled) return;
      if (res.success) setRelatedOptions(res.options.slice(0, 5));
      else setRelatedOptions([]);
      setLoadingOptions(false);
    });

    return () => {
      cancelled = true;
    };
  }, [activeConcept]);

  if (!initialTarget || !current) return null;

  const pushTarget = (next: KnowledgeTrailTarget) => {
    setTrail((prev) => [...prev, next]);
  };

  const popToIndex = (idx: number) => {
    setTrail((prev) => prev.slice(0, idx + 1));
  };

  const handleVote = async (mnemonicId: string) => {
    if (!isLoggedIn) {
      setMnemonicFeedback("로그인하면 베스트 암기법에 투표할 수 있습니다.");
      return;
    }
    const res = await toggleMnemonicVoteAction(mnemonicId);
    if (res.success && typeof res.upvoteCount === "number") {
      setMnemonics((prev) =>
        prev
          .map((item) =>
            item.id === mnemonicId
              ? {
                  ...item,
                  hasVoted: Boolean(res.voted),
                  upvoteCount: res.upvoteCount!,
                }
              : item
          )
          .sort((a, b) => b.upvoteCount - a.upvoteCount)
      );
      setMnemonicFeedback(null);
    } else if (res.error) {
      setMnemonicFeedback(res.error);
    }
  };

  const handleSubmitMnemonic = async () => {
    if (!activeConcept || !newShortHook.trim()) return;
    if (!isLoggedIn) {
      setMnemonicFeedback("로그인하면 나만의 암기법을 등록해 공유할 수 있습니다.");
      return;
    }
    setSubmittingMnemonic(true);
    setMnemonicFeedback(null);
    const res = await createConceptMnemonicAction({
      conceptId: activeConcept.id,
      mnemonicType: newMnemonicType,
      shortHook: newShortHook.trim(),
      detailNote: newDetailNote.trim() || undefined,
    });
    setSubmittingMnemonic(false);

    if (res.success && res.item) {
      setMnemonics((prev) =>
        [res.item!, ...prev].sort((a, b) => b.upvoteCount - a.upvoteCount)
      );
      setNewShortHook("");
      setNewDetailNote("");
      setShowAddForm(false);
      setMnemonicFeedback("내 암기법이 등록되었습니다! 추천이 쌓이면 BEST로 올라갑니다.");
    } else {
      setMnemonicFeedback(res.error || "암기법 등록에 실패했습니다.");
    }
  };

  const getTrailLabel = (item: KnowledgeTrailTarget): string => {
    if (item.kind === "axis") {
      return item.triggerWord ? `${item.triggerWord}` : "대조 비교";
    }
    return getConceptById(item.conceptId)?.title || item.conceptId;
  };

  return (
    <div
      className="fixed inset-0 z-[85] bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-3"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[460px] max-h-[90vh] flex flex-col rounded-t-3xl sm:rounded-3xl bg-[#11121A] border border-white/[0.12] shadow-2xl overflow-hidden pb-safe"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 네이티브 바텀시트 드래그 핸들 */}
        <div className="pt-2.5 pb-1 bg-[#171824] flex justify-center sm:hidden shrink-0">
          <div className="w-10 h-1 rounded-full bg-white/20" />
        </div>

        {/* 상단 브레드크럼 트레일 헤더 (꼬리물기 경로 + 1탭 문제 복귀) */}
        <div className="px-4 py-3 bg-[#171824] border-b border-white/[0.08] space-y-2 shrink-0">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              {trail.length > 1 && (
                <button
                  type="button"
                  onClick={() => popToIndex(trail.length - 2)}
                  className="w-8 h-8 rounded-xl bg-white/[0.08] hover:bg-white/[0.16] text-slate-100 flex items-center justify-center shrink-0"
                  title="이전 개념으로"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
              )}
              <span className="text-xs font-black text-sky-300 flex items-center gap-1.5 truncate">
                <GitCompareArrows className="w-4 h-4 text-[#FF7A59] shrink-0" />
                <span>기출 한정 지식 그래프</span>
              </span>
              <span className="px-2 py-0.5 rounded-md bg-white/[0.08] text-[11px] font-mono text-slate-300 shrink-0">
                깊이 {trail.length}
              </span>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-xl bg-white/[0.09] hover:bg-[#FF5A36] text-xs font-black text-white flex items-center gap-1 transition shrink-0"
            >
              <span>문제로 복귀</span>
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* 꼬리물기 브레드크럼 경로 */}
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar text-xs font-bold">
            {trail.map((step, idx) => {
              const isLast = idx === trail.length - 1;
              return (
                <div key={idx} className="flex items-center gap-1 shrink-0">
                  {idx > 0 && <ChevronRight className="w-3.5 h-3.5 text-slate-600" />}
                  <button
                    type="button"
                    onClick={() => popToIndex(idx)}
                    className={`px-2.5 py-1 rounded-lg transition ${
                      isLast
                        ? "bg-[#FF5A36]/20 text-[#FF8A70] border border-[#FF5A36]/40 font-black"
                        : "bg-white/[0.05] text-slate-300 hover:text-white"
                    }`}
                  >
                    {getTrailLabel(step)}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* 본문 스크롤 영역 */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* ========================================================== */}
          {/* VIEW A: ⚡ 대조 축 비교 카드 ("동일한" ↔ "이경")            */}
          {/* ========================================================== */}
          {activeAxis && (
            <div className="space-y-3.5">
              <div className="p-3.5 rounded-2xl bg-gradient-to-br from-[#231817] to-[#15151E] border border-[#FF5A36]/40 space-y-1.5">
                <div className="text-[10px] font-black text-[#FF8A70] flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5" />
                  <span>대조 개념 비교 축 (클릭해서 꼬리물기!)</span>
                </div>
                <h3 className="text-sm font-black text-white">{activeAxis.title}</h3>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  {activeAxis.subtitle}
                </p>
              </div>

              {/* 좌 vs 우 대조 카드 */}
              <div className="grid grid-cols-1 gap-2.5">
                {[
                  {
                    side: activeAxis.leftSide,
                    accent: "border-sky-500/35 bg-sky-950/20",
                    titleColor: "text-sky-300",
                    chipClass:
                      "bg-sky-500/15 hover:bg-sky-500/30 border-sky-400/40 text-sky-100",
                  },
                  {
                    side: activeAxis.rightSide,
                    accent: "border-[#FF5A36]/40 bg-[#FF5A36]/[0.07]",
                    titleColor: "text-[#FF8A70]",
                    chipClass:
                      "bg-[#FF5A36]/15 hover:bg-[#FF5A36]/30 border-[#FF5A36]/45 text-orange-100",
                  },
                ].map((block, bIdx) => (
                  <div
                    key={bIdx}
                    className={`p-3.5 rounded-2xl border space-y-2.5 ${block.accent}`}
                  >
                    <div>
                      <div className={`text-xs font-black ${block.titleColor}`}>
                        {block.side.label}
                      </div>
                      <p className="text-[10.5px] text-slate-400 mt-0.5">
                        {block.side.description}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {block.side.conceptIds.map((cid) => {
                        const c = getConceptById(cid);
                        if (!c) return null;
                        return (
                          <button
                            key={cid}
                            type="button"
                            onClick={() => pushTarget({ kind: "concept", conceptId: cid })}
                            className={`px-2.5 py-1.5 rounded-xl border text-[11px] font-black flex items-center gap-1.5 transition ${block.chipClass}`}
                          >
                            <span>{c.title}</span>
                            <span className="text-[9.5px] font-mono opacity-80">
                              {c.examCount}회
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-3 rounded-2xl bg-amber-950/30 border border-amber-500/35 text-[11px] text-amber-200 font-bold leading-relaxed flex items-start gap-2">
                <Lightbulb className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>{activeAxis.examTip}</span>
              </div>
            </div>
          )}

          {/* ========================================================== */}
          {/* VIEW B: 🧠 단일 개념 노드 + 출제통계 + 꼬리물기 + 암기법    */}
          {/* ========================================================== */}
          {activeConcept && (
            <div className="space-y-4">
              {/* 1. 개념 헤더 & 기출 출제 통계 배지 */}
              <section className="p-4 rounded-2xl bg-gradient-to-br from-[#1A1C28] to-[#13131B] border border-sky-500/35 space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap text-[10px] font-bold text-slate-400">
                      <span
                        className={`px-1.5 py-0.5 rounded font-black text-[9px] ${
                          activeConcept.examStage === "2차"
                            ? "bg-[#FF5A36]/20 text-[#FF8A70] border border-[#FF5A36]/35"
                            : "bg-sky-500/20 text-sky-300 border border-sky-400/35"
                        }`}
                      >
                        {activeConcept.examStage}
                      </span>
                      <span>
                        {activeConcept.subject} · {activeConcept.category}
                      </span>
                    </div>
                    <h3 className="text-base font-black text-white mt-1 flex items-baseline gap-1.5 flex-wrap">
                      <span>{activeConcept.title}</span>
                      {activeConcept.englishTitle && (
                        <span className="text-[11px] font-mono font-bold text-slate-400">
                          {activeConcept.englishTitle}
                        </span>
                      )}
                    </h3>
                    {activeConcept.lawRef && (
                      <div className="mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/[0.05] border border-white/[0.08] text-[9.5px] font-bold text-slate-300">
                        <BookOpen className="w-2.5 h-2.5 text-sky-400 shrink-0" />
                        <span>{activeConcept.lawRef}</span>
                      </div>
                    )}
                  </div>

                  <span className="px-2.5 py-1 rounded-full bg-[#FF5A36]/20 border border-[#FF5A36]/45 text-[#FF8A70] text-[10.5px] font-mono font-black flex items-center gap-1 shrink-0">
                    <Flame className="w-3 h-3 fill-current" />
                    <span>{activeConcept.examCount}문항</span>
                  </span>
                </div>

                {/* 출제 회차 히스토리 바 (실제 DB 기출 집계) */}
                <div className="flex items-center justify-between gap-2 text-[10px] pt-1.5 border-t border-white/[0.07]">
                  <div className="flex items-center gap-1 flex-wrap">
                    <span className="text-slate-400 font-bold">DB 기출 연도:</span>
                    {activeConcept.examYears.length > 0 ? (
                      activeConcept.examYears.map((yr) => (
                        <span
                          key={yr}
                          className="px-1.5 py-0.2 rounded bg-white/[0.06] font-mono text-slate-200 font-bold"
                        >
                          &apos;{String(yr).slice(-2)}
                        </span>
                      ))
                    ) : (
                      <span className="text-slate-500">집계 준비중</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {activeConcept.recent3YCount > 0 && (
                      <span className="px-1.5 py-0.5 rounded bg-sky-500/15 text-sky-300 font-mono text-[9.5px] font-bold">
                        최근3년 {activeConcept.recent3YCount}건
                      </span>
                    )}
                    {activeConcept.recentTrend === "UP" && (
                      <span className="text-emerald-300 font-black flex items-center gap-0.5">
                        <TrendingUp className="w-3 h-3" />
                        <span>상승</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Obsidian Vault 네임스페이스 경로 배지 */}
                {activeConcept.vaultPath && (
                  <div className="text-[9.5px] font-mono text-slate-500 truncate">
                    Vault: {activeConcept.vaultPath}
                  </div>
                )}

                {/* 3줄 핵심 특징 (고가독성 14px) */}
                <ul className="space-y-2 pt-1.5 text-[13.5px] text-slate-100 leading-[1.6]">
                  {activeConcept.summaryBullets.map((b, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-sky-400 font-black shrink-0 mt-0.5">•</span>
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>

                {/* 함정 주의 */}
                <div className="p-3 rounded-xl bg-rose-950/35 border border-rose-500/35 text-[13px] text-rose-100 leading-relaxed flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-rose-300">기출 함정: </strong>
                    {activeConcept.trapWarning}
                  </span>
                </div>

                {/* 현직 소장 실무 팁 (수험→실무 연결!) */}
                {activeConcept.proFieldTip && (
                  <div className="p-3 rounded-xl bg-indigo-950/35 border border-indigo-400/30 text-[12.5px] text-indigo-100 leading-relaxed flex items-start gap-2">
                    <ShieldCheck className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                    <span>
                      <strong className="text-sky-300">소장Pro 실무 연결: </strong>
                      {activeConcept.proFieldTip}
                    </span>
                  </div>
                )}
              </section>

              {/* 2. 꼬리물기 링크 (⚡ 정반대 대조 개념 & 🔗 같은 그룹 개념) */}
              <section className="p-3.5 rounded-2xl bg-[#161620] border border-white/[0.08] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-white flex items-center gap-1.5">
                    <GitCompareArrows className="w-3.5 h-3.5 text-[#FF7A59]" />
                    <span>꼬리에 꼬리를 무는 연관·대조 개념</span>
                  </span>
                  {activeConcept.contrastAxisId && (
                    <button
                      type="button"
                      onClick={() =>
                        pushTarget({
                          kind: "axis",
                          axisId: activeConcept.contrastAxisId!,
                        })
                      }
                      className="text-[10px] font-black text-[#FF8A70] hover:underline"
                    >
                      전체 대조표 →
                    </button>
                  )}
                </div>

                {activeConcept.contrastIds.length > 0 && (
                  <div className="space-y-1.5">
                    <div className="text-[10px] font-black text-[#FF8A70]">
                      반대·대조 개념 (오답 선지 단골!)
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {activeConcept.contrastIds.map((cid) => {
                        const target = getConceptById(cid);
                        if (!target) return null;
                        return (
                          <button
                            key={cid}
                            type="button"
                            onClick={() => pushTarget({ kind: "concept", conceptId: cid })}
                            className="px-2.5 py-1 rounded-xl bg-[#FF5A36]/15 hover:bg-[#FF5A36]/30 border border-[#FF5A36]/40 text-[11px] font-black text-orange-100 flex items-center gap-1 transition"
                          >
                            <span>{target.title}</span>
                            <span className="text-[9px] font-mono opacity-80">
                              {target.examCount}회
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {activeConcept.sameGroupIds.length > 0 && (
                  <div className="space-y-1.5">
                    <div className="text-[10px] font-black text-sky-300">
                      같은 분류 개념 ({activeConcept.contrastSide || activeConcept.category})
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {activeConcept.sameGroupIds.map((cid) => {
                        const target = getConceptById(cid);
                        if (!target) return null;
                        return (
                          <button
                            key={cid}
                            type="button"
                            onClick={() => pushTarget({ kind: "concept", conceptId: cid })}
                            className="px-2.5 py-1 rounded-xl bg-sky-500/15 hover:bg-sky-500/30 border border-sky-400/35 text-[11px] font-bold text-sky-100 flex items-center gap-1 transition"
                          >
                            <span>{target.title}</span>
                            <span className="text-[9px] font-mono opacity-80">
                              {target.examCount}회
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </section>

              {/* 3. 🧠 집단지성 암기법 공유 & 인기투표 */}
              <section className="p-3.5 rounded-2xl bg-[#161620] border border-amber-500/30 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-xs font-black text-white flex items-center gap-1.5">
                    <Crown className="w-4 h-4 text-amber-400" />
                    <span>수험생 암기법 · 인기투표 ({mnemonics.length})</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAddForm((prev) => !prev)}
                    className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40 text-amber-200 text-[10px] font-black flex items-center gap-1 transition"
                  >
                    <Plus className="w-3 h-3" />
                    <span>{showAddForm ? "닫기" : "내 암기법 공유"}</span>
                  </button>
                </div>

                {mnemonicFeedback && (
                  <div className="p-2 rounded-xl bg-amber-950/50 border border-amber-500/35 text-[10.5px] text-amber-200 flex items-center justify-between gap-2">
                    <span>{mnemonicFeedback}</span>
                    {!isLoggedIn && (
                      <Link
                        href="/auth/login"
                        className="px-2 py-0.5 rounded bg-[#FF5A36] text-white font-black shrink-0"
                      >
                        로그인
                      </Link>
                    )}
                  </div>
                )}

                {/* 새 암기법 등록 폼 */}
                {showAddForm && (
                  <div className="p-3 rounded-xl bg-[#0E0E14] border border-white/[0.1] space-y-2">
                    <div className="grid grid-cols-4 gap-1 text-[10px] font-black">
                      {(["ACRONYM", "COMPARE", "STORY", "TIP"] as MnemonicType[]).map(
                        (mt) => (
                          <button
                            key={mt}
                            type="button"
                            onClick={() => setNewMnemonicType(mt)}
                            className={`py-1 rounded-lg border transition ${
                              newMnemonicType === mt
                                ? "bg-amber-500 text-slate-950 border-amber-400"
                                : "bg-[#161620] text-slate-400 border-white/[0.08]"
                            }`}
                          >
                            {MNEMONIC_TYPE_LABELS[mt].label}
                          </button>
                        )
                      )}
                    </div>
                    <input
                      type="text"
                      value={newShortHook}
                      onChange={(e) => setNewShortHook(e.target.value)}
                      placeholder="한 줄 암기법 (예: 동경 직선 = 유·소·플·니!)"
                      maxLength={140}
                      className="w-full px-3 py-2 rounded-xl bg-[#161620] border border-white/[0.1] text-xs font-bold text-white focus:outline-none focus:border-amber-400"
                    />
                    <textarea
                      rows={2}
                      value={newDetailNote}
                      onChange={(e) => setNewDetailNote(e.target.value)}
                      placeholder="추가 설명 (선택)"
                      maxLength={500}
                      className="w-full px-3 py-1.5 rounded-xl bg-[#161620] border border-white/[0.1] text-[11px] text-slate-200 focus:outline-none focus:border-amber-400"
                    />
                    <div className="flex justify-end">
                      <button
                        type="button"
                        disabled={!newShortHook.trim() || submittingMnemonic}
                        onClick={() => void handleSubmitMnemonic()}
                        className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-950 text-[11px] font-black flex items-center gap-1"
                      >
                        {submittingMnemonic && <Loader2 className="w-3 h-3 animate-spin" />}
                        <span>암기법 등록하기</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* 암기법 리스트 (인기순) */}
                {loadingMnemonics ? (
                  <div className="py-4 flex items-center justify-center gap-2 text-xs text-slate-400">
                    <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                    <span>인기 암기법 불러오는 중...</span>
                  </div>
                ) : mnemonics.length === 0 ? (
                  <p className="text-[11px] text-slate-400 text-center py-3">
                    아직 등록된 암기법이 없습니다. 첫 번째 두문자 암기법을 공유해 보세요!
                  </p>
                ) : (
                  <div className="space-y-2">
                    {mnemonics.map((m, idx) => {
                      const typeInfo = MNEMONIC_TYPE_LABELS[m.mnemonicType];
                      return (
                        <div
                          key={m.id}
                          className={`p-3 rounded-xl border space-y-1.5 ${
                            idx === 0
                              ? "bg-amber-950/20 border-amber-400/40"
                              : "bg-[#111118] border-white/[0.06]"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="space-y-1 min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                {idx === 0 && (
                                  <span className="px-1.5 py-0.2 rounded bg-amber-400 text-slate-950 text-[9px] font-black">
                                    BEST
                                  </span>
                                )}
                                <span
                                  className={`px-1.5 py-0.2 rounded border text-[9px] font-black ${typeInfo.badge}`}
                                >
                                  {typeInfo.label}
                                </span>
                                <span className="text-[9.5px] text-slate-400 font-bold">
                                  {m.authorName}
                                </span>
                              </div>
                              <div className="text-xs font-black text-white leading-snug">
                                {m.shortHook}
                              </div>
                              {m.detailNote && (
                                <p className="text-[10.5px] text-slate-300 leading-relaxed">
                                  {m.detailNote}
                                </p>
                              )}
                            </div>

                            <button
                              type="button"
                              onClick={() => void handleVote(m.id)}
                              className={`px-2.5 py-1.5 rounded-xl border text-[10.5px] font-mono font-black flex items-center gap-1 shrink-0 transition ${
                                m.hasVoted
                                  ? "bg-[#FF5A36] border-[#FF5A36] text-white"
                                  : "bg-white/[0.05] hover:bg-white/[0.12] border-white/[0.1] text-slate-200"
                              }`}
                              title="도움이 되었다면 추천 투표"
                            >
                              <ThumbsUp className="w-3 h-3" />
                              <span>{m.upvoteCount}</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>

              {/* 4. 이 개념이 출제된 실제 DB 기출 선지 바로 점검 */}
              <section className="p-3.5 rounded-2xl bg-[#161620] border border-white/[0.08] space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-white flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
                    <span>「{activeConcept.title}」 실제 기출 지문 점검</span>
                  </span>
                  {activeConcept.chapterCode && (
                    <Link
                      href={`/study/ox?chapter=${encodeURIComponent(activeConcept.chapterCode)}`}
                      onClick={onClose}
                      className="text-[10px] font-black text-sky-300 hover:underline"
                    >
                      단원 O/X →
                    </Link>
                  )}
                </div>

                {loadingOptions ? (
                  <div className="py-4 flex items-center justify-center gap-2 text-xs text-slate-400">
                    <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                    <span>DB 기출 선지 매칭 중...</span>
                  </div>
                ) : relatedOptions.length === 0 ? (
                  <p className="text-[11px] text-slate-400 py-2">
                    현재 DB에 매칭된 단일 선지가 없습니다. 위 대조 개념으로 연관 기출을 탐색해 보세요.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {relatedOptions.map((opt) => {
                      const picked = miniOxPicks[opt.id];
                      const answered = picked !== undefined;
                      const isRight = answered && picked === opt.isCorrect;

                      return (
                        <div
                          key={opt.id}
                          className="p-2.5 rounded-xl bg-[#101016] border border-white/[0.06] space-y-2"
                        >
                          <div className="flex items-center justify-between text-[9.5px] font-mono text-slate-400">
                            <span>
                              {opt.examYear}년 {opt.questionNumber}번 · {opt.subject}
                            </span>
                            {opt.repeatCount >= 2 && (
                              <span className="text-[#FF8A70] font-black">
                                {opt.repeatCount}회 반복
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-100 leading-relaxed">
                            {opt.statement}
                          </p>
                          {!answered ? (
                            <div className="flex justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() =>
                                  setMiniOxPicks((prev) => ({ ...prev, [opt.id]: true }))
                                }
                                className="px-2.5 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/30 border border-emerald-500/35 text-emerald-300 text-[10px] font-black"
                              >
                                O
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  setMiniOxPicks((prev) => ({ ...prev, [opt.id]: false }))
                                }
                                className="px-2.5 py-1 rounded-lg bg-rose-500/15 hover:bg-rose-500/30 border border-rose-500/35 text-rose-300 text-[10px] font-black"
                              >
                                X
                              </button>
                            </div>
                          ) : (
                            <div className="pt-1.5 border-t border-white/[0.06] text-[10.5px] space-y-0.5">
                              <div
                                className={`font-black ${
                                  isRight ? "text-emerald-300" : "text-rose-300"
                                }`}
                              >
                                {isRight ? "정답!" : "오답!"} (정답:{" "}
                                {opt.isCorrect ? "O" : "X"})
                              </div>
                              {opt.trapSummary && (
                                <div className="text-amber-300 font-bold">
                                  {opt.trapSummary}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
