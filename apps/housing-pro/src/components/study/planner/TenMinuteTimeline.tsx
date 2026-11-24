"use client";

import { useMemo, useState } from "react";
import { Eraser } from "lucide-react";
import {
  STUDY_DAY_RESET_HOUR,
  getHoursFromReset,
  getTimetableSlotActual,
  getTimetableSlotPlan,
  setTimetableSlotLayer,
  type StudySubjectNode,
  type TimetableSlotLog,
} from "@/data/study-textbooks";
import { formatCompactMinutes, getMutedSubjectColor } from "@/lib/study-theme";

interface TenMinuteTimelineProps {
  selectedDateISO: string;
  subjects: StudySubjectNode[];
  daySlots: Record<string, TimetableSlotLog>;
  onUpdateSlots: (
    dateISO: string,
    updater: (prev: Record<string, TimetableSlotLog>) => Record<string, TimetableSlotLog>
  ) => void;
}

const SLOTS_PER_HOUR = [0, 1, 2, 3, 4, 5] as const;

export function TenMinuteTimeline({
  selectedDateISO,
  subjects,
  daySlots,
  onUpdateSlots,
}: TenMinuteTimelineProps) {
  // 브러시 선택: 과목 인덱스 또는 "erase" (계획 블록 지우개)
  const [brushIndex, setBrushIndex] = useState<number | "erase">(0);
  const [isDragging, setIsDragging] = useState(false);

  const hours = useMemo(() => getHoursFromReset(STUDY_DAY_RESET_HOUR), []);

  const summary = useMemo(() => {
    let planBlocks = 0;
    let actualBlocks = 0;
    for (const slot of Object.values(daySlots)) {
      if (getTimetableSlotPlan(slot)) planBlocks += 1;
      if (getTimetableSlotActual(slot)) actualBlocks += 1;
    }
    return {
      planMinutes: planBlocks * 10,
      actualMinutes: actualBlocks * 10,
    };
  }, [daySlots]);

  const applySlotPaint = (slotKey: string, forceToggle = false) => {
    onUpdateSlots(selectedDateISO, (prev) => {
      const existing = prev[slotKey];
      const next = { ...prev };

      if (brushIndex === "erase") {
        const updated = setTimetableSlotLayer(existing, "plan", null);
        if (updated) next[slotKey] = updated;
        else delete next[slotKey];
        return next;
      }

      const subj = subjects[brushIndex] || subjects[0];
      if (!subj) return prev;
      const color = getMutedSubjectColor(subj.title, subj.color, brushIndex);
      const firstTopicId = subj.units[0]?.topics[0]?.id;
      const prevPlan = getTimetableSlotPlan(existing);

      // 클릭 토글 시 같은 과목이 이미 칠해져 있으면 해제
      if (forceToggle && prevPlan && prevPlan.label === (subj.shortTitle || subj.title)) {
        const updated = setTimetableSlotLayer(existing, "plan", null);
        if (updated) next[slotKey] = updated;
        else delete next[slotKey];
        return next;
      }

      const updated = setTimetableSlotLayer(existing, "plan", {
        color,
        label: subj.shortTitle || subj.title,
        ...(firstTopicId ? { topicId: firstTopicId } : {}),
      });
      if (updated) next[slotKey] = updated;
      return next;
    });
  };

  return (
    <section
      className="space-y-3 select-none"
      onPointerUp={() => setIsDragging(false)}
      onPointerLeave={() => setIsDragging(false)}
    >
      {/* 헤더 + 계획/실제 요약 */}
      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 className="text-xs font-medium text-[var(--hp-text-2)]">10분 타임라인</h2>
          <p className="text-[11px] text-[var(--hp-text-3)] mt-0.5">
            과목 선택 후 칸을 탭·드래그하여 계획 배치 · 타이머 순공은 자동 색칠
          </p>
        </div>
        <div className="text-right text-[11px] hp-tabular text-[var(--hp-text-2)] shrink-0">
          <div>실제 {formatCompactMinutes(summary.actualMinutes)}</div>
          <div className="text-[var(--hp-text-3)]">
            계획 {formatCompactMinutes(summary.planMinutes)}
          </div>
        </div>
      </div>

      {/* 과목 브러시 팔레트 */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
        {subjects.slice(0, 6).map((subj, idx) => {
          const color = getMutedSubjectColor(subj.title, subj.color, idx);
          const selected = brushIndex === idx;
          return (
            <button
              key={subj.id}
              type="button"
              onClick={() => setBrushIndex(idx)}
              className={`px-2.5 py-1.5 rounded-lg text-[11px] flex items-center gap-1.5 whitespace-nowrap border transition ${
                selected
                  ? "bg-[var(--hp-surface-2)] border-[var(--hp-border-strong)] text-[var(--hp-text)] font-medium"
                  : "bg-[var(--hp-surface)] border-[var(--hp-border)] text-[var(--hp-text-2)]"
              }`}
            >
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: color }}
              />
              <span>{subj.shortTitle || subj.title}</span>
            </button>
          );
        })}

        <button
          type="button"
          onClick={() => setBrushIndex("erase")}
          className={`px-2.5 py-1.5 rounded-lg text-[11px] flex items-center gap-1 whitespace-nowrap border transition ${
            brushIndex === "erase"
              ? "bg-[var(--hp-accent)] text-[var(--hp-accent-fg)] border-transparent font-medium"
              : "bg-[var(--hp-surface)] border-[var(--hp-border)] text-[var(--hp-text-2)]"
          }`}
        >
          <Eraser className="w-3 h-3 stroke-[1.5]" />
          <span>지우개</span>
        </button>
      </div>

      {/* 모트모트 10분 매트릭스 (05:00 ~ 익일 04:00) */}
      <div className="rounded-xl bg-[var(--hp-surface)] border border-[var(--hp-border)] overflow-hidden">
        {/* 열 헤더 (10분 단위) */}
        <div className="grid grid-cols-[38px_repeat(6,1fr)] border-b border-[var(--hp-border)] px-2 py-1.5 text-[10px] hp-tabular text-[var(--hp-text-3)] text-center">
          <span className="text-left pl-1">시</span>
          <span>10</span>
          <span>20</span>
          <span>30</span>
          <span>40</span>
          <span>50</span>
          <span>60</span>
        </div>

        <div className="divide-y divide-[var(--hp-border)]">
          {hours.map((hour) => (
            <div
              key={hour}
              className="grid grid-cols-[38px_repeat(6,1fr)] items-center px-2 h-7"
            >
              <span className="text-[11px] hp-tabular text-[var(--hp-text-3)] pl-1">
                {String(hour).padStart(2, "0")}
              </span>

              {SLOTS_PER_HOUR.map((slotIdx) => {
                const slotKey = `${hour}-${slotIdx}`;
                const slot = daySlots[slotKey];
                const actual = getTimetableSlotActual(slot);
                const plan = getTimetableSlotPlan(slot);
                const actualColor = actual
                  ? getMutedSubjectColor(actual.label, actual.color)
                  : null;
                const planColor = plan ? getMutedSubjectColor(plan.label, plan.color) : null;

                return (
                  <button
                    key={slotKey}
                    type="button"
                    onPointerDown={(e) => {
                      e.preventDefault();
                      setIsDragging(true);
                      applySlotPaint(slotKey, true);
                    }}
                    onPointerEnter={() => {
                      if (isDragging) {
                        applySlotPaint(slotKey, false);
                      }
                    }}
                    className="h-5 mx-[2px] rounded-[4px] border transition-colors relative overflow-hidden"
                    style={{
                      backgroundColor: actualColor
                        ? actualColor
                        : planColor
                          ? `${planColor}33`
                          : "transparent",
                      borderColor: actualColor
                        ? actualColor
                        : planColor
                          ? `${planColor}99`
                          : "var(--hp-border)",
                    }}
                    title={
                      actual
                        ? `실제: ${actual.label}`
                        : plan
                          ? `계획: ${plan.label}`
                          : `${String(hour).padStart(2, "0")}:${String(slotIdx * 10).padStart(2, "0")}`
                    }
                    aria-label={`${hour}시 ${slotIdx * 10}분 슬롯`}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* 범례 */}
      <div className="flex items-center justify-end gap-4 text-[11px] text-[var(--hp-text-3)]">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-2 rounded-[2px] bg-[#4F7CAC]" />
          <span>실제 순공 (타이머 자동)</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-2 rounded-[2px] bg-[#4F7CAC]/25 border border-[#4F7CAC]/70" />
          <span>계획 블록</span>
        </span>
      </div>
    </section>
  );
}
