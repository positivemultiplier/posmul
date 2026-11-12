"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Sparkles,
  Wallet,
  TrendingUp,
  Trophy,
  Target,
  Settings,
  Gift,
  Heart,
  Radio,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  ShieldCheck,
  MapPin,
  Briefcase,
  Bell,
  Lock,
  Sliders,
  RefreshCw,
  Compass,
  Coins,
  Flame,
  ChevronRight,
  Save,
  Undo2,
  UserCheck,
} from "lucide-react";
import {
  AdminCard,
  AdminCardHeader,
  AdminCardTitle,
  AdminCardDescription,
  AdminCardContent,
  AdminCardFooter,
  AdminBadge,
  AdminButton,
  AdminTable,
  AdminTableHeader,
  AdminTableBody,
  AdminTableRow,
  AdminTableHead,
  AdminTableCell,
} from "../../admin/components/shadcn-admin-ui";
import { withdrawPrediction } from "../../../bounded-contexts/prediction/presentation/components/actions";
import type { UserPersonalizationSettings } from "../personalization-types";

export interface DashboardGameItem {
  game_id: string;
  slug: string | null;
  title: string;
  category: string | null;
  subcategory: string | null;
  status: string;
  prize_pool: number;
  participants_count: number;
  end_time: string | null;
  oracleSourceType: string | null;
  options: Array<{ id: string; label: string; odds?: number }>;
}

export interface DashboardPredictionItem {
  prediction_id: string;
  game_id: string;
  selectedOptionId: string;
  selectedOptionLabel: string;
  bet_amount: number;
  confidence_level: number;
  is_active: boolean;
  created_at: string;
  gameTitle: string;
  gameSlug: string | null;
  gameCategory: string | null;
  gameStatus: string;
  settlementDate: string | null;
}

export interface DashboardLiveRoomItem {
  id: string;
  title: string;
  subtitle: string;
  category: "sports" | "entertainment" | "economy";
  categoryLabel: string;
  status: "LIVE" | "UPCOMING";
  viewerCount: number;
  broadcaster: string;
  linkedPredictionSlug: string;
  linkedPredictionTitle: string;
  oracleLabel?: string;
  scoreBoard?: {
    leftTeam: string;
    leftScore: string | number;
    rightTeam: string;
    rightScore: string | number;
    statusText: string;
  };
}

export interface DashboardTransactionItem {
  id: string;
  type: "prediction" | "donation" | "consume" | "reward";
  title: string;
  amount: number;
  currency: "PMP" | "PMC";
  status: "completed" | "pending" | "cancelled";
  createdAt: string;
}

export interface UserDashboardProps {
  initialData: {
    isAuthenticated: boolean;
    userId: string;
    email: string;
    provider?: string;
    connectedProviders?: string[];
    kakaoConnected?: boolean;
    naverConnected?: boolean;
    googleConnected?: boolean;
    displayName: string;
    username: string;
    bio: string;
    onboardingCompleted: boolean;
    balances: {
      pmp: number;
      pmc: number;
    };
    ranking: {
      overallRank: number;
      expectRank: number;
      donationRank: number;
      contributionScore: number;
      expectParticipations: number;
      expectWins: number;
      totalPmcDonated: number;
      forumPostsCount: number;
    };
    personalization: UserPersonalizationSettings;
    activeGames: DashboardGameItem[];
    myPredictions: DashboardPredictionItem[];
    liveRooms: DashboardLiveRoomItem[];
    transactions: DashboardTransactionItem[];
  };
}

const AVATAR_EMOJIS = ["🎯", "🦅", "🦁", "🚀", "🐳", "🔥", "💎", "🌟"];

const SIDO_LIST = [
  "서울특별시",
  "경기도",
  "부산광역시",
  "인천광역시",
  "대전광역시",
  "대구광역시",
  "광주광역시",
  "울산광역시",
  "세종특별자치시",
  "강원특별자치도",
  "충청북도",
  "충청남도",
  "전북특별자치도",
  "전라남도",
  "경상북도",
  "경상남도",
  "제주특별자치도",
];

const JOB_GROUPS = [
  "IT·개발·AI",
  "금융·투자·경제",
  "미디어·콘텐츠·문화",
  "공공·정책·학계",
  "자영업·크리에이터",
  "학생·연구자",
  "기타 주권시민",
];

const DOMAIN_OPTIONS = [
  {
    key: "INVEST",
    label: "📈 경제·금융·환율",
    desc: "한국은행 ECOS, 나스닥 100, 비트코인, 기업 실적 예측",
    liveCategory: "economy",
    href: "/prediction/economy",
  },
  {
    key: "SPORTS",
    label: "⚽ 스포츠 (KBO/EPL)",
    desc: "프로야구 한국시리즈, 프리미어리그, e스포츠 승부 예측",
    liveCategory: "sports",
    href: "/prediction/sports",
  },
  {
    key: "ENTERTAINMENT",
    label: "🎬 K-콘텐츠·연예·OTT",
    desc: "넷플릭스 주간 Top 10, 주말 미니시리즈 시청률, 박스오피스",
    liveCategory: "entertainment",
    href: "/prediction/entertainment",
  },
  {
    key: "POLITICS",
    label: "🗳️ 정치·입법·예산",
    desc: "국회 열린국회정보 법안 본회의 통과 여부 및 공공 정책",
    liveCategory: "economy",
    href: "/prediction/politics",
  },
  {
    key: "USER_PROPOSED",
    label: "💳 라이프·소비·시민제안",
    desc: "실생활 물가, 로컬 소비 캠페인 및 시민 직접 제안 마켓",
    liveCategory: "entertainment",
    href: "/prediction/consume",
  },
];

const BET_PRESETS = [100, 500, 1000, 5000];
const LANDING_OPTIONS = [
  { path: "/dashboard", label: "📊 내 맞춤 대시보드 (/dashboard)" },
  { path: "/prediction", label: "🎯 예측 마켓 전체 피드 (/prediction)" },
  { path: "/live", label: "🔴 실시간 LIVE 응원톡 (/live)" },
  { path: "/forum", label: "🏛️ 시민 공론장·갤러리 (/forum)" },
];

export function UserDashboardClient({ initialData }: UserDashboardProps) {
  const searchParams = useSearchParams();
  const isOnboardingParam = searchParams.get("onboarding") === "1";

  const [activeTab, setActiveTab] = useState<
    "foryou" | "predictions" | "wallet" | "donation" | "settings"
  >(isOnboardingParam ? "settings" : "foryou");

  // 상태 관리
  const [displayName, setDisplayName] = useState(initialData.displayName);
  const [bio, setBio] = useState(initialData.bio);
  const [onboardingCompleted, setOnboardingCompleted] = useState(
    initialData.onboardingCompleted
  );
  const [balances, setBalances] = useState(initialData.balances);
  const [personalization, setPersonalization] = useState<UserPersonalizationSettings>(
    initialData.personalization
  );
  const [myPredictions, setMyPredictions] = useState<DashboardPredictionItem[]>(
    initialData.myPredictions
  );
  const [transactions, setTransactions] = useState<DashboardTransactionItem[]>(
    initialData.transactions
  );

  // 온보딩 빠른 설정 배너 표시 여부
  const [showQuickWizard, setShowQuickWizard] = useState(
    !initialData.onboardingCompleted || isOnboardingParam
  );

  // 피드백/로딩 상태
  const [savingSettings, setSavingSettings] = useState(false);
  const [claimingBonus, setClaimingBonus] = useState(false);
  const [withdrawingId, setWithdrawingId] = useState<string | null>(null);
  const [predictionFilter, setPredictionFilter] = useState<"all" | "ACTIVE" | "SETTLED">("all");
  const [txFilter, setTxFilter] = useState<"all" | "prediction" | "donation" | "consume" | "reward">(
    "all"
  );
  const [toastMessage, setToastMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // 비로그인 데모 상태일 때 localStorage와 동기화
  useEffect(() => {
    if (!initialData.isAuthenticated) {
      try {
        const saved = localStorage.getItem("posmul_personalization_v1");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.displayName) setDisplayName(parsed.displayName);
          if (parsed.bio) setBio(parsed.bio);
          if (parsed.personalization) setPersonalization(parsed.personalization);
          if (parsed.onboardingCompleted) {
            setOnboardingCompleted(true);
            if (!isOnboardingParam) setShowQuickWizard(false);
          }
        }
      } catch {
        // 무시
      }
    }
  }, [initialData.isAuthenticated, isOnboardingParam]);

  const showToast = (type: "success" | "error", text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => {
      setToastMessage((prev) => (prev?.text === text ? null : prev));
    }, 4500);
  };

  // 관심 도메인 토글
  const toggleFavoriteDomain = (domainKey: string) => {
    setPersonalization((prev) => {
      const exists = prev.favoriteDomains.includes(domainKey);
      const nextDomains = exists
        ? prev.favoriteDomains.filter((d) => d !== domainKey)
        : [...prev.favoriteDomains, domainKey];

      if (nextDomains.length === 0) return prev; // 최소 1개 유지

      // LIVE 응원톡 카테고리도 자동 연동
      const nextLiveCats = Array.from(
        new Set(
          DOMAIN_OPTIONS.filter((opt) => nextDomains.includes(opt.key)).map(
            (opt) => opt.liveCategory
          )
        )
      );

      return {
        ...prev,
        favoriteDomains: nextDomains,
        favoriteLiveCategories: nextLiveCats.length > 0 ? nextLiveCats : ["sports", "entertainment"],
      };
    });
  };

  // 개인맞춤 설정 저장
  const handleSavePersonalization = async (fromWizard = false) => {
    setSavingSettings(true);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName,
          bio,
          personalization,
        }),
      });
      const data = await res.json();

      // 로컬 스토리지에도 백업 저장 (데모 및 즉시 반응용)
      try {
        localStorage.setItem(
          "posmul_personalization_v1",
          JSON.stringify({
            displayName,
            bio,
            personalization,
            onboardingCompleted: true,
          })
        );
      } catch {
        // 무시
      }

      if (data.success) {
        setOnboardingCompleted(true);
        setShowQuickWizard(false);
        showToast(
          "success",
          fromWizard
            ? "✨ 환영합니다! 나만의 맞춤 관심사와 배팅 프리셋이 대시보드에 적용되었습니다."
            : "✅ 개인맞춤 설정 및 시민 프로필이 성공적으로 저장되었습니다."
        );
        if (fromWizard) {
          setActiveTab("foryou");
        }
      } else {
        showToast("error", data.error || "설정 저장에 실패했습니다.");
      }
    } catch {
      showToast("error", "네트워크 오류가 발생했습니다.");
    } finally {
      setSavingSettings(false);
    }
  };

  // 일일 활동 보너스 (+5,000 PMP & +500 PMC) 즉시 받기
  const handleClaimBonus = async () => {
    setClaimingBonus(true);
    try {
      const res = await fetch("/api/user/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "claim_bonus" }),
      });
      const data = await res.json();
      if (data.success) {
        setBalances((prev) => ({
          ...prev,
          pmp: data.pmpBalance ?? prev.pmp + 5000,
          pmc: data.pmcBalance ?? prev.pmc + 500,
        }));
        setTransactions((prev) => [
          {
            id: `tx-bonus-${Date.now()}`,
            type: "reward",
            title: "🎁 시민 대시보드 활동 응원 보너스 (+5,000 PMP / +500 PMC)",
            amount: 5000,
            currency: "PMP",
            status: "completed",
            createdAt: new Date().toISOString(),
          },
          ...prev,
        ]);
        showToast("success", data.message);
      } else {
        showToast("error", data.error || "보너스 지급 실패");
      }
    } catch {
      showToast("error", "보너스 요청 중 오류가 발생했습니다.");
    } finally {
      setClaimingBonus(false);
    }
  };

  // 예측 철회 핸들러
  const handleWithdrawPrediction = async (predictionId: string, betAmount: number) => {
    if (!confirm("이 예측을 철회하시겠습니까? 배팅한 PMP가 즉시 지갑으로 반환됩니다.")) {
      return;
    }
    setWithdrawingId(predictionId);
    try {
      const result = await withdrawPrediction(predictionId);
      if (result.success) {
        setMyPredictions((prev) =>
          prev.map((p) => (p.prediction_id === predictionId ? { ...p, is_active: false } : p))
        );
        setBalances((prev) => ({
          ...prev,
          pmp: prev.pmp + betAmount,
        }));
        showToast("success", result.message || `예측이 철회되어 ${betAmount.toLocaleString()} PMP가 환불되었습니다.`);
      } else {
        showToast("error", result.error || "예측 철회에 실패했습니다.");
      }
    } catch {
      showToast("error", "철회 요청 중 오류가 발생했습니다.");
    } finally {
      setWithdrawingId(null);
    }
  };

  // 관심 도메인 기반 맞춤 예측 게임 정렬
  const personalizedGames = useMemo(() => {
    const favSet = new Set(personalization.favoriteDomains.map((d) => d.toUpperCase()));
    const matched = initialData.activeGames.filter((g) =>
      favSet.has((g.category || "INVEST").toUpperCase())
    );
    const others = initialData.activeGames.filter(
      (g) => !favSet.has((g.category || "INVEST").toUpperCase())
    );
    return [...matched, ...others].slice(0, 6);
  }, [initialData.activeGames, personalization.favoriteDomains]);

  // 관심 카테고리 기반 맞춤 LIVE 응원톡 정렬
  const personalizedLiveRooms = useMemo(() => {
    const favCats = new Set(personalization.favoriteLiveCategories);
    const matched = initialData.liveRooms.filter((r) => favCats.has(r.category));
    const others = initialData.liveRooms.filter((r) => !favCats.has(r.category));
    return [...matched, ...others];
  }, [initialData.liveRooms, personalization.favoriteLiveCategories]);

  // 내 예측 통계 계산
  const predictionStats = useMemo(() => {
    const activeBets = myPredictions.filter((p) => p.is_active && p.gameStatus === "ACTIVE");
    const settledBets = myPredictions.filter((p) => p.gameStatus === "SETTLED");
    const totalBetPmp = myPredictions
      .filter((p) => p.is_active)
      .reduce((acc, cur) => acc + Number(cur.bet_amount || 0), 0);
    const avgConfidence =
      myPredictions.length > 0
        ? Math.round(
            myPredictions.reduce((acc, cur) => acc + Number(cur.confidence_level || 70), 0) /
              myPredictions.length
          )
        : personalization.defaultConfidence;

    return {
      totalCount: myPredictions.length,
      activeCount: activeBets.length,
      settledCount: settledBets.length,
      totalBetPmp,
      avgConfidence,
    };
  }, [myPredictions, personalization.defaultConfidence]);

  const filteredPredictions = useMemo(() => {
    if (predictionFilter === "all") return myPredictions;
    return myPredictions.filter((p) => p.gameStatus === predictionFilter);
  }, [myPredictions, predictionFilter]);

  const filteredTransactions = useMemo(() => {
    if (txFilter === "all") return transactions;
    return transactions.filter((t) => t.type === txFilter);
  }, [transactions, txFilter]);

  const getCategoryMeta = (cat: string | null) => {
    switch ((cat || "").toUpperCase()) {
      case "SPORTS":
        return { label: "⚽ 스포츠", variant: "success" as const, path: "/prediction/sports" };
      case "ENTERTAINMENT":
        return {
          label: "🎬 K-콘텐츠·연예",
          variant: "purple" as const,
          path: "/prediction/entertainment",
        };
      case "POLITICS":
        return { label: "🗳️ 정치·입법", variant: "info" as const, path: "/prediction/politics" };
      case "USER_PROPOSED":
        return { label: "💳 라이프·소비", variant: "warning" as const, path: "/prediction/consume" };
      default:
        return { label: "📈 경제·금융", variant: "info" as const, path: "/prediction/economy" };
    }
  };

  return (
    <div className="min-h-screen bg-[#07080c] text-zinc-100 pb-20">
      {/* 상단 퍼스널 히어로 헤더 */}
      <div className="border-b border-zinc-800/80 bg-gradient-to-b from-zinc-900/80 via-[#0a0c14] to-[#07080c]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          {/* 토스트 알림 배너 */}
          {toastMessage && (
            <div
              className={`mb-5 px-4 py-3 rounded-xl border flex items-center justify-between text-xs font-semibold shadow-lg transition-all ${
                toastMessage.type === "success"
                  ? "bg-emerald-950/70 border-emerald-500/40 text-emerald-200"
                  : "bg-rose-950/70 border-rose-500/40 text-rose-200"
              }`}
            >
              <span>{toastMessage.text}</span>
              <button
                onClick={() => setToastMessage(null)}
                className="text-zinc-400 hover:text-white ml-4"
              >
                ✕
              </button>
            </div>
          )}

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            {/* 좌측: 시민 아바타 + 프로필 + 맞춤 태그 */}
            <div className="flex items-start sm:items-center gap-4">
              <button
                onClick={() => setActiveTab("settings")}
                title="아바타 및 프로필 변경"
                className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600/30 via-indigo-600/20 to-purple-600/30 border border-blue-500/40 flex items-center justify-center text-3xl shadow-lg shadow-blue-950/40 hover:scale-105 transition-transform shrink-0"
              >
                {personalization.avatarEmoji}
              </button>

              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                    {displayName}
                  </h1>
                  <AdminBadge variant="info">
                    <ShieldCheck className="w-3 h-3 mr-1" />
                    {initialData.isAuthenticated ? "공인 주권시민" : "체험 시민 모드"}
                  </AdminBadge>
                  <AdminBadge variant="default">
                    <MapPin className="w-3 h-3 mr-1 text-emerald-400" />
                    {personalization.sido}
                  </AdminBadge>
                  <AdminBadge variant="default">
                    <Briefcase className="w-3 h-3 mr-1 text-blue-400" />
                    {personalization.jobGroup}
                  </AdminBadge>
                </div>

                <p className="text-xs sm:text-sm text-zinc-400 max-w-2xl">{bio}</p>

                {/* 나의 관심 도메인 태그 칩 */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[11px] font-semibold text-zinc-500 mr-1">
                    내 맞춤 관심사:
                  </span>
                  {DOMAIN_OPTIONS.filter((d) =>
                    personalization.favoriteDomains.includes(d.key)
                  ).map((domain) => (
                    <span
                      key={domain.key}
                      className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-blue-500/10 text-blue-300 border border-blue-500/25"
                    >
                      {domain.label}
                    </span>
                  ))}
                  <span className="px-2 py-0.5 rounded-md text-[11px] font-mono bg-amber-500/10 text-amber-300 border border-amber-500/25">
                    ⚡ 기본 배팅 {personalization.defaultBetPmp.toLocaleString()} PMP · 확신도{" "}
                    {personalization.defaultConfidence}%
                  </span>
                </div>
              </div>
            </div>

            {/* 우측: 퀵 액션 버튼 */}
            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <AdminButton
                variant="outline"
                size="default"
                onClick={() => {
                  setShowQuickWizard((prev) => !prev);
                }}
              >
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>{showQuickWizard ? "맞춤 위저드 닫기" : "30초 맞춤 위저드"}</span>
              </AdminButton>

              <AdminButton
                variant="secondary"
                size="default"
                onClick={() => setActiveTab("settings")}
              >
                <Settings className="w-4 h-4 text-blue-400" />
                <span>개인맞춤 설정</span>
              </AdminButton>

              <AdminButton
                variant="success"
                size="default"
                disabled={claimingBonus}
                onClick={handleClaimBonus}
              >
                <Gift className={`w-4 h-4 ${claimingBonus ? "animate-bounce" : ""}`} />
                <span>
                  {claimingBonus ? "충전 중..." : "+5,000 PMP 보너스 충전"}
                </span>
              </AdminButton>
            </div>
          </div>

          {/* ✨ 첫 로그인 / 개인맞춤 퀵 온보딩 위저드 카드 */}
          {showQuickWizard && (
            <div className="mt-6 rounded-2xl border border-blue-500/40 bg-gradient-to-br from-blue-950/40 via-zinc-900/95 to-indigo-950/30 p-5 sm:p-6 shadow-2xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-800/80">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-blue-500/20 border border-blue-400/40 flex items-center justify-center text-blue-300">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-bold text-white">
                        ✨ 나만의 PosMul 개인맞춤 빠른 설정 (Personalization Wizard)
                      </h2>
                      {!onboardingCompleted && (
                        <AdminBadge variant="warning">신규 로그인 추천</AdminBadge>
                      )}
                    </div>
                    <p className="text-xs text-zinc-400">
                      관심 도메인, 활동 지역, 기본 배팅 금액을 선택하면 대시보드 추천 마켓과 LIVE 응원톡이 내 취향에 맞게 즉시 재구성됩니다.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowQuickWizard(false)}
                  className="text-xs text-zinc-400 hover:text-white self-end sm:self-center"
                >
                  나중에 하기 ✕
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 py-5">
                {/* Step 1: 관심 도메인 선택 */}
                <div className="space-y-2.5">
                  <label className="text-xs font-bold text-blue-300 flex items-center gap-1.5">
                    <span>1️⃣ 관심 예측 & LIVE 분야 (다중 선택)</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {DOMAIN_OPTIONS.map((dom) => {
                      const selected = personalization.favoriteDomains.includes(dom.key);
                      return (
                        <button
                          key={dom.key}
                          type="button"
                          onClick={() => toggleFavoriteDomain(dom.key)}
                          className={`px-3 py-2 rounded-xl text-xs font-semibold border text-left transition-all flex items-center gap-1.5 ${
                            selected
                              ? "bg-blue-600/25 border-blue-400 text-white shadow-sm"
                              : "bg-zinc-900/80 border-zinc-800 text-zinc-400 hover:text-zinc-200"
                          }`}
                        >
                          <span>{dom.label}</span>
                          {selected && <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Step 2: 내 지역 & 직군 */}
                <div className="space-y-3">
                  <label className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                    <span>2️⃣ 내 지역(시·도) & 시민 프로필</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <span className="block text-[11px] text-zinc-400 mb-1">닉네임</span>
                      <input
                        type="text"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <span className="block text-[11px] text-zinc-400 mb-1">활동 지역 (랭킹 연동)</span>
                      <select
                        value={personalization.sido}
                        onChange={(e) =>
                          setPersonalization((prev) => ({ ...prev, sido: e.target.value }))
                        }
                        className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-white focus:outline-none focus:border-blue-500"
                      >
                        {SIDO_LIST.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Step 3: 빠른 배팅 프리셋 & 시작 화면 */}
                <div className="space-y-3">
                  <label className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                    <span>3️⃣ 기본 배팅 PMP 프리셋 & 시작 화면</span>
                  </label>
                  <div className="flex items-center gap-1.5">
                    {BET_PRESETS.map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() =>
                          setPersonalization((prev) => ({ ...prev, defaultBetPmp: amt }))
                        }
                        className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-all ${
                          personalization.defaultBetPmp === amt
                            ? "bg-amber-500/20 border-amber-400 text-amber-200"
                            : "bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200"
                        }`}
                      >
                        {amt.toLocaleString()}P
                      </button>
                    ))}
                  </div>
                  <select
                    value={personalization.defaultLanding}
                    onChange={(e) =>
                      setPersonalization((prev) => ({
                        ...prev,
                        defaultLanding: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-white focus:outline-none focus:border-blue-500"
                  >
                    {LANDING_OPTIONS.map((opt) => (
                      <option key={opt.path} value={opt.path}>
                        로그인 시 시작: {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-zinc-800/80">
                <span className="text-[11px] text-zinc-400">
                  💡 설정은 언제든 우측 상단 <strong>[개인맞춤 설정]</strong> 탭에서 변경할 수 있습니다.
                </span>
                <AdminButton
                  variant="primary"
                  size="default"
                  disabled={savingSettings}
                  onClick={() => handleSavePersonalization(true)}
                >
                  <Save className="w-4 h-4" />
                  <span>{savingSettings ? "적용 중..." : "내 맞춤 대시보드 적용하기"}</span>
                </AdminButton>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 메인 대시보드 컨테이너 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
        {/* 4대 핵심 개인 KPI 카드 (shadcn/ui 스타일) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 1. PMP Balance */}
          <AdminCard className="bg-gradient-to-br from-amber-950/20 via-zinc-900/90 to-zinc-950 border-amber-500/25">
            <AdminCardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-amber-300/90">
                  보유 PMP (예측 포인트)
                </span>
                <Coins className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-white mt-1">
                {balances.pmp.toLocaleString()}{" "}
                <span className="text-xs font-semibold text-amber-400">PMP</span>
              </div>
            </AdminCardHeader>
            <AdminCardContent className="pt-0">
              <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-2 border-t border-zinc-800/80">
                <span>원금 손실 없는 무위험 배팅 자산</span>
                <Link
                  href="/prediction"
                  className="text-amber-300 hover:underline font-semibold flex items-center gap-0.5"
                >
                  예측 참여 <ArrowUpRight className="w-3 h-3" />
                </Link>
              </div>
            </AdminCardContent>
          </AdminCard>

          {/* 2. PMC Balance */}
          <AdminCard className="bg-gradient-to-br from-emerald-950/20 via-zinc-900/90 to-zinc-950 border-emerald-500/25">
            <AdminCardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-emerald-300/90">
                  보유 PMC (가치·기부 화폐)
                </span>
                <TrendingUp className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-white mt-1">
                {balances.pmc.toLocaleString()}{" "}
                <span className="text-xs font-semibold text-emerald-400">PMC</span>
              </div>
            </AdminCardHeader>
            <AdminCardContent className="pt-0">
              <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-2 border-t border-zinc-800/80">
                <span>예측 적중 보상 & MoneyWave 배당</span>
                <Link
                  href="/donation"
                  className="text-emerald-300 hover:underline font-semibold flex items-center gap-0.5"
                >
                  기부·환원 <ArrowUpRight className="w-3 h-3" />
                </Link>
              </div>
            </AdminCardContent>
          </AdminCard>

          {/* 3. 내 예측 포트폴리오 */}
          <AdminCard className="bg-gradient-to-br from-blue-950/20 via-zinc-900/90 to-zinc-950 border-blue-500/25">
            <AdminCardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-blue-300/90">
                  내 예측 포트폴리오
                </span>
                <Target className="w-4 h-4 text-blue-400" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-white mt-1">
                {predictionStats.activeCount}건{" "}
                <span className="text-xs font-normal text-zinc-400">
                  진행중 / 총 {predictionStats.totalCount}건
                </span>
              </div>
            </AdminCardHeader>
            <AdminCardContent className="pt-0">
              <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-2 border-t border-zinc-800/80">
                <span>운영 중 배팅: {predictionStats.totalBetPmp.toLocaleString()} PMP</span>
                <button
                  onClick={() => setActiveTab("predictions")}
                  className="text-blue-300 hover:underline font-semibold flex items-center gap-0.5"
                >
                  내역 관리 <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </AdminCardContent>
          </AdminCard>

          {/* 4. 시민 랭킹 & 공헌 지수 */}
          <AdminCard className="bg-gradient-to-br from-purple-950/20 via-zinc-900/90 to-zinc-950 border-purple-500/25">
            <AdminCardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-purple-300/90">
                  {personalization.sido} 시민 랭킹
                </span>
                <Trophy className="w-4 h-4 text-purple-400" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-white mt-1">
                #{initialData.ranking.overallRank}{" "}
                <span className="text-xs font-normal text-purple-300">
                  ({initialData.ranking.contributionScore.toLocaleString()} pt)
                </span>
              </div>
            </AdminCardHeader>
            <AdminCardContent className="pt-0">
              <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-2 border-t border-zinc-800/80">
                <span>누적 기부: {initialData.ranking.totalPmcDonated.toLocaleString()} PMC</span>
                <Link
                  href="/ranking"
                  className="text-purple-300 hover:underline font-semibold flex items-center gap-0.5"
                >
                  명예의 전당 <ArrowUpRight className="w-3 h-3" />
                </Link>
              </div>
            </AdminCardContent>
          </AdminCard>
        </div>

        {/* shadcn/ui 스타일 5대 탭 네비게이션 */}
        <div className="flex items-center gap-1.5 p-1.5 rounded-xl bg-zinc-900/90 border border-zinc-800/90 overflow-x-auto no-scrollbar">
          {[
            {
              id: "foryou" as const,
              label: "✨ 맞춤 브리핑 & 추천 (For You)",
              badge: `${personalizedGames.length}`,
            },
            {
              id: "predictions" as const,
              label: "🎯 내 예측 포트폴리오",
              badge: `${myPredictions.length}`,
            },
            {
              id: "wallet" as const,
              label: "💳 통합 지갑 & 원장",
              badge: `${transactions.length}`,
            },
            {
              id: "donation" as const,
              label: "🌱 기부 & 소셜 임팩트",
            },
            {
              id: "settings" as const,
              label: "⚙️ 개인맞춤 설정 (프로필·관심사)",
            },
          ].map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3.5 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 ${
                  active
                    ? "bg-zinc-100 text-zinc-950 shadow-sm"
                    : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60"
                }`}
              >
                <span>{tab.label}</span>
                {tab.badge && (
                  <span
                    className={`px-1.5 py-0.2 rounded text-[10px] font-extrabold ${
                      active
                        ? "bg-zinc-900 text-zinc-100"
                        : "bg-zinc-800 text-zinc-400"
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* ==================== 탭 1: 맞춤 브리핑 & 추천 (For You) ==================== */}
        {activeTab === "foryou" && (
          <div className="space-y-6">
            {/* 맞춤 예측 마켓 섹션 */}
            <AdminCard>
              <AdminCardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800/80">
                <div>
                  <div className="flex items-center gap-2">
                    <AdminCardTitle className="text-base">
                      🎯 {displayName}님을 위한 맞춤 예측 마켓
                    </AdminCardTitle>
                    <AdminBadge variant="info">
                      관심 도메인 {personalization.favoriteDomains.length}개 반영
                    </AdminBadge>
                  </div>
                  <AdminCardDescription>
                    설정한 관심 분야(
                    {DOMAIN_OPTIONS.filter((d) =>
                      personalization.favoriteDomains.includes(d.key)
                    )
                      .map((d) => d.label)
                      .join(", ")}
                    )와 공인 오라클이 연결된 우선 추천 마켓입니다.
                  </AdminCardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <AdminButton
                    variant="outline"
                    size="sm"
                    onClick={() => setActiveTab("settings")}
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    <span>관심 도메인 변경</span>
                  </AdminButton>
                  <Link href="/prediction">
                    <AdminButton variant="secondary" size="sm">
                      <span>전체 마켓 보기</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </AdminButton>
                  </Link>
                </div>
              </AdminCardHeader>

              <AdminCardContent className="pt-5">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {personalizedGames.map((game) => {
                    const catMeta = getCategoryMeta(game.category);
                    const isFav = personalization.favoriteDomains.includes(
                      (game.category || "INVEST").toUpperCase()
                    );
                    const href = `/prediction/${game.slug || game.game_id}`;

                    return (
                      <div
                        key={game.game_id}
                        className={`rounded-xl border p-4 flex flex-col justify-between transition-all hover:border-blue-500/50 ${
                          isFav
                            ? "bg-gradient-to-b from-blue-950/20 to-zinc-900/80 border-blue-500/30"
                            : "bg-zinc-900/50 border-zinc-800/80"
                        }`}
                      >
                        <div className="space-y-3">
                          <div className="flex items-center justify-between gap-2">
                            <AdminBadge variant={catMeta.variant}>{catMeta.label}</AdminBadge>
                            {isFav && (
                              <span className="text-[10px] font-bold text-blue-300 bg-blue-500/15 px-2 py-0.5 rounded-full border border-blue-400/30">
                                ★ 내 관심 분야
                              </span>
                            )}
                          </div>

                          <Link href={href} className="block group">
                            <h4 className="text-sm font-bold text-zinc-100 group-hover:text-blue-300 transition-colors line-clamp-2">
                              {game.title}
                            </h4>
                          </Link>

                          {/* 선택지 미리보기 */}
                          <div className="grid grid-cols-2 gap-1.5 pt-1">
                            {game.options.slice(0, 2).map((opt) => (
                              <div
                                key={opt.id}
                                className="px-2.5 py-1.5 rounded-lg bg-zinc-950/90 border border-zinc-800/90 text-xs flex items-center justify-between"
                              >
                                <span className="text-zinc-300 truncate">{opt.label}</span>
                                <span className="text-blue-400 font-bold ml-1 shrink-0">
                                  {opt.odds ? `${opt.odds}x` : "배팅"}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="mt-4 pt-3 border-t border-zinc-800/80 flex items-center justify-between text-[11px] text-zinc-400">
                          <div>
                            <span className="text-emerald-400 font-bold">
                              💰 {game.prize_pool.toLocaleString()} PMC
                            </span>
                            <span className="mx-1.5">·</span>
                            <span>{game.participants_count}명 참여</span>
                          </div>
                          <Link
                            href={href}
                            className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-[11px] transition-colors"
                          >
                            {personalization.defaultBetPmp.toLocaleString()}P 배팅 →
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </AdminCardContent>
            </AdminCard>

            {/* 맞춤 실시간 LIVE 응원톡 & 시민 선순환 가이드 그리드 */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* 좌측 8/12: 내 관심 LIVE 응원톡 */}
              <div className="lg:col-span-8">
                <AdminCard className="h-full">
                  <AdminCardHeader className="flex flex-row items-center justify-between border-b border-zinc-800/80">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                        <AdminCardTitle className="text-base">
                          🔴 실시간 LIVE 응원톡 맞춤 채널
                        </AdminCardTitle>
                      </div>
                      <AdminCardDescription>
                        경기를 보며 시민들과 실시간 채팅하고 연동된 예측 마켓에 즉시 참여하세요.
                      </AdminCardDescription>
                    </div>
                    <Link href="/live">
                      <AdminButton variant="danger" size="sm">
                        <Radio className="w-3.5 h-3.5" />
                        <span>LIVE 라운지 전체</span>
                      </AdminButton>
                    </Link>
                  </AdminCardHeader>

                  <AdminCardContent className="pt-4 space-y-3">
                    {personalizedLiveRooms.slice(0, 4).map((room) => (
                      <div
                        key={room.id}
                        className="p-4 rounded-xl bg-zinc-900/70 border border-zinc-800/90 hover:border-rose-500/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                      >
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <AdminBadge
                              variant={room.status === "LIVE" ? "danger" : "warning"}
                            >
                              {room.status === "LIVE" ? "🔴 ON-AIR" : "⏰ UPCOMING"}
                            </AdminBadge>
                            <span className="text-xs font-semibold text-zinc-300">
                              {room.categoryLabel}
                            </span>
                            <span className="text-[11px] text-zinc-500">
                              · 👥 {room.viewerCount.toLocaleString()}명 시청 중
                            </span>
                          </div>
                          <h4 className="text-sm font-bold text-white">{room.title}</h4>
                          <p className="text-xs text-zinc-400">
                            🎯 연동 예측: <span className="text-zinc-300">{room.linkedPredictionTitle}</span>
                          </p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {room.scoreBoard && (
                            <div className="px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs font-mono text-amber-300">
                              {room.scoreBoard.leftTeam} {room.scoreBoard.leftScore} :{" "}
                              {room.scoreBoard.rightScore} {room.scoreBoard.rightTeam}
                            </div>
                          )}
                          <Link href={`/live/${room.id}`}>
                            <AdminButton variant="primary" size="sm">
                              입장하기 →
                            </AdminButton>
                          </Link>
                        </div>
                      </div>
                    ))}
                  </AdminCardContent>
                </AdminCard>
              </div>

              {/* 우측 4/12: 나만의 시민 선순환 & 설정 요약 */}
              <div className="lg:col-span-4 space-y-6">
                <AdminCard className="border-emerald-500/25 bg-gradient-to-b from-emerald-950/15 to-zinc-900/90">
                  <AdminCardHeader>
                    <AdminCardTitle className="text-base flex items-center gap-2">
                      <Compass className="w-4 h-4 text-emerald-400" />
                      <span>🌊 PosMul 시민 선순환 가이드</span>
                    </AdminCardTitle>
                    <AdminCardDescription>
                      포럼 ➔ 소비 ➔ 예측 ➔ 기부로 이어지는 내 자산 순환 현황
                    </AdminCardDescription>
                  </AdminCardHeader>
                  <AdminCardContent className="space-y-3 text-xs">
                    <div className="p-3 rounded-xl bg-zinc-950/80 border border-zinc-800/80 flex items-center justify-between">
                      <div>
                        <p className="font-bold text-zinc-200">1. 공론장 & 소비 적립 (PMP)</p>
                        <p className="text-[11px] text-zinc-400">
                          글 작성 {initialData.ranking.forumPostsCount}건 · 캠페인 시청
                        </p>
                      </div>
                      <Link href="/forum" className="text-blue-400 font-bold hover:underline">
                        이동 →
                      </Link>
                    </div>

                    <div className="p-3 rounded-xl bg-zinc-950/80 border border-zinc-800/80 flex items-center justify-between">
                      <div>
                        <p className="font-bold text-zinc-200">2. 공인 오라클 예측 (PMP ➔ PMC)</p>
                        <p className="text-[11px] text-zinc-400">
                          기본 배팅 {personalization.defaultBetPmp.toLocaleString()} PMP 설정됨
                        </p>
                      </div>
                      <Link href="/prediction" className="text-amber-400 font-bold hover:underline">
                        배팅 →
                      </Link>
                    </div>

                    <div className="p-3 rounded-xl bg-zinc-950/80 border border-zinc-800/80 flex items-center justify-between">
                      <div>
                        <p className="font-bold text-zinc-200">3. 가치 나눔 & 지역 환원 (PMC)</p>
                        <p className="text-[11px] text-zinc-400">
                          누적 {initialData.ranking.totalPmcDonated.toLocaleString()} PMC 사회 환원
                        </p>
                      </div>
                      <Link href="/donation" className="text-emerald-400 font-bold hover:underline">
                        기부 →
                      </Link>
                    </div>
                  </AdminCardContent>
                </AdminCard>
              </div>
            </div>
          </div>
        )}

        {/* ==================== 탭 2: 내 예측 포트폴리오 ==================== */}
        {activeTab === "predictions" && (
          <AdminCard>
            <AdminCardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800/80">
              <div>
                <AdminCardTitle className="text-base">
                  🎯 나의 예측 참여 포트폴리오 ({filteredPredictions.length}건)
                </AdminCardTitle>
                <AdminCardDescription>
                  진행 중인 예측은 마감 전 언제든 철회하여 배팅한 PMP를 100% 환불받을 수 있습니다.
                </AdminCardDescription>
              </div>

              <div className="flex items-center gap-1.5">
                {[
                  { key: "all" as const, label: "전체" },
                  { key: "ACTIVE" as const, label: "진행중" },
                  { key: "SETTLED" as const, label: "정산완료" },
                ].map((f) => (
                  <button
                    key={f.key}
                    onClick={() => setPredictionFilter(f.key)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      predictionFilter === f.key
                        ? "bg-blue-600 text-white"
                        : "bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </AdminCardHeader>

            <AdminCardContent className="pt-4">
              {filteredPredictions.length === 0 ? (
                <div className="py-14 text-center space-y-3">
                  <Target className="w-10 h-10 text-zinc-600 mx-auto" />
                  <p className="text-sm font-bold text-zinc-300">
                    아직 참여한 예측 마켓 내역이 없습니다.
                  </p>
                  <p className="text-xs text-zinc-500">
                    보유하신 {balances.pmp.toLocaleString()} PMP로 관심 분야 예측 게임에 첫 배팅을 시작해 보세요!
                  </p>
                  <div className="pt-2">
                    <Link href="/prediction">
                      <AdminButton variant="primary" size="default">
                        예측 마켓 둘러보기 →
                      </AdminButton>
                    </Link>
                  </div>
                </div>
              ) : (
                <AdminTable>
                  <AdminTableHeader>
                    <AdminTableRow>
                      <AdminTableHead>예측 마켓</AdminTableHead>
                      <AdminTableHead>나의 선택</AdminTableHead>
                      <AdminTableHead>배팅 PMP</AdminTableHead>
                      <AdminTableHead>확신도</AdminTableHead>
                      <AdminTableHead>상태</AdminTableHead>
                      <AdminTableHead>참여일</AdminTableHead>
                      <AdminTableHead className="text-right">액션</AdminTableHead>
                    </AdminTableRow>
                  </AdminTableHeader>
                  <AdminTableBody>
                    {filteredPredictions.map((pred) => {
                      const canWithdraw = pred.is_active && pred.gameStatus === "ACTIVE";
                      return (
                        <AdminTableRow key={pred.prediction_id}>
                          <AdminTableCell className="font-semibold text-zinc-100 max-w-xs">
                            <Link
                              href={`/prediction/${pred.gameSlug || pred.game_id}`}
                              className="hover:text-blue-400 transition-colors line-clamp-1"
                            >
                              {pred.gameTitle}
                            </Link>
                          </AdminTableCell>
                          <AdminTableCell>
                            <AdminBadge variant="info">{pred.selectedOptionLabel}</AdminBadge>
                          </AdminTableCell>
                          <AdminTableCell className="font-mono font-bold text-amber-300">
                            {Number(pred.bet_amount).toLocaleString()} PMP
                          </AdminTableCell>
                          <AdminTableCell className="text-xs text-zinc-300">
                            {pred.confidence_level}%
                          </AdminTableCell>
                          <AdminTableCell>
                            {!pred.is_active ? (
                              <AdminBadge variant="default">철회됨</AdminBadge>
                            ) : pred.gameStatus === "SETTLED" ? (
                              <AdminBadge variant="success">정산완료</AdminBadge>
                            ) : (
                              <AdminBadge variant="warning">진행중</AdminBadge>
                            )}
                          </AdminTableCell>
                          <AdminTableCell className="text-xs text-zinc-400">
                            {new Date(pred.created_at).toLocaleDateString("ko-KR")}
                          </AdminTableCell>
                          <AdminTableCell className="text-right">
                            {canWithdraw ? (
                              <AdminButton
                                variant="danger"
                                size="sm"
                                disabled={withdrawingId === pred.prediction_id}
                                onClick={() =>
                                  handleWithdrawPrediction(
                                    pred.prediction_id,
                                    Number(pred.bet_amount)
                                  )
                                }
                              >
                                <Undo2 className="w-3 h-3" />
                                <span>
                                  {withdrawingId === pred.prediction_id ? "처리중..." : "배팅 철회"}
                                </span>
                              </AdminButton>
                            ) : pred.gameStatus === "SETTLED" ? (
                              <Link href="/donation">
                                <AdminButton variant="success" size="sm">
                                  🤲 기부하기
                                </AdminButton>
                              </Link>
                            ) : (
                              <span className="text-xs text-zinc-600">-</span>
                            )}
                          </AdminTableCell>
                        </AdminTableRow>
                      );
                    })}
                  </AdminTableBody>
                </AdminTable>
              )}
            </AdminCardContent>
          </AdminCard>
        )}

        {/* ==================== 탭 3: 통합 지갑 & 원장 ==================== */}
        {activeTab === "wallet" && (
          <AdminCard>
            <AdminCardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800/80">
              <div>
                <AdminCardTitle className="text-base">
                  💳 PMP · PMC 통합 자산 원장 (Ledger Transactions)
                </AdminCardTitle>
                <AdminCardDescription>
                  모든 예측 배팅, 오라클 정산 보상, 캠페인 시청 적립 및 공익 기부 내역이 투명하게 기록됩니다.
                </AdminCardDescription>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                {[
                  { key: "all" as const, label: "전체" },
                  { key: "prediction" as const, label: "🎲 예측 배팅" },
                  { key: "reward" as const, label: "🎁 보너스/보상" },
                  { key: "donation" as const, label: "🌱 기부" },
                  { key: "consume" as const, label: "🎬 소비 적립" },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setTxFilter(tab.key)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      txFilter === tab.key
                        ? "bg-purple-600 text-white"
                        : "bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </AdminCardHeader>

            <AdminCardContent className="pt-4 space-y-2.5">
              {filteredTransactions.map((tx) => {
                const isPositive = tx.amount > 0;
                return (
                  <div
                    key={tx.id}
                    className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800/80 flex items-center justify-between gap-4"
                  >
                    <div className="space-y-0.5">
                      <p className="text-sm font-bold text-zinc-100">{tx.title}</p>
                      <p className="text-xs text-zinc-500">
                        {new Date(tx.createdAt).toLocaleString("ko-KR")}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p
                        className={`text-sm font-black font-mono ${
                          isPositive ? "text-emerald-400" : "text-zinc-200"
                        }`}
                      >
                        {isPositive
                          ? `+${tx.amount.toLocaleString()}`
                          : tx.amount.toLocaleString()}{" "}
                        <span className="text-xs font-normal text-zinc-400">{tx.currency}</span>
                      </p>
                      <AdminBadge
                        variant={
                          tx.status === "completed"
                            ? "success"
                            : tx.status === "cancelled"
                            ? "default"
                            : "warning"
                        }
                      >
                        {tx.status === "completed"
                          ? "완료"
                          : tx.status === "cancelled"
                          ? "철회됨"
                          : "진행중"}
                      </AdminBadge>
                    </div>
                  </div>
                );
              })}
            </AdminCardContent>
          </AdminCard>
        )}

        {/* ==================== 탭 4: 기부 & 소셜 임팩트 ==================== */}
        {activeTab === "donation" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8 space-y-6">
              <AdminCard>
                <AdminCardHeader className="border-b border-zinc-800/80">
                  <div className="flex items-center justify-between">
                    <div>
                      <AdminCardTitle className="text-base flex items-center gap-2">
                        <Heart className="w-4 h-4 text-rose-400" />
                        <span>🌱 나의 기부 & 사회적 임팩트 리포트</span>
                      </AdminCardTitle>
                      <AdminCardDescription>
                        예측 성공과 MoneyWave로 획득한 PMC를 사회에 환원한 투명한 공헌 기록입니다.
                      </AdminCardDescription>
                    </div>
                    <Link href="/donation">
                      <AdminButton variant="success" size="sm">
                        새 기부 참여하기 →
                      </AdminButton>
                    </Link>
                  </div>
                </AdminCardHeader>

                <AdminCardContent className="pt-5 space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-500/30">
                      <span className="text-xs text-rose-300 font-semibold">총 기부 PMC</span>
                      <p className="text-2xl font-black text-white mt-1">
                        {initialData.ranking.totalPmcDonated.toLocaleString()}{" "}
                        <span className="text-xs font-normal text-rose-300">PMC</span>
                      </p>
                    </div>
                    <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/30">
                      <span className="text-xs text-emerald-300 font-semibold">기부 랭킹</span>
                      <p className="text-2xl font-black text-white mt-1">
                        #{initialData.ranking.donationRank}{" "}
                        <span className="text-xs font-normal text-emerald-300">
                          ({personalization.sido})
                        </span>
                      </p>
                    </div>
                    <div className="p-4 rounded-xl bg-blue-950/20 border border-blue-500/30">
                      <span className="text-xs text-blue-300 font-semibold">시민 공헌 지수</span>
                      <p className="text-2xl font-black text-white mt-1">
                        {initialData.ranking.contributionScore.toLocaleString()}{" "}
                        <span className="text-xs font-normal text-blue-300">pt</span>
                      </p>
                    </div>
                  </div>

                  <div className="p-5 rounded-xl bg-zinc-900/70 border border-zinc-800/80 space-y-3">
                    <h4 className="text-sm font-bold text-white">
                      🌊 MoneyWave2 미사용 PMC 재분배 & 세제 혜택 안내
                    </h4>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      • <strong>MoneyWave2 순환</strong>: 일정 기간 사용되지 않은 휴면 PMC는 생태계 활성화를 위해 성실 예측 참여자 및 공익 기금 풀로 재분배됩니다.
                      <br />• <strong>투명한 원장 검증</strong>: 기부된 모든 PMC는 공익 기관 및 오피니언 리더 후원 원장에 영구 기록됩니다.
                    </p>
                  </div>
                </AdminCardContent>
              </AdminCard>
            </div>

            <div className="lg:col-span-4">
              <AdminCard>
                <AdminCardHeader>
                  <AdminCardTitle className="text-base">빠른 기부 채널 이동</AdminCardTitle>
                  <AdminCardDescription>원하는 방식으로 PMC 가치를 나누세요.</AdminCardDescription>
                </AdminCardHeader>
                <AdminCardContent className="space-y-3">
                  <Link
                    href="/donation/direct"
                    className="block p-3.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-emerald-500/40 transition-all"
                  >
                    <p className="text-xs font-bold text-white">📦 K-물품 직접 기부</p>
                    <p className="text-[11px] text-zinc-400 mt-0.5">
                      의류·식품·교육 물품을 필요한 이웃에게 직접 매칭
                    </p>
                  </Link>
                  <Link
                    href="/donation/institute"
                    className="block p-3.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-emerald-500/40 transition-all"
                  >
                    <p className="text-xs font-bold text-white">🏛️ 공인 기관 기부</p>
                    <p className="text-[11px] text-zinc-400 mt-0.5">
                      긴급구호·아동복지·환경보호 인증 기관 후원
                    </p>
                  </Link>
                  <Link
                    href="/donation/opinion-leader"
                    className="block p-3.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-emerald-500/40 transition-all"
                  >
                    <p className="text-xs font-bold text-white">🌟 오피니언 리더 후원</p>
                    <p className="text-[11px] text-zinc-400 mt-0.5">
                      공익 의제를 이끄는 분야별 전문가 및 크리에이터 응원
                    </p>
                  </Link>
                </AdminCardContent>
              </AdminCard>
            </div>
          </div>
        )}

        {/* ==================== 탭 5: 개인맞춤 설정 (Personalization & Profile) ==================== */}
        {activeTab === "settings" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* 좌측 7/12: 시민 프로필 & 관심 도메인 설정 */}
            <div className="lg:col-span-7 space-y-6">
              <AdminCard>
                <AdminCardHeader className="border-b border-zinc-800/80">
                  <AdminCardTitle className="text-base flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-blue-400" />
                    <span>1. 시민 프로필 & 지역/직군 맞춤 설정</span>
                  </AdminCardTitle>
                  <AdminCardDescription>
                    닉네임, 대표 아바타, 거주 시·도(지역 랭킹 및 지역 예산 연동)를 설정합니다.
                  </AdminCardDescription>
                </AdminCardHeader>

                <AdminCardContent className="pt-5 space-y-5">
                  {/* 아바타 이모지 선택 */}
                  <div>
                    <label className="block text-xs font-bold text-zinc-300 mb-2">
                      대표 시민 아바타 아이콘
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {AVATAR_EMOJIS.map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() =>
                            setPersonalization((prev) => ({ ...prev, avatarEmoji: emoji }))
                          }
                          className={`w-11 h-11 rounded-xl text-xl flex items-center justify-center border transition-all ${
                            personalization.avatarEmoji === emoji
                              ? "bg-blue-600/30 border-blue-400 scale-105 shadow"
                              : "bg-zinc-900 border-zinc-800 hover:border-zinc-700"
                          }`}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                        시민 닉네임 (Display Name)
                      </label>
                      <input
                        type="text"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="닉네임을 입력하세요"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                        계정 이메일 / ID
                      </label>
                      <input
                        type="text"
                        disabled
                        value={initialData.email}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800/60 text-sm text-zinc-500 cursor-not-allowed"
                      />
                    </div>
                  </div>

                  {/* 간편 로그인 연동 관리 카드 */}
                  <div className="p-4 rounded-xl bg-zinc-950/80 border border-zinc-800/80 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                          <ShieldCheck className="w-4 h-4 text-emerald-400" />
                          간편 로그인 연동 관리 (소셜 계정 매핑)
                        </h4>
                        <p className="text-[11px] text-zinc-400 mt-0.5">
                          자주 사용하는 소셜 계정을 연동하면 카카오, 네이버, 구글 어디로 로그인해도 내 포인트와 예측 전적이 그대로 유지됩니다.
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                      {/* 카카오 */}
                      <div className="p-3 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-[#FEE500]" />
                          <div>
                            <div className="text-xs font-bold text-white">카카오톡</div>
                            <div className="text-[10px] text-zinc-400">
                              {initialData.kakaoConnected || initialData.provider === "kakao"
                                ? "연동 완료"
                                : "미연동"}
                            </div>
                          </div>
                        </div>
                        {initialData.kakaoConnected || initialData.provider === "kakao" ? (
                          <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                            연결됨
                          </span>
                        ) : (
                          <Link
                            href="/api/auth/kakao/login?next=/dashboard"
                            className="text-[10px] font-bold text-[#FEE500] hover:underline"
                          >
                            연동하기 →
                          </Link>
                        )}
                      </div>

                      {/* 네이버 */}
                      <div className="p-3 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-[#03C75A]" />
                          <div>
                            <div className="text-xs font-bold text-white">네이버</div>
                            <div className="text-[10px] text-zinc-400">
                              {initialData.naverConnected || initialData.provider === "naver"
                                ? "연동 완료"
                                : "미연동"}
                            </div>
                          </div>
                        </div>
                        {initialData.naverConnected || initialData.provider === "naver" ? (
                          <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                            연결됨
                          </span>
                        ) : (
                          <Link
                            href="/api/auth/naver/login?next=/dashboard"
                            className="text-[10px] font-bold text-[#03C75A] hover:underline"
                          >
                            연동하기 →
                          </Link>
                        )}
                      </div>

                      {/* 구글 */}
                      <div className="p-3 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-blue-400" />
                          <div>
                            <div className="text-xs font-bold text-white">구글</div>
                            <div className="text-[10px] text-zinc-400">
                              {initialData.googleConnected || initialData.provider === "google"
                                ? "연동 완료"
                                : "미연동"}
                            </div>
                          </div>
                        </div>
                        {initialData.googleConnected || initialData.provider === "google" ? (
                          <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                            연결됨
                          </span>
                        ) : (
                          <span className="text-[10px] text-zinc-500">
                            기본 이메일
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                      한줄 자기소개 / 예측 철학
                    </label>
                    <input
                      type="text"
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="나만의 예측 스타일이나 소개를 적어주세요"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                        내 거주/활동 시·도 (시민 랭킹 & 예산 연동)
                      </label>
                      <select
                        value={personalization.sido}
                        onChange={(e) =>
                          setPersonalization((prev) => ({ ...prev, sido: e.target.value }))
                        }
                        className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-white focus:outline-none focus:border-blue-500"
                      >
                        {SIDO_LIST.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                        전문 분야 / 직군
                      </label>
                      <select
                        value={personalization.jobGroup}
                        onChange={(e) =>
                          setPersonalization((prev) => ({ ...prev, jobGroup: e.target.value }))
                        }
                        className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-white focus:outline-none focus:border-blue-500"
                      >
                        {JOB_GROUPS.map((jg) => (
                          <option key={jg} value={jg}>
                            {jg}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </AdminCardContent>
              </AdminCard>

              {/* 관심 도메인 멀티 선택 */}
              <AdminCard>
                <AdminCardHeader className="border-b border-zinc-800/80">
                  <AdminCardTitle className="text-base flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span>2. 관심 예측 마켓 & LIVE 응원톡 도메인 설정</span>
                  </AdminCardTitle>
                  <AdminCardDescription>
                    선택한 도메인의 마켓과 실시간 응원톡이 내 대시보드 최상단에 자동 추천됩니다.
                  </AdminCardDescription>
                </AdminCardHeader>

                <AdminCardContent className="pt-5 space-y-3">
                  {DOMAIN_OPTIONS.map((dom) => {
                    const selected = personalization.favoriteDomains.includes(dom.key);
                    return (
                      <div
                        key={dom.key}
                        onClick={() => toggleFavoriteDomain(dom.key)}
                        className={`p-4 rounded-xl border cursor-pointer transition-all flex items-center justify-between gap-4 ${
                          selected
                            ? "bg-blue-950/30 border-blue-500/50 text-white"
                            : "bg-zinc-900/50 border-zinc-800/80 text-zinc-400 hover:border-zinc-700"
                        }`}
                      >
                        <div>
                          <p className="text-sm font-bold text-zinc-100">{dom.label}</p>
                          <p className="text-xs text-zinc-400 mt-0.5">{dom.desc}</p>
                        </div>
                        <div
                          className={`w-6 h-6 rounded-lg flex items-center justify-center border shrink-0 ${
                            selected
                              ? "bg-blue-600 border-blue-400 text-white"
                              : "bg-zinc-950 border-zinc-700 text-transparent"
                          }`}
                        >
                          ✓
                        </div>
                      </div>
                    );
                  })}
                </AdminCardContent>
              </AdminCard>
            </div>

            {/* 우측 5/12: 배팅 프리셋, 시작 화면, 알림 & 프라이버시 */}
            <div className="lg:col-span-5 space-y-6">
              <AdminCard>
                <AdminCardHeader className="border-b border-zinc-800/80">
                  <AdminCardTitle className="text-base flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-emerald-400" />
                    <span>3. 나만의 예측 배팅 & 시작 화면 프리셋</span>
                  </AdminCardTitle>
                  <AdminCardDescription>
                    예측 게임 참여 시 기본으로 세팅될 배팅 금액과 확신도를 지정합니다.
                  </AdminCardDescription>
                </AdminCardHeader>

                <AdminCardContent className="pt-5 space-y-5">
                  <div>
                    <label className="block text-xs font-bold text-zinc-300 mb-2">
                      기본 빠른 배팅 금액 (Default Bet PMP)
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {BET_PRESETS.map((amt) => (
                        <button
                          key={amt}
                          type="button"
                          onClick={() =>
                            setPersonalization((prev) => ({ ...prev, defaultBetPmp: amt }))
                          }
                          className={`py-2.5 rounded-xl text-xs font-bold border transition-all ${
                            personalization.defaultBetPmp === amt
                              ? "bg-amber-500/20 border-amber-400 text-amber-200 shadow"
                              : "bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200"
                          }`}
                        >
                          {amt.toLocaleString()} PMP
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-bold text-zinc-300">
                        기본 예측 확신도 (Confidence Level)
                      </label>
                      <span className="text-xs font-mono font-bold text-blue-400">
                        {personalization.defaultConfidence}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min={50}
                      max={100}
                      step={5}
                      value={personalization.defaultConfidence}
                      onChange={(e) =>
                        setPersonalization((prev) => ({
                          ...prev,
                          defaultConfidence: Number(e.target.value),
                        }))
                      }
                      className="w-full accent-blue-500"
                    />
                    <div className="flex justify-between text-[10px] text-zinc-500 mt-1">
                      <span>신중함 (50%)</span>
                      <span>균형 (75%)</span>
                      <span>강한 확신 (100%)</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                      로그인 직후 기본 이동 화면
                    </label>
                    <select
                      value={personalization.defaultLanding}
                      onChange={(e) =>
                        setPersonalization((prev) => ({
                          ...prev,
                          defaultLanding: e.target.value,
                        }))
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-white focus:outline-none focus:border-blue-500"
                    >
                      {LANDING_OPTIONS.map((opt) => (
                        <option key={opt.path} value={opt.path}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </AdminCardContent>
              </AdminCard>

              <AdminCard>
                <AdminCardHeader className="border-b border-zinc-800/80">
                  <AdminCardTitle className="text-base flex items-center gap-2">
                    <Bell className="w-4 h-4 text-purple-400" />
                    <span>4. 알림 & 프라이버시 제어</span>
                  </AdminCardTitle>
                </AdminCardHeader>

                <AdminCardContent className="pt-5 space-y-3">
                  {[
                    {
                      key: "settlementAlert" as const,
                      title: "⚖️ 공인 오라클 정산 완료 알림",
                      desc: "참여한 예측 마켓이 정산되어 PMC 보상이 지급될 때 알림",
                    },
                    {
                      key: "liveRoomAlert" as const,
                      title: "🔴 관심 분야 LIVE 응원톡 오픈 알림",
                      desc: "내가 선택한 관심 도메인의 빅매치 LIVE 채팅방 시작 시 알림",
                    },
                    {
                      key: "moneyWaveAlert" as const,
                      title: "🌊 MoneyWave 배당 & 상금풀 변동 알림",
                      desc: "일일 MoneyWave 상금풀 부스트 및 휴면 PMC 재분배 알림",
                    },
                  ].map((item) => {
                    const checked = personalization.notifications[item.key];
                    return (
                      <div
                        key={item.key}
                        onClick={() =>
                          setPersonalization((prev) => ({
                            ...prev,
                            notifications: {
                              ...prev.notifications,
                              [item.key]: !prev.notifications[item.key],
                            },
                          }))
                        }
                        className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80 flex items-center justify-between gap-3 cursor-pointer"
                      >
                        <div>
                          <p className="text-xs font-bold text-zinc-200">{item.title}</p>
                          <p className="text-[11px] text-zinc-500 mt-0.5">{item.desc}</p>
                        </div>
                        <div
                          className={`w-10 h-5 rounded-full p-0.5 transition-colors shrink-0 ${
                            checked ? "bg-blue-600" : "bg-zinc-700"
                          }`}
                        >
                          <div
                            className={`w-4 h-4 rounded-full bg-white transition-transform ${
                              checked ? "translate-x-5" : "translate-x-0"
                            }`}
                          />
                        </div>
                      </div>
                    );
                  })}

                  <div
                    onClick={() =>
                      setPersonalization((prev) => ({
                        ...prev,
                        privacy: {
                          ...prev.privacy,
                          rankingPublic: !prev.privacy.rankingPublic,
                        },
                      }))
                    }
                    className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80 flex items-center justify-between gap-3 cursor-pointer"
                  >
                    <div>
                      <p className="text-xs font-bold text-zinc-200 flex items-center gap-1">
                        <Lock className="w-3.5 h-3.5 text-emerald-400" />
                        <span>🏆 전국/지역 시민 랭킹 보드에 내 닉네임 공개</span>
                      </p>
                      <p className="text-[11px] text-zinc-500 mt-0.5">
                        비공개 시 랭킹 보드에 익명 시민으로 표시됩니다.
                      </p>
                    </div>
                    <div
                      className={`w-10 h-5 rounded-full p-0.5 transition-colors shrink-0 ${
                        personalization.privacy.rankingPublic ? "bg-emerald-600" : "bg-zinc-700"
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded-full bg-white transition-transform ${
                          personalization.privacy.rankingPublic
                            ? "translate-x-5"
                            : "translate-x-0"
                        }`}
                      />
                    </div>
                  </div>
                </AdminCardContent>

                <AdminCardFooter className="justify-between">
                  <span className="text-[11px] text-zinc-400">
                    {initialData.isAuthenticated
                      ? "🔒 Supabase 프로필 DB에 영구 저장됩니다."
                      : "💡 체험 모드에서는 브라우저에 즉시 저장됩니다."}
                  </span>
                  <AdminButton
                    variant="primary"
                    size="default"
                    disabled={savingSettings}
                    onClick={() => handleSavePersonalization(false)}
                  >
                    <Save className="w-4 h-4" />
                    <span>{savingSettings ? "저장 중..." : "개인맞춤 설정 저장하기"}</span>
                  </AdminButton>
                </AdminCardFooter>
              </AdminCard>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

