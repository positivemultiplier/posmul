"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronRight, Loader2, RotateCw, X } from "lucide-react";
import { MobileAppShell } from "@/components/mobile/mobile-app-shell";
import { SolveRunner } from "@/components/study/solve/SolveRunner";
import { useStudyAuth } from "@/components/auth/study-auth-provider";
import {
  fetchSolveSetQuestionsAction,
  fetchStudySolveSetsAction,
  type SolveQuestionItem,
  type StudySetSummary,
} from "@/app/actions/exam-study.actions";
import { getMutedSubjectColor } from "@/lib/study-theme";

const SUBJECT_FILTERS = [
  "전체",
  "민법",
  "회계원리",
  "공동주택시설개론",
  "주택관리관계법규",
  "공동주택관리실무",
] as const;

export default function StudySolvePage() {
  const { effectiveOwnerKey } = useStudyAuth();

  const [sets, setSets] = useState<StudySetSummary[]>([]);
  const [weakOptionCount, setWeakOptionCount] = useState(0);
  const [loadingSets, setLoadingSets] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [category, setCategory] = useState<"CHAPTER" | "ROUND">("CHAPTER");
  const [subjectFilter, setSubjectFilter] = useState<string>("전체");
  const [chapterCodeFilter, setChapterCodeFilter] = useState<string | null>(null);

  const [activeSet, setActiveSet] = useState<StudySetSummary | null>(null);
  const [activeQuestions, setActiveQuestions] = useState<SolveQuestionItem[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);

  // URL 쿼리(?chapter=CIV_03_AGENCY) 감지 -> 해당 단원으로 자동 필터링
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const ch = params.get("chapter");
    if (ch) {
      setCategory("CHAPTER");
      setSubjectFilter("전체");
      setChapterCodeFilter(ch);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoadingSets(true);
    setErrorMsg(null);

    void fetchStudySolveSetsAction(effectiveOwnerKey)
      .then((res) => {
        if (cancelled) return;
        if (res.success) {
          setSets(res.sets);
          setWeakOptionCount(res.weakOptionCount);
        } else {
          setErrorMsg(res.error || "기출 세트를 불러오지 못했습니다.");
        }
      })
      .catch(() => {
        if (!cancelled) setErrorMsg("네트워크 오류로 기출 세트를 불러오지 못했습니다.");
      })
      .finally(() => {
        if (!cancelled) setLoadingSets(false);
      });

    return () => {
      cancelled = true;
    };
  }, [effectiveOwnerKey]);

  const filteredSets = useMemo(() => {
    return sets.filter((s) => {
      if (s.category !== category) return false;
      if (chapterCodeFilter) {
        return s.setKey.includes(`::${chapterCodeFilter}::`);
      }
      if (subjectFilter !== "전체" && s.subject !== subjectFilter) return false;
      return true;
    });
  }, [sets, category, subjectFilter, chapterCodeFilter]);

  const handleOpenSet = async (target: StudySetSummary) => {
    setActiveSet(target);
    setLoadingQuestions(true);
    setErrorMsg(null);
    try {
      const res = await fetchSolveSetQuestionsAction(effectiveOwnerKey, target.setKey, {
        offset: 0,
        limit: 20,
        maxQuestions: 20,
        difficultyFilter: "ALL",
      });
      if (res.success && res.questions.length > 0) {
        setActiveQuestions(res.questions);
      } else {
        setErrorMsg(res.error || "해당 세트의 문항이 비어 있습니다.");
        setActiveSet(null);
      }
    } catch {
      setErrorMsg("문항 로드 중 오류가 발생했습니다.");
      setActiveSet(null);
    } finally {
      setLoadingQuestions(false);
    }
  };

  return (
    <MobileAppShell>
      {activeSet && !loadingQuestions && activeQuestions.length > 0 ? (
        <SolveRunner
          setKey={activeSet.setKey}
          setTitle={activeSet.title}
          questions={activeQuestions}
          onExit={() => {
            setActiveSet(null);
            setActiveQuestions([]);
          }}
          onSolvedCountChange={(nextSolved) => {
            setSets((prev) =>
              prev.map((s) =>
                s.setKey === activeSet.setKey ? { ...s, solvedCount: nextSolved } : s
              )
            );
          }}
        />
      ) : (
        <div className="flex-1 flex flex-col">
          {/* 상단 필터 영역 */}
          <div className="px-4 pt-3 pb-3 border-b border-[var(--hp-border)] space-y-3 bg-[var(--hp-bg)]">
            <div className="grid grid-cols-2 gap-1 p-0.5 rounded-lg bg-[var(--hp-surface)] border border-[var(--hp-border)]">
              <button
                type="button"
                onClick={() => setCategory("CHAPTER")}
                className={`py-1.5 rounded-md text-xs font-medium transition ${
                  category === "CHAPTER"
                    ? "bg-[var(--hp-accent)] text-[var(--hp-accent-fg)]"
                    : "text-[var(--hp-text-2)] hover:text-[var(--hp-text)]"
                }`}
              >
                단원별 20제
              </button>
              <button
                type="button"
                onClick={() => {
                  setCategory("ROUND");
                  setChapterCodeFilter(null);
                }}
                className={`py-1.5 rounded-md text-xs font-medium transition ${
                  category === "ROUND"
                    ? "bg-[var(--hp-accent)] text-[var(--hp-accent-fg)]"
                    : "text-[var(--hp-text-2)] hover:text-[var(--hp-text)]"
                }`}
              >
                회차별 20제
              </button>
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              {SUBJECT_FILTERS.map((subj) => {
                const selected = !chapterCodeFilter && subjectFilter === subj;
                const dotColor = subj === "전체" ? null : getMutedSubjectColor(subj);
                return (
                  <button
                    key={subj}
                    type="button"
                    onClick={() => {
                      setChapterCodeFilter(null);
                      setSubjectFilter(subj);
                    }}
                    className={`px-2.5 py-1 rounded-md text-[11px] flex items-center gap-1.5 whitespace-nowrap border transition ${
                      selected
                        ? "bg-[var(--hp-surface-2)] border-[var(--hp-border-strong)] text-[var(--hp-text)] font-medium"
                        : "border-transparent text-[var(--hp-text-2)] hover:text-[var(--hp-text)]"
                    }`}
                  >
                    {dotColor && (
                      <span
                        className="w-1.5 h-1.5 rounded-full shrink-0"
                        style={{ backgroundColor: dotColor }}
                      />
                    )}
                    <span>{subj.replace("공동주택", "").replace("주택관리", "")}</span>
                  </button>
                );
              })}
            </div>

            {chapterCodeFilter && (
              <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-[var(--hp-surface)] border border-[var(--hp-border-strong)] text-xs">
                <span className="text-[var(--hp-text)]">
                  선택 단원 필터 적용됨 ({filteredSets.length}개 세트)
                </span>
                <button
                  type="button"
                  onClick={() => setChapterCodeFilter(null)}
                  className="text-[var(--hp-text-2)] hover:text-[var(--hp-text)] flex items-center gap-1"
                >
                  <X className="w-3.5 h-3.5 stroke-[1.5]" />
                  <span>해제</span>
                </button>
              </div>
            )}
          </div>

          <div className="px-4 py-4 space-y-4">
            <Link
              href="/study/ox?mode=weak"
              className="p-3.5 rounded-xl bg-[var(--hp-surface)] border border-[var(--hp-border)] hover:border-[var(--hp-border-strong)] flex items-center justify-between gap-2 transition"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <RotateCw className="w-4 h-4 stroke-[1.5] text-[var(--hp-text-2)] shrink-0" />
                <div className="min-w-0">
                  <div className="text-xs font-medium text-[var(--hp-text)]">
                    별표 · 오답 선지 3초 O/X 복습
                  </div>
                  <div className="text-[11px] text-[var(--hp-text-3)] mt-0.5 hp-tabular">
                    누적 약점 선지 {weakOptionCount}건
                  </div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 stroke-[1.5] text-[var(--hp-text-3)] shrink-0" />
            </Link>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-[var(--hp-surface)] border border-[var(--hp-danger)] text-xs text-[var(--hp-danger)]">
                {errorMsg}
              </div>
            )}

            {loadingSets || loadingQuestions ? (
              <div className="py-16 flex flex-col items-center justify-center gap-2 text-xs text-[var(--hp-text-3)]">
                <Loader2 className="w-5 h-5 animate-spin stroke-[1.5]" />
                <span>
                  {loadingQuestions ? "20제 세트 불러오는 중..." : "기출 목록 불러오는 중..."}
                </span>
              </div>
            ) : filteredSets.length === 0 ? (
              <div className="py-14 text-center text-xs text-[var(--hp-text-3)]">
                조건에 맞는 기출 세트가 없습니다.
              </div>
            ) : (
              <ul className="divide-y divide-[var(--hp-border)] border-y border-[var(--hp-border)]">
                {filteredSets.map((set) => {
                  const pct =
                    set.questionCount > 0
                      ? Math.round((set.solvedCount / set.questionCount) * 100)
                      : 0;
                  const color = getMutedSubjectColor(set.subject);

                  return (
                    <li key={set.setKey}>
                      <button
                        type="button"
                        onClick={() => void handleOpenSet(set)}
                        className="w-full py-3.5 flex items-center justify-between gap-3 text-left hover:opacity-85 transition"
                      >
                        <div className="flex items-start gap-2.5 min-w-0 flex-1">
                          <span
                            className="w-2 h-2 rounded-full mt-1.5 shrink-0"
                            style={{ backgroundColor: color }}
                          />
                          <div className="min-w-0">
                            <div className="text-sm font-medium text-[var(--hp-text)] truncate">
                              {set.title}
                            </div>
                            <div className="text-[11px] text-[var(--hp-text-3)] mt-0.5 truncate">
                              {set.subtitle}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2.5 shrink-0">
                          <span className="text-xs hp-tabular text-[var(--hp-text-2)]">
                            {set.solvedCount}/{set.questionCount} ({pct}%)
                          </span>
                          <ChevronRight className="w-4 h-4 stroke-[1.5] text-[var(--hp-text-3)]" />
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      )}
    </MobileAppShell>
  );
}
