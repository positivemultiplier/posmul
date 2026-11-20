"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  BookOpen,
  CheckCircle2,
  Database,
  Flame,
  FolderTree,
  GitCompareArrows,
  Loader2,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  XCircle,
  Zap,
} from "lucide-react";
import { MobileAppShell } from "@/components/mobile/mobile-app-shell";
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
  fetchLive2ndGraphQuestionAction,
  type LiveGraphQuestionItem,
} from "@/app/actions/concept-graph.actions";

const OPTION_CIRCLES = ["①", "②", "③", "④", "⑤"] as const;

type GraphSectionTab = "quiz" | "axes" | "nodes";
type QuizSourceMode = "live_db" | "curated";
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
  // 1-Viewport 집중을 위한 3세그먼트 분리: 실전 꼬리물기 | 대조표(17) | 개념·암기(90)
  const [sectionTab, setSectionTab] = useState<GraphSectionTab>("quiz");

  // 실전 꼬리물기 모드 (기본: 라이브 DB 2차 기출 자동 꼬리물기)
  const [quizSourceMode, setQuizSourceMode] = useState<QuizSourceMode>("live_db");
  const [liveSubject, setLiveSubject] = useState<LiveSubjectFilter>("ALL");
  const [liveQuestion, setLiveQuestion] = useState<LiveGraphQuestionItem | null>(null);
  const [livePoolCount, setLivePoolCount] = useState<number>(0);
  const [loadingLive, setLoadingLive] = useState<boolean>(false);
  const [liveError, setLiveError] = useState<string | null>(null);
  const seenLiveIdsRef = useRef<string[]>([]);

  const [selectedDemoIdx, setSelectedDemoIdx] = useState(0);
  const [pickedOption, setPickedOption] = useState<number | null>(null);
  const [forceLinksOn, setForceLinksOn] = useState(true);

  const [vaultFilter, setVaultFilter] = useState<VaultFilterKey>("stage2_all");
  const [nodeViewMode, setNodeViewMode] = useState<NodeViewMode>("grouped");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTarget, setActiveTarget] = useState<KnowledgeTrailTarget | null>(null);

  const loadLiveQuestion = useCallback(async (subject: LiveSubjectFilter) => {
    setLoadingLive(true);
    setLiveError(null);
    setPickedOption(null);
    const res = await fetchLive2ndGraphQuestionAction({
      subject,
      excludeIds: seenLiveIdsRef.current.slice(-20),
    });
    setLoadingLive(false);
    if (res.success && res.question) {
      setLiveQuestion(res.question);
      if (typeof res.totalPoolCount === "number") {
        setLivePoolCount(res.totalPoolCount);
      }
      seenLiveIdsRef.current = [...seenLiveIdsRef.current.slice(-19), res.question.id];
    } else {
      setLiveError(res.error || "실제 2차 기출을 불러오지 못했습니다.");
    }
  }, []);

  useEffect(() => {
    void loadLiveQuestion("ALL");
  }, [loadLiveQuestion]);

  const demoQ = DEMO_GRAPH_QUESTIONS[selectedDemoIdx];
  const isAnswered = pickedOption !== null;
  const linksEnabled = forceLinksOn || isAnswered;

  const activeQuestion =
    quizSourceMode === "live_db" && liveQuestion
      ? {
          examLabel: `${liveQuestion.examYear}년 제${liveQuestion.examRound}회 · ${liveQuestion.questionNumber}번${
            liveQuestion.chapterTitle ? ` (${liveQuestion.chapterTitle})` : ""
          }`,
          subject: liveQuestion.subject,
          questionText: liveQuestion.questionText,
          boxContent: liveQuestion.boxContent,
          options: liveQuestion.options.map((o) => ({
            number: o.number,
            text: o.text,
            trapSummary: o.trapSummary,
          })),
          correctOptions: liveQuestion.correctOptions,
          explanation:
            liveQuestion.options
              .filter((o) => o.trapSummary)
              .map((o) => `${OPTION_CIRCLES[o.number - 1]} ${o.trapSummary}`)
              .join(" / ") ||
            "문장 속 하늘 점선(개념어)과 주황 점선(대조어)을 눌러 핵심 특징·기출 함정·인기 암기법을 꼬리물기로 확인해 보세요!",
          matchedBadge: `🔗 개념 ${liveQuestion.matchedConceptCount} · ⚡대조 ${liveQuestion.matchedContrastCount}`,
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

  const groupedNodes = useMemo(() => {
    const map = new Map<
      string,
      { label: string; totalExamCount: number; items: KnowledgeConceptNode[] }
    >();
    for (const node of filteredNodes) {
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
  }, [filteredNodes]);

  const FILTER_TABS: Array<{ key: VaultFilterKey; label: string; count: number }> = [
    { key: "stage2_all", label: "2차 전체", count: filterCounts.stage2All },
    { key: "stage2_law", label: "관계법규", count: filterCounts.stage2Law },
    { key: "stage2_practice", label: "관리실무", count: filterCounts.stage2Practice },
    { key: "pro_field", label: "소장Pro", count: filterCounts.proField },
    { key: "stage1_pipe", label: "1차 배관", count: filterCounts.stage1Pipe },
  ];

  return (
    <MobileAppShell>
      <div className="px-4 pt-3.5 pb-4 space-y-4">
        {/* 0. 컴팩트 커버리지 요약 바 */}
        <section className="px-3.5 py-2.5 rounded-2xl bg-[#171824] border border-white/[0.08] flex items-center justify-between gap-2">
          <div className="min-w-0 flex items-center gap-2 flex-wrap">
            <span className="px-2 py-0.5 rounded-md bg-[#FF5A36]/20 text-[#FF8A70] text-xs font-black shrink-0">
              2차 기출 {VAULT_GRAPH_META.stage2CoveragePercent}% 커버
            </span>
            <span className="text-xs text-slate-300 font-bold truncate">
              {VAULT_GRAPH_META.stage2CoveredQuestions}/{VAULT_GRAPH_META.stage2TotalQuestions}문항 자동연결
            </span>
          </div>
          <span className="text-xs font-mono font-black text-sky-300 flex items-center gap-1 shrink-0">
            <Database className="w-3.5 h-3.5" />
            <span>{VAULT_GRAPH_META.totalNodes}노드</span>
          </span>
        </section>

        {/* 1. 1-Viewport 3세그먼트 전환 바 (스크롤 피로도 제거!) */}
        <div className="grid grid-cols-3 gap-1 p-1 rounded-2xl bg-[#171822] border border-white/[0.08]">
          {[
            {
              key: "quiz" as const,
              label: "실전 꼬리물기",
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
                className={`min-h-[42px] px-2 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition ${
                  active
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
        {/* TAB 1: 🎯 실전 기출 꼬리물기 (실제 DB 2차 기출 전량 자동연결) */}
        {/* ============================================================ */}
        {sectionTab === "quiz" && (
          <section className="p-4 rounded-3xl bg-gradient-to-b from-[#1A1C28] to-[#13141D] border border-sky-500/30 space-y-3.5 shadow-xl">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="inline-flex rounded-xl bg-[#0E0F15] p-1 border border-white/[0.07]">
                <button
                  type="button"
                  onClick={() => {
                    setQuizSourceMode("live_db");
                    setPickedOption(null);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-black transition ${
                    quizSourceMode === "live_db"
                      ? "bg-[#FF5A36] text-white"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  실제 DB 기출 {livePoolCount > 0 ? `(${livePoolCount})` : ""}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setQuizSourceMode("curated");
                    setPickedOption(null);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-black transition ${
                    quizSourceMode === "curated"
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
                className={`px-3 py-1.5 rounded-xl border text-xs font-black transition ${
                  linksEnabled
                    ? "bg-sky-500/20 border-sky-400/50 text-sky-200"
                    : "bg-white/[0.05] border-white/[0.1] text-slate-400"
                }`}
              >
                {linksEnabled ? "🔗 링크 ON" : "시험모드"}
              </button>
            </div>

            {quizSourceMode === "live_db" ? (
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
                        void loadLiveQuestion(item.key);
                      }}
                      className={`min-h-[36px] px-3 rounded-xl border text-xs font-black transition ${
                        liveSubject === item.key
                          ? "bg-white/[0.14] border-white/30 text-white"
                          : "bg-[#11121A] border-white/[0.08] text-slate-400 hover:text-white"
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  disabled={loadingLive}
                  onClick={() => void loadLiveQuestion(liveSubject)}
                  className="min-h-[36px] px-3 rounded-xl bg-[#FF5A36]/20 hover:bg-[#FF5A36]/35 border border-[#FF5A36]/45 text-[#FF9B82] text-xs font-black flex items-center gap-1.5 transition disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingLive ? "animate-spin" : ""}`} />
                  <span>다른 기출</span>
                </button>
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
                    className={`min-h-[36px] px-3 rounded-xl border text-xs font-black shrink-0 transition ${
                      selectedDemoIdx === idx
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
              <span className="text-[#FF9B82] font-black">⚡주황 점선(대조어)</span> ·{" "}
              <span className="text-sky-200 font-black underline decoration-dashed">
                하늘 점선(개념어)
              </span>
              을 눌러 특징 · 출제 통계 · 베스트 암기법을 바로 보세요!
            </div>

            {quizSourceMode === "live_db" && loadingLive ? (
              <div className="py-12 rounded-2xl bg-[#0E0F15] border border-white/[0.08] flex flex-col items-center justify-center gap-2.5 text-sm text-slate-300">
                <Loader2 className="w-6 h-6 animate-spin text-[#FF5A36]" />
                <span>라이브 DB 2차 기출을 불러오는 중...</span>
              </div>
            ) : quizSourceMode === "live_db" && liveError ? (
              <div className="p-4 rounded-2xl bg-rose-950/30 border border-rose-500/30 text-sm text-rose-200 flex items-center justify-between gap-2">
                <span>{liveError}</span>
                <button
                  type="button"
                  onClick={() => void loadLiveQuestion(liveSubject)}
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
                        onClick={() => setPickedOption(opt.number)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") setPickedOption(opt.number);
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
                    className={`p-3.5 rounded-2xl border text-[13px] leading-relaxed space-y-2 ${
                      isRight
                        ? "bg-emerald-950/35 border-emerald-500/45 text-emerald-100"
                        : "bg-rose-950/35 border-rose-500/45 text-rose-100"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-black text-sm">
                        {isRight
                          ? "✅ 정답입니다!"
                          : `❌ 오답입니다 (정답: ${activeQuestion.correctOptions
                              .map((n) => OPTION_CIRCLES[n - 1] ?? n)
                              .join(", ")})`}
                      </span>
                      {quizSourceMode === "live_db" && (
                        <button
                          type="button"
                          onClick={() => void loadLiveQuestion(liveSubject)}
                          className="px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-xs font-black text-white shrink-0"
                        >
                          다음 기출 →
                        </button>
                      )}
                    </div>
                    <p className="text-slate-100">{activeQuestion.explanation}</p>
                  </div>
                )}
              </div>
            )}
          </section>
        )}

        {/* ============================================================ */}
        {/* TAB 2: ⚡ 시험 단골 대조표 (A vs B — 17종 전용 뷰)           */}
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
                    className={`min-h-[38px] px-3.5 rounded-xl border text-xs font-black shrink-0 transition ${
                      active
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
              {filteredAxes.map((axis) => (
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
            </div>
          </section>
        )}

        {/* ============================================================ */}
        {/* TAB 3: 📚 개념·암기 백과 (90개 Vault 노드 단원별/빈출순)      */}
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
                    className={`min-h-[38px] px-3 rounded-xl border text-xs font-black shrink-0 flex items-center gap-1.5 transition ${
                      active
                        ? "bg-[#FF5A36] border-[#FF5A36] text-white"
                        : "bg-[#171824] border-white/[0.08] text-slate-300"
                    }`}
                  >
                    <span>{tab.label}</span>
                    <span
                      className={`text-[11px] font-mono px-1.5 rounded-full ${
                        active ? "bg-black/25 text-white" : "bg-white/[0.07] text-slate-400"
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
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-black flex items-center gap-1 transition ${
                    nodeViewMode === "grouped"
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
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-black flex items-center gap-1 transition ${
                    nodeViewMode === "frequency"
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
                {groupedNodes.map((group) => (
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
                {filteredNodes.map((node) => (
                  <ConceptNodeRow
                    key={node.id}
                    node={node}
                    onSelect={() => setActiveTarget({ kind: "concept", conceptId: node.id })}
                  />
                ))}
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
