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
  Zap,
  Flame,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { LiveEventRoom, getLiveRoomEffectiveStatus } from "../live-rooms.data";
import {
  getRecentLiveMessagesAction,
  saveLiveMessageBufferAction,
  getLiveRoomDetailAction,
  openLiveRoomForGameAction,
  quickVoteLiveChallengeAction,
  getLiveActiveChallengesAction,
} from "../actions/live.actions";
import {
  LiveChallengeCard,
  LiveChallengePayload,
} from "../components/LiveChallengeCard";
import { LiveQuickChallengeModal } from "../components/LiveQuickChallengeModal";
import { UserChallengeDTO } from "@/app/challenge/types";

interface ChatMessage {
  id: string;
  sender: string;
  teamTag?: string;
  teamColor?: string;
  message: string;
  time: string;
  isReaction?: boolean;
  isChallenge?: boolean;
  challengeData?: LiveChallengePayload;
}

function createPlaceholderRoom(roomId: string): LiveEventRoom {
  return {
    id: roomId,
    category: "ECONOMY",
    categoryLabel: "📡 PosMul LIVE",
    title: "라이브 응원톡 연결 중...",
    subtitle: "실시간 예측 마켓 데이터를 불러오고 있습니다.",
    status: "LIVE",
    viewerCount: 0,
  };
}

export default function LiveRoomPage() {
  const params = useParams();
  const roomId = decodeURIComponent(String(params.roomId || ""));
  const initialRoom = createPlaceholderRoom(roomId);

  const [roomData, setRoomData] = useState<LiveEventRoom>(initialRoom);
  const [isRoomLoading, setIsRoomLoading] = useState<boolean>(true);
  const [roomNotFound, setRoomNotFound] = useState<boolean>(false);
  const [notOpenedInfo, setNotOpenedInfo] = useState<{
    canOpen: boolean;
    gameId?: string;
    gameTitle?: string;
  } | null>(null);
  const [isOpeningRoom, setIsOpeningRoom] = useState<boolean>(false);
  const [openRoomMsg, setOpenRoomMsg] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [myTeam, setMyTeam] = useState<"A" | "B">("A");
  const [onlineCount, setOnlineCount] = useState<number>(initialRoom.viewerCount);
  const [lastSentAt, setLastSentAt] = useState<number>(0); // 0.8초 쿨다운 도배 방지
  const [timeLeftStr, setTimeLeftStr] = useState<string>("");
  const [effectiveStatus, setEffectiveStatus] = useState<"LIVE" | "UPCOMING" | "CLOSED" | "ENDED">(
    getLiveRoomEffectiveStatus(initialRoom)
  );

  // 실시간 번개 예측 상태
  const [isChallengeModalOpen, setIsChallengeModalOpen] = useState(false);
  const [activeChallenges, setActiveChallenges] = useState<LiveChallengePayload[]>([]);
  const [userVotes, setUserVotes] = useState<Record<string, "A" | "B">>({});

  const [voteStats, setVoteStats] = useState({
    ratioA: 50,
    ratioB: 50,
    countA: 0,
    countB: 0,
  });

  const chatScrollRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<any>(null);

  // 1. 방 최신 상태 DB 동기화 및 실시간 시청자 번개 예측 로드
  useEffect(() => {
    setIsRoomLoading(true);
    setRoomNotFound(false);
    setNotOpenedInfo(null);

    getLiveRoomDetailAction(roomId).then((res) => {
      setIsRoomLoading(false);
      if (res.success && res.room) {
        setRoomData(res.room);
        setOnlineCount(res.room.viewerCount);
        setEffectiveStatus(getLiveRoomEffectiveStatus(res.room));
        if (res.room.predictionGame) {
          setVoteStats({
            ratioA: res.room.predictionGame.optionA.ratio,
            ratioB: res.room.predictionGame.optionB.ratio,
            countA: res.room.predictionGame.optionA.count,
            countB: res.room.predictionGame.optionB.count,
          });
        }
      } else {
        setRoomNotFound(true);
        if (res.notOpened) {
          setNotOpenedInfo({
            canOpen: Boolean(res.canOpen),
            gameId: res.gameId,
            gameTitle: res.gameTitle,
          });
        }
      }
    });

    // 해당 라이브 방의 최근 진행 중인 시청자 번개 예측 로드
    getLiveActiveChallengesAction(roomId).then((res) => {
      if (res.success && res.challenges) {
        const mapped: LiveChallengePayload[] = res.challenges.map((c) => ({
          id: c.id,
          title: c.title,
          hostName: c.hostName,
          options: c.options,
          eventStartAt: c.eventStartAt,
          totalPoolPmp: c.totalPoolPmp,
        }));
        setActiveChallenges(mapped);
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
      .on("broadcast", { event: "live_challenge_drop" }, ({ payload }) => {
        const challengeMsg: ChatMessage = {
          id: `cmsg-${payload.id}-${Date.now()}`,
          sender: payload.hostName,
          teamTag: "⚡번개예측",
          teamColor: "bg-amber-500/20 text-amber-300 border-amber-400/40",
          message: payload.title,
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          isChallenge: true,
          challengeData: payload,
        };
        setMessages((prev) => [...prev.slice(-100), challengeMsg]);
        setActiveChallenges((prev) => [payload, ...prev.filter((c) => c.id !== payload.id)].slice(0, 5));
      })
      .on("broadcast", { event: "live_challenge_vote" }, ({ payload }) => {
        // payload: { challengeId, options, totalPool }
        setMessages((prev) =>
          prev.map((m) => {
            if (m.challengeData && m.challengeData.id === payload.challengeId) {
              return {
                ...m,
                challengeData: {
                  ...m.challengeData,
                  options: payload.options,
                  totalPoolPmp: payload.totalPool,
                },
              };
            }
            return m;
          })
        );
        setActiveChallenges((prev) =>
          prev.map((c) =>
            c.id === payload.challengeId
              ? { ...c, options: payload.options, totalPoolPmp: payload.totalPool }
              : c
          )
        );
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

  // 번개 예측 생성 완료 시 채팅방 브로드캐스트
  const handleChallengeCreated = (challenge: UserChallengeDTO) => {
    const payload: LiveChallengePayload = {
      id: challenge.id,
      title: challenge.title.replace(/^\[LIVE\]\s*/, ""),
      hostName: challenge.hostName,
      options: challenge.options,
      eventStartAt: challenge.eventStartAt,
      totalPoolPmp: challenge.totalPoolPmp,
    };

    const newMsg: ChatMessage = {
      id: `cmsg-${challenge.id}-${Date.now()}`,
      sender: challenge.hostName,
      teamTag: "⚡번개예측",
      teamColor: "bg-amber-500/20 text-amber-300 border-amber-400/40",
      message: payload.title,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      isChallenge: true,
      challengeData: payload,
    };

    setMessages((prev) => [...prev.slice(-100), newMsg]);
    setActiveChallenges((prev) => [payload, ...prev.filter((c) => c.id !== payload.id)].slice(0, 5));

    // 호스트 본인의 투표 기억
    if (challenge.myBet?.optionId) {
      setUserVotes((prev) => ({
        ...prev,
        [challenge.id]: challenge.myBet!.optionId as "A" | "B",
      }));
    }

    // 다른 참여자들에게 실시간 브로드캐스트
    if (channelRef.current) {
      channelRef.current.send({
        type: "broadcast",
        event: "live_challenge_drop",
        payload,
      });
    }
  };

  // 채팅창 인라인 챌린지 원클릭 투표 핸들러
  const handleQuickVote = async (challengeId: string, optionId: "A" | "B"): Promise<boolean> => {
    const res = await quickVoteLiveChallengeAction({
      challengeId,
      optionId,
      amountPmp: 100, // 기본 100포 밀어주기
    });

    if (res.requireLogin) {
      if (confirm("예측 투표에 참여하려면 로그인이 필요합니다. 로그인 페이지로 이동할까요?")) {
        window.location.href = `/auth/login?redirectTo=/live/${roomId}`;
      }
      return false;
    }

    if (!res.success || !res.options) {
      alert(res.error || "투표에 실패했습니다.");
      return false;
    }

    // 내 투표 기록
    setUserVotes((prev) => ({ ...prev, [challengeId]: optionId }));

    // 로컬 메시지 및 활성 챌린지 갱신
    setMessages((prev) =>
      prev.map((m) => {
        if (m.challengeData && m.challengeData.id === challengeId) {
          return {
            ...m,
            challengeData: {
              ...m.challengeData,
              options: res.options!,
              totalPoolPmp: res.totalPool || m.challengeData.totalPoolPmp,
            },
          };
        }
        return m;
      })
    );

    setActiveChallenges((prev) =>
      prev.map((c) =>
        c.id === challengeId
          ? { ...c, options: res.options!, totalPoolPmp: res.totalPool || c.totalPoolPmp }
          : c
      )
    );

    // 다른 시청자들에게 실시간 비율 갱신 브로드캐스트
    if (channelRef.current) {
      channelRef.current.send({
        type: "broadcast",
        event: "live_challenge_vote",
        payload: {
          challengeId,
          options: res.options,
          totalPool: res.totalPool,
        },
      });
    }

    return true;
  };

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

  if (!isRoomLoading && roomNotFound) {
    return (
      <div className="min-h-screen bg-[#07090e] text-slate-100 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-[#111520] border border-white/10 rounded-3xl p-8 text-center space-y-4">
          <p className="text-lg font-black text-white">
            {notOpenedInfo
              ? "아직 개설되지 않은 LIVE 방입니다"
              : "라이브 방을 찾을 수 없습니다"}
          </p>
          <p className="text-xs text-slate-400 leading-relaxed">
            {notOpenedInfo
              ? `"${notOpenedInfo.gameTitle || "해당 예측 게임"}" 마켓에 아직 LIVE 응원톡이 열리지 않았습니다.${notOpenedInfo.canOpen ? " 지금 바로 방을 개설해 대화를 시작할 수 있습니다." : " 마감되었거나 정산 완료된 마켓입니다."}`
              : "종료되었거나 존재하지 않는 라이브 응원톡 방입니다. 로비에서 진행 중인 라이브 방을 선택해 주세요."}
          </p>
          {openRoomMsg && (
            <p className="text-xs text-amber-300 font-semibold">{openRoomMsg}</p>
          )}
          <div className="flex flex-wrap items-center justify-center gap-2">
            {notOpenedInfo?.canOpen && notOpenedInfo.gameId && (
              <button
                type="button"
                disabled={isOpeningRoom}
                onClick={async () => {
                  setIsOpeningRoom(true);
                  setOpenRoomMsg(null);
                  const openRes = await openLiveRoomForGameAction(notOpenedInfo.gameId!);
                  setIsOpeningRoom(false);
                  if (openRes.success) {
                    window.location.reload();
                  } else {
                    setOpenRoomMsg(openRes.error || "개설에 실패했습니다.");
                  }
                }}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition cursor-pointer disabled:opacity-50"
              >
                {isOpeningRoom ? "개설 중..." : "LIVE 방 개설하고 입장하기"}
              </button>
            )}
            <Link
              href="/live"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-xs font-bold transition"
            >
              <ArrowLeft className="w-4 h-4" />
              LIVE 로비로 돌아가기
            </Link>
          </div>
        </div>
      </div>
    );
  }

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
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsChallengeModalOpen(true)}
                disabled={isClosedOrEnded}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-[11px] font-bold transition-all cursor-pointer disabled:opacity-50"
              >
                <Zap className="w-3 h-3 fill-amber-400 animate-pulse" />
                <span>번개 예측 개설</span>
              </button>
              <span className="text-[11px] text-sky-400 font-semibold">대화 자동 보존</span>
            </div>
          </div>

          {/* 상단 고정: 실시간 시청자 번개 예측 핫 티커 */}
          {activeChallenges.length > 0 && (
            <div className="px-3 py-2 bg-gradient-to-r from-amber-950/40 via-purple-950/40 to-slate-900 border-b border-amber-500/20 flex items-center justify-between text-xs overflow-x-auto gap-2 scrollbar-none">
              <div className="flex items-center gap-1.5 shrink-0 text-amber-300 font-bold text-[11px]">
                <Flame className="w-3.5 h-3.5 text-orange-400 animate-bounce shrink-0" />
                <span>진행 중인 시청자 예측 ({activeChallenges.length})</span>
              </div>
              <div className="flex items-center gap-2 overflow-x-auto py-0.5">
                {activeChallenges.map((c) => (
                  <Link
                    key={c.id}
                    href={`/challenge/${c.id}`}
                    target="_blank"
                    className="shrink-0 px-2 py-0.5 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-[11px] text-slate-200 flex items-center gap-1 transition"
                  >
                    <span className="truncate max-w-[140px] font-medium">{c.title}</span>
                    <span className="text-amber-400 font-mono font-bold text-[10px]">
                      {c.totalPoolPmp}P
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          <div
            ref={chatScrollRef}
            className="flex-1 p-4 overflow-y-auto space-y-2.5 divide-y divide-white/[0.03] text-xs font-sans"
          >
            {messages.map((m) => {
              if (m.isChallenge && m.challengeData) {
                return (
                  <div key={m.id} className="pt-2 animate-in fade-in duration-200">
                    <LiveChallengeCard
                      challenge={m.challengeData}
                      onQuickVote={handleQuickVote}
                      userVote={userVotes[m.challengeData.id] || null}
                    />
                  </div>
                );
              }

              return (
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
              );
            })}
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
            {/* ⚡ 번개 예측 개설 숏컷 버튼 */}
            <button
              type="button"
              onClick={() => setIsChallengeModalOpen(true)}
              disabled={isClosedOrEnded}
              className={`p-2 rounded-xl flex items-center gap-1 font-bold text-xs transition shrink-0 cursor-pointer ${
                isClosedOrEnded
                  ? "bg-slate-900 text-slate-600 border border-slate-800 cursor-not-allowed"
                  : "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 shadow-md shadow-amber-500/20 active:scale-95"
              }`}
              title="실시간 번개 예측 개설"
            >
              <Zap className="w-4 h-4 fill-slate-950" />
              <span className="hidden sm:inline">번개예측</span>
            </button>

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

      {/* ⚡ 실시간 시청자 번개 예측 개설 모달 */}
      <LiveQuickChallengeModal
        roomId={roomId}
        isOpen={isChallengeModalOpen}
        onClose={() => setIsChallengeModalOpen(false)}
        onCreated={handleChallengeCreated}
      />
    </div>
  );
}
