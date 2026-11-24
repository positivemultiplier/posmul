"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Plus } from "lucide-react";
import {
  diffDaysISO,
  type StudySubjectNode,
  type TopicRoundRecord,
} from "@/data/study-textbooks";
import type { ChapterProgressSummary } from "@/app/actions/exam-study.actions";
import { getMutedSubjectColor, getMutedTopicColor } from "@/lib/study-theme";

interface RoundRoadmapSectionProps {
  todayISO: string;
  selectedDateISO: string;
  subjects: StudySubjectNode[];
  roundsByTopic: Record<string, TopicRoundRecord[]>;
  chapterTotals: Record<string, ChapterProgressSummary>;
  onCycleRound: (topicId: string, roundNo: number, dateISO: string) => void;
  onAddTopicToToday: (params: {
    topicId: string;
    subjectId: string;
    title: string;
    subjectTitle: string;
    subjectColor: string;
  }) => void;
}

const ROUND_STAMPS = [1, 2, 3, 4, 5] as const;

function formatShortMMDD(iso: string): string {
  const parts = iso.split("-");
  if (parts.length < 3) return iso;
  return `${Number(parts[1])}/${Number(parts[2])}`;
}

export function RoundRoadmapSection({
  todayISO,
  selectedDateISO,
  subjects,
  roundsByTopic,
  chapterTotals,
  onCycleRound,
  onAddTopicToToday,
}: RoundRoadmapSectionProps) {
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(subjects[0]?.id || "");
  const [addedTopicIds, setAddedTopicIds] = useState<Set<string>>(new Set());

  const activeSubject = useMemo(
    () => subjects.find((s) => s.id === selectedSubjectId) || subjects[0],
    [subjects, selectedSubjectId]
  );

  const subjectTopics = useMemo(() => {
    if (!activeSubject) return [];
    return activeSubject.units.flatMap((u) => u.topics).map((t, idx) => {
      const records = roundsByTopic[t.id] || [];
      const recordByRound = new Map<number, TopicRoundRecord>();
      let latestDate: string | null = null;
      for (const r of records) {
        recordByRound.set(r.round, r);
        if (!latestDate || r.dateISO > latestDate) latestDate = r.dateISO;
      }
      const chapterProgress = t.chapterCode ? chapterTotals[t.chapterCode] : undefined;

      return {
        topic: t,
        topicColor: getMutedTopicColor(t.color, idx),
        recordByRound,
        completedCount: records.length,
        latestDate,
        chapterProgress,
      };
    });
  }, [activeSubject, roundsByTopic, chapterTotals]);

  const subjectColor = activeSubject
    ? getMutedSubjectColor(
        activeSubject.title,
        activeSubject.color,
        Math.max(0, subjects.findIndex((s) => s.id === activeSubject.id))
      )
    : "#4F7CAC";

  const targetRounds = activeSubject?.targetRounds ?? 3;
  const overallProgressPct = useMemo(() => {
    if (subjectTopics.length === 0) return 0;
    const totalTarget = subjectTopics.length * targetRounds;
    const achieved = subjectTopics.reduce(
      (sum, item) => sum + Math.min(targetRounds, item.completedCount),
      0
    );
    return Math.round((achieved / Math.max(1, totalTarget)) * 100);
  }, [subjectTopics, targetRounds]);

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
        {subjects.map((subj, idx) => {
          const color = getMutedSubjectColor(subj.title, subj.color, idx);
          const selected = subj.id === activeSubject?.id;
          return (
            <button
              key={subj.id}
              type="button"
              onClick={() => setSelectedSubjectId(subj.id)}
              className={`px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 whitespace-nowrap border transition ${
                selected
                  ? "bg-[var(--hp-surface-2)] border-[var(--hp-border-strong)] text-[var(--hp-text)] font-medium"
                  : "bg-[var(--hp-surface)] border-[var(--hp-border)] text-[var(--hp-text-2)]"
              }`}
            >
              <span
                className="w-1.5 h-1.5 rounded-full shrink-0"
                style={{ backgroundColor: color }}
              />
              <span>{subj.shortTitle || subj.title}</span>
            </button>
          );
        })}
      </div>

      {activeSubject && (
        <div className="p-3.5 rounded-xl bg-[var(--hp-surface)] border border-[var(--hp-border)] space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-[var(--hp-text)]">
              {activeSubject.title} · 목표 {targetRounds}회독
            </span>
            <span className="hp-tabular text-[var(--hp-text-2)]">{overallProgressPct}%</span>
          </div>
          <div className="h-[3px] w-full rounded-full bg-[var(--hp-surface-2)] overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{ width: `${overallProgressPct}%`, backgroundColor: subjectColor }}
            />
          </div>
          <div className="text-[11px] text-[var(--hp-text-3)]">
            1회 탭: 완료({formatShortMMDD(selectedDateISO)}) · 2회 탭: 재복습 · 3회 탭: 취소
          </div>
        </div>
      )}

      <ul className="divide-y divide-[var(--hp-border)] border-y border-[var(--hp-border)]">
        {subjectTopics.map(
          ({ topic, topicColor, recordByRound, completedCount, latestDate, chapterProgress }) => {
            const isAdded = addedTopicIds.has(topic.id);
            const daysAgo = latestDate ? diffDaysISO(latestDate, todayISO) : null;
            const elapsedLabel =
              daysAgo === null
                ? "미학습"
                : daysAgo === 0
                  ? "오늘 회독"
                  : daysAgo > 0
                    ? `${daysAgo}일 전`
                    : `${formatShortMMDD(latestDate!)}`;

            return (
              <li key={topic.id} className="py-3.5 space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex items-start gap-2">
                    <span
                      className="w-2 h-2 rounded-full mt-1.5 shrink-0"
                      style={{ backgroundColor: topicColor }}
                    />
                    <div className="min-w-0">
                      <div className="text-sm text-[var(--hp-text)] leading-snug">
                        {topic.topicNo ? `${topic.topicNo}. ` : ""}
                        {topic.title}
                      </div>
                      {topic.subItems && topic.subItems.length > 0 && (
                        <div className="text-[10.5px] text-[var(--hp-text-2)] mt-0.5 truncate">
                          {topic.subItems.join(" · ")}
                        </div>
                      )}
                      <div className="text-[11px] text-[var(--hp-text-3)] mt-0.5 hp-tabular flex items-center gap-1.5 flex-wrap">
                        <span>{completedCount}회독</span>
                        <span>·</span>
                        <span>{elapsedLabel}</span>
                        {(chapterProgress?.solvedCount || topic.questionCount) && (
                          <>
                            <span>·</span>
                            <span>
                              기출 {chapterProgress?.solvedCount ?? 0}/{topic.questionCount ?? 0}제
                              {chapterProgress && chapterProgress.solvedCount > 0
                                ? ` (${Math.round((chapterProgress.correctCount / chapterProgress.solvedCount) * 100)}%)`
                                : ""}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {topic.chapterCode && (
                      <Link
                        href={`/study/solve?chapter=${encodeURIComponent(topic.chapterCode)}`}
                        className="px-2 py-1 rounded-md text-[11px] border border-[var(--hp-border)] hover:border-[var(--hp-border-strong)] text-[var(--hp-text-2)] hover:text-[var(--hp-text)] flex items-center gap-0.5 transition"
                      >
                        <span>기출</span>
                        <ArrowUpRight className="w-3 h-3 stroke-[1.5]" />
                      </Link>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        if (!activeSubject) return;
                        onAddTopicToToday({
                          topicId: topic.id,
                          subjectId: activeSubject.id,
                          title: `${topic.topicNo ? `${topic.topicNo}. ` : ""}${topic.title}`,
                          subjectTitle: activeSubject.shortTitle || activeSubject.title,
                          subjectColor: topicColor,
                        });
                        setAddedTopicIds((prev) => {
                          const next = new Set(prev);
                          next.add(topic.id);
                          return next;
                        });
                      }}
                      className={`px-2 py-1 rounded-md text-[11px] border flex items-center gap-0.5 transition ${
                        isAdded
                          ? "bg-[var(--hp-surface-2)] border-[var(--hp-border-strong)] text-[var(--hp-text-2)]"
                          : "border-[var(--hp-border)] hover:border-[var(--hp-border-strong)] text-[var(--hp-text-2)] hover:text-[var(--hp-text)]"
                      }`}
                    >
                      <Plus className="w-3 h-3 stroke-[1.75]" />
                      <span>{isAdded ? "담김" : "오늘"}</span>
                    </button>
                  </div>
                </div>

                {/* 단원별 고유 색상으로 채워지는 1R~5R 회독 도장 */}
                <div className="grid grid-cols-5 gap-1.5">
                  {ROUND_STAMPS.map((roundNo) => {
                    const rec = recordByRound.get(roundNo);
                    const isDone = rec?.status === "done";
                    const isReview = rec?.status === "review";

                    return (
                      <button
                        key={roundNo}
                        type="button"
                        onClick={() => onCycleRound(topic.id, roundNo, selectedDateISO)}
                        className="py-1.5 px-1 rounded-md border flex flex-col items-center justify-center leading-tight transition"
                        style={{
                          backgroundColor: isDone
                            ? topicColor
                            : isReview
                              ? "rgba(199, 154, 75, 0.16)"
                              : "transparent",
                          borderColor: isDone
                            ? topicColor
                            : isReview
                              ? "var(--hp-warn)"
                              : "var(--hp-border)",
                          color: isDone
                            ? "#FFFFFF"
                            : isReview
                              ? "var(--hp-warn)"
                              : "var(--hp-text-3)",
                        }}
                        aria-label={`${topic.title} ${roundNo}회독 토글`}
                      >
                        <span className="text-[11px] hp-tabular font-medium">
                          {isReview ? `${roundNo}R 재` : `${roundNo}R`}
                        </span>
                        <span className="text-[9.5px] hp-tabular opacity-80 mt-0.5">
                          {rec ? formatShortMMDD(rec.dateISO) : "-"}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </li>
            );
          }
        )}
      </ul>
    </section>
  );
}
