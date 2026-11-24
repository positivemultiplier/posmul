"use client";

import { BookOpen, Check, History, Star, X } from "lucide-react";
import type {
  MarkStatus,
  SolveOptionItem,
  SolveQuestionItem,
} from "@/app/actions/exam-study.actions";
import {
  ConceptLinkedText,
  type KnowledgeTrailTarget,
} from "@/components/study/concept-linked-text";
import type { TheorySheetTarget } from "@/components/study/theory-bottom-sheet";

const OPTION_CIRCLES = ["①", "②", "③", "④", "⑤"] as const;

function getDistinctYearsLabel(yearsInput: Array<{ year: number }>): string {
  const ys = Array.from(new Set(yearsInput.map((c) => c.year))).sort((a, b) => a - b);
  return ys.map((y) => `'${String(y).slice(-2)}`).join(", ");
}

interface SolveOptionCardProps {
  question: SolveQuestionItem;
  option: SolveOptionItem;
  contextText: string;
  isPicked: boolean;
  isChecked: boolean;
  isSuggestedCombo: boolean;
  optionMark: MarkStatus | undefined;
  repeatExpanded: boolean;
  onSelectOption: (optionNumber: number) => void;
  onToggleOptionMark: (optionId: string, mark: MarkStatus) => void;
  onToggleRepeat: (optionId: string) => void;
  onOpenTheory: (target: TheorySheetTarget) => void;
  onSelectConcept: (target: KnowledgeTrailTarget) => void;
}

/**
 * 1~5번 보기 카드:
 * - 채점 전·후 모두 개별 O / ★ / X 마킹 가능 (0ms 즉시 반영)
 * - 채점 후 반대어/개념 꼬리물기 링크(ConceptLinkedText), 반복 출제 이력, 법령 근거, 이론 바텀시트, 개정 원문 제공
 */
export function SolveOptionCard({
  question,
  option,
  contextText,
  isPicked,
  isChecked,
  isSuggestedCombo,
  optionMark,
  repeatExpanded,
  onSelectOption,
  onToggleOptionMark,
  onToggleRepeat,
  onOpenTheory,
  onSelectConcept,
}: SolveOptionCardProps) {
  const isAnswerOpt = question.correctOptions.includes(option.optionNumber);

  let cardBorder = "border-[var(--hp-border)] bg-[var(--hp-surface)]";
  if (isChecked) {
    if (isAnswerOpt) {
      cardBorder = "border-[var(--hp-success)] bg-[var(--hp-surface-2)]";
    } else if (isPicked) {
      cardBorder = "border-[var(--hp-danger)] bg-[var(--hp-surface-2)]";
    }
  } else if (isPicked) {
    cardBorder = "border-[var(--hp-accent)] bg-[var(--hp-surface-2)]";
  } else if (isSuggestedCombo) {
    cardBorder = "border-[var(--hp-warn)] bg-[var(--hp-surface)]";
  }

  return (
    <li className={`rounded-xl border p-3.5 space-y-2.5 transition ${cardBorder}`}>
      <div className="flex items-start justify-between gap-2">
        {/* 보기 본문 선택 버튼 */}
        <button
          type="button"
          onClick={() => onSelectOption(option.optionNumber)}
          className="flex-1 text-left flex items-start gap-2 min-w-0"
        >
          <span
            className={`text-xs hp-tabular mt-0.5 shrink-0 ${
              isPicked ? "font-semibold text-[var(--hp-text)]" : "text-[var(--hp-text-2)]"
            }`}
          >
            {OPTION_CIRCLES[option.optionNumber - 1] || `${option.optionNumber}.`}
          </span>
          <span className="text-sm leading-relaxed text-[var(--hp-text)] flex-1">
            <ConceptLinkedText
              text={option.optionText}
              contextText={contextText}
              enabled={isChecked}
              onSelectTarget={onSelectConcept}
            />
          </span>
        </button>

        {/* 보기별 O / ★ / X 0ms 원탭 마킹 (풀이 중·채점 후 상시 사용) */}
        <div className="flex items-center gap-1 shrink-0 pt-0.5">
          {(
            [
              { code: "O", icon: Check, label: "O (확실함)" },
              { code: "STAR", icon: Star, label: "★ (헷갈림 · 복습 수집)" },
              { code: "X", icon: X, label: "X (틀림 · 복습 수집)" },
            ] as const
          ).map((btn) => {
            const Icon = btn.icon;
            const active = optionMark === btn.code;
            return (
              <button
                key={btn.code}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleOptionMark(option.id, btn.code);
                }}
                className={`w-7 h-7 rounded-md border flex items-center justify-center transition ${
                  active
                    ? btn.code === "O"
                      ? "bg-[var(--hp-success)] text-white border-transparent"
                      : btn.code === "STAR"
                        ? "bg-[var(--hp-warn)] text-white border-transparent"
                        : "bg-[var(--hp-danger)] text-white border-transparent"
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

      {/* 조합형 박스 추천 배지 (풀이 중) */}
      {!isChecked && isSuggestedCombo && (
        <div className="text-[11px] text-[var(--hp-warn)] pl-5">
          박스 체크 기준 일치 선지
        </div>
      )}

      {/* 채점 후: 정오 배지 · 반복 출제 빈도 · 이론 바텀시트 · 해설/법령 근거 · 개정 원문 */}
      {isChecked && (
        <div className="pt-2.5 border-t border-[var(--hp-border)] space-y-2 text-xs">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span
                className={`px-2 py-0.5 rounded text-[10.5px] font-medium ${
                  option.isCorrect
                    ? "bg-[#5B8C73]/20 text-[var(--hp-success)]"
                    : "bg-[#C97B63]/20 text-[var(--hp-danger)]"
                }`}
              >
                {option.isCorrect ? "옳은 지문 (O)" : "틀린 지문 (X)"}
              </span>

              {option.repeatCount >= 2 && (
                <button
                  type="button"
                  onClick={() => onToggleRepeat(option.id)}
                  className="px-2 py-0.5 rounded border border-[var(--hp-border-strong)] bg-[var(--hp-bg)] text-[10.5px] hp-tabular text-[var(--hp-text-2)] hover:text-[var(--hp-text)] flex items-center gap-1"
                >
                  <History className="w-3 h-3 stroke-[1.5]" />
                  <span>
                    {option.repeatCount}회 출제
                    {option.appearedCitations.length > 0
                      ? ` (${getDistinctYearsLabel(option.appearedCitations)})`
                      : ""}
                  </span>
                </button>
              )}

              {option.isAmended && (
                <span className="px-2 py-0.5 rounded border border-[var(--hp-border)] text-[10.5px] text-[var(--hp-success)]">
                  개정 반영
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={() =>
                onOpenTheory({
                  subject: question.subject,
                  detailCode: question.detailCode,
                  sectionCode: option.theorySectionCode,
                  chapterTitle: question.chapterTitle,
                  statement: option.optionText,
                  isCorrectStatement: option.isCorrect,
                  citation: option.legalCitation,
                  trapSummary: option.trapSummary,
                })
              }
              className="px-2 py-0.5 rounded border border-[var(--hp-border)] hover:border-[var(--hp-border-strong)] text-[10.5px] text-[var(--hp-text-2)] hover:text-[var(--hp-text)] flex items-center gap-1 shrink-0"
            >
              <BookOpen className="w-3 h-3 stroke-[1.5]" />
              <span>이론</span>
            </button>
          </div>

          {(option.trapSummary || option.legalCitation) && (
            <div className="p-2.5 rounded-lg bg-[var(--hp-bg)] border border-[var(--hp-border)] space-y-1">
              {option.trapSummary && (
                <p className="text-xs leading-relaxed text-[var(--hp-text-2)]">
                  <ConceptLinkedText
                    text={option.trapSummary}
                    contextText={contextText}
                    enabled
                    onSelectTarget={onSelectConcept}
                  />
                </p>
              )}
              {option.legalCitation && (
                <div className="text-[10.5px] text-[var(--hp-text-3)]">
                  근거: {option.legalCitation}
                </div>
              )}
            </div>
          )}

          {option.isAmended && option.originalOptionText && (
            <div className="text-[11px] text-[var(--hp-text-3)]">
              개정 전 지문: {option.originalOptionText}
            </div>
          )}

          {/* 역대 반복 출제 이력 아코디언 */}
          {repeatExpanded && option.appearedCitations.length > 0 && (
            <div className="p-2.5 rounded-lg bg-[var(--hp-bg)] border border-[var(--hp-border-strong)] space-y-1.5 text-[11px]">
              <div className="text-[10.5px] font-medium text-[var(--hp-text-2)]">
                역대 반복 출제 이력
              </div>
              {option.appearedCitations.map((c, ci) => (
                <div
                  key={ci}
                  className="pt-1 border-t border-[var(--hp-border)] first:border-t-0 first:pt-0 space-y-0.5"
                >
                  <div className="flex items-center justify-between text-[10.5px] hp-tabular text-[var(--hp-text-3)]">
                    <span>
                      {c.year}년 제{c.round}회 {c.subject} {c.questionNumber}번 ({c.optionNumber}번)
                    </span>
                    <span>{c.isCorrect ? "O" : "X"}</span>
                  </div>
                  <p className="text-[11px] text-[var(--hp-text-2)] leading-snug">
                    {c.optionText}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </li>
  );
}
