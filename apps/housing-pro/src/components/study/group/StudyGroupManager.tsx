"use client";

import { useMemo, useState } from "react";
import { Check, LogOut, Plus, Send, Users } from "lucide-react";
import { useStudyGroupsStore } from "@/lib/study-groups-store";
import {
  formatShortClock,
  getMemberInitials,
  getMutedSubjectColor,
} from "@/lib/study-theme";

interface StudyGroupManagerProps {
  myStudySeconds: number;
  myNickname: string;
  currentSubjectLabel: string;
}

type GroupView = "room" | "rank" | "browse";

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
    setActiveRoomId,
    createAndJoinRoom,
    joinRoomWithProfile,
    leaveRoom,
    addGroupChat,
  } = useStudyGroupsStore();

  const [view, setView] = useState<GroupView>("room");
  const [rankPeriod, setRankPeriod] = useState<"day" | "week">("day");
  const [chatDraft, setChatDraft] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newRoomTitle, setNewRoomTitle] = useState("");
  const [newRoomGoal, setNewRoomGoal] = useState(6);
  const [newRoomNotice, setNewRoomNotice] = useState("");
  const [confirmLeaveRoom, setConfirmLeaveRoom] = useState<{ id: string; title: string } | null>(
    null
  );

  const activeRoom = useMemo(() => {
    const found = joinedRooms.find((r) => r.id === activeRoomId);
    return found || joinedRooms[0] || rooms[0] || null;
  }, [joinedRooms, rooms, activeRoomId]);

  const seats = useMemo(() => {
    if (!activeRoom) return [];
    const me = {
      id: "me",
      nickname: myNickname,
      subject: currentSubjectLabel,
      color: getMutedSubjectColor(currentSubjectLabel),
      todaySeconds: myStudySeconds,
      weeklySeconds: Math.max(myStudySeconds, myStudySeconds * 3),
      isStudying: false,
      isMe: true,
    };
    const others = activeRoom.members
      .filter((m) => !m.isMe)
      .slice(0, 11)
      .map((m, idx) => ({
        id: m.id,
        nickname: m.nickname,
        subject: m.subject || "자습",
        color: getMutedSubjectColor(m.subject || "", undefined, idx + 1),
        todaySeconds: m.todaySeconds,
        weeklySeconds: m.weeklySeconds.reduce((s, v) => s + v, 0),
        isStudying: m.isStudying,
        isMe: false,
      }));
    return [me, ...others];
  }, [activeRoom, myNickname, currentSubjectLabel, myStudySeconds]);

  const rankedSeats = useMemo(() => {
    return [...seats].sort((a, b) => {
      const aVal = rankPeriod === "day" ? a.todaySeconds : a.weeklySeconds;
      const bVal = rankPeriod === "day" ? b.todaySeconds : b.weeklySeconds;
      return bVal - aVal;
    });
  }, [seats, rankPeriod]);

  const handleCreateRoom = () => {
    const clean = newRoomTitle.trim();
    if (!clean) return;
    createAndJoinRoom({
      title: clean,
      category: "주택관리사",
      goalHours: newRoomGoal,
      capacity: 30,
      notice: newRoomNotice.trim() || "오늘 목표 순공시간 함께 달성합시다.",
      studyType: "general",
      joinMethod: "instant",
      myNickname,
      myConeEmoji: "",
    });
    setNewRoomTitle("");
    setNewRoomNotice("");
    setShowCreateForm(false);
    setView("room");
  };

  const handleSendChat = () => {
    const clean = chatDraft.trim();
    if (!clean || !activeRoom) return;
    addGroupChat(activeRoom.id, {
      id: `chat-${Date.now()}`,
      sender: myNickname,
      emoji: "",
      text: clean,
      timeLabel: new Date().toTimeString().slice(0, 5),
      isMe: true,
    });
    setChatDraft("");
  };

  return (
    <div className="space-y-4">
      {/* 가입된 스터디방 전환 바 */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {joinedRooms.map((room) => {
            const selected = room.id === activeRoom?.id;
            return (
              <button
                key={room.id}
                type="button"
                onClick={() => {
                  setActiveRoomId(room.id);
                  setView("room");
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
          onClick={() => setShowCreateForm((prev) => !prev)}
          className="h-8 px-2.5 rounded-lg border border-[var(--hp-border-strong)] text-xs text-[var(--hp-text)] flex items-center gap-1 shrink-0 hover:bg-[var(--hp-surface)] transition"
        >
          <Plus className="w-3.5 h-3.5 stroke-[1.75]" />
          <span>개설</span>
        </button>
      </div>

      {/* 새 그룹 만들기 인라인 폼 */}
      {showCreateForm && (
        <div className="p-3.5 rounded-xl bg-[var(--hp-surface)] border border-[var(--hp-border-strong)] space-y-2.5">
          <div className="text-xs font-medium">새 스터디 그룹 개설</div>
          <input
            type="text"
            value={newRoomTitle}
            onChange={(e) => setNewRoomTitle(e.target.value)}
            placeholder="그룹명 (예: 제29회 동차 6시간 열공방)"
            className="w-full h-9 px-3 rounded-lg bg-[var(--hp-bg)] border border-[var(--hp-border)] text-xs text-[var(--hp-text)] placeholder:text-[var(--hp-text-3)] outline-none"
          />
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newRoomNotice}
              onChange={(e) => setNewRoomNotice(e.target.value)}
              placeholder="한 줄 공지 (선택)"
              className="flex-1 h-9 px-3 rounded-lg bg-[var(--hp-bg)] border border-[var(--hp-border)] text-xs text-[var(--hp-text)] placeholder:text-[var(--hp-text-3)] outline-none"
            />
            <select
              value={newRoomGoal}
              onChange={(e) => setNewRoomGoal(Number(e.target.value))}
              className="h-9 px-2 rounded-lg bg-[var(--hp-bg)] border border-[var(--hp-border)] text-xs hp-tabular text-[var(--hp-text)]"
            >
              {[2, 4, 6, 8, 10].map((h) => (
                <option key={h} value={h}>
                  목표 {h}h
                </option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowCreateForm(false)}
              className="px-3 py-1.5 rounded-lg border border-[var(--hp-border)] text-xs text-[var(--hp-text-2)]"
            >
              취소
            </button>
            <button
              type="button"
              onClick={handleCreateRoom}
              disabled={!newRoomTitle.trim()}
              className="px-3.5 py-1.5 rounded-lg bg-[var(--hp-accent)] text-[var(--hp-accent-fg)] text-xs font-medium disabled:opacity-40"
            >
              만들기
            </button>
          </div>
        </div>
      )}

      {/* 서브 탭: 좌석·채팅 | 랭킹 | 그룹 찾기 */}
      <div className="grid grid-cols-3 gap-1 p-0.5 rounded-lg bg-[var(--hp-surface)] border border-[var(--hp-border)] text-xs">
        {(
          [
            { id: "room", label: "좌석 · 대화" },
            { id: "rank", label: "순위" },
            { id: "browse", label: "그룹 찾기" },
          ] as const
        ).map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setView(item.id)}
            className={`py-1.5 rounded-md font-medium transition ${
              view === item.id
                ? "bg-[var(--hp-surface-2)] text-[var(--hp-text)]"
                : "text-[var(--hp-text-3)] hover:text-[var(--hp-text-2)]"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* 1. 좌석 & 대화 */}
      {view === "room" && activeRoom && (
        <div className="space-y-4">
          <div className="p-3.5 rounded-xl bg-[var(--hp-surface)] border border-[var(--hp-border)] flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="text-xs font-medium text-[var(--hp-text)]">{activeRoom.title}</div>
              <p className="text-[11px] text-[var(--hp-text-2)] mt-1 leading-relaxed">
                {activeRoom.notice}
              </p>
              <div className="text-[11px] hp-tabular text-[var(--hp-text-3)] mt-1.5">
                일일 목표 {activeRoom.goalHours}h · 인원 {activeRoom.memberCount}/{activeRoom.capacity}
              </div>
            </div>
            {joinedRoomIds.length > 1 && (
              <button
                type="button"
                onClick={() =>
                  setConfirmLeaveRoom({ id: activeRoom.id, title: activeRoom.title })
                }
                className="p-1.5 rounded-lg border border-[var(--hp-border)] text-[var(--hp-text-3)] hover:text-[var(--hp-danger)] shrink-0"
                title="이 그룹 탈퇴"
                aria-label="이 그룹 탈퇴"
              >
                <LogOut className="w-3.5 h-3.5 stroke-[1.5]" />
              </button>
            )}
          </div>

          <div className="grid grid-cols-3 gap-2">
            {seats.map((seat) => (
              <div
                key={seat.id}
                className={`p-3 rounded-xl border flex flex-col items-center text-center ${
                  seat.isMe
                    ? "bg-[var(--hp-surface-2)] border-[var(--hp-border-strong)]"
                    : "bg-[var(--hp-surface)] border-[var(--hp-border)]"
                } ${seat.isStudying ? "" : "opacity-65"}`}
              >
                <div className="relative">
                  <div
                    className="w-9 h-9 rounded-full border bg-[var(--hp-bg)] flex items-center justify-center text-xs font-medium"
                    style={{
                      borderColor: seat.isStudying ? seat.color : "var(--hp-border)",
                    }}
                  >
                    {getMemberInitials(seat.nickname)}
                  </div>
                  <span
                    className="absolute -right-0.5 -bottom-0.5 w-2.5 h-2.5 rounded-full border-2 border-[var(--hp-surface)]"
                    style={{
                      backgroundColor: seat.isStudying ? seat.color : "var(--hp-text-3)",
                    }}
                  />
                </div>
                <div className="mt-2 text-xs font-medium truncate w-full">
                  {seat.isMe ? `${seat.nickname} (나)` : seat.nickname}
                </div>
                <div className="text-[10px] text-[var(--hp-text-3)] truncate w-full">
                  {seat.isStudying ? seat.subject : "휴식"}
                </div>
                <div className="mt-1 text-[11px] hp-tabular text-[var(--hp-text-2)]">
                  {formatShortClock(seat.todaySeconds)}
                </div>
              </div>
            ))}
          </div>

          {/* 간단한 그룹 한 줄 대화 */}
          <div className="p-3.5 rounded-xl bg-[var(--hp-surface)] border border-[var(--hp-border)] space-y-2.5">
            <div className="text-[11px] font-medium text-[var(--hp-text-3)]">그룹 대화</div>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {(activeRoom.chats || []).slice(-6).map((c) => (
                <div key={c.id} className="text-xs flex items-baseline justify-between gap-2">
                  <div className="min-w-0">
                    <span className="font-medium text-[var(--hp-text)] mr-1.5">{c.sender}</span>
                    <span className="text-[var(--hp-text-2)] break-words">{c.text}</span>
                  </div>
                  <span className="text-[10px] hp-tabular text-[var(--hp-text-3)] shrink-0">
                    {c.timeLabel}
                  </span>
                </div>
              ))}
              {(!activeRoom.chats || activeRoom.chats.length === 0) && (
                <div className="text-xs text-[var(--hp-text-3)]">
                  첫 응원 메시지를 남겨보세요.
                </div>
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
                placeholder="한 줄 메시지 입력..."
                className="flex-1 h-8 px-2.5 rounded-lg bg-[var(--hp-bg)] border border-[var(--hp-border)] text-xs text-[var(--hp-text)] placeholder:text-[var(--hp-text-3)] outline-none"
              />
              <button
                type="submit"
                disabled={!chatDraft.trim()}
                className="h-8 px-3 rounded-lg bg-[var(--hp-accent)] text-[var(--hp-accent-fg)] text-xs disabled:opacity-40 flex items-center justify-center"
                aria-label="전송"
              >
                <Send className="w-3.5 h-3.5 stroke-[1.75]" />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 2. 그룹 순위 */}
      {view === "rank" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[var(--hp-text-2)]">그룹 순공 순위</span>
            <div className="flex items-center gap-1 text-xs">
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

          <ul className="divide-y divide-[var(--hp-border)] border-y border-[var(--hp-border)]">
            {rankedSeats.map((s, idx) => {
              const sec = rankPeriod === "day" ? s.todaySeconds : s.weeklySeconds;
              return (
                <li key={s.id} className="py-3 flex items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-5 text-[var(--hp-text-3)] hp-tabular">{idx + 1}</span>
                    <span className={s.isMe ? "font-semibold text-[var(--hp-text)]" : "text-[var(--hp-text)]"}>
                      {s.isMe ? `${s.nickname} (나)` : s.nickname}
                    </span>
                  </div>
                  <span className="hp-tabular text-[var(--hp-text-2)]">{formatShortClock(sec)}</span>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* 3. 전체 그룹 찾기 */}
      {view === "browse" && (
        <ul className="divide-y divide-[var(--hp-border)] border-y border-[var(--hp-border)]">
          {rooms.map((room) => {
            const joined = joinedRoomIds.includes(room.id);
            return (
              <li key={room.id} className="py-3.5 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm font-medium text-[var(--hp-text)] truncate">
                    {room.title}
                  </div>
                  <div className="text-[11px] text-[var(--hp-text-3)] mt-0.5 hp-tabular flex items-center gap-1.5">
                    <Users className="w-3 h-3 stroke-[1.5]" />
                    <span>
                      {room.memberCount}/{room.capacity} · 목표 {room.goalHours}h · 출석{" "}
                      {room.attendancePct}%
                    </span>
                  </div>
                </div>

                {joined ? (
                  <button
                    type="button"
                    onClick={() => {
                      setActiveRoomId(room.id);
                      setView("room");
                    }}
                    className="px-2.5 py-1 rounded-md border border-[var(--hp-border-strong)] text-xs text-[var(--hp-text-2)] flex items-center gap-1 shrink-0"
                  >
                    <Check className="w-3 h-3 stroke-[1.75]" />
                    <span>참여중</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      joinRoomWithProfile(room.id, { nickname: myNickname, coneEmoji: "" });
                      setView("room");
                    }}
                    className="px-3 py-1 rounded-md bg-[var(--hp-accent)] text-[var(--hp-accent-fg)] text-xs font-medium shrink-0"
                  >
                    참여
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {/* 스터디 그룹 탈퇴 확인 모달 (실수 방지) */}
      {confirmLeaveRoom && (
        <div
          className="fixed inset-0 z-[85] bg-[var(--hp-overlay)] backdrop-blur-sm flex items-center justify-center p-4"
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
                &apos;{confirmLeaveRoom.title}&apos; 그룹에서 정말 탈퇴하시겠습니까? 언제든 그룹
                찾기에서 다시 참여할 수 있습니다.
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
                }}
                className="h-9 rounded-lg bg-[var(--hp-danger)] text-white text-xs font-medium hover:opacity-90 transition"
              >
                탈퇴하기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
