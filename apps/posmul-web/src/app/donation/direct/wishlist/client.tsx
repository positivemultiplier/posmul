"use client";

import { useState } from "react";
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

const AVAILABLE_PROJECTS = [
  {
    id: "4a56aa1a-b59e-47a2-a260-c6179519d7f5",
    name: "LG 휘센 벽걸이 고효율 에어컨",
    manufacturer: "LG Electronics (World No.1)",
    category: "가전",
    unitPrice: 850000,
  },
  {
    id: "6daddc20-92cc-4f09-94d2-3b6d3d4f1991",
    name: "키즈 웜 패딩부츠 & 튼튼 운동화",
    manufacturer: "부산 A제화 (Made in Korea 👟)",
    category: "의류/신발",
    unitPrice: 35000,
  },
  {
    id: "edeb5889-f979-4f63-a9d9-56fa0529f1e0",
    name: "철원 오대쌀 햅쌀 10kg",
    manufacturer: "철원영농조합 (Made in Korea 🌾)",
    category: "식품",
    unitPrice: 42000,
  },
  {
    id: "d69fd152-5416-478a-9112-4c9a99fa15a3",
    name: "Samsung Bubble Wash AI 세탁기",
    manufacturer: "Samsung Electronics",
    category: "가전",
    unitPrice: 750000,
  },
  {
    id: "6ac58185-082d-43b3-b9cb-b31d4f15d6f6",
    name: "교육용 Galaxy Tab S9 FE 태블릿",
    manufacturer: "Samsung Electronics",
    category: "디지털",
    unitPrice: 450000,
  },
];

export function WishlistPageClient({
  initialRequests,
  isLoggedIn,
  currentUserId,
}: WishlistPageClientProps) {
  const [activeTab, setActiveTab] = useState<"form" | "feed" | "admin">("feed");
  const [requests, setRequests] = useState<any[]>(initialRequests);

  // 폼 상태
  const [projectId, setProjectId] = useState<string>(AVAILABLE_PROJECTS[0].id);
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

  const approvedRequests = requests.filter((r) => r.status === "approved");
  const pendingRequests = requests.filter((r) => r.status === "pending");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!facilityName.trim() || !contactPerson.trim() || !contactPhone.trim() || !story.trim()) {
      setFormError("필수 항목(시설명, 담당자, 연락처, 사연)을 모두 작성해주세요.");
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    const submission: WishlistSubmissionData = {
      projectId,
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
          project: AVAILABLE_PROJECTS.find((p) => p.id === projectId),
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
      {/* Top Header */}
      <div className="border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link
            href="/donation/direct"
            className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>K-물품 직접기부 허브로</span>
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
            <span>수요자 중심 원조 연계(Tied Aid) 플랫폼</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            전국 복지시설 K-위시리스트 (Wishlist) 포털
          </h1>
          <p className="text-sm sm:text-base text-slate-400 max-w-2xl leading-relaxed">
            전국의 아동센터·보육원·노인복지관이 필요한 국산 실물 물품을 직접 신청하고,
            PosMul 공익검증단이 서류를 확인하여 시민 펀딩을 개설합니다.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 gap-2 sm:gap-4 text-sm font-bold">
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
            onClick={() => {
              setActiveTab("form");
              setIsSubmitDone(false);
            }}
            className={`pb-3.5 px-3 border-b-2 transition-all flex items-center gap-2 ${
              activeTab === "form"
                ? "border-purple-500 text-purple-300"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <PlusCircle className="w-4 h-4" />
            <span>우리 시설 물품 신청하기</span>
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

        {/* Tab 1: Nationwide Wishlist Feed */}
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

                      {/* Item Badge */}
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

                      {/* Story */}
                      <p className="text-xs text-slate-300 line-clamp-3 leading-relaxed">
                        "{req.story}"
                      </p>
                    </div>

                    {/* Progress & Action */}
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

        {/* Tab 2: Wishlist Application Form */}
        {activeTab === "form" && (
          <div className="max-w-3xl mx-auto rounded-3xl bg-slate-900/80 border border-slate-800 p-6 sm:p-10 shadow-2xl">
            {isSubmitDone ? (
              <div className="py-10 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 mx-auto flex items-center justify-center text-3xl">
                  ✓
                </div>
                <h3 className="text-2xl font-extrabold text-white">
                  물품 지원 신청(Wishlist)이 정상 접수되었습니다!
                </h3>
                <p className="text-sm text-slate-300 max-w-md mx-auto leading-relaxed">
                  <strong>[{facilityName}]</strong>의 신청서가 안전하게 저장되었습니다.
                  PosMul 공익심사위가 고유번호증 및 복지시설 인가를 확인(통상 24시간 이내)한 후,
                  시민 펀딩 목록에 정식 등록됩니다.
                </p>
                <div className="flex justify-center gap-3 pt-3">
                  <button
                    onClick={() => setActiveTab("feed")}
                    className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 font-bold text-sm text-white hover:from-purple-500"
                  >
                    위시리스트 현황판 보러가기
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
                <div className="space-y-1">
                  <span className="text-xs font-bold text-purple-400 uppercase tracking-wider">
                    Official Wishlist Registration
                  </span>
                  <h2 className="text-2xl font-extrabold text-white">
                    복지시설 K-물품 지원 신청서
                  </h2>
                  <p className="text-xs text-slate-400">
                    인가된 사회복지시설 및 비영리단체만 신청 가능하며, 서류 확인 후 시민 크라우드펀딩이 개설됩니다.
                  </p>
                </div>

                {formError && (
                  <div className="p-3.5 rounded-xl bg-rose-950/70 border border-rose-500/40 text-xs text-rose-300">
                    ⚠️ {formError}
                  </div>
                )}

                {/* 1. 희망 물품 선택 */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <Package className="w-4 h-4 text-purple-400" />
                    <span>지원 희망 물품 선택 *</span>
                  </label>
                  <select
                    value={projectId}
                    onChange={(e) => setProjectId(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                  >
                    {AVAILABLE_PROJECTS.map((item) => (
                      <option key={item.id} value={item.id}>
                        [{item.category}] {item.name} - {item.manufacturer} (개당 {item.unitPrice.toLocaleString()} PMC)
                      </option>
                    ))}
                  </select>
                </div>

                {/* 2. 시설 정보 */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-400">시설 / 단체명 *</label>
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

                {/* 3. 고유번호증 및 수량 */}
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

                {/* 4. 사연 */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <Heart className="w-4 h-4 text-rose-400" />
                    <span>현장의 절실한 사연 및 지원 필요성 *</span>
                  </label>
                  <textarea
                    rows={4}
                    placeholder="현재 시설의 노후 상황과 이 물품이 지원되었을 때 이용자들에게 일어날 변화를 구체적으로 적어주세요."
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
                    {isSubmitting ? "신청서 저장 중..." : "위시리스트 물품 신청 완료하기 🎁"}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* Tab 3: Admin Verification Gate */}
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
