"use client";

import { useMemo, useState } from "react";
import {
  BookOpen,
  Calculator,
  CalendarClock,
  Check,
  Delete,
  Palette,
  Search,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import {
  HOUSING_GLOSSARY_ITEMS,
  TIMER_THEME_PRESETS,
  type TimerThemeId,
} from "@/data/study-timer-tools";
import {
  AMBIENT_TRACKS,
  type AmbientSoundTrack,
} from "@/lib/study-ambient-audio";
import {
  getTimetableSlotActual,
  getTimetableSlotPlan,
  type StudySubjectNode,
  type TimetableSlotEntry,
} from "@/data/study-textbooks";

export type ActiveTimerToolId =
  | null
  | "timeline"
  | "dictionary"
  | "calculator"
  | "books"
  | "schedule"
  | "sound"
  | "theme";

export type MainTimeDisplayMode = "session" | "todayTotal" | "subjectToday";

interface TimerToolModalProps {
  activeTool: ActiveTimerToolId;
  onClose: () => void;
  subjects: StudySubjectNode[];
  currentSubjectTitle: string;
  todaySlots: Record<string, TimetableSlotEntry>;
  onSwitchTopic?: (topicId: string) => void;
  ambientTrack: AmbientSoundTrack;
  ambientVolume: number;
  onChangeAmbient: (track: AmbientSoundTrack, volume?: number) => void;
  themeId: TimerThemeId;
  onChangeTheme: (id: TimerThemeId) => void;
  mainTimeMode: MainTimeDisplayMode;
  onChangeMainTimeMode: (mode: MainTimeDisplayMode) => void;
  timerStyle: "stopwatch" | "pomodoro";
  pomodoroMinutes: number;
  onChangeTimerStyle: (style: "stopwatch" | "pomodoro", minutes?: number) => void;
}

export function TimerToolModal({
  activeTool,
  onClose,
  subjects,
  currentSubjectTitle,
  todaySlots,
  onSwitchTopic,
  ambientTrack,
  ambientVolume,
  onChangeAmbient,
  themeId,
  onChangeTheme,
  mainTimeMode,
  onChangeMainTimeMode,
  timerStyle,
  pomodoroMinutes,
  onChangeTimerStyle,
}: TimerToolModalProps) {
  const [dictQuery, setDictQuery] = useState("");
  const [dictSubject, setDictSubject] = useState<string>("전체");

  // 미니 계산기 상태
  const [calcExpr, setCalcExpr] = useState<string>("0");
  const [calcResult, setCalcResult] = useState<string | null>(null);

  const filteredGlossary = useMemo(() => {
    const q = dictQuery.trim().toLowerCase();
    return HOUSING_GLOSSARY_ITEMS.filter((item) => {
      if (dictSubject !== "전체" && item.subject !== dictSubject) return false;
      if (!q) return true;
      return (
        item.term.toLowerCase().includes(q) ||
        item.summary.toLowerCase().includes(q) ||
        (item.keyNumbers?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [dictQuery, dictSubject]);

  // 오늘 시간표 슬롯 요약
  const slotHours = useMemo(() => {
    const rows: Array<{
      hour: number;
      planCount: number;
      actualCount: number;
      labels: string[];
    }> = [];
    for (let h = 5; h <= 23; h++) {
      let planCount = 0;
      let actualCount = 0;
      const labels = new Set<string>();
      for (let m = 0; m < 60; m += 10) {
        const key = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
        const slot = todaySlots[key];
        const plan = getTimetableSlotPlan(slot);
        const actual = getTimetableSlotActual(slot);
        if (plan) {
          planCount += 1;
          labels.add(plan.label);
        }
        if (actual) {
          actualCount += 1;
          labels.add(actual.label);
        }
      }
      if (planCount > 0 || actualCount > 0) {
        rows.push({ hour: h, planCount, actualCount, labels: Array.from(labels) });
      }
    }
    return rows;
  }, [todaySlots]);

  if (!activeTool) return null;

  const handleCalcKey = (key: string) => {
    if (key === "C") {
      setCalcExpr("0");
      setCalcResult(null);
      return;
    }
    if (key === "DEL") {
      setCalcResult(null);
      setCalcExpr((prev) => (prev.length <= 1 ? "0" : prev.slice(0, -1)));
      return;
    }
    if (key === "=") {
      try {
        const sanitized = calcExpr
          .replace(/×/g, "*")
          .replace(/÷/g, "/")
          .replace(/%/g, "*0.01");
        if (!/^[0-9+\-*/().\s]+$/.test(sanitized)) {
          setCalcResult("오류");
          return;
        }
        const evaluated = Function(`"use strict"; return (${sanitized})`)() as unknown;
        if (typeof evaluated === "number" && Number.isFinite(evaluated)) {
          const rounded = Math.round(evaluated * 10000) / 10000;
          setCalcResult(String(rounded));
        } else {
          setCalcResult("오류");
        }
      } catch {
        setCalcResult("오류");
      }
      return;
    }

    setCalcResult(null);
    setCalcExpr((prev) => {
      if (prev === "0" && /^[0-9]$/.test(key)) return key;
      return `${prev}${key}`;
    });
  };

  const titleMap: Record<Exclude<ActiveTimerToolId, null>, string> = {
    timeline: "오늘 집중 타임라인",
    dictionary: "주택관리사 핵심 법령·용어 사전",
    calculator: "수험 회계·시설 계산기",
    books: "교재 · 단원 빠른 전환",
    schedule: "오늘 시간표 요약",
    sound: "백색소음 · 집중 사운드",
    theme: "테마 · 메인 시간 · 타이머 설정",
  };

  return (
    <div
      className="fixed inset-0 z-[70] bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-3"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[430px] max-h-[82vh] rounded-3xl bg-[#16161D] border border-white/[0.12] text-white shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 모달 헤더 */}
        <div className="px-4 py-3 border-b border-white/[0.08] flex items-center justify-between bg-[#1B1B24]">
          <h3 className="text-xs font-black text-white flex items-center gap-1.5">
            {activeTool === "dictionary" && <BookOpen className="w-4 h-4 text-[#FF7A59]" />}
            {activeTool === "calculator" && <Calculator className="w-4 h-4 text-sky-400" />}
            {activeTool === "sound" && <Volume2 className="w-4 h-4 text-emerald-400" />}
            {activeTool === "theme" && <Palette className="w-4 h-4 text-amber-400" />}
            {(activeTool === "timeline" || activeTool === "schedule") && (
              <CalendarClock className="w-4 h-4 text-[#FF7A59]" />
            )}
            <span>{titleMap[activeTool]}</span>
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-white/[0.08]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 모달 본문 */}
        <div className="p-4 overflow-y-auto space-y-3">
          {/* 1. 법령·회계 미니 사전 */}
          {activeTool === "dictionary" && (
            <div className="space-y-2.5">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={dictQuery}
                  onChange={(e) => setDictQuery(e.target.value)}
                  placeholder="장기수선, 하자담보, 사용검사, 감가상각..."
                  className="w-full pl-8 pr-3 py-2 rounded-xl bg-[#0D0D12] border border-white/[0.1] text-xs text-white focus:outline-none focus:border-[#FF5A36]"
                />
              </div>
              <div className="flex items-center gap-1 overflow-x-auto pb-0.5">
                {["전체", "공동주택관리법", "주택법", "회계원리", "시설개론", "민법"].map(
                  (subj) => (
                    <button
                      key={subj}
                      type="button"
                      onClick={() => setDictSubject(subj)}
                      className={`px-2 py-1 rounded-lg text-[10px] font-bold shrink-0 transition ${
                        dictSubject === subj
                          ? "bg-[#FF5A36] text-white"
                          : "bg-white/[0.05] text-slate-400 hover:text-white"
                      }`}
                    >
                      {subj}
                    </button>
                  )
                )}
              </div>
              <div className="space-y-2">
                {filteredGlossary.map((g) => (
                  <div
                    key={g.id}
                    className="p-3 rounded-xl bg-[#101016] border border-white/[0.07] space-y-1"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-black text-white">{g.term}</span>
                      <span className="px-1.5 py-0.5 rounded bg-sky-500/15 text-sky-300 text-[9.5px] font-bold shrink-0">
                        {g.subject}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed">{g.summary}</p>
                    {g.keyNumbers && (
                      <div className="text-[10px] font-mono font-black text-[#FF8A6B]">
                        핵심 수치: {g.keyNumbers}
                      </div>
                    )}
                  </div>
                ))}
                {filteredGlossary.length === 0 && (
                  <div className="text-center py-6 text-xs text-slate-500">
                    일치하는 용어가 없습니다.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 2. 수험 계산기 */}
          {activeTool === "calculator" && (
            <div className="space-y-3">
              <div className="p-3.5 rounded-2xl bg-[#0D0D12] border border-white/[0.08] text-right space-y-1">
                <div className="text-xs font-mono text-slate-400 break-all min-h-[18px]">
                  {calcExpr}
                </div>
                <div className="text-2xl font-mono font-black text-white tabular-nums">
                  {calcResult ?? calcExpr}
                </div>
              </div>
              <div className="grid grid-cols-4 gap-1.5 text-sm font-black">
                {[
                  "C",
                  "(",
                  ")",
                  "÷",
                  "7",
                  "8",
                  "9",
                  "×",
                  "4",
                  "5",
                  "6",
                  "-",
                  "1",
                  "2",
                  "3",
                  "+",
                  "0",
                  ".",
                  "%",
                  "=",
                ].map((k) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => handleCalcKey(k)}
                    className={`py-3 rounded-xl transition ${
                      k === "="
                        ? "bg-[#FF5A36] hover:bg-[#ff6d4d] text-white"
                        : ["+", "-", "×", "÷", "%"].includes(k)
                          ? "bg-sky-500/15 text-sky-300 hover:bg-sky-500/25"
                          : k === "C"
                            ? "bg-rose-500/15 text-rose-300 hover:bg-rose-500/25"
                            : "bg-[#1E1E27] hover:bg-[#272733] text-white"
                    }`}
                  >
                    {k}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => handleCalcKey("DEL")}
                className="w-full py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-xs font-bold text-slate-300 flex items-center justify-center gap-1.5"
              >
                <Delete className="w-3.5 h-3.5" />
                <span>한 글자 지우기</span>
              </button>
            </div>
          )}

          {/* 3. 백색소음 & 음악 */}
          {activeTool === "sound" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-xl bg-[#0D0D12] border border-white/[0.08]">
                <span className="text-xs font-bold text-slate-300">사운드 볼륨</span>
                <div className="flex items-center gap-2 w-44">
                  <button
                    type="button"
                    onClick={() => onChangeAmbient("none")}
                    className="p-1 text-slate-400 hover:text-white"
                    title="음소거"
                  >
                    {ambientTrack === "none" ? (
                      <VolumeX className="w-4 h-4 text-slate-500" />
                    ) : (
                      <Volume2 className="w-4 h-4 text-[#FF7A59]" />
                    )}
                  </button>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={Math.round(ambientVolume * 100)}
                    onChange={(e) =>
                      onChangeAmbient(ambientTrack, Number(e.target.value) / 100)
                    }
                    className="flex-1 accent-[#FF5A36]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-2">
                {AMBIENT_TRACKS.map((t) => {
                  const isActive = ambientTrack === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() =>
                        onChangeAmbient(isActive ? "none" : t.id, ambientVolume)
                      }
                      className={`p-3 rounded-xl border text-left flex items-center justify-between transition ${
                        isActive
                          ? "bg-[#FF5A36]/15 border-[#FF5A36] text-white"
                          : "bg-[#101016] border-white/[0.07] text-slate-300 hover:border-white/[0.2]"
                      }`}
                    >
                      <div>
                        <div className="text-xs font-black flex items-center gap-1.5">
                          <span>{t.label}</span>
                          <span className="px-1.5 py-0.2 rounded bg-white/[0.07] text-[9px] text-slate-400">
                            {t.category === "music" ? "집중음" : "백색소음"}
                          </span>
                        </div>
                        <div className="text-[10.5px] text-slate-400 mt-0.5">{t.desc}</div>
                      </div>
                      <span
                        className={`px-2 py-1 rounded-lg text-[10px] font-black ${
                          isActive
                            ? "bg-[#FF5A36] text-white"
                            : "bg-white/[0.06] text-slate-400"
                        }`}
                      >
                        {isActive ? "재생중" : "재생"}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 4. 타임라인 / 시간표 */}
          {(activeTool === "timeline" || activeTool === "schedule") && (
            <div className="space-y-2.5">
              <div className="p-2.5 rounded-xl bg-[#FF5A36]/10 border border-[#FF5A36]/30 text-[11px] text-[#FF9980] font-bold">
                현재 공부중: {currentSubjectTitle}
              </div>
              {slotHours.length === 0 ? (
                <div className="p-6 rounded-xl bg-[#0E0E14] border border-dashed border-white/[0.1] text-center text-xs text-slate-400">
                  오늘 플래너 일정표에 기록된 블록이 아직 없습니다.
                  <br />
                  지금 타이머를 종료·인증하면 10분 단위 실행 블록에 자동 기록됩니다!
                </div>
              ) : (
                <div className="space-y-1.5">
                  {slotHours.map((row) => (
                    <div
                      key={row.hour}
                      className="px-3 py-2 rounded-xl bg-[#101016] border border-white/[0.06] flex items-center justify-between gap-2 text-[11px]"
                    >
                      <span className="font-mono font-black text-slate-300 w-12 shrink-0">
                        {String(row.hour).padStart(2, "0")}:00
                      </span>
                      <span className="flex-1 truncate font-bold text-white">
                        {row.labels.join(", ")}
                      </span>
                      <div className="flex items-center gap-1.5 font-mono text-[10px] shrink-0">
                        {row.planCount > 0 && (
                          <span className="px-1.5 py-0.5 rounded bg-sky-500/15 text-sky-300">
                            예상 {row.planCount * 10}m
                          </span>
                        )}
                        {row.actualCount > 0 && (
                          <span className="px-1.5 py-0.5 rounded bg-[#FF5A36]/20 text-[#FF8A6B]">
                            실행 {row.actualCount * 10}m
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 5. 교재/단원 빠른 전환 */}
          {activeTool === "books" && (
            <div className="space-y-2.5">
              <p className="text-[11px] text-slate-400">
                타이머를 끄지 않고 다른 과목·단원으로 전환할 수 있습니다.
              </p>
              <div className="space-y-2 max-h-[52vh] overflow-y-auto pr-0.5">
                {subjects.map((subj) => (
                  <div
                    key={subj.id}
                    className="p-2.5 rounded-xl bg-[#101016] border border-white/[0.07] space-y-1.5"
                  >
                    <div className="text-[11px] font-black text-white flex items-center gap-1.5">
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: subj.color }}
                      />
                      <span>{subj.title}</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {subj.units.flatMap((u) => u.topics).slice(0, 8).map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => {
                            onSwitchTopic?.(t.id);
                            onClose();
                          }}
                          className="px-2 py-1 rounded-lg bg-white/[0.05] hover:bg-[#FF5A36]/25 border border-white/[0.08] text-[10px] font-bold text-slate-200 transition"
                        >
                          {t.title}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 6. 테마 · 메인 시간 · 타이머 모드 설정 */}
          {activeTool === "theme" && (
            <div className="space-y-4">
              {/* 타이머 방식 */}
              <div className="space-y-1.5">
                <div className="text-[11px] font-black text-slate-300">타이머 작동 방식</div>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => onChangeTimerStyle("stopwatch")}
                    className={`py-2 px-3 rounded-xl border text-xs font-black transition ${
                      timerStyle === "stopwatch"
                        ? "bg-[#FF5A36] border-[#FF5A36] text-white"
                        : "bg-[#101016] border-white/[0.08] text-slate-300"
                    }`}
                  >
                    스톱워치 (00:00 ↑)
                  </button>
                  <button
                    type="button"
                    onClick={() => onChangeTimerStyle("pomodoro", pomodoroMinutes)}
                    className={`py-2 px-3 rounded-xl border text-xs font-black transition ${
                      timerStyle === "pomodoro"
                        ? "bg-[#FF5A36] border-[#FF5A36] text-white"
                        : "bg-[#101016] border-white/[0.08] text-slate-300"
                    }`}
                  >
                    뽀모도로 ({pomodoroMinutes}분 ↓)
                  </button>
                </div>
                {timerStyle === "pomodoro" && (
                  <div className="flex items-center gap-1.5 pt-1">
                    {[25, 45, 50, 60].map((min) => (
                      <button
                        key={min}
                        type="button"
                        onClick={() => onChangeTimerStyle("pomodoro", min)}
                        className={`px-2.5 py-1 rounded-lg text-[10.5px] font-black ${
                          pomodoroMinutes === min
                            ? "bg-amber-500 text-slate-950"
                            : "bg-white/[0.06] text-slate-300"
                        }`}
                      >
                        {min}분
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* 메인 시간 표시 기준 */}
              <div className="space-y-1.5">
                <div className="text-[11px] font-black text-slate-300">메인 큰 숫자 표시 기준</div>
                <div className="grid grid-cols-3 gap-1.5 text-[10.5px] font-black">
                  {(
                    [
                      { id: "session", label: "현재 집중" },
                      { id: "subjectToday", label: "과목 누적" },
                      { id: "todayTotal", label: "오늘 전체" },
                    ] as const
                  ).map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => onChangeMainTimeMode(opt.id)}
                      className={`py-2 px-2 rounded-xl border transition ${
                        mainTimeMode === opt.id
                          ? "bg-sky-500/20 border-sky-400 text-sky-200"
                          : "bg-[#101016] border-white/[0.08] text-slate-400"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 테마 선택 */}
              <div className="space-y-1.5">
                <div className="text-[11px] font-black text-slate-300">집중 스튜디오 테마</div>
                <div className="grid grid-cols-2 gap-2">
                  {TIMER_THEME_PRESETS.map((preset) => {
                    const selected = preset.id === themeId;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => onChangeTheme(preset.id)}
                        className={`p-2.5 rounded-xl border text-left transition ${
                          selected
                            ? "border-white bg-white/[0.08]"
                            : "border-white/[0.08] bg-[#101016] hover:border-white/[0.2]"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span
                            className="w-3.5 h-3.5 rounded-full"
                            style={{ backgroundColor: preset.accentHex }}
                          />
                          {selected && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                        </div>
                        <div className="text-[11px] font-black text-white mt-1.5">
                          {preset.name}
                        </div>
                        <div className="text-[9.5px] text-slate-400 mt-0.5 line-clamp-1">
                          {preset.desc}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
