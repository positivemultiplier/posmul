"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Check, ChevronRight, Loader2, Plus, RotateCw, Trash2, X } from "lucide-react";
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
import { REAL_2026_EXAM_OX_CARDS } from "@/data/mock-exam-options";

type ReviewTab = "weak" | "frequent" | "custom";

interface CustomOxCard {
  id: string;
  statement: string;
  answer: boolean;
  note: string;
}

const CUSTOM_OX_STORAGE_KEY = "housing_pro_custom_ox_v1";

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
  const [cards, setCards] = useState<ExamOxCardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<boolean | null>(null);
  const [correctStreak, setCorrectStreak] = useState(0);

  // 나만의 1줄 O/X 암기장 (로컬 즉시 저장)
  const [customCards, setCustomCards] = useState<CustomOxCard[]>([]);
  const [customStatement, setCustomStatement] = useState("");
  const [customAnswer, setCustomAnswer] = useState<boolean>(true);
  const [customNote, setCustomNote] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("mode") === "frequent") setTab("frequent");
    else if (params.get("mode") === "custom") setTab("custom");

    try {
      const raw = window.localStorage.getItem(CUSTOM_OX_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setCustomCards(parsed as CustomOxCard[]);
      }
    } catch {
      // ignore storage error
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

    try {
      if (tab === "weak") {
        const res = await fetchUserWeakOxCardsAction(effectiveOwnerKey);
        if (res.success && res.cards.length > 0) {
          setCards(res.cards);
        } else {
          // 약점 선지가 아직 없으면 빈출 핵심 O/X 20제로 자동 이어주기
          const freq = await fetchExamOxCardsAction({
            subject: "ALL",
            maxTier: 2,
            onlyRepeated: true,
            offset: 0,
            limit: 20,
          });
          setCards(freq.success && freq.cards.length > 0 ? freq.cards : fallbackMockCards());
        }
      } else {
        const freq = await fetchExamOxCardsAction({
          subject: "ALL",
          maxTier: 3,
          onlyRepeated: true,
          offset: 0,
          limit: 24,
        });
        setCards(freq.success && freq.cards.length > 0 ? freq.cards : fallbackMockCards());
      }
    } catch {
      setCards(fallbackMockCards());
    } finally {
      setLoading(false);
    }
  }, [tab, effectiveOwnerKey]);

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
        // 비동기 기록 오류 무시
      });

      if (isCorrect && tab === "weak") {
        void promoteWeakOptionToOAction(effectiveOwnerKey, currentCard.id).catch(() => {
          // 비동기 승급 오류 무시
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
            // 비동기 적립 오류 무시
          });
      }
    }
  };

  const handleNext = () => {
    setPicked(null);
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
      // ignore
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
      // ignore
    }
  };

  const isCorrectPicked =
    currentCard && picked !== null ? picked === currentCard.isCorrectStatement : null;

  return (
    <MobileAppShell>
      {/* 상단 3모드 세그먼트 */}
      <div className="px-4 py-3 border-b border-[var(--hp-border)] bg-[var(--hp-bg)]">
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
          <div className="py-14 px-4 rounded-xl bg-[var(--hp-surface)] border border-[var(--hp-border)] text-center space-y-3">
            <div className="text-sm font-medium text-[var(--hp-text)]">
              {activeDeck.length === 0
                ? "등록된 복습 카드가 없습니다."
                : "이번 복습 세트를 모두 완료했습니다."}
            </div>
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
                </span>
                <span>
                  {index + 1}/{activeDeck.length}
                  {correctStreak >= 2 ? ` · ${correctStreak}연속 정답` : ""}
                </span>
              </div>

              {/* 메인 카드 */}
              <div className="p-6 rounded-2xl bg-[var(--hp-surface)] border border-[var(--hp-border-strong)] min-h-[210px] flex flex-col justify-between gap-4">
                <p className="text-[16px] leading-relaxed font-medium text-[var(--hp-text)]">
                  {currentCard.statement}
                </p>

                <div className="flex items-center justify-between text-[11px] text-[var(--hp-text-3)]">
                  <span>{currentCard.citation || "핵심 기출 지문"}</span>
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

              {/* 0ms 즉시 판정 해설 */}
              {picked !== null && (
                <div className="p-4 rounded-xl bg-[var(--hp-surface)] border border-[var(--hp-border)] space-y-1.5">
                  <div
                    className={`text-xs font-semibold ${
                      isCorrectPicked ? "text-[var(--hp-success)]" : "text-[var(--hp-danger)]"
                    }`}
                  >
                    {isCorrectPicked ? "정답" : "오답"} · 정해:{" "}
                    {currentCard.isCorrectStatement ? "O (옳음)" : "X (틀림)"}
                  </div>
                  <p className="text-xs leading-relaxed text-[var(--hp-text-2)]">
                    {currentCard.trapCorrection ||
                      currentCard.amendedNote ||
                      (currentCard.isCorrectStatement
                        ? "법령 및 판례에 부합하는 옳은 지문입니다."
                        : "함정 키워드에 주의해야 하는 틀린 지문입니다.")}
                  </p>
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
    </MobileAppShell>
  );
}
