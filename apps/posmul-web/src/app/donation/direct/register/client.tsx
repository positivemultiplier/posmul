"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

// ===== 타입 정의 =====
interface FormData {
  title: string;
  description: string;
  category: string;
  condition: string;
  quantity: number;
  estimatedValue: number;
  pickupLocation: string;
  pickupAvailableTimes: string;
}

interface ItemRegisterClientProps {
  userId: string;
}

// ===== 카테고리/상태 옵션 =====
const categories = [
  { value: "clothing", label: "의류", icon: "" },
  { value: "food", label: "식품", icon: "" },
  { value: "housing", label: "주거용품", icon: "" },
  { value: "medical", label: "의료용품", icon: "" },
  { value: "education", label: "교육용품", icon: "" },
];

const conditions = [
  { value: "new", label: "새것", description: "포장 미개봉 또는 사용 흔적 없음" },
  { value: "like_new", label: "거의 새것", description: "1-2회 사용, 새것과 거의 동일" },
  { value: "good", label: "양호", description: "사용감은 있으나 상태 양호" },
  { value: "fair", label: "사용감 있음", description: "사용감 있으나 기능에 문제 없음" },
];

// ===== 메인 컴포넌트 =====
export function ItemRegisterClient({ userId }: ItemRegisterClientProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(1);

  const [formData, setFormData] = useState<FormData>({
    title: "",
    description: "",
    category: "",
    condition: "",
    quantity: 1,
    estimatedValue: 0,
    pickupLocation: "",
    pickupAvailableTimes: "",
  });

  // 폼 업데이트
  const updateForm = (field: keyof FormData, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Step 1 유효성 검사
  const isStep1Valid = formData.category !== "" && formData.condition !== "";

  // Step 2 유효성 검사
  const isStep2Valid =
    formData.title.trim() !== "" &&
    formData.description.trim() !== "" &&
    formData.quantity >= 1;

  // Step 3 유효성 검사
  const isStep3Valid = formData.pickupLocation.trim() !== "";

  // 제출 처리
  const handleSubmit = async () => {
    if (!isStep3Valid) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/donation/direct/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          donorUserId: userId,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "물품 등록에 실패했습니다.");
      }

      // 성공 시 목록 페이지로 이동
      router.push("/donation/direct?registered=true");
    } catch (err) {
      setError(err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* 헤더 */}
      <div className="bg-gradient-to-r from-orange-500 to-amber-600 text-white py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <Link
            href="/donation/direct"
            className="inline-flex items-center text-white/80 hover:text-white mb-4"
          >
            ← 돌아가기
          </Link>
          <h1 className="text-3xl font-bold">물품 등록</h1>
          <p className="text-white/90 mt-2">
            기부하실 물품 정보를 입력해주세요
          </p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* 진행 표시기 */}
        <StepIndicator currentStep={currentStep} />

        {/* 에러 메시지 */}
        {error && (
          <div className="mb-6 p-4 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-xl text-red-700 dark:text-red-300">
            {error}
          </div>
        )}

        {/* Step 1: 카테고리 & 상태 */}
        {currentStep === 1 && (
          <Step1CategoryCondition
            formData={formData}
            updateForm={updateForm}
            onNext={() => setCurrentStep(2)}
            isValid={isStep1Valid}
          />
        )}

        {/* Step 2: 물품 정보 */}
        {currentStep === 2 && (
          <Step2ItemInfo
            formData={formData}
            updateForm={updateForm}
            onPrev={() => setCurrentStep(1)}
            onNext={() => setCurrentStep(3)}
            isValid={isStep2Valid}
          />
        )}

        {/* Step 3: 수령 정보 & 확인 */}
        {currentStep === 3 && (
          <Step3PickupConfirm
            formData={formData}
            updateForm={updateForm}
            onPrev={() => setCurrentStep(2)}
            onSubmit={handleSubmit}
            isValid={isStep3Valid}
            isSubmitting={isSubmitting}
          />
        )}
      </div>
    </div>
  );
}

// ===== 진행 표시기 =====
function StepIndicator({ currentStep }: { currentStep: number }) {
  const steps = [
    { num: 1, label: "분류" },
    { num: 2, label: "정보" },
    { num: 3, label: "확인" },
  ];

  return (
    <div className="flex items-center justify-center mb-8">
      {steps.map((step, idx) => (
        <div key={step.num} className="flex items-center">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
              currentStep >= step.num
                ? "bg-orange-500 text-white"
                : "bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
            }`}
          >
            {step.num}
          </div>
          <span
            className={`ml-2 text-sm ${
              currentStep >= step.num
                ? "text-orange-600 dark:text-orange-400 font-semibold"
                : "text-gray-500 dark:text-gray-400"
            }`}
          >
            {step.label}
          </span>
          {idx < steps.length - 1 && (
            <div
              className={`w-12 h-1 mx-3 ${
                currentStep > step.num
                  ? "bg-orange-500"
                  : "bg-gray-200 dark:bg-gray-700"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}

// ===== Step 1: 카테고리 & 상태 =====
function Step1CategoryCondition({
  formData,
  updateForm,
  onNext,
  isValid,
}: {
  formData: FormData;
  updateForm: (field: keyof FormData, value: string | number) => void;
  onNext: () => void;
  isValid: boolean;
}) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
        물품 분류
      </h2>

      {/* 카테고리 선택 */}
      <div className="mb-6">
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
          카테고리 *
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {categories.map((cat) => (
            <button
              key={cat.value}
              type="button"
              onClick={() => updateForm("category", cat.value)}
              className={`p-4 rounded-xl border-2 transition-all text-center ${
                formData.category === cat.value
                  ? "border-orange-500 bg-orange-50 dark:bg-orange-900/20"
                  : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
              }`}
            >
              <span className="text-2xl block mb-1">{cat.icon}</span>
              <span
                className={`text-sm font-medium ${
                  formData.category === cat.value
                    ? "text-orange-600 dark:text-orange-400"
                    : "text-gray-700 dark:text-gray-300"
                }`}
              >
                {cat.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* 상태 선택 */}
      <div className="mb-6">
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
          물품 상태 *
        </label>
        <div className="space-y-3">
          {conditions.map((cond) => (
            <button
              key={cond.value}
              type="button"
              onClick={() => updateForm("condition", cond.value)}
              className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                formData.condition === cond.value
                  ? "border-orange-500 bg-orange-50 dark:bg-orange-900/20"
                  : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
              }`}
            >
              <div
                className={`font-semibold ${
                  formData.condition === cond.value
                    ? "text-orange-600 dark:text-orange-400"
                    : "text-gray-900 dark:text-white"
                }`}
              >
                {cond.label}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {cond.description}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 다음 버튼 */}
      <button
        type="button"
        onClick={onNext}
        disabled={!isValid}
        className={`w-full py-3 px-4 rounded-xl font-semibold transition-colors ${
          isValid
            ? "bg-orange-500 text-white hover:bg-orange-600"
            : "bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed"
        }`}
      >
        다음 단계 →
      </button>
    </div>
  );
}

// ===== Step 2: 물품 정보 =====
function Step2ItemInfo({
  formData,
  updateForm,
  onPrev,
  onNext,
  isValid,
}: {
  formData: FormData;
  updateForm: (field: keyof FormData, value: string | number) => void;
  onPrev: () => void;
  onNext: () => void;
  isValid: boolean;
}) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
        물품 정보
      </h2>

      {/* 제목 */}
      <div className="mb-4">
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          물품명 *
        </label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => updateForm("title", e.target.value)}
          placeholder="예: 겨울 패딩 점퍼"
          className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          maxLength={100}
        />
      </div>

      {/* 설명 */}
      <div className="mb-4">
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          상세 설명 *
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => updateForm("description", e.target.value)}
          placeholder="물품에 대한 상세한 설명을 작성해주세요. (사이즈, 색상, 구매 시기 등)"
          rows={4}
          className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
          maxLength={500}
        />
        <div className="text-right text-xs text-gray-500 dark:text-gray-400 mt-1">
          {formData.description.length}/500
        </div>
      </div>

      {/* 수량 */}
      <div className="mb-4">
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          수량 *
        </label>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() =>
              updateForm("quantity", Math.max(1, formData.quantity - 1))
            }
            className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 font-bold"
          >
            -
          </button>
          <input
            type="number"
            value={formData.quantity}
            onChange={(e) =>
              updateForm("quantity", Math.max(1, parseInt(e.target.value) || 1))
            }
            min={1}
            className="w-20 text-center px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
          />
          <button
            type="button"
            onClick={() => updateForm("quantity", formData.quantity + 1)}
            className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 font-bold"
          >
            +
          </button>
        </div>
      </div>

      {/* 예상 가치 (선택) */}
      <div className="mb-6">
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          예상 가치 (선택)
        </label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={formData.estimatedValue || ""}
            onChange={(e) =>
              updateForm("estimatedValue", parseInt(e.target.value) || 0)
            }
            placeholder="0"
            className="flex-1 px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />
          <span className="text-gray-500 dark:text-gray-400">원</span>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          대략적인 시장 가치를 입력해주세요 (기부 증명서에 활용)
        </p>
      </div>

      {/* 버튼 */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onPrev}
          className="flex-1 py-3 px-4 rounded-xl font-semibold bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
        >
          ← 이전
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={!isValid}
          className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-colors ${
            isValid
              ? "bg-orange-500 text-white hover:bg-orange-600"
              : "bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed"
          }`}
        >
          다음 단계 →
        </button>
      </div>
    </div>
  );
}

// ===== Step 3: 수령 정보 & 확인 =====
function Step3PickupConfirm({
  formData,
  updateForm,
  onPrev,
  onSubmit,
  isValid,
  isSubmitting,
}: {
  formData: FormData;
  updateForm: (field: keyof FormData, value: string | number) => void;
  onPrev: () => void;
  onSubmit: () => void;
  isValid: boolean;
  isSubmitting: boolean;
}) {
  const selectedCategory = categories.find((c) => c.value === formData.category);
  const selectedCondition = conditions.find((c) => c.value === formData.condition);

  return (
    <div className="space-y-6">
      {/* 수령 정보 */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
          수령 정보
        </h2>

        {/* 수령 위치 */}
        <div className="mb-4">
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            수령 위치 *
          </label>
          <input
            type="text"
            value={formData.pickupLocation}
            onChange={(e) => updateForm("pickupLocation", e.target.value)}
            placeholder="예: 서울시 강남구 역삼동"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />
        </div>

        {/* 수령 가능 시간 (선택) */}
        <div className="mb-4">
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            수령 가능 시간 (선택)
          </label>
          <input
            type="text"
            value={formData.pickupAvailableTimes}
            onChange={(e) => updateForm("pickupAvailableTimes", e.target.value)}
            placeholder="예: 평일 오후 6시 이후, 주말 종일 가능"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* 등록 정보 요약 */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          등록 정보 확인
        </h2>

        <div className="space-y-3 text-sm">
          <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
            <span className="text-gray-500 dark:text-gray-400">카테고리</span>
            <span className="font-semibold text-gray-900 dark:text-white">
              {selectedCategory?.icon} {selectedCategory?.label}
            </span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
            <span className="text-gray-500 dark:text-gray-400">물품 상태</span>
            <span className="font-semibold text-gray-900 dark:text-white">
              {selectedCondition?.label}
            </span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
            <span className="text-gray-500 dark:text-gray-400">물품명</span>
            <span className="font-semibold text-gray-900 dark:text-white">
              {formData.title}
            </span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
            <span className="text-gray-500 dark:text-gray-400">수량</span>
            <span className="font-semibold text-gray-900 dark:text-white">
              {formData.quantity}개
            </span>
          </div>
          {formData.estimatedValue > 0 && (
            <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
              <span className="text-gray-500 dark:text-gray-400">예상 가치</span>
              <span className="font-semibold text-orange-600 dark:text-orange-400">
                약 {formData.estimatedValue.toLocaleString()}원
              </span>
            </div>
          )}
          <div className="flex justify-between py-2">
            <span className="text-gray-500 dark:text-gray-400">수령 위치</span>
            <span className="font-semibold text-gray-900 dark:text-white">
              {formData.pickupLocation}
            </span>
          </div>
        </div>
      </div>

      {/* 버튼 */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onPrev}
          disabled={isSubmitting}
          className="flex-1 py-3 px-4 rounded-xl font-semibold bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
        >
          ← 이전
        </button>
        <button
          type="button"
          onClick={onSubmit}
          disabled={!isValid || isSubmitting}
          className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-colors ${
            isValid && !isSubmitting
              ? "bg-orange-500 text-white hover:bg-orange-600"
              : "bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed"
          }`}
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center gap-2">
              <span className="animate-spin"></span> 등록 중...
            </span>
          ) : (
            "물품 등록하기 ✓"
          )}
        </button>
      </div>
    </div>
  );
}
