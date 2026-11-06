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
  PackageCheck,
  ShieldCheck,
  Award,
  Sparkles,
  Users,
  Coins,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Card, CardContent } from "@/shared/ui/components/base/Card";
import { DomainContextHeader } from "@/shared/ui/components/layout/DomainContextHeader";

// 3대 핵심 기부 필러 (3RowNavbar 연동: direct, institute, opinion-leader)
const PILLARS = [
  {
    key: "direct",
    title: "📦 K-물품 직접기부 (Direct Goods)",
    subtitle: "한국 기업 물품 구매 · 수출 승수 효과",
    description:
      "현금 대신 LG·삼성 고효율 가전, CJ 햇반 등 대한민국 기업의 실물 제품을 직접 구매하여 전달합니다. 취약계층 구호와 함께 국내 기업의 매출 및 수출을 촉진하는 승수 기부 모델입니다.",
    href: "/donation/direct",
    color: "from-purple-300 to-indigo-300",
    bgColor: "from-purple-950/80 via-slate-900/70 to-slate-950",
    stats: { count: 56, label: "개 물품 펀딩" },
    rewardBadge: "영국식 Tied Aid · 수출 승수",
    icon: <PackageCheck className="w-8 h-8 text-indigo-400" />,
    image: "/images/cards/donation_direct.png",
  },
  {
    key: "institute",
    title: "🏛️ 마일스톤 검증 NGO (Institute)",
    subtitle: "스마트 에스크로 · 영수증 시민 검증",
    description:
      "초록우산, 유니세프 등 공인 NGO와 제휴하되, 기부금을 한 번에 주지 않고 3단계(30% ➔ 40% ➔ 30%)로 나누어 현장 사진과 영수증을 시민이 투표로 승인해야 다음 기부금이 집행됩니다.",
    href: "/donation/institute",
    color: "from-emerald-300 to-teal-300",
    bgColor: "from-emerald-950/80 via-slate-900/70 to-slate-950",
    stats: { count: 42, label: "개 검증기관" },
    rewardBadge: "마일스톤 투표 · 세액공제",
    icon: <ShieldCheck className="w-8 h-8 text-emerald-400" />,
    image: "/images/cards/donation_institute.png",
  },
  {
    key: "leader",
    title: "🌟 의인 포상 & 꿈의 사다리 (Leader)",
    subtitle: "비과세 공익 포상금 · Pay-it-Forward",
    description:
      "청년 스카우터가 발굴한 숨은 의인에게 소득세법 제18조에 따른 비과세 포상금을 지급하고, 자립준비청년의 꿈에 무이자 펀딩하여 성공 시 후배를 위해 자발적으로 상환하는 사다리를 잇습니다.",
    href: "/donation/opinion-leader",
    color: "from-amber-200 to-amber-400",
    bgColor: "from-amber-950/80 via-slate-900/70 to-slate-950",
    stats: { count: 128, label: "명 의인 & 꿈 펀딩" },
    rewardBadge: "비과세 포상금 · 상환율 96%",
    icon: <Award className="w-8 h-8 text-amber-400" />,
    image: "/images/cards/donation_leader.png",
  },
];

// 현재 펀딩 진행 중인 대표 추천 물품 프로젝트 (상세보기 링크 지원)
const FEATURED_GOODS_PROJECTS = [
  {
    id: "proj-goods-001",
    title: "LG전자 고효율 냉장고·세탁기 취약계층 조손가정 지원",
    subtitle: "한국 대표 가전 제조사 직구매 ➔ 에너지 빈곤층 지원",
    manufacturer: "LG전자 (K-가전)",
    itemSpec: "1등급 고효율 가전 세트",
    unitPrice: 6000,
    targetQuantity: 50,
    currentQuantity: 36,
    achievementRate: 72,
    href: "/donation/direct/item/proj-goods-001",
    badge: "K-가전 수출승수",
    badgeColor: "bg-indigo-950 text-indigo-300 border-indigo-800",
  },
  {
    id: "proj-goods-002",
    title: "CJ제일제당 햇반·영양 안심키트 결식우려 아동 1,000명 구호",
    subtitle: "K-푸드 대표 식품사 직구매 ➔ 방학 중 결식 공백 해결",
    manufacturer: "CJ제일제당 (K-푸드)",
    itemSpec: "햇반·비비고 영양 안심팩",
    unitPrice: 150,
    targetQuantity: 1000,
    currentQuantity: 826,
    achievementRate: 83,
    href: "/donation/direct/item/proj-goods-002",
    badge: "K-푸드 내수촉진",
    badgeColor: "bg-purple-950 text-purple-300 border-purple-800",
  },
  {
    id: "proj-hero-001",
    title: "이달의 의인상: 화재 현장에서 이웃 5명을 구한 청년 의인 포상",
    subtitle: "청년 소셜 스카우터 발굴 ➔ 소득세법 시행령 제18조 100% 비과세",
    manufacturer: "PosMul 공익심사위",
    itemSpec: "비과세 공익 포상금 펀드",
    unitPrice: 1000,
    targetQuantity: 100,
    currentQuantity: 89,
    achievementRate: 89,
    href: "/donation/opinion-leader",
    badge: "비과세 포상금",
    badgeColor: "bg-amber-950 text-amber-300 border-amber-800",
  },
];

const INITIAL_DONATIONS = [
  { id: 1, user: "Citizen***21", amount: 10000, target: "LG 가전 지원 펀드", time: "1분 전" },
  { id: 2, user: "Citizen***87", amount: 5000, target: "CJ 결식아동 영양키트", time: "3분 전" },
  { id: 3, user: "Citizen***45", amount: 25000, target: "이달의 의인 포상금", time: "5분 전" },
];

export default function DonationPage() {
  const [totalDonation, setTotalDonation] = useState(124500000);
  const [totalDonors, setTotalDonors] = useState(15420);
  const [todayCount, setTodayCount] = useState(142);
  const [liveDonations, setLiveDonations] = useState(INITIAL_DONATIONS);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [targetName, setTargetName] = useState("LG 가전 지원 펀드");
  const [amount, setAmount] = useState<number>(1000);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleDonateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) return;
    setIsSubmitting(true);
    setSuccessMessage(null);

    try {
      setTotalDonation((prev) => prev + amount);
      setTotalDonors((prev) => prev + 1);
      setTodayCount((prev) => prev + 1);

      const newDonation = {
        id: Date.now(),
        user: "나 (시민주권자)",
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
    } catch (err) {
      console.error(err);
      alert("기부 처리 도중 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 selection:bg-blue-500 selection:text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-10">
        {/* 상단 도메인 컨텍스트 헤더 (3RowNavbar 톤온톤 일치) */}
        <DomainContextHeader
          domain="donation"
          title="💖 Donation · 시민 소셜 임팩트 기부센터"
          subtitle="예측 성공으로 획득한 PMC로 한국 기업 물품 지원(수출 승수), 투명 NGO 에스크로, 비과세 의인 포상에 직접 예산을 집행하세요"
          metrics={[
            { label: "누적 기부액", value: totalDonation, unit: "PMC" },
            { label: "참여 시민", value: totalDonors, unit: "명" },
            { label: "오늘 기부", value: todayCount, unit: "건" },
          ]}
        >
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            <div className="text-xs text-slate-400">
              <span className="text-amber-400 font-bold">1 PMC = 1원 가치 환류</span> · 시민이 직접 집행하는 직접민주주의 예산 훈련
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 via-fuchsia-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-xs shadow-lg shadow-purple-500/20 active:scale-95 transition-all flex items-center justify-center gap-1.5 shrink-0"
            >
              <Heart className="w-4 h-4 fill-current text-rose-300" />
              <span>즉시 기부 집행하기</span>
            </button>
          </div>
        </DomainContextHeader>

        {/* 🌟 1. 3대 대형 진입 카드 (3-Pillars Hub Cards) */}
        <section className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="text-xl font-black text-white flex items-center gap-2">
              <span>🏛️ PosMul 3대 기부 필러 둘러보기</span>
            </h2>
            <span className="text-xs text-slate-500">
              카드를 클릭하여 카테고리별 상세 목록 및 개별 프로젝트를 확인하세요
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {PILLARS.map((pillar) => (
              <Link
                key={pillar.key}
                href={pillar.href}
                className="group relative flex flex-col justify-between p-6 sm:p-7 rounded-3xl bg-slate-900/60 border border-slate-800 hover:border-purple-500/50 hover:bg-slate-900/90 transition-all shadow-xl hover:shadow-purple-500/10 overflow-hidden"
              >
                {/* 상단 뱃지 & 아이콘 */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 group-hover:scale-110 transition-transform">
                      {pillar.icon}
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-purple-950/80 text-purple-300 border border-purple-800/60">
                      {pillar.rewardBadge}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-lg font-black text-white group-hover:text-purple-300 transition-colors">
                      {pillar.title}
                    </h3>
                    <p className="text-xs font-bold text-slate-400 pt-0.5">
                      {pillar.subtitle}
                    </p>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed line-clamp-3">
                    {pillar.description}
                  </p>
                </div>

                {/* 하단 화살표 & 통계 */}
                <div className="pt-6 border-t border-slate-800/80 flex items-center justify-between text-xs mt-4">
                  <span className="text-slate-400 font-semibold font-mono">
                    {pillar.stats.count} {pillar.stats.label}
                  </span>
                  <span className="flex items-center gap-1 font-bold text-purple-400 group-hover:translate-x-1.5 transition-transform">
                    <span>목록 및 상세보기</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* 📦 2. 현재 활성 펀딩 중인 추천 물품기부 프로젝트 (카드형 상세 연결) */}
        <section className="space-y-4 pt-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div>
              <h2 className="text-xl font-black text-white flex items-center gap-2">
                <span>🔥 실시간 추천 물품 펀딩 프로젝트</span>
              </h2>
              <p className="text-xs text-slate-400">
                한국 제조사의 실물 물품을 대량 구매하여 취약계층에 전달하는 프로젝트입니다. 카드를 클릭하면 상세 견적서와 이야기를 볼 수 있습니다.
              </p>
            </div>
            <Link
              href="/donation/direct"
              className="text-xs text-purple-400 hover:text-purple-300 font-bold flex items-center gap-1 self-start sm:self-auto shrink-0"
            >
              <span>전체 물품 목록 보기</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {FEATURED_GOODS_PROJECTS.map((proj) => (
              <Link
                key={proj.id}
                href={proj.href}
                className="group flex flex-col justify-between p-5 rounded-2xl bg-slate-900/50 border border-slate-800 hover:border-slate-700 hover:bg-slate-900/80 transition-all shadow-lg space-y-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black border ${proj.badgeColor}`}>
                      {proj.badge}
                    </span>
                    <span className="text-[11px] font-bold text-slate-400">
                      {proj.manufacturer}
                    </span>
                  </div>

                  <h4 className="text-sm font-extrabold text-white group-hover:text-purple-300 transition-colors line-clamp-2 leading-snug">
                    {proj.title}
                  </h4>
                  <p className="text-[11px] text-slate-400 line-clamp-1">
                    {proj.subtitle}
                  </p>
                </div>

                {/* 프로그레스 & 물품 현황 */}
                <div className="space-y-2 pt-2 border-t border-slate-800/60">
                  <div className="flex justify-between text-[11px] font-bold">
                    <span className="text-purple-400">{proj.achievementRate}% 달성</span>
                    <span className="text-slate-300 font-mono">
                      {proj.currentQuantity} / {proj.targetQuantity} 전달
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-slate-950 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-purple-500 to-indigo-500"
                      style={{ width: `${proj.achievementRate}%` }}
                    />
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-slate-500 pt-1">
                    <span>단가: {proj.unitPrice.toLocaleString()} PMC</span>
                    <span className="text-purple-400 font-semibold group-hover:underline flex items-center gap-0.5">
                      상세보기 <ArrowRight className="w-2.5 h-2.5" />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* 📜 3. 실시간 기부 타임라인 */}
        <section className="p-6 rounded-3xl bg-slate-900/40 border border-slate-800/80 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>실시간 시민 기부 집행 현황</span>
            </h3>
            <span className="text-[11px] text-slate-500">방금 전까지 집행된 시민 예산</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {liveDonations.map((d) => (
              <div
                key={d.id}
                className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 flex justify-between items-center text-xs"
              >
                <div>
                  <div className="font-bold text-slate-200">{d.target}</div>
                  <div className="text-[10px] text-slate-500">{d.user} · {d.time}</div>
                </div>
                <span className="font-black text-amber-400 font-mono">
                  +{d.amount.toLocaleString()} PMC
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* 💖 즉시 기부 모달 */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-purple-800/50 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                  <Heart className="w-5 h-5 text-rose-500 fill-rose-500" />
                  <span>즉시 기부 집행</span>
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg"
                >
                  ✕
                </button>
              </div>

              {successMessage ? (
                <div className="py-8 text-center space-y-3">
                  <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto animate-bounce" />
                  <p className="text-emerald-300 font-bold text-sm">
                    {successMessage}
                  </p>
                </div>
              ) : (
                <form onSubmit={handleDonateSubmit} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-300">
                      기부 대상 펀드 선택
                    </label>
                    <select
                      value={targetName}
                      onChange={(e) => setTargetName(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-purple-500"
                    >
                      <option value="LG 가전 지원 펀드">
                        📦 LG전자 고효율 가전 지원 펀드 (수출 승수)
                      </option>
                      <option value="CJ 결식아동 영양키트">
                        🍚 CJ제일제당 햇반·식품 구호 펀드 (K-푸드)
                      </option>
                      <option value="초록우산 주거안정 에스크로">
                        🤝 초록우산 마일스톤 검증 펀드 (영수증 투표)
                      </option>
                      <option value="이달의 의인 포상금">
                        🦸‍♂️ 숨은 의인 비과세 포상금 펀드 (청년 발굴)
                      </option>
                      <option value="자립청년 꿈의 사다리">
                        🌱 자립준비청년 카페 창업 (Pay-it-Forward)
                      </option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-300">
                      기부 금액 (PMC)
                    </label>
                    <div className="relative">
                      <DollarSign className="w-4 h-4 text-purple-400 absolute left-3 top-2.5" />
                      <input
                        type="number"
                        min="100"
                        step="100"
                        value={amount}
                        onChange={(e) => setAmount(Number(e.target.value))}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white font-bold focus:outline-none focus:border-purple-500"
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
                        className="py-1.5 rounded-xl bg-purple-950/50 border border-purple-800/40 text-xs font-bold text-purple-300 hover:bg-purple-900/60"
                      >
                        +{preset.toLocaleString()} PMC
                      </button>
                    ))}
                  </div>

                  <div className="pt-2 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="px-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs font-bold text-slate-400"
                    >
                      취소
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-xs font-extrabold text-white shadow-lg disabled:opacity-50"
                    >
                      {isSubmitting ? "집행 중..." : "기부 집행 완료"}
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
