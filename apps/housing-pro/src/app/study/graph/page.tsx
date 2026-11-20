"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
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
  // 상단 기출 체험 모드 (기본: 라이브 DB 2차 기출 자동 꼬리물기!)
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
  const [showAllAxes, setShowAllAxes] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTarget, setActiveTarget] = useState<KnowledgeTrailTarget | null>(null);

  const loadLiveQuestion = useCallback(
    async (subject: LiveSubjectFilter) => {
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
    },
    []
  );

  useEffect(() => {
    void loadLiveQuestion("ALL");
  }, [loadLiveQuestion]);

  const demoQ = DEMO_GRAPH_QUESTIONS[selectedDemoIdx];
  const isAnswered = pickedOption !== null;
  const linksEnabled = forceLinksOn || isAnswered;

  // 현재 활성 문항 통합 뷰
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
          matchedBadge: `🔗 개념 ${liveQuestion.matchedConceptCount} · ⚡대조 ${liveQuestion.matchedContrastCount} 자동연결`,
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

  // 필터별 개념 수 집계
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
    const list = KNOWLEDGE_CONTRAST_AXES.filter((axis) => {
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
    return showAllAxes ? list : list.slice(0, 4);
  }, [vaultFilter, showAllAxes]);

  const totalMatchingAxes = useMemo(() => {
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
    }).length;
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

  // 대규모 Vault 확장을 대비한 폴더/단원별 그룹핑
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
    { key: "stage2_law", label: "2차 관계법규", count: filterCounts.stage2Law },
    { key: "stage2_practice", label: "2차 관리실무", count: filterCounts.stage2Practice },
    { key: "pro_field", label: "소장Pro 직결", count: filterCounts.proField },
    { key: "stage1_pipe", label: "1차 배관PoC", count: filterCounts.stage1Pipe },
  ];

  return (
    <MobileAppShell>
      {/* 헤더 */}
      <header className="px-4 py-3 bg-[#16161C] border-b border-white/[0.06] flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Link
            href="/study/books"
            className="px-2 py-1 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] text-[10px] font-black text-slate-300 shrink-0 transition"
          >
            ← 학습
          </Link>
          <GitCompareArrows className="w-4 h-4 text-[#FF5A36] shrink-0" />
          <h1 className="text-sm font-black text-white truncate">
            2차 꼬리물기 지식 그래프 · 암기 위키
          </h1>
        </div>
        <span className="px-2 py-0.5 rounded-full bg-sky-500/15 border border-sky-400/35 text-sky-300 text-[9.5px] font-black shrink-0 flex items-center gap-1">
          <Database className="w-2.5 h-2.5" />
          <span>DB {VAULT_GRAPH_META.totalQuestionsScanned.toLocaleString()}제</span>
        </span>
      </header>

      <div className="px-4 py-4 space-y-5">
        {/* 0. 주택관리사 2차 MVP Vault 상태 배너 */}
        <section className="px-3.5 py-2.5 rounded-2xl bg-[#151621] border border-white/[0.08] flex items-center justify-between gap-2">
          <div className="min-w-0">
            <div className="text-[11px] font-black text-white flex items-center gap-1.5 flex-wrap">
              <span className="px-1.5 py-0.5 rounded bg-[#FF5A36]/20 text-[#FF8A70] text-[9.5px]">
                2차 기출 {VAULT_GRAPH_META.stage2CoveragePercent}% 커버
              </span>
              <span className="truncate">
                ({VAULT_GRAPH_META.stage2CoveredQuestions}/{VAULT_GRAPH_META.stage2TotalQuestions}문항 자동연결)
              </span>
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5 truncate">
              법규 {filterCounts.stage2Law} · 실무 {filterCounts.stage2Practice} · 1차 {filterCounts.stage1Pipe} · 대조축 {KNOWLEDGE_CONTRAST_AXES.length}종 · 암기법 투표 연동
            </p>
          </div>
          <span className="text-[10px] font-mono font-black text-sky-300 shrink-0">
            {VAULT_GRAPH_META.totalNodes}노드
          </span>
        </section>

        {/* 1. 인터랙티브 2차 기출 꼬리물기 실전 풀이 (라이브 DB 2차 기출 전량 자동연결!) */}
        <section className="p-4 rounded-3xl bg-gradient-to-b from-[#1A1B25] to-[#13131A] border border-sky-500/35 space-y-3 shadow-xl">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#FF7A59]" />
              <span className="text-xs font-black text-white">
                기출 문항 꼬리물기 실전 풀이
              </span>
            </div>
            <button
              type="button"
              onClick={() => setForceLinksOn((prev) => !prev)}
              className={`px-2 py-0.5 rounded-full border text-[10px] font-black transition ${
                linksEnabled
                  ? "bg-sky-500/20 border-sky-400/50 text-sky-200"
                  : "bg-white/[0.05] border-white/[0.1] text-slate-400"
              }`}
            >
              {linksEnabled ? "🔗 지식링크 ON" : "시험모드 (채점후 ON)"}
            </button>
          </div>

          {/* 소스 전환 탭: 실제 DB 2차 기출 vs 핵심 패턴 5선 */}
          <div className="grid grid-cols-2 gap-1.5 p-1 rounded-2xl bg-[#0F1016] border border-white/[0.07]">
            <button
              type="button"
              onClick={() => {
                setQuizSourceMode("live_db");
                setPickedOption(null);
              }}
              className={`py-1.5 px-2 rounded-xl text-[11px] font-black transition ${
                quizSourceMode === "live_db"
                  ? "bg-[#FF5A36] text-white"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              🎯 실제 DB 2차 기출 {livePoolCount > 0 ? `(${livePoolCount}제)` : ""}
            </button>
            <button
              type="button"
              onClick={() => {
                setQuizSourceMode("curated");
                setPickedOption(null);
              }}
              className={`py-1.5 px-2 rounded-xl text-[11px] font-black transition ${
                quizSourceMode === "curated"
                  ? "bg-sky-600 text-white"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              ⚡ 핵심 패턴 5선
            </button>
          </div>

          {quizSourceMode === "live_db" ? (
            <div className="flex items-center justify-between gap-1.5 flex-wrap">
              <div className="flex items-center gap-1">
                {(
                  [
                    { key: "ALL", label: "2차 전체" },
                    { key: "주택관리관계법규", label: "관계법규" },
                    { key: "공동주택관리실무", label: "관리실무" },
                  ] as const
                ).map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => {
                      setLiveSubject(item.key);
                      void loadLiveQuestion(item.key);
                    }}
                    className={`px-2.5 py-1 rounded-lg border text-[10px] font-black transition ${
                      liveSubject === item.key
                        ? "bg-white/[0.14] border-white/30 text-white"
                        : "bg-[#111118] border-white/[0.07] text-slate-400 hover:text-white"
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
                className="px-2.5 py-1 rounded-lg bg-[#FF5A36]/20 hover:bg-[#FF5A36]/35 border border-[#FF5A36]/45 text-[#FF9B82] text-[10.5px] font-black flex items-center gap-1 transition disabled:opacity-50"
              >
                <RefreshCw className={`w-3 h-3 ${loadingLive ? "animate-spin" : ""}`} />
                <span>다른 실제 기출</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              {DEMO_GRAPH_QUESTIONS.map((q, idx) => (
                <button
                  key={q.id}
                  type="button"
                  onClick={() => {
                    setSelectedDemoIdx(idx);
                    setPickedOption(null);
                  }}
                  className={`px-2.5 py-1 rounded-xl border text-[10.5px] font-black shrink-0 transition ${
                    selectedDemoIdx === idx
                      ? "bg-sky-600 border-sky-500 text-white"
                      : "bg-[#111118] border-white/[0.08] text-slate-400 hover:text-white"
                  }`}
                >
                  {q.shortTabLabel}
                </button>
              ))}
            </div>
          )}

          {/* 안내 팁 */}
          <div className="px-3 py-2 rounded-xl bg-sky-950/35 border border-sky-500/25 text-[10.5px] text-sky-200 leading-relaxed">
            문장 속{" "}
            <span className="text-[#FF9B82] font-black">⚡주황 점선(대조어)</span>과{" "}
            <span className="text-sky-200 font-black underline decoration-dashed">
              하늘 점선(개념어)
            </span>
            을 탭하면 <strong>특징 · DB 실제 출제 횟수 · 반대 대조표 · 베스트 암기법</strong>이 바로 열립니다!
          </div>

          {/* 문제 본문 */}
          {quizSourceMode === "live_db" && loadingLive ? (
            <div className="p-8 rounded-2xl bg-[#0F1016] border border-white/[0.08] flex flex-col items-center justify-center gap-2 text-xs text-slate-400">
              <Loader2 className="w-5 h-5 animate-spin text-[#FF5A36]" />
              <span>라이브 DB 2차 기출에서 꼬리물기 문항을 불러오는 중...</span>
            </div>
          ) : quizSourceMode === "live_db" && liveError ? (
            <div className="p-4 rounded-2xl bg-rose-950/30 border border-rose-500/30 text-xs text-rose-200 flex items-center justify-between gap-2">
              <span>{liveError}</span>
              <button
                type="button"
                onClick={() => void loadLiveQuestion(liveSubject)}
                className="px-2.5 py-1 rounded-lg bg-white/10 text-white font-black shrink-0"
              >
                재시도
              </button>
            </div>
          ) : (
            <div className="p-3.5 rounded-2xl bg-[#0F1016] border border-white/[0.08] space-y-3">
              <div className="text-[10px] font-bold text-slate-400 flex items-center justify-between gap-2 flex-wrap">
                <span className="truncate">{activeQuestion.examLabel}</span>
                <div className="flex items-center gap-1.5 shrink-0">
                  {activeQuestion.matchedBadge && (
                    <span className="px-1.5 py-0.5 rounded bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 text-[9.5px] font-black">
                      {activeQuestion.matchedBadge}
                    </span>
                  )}
                  <span className="text-sky-300">{activeQuestion.subject}</span>
                </div>
              </div>

              <p className="text-[13px] font-extrabold text-white leading-relaxed">
                <ConceptLinkedText
                  text={activeQuestion.questionText}
                  contextText={fullContext}
                  enabled={linksEnabled}
                  onSelectTarget={setActiveTarget}
                />
              </p>

              {activeQuestion.boxContent && (
                <div className="p-3 rounded-xl bg-[#161722] border border-white/[0.09] text-[11.5px] text-slate-200 leading-relaxed whitespace-pre-wrap">
                  <ConceptLinkedText
                    text={activeQuestion.boxContent}
                    contextText={fullContext}
                    enabled={linksEnabled}
                    onSelectTarget={setActiveTarget}
                  />
                </div>
              )}

              {/* 5지선다 */}
              <div className="space-y-1.5">
                {activeQuestion.options.map((opt) => {
                  const isPicked = pickedOption === opt.number;
                  const isAnswer = activeQuestion.correctOptions.includes(opt.number);

                  let rowStyle =
                    "bg-[#161722] border-white/[0.07] hover:border-white/[0.2] text-slate-100";
                  if (isAnswered) {
                    if (isAnswer) {
                      rowStyle = "bg-emerald-950/45 border-emerald-400/60 text-emerald-100";
                    } else if (isPicked && !isAnswer) {
                      rowStyle = "bg-rose-950/45 border-rose-400/60 text-rose-100";
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
                      className={`w-full px-3 py-2.5 rounded-xl border text-xs font-bold flex items-center justify-between gap-2 transition cursor-pointer ${rowStyle}`}
                    >
                      <div className="flex items-start gap-2 min-w-0">
                        <span className="font-mono font-black text-slate-400 shrink-0">
                          {OPTION_CIRCLES[opt.number - 1] ?? `${opt.number}.`}
                        </span>
                        <ConceptLinkedText
                          text={opt.text}
                          contextText={fullContext}
                          enabled={linksEnabled}
                          onSelectTarget={setActiveTarget}
                          className="leading-snug"
                        />
                      </div>
                      {isAnswered && isAnswer && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      )}
                      {isAnswered && isPicked && !isAnswer && (
                        <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                      )}
                    </div>
                  );
                })}
              </div>

              {isAnswered && (
                <div
                  className={`p-3 rounded-xl border text-[11px] leading-relaxed space-y-1.5 ${
                    isRight
                      ? "bg-emerald-950/35 border-emerald-500/40 text-emerald-100"
                      : "bg-rose-950/35 border-rose-500/40 text-rose-100"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-black">
                      {isRight
                        ? "✅ 정답입니다!"
                        : `❌ 오답입니다! (정답: ${activeQuestion.correctOptions
                            .map((n) => OPTION_CIRCLES[n - 1] ?? n)
                            .join(", ")})`}
                    </span>
                    {quizSourceMode === "live_db" && (
                      <button
                        type="button"
                        onClick={() => void loadLiveQuestion(liveSubject)}
                        className="px-2 py-0.5 rounded-md bg-white/10 hover:bg-white/20 text-[10px] font-black text-white shrink-0"
                      >
                        다음 실제 기출 →
                      </button>
                    )}
                  </div>
                  <p className="text-slate-200">{activeQuestion.explanation}</p>
                </div>
              )}
            </div>
          )}
        </section>

        {/* 2. 과목·단계 Vault 네임스페이스 필터 (Vault 확장 대비 명확 구분!) */}
        <section className="space-y-2">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
            {FILTER_TABS.map((tab) => {
              const active = vaultFilter === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => {
                    setVaultFilter(tab.key);
                    setShowAllAxes(false);
                  }}
                  className={`px-3 py-1.5 rounded-xl border text-[11px] font-black shrink-0 flex items-center gap-1.5 transition ${
                    active
                      ? "bg-[#FF5A36] border-[#FF5A36] text-white shadow-sm"
                      : "bg-[#161620] border-white/[0.08] text-slate-300 hover:border-white/[0.2]"
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`text-[9.5px] font-mono px-1.5 py-0.2 rounded-full ${
                      active ? "bg-black/25 text-white" : "bg-white/[0.06] text-slate-400"
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* 3. 핵심 대조 개념 축 빠른 진입 (필터 연동) */}
        <section className="space-y-2">
          <div className="flex items-center justify-between px-0.5">
            <div className="text-xs font-black text-white flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-[#FF7A59]" />
              <span>시험 단골 대조 개념 축 ({totalMatchingAxes}종)</span>
            </div>
            {totalMatchingAxes > 4 && (
              <button
                type="button"
                onClick={() => setShowAllAxes((prev) => !prev)}
                className="text-[10.5px] font-black text-sky-300 hover:underline"
              >
                {showAllAxes ? "접기" : `전체 ${totalMatchingAxes}종 보기 →`}
              </button>
            )}
          </div>
          <div className="space-y-2">
            {filteredAxes.map((axis) => (
              <button
                key={axis.id}
                type="button"
                onClick={() => setActiveTarget({ kind: "axis", axisId: axis.id })}
                className="w-full p-3.5 rounded-2xl bg-[#181822] hover:bg-[#1E1E2B] border border-white/[0.08] hover:border-[#FF5A36]/50 text-left space-y-1 transition"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-black text-white">{axis.title}</span>
                  <span className="px-1.5 py-0.5 rounded bg-white/[0.06] text-[9px] font-black text-slate-300 shrink-0">
                    {axis.subjectTag}
                  </span>
                </div>
                <p className="text-[10.5px] text-slate-400">{axis.subtitle}</p>
              </button>
            ))}
          </div>
        </section>

        {/* 4. 기출 빈출 개념 노드 백과 (폴더·단원 구분 vs 출제 빈출순 전환) */}
        <section className="space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <div className="text-xs font-black text-white flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-[#FF5A36]" />
              <span>Vault 개념 노드 · 암기법 ({filteredNodes.length}개)</span>
            </div>

            <div className="inline-flex rounded-lg bg-[#14141D] p-0.5 border border-white/[0.08]">
              <button
                type="button"
                onClick={() => setNodeViewMode("grouped")}
                className={`px-2 py-1 rounded-md text-[10px] font-black flex items-center gap-1 transition ${
                  nodeViewMode === "grouped"
                    ? "bg-sky-500/20 text-sky-200"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <FolderTree className="w-3 h-3" />
                <span>단원별</span>
              </button>
              <button
                type="button"
                onClick={() => setNodeViewMode("frequency")}
                className={`px-2 py-1 rounded-md text-[10px] font-black flex items-center gap-1 transition ${
                  nodeViewMode === "frequency"
                    ? "bg-[#FF5A36]/20 text-[#FF8A70]"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Flame className="w-3 h-3" />
                <span>빈출순</span>
              </button>
            </div>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="개념·조항·별칭 검색 (예: 500세대, 장충금, 하자, 승강기, 저수조)"
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#16161E] border border-white/[0.08] text-xs text-white focus:outline-none focus:border-[#FF5A36]"
            />
          </div>

          {filteredNodes.length === 0 ? (
            <div className="p-6 rounded-2xl bg-[#15151E] border border-white/[0.06] text-center text-xs text-slate-400">
              검색 조건에 맞는 개념 노드가 없습니다.
            </div>
          ) : nodeViewMode === "grouped" ? (
            <div className="space-y-3.5">
              {groupedNodes.map((group) => (
                <div key={group.label} className="space-y-1.5">
                  <div className="flex items-center justify-between px-1 text-[10.5px] font-black text-sky-300">
                    <span className="truncate flex items-center gap-1">
                      <FolderTree className="w-3 h-3 text-sky-400 shrink-0" />
                      <span className="truncate">{group.label}</span>
                    </span>
                    <span className="text-[9.5px] font-mono text-slate-400 shrink-0">
                      {group.items.length}개념 · 누적 {group.totalExamCount}문항
                    </span>
                  </div>
                  <div className="grid grid-cols-1 gap-1.5">
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
      className="p-3 rounded-2xl bg-[#171720] hover:bg-[#1D1D29] border border-white/[0.07] hover:border-sky-400/50 text-left flex items-center justify-between gap-2.5 transition"
    >
      <div className="min-w-0 space-y-0.5">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs font-black text-white truncate">{node.title}</span>
          {node.proFieldTip && (
            <ShieldCheck
              className="w-3 h-3 text-sky-400 shrink-0"
              aria-label="소장Pro 실무 직결"
            />
          )}
        </div>
        <div className="flex items-center gap-1.5 text-[9.5px] text-slate-400 truncate">
          <span className="text-slate-300 font-bold">{node.category}</span>
          {node.lawRef && (
            <span className="inline-flex items-center gap-0.5 text-slate-500 truncate">
              <BookOpen className="w-2.5 h-2.5 shrink-0" />
              <span className="truncate">{node.lawRef}</span>
            </span>
          )}
        </div>
        <p className="text-[10.5px] text-slate-400 truncate">{node.summaryBullets[0]}</p>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        {node.recentTrend === "UP" && (
          <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
        )}
        <span className="px-2 py-0.5 rounded-full bg-[#FF5A36]/15 border border-[#FF5A36]/35 text-[#FF8A70] text-[10px] font-mono font-black">
          {node.examCount}문항
        </span>
      </div>
    </button>
  );
}
