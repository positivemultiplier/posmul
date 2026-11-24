"use client";

import { useMemo, useRef, useState } from "react";
import {
  Bell,
  CalendarDays,
  Camera,
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  Lock,
  LogOut,
  MessageSquare,
  MoreHorizontal,
  Plus,
  Search,
  Send,
  Settings,
  Trophy,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { useStudyGroupsStore } from "@/lib/study-groups-store";
import { formatShortClock, getMutedSubjectColor } from "@/lib/study-theme";
import {
  StudyConeAvatar,
  getStudyConeStageMeta,
  resolveStudyConeFamily,
  type StudyConeFamily,
} from "@/components/study/group/StudyConeAvatar";
import { StudyGroupCreateWizard } from "@/components/mobile/study-group-create-wizard";

interface StudyGroupManagerProps {
  myStudySeconds: number;
  myNickname: string;
  currentSubjectLabel: string;
}

type GroupView = "room" | "attendance" | "rank" | "browse" | "chat";
type BrowseSortMode = "newest" | "attendance" | "studyTime" | "cam" | "mission";

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

export function StudyGroupManager({
  myStudySeconds,
  myNickname,
  currentSubjectLabel,
}: StudyGroupManagerProps) {
  const {
    rooms,
    joinedRoomIds,
    joinedRooms,
    activeRoomId,
    profilesByRoomId,
    setActiveRoomId,
    createAndJoinRoom,
    joinRoomWithProfile,
    updateRoomProfile,
    leaveRoom,
    addGroupChat,
  } = useStudyGroupsStore();

  const [view, setView] = useState<GroupView>("room");
  const [isAddSlideActive, setIsAddSlideActive] = useState(false);
  const [attendanceWeekOffset, setAttendanceWeekOffset] = useState(0);
  const [rankPeriod, setRankPeriod] = useState<"day" | "week">("day");
  const [chatDraft, setChatDraft] = useState("");
  const [copiedInvite, setCopiedInvite] = useState(false);

  // 방찾기 정렬 · 검색 · 필터
  const [browseSort, setBrowseSort] = useState<BrowseSortMode>("newest");
  const [browseFilter, setBrowseFilter] = useState({
    onlyCert: false,
    onlyCam: false,
    onlyVacant: false,
    onlyPublic: false,
    query: "",
  });

  // 그룹 정보 모달 · 탈퇴 확인 모달 · 4단계 위저드
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

  // 좌우 터치 스와이프 + 마우스 드래그 추적
  const pointerStartRef = useRef<{ x: number; y: number; pointerId: number } | null>(null);
  const [dragOffsetX, setDragOffsetX] = useState(0);

  const currentJoinedIndex = useMemo(() => {
    if (isAddSlideActive) return joinedRooms.length;
    const idx = joinedRooms.findIndex((r) => r.id === activeRoomId);
    return idx >= 0 ? idx : 0;
  }, [isAddSlideActive, joinedRooms, activeRoomId]);

  const activeRoom = useMemo(() => {
    if (isAddSlideActive) return null;
    return joinedRooms[currentJoinedIndex] || joinedRooms[0] || rooms[0] || null;
  }, [isAddSlideActive, joinedRooms, currentJoinedIndex, rooms]);

  const effectiveMyProfile = useMemo(() => {
    const saved = activeRoom ? profilesByRoomId[activeRoom.id] : undefined;
    return {
      nickname: saved?.nickname || myNickname,
      coneFamily: resolveStudyConeFamily(saved?.coneEmoji, "me"),
      rawCone: saved?.coneEmoji || "CLASSIC_FLAME",
    };
  }, [activeRoom, profilesByRoomId, myNickname]);

  const myConeStage = useMemo(
    () => getStudyConeStageMeta(myStudySeconds),
    [myStudySeconds]
  );

  // 순공시간 기준 실시간 순위가 포함된 좌석 목록
  const seats = useMemo<NormalizedSeat[]>(() => {
    if (!activeRoom) return [];
    const meRaw = {
      id: "me",
      nickname: effectiveMyProfile.nickname,
      subject: currentSubjectLabel,
      color: getMutedSubjectColor(currentSubjectLabel),
      coneFamily: effectiveMyProfile.coneFamily,
      todaySeconds: myStudySeconds,
      weeklySeconds: [
        Math.max(3600, myStudySeconds),
        Math.max(5400, myStudySeconds),
        myStudySeconds,
        0,
        0,
        0,
        0,
      ],
      isStudying: myStudySeconds > 0,
      isMe: true,
    };

    const othersRaw = activeRoom.members
      .filter((m) => !m.isMe)
      .slice(0, 11)
      .map((m, idx) => ({
        id: m.id,
        nickname: m.nickname,
        subject: m.subject || "자습",
        color: getMutedSubjectColor(m.subject || "", undefined, idx + 1),
        coneFamily: resolveStudyConeFamily(m.emoji, m.id),
        todaySeconds: m.todaySeconds,
        weeklySeconds: m.weeklySeconds,
        isStudying: m.isStudying,
        isMe: false,
      }));

    const sorted = [meRaw, ...othersRaw].sort((a, b) => {
      if (b.todaySeconds !== a.todaySeconds) return b.todaySeconds - a.todaySeconds;
      if (a.isStudying !== b.isStudying) return a.isStudying ? -1 : 1;
      return a.isMe ? -1 : 1;
    });

    return sorted.map((s, idx) => ({ ...s, rank: idx + 1 }));
  }, [activeRoom, effectiveMyProfile, currentSubjectLabel, myStudySeconds]);

  const rankedSeats = useMemo(() => {
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

  const myRank = useMemo(() => seats.find((s) => s.isMe)?.rank || 1, [seats]);
  const studyingCount = useMemo(() => seats.filter((s) => s.isStudying).length, [seats]);

  const { totalRoomSeconds, avgRoomSeconds, maxRankSec } = useMemo(() => {
    const totals = rankedSeats.map((s) =>
      rankPeriod === "day"
        ? s.todaySeconds
        : s.weeklySeconds.reduce((sum, v) => sum + v, 0)
    );
    const total = totals.reduce((a, b) => a + b, 0);
    return {
      totalRoomSeconds: total,
      avgRoomSeconds: totals.length > 0 ? Math.round(total / totals.length) : 0,
      maxRankSec: Math.max(1, totals[0] || 1),
    };
  }, [rankedSeats, rankPeriod]);

  // 방찾기 필터 + 정렬
  const browseRooms = useMemo(() => {
    const query = browseFilter.query.trim().toLowerCase();
    const filtered = rooms.filter((r) => {
      if (browseFilter.onlyCert && !r.category.includes("자격증") && !r.category.includes("주택")) {
        return false;
      }
      if (browseFilter.onlyCam && r.studyType !== "cam") return false;
      if (browseFilter.onlyVacant && r.memberCount >= r.capacity) return false;
      if (browseFilter.onlyPublic && !r.isPublic) return false;
      if (browseSort === "cam" && r.studyType !== "cam") return false;
      if (browseSort === "mission" && !r.hasMission) return false;
      if (query && !r.title.toLowerCase().includes(query) && !r.notice.toLowerCase().includes(query)) {
        return false;
      }
      return true;
    });

    return [...filtered].sort((a, b) => {
      if (browseSort === "attendance") return b.attendancePct - a.attendancePct;
      if (browseSort === "studyTime") {
        const aSec = a.members.reduce((s, m) => s + m.todaySeconds, 0);
        const bSec = b.members.reduce((s, m) => s + m.todaySeconds, 0);
        return bSec - aSec;
      }
      return b.createdAtMs - a.createdAtMs;
    });
  }, [rooms, browseFilter, browseSort]);

  const totalSlidesCount = joinedRooms.length + 1;
  const goToSlide = (nextIdx: number) => {
    if (totalSlidesCount <= 1) return;
    const wrapped = (nextIdx + totalSlidesCount) % totalSlidesCount;
    if (wrapped >= joinedRooms.length) {
      setIsAddSlideActive(true);
    } else {
      setIsAddSlideActive(false);
      const target = joinedRooms[wrapped];
      if (target) setActiveRoomId(target.id);
    }
  };

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
      if (dx < 0) goToSlide(currentJoinedIndex + 1);
      else goToSlide(currentJoinedIndex - 1);
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
        `[Housing-Pro 열공방] '${activeRoom.title}'에서 같이 공부해요! https://pro.posmul.com`
      );
    }
    setCopiedInvite(true);
    window.setTimeout(() => setCopiedInvite(false), 2000);
  };

  const wizardTargetRoom = useMemo(
    () =>
      wizardState.targetRoomId
        ? rooms.find((r) => r.id === wizardState.targetRoomId)
        : activeRoom || undefined,
    [rooms, wizardState.targetRoomId, activeRoom]
  );

  return (
    <div className="space-y-4">
      {/* 가입된 스터디방 전환 바 + 4단계 개설 위저드 버튼 */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {joinedRooms.map((room) => {
            const selected = !isAddSlideActive && room.id === activeRoom?.id;
            return (
              <button
                key={room.id}
                type="button"
                onClick={() => {
                  setIsAddSlideActive(false);
                  setActiveRoomId(room.id);
                  if (view === "browse") setView("room");
                }}
                className={`px-3 py-1.5 rounded-lg text-xs whitespace-nowrap border transition ${
                  selected
                    ? "bg-[var(--hp-accent)] text-[var(--hp-accent-fg)] border-transparent font-medium"
                    : "bg-[var(--hp-surface)] border-[var(--hp-border)] text-[var(--hp-text-2)]"
                }`}
              >
                {room.title}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() =>
            setWizardState({ open: true, mode: "create", studyType: "general" })
          }
          className="h-8 px-2.5 rounded-lg border border-[var(--hp-border-strong)] text-xs text-[var(--hp-text)] flex items-center gap-1 shrink-0 hover:bg-[var(--hp-surface)] transition"
        >
          <Plus className="w-3.5 h-3.5 stroke-[1.75]" />
          <span>개설</span>
        </button>
      </div>

      {/* 5대 서브 탭: 좌석 | 출석부 | 순위 | 방찾기 | 대화 */}
      <div className="grid grid-cols-5 gap-1 p-0.5 rounded-xl bg-[var(--hp-surface)] border border-[var(--hp-border)] text-[11px]">
        {(
          [
            { id: "room", label: `좌석(${joinedRooms.length})`, icon: Users },
            { id: "attendance", label: "출석부", icon: CalendarDays },
            { id: "rank", label: "순위", icon: Trophy },
            { id: "browse", label: "방찾기", icon: Search },
            { id: "chat", label: "대화", icon: MessageSquare },
          ] as const
        ).map((item) => {
          const Icon = item.icon;
          const active = view === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setView(item.id)}
              className={`py-2 rounded-lg flex flex-col items-center justify-center gap-0.5 transition ${
                active
                  ? "bg-[var(--hp-surface-2)] text-[var(--hp-text)] font-medium"
                  : "text-[var(--hp-text-3)] hover:text-[var(--hp-text-2)]"
              }`}
            >
              <Icon className="w-3.5 h-3.5 stroke-[1.6]" />
              <span className="truncate max-w-full">{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* 1. 좌석 (좌우 터치 스와이프 + 마우스 드래그 + 순위 배지 + 1시간 진화 스터디콘) */}
      {view === "room" && (
        <div
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={(e) => finishPointerDrag(e.clientX, e.clientY)}
          onPointerCancel={() => {
            pointerStartRef.current = null;
            setDragOffsetX(0);
          }}
          className="space-y-3 select-none cursor-grab active:cursor-grabbing touch-pan-y"
        >
          <div
            style={{
              transform: dragOffsetX !== 0 ? `translateX(${dragOffsetX}px)` : undefined,
              transition: dragOffsetX === 0 ? "transform 180ms ease-out" : "none",
            }}
            className="space-y-3"
          >
            {isAddSlideActive || !activeRoom ? (
              <div className="p-6 rounded-2xl bg-[var(--hp-surface)] border border-[var(--hp-border)] text-center space-y-4">
                <div className="space-y-1.5">
                  <div className="text-sm font-semibold">스터디 그룹을 추가하세요</div>
                  <p className="text-xs text-[var(--hp-text-2)] leading-relaxed">
                    여러 방에 가입하거나 직접 스터디 그룹을 개설해
                    <br />
                    좌우로 넘기며 함께 공부할 수 있습니다.
                  </p>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => setView("browse")}
                    className="px-3.5 py-2 rounded-xl border border-[var(--hp-border-strong)] text-xs font-medium"
                  >
                    그룹 찾기
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setWizardState({ open: true, mode: "create", studyType: "general" })
                    }
                    className="px-3.5 py-2 rounded-xl bg-[var(--hp-accent)] text-[var(--hp-accent-fg)] text-xs font-semibold flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[2]" />
                    <span>새 그룹 개설</span>
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* 방 헤더 카드 */}
                <div className="p-3.5 rounded-xl bg-[var(--hp-surface)] border border-[var(--hp-border)] space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-[var(--hp-text)] truncate">
                          {activeRoom.title}
                        </span>
                        {activeRoom.studyType === "cam" && (
                          <span className="px-1.5 py-0.5 rounded bg-[var(--hp-surface-2)] border border-[var(--hp-border)] text-[9.5px] text-[var(--hp-text-2)] shrink-0">
                            캠
                          </span>
                        )}
                        {!activeRoom.isPublic && (
                          <Lock className="w-3 h-3 text-[var(--hp-text-3)] shrink-0" />
                        )}
                      </div>
                      <p className="text-[11px] text-[var(--hp-text-2)] mt-1 leading-relaxed">
                        {activeRoom.notice}
                      </p>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => setShowGroupInfoModal(true)}
                        className="p-1.5 rounded-lg border border-[var(--hp-border)] text-[var(--hp-text-2)] hover:text-[var(--hp-text)]"
                        title="그룹 정보 · 설정"
                        aria-label="그룹 정보 설정"
                      >
                        <MoreHorizontal className="w-3.5 h-3.5 stroke-[1.6]" />
                      </button>
                      {joinedRoomIds.length > 1 && (
                        <button
                          type="button"
                          onClick={() =>
                            setConfirmLeaveRoom({ id: activeRoom.id, title: activeRoom.title })
                          }
                          className="p-1.5 rounded-lg border border-[var(--hp-border)] text-[var(--hp-text-3)] hover:text-[var(--hp-danger)]"
                          title="이 그룹 탈퇴"
                          aria-label="이 그룹 탈퇴"
                        >
                          <LogOut className="w-3.5 h-3.5 stroke-[1.5]" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* 실시간 요약 + 방 좌우 넘김 버튼 */}
                  <div className="flex items-center justify-between gap-2 pt-1 border-t border-[var(--hp-border)]">
                    <div className="text-[11px] hp-tabular text-[var(--hp-text-2)] flex items-center gap-1.5">
                      <span>
                        열공 {studyingCount}/{seats.length}
                      </span>
                      <span className="text-[var(--hp-text-3)]">·</span>
                      <span className="font-semibold text-[var(--hp-text)]">
                        내 순위 {myRank}위
                      </span>
                      <span className="text-[var(--hp-text-3)]">·</span>
                      <span>목표 {activeRoom.goalHours}h</span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => goToSlide(currentJoinedIndex - 1)}
                        className="w-6 h-6 rounded-md border border-[var(--hp-border)] flex items-center justify-center text-[var(--hp-text-2)] hover:text-[var(--hp-text)]"
                        aria-label="이전 방"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-[10.5px] hp-tabular text-[var(--hp-text-3)] px-1">
                        {currentJoinedIndex + 1}/{joinedRooms.length}
                      </span>
                      <button
                        type="button"
                        onClick={() => goToSlide(currentJoinedIndex + 1)}
                        className="w-6 h-6 rounded-md border border-[var(--hp-border)] flex items-center justify-center text-[var(--hp-text-2)] hover:text-[var(--hp-text)]"
                        aria-label="다음 방"
                      >
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* 좌석 그리드 (순위 배지 + 1시간 진화 스터디콘) */}
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
                        } ${seat.isStudying ? "" : "opacity-65"}`}
                        title={seat.isMe ? "탭하여 이 방의 닉네임·스터디콘 변경" : undefined}
                      >
                        <span
                          className={`absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-md border text-[9.5px] font-semibold hp-tabular leading-none ${getRankBadgeClass(
                            seat.rank
                          )}`}
                        >
                          {seat.rank}위
                        </span>
                        <span className="absolute top-1.5 right-1.5 text-[9px] hp-tabular text-[var(--hp-text-3)]">
                          {stageMeta.hourLabel}
                        </span>

                        <div className="mt-3 relative">
                          <StudyConeAvatar
                            family={seat.coneFamily}
                            seconds={seat.todaySeconds}
                            isStudying={seat.isStudying}
                            size={44}
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
                        <div className="mt-1.5 text-xs font-medium truncate w-full">
                          {seat.isMe ? `${seat.nickname} (나)` : seat.nickname}
                        </div>
                        <div className="text-[10px] text-[var(--hp-text-3)] truncate w-full">
                          {seat.isStudying ? seat.subject : "휴식"}
                        </div>
                        <div className="mt-1 text-[11px] hp-tabular text-[var(--hp-text-2)]">
                          {formatShortClock(seat.todaySeconds)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {/* 스와이프 도트 인디케이터 */}
          <div className="flex items-center justify-center gap-1.5 pt-1">
            {joinedRooms.map((r, idx) => {
              const active = !isAddSlideActive && idx === currentJoinedIndex;
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => goToSlide(idx)}
                  className={`h-1.5 rounded-full transition-all ${
                    active
                      ? "w-5 bg-[var(--hp-accent)]"
                      : "w-1.5 bg-[var(--hp-border-strong)]"
                  }`}
                  title={r.title}
                />
              );
            })}
            <button
              type="button"
              onClick={() => goToSlide(joinedRooms.length)}
              className={`h-1.5 rounded-full transition-all ${
                isAddSlideActive
                  ? "w-5 bg-[var(--hp-accent)]"
                  : "w-1.5 bg-[var(--hp-border-strong)]"
              }`}
              title="스터디 그룹 추가"
            />
            <span className="text-[10px] text-[var(--hp-text-3)] ml-1">
              좌우 드래그·스와이프
            </span>
          </div>
        </div>
      )}

      {/* 2. 주간 출석부 */}
      {view === "attendance" && activeRoom && (
        <div className="p-3.5 rounded-xl bg-[var(--hp-surface)] border border-[var(--hp-border)] space-y-3">
          <div className="flex items-center justify-between text-xs font-medium">
            <button
              type="button"
              onClick={() => setAttendanceWeekOffset((p) => p - 1)}
              className="p-1 rounded-lg hover:bg-[var(--hp-surface-2)] text-[var(--hp-text-2)]"
              aria-label="이전 주"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span>
              {attendanceWeekOffset === 0
                ? `${activeRoom.title} · 이번 주 출석부`
                : `${Math.abs(attendanceWeekOffset)}주 전 출석부`}
            </span>
            <button
              type="button"
              onClick={() => setAttendanceWeekOffset((p) => Math.min(0, p + 1))}
              disabled={attendanceWeekOffset === 0}
              className="p-1 rounded-lg hover:bg-[var(--hp-surface-2)] text-[var(--hp-text-2)] disabled:opacity-30"
              aria-label="다음 주"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="text-[11px] text-[var(--hp-text-2)] flex flex-wrap items-center gap-x-3 gap-y-1">
            <span>
              목표 <strong className="text-[var(--hp-text)]">{activeRoom.goalHours}시간</strong>
            </span>
            <span>
              출석률{" "}
              <strong className="text-[var(--hp-text)]">{activeRoom.attendancePct}%</strong>
            </span>
            <span className="ml-auto text-[10px] text-[var(--hp-text-3)]">
              매일 05:00 KST 리셋
            </span>
          </div>

          <div className="space-y-2.5">
            {seats.slice(0, 7).map((seat) => {
              const weekTotal = seat.weeklySeconds.reduce((s, v) => s + v, 0);
              const attendedDays = seat.weeklySeconds.filter((s) => s > 0).length;
              return (
                <div key={seat.id} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs gap-2">
                    <span className="font-medium truncate">
                      {seat.rank}위 · {seat.isMe ? `${seat.nickname} (나)` : seat.nickname}
                    </span>
                    <span className="text-[11px] hp-tabular text-[var(--hp-text-2)] shrink-0">
                      {formatShortClock(weekTotal)} · {attendedDays}일 출석
                    </span>
                  </div>
                  <div className="grid grid-cols-7 gap-1">
                    {WEEKDAYS.map((day, idx) => {
                      const sec = seat.weeklySeconds[idx] || 0;
                      const hours = sec / 3600;
                      const cellTone =
                        sec === 0
                          ? "bg-[var(--hp-bg)] text-[var(--hp-text-3)] border-[var(--hp-border)]"
                          : hours >= activeRoom.goalHours
                            ? "bg-[var(--hp-accent)] text-[var(--hp-accent-fg)] border-transparent font-medium"
                            : "bg-[var(--hp-surface-2)] text-[var(--hp-text)] border-[var(--hp-border-strong)]";
                      return (
                        <div
                          key={day}
                          className={`py-2 rounded-lg border text-center hp-tabular text-[10px] ${cellTone}`}
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
      )}

      {/* 3. 그룹 순위 */}
      {view === "rank" && activeRoom && (
        <div className="space-y-3">
          <div className="p-3.5 rounded-xl bg-[var(--hp-surface)] border border-[var(--hp-border)] flex items-center justify-between gap-2">
            <div className="text-[11px] text-[var(--hp-text-2)] space-y-0.5">
              <div className="hp-tabular">
                전체{" "}
                <strong className="text-[var(--hp-text)]">
                  {formatShortClock(totalRoomSeconds)}
                </strong>{" "}
                · 평균{" "}
                <strong className="text-[var(--hp-text)]">
                  {formatShortClock(avgRoomSeconds)}
                </strong>
              </div>
              <div>
                내 순위 <strong className="text-[var(--hp-text)]">{myRank}위</strong> · 매일 05:00
                리셋
              </div>
            </div>

            <div className="flex items-center gap-1 text-xs shrink-0">
              {(["day", "week"] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setRankPeriod(p)}
                  className={`px-2.5 py-1 rounded-md border ${
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
            {rankedSeats.map((s, idx) => {
              const sec =
                rankPeriod === "day"
                  ? s.todaySeconds
                  : s.weeklySeconds.reduce((sum, v) => sum + v, 0);
              const pct = Math.max(4, Math.round((sec / maxRankSec) * 100));
              const stageMeta = getStudyConeStageMeta(s.todaySeconds);
              return (
                <div
                  key={s.id}
                  className={`p-3 rounded-xl border flex items-center gap-2.5 ${
                    s.isMe
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
                    family={s.coneFamily}
                    seconds={s.todaySeconds}
                    isStudying={s.isStudying}
                    size={34}
                    showProgressRing={false}
                  />
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <span className={s.isMe ? "font-semibold truncate" : "truncate"}>
                        {s.isMe ? `${s.nickname} (나)` : s.nickname}
                        <span className="ml-1.5 text-[10px] text-[var(--hp-text-3)]">
                          {stageMeta.hourLabel} {stageMeta.title}
                        </span>
                      </span>
                      <span className="hp-tabular text-[var(--hp-text-2)] shrink-0">
                        {formatShortClock(sec)}
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-[var(--hp-bg)] overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${pct}%`, backgroundColor: s.color }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. 방찾기 · 일반/캠 스터디 개설 · 검색/정렬/필터 */}
      {view === "browse" && (
        <div className="space-y-3">
          {/* 상단 새 방 개설 2버튼 (일반 / 캠) */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() =>
                setWizardState({ open: true, mode: "create", studyType: "general" })
              }
              className="h-10 px-3 rounded-xl bg-[var(--hp-accent)] text-[var(--hp-accent-fg)] text-xs font-semibold flex items-center justify-center gap-1.5 transition hover:opacity-90"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2]" />
              <span>일반 스터디 개설</span>
            </button>
            <button
              type="button"
              onClick={() =>
                setWizardState({ open: true, mode: "create", studyType: "cam" })
              }
              className="h-10 px-3 rounded-xl border border-[var(--hp-border-strong)] bg-[var(--hp-surface)] hover:bg-[var(--hp-surface-2)] text-xs font-semibold flex items-center justify-center gap-1.5 transition"
            >
              <Camera className="w-3.5 h-3.5 stroke-[1.75]" />
              <span>캠 스터디 개설</span>
            </button>
          </div>

          {/* 정렬 탭 */}
          <div className="flex items-center gap-3 border-b border-[var(--hp-border)] pb-1.5 overflow-x-auto no-scrollbar text-xs">
            {(
              [
                { id: "newest", label: "신규" },
                { id: "attendance", label: "출석률" },
                { id: "studyTime", label: "공부량" },
                { id: "cam", label: "캠 스터디" },
                { id: "mission", label: "미션인증" },
              ] as const
            ).map((sTab) => (
              <button
                key={sTab.id}
                type="button"
                onClick={() => setBrowseSort(sTab.id)}
                className={`pb-1.5 shrink-0 border-b-2 transition ${
                  browseSort === sTab.id
                    ? "text-[var(--hp-text)] border-[var(--hp-accent)] font-semibold"
                    : "text-[var(--hp-text-3)] border-transparent hover:text-[var(--hp-text-2)]"
                }`}
              >
                {sTab.label}
              </button>
            ))}
          </div>

          {/* 검색 + 필터 칩 */}
          <div className="space-y-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[var(--hp-text-3)] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={browseFilter.query}
                onChange={(e) =>
                  setBrowseFilter((prev) => ({ ...prev, query: e.target.value }))
                }
                placeholder="스터디 그룹 이름·공지 검색..."
                className="w-full h-9 pl-8 pr-3 rounded-xl bg-[var(--hp-surface)] border border-[var(--hp-border)] text-xs text-[var(--hp-text)] placeholder:text-[var(--hp-text-3)] outline-none focus:border-[var(--hp-border-strong)]"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              {(
                [
                  { key: "onlyCert", label: "자격증" },
                  { key: "onlyCam", label: "캠" },
                  { key: "onlyVacant", label: "빈자리" },
                  { key: "onlyPublic", label: "공개방" },
                ] as const
              ).map((flt) => {
                const checked = browseFilter[flt.key];
                return (
                  <button
                    key={flt.key}
                    type="button"
                    onClick={() =>
                      setBrowseFilter((p) => ({ ...p, [flt.key]: !p[flt.key] }))
                    }
                    className={`h-7 px-2.5 rounded-lg text-[11px] border flex items-center gap-1 shrink-0 transition ${
                      checked
                        ? "bg-[var(--hp-accent)] text-[var(--hp-accent-fg)] border-transparent font-medium"
                        : "bg-[var(--hp-surface)] border-[var(--hp-border)] text-[var(--hp-text-2)]"
                    }`}
                  >
                    {checked && <Check className="w-3 h-3 stroke-[2]" />}
                    <span>{flt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 그룹 카드 리스트 */}
          <div className="space-y-2">
            {browseRooms.length === 0 ? (
              <div className="py-10 text-center text-xs text-[var(--hp-text-3)]">
                조건에 맞는 스터디 그룹이 없습니다. 직접 새 방을 개설해 보세요.
              </div>
            ) : (
              browseRooms.map((room) => {
                const joined = joinedRoomIds.includes(room.id);
                const selected = !isAddSlideActive && room.id === activeRoom?.id;
                return (
                  <div
                    key={room.id}
                    className={`p-3.5 rounded-xl border space-y-1.5 ${
                      selected
                        ? "bg-[var(--hp-surface-2)] border-[var(--hp-border-strong)]"
                        : "bg-[var(--hp-surface)] border-[var(--hp-border)]"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 text-[10.5px] text-[var(--hp-text-2)]">
                          <span>{room.category}</span>
                          {room.studyType === "cam" && <Camera className="w-3 h-3" />}
                          {!room.isPublic && <Lock className="w-3 h-3" />}
                          {room.joinMethod === "approval" && <span>· 승인가입</span>}
                        </div>
                        <div className="text-sm font-medium text-[var(--hp-text)] truncate mt-0.5">
                          {room.title}
                        </div>
                      </div>

                      {joined ? (
                        <button
                          type="button"
                          onClick={() => {
                            setIsAddSlideActive(false);
                            setActiveRoomId(room.id);
                            setView("room");
                          }}
                          className="px-2.5 py-1.5 rounded-lg border border-[var(--hp-border-strong)] text-xs text-[var(--hp-text-2)] flex items-center gap-1 shrink-0"
                        >
                          <Check className="w-3 h-3 stroke-[1.75]" />
                          <span>{selected ? "입장중" : "이동"}</span>
                        </button>
                      ) : (
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
                          className="px-3 py-1.5 rounded-lg bg-[var(--hp-accent)] text-[var(--hp-accent-fg)] text-xs font-medium shrink-0"
                        >
                          가입하기
                        </button>
                      )}
                    </div>

                    <div className="text-[11px] text-[var(--hp-text-3)] hp-tabular">
                      목표 {room.goalHours}h · 인원 {room.memberCount}/{room.capacity} · 출석{" "}
                      {room.attendancePct}%
                    </div>
                    <p className="text-xs text-[var(--hp-text-2)] truncate">{room.notice}</p>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* 5. 그룹 대화 */}
      {view === "chat" && activeRoom && (
        <div className="p-3.5 rounded-xl bg-[var(--hp-surface)] border border-[var(--hp-border)] space-y-3">
          <div className="flex items-center justify-between gap-2 text-xs">
            <span className="font-medium truncate">{activeRoom.title} · 응원 대화</span>
            <button
              type="button"
              onClick={handleCopyInvite}
              className="px-2.5 py-1 rounded-lg border border-[var(--hp-border)] text-[11px] text-[var(--hp-text-2)] hover:text-[var(--hp-text)] flex items-center gap-1 shrink-0"
            >
              {copiedInvite ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              <span>{copiedInvite ? "복사됨" : "초대 복사"}</span>
            </button>
          </div>

          <div className="space-y-2 max-h-72 overflow-y-auto">
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
                      : "bg-[var(--hp-bg)] border-[var(--hp-border)] mr-6"
                  }`}
                >
                  <div className="flex items-center justify-between text-[10.5px] text-[var(--hp-text-3)]">
                    <span className="font-medium text-[var(--hp-text)]">{c.sender}</span>
                    <span className="hp-tabular">{c.timeLabel}</span>
                  </div>
                  <p className="mt-1 text-[var(--hp-text-2)] break-words leading-relaxed">
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
            className="flex items-center gap-2 pt-1"
          >
            <input
              type="text"
              value={chatDraft}
              onChange={(e) => setChatDraft(e.target.value)}
              placeholder="동기들에게 한마디 (예: 법규 2회독 끝!)"
              className="flex-1 h-9 px-3 rounded-lg bg-[var(--hp-bg)] border border-[var(--hp-border)] text-xs text-[var(--hp-text)] placeholder:text-[var(--hp-text-3)] outline-none"
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
                  seconds={myStudySeconds}
                  isStudying
                  size={34}
                  showProgressRing={false}
                />
                <div className="text-left">
                  <div className="font-medium">내 그룹 프로필 · 진화 스터디콘</div>
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
                <span className="text-[var(--hp-text-2)]">목표시간</span>
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
                <span>그룹 챌린지 (목표 달성 +15 PMP)</span>
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
              {joinedRoomIds.length > 1 && (
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

      {/* 스터디 그룹 탈퇴 확인 모달 (실수 방지) */}
      {confirmLeaveRoom && (
        <div
          className="fixed inset-0 z-[90] bg-[var(--hp-overlay)] backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setConfirmLeaveRoom(null)}
          role="alertdialog"
          aria-modal="true"
        >
          <div
            className="w-full max-w-[340px] rounded-2xl bg-[var(--hp-bg)] border border-[var(--hp-border-strong)] p-5 space-y-4 shadow-2xl text-[var(--hp-text)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-1.5">
              <h3 className="text-sm font-semibold">스터디 그룹 탈퇴</h3>
              <p className="text-xs leading-relaxed text-[var(--hp-text-2)]">
                &apos;{confirmLeaveRoom.title}&apos; 그룹에서 정말 탈퇴하시겠습니까? 언제든 방찾기에서
                다시 참여할 수 있습니다.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setConfirmLeaveRoom(null)}
                className="h-9 rounded-lg border border-[var(--hp-border-strong)] text-xs font-medium text-[var(--hp-text)] hover:bg-[var(--hp-surface)] transition"
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
                className="h-9 rounded-lg bg-[var(--hp-danger)] text-white text-xs font-medium hover:opacity-90 transition"
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
        myTodaySeconds={myStudySeconds}
        onClose={() => setWizardState((prev) => ({ ...prev, open: false }))}
        onCreateComplete={(input) => {
          createAndJoinRoom(input);
          setIsAddSlideActive(false);
          setView("room");
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
          setView("room");
        }}
      />
    </div>
  );
}
