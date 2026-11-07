import { getLiveRoomsWithStatusAction } from "./actions/live.actions";
import { LiveLobbyClient } from "./components/LiveLobbyClient";
import { Radio } from "lucide-react";

export const metadata = {
  title: "실시간 라이브 응원톡 & 매치룸 | PosMul",
  description: "야구 결승, 축구 빅매치, 미국증시 개장 실시간 승부예측 & 라이브 토론장",
};

export const revalidate = 10; // 10초마다 재검증

export default async function LiveLobbyPage() {
  const { rooms } = await getLiveRoomsWithStatusAction();

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
              마감 시간 도래 및 정산 완료 시 자동으로 룸이 닫히며 최종 결과가 확정됩니다.
            </p>
          </div>
        </div>

        {/* 클라이언트 실시간 탭 및 그리드 */}
        <LiveLobbyClient initialRooms={rooms} />
      </div>
    </div>
  );
}
