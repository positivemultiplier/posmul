"use client";

import { useState } from "react";
import { X, Building2, Package, CheckCircle2, ShieldCheck, Heart, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { submitWishlistRequest, type WishlistSubmissionData } from "../wishlist.actions";

interface WishlistRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultProjectId?: string;
  defaultProductName?: string;
  defaultManufacturer?: string;
  onSubmitted?: () => void;
}

const AVAILABLE_PROJECTS = [
  {
    id: "4a56aa1a-b59e-47a2-a260-c6179519d7f5",
    name: "LG 휘센 벽걸이 고효율 에어컨",
    manufacturer: "LG Electronics (World No.1)",
    category: "가전",
  },
  {
    id: "6daddc20-92cc-4f09-94d2-3b6d3d4f1991",
    name: "키즈 웜 패딩부츠 & 튼튼 운동화",
    manufacturer: "부산 A제화 (Made in Korea 👟)",
    category: "의류/신발",
  },
  {
    id: "edeb5889-f979-4f63-a9d9-56fa0529f1e0",
    name: "철원 오대쌀 햅쌀 10kg",
    manufacturer: "철원영농조합 (Made in Korea 🌾)",
    category: "식품",
  },
  {
    id: "d69fd152-5416-478a-9112-4c9a99fa15a3",
    name: "Samsung Bubble Wash AI 세탁기",
    manufacturer: "Samsung Electronics",
    category: "가전",
  },
  {
    id: "6ac58185-082d-43b3-b9cb-b31d4f15d6f6",
    name: "교육용 Galaxy Tab S9 FE 태블릿",
    manufacturer: "Samsung Electronics",
    category: "디지털",
  },
];

export function WishlistRequestModal({
  isOpen,
  onClose,
  defaultProjectId,
  defaultProductName,
  defaultManufacturer,
  onSubmitted,
}: WishlistRequestModalProps) {
  const [projectId, setProjectId] = useState<string>(
    defaultProjectId || AVAILABLE_PROJECTS[0].id
  );
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
  const [isDone, setIsDone] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!facilityName.trim() || !contactPerson.trim() || !contactPhone.trim() || !story.trim()) {
      setErrorMessage("필수 항목(시설명, 담당자, 연락처, 사연)을 모두 작성해주세요.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

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
    if (res.success) {
      setIsDone(true);
      if (onSubmitted) onSubmitted();
    } else {
      setErrorMessage(res.error || "신청 등록 중 문제가 발생했습니다.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="max-w-2xl w-full rounded-3xl bg-slate-900 border border-purple-500/40 p-6 sm:p-8 text-slate-100 shadow-2xl relative max-h-[90vh] overflow-y-auto no-scrollbar"
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center"
        >
          <X className="w-4 h-4" />
        </button>

        {isDone ? (
          <div className="py-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 mx-auto flex items-center justify-center text-3xl">
              ✓
            </div>
            <h3 className="text-2xl font-extrabold text-white">
              물품 지원 신청(Wishlist)이 접수되었습니다!
            </h3>
            <p className="text-sm text-slate-300 max-w-md mx-auto leading-relaxed">
              <strong>[{facilityName}]</strong>의 신청서가 안전하게 접수되었습니다. PosMul 공익검증단이 고유번호증 및 현장 유효성을 확인(통상 24시간 이내)한 후, 시민 크라우드펀딩 목록에 정식 등록됩니다.
            </p>
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-400 max-w-md mx-auto">
              💡 100% 모금 달성 시, 제조사 본사에서 시설 주소지로 직배송 설치가 진행됩니다.
            </div>
            <button
              onClick={onClose}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 font-bold text-sm text-white hover:from-purple-500"
            >
              닫기 및 확인
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-purple-400 flex items-center gap-1.5 mb-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                복지시설·공익기관 전용 Wishlist 신청 창구
              </span>
              <h2 className="text-xl sm:text-2xl font-extrabold text-white">
                우리 시설에 필요한 K-물품을 신청하세요
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                검증 완료 시 시민들의 소액 PMC 펀딩이 개설되고, 100% 달성 시 제조사에서 새 제품을 직배송해드립니다.
              </p>
            </div>

            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-950/70 border border-rose-500/40 text-xs text-rose-300">
                ⚠️ {errorMessage}
              </div>
            )}

            {/* 1. 희망 물품 선택 */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5 text-purple-400" />
                <span>지원 희망 물품 선택</span>
              </label>
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
              >
                {AVAILABLE_PROJECTS.map((item) => (
                  <option key={item.id} value={item.id}>
                    [{item.category}] {item.name} - {item.manufacturer}
                  </option>
                ))}
              </select>
            </div>

            {/* 2. 시설 기본 정보 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400">시설 / 기관명 *</label>
                <input
                  type="text"
                  placeholder="예: 햇살지역아동센터"
                  value={facilityName}
                  onChange={(e) => setFacilityName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400">시설 유형</label>
                <select
                  value={facilityType}
                  onChange={(e) => setFacilityType(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                >
                  <option value="지역아동센터">지역아동센터</option>
                  <option value="아동양육시설(보육원)">아동양육시설 (보육원)</option>
                  <option value="노인복지관 및 쉼터">노인복지관 및 쉼터</option>
                  <option value="자립준비청년관">자립준비청년관</option>
                  <option value="영유아 일시보호소">영유아 일시보호소</option>
                  <option value="장애인 주간보호시설">장애인 주간보호시설</option>
                  <option value="다문화가족 지원센터">다문화가족 지원센터</option>
                  <option value="기타 공익복지시설">기타 공익복지시설</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400">소재지 (시/도)</label>
                <select
                  value={regionCity}
                  onChange={(e) => setRegionCity(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                >
                  {["서울", "경기", "인천", "부산", "대구", "대전", "광주", "울산", "강원", "충북", "충남", "전북", "전남", "경북", "경남", "제주"].map((city) => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400">상세 시/군/구</label>
                <input
                  type="text"
                  placeholder="예: 은평구 응암동"
                  value={regionDistrict}
                  onChange={(e) => setRegionDistrict(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400">담당자 성함 및 직책 *</label>
                <input
                  type="text"
                  placeholder="예: 김영희 센터장"
                  value={contactPerson}
                  onChange={(e) => setContactPerson(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400">연락처 *</label>
                <input
                  type="tel"
                  placeholder="예: 010-1234-5678"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                  required
                />
              </div>
            </div>

            {/* 3. 고유번호증 및 필요 수량 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400">
                  고유번호증 / 시설 인가번호 (선택)
                </label>
                <input
                  type="text"
                  placeholder="예: 110-82-12345"
                  value={businessLicenseNumber}
                  onChange={(e) => setBusinessLicenseNumber(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400">필요 수량</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={neededQuantity}
                    onChange={(e) => setNeededQuantity(Number(e.target.value))}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                  />
                  <span className="text-xs text-slate-400 whitespace-nowrap">개 (켤레/포)</span>
                </div>
              </div>
            </div>

            {/* 4. 현장 사연 */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Heart className="w-3.5 h-3.5 text-rose-400" />
                <span>현장의 절실한 사연 (기부자에게 전달되는 이야기) *</span>
              </label>
              <textarea
                rows={3}
                placeholder="현재 시설의 상황과 이 물품이 왜 절실한지 적어주세요. (예: 15년 된 에어컨이 고장 나 공부방 아이들이 찜통더위 속에 있습니다...)"
                value={story}
                onChange={(e) => setStory(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-purple-500 leading-relaxed"
                required
              />
            </div>

            {/* 5. 안내 및 버튼 */}
            <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center gap-2.5 text-xs text-slate-400">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                허위 신청 방지를 위해 관리자 서류 확인 후 펀딩이 개설되며, 배송 시 현장 인증 사진이 필수입니다.
              </span>
            </div>

            <div className="flex gap-2.5 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="w-1/3 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-2/3 py-3 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-sm shadow-lg shadow-purple-600/30 transition-all flex items-center justify-center gap-2"
              >
                {isSubmitting ? "신청 등록 중..." : "위시리스트 물품 신청하기 🎁"}
              </button>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  );
}

