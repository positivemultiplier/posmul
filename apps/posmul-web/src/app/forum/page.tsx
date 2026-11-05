"use client";

import React from "react";
import {
  Newspaper,
  PieChart,
  MessageSquare,
  Award,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Card, CardContent } from "@/shared/ui/components/base/Card";
import { DomainContextHeader } from "@/shared/ui/components/layout/DomainContextHeader";

// 3-Pillar 데이터 (Emerald Teal Tone-on-Tone 계층화)
const PILLARS = [
  {
    key: "news",
    title: "📰 News",
    subtitle: "공공 뉴스 · 지식 획득",
    description:
      "정책, 경제, 사회 분야의 공공 뉴스를 읽고 퀴즈를 통해 무위험 시민 자본(PMP)을 획득하세요.",
    href: "/forum/news",
    color: "from-emerald-300 to-teal-300",
    bgColor: "from-emerald-950/80 via-slate-900/70 to-slate-950",
    stats: { count: 156, label: "개 기사" },
    rewardBadge: "+5~20 PMP",
    icon: <Newspaper className="w-8 h-8" />,
    image: "/images/cards/forum_news.png",
  },
  {
    key: "budget",
    title: "💰 Budget",
    subtitle: "예산 감시 · 재정 투명성",
    description:
      "국가 및 지역 예산을 감시하고 이슈를 발굴해 관료 중심 재정을 투명하게 견제하세요.",
    href: "/forum/budget",
    color: "from-teal-300 to-cyan-300",
    bgColor: "from-teal-950/80 via-slate-900/70 to-slate-950",
    stats: { count: 42, label: "개 감시 중" },
    rewardBadge: "+25~100 PMP",
    icon: <PieChart className="w-8 h-8" />,
    image: "/images/cards/forum_budget.png",
  },
  {
    key: "agora",
    title: "💬 Agora",
    subtitle: "브레인스토밍 · 토론 · 의결권 위임",
    description:
      "시민과 함께 정책을 토론하고 PMG 의결권 표결 및 Liquid Democracy 위임으로 합의를 이끌어내세요.",
    href: "/forum/agora",
    color: "from-emerald-200 to-emerald-400",
    bgColor: "from-emerald-900/70 via-slate-900/70 to-slate-950",
    stats: { count: 1234, label: "명 참여" },
    rewardBadge: "+20~50 PMP · PMG",
    icon: <MessageSquare className="w-8 h-8" />,
    image: "/images/cards/forum_agora.png",
  },
];

// 오늘의 인기 주제
const HOT_TOPICS = [
  {
    id: 1,
    title: "2025 예산안 핵심 변화 5가지",
    category: "News",
    href: "/forum/news/policy/news-001",
    pmp: 15,
  },
  {
    id: 2,
    title: "청년 주거정책 개선 토론",
    category: "Agora",
    href: "/forum/agora/debate/agora-001",
    pmp: 30,
  },
  {
    id: 3,
    title: "환경부 탄소중립 예산 분석",
    category: "Budget",
    href: "/forum/budget/national/budget-004",
    pmp: 25,
  },
];

export default function ForumPage() {
  const totalPmpEarned = 1350;

  return (
    <div className="min-h-screen bg-[#090b12] text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
        <DomainContextHeader
          domain="forum"
          title="📢 Forum · 시민 공론장"
          subtitle="공공 지식 학습과 예산 감시, 아고라 숙의로 무위험 참여 자산(PMP)과 의결권(PMG)을 모으는 첫 단계"
          metrics={[
            { label: "내 누적 획득", value: totalPmpEarned, unit: "PMP" },
            { label: "활성 숙의 참여", value: 1432, unit: "명" },
          ]}
        />

        {/* 3-Pillar Cards (Emerald Teal Tone-on-Tone) */}
        <section>
          <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <span>공론장 3대 핵심 영역</span>
          </h2>
          <div className="grid gap-5 md:grid-cols-3">
            {PILLARS.map((pillar, index) => (
              <motion.div
                key={pillar.key}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.08 }}
              >
                <Link href={pillar.href}>
                  <Card className="bg-slate-900/70 border-slate-800/90 hover:border-emerald-500/40 transition-all cursor-pointer group overflow-hidden h-full">
                    <div className="relative aspect-[16/10] overflow-hidden">
                      <img
                        src={pillar.image}
                        alt={pillar.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div
                        className={`absolute inset-0 bg-gradient-to-t ${pillar.bgColor} opacity-90`}
                      />

                      <div className="absolute top-3 left-3 px-2.5 py-0.5 rounded-md bg-emerald-500/20 border border-emerald-400/30 text-emerald-200 text-[11px] font-bold z-10">
                        {pillar.rewardBadge}
                      </div>

                      <div className="absolute inset-0 flex flex-col items-center justify-center p-4 z-10">
                        <div className="text-emerald-300">{pillar.icon}</div>
                        <h3
                          className={`text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r ${pillar.color} mt-2`}
                        >
                          {pillar.title}
                        </h3>
                        <p className="text-xs text-slate-300 text-center mt-1">
                          {pillar.subtitle}
                        </p>
                      </div>

                      <div className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded bg-black/60 text-slate-200 text-xs z-10 backdrop-blur-sm border border-white/10">
                        {pillar.stats.count}
                        {pillar.stats.label}
                      </div>
                    </div>
                    <CardContent className="p-4 space-y-2.5">
                      <p className="text-sm text-slate-400 line-clamp-2">
                        {pillar.description}
                      </p>
                      <div className="flex items-center justify-end text-xs text-slate-400 group-hover:text-emerald-300 transition-colors font-semibold">
                        참여하러 가기{" "}
                        <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        </section>

        {/* 오늘의 인기 주제 & PMP 획득 가이드 (2-Column Balanced Grid) */}
        <div className="grid gap-6 lg:grid-cols-3">
          <section className="lg:col-span-2 space-y-3">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span>🔥 오늘의 집중 공론 의제</span>
            </h2>
            <div className="space-y-2.5">
              {HOT_TOPICS.map((topic, index) => (
                <Link key={topic.id} href={topic.href} className="block">
                  <div className="flex items-center justify-between p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 hover:border-emerald-500/40 transition-all cursor-pointer group">
                    <div className="flex items-center gap-3.5">
                      <span className="w-7 h-7 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-extrabold flex items-center justify-center">
                        {index + 1}
                      </span>
                      <div>
                        <p className="font-semibold text-sm text-white group-hover:text-emerald-300 transition-colors">
                          {topic.title}
                        </p>
                        <p className="text-xs text-slate-500">{topic.category}</p>
                      </div>
                    </div>
                    <span className="flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                      <Award className="w-3.5 h-3.5" />+{topic.pmp} PMP
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-bold text-white">
              💡 시민 자본(PMP) 선순환 가이드
            </h2>
            <div className="space-y-2.5">
              <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-500/20 flex items-center gap-3">
                <Newspaper className="w-5 h-5 text-emerald-400 shrink-0" />
                <div>
                  <p className="font-semibold text-white text-xs">
                    1. 공공 뉴스 & 퀴즈 학습
                  </p>
                  <p className="text-[11px] text-slate-400">
                    정책·경제 이슈 이해 시 +5~20 PMP 지급
                  </p>
                </div>
              </div>
              <div className="p-3.5 rounded-xl bg-teal-950/20 border border-teal-500/20 flex items-center gap-3">
                <PieChart className="w-5 h-5 text-teal-400 shrink-0" />
                <div>
                  <p className="font-semibold text-white text-xs">
                    2. 국가·지역 예산 감시
                  </p>
                  <p className="text-[11px] text-slate-400">
                    예산 낭비·이슈 분석 리포트 +25~100 PMP
                  </p>
                </div>
              </div>
              <div className="p-3.5 rounded-xl bg-emerald-900/15 border border-emerald-400/20 flex items-center gap-3">
                <MessageSquare className="w-5 h-5 text-emerald-300 shrink-0" />
                <div>
                  <p className="font-semibold text-white text-xs">
                    3. 아고라 숙의 & 예측 마켓 진출
                  </p>
                  <p className="text-[11px] text-slate-400">
                    획득한 PMP로 예측 마켓(Expect)에 참여하여 PMC 창출
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
