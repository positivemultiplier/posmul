"use client";

import { useMemo, useState } from "react";
import { ChevronDown, ChevronUp, Eraser } from "lucide-react";
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
  actualStudySeconds: number;
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
  actualStudySeconds,
  onUpdateSlots,
}: TenMinuteTimelineProps) {
  const [brushIndex, setBrushIndex] = useState<number | "erase">(0);
  const [rangeAnchorIdx, setRangeAnchorIdx] = useState<number | null>(null);
  const [showOvernight, setShowOvernight] = useState(false);

  const allHours = useMemo(() => getHoursFromReset(STUDY_DAY_RESET_HOUR), []);
  // 기본 06:00~23:59 집중 노출, 새벽(05시 + 00~04시)은 접기/펼치기
  const visibleHours = useMemo(() => {
    if (showOvernight) return allHours;
    return allHours.filter((h) => h >= 6 && h <= 23);
  }, [allHours, showOvernight]);

  // 전체 144칸의 선형 인덱스 <-> slotKey 매핑 (모바일 2탭 구간 색칠용)
  const orderedSlotKeys = useMemo(() => {
    const keys: string[] = [];
    for (const h of allHours) {
      for (const s of SLOTS_PER_HOUR) {
        keys.push(`${h}-${s}`);
      }
    }
    return keys;
  }, [allHours]);

  const slotIndexMap = useMemo(() => {
    const map = new Map<string, number>();
    orderedSlotKeys.forEach((k, i) => map.set(k, i));
    return map;
  }, [orderedSlotKeys]);

  const planMinutes = useMemo(() => {
    let blocks = 0;
    for (const slot of Object.values(daySlots)) {
      if (getTimetableSlotPlan(slot)) blocks += 1;
    }
    return blocks * 10;
  }, [daySlots]);

  const paintSlotRange = (fromIdx: number, toIdx: number, isSingleToggle: boolean) => {
    const start = Math.min(fromIdx, toIdx);
    const end = Math.max(fromIdx, toIdx);

    onUpdateSlots(selectedDateISO, (prev) => {
      const next = { ...prev };
      const subj = brushIndex === "erase" ? null : subjects[brushIndex] || subjects[0];
      const color = subj ? getMutedSubjectColor(subj.title, subj.color, Number(brushIndex)) : "";
      const label = subj ? subj.shortTitle || subj.title : "";

      for (let i = start; i <= end; i += 1) {
        const key = orderedSlotKeys[i];
        if (!key) continue;
        const existing = next[key];

        if (brushIndex === "erase") {
          const updated = setTimetableSlotLayer(existing, "plan", null);
          if (updated) next[key] = updated;
          else delete next[key];
          continue;
        }

        const prevPlan = getTimetableSlotPlan(existing);
        if (isSingleToggle && prevPlan && prevPlan.label === label) {
          const updated = setTimetableSlotLayer(existing, "plan", null);
          if (updated) next[key] = updated;
          else delete next[key];
        } else if (subj) {
          const updated = setTimetableSlotLayer(existing, "plan", {
            color,
            label,
          });
          if (updated) next[key] = updated;
        }
      }
      return next;
    });
  };

  // 모바일/PC 공통: 첫 탭은 단일 토글 + 시작점 설정, 두 번째 다른 칸 탭은 구간 일괄 색칠!
  const handleSlotTap = (slotKey: string) => {
    const idx = slotIndexMap.get(slotKey);
    if (idx === undefined) return;

    if (rangeAnchorIdx === null) {
      paintSlotRange(idx, idx, true);
      setRangeAnchorIdx(idx);
    } else if (rangeAnchorIdx === idx) {
      paintSlotRange(idx, idx, true);
      setRangeAnchorIdx(null);
    } else {
      paintSlotRange(rangeAnchorIdx, idx, false);
      setRangeAnchorIdx(null);
    }
  };

  const actualMinutesLabel =
    actualStudySeconds >= 60
      ? formatCompactMinutes(Math.floor(actualStudySeconds / 60))
      : `${actualStudySeconds}s`;

  return (
    <section className="space-y-3 select-none">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 className="text-xs font-medium text-[var(--hp-text-2)]">10분 타임라인</h2>
          <p className="text-[11px] text-[var(--hp-text-3)] mt-0.5">
            {rangeAnchorIdx !== null
              ? "끝 칸을 탭하면 시작~끝 구간이 한 번에 채워집니다."
              : "과목 선택 후 시작 칸 → 끝 칸 2번 탭으로 계획 블록 배치"}
          </p>
        </div>
        <div className="text-right text-[11px] hp-tabular text-[var(--hp-text-2)] shrink-0">
          <div>실제 {actualMinutesLabel}</div>
          <div className="text-[var(--hp-text-3)]">계획 {formatCompactMinutes(planMinutes)}</div>
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
              onClick={() => {
                setBrushIndex(idx);
                setRangeAnchorIdx(null);
              }}
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
          onClick={() => {
            setBrushIndex("erase");
            setRangeAnchorIdx(null);
          }}
          className={`px-2.5 py-1.5 rounded-lg text-[11px] flex items-center gap-1 whitespace-nowrap border transition ${
            brushIndex === "erase"
              ? "bg-[var(--hp-accent)] text-[var(--hp-accent-fg)] border-transparent font-medium"
              : "bg-[var(--hp-surface)] border-[var(--hp-border)] text-[var(--hp-text-2)]"
          }`}
        >
          <Eraser className="w-3 h-3 stroke-[1.5]" />
          <span>지우개</span>
        </button>

        {rangeAnchorIdx !== null && (
          <button
            type="button"
            onClick={() => setRangeAnchorIdx(null)}
            className="px-2 py-1.5 rounded-lg text-[11px] border border-[var(--hp-border)] text-[var(--hp-text-3)] whitespace-nowrap"
          >
            구간 취소
          </button>
        )}
      </div>

      {/* 10분 타임라인 그리드 */}
      <div className="rounded-xl bg-[var(--hp-surface)] border border-[var(--hp-border)] overflow-hidden">
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
          {visibleHours.map((hour) => (
            <div
              key={hour}
              className="grid grid-cols-[38px_repeat(6,1fr)] items-center px-2 h-7"
            >
              <span className="text-[11px] hp-tabular text-[var(--hp-text-3)] pl-1">
                {String(hour).padStart(2, "0")}
              </span>

              {SLOTS_PER_HOUR.map((slotIdx) => {
                const slotKey = `${hour}-${slotIdx}`;
                const linearIdx = slotIndexMap.get(slotKey);
                const isAnchor = linearIdx !== undefined && linearIdx === rangeAnchorIdx;
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
                    onClick={() => handleSlotTap(slotKey)}
                    className={`h-5 mx-[2px] rounded-[4px] border transition ${
                      isAnchor ? "ring-1 ring-[var(--hp-accent)]" : ""
                    }`}
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

        {/* 새벽 시간대(00~05시) 접기/펼치기 토글 */}
        <button
          type="button"
          onClick={() => setShowOvernight((prev) => !prev)}
          className="w-full py-2 border-t border-[var(--hp-border)] text-[11px] text-[var(--hp-text-3)] hover:text-[var(--hp-text-2)] flex items-center justify-center gap-1 transition"
        >
          {showOvernight ? (
            <>
              <ChevronUp className="w-3.5 h-3.5 stroke-[1.5]" />
              <span>새벽 구간(00~05시) 접기</span>
            </>
          ) : (
            <>
              <ChevronDown className="w-3.5 h-3.5 stroke-[1.5]" />
              <span>새벽 구간(00~05시) 펼치기</span>
            </>
          )}
        </button>
      </div>

      {/* 범례 */}
      <div className="flex items-center justify-end gap-4 text-[11px] text-[var(--hp-text-3)]">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-2 rounded-[2px] bg-[#4F7CAC]" />
          <span>실제 순공 (1분 이상 자동)</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-2 rounded-[2px] bg-[#4F7CAC]/25 border border-[#4F7CAC]/70" />
          <span>계획 블록</span>
        </span>
      </div>
    </section>
  );
}
