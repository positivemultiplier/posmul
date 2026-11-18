"use client";

import { useMemo, useState } from "react";
import {
  Bell,
  CalendarDays,
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
import {
  INITIAL_STUDY_GROUPS,
  type StudyGroupChatMessage,
  type StudyGroupMemberItem,
  type StudyGroupRoom,
} from "@/data/study-timer-tools";

type GroupSubTab = "home" | "attendance" | "ranking" | "browse" | "chat";

interface YptGroupGridProps {
  myStudySeconds: number;
  myConeEmoji: string;
  myNickname?: string;
  currentSubjectLabel?: string;
  isMeStudying?: boolean;
  hideOthers?: boolean;
  accentHex?: string;
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
  myNickname = "나 (예비소장)",
  currentSubjectLabel = "주택관리 관계법규",
  isMeStudying = true,
  hideOthers = false,
  accentHex = "#FF5A36",
}: YptGroupGridProps) {
  const [rooms, setRooms] = useState<StudyGroupRoom[]>(INITIAL_STUDY_GROUPS);
  const [joinedRoomIds, setJoinedRoomIds] = useState<string[]>([
    "grp-29th-pass",
    "grp-2nd-focus",
  ]);
  const [activeRoomId, setActiveRoomId] = useState<string>("grp-29th-pass");
  const [groupTab, setGroupTab] = useState<GroupSubTab>("home");

  // 출석부 · 랭킹 · 찾기 필터
  const [attendanceWeekOffset, setAttendanceWeekOffset] = useState(0);
  const [rankPeriod, setRankPeriod] = useState<"day" | "week">("day");
  const [browseFilter, setBrowseFilter] = useState<{
    onlyCert: boolean;
    onlyVacant: boolean;
    onlyPublic: boolean;
    query: string;
  }>({ onlyCert: true, onlyVacant: false, onlyPublic: false, query: "" });

  // 그룹 정보 설정 모달 · 그룹 만들기 모달 · 초대 복사 피드백 · 채팅 입력
  const [showGroupInfoModal, setShowGroupInfoModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newRoomTitle, setNewRoomTitle] = useState("");
  const [newRoomGoal, setNewRoomGoal] = useState(4);
  const [newRoomNotice, setNewRoomNotice] = useState("");
  const [copiedInvite, setCopiedInvite] = useState(false);
  const [chatDraft, setChatDraft] = useState("");

  const activeRoom = useMemo(
    () => rooms.find((r) => r.id === activeRoomId) || rooms[0],
    [rooms, activeRoomId]
  );

  // '나'를 포함한 현재 방 멤버 목록
  const mergedMembers: StudyGroupMemberItem[] = useMemo(() => {
    if (!activeRoom) return [];
    const meItem: StudyGroupMemberItem = {
      id: "me",
      nickname: myNickname,
      emoji: myConeEmoji,
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
    return [...others.slice(0, 11), meItem];
  }, [activeRoom, myNickname, myConeEmoji, myStudySeconds, isMeStudying, currentSubjectLabel]);

  const studyingCount = mergedMembers.filter((m) => m.isStudying).length;

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

  const handleSendChat = () => {
    const clean = chatDraft.trim();
    if (!clean || !activeRoom) return;
    const msg: StudyGroupChatMessage = {
      id: `chat-${Date.now()}`,
      sender: myNickname,
      emoji: myConeEmoji,
      text: clean,
      timeLabel: new Date().toTimeString().slice(0, 5),
      isMe: true,
    };
    setRooms((prev) =>
      prev.map((r) => (r.id === activeRoom.id ? { ...r, chats: [...r.chats, msg] } : r))
    );
    setChatDraft("");
  };

  const handleCreateRoom = () => {
    const title = newRoomTitle.trim();
    if (!title) return;
    const newId = `grp-custom-${Date.now()}`;
    const created: StudyGroupRoom = {
      id: newId,
      title,
      category: "자격증",
      notice: newRoomNotice.trim() || "오늘도 주택관리사 합격을 향해 집중!",
      leaderName: myNickname,
      goalHours: newRoomGoal,
      capacity: 30,
      memberCount: 1,
      attendancePct: 100,
      isPublic: true,
      createdLabel: "오늘 개설",
      members: [],
      chats: [],
    };
    setRooms((prev) => [created, ...prev]);
    setJoinedRoomIds((prev) => [newId, ...prev]);
    setActiveRoomId(newId);
    setShowCreateModal(false);
    setNewRoomTitle("");
    setNewRoomNotice("");
    setGroupTab("home");
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

  const browseRooms = useMemo(() => {
    return rooms.filter((r) => {
      if (browseFilter.onlyCert && r.category !== "자격증") return false;
      if (browseFilter.onlyVacant && r.memberCount >= r.capacity) return false;
      if (browseFilter.onlyPublic && !r.isPublic) return false;
      if (
        browseFilter.query.trim() &&
        !r.title.toLowerCase().includes(browseFilter.query.trim().toLowerCase())
      ) {
        return false;
      }
      return true;
    });
  }, [rooms, browseFilter]);

  if (!activeRoom) return null;

  return (
    <div className="space-y-2.5">
      {/* 그룹 헤더 카드 (레퍼런스 이미지 3, 7) */}
      <div className="p-3 rounded-2xl bg-[#16161D] border border-white/[0.08] space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <button
              type="button"
              onClick={() => setGroupTab("browse")}
              className="text-sm font-black text-white truncate flex items-center gap-1 hover:text-[#FF8A6B] transition max-w-full"
              title="내 가입 그룹 전환 또는 새 그룹 찾기"
            >
              <span className="truncate">{activeRoom.title}</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            </button>
            <div className="flex items-center gap-2 text-[10.5px] text-slate-400 mt-0.5">
              <span className="font-bold flex items-center gap-1" style={{ color: accentHex }}>
                <Flame className="w-3 h-3 fill-current" />
                <span>{studyingCount}명 공부중</span>
              </span>
              <span>·</span>
              <span className="text-amber-300 font-bold">
                내 순위 {myRank}위 / {mergedMembers.length}명
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowGroupInfoModal(true)}
            className="p-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-slate-300 shrink-0"
            title="그룹 정보 · 설정"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>

        {/* 공지 / 규칙 바 */}
        <div className="px-2.5 py-1.5 rounded-xl bg-[#0E0E13] border border-white/[0.06] text-[10.5px] text-slate-300 flex items-center gap-1.5">
          <span className="px-1.5 py-0.2 rounded bg-[#FF5A36]/20 text-[#FF8A6B] text-[9px] font-black shrink-0">
            규칙
          </span>
          <span className="truncate">{activeRoom.notice}</span>
        </div>
      </div>

      {/* 1. 홈(열공방 4열 책상 그리드) — 레퍼런스 이미지 3 & 7 */}
      {groupTab === "home" && (
        <div className="grid grid-cols-4 gap-1.5">
          {mergedMembers.map((member) => {
            const isMasked = hideOthers && !member.isMe;
            const studying = member.isStudying && !isMasked;

            return (
              <div
                key={member.id}
                className={`rounded-xl px-1.5 py-2.5 flex flex-col items-center text-center transition relative ${
                  member.isMe
                    ? "bg-[#1A1617] border shadow-md"
                    : studying
                      ? "bg-[#16151B] border border-white/[0.08]"
                      : "bg-[#121217] border border-white/[0.04] opacity-70"
                }`}
                style={
                  member.isMe
                    ? { borderColor: accentHex, boxShadow: `0 0 18px ${accentHex}26` }
                    : undefined
                }
              >
                {/* 책상 + 램프 / 공부중 스터디콘 캐릭터 */}
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

                {/* 닉네임 */}
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

                {/* 공부 시간 */}
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
      )}

      {/* 2. 출석부 (요일별 히트맵 블록) — 레퍼런스 이미지 5 */}
      {groupTab === "attendance" && (
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
                ? "이번 주 출석부 (공부시간)"
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
              그룹 출석률{" "}
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

      {/* 3. 랭킹 (일간/주간 순위 & 오렌지 게이지 바) — 레퍼런스 이미지 4 */}
      {groupTab === "ranking" && (
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

      {/* 4. 내 가입 그룹 & 스터디 그룹 탐색/개설 — 레퍼런스 이미지 8 & 9 */}
      {groupTab === "browse" && (
        <div className="p-3 rounded-2xl bg-[#16161D] border border-white/[0.08] space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-white">내 그룹 · 스터디방 찾기</span>
            <button
              type="button"
              onClick={() => setShowCreateModal(true)}
              className="px-2.5 py-1 rounded-lg bg-[#FF5A36] hover:bg-[#ff6d4d] text-white text-[10.5px] font-black flex items-center gap-1"
            >
              <Plus className="w-3 h-3" />
              <span>방 만들기</span>
            </button>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <div className="relative flex-1 min-w-[140px]">
              <Search className="w-3 h-3 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={browseFilter.query}
                onChange={(e) =>
                  setBrowseFilter((prev) => ({ ...prev, query: e.target.value }))
                }
                placeholder="그룹명 검색..."
                className="w-full pl-7 pr-2.5 py-1 rounded-lg bg-[#0D0D12] border border-white/[0.08] text-[10.5px] text-white"
              />
            </div>
            <button
              type="button"
              onClick={() =>
                setBrowseFilter((p) => ({ ...p, onlyCert: !p.onlyCert }))
              }
              className={`px-2 py-1 rounded-lg text-[10px] font-bold border ${
                browseFilter.onlyCert
                  ? "bg-[#FF5A36]/20 border-[#FF5A36] text-[#FF8A6B]"
                  : "bg-white/[0.04] border-white/[0.08] text-slate-400"
              }`}
            >
              자격증
            </button>
            <button
              type="button"
              onClick={() =>
                setBrowseFilter((p) => ({ ...p, onlyVacant: !p.onlyVacant }))
              }
              className={`px-2 py-1 rounded-lg text-[10px] font-bold border ${
                browseFilter.onlyVacant
                  ? "bg-sky-500/20 border-sky-400 text-sky-200"
                  : "bg-white/[0.04] border-white/[0.08] text-slate-400"
              }`}
            >
              빈자리
            </button>
          </div>

          <div className="space-y-1.5 max-h-48 overflow-y-auto">
            {browseRooms.map((r) => {
              const isJoined = joinedRoomIds.includes(r.id);
              const isSelected = r.id === activeRoom.id;
              return (
                <div
                  key={r.id}
                  className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 ${
                    isSelected
                      ? "bg-[#FF5A36]/12 border-[#FF5A36]"
                      : "bg-[#101016] border-white/[0.07]"
                  }`}
                >
                  <div className="min-w-0">
                    <div className="text-[11px] font-black text-white truncate flex items-center gap-1">
                      {!r.isPublic && <Lock className="w-3 h-3 text-amber-400 shrink-0" />}
                      <span className="truncate">{r.title}</span>
                    </div>
                    <div className="text-[9.5px] text-slate-400 mt-0.5">
                      {r.category} · 목표 {r.goalHours}h · {r.memberCount}/{r.capacity}명 · 출석{" "}
                      {r.attendancePct}%
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (!isJoined) {
                        setJoinedRoomIds((p) => [...p, r.id]);
                      }
                      setActiveRoomId(r.id);
                      setGroupTab("home");
                    }}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-black shrink-0 ${
                      isSelected
                        ? "bg-emerald-500/20 text-emerald-300"
                        : isJoined
                          ? "bg-white/[0.08] text-white"
                          : "bg-[#FF5A36] text-white"
                    }`}
                  >
                    {isSelected ? "입장중" : isJoined ? "이동" : "가입·입장"}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 5. 그룹 열공 응원 채팅 — 레퍼런스 이미지 7 하단 '채팅' */}
      {groupTab === "chat" && (
        <div className="p-3 rounded-2xl bg-[#16161D] border border-white/[0.08] space-y-2.5">
          <div className="flex items-center justify-between text-[11px] font-black text-white">
            <span>실시간 열공 응원 채팅</span>
            <button
              type="button"
              onClick={handleCopyInvite}
              className="px-2 py-0.5 rounded bg-white/[0.06] hover:bg-white/[0.12] text-[10px] text-sky-300 flex items-center gap-1"
            >
              {copiedInvite ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              <span>{copiedInvite ? "복사됨" : "그룹 초대"}</span>
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

      {/* 그룹 하단 5탭 네비게이션 (레퍼런스 이미지 4, 5, 7: 홈 · 출석부 · 랭킹 · 찾기/초대 · 채팅) */}
      <div className="grid grid-cols-5 gap-1 p-1 rounded-2xl bg-[#121218] border border-white/[0.06] text-[10px] font-bold">
        {(
          [
            { id: "home", label: "홈", icon: Home },
            { id: "attendance", label: "출석부", icon: CalendarDays },
            { id: "ranking", label: "랭킹", icon: Trophy },
            { id: "browse", label: "그룹·초대", icon: Users },
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

      {/* 그룹 정보/설정 모달 (레퍼런스 이미지 6) */}
      {showGroupInfoModal && (
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
                  <span className="text-slate-300">카테고리</span>
                  <span className="font-bold text-sky-300">{activeRoom.category}</span>
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
                    setJoinedRoomIds((p) => p.filter((id) => id !== activeRoom.id));
                    const nextRoom = rooms.find((r) => r.id !== activeRoom.id);
                    if (nextRoom) setActiveRoomId(nextRoom.id);
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

      {/* 새 그룹 방 만들기 모달 */}
      {showCreateModal && (
        <div
          className="fixed inset-0 z-[75] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowCreateModal(false)}
        >
          <div
            className="w-full max-w-[380px] rounded-3xl bg-[#16161D] border border-white/[0.12] p-4 space-y-3 text-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-black">새 열공 스터디방 만들기</span>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <input
              type="text"
              value={newRoomTitle}
              onChange={(e) => setNewRoomTitle(e.target.value)}
              placeholder="방 이름 (예: 주택관리사 새벽 5시 기상방)"
              className="w-full px-3 py-2 rounded-xl bg-[#0D0D12] border border-white/[0.1] text-xs text-white"
            />
            <input
              type="text"
              value={newRoomNotice}
              onChange={(e) => setNewRoomNotice(e.target.value)}
              placeholder="공지·규칙 (예: 매일 4시간 이상 출석!)"
              className="w-full px-3 py-2 rounded-xl bg-[#0D0D12] border border-white/[0.1] text-xs text-white"
            />
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 font-bold">하루 목표시간</span>
              <div className="flex items-center gap-1">
                {[2, 4, 6, 8].map((h) => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => setNewRoomGoal(h)}
                    className={`px-2.5 py-1 rounded-lg font-black ${
                      newRoomGoal === h
                        ? "bg-[#FF5A36] text-white"
                        : "bg-white/[0.06] text-slate-300"
                    }`}
                  >
                    {h}h
                  </button>
                ))}
              </div>
            </div>
            <button
              type="button"
              onClick={handleCreateRoom}
              disabled={!newRoomTitle.trim()}
              className="w-full py-2.5 rounded-xl bg-[#FF5A36] hover:bg-[#ff6d4d] disabled:opacity-40 text-white text-xs font-black"
            >
              스터디방 개설 및 입장
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
