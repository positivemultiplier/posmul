"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  X,
  Sparkles,
  ArrowRight,
  Trophy,
  Lock,
  KeyRound,
  Zap,
  Camera,
  Star,
  Flame,
  Calendar,
  ChevronDown,
  ChevronUp,
  FileWarning,
  History,
  BookCheck,
  Loader2,
} from "lucide-react";
import { MobileAppShell } from "@/components/mobile/mobile-app-shell";
import { REAL_2026_EXAM_OX_CARDS } from "@/data/mock-exam-options";
import { SerialRegisterModal } from "@/components/auth/serial-register-modal";
import { TierLockBanner } from "@/components/study/tier-lock-banner";
import { getUserSerialStatusAction } from "@/app/actions/serial.actions";
import {
  fetchExamOxCardsAction,
  fetchLawAmendedQuestionsAction,
  type ExamOxCardItem,
  type AmendedQuestionPreviewItem,
  type LawStatus,
} from "@/app/actions/exam-study.actions";

const SUBJECT_FILTERS = [
  { key: "ALL", label: "전체 과목" },
  { key: "민법", label: "민법(1차)" },
  { key: "회계원리", label: "회계(1차)" },
  { key: "공동주택시설개론", label: "시설개론(1차)" },
  { key: "주택관리관계법규", label: "관계법규(2차)" },
  { key: "공동주택관리실무", label: "관리실무(2차)" },
] as const;

function mapMockToOxItem(card: (typeof REAL_2026_EXAM_OX_CARDS)[number]): ExamOxCardItem {
  const shortYear = card.examYear;
  return {
    id: card.id,
    questionId: card.id,
    examYear: shortYear,
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
    appearedCitations: [
      {
        year: shortYear,
        round: card.examRound,
        stage: "1차",
        subject: card.subject,
        questionNumber: card.questionNumber,
        optionNumber: card.optionNumber,
        isCorrect: card.isCorrectStatement,
        optionText: card.statement,
      },
    ],
    lawStatus: "VALID",
    amendedNote: null,
    isAmendedOption: false,
    originalOptionText: null,
    originalQuestionSnapshot: null,
  };
}

function getDistinctYearsLabel(card: ExamOxCardItem): string {
  const years = Array.from(new Set(card.appearedCitations.map((c) => c.year))).sort((a, b) => a - b);
  if (years.length === 0) return `'${String(card.examYear).slice(-2)}`;
  return years.map((y) => `'${String(y).slice(-2)}`).join(", ");
}

function LawStatusBadge({ status, isAmendedOption }: { status: LawStatus; isAmendedOption: boolean }) {
  if (status === "AMENDED_MODIFIED" || isAmendedOption) {
    return (
      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-black flex items-center gap-1">
        <BookCheck className="w-3 h-3" />
        <span>현행법 개정 반영</span>
      </span>
    );
  }
  if (status === "NEEDS_REVIEW") {
    return (
      <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-black flex items-center gap-1">
        <FileWarning className="w-3 h-3" />
        <span>개정 확인 필요</span>
      </span>
    );
  }
  return null;
}

export default function OxSwipeStudyPage() {
  const [selectedTier, setSelectedTier] = useState<number>(1);
  const [selectedSubject, setSelectedSubject] = useState<string>("ALL");
  const [onlyRepeated, setOnlyRepeated] = useState<boolean>(false);
  const [isScanWeakMode, setIsScanWeakMode] = useState(false);
  const [scannedWeakIds, setScannedWeakIds] = useState<string[]>([]);
  const [scannedMarkMap, setScannedMarkMap] = useState<Record<string, "O" | "STAR" | "X">>({});

  const [dbCards, setDbCards] = useState<ExamOxCardItem[]>([]);
  const [totalMatchedCount, setTotalMatchedCount] = useState<number>(0);
  const [isLoadingCards, setIsLoadingCards] = useState<boolean>(true);
  const [usingFallbackMock, setUsingFallbackMock] = useState<boolean>(false);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answered, setAnswered] = useState<boolean | null>(null);
  const [userSelected, setUserSelected] = useState<boolean | null>(null);
  const [earnedPmpTotal, setEarnedPmpTotal] = useState(0);

  // 반복 출제 이력 & 원문 보기 토글
  const [showRepeatHistory, setShowRepeatHistory] = useState(false);
  const [showOriginalText, setShowOriginalText] = useState(false);

  // 개정·검수 문항 뷰어 패널
  const [isAmendedPanelOpen, setIsAmendedPanelOpen] = useState(false);
  const [amendedItems, setAmendedItems] = useState<AmendedQuestionPreviewItem[]>([]);
  const [isLoadingAmended, setIsLoadingAmended] = useState(false);
  const [expandedAmendedId, setExpandedAmendedId] = useState<string | null>(null);

  // 정품 시리얼 인증 상태
  const [isSerialVerified, setIsSerialVerified] = useState(false);
  const [isSerialModalOpen, setIsSerialModalOpen] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const searchParams = new URLSearchParams(window.location.search);
      const tierParam = Number(searchParams.get("tier"));
      if (tierParam >= 1 && tierParam <= 5) {
        setSelectedTier(tierParam);
      }

      const cached = localStorage.getItem("housing_pro_serial_auth");
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (parsed.serialCode) {
            setIsSerialVerified(true);
          }
        } catch (e) {
          console.error(e);
        }
      }

      const scanSession = localStorage.getItem("housing_pro_scanned_ox_session");
      if (scanSession) {
        try {
          const parsedSession = JSON.parse(scanSession);
          if (Array.isArray(parsedSession.weakCardIds) && parsedSession.weakCardIds.length > 0) {
            setScannedWeakIds(parsedSession.weakCardIds);
            setScannedMarkMap(parsedSession.markMap || {});
            if (window.location.search.includes("mode=scan")) {
              setIsScanWeakMode(true);
            }
          }
        } catch (e) {
          console.error(e);
        }
      }
    }

    getUserSerialStatusAction("user-demo-housing-1").then((res) => {
      if (res.isRegistered) {
        setIsSerialVerified(true);
      }
    });
  }, []);

  const loadDbCards = useCallback(async () => {
    setIsLoadingCards(true);
    const res = await fetchExamOxCardsAction({
      subject: selectedSubject,
      maxTier: selectedTier,
      onlyRepeated: onlyRepeated || selectedTier === 1,
      limit: 60,
    });

    if (res.success && res.cards.length > 0) {
      setDbCards(res.cards);
      setTotalMatchedCount(res.totalMatched);
      setUsingFallbackMock(false);
    } else if (!res.success) {
      // DB 미연결 환경 폴백
      const mockItems = REAL_2026_EXAM_OX_CARDS.filter((c) => c.masteryTier <= selectedTier).map(mapMockToOxItem);
      setDbCards(mockItems);
      setTotalMatchedCount(mockItems.length);
      setUsingFallbackMock(true);
    } else {
      setDbCards([]);
      setTotalMatchedCount(0);
      setUsingFallbackMock(false);
    }
    setIsLoadingCards(false);
  }, [selectedSubject, selectedTier, onlyRepeated]);

  useEffect(() => {
    if (!isScanWeakMode) {
      loadDbCards();
    }
  }, [isScanWeakMode, loadDbCards]);

  const handleOpenAmendedPanel = async () => {
    const nextOpen = !isAmendedPanelOpen;
    setIsAmendedPanelOpen(nextOpen);
    if (nextOpen && amendedItems.length === 0) {
      setIsLoadingAmended(true);
      const res = await fetchLawAmendedQuestionsAction();
      if (res.success) {
        setAmendedItems(res.items);
      }
      setIsLoadingAmended(false);
    }
  };

  const activeCards = useMemo(() => {
    if (isScanWeakMode && scannedWeakIds.length > 0) {
      return REAL_2026_EXAM_OX_CARDS.filter((c) => scannedWeakIds.includes(c.id)).map(mapMockToOxItem);
    }
    return dbCards;
  }, [isScanWeakMode, scannedWeakIds, dbCards]);

  const isTierLocked = !isScanWeakMode && selectedTier > 1 && !isSerialVerified;
  const currentCard = activeCards[currentIndex];
  const isFinished = !isLoadingCards && currentIndex >= activeCards.length;

  const resetCardTransientState = () => {
    setAnswered(null);
    setUserSelected(null);
    setShowRepeatHistory(false);
    setShowOriginalText(false);
  };

  const handleAnswer = (selected: boolean) => {
    if (answered !== null || !currentCard || isTierLocked) return;
    setUserSelected(selected);
    const isRight = selected === currentCard.isCorrectStatement;
    setAnswered(isRight);

    if (isRight) {
      setEarnedPmpTotal((prev) => prev + 10);
      if (currentCard && scannedMarkMap[currentCard.id]) {
        setScannedMarkMap((prev) => ({
          ...prev,
          [currentCard.id]: "O",
        }));
      }
    }
  };

  const handleNext = () => {
    resetCardTransientState();
    setCurrentIndex((prev) => prev + 1);
  };

  const handleTierChange = (tier: number) => {
    setIsScanWeakMode(false);
    setSelectedTier(tier);
    setCurrentIndex(0);
    resetCardTransientState();
  };

  const handleSubjectChange = (subjectKey: string) => {
    setIsScanWeakMode(false);
    setSelectedSubject(subjectKey);
    setCurrentIndex(0);
    resetCardTransientState();
  };

  const currentCardScanMark = currentCard ? scannedMarkMap[currentCard.id] : undefined;
  const hasAmendmentInfo =
    currentCard &&
    (currentCard.lawStatus === "AMENDED_MODIFIED" ||
      currentCard.lawStatus === "NEEDS_REVIEW" ||
      currentCard.isAmendedOption);

  return (
    <MobileAppShell>
      {/* 상단 앱 헤더 */}
      <header className="px-4 py-3 bg-[#16161C] border-b border-white/[0.06] space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-[#FF5A36] fill-[#FF5A36]" />
            <h1 className="text-sm font-black text-white">3초 컷 기출 O/X 덱</h1>
            {!usingFallbackMock && totalMatchedCount > 0 && !isScanWeakMode && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-white/[0.06] text-slate-300 font-mono">
                DB {totalMatchedCount}지문
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            {earnedPmpTotal > 0 && (
              <span className="text-[10px] font-black text-amber-300 bg-amber-950/70 px-2 py-0.5 rounded-full border border-amber-500/30 font-mono">
                +{earnedPmpTotal} PMP
              </span>
            )}
            <button
              type="button"
              onClick={handleOpenAmendedPanel}
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 transition ${
                isAmendedPanelOpen
                  ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                  : "bg-white/[0.06] text-slate-300 border-white/[0.1] hover:text-white"
              }`}
            >
              <BookCheck className="w-3 h-3" />
              <span>개정검수</span>
            </button>
            {isSerialVerified ? (
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-950/80 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                <span>정품</span>
              </span>
            ) : (
              <button
                type="button"
                onClick={() => setIsSerialModalOpen(true)}
                className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/[0.08] text-amber-300 border border-amber-500/30 flex items-center gap-1"
              >
                <KeyRound className="w-3 h-3" />
                <span>키등록</span>
              </button>
            )}
          </div>
        </div>

        {/* 카메라 스캔 약점 선지 배너 */}
        {scannedWeakIds.length > 0 && (
          <div className="flex items-center justify-between gap-2 bg-[#0E0E12] p-1.5 rounded-xl border border-[#FF5A36]/30">
            <button
              type="button"
              onClick={() => {
                setIsScanWeakMode(true);
                setCurrentIndex(0);
                resetCardTransientState();
              }}
              className={`flex-1 py-1.5 px-2.5 rounded-lg text-[11px] font-black flex items-center justify-center gap-1.5 transition ${
                isScanWeakMode
                  ? "bg-gradient-to-r from-[#FF5A36] to-[#FF8008] text-white shadow"
                  : "text-[#FF7A59] hover:text-white"
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              <span>📸 방금 스캔한 ★/X 약점 선지 ({scannedWeakIds.length}개)</span>
            </button>
          </div>
        )}

        {/* 1~5회독 해금 필터 바 */}
        <div className="grid grid-cols-5 gap-1">
          {[1, 2, 3, 4, 5].map((tier) => {
            const locked = tier > 1 && !isSerialVerified;
            return (
              <button
                key={tier}
                type="button"
                onClick={() => handleTierChange(tier)}
                className={`py-1.5 rounded-xl text-[10.5px] font-black transition flex items-center justify-center gap-0.5 ${
                  !isScanWeakMode && selectedTier === tier
                    ? "bg-[#FF5A36] text-white shadow-md"
                    : "bg-[#0E0E12] text-slate-400 hover:text-white border border-white/[0.05]"
                }`}
              >
                {locked && <Lock className="w-2.5 h-2.5 text-amber-400 shrink-0" />}
                <span>{tier === 1 ? "1회독·다빈출" : `${tier}회독`}</span>
              </button>
            );
          })}
        </div>

        {/* 과목 필터 + 다빈출 전용 토글 */}
        {!isScanWeakMode && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
            <button
              type="button"
              onClick={() => {
                setOnlyRepeated((prev) => !prev);
                setCurrentIndex(0);
                resetCardTransientState();
              }}
              className={`shrink-0 px-2.5 py-1 rounded-full text-[10.5px] font-black border flex items-center gap-1 transition ${
                onlyRepeated || selectedTier === 1
                  ? "bg-orange-500/20 text-orange-300 border-orange-500/40"
                  : "bg-[#0E0E12] text-slate-400 border-white/[0.06]"
              }`}
            >
              <Flame className="w-3 h-3" />
              <span>2회↑ 반복만</span>
            </button>
            {SUBJECT_FILTERS.map((sf) => (
              <button
                key={sf.key}
                type="button"
                onClick={() => handleSubjectChange(sf.key)}
                className={`shrink-0 px-2.5 py-1 rounded-full text-[10.5px] font-bold border transition ${
                  selectedSubject === sf.key
                    ? "bg-white text-slate-950 border-white"
                    : "bg-[#0E0E12] text-slate-400 border-white/[0.06] hover:text-white"
                }`}
              >
                {sf.label}
              </button>
            ))}
          </div>
        )}
      </header>

      {/* 개정 반영 / 확인 필요 문항 모아보기 드로어 */}
      {isAmendedPanelOpen && (
        <section className="mx-4 mt-3 p-3.5 rounded-2xl bg-[#1A1D24] border border-emerald-500/30 space-y-2.5 max-h-[340px] overflow-y-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-black text-emerald-300">
              <BookCheck className="w-4 h-4" />
              <span>법령 개정 반영 · 검수 대기 문항 ({amendedItems.length}건)</span>
            </div>
            <button
              type="button"
              onClick={() => setIsAmendedPanelOpen(false)}
              className="text-[11px] font-bold text-slate-400 hover:text-white"
            >
              닫기
            </button>
          </div>

          {isLoadingAmended ? (
            <div className="py-4 flex items-center justify-center gap-2 text-xs text-slate-400">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>개정 문항 불러오는 중...</span>
            </div>
          ) : (
            <div className="space-y-2">
              {amendedItems.map((item) => {
                const isExpanded = expandedAmendedId === item.id;
                const isModified = item.lawStatus === "AMENDED_MODIFIED";
                return (
                  <div
                    key={item.id}
                    className={`p-2.5 rounded-xl border text-left space-y-1.5 ${
                      isModified
                        ? "bg-emerald-950/30 border-emerald-500/30"
                        : "bg-amber-950/20 border-amber-500/25"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setExpandedAmendedId(isExpanded ? null : item.id)}
                      className="w-full flex items-center justify-between gap-2 text-left"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[9.5px] font-black ${
                              isModified
                                ? "bg-emerald-500/25 text-emerald-300"
                                : "bg-amber-500/25 text-amber-300"
                            }`}
                          >
                            {isModified ? "현행법 개정 반영" : "개정 확인 필요"}
                          </span>
                          <span className="text-[10.5px] font-bold text-slate-300">
                            {item.examYear}년 제{item.examRound}회 {item.examStage} · {item.subject} {item.questionNumber}번
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-200 line-clamp-1">{item.questionText}</p>
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      )}
                    </button>

                    {isExpanded && (
                      <div className="pt-1.5 border-t border-white/[0.08] space-y-1.5 text-[11px]">
                        {item.amendedNote && (
                          <p className="text-emerald-300 font-bold leading-relaxed">{item.amendedNote}</p>
                        )}
                        {item.boxContent && (
                          <p className="text-slate-200 bg-black/30 p-2 rounded-lg whitespace-pre-wrap leading-relaxed">
                            {item.boxContent}
                          </p>
                        )}
                        {item.subjectiveAnswer && (
                          <div className="flex flex-col gap-0.5 text-xs">
                            <span className="text-emerald-300 font-black">
                              ▶ 현행 정답: {item.subjectiveAnswer}
                            </span>
                            {item.originalSnapshot?.subjective_answer &&
                              item.originalSnapshot.subjective_answer !== item.subjectiveAnswer && (
                                <span className="text-slate-400 line-through text-[11px]">
                                  (개정 전 기출 원답: {item.originalSnapshot.subjective_answer})
                                </span>
                              )}
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
      )}

      {/* 메인 카드 영역 */}
      <div className="px-4 py-4 flex-1 flex flex-col justify-between space-y-4">
        {isTierLocked ? (
          <div className="space-y-4">
            <TierLockBanner
              currentTier={selectedTier}
              onOpenSerialModal={() => setIsSerialModalOpen(true)}
            />

            <div className="p-6 rounded-3xl bg-[#1A1A21] border border-white/[0.08] text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-[#121216] border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto">
                <Lock className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-black text-white">
                  {selectedTier}회독 ({selectedTier * 20}%) 카드 잠금
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  1회독(다빈출 핵심 260지문)은 무료 체험 가능하며, 정품 시리얼 등록 시 7개년 전체 3,515개 O/X 지문이 해금됩니다.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => handleTierChange(1)}
                  className="py-2.5 rounded-xl bg-white/[0.06] text-slate-200 text-xs font-bold"
                >
                  1회독 풀기
                </button>
                <button
                  type="button"
                  onClick={() => setIsSerialModalOpen(true)}
                  className="py-2.5 rounded-xl bg-amber-500 text-slate-950 text-xs font-black"
                >
                  정품 시리얼 등록
                </button>
              </div>
            </div>
          </div>
        ) : isLoadingCards && !isScanWeakMode ? (
          <div className="my-auto py-12 flex flex-col items-center justify-center gap-3 text-slate-400">
            <Loader2 className="w-7 h-7 animate-spin text-[#FF5A36]" />
            <p className="text-xs font-bold">기출 5,880선지에서 O/X 카드를 불러오는 중...</p>
          </div>
        ) : !isFinished && currentCard ? (
          <>
            {/* 진행도 & 출제 연도·문항 메타 바 */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-bold gap-2">
                <span className="text-slate-300 flex items-center gap-1 truncate">
                  <Calendar className="w-3.5 h-3.5 text-[#FF7A59] shrink-0" />
                  <span>
                    {currentCard.examYear}년 제{currentCard.examRound}회 ({currentCard.examStage}) ·{" "}
                    {currentCard.subject} {currentCard.questionNumber}번
                  </span>
                </span>
                <span className="font-mono text-[#FF7A59] shrink-0">
                  {currentIndex + 1} / {activeCards.length}
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-[#1E1E24] overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#FF5A36] to-[#FF8008] transition-all duration-300"
                  style={{ width: `${((currentIndex + 1) / activeCards.length) * 100}%` }}
                />
              </div>
            </div>

            {/* 화면 중앙 대형 플래시카드 */}
            <div className="flex-1 flex flex-col justify-center p-5 rounded-3xl bg-gradient-to-b from-[#1D1D24] to-[#16161C] border border-white/[0.08] shadow-2xl space-y-4 min-h-[280px]">
              {/* 상단 배지 줄: 회독/선지 + 반복출제 횟수 + 개정 표시 */}
              <div className="flex items-center justify-between flex-wrap gap-1.5">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded-full bg-[#FF5A36]/15 text-[#FF7A59] border border-[#FF5A36]/30 text-[10px] font-black">
                    {currentCard.chapterTitle ? `${currentCard.chapterTitle} · ` : ""}선지 {currentCard.optionNumber}번
                  </span>

                  <LawStatusBadge
                    status={currentCard.lawStatus}
                    isAmendedOption={currentCard.isAmendedOption}
                  />

                  {currentCardScanMark === "STAR" && (
                    <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-black flex items-center gap-0.5">
                      <Star className="w-2.5 h-2.5 fill-amber-300" />
                      <span>스캔 ★헷갈림</span>
                    </span>
                  )}

                  {currentCardScanMark === "X" && (
                    <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px] font-black">
                      스캔 X오답선지
                    </span>
                  )}
                </div>

                {/* 반복 출제 횟수 & 출제 연도 토글 버튼 */}
                <button
                  type="button"
                  onClick={() => setShowRepeatHistory((prev) => !prev)}
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border flex items-center gap-1 transition ${
                    currentCard.repeatCount >= 2
                      ? "bg-orange-500/20 text-orange-300 border-orange-500/40 hover:bg-orange-500/30"
                      : "bg-white/[0.05] text-slate-400 border-white/[0.1] hover:text-white"
                  }`}
                >
                  {currentCard.repeatCount >= 2 ? (
                    <>
                      <Flame className="w-3 h-3 text-orange-400" />
                      <span>
                        {currentCard.repeatCount}회 반복 출제 ({getDistinctYearsLabel(currentCard)})
                      </span>
                    </>
                  ) : (
                    <>
                      <History className="w-3 h-3" />
                      <span>{currentCard.examYear}년 단일 출제</span>
                    </>
                  )}
                  {showRepeatHistory ? (
                    <ChevronUp className="w-3 h-3" />
                  ) : (
                    <ChevronDown className="w-3 h-3" />
                  )}
                </button>
              </div>

              {/* 반복 출제 연도·회차 상세 아코디언 */}
              {showRepeatHistory && (
                <div className="p-3 rounded-2xl bg-[#101015] border border-orange-500/25 space-y-2 text-left">
                  <div className="flex items-center justify-between text-[10.5px] font-black text-orange-300">
                    <span>📌 역대 기출 출제 이력 ({currentCard.appearedCitations.length}회)</span>
                    <span className="text-slate-400 font-normal">동일·함정변형 지문 기준</span>
                  </div>
                  <div className="space-y-1.5 max-h-[140px] overflow-y-auto">
                    {currentCard.appearedCitations.map((cit, idx) => (
                      <div
                        key={`${cit.year}-${cit.round}-${cit.questionNumber}-${cit.optionNumber}-${idx}`}
                        className="p-2 rounded-xl bg-white/[0.03] border border-white/[0.05] space-y-0.5"
                      >
                        <div className="flex items-center justify-between text-[10px] font-bold">
                          <span className="text-slate-200">
                            {cit.year}년 제{cit.round}회 {cit.stage} · {cit.subject} {cit.questionNumber}번 ({cit.optionNumber}번 선지)
                          </span>
                          <span
                            className={`px-1.5 py-0.2 rounded font-black ${
                              cit.isCorrect
                                ? "bg-emerald-500/20 text-emerald-300"
                                : "bg-rose-500/20 text-rose-300"
                            }`}
                          >
                            {cit.isCorrect ? "O" : "X"}
                          </span>
                        </div>
                        <p className="text-[10.5px] text-slate-400 leading-snug">{cit.optionText}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 개정 변환 / 확인 필요 안내 및 기출 원문 보기 토글 */}
              {hasAmendmentInfo && (
                <div
                  className={`p-3 rounded-2xl border space-y-1.5 ${
                    currentCard.lawStatus === "AMENDED_MODIFIED" || currentCard.isAmendedOption
                      ? "bg-emerald-950/35 border-emerald-500/35"
                      : "bg-amber-950/30 border-amber-500/30"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10.5px] font-black text-emerald-300">
                      {currentCard.lawStatus === "AMENDED_MODIFIED" || currentCard.isAmendedOption
                        ? "🔄 개정 법령 반영 문항"
                        : "⚠️ 법령 개정 여부 확인 필요 문항"}
                    </span>
                    {(currentCard.originalOptionText || currentCard.originalQuestionSnapshot?.question_text) && (
                      <button
                        type="button"
                        onClick={() => setShowOriginalText((prev) => !prev)}
                        className="text-[10px] font-bold px-2 py-0.5 rounded bg-white/[0.08] text-slate-200 hover:bg-white/[0.15]"
                      >
                        {showOriginalText ? "원문 닫기" : "기출 원문 보기"}
                      </button>
                    )}
                  </div>
                  {currentCard.amendedNote && (
                    <p className="text-[11px] text-slate-200 leading-relaxed">{currentCard.amendedNote}</p>
                  )}
                  {showOriginalText && (
                    <div className="p-2 rounded-xl bg-black/40 border border-white/[0.08] text-[10.5px] text-slate-400 space-y-1">
                      <div className="font-bold text-slate-300">
                        [{currentCard.examYear}년 제{currentCard.examRound}회 출제 당시 원문]
                      </div>
                      {currentCard.originalOptionText && <p>선지: {currentCard.originalOptionText}</p>}
                      {currentCard.originalQuestionSnapshot?.question_text && (
                        <p>문항: {currentCard.originalQuestionSnapshot.question_text}</p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* 지문 본문 */}
              <div className="space-y-1.5">
                {currentCard.questionText && (
                  <p className="text-[11px] text-slate-400 leading-snug line-clamp-2">
                    Q. {currentCard.questionText}
                  </p>
                )}
                <p className="text-lg font-extrabold text-white leading-relaxed tracking-tight">
                  &quot;{currentCard.statement}&quot;
                </p>
              </div>

              {answered !== null && (
                <div
                  className={`p-3.5 rounded-2xl border space-y-1.5 ${
                    answered
                      ? "bg-emerald-950/50 border-emerald-500/40 text-emerald-200"
                      : "bg-rose-950/50 border-rose-500/40 text-rose-200"
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-black">
                    <span>
                      {answered
                        ? "✅ 정답! ★/X ➔ O 완전 정복 (+10 PMP)"
                        : `❌ 오답! (선택: ${userSelected ? "O" : "X"}) 약점덱 복습 유지`}
                    </span>
                    <span className="font-mono">
                      실제 정답: {currentCard.isCorrectStatement ? "옳음(O)" : "틀림(X)"}
                    </span>
                  </div>
                  {currentCard.trapCorrection && (
                    <div className="text-xs font-bold text-amber-300">
                      💡 {currentCard.trapCorrection}
                    </div>
                  )}
                  <div className="text-[10.5px] text-slate-400 font-mono flex items-center justify-between gap-2 flex-wrap">
                    <span>출처: {currentCard.citation ?? `${currentCard.examYear}년 제${currentCard.examRound}회 ${currentCard.subject} ${currentCard.questionNumber}번`}</span>
                    {currentCard.repeatCount >= 2 && (
                      <span className="text-orange-300 font-bold">
                        🔥 기출 {currentCard.repeatCount}회 반복 지문
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* 하단 엄지손가락 대형 O / X 터치 버튼 */}
            <div className="space-y-2.5">
              {answered === null ? (
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => handleAnswer(false)}
                    className="py-5 rounded-2xl bg-[#1F1A1D] hover:bg-rose-950/70 border-2 border-rose-500/40 text-rose-300 font-black text-base flex flex-col items-center justify-center gap-1 transition active:scale-95 shadow-lg"
                  >
                    <X className="w-7 h-7 text-rose-400" />
                    <span>틀린 지문 (X)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleAnswer(true)}
                    className="py-5 rounded-2xl bg-[#1A211E] hover:bg-emerald-950/70 border-2 border-emerald-500/40 text-emerald-300 font-black text-base flex flex-col items-center justify-center gap-1 transition active:scale-95 shadow-lg"
                  >
                    <CheckCircle2 className="w-7 h-7 text-emerald-400" />
                    <span>맞는 지문 (O)</span>
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleNext}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#FF5A36] to-[#FF8008] text-white font-black text-sm flex items-center justify-center gap-2 shadow-[0_6px_20px_rgba(255,90,54,0.4)] active:scale-95 transition"
                >
                  <span>다음 선지 3초 컷</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </>
        ) : (
          <div className="p-7 rounded-3xl bg-[#1A1A21] border border-white/[0.08] text-center space-y-4 my-auto">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-amber-400 to-[#FF5A36] flex items-center justify-center mx-auto text-slate-950 shadow-lg">
              <Trophy className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-black text-white">
                {activeCards.length === 0
                  ? "선택 조건에 맞는 O/X 카드가 없습니다"
                  : isScanWeakMode
                    ? "스캔 ★/X 약점 선지 정복 완료!"
                    : `${selectedTier}회독 복습 완료!`}
              </h3>
              <p className="text-xs text-slate-400">
                총 {activeCards.length}개 선지 점검 · +{earnedPmpTotal} PMP 획득
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setCurrentIndex(0);
                  resetCardTransientState();
                }}
                className="py-3 rounded-xl bg-white/[0.06] text-white font-bold text-xs"
              >
                다시 풀기
              </button>
              <Link
                href="/scan"
                className="py-3 rounded-xl bg-[#FF5A36] text-white font-black text-xs flex items-center justify-center"
              >
                카메라 스캐너로
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* 정품 시리얼 등록 모달 */}
      <SerialRegisterModal
        isOpen={isSerialModalOpen}
        onClose={() => setIsSerialModalOpen(false)}
        onSuccess={() => setIsSerialVerified(true)}
      />
    </MobileAppShell>
  );
}
