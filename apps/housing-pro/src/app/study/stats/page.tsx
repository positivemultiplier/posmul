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
  Timer,
  Calendar,
} from "lucide-react";
import { MobileAppShell } from "@/components/mobile/mobile-app-shell";
import { useStudyCurriculum } from "@/lib/study-curriculum-store";
import { useStudyAuth } from "@/components/auth/study-auth-provider";
import {
  computePeriodPlanActualGap,
  computeStudyRhythmAnalytics,
  formatGapMinutesKo,
  formatMinutesKo,
} from "@/lib/study-plan-analytics";
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

type StatsTab = "gap" | "matrix" | "exam";
type ExamSubTab = "predict" | "frequency" | "progress";
type GapPeriod = "today" | "week" | "30d" | "all";

function getMondayStartWeekISOs(anchorISO: string): string[] {
  const [y, m, d] = anchorISO.split("-").map(Number);
  const dt = new Date(y, (m || 1) - 1, d || 1);
  const day = dt.getDay();
  const diffToMon = day === 0 ? -6 : 1 - day;
  const mondayISO = addDaysISO(anchorISO, diffToMon);
  return Array.from({ length: 7 }, (_, i) => addDaysISO(mondayISO, i));
}

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
    activeBookIds,
    subjects,
    matrixLogs,
    timetablesByDate,
    upsertMatrixCell,
  } = useStudyCurriculum();

  const [activeTab, setActiveTab] = useState<StatsTab>("gap");
  const [examSubTab, setExamSubTab] = useState<ExamSubTab>("predict");
  const [gapPeriod, setGapPeriod] = useState<GapPeriod>("week");
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  useEffect(() => {
    if (typeof globalThis !== "undefined" && "location" in globalThis) {
      const params = new globalThis.URLSearchParams(globalThis.location.search);
      const tab = params.get("tab");
      if (tab === "gap" || tab === "matrix" || tab === "exam") {
        setActiveTab(tab);
      } else if (tab === "predict" || tab === "frequency" || tab === "progress") {
        setActiveTab("exam");
        setExamSubTab(tab);
      }
    }
  }, []);

  // DB 실시간 기출 분석 데이터 상태 (exam 탭 진입 시에만 지연 로딩하여 0ms 초기 진입 보장)
  const [analyticsData, setAnalyticsData] = useState<StudyAnalyticsResult | null>(null);
  const [loadingDb, setLoadingDb] = useState<boolean>(false);
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
    if (authLoading || activeTab !== "exam" || analyticsData) return;
    void loadAnalytics();
  }, [authLoading, activeTab, analyticsData, effectiveOwnerKey]);

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

  // 계획 vs 실행(타이머) Gap 상세 수치 계산
  const gapDateISOs = useMemo(() => {
    if (gapPeriod === "today") return [todayISO];
    if (gapPeriod === "week") return getMondayStartWeekISOs(todayISO);
    if (gapPeriod === "30d") {
      return Array.from({ length: 30 }, (_, idx) => addDaysISO(todayISO, -(29 - idx)));
    }
    const dateSet = new Set<string>([todayISO]);
    for (const key of Object.keys(matrixLogs)) {
      const sepIdx = key.indexOf("::");
      if (sepIdx !== -1) {
        const dISO = key.slice(sepIdx + 2);
        if (dISO) dateSet.add(dISO);
      }
    }
    for (const dISO of Object.keys(timetablesByDate)) {
      if (dISO) dateSet.add(dISO);
    }
    return Array.from(dateSet).sort();
  }, [gapPeriod, todayISO, matrixLogs, timetablesByDate]);

  const planActualGap = useMemo(
    () =>
      computePeriodPlanActualGap({
        dateISOs: gapDateISOs,
        subjects,
        matrixLogs,
        timetablesByDate,
        activeBookIds,
      }),
    [gapDateISOs, subjects, matrixLogs, timetablesByDate, activeBookIds]
  );

  const studyRhythm = useMemo(
    () =>
      computeStudyRhythmAnalytics({
        dateISOs: gapDateISOs,
        todayISO,
        subjects,
        matrixLogs,
        timetablesByDate,
        activeBookIds,
      }),
    [gapDateISOs, todayISO, subjects, matrixLogs, timetablesByDate, activeBookIds]
  );

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
            {activeTab === "exam" && (
              <button
                type="button"
                onClick={loadAnalytics}
                disabled={loadingDb}
                className="p-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-slate-300 border border-white/[0.08]"
                title="최신 기출 DB 통계 새로고침"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingDb ? "animate-spin" : ""}`} />
              </button>
            )}
            <Link
              href="/study/planner"
              className="px-2.5 py-1.5 rounded-xl bg-[#FF5A36]/15 border border-[#FF5A36]/40 text-[#FF7A59] text-[10.5px] font-black flex items-center gap-1 shrink-0"
            >
              <span>플래너</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* 초고속 3대 핵심 분석 탭 (계획·실행 우선) */}
        <div className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-[#0E0E12] border border-white/[0.06]">
          {[
            { id: "gap" as const, label: "⏱️ 계획 · 실행" },
            { id: "matrix" as const, label: "🗓️ 회독 · 구멍" },
            { id: "exam" as const, label: "🎯 기출 · 빈출" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 rounded-lg text-[11px] font-black transition truncate ${
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
        {/* ============================================================ */}
        {/* TAB 3: 🎯 기출 실력 · 출제 빈도 · 진도 (지연 로딩 통합)       */}
        {/* ============================================================ */}
        {activeTab === "exam" && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-[#1A1A21] border border-white/[0.08] text-[10.5px] font-black">
              {[
                { id: "predict" as const, label: "🎯 합격 예측" },
                { id: "frequency" as const, label: "📊 출제 빈도" },
                { id: "progress" as const, label: "📈 기출 진도" },
              ].map((sub) => (
                <button
                  key={sub.id}
                  type="button"
                  onClick={() => setExamSubTab(sub.id)}
                  className={`py-1.5 rounded-lg transition ${
                    examSubTab === sub.id
                      ? "bg-white/[0.12] text-white"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  {sub.label}
                </button>
              ))}
            </div>

            {loadingDb && !analyticsData && (
              <div className="py-16 flex flex-col items-center justify-center gap-2.5 text-slate-400">
                <Loader2 className="w-6 h-6 animate-spin text-[#FF5A36]" />
                <p className="text-xs font-bold">
                  기출 1,400제 출제 데이터 및 풀이 이력 불러오는 중...
                </p>
              </div>
            )}
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 3-1: 🎯 합격 예측 & 과목별 예상 점수                     */}
        {/* ============================================================ */}
        {activeTab === "exam" && examSubTab === "predict" && analyticsData && (
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
        {activeTab === "exam" && examSubTab === "frequency" && analyticsData && (
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
        {activeTab === "exam" && examSubTab === "progress" && analyticsData && (
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

        {/* ============================================================ */}
        {/* TAB 5: ⏱️ 계획 vs 타이머 실행 Gap 상세 수치 분석             */}
        {/* ============================================================ */}
        {activeTab === "gap" && (
          <div className="space-y-4">
            {/* 기간 선택 바 + 일정표 바로가기 */}
            <div className="p-3 rounded-2xl bg-[#1A1A21] border border-white/[0.06] flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1 bg-[#0E0E12] p-1 rounded-xl border border-white/[0.06] text-[10.5px] font-black">
                {[
                  { id: "today" as const, label: "오늘" },
                  { id: "week" as const, label: "이번 주" },
                  { id: "30d" as const, label: "최근 30일" },
                  { id: "all" as const, label: "전체" },
                ].map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setGapPeriod(p.id)}
                    className={`px-2.5 py-1 rounded-lg transition ${
                      gapPeriod === p.id
                        ? "bg-[#FF5A36] text-white"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="px-2 py-1 rounded-lg bg-[#FF5A36]/15 border border-[#FF5A36]/35 text-[10px] font-black text-[#FF8A6B] flex items-center gap-1">
                  <Flame className="w-3 h-3" />
                  <span>{studyRhythm.streakDays}일 연속 실행</span>
                </span>
                <Link
                  href="/study/planner?tab=diary"
                  className="text-[10.5px] font-black text-sky-300 hover:text-sky-200 flex items-center gap-1"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>일정표</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>

            {/* 4대 수치 KPI */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="p-3.5 rounded-2xl bg-[#1A1A21] border border-sky-500/25 space-y-1">
                <div className="text-[10px] font-bold text-slate-400">총 예상 계획</div>
                <div className="font-mono text-lg font-black text-sky-300">
                  {formatMinutesKo(planActualGap.totalPlanMinutes)}
                </div>
                <div className="text-[10px] text-slate-400 font-mono">
                  {planActualGap.totalPlanMinutes}분 ({planActualGap.totalPlanSlots}슬롯)
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#1A1A21] border border-[#FF5A36]/35 space-y-1">
                <div className="text-[10px] font-bold text-slate-400">타이머 실제 실행</div>
                <div className="font-mono text-lg font-black text-[#FF7A59]">
                  {formatMinutesKo(planActualGap.totalActualMinutes)}
                </div>
                <div className="text-[10px] text-slate-400 font-mono">
                  {planActualGap.totalActualMinutes}분 · 달성률 {planActualGap.achievementPct}%
                </div>
              </div>

              <div
                className={`p-3.5 rounded-2xl bg-[#1A1A21] border space-y-1 ${
                  planActualGap.totalGapMinutes >= 0
                    ? "border-emerald-500/35"
                    : "border-rose-500/35"
                }`}
              >
                <div className="text-[10px] font-bold text-slate-400">계획 vs 실행 Gap</div>
                <div
                  className={`font-mono text-lg font-black ${
                    planActualGap.totalGapMinutes >= 0
                      ? "text-emerald-300"
                      : "text-rose-400"
                  }`}
                >
                  {formatGapMinutesKo(planActualGap.totalGapMinutes)}
                </div>
                <div className="text-[10px] text-slate-400 font-mono">
                  {planActualGap.totalGapMinutes >= 0 ? "계획 초과 달성" : "계획 대비 부족"}
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#1A1A21] border border-white/[0.06] space-y-1">
                <div className="text-[10px] font-bold text-slate-400">계획 시간대 적중률</div>
                <div className="font-mono text-lg font-black text-emerald-300">
                  {planActualGap.totalPlanSlots > 0
                    ? `${planActualGap.slotMatchPct}%`
                    : "—"}
                </div>
                <div className="text-[10px] text-slate-400 font-mono">
                  {planActualGap.matchedSlots}/{planActualGap.totalPlanSlots}칸 시간 일치
                </div>
              </div>
            </div>

            {/* 집중 골든타임 리듬 & 과목 밸런스 진단 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* 시간대별 집중 골든타임 */}
              <section className="p-4 rounded-2xl bg-[#1A1A21] border border-white/[0.06] space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-xs font-black text-white flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-amber-400" />
                    <span>시간대별 집중 리듬</span>
                  </h2>
                  {studyRhythm.goldenBand ? (
                    <span className="px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/35 text-[10px] font-black text-amber-200">
                      골든타임: {studyRhythm.goldenBand.label} ({studyRhythm.goldenBand.rangeLabel})
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-500 font-bold">기록 대기</span>
                  )}
                </div>

                <div className="space-y-2">
                  {(() => {
                    const maxBandMin = Math.max(
                      30,
                      ...studyRhythm.timeBands.map((b) =>
                        Math.max(b.planMinutes, b.actualMinutes)
                      )
                    );
                    return studyRhythm.timeBands.map((band) => {
                      const planPct = Math.round((band.planMinutes / maxBandMin) * 100);
                      const actualPct = Math.round((band.actualMinutes / maxBandMin) * 100);
                      const isGolden = studyRhythm.goldenBand?.id === band.id;
                      return (
                        <div key={band.id} className="space-y-1">
                          <div className="flex items-center justify-between text-[10.5px]">
                            <span
                              className={`font-black ${
                                isGolden ? "text-amber-300" : "text-slate-200"
                              }`}
                            >
                              {band.label}{" "}
                              <span className="text-[9.5px] font-mono text-slate-400">
                                ({band.rangeLabel})
                              </span>
                            </span>
                            <span className="font-mono text-[10px] text-slate-300">
                              <strong className="text-sky-300">예 {band.planMinutes}m</strong>
                              {" / "}
                              <strong className="text-[#FF7A59]">실 {band.actualMinutes}m</strong>
                            </span>
                          </div>
                          <div className="h-2 rounded-full bg-[#101015] border border-white/[0.04] overflow-hidden relative">
                            <div
                              className="absolute inset-y-0 left-0 bg-sky-400/35 rounded-full"
                              style={{ width: `${planPct}%` }}
                            />
                            <div
                              className="absolute inset-y-0 left-0 bg-[#FF5A36] rounded-full transition-all duration-300"
                              style={{ width: `${actualPct}%` }}
                            />
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </section>

              {/* 과목 밸런스 / 편식 진단 */}
              <section className="p-4 rounded-2xl bg-[#1A1A21] border border-white/[0.06] space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-xs font-black text-white flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-sky-400" />
                    <span>과목 밸런스 · 편식 진단</span>
                  </h2>
                  {studyRhythm.underStudiedSubjects.length > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-rose-500/15 border border-rose-500/35 text-[10px] font-black text-rose-300">
                      {studyRhythm.underStudiedSubjects.length}과목 보강 필요
                    </span>
                  )}
                </div>

                {studyRhythm.subjectShareRows.length === 0 ? (
                  <div className="p-4 rounded-xl bg-[#111116] text-center text-xs text-slate-400">
                    활성화된 과목이 없습니다. 플래너에서 책·과목을 추가해 보세요.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {studyRhythm.subjectShareRows.map((row) => (
                      <div key={row.subject.id} className="space-y-1">
                        <div className="flex items-center justify-between text-[10.5px]">
                          <span className="font-extrabold text-white flex items-center gap-1.5 truncate">
                            <span
                              className="w-2 h-2 rounded-full shrink-0"
                              style={{ backgroundColor: row.subject.color }}
                            />
                            <span className="truncate">{row.subject.shortTitle}</span>
                          </span>
                          <span className="font-mono text-[10px] shrink-0">
                            <strong className="text-white">{row.sharePct}%</strong>
                            <span className="text-slate-400 ml-1">
                              ({formatMinutesKo(row.actualMinutes)})
                            </span>
                          </span>
                        </div>
                        <div className="h-2 rounded-full bg-[#101015] border border-white/[0.04] overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-300"
                            style={{
                              width: `${row.sharePct}%`,
                              backgroundColor: row.subject.color,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                    {studyRhythm.underStudiedSubjects.length > 0 && (
                      <div className="p-2 rounded-xl bg-rose-950/35 border border-rose-500/25 text-[10px] text-rose-200 font-bold">
                        💡 부족 과목:{" "}
                        {studyRhythm.underStudiedSubjects
                          .slice(0, 3)
                          .map((s) => s.shortTitle)
                          .join(", ")}{" "}
                        비중을 조금 늘려 과락 위험을 줄여보세요.
                      </div>
                    )}
                  </div>
                )}
              </section>
            </div>

            {/* 과목별 계획 vs 실행 Gap 상세 수치 Table */}
            <section className="p-4 rounded-2xl bg-[#1A1A21] border border-white/[0.06] space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-black text-white flex items-center gap-1.5">
                  <Timer className="w-4 h-4 text-[#FF5A36]" />
                  <span>과목별 계획 vs 타이머 실행 Gap</span>
                </h2>
                <span className="text-[10px] text-slate-400 font-mono">단위: 분</span>
              </div>

              <div className="overflow-x-auto rounded-xl border border-white/[0.06] bg-[#111116]">
                <table className="w-full text-[11px] border-collapse">
                  <thead>
                    <tr className="bg-[#16161E] border-b border-white/[0.06] text-[10px] text-slate-400 font-bold">
                      <th className="py-2 px-3 text-left">과목</th>
                      <th className="py-2 px-2 text-right">계획</th>
                      <th className="py-2 px-2 text-right">타이머</th>
                      <th className="py-2 px-2 text-right">Gap</th>
                      <th className="py-2 px-3 text-right">달성률</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {planActualGap.subjectRows.map((row) => (
                      <tr key={row.subject.id}>
                        <td className="py-2 px-3">
                          <div className="flex items-center gap-1.5">
                            <span
                              className="w-2 h-2 rounded-full shrink-0"
                              style={{ backgroundColor: row.subject.color }}
                            />
                            <span className="font-extrabold text-white truncate max-w-[110px]">
                              {row.subject.shortTitle}
                            </span>
                          </div>
                        </td>
                        <td className="py-2 px-2 text-right font-mono text-sky-300 font-bold">
                          {row.planMinutes}분
                        </td>
                        <td className="py-2 px-2 text-right font-mono text-[#FF7A59] font-black">
                          {row.actualMinutes}분
                        </td>
                        <td
                          className={`py-2 px-2 text-right font-mono font-black ${
                            row.gapMinutes > 0
                              ? "text-emerald-300"
                              : row.gapMinutes < 0
                                ? "text-rose-400"
                                : "text-slate-400"
                          }`}
                        >
                          {row.gapMinutes > 0 ? `+${row.gapMinutes}분` : `${row.gapMinutes}분`}
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-black text-slate-200">
                          {row.planMinutes > 0 ? `${row.achievementPct}%` : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* 일별 계획 vs 실행 Gap 상세 수치 Table */}
            <section className="p-4 rounded-2xl bg-[#1A1A21] border border-white/[0.06] space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-black text-white flex items-center gap-1.5">
                  <BarChart3 className="w-4 h-4 text-sky-400" />
                  <span>일별 계획 vs 실행 상세 내역</span>
                </h2>
                <span className="text-[10px] text-slate-400 font-mono">
                  {planActualGap.dailyRows.length}일 기준
                </span>
              </div>

              <div className="overflow-x-auto max-h-[280px] overflow-y-auto rounded-xl border border-white/[0.06] bg-[#111116]">
                <table className="w-full text-[11px] border-collapse">
                  <thead className="sticky top-0 bg-[#16161E] border-b border-white/[0.06] text-[10px] text-slate-400 font-bold">
                    <tr>
                      <th className="py-2 px-3 text-left">날짜</th>
                      <th className="py-2 px-2 text-right">계획</th>
                      <th className="py-2 px-2 text-right">타이머</th>
                      <th className="py-2 px-2 text-right">Gap</th>
                      <th className="py-2 px-3 text-right">달성</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {[...planActualGap.dailyRows]
                      .filter(
                        (r) =>
                          r.planMinutes > 0 || r.actualMinutes > 0 || r.dateISO === todayISO
                      )
                      .reverse()
                      .map((row) => (
                        <tr
                          key={row.dateISO}
                          className={row.dateISO === todayISO ? "bg-[#FF5A36]/[0.08]" : ""}
                        >
                          <td className="py-2 px-3 font-mono font-bold text-white">
                            {row.dateISO === todayISO
                              ? `오늘 (${row.dateISO.slice(5)})`
                              : row.dateISO.slice(5)}
                          </td>
                          <td className="py-2 px-2 text-right font-mono text-sky-300 font-bold">
                            {row.planMinutes}분
                          </td>
                          <td className="py-2 px-2 text-right font-mono text-[#FF7A59] font-black">
                            {row.actualMinutes}분
                          </td>
                          <td
                            className={`py-2 px-2 text-right font-mono font-black ${
                              row.gapMinutes > 0
                                ? "text-emerald-300"
                                : row.gapMinutes < 0
                                  ? "text-rose-400"
                                  : "text-slate-400"
                            }`}
                          >
                            {row.gapMinutes > 0
                              ? `+${row.gapMinutes}분`
                              : `${row.gapMinutes}분`}
                          </td>
                          <td className="py-2 px-3 text-right font-mono text-slate-200 font-black">
                            {row.planMinutes > 0 ? `${row.achievementPct}%` : "—"}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* 계획 대비 타이머 실행 부족 단원 TOP */}
            <section className="p-4 rounded-2xl bg-[#1A1A21] border border-white/[0.06] space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-black text-white flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                  <span>계획 미달 단원 Gap TOP (보강 필요)</span>
                </h2>
                <span className="text-[10px] text-slate-400 font-bold">Gap 큰 순</span>
              </div>

              {planActualGap.shortfallTopics.length === 0 ? (
                <div className="p-4 rounded-xl bg-[#111116] border border-white/[0.05] text-center text-xs text-emerald-300 font-bold">
                  선택한 기간에 계획 대비 부족한 단원이 없습니다!
                </div>
              ) : (
                <div className="space-y-2">
                  {planActualGap.shortfallTopics.slice(0, 8).map((item) => (
                    <div
                      key={`${item.topicId}-${item.dateISO}`}
                      className="p-3 rounded-xl bg-[#111116] border border-white/[0.06] flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0 space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: item.color }}
                          />
                          <span className="text-[10px] font-mono text-slate-400">
                            {item.dateISO.slice(5)} · {item.subject.shortTitle}
                          </span>
                          <span className="px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 font-mono text-[9px] font-black">
                            Gap {item.gapMinutes}분
                          </span>
                        </div>
                        <div className="text-xs font-extrabold text-white truncate">
                          {item.topic.topicNo ? `${item.topic.topicNo}. ` : ""}
                          {item.topic.title}
                        </div>
                        <div className="text-[10px] font-mono text-slate-400">
                          계획 <strong className="text-sky-300">{item.planMinutes}분</strong> ·
                          타이머 <strong className="text-[#FF7A59]">{item.actualMinutes}분</strong>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <Link
                          href={`/?topic=${item.topicId}`}
                          className="px-2 py-1.5 rounded-lg bg-[#FF5A36] hover:bg-[#ff6d4d] text-white text-[10px] font-black flex items-center gap-1 transition"
                        >
                          <Play className="w-3 h-3 fill-white" />
                          <span>타이머</span>
                        </Link>
                        <button
                          type="button"
                          onClick={() =>
                            handleScheduleTomorrow(
                              item.topicId,
                              item.topic.defaultKeyword,
                              Math.abs(item.gapMinutes)
                            )
                          }
                          className="px-2 py-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.08] text-slate-200 text-[10px] font-bold transition"
                        >
                          내일 보강
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </div>
    </MobileAppShell>
  );
}
