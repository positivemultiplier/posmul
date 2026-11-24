"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Archive,
  ArchiveRestore,
  Check,
  ChevronDown,
  ChevronRight,
  Minus,
  Pencil,
  Plus,
  RotateCcw,
  Trash2,
  X,
} from "lucide-react";
import { useStudyCurriculum } from "@/lib/study-curriculum-store";
import { TopicListEditor } from "@/components/study/topic-list-editor";
import { getMutedSubjectColor } from "@/lib/study-theme";

const MUTED_COLOR_CHOICES = [
  "#4F7CAC",
  "#C97B63",
  "#5B8C73",
  "#7D6FA3",
  "#B89B5E",
  "#6C8EAD",
  "#A67C7C",
  "#6B9080",
] as const;

type ExamTrackPreset = "all" | "stage1" | "stage2";

/**
 * 과목 · 회독 목표 · 단원(순서·소단원·단원별 색상) 통합 설정 패널
 */
export function MyLibraryPanel() {
  const {
    subjects,
    archivedSubjects,
    hiddenTopicIds,
    examDate,
    setExamDate,
    selectTextbook,
    addCustomSubject,
    updateSubjectCustomization,
    updateTopicCustomization,
    archiveSubject,
    restoreSubject,
    deleteSubject,
    addCustomTopic,
    deleteCustomTopic,
    reorderSubjectTopics,
    hideTopic,
    restoreHiddenTopic,
  } = useStudyCurriculum();

  const [expandedSubjectId, setExpandedSubjectId] = useState<string | null>(null);
  const [showAddSubject, setShowAddSubject] = useState(false);
  const [newSubjTitle, setNewSubjTitle] = useState("");
  const [newSubjCategory, setNewSubjCategory] = useState("공통");
  const [newSubjStage, setNewSubjStage] = useState<"1차" | "2차">("2차");
  const [newSubjTargetRounds, setNewSubjTargetRounds] = useState(3);
  const [newSubjTopicsRaw, setNewSubjTopicsRaw] = useState("");

  const [editingSubjId, setEditingSubjId] = useState<string | null>(null);
  const [editSubjTitle, setEditSubjTitle] = useState("");
  const [editSubjCategory, setEditSubjCategory] = useState("");
  const [editSubjStage, setEditSubjStage] = useState<"1차" | "2차">("2차");
  const [notice, setNotice] = useState<string | null>(null);

  const showNotice = (msg: string) => {
    setNotice(msg);
    window.setTimeout(() => setNotice(null), 2600);
  };

  const allKnownSubjects = useMemo(
    () => [...subjects, ...archivedSubjects],
    [subjects, archivedSubjects]
  );
  const hasMultipleStages = useMemo(() => {
    const stages = new Set(allKnownSubjects.filter((s) => !s.isCustom).map((s) => s.examStage));
    return stages.size >= 2;
  }, [allKnownSubjects]);

  const activeTrack = useMemo<ExamTrackPreset | "custom">(() => {
    const nonCustom = subjects.filter((s) => !s.isCustom);
    const has1 = nonCustom.some((s) => s.examStage === "1차");
    const has2 = nonCustom.some((s) => s.examStage === "2차");
    if (has1 && has2) return "all";
    if (has1 && !has2) return "stage1";
    if (!has1 && has2) return "stage2";
    return "custom";
  }, [subjects]);

  const applyTrackPreset = (track: ExamTrackPreset) => {
    selectTextbook("book-allinone-2026");
    for (const subj of allKnownSubjects) {
      if (subj.isCustom) continue;
      const shouldShow =
        track === "all" ||
        (track === "stage1" && subj.examStage === "1차") ||
        (track === "stage2" && subj.examStage === "2차");
      const isArchived = archivedSubjects.some((a) => a.id === subj.id);
      if (shouldShow && isArchived) restoreSubject(subj.id);
      else if (!shouldShow && !isArchived) archiveSubject(subj.id);
    }
    const label = track === "all" ? "전체 과목" : track === "stage1" ? "1차 과목" : "2차 과목";
    showNotice(`${label} 구성으로 정리했습니다. 기존 기록은 유지됩니다.`);
  };

  const handleAddCustomSubject = () => {
    const clean = newSubjTitle.trim();
    if (!clean) return;
    const topicTitles = newSubjTopicsRaw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const color = MUTED_COLOR_CHOICES[subjects.length % MUTED_COLOR_CHOICES.length];
    const created = addCustomSubject({
      title: clean,
      examStage: newSubjStage,
      category: newSubjCategory.trim() || newSubjStage,
      color,
      topicTitles: topicTitles.length > 0 ? topicTitles : [`${clean} 기본 단원`],
    });
    if (created?.subjectId) {
      updateSubjectCustomization(created.subjectId, { targetRounds: newSubjTargetRounds });
    }
    setNewSubjTitle("");
    setNewSubjTopicsRaw("");
    setNewSubjCategory("공통");
    setNewSubjTargetRounds(3);
    setShowAddSubject(false);
    showNotice(`'${clean}' 과목을 추가했습니다.`);
  };

  const saveEditSubject = (subjectId: string) => {
    const cleanTitle = editSubjTitle.trim();
    if (!cleanTitle) return;
    updateSubjectCustomization(subjectId, {
      title: cleanTitle,
      shortTitle: cleanTitle.slice(0, 8),
      category: editSubjCategory.trim() || editSubjStage,
      examStage: editSubjStage,
    });
    setEditingSubjId(null);
    showNotice("과목 정보를 수정했습니다.");
  };

  return (
    <div className="space-y-6 text-[var(--hp-text)]">
      {notice && (
        <div className="px-3.5 py-2.5 rounded-xl bg-[var(--hp-surface)] border border-[var(--hp-border-strong)] text-xs text-[var(--hp-text)]">
          {notice}
        </div>
      )}

      {/* ① 학습 구성 & 시험일 */}
      <section className="p-4 rounded-xl bg-[var(--hp-surface)] border border-[var(--hp-border)] space-y-3.5">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="text-xs font-medium text-[var(--hp-text)]">학습 구성 · 시험일</h2>
            <p className="text-[11px] text-[var(--hp-text-3)] mt-0.5">
              활성 과목과 단원은 타이머·플래너·회독표·통계에 자동 반영됩니다.
            </p>
          </div>
          <Link
            href="/study/planner"
            className="text-[11px] text-[var(--hp-text-2)] hover:text-[var(--hp-text)] shrink-0"
          >
            플래너 →
          </Link>
        </div>

        {hasMultipleStages && (
          <div className="grid grid-cols-3 gap-1.5">
            {(
              [
                { id: "all", label: "전체 과목" },
                { id: "stage1", label: "1차 집중" },
                { id: "stage2", label: "2차 집중" },
              ] as const
            ).map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => applyTrackPreset(item.id)}
                className={`py-2 rounded-lg text-xs border transition ${
                  activeTrack === item.id
                    ? "bg-[var(--hp-accent)] text-[var(--hp-accent-fg)] border-transparent font-medium"
                    : "bg-[var(--hp-bg)] border-[var(--hp-border)] text-[var(--hp-text-2)]"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        )}

        <label className="pt-3 border-t border-[var(--hp-border)] flex items-center justify-between gap-2 text-xs">
          <span className="text-[var(--hp-text-2)]">목표 시험일 (D-Day)</span>
          <input
            type="date"
            value={examDate}
            onChange={(e) => {
              if (e.target.value) setExamDate(e.target.value);
            }}
            className="bg-[var(--hp-bg)] px-2.5 py-1 rounded-md border border-[var(--hp-border)] text-xs hp-tabular text-[var(--hp-text)] outline-none"
          />
        </label>
      </section>

      {/* ② 활성 과목 & 단원 관리 */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xs font-medium text-[var(--hp-text-2)]">
              활성 과목 ({subjects.length})
            </h2>
            <p className="text-[11px] text-[var(--hp-text-3)] mt-0.5">
              과목을 펼쳐 단원 순서(드래그)·단원별 색상·소단원을 설정하세요.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowAddSubject((prev) => !prev)}
            className="h-8 px-2.5 rounded-lg border border-[var(--hp-border-strong)] text-xs text-[var(--hp-text)] flex items-center gap-1 hover:bg-[var(--hp-surface)] transition shrink-0"
          >
            <Plus className="w-3.5 h-3.5 stroke-[1.75]" />
            <span>과목 추가</span>
          </button>
        </div>

        {showAddSubject && (
          <div className="p-3.5 rounded-xl bg-[var(--hp-surface)] border border-[var(--hp-border-strong)] space-y-2.5">
            <div className="text-xs font-medium">새 과목 · 교재 추가</div>
            <input
              type="text"
              value={newSubjTitle}
              onChange={(e) => setNewSubjTitle(e.target.value)}
              placeholder="과목 또는 교재명 (예: 민법 요약집, 영어 독해)"
              className="w-full h-9 px-3 rounded-lg bg-[var(--hp-bg)] border border-[var(--hp-border)] text-xs text-[var(--hp-text)] placeholder:text-[var(--hp-text-3)] outline-none"
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                value={newSubjCategory}
                onChange={(e) => setNewSubjCategory(e.target.value)}
                placeholder="분류 태그 (예: 1차, 2차, 어학)"
                className="h-9 px-3 rounded-lg bg-[var(--hp-bg)] border border-[var(--hp-border)] text-xs text-[var(--hp-text)] placeholder:text-[var(--hp-text-3)] outline-none"
              />
              <select
                value={newSubjTargetRounds}
                onChange={(e) => setNewSubjTargetRounds(Number(e.target.value))}
                className="h-9 px-2.5 rounded-lg bg-[var(--hp-bg)] border border-[var(--hp-border)] text-xs hp-tabular text-[var(--hp-text)]"
              >
                {[1, 2, 3, 4, 5].map((r) => (
                  <option key={r} value={r}>
                    목표 {r}회독
                  </option>
                ))}
              </select>
            </div>
            <input
              type="text"
              value={newSubjTopicsRaw}
              onChange={(e) => setNewSubjTopicsRaw(e.target.value)}
              placeholder="단원명 쉼표(,) 구분 입력 (선택)"
              className="w-full h-9 px-3 rounded-lg bg-[var(--hp-bg)] border border-[var(--hp-border)] text-xs text-[var(--hp-text)] placeholder:text-[var(--hp-text-3)] outline-none"
            />
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1 text-xs">
                {(["1차", "2차"] as const).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => {
                      setNewSubjStage(st);
                      if (
                        newSubjCategory === "공통" ||
                        newSubjCategory === "1차" ||
                        newSubjCategory === "2차"
                      ) {
                        setNewSubjCategory(st);
                      }
                    }}
                    className={`px-2.5 py-1 rounded-md border ${
                      newSubjStage === st
                        ? "bg-[var(--hp-accent)] text-[var(--hp-accent-fg)] border-transparent font-medium"
                        : "border-[var(--hp-border)] text-[var(--hp-text-2)]"
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={handleAddCustomSubject}
                disabled={!newSubjTitle.trim()}
                className="h-8 px-3.5 rounded-lg bg-[var(--hp-accent)] text-[var(--hp-accent-fg)] text-xs font-medium disabled:opacity-40"
              >
                추가
              </button>
            </div>
          </div>
        )}

        <ul className="space-y-2.5">
          {subjects.map((subj, idx) => {
            const color = getMutedSubjectColor(subj.title, subj.color, idx);
            const targetRounds = subj.targetRounds ?? 3;
            const isExpanded = expandedSubjectId === subj.id;
            const isEditingThis = editingSubjId === subj.id;
            const allTopics = subj.units.flatMap((u) =>
              u.topics.map((t) => ({ unitId: u.id, topic: t }))
            );

            return (
              <li
                key={subj.id}
                className="rounded-xl bg-[var(--hp-surface)] border border-[var(--hp-border)] overflow-hidden"
              >
                <div className="p-3.5 space-y-3">
                  {isEditingThis ? (
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={editSubjTitle}
                        onChange={(e) => setEditSubjTitle(e.target.value)}
                        placeholder="과목명"
                        className="w-full h-8 px-2.5 rounded-md bg-[var(--hp-bg)] border border-[var(--hp-border-strong)] text-xs text-[var(--hp-text)] outline-none"
                      />
                      <div className="flex items-center gap-1.5">
                        <input
                          type="text"
                          value={editSubjCategory}
                          onChange={(e) => setEditSubjCategory(e.target.value)}
                          placeholder="분류 라벨"
                          className="flex-1 h-8 px-2.5 rounded-md bg-[var(--hp-bg)] border border-[var(--hp-border)] text-xs text-[var(--hp-text)] outline-none"
                        />
                        <select
                          value={editSubjStage}
                          onChange={(e) => setEditSubjStage(e.target.value as "1차" | "2차")}
                          className="h-8 px-2 rounded-md bg-[var(--hp-bg)] border border-[var(--hp-border)] text-xs text-[var(--hp-text)]"
                        >
                          <option value="1차">1차</option>
                          <option value="2차">2차</option>
                        </select>
                        <button
                          type="button"
                          onClick={() => saveEditSubject(subj.id)}
                          className="h-8 px-2.5 rounded-md bg-[var(--hp-accent)] text-[var(--hp-accent-fg)] text-xs font-medium flex items-center gap-1"
                        >
                          <Check className="w-3.5 h-3.5 stroke-[2]" />
                          <span>저장</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingSubjId(null)}
                          className="w-8 h-8 rounded-md border border-[var(--hp-border)] flex items-center justify-center text-[var(--hp-text-3)]"
                          aria-label="취소"
                        >
                          <X className="w-3.5 h-3.5 stroke-[1.5]" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => setExpandedSubjectId(isExpanded ? null : subj.id)}
                        className="flex items-center gap-2 min-w-0 flex-1 text-left"
                      >
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4 stroke-[1.5] text-[var(--hp-text-3)] shrink-0" />
                        ) : (
                          <ChevronRight className="w-4 h-4 stroke-[1.5] text-[var(--hp-text-3)] shrink-0" />
                        )}
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: color }}
                        />
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-[var(--hp-text)] truncate">
                            {subj.title}
                          </div>
                          <div className="text-[11px] text-[var(--hp-text-3)] hp-tabular">
                            {subj.category || subj.examStage} · {allTopics.length}단원
                          </div>
                        </div>
                      </button>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() =>
                            updateSubjectCustomization(subj.id, {
                              targetRounds: Math.max(1, targetRounds - 1),
                            })
                          }
                          className="w-6 h-6 rounded-md border border-[var(--hp-border)] flex items-center justify-center text-[var(--hp-text-2)]"
                          aria-label="목표 회독 감소"
                        >
                          <Minus className="w-3 h-3 stroke-[1.75]" />
                        </button>
                        <span className="text-xs hp-tabular font-medium min-w-[26px] text-center">
                          {targetRounds}R
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            updateSubjectCustomization(subj.id, {
                              targetRounds: Math.min(5, targetRounds + 1),
                            })
                          }
                          className="w-6 h-6 rounded-md border border-[var(--hp-border)] flex items-center justify-center text-[var(--hp-text-2)]"
                          aria-label="목표 회독 증가"
                        >
                          <Plus className="w-3 h-3 stroke-[1.75]" />
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setEditingSubjId(subj.id);
                            setEditSubjTitle(subj.title);
                            setEditSubjCategory(subj.category || subj.examStage);
                            setEditSubjStage(subj.examStage);
                          }}
                          className="w-7 h-7 rounded-md hover:bg-[var(--hp-bg)] flex items-center justify-center text-[var(--hp-text-3)] hover:text-[var(--hp-text)]"
                          title="과목명·분류 수정"
                          aria-label={`${subj.title} 수정`}
                        >
                          <Pencil className="w-3.5 h-3.5 stroke-[1.5]" />
                        </button>

                        {subj.isCustom ? (
                          <button
                            type="button"
                            onClick={() => deleteSubject(subj.id)}
                            className="w-7 h-7 rounded-md hover:bg-[var(--hp-bg)] flex items-center justify-center text-[var(--hp-text-3)] hover:text-[var(--hp-danger)]"
                            title="커스텀 과목 삭제"
                            aria-label="커스텀 과목 삭제"
                          >
                            <Trash2 className="w-3.5 h-3.5 stroke-[1.5]" />
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => archiveSubject(subj.id)}
                            className="w-7 h-7 rounded-md hover:bg-[var(--hp-bg)] flex items-center justify-center text-[var(--hp-text-3)] hover:text-[var(--hp-text)]"
                            title="과목 보관"
                            aria-label="과목 보관"
                          >
                            <Archive className="w-3.5 h-3.5 stroke-[1.5]" />
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-1.5 pl-6">
                    {MUTED_COLOR_CHOICES.map((hex) => {
                      const active = color.toUpperCase() === hex.toUpperCase();
                      return (
                        <button
                          key={hex}
                          type="button"
                          onClick={() => updateSubjectCustomization(subj.id, { color: hex })}
                          className={`w-4 h-4 rounded-full transition ${
                            active
                              ? "ring-2 ring-offset-2 ring-offset-[var(--hp-surface)] ring-[var(--hp-accent)]"
                              : "opacity-60 hover:opacity-100"
                          }`}
                          style={{ backgroundColor: hex }}
                          aria-label={`과목 색상 ${hex}`}
                        />
                      );
                    })}
                  </div>
                </div>

                {isExpanded && (
                  <TopicListEditor
                    subjectId={subj.id}
                    firstUnitId={subj.units[0]?.id}
                    topics={allTopics}
                    onAddTopic={addCustomTopic}
                    onUpdateTopic={updateTopicCustomization}
                    onDeleteCustomTopic={deleteCustomTopic}
                    onHideTopic={hideTopic}
                    onReorderTopics={reorderSubjectTopics}
                  />
                )}
              </li>
            );
          })}
        </ul>

        {hiddenTopicIds.length > 0 && (
          <button
            type="button"
            onClick={() => {
              restoreHiddenTopic();
              showNotice("숨긴 단원을 모두 복원했습니다.");
            }}
            className="w-full py-2.5 rounded-xl border border-[var(--hp-border)] hover:border-[var(--hp-border-strong)] text-xs text-[var(--hp-text-2)] hover:text-[var(--hp-text)] flex items-center justify-center gap-1.5 transition"
          >
            <RotateCcw className="w-3.5 h-3.5 stroke-[1.5]" />
            <span>숨긴 단원 {hiddenTopicIds.length}개 모두 복원</span>
          </button>
        )}

        {archivedSubjects.length > 0 && (
          <div className="pt-3 border-t border-[var(--hp-border)] space-y-2">
            <div className="text-[11px] font-medium text-[var(--hp-text-3)]">
              보관된 과목 ({archivedSubjects.length})
            </div>
            <ul className="space-y-1.5">
              {archivedSubjects.map((subj) => (
                <li
                  key={subj.id}
                  className="px-3 py-2 rounded-lg bg-[var(--hp-surface)] border border-[var(--hp-border)] flex items-center justify-between gap-2 text-xs"
                >
                  <span className="text-[var(--hp-text-2)] truncate">
                    [{subj.category || subj.examStage}] {subj.title}
                  </span>
                  <button
                    type="button"
                    onClick={() => restoreSubject(subj.id)}
                    className="px-2.5 py-1 rounded-md border border-[var(--hp-border-strong)] text-[11px] text-[var(--hp-text)] flex items-center gap-1 shrink-0"
                  >
                    <ArchiveRestore className="w-3 h-3 stroke-[1.5]" />
                    <span>복구</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>
    </div>
  );
}
