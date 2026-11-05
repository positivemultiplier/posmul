"use client";

import React, { useState } from "react";
import {
  Building2,
  Star,
  Gift,
  ArrowRight,
  Heart,
  TrendingUp,
  DollarSign,
  CheckCircle2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Card, CardContent } from "@/shared/ui/components/base/Card";
import { DomainContextHeader } from "@/shared/ui/components/layout/DomainContextHeader";

// 3-Pillar 데이터 (Rose Amethyst Tone-on-Tone 계층화)
const PILLARS = [
  {
    key: "direct",
    title: "🎁 Direct",
    subtitle: "물품 직접 기부 · 생활 밀착 지원",
    description:
      "의류, 식품, 교육용품, 의료기기를 필요한 이웃에게 직접 전달하세요. 중간 유통 비용 없이 투명하게 집행됩니다.",
    href: "/donation/direct",
    color: "from-purple-300 to-fuchsia-300",
    bgColor: "from-purple-950/80 via-slate-900/70 to-slate-950",
    stats: { count: 56, label: "개 프로젝트" },
    rewardBadge: "PMC 100% 물품전달",
    icon: <Gift className="w-8 h-8" />,
    image: "/images/cards/donation_direct.png",
  },
  {
    key: "institute",
    title: "🏛️ Institute",
    subtitle: "검증된 공익 기관 기부",
    description:
      "투명성 등급(AAA~A)이 검증된 NGO·비영리 단체의 캠페인에 직접 후원하고 세액공제(Gift Aid) 영수증을 발급받으세요.",
    href: "/donation/institute",
    color: "from-fuchsia-300 to-pink-300",
    bgColor: "from-fuchsia-950/80 via-slate-900/70 to-slate-950",
    stats: { count: 42, label: "개 검증기관" },
    rewardBadge: "투명성 검증 · 세액공제",
    icon: <Building2 className="w-8 h-8" />,
    image: "/images/cards/donation_institute.png",
  },
  {
    key: "leader",
    title: "🌟 Leader",
    subtitle: "오피니언 리더 연대 후원",
    description:
      "신뢰하는 전문가·인플루언서가 보증하는 공익 캠페인에 동참하여 선한 영향력의 승수 효과를 확산하세요.",
    href: "/donation/opinion-leader",
    color: "from-purple-200 to-purple-400",
    bgColor: "from-purple-900/70 via-slate-900/70 to-slate-950",
    stats: { count: 128, label: "명 리더" },
    rewardBadge: "연대 승수 효과",
    icon: <Star className="w-8 h-8" />,
    image: "/images/cards/donation_leader.png",
  },
];

const INITIAL_DONATIONS = [
  { id: 1, user: "User***21", amount: 10000, target: "환경재단", time: "1분 전" },
  {
    id: 2,
    user: "User***87",
    amount: 5000,
    target: "아동복지센터",
    time: "3분 전",
  },
  {
    id: 3,
    user: "User***45",
    amount: 25000,
    target: "김OO 리더 캠페인",
    time: "5분 전",
  },
];

export default function DonationPage() {
  const [totalDonation, setTotalDonation] = useState(124500000);
  const [totalDonors, setTotalDonors] = useState(15420);
  const [todayCount, setTodayCount] = useState(142);
  const [liveDonations, setLiveDonations] = useState(INITIAL_DONATIONS);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [targetName, setTargetName] = useState("환경재단");
  const [amount, setAmount] = useState<number>(1000);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleDonateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) return;
    setIsSubmitting(true);
    setSuccessMessage(null);

    try {
      const res = await fetch("/api/donation/donate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: "00000000-0000-0000-0000-000000000001",
          targetName,
          amount,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setTotalDonation((prev) => prev + amount);
        setTotalDonors((prev) => prev + 1);
        setTodayCount((prev) => prev + 1);

        const newDonation = {
          id: Date.now(),
          user: "나 (User***01)",
          amount,
          target: targetName,
          time: "방금 전",
        };
        setLiveDonations((prev) => [newDonation, ...prev]);

        setSuccessMessage(
          `성공적으로 ${amount.toLocaleString()} PMC를 기부하셨습니다!`
        );
        setTimeout(() => {
          setIsModalOpen(false);
          setSuccessMessage(null);
        }, 1500);
      } else {
        alert(data.error || "기부에 실패했습니다.");
      }
    } catch (err) {
      console.error(err);
      alert("기부 처리 도중 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#090b12] text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
        <DomainContextHeader
          domain="donation"
          title="💜 Donation · 시민 직접 예산 집행"
          subtitle="관료·정치인을 거치지 않고, 예측 적중과 상생 소비로 획득한 PMC로 필요한 곳에 직접 예산을 집행합니다"
          metrics={[
            {
              label: "누적 시민 집행액",
              value: `${(totalDonation / 100000000).toFixed(2)}억`,
              unit: "PMC",
            },
            { label: "오늘 참여 시민", value: todayCount, unit: "명" },
          ]}
          actionSlot={
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 rounded-xl font-bold text-xs bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-white shadow-md shadow-purple-950/50 transition-all flex items-center gap-1.5"
            >
              <Heart className="w-3.5 h-3.5 fill-white" /> 즉시 기부하기
            </button>
          }
        />

        {/* 3-Pillar Cards (Rose Amethyst Tone-on-Tone) */}
        <section>
          <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-purple-400" />
            <span>시민 예산 집행 3대 방식</span>
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
                  <Card className="bg-slate-900/70 border-slate-800/90 hover:border-purple-500/40 transition-all cursor-pointer group overflow-hidden h-full">
                    <div className="relative aspect-[16/10] overflow-hidden">
                      <img
                        src={pillar.image}
                        alt={pillar.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div
                        className={`absolute inset-0 bg-gradient-to-t ${pillar.bgColor} opacity-90`}
                      />

                      <div className="absolute top-3 left-3 px-2.5 py-0.5 rounded-md bg-purple-500/20 border border-purple-400/30 text-purple-200 text-[11px] font-bold z-10">
                        {pillar.rewardBadge}
                      </div>

                      <div className="absolute inset-0 flex flex-col items-center justify-center p-4 z-10">
                        <div className="text-purple-300">{pillar.icon}</div>
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
                      <div className="flex items-center justify-end text-xs text-slate-400 group-hover:text-purple-300 transition-colors font-semibold">
                        집행하러 가기{" "}
                        <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        </section>

        {/* 실시간 기부 현황 & 직접민주주의 철학 안내 */}
        <div className="grid gap-6 lg:grid-cols-3">
          <section className="lg:col-span-2 p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
                </span>
                <span className="text-sm font-bold text-white">
                  실시간 시민 예산 집행 현황
                </span>
              </div>
              <span className="text-xs text-slate-400">
                총 {totalDonors.toLocaleString()}명 동참
              </span>
            </div>
            <div className="space-y-2.5 pt-1">
              {liveDonations.map((donation) => (
                <div
                  key={donation.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-white/[0.04] text-sm"
                >
                  <div className="flex items-center gap-2.5">
                    <Heart className="w-4 h-4 text-purple-400" />
                    <span className="text-slate-200 font-semibold">
                      {donation.user}
                    </span>
                    <span className="text-purple-300 font-bold">
                      {donation.amount.toLocaleString()} PMC
                    </span>
                    <span className="text-slate-600">➔</span>
                    <span className="text-slate-300">{donation.target}</span>
                  </div>
                  <span className="text-xs text-slate-500">{donation.time}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-bold text-white">
              💡 왜 시민이 직접 기부를 집행하는가?
            </h2>
            <div className="space-y-2.5">
              <div className="p-3.5 rounded-xl bg-purple-950/20 border border-purple-500/20 flex items-center gap-3">
                <Gift className="w-5 h-5 text-purple-400 shrink-0" />
                <div>
                  <p className="font-semibold text-white text-xs">
                    1. 철의 삼각(관료 카르텔) 극복
                  </p>
                  <p className="text-[11px] text-slate-400">
                    복잡한 행정 전달체계 없이 수혜자에게 즉시 가치 전달
                  </p>
                </div>
              </div>
              <div className="p-3.5 rounded-xl bg-fuchsia-950/20 border border-fuchsia-500/20 flex items-center gap-3">
                <Building2 className="w-5 h-5 text-fuchsia-400 shrink-0" />
                <div>
                  <p className="font-semibold text-white text-xs">
                    2. 100% 온체인/DB 투명성 검증
                  </p>
                  <p className="text-[11px] text-slate-400">
                    신뢰도 등급(AAA~A)과 영수증(Gift Aid) 자동 연동
                  </p>
                </div>
              </div>
              <div className="p-3.5 rounded-xl bg-purple-900/15 border border-purple-400/20 flex items-center gap-3">
                <Star className="w-5 h-5 text-purple-300 shrink-0" />
                <div>
                  <p className="font-semibold text-white text-xs">
                    3. 동네 긍정승수 & 명예의 전당 반영
                  </p>
                  <p className="text-[11px] text-slate-400">
                    집행한 PMC는 우리 동네(읍·면·동) 시민 위상 점수로 축적
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* Quick Donation Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-purple-800/50 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Heart className="w-5 h-5 text-purple-400 fill-purple-400" />{" "}
                  즉시 기부 동참
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-slate-400 hover:text-white text-sm"
                >
                  ✕
                </button>
              </div>

              {successMessage ? (
                <div className="py-8 text-center space-y-3">
                  <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto animate-bounce" />
                  <p className="text-emerald-300 font-semibold">
                    {successMessage}
                  </p>
                </div>
              ) : (
                <form onSubmit={handleDonateSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">
                      기부 대상 선택
                    </label>
                    <select
                      value={targetName}
                      onChange={(e) => setTargetName(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-purple-500"
                    >
                      <option value="환경재단">
                        🌱 환경재단 (지구 온난화 방지)
                      </option>
                      <option value="아동복지센터">
                        👶 아동복지센터 (미래 세대 지원)
                      </option>
                      <option value="김OO 리더 캠페인">
                        🌟 김OO 리더 기후변화 프로젝트
                      </option>
                      <option value="독거노인 도시락 펀딩">
                        🍱 독거노인 따뜻한 도시락
                      </option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">
                      기부 금액 (PMC)
                    </label>
                    <div className="relative">
                      <DollarSign className="w-4 h-4 text-purple-400 absolute left-3 top-3" />
                      <input
                        type="number"
                        min="100"
                        step="100"
                        value={amount}
                        onChange={(e) => setAmount(Number(e.target.value))}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-3 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500"
                        placeholder="기부할 PMC 입력"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {[1000, 5000, 10000].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setAmount(preset)}
                        className="py-1.5 rounded bg-purple-950/50 border border-purple-800/40 text-xs text-purple-300 hover:bg-purple-900/60"
                      >
                        +{preset.toLocaleString()} PMC
                      </button>
                    ))}
                  </div>

                  <div className="pt-2 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300"
                    >
                      취소
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-5 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-xs font-semibold text-white shadow disabled:opacity-50"
                    >
                      {isSubmitting ? "처리 중..." : "기부 완료하기"}
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
