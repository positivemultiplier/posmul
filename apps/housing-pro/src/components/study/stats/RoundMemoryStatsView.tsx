"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Plus } from "lucide-react";
import type { StudySubjectNode, TopicRoundRecord } from "@/data/study-textbooks";
import type { ForgettingAlertItem } from "@/lib/study-stats-analytics";
import { getMutedSubjectColor, getMutedTopicColor } from "@/lib/study-theme";

interface WeakTopicRow {
  topicId: string;
  chapterCode?: string;
  subjectId: string;
  subjectTitle: string;
  color: string;
  topicTitle: string;
  rounds: number;
  needsReview: boolean;
  accuracyPct: number | null;
}

interface RoundMemoryStatsViewProps {
  subjects: StudySubjectNode[];
  roundsByTopic: Record<string, TopicRoundRecord[]>;
  roundAchievePct: number;
  forgettingAlerts: ForgettingAlertItem[];
  weakTopics: WeakTopicRow[];
  onAddTodo: (params: {
    topicId: string;
    subjectId: string;
    subjectTitle: string;
    subjectColor: string;
    title: string;
  }) => void;
}

export function RoundMemoryStatsView({
  subjects,
  roundsByTopic,
  roundAchievePct,
  forgettingAlerts,
  weakTopics,
  onAddTodo,
}: RoundMemoryStatsViewProps) {
  const [selectedTile, setSelectedTile] = useState<{
    topicId: string;
    chapterCode?: string;
    subjectId: string;
    subjectTitle: string;
    title: string;
    color: string;
    rounds: number;
    hasReview: boolean;
  } | null>(null);
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());

  const handleQuickAdd = (params: {
    topicId: string;
    subjectId: string;
    subjectTitle: string;
    subjectColor: string;
    title: string;
  }) => {
    onAddTodo(params);
    setAddedIds((prev) => {
      const next = new Set(prev);
      next.add(params.topicId);
      return next;
    });
  };

  return (
    <div className="space-y-6">
      {/* ① 전 단원 회독 조감도 히트맵 보드 */}
      <section className="p-4 rounded-xl bg-[var(--hp-surface)] border border-[var(--hp-border)] space-y-4">
        <div className="flex items-center justify-between text-xs">
          <span className="font-medium text-[var(--hp-text)]">전 단원 회독 조감도</span>
          <span className="hp-tabular text-[var(--hp-text-2)]">전체 달성 {roundAchievePct}%</span>
        </div>

        <div className="space-y-3">
          {subjects.map((subj, sIdx) => {
            const subjColor = getMutedSubjectColor(subj.title, subj.color, sIdx);
            const flatTopics = subj.units.flatMap((u) => u.topics);
            const targetR = subj.targetRounds ?? 3;

            return (
              <div key={subj.id} className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="flex items-center gap-1.5 text-[var(--hp-text-2)]">
                    <span
                      className="w-1.5 h-1.5 rounded-full shrink-0"
                      style={{ backgroundColor: subjColor }}
                    />
                    <span>{subj.shortTitle || subj.title}</span>
                  </span>
                  <span className="hp-tabular text-[var(--hp-text-3)]">목표 {targetR}R</span>
                </div>

                <div className="grid grid-cols-10 gap-1">
                  {flatTopics.map((topic, tIdx) => {
                    const recs = roundsByTopic[topic.id] || [];
                    const rounds = recs.length;
                    const hasReview = recs.some((r) => r.status === "review");
                    const tColor = getMutedTopicColor(topic.color, tIdx);
                    const opacity =
                      rounds === 0 ? 1 : Math.min(1, 0.28 + (rounds / Math.max(1, targetR)) * 0.72);
                    const isSelected = selectedTile?.topicId === topic.id;

                    return (
                      <button
                        key={topic.id}
                        type="button"
                        onClick={() =>
                          setSelectedTile({
                            topicId: topic.id,
                            chapterCode: topic.chapterCode,
                            subjectId: subj.id,
                            subjectTitle: subj.shortTitle || subj.title,
                            title: `${topic.topicNo ? `${topic.topicNo}. ` : ""}${topic.title}`,
                            color: tColor,
                            rounds,
                            hasReview,
                          })
                        }
                        className={`h-5 rounded-[4px] border text-[9px] hp-tabular flex items-center justify-center transition ${
                          isSelected ? "ring-1 ring-[var(--hp-accent)]" : ""
                        }`}
                        style={{
                          backgroundColor:
                            rounds === 0
                              ? "var(--hp-bg)"
                              : hasReview
                                ? "rgba(199, 154, 75, 0.35)"
                                : tColor,
                          opacity: rounds === 0 ? 1 : opacity,
                          borderColor: hasReview
                            ? "var(--hp-warn)"
                            : rounds === 0
                              ? "var(--hp-border)"
                              : "transparent",
                          color: rounds === 0 ? "var(--hp-text-3)" : "#FFFFFF",
                        }}
                        title={`${topic.title} (${rounds}회독)`}
                      >
                        {rounds > 0 ? rounds : ""}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* 선택한 타일 상세 퀵 바 */}
        {selectedTile && (
          <div className="p-3 rounded-lg bg-[var(--hp-bg)] border border-[var(--hp-border-strong)] flex items-center justify-between gap-2 text-xs">
            <div className="min-w-0">
              <div className="font-medium text-[var(--hp-text)] truncate">{selectedTile.title}</div>
              <div className="text-[11px] hp-tabular text-[var(--hp-text-3)] mt-0.5">
                {selectedTile.subjectTitle} · {selectedTile.rounds}회독
                {selectedTile.hasReview ? " · 재복습 필요" : ""}
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() =>
                  handleQuickAdd({
                    topicId: selectedTile.topicId,
                    subjectId: selectedTile.subjectId,
                    subjectTitle: selectedTile.subjectTitle,
                    subjectColor: selectedTile.color,
                    title: selectedTile.title,
                  })
                }
                className="px-2 py-1 rounded border border-[var(--hp-border-strong)] text-[11px] text-[var(--hp-text)] flex items-center gap-0.5"
              >
                <Plus className="w-3 h-3 stroke-[1.75]" />
                <span>{addedIds.has(selectedTile.topicId) ? "담김" : "오늘"}</span>
              </button>
              {selectedTile.chapterCode && (
                <Link
                  href={`/study/solve?chapter=${encodeURIComponent(selectedTile.chapterCode)}`}
                  className="px-2 py-1 rounded bg-[var(--hp-accent)] text-[var(--hp-accent-fg)] text-[11px] font-medium"
                >
                  기출
                </Link>
              )}
            </div>
          </div>
        )}
      </section>

      {/* ② 망각곡선 기억 잔존율 경보 TOP 8 */}
      <section className="p-4 rounded-xl bg-[var(--hp-surface)] border border-[var(--hp-border)] space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-medium text-[var(--hp-text)]">망각곡선 기억 잔존율 경보</span>
          <span className="text-[11px] text-[var(--hp-text-3)]">회독 경과일 기반 추정</span>
        </div>

        {forgettingAlerts.length === 0 ? (
          <div className="py-6 text-center text-xs text-[var(--hp-text-3)]">
            회독표에서 1회독 이상 체크한 단원이 쌓이면 기억 잔존율과 복습 시점이 자동 계산됩니다.
          </div>
        ) : (
          <ul className="divide-y divide-[var(--hp-border)]">
            {forgettingAlerts.slice(0, 8).map((item) => {
              const barColor =
                item.retentionPct < 45
                  ? "var(--hp-danger)"
                  : item.retentionPct < 70
                    ? "var(--hp-warn)"
                    : "var(--hp-success)";
              return (
                <li key={item.topicId} className="py-2.5 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-[var(--hp-text)] truncate">{item.topicTitle}</div>
                      <div className="text-[10.5px] hp-tabular text-[var(--hp-text-3)] mt-0.5">
                        {item.subjectTitle} · {item.rounds}R · {item.daysSinceLast}일 경과
                        {item.needsReviewFlag ? " · 재복습 표시" : ""}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-[11px] hp-tabular font-medium" style={{ color: barColor }}>
                        {item.retentionPct}%
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          handleQuickAdd({
                            topicId: item.topicId,
                            subjectId: item.subjectId,
                            subjectTitle: item.subjectTitle,
                            subjectColor: item.topicColor,
                            title: item.topicTitle,
                          })
                        }
                        className="px-2 py-0.5 rounded border border-[var(--hp-border)] hover:border-[var(--hp-border-strong)] text-[10.5px] text-[var(--hp-text-2)]"
                      >
                        {addedIds.has(item.topicId) ? "담김" : "+오늘"}
                      </button>
                    </div>
                  </div>
                  <div className="h-[3px] w-full rounded-full bg-[var(--hp-bg)] overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${item.retentionPct}%`, backgroundColor: barColor }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* ③ 취약 단원 TOP 5 */}
      <section className="space-y-2.5">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-medium text-[var(--hp-text-2)]">취약 단원 TOP 5</h2>
          <span className="text-[11px] text-[var(--hp-text-3)]">재복습·정답률·회독 기준</span>
        </div>

        <ul className="divide-y divide-[var(--hp-border)] border-y border-[var(--hp-border)]">
          {weakTopics.map((item) => {
            const targetHref = item.chapterCode
              ? `/study/solve?chapter=${encodeURIComponent(item.chapterCode)}`
              : "/study/solve";
            return (
              <li key={item.topicId} className="py-3 flex items-center justify-between gap-2.5">
                <div className="min-w-0">
                  <div className="text-sm text-[var(--hp-text)] truncate">{item.topicTitle}</div>
                  <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-[var(--hp-text-3)] hp-tabular flex-wrap">
                    <span
                      className="w-1.5 h-1.5 rounded-full shrink-0"
                      style={{ backgroundColor: item.color }}
                    />
                    <span>{item.subjectTitle}</span>
                    <span>·</span>
                    <span>{item.rounds}회독</span>
                    {item.needsReview && <span className="text-[var(--hp-warn)]">· 재복습</span>}
                    {item.accuracyPct !== null && <span>· 정답률 {item.accuracyPct}%</span>}
                  </div>
                </div>
                <Link
                  href={targetHref}
                  className="px-2.5 py-1 rounded-md border border-[var(--hp-border)] hover:border-[var(--hp-border-strong)] text-[11px] text-[var(--hp-text-2)] hover:text-[var(--hp-text)] flex items-center gap-1 shrink-0"
                >
                  <span>문제</span>
                  <ArrowRight className="w-3 h-3 stroke-[1.5]" />
                </Link>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
