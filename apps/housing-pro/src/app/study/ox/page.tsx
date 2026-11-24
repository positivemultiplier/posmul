"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  Check,
  ChevronRight,
  History,
  Loader2,
  Plus,
  RotateCw,
  Trash2,
  X,
} from "lucide-react";
import { MobileAppShell } from "@/components/mobile/mobile-app-shell";
import { useStudyAuth } from "@/components/auth/study-auth-provider";
import { grantAppStudyPmpAction } from "@/app/actions/study-economy.actions";
import {
  fetchExamOxCardsAction,
  fetchUserWeakOxCardsAction,
  promoteWeakOptionToOAction,
  recordOxOptionResultAction,
  type ExamOxCardItem,
} from "@/app/actions/exam-study.actions";
import {
  ConceptLinkedText,
  type KnowledgeTrailTarget,
} from "@/components/study/concept-linked-text";
import { ConceptTrailDrawer } from "@/components/study/concept-trail-drawer";
import {
  TheoryBottomSheet,
  type TheorySheetTarget,
} from "@/components/study/theory-bottom-sheet";
import { REAL_2026_EXAM_OX_CARDS } from "@/data/mock-exam-options";
import { getMutedSubjectColor } from "@/lib/study-theme";

type ReviewTab = "weak" | "frequent" | "custom";

interface CustomOxCard {
  id: string;
  statement: string;
  answer: boolean;
  note: string;
}

const CUSTOM_OX_STORAGE_KEY = "housing_pro_custom_ox_v1";

const SUBJECT_FILTERS = [
  { key: "ALL", label: "전체" },
  { key: "민법", label: "민법" },
  { key: "회계원리", label: "회계" },
  { key: "공동주택시설개론", label: "시설" },
  { key: "주택관리관계법규", label: "법규" },
  { key: "공동주택관리실무", label: "실무" },
] as const;

function getDistinctYearsLabel(card: ExamOxCardItem): string {
  const years = Array.from(new Set(card.appearedCitations.map((c) => c.year))).sort((a, b) => a - b);
  if (years.length === 0) return `'${String(card.examYear).slice(-2)}`;
  return years.map((y) => `'${String(y).slice(-2)}`).join(", ");
}

function fallbackMockCards(): ExamOxCardItem[] {
  return REAL_2026_EXAM_OX_CARDS.slice(0, 20).map((card) => ({
    id: card.id,
    questionId: card.id,
    examYear: card.examYear,
    examRound: card.examRound,
    examStage: "1차",
    subject: card.subject,
    chapterTitle: null,
    importanceTier: "S",
    questionNumber: card.questionNumber,
    questionText: "",
    optionNumber: card.optionNumber,
    statement: card.statement,
    isCorrectStatement: card.isCorrectStatement,
    masteryTier: card.masteryTier,
    trapCorrection: card.trapCorrection ?? null,
    citation: card.citation ?? null,
    repeatCount: 1,
    appearedCitations: [],
    lawStatus: "VALID",
    amendedNote: null,
    isAmendedOption: false,
    originalOptionText: null,
    originalQuestionSnapshot: null,
  }));
}

export default function StudyReviewOxPage() {
  const { effectiveOwnerKey, setLocalPmpBalance } = useStudyAuth();

  const [tab, setTab] = useState<ReviewTab>("weak");
  const [subjectFilter, setSubjectFilter] = useState<string>("ALL");
  const [onlyRepeated, setOnlyRepeated] = useState<boolean>(true);
  const [onlyAmended, setOnlyAmended] = useState<boolean>(false);

  const [cards, setCards] = useState<ExamOxCardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<boolean | null>(null);
  const [correctStreak, setCorrectStreak] = useState(0);

  // 반복 출제 이력 · 개정 원문 · 이론 시트 · 반대어/개념 꼬리물기 드로어
  const [showRepeatHistory, setShowRepeatHistory] = useState(false);
  const [showOriginalText, setShowOriginalText] = useState(false);
  const [theoryTarget, setTheoryTarget] = useState<TheorySheetTarget | null>(null);
  const [knowledgeTarget, setKnowledgeTarget] = useState<KnowledgeTrailTarget | null>(null);

  // 나만의 1줄 O/X 암기장
  const [customCards, setCustomCards] = useState<CustomOxCard[]>([]);
  const [customStatement, setCustomStatement] = useState("");
  const [customAnswer, setCustomAnswer] = useState<boolean>(true);
  const [customNote, setCustomNote] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("mode") === "frequent") setTab("frequent");
    else if (params.get("mode") === "amended") {
      setTab("frequent");
      setOnlyAmended(true);
      setOnlyRepeated(false);
    } else if (params.get("mode") === "custom") {
      setTab("custom");
    }

    try {
      const raw = window.localStorage.getItem(CUSTOM_OX_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setCustomCards(parsed as CustomOxCard[]);
      }
    } catch {
      // 스토리지 오류 무시
    }
  }, []);

  const loadCards = useCallback(async () => {
    if (tab === "custom") {
      setLoading(false);
      return;
    }
    setLoading(true);
    setIndex(0);
    setPicked(null);
    setShowRepeatHistory(false);
    setShowOriginalText(false);

    try {
      if (tab === "weak") {
        const res = await fetchUserWeakOxCardsAction(effectiveOwnerKey);
        const list = res.success ? res.cards : [];
        setCards(
          subjectFilter === "ALL" ? list : list.filter((c) => c.subject === subjectFilter)
        );
      } else {
        const freq = await fetchExamOxCardsAction({
          subject: subjectFilter,
          maxTier: onlyAmended ? 5 : 3,
          onlyRepeated: !onlyAmended && onlyRepeated,
          onlyAmended,
          offset: 0,
          limit: 30,
        });
        setCards(freq.success && freq.cards.length > 0 ? freq.cards : fallbackMockCards());
      }
    } catch {
      setCards(tab === "weak" ? [] : fallbackMockCards());
    } finally {
      setLoading(false);
    }
  }, [tab, subjectFilter, onlyRepeated, onlyAmended, effectiveOwnerKey]);

  useEffect(() => {
    void loadCards();
  }, [loadCards]);

  const activeDeck = useMemo<ExamOxCardItem[]>(() => {
    if (tab !== "custom") return cards;
    return customCards.map((c, idx) => ({
      id: c.id,
      questionId: c.id,
      examYear: 2026,
      examRound: 29,
      examStage: "개인",
      subject: "내 암기장",
      chapterTitle: null,
      importanceTier: "S",
      questionNumber: idx + 1,
      questionText: "",
      optionNumber: 1,
      statement: c.statement,
      isCorrectStatement: c.answer,
      masteryTier: 1,
      trapCorrection: c.note || null,
      citation: null,
      repeatCount: 1,
      appearedCitations: [],
      lawStatus: "VALID",
      amendedNote: null,
      isAmendedOption: false,
      originalOptionText: null,
      originalQuestionSnapshot: null,
    }));
  }, [tab, cards, customCards]);

  const currentCard = activeDeck[index];

  // 0ms 즉시 로컬 채점 + 백그라운드 DB/PMP 동기화
  const handleJudge = (choice: boolean) => {
    if (!currentCard || picked !== null) return;
    setPicked(choice);
    const isCorrect = choice === currentCard.isCorrectStatement;
    setCorrectStreak((prev) => (isCorrect ? prev + 1 : 0));

    if (tab !== "custom") {
      void recordOxOptionResultAction({
        clientKey: effectiveOwnerKey,
        questionId: currentCard.questionId,
        optionId: currentCard.id,
        isRight: isCorrect,
      }).catch(() => {
        // 무시
      });

      if (isCorrect && tab === "weak") {
        void promoteWeakOptionToOAction(effectiveOwnerKey, currentCard.id).catch(() => {
          // 무시
        });
      }

      if (isCorrect) {
        void grantAppStudyPmpAction({ kind: "OX" })
          .then((res) => {
            if (res.success && typeof res.newBalance === "number") {
              setLocalPmpBalance(res.newBalance);
            }
          })
          .catch(() => {
            // 무시
          });
      }
    }
  };

  const handleNext = () => {
    setPicked(null);
    setShowRepeatHistory(false);
    setShowOriginalText(false);
    setIndex((i) => i + 1);
  };

  const handleAddCustomCard = () => {
    const stmt = customStatement.trim();
    if (!stmt) return;
    const nextList: CustomOxCard[] = [
      {
        id: `custom-ox-${Date.now()}`,
        statement: stmt,
        answer: customAnswer,
        note: customNote.trim(),
      },
      ...customCards,
    ];
    setCustomCards(nextList);
    setCustomStatement("");
    setCustomNote("");
    try {
      window.localStorage.setItem(CUSTOM_OX_STORAGE_KEY, JSON.stringify(nextList));
    } catch {
      // 무시
    }
  };

  const handleDeleteCustomCard = (id: string) => {
    const nextList = customCards.filter((c) => c.id !== id);
    setCustomCards(nextList);
    setIndex(0);
    setPicked(null);
    try {
      window.localStorage.setItem(CUSTOM_OX_STORAGE_KEY, JSON.stringify(nextList));
    } catch {
      // 무시
    }
  };

  const isCorrectPicked =
    currentCard && picked !== null ? picked === currentCard.isCorrectStatement : null;

  return (
    <MobileAppShell>
      {/* 상단 3모드 + 과목/빈출/개정 필터 */}
      <div className="px-4 py-3 border-b border-[var(--hp-border)] bg-[var(--hp-bg)] space-y-2.5">
        <div className="grid grid-cols-3 gap-1 p-0.5 rounded-lg bg-[var(--hp-surface)] border border-[var(--hp-border)]">
          {(
            [
              { id: "weak", label: "약점 O/X" },
              { id: "frequent", label: "빈출 O/X" },
              { id: "custom", label: "내 암기장" },
            ] as const
          ).map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setTab(item.id);
                setIndex(0);
                setPicked(null);
              }}
              className={`py-1.5 rounded-md text-xs font-medium transition ${
                tab === item.id
                  ? "bg-[var(--hp-accent)] text-[var(--hp-accent-fg)]"
                  : "text-[var(--hp-text-2)] hover:text-[var(--hp-text)]"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {tab !== "custom" && (
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
              {SUBJECT_FILTERS.map((f) => {
                const active = subjectFilter === f.key;
                const dot = f.key === "ALL" ? null : getMutedSubjectColor(f.key);
                return (
                  <button
                    key={f.key}
                    type="button"
                    onClick={() => setSubjectFilter(f.key)}
                    className={`px-2 py-1 rounded text-[11px] flex items-center gap-1 whitespace-nowrap border ${
                      active
                        ? "bg-[var(--hp-surface-2)] border-[var(--hp-border-strong)] text-[var(--hp-text)] font-medium"
                        : "border-transparent text-[var(--hp-text-3)]"
                    }`}
                  >
                    {dot && (
                      <span
                        className="w-1.5 h-1.5 rounded-full shrink-0"
                        style={{ backgroundColor: dot }}
                      />
                    )}
                    <span>{f.label}</span>
                  </button>
                );
              })}
            </div>

            {tab === "frequent" && (
              <div className="flex items-center gap-1 shrink-0 text-[10.5px]">
                <button
                  type="button"
                  onClick={() => {
                    setOnlyRepeated((p) => !p);
                    setOnlyAmended(false);
                  }}
                  className={`px-2 py-1 rounded border ${
                    onlyRepeated && !onlyAmended
                      ? "bg-[var(--hp-surface-2)] border-[var(--hp-border-strong)] text-[var(--hp-text)]"
                      : "border-[var(--hp-border)] text-[var(--hp-text-3)]"
                  }`}
                >
                  반복출제
                </button>
                <button
                  type="button"
                  onClick={() => setOnlyAmended((p) => !p)}
                  className={`px-2 py-1 rounded border ${
                    onlyAmended
                      ? "bg-[var(--hp-surface-2)] border-[var(--hp-border-strong)] text-[var(--hp-success)]"
                      : "border-[var(--hp-border)] text-[var(--hp-text-3)]"
                  }`}
                >
                  개정법령
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="px-4 py-5 space-y-5 flex-1 flex flex-col">
        {/* 내 암기장 1줄 추가 입력 */}
        {tab === "custom" && (
          <div className="p-3.5 rounded-xl bg-[var(--hp-surface)] border border-[var(--hp-border)] space-y-2.5">
            <input
              type="text"
              value={customStatement}
              onChange={(e) => setCustomStatement(e.target.value)}
              placeholder="직접 외울 O/X 지문 1줄 입력..."
              className="w-full h-9 px-3 rounded-lg bg-[var(--hp-bg)] border border-[var(--hp-border)] text-xs text-[var(--hp-text)] placeholder:text-[var(--hp-text-3)] outline-none"
            />
            <input
              type="text"
              value={customNote}
              onChange={(e) => setCustomNote(e.target.value)}
              placeholder="해설 메모 (선택)"
              className="w-full h-9 px-3 rounded-lg bg-[var(--hp-bg)] border border-[var(--hp-border)] text-xs text-[var(--hp-text)] placeholder:text-[var(--hp-text-3)] outline-none"
            />
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setCustomAnswer(true)}
                  className={`px-3 py-1 rounded-md text-xs border ${
                    customAnswer
                      ? "bg-[var(--hp-accent)] text-[var(--hp-accent-fg)] border-transparent font-medium"
                      : "border-[var(--hp-border)] text-[var(--hp-text-2)]"
                  }`}
                >
                  정답 O
                </button>
                <button
                  type="button"
                  onClick={() => setCustomAnswer(false)}
                  className={`px-3 py-1 rounded-md text-xs border ${
                    !customAnswer
                      ? "bg-[var(--hp-accent)] text-[var(--hp-accent-fg)] border-transparent font-medium"
                      : "border-[var(--hp-border)] text-[var(--hp-text-2)]"
                  }`}
                >
                  정답 X
                </button>
              </div>
              <button
                type="button"
                onClick={handleAddCustomCard}
                disabled={!customStatement.trim()}
                className="h-8 px-3 rounded-lg bg-[var(--hp-accent)] text-[var(--hp-accent-fg)] text-xs font-medium disabled:opacity-40 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2]" />
                <span>카드 추가</span>
              </button>
            </div>
          </div>
        )}

        {/* O/X 플래시카드 영역 */}
        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center gap-2 text-xs text-[var(--hp-text-3)]">
            <Loader2 className="w-5 h-5 animate-spin stroke-[1.5]" />
            <span>복습 카드 불러오는 중...</span>
          </div>
        ) : !currentCard ? (
          <div className="py-12 px-4 rounded-xl bg-[var(--hp-surface)] border border-[var(--hp-border)] text-center space-y-3">
            <div className="text-sm font-medium text-[var(--hp-text)]">
              {activeDeck.length === 0
                ? tab === "weak"
                  ? "아직 문제 풀이에서 ★ 또는 X로 체크한 약점 보기가 없습니다."
                  : "등록된 복습 카드가 없습니다."
                : "이번 복습 세트를 모두 완료했습니다."}
            </div>
            {activeDeck.length === 0 && tab === "weak" && (
              <div className="flex items-center justify-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setTab("frequent");
                    setIndex(0);
                    setPicked(null);
                  }}
                  className="px-3.5 py-2 rounded-lg bg-[var(--hp-accent)] text-[var(--hp-accent-fg)] text-xs font-medium"
                >
                  빈출 O/X 바로 풀기
                </button>
                <Link
                  href="/study/solve"
                  className="px-3.5 py-2 rounded-lg border border-[var(--hp-border-strong)] text-xs text-[var(--hp-text)]"
                >
                  기출 문제 풀기
                </Link>
              </div>
            )}
            {activeDeck.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setIndex(0);
                  setPicked(null);
                }}
                className="px-4 py-2 rounded-lg bg-[var(--hp-accent)] text-[var(--hp-accent-fg)] text-xs font-medium inline-flex items-center gap-1.5"
              >
                <RotateCw className="w-3.5 h-3.5 stroke-[1.75]" />
                <span>처음부터 다시 훑기</span>
              </button>
            )}
          </div>
        ) : (
          <div className="flex-1 flex flex-col justify-between gap-5">
            <div className="space-y-3">
              {/* 메타 바 */}
              <div className="flex items-center justify-between text-[11px] hp-tabular text-[var(--hp-text-3)]">
                <span>
                  {currentCard.subject} · {currentCard.examYear}년
                  {currentCard.repeatCount >= 2
                    ? ` · ${currentCard.repeatCount}회 출제 (${getDistinctYearsLabel(currentCard)})`
                    : ""}
                </span>
                <span>
                  {index + 1}/{activeDeck.length}
                  {correctStreak >= 2 ? ` · ${correctStreak}연속` : ""}
                </span>
              </div>

              {/* 메인 카드 (채점 후 반대어·개념 꼬리물기 활성화) */}
              <div className="p-5 rounded-2xl bg-[var(--hp-surface)] border border-[var(--hp-border-strong)] min-h-[200px] flex flex-col justify-between gap-4">
                <p className="text-[15px] leading-relaxed font-medium text-[var(--hp-text)]">
                  <ConceptLinkedText
                    text={currentCard.statement}
                    contextText={`${currentCard.subject} ${currentCard.questionText} ${currentCard.statement}`}
                    enabled={picked !== null}
                    onSelectTarget={setKnowledgeTarget}
                  />
                </p>

                <div className="flex items-center justify-between gap-2 text-[11px] text-[var(--hp-text-3)] flex-wrap">
                  <span>{currentCard.citation || "핵심 기출 지문"}</span>
                  <div className="flex items-center gap-2">
                    {picked !== null && tab !== "custom" && (
                      <>
                        {currentCard.appearedCitations.length > 0 && (
                          <button
                            type="button"
                            onClick={() => setShowRepeatHistory((p) => !p)}
                            className="flex items-center gap-1 text-[var(--hp-text-2)] hover:text-[var(--hp-text)]"
                          >
                            <History className="w-3 h-3 stroke-[1.5]" />
                            <span>출제이력</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() =>
                            setTheoryTarget({
                              subject: currentCard.subject,
                              detailCode: currentCard.detailCode,
                              sectionCode: currentCard.theorySectionCode,
                              chapterTitle: currentCard.chapterTitle,
                              statement: currentCard.statement,
                              isCorrectStatement: currentCard.isCorrectStatement,
                              citation: currentCard.citation,
                              trapSummary: currentCard.trapCorrection,
                            })
                          }
                          className="flex items-center gap-1 text-[var(--hp-text-2)] hover:text-[var(--hp-text)]"
                        >
                          <BookOpen className="w-3 h-3 stroke-[1.5]" />
                          <span>이론</span>
                        </button>
                      </>
                    )}
                    {tab === "custom" && (
                      <button
                        type="button"
                        onClick={() => handleDeleteCustomCard(currentCard.id)}
                        className="text-[var(--hp-text-3)] hover:text-[var(--hp-danger)] flex items-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5 stroke-[1.5]" />
                        <span>삭제</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* 0ms 즉시 판정 해설 + 개정 원문 + 반복 출제 이력 */}
              {picked !== null && (
                <div className="p-4 rounded-xl bg-[var(--hp-surface)] border border-[var(--hp-border)] space-y-2 text-xs">
                  <div
                    className={`font-semibold ${
                      isCorrectPicked ? "text-[var(--hp-success)]" : "text-[var(--hp-danger)]"
                    }`}
                  >
                    {isCorrectPicked ? "정답" : "오답"} · 정해:{" "}
                    {currentCard.isCorrectStatement ? "O (옳음)" : "X (틀림)"}
                  </div>
                  <p className="leading-relaxed text-[var(--hp-text-2)]">
                    <ConceptLinkedText
                      text={
                        currentCard.trapCorrection ||
                        currentCard.amendedNote ||
                        (currentCard.isCorrectStatement
                          ? "법령 및 판례에 부합하는 옳은 지문입니다."
                          : "함정 키워드에 주의해야 하는 틀린 지문입니다.")
                      }
                      contextText={`${currentCard.subject} ${currentCard.statement}`}
                      enabled
                      onSelectTarget={setKnowledgeTarget}
                    />
                  </p>

                  {currentCard.originalOptionText && (
                    <div className="pt-1.5 border-t border-[var(--hp-border)]">
                      <button
                        type="button"
                        onClick={() => setShowOriginalText((p) => !p)}
                        className="text-[11px] text-[var(--hp-text-2)] underline"
                      >
                        {showOriginalText ? "개정 전 원문 접기" : "개정 전 원문 보기"}
                      </button>
                      {showOriginalText && (
                        <p className="mt-1 text-[11px] text-[var(--hp-text-3)]">
                          {currentCard.originalOptionText}
                        </p>
                      )}
                    </div>
                  )}

                  {showRepeatHistory && currentCard.appearedCitations.length > 0 && (
                    <div className="pt-2 border-t border-[var(--hp-border)] space-y-1.5">
                      <div className="text-[11px] font-medium text-[var(--hp-text-2)]">
                        역대 반복 출제 이력
                      </div>
                      {currentCard.appearedCitations.map((c, ci) => (
                        <div key={ci} className="text-[11px] text-[var(--hp-text-3)] space-y-0.5">
                          <div className="hp-tabular">
                            {c.year}년 제{c.round}회 {c.subject} {c.questionNumber}번 (
                            {c.isCorrect ? "O" : "X"})
                          </div>
                          <div className="text-[var(--hp-text-2)]">{c.optionText}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 하단 O / X 판정 또는 다음 카드 */}
            {picked === null ? (
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleJudge(true)}
                  className="h-14 rounded-xl bg-[var(--hp-surface)] hover:bg-[var(--hp-surface-2)] border border-[var(--hp-border-strong)] text-sm font-semibold flex items-center justify-center gap-2 transition"
                >
                  <Check className="w-4 h-4 stroke-[2]" />
                  <span>O (옳음)</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleJudge(false)}
                  className="h-14 rounded-xl bg-[var(--hp-surface)] hover:bg-[var(--hp-surface-2)] border border-[var(--hp-border-strong)] text-sm font-semibold flex items-center justify-center gap-2 transition"
                >
                  <X className="w-4 h-4 stroke-[2]" />
                  <span>X (틀림)</span>
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleNext}
                className="w-full h-12 rounded-xl bg-[var(--hp-accent)] text-[var(--hp-accent-fg)] text-sm font-semibold flex items-center justify-center gap-1.5 hover:opacity-90 transition"
              >
                <span>다음 카드</span>
                <ChevronRight className="w-4 h-4 stroke-[2]" />
              </button>
            )}
          </div>
        )}
      </div>

      <TheoryBottomSheet target={theoryTarget} onClose={() => setTheoryTarget(null)} />
      <ConceptTrailDrawer
        initialTarget={knowledgeTarget}
        onClose={() => setKnowledgeTarget(null)}
      />
    </MobileAppShell>
  );
}
