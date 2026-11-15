"use client";

import { useMemo, useState } from "react";
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
} from "lucide-react";
import { MobileAppShell } from "@/components/mobile/mobile-app-shell";
import { useStudyCurriculum } from "@/lib/study-curriculum-store";
import { addDaysISO, diffDaysISO, flattenTopics } from "@/data/study-textbooks";

export default function StudyStatisticsPage() {
  const {
    todayISO,
    activeBook,
    subjects,
    matrixLogs,
    upsertMatrixCell,
  } = useStudyCurriculum();

  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // 매트릭스 전체 기반 통계 계산
  const analytics = useMemo(() => {
    const allTopicEntries = flattenTopics(subjects);
    let totalDoneCells = 0;
    let totalMinutes = 0;
    let coveredCount = 0;

    const topicStats = allTopicEntries.map(({ subject, unit, topic }) => {
      let doneCount = 0;
      let minutes = 0;
      let lastDoneDate: string | null = null;

      for (const [key, cell] of Object.entries(matrixLogs)) {
        if (key.startsWith(`${topic.id}::`) && cell.status === "done") {
          const dateISO = key.split("::")[1];
          doneCount += 1;
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

    // 과목별 통계
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

    // 구멍(0회독) + 오래 안 본 목차 우선 정렬
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

  const handleScheduleTomorrow = (topicId: string, defaultKeyword: string, minutes: number) => {
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
      <header className="px-4 py-3 bg-[#16161C] border-b border-white/[0.06] flex items-center justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-[#FF5A36]" />
            <h1 className="text-sm font-black text-white">회독 · 구멍 통계 분석</h1>
          </div>
          <p className="text-[10.5px] text-slate-400 truncate mt-0.5 flex items-center gap-1">
            <BookOpen className="w-3 h-3 text-amber-400 shrink-0" />
            <span>{activeBook.title}</span>
          </p>
        </div>

        <Link
          href="/study/planner"
          className="px-2.5 py-1.5 rounded-xl bg-[#FF5A36]/15 border border-[#FF5A36]/40 text-[#FF7A59] text-[10.5px] font-black flex items-center gap-1 shrink-0"
        >
          <span>매트릭스</span>
          <ArrowRight className="w-3 h-3" />
        </Link>
      </header>

      {toastMsg && (
        <div className="mx-4 mt-3 p-3 rounded-xl bg-sky-950/90 border border-sky-500/40 text-sky-200 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      <div className="px-4 py-4 space-y-4">
        {/* 4대 핵심 KPI */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="p-3.5 rounded-2xl bg-[#1A1A21] border border-white/[0.06] space-y-1">
            <div className="text-[10px] font-bold text-slate-400">전 범위 커버율</div>
            <div className="font-mono text-xl font-black text-white">
              {analytics.coveragePct}%
            </div>
            <div className="text-[10px] text-slate-400 font-mono">
              {analytics.coveredCount}/{analytics.totalTopics} 목차 1회독+
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#1A1A21] border border-[#FF5A36]/30 space-y-1">
            <div className="text-[10px] font-bold text-slate-400">평균 누적 회독</div>
            <div className="font-mono text-xl font-black text-[#FF7A59]">
              {analytics.avgRounds}R
            </div>
            <div className="text-[10px] text-slate-400 font-mono">
              총 {analytics.totalDoneCells}회 색칠
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#1A1A21] border border-white/[0.06] space-y-1">
            <div className="text-[10px] font-bold text-slate-400">매트릭스 누적 시간</div>
            <div className="font-mono text-xl font-black text-emerald-300">
              {analytics.totalHours}h
            </div>
            <div className="text-[10px] text-slate-400 font-mono">완료 셀 합산</div>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#1A1A21] border border-rose-500/30 space-y-1">
            <div className="text-[10px] font-bold text-slate-400">미학습 구멍 목차</div>
            <div className="font-mono text-xl font-black text-rose-400">
              {analytics.totalTopics - analytics.coveredCount}개
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
            {analytics.subjectStats.map((item) => (
              <div key={item.subject.id} className="space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span
                      className="px-1.5 py-0.2 rounded text-[9px] font-black text-white"
                      style={{ backgroundColor: item.subject.color }}
                    >
                      {item.subject.examStage}
                    </span>
                    <span className="font-extrabold text-white truncate">
                      {item.subject.title}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 font-mono text-[10.5px] shrink-0">
                    <span className="text-slate-400">
                      {item.coveredTopics}/{item.totalTopics}목차
                    </span>
                    <span className="font-black" style={{ color: item.subject.color }}>
                      평균 {item.avgRounds}R
                    </span>
                  </div>
                </div>

                <div className="h-2 rounded-full bg-[#101015] overflow-hidden border border-white/[0.04]">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${item.coveragePct}%`,
                      backgroundColor: item.subject.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 구멍(0회독) & 망각 주의 목차 TOP 6 -> 원클릭 계획 배치 */}
        <section className="p-4 rounded-2xl bg-[#1A1A21] border border-white/[0.06] space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-black text-white flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span>구멍 · 망각 주의 목차 (지금 볼 타이밍)</span>
            </h2>
            <span className="text-[10px] text-slate-400 font-bold">내일 계획 직결</span>
          </div>

          <div className="space-y-2">
            {analytics.weakTopics.map(({ subject, unit, topic, doneCount, daysSinceLast }) => (
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
                      <span className="px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-300 text-[9px] font-mono font-black">
                        {daysSinceLast}일 전 ({doneCount}R)
                      </span>
                    )}
                  </div>
                  <div className="text-xs font-extrabold text-white truncate">
                    {topic.title}
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
            ))}
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
    </MobileAppShell>
  );
}
