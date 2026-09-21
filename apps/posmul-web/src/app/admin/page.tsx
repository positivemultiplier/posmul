import React from "react";
import Link from "next/link";
import {
  Target,
  Rss,
  MessageSquare,
  Coins,
  TrendingUp,
  Activity,
  Zap,
  ArrowRight,
  ShieldCheck,
  BarChart3,
} from "lucide-react";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const revalidate = 0; // 실시간 라이브 데이터

export default async function AdminMainPage() {
  // Supabase 실데이터 통계 요약 조회
  let activeGamesCount = 0;
  let settledGamesCount = 0;
  let totalBetsCount = 0;
  let totalFeedItemsCount = 0;

  try {
    const { count: activeCount } = await supabaseAdmin
      .schema("prediction")
      .from("prediction_games")
      .select("*", { count: "exact", head: true })
      .eq("status", "ACTIVE");

    const { count: settledCount } = await supabaseAdmin
      .schema("prediction")
      .from("prediction_games")
      .select("*", { count: "exact", head: true })
      .eq("status", "SETTLED");

    const { count: betsCount } = await supabaseAdmin
      .schema("prediction")
      .from("predictions")
      .select("*", { count: "exact", head: true });

    const { count: feedCount } = await supabaseAdmin
      .schema("feed")
      .from("feed_items")
      .select("*", { count: "exact", head: true });

    activeGamesCount = activeCount || 0;
    settledGamesCount = settledCount || 0;
    totalBetsCount = betsCount || 0;
    totalFeedItemsCount = feedCount || 0;
  } catch (err) {
    console.error("Admin Main Page Stats Error:", err);
  }

  const adminModules = [
    {
      title: "예측 게임 관리자 (Prediction)",
      description: "RSS AI 수집 ➔ 예측 게임 자동 생성, 베팅 모니터링 및 승부 정산(Settlement)",
      href: "/admin/prediction",
      icon: Target,
      color: "from-blue-500 to-indigo-600",
      badge: "핵심 모듈",
      stats: `${activeGamesCount}개 활성 중 / ${settledGamesCount}개 정산 완료`,
    },
    {
      title: "피드 & AI 수집기 (Feed Ingest)",
      description: "RSS 원문 뉴스 피드 수집 현황, Gemini AI 원문 분류 및 초안 파이프라인 관리",
      href: "/admin/feed",
      icon: Rss,
      color: "from-emerald-500 to-teal-600",
      badge: "AI Ingestion",
      stats: `${totalFeedItemsCount}개 피드 수집됨`,
    },
    {
      title: "포럼 & 시민 토론 (Forum)",
      description: "시민 이슈 토론 게시글, 정책 피드백 및 기여도 모니터링",
      href: "/admin/forum",
      icon: MessageSquare,
      color: "from-purple-500 to-pink-600",
      badge: "Community",
      stats: "토론 게시판 시스템",
    },
    {
      title: "경제 & 포인트 시스템 (Economy)",
      description: "PMP/PMC 포인트 발급, MoneyWave 분배 및 지역 경제 유통 현황",
      href: "/admin/economy",
      icon: Coins,
      color: "from-amber-500 to-orange-600",
      badge: "PMP / PMC",
      stats: `총 ${totalBetsCount}건 베팅 참여`,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-10">
        
        {/* Header Section */}
        <div className="border-b border-slate-800 pb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 bg-indigo-950 border border-indigo-800 text-indigo-400 rounded-full text-xs font-semibold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> PosMul System Admin
              </span>
            </div>
            <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400">
              PosMul 통합 관리자 메인 포털
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              AI 뉴스 피드 수집부터 예측 게임, 경제 정산까지 전체 서비스를 통합 관리합니다.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/prediction"
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700 transition flex items-center gap-1.5"
            >
              🌐 메인 유저 서비스로 이동 <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Live Overview Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5">
            <div className="flex justify-between items-center text-slate-400 mb-2">
              <span className="text-xs font-medium">활성 예측 게임</span>
              <Activity className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-black text-emerald-400">{activeGamesCount}개</div>
            <div className="text-[11px] text-slate-500 mt-1">AI 자동 생성 진행 중</div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5">
            <div className="flex justify-between items-center text-slate-400 mb-2">
              <span className="text-xs font-medium">정산 완료 게임</span>
              <BarChart3 className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-black text-amber-400">{settledGamesCount}개</div>
            <div className="text-[11px] text-slate-500 mt-1">승부 정산 100% 완료</div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5">
            <div className="flex justify-between items-center text-slate-400 mb-2">
              <span className="text-xs font-medium">누적 베팅 수</span>
              <TrendingUp className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-2xl font-black text-blue-400">{totalBetsCount}건</div>
            <div className="text-[11px] text-slate-500 mt-1">유저 예측 참여 기록</div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5">
            <div className="flex justify-between items-center text-slate-400 mb-2">
              <span className="text-xs font-medium">수집된 피드</span>
              <Zap className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-2xl font-black text-purple-400">{totalFeedItemsCount}개</div>
            <div className="text-[11px] text-slate-500 mt-1">RSS 파이프라인 수집</div>
          </div>
        </div>

        {/* Modules Grid */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-slate-200 flex items-center gap-2">
            🚀 관리자 기능 모듈
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {adminModules.map((mod, idx) => {
              const Icon = mod.icon;
              return (
                <Link
                  key={idx}
                  href={mod.href}
                  className="group bg-slate-900 border border-slate-800 hover:border-indigo-500/60 rounded-2xl p-6 transition duration-200 flex flex-col justify-between shadow-lg relative overflow-hidden"
                >
                  <div className="space-y-4">
                    <div className="flex justify-between items-start">
                      <div className={`p-3 rounded-xl bg-gradient-to-br ${mod.color} text-white shadow-md`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <span className="px-2.5 py-1 bg-slate-800 text-slate-400 border border-slate-700 rounded-full text-[11px] font-semibold">
                        {mod.badge}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-lg font-bold text-slate-100 group-hover:text-indigo-300 transition flex items-center gap-1.5">
                        {mod.title}
                        <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition transform group-hover:translate-x-1" />
                      </h3>
                      <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">{mod.description}</p>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-800/80 flex justify-between items-center text-xs text-slate-400">
                    <span>라이브 상태:</span>
                    <span className="font-semibold text-slate-200">{mod.stats}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
