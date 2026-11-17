"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  BarChart3,
  AlertTriangle,
  CheckCircle2,
  Clock,
  CalendarPlus,
  BookOpen,
  ArrowRight,
  Flame,
  Target,
  TrendingUp,
  TrendingDown,
  Minus,
  Award,
  Layers,
  Loader2,
  RefreshCw,
  ShieldAlert,
  Sparkles,
  Play,
} from "lucide-react";
import { MobileAppShell } from "@/components/mobile/mobile-app-shell";
import { useStudyCurriculum } from "@/lib/study-curriculum-store";
import { useStudyAuth } from "@/components/auth/study-auth-provider";
import {
  addDaysISO,
  diffDaysISO,
  flattenTopics,
  getRoundColorStyle,
} from "@/data/study-textbooks";
import {
  fetchStudyAnalyticsAction,
  type StudyAnalyticsResult,
} from "@/app/actions/exam-study.actions";

type StatsTab = "predict" | "frequency" | "progress" | "matrix";

const SUBJECT_FILTER_OPTIONS = [
  "ALL",
  "민법",
  "회계원리",
  "공동주택시설개론",
  "주택관리관계법규",
  "공동주택관리실무",
] as const;

export default function StudyStatisticsPage() {
  const { isLoading: authLoading, effectiveOwnerKey } = useStudyAuth();
  const {
    todayISO,
    activeBook,
    subjects,
    matrixLogs,
    upsertMatrixCell,
  } = useStudyCurriculum();

  const [activeTab, setActiveTab] = useState<StatsTab>("predict");
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // DB 실시간 분석 데이터 상태
  const [analyticsData, setAnalyticsData] = useState<StudyAnalyticsResult | null>(null);
  const [loadingDb, setLoadingDb] = useState<boolean>(true);
  const [subjectFilter, setSubjectFilter] = useState<string>("ALL");
  const [freqSortBy, setFreqSortBy] = useState<"order" | "count" | "trend">("count");
  const [progressFilter, setProgressFilter] = useState<"ALL" | "UNSOLVED" | "WEAK">("ALL");

  const loadAnalytics = async () => {
    setLoadingDb(true);
    const res = await fetchStudyAnalyticsAction(effectiveOwnerKey);
    if (res.success) {
      setAnalyticsData(res);
    }
    setLoadingDb(false);
  };

  useEffect(() => {
    if (authLoading) return;
    void loadAnalytics();
  }, [authLoading, effectiveOwnerKey]);

  // 플래너에서 커스텀 변경한 과목 색상과 일관되게 동기화하는 조회 맵
  const customColorLookup = useMemo(() => {
    const byChapter = new Map<string, string>();
    const bySubjectTitle = new Map<string, string>();
    const bySubjectId = new Map<string, string>();

    for (const s of subjects) {
      bySubjectId.set(s.id, s.color);
      bySubjectTitle.set(s.title, s.color);
      bySubjectTitle.set(s.shortTitle, s.color);
      for (const u of s.units) {
        for (const t of u.topics) {
          if (t.chapterCode) byChapter.set(t.chapterCode, s.color);
        }
      }
    }

    const resolve = (
      fallbackColor: string,
      subjectName?: string,
      chapterCode?: string
    ): string => {
      if (chapterCode && byChapter.has(chapterCode)) {
        return byChapter.get(chapterCode) as string;
      }
      if (subjectName && bySubjectTitle.has(subjectName)) {
        return bySubjectTitle.get(subjectName) as string;
      }
      const idMap: Record<string, string> = {
        민법: "subj-1-civil",
        회계원리: "subj-1-accounting",
        공동주택시설개론: "subj-1-facility",
        시설개론: "subj-1-facility",
        주택관리관계법규: "subj-2-law",
        관계법규: "subj-2-law",
        공동주택관리실무: "subj-2-practice",
        관리실무: "subj-2-practice",
      };
      if (subjectName && idMap[subjectName] && bySubjectId.has(idMap[subjectName])) {
        return bySubjectId.get(idMap[subjectName]) as string;
      }
      return fallbackColor;
    };

    return { resolve };
  }, [subjects]);

  // 플래너 매트릭스 기반 회독·구멍 통계 계산
  const matrixAnalytics = useMemo(() => {
    const allTopicEntries = flattenTopics(subjects);
    let totalDoneCells = 0;
    let totalMinutes = 0;
    let coveredCount = 0;

    const topicStats = allTopicEntries.map(({ subject, unit, topic }) => {
      let doneCount = 0;
      let minutes = 0;
      let lastDoneDate: string | null = null;

      for (const [key, cell] of Object.entries(matrixLogs)) {
        if (
          key.startsWith(`${topic.id}::`) &&
          (cell.status === "done" || cell.status === "partial")
        ) {
          const dateISO = key.split("::")[1];
          if (cell.status === "done") {
            doneCount += 1;
          }
          minutes += cell.minutes || topic.estimatedMinutes;
          if (!lastDoneDate || dateISO > lastDoneDate) {
            lastDoneDate = dateISO;
          }
        }
      }

      totalDoneCells += doneCount;
      totalMinutes += minutes;
      if (doneCount > 0) coveredCount += 1;

      const daysSinceLast = lastDoneDate ? diffDaysISO(lastDoneDate, todayISO) : null;

      return {
        subject,
        unit,
        topic,
        doneCount,
        minutes,
        lastDoneDate,
        daysSinceLast,
      };
    });

    const subjectStats = subjects.map((subject) => {
      const items = topicStats.filter((t) => t.subject.id === subject.id);
      const totalTopics = items.length;
      const coveredTopics = items.filter((t) => t.doneCount > 0).length;
      const sumRounds = items.reduce((acc, t) => acc + t.doneCount, 0);
      const sumMinutes = items.reduce((acc, t) => acc + t.minutes, 0);

      return {
        subject,
        totalTopics,
        coveredTopics,
        coveragePct: totalTopics > 0 ? Math.round((coveredTopics / totalTopics) * 100) : 0,
        avgRounds: totalTopics > 0 ? Number((sumRounds / totalTopics).toFixed(1)) : 0,
        totalRounds: sumRounds,
        sumMinutes,
      };
    });

    const weakTopics = [...topicStats]
      .sort((a, b) => {
        if (a.doneCount === 0 && b.doneCount > 0) return -1;
        if (b.doneCount === 0 && a.doneCount > 0) return 1;
        const aGap = a.daysSinceLast ?? 999;
        const bGap = b.daysSinceLast ?? 999;
        return bGap - aGap;
      })
      .slice(0, 6);

    return {
      totalTopics: allTopicEntries.length,
      coveredCount,
      coveragePct:
        allTopicEntries.length > 0
          ? Math.round((coveredCount / allTopicEntries.length) * 100)
          : 0,
      avgRounds:
        allTopicEntries.length > 0
          ? Number((totalDoneCells / allTopicEntries.length).toFixed(1))
          : 0,
      totalDoneCells,
      totalHours: (totalMinutes / 60).toFixed(1),
      subjectStats,
      weakTopics,
    };
  }, [subjects, matrixLogs, todayISO]);

  // 출제빈도 탭 필터링 & 정렬
  const filteredFrequencyTopics = useMemo(() => {
    if (!analyticsData) return [];
    const base =
      subjectFilter === "ALL"
        ? analyticsData.topics
        : analyticsData.topics.filter((t) => t.subject === subjectFilter);

    return [...base].sort((a, b) => {
      if (freqSortBy === "count") {
        if (b.totalQuestions !== a.totalQuestions) {
          return b.totalQuestions - a.totalQuestions;
        }
        return a.globalOrder - b.globalOrder;
      }
      if (freqSortBy === "trend") {
        const score = (tr: "UP" | "FLAT" | "DOWN") =>
          tr === "UP" ? 2 : tr === "FLAT" ? 1 : 0;
        if (score(b.trend) !== score(a.trend)) {
          return score(b.trend) - score(a.trend);
        }
        return b.recent3YCount - a.recent3YCount;
      }
      return a.globalOrder - b.globalOrder;
    });
  }, [analyticsData, subjectFilter, freqSortBy]);

  // 최고 빈출 TOP 5
  const topFrequentTopics = useMemo(() => {
    if (!analyticsData) return [];
    const base =
      subjectFilter === "ALL"
        ? analyticsData.topics
        : analyticsData.topics.filter((t) => t.subject === subjectFilter);
    return [...base]
      .sort((a, b) => b.totalQuestions - a.totalQuestions)
      .slice(0, 5);
  }, [analyticsData, subjectFilter]);

  // 학습진도 탭 필터링
  const filteredProgressTopics = useMemo(() => {
    if (!analyticsData) return [];
    let list =
      subjectFilter === "ALL"
        ? analyticsData.topics
        : analyticsData.topics.filter((t) => t.subject === subjectFilter);

    if (progressFilter === "UNSOLVED") {
      list = list.filter((t) => t.solvedCount === 0);
    } else if (progressFilter === "WEAK") {
      list = list
        .filter((t) => t.solvedCount > 0 && (t.accuracyPct ?? 100) < 60)
        .sort((a, b) => (a.accuracyPct ?? 0) - (b.accuracyPct ?? 0));
    }
    return list;
  }, [analyticsData, subjectFilter, progressFilter]);

  const handleScheduleTomorrow = (
    topicId: string,
    defaultKeyword: string,
    minutes: number
  ) => {
    const tomorrowISO = addDaysISO(todayISO, 1);
    upsertMatrixCell(topicId, tomorrowISO, {
      status: "plan",
      keyword: defaultKeyword,
      minutes,
    });
    setToastMsg(`내일(${tomorrowISO}) 플래너 매트릭스에 계획으로 자동 배치했습니다.`);
    globalThis.setTimeout(() => setToastMsg(null), 3500);
  };

  return (
    <MobileAppShell>
      {/* 헤더 */}
      <header className="px-4 py-3 bg-[#16161C] border-b border-white/[0.06] space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-[#FF5A36]" />
              <h1 className="text-sm font-black text-white">
                합격 예측 · 출제 · 진도 통계
              </h1>
            </div>
            <p className="text-[10.5px] text-slate-400 truncate mt-0.5 flex items-center gap-1">
              <BookOpen className="w-3 h-3 text-amber-400 shrink-0" />
              <span>{activeBook.title}</span>
            </p>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={loadAnalytics}
              disabled={loadingDb}
              className="p-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-slate-300 border border-white/[0.08]"
              title="최신 DB 통계 새로고침"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingDb ? "animate-spin" : ""}`} />
            </button>
            <Link
              href="/study/planner"
              className="px-2.5 py-1.5 rounded-xl bg-[#FF5A36]/15 border border-[#FF5A36]/40 text-[#FF7A59] text-[10.5px] font-black flex items-center gap-1 shrink-0"
            >
              <span>플래너</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* 4대 분석 서브탭 */}
        <div className="grid grid-cols-4 gap-1 p-1 rounded-xl bg-[#0E0E12] border border-white/[0.06]">
          {[
            { id: "predict" as const, label: "🎯 합격예측" },
            { id: "frequency" as const, label: "📊 출제빈도" },
            { id: "progress" as const, label: "📈 학습진도" },
            { id: "matrix" as const, label: "🗓️ 회독·구멍" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`py-1.5 rounded-lg text-[10.5px] font-black transition ${
                activeTab === tab.id
                  ? "bg-[#FF5A36] text-white shadow"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      {toastMsg && (
        <div className="mx-4 mt-3 p-3 rounded-xl bg-sky-950/90 border border-sky-500/40 text-sky-200 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      <div className="px-4 py-4 space-y-4">
        {loadingDb && !analyticsData && activeTab !== "matrix" ? (
          <div className="py-16 flex flex-col items-center justify-center gap-2.5 text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin text-[#FF5A36]" />
            <p className="text-xs font-bold">
              기출 1,400제 출제 데이터 및 풀이 이력 분석 중...
            </p>
          </div>
        ) : null}

        {/* ============================================================ */}
        {/* TAB 1: 🎯 합격 예측 & 과목별 예상 점수                       */}
        {/* ============================================================ */}
        {activeTab === "predict" && analyticsData && (
          <div className="space-y-4">
            {/* 1차 · 2차 예상 합격률 카드 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {analyticsData.stagePredictions.map((sp) => {
                const isFirst = sp.examStage === "1차";
                const statusColors =
                  sp.status === "PASS_LIKELY"
                    ? "border-emerald-500/45 bg-gradient-to-br from-emerald-950/40 to-[#16161E]"
                    : sp.status === "FAIL_RISK"
                    ? "border-rose-500/45 bg-gradient-to-br from-rose-950/35 to-[#16161E]"
                    : sp.status === "BORDERLINE"
                    ? "border-amber-500/45 bg-gradient-to-br from-amber-950/30 to-[#16161E]"
                    : "border-white/[0.08] bg-[#1A1A21]";

                const probColor =
                  sp.passProbability === null
                    ? "text-slate-400"
                    : sp.passProbability >= 70
                    ? "text-emerald-400"
                    : sp.passProbability >= 45
                    ? "text-amber-300"
                    : "text-rose-400";

                const statusLabel =
                  sp.status === "PASS_LIKELY"
                    ? "합격 유력"
                    : sp.status === "BORDERLINE"
                    ? "경합권(60점 전후)"
                    : sp.status === "FAIL_RISK"
                    ? sp.failRiskSubjects.length > 0
                      ? "과락 주의보"
                      : "점수 보완 필요"
                    : "표본 수집 전";

                return (
                  <section
                    key={sp.examStage}
                    className={`p-4 rounded-2xl border space-y-3 ${statusColors}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-black text-white ${
                              isFirst ? "bg-sky-600" : "bg-[#FF5A36]"
                            }`}
                          >
                            {sp.examStage} 시험
                          </span>
                          <span className="text-[10px] font-bold text-slate-300">
                            {statusLabel}
                          </span>
                        </div>
                        <div className="text-[10.5px] text-slate-400 mt-1">
                          {sp.subjects.join(" · ")} (과락 40↓ · 평균 60↑)
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="text-[9.5px] font-bold text-slate-400">
                          예상 합격률
                        </div>
                        <div className={`font-mono text-2xl font-black ${probColor}`}>
                          {sp.passProbability !== null ? `${sp.passProbability}%` : "—"}
                        </div>
                      </div>
                    </div>

                    {/* 합격률 진행 바 */}
                    <div className="h-2 rounded-full bg-[#0C0C10] overflow-hidden border border-white/[0.06]">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          (sp.passProbability ?? 0) >= 70
                            ? "bg-emerald-400"
                            : (sp.passProbability ?? 0) >= 45
                            ? "bg-amber-400"
                            : "bg-rose-400"
                        }`}
                        style={{ width: `${sp.passProbability ?? 0}%` }}
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center py-2 rounded-xl bg-[#0F0F14]/80 border border-white/[0.05]">
                      <div>
                        <div className="text-[9px] text-slate-400">예상 평균</div>
                        <div className="font-mono text-xs font-black text-white">
                          {sp.predictedAvg !== null ? `${sp.predictedAvg}점` : "미측정"}
                        </div>
                      </div>
                      <div>
                        <div className="text-[9px] text-slate-400">최저 과목</div>
                        <div
                          className={`font-mono text-xs font-black ${
                            sp.minSubjectScore !== null && sp.minSubjectScore < 40
                              ? "text-rose-400"
                              : "text-slate-200"
                          }`}
                        >
                          {sp.minSubjectScore !== null
                            ? `${sp.minSubjectScore}점`
                            : "—"}
                        </div>
                      </div>
                      <div>
                        <div className="text-[9px] text-slate-400">풀이 표본</div>
                        <div className="font-mono text-xs font-black text-sky-300">
                          {sp.solvedCount}/{sp.totalQuestions}
                        </div>
                      </div>
                    </div>

                    <p className="text-[11px] leading-relaxed text-slate-300 flex items-start gap-1.5">
                      {sp.failRiskSubjects.length > 0 ? (
                        <ShieldAlert className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                      ) : (
                        <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                      )}
                      <span>{sp.summaryMessage}</span>
                    </p>
                  </section>
                );
              })}
            </div>

            {/* 표본 안내 & 20제 풀기 CTA */}
            {analyticsData.overall.totalSolved < 20 && (
              <div className="p-3.5 rounded-2xl bg-[#FF5A36]/10 border border-[#FF5A36]/35 flex items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="text-xs font-black text-white">
                    실전 풀이 데이터가 {analyticsData.overall.totalSolved}문항 누적되었습니다
                  </div>
                  <p className="text-[10.5px] text-slate-300">
                    단원별·회차별 20제를 풀수록 단원 가중 정답률과 지문 O/★/X 숙련도가 반영되어 예측 정밀도가 높아집니다.
                  </p>
                </div>
                <Link
                  href="/study/solve"
                  className="px-3 py-2 rounded-xl bg-[#FF5A36] hover:bg-[#ff6d4d] text-white text-[11px] font-black shrink-0 flex items-center gap-1"
                >
                  <Play className="w-3 h-3 fill-white" />
                  <span>20제 풀기</span>
                </Link>
              </div>
            )}

            {/* 5과목별 예상 점수 & 커트라인 진단 */}
            <section className="p-4 rounded-2xl bg-[#1A1A21] border border-white/[0.06] space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-black text-white flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-amber-400" />
                  <span>과목별 예상 점수 &amp; 전략 공략 단원</span>
                </h2>
                <span className="text-[10px] text-slate-400 font-bold">
                  점선: 과락 40 · 합격 60
                </span>
              </div>

              <div className="space-y-3">
                {analyticsData.subjects.map((subj) => {
                  const syncedColor = customColorLookup.resolve(subj.color, subj.subject);
                  const scorePct = subj.predictedScore ?? 0;
                  const riskBadge =
                    subj.cutlineRisk === "PASS"
                      ? { text: "합격권", cls: "bg-emerald-500/20 text-emerald-300" }
                      : subj.cutlineRisk === "CAUTION"
                      ? { text: "60점 보강", cls: "bg-amber-500/20 text-amber-300" }
                      : subj.cutlineRisk === "DANGER"
                      ? { text: "과락 위험", cls: "bg-rose-500/25 text-rose-300" }
                      : { text: "미측정", cls: "bg-white/[0.06] text-slate-400" };

                  const confLabel =
                    subj.confidenceLevel === "HIGH"
                      ? "신뢰 높음"
                      : subj.confidenceLevel === "MEDIUM"
                      ? "표본 누적중"
                      : subj.confidenceLevel === "LOW"
                      ? "초기 표본"
                      : "풀이 전";

                  return (
                    <div
                      key={subj.subject}
                      className="p-3 rounded-xl bg-[#111116] border border-white/[0.06] space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span
                            className="px-1.5 py-0.5 rounded text-[9px] font-black text-white shrink-0"
                            style={{ backgroundColor: syncedColor }}
                          >
                            {subj.examStage}
                          </span>
                          <span className="text-xs font-black text-white truncate">
                            {subj.subject}
                          </span>
                          <span
                            className={`px-1.5 py-0.5 rounded text-[9px] font-black ${riskBadge.cls}`}
                          >
                            {riskBadge.text}
                          </span>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="font-mono text-sm font-black text-white">
                            {subj.predictedScore !== null ? `${subj.predictedScore}점` : "—"}
                          </span>
                          {subj.scoreRange && (
                            <span className="ml-1 text-[9.5px] font-mono text-slate-400">
                              ({subj.scoreRange[0]}~{subj.scoreRange[1]})
                            </span>
                          )}
                        </div>
                      </div>

                      {/* 40점 과락선 / 60점 합격선 표시 게이지 바 */}
                      <div className="relative h-2.5 rounded-full bg-[#09090D] border border-white/[0.05] overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${scorePct}%`,
                            backgroundColor:
                              subj.cutlineRisk === "DANGER" ? "#FB7185" : syncedColor,
                          }}
                        />
                        {/* 40점 과락 마커 */}
                        <div
                          className="absolute top-0 bottom-0 w-px bg-rose-400/70"
                          style={{ left: "40%" }}
                        />
                        {/* 60점 합격선 마커 */}
                        <div
                          className="absolute top-0 bottom-0 w-0.5 bg-emerald-400/90"
                          style={{ left: "60%" }}
                        />
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] text-slate-400">
                        <div className="flex items-center gap-2 font-mono">
                          <span>
                            풀이{" "}
                            <strong className="text-slate-200">
                              {subj.solvedCount}/{subj.totalQuestions}
                            </strong>
                          </span>
                          <span>
                            가중정답{" "}
                            <strong className="text-slate-200">
                              {subj.weightedAccuracyPct !== null
                                ? `${subj.weightedAccuracyPct}%`
                                : "—"}
                            </strong>
                          </span>
                          <span>
                            지문O{" "}
                            <strong className="text-emerald-300">
                              {subj.optionMasteryPct !== null
                                ? `${subj.optionMasteryPct}%`
                                : "—"}
                            </strong>
                          </span>
                        </div>
                        <span className="text-[9.5px] font-bold text-slate-500">
                          {confLabel}
                        </span>
                      </div>

                      {/* 추천 공략 1순위 단원 */}
                      {subj.topPriorityTopic && (
                        <Link
                          href={`/study/solve?chapter=${subj.topPriorityTopic.chapterCode}`}
                          className="mt-1 px-2.5 py-1.5 rounded-lg bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.05] flex items-center justify-between gap-2 text-[10px] transition"
                        >
                          <div className="flex items-center gap-1.5 min-w-0">
                            <Target className="w-3 h-3 text-[#FF7A59] shrink-0" />
                            <span className="text-slate-400 shrink-0">추천 공략:</span>
                            <span className="font-bold text-slate-200 truncate">
                              {subj.topPriorityTopic.numberedTitle}
                            </span>
                            <span className="text-amber-300 font-mono shrink-0">
                              (비중 {subj.topPriorityTopic.shareInSubjectPct}%)
                            </span>
                          </div>
                          <ArrowRight className="w-3 h-3 text-slate-400 shrink-0" />
                        </Link>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>

            {/* 최근 일별 풀이 추이 */}
            <section className="p-4 rounded-2xl bg-[#1A1A21] border border-white/[0.06] space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-black text-white flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  <span>최근 실전 풀이 &amp; 일일 정답률 추이</span>
                </h2>
                <span className="text-[10px] text-slate-400">최근 14일</span>
              </div>

              {analyticsData.dailyTrend.length === 0 ? (
                <div className="py-6 text-center text-[11px] text-slate-400">
                  아직 문제풀이 기록이 없습니다. <Link href="/study/solve" className="text-[#FF7A59] font-bold underline">단원별 20제</Link>를 풀면 일별 학습 그래프가 그려집니다.
                </div>
              ) : (
                <div className="flex items-end gap-2 h-28 pt-3 overflow-x-auto pb-1">
                  {analyticsData.dailyTrend.map((pt) => {
                    const maxSolved = Math.max(
                      1,
                      ...analyticsData.dailyTrend.map((d) => d.solved)
                    );
                    const barHeight = Math.max(14, Math.round((pt.solved / maxSolved) * 72));
                    return (
                      <div
                        key={pt.dateISO}
                        className="flex flex-col items-center justify-end gap-1 min-w-[36px]"
                      >
                        <span className="text-[9px] font-mono font-bold text-emerald-300">
                          {pt.accuracyPct}%
                        </span>
                        <div
                          className="w-5 rounded-t-md bg-gradient-to-t from-[#FF5A36] to-amber-400 transition-all"
                          style={{ height: `${barHeight}px` }}
                          title={`${pt.dateISO}: ${pt.solved}문항 중 ${pt.correct}문항 정답 (${pt.accuracyPct}%)`}
                        />
                        <span className="text-[9px] font-mono text-slate-300">
                          {pt.solved}제
                        </span>
                        <span className="text-[8.5px] font-mono text-slate-500">
                          {pt.mmdd}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 2: 📊 7개년 출제빈도 빅데이터 (1,400제)                  */}
        {/* ============================================================ */}
        {activeTab === "frequency" && analyticsData && (
          <div className="space-y-4">
            {/* 과목 필터 & 정렬 */}
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
                {SUBJECT_FILTER_OPTIONS.map((subj) => (
                  <button
                    key={subj}
                    type="button"
                    onClick={() => setSubjectFilter(subj)}
                    className={`shrink-0 px-2.5 py-1 rounded-full text-[10.5px] font-bold border transition ${
                      subjectFilter === subj
                        ? "bg-white text-slate-950 border-white"
                        : "bg-[#1A1A21] text-slate-400 border-white/[0.08]"
                    }`}
                  >
                    {subj === "ALL" ? "전체 5과목 (69목차)" : subj}
                  </button>
                ))}
              </div>

              <div className="flex items-center justify-between gap-2 text-[10.5px]">
                <span className="text-slate-400 font-bold">
                  {analyticsData.years[0]}~{analyticsData.years[analyticsData.years.length - 1]}년 기출 {filteredFrequencyTopics.reduce((s, t) => s + t.totalQuestions, 0)}제 분석
                </span>
                <div className="flex items-center gap-1 bg-[#16161C] p-0.5 rounded-lg border border-white/[0.06]">
                  {[
                    { id: "count" as const, label: "빈출순" },
                    { id: "order" as const, label: "목차순" },
                    { id: "trend" as const, label: "상승순" },
                  ].map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setFreqSortBy(s.id)}
                      className={`px-2 py-0.5 rounded text-[10px] font-black transition ${
                        freqSortBy === s.id
                          ? "bg-[#FF5A36] text-white"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 최다 출제 TOP 5 요약 */}
            <section className="p-3.5 rounded-2xl bg-[#1A1A21] border border-amber-500/30 space-y-2.5">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-black text-white flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-amber-400" />
                  <span>최고 빈출 단원 TOP 5 (우선 정복 대상)</span>
                </h2>
                <span className="text-[9.5px] font-mono text-amber-300">
                  {analyticsData.years[0]}~{analyticsData.years[analyticsData.years.length - 1]} 누적
                </span>
              </div>
              <div className="space-y-1.5">
                {topFrequentTopics.map((t, idx) => {
                  const maxQ = Math.max(1, topFrequentTopics[0]?.totalQuestions ?? 39);
                  const wPct = Math.round((t.totalQuestions / maxQ) * 100);
                  const syncedColor = customColorLookup.resolve(
                    t.subjectColor,
                    t.subject,
                    t.chapterCode
                  );
                  return (
                    <Link
                      key={t.chapterCode}
                      href={`/study/solve?chapter=${t.chapterCode}`}
                      className="block p-2 rounded-xl bg-[#111116] hover:bg-[#171720] border border-white/[0.05] space-y-1 transition"
                    >
                      <div className="flex items-center justify-between gap-2 text-[11px]">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="w-4 h-4 rounded bg-amber-500/20 text-amber-300 font-mono text-[9.5px] font-black flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>
                          <span
                            className="px-1.5 py-0.2 rounded text-[9px] font-black text-white shrink-0"
                            style={{ backgroundColor: syncedColor }}
                          >
                            {t.subjectShort}
                          </span>
                          <span className="font-extrabold text-white truncate">
                            {t.numberedTitle}
                          </span>
                        </div>
                        <span className="font-mono text-[10.5px] font-black text-amber-300 shrink-0">
                          {t.totalQuestions}제 ({t.shareInSubjectPct}%)
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-[#09090D] overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${wPct}%`, backgroundColor: syncedColor }}
                        />
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>

            {/* 단원별 7개년 연도 히트맵 & 추세 목록 */}
            <section className="space-y-2">
              {filteredFrequencyTopics.map((t) => {
                const syncedColor = customColorLookup.resolve(
                  t.subjectColor,
                  t.subject,
                  t.chapterCode
                );
                return (
                  <div
                    key={t.chapterCode}
                    className="p-3 rounded-2xl bg-[#1A1A21] border border-white/[0.06] space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 space-y-0.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span
                            className="px-1.5 py-0.2 rounded text-[9px] font-black text-white"
                            style={{ backgroundColor: syncedColor }}
                          >
                            {t.subjectShort}
                          </span>
                          <span className="text-[9.5px] text-slate-400 truncate">
                            {t.unitTitle}
                          </span>
                          {t.trend === "UP" ? (
                            <span className="px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 text-[9px] font-black flex items-center gap-0.5">
                              <TrendingUp className="w-2.5 h-2.5" />
                              최근 상승
                            </span>
                          ) : t.trend === "DOWN" ? (
                            <span className="px-1.5 py-0.2 rounded bg-slate-700/50 text-slate-400 text-[9px] font-bold flex items-center gap-0.5">
                              <TrendingDown className="w-2.5 h-2.5" />
                              감소
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.2 rounded bg-white/[0.05] text-slate-400 text-[9px] font-bold flex items-center gap-0.5">
                              <Minus className="w-2.5 h-2.5" />
                              꾸준 출제
                            </span>
                          )}
                        </div>
                        <div className="text-xs font-black text-white flex items-center gap-1">
                          <span
                            className="font-mono shrink-0"
                            style={{ color: syncedColor }}
                          >
                            {t.topicNo}.
                          </span>
                          <span className="truncate">{t.title}</span>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="font-mono text-xs font-black text-white">
                          총 {t.totalQuestions}제
                        </div>
                        <div className="text-[9.5px] font-mono text-slate-400">
                          연 {t.avgPerYear}문 · 비중 {t.shareInSubjectPct}%
                        </div>
                      </div>
                    </div>

                    {/* 연도별 출제 히트맵 스트립 */}
                    <div
                      className="grid gap-1 pt-0.5"
                      style={{
                        gridTemplateColumns: `repeat(${Math.max(1, analyticsData.years.length)}, minmax(0, 1fr))`,
                      }}
                    >
                      {analyticsData.years.map((yr) => {
                        const cnt = t.yearlyCounts[yr] ?? 0;
                        const heatCls =
                          cnt >= 5
                            ? "bg-[#FF5A36] text-white font-black"
                            : cnt >= 3
                            ? "bg-[#FF5A36]/55 text-white font-black"
                            : cnt >= 1
                            ? "bg-[#FF5A36]/20 text-amber-200 font-bold"
                            : "bg-[#101015] text-slate-600";
                        return (
                          <div
                            key={yr}
                            className={`py-1 rounded-md text-center border border-white/[0.04] ${heatCls}`}
                            title={`${yr}년: ${cnt}문항 출제`}
                          >
                            <div className="text-[8px] opacity-75 font-mono">
                              &apos;{String(yr).slice(-2)}
                            </div>
                            <div className="text-[10px] font-mono leading-tight">
                              {cnt}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="flex items-center justify-between pt-1 text-[10px]">
                      <div className="flex items-center gap-2 font-mono text-slate-400">
                        <span>
                          내 진도{" "}
                          <strong className="text-emerald-300">
                            {t.solvedCount}/{t.totalQuestions}제
                          </strong>
                        </span>
                        <span>
                          정답률{" "}
                          <strong className="text-white">
                            {t.accuracyPct !== null ? `${t.accuracyPct}%` : "—"}
                          </strong>
                        </span>
                      </div>
                      <Link
                        href={`/study/solve?chapter=${t.chapterCode}`}
                        className="px-2.5 py-1 rounded-lg bg-white/[0.06] hover:bg-[#FF5A36] text-slate-200 hover:text-white font-black flex items-center gap-1 transition"
                      >
                        <span>20제 풀기</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </section>
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 3: 📈 학습진도 & 선지 O/★/X 숙련도                        */}
        {/* ============================================================ */}
        {activeTab === "progress" && analyticsData && (
          <div className="space-y-4">
            {/* 전체 진도 · 정답률 · 지문 이해도 KPI */}
            <div className="grid grid-cols-3 gap-2">
              <div className="p-3 rounded-2xl bg-[#1A1A21] border border-white/[0.06] space-y-0.5">
                <div className="text-[9.5px] font-bold text-slate-400">전체 풀이 진도</div>
                <div className="font-mono text-lg font-black text-white">
                  {analyticsData.overall.progressPct}%
                </div>
                <div className="text-[9.5px] font-mono text-slate-400">
                  {analyticsData.overall.totalSolved}/{analyticsData.overall.totalQuestions}제
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-[#1A1A21] border border-emerald-500/30 space-y-0.5">
                <div className="text-[9.5px] font-bold text-slate-400">누적 실전 정답률</div>
                <div className="font-mono text-lg font-black text-emerald-300">
                  {analyticsData.overall.accuracyPct !== null
                    ? `${analyticsData.overall.accuracyPct}%`
                    : "—"}
                </div>
                <div className="text-[9.5px] font-mono text-slate-400">
                  {analyticsData.overall.totalCorrect}정답 / {analyticsData.overall.totalSolved}풀이
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-[#1A1A21] border border-amber-500/30 space-y-0.5">
                <div className="text-[9.5px] font-bold text-slate-400">지문 완전정복 O</div>
                <div className="font-mono text-lg font-black text-amber-300">
                  {analyticsData.overall.optionStats.masteryPct !== null
                    ? `${analyticsData.overall.optionStats.masteryPct}%`
                    : "—"}
                </div>
                <div className="text-[9.5px] font-mono text-slate-400">
                  {analyticsData.overall.optionStats.totalMarks}선지 체크
                </div>
              </div>
            </div>

            {/* 지문 O / ★ / X 분포 막대 */}
            <section className="p-4 rounded-2xl bg-[#1A1A21] border border-white/[0.06] space-y-2.5">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-black text-white flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-[#FF7A59]" />
                  <span>지문(선지) O / ★ / X 이해도 분포</span>
                </h2>
                <Link
                  href="/study/ox"
                  className="text-[10.5px] font-black text-[#FF7A59] hover:underline flex items-center gap-1"
                >
                  <span>약점 O/X 복습</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>

              {analyticsData.overall.optionStats.totalMarks === 0 ? (
                <p className="text-[11px] text-slate-400 py-2">
                  문제풀이 시 선지 옆 <strong>[O / ★ / X]</strong>를 체크하면 지문별 정복률과 약점 선지가 자동 집계됩니다.
                </p>
              ) : (
                <>
                  <div className="h-3 rounded-full bg-[#101015] overflow-hidden flex border border-white/[0.05]">
                    <div
                      className="bg-emerald-400 h-full"
                      style={{
                        width: `${Math.round(
                          (analyticsData.overall.optionStats.oCount /
                            analyticsData.overall.optionStats.totalMarks) *
                            100
                        )}%`,
                      }}
                    />
                    <div
                      className="bg-amber-400 h-full"
                      style={{
                        width: `${Math.round(
                          (analyticsData.overall.optionStats.starCount /
                            analyticsData.overall.optionStats.totalMarks) *
                            100
                        )}%`,
                      }}
                    />
                    <div
                      className="bg-rose-400 h-full"
                      style={{
                        width: `${Math.round(
                          (analyticsData.overall.optionStats.xCount /
                            analyticsData.overall.optionStats.totalMarks) *
                            100
                        )}%`,
                      }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[10.5px] font-mono">
                    <span className="text-emerald-300 font-bold">
                      ✓ O 앎: {analyticsData.overall.optionStats.oCount}개
                    </span>
                    <span className="text-amber-300 font-bold">
                      ★ 헷갈림: {analyticsData.overall.optionStats.starCount}개
                    </span>
                    <span className="text-rose-300 font-bold">
                      ✕ X 모름: {analyticsData.overall.optionStats.xCount}개
                    </span>
                  </div>
                </>
              )}
            </section>

            {/* 필터 바 */}
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
                {SUBJECT_FILTER_OPTIONS.map((subj) => (
                  <button
                    key={subj}
                    type="button"
                    onClick={() => setSubjectFilter(subj)}
                    className={`shrink-0 px-2.5 py-1 rounded-full text-[10.5px] font-bold border transition ${
                      subjectFilter === subj
                        ? "bg-white text-slate-950 border-white"
                        : "bg-[#1A1A21] text-slate-400 border-white/[0.08]"
                    }`}
                  >
                    {subj === "ALL" ? "전체 과목" : subj}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-1.5">
                {[
                  { id: "ALL" as const, label: "전체 단원" },
                  { id: "UNSOLVED" as const, label: "미풀이 단원만" },
                  { id: "WEAK" as const, label: "정답률 60% 미만 취약" },
                ].map((pf) => (
                  <button
                    key={pf.id}
                    type="button"
                    onClick={() => setProgressFilter(pf.id)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-black border transition ${
                      progressFilter === pf.id
                        ? "bg-[#FF5A36]/20 text-[#FF7A59] border-[#FF5A36]/50"
                        : "bg-[#16161C] text-slate-400 border-white/[0.06]"
                    }`}
                  >
                    {pf.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 단원별 진도 & 정답률 목록 */}
            <section className="space-y-2">
              {filteredProgressTopics.length === 0 ? (
                <div className="p-6 rounded-2xl bg-[#1A1A21] border border-white/[0.06] text-center text-xs text-slate-400">
                  해당 조건에 맞는 단원이 없습니다.
                </div>
              ) : (
                filteredProgressTopics.map((t) => {
                  const progPct =
                    t.totalQuestions > 0
                      ? Math.round((t.solvedCount / t.totalQuestions) * 100)
                      : 0;
                  const syncedColor = customColorLookup.resolve(
                    t.subjectColor,
                    t.subject,
                    t.chapterCode
                  );
                  return (
                    <div
                      key={t.chapterCode}
                      className="p-3 rounded-2xl bg-[#1A1A21] border border-white/[0.06] space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span
                            className="px-1.5 py-0.2 rounded text-[9px] font-black text-white shrink-0"
                            style={{ backgroundColor: syncedColor }}
                          >
                            {t.subjectShort}
                          </span>
                          <span
                            className="font-mono text-[11px] font-black shrink-0"
                            style={{ color: syncedColor }}
                          >
                            {t.topicNo}.
                          </span>
                          <span className="text-xs font-extrabold text-white truncate">
                            {t.title}
                          </span>
                        </div>

                        <span className="font-mono text-[10.5px] font-black text-slate-200 shrink-0">
                          {t.solvedCount}/{t.totalQuestions}제 ({progPct}%)
                        </span>
                      </div>

                      <div className="h-1.5 rounded-full bg-[#101015] overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${progPct}%`, backgroundColor: syncedColor }}
                        />
                      </div>

                      <div className="flex items-center justify-between gap-2 text-[10px]">
                        <div className="flex items-center gap-2 font-mono text-slate-400">
                          <span>
                            정답률{" "}
                            <strong
                              className={
                                t.accuracyPct === null
                                  ? "text-slate-500"
                                  : t.accuracyPct >= 60
                                  ? "text-emerald-300"
                                  : "text-rose-400"
                              }
                            >
                              {t.accuracyPct !== null ? `${t.accuracyPct}%` : "미풀이"}
                            </strong>
                          </span>
                          {(t.optOCount > 0 || t.optStarCount > 0 || t.optXCount > 0) && (
                            <span>
                              지문 O{t.optOCount}/★{t.optStarCount}/X{t.optXCount}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() =>
                              handleScheduleTomorrow(
                                `top-${t.chapterCode}`,
                                t.title.slice(0, 6),
                                35
                              )
                            }
                            className="px-2 py-1 rounded-lg bg-white/[0.05] hover:bg-white/[0.12] text-slate-300 font-bold"
                          >
                            내일계획
                          </button>
                          <Link
                            href={`/study/solve?chapter=${t.chapterCode}`}
                            className="px-2 py-1 rounded-lg bg-[#FF5A36]/15 hover:bg-[#FF5A36]/30 border border-[#FF5A36]/40 text-[#FF7A59] font-black"
                          >
                            풀기
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </section>
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 4: 🗓️ 기존 플래너 매트릭스 회독 · 구멍 분석              */}
        {/* ============================================================ */}
        {activeTab === "matrix" && (
          <div className="space-y-4">
            {/* 4대 핵심 KPI */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="p-3.5 rounded-2xl bg-[#1A1A21] border border-white/[0.06] space-y-1">
                <div className="text-[10px] font-bold text-slate-400">전 범위 커버율</div>
                <div className="font-mono text-xl font-black text-white">
                  {matrixAnalytics.coveragePct}%
                </div>
                <div className="text-[10px] text-slate-400 font-mono">
                  {matrixAnalytics.coveredCount}/{matrixAnalytics.totalTopics} 목차 1회독+
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#1A1A21] border border-[#FF5A36]/30 space-y-1">
                <div className="text-[10px] font-bold text-slate-400">평균 누적 회독</div>
                <div className="font-mono text-xl font-black text-[#FF7A59]">
                  {matrixAnalytics.avgRounds}R
                </div>
                <div className="text-[10px] text-slate-400 font-mono">
                  총 {matrixAnalytics.totalDoneCells}회 색칠
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#1A1A21] border border-white/[0.06] space-y-1">
                <div className="text-[10px] font-bold text-slate-400">매트릭스 누적 시간</div>
                <div className="font-mono text-xl font-black text-emerald-300">
                  {matrixAnalytics.totalHours}h
                </div>
                <div className="text-[10px] text-slate-400 font-mono">완료 셀 합산</div>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#1A1A21] border border-rose-500/30 space-y-1">
                <div className="text-[10px] font-bold text-slate-400">미학습 구멍 목차</div>
                <div className="font-mono text-xl font-black text-rose-400">
                  {matrixAnalytics.totalTopics - matrixAnalytics.coveredCount}개
                </div>
                <div className="text-[10px] text-rose-300/80 font-bold">0회독 집중 필요</div>
              </div>
            </div>

            {/* 과목별 회독 현황 막대 */}
            <section className="p-4 rounded-2xl bg-[#1A1A21] border border-white/[0.06] space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-black text-white flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-[#FF5A36]" />
                  <span>과목별 범위 커버 &amp; 회독 밸런스</span>
                </h2>
                <span className="text-[10px] text-slate-400 font-bold">1차 · 2차 통합</span>
              </div>

              <div className="space-y-2.5">
                {matrixAnalytics.subjectStats.map((item) => {
                  const roundShade = getRoundColorStyle(
                    item.subject.color,
                    item.avgRounds > 0 ? Math.max(1, Math.round(item.avgRounds)) : 0
                  );
                  return (
                    <div key={item.subject.id} className="space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span
                            className="px-1.5 py-0.2 rounded text-[9px] font-black text-white"
                            style={{ backgroundColor: item.subject.color }}
                          >
                            {item.subject.category || item.subject.examStage}
                          </span>
                          <span className="font-extrabold text-white truncate">
                            {item.subject.title}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 font-mono text-[10.5px] shrink-0">
                          <span className="text-slate-400">
                            {item.coveredTopics}/{item.totalTopics}목차
                          </span>
                          <span
                            className="px-1.5 py-0.2 rounded text-[9.5px] font-black"
                            style={{
                              backgroundColor: roundShade.backgroundColor,
                              border: `1px solid ${roundShade.borderColor}`,
                              color: roundShade.textColor,
                              boxShadow: roundShade.boxShadow,
                            }}
                          >
                            평균 {item.avgRounds}R
                          </span>
                        </div>
                      </div>

                      <div className="h-2 rounded-full bg-[#101015] overflow-hidden border border-white/[0.04]">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${item.coveragePct}%`,
                            backgroundColor:
                              item.avgRounds > 0
                                ? roundShade.backgroundColor
                                : item.subject.color,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* 구멍(0회독) & 망각 주의 목차 TOP 6 */}
            <section className="p-4 rounded-2xl bg-[#1A1A21] border border-white/[0.06] space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-black text-white flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <span>구멍 · 망각 주의 목차 (지금 볼 타이밍)</span>
                </h2>
                <span className="text-[10px] text-slate-400 font-bold">내일 계획 직결</span>
              </div>

              <div className="space-y-2">
                {matrixAnalytics.weakTopics.map(
                  ({ subject, unit, topic, doneCount, daysSinceLast }) => {
                    const topicRoundShade = getRoundColorStyle(subject.color, doneCount);
                    return (
                      <div
                        key={topic.id}
                        className="p-3 rounded-xl bg-[#111116] border border-white/[0.06] flex items-center justify-between gap-2.5"
                      >
                        <div className="min-w-0 space-y-0.5">
                          <div className="flex items-center gap-1.5">
                            <span
                              className="w-2 h-2 rounded-full shrink-0"
                              style={{ backgroundColor: subject.color }}
                            />
                            <span className="text-[10px] font-bold text-slate-400 truncate">
                              {subject.shortTitle} &gt; {unit.title}
                            </span>
                            {doneCount === 0 ? (
                              <span className="px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 text-[9px] font-black">
                                0회독 구멍
                              </span>
                            ) : (
                              <span
                                className="px-1.5 py-0.2 rounded text-[9px] font-mono font-black"
                                style={{
                                  backgroundColor: topicRoundShade.backgroundColor,
                                  border: `1px solid ${topicRoundShade.borderColor}`,
                                  color: topicRoundShade.textColor,
                                }}
                              >
                                {daysSinceLast}일 전 ({doneCount}R)
                              </span>
                            )}
                          </div>
                        <div className="text-xs font-extrabold text-white truncate flex items-center gap-1">
                          {topic.topicNo && (
                            <span
                              className="font-mono shrink-0"
                              style={{ color: subject.color }}
                            >
                              {topic.topicNo}.
                            </span>
                          )}
                          <span className="truncate">{topic.title}</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          handleScheduleTomorrow(
                            topic.id,
                            topic.defaultKeyword,
                            topic.estimatedMinutes
                          )
                        }
                        className="px-2.5 py-1.5 rounded-lg bg-[#FF5A36]/15 hover:bg-[#FF5A36]/30 border border-[#FF5A36]/40 text-[#FF7A59] text-[10px] font-black flex items-center gap-1 shrink-0 transition"
                      >
                        <CalendarPlus className="w-3 h-3" />
                        <span>내일 계획</span>
                      </button>
                    </div>
                  );
                }
              )}
              </div>

              <div className="pt-1 flex items-center justify-end">
                <Link
                  href="/study/more?view=calendar"
                  className="text-[11px] font-bold text-slate-300 hover:text-white flex items-center gap-1"
                >
                  <Clock className="w-3.5 h-3.5 text-sky-400" />
                  <span>월간 달력으로 일별 기록 보기</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </section>
          </div>
        )}
      </div>
    </MobileAppShell>
  );
}
