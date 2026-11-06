"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  Package,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Sparkles,
  Heart,
  PlusCircle,
  MapPin,
  ExternalLink,
  Flame,
  FileCheck,
  ChevronRight,
  Filter,
  ArrowUpDown,
  Tag,
  Check,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  submitWishlistRequest,
  approveWishlistRequest,
  type WishlistSubmissionData,
} from "../wishlist.actions";

interface WishlistPageClientProps {
  initialRequests: any[];
  isLoggedIn: boolean;
  currentUserId: string | null;
}

interface CatalogItem {
  id: string;
  name: string;
  manufacturer: string;
  category: "electronics" | "clothing" | "food" | "education";
  categoryLabel: string;
  icon: string;
  unitPrice: number;
  description: string;
  specSummary: string;
  popularityScore: number;
  highlightBadge: string;
}

const CATALOG_ITEMS: CatalogItem[] = [
  {
    id: "4a56aa1a-b59e-47a2-a260-c6179519d7f5",
    name: "LG 휘센 벽걸이 고효율 인버터 에어컨",
    manufacturer: "LG Electronics (Made in Korea 🇰🇷)",
    category: "electronics",
    categoryLabel: "가전·디지털",
    icon: "🔌",
    unitPrice: 850000,
    description: "에너지소비효율 1등급 인버터 냉방으로 전기료 부담 없이 취약계층 어르신·아동 쉼터에 시원한 여름을 선물합니다.",
    specSummary: "벽걸이형 · 1등급 고효율 · 인버터 절전",
    popularityScore: 98,
    highlightBadge: "인기 1위 가전",
  },
  {
    id: "6daddc20-92cc-4f09-94d2-3b6d3d4f1991",
    name: "키즈 웜 패딩부츠 & 튼튼 신학기 운동화",
    manufacturer: "부산 A제화 (Made in Korea 👟)",
    category: "clothing",
    categoryLabel: "의류·신발",
    icon: "👟",
    unitPrice: 35000,
    description: "미끄럼 방지 및 고밀도 보온 안감 처리된 한국 전통 제화 장인의 수제 공정 어린이 전용 안전 신발입니다.",
    specSummary: "미끄럼 방지 접지창 · 방한 안감 · 180~240mm",
    popularityScore: 95,
    highlightBadge: "신학기 베스트",
  },
  {
    id: "edeb5889-f979-4f63-a9d9-56fa0529f1e0",
    name: "철원 오대쌀 100% 햅쌀 10kg",
    manufacturer: "철원영농조합 (Made in Korea 🌾)",
    category: "food",
    categoryLabel: "식품·생필품",
    icon: "🍚",
    unitPrice: 42000,
    description: "비무장지대 DMZ 청정 수역에서 재배되어 밥맛이 차지고 영양이 풍부한 무료급식소 및 공동식당 전용 햅쌀입니다.",
    specSummary: "철원 오대벼 100% · 단일미 특등급 · 10kg",
    popularityScore: 92,
    highlightBadge: "농가상생 1위",
  },
  {
    id: "d69fd152-5416-478a-9112-4c9a99fa15a3",
    name: "삼성 Bubble Wash AI 대용량 고효율 세탁기",
    manufacturer: "Samsung Electronics (K-가전)",
    category: "electronics",
    categoryLabel: "가전·디지털",
    icon: "🧺",
    unitPrice: 750000,
    description: "공동생활관 및 쉼터의 많은 빨랫감도 깨끗하고 위생적으로 살균 관리할 수 있는 AI 맞춤 코스 지원 대용량 세탁기입니다.",
    specSummary: "대용량 통돌이 · AI 진동저감 · 고온살균",
    popularityScore: 89,
    highlightBadge: "생활필수 가전",
  },
  {
    id: "6ac58185-082d-43b3-b9cb-b31d4f15d6f6",
    name: "교육용 Galaxy Tab S9 FE 스마트 태블릿",
    manufacturer: "Samsung Electronics (K-디지털)",
    category: "education",
    categoryLabel: "교육·디지털",
    icon: "💻",
    unitPrice: 450000,
    description: "온라인 EBS 인강 및 원격 수업, 디지털 코딩 교재를 학습할 수 있는 S펜 지원 10.9인치 고해상도 교육용 기기입니다.",
    specSummary: "10.9형 대화면 · S펜 기본 포함 · 대용량 배터리",
    popularityScore: 86,
    highlightBadge: "디지털 교육격차 해소",
  },
  {
    id: "ae27e1c7-dfe2-4d03-bd68-2d6aee4f6567",
    name: "신학기 꿈나무 프리미엄 학용품 12종 세트",
    manufacturer: "모닝글로리 (Made in Korea 📚)",
    category: "education",
    categoryLabel: "교육·도서",
    icon: "✏️",
    unitPrice: 25000,
    description: "새 학기를 맞이하는 취약계층 아동들을 위한 종합 노트, 친환경 필기구, 필통, 스케치북 등으로 구성된 선물 세트입니다.",
    specSummary: "국산 문구 12종 풀세트 · 친환경 안전 검증",
    popularityScore: 83,
    highlightBadge: "소액 다량 지원",
  },
];

type CategoryFilter = "all" | "electronics" | "clothing" | "food" | "education";
type SortOption = "popularity" | "price_low" | "price_high";

export function WishlistPageClient({
  initialRequests,
  isLoggedIn,
  currentUserId,
}: WishlistPageClientProps) {
  const [activeTab, setActiveTab] = useState<"catalog_form" | "feed" | "admin">("catalog_form");
  const [requests, setRequests] = useState<any[]>(initialRequests);

  // 카탈로그 필터 및 정렬 상태
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
  const [sortOption, setSortOption] = useState<SortOption>("popularity");
  const [selectedItem, setSelectedItem] = useState<CatalogItem>(CATALOG_ITEMS[0]);

  // 폼 입력 상태
  const [facilityName, setFacilityName] = useState("");
  const [facilityType, setFacilityType] = useState("지역아동센터");
  const [regionCity, setRegionCity] = useState("서울");
  const [regionDistrict, setRegionDistrict] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [businessLicenseNumber, setBusinessLicenseNumber] = useState("");
  const [neededQuantity, setNeededQuantity] = useState(1);
  const [story, setStory] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitDone, setIsSubmitDone] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // 심사 처리 상태
  const [processingId, setProcessingId] = useState<string | null>(null);

  // 카탈로그 필터링 및 정렬 연산
  const filteredSortedCatalog = useMemo(() => {
    let list = [...CATALOG_ITEMS];

    if (categoryFilter !== "all") {
      list = list.filter((item) => item.category === categoryFilter);
    }

    if (sortOption === "popularity") {
      list.sort((a, b) => b.popularityScore - a.popularityScore);
    } else if (sortOption === "price_low") {
      list.sort((a, b) => a.unitPrice - b.unitPrice);
    } else if (sortOption === "price_high") {
      list.sort((a, b) => b.unitPrice - a.unitPrice);
    }

    return list;
  }, [categoryFilter, sortOption]);

  const approvedRequests = requests.filter((r) => r.status === "approved");
  const pendingRequests = requests.filter((r) => r.status === "pending");

  const totalFundedTarget = selectedItem.unitPrice * Math.max(1, neededQuantity);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!facilityName.trim() || !contactPerson.trim() || !contactPhone.trim() || !story.trim()) {
      setFormError("필수 항목(시설명, 담당자, 연락처, 사연)을 모두 작성해주세요.");
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    const submission: WishlistSubmissionData = {
      projectId: selectedItem.id,
      facilityName,
      facilityType,
      regionCity,
      regionDistrict: regionDistrict || "기타 지역",
      contactPerson,
      contactPhone,
      businessLicenseNumber: businessLicenseNumber || "고유번호증 서류 심사 예정",
      neededQuantity: Math.max(1, neededQuantity),
      story,
    };

    const res = await submitWishlistRequest(submission);

    setIsSubmitting(false);
    if (res.success && res.data) {
      setIsSubmitDone(true);
      setRequests((prev) => [
        {
          ...res.data,
          project: {
            id: selectedItem.id,
            title: selectedItem.name,
            product_name: selectedItem.name,
            manufacturer: selectedItem.manufacturer,
            unit_price: selectedItem.unitPrice,
          },
        },
        ...prev,
      ]);
    } else {
      setFormError(res.error || "신청 등록 중 문제가 발생했습니다.");
    }
  };

  const handleApprove = async (id: string, name: string) => {
    setProcessingId(id);
    const res = await approveWishlistRequest(id, "고유번호증 및 인가 서류 100% 검증 승인");
    setProcessingId(null);

    if (res.success) {
      alert(`[${name}]의 위시리스트가 승인되었습니다!\n물품 상세페이지 실시간 펀딩에 즉시 등록되었습니다.`);
      setRequests((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: "approved" } : r))
      );
    } else {
      alert("승인 처리 실패: " + res.error);
    }
  };

  return (
    <div className="min-h-screen bg-[#090b12] text-slate-100 pb-28">
      {/* Top Header Bar */}
      <div className="border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link
            href="/donation/direct"
            className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>K-물품 직접기부 허브</span>
          </Link>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-300 border border-purple-500/30">
              K-Wishlist 공식 포털
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-8 space-y-8">
        {/* Hero Title */}
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>수요자 중심 Tied Aid 실물 지원 플랫폼</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            복지시설 K-위시리스트 (Wishlist) 포털
          </h1>
          <p className="text-sm sm:text-base text-slate-400 max-w-2xl leading-relaxed">
            전국 복지시설에 지원 가능한 한국 기업의 실물 제품을 쇼케이스에서 둘러보고,
            우리 시설에 가장 필요한 물품을 선택하여 정식 펀딩을 신청하세요.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 gap-2 sm:gap-4 text-sm font-bold">
          <button
            onClick={() => setActiveTab("catalog_form")}
            className={`pb-3.5 px-3 border-b-2 transition-all flex items-center gap-2 ${
              activeTab === "catalog_form"
                ? "border-purple-500 text-purple-300"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Package className="w-4 h-4" />
            <span>지원 가능 물품 카탈로그 & 신청</span>
          </button>

          <button
            onClick={() => setActiveTab("feed")}
            className={`pb-3.5 px-3 border-b-2 transition-all flex items-center gap-2 ${
              activeTab === "feed"
                ? "border-purple-500 text-purple-300"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <span>📋 전국 위시리스트 현황판</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
              {approvedRequests.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("admin")}
            className={`pb-3.5 px-3 border-b-2 transition-all flex items-center gap-2 ${
              activeTab === "admin"
                ? "border-purple-500 text-purple-300"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>공익심사위 검증 게이트</span>
            {pendingRequests.length > 0 && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse">
                {pendingRequests.length}건 대기
              </span>
            )}
          </button>
        </div>

        {/* Tab 1: Catalog & Registration Form */}
        {activeTab === "catalog_form" && (
          <div className="space-y-10">
            {/* 1. Catalog Showcase Header & Controls */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl sm:text-2xl font-extrabold text-white flex items-center gap-2">
                    <Package className="w-6 h-6 text-purple-400" />
                    <span>STEP 1: 지원 가능한 K-물품 선택 (카탈로그)</span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    아래 카드를 클릭하여 신청할 물품을 지정하시면, 하단 신청서에 자동 반영됩니다.
                  </p>
                </div>

                {/* Sort Dropdown */}
                <div className="flex items-center gap-2 shrink-0">
                  <ArrowUpDown className="w-4 h-4 text-slate-500" />
                  <select
                    value={sortOption}
                    onChange={(e) => setSortOption(e.target.value as SortOption)}
                    className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                  >
                    <option value="popularity">인기순 정렬</option>
                    <option value="price_low">단가 낮은순</option>
                    <option value="price_high">단가 높은순</option>
                  </select>
                </div>
              </div>

              {/* Category Filter Pills */}
              <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                {[
                  { key: "all", label: "전체 물품", icon: "🎁" },
                  { key: "electronics", label: "가전·디지털", icon: "🔌" },
                  { key: "clothing", label: "의류·신발", icon: "👟" },
                  { key: "food", label: "식품·생필품", icon: "🍚" },
                  { key: "education", label: "교육·도서", icon: "📚" },
                ].map((cat) => (
                  <button
                    key={cat.key}
                    onClick={() => setCategoryFilter(cat.key as CategoryFilter)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
                      categoryFilter === cat.key
                        ? "bg-purple-500/20 text-purple-200 border-purple-400/40 shadow-sm"
                        : "bg-slate-900/70 text-slate-400 border-slate-800 hover:text-slate-200"
                    }`}
                  >
                    {cat.icon} {cat.label}
                  </button>
                ))}
              </div>

              {/* Catalog Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
                {filteredSortedCatalog.map((item) => {
                  const isSelected = selectedItem.id === item.id;
                  return (
                    <motion.div
                      key={item.id}
                      onClick={() => setSelectedItem(item)}
                      whileHover={{ scale: 1.015 }}
                      whileTap={{ scale: 0.99 }}
                      className={`cursor-pointer rounded-3xl p-5 border transition-all relative overflow-hidden flex flex-col justify-between ${
                        isSelected
                          ? "bg-slate-900 border-purple-500 shadow-xl shadow-purple-500/10 ring-2 ring-purple-500"
                          : "bg-slate-900/60 border-slate-800/90 hover:border-slate-700 hover:bg-slate-900/80"
                      }`}
                    >
                      {/* Selected Badge */}
                      {isSelected && (
                        <div className="absolute top-0 right-0 bg-gradient-to-l from-purple-600 to-indigo-600 text-white text-[11px] font-bold px-3 py-1 rounded-bl-xl flex items-center gap-1 shadow">
                          <Check className="w-3 h-3" />
                          <span>선택됨 (신청 대상)</span>
                        </div>
                      )}

                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-3xl p-2.5 rounded-2xl bg-slate-950 border border-slate-800/80 inline-block shadow-inner">
                            {item.icon}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/30">
                            {item.highlightBadge}
                          </span>
                        </div>

                        <div>
                          <span className="text-[11px] font-semibold text-slate-400 block mb-0.5">
                            {item.manufacturer}
                          </span>
                          <h3 className="font-extrabold text-base text-white leading-snug">
                            {item.name}
                          </h3>
                        </div>

                        <p className="text-xs text-slate-300 leading-relaxed line-clamp-2">
                          {item.description}
                        </p>

                        <div className="p-2 rounded-xl bg-slate-950 border border-white/[0.04] text-[11px] text-slate-400">
                          스펙: <strong className="text-slate-300">{item.specSummary}</strong>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between mt-4">
                        <div>
                          <span className="text-[10px] text-slate-500 block">개당 단가</span>
                          <span className="text-base font-extrabold text-purple-300">
                            {item.unitPrice.toLocaleString()} PMC
                          </span>
                        </div>

                        <button
                          type="button"
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                            isSelected
                              ? "bg-purple-600 text-white"
                              : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                          }`}
                        >
                          {isSelected ? "선택 완료 ✓" : "이 물품 선택"}
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* 2. Facility Application Form Bound to Selected Item */}
            <div className="rounded-3xl bg-slate-900/90 border border-purple-500/30 p-6 sm:p-10 shadow-2xl space-y-6">
              <div>
                <span className="text-xs font-bold text-purple-400 uppercase tracking-wider flex items-center gap-1.5 mb-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  STEP 2: 우리 시설 정보 및 현장 사연 작성
                </span>
                <h2 className="text-2xl font-extrabold text-white">
                  [{selectedItem.name}] 지원 신청서
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  선택하신 물품의 단가는 개당 <strong className="text-purple-300">{selectedItem.unitPrice.toLocaleString()} PMC</strong>입니다.
                  인가 서류가 확인되면 시민 펀딩이 개설됩니다.
                </p>
              </div>

              {isSubmitDone ? (
                <div className="py-8 text-center space-y-4 bg-slate-950/60 rounded-2xl border border-slate-800">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 mx-auto flex items-center justify-center text-3xl">
                    ✓
                  </div>
                  <h3 className="text-2xl font-extrabold text-white">
                    [{selectedItem.name}] 신청이 정상 접수되었습니다!
                  </h3>
                  <p className="text-sm text-slate-300 max-w-md mx-auto leading-relaxed">
                    <strong>[{facilityName}]</strong>의 신청서가 안전하게 접수되었습니다.
                    PosMul 공익심사위가 고유번호증 및 인가를 확인한 후, 시민 크라우드펀딩에 정식 개설됩니다.
                  </p>
                  <div className="flex justify-center gap-3 pt-2">
                    <button
                      onClick={() => setActiveTab("feed")}
                      className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 font-bold text-sm text-white hover:from-purple-500"
                    >
                      전국 위시리스트 현황판 보기
                    </button>
                    <button
                      onClick={() => setIsSubmitDone(false)}
                      className="px-6 py-3 rounded-xl bg-slate-800 font-bold text-sm text-slate-300 hover:bg-slate-700"
                    >
                      추가 신청서 작성
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  {formError && (
                    <div className="p-3.5 rounded-xl bg-rose-950/70 border border-rose-500/40 text-xs text-rose-300">
                      ⚠️ {formError}
                    </div>
                  )}

                  {/* Selected Item Summary Card */}
                  <div className="p-4 rounded-2xl bg-slate-950 border border-purple-500/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl p-2 rounded-xl bg-slate-900 border border-slate-800">
                        {selectedItem.icon}
                      </span>
                      <div>
                        <span className="text-[11px] text-purple-400 font-bold block">
                          선택된 K-물품
                        </span>
                        <h4 className="font-extrabold text-base text-white">
                          {selectedItem.name}
                        </h4>
                        <span className="text-xs text-slate-400">
                          {selectedItem.manufacturer} · 개당 {selectedItem.unitPrice.toLocaleString()} PMC
                        </span>
                      </div>
                    </div>

                    <div className="text-right sm:border-l sm:border-slate-800 sm:pl-4">
                      <span className="text-[11px] text-slate-500 block">총 목표 모금액</span>
                      <span className="text-lg font-extrabold text-amber-300 tabular-nums">
                        {totalFundedTarget.toLocaleString()} PMC
                      </span>
                      <span className="text-[10px] text-slate-400 block">
                        ({neededQuantity}개 기준)
                      </span>
                    </div>
                  </div>

                  {/* Facility Info Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-400">시설 / 기관명 *</label>
                      <input
                        type="text"
                        placeholder="예: 햇살지역아동센터"
                        value={facilityName}
                        onChange={(e) => setFacilityName(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                        required
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-400">시설 유형 *</label>
                      <select
                        value={facilityType}
                        onChange={(e) => setFacilityType(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                      >
                        <option value="지역아동센터">지역아동센터</option>
                        <option value="아동양육시설(보육원)">아동양육시설 (보육원)</option>
                        <option value="노인복지관 및 쉼터">노인복지관 및 쉼터</option>
                        <option value="자립준비청년관">자립준비청년관</option>
                        <option value="영유아 일시보호소">영유아 일시보호소</option>
                        <option value="장애인 주간보호시설">장애인 주간보호시설</option>
                        <option value="다문화가족 지원센터">다문화가족 지원센터</option>
                        <option value="기타 비영리 복지시설">기타 비영리 복지시설</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-400">소재지 (시/도) *</label>
                      <select
                        value={regionCity}
                        onChange={(e) => setRegionCity(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                      >
                        {["서울", "경기", "인천", "부산", "대구", "대전", "광주", "울산", "강원", "충북", "충남", "전북", "전남", "경북", "경남", "제주"].map((city) => (
                          <option key={city} value={city}>{city}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-400">상세 시/군/구 *</label>
                      <input
                        type="text"
                        placeholder="예: 은평구 응암동"
                        value={regionDistrict}
                        onChange={(e) => setRegionDistrict(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                        required
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-400">담당자 성함 및 직책 *</label>
                      <input
                        type="text"
                        placeholder="예: 김영희 센터장"
                        value={contactPerson}
                        onChange={(e) => setContactPerson(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                        required
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-400">연락처 *</label>
                      <input
                        type="tel"
                        placeholder="예: 010-1234-5678"
                        value={contactPhone}
                        onChange={(e) => setContactPhone(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                        required
                      />
                    </div>
                  </div>

                  {/* License & Quantity Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-400">
                        고유번호증 / 시설 인가번호 (선택)
                      </label>
                      <input
                        type="text"
                        placeholder="예: 110-82-12345"
                        value={businessLicenseNumber}
                        onChange={(e) => setBusinessLicenseNumber(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-400">필요 수량 *</label>
                      <input
                        type="number"
                        min={1}
                        max={100}
                        value={neededQuantity}
                        onChange={(e) => setNeededQuantity(Number(e.target.value))}
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                        required
                      />
                    </div>
                  </div>

                  {/* Story Textarea */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                      <Heart className="w-4 h-4 text-rose-400" />
                      <span>현장의 절실한 사연 및 지원 필요성 *</span>
                    </label>
                    <textarea
                      rows={4}
                      placeholder="현재 시설의 노후 상황과 이 물품이 지원되었을 때 이용자들에게 일어날 변화를 구체적으로 적어주세요. (기부자들에게 공개되는 이야기입니다)"
                      value={story}
                      onChange={(e) => setStory(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-purple-500 leading-relaxed"
                      required
                    />
                  </div>

                  {/* Submit CTA */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-sm shadow-xl shadow-purple-600/30 transition-all flex items-center justify-center gap-2"
                    >
                      {isSubmitting ? "신청서 저장 중..." : `[${selectedItem.name}] 위시리스트 신청 완료하기 🎁`}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Feed */}
        {activeTab === "feed" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>
                현재 검증 완료되어 시민 펀딩 진행 중인 복지시설:{" "}
                <strong className="text-purple-300 font-bold">{approvedRequests.length}곳</strong>
              </span>
              <span>100% 모금 달성 시 제조사 본사에서 직배송 설치</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {approvedRequests.map((req) => {
                const targetAmount =
                  (req.project?.unit_price || 850000) * (req.needed_quantity || 1);
                const currentAmount = req.current_funded_amount || 0;
                const percent = Math.min(
                  100,
                  Math.round((currentAmount / targetAmount) * 100)
                );
                const isUrgent = percent >= 80 && percent < 100;
                const isCompleted = percent >= 100;

                return (
                  <div
                    key={req.id}
                    className="rounded-3xl bg-slate-900/70 border border-slate-800/90 hover:border-purple-500/40 p-6 flex flex-col justify-between space-y-4 shadow-xl transition-all group"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs px-2.5 py-1 rounded-full bg-slate-950 text-purple-300 border border-purple-500/30 font-semibold flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-purple-400" />
                          {req.region_city} {req.region_district}
                        </span>
                        {isUrgent && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center gap-1 animate-pulse">
                            <Flame className="w-3 h-3 text-rose-400" />
                            마감 임박
                          </span>
                        )}
                        {isCompleted && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            완판 완료
                          </span>
                        )}
                      </div>

                      <div>
                        <h3 className="font-extrabold text-lg text-white group-hover:text-purple-300 transition-colors">
                          {req.facility_name}
                        </h3>
                        <p className="text-xs text-slate-400">{req.facility_type}</p>
                      </div>

                      <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs space-y-1">
                        <span className="text-slate-500 block text-[11px]">신청 물품</span>
                        <div className="flex items-center justify-between font-bold text-slate-200">
                          <span>{req.project?.product_name || "지정 물품"}</span>
                          <span className="text-purple-300">{req.needed_quantity}개</span>
                        </div>
                        <span className="text-[10px] text-slate-400 block">
                          제조사: {req.project?.manufacturer}
                        </span>
                      </div>

                      <p className="text-xs text-slate-300 line-clamp-3 leading-relaxed">
                        "{req.story}"
                      </p>
                    </div>

                    <div className="space-y-3 pt-3 border-t border-slate-800">
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-baseline text-xs">
                          <span className="font-extrabold text-sm text-purple-300">
                            {percent}%
                          </span>
                          <span className="text-slate-400 text-[11px]">
                            {currentAmount.toLocaleString()} / {targetAmount.toLocaleString()} PMC
                          </span>
                        </div>
                        <div className="h-2 bg-slate-950 rounded-full overflow-hidden p-0.5">
                          <div
                            className={`h-full rounded-full transition-all ${
                              isCompleted
                                ? "bg-emerald-500"
                                : "bg-gradient-to-r from-purple-500 to-indigo-500"
                            }`}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>

                      <Link
                        href={`/donation/direct/item/${req.project_id || "4a56aa1a-b59e-47a2-a260-c6179519d7f5"}`}
                        className="w-full py-2.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/40 border border-purple-500/40 text-purple-200 text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                      >
                        <span>이 시설 물품 펀딩하러 가기</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 3: Admin */}
        {activeTab === "admin" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>
                현재 심사 대기 중인 신청서:{" "}
                <strong className="text-amber-300 font-bold">{pendingRequests.length}건</strong>
              </span>
              <span>관리자 또는 공익심사위 권한으로 즉시 펀딩 승인이 가능합니다.</span>
            </div>

            {pendingRequests.length === 0 ? (
              <div className="py-16 text-center space-y-3 bg-slate-900/40 rounded-3xl border border-slate-800">
                <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto opacity-70" />
                <p className="text-base font-bold text-slate-200">
                  모든 신청서가 심사 완료되었습니다!
                </p>
                <p className="text-xs text-slate-500">
                  새로운 위시리스트가 접수되면 이 화면에 실시간으로 표시됩니다.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingRequests.map((req) => (
                  <div
                    key={req.id}
                    className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-lg text-white">
                            {req.facility_name}
                          </span>
                          <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                            {req.facility_type}
                          </span>
                          <span className="text-xs text-slate-400">
                            {req.region_city} {req.region_district}
                          </span>
                        </div>
                        <div className="text-xs text-slate-400 mt-1 flex flex-wrap gap-4">
                          <span>담당자: <strong>{req.contact_person}</strong> ({req.contact_phone})</span>
                          <span>고유번호증: <strong>{req.business_license_number || "미기재"}</strong></span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleApprove(req.id, req.facility_name)}
                        disabled={processingId === req.id}
                        className="px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 shrink-0"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>{processingId === req.id ? "승인 처리 중..." : "✓ 서류 확인 및 펀딩 개설 승인"}</span>
                      </button>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800/80 text-xs flex justify-between items-center">
                      <span className="text-slate-400">
                        신청 물품: <strong className="text-white">{req.project?.product_name || "지정 물품"}</strong> ({req.project?.manufacturer})
                      </span>
                      <span className="text-purple-300 font-bold">
                        신청 수량: {req.needed_quantity}개
                      </span>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 text-xs text-slate-300 leading-relaxed">
                      <span className="text-slate-500 font-bold block mb-1">현장 사연:</span>
                      "{req.story}"
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
