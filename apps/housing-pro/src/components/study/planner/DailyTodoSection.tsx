"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, Play, Plus, Settings2, Trash2 } from "lucide-react";
import type {
  StudySessionLog,
  StudySubjectNode,
  StudyTodoItem,
} from "@/data/study-textbooks";
import { getTodoLoggedSeconds } from "@/lib/study-metrics";
import {
  formatCompactMinutes,
  getMutedSubjectColor,
  getMutedTopicColor,
} from "@/lib/study-theme";

interface DailyTodoSectionProps {
  selectedDateISO: string;
  yesterdayISO: string;
  subjects: StudySubjectNode[];
  todos: StudyTodoItem[];
  studySessions: StudySessionLog[];
  onAddTodo: (params: {
    title: string;
    subjectId?: string;
    subjectTitle: string;
    subjectColor: string;
    topicId?: string;
    dueDate?: string;
  }) => void;
  onToggleTodo: (todoId: string) => void;
  onDeleteTodo: (todoId: string) => void;
  onStartTimerForTodo: (todo: StudyTodoItem) => void;
}

export function DailyTodoSection({
  selectedDateISO,
  yesterdayISO,
  subjects,
  todos,
  studySessions,
  onAddTodo,
  onToggleTodo,
  onDeleteTodo,
  onStartTimerForTodo,
}: DailyTodoSectionProps) {
  const [draft, setDraft] = useState("");
  const [selectedSubjectIdx, setSelectedSubjectIdx] = useState(0);
  const [selectedTopicId, setSelectedTopicId] = useState<string>("");

  const dayTodos = useMemo(
    () => todos.filter((t) => t.dueDate === selectedDateISO),
    [todos, selectedDateISO]
  );

  const carryOverCandidates = useMemo(() => {
    const existingTitles = new Set(dayTodos.map((t) => t.title.trim()));
    return todos.filter(
      (t) => t.dueDate === yesterdayISO && !t.completed && !existingTitles.has(t.title.trim())
    );
  }, [todos, yesterdayISO, dayTodos]);

  const completedCount = useMemo(
    () => dayTodos.filter((t) => t.completed).length,
    [dayTodos]
  );
  const completionPct =
    dayTodos.length > 0 ? Math.round((completedCount / dayTodos.length) * 100) : 0;

  const activeSubject = subjects[selectedSubjectIdx] || subjects[0];
  const activeTopics = useMemo(
    () => (activeSubject ? activeSubject.units.flatMap((u) => u.topics) : []),
    [activeSubject]
  );

  const selectedTopicIdx = activeTopics.findIndex((t) => t.id === selectedTopicId);
  const selectedTopic = selectedTopicIdx >= 0 ? activeTopics[selectedTopicIdx] : null;

  const activeColor = selectedTopic
    ? getMutedTopicColor(selectedTopic.color, selectedTopicIdx)
    : activeSubject
      ? getMutedSubjectColor(activeSubject.title, activeSubject.color, selectedSubjectIdx)
      : "#4F7CAC";

  const handleSubmit = () => {
    const typed = draft.trim();
    const fallbackTitle = selectedTopic
      ? `${selectedTopic.topicNo ? `${selectedTopic.topicNo}. ` : ""}${selectedTopic.title}`
      : "";
    const finalTitle = typed || fallbackTitle;
    if (!finalTitle) return;

    onAddTodo({
      title: finalTitle,
      subjectId: activeSubject?.id,
      subjectTitle: activeSubject?.shortTitle || activeSubject?.title || "일반",
      subjectColor: activeColor,
      topicId: selectedTopic?.id,
      dueDate: selectedDateISO,
    });
    setDraft("");
  };

  const handleCarryOverAll = () => {
    for (const item of carryOverCandidates) {
      onAddTodo({
        title: item.title,
        subjectId: item.subjectId,
        subjectTitle: item.subjectTitle,
        subjectColor: item.subjectColor,
        topicId: item.topicId,
        dueDate: selectedDateISO,
      });
    }
  };

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-xs font-medium text-[var(--hp-text-2)]">오늘 할 일</h2>
          <span className="text-[11px] hp-tabular text-[var(--hp-text-3)]">
            {completedCount}/{dayTodos.length}
          </span>
        </div>
        <span className="text-[11px] text-[var(--hp-text-3)]">
          {dayTodos.length > 0 ? `달성 ${completionPct}% · 타이머 연동` : "단원별 계획 · 타이머 연동"}
        </span>
      </div>

      {carryOverCandidates.length > 0 && (
        <button
          type="button"
          onClick={handleCarryOverAll}
          className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--hp-surface)] border border-[var(--hp-border-strong)] hover:bg-[var(--hp-surface-2)] flex items-center justify-between gap-2 text-left transition"
        >
          <span className="text-xs text-[var(--hp-text)]">
            어제 미완료 <strong className="font-semibold hp-tabular">{carryOverCandidates.length}건</strong> 오늘로 이월
          </span>
          <span className="text-xs text-[var(--hp-text-2)] flex items-center gap-1 shrink-0">
            <span>가져오기</span>
            <ArrowRight className="w-3.5 h-3.5 stroke-[1.5]" />
          </span>
        </button>
      )}

      {/* 과목 -> 단원 -> 3초 인라인 입력 */}
      <div className="p-3 rounded-xl bg-[var(--hp-surface)] border border-[var(--hp-border)] space-y-2">
        {/* 1줄: 활성 과목 전체 동적 칩 */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {subjects.map((subj, idx) => {
            const color = getMutedSubjectColor(subj.title, subj.color, idx);
            const selected = idx === selectedSubjectIdx;
            return (
              <button
                key={subj.id}
                type="button"
                onClick={() => {
                  setSelectedSubjectIdx(idx);
                  setSelectedTopicId("");
                }}
                className={`px-2.5 py-1 rounded-md text-[11px] flex items-center gap-1.5 whitespace-nowrap border transition ${
                  selected
                    ? "bg-[var(--hp-surface-2)] border-[var(--hp-border-strong)] text-[var(--hp-text)] font-medium"
                    : "border-transparent text-[var(--hp-text-2)] hover:text-[var(--hp-text)]"
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
          <Link
            href="/study/more?tab=library"
            className="px-2 py-1 rounded-md text-[11px] text-[var(--hp-text-3)] hover:text-[var(--hp-text)] flex items-center gap-1 whitespace-nowrap shrink-0"
            title="과목·단원 관리"
          >
            <Settings2 className="w-3 h-3 stroke-[1.5]" />
            <span>관리</span>
          </Link>
        </div>

        {/* 2줄: 선택된 과목의 단원 칩 (단원별 고유 색상 적용) */}
        {activeTopics.length > 0 && (
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pt-0.5">
            <button
              type="button"
              onClick={() => setSelectedTopicId("")}
              className={`px-2 py-0.5 rounded text-[10.5px] whitespace-nowrap border ${
                selectedTopicId === ""
                  ? "bg-[var(--hp-bg)] border-[var(--hp-border-strong)] text-[var(--hp-text)]"
                  : "border-transparent text-[var(--hp-text-3)]"
              }`}
            >
              과목 전체
            </button>
            {activeTopics.map((topic, tIdx) => {
              const tColor = getMutedTopicColor(topic.color, tIdx);
              const selected = selectedTopicId === topic.id;
              return (
                <button
                  key={topic.id}
                  type="button"
                  onClick={() => setSelectedTopicId(selected ? "" : topic.id)}
                  className={`px-2 py-0.5 rounded text-[10.5px] flex items-center gap-1 whitespace-nowrap border transition ${
                    selected
                      ? "bg-[var(--hp-bg)] border-[var(--hp-border-strong)] text-[var(--hp-text)] font-medium"
                      : "border-transparent text-[var(--hp-text-3)] hover:text-[var(--hp-text-2)]"
                  }`}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full shrink-0"
                    style={{ backgroundColor: tColor }}
                  />
                  <span className="max-w-[140px] truncate">
                    {topic.topicNo ? `${topic.topicNo}. ` : ""}
                    {topic.title}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* 선택된 단원에 소단원이 있으면 원탭 추천 칩 표시 */}
        {selectedTopic?.subItems && selectedTopic.subItems.length > 0 && (
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
            {selectedTopic.subItems.map((sub, i) => (
              <button
                key={`${sub}-${i}`}
                type="button"
                onClick={() => setDraft(`${selectedTopic.title} - ${sub}`)}
                className="px-2 py-0.5 rounded bg-[var(--hp-bg)] border border-[var(--hp-border)] text-[10px] text-[var(--hp-text-2)] whitespace-nowrap hover:text-[var(--hp-text)]"
              >
                + {sub}
              </button>
            ))}
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
          className="flex items-center gap-2 pt-0.5"
        >
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={
              selectedTopic
                ? `'${selectedTopic.title}' 바로 추가 또는 세부 메모 입력...`
                : "할 일 입력 후 Enter..."
            }
            className="flex-1 h-9 px-3 rounded-lg bg-[var(--hp-bg)] border border-[var(--hp-border)] focus:border-[var(--hp-border-strong)] text-xs text-[var(--hp-text)] placeholder:text-[var(--hp-text-3)] outline-none"
          />
          <button
            type="submit"
            disabled={!draft.trim() && !selectedTopic}
            className="h-9 px-3 rounded-lg bg-[var(--hp-accent)] text-[var(--hp-accent-fg)] text-xs font-medium disabled:opacity-40 flex items-center gap-1 shrink-0"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2]" />
            <span>추가</span>
          </button>
        </form>
      </div>

      {/* 할 일 체크리스트 */}
      {dayTodos.length === 0 ? (
        <div className="py-7 text-center rounded-xl border border-dashed border-[var(--hp-border)] text-xs text-[var(--hp-text-3)]">
          등록된 할 일이 없습니다. 위에서 과목·단원을 선택해 바로 추가해 보세요.
        </div>
      ) : (
        <ul className="divide-y divide-[var(--hp-border)] border-y border-[var(--hp-border)]">
          {dayTodos.map((item) => {
            const dotColor = item.subjectColor || getMutedSubjectColor(item.subjectTitle);
            const loggedSec = getTodoLoggedSeconds(
              studySessions,
              item.id,
              item.loggedSeconds ?? 0
            );
            return (
              <li
                key={item.id}
                className="py-3 flex items-center justify-between gap-2.5"
              >
                <button
                  type="button"
                  onClick={() => onToggleTodo(item.id)}
                  className="flex items-start gap-3 min-w-0 flex-1 text-left"
                >
                  <span
                    className={`mt-0.5 w-4 h-4 rounded-[4px] border flex items-center justify-center shrink-0 transition ${
                      item.completed
                        ? "bg-[var(--hp-accent)] border-[var(--hp-accent)] text-[var(--hp-accent-fg)]"
                        : "border-[var(--hp-border-strong)]"
                    }`}
                  >
                    {item.completed && <Check className="w-3 h-3 stroke-[2.2]" />}
                  </span>

                  <div className="min-w-0">
                    <div
                      className={`text-sm leading-snug break-words ${
                        item.completed
                          ? "line-through text-[var(--hp-text-3)]"
                          : "text-[var(--hp-text)]"
                      }`}
                    >
                      {item.title}
                    </div>
                    <div className="mt-1 flex items-center gap-1.5 text-[11px] text-[var(--hp-text-3)] hp-tabular">
                      <span
                        className="w-1.5 h-1.5 rounded-full shrink-0"
                        style={{ backgroundColor: dotColor }}
                      />
                      <span>{item.subjectTitle}</span>
                      {loggedSec > 0 && (
                        <>
                          <span>·</span>
                          <span>
                            누적{" "}
                            {loggedSec >= 60
                              ? formatCompactMinutes(Math.floor(loggedSec / 60))
                              : `${loggedSec}초`}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </button>

                <div className="flex items-center gap-1 shrink-0">
                  {!item.completed && (
                    <button
                      type="button"
                      onClick={() => onStartTimerForTodo(item)}
                      className="w-8 h-8 rounded-lg border border-[var(--hp-border)] hover:border-[var(--hp-border-strong)] hover:bg-[var(--hp-surface)] flex items-center justify-center text-[var(--hp-text-2)] hover:text-[var(--hp-text)] transition"
                      aria-label={`${item.title} 타이머 시작`}
                      title="이 할 일로 그룹 타이머 시작"
                    >
                      <Play className="w-3.5 h-3.5 stroke-[1.6]" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => onDeleteTodo(item.id)}
                    className="w-8 h-8 rounded-lg hover:bg-[var(--hp-surface)] flex items-center justify-center text-[var(--hp-text-3)] hover:text-[var(--hp-danger)] transition"
                    aria-label="할 일 삭제"
                  >
                    <Trash2 className="w-3.5 h-3.5 stroke-[1.5]" />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
