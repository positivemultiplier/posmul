import Link from "next/link";
import { LIVE_ROOMS } from "./live-rooms.data";
import { Flame, Radio, Users, Trophy, TrendingUp, ArrowRight } from "lucide-react";

export const metadata = {
  title: "실시간 라이브 응원톡 & 매치룸 | PosMul",
  description: "야구 결승, 축구 빅매치, 미국증시 개장 실시간 승부예측 & 라이브 토론장",
};

export default function LiveLobbyPage() {
  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 py-8 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* 상단 헤더 */}
        <div className="rounded-3xl bg-gradient-to-r from-red-950/40 via-purple-950/30 to-slate-900 border border-red-500/30 p-6 sm:p-8 relative overflow-hidden shadow-2xl">
          <div className="relative z-10 space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/20 text-red-400 border border-red-500/40 text-xs font-black">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
              <span>LIVE ARENA</span>
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight flex items-center gap-3">
              <Radio className="w-8 h-8 text-red-500 animate-pulse" />
              <span>실시간 이벤트 라이브 응원톡</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              야구 결승, 축구 빅매치, 미국증시 개장 순간에 모여 실시간으로 떠들며 승부를 예측하세요!
              내 예측 팀 뱃지를 달고 응원하며 MoneyWave 상금을 쟁취할 수 있습니다.
            </p>
          </div>
        </div>

        {/* 라이브 룸 목록 카드 그리드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {LIVE_ROOMS.map((room) => {
            const isLive = room.status === "LIVE";
            return (
              <Link
                key={room.id}
                href={`/live/${room.id}`}
                className="group rounded-3xl bg-[#111520] border border-white/[0.08] hover:border-red-500/50 p-6 flex flex-col justify-between space-y-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(239,68,68,0.15)] relative overflow-hidden"
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
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-400 text-[11px] font-bold">
                        예정
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
                  <h2 className="text-lg font-black text-white group-hover:text-red-400 transition-colors leading-snug">
                    {room.title}
                  </h2>
                  <p className="text-xs text-slate-400 line-clamp-2">
                    {room.subtitle}
                  </p>

                  {/* 스코어보드 박스 */}
                  {room.matchScore && (
                    <div className="p-3.5 rounded-2xl bg-[#0c0f17] border border-white/[0.06] flex items-center justify-between text-xs">
                      <div className="flex items-center gap-3">
                        <div className="text-center font-bold text-slate-200">
                          <div>{room.matchScore.teamA}</div>
                          <div className="text-lg font-black text-white">{room.matchScore.scoreA}</div>
                        </div>
                        <span className="text-slate-600 font-black text-sm">VS</span>
                        <div className="text-center font-bold text-slate-200">
                          <div>{room.matchScore.teamB}</div>
                          <div className="text-lg font-black text-white">{room.matchScore.scoreB}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] font-bold text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full">
                          {room.matchScore.statusText}
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
                    <span className="text-xs font-extrabold text-white flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                      <span>라이브 입장</span>
                      <ArrowRight className="w-3.5 h-3.5 text-red-400" />
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

