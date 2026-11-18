"use client";

import { useMemo, useRef, useState } from "react";
import {
  Bell,
  CalendarDays,
  Camera,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Copy,
  Flame,
  Home,
  LampDesk,
  Lock,
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
import type {
  StudyGroupChatMessage,
  StudyGroupMemberItem,
} from "@/data/study-timer-tools";
import { useStudyGroupsStore } from "@/lib/study-groups-store";
import { StudyGroupCreateWizard } from "@/components/mobile/study-group-create-wizard";

type GroupSubTab = "home" | "attendance" | "ranking" | "browse" | "chat";
type BrowseSortMode = "newest" | "attendance" | "studyTime" | "cam" | "mission";

interface YptGroupGridProps {
  myStudySeconds: number;
  myConeEmoji: string;
  myNickname?: string;
  currentSubjectLabel?: string;
  isMeStudying?: boolean;
  hideOthers?: boolean;
  accentHex?: string;
  isTimerRunning?: boolean;
}

function formatHHMMSS(totalSec: number): string {
  const safe = Math.max(0, Math.floor(totalSec));
  const h = Math.floor(safe / 3600);
  const m = Math.floor((safe % 3600) / 60);
  const s = safe % 60;
  return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function formatHMM(totalSec: number): string {
  if (totalSec <= 0) return "";
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  return `${h}:${String(m).padStart(2, "0")}`;
}

const WEEKDAYS = ["월", "화", "수", "목", "금", "토", "일"];

export function YptGroupGrid({
  myStudySeconds,
  myConeEmoji,
  myNickname = "posmul",
  currentSubjectLabel = "주택관리 관계법규",
  isMeStudying = true,
  hideOthers = false,
  accentHex = "#FF5A36",
  isTimerRunning = false,
}: YptGroupGridProps) {
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

  const [groupTab, setGroupTab] = useState<GroupSubTab>("home");
  // 마지막 슬라이드('스터디 그룹을 추가하세요.') 표시 여부
  const [isAddSlideActive, setIsAddSlideActive] = useState(false);

  // 스와이프 제스처 추적
  const swipeStartRef = useRef<{ x: number; y: number } | null>(null);

  // 출석부 · 랭킹 · 찾기 필터
  const [attendanceWeekOffset, setAttendanceWeekOffset] = useState(0);
  const [rankPeriod, setRankPeriod] = useState<"day" | "week">("day");
  const [browseSort, setBrowseSort] = useState<BrowseSortMode>("newest");
  const [browseFilter, setBrowseFilter] = useState<{
    onlyCert: boolean;
    onlyCam: boolean;
    onlyVacant: boolean;
    onlyPublic: boolean;
    query: string;
  }>({
    onlyCert: true,
    onlyCam: false,
    onlyVacant: false,
    onlyPublic: false,
    query: "",
  });

  // + 확장 FAB & 그룹 만들기/가입/프로필 위저드
  const [isFabMenuOpen, setIsFabMenuOpen] = useState(false);
  const [wizardState, setWizardState] = useState<{
    open: boolean;
    mode: "create" | "join" | "profile";
    studyType: "general" | "cam";
    targetRoomId?: string;
  }>({ open: false, mode: "create", studyType: "general" });

  // 그룹 정보 설정 모달 · 초대 복사 · 채팅
  const [showGroupInfoModal, setShowGroupInfoModal] = useState(false);
  const [copiedInvite, setCopiedInvite] = useState(false);
  const [chatDraft, setChatDraft] = useState("");

  const currentJoinedIndex = useMemo(() => {
    if (isAddSlideActive) return joinedRooms.length;
    const idx = joinedRooms.findIndex((r) => r.id === activeRoomId);
    return idx >= 0 ? idx : 0;
  }, [isAddSlideActive, joinedRooms, activeRoomId]);

  const activeRoom = useMemo(() => {
    if (isAddSlideActive) return null;
    return joinedRooms[currentJoinedIndex] || joinedRooms[0] || rooms[0] || null;
  }, [isAddSlideActive, joinedRooms, currentJoinedIndex, rooms]);

  // 현재 방에서의 내 프로필 (방마다 별도 닉네임·스터디콘 지원)
  const effectiveMyProfile = useMemo(() => {
    const saved = activeRoom ? profilesByRoomId[activeRoom.id] : undefined;
    return {
      nickname: saved?.nickname || myNickname,
      coneEmoji: saved?.coneEmoji || myConeEmoji,
    };
  }, [activeRoom, profilesByRoomId, myNickname, myConeEmoji]);

  // 스와이프 좌/우 이동 핸들러
  const totalSlidesCount = joinedRooms.length + 1; // +1은 '스터디 그룹을 추가하세요.' 슬라이드
  const goToSlide = (nextIdx: number) => {
    const wrapped = (nextIdx + totalSlidesCount) % totalSlidesCount;
    if (wrapped >= joinedRooms.length) {
      setIsAddSlideActive(true);
    } else {
      setIsAddSlideActive(false);
      const target = joinedRooms[wrapped];
      if (target) setActiveRoomId(target.id);
    }
  };

  const handleTouchStart = (clientX: number, clientY: number) => {
    swipeStartRef.current = { x: clientX, y: clientY };
  };

  const handleTouchEnd = (clientX: number, clientY: number) => {
    const start = swipeStartRef.current;
    swipeStartRef.current = null;
    if (!start || groupTab !== "home") return;
    const dx = clientX - start.x;
    const dy = clientY - start.y;
    if (Math.abs(dx) > 44 && Math.abs(dx) > Math.abs(dy) * 1.2) {
      if (dx < 0) goToSlide(currentJoinedIndex + 1);
      else goToSlide(currentJoinedIndex - 1);
    }
  };

  // '나'를 포함한 현재 방 멤버 목록
  const mergedMembers: StudyGroupMemberItem[] = useMemo(() => {
    if (!activeRoom) return [];
    const meItem: StudyGroupMemberItem = {
      id: "me",
      nickname: effectiveMyProfile.nickname,
      emoji: effectiveMyProfile.coneEmoji,
      todaySeconds: myStudySeconds,
      isStudying: isMeStudying,
      subject: currentSubjectLabel,
      weeklySeconds: [
        Math.max(3600, myStudySeconds),
        Math.max(5400, myStudySeconds),
        myStudySeconds,
        0,
        0,
        0,
        0,
      ],
      isMe: true,
    };
    const others = activeRoom.members.filter((m) => !m.isMe);
    if (others.length === 0) return [meItem];
    // 레퍼런스 2, 3처럼 중간 또는 마지막에 자연스럽게 배치
    const insertIdx = Math.min(5, others.length);
    return [...others.slice(0, insertIdx), meItem, ...others.slice(insertIdx, 11)];
  }, [
    activeRoom,
    effectiveMyProfile,
    myStudySeconds,
    isMeStudying,
    currentSubjectLabel,
  ]);

  const activeMembersCount = mergedMembers.filter((m) => m.isStudying).length;
  const displayStudyingCount =
    activeRoom?.onlineCountOverride && activeMembersCount > 0
      ? activeRoom.onlineCountOverride
      : activeMembersCount;

  const rankedMembers = useMemo(() => {
    return [...mergedMembers].sort((a, b) => {
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
  }, [mergedMembers, rankPeriod]);

  const myRank = rankedMembers.findIndex((m) => m.isMe) + 1;
  const totalRoomSeconds = rankedMembers.reduce(
    (sum, m) =>
      sum +
      (rankPeriod === "day"
        ? m.todaySeconds
        : m.weeklySeconds.reduce((s, v) => s + v, 0)),
    0
  );
  const avgRoomSeconds =
    rankedMembers.length > 0 ? Math.round(totalRoomSeconds / rankedMembers.length) : 0;
  const maxRankSec = Math.max(
    1,
    rankPeriod === "day"
      ? rankedMembers[0]?.todaySeconds || 1
      : rankedMembers[0]?.weeklySeconds.reduce((s, v) => s + v, 0) || 1
  );

  // 그룹 탐색 필터 + 정렬 (레퍼런스 5)
  const browseRooms = useMemo(() => {
    const filtered = rooms.filter((r) => {
      if (browseFilter.onlyCert && !r.category.includes("자격증") && !r.category.includes("주택")) {
        return false;
      }
      if (browseFilter.onlyCam && r.studyType !== "cam") return false;
      if (browseFilter.onlyVacant && r.memberCount >= r.capacity) return false;
      if (browseFilter.onlyPublic && !r.isPublic) return false;
      if (browseSort === "cam" && r.studyType !== "cam") return false;
      if (browseSort === "mission" && !r.hasMission) return false;
      if (
        browseFilter.query.trim() &&
        !r.title.toLowerCase().includes(browseFilter.query.trim().toLowerCase())
      ) {
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

  const wizardTargetRoom = useMemo(
    () =>
      wizardState.targetRoomId
        ? rooms.find((r) => r.id === wizardState.targetRoomId)
        : activeRoom || undefined,
    [rooms, wizardState.targetRoomId, activeRoom]
  );

  const handleSendChat = () => {
    const clean = chatDraft.trim();
    if (!clean || !activeRoom) return;
    const msg: StudyGroupChatMessage = {
      id: `chat-${Date.now()}`,
      sender: effectiveMyProfile.nickname,
      emoji: effectiveMyProfile.coneEmoji,
      text: clean,
      timeLabel: new Date().toTimeString().slice(0, 5),
      isMe: true,
    };
    addGroupChat(activeRoom.id, msg);
    setChatDraft("");
  };

  const handleCopyInvite = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard && activeRoom) {
      void navigator.clipboard.writeText(
        `[Housing-Pro 열공방] '${activeRoom.title}'에서 같이 공부해요! https://pro.posmul.com`
      );
    }
    setCopiedInvite(true);
    setTimeout(() => setCopiedInvite(false), 2000);
  };

  return (
    <div className="space-y-2.5 relative">
      {/* ========================================================== */}
      {/* 메인 스터디 그룹 카드 (레퍼런스 1~4: 좌우 스와이프 전환) */}
      {/* ========================================================== */}
      {groupTab === "home" && (
        <div
          onTouchStart={(e) => {
            const t = e.touches[0];
            if (t) handleTouchStart(t.clientX, t.clientY);
          }}
          onTouchEnd={(e) => {
            const t = e.changedTouches[0];
            if (t) handleTouchEnd(t.clientX, t.clientY);
          }}
          className="rounded-3xl bg-[#14141B] border border-white/[0.08] p-3.5 space-y-3 select-none"
        >
          {isAddSlideActive || !activeRoom ? (
            /* 레퍼런스 이미지 4: 마지막 슬라이드 "스터디 그룹을 추가하세요." */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-black text-white">
                  스터디 그룹을 추가하세요.
                </span>
                <button
                  type="button"
                  onClick={() => setGroupTab("browse")}
                  className="p-1 rounded-lg hover:bg-white/[0.08] text-slate-400"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </button>
              </div>

              <div className="py-10 px-4 text-center space-y-4">
                <p className="text-xs text-slate-300 leading-relaxed">
                  스터디 그룹을 추가하면
                  <br />
                  함께 공부중인 그룹원들의 모습을
                  <br />
                  이곳에서 스와이프하며 볼 수 있습니다.
                  {isTimerRunning && (
                    <>
                      <br />
                      <span className="text-slate-400 text-[11px]">
                        여러 방을 개설·가입해 경쟁해 보세요!
                      </span>
                    </>
                  )}
                </p>

                <div className="flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => setGroupTab("browse")}
                    className="px-3.5 py-2 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] text-xs font-black text-white transition"
                  >
                    그룹 찾기
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setWizardState({
                        open: true,
                        mode: "create",
                        studyType: "general",
                      })
                    }
                    className="px-3.5 py-2 rounded-xl bg-[#FF5A36] hover:bg-[#ff6d4d] text-xs font-black text-white flex items-center gap-1 transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>새 그룹 만들기</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* 가입된 스터디방 실시간 4열 책상 타일 */
            <>
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setGroupTab("browse")}
                      className="text-sm font-black text-white truncate hover:text-[#FF8A6B] transition text-left"
                    >
                      {activeRoom.title}
                    </button>
                    {activeRoom.studyType === "cam" && (
                      <span className="px-1.5 py-0.2 rounded bg-sky-500/20 text-sky-300 text-[9px] font-black shrink-0">
                        캠
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-[10.5px] text-slate-400 mt-0.5">
                    <span className="font-bold flex items-center gap-1" style={{ color: accentHex }}>
                      <Flame className="w-3 h-3 fill-current" />
                      <span>{displayStudyingCount}명 공부중</span>
                    </span>
                    <span>·</span>
                    <span className="text-amber-300 font-bold">
                      내 순위 {myRank}위
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => goToSlide(currentJoinedIndex - 1)}
                    className="p-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.1] text-slate-400 hover:text-white"
                    title="이전 스터디방 (좌로 스와이프)"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => goToSlide(currentJoinedIndex + 1)}
                    className="p-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.1] text-slate-400 hover:text-white"
                    title="다음 스터디방 (우로 스와이프)"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowGroupInfoModal(true)}
                    className="p-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-slate-300"
                    title="그룹 정보 · 설정"
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* 4열 책상 타일 그리드 */}
              <div className="grid grid-cols-4 gap-1.5">
                {mergedMembers.map((member) => {
                  const isMasked = hideOthers && !member.isMe;
                  const studying = member.isStudying && !isMasked;

                  return (
                    <div
                      key={member.id}
                      onClick={() => {
                        if (member.isMe && activeRoom) {
                          setWizardState({
                            open: true,
                            mode: "profile",
                            studyType: activeRoom.studyType,
                            targetRoomId: activeRoom.id,
                          });
                        }
                      }}
                      className={`rounded-xl px-1.5 py-2.5 flex flex-col items-center text-center transition relative ${
                        member.isMe
                          ? "bg-[#1C1617] border cursor-pointer"
                          : studying
                            ? "bg-[#18171E] border border-white/[0.06]"
                            : "bg-[#111116] border border-white/[0.04] opacity-75"
                      }`}
                      style={
                        member.isMe
                          ? {
                              borderColor: accentHex,
                              boxShadow: `0 0 18px ${accentHex}26`,
                            }
                          : undefined
                      }
                      title={member.isMe ? "탭하여 이 방의 닉네임·스터디콘 변경" : undefined}
                    >
                      <div className="h-11 flex items-center justify-center relative">
                        {studying ? (
                          <div className="relative flex flex-col items-center">
                            <span className="text-2xl leading-none drop-shadow">
                              {member.emoji}
                            </span>
                            <div
                              className="w-8 h-1 rounded-full mt-1"
                              style={{ backgroundColor: accentHex }}
                            />
                          </div>
                        ) : (
                          <div className="flex flex-col items-center text-slate-600">
                            {member.todaySeconds > 0 && !isMasked ? (
                              <Clock className="w-3 h-3 text-slate-500 mb-0.5" />
                            ) : null}
                            <LampDesk className="w-6 h-6 stroke-[1.5]" />
                          </div>
                        )}
                      </div>

                      <div
                        className={`text-[10px] font-extrabold truncate w-full mt-1 ${
                          member.isMe
                            ? "text-white"
                            : studying
                              ? "text-[#FF8A6B]"
                              : "text-slate-400"
                        }`}
                      >
                        {isMasked ? "열공중" : member.nickname}
                      </div>

                      <div
                        className={`font-mono text-[10px] font-black tracking-tight tabular-nums ${
                          studying ? "text-[#FF7A59]" : "text-slate-500"
                        }`}
                        style={studying ? { color: accentHex } : undefined}
                      >
                        {isMasked ? "••:••:••" : formatHHMMSS(member.todaySeconds)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* 스와이프 페이지 도트 인디케이터 (가입된 그룹 수 + 추가 슬라이드) */}
          <div className="flex items-center justify-center gap-1.5 pt-1">
            {joinedRooms.map((r, idx) => {
              const active = !isAddSlideActive && idx === currentJoinedIndex;
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => goToSlide(idx)}
                  className={`h-1.5 rounded-full transition-all ${
                    active ? "w-5" : "w-1.5 bg-white/25 hover:bg-white/45"
                  }`}
                  style={active ? { backgroundColor: accentHex } : undefined}
                  title={r.title}
                />
              );
            })}
            <button
              type="button"
              onClick={() => goToSlide(joinedRooms.length)}
              className={`h-1.5 rounded-full transition-all ${
                isAddSlideActive
                  ? "w-5 bg-amber-400"
                  : "w-1.5 bg-white/20 hover:bg-white/45"
              }`}
              title="스터디 그룹 추가"
            />
            <span className="text-[9.5px] text-slate-500 ml-1">스와이프 전환</span>
          </div>
        </div>
      )}

      {/* 2. 출석부 */}
      {groupTab === "attendance" && activeRoom && (
        <div className="p-3 rounded-2xl bg-[#16161D] border border-white/[0.08] space-y-3">
          <div className="flex items-center justify-between text-xs font-black text-white">
            <button
              type="button"
              onClick={() => setAttendanceWeekOffset((p) => p - 1)}
              className="p-1 rounded-lg hover:bg-white/[0.08]"
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
              className="p-1 rounded-lg hover:bg-white/[0.08] disabled:opacity-30"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="text-[10.5px] text-slate-400 flex items-center gap-3">
            <span>
              목표시간 <strong className="text-white">{activeRoom.goalHours}시간</strong>
            </span>
            <span>
              출석률{" "}
              <strong style={{ color: accentHex }}>{activeRoom.attendancePct}%</strong>
            </span>
          </div>

          <div className="space-y-2.5 max-h-56 overflow-y-auto pr-0.5">
            {rankedMembers.slice(0, 7).map((m) => {
              const weekTotal = m.weeklySeconds.reduce((s, v) => s + v, 0);
              const attendedDays = m.weeklySeconds.filter((s) => s > 0).length;
              return (
                <div key={m.id} className="space-y-1">
                  <div className="flex items-center justify-between text-[11px] font-black">
                    <span className={m.isMe ? "text-[#FF8A6B]" : "text-white"}>
                      {m.emoji} {hideOthers && !m.isMe ? "수험생" : m.nickname}
                    </span>
                    <span className="font-mono text-slate-300">
                      {formatHHMMSS(weekTotal)} · ✓{attendedDays}
                    </span>
                  </div>
                  <div className="grid grid-cols-7 gap-1">
                    {WEEKDAYS.map((day, idx) => {
                      const sec = m.weeklySeconds[idx] || 0;
                      const hours = sec / 3600;
                      const blockClass =
                        sec === 0
                          ? "bg-white/[0.04] text-slate-500"
                          : hours >= activeRoom.goalHours
                            ? "bg-[#FF5A36] text-white"
                            : "bg-[#FF5A36]/40 text-amber-100";
                      return (
                        <div
                          key={day}
                          className={`py-1.5 rounded-md text-center font-mono text-[9.5px] font-black ${blockClass}`}
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

      {/* 3. 랭킹 */}
      {groupTab === "ranking" && activeRoom && (
        <div className="p-3 rounded-2xl bg-[#16161D] border border-white/[0.08] space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-[10.5px] text-slate-300 space-y-0.5">
              <div>
                전체 시간{" "}
                <strong className="font-mono text-[#FF8A6B]">
                  {formatHHMMSS(totalRoomSeconds)}
                </strong>
                {" · "}평균{" "}
                <strong className="font-mono text-white">
                  {formatHHMMSS(avgRoomSeconds)}
                </strong>
              </div>
              <div className="text-[10px] text-slate-400">
                내 순위 <strong className="text-amber-300">{myRank}등</strong>
              </div>
            </div>

            <div className="flex items-center bg-[#0D0D12] p-0.5 rounded-lg border border-white/[0.08] text-[10px] font-black">
              <button
                type="button"
                onClick={() => setRankPeriod("day")}
                className={`px-2 py-1 rounded ${
                  rankPeriod === "day" ? "bg-[#FF5A36] text-white" : "text-slate-400"
                }`}
              >
                일간
              </button>
              <button
                type="button"
                onClick={() => setRankPeriod("week")}
                className={`px-2 py-1 rounded ${
                  rankPeriod === "week" ? "bg-[#FF5A36] text-white" : "text-slate-400"
                }`}
              >
                주간
              </button>
            </div>
          </div>

          <div className="space-y-2 max-h-56 overflow-y-auto pr-0.5">
            {rankedMembers.map((m, idx) => {
              const valSec =
                rankPeriod === "day"
                  ? m.todaySeconds
                  : m.weeklySeconds.reduce((s, v) => s + v, 0);
              const pct = Math.max(4, Math.round((valSec / maxRankSec) * 100));
              const medalColor =
                idx === 0
                  ? "bg-amber-400 text-slate-950"
                  : idx === 1
                    ? "bg-slate-300 text-slate-950"
                    : idx === 2
                      ? "bg-amber-700 text-white"
                      : "bg-white/[0.06] text-slate-300";
              return (
                <div
                  key={m.id}
                  className={`flex items-center gap-2.5 p-2 rounded-xl ${
                    m.isMe ? "bg-[#FF5A36]/12 border border-[#FF5A36]/40" : "bg-[#101016]"
                  }`}
                >
                  <span
                    className={`w-6 h-6 rounded-full text-[10.5px] font-black flex items-center justify-center shrink-0 ${medalColor}`}
                  >
                    {idx + 1}
                  </span>
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-black text-white truncate">
                        {hideOthers && !m.isMe ? `열공멤버 ${idx + 1}` : m.nickname}
                      </span>
                      <span className="font-mono font-black text-[#FF8A6B] shrink-0">
                        {formatHHMMSS(valSec)}
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${pct}%`, backgroundColor: accentHex }}
                      />
                    </div>
                  </div>
                  <span className="text-base shrink-0">{m.emoji}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. 스터디 그룹 찾기 · 여러 방 가입 · 캠/일반 스터디 개설 (레퍼런스 이미지 5) */}
      {groupTab === "browse" && (
        <div className="p-3 rounded-2xl bg-[#16161D] border border-white/[0.08] space-y-2.5 relative pb-12">
          {/* 상단 정렬 탭 (신규 · 출석률 · 공부량 · 캠 스터디 · 미션인증) */}
          <div className="flex items-center gap-3 border-b border-white/[0.08] pb-2 overflow-x-auto no-scrollbar text-[11px] font-black">
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
                className={`pb-1 shrink-0 transition border-b-2 ${
                  browseSort === sTab.id
                    ? "text-white border-[#FF5A36]"
                    : "text-slate-500 border-transparent hover:text-slate-300"
                }`}
              >
                {sTab.label}
              </button>
            ))}
          </div>

          {/* 체크 필터 + 검색 */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <div className="relative flex-1 min-w-[120px]">
              <Search className="w-3 h-3 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={browseFilter.query}
                onChange={(e) =>
                  setBrowseFilter((prev) => ({ ...prev, query: e.target.value }))
                }
                placeholder="스터디 그룹 검색..."
                className="w-full pl-7 pr-2.5 py-1 rounded-lg bg-[#0D0D12] border border-white/[0.08] text-[10.5px] text-white"
              />
            </div>
            {(
              [
                { key: "onlyCert", label: "자격증" },
                { key: "onlyCam", label: "캠" },
                { key: "onlyVacant", label: "빈자리" },
                { key: "onlyPublic", label: "공개" },
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
                  className={`px-2 py-1 rounded-lg text-[10px] font-bold border flex items-center gap-1 ${
                    checked
                      ? "bg-[#FF5A36]/20 border-[#FF5A36] text-[#FF8A6B]"
                      : "bg-white/[0.04] border-white/[0.08] text-slate-400"
                  }`}
                >
                  {checked && <Check className="w-2.5 h-2.5" />}
                  <span>{flt.label}</span>
                </button>
              );
            })}
          </div>

          {/* 그룹 카드 목록 */}
          <div className="space-y-2 max-h-56 overflow-y-auto pr-0.5">
            {browseRooms.map((r) => {
              const isJoined = joinedRoomIds.includes(r.id);
              const isSelected = !isAddSlideActive && r.id === activeRoom?.id;
              return (
                <div
                  key={r.id}
                  className={`p-3 rounded-xl border space-y-1.5 ${
                    isSelected
                      ? "bg-[#FF5A36]/12 border-[#FF5A36]"
                      : "bg-[#101016] border-white/[0.07]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#FF8A6B]">
                        <span>{r.category}</span>
                        {r.studyType === "cam" && <Camera className="w-3 h-3" />}
                        {!r.isPublic && <Lock className="w-3 h-3 text-amber-400" />}
                        {r.joinMethod === "approval" && (
                          <span className="text-[9px] text-slate-400">· 승인가입</span>
                        )}
                      </div>
                      <div className="text-xs font-black text-white truncate mt-0.5">
                        {r.title}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        if (isJoined) {
                          setIsAddSlideActive(false);
                          setActiveRoomId(r.id);
                          setGroupTab("home");
                        } else {
                          setWizardState({
                            open: true,
                            mode: "join",
                            studyType: r.studyType,
                            targetRoomId: r.id,
                          });
                        }
                      }}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-black shrink-0 ${
                        isSelected
                          ? "bg-emerald-500/20 text-emerald-300"
                          : isJoined
                            ? "bg-white/[0.08] text-white"
                            : "bg-[#FF5A36] hover:bg-[#ff6d4d] text-white"
                      }`}
                    >
                      {isSelected ? "입장중" : isJoined ? "이동" : "가입하기"}
                    </button>
                  </div>

                  <div className="text-[10px] text-slate-400">
                    목표 {r.goalHours}시간 · 인원 {r.memberCount}/{r.capacity}명 · 그룹장{" "}
                    {r.leaderName} · 출석 {r.attendancePct}% · {r.createdLabel}
                  </div>
                  <div className="text-[10.5px] text-slate-300 truncate">{r.notice}</div>
                </div>
              );
            })}
          </div>

          {/* 레퍼런스 5: 우하단 주황 + 플로팅 확장 버튼 (캠 스터디 / 일반 스터디) */}
          <div className="absolute right-3 bottom-3 z-20 flex flex-col items-end gap-2">
            {isFabMenuOpen && (
              <div className="flex flex-col items-end gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setIsFabMenuOpen(false);
                    setWizardState({ open: true, mode: "create", studyType: "cam" });
                  }}
                  className="flex items-center gap-2 px-3 py-2 rounded-full bg-white text-slate-950 text-[11px] font-black shadow-xl hover:scale-105 transition"
                >
                  <span>캠 스터디</span>
                  <Camera className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsFabMenuOpen(false);
                    setWizardState({ open: true, mode: "create", studyType: "general" });
                  }}
                  className="flex items-center gap-2 px-3 py-2 rounded-full bg-white text-slate-950 text-[11px] font-black shadow-xl hover:scale-105 transition"
                >
                  <span>일반 스터디</span>
                  <LampDesk className="w-4 h-4" />
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={() => setIsFabMenuOpen((prev) => !prev)}
              className="w-10 h-10 rounded-full bg-[#FF5A36] hover:bg-[#ff6d4d] text-white shadow-xl flex items-center justify-center transition"
              title="새 스터디방 만들기"
            >
              {isFabMenuOpen ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
            </button>
          </div>
        </div>
      )}

      {/* 5. 그룹 응원 채팅 */}
      {groupTab === "chat" && activeRoom && (
        <div className="p-3 rounded-2xl bg-[#16161D] border border-white/[0.08] space-y-2.5">
          <div className="flex items-center justify-between text-[11px] font-black text-white">
            <span className="truncate">{activeRoom.title} · 응원 채팅</span>
            <button
              type="button"
              onClick={handleCopyInvite}
              className="px-2 py-0.5 rounded bg-white/[0.06] hover:bg-white/[0.12] text-[10px] text-sky-300 flex items-center gap-1 shrink-0"
            >
              {copiedInvite ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              <span>{copiedInvite ? "복사됨" : "초대"}</span>
            </button>
          </div>

          <div className="space-y-1.5 max-h-44 overflow-y-auto pr-0.5">
            {activeRoom.chats.length === 0 ? (
              <div className="text-center py-4 text-[11px] text-slate-500">
                첫 열공 응원 메시지를 남겨보세요!
              </div>
            ) : (
              activeRoom.chats.map((c) => (
                <div
                  key={c.id}
                  className={`p-2 rounded-xl text-[11px] ${
                    c.isMe
                      ? "bg-[#FF5A36]/15 border border-[#FF5A36]/30 ml-4"
                      : "bg-[#101016] mr-4"
                  }`}
                >
                  <div className="flex items-center justify-between text-[9.5px] text-slate-400">
                    <span className="font-bold text-slate-200">
                      {c.emoji} {c.sender}
                    </span>
                    <span>{c.timeLabel}</span>
                  </div>
                  <div className="text-white mt-0.5">{c.text}</div>
                </div>
              ))
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <input
              type="text"
              value={chatDraft}
              onChange={(e) => setChatDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSendChat();
              }}
              placeholder="동기들에게 한마디 (예: 법규 2회독 끝!)"
              className="flex-1 min-w-0 px-3 py-1.5 rounded-xl bg-[#0D0D12] border border-white/[0.1] text-xs text-white"
            />
            <button
              type="button"
              onClick={handleSendChat}
              className="p-2 rounded-xl bg-[#FF5A36] hover:bg-[#ff6d4d] text-white"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* 그룹 하단 5탭 네비게이션 */}
      <div className="grid grid-cols-5 gap-1 p-1 rounded-2xl bg-[#121218] border border-white/[0.06] text-[10px] font-bold">
        {(
          [
            { id: "home", label: `홈(${joinedRooms.length})`, icon: Home },
            { id: "attendance", label: "출석부", icon: CalendarDays },
            { id: "ranking", label: "랭킹", icon: Trophy },
            { id: "browse", label: "방찾기·개설", icon: Users },
            { id: "chat", label: "채팅", icon: MessageSquare },
          ] as const
        ).map((tab) => {
          const Icon = tab.icon;
          const active = groupTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setGroupTab(tab.id)}
              className={`py-1.5 rounded-xl flex flex-col items-center gap-0.5 transition ${
                active ? "bg-white/[0.1] text-white font-black" : "text-slate-400 hover:text-white"
              }`}
            >
              <Icon className="w-3.5 h-3.5" style={active ? { color: accentHex } : undefined} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 그룹 정보/설정 모달 */}
      {showGroupInfoModal && activeRoom && (
        <div
          className="fixed inset-0 z-[75] bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-3"
          onClick={() => setShowGroupInfoModal(false)}
        >
          <div
            className="w-full max-w-[400px] rounded-3xl bg-[#16161D] border border-white/[0.12] p-4 space-y-3 text-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
              <span className="text-xs font-black flex items-center gap-1.5">
                <Settings className="w-4 h-4 text-[#FF7A59]" />
                <span>그룹 정보 / 설정</span>
              </span>
              <button
                type="button"
                onClick={() => setShowGroupInfoModal(false)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
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
                className="w-full p-3 rounded-2xl bg-[#101016] hover:bg-white/[0.06] flex items-center justify-between transition"
              >
                <span className="font-bold text-white">내 그룹 프로필 (닉네임·스터디콘)</span>
                <span className="text-[11px] font-black text-[#FF8A6B]">
                  {effectiveMyProfile.coneEmoji} {effectiveMyProfile.nickname} ▸
                </span>
              </button>

              <div className="p-3 rounded-2xl bg-[#101016] space-y-2">
                <div className="text-[10px] font-bold text-slate-500">그룹 정보</div>
                <div className="flex justify-between">
                  <span className="text-slate-300">그룹명</span>
                  <span className="font-black text-white">{activeRoom.title}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-300">그룹장</span>
                  <span className="font-bold text-white">{activeRoom.leaderName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-300">가입방식</span>
                  <span className="font-bold text-sky-300">
                    {activeRoom.joinMethod === "approval" ? "승인 후 가입" : "바로가입"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-300">목표시간</span>
                  <span className="font-bold text-[#FF8A6B]">{activeRoom.goalHours}시간</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-300">인원수</span>
                  <span className="font-mono text-white">
                    {activeRoom.memberCount}/{activeRoom.capacity}
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-[#101016] flex items-center justify-between">
                <span className="text-slate-300 flex items-center gap-1.5">
                  <Bell className="w-3.5 h-3.5 text-amber-300" />
                  <span>그룹 챌린지 (목표 달성 +15 PMP)</span>
                </span>
                <span className="text-[10.5px] font-black text-emerald-400">참여중</span>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleCopyInvite}
                  className="flex-1 py-2.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] text-xs font-black flex items-center justify-center gap-1.5"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>{copiedInvite ? "초대 링크 복사 완료" : "그룹 초대 링크 복사"}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    leaveRoom(activeRoom.id);
                    setShowGroupInfoModal(false);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 text-xs font-black"
                >
                  그룹 탈퇴
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 다단계 그룹 만들기 / 방 가입 프로필 설정 위저드 (레퍼런스 6~9) */}
      <StudyGroupCreateWizard
        isOpen={wizardState.open}
        mode={wizardState.mode}
        initialStudyType={wizardState.studyType}
        targetRoomTitle={wizardTargetRoom?.title}
        targetRoomNicknameRule={wizardTargetRoom?.nicknameRule}
        targetRoomPassword={wizardTargetRoom?.password}
        defaultNickname={effectiveMyProfile.nickname}
        defaultConeEmoji={effectiveMyProfile.coneEmoji}
        onClose={() => setWizardState((prev) => ({ ...prev, open: false }))}
        onCreateComplete={(input) => {
          createAndJoinRoom(input);
          setIsAddSlideActive(false);
          setGroupTab("home");
        }}
        onProfileComplete={(profile) => {
          const targetId = wizardState.targetRoomId || activeRoom?.id;
          if (!targetId) return;
          if (wizardState.mode === "join") {
            joinRoomWithProfile(targetId, profile);
          } else {
            updateRoomProfile(targetId, profile);
          }
          setIsAddSlideActive(false);
          setGroupTab("home");
        }}
      />
    </div>
  );
}
