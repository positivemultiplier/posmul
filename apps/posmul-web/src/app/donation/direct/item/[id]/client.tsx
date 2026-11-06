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
  Coins,
  Flame,
  Building2,
  MapPin,
  Award,
  Zap,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { RecipientCenter } from "./page";

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
  recipients: RecipientCenter[];
  isLoggedIn: boolean;
  currentUserId: string | null;
}

const CATEGORY_ICON_MAP: Record<string, string> = {
  electronics: "🔌",
  food: "🍚",
  clothing: "👟",
  education: "📚",
  medical: "💊",
};

export function DirectDonationDetailClient({
  project,
  recipients: initialRecipients,
  isLoggedIn,
  currentUserId,
}: DirectDonationDetailClientProps) {
  // 기부처 리스트 및 실시간 기부 상태 관리
  const [recipientList, setRecipientList] = useState<RecipientCenter[]>(
    initialRecipients && initialRecipients.length > 0
      ? initialRecipients
      : [
          {
            id: "rec-default-1",
            name: "햇살지역아동센터",
            type: "지역아동센터",
            region: "서울 은평구",
            story: "방과 후 아이들이 이용하는 공부방에 물품 지원이 절실합니다.",
            targetQuantity: 1,
            currentQuantity: 0,
            targetAmount: project.unit_price,
            currentAmount: Math.round(project.unit_price * 0.72),
            verifiedBadge: "보건복지부 인가 시설",
            avatarIcon: "👧",
          },
        ]
  );

  // 기본 선택 기부처: 첫 번째 기부처
  const [selectedRecipientId, setSelectedRecipientId] = useState<string>(
    recipientList[0]?.id || "rec-default-1"
  );

  // 내 보유 PMC (상단 네비게이션과 동기화된 기본 모의 잔고 510,000 PMC)
  const [myBalance, setMyBalance] = useState<number>(510000);

  // 기부할 PMC 금액 입력 상태
  const [donateAmount, setDonateAmount] = useState<number>(10000);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [successInfo, setSuccessInfo] = useState<{
    recipientName: string;
    donatedAmount: number;
    isFullyFunded: boolean;
  } | null>(null);

  // 현재 선택된 기부처 객체
  const selectedRecipient =
    recipientList.find((r) => r.id === selectedRecipientId) || recipientList[0];

  // 선택된 기부처의 잔여 필요 금액
  const remainingAmount = Math.max(
    0,
    selectedRecipient.targetAmount - selectedRecipient.currentAmount
  );

  // 빠른 기부 금액 추가
  const handleAddAmount = (add: number) => {
    setDonateAmount((prev) => Math.min(myBalance, prev + add));
  };

  // 남은 금액 전액 완판 설정
  const handleFillRemaining = () => {
    setDonateAmount(Math.min(myBalance, remainingAmount));
  };

  // 기부 집행 처리
  const handleExecuteDonation = () => {
    if (donateAmount <= 0) return;
    if (donateAmount > myBalance) {
      alert("보유한 PMC 잔고가 부족합니다!");
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      // 1. 내 잔고 차감
      setMyBalance((prev) => Math.max(0, prev - donateAmount));

      // 2. 해당 기부처 모금액 누적
      let isFullyFunded = false;
      setRecipientList((prevList) =>
        prevList.map((rec) => {
          if (rec.id === selectedRecipientId) {
            const nextAmount = rec.currentAmount + donateAmount;
            if (nextAmount >= rec.targetAmount) {
              isFullyFunded = true;
            }
            return {
              ...rec,
              currentAmount: nextAmount,
              currentQuantity:
                nextAmount >= rec.targetAmount
                  ? rec.targetQuantity
                  : rec.currentQuantity,
            };
          }
          return rec;
        })
      );

      // 3. 완료 안내 모달 표시
      setSuccessInfo({
        recipientName: selectedRecipient.name,
        donatedAmount: donateAmount,
        isFullyFunded,
      });

      setIsSubmitting(false);
    }, 500);
  };

  const categoryIcon = CATEGORY_ICON_MAP[project.category] || "📦";

  return (
    <div className="min-h-screen bg-[#090b12] text-slate-100 pb-28">
      {/* Top Breadcrumb Bar */}
      <div className="border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
          <Link
            href="/donation/direct"
            className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>K-물품 직접기부 목록</span>
          </Link>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-slate-700/80 text-xs text-slate-300">
              <Coins className="w-3.5 h-3.5 text-amber-400" />
              <span>내 보유:</span>
              <strong className="text-amber-300 font-bold tabular-nums">
                {myBalance.toLocaleString()} PMC
              </strong>
            </div>
            <span className="hidden sm:inline-block px-3 py-1 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-300 border border-purple-500/30">
              영국식 Tied Aid · 수출 승수
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
        {/* Product Overview Header Banner */}
        <div className="rounded-3xl border border-slate-800 bg-gradient-to-r from-purple-950/40 via-slate-900/90 to-slate-950 p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xl">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-purple-500/20 to-indigo-500/20 border border-purple-500/30 flex items-center justify-center text-3xl sm:text-4xl shadow-inner shrink-0">
              {categoryIcon}
            </div>
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  {project.manufacturer}
                </span>
                <span className="text-xs text-slate-400">
                  물품 개당 단가: <strong className="text-white">{project.unit_price.toLocaleString()} PMC</strong>
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-white">
                {project.title}
              </h1>
              <p className="text-xs sm:text-sm text-slate-400">
                시민이 직접 지원할 복지시설을 선택하고 소액 PMC를 모아 해당 물품을 직배송 설치합니다.
              </p>
            </div>
          </div>

          <div className="shrink-0 p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300 max-w-xs">
            <div className="flex items-center gap-1.5 text-amber-300 font-bold mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>K-Impact Tied Aid 원조 모델</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              모금 완료 즉시 한국 제조사({project.manufacturer.split(" ")[0]})에 직발주되어 국내 일자리 및 수출 경쟁력 강화로 이어집니다.
            </p>
          </div>
        </div>

        {/* Main 2-Column Grid: Left (Recipient Centers) vs Right (Donation Action) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column (7 cols): Recipient Center Selection List */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center justify-between px-1">
              <div>
                <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-purple-400" />
                  <span>이 물품을 기다리는 희망 기부처 선택</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  마음이 가는 복지시설을 클릭하여 선택하신 후, 원하는 만큼 PMC를 후원해주세요.
                </p>
              </div>
              <span className="text-xs text-purple-300 font-medium">
                총 {recipientList.length}곳 신청
              </span>
            </div>

            <div className="space-y-3.5">
              {recipientList.map((center) => {
                const isSelected = center.id === selectedRecipientId;
                const percent = Math.min(
                  100,
                  Math.round((center.currentAmount / center.targetAmount) * 100)
                );
                const isCompleted = percent >= 100;
                const isUrgent = percent >= 80 && !isCompleted;
                const leftPMC = Math.max(0, center.targetAmount - center.currentAmount);

                return (
                  <motion.div
                    key={center.id}
                    onClick={() => setSelectedRecipientId(center.id)}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    className={`cursor-pointer rounded-2xl p-5 border transition-all relative overflow-hidden ${
                      isSelected
                        ? "bg-slate-900 border-purple-500 shadow-xl shadow-purple-500/10 ring-1 ring-purple-500"
                        : "bg-slate-900/60 border-slate-800/90 hover:border-slate-700 hover:bg-slate-900/80"
                    }`}
                  >
                    {/* Active Selection Badge */}
                    {isSelected && (
                      <div className="absolute top-0 right-0 bg-gradient-to-l from-purple-600 to-indigo-600 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl flex items-center gap-1 shadow">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>선택됨 (기부 대상)</span>
                      </div>
                    )}

                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-2xl shrink-0">
                        {center.avatarIcon}
                      </div>

                      <div className="flex-1 min-w-0 space-y-2">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-extrabold text-base text-white">
                              {center.name}
                            </span>
                            <span className="text-[11px] px-2 py-0.5 rounded bg-slate-950 text-slate-300 border border-slate-800 flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-purple-400" />
                              {center.region}
                            </span>
                            <span className="text-[11px] text-slate-400">
                              {center.type}
                            </span>
                            {isUrgent && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1 animate-pulse">
                                <Flame className="w-3 h-3 text-rose-400" />
                                마감 임박
                              </span>
                            )}
                            {isCompleted && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                펀딩 완료!
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-emerald-400 font-medium block mt-1">
                            ✓ {center.verifiedBadge}
                          </span>
                        </div>

                        {/* Story */}
                        <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/40 p-2.5 rounded-xl border border-white/[0.03]">
                          "{center.story}"
                        </p>

                        {/* Progress Bar & Amount */}
                        <div className="space-y-1.5 pt-1">
                          <div className="flex items-baseline justify-between text-xs">
                            <div className="flex items-center gap-1.5">
                              <span className="font-extrabold text-sm text-purple-300">
                                {percent}%
                              </span>
                              <span className="text-slate-400 text-[11px]">
                                ({center.currentAmount.toLocaleString()} /{" "}
                                {center.targetAmount.toLocaleString()} PMC)
                              </span>
                            </div>
                            <span className="text-[11px] font-semibold text-amber-300">
                              {isCompleted ? "목표 달성" : `${leftPMC.toLocaleString()} PMC 남음`}
                            </span>
                          </div>

                          <div className="h-2 bg-slate-950 rounded-full overflow-hidden p-0.5">
                            <motion.div
                              className={`h-full rounded-full transition-all ${
                                isCompleted
                                  ? "bg-emerald-500"
                                  : "bg-gradient-to-r from-purple-500 via-indigo-500 to-fuchsia-500"
                              }`}
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Right Column (5 cols): Interactive Donation Module */}
          <div className="lg:col-span-5 space-y-4">
            <div className="sticky top-20 rounded-3xl border border-purple-500/40 bg-gradient-to-b from-slate-900 via-slate-900/90 to-slate-950 p-6 sm:p-7 shadow-2xl space-y-5">
              {/* Target Beneficiary Card Header */}
              <div className="p-4 rounded-2xl bg-slate-950/90 border border-slate-800 space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-purple-400 flex items-center gap-1">
                  <Heart className="w-3.5 h-3.5 text-rose-400 fill-current" />
                  현재 선택된 후원 기부처
                </span>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-extrabold text-white">
                    {selectedRecipient.name}
                  </h3>
                  <span className="text-xs px-2.5 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    {selectedRecipient.region}
                  </span>
                </div>
                <div className="text-xs text-slate-400 flex items-center justify-between pt-1 border-t border-slate-800/80">
                  <span>완판까지 남은 금액:</span>
                  <strong className="text-amber-300 text-sm font-bold tabular-nums">
                    {remainingAmount.toLocaleString()} PMC
                  </strong>
                </div>
              </div>

              {/* Donation Amount Input Form */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>후원할 PMC 금액 설정</span>
                  <span className="text-slate-300">
                    보유 잔고: <strong className="text-amber-300">{myBalance.toLocaleString()} PMC</strong>
                  </span>
                </div>

                <div className="relative">
                  <input
                    type="number"
                    min={100}
                    max={myBalance}
                    step={1000}
                    value={donateAmount || ""}
                    onChange={(e) => setDonateAmount(Number(e.target.value))}
                    placeholder="후원할 PMC 입력"
                    className="w-full px-4 py-3.5 rounded-2xl bg-slate-950 border border-slate-700/80 text-xl font-extrabold text-purple-300 text-right pr-16 focus:outline-none focus:border-purple-500"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
                    PMC
                  </span>
                </div>

                {/* Quick Add Buttons */}
                <div className="grid grid-cols-4 gap-2 pt-1">
                  {[1000, 5000, 10000, 50000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => handleAddAmount(amt)}
                      className="py-2 rounded-xl bg-slate-950 border border-slate-800 hover:border-purple-500/50 hover:bg-slate-900 text-xs font-semibold text-slate-300 transition-all active:scale-95"
                    >
                      +{amt >= 10000 ? `${amt / 10000}만` : `${amt.toLocaleString()}`}
                    </button>
                  ))}
                </div>

                {/* Special One-Click Button: Fill Remaining & Finish Funding */}
                {remainingAmount > 0 && (
                  <button
                    type="button"
                    onClick={handleFillRemaining}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500/10 via-amber-500/20 to-amber-500/10 border border-amber-500/40 text-amber-200 text-xs font-bold hover:bg-amber-500/30 transition-all flex items-center justify-center gap-1.5 active:scale-95"
                  >
                    <Flame className="w-3.5 h-3.5 text-amber-400 fill-current" />
                    <span>
                      남은 {remainingAmount.toLocaleString()} PMC 채우고 즉시 완판시키기 🎁
                    </span>
                  </button>
                )}
              </div>

              {/* Execution CTA Button */}
              <button
                type="button"
                onClick={handleExecuteDonation}
                disabled={isSubmitting || donateAmount <= 0}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 text-white font-extrabold text-base shadow-xl shadow-purple-600/30 transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <span>기부 집행 중...</span>
                ) : (
                  <>
                    <Zap className="w-5 h-5 text-amber-300 fill-current" />
                    <span>
                      [{selectedRecipient.name}]에 {donateAmount.toLocaleString()} PMC 후원하기
                    </span>
                  </>
                )}
              </button>

              {/* Transparency Assurances */}
              <div className="space-y-2 pt-2 border-t border-slate-800 text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>100% 달성 즉시 {project.manufacturer.split(" ")[0]} 본사 직접 발주 및 배송</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" />
                  <span>수혜 시설 직배송 인수증 및 아이들의 감사 사진 공개</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Success Modal / Banner */}
      <AnimatePresence>
        {successInfo && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="max-w-md w-full rounded-3xl bg-slate-900 border border-purple-500/40 p-6 sm:p-8 text-center space-y-4 shadow-2xl shadow-purple-500/20"
            >
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 mx-auto flex items-center justify-center text-3xl shadow-lg">
                🎉
              </div>

              <div className="space-y-1">
                <span className="text-xs font-bold uppercase tracking-wider text-purple-400">
                  K-Impact Direct Donation Complete
                </span>
                <h3 className="text-2xl font-extrabold text-white">
                  따뜻한 가치가 전달되었습니다!
                </h3>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-left space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">후원 기부처</span>
                  <span className="font-bold text-white">{successInfo.recipientName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">지원 물품</span>
                  <span className="font-bold text-purple-300">{project.product_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">후원한 금액</span>
                  <span className="font-extrabold text-amber-300 text-sm">
                    {successInfo.donatedAmount.toLocaleString()} PMC
                  </span>
                </div>
                <div className="flex justify-between pt-1 border-t border-slate-800">
                  <span className="text-slate-400">남은 보유 잔고</span>
                  <span className="font-medium text-slate-300">
                    {myBalance.toLocaleString()} PMC
                  </span>
                </div>
              </div>

              {successInfo.isFullyFunded ? (
                <div className="p-3.5 rounded-xl bg-emerald-950/70 border border-emerald-500/40 text-xs text-emerald-300 space-y-1">
                  <p className="font-bold">🎊 축하합니다! 100% 펀딩이 완료되었습니다!</p>
                  <p className="text-[11px] text-emerald-200/80">
                    해당 시설에 전달될 {project.product_name}의 {project.manufacturer.split(" ")[0]} 본사 직발주가 즉시 진행됩니다.
                  </p>
                </div>
              ) : (
                <p className="text-xs text-slate-400">
                  시민주권자님의 소중한 후원으로 아이들과 이웃들이 더 가까이 희망에 다가섰습니다.
                </p>
              )}

              <button
                type="button"
                onClick={() => setSuccessInfo(null)}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-purple-600/30 transition-all"
              >
                확인 및 계속 둘러보기
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}