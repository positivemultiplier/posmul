"use client";

import { useMemo, useState } from "react";
import { Check, ChevronDown, Pause, Play, Square, User, Users } from "lucide-react";
import type { QuickTimerState } from "@/components/mobile/global-ux-provider";
import { useStudyGroupsStore } from "@/lib/study-groups-store";
import { useStudyAuth } from "@/components/auth/study-auth-provider";
import { useStudyCurriculum } from "@/lib/study-curriculum-store";
import { getStudySecondsForDate } from "@/lib/study-metrics";
import { grantAppStudyPmpAction } from "@/app/actions/study-economy.actions";
import {
  formatClockHHMMSS,
  formatShortClock,
  getMemberInitials,
  getMutedSubjectColor,
} from "@/lib/study-theme";

interface GroupFocusOverlayProps {
  timer: QuickTimerState;
  onMinimize: () => void;
  onTogglePause: () => void;
  onStopAndSave: () => { savedSeconds: number; topicTitle: string };
}

type OverlayDisplayMode = "group" | "focus";

interface NormalizedSeat {
  id: string;
  nickname: string;
  subject: string;
  color: string;
  todaySeconds: number;
  isStudying: boolean;
  isMe: boolean;
}

export function GroupFocusOverlay({
  timer,
  onMinimize,
  onTogglePause,
  onStopAndSave,
}: GroupFocusOverlayProps) {
  // 기본값은 반드시 'group' (실행 즉시 스터디 그룹 노출, 1탭으로 개인 집중 전환 가능)
  const [displayMode, setDisplayMode] = useState<OverlayDisplayMode>("group");
  const [finishNotice, setFinishNotice] = useState<string | null>(null);

  const { joinedRooms, rooms, activeRoomId, setActiveRoomId } = useStudyGroupsStore();
  const { isLoggedIn, profile, setLocalPmpBalance } = useStudyAuth();
  const { todayISO, studySessions, todos, toggleTodo } = useStudyCurriculum();

  const activeRoom = useMemo(() => {
    const found = joinedRooms.find((r) => r.id === activeRoomId);
    return found || joinedRooms[0] || rooms[0] || null;
  }, [joinedRooms, rooms, activeRoomId]);

  // 오늘 실제 누적 순공시간(초) — SSOT(studySessions) 단일 집계
  const baseTodaySeconds = useMemo(
    () => getStudySecondsForDate(studySessions, todayISO),
    [studySessions, todayISO]
  );

  // 현재 실행 중인 할 일 객체 (오버레이 안에서 즉시 완료 체크 가능)
  const linkedTodo = useMemo(
    () => (timer.todoId ? todos.find((t) => t.id === timer.todoId) ?? null : null),
    [todos, timer.todoId]
  );

  const seats = useMemo<NormalizedSeat[]>(() => {
    const myName = isLoggedIn ? profile.displayName || "나" : "나";
    const meSeat: NormalizedSeat = {
      id: "me",
      nickname: myName,
      subject: timer.subjectTitle || "집중 학습",
      color: timer.subjectColor || "#4F7CAC",
      todaySeconds: baseTodaySeconds + timer.elapsedSeconds,
      isStudying: !timer.paused,
      isMe: true,
    };

    const others: NormalizedSeat[] = (activeRoom?.members || [])
      .filter((m) => !m.isMe)
      .slice(0, 11)
      .map((m, idx) => ({
        id: m.id,
        nickname: m.nickname,
        subject: m.subject || "자습",
        color: getMutedSubjectColor(m.subject || "", undefined, idx + 1),
        todaySeconds: m.todaySeconds + (m.isStudying ? timer.elapsedSeconds : 0),
        isStudying: m.isStudying,
        isMe: false,
      }));

    return [meSeat, ...others];
  }, [activeRoom, baseTodaySeconds, isLoggedIn, profile.displayName, timer]);

  const studyingCount = useMemo(
    () => seats.filter((s) => s.isStudying).length,
    [seats]
  );

  const handleFinish = () => {
    const { savedSeconds, topicTitle } = onStopAndSave();
    setDisplayMode("group");

    if (savedSeconds >= 600) {
      void grantAppStudyPmpAction({ kind: "FOCUS" }).then((res) => {
        if (res.success && typeof res.newBalance === "number") {
          setLocalPmpBalance(res.newBalance);
        }
      });
      const mins = Math.round(savedSeconds / 60);
      setFinishNotice(`${topicTitle} ${mins}분 기록 완료 · 집중 PMP 적립 요청됨`);
      window.setTimeout(() => setFinishNotice(null), 2600);
    } else if (savedSeconds >= 60) {
      const mins = Math.floor(savedSeconds / 60);
      const secs = savedSeconds % 60;
      setFinishNotice(`${topicTitle} ${mins}분 ${secs}초 타임라인에 자동 기록됨`);
      window.setTimeout(() => setFinishNotice(null), 2400);
    } else if (savedSeconds >= 5) {
      setFinishNotice(`${topicTitle} ${savedSeconds}초 순공시간에 기록됨`);
      window.setTimeout(() => setFinishNotice(null), 2200);
    }
  };

  if (!timer.active || !timer.overlayOpen) {
    if (!finishNotice) return null;
    return (
      <div className="fixed top-16 left-1/2 -translate-x-1/2 z-[90] max-w-[420px] w-[92%] px-4 py-2.5 rounded-xl bg-[var(--hp-surface)] border border-[var(--hp-border-strong)] text-xs font-medium text-[var(--hp-text)] shadow-xl text-center">
        {finishNotice}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[80] bg-[var(--hp-bg)] text-[var(--hp-text)] flex flex-col items-center">
      <div className="w-full max-w-[460px] h-full flex flex-col border-x border-[var(--hp-border)]">
        {/* 상단 컨트롤 바: 접기 · 그룹/개인 1탭 전환 */}
        <header className="pt-safe px-4 py-3 border-b border-[var(--hp-border)] flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={onMinimize}
            className="h-9 px-2.5 rounded-lg border border-[var(--hp-border)] hover:border-[var(--hp-border-strong)] text-xs text-[var(--hp-text-2)] hover:text-[var(--hp-text)] flex items-center gap-1 transition"
            aria-label="타이머 최소화"
          >
            <ChevronDown className="w-4 h-4 stroke-[1.5]" />
            <span>접기</span>
          </button>

          <div className="p-0.5 rounded-lg bg-[var(--hp-surface)] border border-[var(--hp-border)] grid grid-cols-2 gap-0.5">
            <button
              type="button"
              onClick={() => setDisplayMode("group")}
              className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center justify-center gap-1.5 transition ${
                displayMode === "group"
                  ? "bg-[var(--hp-accent)] text-[var(--hp-accent-fg)]"
                  : "text-[var(--hp-text-2)] hover:text-[var(--hp-text)]"
              }`}
            >
              <Users className="w-3.5 h-3.5 stroke-[1.5]" />
              <span>그룹</span>
            </button>
            <button
              type="button"
              onClick={() => setDisplayMode("focus")}
              className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center justify-center gap-1.5 transition ${
                displayMode === "focus"
                  ? "bg-[var(--hp-accent)] text-[var(--hp-accent-fg)]"
                  : "text-[var(--hp-text-2)] hover:text-[var(--hp-text)]"
              }`}
            >
              <User className="w-3.5 h-3.5 stroke-[1.5]" />
              <span>개인</span>
            </button>
          </div>
        </header>

        {/* 연결된 플래너 할 일 즉시 완료 체크 바 */}
        {linkedTodo && (
          <div className="px-5 py-2.5 border-b border-[var(--hp-border)] bg-[var(--hp-surface)] flex items-center justify-between gap-2">
            <span className="text-xs text-[var(--hp-text-2)] truncate">
              진행 중 할 일: <strong className="font-medium text-[var(--hp-text)]">{linkedTodo.title}</strong>
            </span>
            <button
              type="button"
              onClick={() => toggleTodo(linkedTodo.id)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium flex items-center gap-1 shrink-0 border transition ${
                linkedTodo.completed
                  ? "bg-[var(--hp-accent)] text-[var(--hp-accent-fg)] border-transparent"
                  : "border-[var(--hp-border-strong)] text-[var(--hp-text)]"
              }`}
            >
              <Check className="w-3 h-3 stroke-[2]" />
              <span>{linkedTodo.completed ? "완료됨" : "완료 체크"}</span>
            </button>
          </div>
        )}

        {displayMode === "group" ? (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* 상단 컴팩트 세션 타이머 바 */}
            <section className="px-5 py-5 border-b border-[var(--hp-border)] flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-xs text-[var(--hp-text-2)]">
                  <span
                    className={`w-2 h-2 rounded-full shrink-0 ${
                      timer.paused ? "opacity-40" : "animate-pulse"
                    }`}
                    style={{ backgroundColor: timer.subjectColor }}
                  />
                  <span className="truncate font-medium text-[var(--hp-text)]">
                    {timer.subjectTitle}
                  </span>
                  <span className="text-[var(--hp-text-3)]">·</span>
                  <span className="truncate">{timer.topicTitle}</span>
                </div>
                <div className="mt-1.5 text-[34px] leading-none font-light tracking-tight hp-tabular">
                  {formatClockHHMMSS(timer.elapsedSeconds)}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={onTogglePause}
                  className="w-10 h-10 rounded-full border border-[var(--hp-border-strong)] hover:bg-[var(--hp-surface)] flex items-center justify-center transition"
                  aria-label={timer.paused ? "타이머 재개" : "타이머 일시정지"}
                >
                  {timer.paused ? (
                    <Play className="w-4 h-4 stroke-[1.5]" />
                  ) : (
                    <Pause className="w-4 h-4 stroke-[1.5]" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleFinish}
                  className="h-10 px-3.5 rounded-full bg-[var(--hp-accent)] text-[var(--hp-accent-fg)] text-xs font-semibold flex items-center gap-1.5 transition hover:opacity-90"
                >
                  <Square className="w-3 h-3 fill-current" />
                  <span>종료</span>
                </button>
              </div>
            </section>

            {/* 그룹 선택 바 */}
            <div className="px-5 py-3 border-b border-[var(--hp-border)] flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                {(joinedRooms.length > 0 ? joinedRooms : rooms.slice(0, 2)).map((room) => {
                  const selected = room.id === activeRoom?.id;
                  return (
                    <button
                      key={room.id}
                      type="button"
                      onClick={() => setActiveRoomId(room.id)}
                      className={`px-2.5 py-1 rounded-md text-xs whitespace-nowrap transition border ${
                        selected
                          ? "bg-[var(--hp-surface-2)] border-[var(--hp-border-strong)] text-[var(--hp-text)] font-medium"
                          : "border-transparent text-[var(--hp-text-3)] hover:text-[var(--hp-text-2)]"
                      }`}
                    >
                      {room.title}
                    </button>
                  );
                })}
              </div>
              <span className="text-[11px] text-[var(--hp-text-2)] hp-tabular shrink-0">
                집중 중 {studyingCount}/{seats.length}
              </span>
            </div>

            {/* 스터디 그룹원 실시간 좌석 그리드 */}
            <div className="flex-1 overflow-y-auto px-5 py-4">
              <div className="grid grid-cols-3 gap-2.5">
                {seats.map((seat) => (
                  <div
                    key={seat.id}
                    className={`p-3 rounded-xl border flex flex-col items-center text-center transition ${
                      seat.isMe
                        ? "bg-[var(--hp-surface-2)] border-[var(--hp-border-strong)]"
                        : "bg-[var(--hp-surface)] border-[var(--hp-border)]"
                    } ${seat.isStudying ? "" : "opacity-55"}`}
                  >
                    <div className="relative">
                      <div
                        className="w-10 h-10 rounded-full border flex items-center justify-center text-xs font-medium tracking-tight bg-[var(--hp-bg)]"
                        style={{
                          borderColor: seat.isStudying ? seat.color : "var(--hp-border)",
                        }}
                      >
                        {getMemberInitials(seat.nickname)}
                      </div>
                      <span
                        className={`absolute -right-0.5 -bottom-0.5 w-2.5 h-2.5 rounded-full border-2 border-[var(--hp-surface)] ${
                          seat.isStudying ? "" : "opacity-40"
                        }`}
                        style={{
                          backgroundColor: seat.isStudying ? seat.color : "var(--hp-text-3)",
                        }}
                      />
                    </div>

                    <div className="mt-2 text-xs font-medium text-[var(--hp-text)] truncate w-full">
                      {seat.isMe ? `${seat.nickname} (나)` : seat.nickname}
                    </div>
                    <div className="text-[10px] text-[var(--hp-text-3)] truncate w-full mt-0.5">
                      {seat.isStudying ? seat.subject : "휴식"}
                    </div>
                    <div className="mt-1.5 text-xs hp-tabular text-[var(--hp-text-2)]">
                      {formatShortClock(seat.todaySeconds)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* 개인 집중 모드 (대형 미니멀 시계 단독 노출) */
          <div className="flex-1 flex flex-col items-center justify-between px-6 py-12">
            <div className="text-center space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--hp-surface)] border border-[var(--hp-border)] text-xs text-[var(--hp-text-2)]">
                <span
                  className={`w-2 h-2 rounded-full ${timer.paused ? "opacity-40" : "animate-pulse"}`}
                  style={{ backgroundColor: timer.subjectColor }}
                />
                <span className="text-[var(--hp-text)] font-medium">{timer.subjectTitle}</span>
              </div>
              <p className="text-sm text-[var(--hp-text-2)]">{timer.topicTitle}</p>
            </div>

            <div className="text-center space-y-3">
              <div className="text-[64px] leading-none font-extralight tracking-tight hp-tabular">
                {formatClockHHMMSS(timer.elapsedSeconds)}
              </div>
              <div className="text-xs text-[var(--hp-text-3)] hp-tabular">
                오늘 누적 {formatClockHHMMSS(baseTodaySeconds + timer.elapsedSeconds)}
              </div>
            </div>

            <div className="w-full max-w-[280px] flex items-center gap-3 pb-safe">
              <button
                type="button"
                onClick={onTogglePause}
                className="flex-1 h-12 rounded-xl border border-[var(--hp-border-strong)] bg-[var(--hp-surface)] hover:bg-[var(--hp-surface-2)] text-sm font-medium flex items-center justify-center gap-2 transition"
              >
                {timer.paused ? (
                  <>
                    <Play className="w-4 h-4 stroke-[1.5]" />
                    <span>재개</span>
                  </>
                ) : (
                  <>
                    <Pause className="w-4 h-4 stroke-[1.5]" />
                    <span>일시정지</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={handleFinish}
                className="flex-1 h-12 rounded-xl bg-[var(--hp-accent)] text-[var(--hp-accent-fg)] text-sm font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
                <span>종료·저장</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
