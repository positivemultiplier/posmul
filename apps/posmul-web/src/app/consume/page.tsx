"use client";

import React from "react";
import {
  Tv,
  Store,
  CloudFog,
  Award,
  ArrowRight,
  Coins,
  TrendingUp,
} from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Card, CardContent } from "@/shared/ui/components/base/Card";
import { DomainContextHeader } from "@/shared/ui/components/layout/DomainContextHeader";

// 3-Pillar 데이터 (Indigo Violet Tone-on-Tone 계층화)
const PILLARS = [
  {
    key: "major",
    title: "🎬 Major League",
    subtitle: "시간 가치화 · 광고 시청 · PMP 획득",
    description:
      "공익·혁신 브랜드 광고와 설문에 참여하고 무위험 시민 자산(PMP)을 획득하세요. 1분으로 예측 자본을 쌓을 수 있습니다.",
    href: "/consume/major-league",
    color: "from-indigo-300 to-violet-300",
    bgColor: "from-indigo-950/80 via-slate-900/70 to-slate-950",
    stats: { count: 24, label: "개 캠페인" },
    rewardBadge: "+35~100 PMP",
    icon: <Tv className="w-8 h-8" />,
    image: "/images/cards/major-league.png",
  },
  {
    key: "minor",
    title: "🏪 Minor League",
    subtitle: "지역 상생 소비 · PMC 직접 적립",
    description:
      "동네 카페, 음식점, 독립서점에서 QR 결제하고 사회적 가치 자산(PMC)을 획득하세요. 골목 상권 선순환에 기여합니다.",
    href: "/consume/minor-league",
    color: "from-violet-300 to-purple-300",
    bgColor: "from-violet-950/80 via-slate-900/70 to-slate-950",
    stats: { count: 156, label: "개 상생매장" },
    rewardBadge: "결제액 3~10% PMC",
    icon: <Store className="w-8 h-8" />,
    image: "/images/cards/minor-league.png",
  },
  {
    key: "cloud",
    title: "💡 Cloud Funding",
    subtitle: "소셜 임팩트 펀딩 · PMC 리워드",
    description:
      "청년 창업, 독립 출판, 친환경 농업 프로젝트에 후원하고 PMC 보너스와 리워드를 공유받으세요.",
    href: "/consume/cloud-funding",
    color: "from-indigo-200 to-indigo-400",
    bgColor: "from-indigo-900/70 via-slate-900/70 to-slate-950",
    stats: { count: 42, label: "개 프로젝트" },
    rewardBadge: "펀딩액 5% PMC",
    icon: <CloudFog className="w-8 h-8" />,
    image: "/images/cards/cloud-funding.png",
  },
];

const HOT_ACTIVITIES = [
  {
    id: 1,
    title: "친환경 라이프스타일 브랜드 'GreenLife' 캠페인",
    type: "Major League · 광고",
    href: "/consume/major-league/ad-001",
    pmp: 50,
  },
  {
    id: 2,
    title: "동네 카페 '따뜻함' QR 상생 결제",
    type: "Minor League · 지역상점",
    href: "/consume/minor-league/m-001",
    pmc: 200,
  },
  {
    id: 3,
    title: "청년 농부의 로컬 채소 구독 프로젝트",
    type: "Cloud Funding · 임팩트",
    href: "/consume/cloud-funding/cf-003",
    rate: "+5% PMC 적립",
  },
];

export default function ConsumePage() {
  const totalEarned = 8420;

  return (
    <div className="min-h-screen bg-[#090b12] text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
        <DomainContextHeader
          domain="consume"
          title="💳 Consume · 가치 소비 생태계"
          subtitle="시민의 시간(광고 시청)을 PMP로 전환하고, 동네 상점 소비와 펀딩으로 지역경제 PMC를 창출합니다"
          metrics={[
            { label: "이번 달 누적 획득", value: totalEarned, unit: "P" },
            { label: "참여 상생 파트너", value: 222, unit: "곳" },
          ]}
        />

        {/* 3-Pillar Cards (Indigo Violet Tone-on-Tone) */}
        <section>
          <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-indigo-400" />
            <span>소비 3대 리그 선택</span>
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
                  <Card className="bg-slate-900/70 border-slate-800/90 hover:border-indigo-500/40 transition-all cursor-pointer group overflow-hidden h-full">
                    <div className="relative aspect-[16/10] overflow-hidden">
                      <img
                        src={pillar.image}
                        alt={pillar.title}
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div
                        className={`absolute inset-0 bg-gradient-to-t ${pillar.bgColor} opacity-90`}
                      />
                      <div className="absolute top-3 left-3 px-2.5 py-0.5 rounded-md bg-indigo-500/20 border border-indigo-400/30 text-indigo-200 text-[11px] font-bold z-10">
                        {pillar.rewardBadge}
                      </div>
                      <div className="relative z-10 flex flex-col items-center justify-center h-full p-4">
                        <div className="text-indigo-300">{pillar.icon}</div>
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
                      <div className="flex items-center justify-end text-xs text-slate-400 group-hover:text-indigo-300 transition-colors font-semibold">
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

        {/* 인기 활동 & 소비 철학 가이드 */}
        <div className="grid gap-6 lg:grid-cols-3">
          <section className="lg:col-span-2 space-y-3">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span>🔥 오늘의 인기 가치 소비</span>
            </h2>
            <div className="space-y-2.5">
              {HOT_ACTIVITIES.map((activity, index) => (
                <Link key={activity.id} href={activity.href} className="block">
                  <div className="flex items-center justify-between p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 hover:border-indigo-500/40 transition-all cursor-pointer group">
                    <div className="flex items-center gap-3.5">
                      <span className="w-7 h-7 rounded-lg bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-xs font-extrabold flex items-center justify-center">
                        {index + 1}
                      </span>
                      <div>
                        <p className="font-semibold text-sm text-white group-hover:text-indigo-300 transition-colors">
                          {activity.title}
                        </p>
                        <p className="text-xs text-slate-500">{activity.type}</p>
                      </div>
                    </div>
                    <span className="flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                      {activity.pmp && (
                        <>
                          <Coins className="w-3.5 h-3.5" /> +{activity.pmp} PMP
                        </>
                      )}
                      {activity.pmc && (
                        <>
                          <Coins className="w-3.5 h-3.5" /> +{activity.pmc} PMC
                        </>
                      )}
                      {activity.rate && (
                        <>
                          <Award className="w-3.5 h-3.5" /> {activity.rate}
                        </>
                      )}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-bold text-white">
              💡 시간·화폐·클라우드 3대 소비 철학
            </h2>
            <div className="space-y-2.5">
              <div className="p-3.5 rounded-xl bg-indigo-950/20 border border-indigo-500/20 flex items-center gap-3">
                <Tv className="w-5 h-5 text-indigo-400 shrink-0" />
                <div>
                  <p className="font-semibold text-white text-xs">
                    1. TimeConsume (Major League)
                  </p>
                  <p className="text-[11px] text-slate-400">
                    시민의 주의력(Attention)에 정당한 무위험 PMP 보상 지급
                  </p>
                </div>
              </div>
              <div className="p-3.5 rounded-xl bg-violet-950/20 border border-violet-500/20 flex items-center gap-3">
                <Store className="w-5 h-5 text-violet-400 shrink-0" />
                <div>
                  <p className="font-semibold text-white text-xs">
                    2. MoneyConsume (Minor League)
                  </p>
                  <p className="text-[11px] text-slate-400">
                    소상공인 매장 결제액의 일부를 지역 상생 PMC로 즉시 환원
                  </p>
                </div>
              </div>
              <div className="p-3.5 rounded-xl bg-indigo-900/15 border border-indigo-400/20 flex items-center gap-3">
                <CloudFog className="w-5 h-5 text-indigo-300 shrink-0" />
                <div>
                  <p className="font-semibold text-white text-xs">
                    3. CloudConsume (Cloud Funding)
                  </p>
                  <p className="text-[11px] text-slate-400">
                    혁신 프로젝트 후원을 통해 사회적 가치(PMC)와 리워드 공유
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
