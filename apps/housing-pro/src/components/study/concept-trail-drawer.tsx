"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Check, Loader2, Plus, ThumbsUp, X } from "lucide-react";
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

const MNEMONIC_TYPE_LABELS: Record<MnemonicType, string> = {
  ACRONYM: "두문자",
  COMPARE: "비교",
  STORY: "스토리",
  TIP: "실전팁",
};

/**
 * 전역 기출 개념 · A vs B 대조표 드릴다운 드로어 (오브시디언 다크 / 페이퍼 라이트 통일)
 */
export function ConceptTrailDrawer({ initialTarget, onClose }: ConceptTrailDrawerProps) {
  const { isLoggedIn } = useStudyAuth();
  const [trail, setTrail] = useState<KnowledgeTrailTarget[]>([]);

  const [mnemonics, setMnemonics] = useState<ConceptMnemonicItem[]>([]);
  const [loadingMnemonics, setLoadingMnemonics] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newMnemonicType, setNewMnemonicType] = useState<MnemonicType>("ACRONYM");
  const [newShortHook, setNewShortHook] = useState("");
  const [newDetailNote, setNewDetailNote] = useState("");
  const [submittingMnemonic, setSubmittingMnemonic] = useState(false);
  const [mnemonicFeedback, setMnemonicFeedback] = useState<string | null>(null);

  const [relatedOptions, setRelatedOptions] = useState<KeywordMatchedOption[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [miniOxPicks, setMiniOxPicks] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setTrail(initialTarget ? [initialTarget] : []);
  }, [initialTarget]);

  const current = trail[trail.length - 1] ?? null;
  const activeConcept =
    current?.kind === "concept" ? getConceptById(current.conceptId) : null;
  const activeAxis = current?.kind === "axis" ? getContrastAxisById(current.axisId) : null;

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
      setRelatedOptions(res.success ? res.options.slice(0, 5) : []);
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

  const handleVote = async (mnemonicId: string) => {
    if (!isLoggedIn) {
      setMnemonicFeedback("로그인하면 암기법에 투표할 수 있습니다.");
      return;
    }
    const res = await toggleMnemonicVoteAction(mnemonicId);
    if (res.success && typeof res.upvoteCount === "number") {
      setMnemonics((prev) =>
        prev
          .map((item) =>
            item.id === mnemonicId
              ? { ...item, hasVoted: Boolean(res.voted), upvoteCount: res.upvoteCount! }
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
      setMnemonicFeedback("로그인하면 암기법을 등록할 수 있습니다.");
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
    } else if (res.error) {
      setMnemonicFeedback(res.error);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[85] bg-[var(--hp-overlay)] backdrop-blur-sm flex items-end sm:items-center justify-center"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[460px] max-h-[88vh] rounded-t-2xl sm:rounded-2xl bg-[var(--hp-bg)] border border-[var(--hp-border-strong)] flex flex-col overflow-hidden shadow-2xl text-[var(--hp-text)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <header className="px-4 py-3 border-b border-[var(--hp-border)] flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            {trail.length > 1 && (
              <button
                type="button"
                onClick={() => setTrail((prev) => prev.slice(0, -1))}
                className="w-7 h-7 rounded-md hover:bg-[var(--hp-surface)] flex items-center justify-center text-[var(--hp-text-2)] shrink-0"
                aria-label="이전 개념"
              >
                <ArrowLeft className="w-4 h-4 stroke-[1.5]" />
              </button>
            )}
            <span className="text-sm font-semibold truncate">
              {activeConcept?.title || activeAxis?.title || "개념 상세"}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-[var(--hp-surface)] flex items-center justify-center text-[var(--hp-text-2)]"
            aria-label="닫기"
          >
            <X className="w-4 h-4 stroke-[1.5]" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-4 space-y-5 pb-safe text-xs">
          {/* A. 개념 상세 뷰 */}
          {activeConcept && (
            <>
              <section className="p-3.5 rounded-xl bg-[var(--hp-surface)] border border-[var(--hp-border)] space-y-2.5">
                <div className="text-[11px] text-[var(--hp-text-3)] hp-tabular">
                  {activeConcept.examStage} · {activeConcept.subject}
                  {activeConcept.lawRef ? ` · ${activeConcept.lawRef}` : ""}
                  {activeConcept.examCount > 0 ? ` · 기출 ${activeConcept.examCount}회` : ""}
                </div>
                {activeConcept.summaryBullets.length > 0 && (
                  <ul className="space-y-1.5 text-xs leading-relaxed text-[var(--hp-text)] list-disc pl-4">
                    {activeConcept.summaryBullets.map((b, i) => (
                      <li key={i}>{b}</li>
                    ))}
                  </ul>
                )}
                {activeConcept.trapWarning && (
                  <div className="pt-2 border-t border-[var(--hp-border)] text-xs text-[var(--hp-text-2)]">
                    출제 함정: {activeConcept.trapWarning}
                  </div>
                )}
              </section>

              {/* 연관 개념 · 대조 개념 바로가기 */}
              {(activeConcept.sameGroupIds.length > 0 || activeConcept.contrastIds.length > 0) && (
                <section className="space-y-2">
                  <div className="text-[11px] font-medium text-[var(--hp-text-3)]">
                    연관 · 대조 개념
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {Array.from(
                      new Set([...activeConcept.contrastIds, ...activeConcept.sameGroupIds])
                    ).map((relId) => {
                      const rel = getConceptById(relId);
                      if (!rel) return null;
                      return (
                        <button
                          key={rel.id}
                          type="button"
                          onClick={() => pushTarget({ kind: "concept", conceptId: rel.id })}
                          className="px-2.5 py-1 rounded-md bg-[var(--hp-surface)] border border-[var(--hp-border)] hover:border-[var(--hp-border-strong)] text-xs text-[var(--hp-text)]"
                        >
                          {rel.title}
                        </button>
                      );
                    })}
                  </div>
                </section>
              )}

              {/* 연관 실제 기출 O/X */}
              <section className="space-y-2">
                <div className="text-[11px] font-medium text-[var(--hp-text-3)]">
                  연관 기출 지문 O/X
                </div>
                {loadingOptions ? (
                  <div className="py-4 flex items-center gap-2 text-[var(--hp-text-3)]">
                    <Loader2 className="w-3.5 h-3.5 animate-spin stroke-[1.5]" />
                    <span>불러오는 중...</span>
                  </div>
                ) : relatedOptions.length === 0 ? (
                  <div className="text-[var(--hp-text-3)]">매칭된 기출 선지가 없습니다.</div>
                ) : (
                  <ul className="space-y-2">
                    {relatedOptions.map((opt) => {
                      const picked = miniOxPicks[opt.id];
                      const judged = picked !== undefined;
                      const isRight = judged && picked === opt.isCorrect;
                      return (
                        <li
                          key={opt.id}
                          className="p-3 rounded-xl bg-[var(--hp-surface)] border border-[var(--hp-border)] space-y-2"
                        >
                          <p className="text-xs leading-relaxed text-[var(--hp-text)]">
                            {opt.statement}
                          </p>
                          {!judged ? (
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() =>
                                  setMiniOxPicks((prev) => ({ ...prev, [opt.id]: true }))
                                }
                                className="flex-1 py-1 rounded-md border border-[var(--hp-border-strong)] text-xs flex items-center justify-center gap-1"
                              >
                                <Check className="w-3 h-3 stroke-[1.75]" />
                                <span>O</span>
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  setMiniOxPicks((prev) => ({ ...prev, [opt.id]: false }))
                                }
                                className="flex-1 py-1 rounded-md border border-[var(--hp-border-strong)] text-xs flex items-center justify-center gap-1"
                              >
                                <X className="w-3 h-3 stroke-[1.75]" />
                                <span>X</span>
                              </button>
                            </div>
                          ) : (
                            <div
                              className={
                                isRight ? "text-[var(--hp-success)]" : "text-[var(--hp-danger)]"
                              }
                            >
                              {isRight ? "정답" : "오답"} · 정해: {opt.isCorrect ? "O" : "X"}
                            </div>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </section>

              {/* 집단지성 암기법 */}
              <section className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-medium text-[var(--hp-text-3)]">
                    암기법 ({mnemonics.length})
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowAddForm((prev) => !prev)}
                    className="text-[11px] text-[var(--hp-text-2)] hover:text-[var(--hp-text)] flex items-center gap-0.5"
                  >
                    <Plus className="w-3 h-3 stroke-[1.75]" />
                    <span>등록</span>
                  </button>
                </div>

                {mnemonicFeedback && (
                  <div className="text-[11px] text-[var(--hp-warn)]">{mnemonicFeedback}</div>
                )}

                {showAddForm && (
                  <div className="p-3 rounded-xl bg-[var(--hp-surface)] border border-[var(--hp-border-strong)] space-y-2">
                    <div className="flex gap-1">
                      {(Object.keys(MNEMONIC_TYPE_LABELS) as MnemonicType[]).map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setNewMnemonicType(t)}
                          className={`px-2 py-1 rounded text-[11px] border ${
                            newMnemonicType === t
                              ? "bg-[var(--hp-accent)] text-[var(--hp-accent-fg)] border-transparent"
                              : "border-[var(--hp-border)] text-[var(--hp-text-2)]"
                          }`}
                        >
                          {MNEMONIC_TYPE_LABELS[t]}
                        </button>
                      ))}
                    </div>
                    <input
                      type="text"
                      value={newShortHook}
                      onChange={(e) => setNewShortHook(e.target.value)}
                      placeholder="짧은 두문자 / 핵심 암기 문구"
                      className="w-full h-8 px-2.5 rounded-md bg-[var(--hp-bg)] border border-[var(--hp-border)] text-xs text-[var(--hp-text)] outline-none"
                    />
                    <input
                      type="text"
                      value={newDetailNote}
                      onChange={(e) => setNewDetailNote(e.target.value)}
                      placeholder="부가 설명 (선택)"
                      className="w-full h-8 px-2.5 rounded-md bg-[var(--hp-bg)] border border-[var(--hp-border)] text-xs text-[var(--hp-text)] outline-none"
                    />
                    <button
                      type="button"
                      disabled={submittingMnemonic || !newShortHook.trim()}
                      onClick={() => void handleSubmitMnemonic()}
                      className="w-full h-8 rounded-md bg-[var(--hp-accent)] text-[var(--hp-accent-fg)] text-xs font-medium disabled:opacity-40"
                    >
                      {submittingMnemonic ? "저장 중..." : "암기법 저장"}
                    </button>
                  </div>
                )}

                {loadingMnemonics ? (
                  <div className="text-[var(--hp-text-3)]">불러오는 중...</div>
                ) : mnemonics.length === 0 ? (
                  <div className="text-[var(--hp-text-3)]">등록된 암기법이 없습니다.</div>
                ) : (
                  <ul className="space-y-2">
                    {mnemonics.map((m) => (
                      <li
                        key={m.id}
                        className="p-3 rounded-xl bg-[var(--hp-surface)] border border-[var(--hp-border)] flex items-start justify-between gap-2"
                      >
                        <div className="min-w-0">
                          <div className="text-xs font-medium text-[var(--hp-text)]">
                            [{MNEMONIC_TYPE_LABELS[m.mnemonicType]}] {m.shortHook}
                          </div>
                          {m.detailNote && (
                            <p className="text-[11px] text-[var(--hp-text-2)] mt-0.5">
                              {m.detailNote}
                            </p>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => void handleVote(m.id)}
                          className={`px-2 py-1 rounded-md border text-[11px] hp-tabular flex items-center gap-1 shrink-0 ${
                            m.hasVoted
                              ? "bg-[var(--hp-accent)] text-[var(--hp-accent-fg)] border-transparent"
                              : "border-[var(--hp-border)] text-[var(--hp-text-2)]"
                          }`}
                        >
                          <ThumbsUp className="w-3 h-3 stroke-[1.5]" />
                          <span>{m.upvoteCount}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </>
          )}

          {/* B. A vs B 대조 축 뷰 */}
          {activeAxis && (
            <section className="space-y-3">
              <div className="p-3.5 rounded-xl bg-[var(--hp-surface)] border border-[var(--hp-border)] space-y-1">
                <div className="text-[11px] text-[var(--hp-text-3)]">{activeAxis.subjectTag}</div>
                <div className="text-sm font-medium">{activeAxis.title}</div>
                <p className="text-xs text-[var(--hp-text-2)]">{activeAxis.subtitle}</p>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                {[activeAxis.leftSide, activeAxis.rightSide].map((side, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-[var(--hp-surface)] border border-[var(--hp-border)] space-y-2"
                  >
                    <div className="text-xs font-semibold text-[var(--hp-text)]">{side.label}</div>
                    <p className="text-[11px] text-[var(--hp-text-2)] leading-relaxed">
                      {side.description}
                    </p>
                    {side.conceptIds.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {side.conceptIds.map((cid) => {
                          const node = getConceptById(cid);
                          if (!node) return null;
                          return (
                            <button
                              key={cid}
                              type="button"
                              onClick={() => pushTarget({ kind: "concept", conceptId: cid })}
                              className="px-2 py-0.5 rounded bg-[var(--hp-bg)] border border-[var(--hp-border)] text-[10.5px] text-[var(--hp-text)]"
                            >
                              {node.title}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {activeAxis.examTip && (
                <div className="p-3 rounded-xl bg-[var(--hp-surface)] border border-[var(--hp-border)] text-xs text-[var(--hp-text-2)]">
                  출제 포인트: {activeAxis.examTip}
                </div>
              )}
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
