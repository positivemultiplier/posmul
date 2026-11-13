"use client";

import { useState } from "react";
import {
  Sparkles,
  Flame,
  X,
  Check,
  CheckCircle2,
  Lock,
  ShoppingBag,
  Trophy,
  Coins,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import {
  STUDY_CONE_CATALOG,
  StudyConeSpec,
  UserStudyConeItem,
} from "@/data/mock-study-cones";
import {
  purchaseStudyConeAction,
  equipStudyConeAction,
} from "@/app/actions/study-cone.actions";

interface StudyConeStoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  equippedCone: UserStudyConeItem;
  onEquipChange: (cone: UserStudyConeItem) => void;
  userId?: string;
}

export function StudyConeStoreModal({
  isOpen,
  onClose,
  equippedCone,
  onEquipChange,
  userId = "user-demo-housing-1",
}: StudyConeStoreModalProps) {
  const [activeTab, setActiveTab] = useState<"MY" | "STORE">("STORE");
  const [purchasedTypes, setPurchasedTypes] = useState<string[]>([
    "FIRE_OWL",
    equippedCone.coneType,
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentSpec =
    STUDY_CONE_CATALOG.find((s) => s.coneType === equippedCone.coneType) ||
    STUDY_CONE_CATALOG[0];

  const currentLevelInfo =
    currentSpec.levels.find((l) => l.level === equippedCone.currentLevel) ||
    currentSpec.levels[0];

  const nextLevelInfo = currentSpec.levels.find(
    (l) => l.level === equippedCone.currentLevel + 1
  );

  // 구매 시뮬레이션
  const handlePurchase = async (spec: StudyConeSpec) => {
    setIsLoading(true);
    setFeedbackMsg(null);

    try {
      const res = await purchaseStudyConeAction({
        userId,
        coneType: spec.coneType,
      });

      if (res.success && res.equippedCone) {
        setPurchasedTypes((prev) => [...prev, spec.coneType]);
        onEquipChange(res.equippedCone);
        setFeedbackMsg(res.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // 장착 변경
  const handleEquip = async (spec: StudyConeSpec) => {
    setIsLoading(true);
    try {
      await equipStudyConeAction({
        userId,
        coneType: spec.coneType,
      });

      const updated: UserStudyConeItem = {
        id: `cone-${spec.coneType.toLowerCase()}`,
        coneType: spec.coneType,
        currentLevel: 1,
        totalFocusMinutes: 0,
        isEquipped: true,
        purchasedPriceKrw: spec.priceKrw,
        unlockedAt: new Date().toISOString(),
      };

      onEquipChange(updated);
      setFeedbackMsg(`『${spec.name}』(으)로 장착이 변경되었습니다.`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#121A2B] border border-amber-500/30 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 space-y-5 shadow-2xl relative">
        {/* 상단 골드 글로우 바 */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 via-rose-500 to-indigo-500" />

        <div className="flex items-start justify-between border-b border-white/[0.08] pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-amber-950 text-amber-300 font-extrabold text-[10px] border border-amber-500/30 flex items-center gap-1">
                <Trophy className="w-3 h-3 text-amber-400" />
                <span>진화 스터디콘 & 소액 현금 EAT 상점</span>
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500/30">
                PosMul 경제 풀 연동
              </span>
            </div>
            <h3 className="text-lg font-black text-white">
              집중 시간과 함께 성장하는 나만의 합격 수호신
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 탭 버튼 */}
        <div className="flex gap-2 p-1 bg-slate-950 rounded-xl text-xs font-bold">
          <button
            onClick={() => setActiveTab("STORE")}
            className={`flex-1 py-2 rounded-lg transition flex items-center justify-center gap-1.5 ${
              activeTab === "STORE"
                ? "bg-amber-500 text-slate-950 font-black shadow-md"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>프리미엄 스터디콘 상점 (EAT 재원)</span>
          </button>
          <button
            onClick={() => setActiveTab("MY")}
            className={`flex-1 py-2 rounded-lg transition flex items-center justify-center gap-1.5 ${
              activeTab === "MY"
                ? "bg-indigo-600 text-white font-black shadow-md"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>장착 중인 스터디콘 진화 현황</span>
          </button>
        </div>

        {feedbackMsg && (
          <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{feedbackMsg}</span>
          </div>
        )}

        {activeTab === "STORE" ? (
          /* ========================================================== */
          /* 1. 스터디콘 상점 (소액 유료 결제 -> 현금 EAT 창출) */
          /* ========================================================== */
          <div className="space-y-4">
            {/* EAT 연료 순환 안내 배너 */}
            <div className="p-3.5 rounded-xl bg-gradient-to-r from-amber-950/50 via-slate-950 to-indigo-950/40 border border-amber-500/30 text-xs space-y-1">
              <div className="font-extrabold text-amber-300 flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-amber-400" />
                <span>PosMul 백서 v3.1 현금 연료(`EAT`) 선순환</span>
              </div>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                스터디콘 소액 결제(1,100~3,300원) 매출 전액은 중앙 <strong>MoneyWave 배당 풀</strong>의 실물 현금 연료(`EAT`)로 유입되어 생태계 기여자와 예측 적중자들에게 환원됩니다.
              </p>
            </div>

            {/* 스터디콘 카탈로그 그리드 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {STUDY_CONE_CATALOG.map((spec) => {
                const isOwned = purchasedTypes.includes(spec.coneType);
                const isEquipped = equippedCone.coneType === spec.coneType;

                return (
                  <div
                    key={spec.coneType}
                    className={`p-4 rounded-xl border flex flex-col justify-between gap-3 transition ${
                      isEquipped
                        ? "bg-slate-950 border-amber-500/60 shadow-lg shadow-amber-950/30"
                        : "bg-slate-950/70 border-white/[0.06] hover:border-white/[0.15]"
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-900 to-slate-800 border border-white/[0.08] flex items-center justify-center text-2xl shadow-inner">
                          {spec.badgeEmoji}
                        </div>
                        <div className="text-right">
                          <span
                            className={`text-xs font-black px-2 py-0.5 rounded-md ${
                              spec.priceKrw === 0
                                ? "bg-slate-800 text-slate-300"
                                : "bg-amber-950 text-amber-300 border border-amber-500/30"
                            }`}
                          >
                            {spec.priceKrw === 0
                              ? "기본 무료"
                              : `${spec.priceKrw.toLocaleString()}원`}
                          </span>
                          {spec.isPremium && (
                            <div className="text-[10px] text-amber-400 font-bold pt-0.5">
                              한정판 스킨
                            </div>
                          )}
                        </div>
                      </div>

                      <div>
                        <h4 className="font-extrabold text-white text-sm">
                          {spec.name}
                        </h4>
                        <p className="text-[11px] text-slate-400 leading-snug pt-0.5">
                          {spec.description}
                        </p>
                      </div>

                      {/* 5단계 진화 요약 */}
                      <div className="text-[10.5px] text-slate-400 space-y-0.5 bg-slate-900/60 p-2 rounded-lg border border-white/[0.04]">
                        <div className="font-bold text-slate-300">
                          Lv.1 ~ Lv.5 5단계 순차 진화:
                        </div>
                        <div className="truncate text-slate-400">
                          {spec.levels.map((l) => l.title).join(" ➔ ")}
                        </div>
                      </div>
                    </div>

                    {/* 액션 버튼 */}
                    <div className="pt-1">
                      {isEquipped ? (
                        <div className="w-full py-2 rounded-lg bg-emerald-950 text-emerald-300 border border-emerald-500/30 text-xs font-black text-center flex items-center justify-center gap-1.5">
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span>현재 장착 중</span>
                        </div>
                      ) : isOwned ? (
                        <button
                          onClick={() => handleEquip(spec)}
                          disabled={isLoading}
                          className="w-full py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition"
                        >
                          장착하기
                        </button>
                      ) : (
                        <button
                          onClick={() => handlePurchase(spec)}
                          disabled={isLoading}
                          className="w-full py-2 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-black transition shadow-md shadow-amber-500/20 flex items-center justify-center gap-1.5"
                        >
                          <Coins className="w-3.5 h-3.5 text-slate-950" />
                          <span>{spec.priceKrw.toLocaleString()}원 결제 (EAT 기여)</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* ========================================================== */
          /* 2. 장착 중인 스터디콘 진화 현황 */
          /* ========================================================== */
          <div className="space-y-4">
            <div className="p-5 rounded-xl bg-slate-950/80 border border-white/[0.06] flex flex-col sm:flex-row items-center gap-5">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-500 to-rose-600 flex items-center justify-center text-4xl shadow-xl shadow-amber-500/20 shrink-0">
                {currentSpec.badgeEmoji}
              </div>

              <div className="space-y-1.5 text-center sm:text-left flex-1">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <h4 className="text-base font-black text-white">
                    {currentSpec.name}
                  </h4>
                  <span className="px-2 py-0.5 rounded-full bg-amber-950 text-amber-300 font-bold text-xs border border-amber-500/30">
                    Lv.{equippedCone.currentLevel} {currentLevelInfo.title}
                  </span>
                </div>
                <p className="text-xs text-slate-300">
                  누적 유효 집중 시간: <strong className="text-white">{equippedCone.totalFocusMinutes}분</strong> (AI 스캔 및 1줄 O/X 복습으로 확정)
                </p>

                {/* 프로그레스 바 */}
                {nextLevelInfo && (
                  <div className="space-y-1 pt-1">
                    <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                      <span>다음 진화까지</span>
                      <span>
                        {Math.max(0, nextLevelInfo.requiredMinutes - equippedCone.totalFocusMinutes)}분 남음 (Lv.{nextLevelInfo.level} {nextLevelInfo.title})
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-900 border border-white/[0.05] overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-amber-400 to-rose-500 transition-all duration-500"
                        style={{
                          width: `${Math.min(
                            100,
                            (equippedCone.totalFocusMinutes / nextLevelInfo.requiredMinutes) * 100
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 5단계 진화 도감 상세 리스트 */}
            <div className="space-y-2">
              <h5 className="text-xs font-bold text-slate-400">
                『{currentSpec.name}』 진화 단계별 특전 도감
              </h5>
              <div className="space-y-2 text-xs">
                {currentSpec.levels.map((lvl) => {
                  const isReached = equippedCone.currentLevel >= lvl.level;
                  return (
                    <div
                      key={lvl.level}
                      className={`p-3 rounded-xl border flex items-center justify-between gap-3 ${
                        isReached
                          ? "bg-slate-950/80 border-amber-500/40 text-slate-100"
                          : "bg-slate-950/40 border-white/[0.03] text-slate-500"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span
                          className={`w-6 h-6 rounded-md flex items-center justify-center font-black text-xs ${
                            isReached
                              ? "bg-amber-500 text-slate-950"
                              : "bg-slate-900 text-slate-500"
                          }`}
                        >
                          {lvl.level}
                        </span>
                        <div>
                          <div className="font-extrabold">{lvl.title}</div>
                          <div className="text-[11px] text-slate-400">
                            특전: {lvl.perk}
                          </div>
                        </div>
                      </div>
                      <span className="text-[11px] font-mono">
                        {lvl.requiredMinutes}분 달성
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        <div className="pt-2 border-t border-white/[0.08] flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}

