"use client";

import React from "react";
import { Newspaper, PieChart, MessageSquare, Award, ArrowRight, Users, Eye, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Card, CardContent } from "@/shared/ui/components/base/Card";

// 3-Pillar 데이터
const PILLARS = [
  {
    key: "news",
    title: "📰 News",
    subtitle: "공공 뉴스 · 지식 획득",
    description: "정책, 경제, 사회 분야의 공공 뉴스를 읽고 퀴즈를 통해 PMP를 획득하세요.",
    href: "/forum/news",
    color: "from-blue-500 to-cyan-500",
    bgColor: "from-blue-900/50 to-slate-900",
    stats: { count: 156, label: "개 기사" },
    icon: <Newspaper className="w-8 h-8" />,
    image: "/images/cards/forum_news.png",
  },
  {
    key: "budget",
    title: "💰 Budget",
    subtitle: "예산 감시 · 재정 투명성",
    description: "국가 및 지역 예산을 감시하고 이슈를 발굴해 투명한 재정을 만들어가세요.",
    href: "/forum/budget",
    color: "from-amber-500 to-yellow-500",
    bgColor: "from-amber-900/50 to-slate-900",
    stats: { count: 42, label: "개 감시 중" },
    icon: <PieChart className="w-8 h-8" />,
    image: "/images/cards/forum_budget.png",
  },
  {
    key: "agora",
    title: "💬 Agora",
    subtitle: "브레인스토밍 · 토론 · 공론화",
    description: "시민과 함께 아이디어를 나누고, 정책을 토론하며, 합의를 이끌어내세요.",
    href: "/forum/agora",
    color: "from-purple-500 to-pink-500",
    bgColor: "from-purple-900/50 to-slate-900",
    stats: { count: 1234, label: "명 참여" },
    icon: <MessageSquare className="w-8 h-8" />,
    image: "/images/cards/forum_agora.png",
  },
];

// 오늘의 인기 주제
const HOT_TOPICS = [
  { id: 1, title: "2025 예산안 핵심 변화 5가지", category: "News", href: "/forum/news/policy/news-001", pmp: 15 },
  { id: 2, title: "청년 주거정책 개선 토론", category: "Agora", href: "/forum/agora/debate/agora-001", pmp: 30 },
  { id: 3, title: "환경부 탄소중립 예산 분석", category: "Budget", href: "/forum/budget/national/budget-004", pmp: 25 },
];

export default function ForumPage() {
  const totalPmpEarned = 1350;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-950 text-slate-200">
      {/* Header - Consume 스타일 */}
      <header className="sticky top-0 z-10 backdrop-blur-xl bg-slate-900/80 border-b border-slate-800">
        <div className="max-w-4xl mx-auto p-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">
                📢 Forum
              </h1>
              <p className="text-sm text-emerald-400/70">지식 공유 · 예산 감시 · 시민 공론</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-400">내 총 획득</p>
              <p className="text-xl font-bold text-emerald-400">
                <span className="text-2xl">{totalPmpEarned.toLocaleString()}</span>
                <span className="text-sm ml-1">PMP</span>
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-8">
        {/* 3-Pillar Cards - Consume 카드 스타일 */}
        <section>
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-400" />
            활동 영역
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
                  <Card className="bg-slate-900/70 border-slate-800 hover:border-slate-600 transition-all cursor-pointer group overflow-hidden h-full">
                    {/* 히어로 영역 */}
                    <div className="relative aspect-[4/3] overflow-hidden">
                      <img
                        src={pillar.image}
                        alt={pillar.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      <div className={`absolute inset-0 bg-gradient-to-t ${pillar.bgColor} opacity-90`} />

                      {/* Content Overlay */}
                      <div className="absolute inset-0 flex flex-col items-center justify-center p-4 z-10">
                        <div className={`text-transparent bg-clip-text bg-gradient-to-r ${pillar.color}`}>
                          {pillar.icon}
                        </div>
                        <h3 className={`text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r ${pillar.color} mt-2`}>
                          {pillar.title}
                        </h3>
                        <p className="text-xs text-slate-300 text-center mt-1">{pillar.subtitle}</p>
                      </div>

                      <div className="absolute bottom-2 right-2 px-2 py-1 rounded bg-black/60 text-white text-xs z-10 backdrop-blur-sm border border-white/10">
                        {pillar.stats.count}{pillar.stats.label}
                      </div>
                    </div>
                    <CardContent className="p-4 space-y-2">
                      <p className="text-sm text-slate-400 line-clamp-2">{pillar.description}</p>
                      <div className="flex items-center justify-end text-xs text-slate-500 group-hover:text-emerald-400 transition-colors">
                        바로가기 <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        </section>

        {/* 오늘의 인기 주제 */}
        <section>
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            🔥 오늘의 인기 주제
          </h2>
          <div className="space-y-3">
            {HOT_TOPICS.map((topic, index) => (
              <Link key={topic.id} href={topic.href}>
                <div className="flex items-center justify-between p-4 rounded-xl bg-slate-800/50 border border-slate-700 hover:border-emerald-700/50 transition-all cursor-pointer group">
                  <div className="flex items-center gap-4">
                    <span className="w-8 h-8 rounded-full bg-emerald-900/50 text-emerald-400 font-bold flex items-center justify-center">
                      {index + 1}
                    </span>
                    <div>
                      <p className="font-medium text-white group-hover:text-emerald-400 transition-colors">{topic.title}</p>
                      <p className="text-xs text-slate-500">{topic.category}</p>
                    </div>
                  </div>
                  <span className="flex items-center gap-1 text-sm text-emerald-400">
                    <Award className="w-4 h-4" />
                    +{topic.pmp}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* PMP 획득 가이드 */}
        <section>
          <h2 className="text-lg font-bold text-white mb-4">💡 PMP 획득 방법</h2>
          <div className="grid gap-3 md:grid-cols-3">
            <div className="p-4 rounded-xl bg-blue-900/20 border border-blue-800/30 text-center">
              <Newspaper className="w-6 h-6 text-blue-400 mx-auto mb-2" />
              <p className="font-medium text-white text-sm">뉴스 읽기</p>
              <p className="text-xs text-slate-400">+5~20 PMP</p>
            </div>
            <div className="p-4 rounded-xl bg-amber-900/20 border border-amber-800/30 text-center">
              <PieChart className="w-6 h-6 text-amber-400 mx-auto mb-2" />
              <p className="font-medium text-white text-sm">예산 분석</p>
              <p className="text-xs text-slate-400">+25~100 PMP</p>
            </div>
            <div className="p-4 rounded-xl bg-purple-900/20 border border-purple-800/30 text-center">
              <MessageSquare className="w-6 h-6 text-purple-400 mx-auto mb-2" />
              <p className="font-medium text-white text-sm">토론 참여</p>
              <p className="text-xs text-slate-400">+20~50 PMP</p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
