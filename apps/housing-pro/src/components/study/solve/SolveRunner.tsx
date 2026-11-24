"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Check,
  ChevronLeft,
  ChevronRight,
  RotateCw,
  Star,
  X,
} from "lucide-react";
import {
  saveSingleQuestionSolveAction,
  type MarkStatus,
  type SolveQuestionItem,
} from "@/app/actions/exam-study.actions";
import { grantAppStudyPmpAction } from "@/app/actions/study-economy.actions";
import { useStudyAuth } from "@/components/auth/study-auth-provider";
import {
  ConceptLinkedText,
  type KnowledgeTrailTarget,
} from "@/components/study/concept-linked-text";
import { ConceptTrailDrawer } from "@/components/study/concept-trail-drawer";
import {
  TheoryBottomSheet,
  type TheorySheetTarget,
} from "@/components/study/theory-bottom-sheet";
import { SolveOptionCard } from "@/components/study/solve/SolveOptionCard";
import {
  extractSubjectiveSlots,
  gradeSubjectiveBySlots,
  parseSubjectiveInputToMap,
  serializeSubjectiveMap,
} from "@/lib/subjective-answer";
import {
  extractBoxSubItems,
  inferBoxItemCorrectness,
  isBoxCombinationOptions,
} from "@/lib/box-items";

interface SolveRunnerProps {
  setKey: string;
  setTitle: string;
  questions: SolveQuestionItem[];
  onExit: () => void;
  onSolvedCountChange?: (solvedCount: number) => void;
}

interface LocalQuestionState {
  selectedOption: number | null;
  subjectiveInput: string;
  checked: boolean;
  isCorrect: boolean | null;
  questionMark: MarkStatus | null;
  optionMarks: Record<string, MarkStatus>;
  boxMarks: Record<string, MarkStatus>;
}

function buildInitialMap(questions: SolveQuestionItem[]): Record<string, LocalQuestionState> {
  const map: Record<string, LocalQuestionState> = {};
  for (const q of questions) {
    const optMarks: Record<string, MarkStatus> = {};
    for (const o of q.options) {
      if (o.savedMark) optMarks[o.id] = o.savedMark;
    }
    map[q.id] = {
      selectedOption: q.savedSelectedOption,
      subjectiveInput: q.savedSubjectiveInput ?? "",
      checked: q.savedIsCorrect !== null,
      isCorrect: q.savedIsCorrect,
      questionMark: q.savedQuestionMark,
      optionMarks: optMarks,
      boxMarks: q.savedBoxMarks ?? {},
    };
  }
  return map;
}

function evaluateQuestion(q: SolveQuestionItem, st: LocalQuestionState): boolean | null {
  if (q.questionType === "OBJECTIVE" && q.options.length > 0) {
    if (st.selectedOption === null) return null;
    return q.correctOptions.includes(st.selectedOption);
  }
  const slots = extractSubjectiveSlots(q.subjectiveAnswer, q.questionText, q.boxContent);
  return gradeSubjectiveBySlots(st.subjectiveInput, q.subjectiveAnswer, slots).isAllCorrect;
}

export function SolveRunner({
  setKey,
  setTitle,
  questions,
  onExit,
  onSolvedCountChange,
}: SolveRunnerProps) {
  const { effectiveOwnerKey, setLocalPmpBalance } = useStudyAuth();
  const [index, setIndex] = useState(0);
  const [instantGrade, setInstantGrade] = useState(true);
  const [showSummary, setShowSummary] = useState(false);
  const [stateByQId, setStateByQId] = useState<Record<string, LocalQuestionState>>(() =>
    buildInitialMap(questions)
  );
  const [syncPendingCount, setSyncPendingCount] = useState(0);
  const [expandedRepeatOptId, setExpandedRepeatOptId] = useState<string | null>(null);
  const [showOriginalQ, setShowOriginalQ] = useState(false);
  const [theoryTarget, setTheoryTarget] = useState<TheorySheetTarget | null>(null);
  const [knowledgeTarget, setKnowledgeTarget] = useState<KnowledgeTrailTarget | null>(null);
  const rewardedQIdsRef = useRef<Set<string>>(new Set());

  const currentQ = questions[index];
  const currentState: LocalQuestionState = currentQ
    ? stateByQId[currentQ.id] || {
        selectedOption: null,
        subjectiveInput: "",
        checked: false,
        isCorrect: null,
        questionMark: null,
        optionMarks: {},
        boxMarks: {},
      }
    : {
        selectedOption: null,
        subjectiveInput: "",
        checked: false,
        isCorrect: null,
        questionMark: null,
        optionMarks: {},
        boxMarks: {},
      };

  // 박스형(ㄱ·ㄴ·ㄷ·ㄹ) 조합 분석
  const boxItems = useMemo(
    () => (currentQ?.questionType === "OBJECTIVE" ? extractBoxSubItems(currentQ.boxContent) : []),
    [currentQ]
  );
  const isBoxCombo = useMemo(
    () =>
      Boolean(
        currentQ?.questionType === "OBJECTIVE" &&
          boxItems.length >= 2 &&
          isBoxCombinationOptions(currentQ.options)
      ),
    [currentQ, boxItems]
  );
  const boxCorrectness = useMemo(() => {
    if (!currentQ || !currentState.checked || !isBoxCombo) return null;
    return inferBoxItemCorrectness(
      currentQ.questionText,
      boxItems,
      currentQ.options,
      currentQ.correctOptions,
      currentQ.isNegativeQuestion
    );
  }, [currentQ, currentState.checked, isBoxCombo, boxItems]);

  const suggestedComboOption = useMemo(() => {
    if (!currentQ || !isBoxCombo) return null;
    const isNeg =
      currentQ.isNegativeQuestion ||
      /(옳지\s*않은|틀린\s*것|아닌\s*것|해당하지\s*않는|포함되지\s*않는|잘못\s*연결|바르지\s*않은)/.test(
        currentQ.questionText
      );
    const targetMark: MarkStatus = isNeg ? "X" : "O";
    const markedCnt = boxItems.filter((it) => Boolean(currentState.boxMarks[it.label])).length;
    if (markedCnt === 0) return null;
    const targetLabels = boxItems
      .filter((it) => currentState.boxMarks[it.label] === targetMark)
      .map((it) => it.label);
    if (targetLabels.length === 0 && markedCnt < boxItems.length) return null;

    const matched = currentQ.options.find((opt) => {
      const clean = opt.optionText.replace(/[\s,·ㆍ]/g, "");
      if (targetLabels.length === 0) return clean === "없음";
      const optLabels = Array.from(opt.optionText.matchAll(/[ㄱㄴㄷㄹㅁ]/g)).map((m) => m[0]);
      return (
        optLabels.length === targetLabels.length &&
        targetLabels.every((lbl, i) => optLabels[i] === lbl)
      );
    });
    return matched ? matched.optionNumber : null;
  }, [currentQ, isBoxCombo, boxItems, currentState.boxMarks]);

  // 주관식 다중 슬롯 분석
  const subjectiveSlots = useMemo(
    () =>
      currentQ?.questionType === "SUBJECTIVE"
        ? extractSubjectiveSlots(currentQ.subjectiveAnswer, currentQ.questionText, currentQ.boxContent)
        : [],
    [currentQ]
  );
  const subjectiveMap = useMemo(
    () =>
      subjectiveSlots.length > 0
        ? parseSubjectiveInputToMap(currentState.subjectiveInput, subjectiveSlots)
        : {},
    [currentState.subjectiveInput, subjectiveSlots]
  );
  const subjectiveGrade = useMemo(() => {
    if (!currentQ || !currentState.checked || currentQ.questionType !== "SUBJECTIVE") return null;
    return gradeSubjectiveBySlots(
      currentState.subjectiveInput,
      currentQ.subjectiveAnswer,
      subjectiveSlots
    );
  }, [currentQ, currentState.checked, currentState.subjectiveInput, subjectiveSlots]);

  // 문맥 텍스트 (대조어·반대어 오매칭 방지)
  const questionContextText = useMemo(() => {
    if (!currentQ) return "";
    return [
      currentQ.subject,
      currentQ.questionText,
      currentQ.boxContent || "",
      ...currentQ.options.map((o) => o.optionText),
    ].join(" ");
  }, [currentQ]);

  const summaryStats = useMemo(() => {
    let correct = 0;
    let wrong = 0;
    let weakMarks = 0;
    for (const q of questions) {
      const st = stateByQId[q.id];
      if (!st) continue;
      if (st.isCorrect === true) correct += 1;
      if (st.isCorrect === false) wrong += 1;
      for (const m of Object.values(st.optionMarks)) {
        if (m === "STAR" || m === "X") weakMarks += 1;
      }
      for (const m of Object.values(st.boxMarks)) {
        if (m === "STAR" || m === "X") weakMarks += 1;
      }
    }
    return { correct, wrong, solved: correct + wrong, weakMarks };
  }, [questions, stateByQId]);

  // 완전 비동기 백그라운드 저장 (0ms UI 유지 + 오답 시 정답/선택 선지 자동 ★ 약점 수집)
  const enqueueBackgroundSave = (q: SolveQuestionItem, st: LocalQuestionState) => {
    setSyncPendingCount((c) => c + 1);
    const combo =
      q.questionType === "OBJECTIVE" &&
      extractBoxSubItems(q.boxContent).length >= 2 &&
      isBoxCombinationOptions(q.options);

    const finalOptMarks: Array<{ optionId: string; markStatus: MarkStatus }> = [];
    for (const opt of q.options) {
      const explicit = st.optionMarks[opt.id];
      if (explicit) {
        finalOptMarks.push({ optionId: opt.id, markStatus: explicit });
      } else if (st.checked && st.isCorrect === false && !combo) {
        if (st.selectedOption === opt.optionNumber || q.correctOptions.includes(opt.optionNumber)) {
          finalOptMarks.push({ optionId: opt.id, markStatus: "STAR" });
        }
      }
    }

    void saveSingleQuestionSolveAction({
      clientKey: effectiveOwnerKey,
      setKey,
      questionId: q.id,
      selectedOption: st.selectedOption,
      subjectiveInput: st.subjectiveInput.trim() || null,
      isCorrect: st.isCorrect,
      questionMark: st.questionMark ?? (st.isCorrect === false ? "X" : st.isCorrect ? "O" : null),
      boxMarks: st.boxMarks,
      optionMarks: finalOptMarks,
    })
      .catch(() => {
        // 비동기 네트워크 오류 무시
      })
      .finally(() => {
        setSyncPendingCount((c) => Math.max(0, c - 1));
      });
  };

  const triggerBackgroundPmp = (questionId: string) => {
    if (rewardedQIdsRef.current.has(questionId)) return;
    rewardedQIdsRef.current.add(questionId);
    void grantAppStudyPmpAction({ kind: "SOLVE" })
      .then((res) => {
        if (res.success && typeof res.newBalance === "number") {
          setLocalPmpBalance(res.newBalance);
        }
      })
      .catch(() => {
        // 무시
      });
  };

  const commitLocalState = (
    q: SolveQuestionItem,
    nextState: LocalQuestionState,
    shouldPersist = true
  ) => {
    setStateByQId((prev) => {
      const updated = { ...prev, [q.id]: nextState };
      if (onSolvedCountChange) {
        onSolvedCountChange(Object.values(updated).filter((s) => s.isCorrect !== null).length);
      }
      return updated;
    });
    if (shouldPersist) enqueueBackgroundSave(q, nextState);
  };

  const handleSelectOption = (optionNumber: number) => {
    if (!currentQ) return;
    const isCorrect = instantGrade ? currentQ.correctOptions.includes(optionNumber) : null;
    const nextState: LocalQuestionState = {
      ...currentState,
      selectedOption: optionNumber,
      checked: instantGrade ? true : currentState.checked,
      isCorrect: instantGrade ? isCorrect : currentState.isCorrect,
      questionMark:
        instantGrade && !currentState.questionMark
          ? isCorrect
            ? "O"
            : "X"
          : currentState.questionMark,
    };
    commitLocalState(currentQ, nextState, true);
    if (instantGrade && isCorrect) triggerBackgroundPmp(currentQ.id);
  };

  const handleCheckCurrent = () => {
    if (!currentQ) return;
    const isCorrect = evaluateQuestion(currentQ, currentState);
    const nextState: LocalQuestionState = {
      ...currentState,
      checked: true,
      isCorrect,
      questionMark:
        currentState.questionMark ?? (isCorrect === false ? "X" : isCorrect ? "O" : null),
    };
    commitLocalState(currentQ, nextState, true);
    if (isCorrect) triggerBackgroundPmp(currentQ.id);
  };

  const handleToggleOptionMark = (optionId: string, mark: MarkStatus) => {
    if (!currentQ) return;
    const nextMarks = { ...currentState.optionMarks };
    if (nextMarks[optionId] === mark) delete nextMarks[optionId];
    else nextMarks[optionId] = mark;
    commitLocalState(currentQ, { ...currentState, optionMarks: nextMarks }, true);
  };

  const handleMarkRemainingOptionsO = () => {
    if (!currentQ) return;
    const nextMarks = { ...currentState.optionMarks };
    for (const opt of currentQ.options) {
      if (!nextMarks[opt.id]) nextMarks[opt.id] = "O";
    }
    commitLocalState(currentQ, { ...currentState, optionMarks: nextMarks }, true);
  };

  const handleToggleBoxMark = (label: string, mark: MarkStatus) => {
    if (!currentQ) return;
    const nextBox = { ...currentState.boxMarks };
    if (nextBox[label] === mark) delete nextBox[label];
    else nextBox[label] = mark;
    commitLocalState(currentQ, { ...currentState, boxMarks: nextBox }, true);
  };

  const handleFinishSet = () => {
    const nextMap = { ...stateByQId };
    for (const q of questions) {
      const st = nextMap[q.id];
      if (!st || st.checked) continue;
      if (st.selectedOption === null && !st.subjectiveInput.trim()) continue;
      const isCorrect = evaluateQuestion(q, st);
      const graded = { ...st, checked: true, isCorrect };
      nextMap[q.id] = graded;
      enqueueBackgroundSave(q, graded);
    }
    setStateByQId(nextMap);
    setShowSummary(true);
  };

  if (showSummary) {
    const accuracy =
      summaryStats.solved > 0
        ? Math.round((summaryStats.correct / summaryStats.solved) * 100)
        : 0;
    return (
      <div className="px-4 py-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="text-xs text-[var(--hp-text-3)]">{setTitle}</div>
          <div className="text-3xl font-light hp-tabular">{accuracy}%</div>
          <div className="text-xs text-[var(--hp-text-2)] hp-tabular">
            정답 {summaryStats.correct} · 오답 {summaryStats.wrong} · 약점 보기(★/X){" "}
            {summaryStats.weakMarks}건 수집됨
          </div>
        </div>

        <div className="space-y-2.5">
          {summaryStats.weakMarks > 0 && (
            <Link
              href="/study/ox?mode=weak"
              className="w-full h-11 rounded-xl bg-[var(--hp-accent)] text-[var(--hp-accent-fg)] text-xs font-semibold flex items-center justify-center gap-1.5"
            >
              <RotateCw className="w-3.5 h-3.5 stroke-[1.75]" />
              <span>수집된 약점 보기 {summaryStats.weakMarks}건 O/X 복습</span>
            </Link>
          )}
          <button
            type="button"
            onClick={() => setShowSummary(false)}
            className="w-full h-10 rounded-xl border border-[var(--hp-border-strong)] text-xs text-[var(--hp-text)]"
          >
            문항 다시 검토하기
          </button>
          <button
            type="button"
            onClick={onExit}
            className="w-full h-10 rounded-xl border border-[var(--hp-border)] text-xs text-[var(--hp-text-2)]"
          >
            세트 목록으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  if (!currentQ) return null;

  return (
    <div className="flex-1 flex flex-col">
      {/* 상단 바 */}
      <div className="px-4 py-2.5 border-b border-[var(--hp-border)] flex items-center justify-between gap-2 bg-[var(--hp-bg)]">
        <button
          type="button"
          onClick={onExit}
          className="flex items-center gap-1 text-xs text-[var(--hp-text-2)] hover:text-[var(--hp-text)] shrink-0"
        >
          <ArrowLeft className="w-4 h-4 stroke-[1.5]" />
          <span>목록</span>
        </button>

        <div className="text-xs font-medium truncate">{setTitle}</div>

        <button
          type="button"
          onClick={() => setInstantGrade((prev) => !prev)}
          className="px-2 py-1 rounded-md border border-[var(--hp-border)] text-[11px] text-[var(--hp-text-2)] shrink-0"
          title="즉시 채점 / 일괄 채점 전환"
        >
          {instantGrade ? "즉시채점" : "일괄채점"}
        </button>
      </div>

      {/* 번호 퀵 점프 스트립 */}
      <div className="px-4 py-2 border-b border-[var(--hp-border)] flex items-center gap-1 overflow-x-auto no-scrollbar">
        {questions.map((q, i) => {
          const st = stateByQId[q.id];
          const isCur = i === index;
          return (
            <button
              key={q.id}
              type="button"
              onClick={() => {
                setIndex(i);
                setExpandedRepeatOptId(null);
                setShowOriginalQ(false);
              }}
              className={`w-7 h-7 rounded-md text-[11px] hp-tabular shrink-0 border transition ${
                isCur
                  ? "bg-[var(--hp-accent)] text-[var(--hp-accent-fg)] border-transparent font-semibold"
                  : st?.isCorrect === true
                    ? "bg-[var(--hp-surface)] border-[var(--hp-success)] text-[var(--hp-success)]"
                    : st?.isCorrect === false
                      ? "bg-[var(--hp-surface)] border-[var(--hp-danger)] text-[var(--hp-danger)]"
                      : st?.selectedOption !== null
                        ? "bg-[var(--hp-surface-2)] border-[var(--hp-border-strong)] text-[var(--hp-text)]"
                        : "border-[var(--hp-border)] text-[var(--hp-text-3)]"
              }`}
            >
              {i + 1}
            </button>
          );
        })}
      </div>

      {/* 문항 본문 */}
      <div className="flex-1 px-4 py-5 space-y-4">
        <div className="flex items-center justify-between gap-2 text-[11px] text-[var(--hp-text-3)] hp-tabular">
          <span>
            {currentQ.examYear}년 제{currentQ.examRound}회 · {currentQ.subject} ·{" "}
            {currentQ.questionNumber}번
            {currentQ.importanceTier ? ` · ${currentQ.importanceTier}급` : ""}
          </span>

          {/* 문항 전체 O / ★ / X 마킹 */}
          <div className="flex items-center gap-1">
            {(["O", "STAR", "X"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() =>
                  commitLocalState(
                    currentQ,
                    {
                      ...currentState,
                      questionMark: currentState.questionMark === m ? null : m,
                    },
                    true
                  )
                }
                className={`px-2 py-0.5 rounded border text-[10.5px] ${
                  currentState.questionMark === m
                    ? "bg-[var(--hp-accent)] text-[var(--hp-accent-fg)] border-transparent font-medium"
                    : "border-[var(--hp-border)] text-[var(--hp-text-3)]"
                }`}
              >
                {m === "STAR" ? "★" : m}
              </button>
            ))}
          </div>
        </div>

        {/* 개정법령 반영 안내 및 원문 비교 */}
        {currentQ.amendedNote && (
          <div className="p-2.5 rounded-lg bg-[var(--hp-surface)] border border-[var(--hp-border-strong)] space-y-1 text-[11px]">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[var(--hp-success)]">{currentQ.amendedNote}</span>
              {currentQ.originalSnapshot && (
                <button
                  type="button"
                  onClick={() => setShowOriginalQ((prev) => !prev)}
                  className="text-[var(--hp-text-2)] underline shrink-0"
                >
                  {showOriginalQ ? "원문 접기" : "개정 전 원문"}
                </button>
              )}
            </div>
            {showOriginalQ && currentQ.originalSnapshot && (
              <div className="pt-1.5 border-t border-[var(--hp-border)] text-[var(--hp-text-3)] space-y-0.5">
                {currentQ.originalSnapshot.question_text && (
                  <div>[원문] {currentQ.originalSnapshot.question_text}</div>
                )}
                {currentQ.originalSnapshot.subjective_answer && (
                  <div>[개정 전 정답] {currentQ.originalSnapshot.subjective_answer}</div>
                )}
              </div>
            )}
          </div>
        )}

        {/* 문제 질문 (채점 후 반대어·개념 꼬리물기 활성화) */}
        <p className="text-[15px] leading-relaxed font-medium text-[var(--hp-text)] whitespace-pre-line">
          <ConceptLinkedText
            text={currentQ.questionText}
            contextText={questionContextText}
            enabled={currentState.checked}
            onSelectTarget={setKnowledgeTarget}
          />
        </p>

        {/* 박스형 보기 (ㄱ. ㄴ. ㄷ. ㄹ. 개별 O/★/X 마킹 + 채점 후 정오 추론) */}
        {boxItems.length > 0 ? (
          <div className="p-3.5 rounded-xl bg-[var(--hp-surface)] border border-[var(--hp-border)] space-y-2">
            {boxItems.map((item) => {
              const bMark = currentState.boxMarks[item.label];
              const inferred = boxCorrectness ? boxCorrectness[item.label] : undefined;
              return (
                <div
                  key={item.label}
                  className="flex items-start justify-between gap-2 py-1 border-b border-[var(--hp-border)] last:border-b-0"
                >
                  <div className="text-xs leading-relaxed text-[var(--hp-text)] flex-1">
                    <span className="font-semibold mr-1.5">{item.label}.</span>
                    <ConceptLinkedText
                      text={item.text}
                      contextText={questionContextText}
                      enabled={currentState.checked}
                      onSelectTarget={setKnowledgeTarget}
                    />
                    {inferred !== undefined && (
                      <span
                        className={`ml-1.5 text-[10.5px] font-semibold ${
                          inferred ? "text-[var(--hp-success)]" : "text-[var(--hp-danger)]"
                        }`}
                      >
                        [{inferred ? "O" : "X"}]
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {(
                      [
                        { code: "O", icon: Check },
                        { code: "STAR", icon: Star },
                        { code: "X", icon: X },
                      ] as const
                    ).map((btn) => {
                      const Icon = btn.icon;
                      const active = bMark === btn.code;
                      return (
                        <button
                          key={btn.code}
                          type="button"
                          onClick={() => handleToggleBoxMark(item.label, btn.code)}
                          className={`w-6 h-6 rounded border flex items-center justify-center ${
                            active
                              ? "bg-[var(--hp-accent)] text-[var(--hp-accent-fg)] border-transparent"
                              : "border-[var(--hp-border)] text-[var(--hp-text-3)]"
                          }`}
                          aria-label={`${item.label} ${btn.code}`}
                        >
                          <Icon className="w-3 h-3 stroke-[1.75]" />
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          currentQ.boxContent && (
            <div className="p-3.5 rounded-xl bg-[var(--hp-surface)] border border-[var(--hp-border)] text-xs leading-relaxed text-[var(--hp-text-2)] whitespace-pre-line">
              <ConceptLinkedText
                text={currentQ.boxContent}
                contextText={questionContextText}
                enabled={currentState.checked}
                onSelectTarget={setKnowledgeTarget}
              />
            </div>
          )
        )}

        {/* 객관식 1~5번 보기 또는 주관식 다중 슬롯 */}
        {currentQ.questionType === "SUBJECTIVE" || currentQ.options.length === 0 ? (
          <div className="space-y-3">
            {subjectiveSlots.length > 1 ? (
              <div className="space-y-2">
                {subjectiveSlots.map((slot) => (
                  <label key={slot.label} className="flex items-center gap-2 text-xs">
                    <span className="w-10 text-[var(--hp-text-2)] font-medium shrink-0">
                      {slot.label}
                    </span>
                    <input
                      type="text"
                      value={subjectiveMap[slot.label] || ""}
                      onChange={(e) => {
                        const nextMap = { ...subjectiveMap, [slot.label]: e.target.value };
                        commitLocalState(
                          currentQ,
                          {
                            ...currentState,
                            subjectiveInput: serializeSubjectiveMap(nextMap, subjectiveSlots),
                          },
                          false
                        );
                      }}
                      placeholder={`${slot.label} 답안 입력`}
                      className="flex-1 h-9 px-3 rounded-lg bg-[var(--hp-surface)] border border-[var(--hp-border)] text-xs text-[var(--hp-text)] outline-none"
                    />
                  </label>
                ))}
              </div>
            ) : (
              <input
                type="text"
                value={currentState.subjectiveInput}
                onChange={(e) =>
                  commitLocalState(
                    currentQ,
                    { ...currentState, subjectiveInput: e.target.value },
                    false
                  )
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCheckCurrent();
                }}
                placeholder="주관식 정답 입력..."
                className="w-full h-10 px-3 rounded-lg bg-[var(--hp-surface)] border border-[var(--hp-border)] text-sm text-[var(--hp-text)] outline-none"
              />
            )}

            <button
              type="button"
              onClick={handleCheckCurrent}
              className="w-full h-10 rounded-lg bg-[var(--hp-accent)] text-[var(--hp-accent-fg)] text-xs font-semibold"
            >
              채점하기
            </button>

            {currentState.checked && (
              <div className="p-3.5 rounded-xl bg-[var(--hp-surface)] border border-[var(--hp-border-strong)] text-xs space-y-1">
                <div
                  className={
                    currentState.isCorrect ? "text-[var(--hp-success)]" : "text-[var(--hp-danger)]"
                  }
                >
                  {currentState.isCorrect ? "정답입니다." : "오답입니다."}
                  {subjectiveGrade && subjectiveSlots.length > 1
                    ? ` (${
                        Object.values(subjectiveGrade.slotCorrectness).filter((v) => v === true)
                          .length
                      }/${subjectiveSlots.length})`
                    : ""}
                </div>
                <div className="text-[var(--hp-text)]">
                  모범 답안: {currentQ.subjectiveAnswer || "-"}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-[11px] text-[var(--hp-text-3)]">
              <span>보기별 O · ★ · X 체크 시 약점 O/X에 자동 수집</span>
              <button
                type="button"
                onClick={handleMarkRemainingOptionsO}
                className="text-[var(--hp-text-2)] hover:text-[var(--hp-text)] underline"
              >
                나머지 O
              </button>
            </div>

            <ul className="space-y-2">
              {currentQ.options.map((opt) => (
                <SolveOptionCard
                  key={opt.id}
                  question={currentQ}
                  option={opt}
                  contextText={questionContextText}
                  isPicked={currentState.selectedOption === opt.optionNumber}
                  isChecked={currentState.checked}
                  isSuggestedCombo={suggestedComboOption === opt.optionNumber}
                  optionMark={currentState.optionMarks[opt.id]}
                  repeatExpanded={expandedRepeatOptId === opt.id}
                  onSelectOption={handleSelectOption}
                  onToggleOptionMark={handleToggleOptionMark}
                  onToggleRepeat={(id) =>
                    setExpandedRepeatOptId((prev) => (prev === id ? null : id))
                  }
                  onOpenTheory={setTheoryTarget}
                  onSelectConcept={setKnowledgeTarget}
                />
              ))}
            </ul>

            {!instantGrade && !currentState.checked && currentState.selectedOption !== null && (
              <button
                type="button"
                onClick={handleCheckCurrent}
                className="w-full h-10 rounded-lg border border-[var(--hp-border-strong)] text-xs font-medium"
              >
                이 문제만 채점 확인
              </button>
            )}
          </div>
        )}
      </div>

      {/* 하단 0ms 이동 바 */}
      <div className="px-4 py-3 border-t border-[var(--hp-border)] bg-[var(--hp-bg)] flex items-center justify-between gap-2">
        <button
          type="button"
          disabled={index === 0}
          onClick={() => {
            setIndex((i) => Math.max(0, i - 1));
            setExpandedRepeatOptId(null);
            setShowOriginalQ(false);
          }}
          className="h-10 px-4 rounded-lg border border-[var(--hp-border)] disabled:opacity-35 text-xs font-medium flex items-center gap-1"
        >
          <ChevronLeft className="w-4 h-4 stroke-[1.5]" />
          <span>이전</span>
        </button>

        <span className="text-[11px] text-[var(--hp-text-3)] hp-tabular">
          {index + 1}/{questions.length} · {syncPendingCount > 0 ? "동기화 중" : "저장됨"}
        </span>

        {index < questions.length - 1 ? (
          <button
            type="button"
            onClick={() => {
              setIndex((i) => Math.min(questions.length - 1, i + 1));
              setExpandedRepeatOptId(null);
              setShowOriginalQ(false);
            }}
            className="h-10 px-4 rounded-lg bg-[var(--hp-accent)] text-[var(--hp-accent-fg)] text-xs font-semibold flex items-center gap-1"
          >
            <span>다음</span>
            <ChevronRight className="w-4 h-4 stroke-[1.5]" />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleFinishSet}
            className="h-10 px-4 rounded-lg bg-[var(--hp-accent)] text-[var(--hp-accent-fg)] text-xs font-semibold"
          >
            채점 완료
          </button>
        )}
      </div>

      {/* 보기 관련 이론 바텀시트 & 반대어·개념 꼬리물기 드로어 */}
      <TheoryBottomSheet target={theoryTarget} onClose={() => setTheoryTarget(null)} />
      <ConceptTrailDrawer
        initialTarget={knowledgeTarget}
        onClose={() => setKnowledgeTarget(null)}
      />
    </div>
  );
}
