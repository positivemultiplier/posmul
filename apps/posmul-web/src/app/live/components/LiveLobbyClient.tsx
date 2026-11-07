"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Flame,
  Radio,
  Users,
  Trophy,
  TrendingUp,
  ArrowRight,
  Lock,
  CheckCircle2,
  Clock,
  Sparkles,
} from "lucide-react";
import { LiveEventRoom } from "../live-rooms.data";
import { getLiveRoomsWithStatusAction } from "../actions/live.actions";

interface LiveLobbyClientProps {
  initialRooms: LiveEventRoom[];
}

export function LiveLobbyClient({ initialRooms }: LiveLobbyClientProps) {
  const [rooms, setRooms] = useState<LiveEventRoom[]>(initialRooms);
  const [activeTab, setActiveTab] = useState<"ALL" | "LIVE" | "CLOSED">("ALL");
  const [isLoading, setIsLoading] = useState(false);

  // 주기적으로 최신 상태 동기화 (30초마다)
  useEffect(() => {
    const syncStatus = async () => {
      try {
        const res = await getLiveRoomsWithStatusAction();
        if (res.success && res.rooms) {
          setRooms(res.rooms);
        }
      } catch (err) {
        console.warn("Failed to sync live rooms status:", err);
      }
    };

    syncStatus();
    const interval = setInterval(syncStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const liveRooms = rooms.filter((r) => r.status === "LIVE");
  const closedOrEndedRooms = rooms.filter(
    (r) => r.status === "CLOSED" || r.status === "ENDED"
  );

  const filteredRooms =
    activeTab === "LIVE"
      ? liveRooms
      : activeTab === "CLOSED"
      ? closedOrEndedRooms
      : rooms;

  return (
    <div className="space-y-6">
      {/* 탭 네비게이션 & 통계 요약 */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#111520] p-3 rounded-2xl border border-white/[0.08]">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab("ALL")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === "ALL"
                ? "bg-slate-200 text-slate-950 font-black shadow-md"
                : "bg-slate-950/60 text-slate-400 hover:text-white border border-slate-800"
            }`}
          >
            전체 ({rooms.length})
          </button>
          <button
            onClick={() => setActiveTab("LIVE")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === "LIVE"
                ? "bg-red-500 text-white font-black shadow-md shadow-red-500/25"
                : "bg-slate-950/60 text-slate-400 hover:text-white border border-slate-800"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-red-400 animate-ping" />
            <span>LIVE 진행중 ({liveRooms.length})</span>
          </button>
          <button
            onClick={() => setActiveTab("CLOSED")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === "CLOSED"
                ? "bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/25"
                : "bg-slate-950/60 text-slate-400 hover:text-white border border-slate-800"
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>마감·정산 완료 ({closedOrEndedRooms.length})</span>
          </button>
        </div>

        <div className="text-[11px] text-slate-400 font-mono flex items-center gap-2">
          <Clock className="w-3.5 h-3.5 text-slate-500" />
          <span>마감 시간 또는 정산 도래 시 채팅창 자동 잠금</span>
        </div>
      </div>

      {/* 라이브 룸 목록 카드 그리드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredRooms.map((room) => {
          const isLive = room.status === "LIVE";
          const isClosed = room.status === "CLOSED";
          const isEnded = room.status === "ENDED";

          // 마감 시간 포맷
          const formattedEnd = room.registrationEnd
            ? new Date(room.registrationEnd).toLocaleString([], {
                month: "numeric",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })
            : null;

          return (
            <Link
              key={room.id}
              href={`/live/${room.id}`}
              className={`group rounded-3xl p-6 flex flex-col justify-between space-y-5 transition-all duration-300 hover:-translate-y-1 relative overflow-hidden ${
                isLive
                  ? "bg-[#111520] border border-white/[0.08] hover:border-red-500/50 hover:shadow-[0_12px_40px_rgba(239,68,68,0.15)]"
                  : isEnded
                  ? "bg-[#0d121c] border border-emerald-500/25 hover:border-emerald-500/50 hover:shadow-[0_12px_40px_rgba(16,185,129,0.15)]"
                  : "bg-[#0f1118] border border-amber-500/20 hover:border-amber-500/40 opacity-90 hover:opacity-100"
              }`}
            >
              {/* 상단 상태 바 */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400">
                  {room.categoryLabel}
                </span>
                <div className="flex items-center gap-2">
                  {isLive ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/40 text-[11px] font-black">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                      LIVE
                    </span>
                  ) : isEnded ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[11px] font-black">
                      <Trophy className="w-3 h-3" />
                      정산완료
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[11px] font-black">
                      <Lock className="w-3 h-3" />
                      마감됨
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-400">
                    <Users className="w-3.5 h-3.5 text-slate-500" />
                    <span>{room.viewerCount.toLocaleString()}명</span>
                  </span>
                </div>
              </div>

              {/* 중앙 매치 타이틀 & 스코어보드 */}
              <div className="space-y-3">
                <h2
                  className={`text-lg font-black transition-colors leading-snug ${
                    isLive
                      ? "text-white group-hover:text-red-400"
                      : isEnded
                      ? "text-slate-100 group-hover:text-emerald-400"
                      : "text-slate-200 group-hover:text-amber-300"
                  }`}
                >
                  {room.title}
                </h2>
                <p className="text-xs text-slate-400 line-clamp-2">
                  {room.subtitle}
                </p>

                {/* 마감/정산 결과 안내 배너 */}
                {isEnded && (
                  <div className="p-2.5 rounded-xl bg-emerald-950/60 border border-emerald-500/30 text-[11px] text-emerald-300 font-bold flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Trophy className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span>최종 승리 확정</span>
                    </span>
                    <span className="font-black text-white bg-emerald-900/80 px-2 py-0.5 rounded border border-emerald-700/50">
                      {room.winningOptionLabel || "정산 완료"}
                    </span>
                  </div>
                )}

                {isClosed && formattedEnd && (
                  <div className="p-2.5 rounded-xl bg-amber-950/40 border border-amber-500/30 text-[11px] text-amber-300 font-medium flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span>베팅 및 응원톡 마감</span>
                    </span>
                    <span className="font-mono text-slate-300 text-[10px]">
                      {formattedEnd} 마감
                    </span>
                  </div>
                )}

                {/* 스코어보드 박스 */}
                {room.matchScore && (
                  <div className="p-3.5 rounded-2xl bg-[#0c0f17] border border-white/[0.06] flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <div className="text-center font-bold text-slate-200">
                        <div>{room.matchScore.teamA}</div>
                        <div className="text-lg font-black text-white">
                          {room.matchScore.scoreA}
                        </div>
                      </div>
                      <span className="text-slate-600 font-black text-sm">VS</span>
                      <div className="text-center font-bold text-slate-200">
                        <div>{room.matchScore.teamB}</div>
                        <div className="text-lg font-black text-white">
                          {room.matchScore.scoreB}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isLive
                            ? "text-red-400 bg-red-500/10"
                            : isEnded
                            ? "text-emerald-400 bg-emerald-500/10"
                            : "text-amber-400 bg-amber-500/10"
                        }`}
                      >
                        {isEnded ? "경기 종료" : room.matchScore.statusText}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* 하단 예측 투표 바 & 입장 버튼 */}
              <div className="pt-3 border-t border-white/[0.06] space-y-2.5">
                {room.predictionGame && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] font-bold">
                      <span className="text-sky-400">
                        {room.predictionGame.optionA.label} ({room.predictionGame.optionA.ratio}%)
                      </span>
                      <span className="text-rose-400">
                        {room.predictionGame.optionB.label} ({room.predictionGame.optionB.ratio}%)
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden flex">
                      <div
                        className="bg-sky-500 h-full"
                        style={{ width: `${room.predictionGame.optionA.ratio}%` }}
                      />
                      <div
                        className="bg-rose-500 h-full"
                        style={{ width: `${room.predictionGame.optionB.ratio}%` }}
                      />
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs font-black text-amber-300">
                    💰 {room.predictionGame?.totalPoolPmc.toLocaleString()} PMC 풀
                  </span>
                  <span
                    className={`text-xs font-extrabold flex items-center gap-1 group-hover:translate-x-1 transition-transform ${
                      isLive
                        ? "text-white"
                        : isEnded
                        ? "text-emerald-300"
                        : "text-amber-300"
                    }`}
                  >
                    <span>
                      {isLive
                        ? "라이브 입장"
                        : isEnded
                        ? "정산 결과 보기"
                        : "종료된 톡 보기"}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-current" />
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

