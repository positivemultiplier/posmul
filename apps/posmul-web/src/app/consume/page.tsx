"use client";

import React from "react";
import { Tv, Store, CloudFog, Award, ArrowRight, Coins, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Card, CardContent } from "@/shared/ui/components/base/Card";

// 3-Pillar 데이터
const PILLARS = [
  {
    key: "major",
    title: "🎬 Major League",
    subtitle: "광고 시청 · PMP 획득",
    description: "대기업 광고, 설문을 시청/참여하고 PMP를 획득하세요. 1분으로 포인트를 쌓을 수 있습니다.",
    href: "/consume/major-league",
    color: "from-indigo-500 to-purple-500",
    bgColor: "from-indigo-900/50 to-slate-900",
    stats: { count: 24, label: "개 광고" },
    icon: <Tv className="w-8 h-8" />,
    image: "/images/cards/major-league.png",
  },
  {
    key: "minor",
    title: "🏪 Minor League",
    subtitle: "지역 소비 · PMC 획득",
    description: "동네 카페, 음식점, 서점에서 결제하고 PMC를 획득하세요. 지역 경제에도 기여합니다.",
    href: "/consume/minor-league",
    color: "from-emerald-500 to-teal-500",
    bgColor: "from-emerald-900/50 to-slate-900",
    stats: { count: 156, label: "개 매장" },
    icon: <Store className="w-8 h-8" />,
    image: "/images/cards/minor-league.png",
  },
  {
    key: "cloud",
    title: "💡 Cloud Funding",
    subtitle: "프로젝트 후원 · 수익 공유",
    description: "스타트업, 출판, 농업 등 다양한 프로젝트에 투자하고 수익을 공유받으세요.",
    href: "/consume/cloud-funding",
    color: "from-amber-500 to-orange-500",
    bgColor: "from-amber-900/50 to-slate-900",
    stats: { count: 42, label: "개 펀딩" },
    icon: <CloudFog className="w-8 h-8" />,
    image: "/images/cards/cloud-funding.png",
  },
];

// 인기 활동 (Mock)
const HOT_ACTIVITIES = [
  { id: 1, title: "삼성전자 신제품 광고", type: "Major", href: "/consume/major-league/ad-001", pmp: 50 },
  { id: 2, title: "동네 북카페 '책 읽는 하루'", type: "Minor", href: "/consume/minor-league/shop-042", pmc: 200 },
  { id: 3, title: "친환경 농업 스타트업 펀딩", type: "Cloud", href: "/consume/cloud-funding/project-015", rate: "12%" },
];

export default function ConsumePage() {
  const totalEarned = 8420; // Mock - 총 획득량

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-950 to-slate-950 text-slate-200">
      {/* Header - Forum 스타일 */}
      <header className="sticky top-0 z-10 backdrop-blur-xl bg-indigo-950/80 border-b border-indigo-800/50">
        <div className="max-w-4xl mx-auto p-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
                💳 Consume
              </h1>
              <p className="text-sm text-indigo-400/70">광고 시청 · 지역 소비 · 펀딩</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-400">이번 달 획득</p>
              <p className="text-xl font-bold text-indigo-400">
                <span className="text-2xl">{totalEarned.toLocaleString()}</span>
                <span className="text-sm ml-1">P</span>
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-8">
        {/* 3-Pillar Cards */}
        <section>
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-indigo-400" />
            소비 방법 선택
          </h2>
          <div className="grid gap-4 md:grid-cols-3">
            {PILLARS.map((pillar, index) => (
              <motion.div
                key={pillar.key}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Link href={pillar.href}>
                  <Card className="bg-slate-900/70 border-slate-800 hover:border-indigo-700/50 transition-all cursor-pointer group overflow-hidden h-full">
                    {/* 히어로 영역 - 이미지 배경 */}
                    <div className="relative aspect-[4/3] overflow-hidden">
                      {/* 배경 이미지 */}
                      <img
                        src={pillar.image}
                        alt={pillar.title}
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                      {/* 오버레이 */}
                      <div className={`absolute inset-0 bg-gradient-to-t ${pillar.bgColor} opacity-80`} />
                      {/* 콘텐츠 */}
                      <div className="relative z-10 flex flex-col items-center justify-center h-full p-4">
                        <div className="text-white">
                          {pillar.icon}
                        </div>
                        <h3 className={`text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r ${pillar.color} mt-2`}>
                          {pillar.title}
                        </h3>
                        <p className="text-xs text-slate-300 text-center">{pillar.subtitle}</p>
                      </div>
                      {/* 통계 배지 */}
                      <div className="absolute bottom-2 right-2 px-2 py-1 rounded bg-black/60 text-white text-xs z-10">
                        {pillar.stats.count}{pillar.stats.label}
                      </div>
                    </div>
                    <CardContent className="p-4 space-y-2">
                      <p className="text-sm text-slate-400 line-clamp-2">{pillar.description}</p>
                      <div className="flex items-center justify-end text-xs text-slate-500 group-hover:text-indigo-400 transition-colors">
                        바로가기 <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        </section>

        {/* 인기 활동 */}
        <section>
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            🔥 오늘의 인기
          </h2>
          <div className="space-y-3">
            {HOT_ACTIVITIES.map((activity, index) => (
              <Link key={activity.id} href={activity.href}>
                <div className="flex items-center justify-between p-4 rounded-xl bg-slate-800/50 border border-slate-700 hover:border-indigo-700/50 transition-all cursor-pointer group">
                  <div className="flex items-center gap-4">
                    <span className="w-8 h-8 rounded-full bg-indigo-900/50 text-indigo-400 font-bold flex items-center justify-center">
                      {index + 1}
                    </span>
                    <div>
                      <p className="font-medium text-white group-hover:text-indigo-400 transition-colors">{activity.title}</p>
                      <p className="text-xs text-slate-500">{activity.type}</p>
                    </div>
                  </div>
                  <span className="flex items-center gap-1 text-sm text-indigo-400">
                    {activity.pmp && <><Coins className="w-4 h-4" /> +{activity.pmp} PMP</>}
                    {activity.pmc && <><Coins className="w-4 h-4" /> +{activity.pmc} PMC</>}
                    {activity.rate && <><Award className="w-4 h-4" /> {activity.rate} 수익률</>}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* 가이드 */}
        <section>
          <h2 className="text-lg font-bold text-white mb-4">💡 소비 가이드</h2>
          <div className="grid gap-3 md:grid-cols-3">
            <div className="p-4 rounded-xl bg-indigo-900/20 border border-indigo-800/30 text-center">
              <Tv className="w-6 h-6 text-indigo-400 mx-auto mb-2" />
              <p className="font-medium text-white text-sm">광고 시청</p>
              <p className="text-xs text-slate-400">+10~100 PMP</p>
            </div>
            <div className="p-4 rounded-xl bg-emerald-900/20 border border-emerald-800/30 text-center">
              <Store className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
              <p className="font-medium text-white text-sm">지역 소비</p>
              <p className="text-xs text-slate-400">결제액 10% PMC</p>
            </div>
            <div className="p-4 rounded-xl bg-amber-900/20 border border-amber-800/30 text-center">
              <CloudFog className="w-6 h-6 text-amber-400 mx-auto mb-2" />
              <p className="font-medium text-white text-sm">펀딩 참여</p>
              <p className="text-xs text-slate-400">수익률 공유</p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
