"use client";

import { useMemo, useRef, useState } from "react";
import { ArrowLeft, Check, ChevronLeft, ChevronRight, Star, X } from "lucide-react";
import {
  saveSingleQuestionSolveAction,
  type MarkStatus,
  type SolveQuestionItem,
} from "@/app/actions/exam-study.actions";
import { grantAppStudyPmpAction } from "@/app/actions/study-economy.actions";
import { useStudyAuth } from "@/components/auth/study-auth-provider";

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
  isCorrect: boolean | null;
  questionMark: MarkStatus | null;
  optionMarks: Record<string, MarkStatus>;
}

const OPTION_CIRCLES = ["①", "②", "③", "④", "⑤"] as const;

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
      isCorrect: q.savedIsCorrect,
      questionMark: q.savedQuestionMark,
      optionMarks: optMarks,
    };
  }
  return map;
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
  const [stateByQId, setStateByQId] = useState<Record<string, LocalQuestionState>>(() =>
    buildInitialMap(questions)
  );
  const [syncPendingCount, setSyncPendingCount] = useState(0);
  const rewardedQIdsRef = useRef<Set<string>>(new Set());

  const currentQ = questions[index];
  const currentState: LocalQuestionState = currentQ
    ? stateByQId[currentQ.id] || {
        selectedOption: null,
        subjectiveInput: "",
        isCorrect: null,
        questionMark: null,
        optionMarks: {},
      }
    : {
        selectedOption: null,
        subjectiveInput: "",
        isCorrect: null,
        questionMark: null,
        optionMarks: {},
      };

  const solvedCount = useMemo(
    () => Object.values(stateByQId).filter((s) => s.isCorrect !== null).length,
    [stateByQId]
  );

  const correctCount = useMemo(
    () => Object.values(stateByQId).filter((s) => s.isCorrect === true).length,
    [stateByQId]
  );

  // 완전 비동기 백그라운드 저장 (UI 0ms 블로킹 없음)
  const enqueueBackgroundSave = (q: SolveQuestionItem, nextState: LocalQuestionState) => {
    setSyncPendingCount((c) => c + 1);
    const optionMarksArr = Object.entries(nextState.optionMarks).map(([optionId, markStatus]) => ({
      optionId,
      markStatus,
    }));

    void saveSingleQuestionSolveAction({
      clientKey: effectiveOwnerKey,
      setKey,
      questionId: q.id,
      selectedOption: nextState.selectedOption,
      subjectiveInput: nextState.subjectiveInput.trim() || null,
      isCorrect: nextState.isCorrect,
      questionMark: nextState.questionMark,
      optionMarks: optionMarksArr,
    })
      .catch(() => {
        // 네트워크 일시 오류 시 사용자 흐름 방해 없이 무시
      })
      .finally(() => {
        setSyncPendingCount((c) => Math.max(0, c - 1));
      });
  };

  // 정답 시 1회 백그라운드 PMP 적립
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
        // 백그라운드 보상 실패 시 흐름 유지
      });
  };

  // 0ms 객관식 답안 선택
  const handleSelectOption = (optionNumber: number) => {
    if (!currentQ) return;
    const isCorrect = currentQ.correctOptions.includes(optionNumber);
    const nextOptionMarks = { ...currentState.optionMarks };
    const pickedOpt = currentQ.options.find((o) => o.optionNumber === optionNumber);
    if (pickedOpt && !nextOptionMarks[pickedOpt.id]) {
      nextOptionMarks[pickedOpt.id] = isCorrect ? "O" : "X";
    }

    const nextState: LocalQuestionState = {
      ...currentState,
      selectedOption: optionNumber,
      isCorrect,
      questionMark: isCorrect ? "O" : "X",
      optionMarks: nextOptionMarks,
    };

    setStateByQId((prev) => {
      const updated = { ...prev, [currentQ.id]: nextState };
      if (onSolvedCountChange) {
        onSolvedCountChange(Object.values(updated).filter((s) => s.isCorrect !== null).length);
      }
      return updated;
    });

    enqueueBackgroundSave(currentQ, nextState);
    if (isCorrect) triggerBackgroundPmp(currentQ.id);
  };

  // 0ms 주관식 채점
  const handleCheckSubjective = () => {
    if (!currentQ) return;
    const input = currentState.subjectiveInput.trim();
    if (!input) return;
    const normalizedInput = input.replace(/\s+/g, "").toLowerCase();
    const expected = (currentQ.subjectiveAnswer || "").replace(/\s+/g, "").toLowerCase();
    const isCorrect = expected.length > 0 && expected.includes(normalizedInput);

    const nextState: LocalQuestionState = {
      ...currentState,
      isCorrect,
      questionMark: isCorrect ? "O" : "X",
    };

    setStateByQId((prev) => ({ ...prev, [currentQ.id]: nextState }));
    enqueueBackgroundSave(currentQ, nextState);
    if (isCorrect) triggerBackgroundPmp(currentQ.id);
  };

  // 0ms 선지 O / ★ / X 마킹
  const handleMarkOption = (optionId: string, mark: MarkStatus) => {
    if (!currentQ) return;
    const nextMarks = { ...currentState.optionMarks, [optionId]: mark };
    const nextState: LocalQuestionState = { ...currentState, optionMarks: nextMarks };
    setStateByQId((prev) => ({ ...prev, [currentQ.id]: nextState }));
    enqueueBackgroundSave(currentQ, nextState);
  };

  if (!currentQ) return null;

  const isAnswered = currentState.isCorrect !== null;

  return (
    <div className="flex-1 flex flex-col">
      {/* 상단 진행 바 & 뒤로가기 */}
      <div className="px-4 py-3 border-b border-[var(--hp-border)] flex items-center justify-between gap-2 bg-[var(--hp-bg)]">
        <button
          type="button"
          onClick={onExit}
          className="flex items-center gap-1.5 text-xs text-[var(--hp-text-2)] hover:text-[var(--hp-text)] transition shrink-0"
        >
          <ArrowLeft className="w-4 h-4 stroke-[1.5]" />
          <span>목록</span>
        </button>

        <div className="text-xs font-medium truncate text-[var(--hp-text)]">{setTitle}</div>

        <div className="text-[11px] hp-tabular text-[var(--hp-text-2)] shrink-0">
          {index + 1}/{questions.length}
        </div>
      </div>

      {/* 20제 퀵 점프 번호 스트립 */}
      <div className="px-4 py-2 border-b border-[var(--hp-border)] flex items-center gap-1 overflow-x-auto no-scrollbar">
        {questions.map((q, i) => {
          const st = stateByQId[q.id];
          const isCur = i === index;
          return (
            <button
              key={q.id}
              type="button"
              onClick={() => setIndex(i)}
              className={`w-7 h-7 rounded-md text-[11px] hp-tabular shrink-0 border transition ${
                isCur
                  ? "bg-[var(--hp-accent)] text-[var(--hp-accent-fg)] border-transparent font-semibold"
                  : st?.isCorrect === true
                    ? "bg-[var(--hp-surface)] border-[var(--hp-success)] text-[var(--hp-success)]"
                    : st?.isCorrect === false
                      ? "bg-[var(--hp-surface)] border-[var(--hp-danger)] text-[var(--hp-danger)]"
                      : "border-[var(--hp-border)] text-[var(--hp-text-3)]"
              }`}
            >
              {i + 1}
            </button>
          );
        })}
      </div>

      {/* 문항 본문 */}
      <div className="flex-1 px-4 py-5 space-y-5">
        <div className="flex items-center justify-between text-[11px] text-[var(--hp-text-3)] hp-tabular">
          <span>
            {currentQ.examYear}년 제{currentQ.examRound}회 · {currentQ.subject} ·{" "}
            {currentQ.questionNumber}번
          </span>
          <span className="flex items-center gap-2">
            {currentQ.lawStatus === "AMENDED_MODIFIED" && (
              <span className="text-[var(--hp-success)]">개정반영</span>
            )}
            <span>
              정답 {correctCount}/{solvedCount}
            </span>
          </span>
        </div>

        <p className="text-[15px] leading-relaxed font-medium text-[var(--hp-text)] whitespace-pre-line">
          {currentQ.questionText}
        </p>

        {currentQ.boxContent && (
          <div className="p-3.5 rounded-xl bg-[var(--hp-surface)] border border-[var(--hp-border)] text-xs leading-relaxed text-[var(--hp-text-2)] whitespace-pre-line">
            {currentQ.boxContent}
          </div>
        )}

        {/* 객관식 선지 또는 주관식 입력 */}
        {currentQ.questionType === "SUBJECTIVE" || currentQ.options.length === 0 ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={currentState.subjectiveInput}
                onChange={(e) =>
                  setStateByQId((prev) => ({
                    ...prev,
                    [currentQ.id]: { ...currentState, subjectiveInput: e.target.value },
                  }))
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCheckSubjective();
                }}
                placeholder="주관식 정답 입력..."
                className="flex-1 h-10 px-3 rounded-lg bg-[var(--hp-surface)] border border-[var(--hp-border)] text-sm text-[var(--hp-text)] outline-none"
              />
              <button
                type="button"
                onClick={handleCheckSubjective}
                className="h-10 px-4 rounded-lg bg-[var(--hp-accent)] text-[var(--hp-accent-fg)] text-xs font-semibold"
              >
                채점
              </button>
            </div>
            {isAnswered && (
              <div className="p-3.5 rounded-xl bg-[var(--hp-surface)] border border-[var(--hp-border-strong)] text-xs space-y-1">
                <div
                  className={
                    currentState.isCorrect ? "text-[var(--hp-success)]" : "text-[var(--hp-danger)]"
                  }
                >
                  {currentState.isCorrect ? "정답입니다." : "오답입니다."}
                </div>
                <div className="text-[var(--hp-text)]">
                  모범 답안: {currentQ.subjectiveAnswer || "-"}
                </div>
              </div>
            )}
          </div>
        ) : (
          <ul className="space-y-2">
            {currentQ.options.map((opt) => {
              const isPicked = currentState.selectedOption === opt.optionNumber;
              const isAnswerOpt = currentQ.correctOptions.includes(opt.optionNumber);
              const optMark = currentState.optionMarks[opt.id];

              let borderClass = "border-[var(--hp-border)] bg-[var(--hp-surface)]";
              if (isAnswered) {
                if (isAnswerOpt) {
                  borderClass = "border-[var(--hp-success)] bg-[var(--hp-surface-2)]";
                } else if (isPicked) {
                  borderClass = "border-[var(--hp-danger)] bg-[var(--hp-surface-2)]";
                }
              }

              return (
                <li
                  key={opt.id}
                  className={`rounded-xl border p-3.5 transition ${borderClass}`}
                >
                  <button
                    type="button"
                    onClick={() => handleSelectOption(opt.optionNumber)}
                    className="w-full text-left flex items-start gap-2.5"
                  >
                    <span className="text-xs hp-tabular text-[var(--hp-text-2)] mt-0.5 shrink-0">
                      {OPTION_CIRCLES[opt.optionNumber - 1] || `${opt.optionNumber}.`}
                    </span>
                    <span className="text-sm leading-relaxed text-[var(--hp-text)] flex-1">
                      {opt.optionText}
                    </span>
                  </button>

                  {/* 채점 후 해설 및 0ms O/★/X 선지 마킹 */}
                  {isAnswered && (
                    <div className="mt-2.5 pt-2.5 border-t border-[var(--hp-border)] flex items-start justify-between gap-2">
                      <div className="text-xs text-[var(--hp-text-2)] leading-relaxed flex-1">
                        {opt.trapSummary ||
                          opt.legalCitation ||
                          (opt.isCorrect ? "옳은 지문입니다." : "틀린 지문입니다.")}
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {(
                          [
                            { code: "O", icon: Check, label: "확실함" },
                            { code: "STAR", icon: Star, label: "별표 복습" },
                            { code: "X", icon: X, label: "틀림 복습" },
                          ] as const
                        ).map((btn) => {
                          const Icon = btn.icon;
                          const active = optMark === btn.code;
                          return (
                            <button
                              key={btn.code}
                              type="button"
                              onClick={() => handleMarkOption(opt.id, btn.code)}
                              className={`w-7 h-7 rounded-md border flex items-center justify-center transition ${
                                active
                                  ? "bg-[var(--hp-accent)] text-[var(--hp-accent-fg)] border-transparent"
                                  : "border-[var(--hp-border)] text-[var(--hp-text-3)] hover:text-[var(--hp-text)]"
                              }`}
                              aria-label={btn.label}
                              title={btn.label}
                            >
                              <Icon className="w-3.5 h-3.5 stroke-[1.75]" />
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* 하단 0ms 이전/다음 이동 바 */}
      <div className="px-4 py-3 border-t border-[var(--hp-border)] bg-[var(--hp-bg)] flex items-center justify-between gap-2">
        <button
          type="button"
          disabled={index === 0}
          onClick={() => setIndex((i) => Math.max(0, i - 1))}
          className="h-10 px-4 rounded-lg border border-[var(--hp-border)] disabled:opacity-35 text-xs font-medium flex items-center gap-1"
        >
          <ChevronLeft className="w-4 h-4 stroke-[1.5]" />
          <span>이전</span>
        </button>

        <span className="text-[11px] text-[var(--hp-text-3)]">
          {syncPendingCount > 0 ? "동기화 중..." : "자동 저장됨"}
        </span>

        {index < questions.length - 1 ? (
          <button
            type="button"
            onClick={() => setIndex((i) => Math.min(questions.length - 1, i + 1))}
            className="h-10 px-4 rounded-lg bg-[var(--hp-accent)] text-[var(--hp-accent-fg)] text-xs font-semibold flex items-center gap-1"
          >
            <span>다음</span>
            <ChevronRight className="w-4 h-4 stroke-[1.5]" />
          </button>
        ) : (
          <button
            type="button"
            onClick={onExit}
            className="h-10 px-4 rounded-lg bg-[var(--hp-accent)] text-[var(--hp-accent-fg)] text-xs font-semibold"
          >
            세트 완료
          </button>
        )}
      </div>
    </div>
  );
}
