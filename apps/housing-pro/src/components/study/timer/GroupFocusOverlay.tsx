"use client";

import { useMemo, useRef, useState } from "react";
import {
  Bell,
  CalendarDays,
  Camera,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Copy,
  MessageSquare,
  MoreHorizontal,
  Pause,
  Play,
  Plus,
  Send,
  Settings,
  Square,
  Trophy,
  User,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import type { QuickTimerState } from "@/components/mobile/global-ux-provider";
import { useStudyGroupsStore } from "@/lib/study-groups-store";
import { useStudyAuth } from "@/components/auth/study-auth-provider";
import { useStudyCurriculum } from "@/lib/study-curriculum-store";
import { getStudySecondsForDate } from "@/lib/study-metrics";
import { grantAppStudyPmpAction } from "@/app/actions/study-economy.actions";
import {
  formatClockHHMMSS,
  formatShortClock,
  getMutedSubjectColor,
} from "@/lib/study-theme";
import {
  StudyConeAvatar,
  getStudyConeStageMeta,
  resolveStudyConeFamily,
  type StudyConeFamily,
} from "@/components/study/group/StudyConeAvatar";
import { StudyGroupCreateWizard } from "@/components/mobile/study-group-create-wizard";

interface GroupFocusOverlayProps {
  timer: QuickTimerState;
  onMinimize: () => void;
  onTogglePause: () => void;
  onStopAndSave: () => { savedSeconds: number; topicTitle: string };
}

type OverlayDisplayMode = "group" | "focus";
type OverlaySubTab = "seats" | "rank" | "attendance" | "chat";

interface NormalizedSeat {
  id: string;
  nickname: string;
  subject: string;
  color: string;
  coneFamily: StudyConeFamily;
  todaySeconds: number;
  weeklySeconds: number[];
  isStudying: boolean;
  isMe: boolean;
  rank: number;
}

const WEEKDAYS = ["월", "화", "수", "목", "금", "토", "일"];

function formatHMM(totalSec: number): string {
  if (totalSec <= 0) return "";
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  return `${h}:${String(m).padStart(2, "0")}`;
}

function getRankBadgeClass(rank: number): string {
  if (rank === 1) return "bg-[#C9A14A]/20 text-[#EED68A] border-[#C9A14A]/50";
  if (rank === 2) return "bg-[#9AA4B2]/20 text-[#D7DDE6] border-[#9AA4B2]/45";
  if (rank === 3) return "bg-[#B87D56]/20 text-[#E2B496] border-[#B87D56]/45";
  return "bg-[var(--hp-bg)] text-[var(--hp-text-3)] border-[var(--hp-border)]";
}

export function GroupFocusOverlay({
  timer,
  onMinimize,
  onTogglePause,
  onStopAndSave,
}: GroupFocusOverlayProps) {
  // 기본값은 반드시 'group' (실행 즉시 스터디 그룹 노출, 1탭으로 개인 집중 전환 가능)
  const [displayMode, setDisplayMode] = useState<OverlayDisplayMode>("group");
  const [subTab, setSubTab] = useState<OverlaySubTab>("seats");
  const [rankPeriod, setRankPeriod] = useState<"day" | "week">("day");
  const [isAddSlideActive, setIsAddSlideActive] = useState(false);
  const [finishNotice, setFinishNotice] = useState<string | null>(null);

  // 손가락 터치 + 마우스 드래그 스와이프 추적
  const pointerStartRef = useRef<{ x: number; y: number; pointerId: number } | null>(null);
  const [dragOffsetX, setDragOffsetX] = useState(0);

  // 채팅 · 초대 · 정보 모달 · 탈퇴 확인 모달 · 위저드
  const [chatDraft, setChatDraft] = useState("");
  const [copiedInvite, setCopiedInvite] = useState(false);
  const [showGroupInfoModal, setShowGroupInfoModal] = useState(false);
  const [confirmLeaveRoom, setConfirmLeaveRoom] = useState<{ id: string; title: string } | null>(
    null
  );
  const [wizardState, setWizardState] = useState<{
    open: boolean;
    mode: "create" | "join" | "profile";
    studyType: "general" | "cam";
    targetRoomId?: string;
  }>({ open: false, mode: "create", studyType: "general" });

  const {
    joinedRooms,
    rooms,
    activeRoomId,
    profilesByRoomId,
    setActiveRoomId,
    createAndJoinRoom,
    joinRoomWithProfile,
    updateRoomProfile,
    leaveRoom,
    addGroupChat,
  } = useStudyGroupsStore();
  const { isLoggedIn, profile, setLocalPmpBalance } = useStudyAuth();
  const { todayISO, studySessions, todos, toggleTodo } = useStudyCurriculum();

  const roomList = useMemo(
    () => (joinedRooms.length > 0 ? joinedRooms : rooms.slice(0, 2)),
    [joinedRooms, rooms]
  );

  const currentRoomIndex = useMemo(() => {
    if (isAddSlideActive) return roomList.length;
    const idx = roomList.findIndex((r) => r.id === activeRoomId);
    return idx >= 0 ? idx : 0;
  }, [isAddSlideActive, roomList, activeRoomId]);

  const activeRoom = useMemo(() => {
    if (isAddSlideActive) return null;
    return roomList[currentRoomIndex] || roomList[0] || null;
  }, [isAddSlideActive, roomList, currentRoomIndex]);

  // 오늘 실제 누적 순공시간(초) — SSOT(studySessions) 단일 집계
  const baseTodaySeconds = useMemo(
    () => getStudySecondsForDate(studySessions, todayISO),
    [studySessions, todayISO]
  );
  const liveMyTodaySeconds = baseTodaySeconds + timer.elapsedSeconds;

  // 현재 방에서의 내 프로필
  const defaultNickname = isLoggedIn ? profile.displayName || "나" : "나";
  const effectiveMyProfile = useMemo(() => {
    const saved = activeRoom ? profilesByRoomId[activeRoom.id] : undefined;
    return {
      nickname: saved?.nickname || defaultNickname,
      coneFamily: resolveStudyConeFamily(saved?.coneEmoji, "me"),
      rawCone: saved?.coneEmoji || "CLASSIC_FLAME",
    };
  }, [activeRoom, profilesByRoomId, defaultNickname]);

  const myConeStage = useMemo(
    () => getStudyConeStageMeta(liveMyTodaySeconds),
    [liveMyTodaySeconds]
  );

  // 현재 실행 중인 할 일 객체
  const linkedTodo = useMemo(
    () => (timer.todoId ? todos.find((t) => t.id === timer.todoId) ?? null : null),
    [todos, timer.todoId]
  );

  // 순공시간 내림차순으로 순위가 계산된 실시간 좌석 목록
  const seats = useMemo<NormalizedSeat[]>(() => {
    if (!activeRoom) return [];
    const meRaw = {
      id: "me",
      nickname: effectiveMyProfile.nickname,
      subject: timer.subjectTitle || "집중 학습",
      color: timer.subjectColor || "#4F7CAC",
      coneFamily: effectiveMyProfile.coneFamily,
      todaySeconds: liveMyTodaySeconds,
      weeklySeconds: [
        Math.max(3600, liveMyTodaySeconds),
        Math.max(5400, liveMyTodaySeconds),
        liveMyTodaySeconds,
        0,
        0,
        0,
        0,
      ],
      isStudying: !timer.paused,
      isMe: true,
    };

    const othersRaw = (activeRoom.members || [])
      .filter((m) => !m.isMe)
      .slice(0, 11)
      .map((m, idx) => ({
        id: m.id,
        nickname: m.nickname,
        subject: m.subject || "자습",
        color: getMutedSubjectColor(m.subject || "", undefined, idx + 1),
        coneFamily: resolveStudyConeFamily(m.emoji, m.id),
        todaySeconds: m.todaySeconds + (m.isStudying ? timer.elapsedSeconds : 0),
        weeklySeconds: m.weeklySeconds,
        isStudying: m.isStudying,
        isMe: false,
      }));

    const combined = [meRaw, ...othersRaw];
    const sorted = [...combined].sort((a, b) => {
      if (b.todaySeconds !== a.todaySeconds) return b.todaySeconds - a.todaySeconds;
      if (a.isStudying !== b.isStudying) return a.isStudying ? -1 : 1;
      return a.isMe ? -1 : 1;
    });

    return sorted.map((item, idx) => ({
      ...item,
      rank: idx + 1,
    }));
  }, [activeRoom, effectiveMyProfile, liveMyTodaySeconds, timer]);

  const rankedByPeriod = useMemo(() => {
    return [...seats].sort((a, b) => {
      const aVal =
        rankPeriod === "day"
          ? a.todaySeconds
          : a.weeklySeconds.reduce((s, v) => s + v, 0);
      const bVal =
        rankPeriod === "day"
          ? b.todaySeconds
          : b.weeklySeconds.reduce((s, v) => s + v, 0);
      return bVal - aVal;
    });
  }, [seats, rankPeriod]);

  const maxPeriodSeconds = useMemo(() => {
    const first = rankedByPeriod[0];
    if (!first) return 1;
    return Math.max(
      1,
      rankPeriod === "day"
        ? first.todaySeconds
        : first.weeklySeconds.reduce((s, v) => s + v, 0)
    );
  }, [rankedByPeriod, rankPeriod]);

  const myRank = useMemo(() => seats.find((s) => s.isMe)?.rank || 1, [seats]);
  const studyingCount = useMemo(() => seats.filter((s) => s.isStudying).length, [seats]);

  // 슬라이드 전환 (+1은 마지막 '스터디 그룹 추가' 슬라이드)
  const totalSlidesCount = roomList.length + 1;
  const goToSlide = (nextIdx: number) => {
    if (totalSlidesCount <= 1) return;
    const wrapped = (nextIdx + totalSlidesCount) % totalSlidesCount;
    if (wrapped >= roomList.length) {
      setIsAddSlideActive(true);
    } else {
      setIsAddSlideActive(false);
      const target = roomList[wrapped];
      if (target) setActiveRoomId(target.id);
    }
  };

  // 터치 + 마우스 드래그 통합 포인터 핸들러
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    const targetEl = e.target as HTMLElement | null;
    if (targetEl?.closest("button, input, textarea, select, a")) return;
    pointerStartRef.current = { x: e.clientX, y: e.clientY, pointerId: e.pointerId };
    setDragOffsetX(0);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const start = pointerStartRef.current;
    if (!start || start.pointerId !== e.pointerId) return;
    const dx = e.clientX - start.x;
    const dy = e.clientY - start.y;
    if (Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(dy) * 1.1) {
      setDragOffsetX(Math.max(-72, Math.min(72, dx * 0.45)));
    }
  };

  const finishPointerDrag = (clientX: number, clientY: number) => {
    const start = pointerStartRef.current;
    pointerStartRef.current = null;
    setDragOffsetX(0);
    if (!start) return;
    const dx = clientX - start.x;
    const dy = clientY - start.y;
    if (Math.abs(dx) > 44 && Math.abs(dx) > Math.abs(dy) * 1.15) {
      if (dx < 0) goToSlide(currentRoomIndex + 1);
      else goToSlide(currentRoomIndex - 1);
    }
  };

  const handleSendChat = () => {
    const clean = chatDraft.trim();
    if (!clean || !activeRoom) return;
    addGroupChat(activeRoom.id, {
      id: `chat-${Date.now()}`,
      sender: effectiveMyProfile.nickname,
      emoji: effectiveMyProfile.coneFamily,
      text: clean,
      timeLabel: new Date().toTimeString().slice(0, 5),
      isMe: true,
    });
    setChatDraft("");
  };

  const handleCopyInvite = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard && activeRoom) {
      void navigator.clipboard.writeText(
        `[Housing-Pro 열공방] '${activeRoom.title}'에서 함께 집중해요! https://pro.posmul.com`
      );
    }
    setCopiedInvite(true);
    window.setTimeout(() => setCopiedInvite(false), 2000);
  };

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

  const wizardTargetRoom = useMemo(
    () =>
      wizardState.targetRoomId
        ? rooms.find((r) => r.id === wizardState.targetRoomId)
        : activeRoom || undefined,
    [rooms, wizardState.targetRoomId, activeRoom]
  );

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
              진행 중 할 일:{" "}
              <strong className="font-medium text-[var(--hp-text)]">{linkedTodo.title}</strong>
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
            <section className="px-5 py-4 border-b border-[var(--hp-border)] flex items-center justify-between gap-3">
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
                <div className="mt-1.5 flex items-baseline gap-2.5">
                  <span className="text-[32px] leading-none font-light tracking-tight hp-tabular">
                    {formatClockHHMMSS(timer.elapsedSeconds)}
                  </span>
                  <span className="text-[11px] text-[var(--hp-text-3)] hp-tabular">
                    오늘 {formatShortClock(liveMyTodaySeconds)}
                  </span>
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

            {/* 방 헤더 + 좌/우 넘김 컨트롤 + 실시간 순위 요약 */}
            <div className="px-4 py-2.5 border-b border-[var(--hp-border)] bg-[var(--hp-surface)] space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  <button
                    type="button"
                    onClick={() => goToSlide(currentRoomIndex - 1)}
                    className="w-7 h-7 rounded-lg border border-[var(--hp-border)] hover:border-[var(--hp-border-strong)] text-[var(--hp-text-2)] hover:text-[var(--hp-text)] flex items-center justify-center shrink-0 transition"
                    aria-label="이전 스터디방"
                    title="이전 방 (좌로 넘기기)"
                  >
                    <ChevronLeft className="w-4 h-4 stroke-[1.75]" />
                  </button>

                  <div className="min-w-0 px-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold truncate">
                        {isAddSlideActive || !activeRoom
                          ? "새 스터디 그룹 추가"
                          : activeRoom.title}
                      </span>
                      {activeRoom?.studyType === "cam" && (
                        <span className="px-1.5 py-0.5 rounded bg-[var(--hp-surface-2)] border border-[var(--hp-border)] text-[9.5px] text-[var(--hp-text-2)] shrink-0">
                          캠
                        </span>
                      )}
                    </div>
                    {!isAddSlideActive && activeRoom ? (
                      <div className="text-[10.5px] text-[var(--hp-text-2)] hp-tabular flex items-center gap-1.5 mt-0.5">
                        <span>
                          집중 {studyingCount}/{seats.length}
                        </span>
                        <span className="text-[var(--hp-text-3)]">·</span>
                        <span className="font-semibold text-[var(--hp-text)]">
                          내 순위 {myRank}위
                        </span>
                        <span className="text-[var(--hp-text-3)]">·</span>
                        <span>
                          {currentRoomIndex + 1}/{roomList.length}
                        </span>
                      </div>
                    ) : (
                      <div className="text-[10.5px] text-[var(--hp-text-3)] mt-0.5">
                        여러 방을 개설하거나 추가 참여해 보세요
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => goToSlide(currentRoomIndex + 1)}
                    className="w-7 h-7 rounded-lg border border-[var(--hp-border)] hover:border-[var(--hp-border-strong)] text-[var(--hp-text-2)] hover:text-[var(--hp-text)] flex items-center justify-center transition"
                    aria-label="다음 스터디방"
                    title="다음 방 (우로 넘기기)"
                  >
                    <ChevronRight className="w-4 h-4 stroke-[1.75]" />
                  </button>
                  {activeRoom && !isAddSlideActive && (
                    <button
                      type="button"
                      onClick={() => setShowGroupInfoModal(true)}
                      className="w-7 h-7 rounded-lg border border-[var(--hp-border)] hover:border-[var(--hp-border-strong)] text-[var(--hp-text-2)] hover:text-[var(--hp-text)] flex items-center justify-center transition"
                      aria-label="그룹 정보 설정"
                      title="그룹 정보 · 설정"
                    >
                      <MoreHorizontal className="w-4 h-4 stroke-[1.75]" />
                    </button>
                  )}
                </div>
              </div>

              {/* 오버레이 내부 컴팩트 4서브뷰 탭 */}
              {!isAddSlideActive && activeRoom && (
                <div className="grid grid-cols-4 gap-1 p-0.5 rounded-lg bg-[var(--hp-bg)] border border-[var(--hp-border)] text-[11px]">
                  {(
                    [
                      { id: "seats", label: "좌석", icon: Users },
                      { id: "rank", label: "순위", icon: Trophy },
                      { id: "attendance", label: "출석부", icon: CalendarDays },
                      { id: "chat", label: "대화", icon: MessageSquare },
                    ] as const
                  ).map((item) => {
                    const Icon = item.icon;
                    const active = subTab === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setSubTab(item.id)}
                        className={`py-1 rounded-md flex items-center justify-center gap-1 transition ${
                          active
                            ? "bg-[var(--hp-surface-2)] text-[var(--hp-text)] font-medium"
                            : "text-[var(--hp-text-3)] hover:text-[var(--hp-text-2)]"
                        }`}
                      >
                        <Icon className="w-3 h-3 stroke-[1.6]" />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 스와이프/마우스 드래그 지원 본문 영역 */}
            <div
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={(e) => finishPointerDrag(e.clientX, e.clientY)}
              onPointerCancel={() => {
                pointerStartRef.current = null;
                setDragOffsetX(0);
              }}
              className="flex-1 overflow-y-auto px-4 py-3.5 select-none cursor-grab active:cursor-grabbing touch-pan-y"
            >
              <div
                style={{
                  transform: dragOffsetX !== 0 ? `translateX(${dragOffsetX}px)` : undefined,
                  transition: dragOffsetX === 0 ? "transform 180ms ease-out" : "none",
                }}
              >
                {isAddSlideActive || !activeRoom ? (
                  /* 마지막 슬라이드: 새 그룹 개설 / 다른 방 빠른 참여 */
                  <div className="space-y-4 py-4">
                    <div className="p-5 rounded-2xl bg-[var(--hp-surface)] border border-[var(--hp-border)] text-center space-y-3">
                      <div className="text-sm font-semibold">스터디 그룹을 추가하세요</div>
                      <p className="text-xs text-[var(--hp-text-2)] leading-relaxed">
                        여러 스터디방에 참여하거나 직접 개설한 뒤
                        <br />
                        타이머 화면에서 좌우로 넘기며 함께 집중할 수 있습니다.
                      </p>
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() =>
                            setWizardState({ open: true, mode: "create", studyType: "general" })
                          }
                          className="h-10 rounded-xl bg-[var(--hp-accent)] text-[var(--hp-accent-fg)] text-xs font-semibold flex items-center justify-center gap-1.5"
                        >
                          <Plus className="w-3.5 h-3.5 stroke-[2]" />
                          <span>일반 스터디 개설</span>
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setWizardState({ open: true, mode: "create", studyType: "cam" })
                          }
                          className="h-10 rounded-xl border border-[var(--hp-border-strong)] bg-[var(--hp-surface-2)] text-xs font-semibold flex items-center justify-center gap-1.5"
                        >
                          <Camera className="w-3.5 h-3.5 stroke-[1.75]" />
                          <span>캠 스터디 개설</span>
                        </button>
                      </div>
                    </div>

                    {/* 미가입 추천 방 빠른 참여 */}
                    {rooms.filter((r) => !roomList.some((jr) => jr.id === r.id)).length > 0 && (
                      <div className="space-y-2">
                        <div className="text-[11px] font-medium text-[var(--hp-text-3)] px-1">
                          바로 참여 가능한 공개 스터디방
                        </div>
                        <div className="space-y-2">
                          {rooms
                            .filter((r) => !roomList.some((jr) => jr.id === r.id))
                            .slice(0, 4)
                            .map((room) => (
                              <div
                                key={room.id}
                                className="p-3 rounded-xl bg-[var(--hp-surface)] border border-[var(--hp-border)] flex items-center justify-between gap-2"
                              >
                                <div className="min-w-0">
                                  <div className="text-xs font-medium truncate">{room.title}</div>
                                  <div className="text-[10.5px] text-[var(--hp-text-3)] hp-tabular mt-0.5">
                                    목표 {room.goalHours}h · 인원 {room.memberCount}/{room.capacity} ·
                                    출석 {room.attendancePct}%
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setWizardState({
                                      open: true,
                                      mode: "join",
                                      studyType: room.studyType,
                                      targetRoomId: room.id,
                                    })
                                  }
                                  className="px-3 py-1.5 rounded-lg bg-[var(--hp-accent)] text-[var(--hp-accent-fg)] text-[11px] font-medium shrink-0"
                                >
                                  참여
                                </button>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : subTab === "seats" ? (
                  /* 1. 실시간 좌석 그리드 (순위 배지 + 1시간 진화 SVG 스터디콘) */
                  <div className="grid grid-cols-3 gap-2">
                    {seats.map((seat) => {
                      const stageMeta = getStudyConeStageMeta(seat.todaySeconds);
                      return (
                        <div
                          key={seat.id}
                          onClick={() => {
                            if (seat.isMe && activeRoom) {
                              setWizardState({
                                open: true,
                                mode: "profile",
                                studyType: activeRoom.studyType,
                                targetRoomId: activeRoom.id,
                              });
                            }
                          }}
                          className={`relative p-2.5 rounded-xl border flex flex-col items-center text-center transition ${
                            seat.isMe
                              ? "bg-[var(--hp-surface-2)] border-[var(--hp-border-strong)] cursor-pointer"
                              : "bg-[var(--hp-surface)] border-[var(--hp-border)]"
                          } ${seat.isStudying ? "" : "opacity-60"}`}
                          title={seat.isMe ? "탭하여 이 방의 닉네임·스터디콘 변경" : undefined}
                        >
                          {/* 좌상단 실시간 순위 배지 */}
                          <span
                            className={`absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-md border text-[9.5px] font-semibold hp-tabular leading-none ${getRankBadgeClass(
                              seat.rank
                            )}`}
                          >
                            {seat.rank}위
                          </span>

                          {/* 우상단 1시간 진화 단계 표시 */}
                          <span className="absolute top-1.5 right-1.5 text-[9px] hp-tabular text-[var(--hp-text-3)]">
                            {stageMeta.hourLabel}
                          </span>

                          {/* 1시간 진화 순수 SVG 스터디콘 */}
                          <div className="mt-3 relative">
                            <StudyConeAvatar
                              family={seat.coneFamily}
                              seconds={seat.todaySeconds}
                              isStudying={seat.isStudying}
                              size={46}
                            />
                            <span
                              className="absolute right-0 bottom-0 w-2.5 h-2.5 rounded-full border-2 border-[var(--hp-surface)]"
                              style={{
                                backgroundColor: seat.isStudying
                                  ? seat.color
                                  : "var(--hp-text-3)",
                              }}
                            />
                          </div>

                          <div className="mt-1.5 text-xs font-medium text-[var(--hp-text)] truncate w-full">
                            {seat.isMe ? `${seat.nickname} (나)` : seat.nickname}
                          </div>
                          <div className="text-[10px] text-[var(--hp-text-3)] truncate w-full mt-0.5">
                            {seat.isStudying ? seat.subject : "휴식"}
                          </div>
                          <div className="mt-1 text-[11px] font-medium hp-tabular text-[var(--hp-text-2)]">
                            {formatShortClock(seat.todaySeconds)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : subTab === "rank" ? (
                  /* 2. 실시간 그룹 순위 뷰 */
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[var(--hp-text-2)]">
                        내 순위{" "}
                        <strong className="text-[var(--hp-text)] hp-tabular">{myRank}위</strong> ·
                        매일 05:00 리셋
                      </span>
                      <div className="flex items-center gap-1">
                        {(["day", "week"] as const).map((p) => (
                          <button
                            key={p}
                            type="button"
                            onClick={() => setRankPeriod(p)}
                            className={`px-2 py-1 rounded-md border text-[11px] ${
                              rankPeriod === p
                                ? "bg-[var(--hp-accent)] text-[var(--hp-accent-fg)] border-transparent font-medium"
                                : "border-[var(--hp-border)] text-[var(--hp-text-2)]"
                            }`}
                          >
                            {p === "day" ? "일간" : "주간"}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      {rankedByPeriod.map((seat, idx) => {
                        const sec =
                          rankPeriod === "day"
                            ? seat.todaySeconds
                            : seat.weeklySeconds.reduce((s, v) => s + v, 0);
                        const pct = Math.max(4, Math.round((sec / maxPeriodSeconds) * 100));
                        const stageMeta = getStudyConeStageMeta(seat.todaySeconds);
                        return (
                          <div
                            key={seat.id}
                            className={`p-2.5 rounded-xl border flex items-center gap-2.5 ${
                              seat.isMe
                                ? "bg-[var(--hp-surface-2)] border-[var(--hp-border-strong)]"
                                : "bg-[var(--hp-surface)] border-[var(--hp-border)]"
                            }`}
                          >
                            <span
                              className={`w-6 h-6 rounded-lg border text-[11px] font-semibold hp-tabular flex items-center justify-center shrink-0 ${getRankBadgeClass(
                                idx + 1
                              )}`}
                            >
                              {idx + 1}
                            </span>
                            <StudyConeAvatar
                              family={seat.coneFamily}
                              seconds={seat.todaySeconds}
                              isStudying={seat.isStudying}
                              size={32}
                              showProgressRing={false}
                            />
                            <div className="flex-1 min-w-0 space-y-1">
                              <div className="flex items-center justify-between gap-2 text-xs">
                                <span className="font-medium truncate">
                                  {seat.isMe ? `${seat.nickname} (나)` : seat.nickname}
                                  <span className="ml-1.5 text-[10px] text-[var(--hp-text-3)]">
                                    {stageMeta.hourLabel}
                                  </span>
                                </span>
                                <span className="hp-tabular text-[var(--hp-text-2)] shrink-0">
                                  {formatShortClock(sec)}
                                </span>
                              </div>
                              <div className="h-1.5 rounded-full bg-[var(--hp-bg)] overflow-hidden">
                                <div
                                  className="h-full rounded-full transition-all"
                                  style={{
                                    width: `${pct}%`,
                                    backgroundColor: seat.color,
                                  }}
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : subTab === "attendance" ? (
                  /* 3. 주간 출석부 뷰 */
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-[11px] text-[var(--hp-text-2)]">
                      <span>
                        목표 <strong className="text-[var(--hp-text)]">{activeRoom.goalHours}h</strong>{" "}
                        · 출석률{" "}
                        <strong className="text-[var(--hp-text)]">
                          {activeRoom.attendancePct}%
                        </strong>
                      </span>
                      <span className="text-[var(--hp-text-3)]">매일 05:00 KST 리셋</span>
                    </div>

                    <div className="space-y-2.5">
                      {seats.slice(0, 7).map((seat) => {
                        const weekTotal = seat.weeklySeconds.reduce((s, v) => s + v, 0);
                        const attendedDays = seat.weeklySeconds.filter((s) => s > 0).length;
                        return (
                          <div
                            key={seat.id}
                            className="p-2.5 rounded-xl bg-[var(--hp-surface)] border border-[var(--hp-border)] space-y-1.5"
                          >
                            <div className="flex items-center justify-between text-xs gap-2">
                              <span className="font-medium truncate">
                                {seat.rank}위 · {seat.isMe ? `${seat.nickname} (나)` : seat.nickname}
                              </span>
                              <span className="text-[11px] hp-tabular text-[var(--hp-text-2)] shrink-0">
                                {formatShortClock(weekTotal)} · {attendedDays}일
                              </span>
                            </div>
                            <div className="grid grid-cols-7 gap-1">
                              {WEEKDAYS.map((day, idx) => {
                                const sec = seat.weeklySeconds[idx] || 0;
                                const hrs = sec / 3600;
                                const tone =
                                  sec === 0
                                    ? "bg-[var(--hp-bg)] text-[var(--hp-text-3)] border-[var(--hp-border)]"
                                    : hrs >= activeRoom.goalHours
                                      ? "bg-[var(--hp-accent)] text-[var(--hp-accent-fg)] border-transparent font-medium"
                                      : "bg-[var(--hp-surface-2)] text-[var(--hp-text)] border-[var(--hp-border-strong)]";
                                return (
                                  <div
                                    key={day}
                                    className={`py-1.5 rounded-md border text-center text-[10px] hp-tabular ${tone}`}
                                  >
                                    {sec > 0 ? formatHMM(sec) : day}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  /* 4. 그룹 대화 뷰 */
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[var(--hp-text-2)] truncate">{activeRoom.notice}</span>
                      <button
                        type="button"
                        onClick={handleCopyInvite}
                        className="px-2 py-1 rounded-md border border-[var(--hp-border)] text-[11px] text-[var(--hp-text-2)] hover:text-[var(--hp-text)] flex items-center gap-1 shrink-0"
                      >
                        {copiedInvite ? (
                          <Check className="w-3 h-3" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                        <span>{copiedInvite ? "복사됨" : "초대"}</span>
                      </button>
                    </div>

                    <div className="space-y-2 max-h-[38dvh] overflow-y-auto">
                      {activeRoom.chats.length === 0 ? (
                        <div className="py-8 text-center text-xs text-[var(--hp-text-3)]">
                          첫 응원 메시지를 남겨보세요.
                        </div>
                      ) : (
                        activeRoom.chats.map((c) => (
                          <div
                            key={c.id}
                            className={`p-2.5 rounded-xl border text-xs ${
                              c.isMe
                                ? "bg-[var(--hp-surface-2)] border-[var(--hp-border-strong)] ml-6"
                                : "bg-[var(--hp-surface)] border-[var(--hp-border)] mr-6"
                            }`}
                          >
                            <div className="flex items-center justify-between text-[10.5px] text-[var(--hp-text-3)]">
                              <span className="font-medium text-[var(--hp-text)]">{c.sender}</span>
                              <span className="hp-tabular">{c.timeLabel}</span>
                            </div>
                            <p className="mt-1 text-[var(--hp-text-2)] leading-relaxed break-words">
                              {c.text}
                            </p>
                          </div>
                        ))
                      )}
                    </div>

                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleSendChat();
                      }}
                      className="flex items-center gap-2"
                    >
                      <input
                        type="text"
                        value={chatDraft}
                        onChange={(e) => setChatDraft(e.target.value)}
                        placeholder="한 줄 응원 메시지 입력..."
                        className="flex-1 h-9 px-3 rounded-lg bg-[var(--hp-surface)] border border-[var(--hp-border)] text-xs text-[var(--hp-text)] placeholder:text-[var(--hp-text-3)] outline-none"
                      />
                      <button
                        type="submit"
                        disabled={!chatDraft.trim()}
                        className="h-9 px-3 rounded-lg bg-[var(--hp-accent)] text-[var(--hp-accent-fg)] disabled:opacity-40 flex items-center justify-center"
                        aria-label="전송"
                      >
                        <Send className="w-3.5 h-3.5 stroke-[1.75]" />
                      </button>
                    </form>
                  </div>
                )}
              </div>
            </div>

            {/* 하단 스와이프 페이지 도트 인디케이터 */}
            <footer className="pb-safe px-4 py-2.5 border-t border-[var(--hp-border)] bg-[var(--hp-bg)] flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                {roomList.map((r, idx) => {
                  const active = !isAddSlideActive && idx === currentRoomIndex;
                  return (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => goToSlide(idx)}
                      className={`h-1.5 rounded-full transition-all ${
                        active
                          ? "w-5 bg-[var(--hp-accent)]"
                          : "w-1.5 bg-[var(--hp-border-strong)] hover:bg-[var(--hp-text-3)]"
                      }`}
                      title={r.title}
                      aria-label={`${r.title} 방으로 이동`}
                    />
                  );
                })}
                <button
                  type="button"
                  onClick={() => goToSlide(roomList.length)}
                  className={`h-1.5 rounded-full transition-all ${
                    isAddSlideActive
                      ? "w-5 bg-[var(--hp-accent)]"
                      : "w-1.5 bg-[var(--hp-border-strong)] hover:bg-[var(--hp-text-3)]"
                  }`}
                  title="스터디 그룹 추가"
                  aria-label="스터디 그룹 추가 슬라이드"
                />
              </div>

              <span className="text-[10.5px] text-[var(--hp-text-3)]">
                좌우 드래그·스와이프로 방 전환
              </span>
            </footer>
          </div>
        ) : (
          /* 개인 집중 모드 (대형 미니멀 시계 + 내 진화 스터디콘) */
          <div className="flex-1 flex flex-col items-center justify-between px-6 py-10">
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

            <div className="flex flex-col items-center gap-4">
              <StudyConeAvatar
                family={effectiveMyProfile.coneFamily}
                seconds={liveMyTodaySeconds}
                isStudying={!timer.paused}
                size={76}
              />
              <div className="text-center space-y-2">
                <div className="text-[58px] leading-none font-extralight tracking-tight hp-tabular">
                  {formatClockHHMMSS(timer.elapsedSeconds)}
                </div>
                <div className="text-xs text-[var(--hp-text-2)] hp-tabular">
                  오늘 누적 {formatClockHHMMSS(liveMyTodaySeconds)} · {myConeStage.hourLabel}{" "}
                  {myConeStage.title}
                </div>
                {myConeStage.remainingMinutes > 0 && (
                  <div className="text-[11px] text-[var(--hp-text-3)] hp-tabular">
                    다음 스터디콘 진화까지 {myConeStage.remainingMinutes}분
                  </div>
                )}
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

      {/* 그룹 정보 / 설정 모달 */}
      {showGroupInfoModal && activeRoom && (
        <div
          className="fixed inset-0 z-[84] bg-[var(--hp-overlay)] backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={() => setShowGroupInfoModal(false)}
        >
          <div
            className="w-full max-w-[420px] rounded-t-3xl sm:rounded-2xl bg-[var(--hp-bg)] border border-[var(--hp-border-strong)] p-5 pb-safe space-y-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2.5 border-b border-[var(--hp-border)]">
              <span className="text-xs font-semibold flex items-center gap-1.5">
                <Settings className="w-4 h-4 stroke-[1.6] text-[var(--hp-text-2)]" />
                <span>그룹 정보 · 설정</span>
              </span>
              <button
                type="button"
                onClick={() => setShowGroupInfoModal(false)}
                className="p-1 text-[var(--hp-text-3)] hover:text-[var(--hp-text)]"
                aria-label="닫기"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                setShowGroupInfoModal(false);
                setWizardState({
                  open: true,
                  mode: "profile",
                  studyType: activeRoom.studyType,
                  targetRoomId: activeRoom.id,
                });
              }}
              className="w-full p-3 rounded-xl bg-[var(--hp-surface)] border border-[var(--hp-border)] hover:border-[var(--hp-border-strong)] flex items-center justify-between transition text-xs"
            >
              <div className="flex items-center gap-2.5">
                <StudyConeAvatar
                  family={effectiveMyProfile.coneFamily}
                  seconds={liveMyTodaySeconds}
                  isStudying
                  size={34}
                  showProgressRing={false}
                />
                <div className="text-left">
                  <div className="font-medium">이 방 프로필 · 스터디콘</div>
                  <div className="text-[11px] text-[var(--hp-text-2)]">
                    {effectiveMyProfile.nickname} · {myConeStage.hourLabel} {myConeStage.title}
                  </div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-[var(--hp-text-3)]" />
            </button>

            <div className="p-3.5 rounded-xl bg-[var(--hp-surface)] border border-[var(--hp-border)] space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-[var(--hp-text-2)]">그룹명</span>
                <span className="font-medium">{activeRoom.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--hp-text-2)]">그룹장</span>
                <span>{activeRoom.leaderName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--hp-text-2)]">가입방식</span>
                <span>{activeRoom.joinMethod === "approval" ? "승인 후 가입" : "바로가입"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--hp-text-2)]">일일 목표</span>
                <span className="hp-tabular">{activeRoom.goalHours}시간</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--hp-text-2)]">인원 · 출석률</span>
                <span className="hp-tabular">
                  {activeRoom.memberCount}/{activeRoom.capacity} · {activeRoom.attendancePct}%
                </span>
              </div>
              {activeRoom.nicknameRule && (
                <div className="flex justify-between gap-3">
                  <span className="text-[var(--hp-text-2)] shrink-0">닉네임 규칙</span>
                  <span className="text-right truncate">{activeRoom.nicknameRule}</span>
                </div>
              )}
            </div>

            <div className="p-3 rounded-xl bg-[var(--hp-surface)] border border-[var(--hp-border)] flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 text-[var(--hp-text-2)]">
                <Bell className="w-3.5 h-3.5" />
                <span>그룹 목표 달성 챌린지 (+15 PMP)</span>
              </span>
              <span className="text-[11px] font-medium text-[var(--hp-success)]">참여중</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyInvite}
                className="flex-1 h-10 rounded-xl border border-[var(--hp-border-strong)] bg-[var(--hp-surface)] text-xs font-medium flex items-center justify-center gap-1.5"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>{copiedInvite ? "초대 링크 복사됨" : "초대 링크 복사"}</span>
              </button>
              {joinedRooms.length > 1 && (
                <button
                  type="button"
                  onClick={() => {
                    setShowGroupInfoModal(false);
                    setConfirmLeaveRoom({ id: activeRoom.id, title: activeRoom.title });
                  }}
                  className="px-4 h-10 rounded-xl border border-[var(--hp-danger)]/40 text-[var(--hp-danger)] text-xs font-medium"
                >
                  그룹 탈퇴
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 그룹 탈퇴 확인 모달 */}
      {confirmLeaveRoom && (
        <div
          className="fixed inset-0 z-[90] bg-[var(--hp-overlay)] backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setConfirmLeaveRoom(null)}
          role="alertdialog"
          aria-modal="true"
        >
          <div
            className="w-full max-w-[340px] rounded-2xl bg-[var(--hp-bg)] border border-[var(--hp-border-strong)] p-5 space-y-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-1.5">
              <h3 className="text-sm font-semibold">스터디 그룹 탈퇴</h3>
              <p className="text-xs leading-relaxed text-[var(--hp-text-2)]">
                &apos;{confirmLeaveRoom.title}&apos; 그룹에서 정말 탈퇴하시겠습니까? 언제든 다시
                참여할 수 있습니다.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setConfirmLeaveRoom(null)}
                className="h-9 rounded-lg border border-[var(--hp-border-strong)] text-xs font-medium"
              >
                취소
              </button>
              <button
                type="button"
                onClick={() => {
                  leaveRoom(confirmLeaveRoom.id);
                  setConfirmLeaveRoom(null);
                  setIsAddSlideActive(false);
                }}
                className="h-9 rounded-lg bg-[var(--hp-danger)] text-white text-xs font-medium"
              >
                탈퇴하기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4단계 스터디 그룹 개설 / 참여 / 프로필 위저드 */}
      <StudyGroupCreateWizard
        isOpen={wizardState.open}
        mode={wizardState.mode}
        initialStudyType={wizardState.studyType}
        targetRoomTitle={wizardTargetRoom?.title}
        targetRoomNicknameRule={wizardTargetRoom?.nicknameRule}
        targetRoomPassword={wizardTargetRoom?.password}
        defaultNickname={effectiveMyProfile.nickname}
        defaultConeEmoji={effectiveMyProfile.rawCone}
        myTodaySeconds={liveMyTodaySeconds}
        onClose={() => setWizardState((prev) => ({ ...prev, open: false }))}
        onCreateComplete={(input) => {
          createAndJoinRoom(input);
          setIsAddSlideActive(false);
          setSubTab("seats");
        }}
        onProfileComplete={(prof) => {
          const targetId = wizardState.targetRoomId || activeRoom?.id;
          if (!targetId) return;
          if (wizardState.mode === "join") {
            joinRoomWithProfile(targetId, prof);
          } else {
            updateRoomProfile(targetId, prof);
          }
          setIsAddSlideActive(false);
          setSubTab("seats");
        }}
      />
    </div>
  );
}
