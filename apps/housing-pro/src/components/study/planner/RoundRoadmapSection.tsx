"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import type { MatrixCellLog, StudySubjectNode } from "@/data/study-textbooks";
import { getMutedSubjectColor } from "@/lib/study-theme";

interface RoundRoadmapSectionProps {
  selectedDateISO: string;
  subjects: StudySubjectNode[];
  matrixLogs: Record<string, MatrixCellLog>;
  onMarkRound: (topicId: string, roundNo: number, defaultKeyword: string, minutes: number) => void;
  onAddTopicToToday: (params: {
    topicId: string;
    title: string;
    subjectTitle: string;
    subjectColor: string;
  }) => void;
}

const ROUND_STAMPS = [1, 2, 3, 4, 5] as const;

export function RoundRoadmapSection({
  selectedDateISO,
  subjects,
  matrixLogs,
  onMarkRound,
  onAddTopicToToday,
}: RoundRoadmapSectionProps) {
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(subjects[0]?.id || "");
  const [addedTopicIds, setAddedTopicIds] = useState<Set<string>>(new Set());

  const activeSubject = useMemo(
    () => subjects.find((s) => s.id === selectedSubjectId) || subjects[0],
    [subjects, selectedSubjectId]
  );

  // 단원별 완료 회독 수 집계 (`topicId::YYYY-MM-DD`에서 status === "done" 개수)
  const roundCountByTopic = useMemo(() => {
    const map = new Map<string, number>();
    for (const [key, log] of Object.entries(matrixLogs)) {
      if (log.status !== "done") continue;
      const sepIdx = key.indexOf("::");
      if (sepIdx <= 0) continue;
      const topicId = key.slice(0, sepIdx);
      map.set(topicId, (map.get(topicId) ?? 0) + 1);
    }
    return map;
  }, [matrixLogs]);

  const subjectTopics = useMemo(() => {
    if (!activeSubject) return [];
    return activeSubject.units.flatMap((u) =>
      u.topics.map((t) => ({
        unitTitle: u.title,
        topic: t,
        rounds: roundCountByTopic.get(t.id) ?? 0,
      }))
    );
  }, [activeSubject, roundCountByTopic]);

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
    const achieved = subjectTopics.reduce((sum, item) => sum + Math.min(targetRounds, item.rounds), 0);
    return Math.round((achieved / Math.max(1, totalTarget)) * 100);
  }, [subjectTopics, targetRounds]);

  return (
    <section className="space-y-4">
      {/* 과목 선택 칩 */}
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

      {/* 과목 전체 회독률 요약 */}
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
        </div>
      )}

      {/* 단원별 1·2·3·4·5 원탭 회독 도장 리스트 */}
      <ul className="divide-y divide-[var(--hp-border)] border-y border-[var(--hp-border)]">
        {subjectTopics.map(({ topic, rounds }) => {
          const isAdded = addedTopicIds.has(topic.id);
          return (
            <li key={topic.id} className="py-3 space-y-2.5">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-sm text-[var(--hp-text)] leading-snug">
                    {topic.topicNo ? `${topic.topicNo}. ` : ""}
                    {topic.title}
                  </div>
                  <div className="text-[11px] text-[var(--hp-text-3)] mt-0.5 hp-tabular">
                    누적 {rounds}회독 · 기준일 {selectedDateISO}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    onAddTopicToToday({
                      topicId: topic.id,
                      title: `${topic.topicNo ? `${topic.topicNo}. ` : ""}${topic.title}`,
                      subjectTitle: activeSubject?.shortTitle || activeSubject?.title || "학습",
                      subjectColor,
                    });
                    setAddedTopicIds((prev) => {
                      const next = new Set(prev);
                      next.add(topic.id);
                      return next;
                    });
                  }}
                  className={`px-2.5 py-1 rounded-md text-[11px] border flex items-center gap-1 shrink-0 transition ${
                    isAdded
                      ? "bg-[var(--hp-surface-2)] border-[var(--hp-border-strong)] text-[var(--hp-text-2)]"
                      : "border-[var(--hp-border)] hover:border-[var(--hp-border-strong)] text-[var(--hp-text-2)] hover:text-[var(--hp-text)]"
                  }`}
                >
                  <Plus className="w-3 h-3 stroke-[1.75]" />
                  <span>{isAdded ? "담김" : "오늘"}</span>
                </button>
              </div>

              {/* 1 ~ 5 회독 도장 */}
              <div className="flex items-center gap-1.5">
                {ROUND_STAMPS.map((roundNo) => {
                  const filled = rounds >= roundNo;
                  return (
                    <button
                      key={roundNo}
                      type="button"
                      onClick={() =>
                        onMarkRound(
                          topic.id,
                          roundNo,
                          topic.defaultKeyword || `${roundNo}회독`,
                          topic.estimatedMinutes || 30
                        )
                      }
                      className="flex-1 h-7 rounded-md text-[11px] hp-tabular font-medium border transition"
                      style={{
                        backgroundColor: filled ? `${subjectColor}` : "transparent",
                        borderColor: filled ? subjectColor : "var(--hp-border)",
                        color: filled ? "#FFFFFF" : "var(--hp-text-3)",
                      }}
                      aria-label={`${topic.title} ${roundNo}회독 기록`}
                    >
                      {roundNo}R
                    </button>
                  );
                })}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
