"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Flame,
  History,
  ListChecks,
  Loader2,
  Star,
  X,
  Zap,
  BookCheck,
  FileWarning,
  Eye,
  EyeOff,
  Check,
  Sparkles,
} from "lucide-react";
import { MobileAppShell } from "@/components/mobile/mobile-app-shell";
import {
  fetchStudySolveSetsAction,
  fetchSolveSetQuestionsAction,
  saveSingleQuestionSolveAction,
  type StudySetSummary,
  type SolveQuestionItem,
  type MarkStatus,
} from "@/app/actions/exam-study.actions";
import {
  extractSubjectiveSlots,
  parseSubjectiveInputToMap,
  serializeSubjectiveMap,
  gradeSubjectiveBySlots,
} from "@/lib/subjective-answer";
import {
  extractBoxSubItems,
  isBoxCombinationOptions,
  inferBoxItemCorrectness,
} from "@/lib/box-items";

const OPTION_CIRCLES = ["①", "②", "③", "④", "⑤"] as const;

function getOrCreateClientKey(): string {
  if (typeof window === "undefined") return "demo-housing-guest";
  const existing = window.localStorage.getItem("housing_pro_client_key");
  if (existing) return existing;
  const generated = `hp-${Math.random().toString(36).slice(2, 10)}-${Date.now().toString(36)}`;
  window.localStorage.setItem("housing_pro_client_key", generated);
  return generated;
}

interface LocalDraftState {
  selectedOption: number | null;
  subjectiveInput: string;
  questionMark: MarkStatus | null;
  optionMarks: Record<string, MarkStatus>;
  boxMarks: Record<string, MarkStatus>;
  checked: boolean;
  isCorrect: boolean | null;
}

function getDistinctYearsLabel(yearsInput: Array<{ year: number }>): string {
  const ys = Array.from(new Set(yearsInput.map((c) => c.year))).sort((a, b) => a - b);
  return ys.map((y) => `'${String(y).slice(-2)}`).join(", ");
}

export default function InteractiveSolvePage() {
  const [clientKey, setClientKey] = useState<string>("");
  const [sets, setSets] = useState<StudySetSummary[]>([]);
  const [weakOptionCount, setWeakOptionCount] = useState<number>(0);
  const [loadingSets, setLoadingSets] = useState<boolean>(true);

  const [catalogCategory, setCatalogCategory] = useState<"CHAPTER" | "ROUND">("CHAPTER");
  const [subjectFilter, setSubjectFilter] = useState<string>("ALL");

  // 현재 활성화된 세트 풀이 상태
  const [activeSet, setActiveSet] = useState<StudySetSummary | null>(null);
  const [questions, setQuestions] = useState<SolveQuestionItem[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState<boolean>(false);
  const [currentIdx, setCurrentIdx] = useState<number>(0);

  // 설정 토글: 즉시 채점 vs 20제 일괄 채점 / 본문 간략 접기(종이책 병행용)
  const [instantGradeMode, setInstantGradeMode] = useState<boolean>(true);
  const [compactQuestionMode, setCompactQuestionMode] = useState<boolean>(false);
  const [showSummary, setShowSummary] = useState<boolean>(false);
  const [savingId, setSavingId] = useState<string | null>(null);

  // 문항별 로컬 답안/선지마킹 상태 맵
  const [drafts, setDrafts] = useState<Record<string, LocalDraftState>>({});
  // 펼침 상태 (선지별 반복 출제 이력, 개정 원문 보기)
  const [expandedRepeatOptId, setExpandedRepeatOptId] = useState<string | null>(null);
  const [showOriginalQ, setShowOriginalQ] = useState<boolean>(false);

  const refreshCatalog = useCallback(async (key: string) => {
    setLoadingSets(true);
    const res = await fetchStudySolveSetsAction(key);
    if (res.success) {
      setSets(res.sets);
      setWeakOptionCount(res.weakOptionCount);
    }
    setLoadingSets(false);
  }, []);

  useEffect(() => {
    const key = getOrCreateClientKey();
    setClientKey(key);
    refreshCatalog(key);
  }, [refreshCatalog]);

  const filteredSets = useMemo(() => {
    return sets.filter((s) => {
      if (s.category !== catalogCategory) return false;
      if (subjectFilter !== "ALL" && s.subject !== subjectFilter) return false;
      return true;
    });
  }, [sets, catalogCategory, subjectFilter]);

  const availableSubjects = useMemo(() => {
    const set = new Set(sets.map((s) => s.subject));
    return ["ALL", ...Array.from(set)];
  }, [sets]);

  const handleOpenSet = async (setSummary: StudySetSummary) => {
    if (!clientKey) return;
    setActiveSet(setSummary);
    setLoadingQuestions(true);
    setShowSummary(false);
    setExpandedRepeatOptId(null);
    setShowOriginalQ(false);

    const res = await fetchSolveSetQuestionsAction(clientKey, setSummary.setKey);
    if (res.success) {
      setQuestions(res.questions);
      const nextDrafts: Record<string, LocalDraftState> = {};
      let firstUnsolvedIdx = 0;
      let foundUnsolved = false;

      res.questions.forEach((q, idx) => {
        const optMarks: Record<string, MarkStatus> = {};
        for (const o of q.options) {
          if (o.savedMark) optMarks[o.id] = o.savedMark;
        }
        const alreadySolved = q.savedIsCorrect !== null;
        if (!alreadySolved && !foundUnsolved) {
          firstUnsolvedIdx = idx;
          foundUnsolved = true;
        }
        nextDrafts[q.id] = {
          selectedOption: q.savedSelectedOption,
          subjectiveInput: q.savedSubjectiveInput ?? "",
          questionMark: q.savedQuestionMark,
          optionMarks: optMarks,
          boxMarks: q.savedBoxMarks ?? {},
          checked: alreadySolved,
          isCorrect: q.savedIsCorrect,
        };
      });

      setDrafts(nextDrafts);
      setCurrentIdx(firstUnsolvedIdx);
    }
    setLoadingQuestions(false);
  };

  const currentQ = questions[currentIdx];
  const currentDraft = currentQ ? drafts[currentQ.id] : undefined;

  const currentSubjectiveSlots = useMemo(() => {
    if (!currentQ || currentQ.questionType !== "SUBJECTIVE") return [];
    return extractSubjectiveSlots(currentQ.subjectiveAnswer, currentQ.questionText, currentQ.boxContent);
  }, [currentQ]);

  const currentSubjectiveMap = useMemo(() => {
    if (!currentDraft || currentSubjectiveSlots.length === 0) return {};
    return parseSubjectiveInputToMap(currentDraft.subjectiveInput, currentSubjectiveSlots);
  }, [currentDraft, currentSubjectiveSlots]);

  const currentSubjectiveGrade = useMemo(() => {
    if (!currentQ || !currentDraft?.checked || currentQ.questionType !== "SUBJECTIVE") return null;
    return gradeSubjectiveBySlots(currentDraft.subjectiveInput, currentQ.subjectiveAnswer, currentSubjectiveSlots);
  }, [currentQ, currentDraft, currentSubjectiveSlots]);

  const currentBoxItems = useMemo(() => {
    if (!currentQ || currentQ.questionType !== "OBJECTIVE") return [];
    return extractBoxSubItems(currentQ.boxContent);
  }, [currentQ]);

  const isBoxComboQuestion = useMemo(() => {
    if (!currentQ || currentQ.questionType !== "OBJECTIVE") return false;
    return currentBoxItems.length >= 2 && isBoxCombinationOptions(currentQ.options);
  }, [currentQ, currentBoxItems]);

  const currentBoxCorrectness = useMemo(() => {
    if (!currentQ || !currentDraft?.checked || !isBoxComboQuestion) return null;
    return inferBoxItemCorrectness(
      currentQ.questionText,
      currentBoxItems,
      currentQ.options,
      currentQ.correctOptions,
      currentQ.isNegativeQuestion
    );
  }, [currentQ, currentDraft?.checked, isBoxComboQuestion, currentBoxItems]);

  const suggestedComboOptionNumber = useMemo(() => {
    if (!currentQ || !currentDraft || !isBoxComboQuestion) return null;
    const isNegativeQ =
      currentQ.isNegativeQuestion ||
      /(옳지\s*않은|틀린\s*것|아닌\s*것|해당하지\s*않는|포함되지\s*않는|잘못\s*연결|바르지\s*않은)/.test(
        currentQ.questionText
      );
    const targetMark: MarkStatus = isNegativeQ ? "X" : "O";
    const markedCount = currentBoxItems.filter((item) => Boolean(currentDraft.boxMarks[item.label])).length;
    if (markedCount === 0) return null;

    const targetLabels = currentBoxItems
      .filter((item) => currentDraft.boxMarks[item.label] === targetMark)
      .map((item) => item.label);

    if (targetLabels.length === 0 && markedCount < currentBoxItems.length) return null;

    const matched = currentQ.options.find((opt) => {
      const clean = opt.optionText.replace(/[\s,·ㆍ]/g, "");
      if (targetLabels.length === 0) {
        return clean === "없음";
      }
      const optLabels = Array.from(opt.optionText.matchAll(/[ㄱㄴㄷㄹㅁ]/g)).map((m) => m[0]);
      return (
        optLabels.length === targetLabels.length &&
        targetLabels.every((lbl, idx) => optLabels[idx] === lbl)
      );
    });
    return matched ? matched.optionNumber : null;
  }, [currentQ, currentDraft, isBoxComboQuestion, currentBoxItems]);

  const evaluateQuestionCorrect = (q: SolveQuestionItem, d: LocalDraftState): boolean | null => {
    if (q.questionType === "OBJECTIVE") {
      if (d.selectedOption === null) return null;
      return q.correctOptions.includes(d.selectedOption);
    }
    const slots = extractSubjectiveSlots(q.subjectiveAnswer, q.questionText, q.boxContent);
    return gradeSubjectiveBySlots(d.subjectiveInput, q.subjectiveAnswer, slots).isAllCorrect;
  };

  const persistQuestionToDb = useCallback(
    async (q: SolveQuestionItem, d: LocalDraftState, markChecked: boolean) => {
      if (!clientKey || !activeSet) return;
      const computedCorrect = markChecked ? evaluateQuestionCorrect(q, d) : d.isCorrect;

      // 오답이거나 미확신일 때 별도 선지 마킹을 하나도 안 했으면 정답 선지와 오답 선택 선지를 자동으로 'STAR'로 저장해 약점 O/X에 연결
      const isBoxCombo =
        q.questionType === "OBJECTIVE" &&
        extractBoxSubItems(q.boxContent).length >= 2 &&
        isBoxCombinationOptions(q.options);

      const finalOptionMarks: Array<{ optionId: string; markStatus: MarkStatus }> = [];
      for (const opt of q.options) {
        const explicit = d.optionMarks[opt.id];
        if (explicit) {
          finalOptionMarks.push({ optionId: opt.id, markStatus: explicit });
        } else if (computedCorrect === false && !isBoxCombo) {
          const isChosen = d.selectedOption === opt.optionNumber;
          const isTargetAnswer = q.correctOptions.includes(opt.optionNumber);
          if (isChosen || isTargetAnswer) {
            finalOptionMarks.push({ optionId: opt.id, markStatus: "STAR" });
          }
        }
      }

      setSavingId(q.id);
      await saveSingleQuestionSolveAction({
        clientKey,
        setKey: activeSet.setKey,
        questionId: q.id,
        selectedOption: d.selectedOption,
        subjectiveInput: d.subjectiveInput.trim() || null,
        isCorrect: computedCorrect,
        questionMark: d.questionMark ?? (computedCorrect === false ? "X" : computedCorrect === true ? "O" : null),
        optionMarks: finalOptionMarks,
        boxMarks: d.boxMarks,
      });
      setSavingId(null);
    },
    [clientKey, activeSet]
  );

  const updateCurrentDraft = (updater: (prev: LocalDraftState) => LocalDraftState) => {
    if (!currentQ) return;
    setDrafts((prev) => {
      const base: LocalDraftState = prev[currentQ.id] ?? {
        selectedOption: null,
        subjectiveInput: "",
        questionMark: null,
        optionMarks: {},
        boxMarks: {},
        checked: false,
        isCorrect: null,
      };
      return { ...prev, [currentQ.id]: updater(base) };
    });
  };

  const handleToggleOptionMark = (optionId: string, mark: MarkStatus) => {
    updateCurrentDraft((prev) => {
      const nextMarks = { ...prev.optionMarks };
      if (nextMarks[optionId] === mark) {
        delete nextMarks[optionId];
      } else {
        nextMarks[optionId] = mark;
      }
      return { ...prev, optionMarks: nextMarks };
    });
  };

  const handleMarkRemainingAsO = () => {
    if (!currentQ) return;
    updateCurrentDraft((prev) => {
      const nextMarks = { ...prev.optionMarks };
      for (const opt of currentQ.options) {
        if (!nextMarks[opt.id]) {
          nextMarks[opt.id] = "O";
        }
      }
      return { ...prev, optionMarks: nextMarks };
    });
  };

  const handleToggleBoxItemMark = (label: string, mark: MarkStatus) => {
    updateCurrentDraft((prev) => {
      const nextBoxMarks = { ...prev.boxMarks };
      if (nextBoxMarks[label] === mark) {
        delete nextBoxMarks[label];
      } else {
        nextBoxMarks[label] = mark;
      }
      return { ...prev, boxMarks: nextBoxMarks };
    });
  };

  const handleMarkRemainingBoxAsO = () => {
    if (currentBoxItems.length === 0) return;
    updateCurrentDraft((prev) => {
      const nextBoxMarks = { ...prev.boxMarks };
      for (const item of currentBoxItems) {
        if (!nextBoxMarks[item.label]) {
          nextBoxMarks[item.label] = "O";
        }
      }
      return { ...prev, boxMarks: nextBoxMarks };
    });
  };

  const handleCheckAndSaveCurrent = async () => {
    if (!currentQ || !currentDraft) return;
    const isCorrect = evaluateQuestionCorrect(currentQ, currentDraft);
    const updated: LocalDraftState = {
      ...currentDraft,
      checked: true,
      isCorrect,
    };
    setDrafts((prev) => ({ ...prev, [currentQ.id]: updated }));
    await persistQuestionToDb(currentQ, updated, true);
  };

  const handleMoveQuestion = async (targetIdx: number) => {
    if (currentQ && currentDraft) {
      // 이동하는 순간 1문제 단위 즉시 DB 저장!
      const shouldGrade = instantGradeMode ? currentDraft.checked : currentDraft.selectedOption !== null;
      await persistQuestionToDb(currentQ, currentDraft, shouldGrade);
    }
    setExpandedRepeatOptId(null);
    setShowOriginalQ(false);
    setCurrentIdx(targetIdx);
  };

  const handleFinishAllSet = async () => {
    const nextDrafts = { ...drafts };
    await Promise.all(
      questions.map(async (q) => {
        const d = nextDrafts[q.id];
        if (!d) return;
        const isCorrect = evaluateQuestionCorrect(q, d);
        const updated = { ...d, checked: true, isCorrect };
        nextDrafts[q.id] = updated;
        await persistQuestionToDb(q, updated, true);
      })
    );
    setDrafts(nextDrafts);
    setShowSummary(true);
    if (clientKey) refreshCatalog(clientKey);
  };

  const summaryStats = useMemo(() => {
    let correctCnt = 0;
    let wrongCnt = 0;
    let starOrXOptionCnt = 0;
    for (const q of questions) {
      const d = drafts[q.id];
      if (!d) continue;
      if (d.isCorrect === true) correctCnt++;
      if (d.isCorrect === false) wrongCnt++;
      for (const m of Object.values(d.optionMarks)) {
        if (m === "STAR" || m === "X") starOrXOptionCnt++;
      }
      for (const m of Object.values(d.boxMarks)) {
        if (m === "STAR" || m === "X") starOrXOptionCnt++;
      }
    }
    return { correctCnt, wrongCnt, starOrXOptionCnt };
  }, [questions, drafts]);

  return (
    <MobileAppShell>
      {/* 상단 헤더 */}
      <header className="px-4 py-3 bg-[#16161C] border-b border-white/[0.06] space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            {activeSet ? (
              <button
                type="button"
                onClick={() => {
                  setActiveSet(null);
                  if (clientKey) refreshCatalog(clientKey);
                }}
                className="p-1.5 rounded-lg bg-white/[0.06] text-slate-300 hover:text-white shrink-0"
                aria-label="세트 목록으로"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            ) : (
              <ListChecks className="w-4 h-4 text-[#FF5A36] shrink-0" />
            )}
            <div className="min-w-0">
              <h1 className="text-sm font-black text-white truncate">
                {activeSet ? activeSet.title : "20제 문제·지문 O/★/X 체크"}
              </h1>
              <p className="text-[10px] text-slate-400 truncate">
                {activeSet
                  ? "1문제마다 자동 저장 · 선지별 O/★/X 약점 추적"
                  : "집에 갈 때 빠른 복습 & 종이책 병행 답안·지문 체크"}
              </p>
            </div>
          </div>

          <Link
            href="/study/ox?mode=weak"
            className="shrink-0 px-2.5 py-1 rounded-full bg-[#FF5A36]/15 border border-[#FF5A36]/40 text-[#FF7A59] text-[10px] font-black flex items-center gap-1"
          >
            <Zap className="w-3 h-3" />
            <span>약점 O/X ({weakOptionCount})</span>
          </Link>
        </div>

        {/* 세트 선택 화면일 때 카테고리 & 과목 필터 */}
        {!activeSet && (
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-1.5 bg-[#0E0E12] p-1 rounded-xl border border-white/[0.05]">
              <button
                type="button"
                onClick={() => setCatalogCategory("CHAPTER")}
                className={`py-1.5 rounded-lg text-[11px] font-black transition ${
                  catalogCategory === "CHAPTER"
                    ? "bg-[#FF5A36] text-white shadow"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                📚 단원별 20제 묶음
              </button>
              <button
                type="button"
                onClick={() => setCatalogCategory("ROUND")}
                className={`py-1.5 rounded-lg text-[11px] font-black transition ${
                  catalogCategory === "ROUND"
                    ? "bg-[#FF5A36] text-white shadow"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                🗓️ 연도·회차별 20제
              </button>
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
              {availableSubjects.map((subj) => (
                <button
                  key={subj}
                  type="button"
                  onClick={() => setSubjectFilter(subj)}
                  className={`shrink-0 px-2.5 py-1 rounded-full text-[10.5px] font-bold border transition ${
                    subjectFilter === subj
                      ? "bg-white text-slate-950 border-white"
                      : "bg-[#0E0E12] text-slate-400 border-white/[0.06]"
                  }`}
                >
                  {subj === "ALL" ? "전체 과목" : subj}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 풀이 중일 때: 즉시 채점/일괄 채점 + 본문 접기 + 1..20 번호 네비 */}
        {activeSet && !loadingQuestions && questions.length > 0 && !showSummary && (
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-1.5">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setInstantGradeMode((v) => !v)}
                  className={`px-2 py-1 rounded-lg text-[10px] font-black border transition ${
                    instantGradeMode
                      ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/35"
                      : "bg-sky-500/15 text-sky-300 border-sky-500/35"
                  }`}
                >
                  {instantGradeMode ? "⚡ 1문제 즉시 채점" : "📝 20제 풀고 일괄 채점"}
                </button>
                <button
                  type="button"
                  onClick={() => setCompactQuestionMode((v) => !v)}
                  className="px-2 py-1 rounded-lg text-[10px] font-bold bg-[#0E0E12] text-slate-300 border border-white/[0.08] flex items-center gap-1"
                >
                  {compactQuestionMode ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                  <span>{compactQuestionMode ? "본문 펼치기" : "종이책 모드(본문접기)"}</span>
                </button>
              </div>
              <span className="text-[10.5px] font-mono text-[#FF7A59] font-bold">
                {savingId ? "저장중..." : `${currentIdx + 1}/${questions.length}`}
              </span>
            </div>

            {/* 1~20 미니 번호 스트립 */}
            <div className="flex items-center gap-1 overflow-x-auto pb-0.5 no-scrollbar">
              {questions.map((q, idx) => {
                const d = drafts[q.id];
                const isCurrent = idx === currentIdx;
                let pillClass = "bg-[#0E0E12] text-slate-400 border-white/[0.06]";
                if (d?.checked) {
                  pillClass =
                    d.isCorrect === true
                      ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                      : "bg-rose-500/20 text-rose-300 border-rose-500/40";
                } else if (d?.selectedOption !== null && d?.selectedOption !== undefined) {
                  pillClass = "bg-sky-500/20 text-sky-300 border-sky-500/40";
                }
                return (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => handleMoveQuestion(idx)}
                    className={`w-7 h-7 shrink-0 rounded-lg text-[10.5px] font-mono font-black border transition ${pillClass} ${
                      isCurrent ? "ring-2 ring-[#FF5A36] text-white" : ""
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </header>

      {/* 메인 콘텐츠 */}
      <div className="px-4 py-4 flex-1 flex flex-col space-y-4">
        {!activeSet ? (
          loadingSets ? (
            <div className="my-auto py-14 flex flex-col items-center justify-center gap-2 text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin text-[#FF5A36]" />
              <p className="text-xs font-bold">20제 세트 목록 불러오는 중...</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {filteredSets.map((s) => {
                const pct = s.questionCount > 0 ? Math.round((s.solvedCount / s.questionCount) * 100) : 0;
                return (
                  <button
                    key={s.setKey}
                    type="button"
                    onClick={() => handleOpenSet(s)}
                    className="w-full p-3.5 rounded-2xl bg-[#1A1A21] hover:bg-[#202029] border border-white/[0.08] text-left space-y-2 transition active:scale-[0.99]"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <BookOpen className="w-4 h-4 text-[#FF7A59] shrink-0" />
                        <span className="text-xs font-black text-white truncate">{s.title}</span>
                      </div>
                      <span className="text-[10.5px] font-mono font-black text-amber-300 shrink-0">
                        {s.solvedCount}/{s.questionCount}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[10.5px] text-slate-400">
                      <span>{s.subtitle}</span>
                      <span>{pct}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-[#0E0E12] overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#FF5A36] to-amber-400 transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          )
        ) : loadingQuestions ? (
          <div className="my-auto py-14 flex flex-col items-center justify-center gap-2 text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin text-[#FF5A36]" />
            <p className="text-xs font-bold">20문제 & 지문 이력 불러오는 중...</p>
          </div>
        ) : showSummary ? (
          <div className="p-6 rounded-3xl bg-[#1A1A21] border border-white/[0.08] text-center space-y-4 my-auto">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#FF5A36] to-amber-400 flex items-center justify-center mx-auto text-slate-950">
              <Sparkles className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h2 className="text-lg font-black text-white">20제 체크 완료!</h2>
              <p className="text-xs text-slate-400">{activeSet.title}</p>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-3 rounded-2xl bg-[#111116] border border-emerald-500/25">
                <div className="text-[10px] text-slate-400">정답</div>
                <div className="text-base font-black text-emerald-300 font-mono">
                  {summaryStats.correctCnt}
                </div>
              </div>
              <div className="p-3 rounded-2xl bg-[#111116] border border-rose-500/25">
                <div className="text-[10px] text-slate-400">오답</div>
                <div className="text-base font-black text-rose-300 font-mono">
                  {summaryStats.wrongCnt}
                </div>
              </div>
              <div className="p-3 rounded-2xl bg-[#111116] border border-amber-500/25">
                <div className="text-[10px] text-slate-400">★/X 약점지문</div>
                <div className="text-base font-black text-amber-300 font-mono">
                  {summaryStats.starOrXOptionCnt}
                </div>
              </div>
            </div>
            <div className="space-y-2 pt-2">
              <Link
                href="/study/ox?mode=weak"
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#FF5A36] to-[#FF8008] text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-lg"
              >
                <Zap className="w-4 h-4" />
                <span>체크한 ★/X 약점 지문 3초 O/X 복습하기</span>
              </Link>
              <button
                type="button"
                onClick={() => {
                  setShowSummary(false);
                  setCurrentIdx(0);
                }}
                className="w-full py-3 rounded-2xl bg-white/[0.06] text-slate-200 font-bold text-xs"
              >
                방금 푼 20문제 해설 다시 보기
              </button>
            </div>
          </div>
        ) : currentQ && currentDraft ? (
          <div className="space-y-3.5 flex-1 flex flex-col justify-between">
            <div className="space-y-3">
              {/* 문항 메타 & 개정 배지 */}
              <div className="p-4 rounded-2xl bg-[#1A1A21] border border-white/[0.08] space-y-2.5">
                <div className="flex items-center justify-between gap-1.5 flex-wrap">
                  <span className="text-[10.5px] font-black text-[#FF7A59]">
                    {currentQ.examYear}년 제{currentQ.examRound}회 ({currentQ.examStage}) · {currentQ.subject}{" "}
                    {currentQ.questionNumber}번
                  </span>
                  <div className="flex items-center gap-1">
                    {currentQ.lawStatus === "AMENDED_MODIFIED" && (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[9.5px] font-black flex items-center gap-1">
                        <BookCheck className="w-3 h-3" />
                        <span>현행법 개정 반영</span>
                      </span>
                    )}
                    {currentQ.lawStatus === "NEEDS_REVIEW" && (
                      <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[9.5px] font-black flex items-center gap-1">
                        <FileWarning className="w-3 h-3" />
                        <span>개정 확인 필요</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* 개정 안내 및 원문 비교 */}
                {(currentQ.lawStatus === "AMENDED_MODIFIED" || currentQ.lawStatus === "NEEDS_REVIEW") &&
                  currentQ.amendedNote && (
                    <div className="p-2.5 rounded-xl bg-black/30 border border-emerald-500/25 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10.5px] text-emerald-300 font-bold">{currentQ.amendedNote}</span>
                        {currentQ.originalSnapshot && (
                          <button
                            type="button"
                            onClick={() => setShowOriginalQ((v) => !v)}
                            className="shrink-0 text-[9.5px] px-2 py-0.5 rounded bg-white/[0.08] text-slate-200 font-bold"
                          >
                            {showOriginalQ ? "원문 닫기" : "원문 보기"}
                          </button>
                        )}
                      </div>
                      {showOriginalQ && currentQ.originalSnapshot && (
                        <div className="text-[10px] text-slate-400 pt-1 border-t border-white/[0.08] space-y-0.5">
                          <div>[기출 원문] {currentQ.originalSnapshot.question_text}</div>
                          {currentQ.originalSnapshot.subjective_answer && (
                            <div>[개정 전 정답] {currentQ.originalSnapshot.subjective_answer}</div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                {/* 문제 본문 (종이책 병행 시 접기 가능) */}
                {!compactQuestionMode ? (
                  <>
                    <p className="text-[13.5px] font-bold text-white leading-relaxed">{currentQ.questionText}</p>
                    {currentQ.boxContent && currentBoxItems.length < 2 && (
                      <div className="p-3 rounded-xl bg-[#101015] border border-white/[0.08] text-xs text-slate-200 whitespace-pre-wrap leading-relaxed">
                        {currentQ.boxContent}
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-[11px] text-slate-400 truncate">
                    [본문 접힘] {currentQ.questionText}
                  </p>
                )}
              </div>

              {/* <보기> ㄱ·ㄴ·ㄷ·ㄹ 개별 항목 O/★/X 이해도 체크 카드 (종이책 모드에서도 항상 표시) */}
              {currentQ.questionType === "OBJECTIVE" && currentBoxItems.length >= 2 && (
                <div className="p-3.5 rounded-2xl bg-[#16161D] border border-white/[0.09] space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-black text-amber-300">
                      &lt;보기&gt; 항목별 O / ★ / X 체크
                    </span>
                    <button
                      type="button"
                      onClick={handleMarkRemainingBoxAsO}
                      className="text-[10px] font-black px-2 py-0.5 rounded-lg bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/25"
                    >
                      ✓ 나머지 모두 O
                    </button>
                  </div>

                  <div className="space-y-1.5">
                    {currentBoxItems.map((item) => {
                      const bMark = currentDraft.boxMarks[item.label];
                      const inferredTruth = currentBoxCorrectness ? currentBoxCorrectness[item.label] : undefined;
                      return (
                        <div
                          key={item.label}
                          className="rounded-xl bg-[#101015] border border-white/[0.07] p-2.5 space-y-1.5"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-start gap-2 min-w-0 flex-1">
                              <span className="text-xs font-black text-amber-300 shrink-0 mt-0.5">
                                {item.label}.
                              </span>
                              <span className="text-xs font-medium text-slate-100 leading-relaxed">
                                {item.text}
                              </span>
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={() => handleToggleBoxItemMark(item.label, "O")}
                                className={`w-7 h-7 rounded-lg text-[10.5px] font-black border flex items-center justify-center transition ${
                                  bMark === "O"
                                    ? "bg-emerald-500 text-slate-950 border-emerald-400"
                                    : "bg-[#1A1A21] text-slate-400 border-white/[0.08]"
                                }`}
                                title="확실히 옳거나 해당됨 (O)"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleToggleBoxItemMark(item.label, "STAR")}
                                className={`w-7 h-7 rounded-lg text-[10.5px] font-black border flex items-center justify-center transition ${
                                  bMark === "STAR"
                                    ? "bg-amber-400 text-slate-950 border-amber-300"
                                    : "bg-[#1A1A21] text-slate-400 border-white/[0.08]"
                                }`}
                                title="헷갈리는 항목 (★)"
                              >
                                <Star className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleToggleBoxItemMark(item.label, "X")}
                                className={`w-7 h-7 rounded-lg text-[10.5px] font-black border flex items-center justify-center transition ${
                                  bMark === "X"
                                    ? "bg-rose-500 text-white border-rose-400"
                                    : "bg-[#1A1A21] text-slate-400 border-white/[0.08]"
                                }`}
                                title="틀렸거나 해당 안 됨 (X)"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {currentDraft.checked && typeof inferredTruth === "boolean" && (
                            <div className="pt-1 border-t border-white/[0.06] flex items-center justify-between text-[10px] font-bold">
                              <span className={inferredTruth ? "text-emerald-300" : "text-rose-300"}>
                                정답 판정: {inferredTruth ? "O (옳음/해당)" : "X (틀림/해당안함)"}
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 선지(지문) 리스트 또는 주관식 입력 */}
              {currentQ.questionType === "OBJECTIVE" ? (
                isBoxComboQuestion ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between px-1">
                      <span className="text-[10.5px] font-bold text-slate-400">
                        조합 정답 선택 (위 &lt;보기&gt; 체크 기반)
                      </span>
                      {suggestedComboOptionNumber !== null && !currentDraft.checked && (
                        <span className="text-[10px] font-black text-amber-300">
                          체크 일치: {OPTION_CIRCLES[suggestedComboOptionNumber - 1] ?? `${suggestedComboOptionNumber}번`}
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      {currentQ.options.map((opt) => {
                        const isSelected = currentDraft.selectedOption === opt.optionNumber;
                        const isAnswer = currentQ.correctOptions.includes(opt.optionNumber);
                        const isSuggested = !currentDraft.checked && suggestedComboOptionNumber === opt.optionNumber;

                        let comboStyle = "bg-[#1A1A21] border-white/[0.08]";
                        if (currentDraft.checked) {
                          if (isAnswer) comboStyle = "bg-emerald-950/40 border-emerald-500/60";
                          else if (isSelected && !isAnswer) comboStyle = "bg-rose-950/40 border-rose-500/60";
                        } else if (isSelected) {
                          comboStyle = "bg-[#241B19] border-[#FF5A36]";
                        } else if (isSuggested) {
                          comboStyle = "bg-amber-950/25 border-amber-400/50";
                        }

                        return (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() =>
                              updateCurrentDraft((prev) => ({
                                ...prev,
                                selectedOption: opt.optionNumber,
                              }))
                            }
                            className={`rounded-xl border px-3 py-2.5 flex items-center justify-between gap-2 text-left transition ${comboStyle}`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span
                                className={`text-sm font-black shrink-0 ${
                                  isSelected ? "text-[#FF5A36]" : "text-slate-300"
                                }`}
                              >
                                {OPTION_CIRCLES[opt.optionNumber - 1] ?? `${opt.optionNumber}.`}
                              </span>
                              <span className="text-xs font-bold text-slate-100 truncate">
                                {opt.optionText}
                              </span>
                            </div>

                            {currentDraft.checked && isAnswer && (
                              <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[9.5px] font-black shrink-0">
                                정답
                              </span>
                            )}
                            {isSuggested && !isSelected && (
                              <span className="px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-300 text-[9px] font-black shrink-0">
                                일치
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between px-1">
                      <span className="text-[10.5px] font-bold text-slate-400">
                        지문 터치 = 정답 선택 · 오른쪽 [O/★/X] = 이해도 체크
                      </span>
                      <button
                        type="button"
                        onClick={handleMarkRemainingAsO}
                        className="text-[10px] font-black px-2 py-0.5 rounded-lg bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/25"
                      >
                        ✓ 나머지 모두 O
                      </button>
                    </div>

                    {currentQ.options.map((opt) => {
                      const isSelected = currentDraft.selectedOption === opt.optionNumber;
                      const isAnswer = currentQ.correctOptions.includes(opt.optionNumber);
                      const optMark = currentDraft.optionMarks[opt.id];
                      const showRepeat = expandedRepeatOptId === opt.id;

                      let cardBorder = "bg-[#1A1A21] border-white/[0.08]";
                      if (currentDraft.checked) {
                        if (isAnswer) cardBorder = "bg-emerald-950/35 border-emerald-500/50";
                        else if (isSelected && !isAnswer) cardBorder = "bg-rose-950/35 border-rose-500/50";
                      } else if (isSelected) {
                        cardBorder = "bg-[#241B19] border-[#FF5A36]";
                      }

                      return (
                        <div key={opt.id} className={`rounded-2xl border p-3 space-y-2 transition ${cardBorder}`}>
                          <div className="flex items-start justify-between gap-2.5">
                            {/* 왼쪽: 정답 선택 클릭 영역 */}
                            <button
                              type="button"
                              onClick={() =>
                                updateCurrentDraft((prev) => ({
                                  ...prev,
                                  selectedOption: opt.optionNumber,
                                }))
                              }
                              className="flex-1 flex items-start gap-2 text-left"
                            >
                              <span
                                className={`text-sm font-black shrink-0 mt-0.5 ${
                                  isSelected ? "text-[#FF5A36]" : "text-slate-300"
                                }`}
                              >
                                {OPTION_CIRCLES[opt.optionNumber - 1] ?? `${opt.optionNumber}.`}
                              </span>
                              <span className="text-xs font-medium text-slate-100 leading-relaxed">
                                {opt.optionText}
                              </span>
                            </button>

                            {/* 오른쪽: 지문별 O / ★ / X 터치 */}
                            <div className="flex items-center gap-1 shrink-0 pt-0.5">
                              <button
                                type="button"
                                onClick={() => handleToggleOptionMark(opt.id, "O")}
                                className={`w-7 h-7 rounded-lg text-[10.5px] font-black border flex items-center justify-center transition ${
                                  optMark === "O"
                                    ? "bg-emerald-500 text-slate-950 border-emerald-400"
                                    : "bg-[#101015] text-slate-400 border-white/[0.08]"
                                }`}
                                title="확실히 아는 지문"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleToggleOptionMark(opt.id, "STAR")}
                                className={`w-7 h-7 rounded-lg text-[10.5px] font-black border flex items-center justify-center transition ${
                                  optMark === "STAR"
                                    ? "bg-amber-400 text-slate-950 border-amber-300"
                                    : "bg-[#101015] text-slate-400 border-white/[0.08]"
                                }`}
                                title="헷갈린 지문 (★)"
                              >
                                <Star className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleToggleOptionMark(opt.id, "X")}
                                className={`w-7 h-7 rounded-lg text-[10.5px] font-black border flex items-center justify-center transition ${
                                  optMark === "X"
                                    ? "bg-rose-500 text-white border-rose-400"
                                    : "bg-[#101015] text-slate-400 border-white/[0.08]"
                                }`}
                                title="모르는 지문 (X)"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* 채점 후: 지문 옳고 그름 + 반복 출제 연도 이력 토글 */}
                          {currentDraft.checked && (
                            <div className="pt-1.5 border-t border-white/[0.06] flex items-center justify-between gap-2 flex-wrap">
                              <div className="flex items-center gap-1.5 text-[10px] font-bold">
                                {isAnswer && (
                                  <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                                    정답 선지
                                  </span>
                                )}
                                <span className={opt.isCorrect ? "text-emerald-300" : "text-rose-300"}>
                                  지문 판정: {opt.isCorrect ? "O (옳음)" : "X (틀림)"}
                                </span>
                              </div>

                              <button
                                type="button"
                                onClick={() => setExpandedRepeatOptId(showRepeat ? null : opt.id)}
                                className={`px-2 py-0.5 rounded-full text-[9.5px] font-black border flex items-center gap-1 ${
                                  opt.repeatCount >= 2
                                    ? "bg-orange-500/20 text-orange-300 border-orange-500/40"
                                    : "bg-white/[0.05] text-slate-400 border-white/[0.08]"
                                }`}
                              >
                                {opt.repeatCount >= 2 ? (
                                  <>
                                    <Flame className="w-2.5 h-2.5" />
                                    <span>
                                      {opt.repeatCount}회 출제 ({getDistinctYearsLabel(opt.appearedCitations)})
                                    </span>
                                  </>
                                ) : (
                                  <>
                                    <History className="w-2.5 h-2.5" />
                                    <span>{currentQ.examYear}년 단일</span>
                                  </>
                                )}
                                {showRepeat ? <ChevronUp className="w-2.5 h-2.5" /> : <ChevronDown className="w-2.5 h-2.5" />}
                              </button>
                            </div>
                          )}

                          {currentDraft.checked && showRepeat && opt.appearedCitations.length > 0 && (
                            <div className="p-2 rounded-xl bg-[#0F0F14] border border-orange-500/25 space-y-1 text-[10px]">
                              {opt.appearedCitations.map((c, ci) => (
                                <div key={ci} className="text-slate-300 flex items-center justify-between gap-2">
                                  <span>
                                    {c.year}년 {c.round}회 {c.stage} {c.questionNumber}번 ({c.optionNumber}번)
                                  </span>
                                  <span className={c.isCorrect ? "text-emerald-300 font-bold" : "text-rose-300 font-bold"}>
                                    {c.isCorrect ? "O" : "X"}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )
              ) : (
                /* 주관식(단답형) 다중 빈칸(ㄱ·ㄴ·ㄷ) 입력 및 자체 O/★/X 평가 */
                <div className="p-4 rounded-2xl bg-[#1A1A21] border border-white/[0.08] space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <label className="text-xs font-black text-slate-300">
                      주관식 단답 입력 ({currentSubjectiveSlots.length}칸)
                    </label>
                    {currentDraft.checked && currentDraft.isCorrect !== null && (
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                          currentDraft.isCorrect
                            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                            : "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                        }`}
                      >
                        {currentDraft.isCorrect ? "✅ 정답" : "❌ 오답"}
                      </span>
                    )}
                  </div>

                  <div className="space-y-2">
                    {currentSubjectiveSlots.map((slot) => {
                      const slotVal = currentSubjectiveMap[slot.key] ?? "";
                      const slotOk = currentSubjectiveGrade?.slotCorrectness[slot.key];
                      let inputBorder = "border-white/[0.1] focus:border-[#FF5A36]";
                      if (currentDraft.checked && slotOk === true) {
                        inputBorder = "border-emerald-500/60 bg-emerald-950/20";
                      } else if (currentDraft.checked && slotOk === false) {
                        inputBorder = "border-rose-500/60 bg-rose-950/20";
                      }

                      return (
                        <div key={slot.key} className="flex items-center gap-2">
                          <span className="w-8 h-10 shrink-0 rounded-xl bg-[#101015] border border-white/[0.1] text-xs font-black text-[#FF7A59] flex items-center justify-center">
                            {slot.label}
                          </span>
                          <div className="relative flex-1">
                            <input
                              type="text"
                              value={slotVal}
                              onChange={(e) => {
                                const nextMap = {
                                  ...currentSubjectiveMap,
                                  [slot.key]: e.target.value,
                                };
                                const serialized = serializeSubjectiveMap(nextMap, currentSubjectiveSlots);
                                updateCurrentDraft((prev) => ({
                                  ...prev,
                                  subjectiveInput: serialized,
                                }));
                              }}
                              placeholder={
                                currentSubjectiveSlots.length > 1
                                  ? `(${slot.label}) 답 입력`
                                  : "답을 입력하거나 종이책 풀고 확인만 누르세요"
                              }
                              className={`w-full px-3.5 py-2.5 pr-12 rounded-xl bg-[#0E0E12] border text-sm text-white placeholder:text-slate-500 focus:outline-none ${inputBorder}`}
                            />
                            {currentDraft.checked && slotOk !== undefined && slotOk !== null && (
                              <span
                                className={`absolute right-3 top-1/2 -translate-y-1/2 text-[10.5px] font-black ${
                                  slotOk ? "text-emerald-300" : "text-rose-300"
                                }`}
                              >
                                {slotOk ? "✓ 일치" : "✕ 오답"}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {currentDraft.checked && currentQ.subjectiveAnswer && (
                    <div className="p-3 rounded-xl bg-emerald-950/35 border border-emerald-500/40 space-y-1">
                      <div className="text-[10.5px] text-emerald-300 font-black">공식(현행) 정답</div>
                      <div className="text-sm font-black text-white">{currentQ.subjectiveAnswer}</div>
                    </div>
                  )}
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] text-slate-400 font-bold">이 문제 자가 체크</span>
                    <div className="flex items-center gap-1.5">
                      {(["O", "STAR", "X"] as const).map((m) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() =>
                            updateCurrentDraft((prev) => ({ ...prev, questionMark: m }))
                          }
                          className={`px-2.5 py-1 rounded-lg text-xs font-black border ${
                            currentDraft.questionMark === m
                              ? "bg-[#FF5A36] text-white border-[#FF5A36]"
                              : "bg-[#0E0E12] text-slate-400 border-white/[0.08]"
                          }`}
                        >
                          {m === "O" ? "O 앎" : m === "STAR" ? "★ 헷갈림" : "X 모름"}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 하단 액션 바 (1문제 즉시 저장 + 이전/다음/채점) */}
            <div className="pt-2 space-y-2">
              {instantGradeMode && !currentDraft.checked && (
                <button
                  type="button"
                  onClick={handleCheckAndSaveCurrent}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#FF5A36] to-[#FF8008] text-white font-black text-sm shadow-lg active:scale-95 transition flex items-center justify-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>정답 확인 & 이 문제 저장</span>
                </button>
              )}

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  disabled={currentIdx === 0}
                  onClick={() => handleMoveQuestion(Math.max(0, currentIdx - 1))}
                  className="py-3 rounded-xl bg-[#1A1A21] border border-white/[0.08] text-xs font-bold text-slate-200 disabled:opacity-40 flex items-center justify-center gap-1"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>이전 문제</span>
                </button>

                {currentIdx + 1 < questions.length ? (
                  <button
                    type="button"
                    onClick={() => handleMoveQuestion(currentIdx + 1)}
                    className="py-3 rounded-xl bg-white text-slate-950 text-xs font-black flex items-center justify-center gap-1"
                  >
                    <span>저장 후 다음 ({currentIdx + 2}/{questions.length})</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleFinishAllSet}
                    className="py-3 rounded-xl bg-emerald-500 text-slate-950 text-xs font-black flex items-center justify-center gap-1"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>20제 최종 채점·완료</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </MobileAppShell>
  );
}
