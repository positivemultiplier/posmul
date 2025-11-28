"use client";

/**
 * MoneyConsume Page
 *
 * 지역 소비를 통한 PMC 획득 페이지
 * - 지역 소상공인 매장
 * - QR 결제 연동
 * - 결제액의 1% PMC 적립
 *
 * @since 2025-11
 */
import Link from "next/link";
import { useState } from "react";
import {
  useLocalStores,
  usePaymentHistory,
  usePayment,
  type LocalStore,
} from "@/bounded-contexts/consume/presentation/hooks/use-money-consume";

// 카테고리 아이콘 매핑
const categoryIcons: Record<string, string> = {
  "전체": "🏪",
  "식품": "🍱",
  "카페": "☕",
  "베이커리": "🥐",
  "의류": "👕",
  "건강": "💊",
  "생활": "🛒",
  "운동": "🏋️",
  "문구": "📚",
  "미용": "💇",
};

// 카테고리별 기본 이미지
const getCategoryIcon = (category: string): string => {
  return categoryIcons[category] ?? "🏪";
};

export default function MoneyConsumePage() {
  // API hooks
  const { stores, categories, total, loading, error, filters, filterByCategory } = useLocalStores();
  const { totalPmcEarned } = usePaymentHistory({ limit: 100 });
  const { processPayment, loading: paymentLoading, result: paymentResult, reset: resetPayment } = usePayment();

  // UI State
  const [selectedStore, setSelectedStore] = useState<LocalStore | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  // 결제 처리
  const handlePayment = async () => {
    if (!selectedStore || !paymentAmount) return;
    
    try {
      await processPayment(selectedStore.id, Number(paymentAmount), "CARD");
      setPaymentSuccess(true);
      setPaymentAmount("");
    } catch {
      // Error handled by hook
    }
  };

  // 모달 닫기
  const closeModal = () => {
    setShowPaymentModal(false);
    setSelectedStore(null);
    setPaymentAmount("");
    setPaymentSuccess(false);
    resetPayment();
  };

  // 모든 카테고리 목록 생성 (전체 포함)
  const allCategories = ["전체", ...categories];

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">⚠️</div>
          <div className="text-red-600">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/consume"
            className="text-sm text-gray-500 hover:text-gray-700 mb-2 inline-block"
          >
            ← Consume
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">💳 MoneyConsume</h1>
          <p className="text-gray-600 mt-2">
            지역 매장에서 소비하고 PMC를 획득하세요
          </p>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-500">총 획득 PMC</div>
          <div className="text-2xl font-bold text-blue-600">
            +{totalPmcEarned.toLocaleString()} PMC
          </div>
        </div>
      </div>

      {/* PMC Info Banner */}
      <div className="bg-gradient-to-r from-blue-500 to-cyan-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold mb-2">
              💰 PMC는 바로 Donation에 사용 가능합니다
            </h2>
            <p className="text-blue-100 text-sm">
              MoneyConsume으로 획득한 PMC는 Expect 없이 바로 Donation이 가능합니다.
              <br />
              지역 경제를 살리고, 사회적 가치도 창출하세요!
            </p>
          </div>
          <Link
            href="/donation"
            className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors flex-shrink-0"
          >
            기부하러 가기 →
          </Link>
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex gap-3 overflow-x-auto pb-2">
        {allCategories.map((cat) => (
          <button
            key={cat}
            onClick={() => filterByCategory(cat === "전체" ? undefined : cat)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-colors ${
              (cat === "전체" && !filters.category) || filters.category === cat
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            <span>{getCategoryIcon(cat)}</span>
            <span className="font-medium">{cat}</span>
          </button>
        ))}
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <>
          {/* Store Grid */}
          <div>
            <h2 className="text-xl font-semibold mb-4">
              🏪 제휴 매장 <span className="text-gray-500 text-sm font-normal">({total}개)</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {stores.map((store) => (
                <div
                  key={store.id}
                  onClick={() => {
                    setSelectedStore(store);
                    setShowPaymentModal(true);
                  }}
                  className="bg-white rounded-xl border p-6 hover:shadow-lg transition-shadow cursor-pointer"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center text-3xl">
                      {getCategoryIcon(store.category)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900">{store.name}</h3>
                        {store.isVerified && (
                          <span className="text-blue-500" title="인증 매장">✓</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">
                          {store.category}
                        </span>
                        <span className="text-xs text-gray-500">
                          📍 {store.address}
                        </span>
                      </div>
                      {store.phone && (
                        <div className="text-xs text-gray-400 mt-1">
                          📞 {store.phone}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t flex items-center justify-between">
                    <div>
                      <div className="text-xs text-gray-500">PMC 적립률</div>
                      <div className="text-lg font-bold text-blue-600">
                        {(store.pmcRate * 100).toFixed(1)}%
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-gray-500">누적 PMC 발행</div>
                      <div className="text-sm font-medium text-gray-700">
                        {store.totalPmcIssued.toLocaleString()} PMC
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {stores.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <div className="text-4xl mb-4">🏪</div>
                <p>등록된 매장이 없습니다.</p>
              </div>
            )}
          </div>
        </>
      )}

      {/* How to Use */}
      <div className="bg-gray-50 rounded-xl p-6">
        <h3 className="font-semibold mb-4">📱 사용 방법</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg p-4 text-center">
            <div className="text-3xl mb-2">1️⃣</div>
            <div className="font-medium mb-1">매장 방문</div>
            <div className="text-xs text-gray-500">제휴 매장 검색 및 방문</div>
          </div>
          <div className="bg-white rounded-lg p-4 text-center">
            <div className="text-3xl mb-2">2️⃣</div>
            <div className="font-medium mb-1">QR 스캔</div>
            <div className="text-xs text-gray-500">PosMul 앱으로 QR 스캔</div>
          </div>
          <div className="bg-white rounded-lg p-4 text-center">
            <div className="text-3xl mb-2">3️⃣</div>
            <div className="font-medium mb-1">결제 완료</div>
            <div className="text-xs text-gray-500">일반 결제 수단으로 결제</div>
          </div>
          <div className="bg-white rounded-lg p-4 text-center">
            <div className="text-3xl mb-2">4️⃣</div>
            <div className="font-medium mb-1">PMC 적립</div>
            <div className="text-xs text-gray-500">결제액 1%~2% PMC 적립</div>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && selectedStore && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
            {paymentSuccess && paymentResult ? (
              // 결제 성공 화면
              <div className="text-center py-6">
                <div className="text-6xl mb-4">🎉</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">결제 완료!</h3>
                <p className="text-gray-600 mb-4">
                  {paymentResult.storeName}에서 결제가 완료되었습니다.
                </p>
                <div className="bg-blue-50 rounded-xl p-4 mb-6">
                  <div className="text-sm text-gray-600 mb-1">획득한 PMC</div>
                  <div className="text-3xl font-bold text-blue-600">
                    +{paymentResult.pmcEarned.toLocaleString()} PMC
                  </div>
                  <div className="text-xs text-gray-500 mt-2">
                    결제액: {paymentResult.paymentAmount.toLocaleString()}원
                  </div>
                </div>
                <button
                  onClick={closeModal}
                  className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
                >
                  확인
                </button>
              </div>
            ) : (
              // 결제 입력 화면
              <>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold">💳 결제하기</h3>
                  <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                    ✕
                  </button>
                </div>

                <div className="bg-gray-50 rounded-xl p-4 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center text-2xl">
                      {getCategoryIcon(selectedStore.category)}
                    </div>
                    <div>
                      <div className="font-semibold">{selectedStore.name}</div>
                      <div className="text-sm text-gray-500">{selectedStore.category}</div>
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    결제 금액
                  </label>
                  <input
                    type="number"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    placeholder="결제 금액을 입력하세요"
                    className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {paymentAmount && (
                  <div className="bg-blue-50 rounded-lg p-3 mb-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">예상 PMC 적립</span>
                      <span className="font-bold text-blue-600">
                        +{Math.floor(Number(paymentAmount) * selectedStore.pmcRate).toLocaleString()} PMC
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      적립률: {(selectedStore.pmcRate * 100).toFixed(1)}%
                    </div>
                  </div>
                )}

                <button
                  onClick={handlePayment}
                  disabled={!paymentAmount || paymentLoading}
                  className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {paymentLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="animate-spin">⏳</span> 처리 중...
                    </span>
                  ) : (
                    "결제하기"
                  )}
                </button>

                <p className="text-xs text-gray-500 text-center mt-4">
                  💡 실제 서비스에서는 QR 스캔으로 결제가 진행됩니다
                </p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
