"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Archive,
  ArchiveRestore,
  ChevronDown,
  ChevronRight,
  EyeOff,
  Minus,
  Plus,
  RotateCcw,
  Trash2,
} from "lucide-react";
import { useStudyCurriculum } from "@/lib/study-curriculum-store";
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
 * 과목 · 회독 목표 · 단원 통합 설정 패널 (Study v2.0)
 * - 1단: 수험 트랙 1탭 전환 (동차 / 1차 / 2차) — 기록 보존, 중복 과목 원천 차단
 * - 2단: 활성 과목별 목표 회독수(1R~5R) · 뮤트 컬러 · 단원 숨김/추가 · 보관
 * - 3단: 커스텀 과목 / 내 교재 5초 인라인 추가
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
    archiveSubject,
    restoreSubject,
    deleteSubject,
    addCustomTopic,
    hideTopic,
    restoreHiddenTopic,
  } = useStudyCurriculum();

  const [expandedSubjectId, setExpandedSubjectId] = useState<string | null>(null);
  const [newTopicDraftBySubj, setNewTopicDraftBySubj] = useState<Record<string, string>>({});
  const [showAddSubject, setShowAddSubject] = useState(false);
  const [newSubjTitle, setNewSubjTitle] = useState("");
  const [newSubjStage, setNewSubjStage] = useState<"1차" | "2차">("2차");
  const [newSubjTargetRounds, setNewSubjTargetRounds] = useState(3);
  const [newSubjTopicsRaw, setNewSubjTopicsRaw] = useState("");
  const [notice, setNotice] = useState<string | null>(null);

  const showNotice = (msg: string) => {
    setNotice(msg);
    window.setTimeout(() => setNotice(null), 2600);
  };

  // 현재 활성 과목 기준 트랙 상태 판별
  const activeTrack = useMemo<ExamTrackPreset | "custom">(() => {
    const has1 = subjects.some((s) => s.examStage === "1차");
    const has2 = subjects.some((s) => s.examStage === "2차");
    if (has1 && has2) return "all";
    if (has1 && !has2) return "stage1";
    if (!has1 && has2) return "stage2";
    return "custom";
  }, [subjects]);

  // 수험 트랙 1탭 전환 (공식 69목차 단일 기준 유지 + 차수별 보관/복구)
  const applyTrackPreset = (track: ExamTrackPreset) => {
    selectTextbook("book-allinone-2026");
    const allKnown = [...subjects, ...archivedSubjects];

    for (const subj of allKnown) {
      if (subj.isCustom) continue;
      const shouldShow =
        track === "all" ||
        (track === "stage1" && subj.examStage === "1차") ||
        (track === "stage2" && subj.examStage === "2차");
      const isArchived = archivedSubjects.some((a) => a.id === subj.id);

      if (shouldShow && isArchived) {
        restoreSubject(subj.id);
      } else if (!shouldShow && !isArchived) {
        archiveSubject(subj.id);
      }
    }

    const label =
      track === "all" ? "동차(1·2차 5과목)" : track === "stage1" ? "1차 집중" : "2차 집중";
    showNotice(`${label} 트랙으로 정리했습니다. 기존 회독·순공 기록은 유지됩니다.`);
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
      color,
      topicTitles: topicTitles.length > 0 ? topicTitles : [`${clean} 핵심 단원`],
    });
    if (created?.subjectId) {
      updateSubjectCustomization(created.subjectId, {
        targetRounds: newSubjTargetRounds,
      });
    }
    setNewSubjTitle("");
    setNewSubjTopicsRaw("");
    setNewSubjTargetRounds(3);
    setShowAddSubject(false);
    showNotice(`'${clean}' 과목을 추가했습니다. 타이머·플래너·회독표에 즉시 반영됩니다.`);
  };

  return (
    <div className="space-y-6 text-[var(--hp-text)]">
      {notice && (
        <div className="px-3.5 py-2.5 rounded-xl bg-[var(--hp-surface)] border border-[var(--hp-border-strong)] text-xs text-[var(--hp-text)]">
          {notice}
        </div>
      )}

      {/* ① 수험 트랙 & 시험 D-Day */}
      <section className="p-4 rounded-xl bg-[var(--hp-surface)] border border-[var(--hp-border)] space-y-3.5">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="text-xs font-medium text-[var(--hp-text)]">수험 트랙 선택</h2>
            <p className="text-[11px] text-[var(--hp-text-3)] mt-0.5">
              선택한 차수 과목만 타이머·플래너·회독표에 표시됩니다.
            </p>
          </div>
          <Link
            href="/study/planner"
            className="text-[11px] text-[var(--hp-text-2)] hover:text-[var(--hp-text)] shrink-0"
          >
            플래너 →
          </Link>
        </div>

        <div className="grid grid-cols-3 gap-1.5">
          {(
            [
              { id: "all", label: "동차 (5과목)" },
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
                  : "bg-[var(--hp-bg)] border-[var(--hp-border)] text-[var(--hp-text-2)] hover:text-[var(--hp-text)]"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <label className="pt-3 border-t border-[var(--hp-border)] flex items-center justify-between gap-2 text-xs">
          <span className="text-[var(--hp-text-2)]">시험일 (D-Day)</span>
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

      {/* ② 활성 과목별 목표 회독수 · 색상 · 단원 관리 */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xs font-medium text-[var(--hp-text-2)]">
              활성 과목 ({subjects.length})
            </h2>
            <p className="text-[11px] text-[var(--hp-text-3)] mt-0.5">
              목표 회독수 변경 시 회독표·통계 달성률에 즉시 반영됩니다.
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

        {/* 커스텀 과목 / 내 교재 5초 인라인 추가 폼 */}
        {showAddSubject && (
          <div className="p-3.5 rounded-xl bg-[var(--hp-surface)] border border-[var(--hp-border-strong)] space-y-2.5">
            <div className="text-xs font-medium">내 과목 · 교재 직접 추가</div>
            <input
              type="text"
              value={newSubjTitle}
              onChange={(e) => setNewSubjTitle(e.target.value)}
              placeholder="과목 또는 교재명 (예: 민법 요약집, 기출 모의고사)"
              className="w-full h-9 px-3 rounded-lg bg-[var(--hp-bg)] border border-[var(--hp-border)] text-xs text-[var(--hp-text)] placeholder:text-[var(--hp-text-3)] outline-none"
            />
            <input
              type="text"
              value={newSubjTopicsRaw}
              onChange={(e) => setNewSubjTopicsRaw(e.target.value)}
              placeholder="단원명 쉼표(,) 구분 입력 (선택, 예: 1강 총칙, 2강 물권)"
              className="w-full h-9 px-3 rounded-lg bg-[var(--hp-bg)] border border-[var(--hp-border)] text-xs text-[var(--hp-text)] placeholder:text-[var(--hp-text-3)] outline-none"
            />
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-xs">
                {(["1차", "2차"] as const).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setNewSubjStage(st)}
                    className={`px-2.5 py-1 rounded-md border ${
                      newSubjStage === st
                        ? "bg-[var(--hp-accent)] text-[var(--hp-accent-fg)] border-transparent font-medium"
                        : "border-[var(--hp-border)] text-[var(--hp-text-2)]"
                    }`}
                  >
                    {st}
                  </button>
                ))}
                <span className="text-[11px] text-[var(--hp-text-3)] ml-1">목표</span>
                <select
                  value={newSubjTargetRounds}
                  onChange={(e) => setNewSubjTargetRounds(Number(e.target.value))}
                  className="h-7 px-2 rounded-md bg-[var(--hp-bg)] border border-[var(--hp-border)] text-xs hp-tabular text-[var(--hp-text)]"
                >
                  {[1, 2, 3, 4, 5].map((r) => (
                    <option key={r} value={r}>
                      {r}회독
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="button"
                onClick={handleAddCustomSubject}
                disabled={!newSubjTitle.trim()}
                className="h-8 px-3 rounded-lg bg-[var(--hp-accent)] text-[var(--hp-accent-fg)] text-xs font-medium disabled:opacity-40"
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
            const allTopics = subj.units.flatMap((u) =>
              u.topics.map((t) => ({ unitId: u.id, topic: t }))
            );
            const firstUnitId = subj.units[0]?.id;
            const topicDraft = newTopicDraftBySubj[subj.id] || "";

            return (
              <li
                key={subj.id}
                className="rounded-xl bg-[var(--hp-surface)] border border-[var(--hp-border)] overflow-hidden"
              >
                <div className="p-3.5 space-y-3">
                  {/* 1줄: 과목명 + 목표 회독수 조절 + 보관/삭제 */}
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
                          {subj.examStage} · {allTopics.length}단원
                        </div>
                      </div>
                    </button>

                    {/* 목표 회독수 조절 (1R ~ 5R) */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() =>
                          updateSubjectCustomization(subj.id, {
                            targetRounds: Math.max(1, targetRounds - 1),
                          })
                        }
                        className="w-6 h-6 rounded-md border border-[var(--hp-border)] flex items-center justify-center text-[var(--hp-text-2)] hover:text-[var(--hp-text)]"
                        aria-label="목표 회독 감소"
                      >
                        <Minus className="w-3 h-3 stroke-[1.75]" />
                      </button>
                      <span className="text-xs hp-tabular font-medium min-w-[28px] text-center">
                        {targetRounds}R
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          updateSubjectCustomization(subj.id, {
                            targetRounds: Math.min(5, targetRounds + 1),
                          })
                        }
                        className="w-6 h-6 rounded-md border border-[var(--hp-border)] flex items-center justify-center text-[var(--hp-text-2)] hover:text-[var(--hp-text)]"
                        aria-label="목표 회독 증가"
                      >
                        <Plus className="w-3 h-3 stroke-[1.75]" />
                      </button>

                      {subj.isCustom ? (
                        <button
                          type="button"
                          onClick={() => deleteSubject(subj.id)}
                          className="w-7 h-7 rounded-md hover:bg-[var(--hp-bg)] flex items-center justify-center text-[var(--hp-text-3)] hover:text-[var(--hp-danger)] ml-1"
                          title="커스텀 과목 삭제"
                          aria-label="커스텀 과목 삭제"
                        >
                          <Trash2 className="w-3.5 h-3.5 stroke-[1.5]" />
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => archiveSubject(subj.id)}
                          className="w-7 h-7 rounded-md hover:bg-[var(--hp-bg)] flex items-center justify-center text-[var(--hp-text-3)] hover:text-[var(--hp-text)] ml-1"
                          title="과목 보관(숨기기)"
                          aria-label="과목 보관"
                        >
                          <Archive className="w-3.5 h-3.5 stroke-[1.5]" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* 2줄: 저채도 뮤트 8색 컬러 선택 */}
                  <div className="flex items-center gap-1.5 pl-6">
                    {MUTED_COLOR_CHOICES.map((hex) => {
                      const active = color.toUpperCase() === hex.toUpperCase();
                      return (
                        <button
                          key={hex}
                          type="button"
                          onClick={() => updateSubjectCustomization(subj.id, { color: hex })}
                          className={`w-4 h-4 rounded-full transition ${
                            active ? "ring-2 ring-offset-2 ring-offset-[var(--hp-surface)] ring-[var(--hp-accent)]" : "opacity-60 hover:opacity-100"
                          }`}
                          style={{ backgroundColor: hex }}
                          aria-label={`과목 색상 ${hex}`}
                        />
                      );
                    })}
                  </div>
                </div>

                {/* 펼침: 단원 인라인 추가 + 단원 숨김 */}
                {isExpanded && (
                  <div className="px-3.5 pb-3.5 pt-3 border-t border-[var(--hp-border)] bg-[var(--hp-bg)]/50 space-y-2.5">
                    {firstUnitId && (
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          const clean = topicDraft.trim();
                          if (!clean) return;
                          addCustomTopic(firstUnitId, clean, clean.slice(0, 6), 30);
                          setNewTopicDraftBySubj((prev) => ({ ...prev, [subj.id]: "" }));
                        }}
                        className="flex items-center gap-1.5"
                      >
                        <input
                          type="text"
                          value={topicDraft}
                          onChange={(e) =>
                            setNewTopicDraftBySubj((prev) => ({
                              ...prev,
                              [subj.id]: e.target.value,
                            }))
                          }
                          placeholder="이 과목에 커스텀 단원 추가..."
                          className="flex-1 h-8 px-2.5 rounded-md bg-[var(--hp-bg)] border border-[var(--hp-border)] text-xs text-[var(--hp-text)] placeholder:text-[var(--hp-text-3)] outline-none"
                        />
                        <button
                          type="submit"
                          disabled={!topicDraft.trim()}
                          className="h-8 px-2.5 rounded-md bg-[var(--hp-accent)] text-[var(--hp-accent-fg)] text-xs font-medium disabled:opacity-40"
                        >
                          추가
                        </button>
                      </form>
                    )}

                    <ul className="divide-y divide-[var(--hp-border)] max-h-52 overflow-y-auto">
                      {allTopics.map(({ topic }) => (
                        <li
                          key={topic.id}
                          className="py-2 flex items-center justify-between gap-2 text-xs"
                        >
                          <span className="truncate text-[var(--hp-text-2)]">
                            {topic.topicNo ? `${topic.topicNo}. ` : ""}
                            {topic.title}
                          </span>
                          <button
                            type="button"
                            onClick={() => hideTopic(topic.id)}
                            className="p-1 rounded text-[var(--hp-text-3)] hover:text-[var(--hp-text)] shrink-0"
                            title="단원 숨기기"
                            aria-label={`${topic.title} 숨기기`}
                          >
                            <EyeOff className="w-3.5 h-3.5 stroke-[1.5]" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </li>
            );
          })}
        </ul>

        {/* 숨긴 단원 일괄 복원 */}
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

        {/* 보관된 과목 복구 */}
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
                    [{subj.examStage}] {subj.title}
                  </span>
                  <button
                    type="button"
                    onClick={() => restoreSubject(subj.id)}
                    className="px-2.5 py-1 rounded-md border border-[var(--hp-border-strong)] text-[11px] text-[var(--hp-text)] flex items-center gap-1 shrink-0 hover:bg-[var(--hp-surface-2)]"
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
