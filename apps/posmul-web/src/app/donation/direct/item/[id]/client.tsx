"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Package,
  Heart,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface FundingProject {
  id: string;
  title: string;
  description: string;
  category: string;
  target_beneficiary: string;
  product_name: string;
  manufacturer: string;
  unit_price: number;
  target_quantity: number;
  current_quantity: number;
  achievementRate: number;
  images: string[];
}

interface DirectDonationDetailClientProps {
  project: FundingProject;
  isLoggedIn: boolean;
  currentUserId: string | null;
}

const CATEGORY_ICON_MAP: Record<string, string> = {
  electronics: "🔌",
  food: "🍚",
  clothing: "👕",
  education: "📚",
  medical: "💊",
};

export function DirectDonationDetailClient({
  project,
  isLoggedIn,
  currentUserId,
}: DirectDonationDetailClientProps) {
  const [donateQuantity, setDonateQuantity] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleQuantityChange = (delta: number) => {
    setDonateQuantity((prev) => Math.max(1, prev + delta));
  };

  const handleDonate = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
    }, 600);
  };

  const totalAmount = donateQuantity * project.unit_price;
  const categoryIcon = CATEGORY_ICON_MAP[project.category] || "📦";

  return (
    <div className="min-h-screen bg-[#090b12] text-slate-100 pb-24">
      {/* Top Navigation Bar */}
      <div className="border-b border-slate-800/80 bg-slate-950/60 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link
            href="/donation/direct"
            className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>K-물품 직접기부 목록</span>
          </Link>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-300 border border-purple-500/30">
              영국식 Tied Aid · 수출 승수
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column (7 cols): Visual & Story */}
          <div className="lg:col-span-7 space-y-6">
            {/* Visual Hero Card */}
            <div className="relative rounded-3xl overflow-hidden border border-slate-800 bg-gradient-to-br from-purple-950/40 via-slate-900 to-slate-950 p-8 sm:p-10 shadow-2xl">
              <div className="absolute top-4 right-4 flex items-center gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-900/90 text-purple-300 border border-purple-500/30">
                  {project.manufacturer}
                </span>
              </div>

              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-purple-500/20 to-indigo-500/20 border border-purple-500/30 flex items-center justify-center text-5xl mb-6 shadow-inner">
                  {categoryIcon}
                </div>
                <span className="text-xs font-semibold tracking-wider text-purple-400 uppercase mb-2">
                  K-Impact Goods Direct Funding
                </span>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white max-w-lg leading-snug">
                  {project.title}
                </h1>
                <p className="mt-3 text-sm text-slate-400 max-w-md">
                  수혜 대상: <strong className="text-slate-200">{project.target_beneficiary}</strong>
                </p>
              </div>

              {/* Tied Aid Badge Banner */}
              <div className="mt-6 p-4 rounded-2xl bg-slate-950/70 border border-slate-800/90 flex items-start gap-3.5">
                <Sparkles className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div className="text-xs text-slate-300 space-y-1">
                  <p className="font-semibold text-amber-300">
                    K-물품 직접기부의 경제적 승수 효과 (Tied Aid Model)
                  </p>
                  <p className="text-slate-400 leading-relaxed">
                    단순 현금 지원이 아닌 대한민국 제조사의 실물 물품을 직구매하여 전달합니다. 취약계층 구호와 함께 국내 제조기업 매출 및 수출 경쟁력 강화로 이어집니다.
                  </p>
                </div>
              </div>
            </div>

            {/* Story & Description */}
            <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 sm:p-8 space-y-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Heart className="w-5 h-5 text-rose-400" />
                <span>프로젝트 이야기</span>
              </h2>
              <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
                {project.description}
              </p>
            </div>

            {/* Product Spec Table */}
            <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 sm:p-8 space-y-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Package className="w-5 h-5 text-purple-400" />
                <span>물품 상세 스펙 & 직구매 공급 정보</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800/80">
                  <span className="text-slate-500 block mb-1">지원 품목명</span>
                  <span className="font-semibold text-slate-200 text-sm">{project.product_name}</span>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800/80">
                  <span className="text-slate-500 block mb-1">제조사 / 공급처</span>
                  <span className="font-semibold text-slate-200 text-sm">{project.manufacturer}</span>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800/80">
                  <span className="text-slate-500 block mb-1">물품 개당 단가</span>
                  <span className="font-bold text-purple-300 text-sm">
                    {project.unit_price.toLocaleString()}원 (또는 PMC)
                  </span>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800/80">
                  <span className="text-slate-500 block mb-1">목표 수량 / 지원 현황</span>
                  <span className="font-bold text-white text-sm">
                    {project.current_quantity} / {project.target_quantity} 개 달성
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column (5 cols): Funding Progress & Donation Action */}
          <div className="lg:col-span-5 space-y-6">
            <div className="sticky top-24 rounded-3xl border border-purple-500/30 bg-gradient-to-b from-slate-900/90 via-slate-900/70 to-slate-950 p-6 sm:p-8 shadow-2xl space-y-6">
              {/* Progress Block */}
              <div>
                <div className="flex justify-between items-baseline mb-2">
                  <span className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-300">
                    {project.achievementRate}% 달성
                  </span>
                  <span className="text-xs text-slate-400">
                    목표 <strong className="text-slate-200">{project.target_quantity}</strong>개 중{" "}
                    <strong className="text-purple-300">{project.current_quantity}</strong>개 완료
                  </span>
                </div>
                <div className="h-3 bg-slate-800/90 rounded-full overflow-hidden p-0.5">
                  <motion.div
                    className="h-full bg-gradient-to-r from-purple-500 via-indigo-500 to-fuchsia-500 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, project.achievementRate)}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                  />
                </div>
              </div>

              {/* Quantity Selector */}
              <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>선물할 물품 수량</span>
                  <span className="text-purple-300 font-medium">개당 {project.unit_price.toLocaleString()}원</span>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <button
                    onClick={() => handleQuantityChange(-1)}
                    disabled={donateQuantity <= 1}
                    className="w-11 h-11 rounded-xl bg-slate-900 border border-slate-700/80 text-xl font-bold text-slate-200 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-all"
                  >
                    -
                  </button>
                  <div className="text-center">
                    <span className="text-3xl font-extrabold text-white tabular-nums">
                      {donateQuantity}
                    </span>
                    <span className="text-xs text-slate-400 ml-1.5">개</span>
                  </div>
                  <button
                    onClick={() => handleQuantityChange(1)}
                    className="w-11 h-11 rounded-xl bg-slate-900 border border-slate-700/80 text-xl font-bold text-slate-200 hover:bg-slate-800 flex items-center justify-center transition-all"
                  >
                    +
                  </button>
                </div>

                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                  <span className="text-xs text-slate-400">총 후원 금액</span>
                  <div className="text-right">
                    <div className="text-xl font-extrabold text-purple-300">
                      {totalAmount.toLocaleString()}원
                    </div>
                    <div className="text-[11px] text-slate-500">
                      또는 {totalAmount.toLocaleString()} PMC 결제
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <AnimatePresence mode="wait">
                {isSuccess ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-5 rounded-2xl bg-emerald-950/70 border border-emerald-500/40 text-center space-y-2"
                  >
                    <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                    <p className="font-bold text-emerald-200 text-sm">
                      {donateQuantity}개의 {project.product_name} 기부가 접수되었습니다!
                    </p>
                    <p className="text-xs text-emerald-300/80">
                      시민주권자님의 따뜻한 동행이 대한민국 제조사와 수혜 이웃 모두에게 큰 힘이 됩니다.
                    </p>
                    <button
                      onClick={() => setIsSuccess(false)}
                      className="mt-3 text-xs text-slate-300 underline hover:text-white"
                    >
                      추가로 선물하기
                    </button>
                  </motion.div>
                ) : (
                  <button
                    onClick={handleDonate}
                    disabled={isSubmitting}
                    className="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-base shadow-lg shadow-purple-600/30 transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <span>처리 중...</span>
                    ) : (
                      <>
                        <Heart className="w-5 h-5 fill-current" />
                        <span>{project.product_name} 선물하기</span>
                      </>
                    )}
                  </button>
                )}
              </AnimatePresence>

              {/* Transparency Notice */}
              <div className="space-y-2.5 pt-2 border-t border-slate-800/80 text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>제조사 직접 발주 및 직배송 설치 보증</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span>수혜자 수령 인수증 및 실물 사진 100% 투명 공개</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}