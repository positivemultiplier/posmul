"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Users,
  Send,
  Trophy,
  ShieldCheck,
  Sparkles,
  Lock,
  Clock,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { LIVE_ROOMS, LiveEventRoom, getLiveRoomEffectiveStatus } from "../live-rooms.data";
import {
  getRecentLiveMessagesAction,
  saveLiveMessageBufferAction,
  getLiveRoomDetailAction,
} from "../actions/live.actions";

interface ChatMessage {
  id: string;
  sender: string;
  teamTag?: string;
  teamColor?: string;
  message: string;
  time: string;
  isReaction?: boolean;
}

export default function LiveRoomPage() {
  const params = useParams();
  const roomId = params.roomId as string;
  const initialRoom = LIVE_ROOMS.find((r) => r.id === roomId) || LIVE_ROOMS[0];

  const [roomData, setRoomData] = useState<LiveEventRoom>(initialRoom);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [myTeam, setMyTeam] = useState<"A" | "B">("A");
  const [onlineCount, setOnlineCount] = useState<number>(initialRoom.viewerCount);
  const [lastSentAt, setLastSentAt] = useState<number>(0); // 0.8초 쿨다운 도배 방지
  const [timeLeftStr, setTimeLeftStr] = useState<string>("");
  const [effectiveStatus, setEffectiveStatus] = useState<"LIVE" | "UPCOMING" | "CLOSED" | "ENDED">(
    getLiveRoomEffectiveStatus(initialRoom)
  );

  const [voteStats, setVoteStats] = useState({
    ratioA: initialRoom.predictionGame?.optionA.ratio || 60,
    ratioB: initialRoom.predictionGame?.optionB.ratio || 40,
    countA: initialRoom.predictionGame?.optionA.count || 890,
    countB: initialRoom.predictionGame?.optionB.count || 580,
  });

  const chatScrollRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<any>(null);

  // 1. 방 최신 상태 DB 동기화
  useEffect(() => {
    getLiveRoomDetailAction(roomId).then((res) => {
      if (res.success && res.room) {
        setRoomData(res.room);
        setEffectiveStatus(getLiveRoomEffectiveStatus(res.room));
        if (res.room.predictionGame) {
          setVoteStats({
            ratioA: res.room.predictionGame.optionA.ratio,
            ratioB: res.room.predictionGame.optionB.ratio,
            countA: res.room.predictionGame.optionA.count,
            countB: res.room.predictionGame.optionB.count,
          });
        }
      }
    });
  }, [roomId]);

  // 2. 실시간 마감 시간(registrationEnd) 카운트다운 및 도래 시 자동 닫기 타이머 (1초 주기)
  useEffect(() => {
    const checkDeadline = () => {
      const currentEff = getLiveRoomEffectiveStatus(roomData);
      setEffectiveStatus(currentEff);

      if (currentEff === "ENDED") {
        setTimeLeftStr("정산 완료");
        return;
      }

      if (!roomData.registrationEnd) {
        setTimeLeftStr(currentEff === "CLOSED" ? "마감 완료" : "실시간 진행중");
        return;
      }

      const endMs = new Date(roomData.registrationEnd).getTime();
      const nowMs = Date.now();
      const diffMs = endMs - nowMs;

      if (diffMs <= 0 || currentEff === "CLOSED") {
        setTimeLeftStr("마감 시간 경과 (종료)");
        setEffectiveStatus("CLOSED");
        return;
      }

      // 남은 시간 계산
      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const secs = Math.floor((diffMs % (1000 * 60)) / 1000);

      if (hours > 24) {
        const days = Math.floor(hours / 24);
        const remHours = hours % 24;
        setTimeLeftStr(`마감까지 ${days}일 ${remHours}시간 남음`);
      } else {
        setTimeLeftStr(
          `마감까지 ${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`
        );
      }
    };

    checkDeadline();
    const timer = setInterval(checkDeadline, 1000);
    return () => clearInterval(timer);
  }, [roomData]);

  const isClosed = effectiveStatus === "CLOSED";
  const isEnded = effectiveStatus === "ENDED";
  const isClosedOrEnded = isClosed || isEnded;

  // 3. 방 입장 시 최근 30개 대화 버퍼 불러오기
  useEffect(() => {
    getRecentLiveMessagesAction(roomId).then((res) => {
      if (res.success && res.messages.length > 0) {
        setMessages(res.messages);
      } else if (roomData.initialMessages && roomData.initialMessages.length > 0) {
        setMessages(roomData.initialMessages);
      } else {
        setMessages([
          {
            id: "init-1",
            sender: "시민응원단",
            teamTag: roomData.predictionGame?.optionA.label || "A팀",
            teamColor: "bg-sky-500/20 text-sky-300 border-sky-400/40",
            message: "실시간 라이브 응원톡에 오신 것을 환영합니다! 함께 응원해요 🔥",
            time: "방금",
          },
        ]);
      }
    });
  }, [
    roomId,
    roomData.initialMessages,
    roomData.predictionGame?.optionA.label,
    roomData.predictionGame?.optionB.label,
  ]);

  // 4. Supabase Realtime Broadcast 채널 연결
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase.channel(`live-room-${roomId}`, {
      config: {
        broadcast: { self: false },
        presence: { key: `user-${Math.random().toString(36).substring(7)}` },
      },
    });

    channel
      .on("broadcast", { event: "chat_message" }, ({ payload }) => {
        setMessages((prev) => [...prev.slice(-100), payload]);
      })
      .on("broadcast", { event: "live_vote" }, ({ payload }) => {
        setVoteStats((prev) => {
          const newA = payload.team === "A" ? prev.countA + 1 : prev.countA;
          const newB = payload.team === "B" ? prev.countB + 1 : prev.countB;
          const total = newA + newB;
          return {
            countA: newA,
            countB: newB,
            ratioA: Math.round((newA / total) * 100),
            ratioB: 100 - Math.round((newA / total) * 100),
          };
        });
      })
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        const connectedUsers = Object.keys(state).length;
        setOnlineCount(roomData.viewerCount + connectedUsers);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({ online_at: new Date().toISOString() });
        }
      });

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId, roomData.viewerCount]);

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages]);

  // 5. 메시지 전송 (마감 또는 정산 완료 시 전송 차단)
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isClosedOrEnded) {
      alert("해당 라이브 이벤트는 마감 또는 정산이 완료되어 새로운 메시지를 작성할 수 없습니다.");
      return;
    }

    if (!inputMessage.trim()) return;

    const now = Date.now();
    if (now - lastSentAt < 800) {
      return;
    }
    setLastSentAt(now);

    const teamLabel =
      myTeam === "A"
        ? roomData.predictionGame?.optionA.label || "A팀"
        : roomData.predictionGame?.optionB.label || "B팀";
    const teamColor =
      myTeam === "A"
        ? "bg-sky-500/20 text-sky-300 border-sky-400/40"
        : "bg-rose-500/20 text-rose-300 border-rose-400/40";

    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}-${Math.random()}`,
      sender: "나(시민)",
      teamTag: teamLabel,
      teamColor,
      message: inputMessage.trim(),
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev.slice(-100), newMsg]);
    setInputMessage("");

    if (channelRef.current) {
      channelRef.current.send({
        type: "broadcast",
        event: "chat_message",
        payload: newMsg,
      });
    }

    saveLiveMessageBufferAction({
      roomId,
      sender: newMsg.sender,
      teamTag: newMsg.teamTag,
      teamColor: newMsg.teamColor,
      message: newMsg.message,
    });
  };

  // 6. 퀵 리액션 (마감 시 차단)
  const sendQuickReaction = async (emoji: string) => {
    if (isClosedOrEnded) return;

    const teamLabel =
      myTeam === "A"
        ? roomData.predictionGame?.optionA.label || "A팀"
        : roomData.predictionGame?.optionB.label || "B팀";
    const teamColor =
      myTeam === "A"
        ? "bg-sky-500/20 text-sky-300 border-sky-400/40"
        : "bg-rose-500/20 text-rose-300 border-rose-400/40";

    const newMsg: ChatMessage = {
      id: `rx-${Date.now()}-${Math.random()}`,
      sender: "나(시민)",
      teamTag: teamLabel,
      teamColor,
      message: emoji.repeat(3),
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      isReaction: true,
    };

    setMessages((prev) => [...prev.slice(-100), newMsg]);

    if (channelRef.current) {
      channelRef.current.send({
        type: "broadcast",
        event: "chat_message",
        payload: newMsg,
      });
    }
  };

  // 7. 응원 투표 (마감 시 차단)
  const handleLiveVote = async (team: "A" | "B") => {
    if (isClosedOrEnded) return;

    setMyTeam(team);
    setVoteStats((prev) => {
      const newA = team === "A" ? prev.countA + 1 : prev.countA;
      const newB = team === "B" ? prev.countB + 1 : prev.countB;
      const total = newA + newB;
      return {
        countA: newA,
        countB: newB,
        ratioA: Math.round((newA / total) * 100),
        ratioB: 100 - Math.round((newA / total) * 100),
      };
    });

    if (channelRef.current) {
      channelRef.current.send({
        type: "broadcast",
        event: "live_vote",
        payload: { team },
      });
    }
  };

  const formattedDeadline = roomData.registrationEnd
    ? new Date(roomData.registrationEnd).toLocaleString([], {
        year: "numeric",
        month: "numeric",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col">
      {/* 1. 상단 라이브 헤더 바 */}
      <header className="bg-[#111520] border-b border-white/[0.08] px-4 py-3 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/live"
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                {!isClosedOrEnded ? (
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/40 text-[10px] font-black">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                    LIVE
                  </span>
                ) : isEnded ? (
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[10px] font-black">
                    <Trophy className="w-3 h-3 text-emerald-400" />
                    정산완료
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-black">
                    <Lock className="w-3 h-3 text-amber-400" />
                    마감됨
                  </span>
                )}
                <span className="text-xs font-bold text-slate-400">
                  {roomData.categoryLabel}
                </span>
                <span className="hidden sm:inline-block text-[11px] font-mono text-slate-400">
                  · {timeLeftStr}
                </span>
              </div>
              <h1 className="text-sm sm:text-base font-black text-white truncate max-w-xs sm:max-w-md">
                {roomData.title}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-white/[0.08] text-xs font-bold text-slate-300">
              <Users className="w-3.5 h-3.5 text-red-400" />
              <span>{onlineCount.toLocaleString()}명 접속 중</span>
            </span>
          </div>
        </div>
      </header>

      {/* 2. 마감 및 정산 완료 상태 안내 상단 배너 */}
      {isEnded && (
        <div className="bg-emerald-950/70 border-b border-emerald-500/40 px-4 py-2.5">
          <div className="max-w-7xl mx-auto flex items-center justify-between text-xs text-emerald-200">
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                <strong>🏆 정산이 완료된 이벤트입니다.</strong> 최종 승리 옵션:{" "}
                <span className="text-amber-300 font-extrabold underline underline-offset-2">
                  {roomData.winningOptionLabel || "정산 확정"}
                </span>
              </span>
            </div>
            <span className="text-[11px] text-emerald-400 font-mono hidden sm:inline">
              대화 입력이 종료되었습니다 (기록 열람 모드)
            </span>
          </div>
        </div>
      )}

      {isClosed && (
        <div className="bg-amber-950/70 border-b border-amber-500/40 px-4 py-2.5">
          <div className="max-w-7xl mx-auto flex items-center justify-between text-xs text-amber-200">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                <strong>🔒 본 이벤트는 마감 시간({formattedDeadline || "마감 시각"})이 경과하여 라이브가 종료되었습니다.</strong>
              </span>
            </div>
            <span className="text-[11px] text-amber-300 font-mono hidden sm:inline">
              경기/결과 집계 중 (대화창 잠김)
            </span>
          </div>
        </div>
      )}

      {/* 3. 메인 컨텐츠 영역 */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* 좌측 (7 cols): 매치 상황판 & 실시간 승부예측 화력 배틀 */}
        <div className="lg:col-span-7 flex flex-col space-y-5">
          {/* A. 실시간 경기/방영 스코어보드 전광판 */}
          {roomData.matchScore && (
            <div className="rounded-3xl bg-gradient-to-br from-[#121621] to-[#0c0f17] border border-white/[0.08] p-6 shadow-2xl relative overflow-hidden">
              <div className="flex items-center justify-between pb-4 border-b border-white/[0.06] text-xs">
                <span className="font-bold text-slate-400">현황 전광판</span>
                <span
                  className={`font-extrabold px-2.5 py-0.5 rounded-full ${
                    !isClosedOrEnded
                      ? "text-red-400 bg-red-500/15 border border-red-500/30 animate-pulse"
                      : isEnded
                      ? "text-emerald-400 bg-emerald-500/15 border border-emerald-500/30"
                      : "text-amber-400 bg-amber-500/15 border border-amber-500/30"
                  }`}
                >
                  {isEnded
                    ? "경기 및 정산 완료"
                    : isClosed
                    ? "마감 (경기 종료 대기)"
                    : roomData.matchScore.statusText}
                </span>
              </div>

              <div className="py-6 flex items-center justify-around">
                <div className="text-center space-y-1">
                  <div className="text-xs sm:text-sm font-extrabold text-slate-300">
                    {roomData.matchScore.teamA}
                  </div>
                  <div className="text-3xl sm:text-5xl font-black text-sky-400 font-mono tracking-tight">
                    {roomData.matchScore.scoreA}
                  </div>
                </div>

                <div className="text-xl sm:text-2xl font-black text-slate-600">VS</div>

                <div className="text-center space-y-1">
                  <div className="text-xs sm:text-sm font-extrabold text-slate-300">
                    {roomData.matchScore.teamB}
                  </div>
                  <div className="text-3xl sm:text-5xl font-black text-rose-400 font-mono tracking-tight">
                    {roomData.matchScore.scoreB}
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-white/[0.06] flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
                <span className="inline-flex items-center gap-1.5 text-emerald-300 font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>검증 오라클: {roomData.predictionGame?.oracleLabel}</span>
                </span>
                <span className="text-amber-300 font-bold">
                  💰 {roomData.predictionGame?.totalPoolPmc.toLocaleString()} PMC 상금풀
                </span>
              </div>
            </div>
          )}

          {/* B. 실시간 승부예측 화력 투표 게이지 + 공식 예측 마켓 PMP 베팅 연동 */}
          {roomData.predictionGame && (
            <div className="rounded-3xl bg-[#111520] border border-white/[0.08] p-6 space-y-5 shadow-xl">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-amber-400 shrink-0" />
                  <h3 className="text-sm sm:text-base font-extrabold text-white">
                    {roomData.predictionGame.question}
                  </h3>
                </div>
                {!isClosedOrEnded ? (
                  <span className="text-[11px] font-bold text-sky-400 shrink-0">
                    응원 클릭 시 내 채팅 뱃지 변경!
                  </span>
                ) : (
                  <span className="text-[11px] font-bold text-slate-500 shrink-0 flex items-center gap-1">
                    <Lock className="w-3 h-3" />
                    <span>응원 투표 종료</span>
                  </span>
                )}
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-black">
                  <span className="text-sky-400">
                    {roomData.predictionGame.optionA.label} ({voteStats.ratioA}%)
                  </span>
                  <span className="text-rose-400">
                    {roomData.predictionGame.optionB.label} ({voteStats.ratioB}%)
                  </span>
                </div>

                <div className="h-3.5 w-full bg-slate-900 rounded-full overflow-hidden flex p-0.5 border border-white/[0.08]">
                  <div
                    className="bg-gradient-to-r from-sky-500 to-blue-600 h-full rounded-l-full transition-all duration-300"
                    style={{ width: `${voteStats.ratioA}%` }}
                  />
                  <div
                    className="bg-gradient-to-r from-rose-500 to-red-600 h-full rounded-r-full transition-all duration-300"
                    style={{ width: `${voteStats.ratioB}%` }}
                  />
                </div>

                <div className="flex justify-between text-[11px] text-slate-500 font-mono">
                  <span>{voteStats.countA.toLocaleString()}명 응원 참여</span>
                  <span>{voteStats.countB.toLocaleString()}명 응원 참여</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleLiveVote("A")}
                  disabled={isClosedOrEnded}
                  className={`p-3 rounded-2xl text-xs font-black border transition flex items-center justify-center gap-2 ${
                    isClosedOrEnded
                      ? "opacity-50 cursor-not-allowed bg-slate-900 text-slate-500 border-white/[0.04]"
                      : myTeam === "A"
                      ? "bg-sky-500 text-slate-950 border-sky-400 shadow-lg shadow-sky-500/30 scale-[1.02]"
                      : "bg-slate-900 text-slate-300 border-white/[0.08] hover:border-sky-500/50"
                  }`}
                >
                  <span>👍 {roomData.predictionGame.optionA.label} {isClosedOrEnded ? "" : "응원"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleLiveVote("B")}
                  disabled={isClosedOrEnded}
                  className={`p-3 rounded-2xl text-xs font-black border transition flex items-center justify-center gap-2 ${
                    isClosedOrEnded
                      ? "opacity-50 cursor-not-allowed bg-slate-900 text-slate-500 border-white/[0.04]"
                      : myTeam === "B"
                      ? "bg-rose-500 text-white border-rose-400 shadow-lg shadow-rose-500/30 scale-[1.02]"
                      : "bg-slate-900 text-slate-300 border-white/[0.08] hover:border-rose-500/50"
                  }`}
                >
                  <span>🔥 {roomData.predictionGame.optionB.label} {isClosedOrEnded ? "" : "응원"}</span>
                </button>
              </div>

              {/* 🎯 공식 예측 게임 상세 페이지 이동 */}
              <div className="pt-3 border-t border-white/[0.08]">
                <Link
                  href={`/prediction/${roomData.predictionGame.slug || roomData.predictionGame.id}`}
                  className="w-full p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/20 via-sky-500/20 to-indigo-500/20 hover:from-amber-500/30 hover:to-indigo-500/30 border border-amber-400/40 flex items-center justify-between gap-3 transition group"
                >
                  <div className="flex items-center gap-2.5">
                    <Sparkles className="w-4 h-4 text-amber-300 shrink-0" />
                    <div className="text-left">
                      <div className="text-xs font-black text-white group-hover:text-amber-200 transition">
                        {isClosedOrEnded
                          ? "공식 예측 마켓 결과 및 최종 배당 확인하기"
                          : "이 매치 공식 예측 게임에서 PMP 베팅 참여하기"}
                      </div>
                      <div className="text-[11px] text-slate-300">
                        적중 시 <span className="text-amber-300 font-bold">{roomData.predictionGame.totalPoolPmc.toLocaleString()} PMC</span> 상금풀 배당 ({roomData.predictionGame.oracleLabel} 검증)
                      </div>
                    </div>
                  </div>
                  <span className="px-3 py-1.5 rounded-xl bg-amber-400 text-slate-950 font-black text-xs shrink-0 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                    <span>{isClosedOrEnded ? "결과 보기" : "베팅하러 가기"}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* 우측 (5 cols): 초경량 고속 실시간 채팅 스트림 */}
        <div className="lg:col-span-5 rounded-3xl bg-[#111520] border border-white/[0.08] flex flex-col h-[650px] shadow-2xl overflow-hidden">
          <div className="px-4 py-3 bg-[#0c0f17] border-b border-white/[0.08] flex items-center justify-between text-xs font-bold text-slate-300">
            <div className="flex items-center gap-2">
              {!isClosedOrEnded ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>실시간 라이브 톡</span>
                </>
              ) : isEnded ? (
                <>
                  <Trophy className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">정산 완료된 대화 기록</span>
                </>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-amber-400">마감된 대화 기록</span>
                </>
              )}
            </div>
            <span className="text-[11px] text-sky-400 font-semibold">대화 자동 보존</span>
          </div>

          <div
            ref={chatScrollRef}
            className="flex-1 p-4 overflow-y-auto space-y-2.5 divide-y divide-white/[0.03] text-xs font-sans"
          >
            {messages.map((m) => (
              <div key={m.id} className="pt-2 flex items-start gap-2 animate-in fade-in duration-150">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    {m.teamTag && (
                      <span
                        className={`px-1.5 py-0.2 rounded text-[10px] font-black border ${
                          m.teamColor || "bg-slate-800 text-slate-300 border-slate-700"
                        }`}
                      >
                        {m.teamTag}
                      </span>
                    )}
                    <span className="font-extrabold text-slate-300">{m.sender}</span>
                    <span className="text-[10px] text-slate-600 font-mono ml-auto">
                      {m.time}
                    </span>
                  </div>
                  <p
                    className={`leading-relaxed break-words ${
                      m.isReaction
                        ? "text-xl py-0.5 animate-bounce"
                        : "text-slate-100 font-medium"
                    }`}
                  >
                    {m.message}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* 퀵 리액션 이모지 연타 바 (마감/정산 시 비활성화) */}
          <div
            className={`px-3 py-1.5 bg-[#0c0f17] border-t border-white/[0.06] flex items-center justify-around transition-opacity ${
              isClosedOrEnded ? "opacity-30 pointer-events-none" : ""
            }`}
          >
            <button
              type="button"
              onClick={() => sendQuickReaction("🔥")}
              disabled={isClosedOrEnded}
              className="text-base hover:scale-125 transition-transform p-1 disabled:pointer-events-none"
              title="불꽃 연타"
            >
              🔥
            </button>
            <button
              type="button"
              onClick={() => sendQuickReaction("🎉")}
              disabled={isClosedOrEnded}
              className="text-base hover:scale-125 transition-transform p-1 disabled:pointer-events-none"
              title="축하 연타"
            >
              🎉
            </button>
            <button
              type="button"
              onClick={() => sendQuickReaction("👏")}
              disabled={isClosedOrEnded}
              className="text-base hover:scale-125 transition-transform p-1 disabled:pointer-events-none"
              title="박수 연타"
            >
              👏
            </button>
            <button
              type="button"
              onClick={() => sendQuickReaction("😱")}
              disabled={isClosedOrEnded}
              className="text-base hover:scale-125 transition-transform p-1 disabled:pointer-events-none"
              title="경악 연타"
            >
              😱
            </button>
            <button
              type="button"
              onClick={() => sendQuickReaction("🚀")}
              disabled={isClosedOrEnded}
              className="text-base hover:scale-125 transition-transform p-1 disabled:pointer-events-none"
              title="떡상 연타"
            >
              🚀
            </button>
          </div>

          {/* 하단 메시지 입력창 (마감 또는 정산 완료 시 비활성화 및 닫힘) */}
          <form
            onSubmit={handleSendMessage}
            className={`p-3 border-t border-white/[0.08] flex items-center gap-2 ${
              isClosedOrEnded ? "bg-[#0a0d14]" : "bg-[#0c0f17]"
            }`}
          >
            <input
              type="text"
              placeholder={
                isEnded
                  ? "정산이 완료된 라이브 룸입니다. 새로운 대화를 작성할 수 없습니다."
                  : isClosed
                  ? "마감 시간이 경과하여 대화창이 닫혔습니다."
                  : "실시간 응원 메시지 남기기..."
              }
              value={inputMessage}
              disabled={isClosedOrEnded}
              onChange={(e) => setInputMessage(e.target.value)}
              className={`flex-1 rounded-xl px-3 py-2 text-xs focus:outline-none transition ${
                isClosedOrEnded
                  ? "bg-slate-900/50 border border-slate-800 text-slate-500 cursor-not-allowed placeholder:text-slate-600"
                  : "bg-[#121621] border border-white/[0.08] text-white focus:border-red-500 placeholder:text-slate-600"
              }`}
            />
            <button
              type="submit"
              disabled={isClosedOrEnded}
              className={`p-2 rounded-xl transition shrink-0 ${
                isClosedOrEnded
                  ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                  : "bg-red-600 hover:bg-red-500 text-white"
              }`}
              title={isClosedOrEnded ? "마감 완료" : "전송"}
            >
              {isClosedOrEnded ? <Lock className="w-4 h-4" /> : <Send className="w-4 h-4" />}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
