import React from "react";
import Link from "next/link";
import {
  Flame,
  Zap,
  Users,
  Trophy,
  Plus,
  ArrowRight,
  Sparkles,
  Lock,
  Globe,
} from "lucide-react";
import { getPublicChallengesAction } from "./actions/challenge.actions";
import { CHALLENGE_PRESETS } from "./types";
import { PosMulCharacterCompanion } from "@/shared/characters/PosMulCharacterCompanion";

export const metadata = {
  title: "친구와의 맞짱 챌린지 | PosMul",
  description: "30초 만에 내기를 만들고 친구 단톡방에 던지세요! 1:1 PMP 맞짱 승부",
};

export const revalidate = 10;

export default async function ChallengeLobbyPage() {
  const { challenges } = await getPublicChallengesAction();

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 py-8 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* 1. 상단 히어로 배너 */}
        <div className="rounded-3xl bg-gradient-to-r from-amber-950/40 via-orange-950/30 to-slate-900 border border-amber-500/30 p-6 sm:p-8 relative overflow-hidden shadow-2xl">
          <div className="relative z-10 space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-black">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>P2P MATCH ARENA</span>
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight flex items-center gap-3">
              <span>친구와 맞짱 내기 챌린지 🥊</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              사다리타기는 이제 그만! 10초 만에 단독 또는 공식 경기 꼬리 내기를 만들어 카카오톡·SNS에 도전장을 던지세요.
              친구들을 이기면 PMP를 뺏어오고, 오픈 내기는 판돈의 3% 호스트 수수료까지 챙깁니다!
            </p>

            <div className="pt-2 flex flex-wrap gap-3">
              <Link
                href="/challenge/create"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-sm shadow-xl shadow-amber-500/25 active:scale-95 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>30초 만에 내기 방 만들기</span>
              </Link>
            </div>
          </div>
        </div>

        {/* 포스멀 프렌즈 범이(Beomi) 챌린지 응원 */}
        <PosMulCharacterCompanion domain="challenge" variant="compact" />

        {/* 2. 6대 일상 프리셋 바로가기 칩 */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400">
            <span>⚡ 빠른 일상 내기 템플릿</span>
            <span className="text-[11px] text-amber-400">터치 시 바로 개설 화면 이동</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
            {CHALLENGE_PRESETS.map((p) => (
              <Link
                key={p.id}
                href="/challenge/create"
                className="p-3 rounded-2xl bg-[#111520] hover:bg-[#151a28] border border-white/[0.08] hover:border-amber-500/40 transition group flex flex-col justify-between space-y-2"
              >
                <span className="text-2xl">{p.icon}</span>
                <div>
                  <div className="text-xs font-black text-white group-hover:text-amber-300 transition">
                    {p.categoryLabel}
                  </div>
                  <div className="text-[10px] text-slate-500 line-clamp-1">{p.title}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* 3. 오픈 챌린지 목록 피드 */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              <Flame className="w-5 h-5 text-orange-400" />
              <span>실시간 오픈 챌린지 피드</span>
            </h2>
            <span className="text-xs text-slate-500">오픈 내기 & 5명 돌파 자동 승격 매치</span>
          </div>

          {challenges.length === 0 ? (
            <div className="py-16 text-center text-slate-500 text-xs bg-[#111520] border border-white/[0.08] rounded-3xl space-y-2">
              <p>아직 전체 공개된 오픈 챌린지가 없습니다.</p>
              <Link
                href="/challenge/create"
                className="inline-block text-amber-400 font-bold hover:underline"
              >
                첫 번째 맞짱 챌린지를 열어보세요! (+호스트 수수료 3%)
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {challenges.map((c) => {
                const optA = c.options[0];
                const optB = c.options[1];
                return (
                  <Link
                    key={c.id}
                    href={`/challenge/${c.id}`}
                    className="p-5 rounded-3xl bg-[#111520] hover:bg-[#151a28] border border-white/[0.08] hover:border-amber-500/40 transition space-y-4 group block"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="px-2 py-0.5 rounded-full bg-slate-900 border border-white/[0.08] text-slate-400 font-bold shrink-0">
                          방장: {c.hostName}
                        </span>
                        {c.linkedGameTitle && (
                          <span className="px-2 py-0.5 rounded-full bg-sky-500/15 border border-sky-500/30 text-sky-300 font-bold text-[10px] truncate max-w-[140px]">
                            🔗 꼬리내기
                          </span>
                        )}
                      </div>
                      <span className="text-amber-400 font-black font-mono shrink-0">
                        💰 {c.totalPoolPmp.toLocaleString()} PMP
                      </span>
                    </div>

                    <h3 className="text-base font-black text-white group-hover:text-amber-300 transition line-clamp-2">
                      "{c.title}"
                    </h3>

                    {optA && optB && (
                      <div className="space-y-1.5 text-xs">
                        <div className="flex justify-between font-bold text-[11px]">
                          <span className="text-sky-400">{optA.label} ({optA.ratio}%)</span>
                          <span className="text-rose-400">{optB.label} ({optB.ratio}%)</span>
                        </div>
                        <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden flex">
                          <div style={{ width: `${optA.ratio}%` }} className="bg-sky-500 h-full" />
                          <div style={{ width: `${optB.ratio}%` }} className="bg-rose-500 h-full" />
                        </div>
                      </div>
                    )}

                    <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between text-xs font-bold text-slate-400">
                      <span>도전자 참여하기</span>
                      <ArrowRight className="w-4 h-4 text-amber-400 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

