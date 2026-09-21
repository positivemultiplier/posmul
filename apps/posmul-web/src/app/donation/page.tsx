"use client";

import React, { useState } from "react";
import { Building2, Star, Gift, ArrowRight, Heart, TrendingUp, DollarSign, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Card, CardContent } from "@/shared/ui/components/base/Card";

// 3-Pillar 데이터
const PILLARS = [
  {
    key: "institute",
    title: "🏛️ Institute",
    subtitle: "검증된 기관 기부",
    description: "NGO, 비영리 단체의 캠페인에 직접 후원하세요. 투명성 보고서로 기부금 사용 내역을 확인할 수 있습니다.",
    href: "/donation/institute",
    color: "from-blue-500 to-indigo-500",
    bgColor: "from-blue-900/50 to-slate-900",
    stats: { count: 42, label: "개 기관" },
    icon: <Building2 className="w-8 h-8" />,
    image: "/images/cards/donation_institute.png",
  },
  {
    key: "leader",
    title: "🌟 Leader",
    subtitle: "오피니언 리더 후원",
    description: "신뢰하는 인플루언서가 추천하는 캠페인에 동참하세요. 리더와 함께 선한 영향력을 확산하세요.",
    href: "/donation/opinion-leader",
    color: "from-purple-500 to-pink-500",
    bgColor: "from-purple-900/50 to-slate-900",
    stats: { count: 128, label: "명 리더" },
    icon: <Star className="w-8 h-8" />,
    image: "/images/cards/donation_leader.png",
  },
  {
    key: "direct",
    title: "🎁 Direct",
    subtitle: "물품 직접 기부",
    description: "필요한 곳에 필요한 물품을 직접 전달하세요. 의류, 식품, 교육용품 등 다양한 펀딩에 참여할 수 있습니다.",
    href: "/donation/direct",
    color: "from-emerald-500 to-teal-500",
    bgColor: "from-emerald-900/50 to-slate-900",
    stats: { count: 56, label: "개 프로젝트" },
    icon: <Gift className="w-8 h-8" />,
    image: "/images/cards/donation_direct.png",
  },
];

// 초기 기부 목록
const INITIAL_DONATIONS = [
  { id: 1, user: "User***21", amount: 10000, target: "환경재단", time: "1분 전" },
  { id: 2, user: "User***87", amount: 5000, target: "아동복지센터", time: "3분 전" },
  { id: 3, user: "User***45", amount: 25000, target: "김OO 리더 캠페인", time: "5분 전" },
];

export default function DonationPage() {
  const [totalDonation, setTotalDonation] = useState(124500000);
  const [totalDonors, setTotalDonors] = useState(15420);
  const [todayCount, setTodayCount] = useState(142);
  const [liveDonations, setLiveDonations] = useState(INITIAL_DONATIONS);

  // Quick Donation Form Modal State
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
          userId: "00000000-0000-0000-0000-000000000001", // Demo System User
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

        setSuccessMessage(`성공적으로 ${amount.toLocaleString()} PMC를 기부하셨습니다!`);
        setTimeout(() => {
          setIsModalOpen(false);
          setSuccessMessage(null);
        }, 1500);
      } else {
        alert(data.error || "기부에 실패했습니다.");
      }
    } catch (err: any) {
      console.error(err);
      alert("기부 처리 도중 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-950 to-slate-950 text-slate-200">
      {/* Header */}
      <header className="sticky top-0 z-10 backdrop-blur-xl bg-purple-950/80 border-b border-purple-800/50">
        <div className="max-w-4xl mx-auto p-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
              💜 Donation
            </h1>
            <p className="text-sm text-purple-400/70">세상을 바꾸는 따뜻한 마음</p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 rounded-xl font-semibold text-sm bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white shadow-lg transition-all flex items-center gap-1.5"
            >
              <Heart className="w-4 h-4 fill-white" /> 즉시 기부하기
            </button>
            <div className="text-right hidden sm:block">
              <p className="text-xs text-slate-400">오늘 참여</p>
              <p className="text-xl font-bold text-purple-400">
                <span className="text-2xl">{todayCount}</span>
                <span className="text-sm ml-1">명</span>
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-8">
        {/* Stats Summary */}
        <section className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 text-center">
            <p className="text-xs text-slate-500 mb-1">총 누적 기부금</p>
            <p className="text-2xl font-bold text-white">
              {(totalDonation / 100000000).toFixed(2)}억
              <span className="text-sm text-purple-400 ml-1">PMC</span>
            </p>
          </div>
          <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 text-center">
            <p className="text-xs text-slate-500 mb-1">함께한 기부자</p>
            <p className="text-2xl font-bold text-white">
              {totalDonors.toLocaleString()}
              <span className="text-sm text-slate-400 ml-1">명</span>
            </p>
          </div>
        </section>

        {/* Live Ticker */}
        <section className="p-4 rounded-xl bg-slate-900/50 border border-slate-800">
          <div className="flex items-center gap-2 mb-3">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            <span className="text-sm font-medium text-slate-400">실시간 기부 현황</span>
          </div>
          <div className="space-y-2">
            {liveDonations.map((donation) => (
              <div key={donation.id} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Heart className="w-4 h-4 text-pink-400" />
                  <span className="text-slate-300 font-medium">{donation.user}</span>
                  <span className="text-purple-400 font-semibold">{donation.amount.toLocaleString()} PMC</span>
                  <span className="text-slate-500">→</span>
                  <span className="text-slate-300">{donation.target}</span>
                </div>
                <span className="text-xs text-slate-500">{donation.time}</span>
              </div>
            ))}
          </div>
        </section>

        {/* 3-Pillar Cards */}
        <section>
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-purple-400" />
            기부 방법 선택
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
                  <Card className="bg-slate-900/70 border-slate-800 hover:border-purple-700/50 transition-all cursor-pointer group overflow-hidden h-full">
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
                      <div className="flex items-center justify-end text-xs text-slate-500 group-hover:text-purple-400 transition-colors">
                        바로가기 <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        </section>

        {/* 기부 가이드 */}
        <section>
          <h2 className="text-lg font-bold text-white mb-4">💡 기부 가이드</h2>
          <div className="grid gap-3 md:grid-cols-3">
            <div className="p-4 rounded-xl bg-blue-900/20 border border-blue-800/30 text-center">
              <Building2 className="w-6 h-6 text-blue-400 mx-auto mb-2" />
              <p className="font-medium text-white text-sm">기관 기부</p>
              <p className="text-xs text-slate-400">검증된 단체 후원</p>
            </div>
            <div className="p-4 rounded-xl bg-purple-900/20 border border-purple-800/30 text-center">
              <Star className="w-6 h-6 text-purple-400 mx-auto mb-2" />
              <p className="font-medium text-white text-sm">리더 후원</p>
              <p className="text-xs text-slate-400">인플루언서 캠페인</p>
            </div>
            <div className="p-4 rounded-xl bg-emerald-900/20 border border-emerald-800/30 text-center">
              <Gift className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
              <p className="font-medium text-white text-sm">직접 기부</p>
              <p className="text-xs text-slate-400">물품 펀딩 참여</p>
            </div>
          </div>
        </section>
      </main>

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
                  <Heart className="w-5 h-5 text-pink-400 fill-pink-400" /> 즉시 기부 동참
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
                  <p className="text-emerald-300 font-semibold">{successMessage}</p>
                </div>
              ) : (
                <form onSubmit={handleDonateSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">기부 대상 선택</label>
                    <select
                      value={targetName}
                      onChange={(e) => setTargetName(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-purple-500"
                    >
                      <option value="환경재단">🌱 환경재단 (지구 온난화 방지)</option>
                      <option value="아동복지센터">👶 아동복지센터 (미래 세대 지원)</option>
                      <option value="김OO 리더 캠페인">🌟 김OO 리더 기후변화 프로젝트</option>
                      <option value="독거노인 도시락 펀딩">🍱 독거노인 따뜻한 도시락</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">기부 금액 (PMC)</label>
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
                      className="px-5 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-xs font-semibold text-white shadow disabled:opacity-50"
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

