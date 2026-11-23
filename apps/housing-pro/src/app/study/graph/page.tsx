"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ElementRef } from "react";
import Link from "next/link";
import {
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Database,
  Flame,
  FolderTree,
  GitCompareArrows,
  Loader2,
  Search,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  XCircle,
  Zap,
} from "lucide-react";
import { MobileAppShell } from "@/components/mobile/mobile-app-shell";
import { PracticeHubTabs } from "@/components/study/practice-hub-tabs";
import { useStudyAuth } from "@/components/auth/study-auth-provider";
import { saveSingleQuestionSolveAction } from "@/app/actions/exam-study.actions";
import {
  DEMO_GRAPH_QUESTIONS,
  KNOWLEDGE_CONCEPT_NODES,
  KNOWLEDGE_CONTRAST_AXES,
  VAULT_GRAPH_META,
  type KnowledgeConceptNode,
} from "@/data/knowledge-graph-housing";
import {
  ConceptLinkedText,
  type KnowledgeTrailTarget,
} from "@/components/study/concept-linked-text";
import { ConceptTrailDrawer } from "@/components/study/concept-trail-drawer";
import {
  fetchChapterGraphQuestionsAction,
  fetchGraphChapterSummaryAction,
  type GraphChapterSummary,
  type GraphDifficultyFilter,
  type LiveGraphQuestionItem,
} from "@/app/actions/concept-graph.actions";

const OPTION_CIRCLES = ["①", "②", "③", "④", "⑤"] as const;
const GRAPH_BATCH_SIZE = 5;
const LIST_INITIAL_COUNT = 12;

type GraphRoundPresetId = "1R" | "2R" | "3R";

const GRAPH_ROUND_PRESETS: Array<{
  id: GraphRoundPresetId;
  label: string;
  difficulty: GraphDifficultyFilter;
  defaultMax: number | null;
}> = [
  { id: "1R", label: "1R 핵심(5제)", difficulty: "SA", defaultMax: 5 },
  { id: "2R", label: "2R 표준(10제)", difficulty: "SAB", defaultMax: 10 },
  { id: "3R", label: "3R+ 전체", difficulty: "ALL", defaultMax: null },
];

type GraphSectionTab = "quiz" | "axes" | "nodes";
type QuizSourceMode = "chapter_db" | "curated";
type LiveSubjectFilter = "ALL" | "주택관리관계법규" | "공동주택관리실무";

type VaultFilterKey =
  | "stage2_all"
  | "stage2_law"
  | "stage2_practice"
  | "stage1_pipe"
  | "pro_field";

type NodeViewMode = "grouped" | "frequency";

/** Vault 경로(예: 02-stage2/04-law/LAW_02_APT_ORG/...)에서 깔끔한 폴더 라벨 추출 */
function getVaultFolderLabel(node: KnowledgeConceptNode): string {
  const parts = (node.vaultPath || "").split("/");
  const folder = parts.length >= 3 ? parts[2] : node.chapterCode || node.subject;
  return `${node.examStage} · ${node.subject} › ${folder}`;
}

export default function KnowledgeGraphStudyPage() {
  const { effectiveOwnerKey } = useStudyAuth();

  // 1-Viewport 집중 3세그먼트: 단원별 기출 | 대조표(17) | 개념·암기(90)
  const [sectionTab, setSectionTab] = useState<GraphSectionTab>("quiz");

  // 단원별 기출 모드 (회독 난이도·문제량 조절 + 5문항 점진적 프리페치)
  const [quizSourceMode, setQuizSourceMode] = useState<QuizSourceMode>("chapter_db");
  const [liveSubject, setLiveSubject] = useState<LiveSubjectFilter>("ALL");
  const [roundPreset, setRoundPreset] = useState<GraphRoundPresetId>("2R");
  const [difficultyFilter, setDifficultyFilter] = useState<GraphDifficultyFilter>("SAB");
  const [maxQuestionCap, setMaxQuestionCap] = useState<number | null>(10);
  const [savedNotice, setSavedNotice] = useState<"idle" | "saving" | "saved_right" | "saved_weak">("idle");

  const [chapters, setChapters] = useState<GraphChapterSummary[]>([]);
  const [loadingChapters, setLoadingChapters] = useState<boolean>(true);
  const [selectedChapterCode, setSelectedChapterCode] = useState<string | null>(null);

  // URL ?chapter=LAW_02 등으로 진입 시 해당 단원 자동 선택
  useEffect(() => {
    if (typeof globalThis !== "undefined" && "location" in globalThis) {
      const params = new globalThis.URLSearchParams(globalThis.location.search);
      const ch = params.get("chapter");
      if (ch) setSelectedChapterCode(ch);
    }
  }, []);

  const handleSelectGraphRound = (presetId: GraphRoundPresetId) => {
    const preset = GRAPH_ROUND_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    setRoundPreset(preset.id);
    setDifficultyFilter(preset.difficulty);
    setMaxQuestionCap(preset.defaultMax);
  };

  const [chapterQuestions, setChapterQuestions] = useState<LiveGraphQuestionItem[]>([]);
  const [totalChapterQuestions, setTotalChapterQuestions] = useState<number>(0);
  const [hasMoreQuestions, setHasMoreQuestions] = useState<boolean>(false);
  const [questionIdx, setQuestionIdx] = useState<number>(0);
  const [loadingLive, setLoadingLive] = useState<boolean>(true);
  const [prefetchingMore, setPrefetchingMore] = useState<boolean>(false);
  const [liveError, setLiveError] = useState<string | null>(null);

  const queryVersionRef = useRef<number>(0);
  const prefetchLockRef = useRef<boolean>(false);

  const [selectedDemoIdx, setSelectedDemoIdx] = useState(0);
  const [pickedOption, setPickedOption] = useState<number | null>(null);
  const [forceLinksOn, setForceLinksOn] = useState(true);

  // 개념·암기 & 대조표 점진적 로딩 상태
  const [vaultFilter, setVaultFilter] = useState<VaultFilterKey>("stage2_all");
  const [nodeViewMode, setNodeViewMode] = useState<NodeViewMode>("grouped");
  const [searchQuery, setSearchQuery] = useState("");
  const [visibleNodeCount, setVisibleNodeCount] = useState<number>(LIST_INITIAL_COUNT);
  const [visibleAxisCount, setVisibleAxisCount] = useState<number>(LIST_INITIAL_COUNT);
  const listSentinelRef = useRef<ElementRef<"div"> | null>(null);

  const [activeTarget, setActiveTarget] = useState<KnowledgeTrailTarget | null>(null);

  // 1) 과목별 단원 목록 초경량 조회
  useEffect(() => {
    let cancelled = false;
    setLoadingChapters(true);
    void fetchGraphChapterSummaryAction({ subject: liveSubject }).then((res) => {
      if (cancelled) return;
      if (res.success) {
        setChapters(res.chapters);
      }
      setLoadingChapters(false);
    });
    return () => {
      cancelled = true;
    };
  }, [liveSubject]);

  // 2) 선택 단원(또는 과목 전체) 첫 5문항 초고속 로드 (회독 난이도 + 문제량 반영)
  const loadInitialChapterBatch = useCallback(
    async (
      subject: LiveSubjectFilter,
      detailCode: string | null,
      diff: GraphDifficultyFilter,
      maxCap: number | null
    ) => {
      const version = ++queryVersionRef.current;
      prefetchLockRef.current = false;
      setLoadingLive(true);
      setLiveError(null);
      setPickedOption(null);
      setSavedNotice("idle");
      setQuestionIdx(0);
      setChapterQuestions([]);
      setHasMoreQuestions(false);

      const initialLimit = maxCap ? Math.min(GRAPH_BATCH_SIZE, maxCap) : GRAPH_BATCH_SIZE;
      const res = await fetchChapterGraphQuestionsAction({
        subject,
        detailCode,
        offset: 0,
        limit: initialLimit,
        difficultyFilter: diff,
        maxQuestions: maxCap,
      });

      if (queryVersionRef.current !== version) return;
      setLoadingLive(false);

      if (res.success) {
        setChapterQuestions(res.questions);
        setTotalChapterQuestions(res.totalCount);
        setHasMoreQuestions(res.hasMore);
        if (res.questions.length === 0) {
          setLiveError("선택한 단원에 연결된 2차 객관식 기출이 없습니다.");
        }
      } else {
        setLiveError(res.error || "단원별 기출을 불러오지 못했습니다.");
      }
    },
    []
  );

  useEffect(() => {
    void loadInitialChapterBatch(liveSubject, selectedChapterCode, difficultyFilter, maxQuestionCap);
  }, [liveSubject, selectedChapterCode, difficultyFilter, maxQuestionCap, loadInitialChapterBatch]);

  // 3) 백그라운드 다음 5문항 자동 프리페치
  const prefetchNextBatch = useCallback(async () => {
    if (prefetchLockRef.current || !hasMoreQuestions) return;
    const version = queryVersionRef.current;
    prefetchLockRef.current = true;
    setPrefetchingMore(true);

    try {
      const res = await fetchChapterGraphQuestionsAction({
        subject: liveSubject,
        detailCode: selectedChapterCode,
        offset: chapterQuestions.length,
        limit: GRAPH_BATCH_SIZE,
        difficultyFilter,
        maxQuestions: maxQuestionCap,
      });
      if (queryVersionRef.current !== version) return;
      if (res.success && res.questions.length > 0) {
        setChapterQuestions((prev) => {
          const seen = new Set(prev.map((item) => item.id));
          const unique = res.questions.filter((item) => !seen.has(item.id));
          return [...prev, ...unique];
        });
        setTotalChapterQuestions(res.totalCount);
        setHasMoreQuestions(res.hasMore);
      } else {
        setHasMoreQuestions(false);
      }
    } finally {
      prefetchLockRef.current = false;
      setPrefetchingMore(false);
    }
  }, [
    hasMoreQuestions,
    liveSubject,
    selectedChapterCode,
    chapterQuestions.length,
    difficultyFilter,
    maxQuestionCap,
  ]);

  // 사용자가 현재 배치를 보다가 끝에서 3문항 이내에 도달하면 조용히 다음 5문항 자동 프리페치!
  useEffect(() => {
    if (
      quizSourceMode !== "chapter_db" ||
      loadingLive ||
      !hasMoreQuestions ||
      prefetchingMore ||
      chapterQuestions.length === 0
    ) {
      return;
    }
    if (questionIdx >= chapterQuestions.length - 3) {
      void prefetchNextBatch();
    }
  }, [
    quizSourceMode,
    loadingLive,
    hasMoreQuestions,
    prefetchingMore,
    chapterQuestions.length,
    questionIdx,
    prefetchNextBatch,
  ]);

  const currentLiveQ = chapterQuestions[questionIdx] ?? null;
  const demoQ = DEMO_GRAPH_QUESTIONS[selectedDemoIdx];
  const isAnswered = pickedOption !== null;
  const linksEnabled = forceLinksOn || isAnswered;

  const activeQuestion =
    quizSourceMode === "chapter_db" && currentLiveQ
      ? {
        examLabel: `${currentLiveQ.examYear}년 제${currentLiveQ.examRound}회 · ${currentLiveQ.questionNumber}번${currentLiveQ.chapterTitle ? ` (${currentLiveQ.chapterTitle})` : ""
          }`,
        subject: currentLiveQ.subject,
        questionText: currentLiveQ.questionText,
        boxContent: currentLiveQ.boxContent,
        options: currentLiveQ.options.map((o) => ({
          number: o.number,
          text: o.text,
          trapSummary: o.trapSummary,
        })),
        correctOptions: currentLiveQ.correctOptions,
        explanation:
          currentLiveQ.options
            .filter((o) => o.trapSummary)
            .map((o) => `${OPTION_CIRCLES[o.number - 1]} ${o.trapSummary}`)
            .join(" / ") ||
          "문장 속 하늘 점선(개념어)과 주황 점선(대조어)을 눌러 핵심 특징·기출 함정·인기 암기법을 꼬리물기로 확인해 보세요!",
        matchedBadge: `개념 ${currentLiveQ.matchedConceptCount} ·대조 ${currentLiveQ.matchedContrastCount}`,
      }
      : {
        examLabel: demoQ.examLabel,
        subject: demoQ.subject,
        questionText: demoQ.questionText,
        boxContent: null,
        options: demoQ.options.map((o) => ({
          number: o.number,
          text: o.text,
          trapSummary: null as string | null,
        })),
        correctOptions: [demoQ.correctOption],
        explanation: demoQ.explanation,
        matchedBadge: null as string | null,
      };

  const isRight =
    isAnswered && pickedOption !== null && activeQuestion.correctOptions.includes(pickedOption);

  const fullContext = `${activeQuestion.questionText} ${activeQuestion.boxContent || ""} ${activeQuestion.options
    .map((o) => o.text)
    .join(" ")}`;

  const filterCounts = useMemo(() => {
    let stage2All = 0;
    let stage2Law = 0;
    let stage2Practice = 0;
    let stage1Pipe = 0;
    let proField = 0;

    for (const n of KNOWLEDGE_CONCEPT_NODES) {
      if (n.examStage === "2차") {
        stage2All++;
        if (n.subject === "주택관리관계법규") stage2Law++;
        if (n.subject === "공동주택관리실무") stage2Practice++;
      } else {
        stage1Pipe++;
      }
      if (n.proFieldTip || n.tags.includes("pro-field")) {
        proField++;
      }
    }
    return { stage2All, stage2Law, stage2Practice, stage1Pipe, proField };
  }, []);

  const filteredAxes = useMemo(() => {
    return KNOWLEDGE_CONTRAST_AXES.filter((axis) => {
      if (vaultFilter === "stage1_pipe") return axis.examStage === "1차";
      if (vaultFilter === "stage2_law")
        return (
          axis.examStage === "2차" &&
          (axis.subjectTag === "관계법규" || axis.subjectTag === "2차 통합")
        );
      if (vaultFilter === "stage2_practice")
        return (
          axis.examStage === "2차" &&
          (axis.subjectTag === "관리실무" || axis.subjectTag === "2차 통합")
        );
      if (vaultFilter === "stage2_all") return axis.examStage === "2차";
      return true;
    });
  }, [vaultFilter]);

  const filteredNodes = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return [...KNOWLEDGE_CONCEPT_NODES]
      .filter((n) => {
        if (vaultFilter === "stage2_all" && n.examStage !== "2차") return false;
        if (vaultFilter === "stage2_law" && n.subject !== "주택관리관계법규") return false;
        if (vaultFilter === "stage2_practice" && n.subject !== "공동주택관리실무") return false;
        if (vaultFilter === "stage1_pipe" && n.examStage !== "1차") return false;
        if (vaultFilter === "pro_field" && !n.proFieldTip && !n.tags.includes("pro-field")) {
          return false;
        }
        if (!q) return true;
        return [
          n.title,
          n.englishTitle || "",
          n.category,
          n.subject,
          n.lawRef || "",
          n.vaultPath || "",
          ...n.aliases,
          ...n.tags,
        ]
          .join(" ")
          .toLowerCase()
          .includes(q);
      })
      .sort((a, b) => b.examCount - a.examCount);
  }, [vaultFilter, searchQuery]);

  // 필터/검색 변경 시 점진적 표시 개수 초기화
  useEffect(() => {
    setVisibleNodeCount(LIST_INITIAL_COUNT);
    setVisibleAxisCount(LIST_INITIAL_COUNT);
  }, [vaultFilter, searchQuery, nodeViewMode, sectionTab]);

  // IntersectionObserver: 스크롤 시 대조표/개념 카드 12개씩 점진적 추가 렌더
  useEffect(() => {
    if (sectionTab === "quiz") return;
    const node = listSentinelRef.current;
    if (!node) return;
    if (typeof globalThis === "undefined" || !("IntersectionObserver" in globalThis)) return;
    const observer = new globalThis.IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting) return;
        if (sectionTab === "nodes") {
          setVisibleNodeCount((prev) => Math.min(filteredNodes.length, prev + 12));
        } else if (sectionTab === "axes") {
          setVisibleAxisCount((prev) => Math.min(filteredAxes.length, prev + 12));
        }
      },
      { rootMargin: "220px" }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [sectionTab, filteredNodes.length, filteredAxes.length]);

  const visibleNodes = useMemo(
    () => filteredNodes.slice(0, visibleNodeCount),
    [filteredNodes, visibleNodeCount]
  );

  const visibleAxes = useMemo(
    () => filteredAxes.slice(0, visibleAxisCount),
    [filteredAxes, visibleAxisCount]
  );

  const groupedVisibleNodes = useMemo(() => {
    const map = new Map<
      string,
      { label: string; totalExamCount: number; items: KnowledgeConceptNode[] }
    >();
    for (const node of visibleNodes) {
      const label = getVaultFolderLabel(node);
      const existing = map.get(label);
      if (existing) {
        existing.items.push(node);
        existing.totalExamCount += node.examCount;
      } else {
        map.set(label, { label, totalExamCount: node.examCount, items: [node] });
      }
    }
    return Array.from(map.values()).sort((a, b) => a.label.localeCompare(b.label, "ko"));
  }, [visibleNodes]);

  const FILTER_TABS: Array<{ key: VaultFilterKey; label: string; count: number }> = [
    { key: "stage2_all", label: "2차 전체", count: filterCounts.stage2All },
    { key: "stage2_law", label: "관계법규", count: filterCounts.stage2Law },
    { key: "stage2_practice", label: "관리실무", count: filterCounts.stage2Practice },
    { key: "pro_field", label: "소장Pro", count: filterCounts.proField },
    { key: "stage1_pipe", label: "1차 배관", count: filterCounts.stage1Pipe },
  ];

  const handleMoveChapterQuestion = async (nextIdx: number) => {
    if (nextIdx < 0) return;
    if (nextIdx >= chapterQuestions.length && hasMoreQuestions) {
      await prefetchNextBatch();
    }
    setPickedOption(null);
    setSavedNotice("idle");
    setQuestionIdx(nextIdx);
  };

  /**
   * User Journey 4단계(저장) + 5단계(통계) + 6단계(틀린 문제 O/X 자동 편입)
   * 단원별 지식맵에서 답안을 고르는 즉시 DB에 저장하고, 오답 선지는 약점 O/X로 연결합니다!
   */
  const handlePickAnswerOption = async (optionNumber: number) => {
    setPickedOption(optionNumber);
    if (quizSourceMode !== "chapter_db" || !currentLiveQ || !effectiveOwnerKey) return;

    const isRightChoice = currentLiveQ.correctOptions.includes(optionNumber);
    const optionMarks: Array<{ optionId: string; markStatus: "O" | "STAR" | "X" }> = [];
    if (!isRightChoice) {
      for (const opt of currentLiveQ.options) {
        if (opt.id && (opt.number === optionNumber || currentLiveQ.correctOptions.includes(opt.number))) {
          optionMarks.push({ optionId: opt.id, markStatus: "STAR" });
        }
      }
    }

    setSavedNotice("saving");
    const res = await saveSingleQuestionSolveAction({
      clientKey: effectiveOwnerKey,
      setKey: `GRAPH::${currentLiveQ.subject}::${currentLiveQ.detailCode || "ALL"}`,
      questionId: currentLiveQ.id,
      selectedOption: optionNumber,
      subjectiveInput: null,
      isCorrect: isRightChoice,
      questionMark: isRightChoice ? "O" : "X",
      optionMarks,
    });
    if (res.success) {
      setSavedNotice(isRightChoice ? "saved_right" : "saved_weak");
    } else {
      setSavedNotice("idle");
    }
  };

  return (
    <MobileAppShell>
      {/* 문제 탭 통합 3세그먼트: 연도별 기출 | 단원별 지식맵 | 스피드 O/X */}
      <PracticeHubTabs />

      <div className="px-4 pt-3 pb-4 space-y-3.5">
        {/* 0. 컴팩트 커버리지 요약 바 */}
        <section className="px-3.5 py-2.5 rounded-2xl bg-[#171824] border border-white/[0.08] flex items-center justify-between gap-2">
          <div className="min-w-0 flex items-center gap-2 flex-wrap">
            <span className="px-2 py-0.5 rounded-md bg-[#FF5A36]/20 text-[#FF8A70] text-xs font-black shrink-0">
              단원별 2차 기출 {VAULT_GRAPH_META.stage2CoveragePercent}% 연결
            </span>
            <span className="text-xs text-slate-300 font-bold truncate">
              5문항 즉시 로드 · 백그라운드 자동 준비
            </span>
          </div>
          <span className="text-xs font-mono font-black text-sky-300 flex items-center gap-1 shrink-0">
            <Database className="w-3.5 h-3.5" />
            <span>{VAULT_GRAPH_META.totalNodes}개념</span>
          </span>
        </section>

        {/* 1. 지식맵 내부 3세그먼트: 단원별 기출 | 대조표(17) | 개념·암기(90) */}
        <div className="grid grid-cols-3 gap-1 p-1 rounded-2xl bg-[#171822] border border-white/[0.08]">
          {[
            {
              key: "quiz" as const,
              label: "단원별 기출",
              icon: Sparkles,
            },
            {
              key: "axes" as const,
              label: `대조표 ${KNOWLEDGE_CONTRAST_AXES.length}`,
              icon: Zap,
            },
            {
              key: "nodes" as const,
              label: `개념·암기 ${VAULT_GRAPH_META.totalNodes}`,
              icon: GitCompareArrows,
            },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = sectionTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setSectionTab(tab.key)}
                className={`min-h-[42px] px-2 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition ${active
                  ? "bg-[#FF5A36] text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
                  }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* ============================================================ */}
        {/* TAB 1: 🎯 단원 기준 실전 기출 꼬리물기 (5문항 점진적 프리페치) */}
        {/* ============================================================ */}
        {sectionTab === "quiz" && (
          <section className="p-4 rounded-3xl bg-gradient-to-b from-[#1A1C28] to-[#13141D] border border-sky-500/30 space-y-3.5 shadow-xl">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="inline-flex rounded-xl bg-[#0E0F15] p-1 border border-white/[0.07]">
                <button
                  type="button"
                  onClick={() => {
                    setQuizSourceMode("chapter_db");
                    setPickedOption(null);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-black transition ${quizSourceMode === "chapter_db"
                    ? "bg-[#FF5A36] text-white"
                    : "text-slate-400 hover:text-white"
                    }`}
                >
                  단원별 실제 기출 {totalChapterQuestions > 0 ? `(${totalChapterQuestions})` : ""}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setQuizSourceMode("curated");
                    setPickedOption(null);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-black transition ${quizSourceMode === "curated"
                    ? "bg-sky-600 text-white"
                    : "text-slate-400 hover:text-white"
                    }`}
                >
                  핵심 패턴 5선
                </button>
              </div>

              <button
                type="button"
                onClick={() => setForceLinksOn((prev) => !prev)}
                className={`px-3 py-1.5 rounded-xl border text-xs font-black transition ${linksEnabled
                  ? "bg-sky-500/20 border-sky-400/50 text-sky-200"
                  : "bg-white/[0.05] border-white/[0.1] text-slate-400"
                  }`}
              >
                {linksEnabled ? "링크 ON" : "시험모드"}
              </button>
            </div>

            {quizSourceMode === "chapter_db" ? (
              <div className="space-y-2.5">
                {/* 0단계: 회독별 난이도 & 문제량 조절 바 */}
                <div className="p-2 rounded-2xl bg-[#0F1018] border border-white/[0.08] space-y-1.5">
                  <div className="grid grid-cols-3 gap-1">
                    {GRAPH_ROUND_PRESETS.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => handleSelectGraphRound(p.id)}
                        className={`min-h-[32px] px-2 rounded-xl text-[11px] font-black border transition ${
                          roundPreset === p.id
                            ? "bg-[#FF5A36]/20 border-[#FF5A36] text-white"
                            : "bg-[#151621] border-white/[0.06] text-slate-400 hover:text-white"
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center justify-between gap-2 px-1">
                    <span className="text-[10.5px] font-bold text-slate-400">문제량</span>
                    <div className="flex items-center gap-1">
                      {([5, 10, 15, null] as const).map((cap) => (
                        <button
                          key={cap ?? "all"}
                          type="button"
                          onClick={() => setMaxQuestionCap(cap)}
                          className={`px-2 py-0.5 rounded-lg text-[10.5px] font-mono font-black border transition ${
                            maxQuestionCap === cap
                              ? "bg-white text-slate-950 border-white"
                              : "bg-[#151621] text-slate-400 border-white/[0.08]"
                          }`}
                        >
                          {cap ? `${cap}제` : "전체"}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 1단계: 과목 선택 */}
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5">
                    {(
                      [
                        { key: "ALL", label: "2차 전체" },
                        { key: "주택관리관계법규", label: "법규" },
                        { key: "공동주택관리실무", label: "실무" },
                      ] as const
                    ).map((item) => (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => {
                          setLiveSubject(item.key);
                          setSelectedChapterCode(null);
                        }}
                        className={`min-h-[34px] px-3 rounded-xl border text-xs font-black transition ${liveSubject === item.key
                          ? "bg-white/[0.15] border-white/30 text-white"
                          : "bg-[#11121A] border-white/[0.08] text-slate-400 hover:text-white"
                          }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>

                  {/* 점진적 로딩 상태 표시 */}
                  <div className="flex items-center gap-1.5 text-[11px] font-mono">
                    {prefetchingMore && (
                      <span className="text-sky-300 flex items-center gap-1 font-sans font-bold">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        <span>다음 문항 준비중</span>
                      </span>
                    )}
                    {totalChapterQuestions > 0 && (
                      <span className="px-2 py-0.5 rounded-lg bg-white/[0.06] text-slate-200 font-black">
                        {Math.min(questionIdx + 1, totalChapterQuestions)}/{totalChapterQuestions}
                      </span>
                    )}
                  </div>
                </div>

                {/* 2단계: 단원 기준 선택 칩 (가로 스크롤) */}
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
                  <button
                    type="button"
                    onClick={() => setSelectedChapterCode(null)}
                    className={`min-h-[34px] px-3 rounded-xl border text-xs font-black shrink-0 transition ${selectedChapterCode === null
                      ? "bg-sky-500/25 border-sky-400/60 text-sky-100"
                      : "bg-[#10111A] border-white/[0.08] text-slate-400 hover:text-white"
                      }`}
                  >
                    전체 단원
                  </button>
                  {loadingChapters ? (
                    <span className="text-xs text-slate-500 px-2 flex items-center gap-1 shrink-0">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      단원 불러오는 중...
                    </span>
                  ) : (
                    chapters.map((ch) => {
                      const active = selectedChapterCode === ch.code;
                      return (
                        <button
                          key={`${ch.subject}-${ch.code}`}
                          type="button"
                          onClick={() => setSelectedChapterCode(ch.code)}
                          className={`min-h-[34px] px-3 rounded-xl border text-xs font-bold shrink-0 flex items-center gap-1.5 transition ${active
                            ? "bg-sky-500/25 border-sky-400/60 text-sky-100 font-black"
                            : "bg-[#10111A] border-white/[0.08] text-slate-300 hover:text-white"
                            }`}
                        >
                          <span>
                            {ch.topicNo ? `${ch.topicNo}. ` : ""}
                            {ch.title}
                          </span>
                          <span className="text-[10.5px] font-mono text-slate-400">
                            {ch.questionCount}
                          </span>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
                {DEMO_GRAPH_QUESTIONS.map((q, idx) => (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => {
                      setSelectedDemoIdx(idx);
                      setPickedOption(null);
                    }}
                    className={`min-h-[36px] px-3 rounded-xl border text-xs font-black shrink-0 transition ${selectedDemoIdx === idx
                      ? "bg-sky-600 border-sky-500 text-white"
                      : "bg-[#11121A] border-white/[0.08] text-slate-400 hover:text-white"
                      }`}
                  >
                    {q.shortTabLabel}
                  </button>
                ))}
              </div>
            )}

            {/* 가독성 안내 바 */}
            <div className="px-3.5 py-2.5 rounded-xl bg-sky-950/35 border border-sky-500/25 text-xs text-sky-100 leading-relaxed">
              <span className="text-[#FF9B82] font-black">주황 점선(대조어)</span> ·{" "}
              <span className="text-sky-200 font-black underline decoration-dashed">
                하늘 점선(개념어)
              </span>
              을 눌러 특징 · 출제 통계 · 베스트 암기법을 바로 보세요!
            </div>

            {quizSourceMode === "chapter_db" && loadingLive ? (
              <div className="py-12 rounded-2xl bg-[#0E0F15] border border-white/[0.08] flex flex-col items-center justify-center gap-2.5 text-sm text-slate-300">
                <Loader2 className="w-6 h-6 animate-spin text-[#FF5A36]" />
                <span>단원 첫 5문항을 빠르게 불러오는 중...</span>
              </div>
            ) : quizSourceMode === "chapter_db" && liveError ? (
              <div className="p-4 rounded-2xl bg-rose-950/30 border border-rose-500/30 text-sm text-rose-200 flex items-center justify-between gap-2">
                <span>{liveError}</span>
                <button
                  type="button"
                  onClick={() =>
                    void loadInitialChapterBatch(
                      liveSubject,
                      selectedChapterCode,
                      difficultyFilter,
                      maxQuestionCap
                    )
                  }
                  className="px-3 py-1.5 rounded-xl bg-white/10 text-white text-xs font-black shrink-0"
                >
                  재시도
                </button>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-[#0E0F15] border border-white/[0.08] space-y-4">
                <div className="text-xs font-bold text-slate-400 flex items-center justify-between gap-2 flex-wrap">
                  <span className="truncate">{activeQuestion.examLabel}</span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {activeQuestion.matchedBadge && (
                      <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 text-[11px] font-black">
                        {activeQuestion.matchedBadge}
                      </span>
                    )}
                    <span className="text-sky-300 font-black">{activeQuestion.subject}</span>
                  </div>
                </div>

                {/* 고가독성 문제 본문 (15.5px, 행간 1.65) */}
                <p className="text-[15.5px] font-extrabold text-white leading-[1.65]">
                  <ConceptLinkedText
                    text={activeQuestion.questionText}
                    contextText={fullContext}
                    enabled={linksEnabled}
                    onSelectTarget={setActiveTarget}
                  />
                </p>

                {activeQuestion.boxContent && (
                  <div className="p-3.5 rounded-xl bg-[#161824] border border-white/[0.09] text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">
                    <ConceptLinkedText
                      text={activeQuestion.boxContent}
                      contextText={fullContext}
                      enabled={linksEnabled}
                      onSelectTarget={setActiveTarget}
                    />
                  </div>
                )}

                {/* 고가독성 5지선다 (14px, 넉넉한 터치 타겟) */}
                <div className="space-y-2">
                  {activeQuestion.options.map((opt) => {
                    const isPicked = pickedOption === opt.number;
                    const isAnswer = activeQuestion.correctOptions.includes(opt.number);

                    let rowStyle =
                      "bg-[#171925] border-white/[0.08] hover:border-white/[0.22] text-slate-100";
                    if (isAnswered) {
                      if (isAnswer) {
                        rowStyle = "bg-emerald-950/45 border-emerald-400/65 text-emerald-50";
                      } else if (isPicked && !isAnswer) {
                        rowStyle = "bg-rose-950/45 border-rose-400/65 text-rose-50";
                      }
                    }

                    return (
                      <div
                        key={opt.number}
                        onClick={() => void handlePickAnswerOption(opt.number)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            void handlePickAnswerOption(opt.number);
                          }
                        }}
                        className={`w-full px-3.5 py-3 rounded-2xl border text-[14px] font-bold flex items-start justify-between gap-2.5 transition cursor-pointer ${rowStyle}`}
                      >
                        <div className="flex items-start gap-2.5 min-w-0">
                          <span className="font-mono font-black text-slate-400 shrink-0 mt-0.5">
                            {OPTION_CIRCLES[opt.number - 1] ?? `${opt.number}.`}
                          </span>
                          <ConceptLinkedText
                            text={opt.text}
                            contextText={fullContext}
                            enabled={linksEnabled}
                            onSelectTarget={setActiveTarget}
                            className="leading-[1.55]"
                          />
                        </div>
                        {isAnswered && isAnswer && (
                          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                        )}
                        {isAnswered && isPicked && !isAnswer && (
                          <XCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                        )}
                      </div>
                    );
                  })}
                </div>

                {isAnswered && (
                  <div
                    className={`p-3.5 rounded-2xl border text-[13px] leading-relaxed space-y-2 ${isRight
                      ? "bg-emerald-950/35 border-emerald-500/45 text-emerald-100"
                      : "bg-rose-950/35 border-rose-500/45 text-rose-100"
                      }`}
                  >
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="font-black text-sm">
                        {isRight
                          ? "정답입니다!"
                          : `오답입니다 (정답: ${activeQuestion.correctOptions
                            .map((n) => OPTION_CIRCLES[n - 1] ?? n)
                            .join(", ")})`}
                      </span>
                      {savedNotice === "saving" && (
                        <span className="text-[11px] text-slate-300 font-bold">저장 중...</span>
                      )}
                      {savedNotice === "saved_right" && (
                        <span className="text-[11px] text-emerald-300 font-black">
                          통계 자동 반영됨
                        </span>
                      )}
                      {savedNotice === "saved_weak" && (
                        <Link
                          href="/study/ox?mode=weak"
                          className="px-2 py-0.5 rounded-lg bg-[#FF5A36]/25 border border-[#FF5A36]/50 text-[11px] text-[#FF9B82] font-black"
                        >
                          약점 O/X 자동 편입 →
                        </Link>
                      )}
                    </div>
                    <p className="text-slate-100">{activeQuestion.explanation}</p>
                  </div>
                )}

                {/* 단원별 기출 이전/다음 문항 네비게이션 */}
                {quizSourceMode === "chapter_db" && chapterQuestions.length > 0 && (
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      type="button"
                      disabled={questionIdx === 0}
                      onClick={() => void handleMoveChapterQuestion(questionIdx - 1)}
                      className="min-h-[44px] rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.08] text-xs font-black text-slate-200 disabled:opacity-40 flex items-center justify-center gap-1 transition"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      <span>이전 기출</span>
                    </button>
                    <button
                      type="button"
                      disabled={
                        questionIdx + 1 >= totalChapterQuestions &&
                        questionIdx + 1 >= chapterQuestions.length
                      }
                      onClick={() => void handleMoveChapterQuestion(questionIdx + 1)}
                      className="min-h-[44px] rounded-xl bg-[#FF5A36] hover:bg-[#ff6d4d] text-xs font-black text-white disabled:opacity-40 flex items-center justify-center gap-1 transition"
                    >
                      <span>
                        다음 기출 ({Math.min(questionIdx + 2, totalChapterQuestions)}/
                        {totalChapterQuestions})
                      </span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </section>
        )}

        {/* ============================================================ */}
        {/* TAB 2: ⚡ 시험 단골 대조표 (A vs B — 점진적 로딩)            */}
        {/* ============================================================ */}
        {sectionTab === "axes" && (
          <section className="space-y-3">
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
              {FILTER_TABS.map((tab) => {
                const active = vaultFilter === tab.key;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setVaultFilter(tab.key)}
                    className={`min-h-[38px] px-3.5 rounded-xl border text-xs font-black shrink-0 transition ${active
                      ? "bg-[#FF5A36] border-[#FF5A36] text-white"
                      : "bg-[#171824] border-white/[0.08] text-slate-300"
                      }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            <div className="space-y-2.5">
              {visibleAxes.map((axis) => (
                <button
                  key={axis.id}
                  type="button"
                  onClick={() => setActiveTarget({ kind: "axis", axisId: axis.id })}
                  className="w-full p-4 rounded-2xl bg-[#181926] hover:bg-[#202232] border border-white/[0.08] hover:border-[#FF5A36]/50 text-left space-y-1.5 transition"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[14.5px] font-black text-white leading-snug">
                      {axis.title}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-[#FF5A36]/15 text-[#FF8A70] text-[11px] font-black shrink-0">
                      {axis.subjectTag}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">{axis.subtitle}</p>
                  <div className="pt-1 flex items-center gap-2 text-xs font-bold text-sky-300">
                    <Zap className="w-3.5 h-3.5 text-[#FF7A59]" />
                    <span>탭해서 좌우 대조표 & 암기 공식 보기 →</span>
                  </div>
                </button>
              ))}

              {visibleAxes.length < filteredAxes.length && (
                <div ref={listSentinelRef} className="pt-1 flex justify-center">
                  <button
                    type="button"
                    onClick={() =>
                      setVisibleAxisCount((prev) => Math.min(filteredAxes.length, prev + 12))
                    }
                    className="min-h-[40px] px-4 rounded-xl bg-white/[0.06] text-xs font-black text-slate-300 flex items-center gap-1.5"
                  >
                    <span>
                      대조표 더 보기 ({visibleAxes.length}/{filteredAxes.length})
                    </span>
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          </section>
        )}

        {/* ============================================================ */}
        {/* TAB 3: 📚 개념·암기 백과 (90개 Vault 노드 점진적 로딩)       */}
        {/* ============================================================ */}
        {sectionTab === "nodes" && (
          <section className="space-y-3">
            {/* 과목·단계 필터 칩 */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
              {FILTER_TABS.map((tab) => {
                const active = vaultFilter === tab.key;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setVaultFilter(tab.key)}
                    className={`min-h-[38px] px-3 rounded-xl border text-xs font-black shrink-0 flex items-center gap-1.5 transition ${active
                      ? "bg-[#FF5A36] border-[#FF5A36] text-white"
                      : "bg-[#171824] border-white/[0.08] text-slate-300"
                      }`}
                  >
                    <span>{tab.label}</span>
                    <span
                      className={`text-[11px] font-mono px-1.5 rounded-full ${active ? "bg-black/25 text-white" : "bg-white/[0.07] text-slate-400"
                        }`}
                    >
                      {tab.count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* 검색 + 단원별/빈출순 전환 */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="vault-node-search"
                  name="vaultNodeSearch"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="개념·조항·별칭 검색 (예: 500세대, 하자, 승강기)"
                  className="w-full min-h-[42px] pl-10 pr-3 rounded-xl bg-[#161722] border border-white/[0.09] text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-[#FF5A36]"
                />
              </div>

              <div className="inline-flex rounded-xl bg-[#161722] p-1 border border-white/[0.09] shrink-0">
                <button
                  type="button"
                  onClick={() => setNodeViewMode("grouped")}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-black flex items-center gap-1 transition ${nodeViewMode === "grouped"
                    ? "bg-sky-500/20 text-sky-200"
                    : "text-slate-400 hover:text-white"
                    }`}
                >
                  <FolderTree className="w-3.5 h-3.5" />
                  <span>단원</span>
                </button>
                <button
                  type="button"
                  onClick={() => setNodeViewMode("frequency")}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-black flex items-center gap-1 transition ${nodeViewMode === "frequency"
                    ? "bg-[#FF5A36]/20 text-[#FF8A70]"
                    : "text-slate-400 hover:text-white"
                    }`}
                >
                  <Flame className="w-3.5 h-3.5" />
                  <span>빈출</span>
                </button>
              </div>
            </div>

            {filteredNodes.length === 0 ? (
              <div className="p-8 rounded-2xl bg-[#161722] border border-white/[0.06] text-center text-sm text-slate-400">
                검색 조건에 맞는 개념 노드가 없습니다.
              </div>
            ) : nodeViewMode === "grouped" ? (
              <div className="space-y-4">
                {groupedVisibleNodes.map((group) => (
                  <div key={group.label} className="space-y-2">
                    <div className="flex items-center justify-between px-1 text-xs font-black text-sky-300">
                      <span className="truncate flex items-center gap-1.5">
                        <FolderTree className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                        <span className="truncate">{group.label}</span>
                      </span>
                      <span className="text-[11px] font-mono text-slate-400 shrink-0">
                        {group.items.length}개념 · {group.totalExamCount}문항
                      </span>
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                      {group.items.map((node) => (
                        <ConceptNodeRow
                          key={node.id}
                          node={node}
                          onSelect={() => setActiveTarget({ kind: "concept", conceptId: node.id })}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-2">
                {visibleNodes.map((node) => (
                  <ConceptNodeRow
                    key={node.id}
                    node={node}
                    onSelect={() => setActiveTarget({ kind: "concept", conceptId: node.id })}
                  />
                ))}
              </div>
            )}

            {visibleNodes.length < filteredNodes.length && (
              <div ref={listSentinelRef} className="pt-1 flex justify-center">
                <button
                  type="button"
                  onClick={() =>
                    setVisibleNodeCount((prev) => Math.min(filteredNodes.length, prev + 12))
                  }
                  className="min-h-[40px] px-4 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-xs font-black text-slate-300 flex items-center gap-1.5 transition"
                >
                  <span>
                    개념 더 불러오기 ({visibleNodes.length}/{filteredNodes.length})
                  </span>
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </section>
        )}
      </div>

      {/* 꼬리물기 드릴다운 스택 드로어 */}
      <ConceptTrailDrawer
        initialTarget={activeTarget}
        onClose={() => setActiveTarget(null)}
      />
    </MobileAppShell>
  );
}

function ConceptNodeRow({
  node,
  onSelect,
}: {
  node: KnowledgeConceptNode;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className="p-3.5 rounded-2xl bg-[#181926] hover:bg-[#202232] border border-white/[0.08] hover:border-sky-400/50 text-left flex items-center justify-between gap-3 transition"
    >
      <div className="min-w-0 space-y-1">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[14.5px] font-black text-white truncate">{node.title}</span>
          {node.proFieldTip && (
            <ShieldCheck
              className="w-3.5 h-3.5 text-sky-400 shrink-0"
              aria-label="소장Pro 실무 직결"
            />
          )}
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400 truncate">
          <span className="text-slate-300 font-bold">{node.category}</span>
          {node.lawRef && (
            <span className="inline-flex items-center gap-1 text-slate-500 truncate">
              <BookOpen className="w-3 h-3 shrink-0" />
              <span className="truncate">{node.lawRef}</span>
            </span>
          )}
        </div>
        <p className="text-xs text-slate-300 truncate">{node.summaryBullets[0]}</p>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        {node.recentTrend === "UP" && (
          <TrendingUp className="w-4 h-4 text-emerald-400" />
        )}
        <span className="px-2.5 py-1 rounded-full bg-[#FF5A36]/15 border border-[#FF5A36]/35 text-[#FF8A70] text-xs font-mono font-black">
          {node.examCount}문항
        </span>
      </div>
    </button>
  );
}
